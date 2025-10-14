from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import requests
import uuid
import os
from datetime import datetime
from nlp_processor import NLPProcessor


app = Flask(__name__)
# Configure a single allowed CORS origin from environment variable CORS_ORIGIN.
# If not set, fall back to CORS_ORIGINS (comma-separated) for compatibility, else allow '*'.
single_origin = os.environ.get('CORS_ORIGIN')
if not single_origin:
    cors_origins = os.environ.get('CORS_ORIGINS', '*')
    # pick the first origin from the list if multiple provided
    if isinstance(cors_origins, str):
        cors_list = [o.strip() for o in cors_origins.split(',') if o.strip()]
        single_origin = cors_list[0] if cors_list else '*'

# Warn if CORS is open to any origin (print for early visibility)
if single_origin == '*' or not single_origin:
    print('WARNING: CORS is configured to allow all origins. Set CORS_ORIGIN in production to restrict allowed origins.')

# Apply CORS with the single origin
CORS(app, resources={r"/*": {"origins": single_origin}})

# Admin backend configuration
ADMIN_BACKEND_URL = "http://localhost:3001"

# Configure logging: prefer stdout so container runtime captures logs.
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
root_logger = logging.getLogger()
# Default to INFO so info/debug messages appear in local logs
root_logger.setLevel(logging.INFO)

# Stream handler for console output
stream_handler = logging.StreamHandler()
stream_handler.setLevel(logging.INFO)
stream_handler.setFormatter(formatter)

# File handler to append logs to python-bot/bot.log (useful for local development)
log_file_path = os.path.join(os.path.dirname(__file__), 'bot.log')
file_handler = logging.FileHandler(log_file_path, mode='a', encoding='utf-8')
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(formatter)

root_logger.handlers = []
root_logger.addHandler(stream_handler)
root_logger.addHandler(file_handler)

logger = logging.getLogger(__name__)

try:
    logger.info("Starting NLP Processor initialization...")
    nlp_processor = NLPProcessor()
    logger.info("NLP Processor initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize NLP Processor: {e}")
    nlp_processor = None

def build_env_faq_map():
    """Discover faq_*.json files in the data directory and build an env->filename map.
    Keys are lower-cased environment names derived from the filename after the 'faq_' prefix.
    """
    env_map = {}
    try:
        data_dir = os.path.join(os.path.dirname(__file__), 'data')
        if not os.path.isdir(data_dir):
            logger.warning(f"Data directory not found: {data_dir}")
            return env_map

        for fname in os.listdir(data_dir):
            if fname.startswith('faq_') and fname.lower().endswith('.json'):
                # derive env name from filename: faq_<env>.json -> <env>
                env_name = fname[4:-5].lower()
                env_map[env_name] = fname
    except Exception as e:
        logger.error(f"Error building ENV_FAQ_MAP: {e}")
    return env_map

# Build dynamic mapping of environments to faq files at startup
ENV_FAQ_MAP = build_env_faq_map()
if not ENV_FAQ_MAP:
    # ensure at least defaults exist for backward compatibility
    ENV_FAQ_MAP = {
        'stunting': 'faq_stunting.json',
        'ppid': 'faq_ppid.json'
    }

def log_to_admin_backend(session_id, question, answer, confidence, category, environment, user_agent="", ip_address=""):
    """Send chat log to admin backend"""
    try:
        payload = {
            "sessionId": session_id,
            "question": question,
            "answer": answer,
            "confidence": confidence,
            "category": category,
            "environment": environment,
            "userAgent": user_agent,
            "ipAddress": ip_address
        }
        
        response = requests.post(
            f"{ADMIN_BACKEND_URL}/api/chatbot/log",
            json=payload,
            timeout=5
        )
        
        if response.status_code == 200:
            logger.info(f"Successfully logged to admin backend: {session_id}")
        else:
            logger.warning(f"Failed to log to admin backend: {response.status_code}")
            
    except Exception as e:
        logger.error(f"Error logging to admin backend: {e}")

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'FAQ Chatbot is running',
        'nlp_ready': nlp_processor is not None,
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0',
        'supported_envs': list(ENV_FAQ_MAP.keys())
    })

@app.route('/ask', methods=['POST'])
def ask_question():
    """Handle FAQ questions for multiple environments"""
    try:
        data = request.get_json()
        if not data or 'question' not in data:
            return jsonify({
                'error': 'Question is required',
                'status': 'error'
            }), 400
        question = data['question'].strip()
        if not question:
            return jsonify({
                'error': 'Question cannot be empty',
                'status': 'error'
            }), 400
        if len(question) > 500:
            return jsonify({
                'error': 'Question too long (max 500 characters)',
                'status': 'error'
            }), 400
        if not nlp_processor:
            return jsonify({
                'answer': 'Maaf, sistem FAQ sedang tidak tersedia. Silakan coba lagi nanti.',
                'confidence': 0.0,
                'category': 'system_error',
                'status': 'error'
            }), 503
        # Ambil parameter lingkungan (env), default ke 'stunting' jika tidak ada
        env = data.get('env', 'stunting').lower()
        faq_file = ENV_FAQ_MAP.get(env, 'faq_stunting.json')
        # Ganti FAQ jika berbeda
        if nlp_processor.faq_file != faq_file:
            nlp_processor.switch_faq(faq_file)
        
        response = nlp_processor.get_response(question, env=env)
        
        # Generate session ID if not provided
        session_id = data.get('sessionId', str(uuid.uuid4()))
        
        # Log to file
        logger.info(f"Question: {question}")
        logger.info(f"Env: {env} | FAQ file: {faq_file}")
        logger.info(f"Category: {response['category']}")
        logger.info(f"Confidence: {response['confidence']:.3f}")
        logger.info(f"Status: {response['status']}")
        
        # Prepare answer to send: prefer formatted_answer when available
        answer_to_send = response.get('formatted_answer') or response.get('answer')

        # Log to admin backend (send formatted answer when available)
        log_to_admin_backend(
            session_id=session_id,
            question=question,
            answer=answer_to_send,
            confidence=response['confidence'],
            category=response['category'],
            environment=env,
            user_agent=request.headers.get('User-Agent', ''),
            ip_address=request.remote_addr or ''
        )
        
        # Don't add sessionId to response - widget doesn't need it
        
        return jsonify(response)
    except Exception as e:
        logger.error(f"Error processing question: {e}")
        return jsonify({
            'answer': 'Maaf, terjadi kesalahan sistem. Silakan coba lagi nanti.',
            'confidence': 0.0,
            'category': 'system_error',
            'status': 'error'
        }), 500

@app.route('/categories', methods=['GET'])
def get_categories():
    """Get available FAQ categories for selected environment"""
    try:
        env = request.args.get('env', 'stunting').lower()
        faq_file = ENV_FAQ_MAP.get(env, 'faq_stunting.json')
        if nlp_processor.faq_file != faq_file:
            nlp_processor.switch_faq(faq_file)
        if not nlp_processor or not nlp_processor.faqs:
            return jsonify({'categories': []})
        categories = nlp_processor.get_all_categories()
        # Deskripsi kategori generik
        generic_desc = {
            'umum': 'Informasi umum',
            'prosedur': 'Prosedur permohonan dan keberatan',
            'informasi': 'Jenis informasi publik',
            'kontak': 'Informasi kontak',
            'layanan': 'Layanan website',
            # kategori stunting
            'definisi': 'Pengertian dan definisi stunting',
            'penyebab': 'Faktor penyebab terjadinya stunting',
            'gejala': 'Ciri-ciri dan tanda-tanda stunting',
            'pencegahan': 'Cara mencegah stunting',
            'dampak': 'Akibat dan dampak stunting',
            'asi': 'ASI eksklusif dan menyusui',
            'mpasi': 'Makanan pendamping ASI',
            'gizi_ibu': 'Gizi dan nutrisi ibu hamil',
            'posyandu': 'Posyandu dan pemantauan',
            'periode_emas': '1000 hari pertama kehidupan'
        }
        result = []
        for cat in categories:
            result.append({
                'category': cat,
                'description': generic_desc.get(cat, cat.replace('_', ' ').title())
            })
        return jsonify({'categories': result})
    except Exception as e:
        logger.error(f"Error getting categories: {e}")
        return jsonify({'categories': []})

@app.route('/faqs', methods=['GET'])
def get_all_faqs():
    """Get all FAQ data for selected environment"""
    try:
        env = request.args.get('env', 'stunting').lower()
        faq_file = ENV_FAQ_MAP.get(env, 'faq_stunting.json')
        if nlp_processor.faq_file != faq_file:
            nlp_processor.switch_faq(faq_file)
        if not nlp_processor:
            return jsonify({'faqs': []})
        return jsonify({'faqs': nlp_processor.faqs})
    except Exception as e:
        logger.error(f"Error getting FAQs: {e}")
        return jsonify({'faqs': []})

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get bot statistics for selected environment"""
    try:
        env = request.args.get('env', 'stunting').lower()
        faq_file = ENV_FAQ_MAP.get(env, 'faq_stunting.json')
        if nlp_processor.faq_file != faq_file:
            nlp_processor.switch_faq(faq_file)
        if not nlp_processor:
            return jsonify({
                'total_faqs': 0,
                'total_questions': 0,
                'categories': 0,
                'env': env,
                'status': 'error'
            })
        total_questions = sum(len(faq['questions']) for faq in nlp_processor.faqs)
        return jsonify({
            'total_faqs': len(nlp_processor.faqs),
            'total_questions': total_questions,
            'categories': len(nlp_processor.get_all_categories()),
            'env': env,
            'status': 'active'
        })
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        return jsonify({
            'total_faqs': 0,
            'total_questions': 0,
            'categories': 0,
            'env': env,
            'status': 'error'
        })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'status': 'error'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'status': 'error'
    }), 500

if __name__ == '__main__':
    logger.info("Starting FAQ Bot Server...")
    logger.info("Server will run on http://0.0.0.0:5000")
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=False)
    