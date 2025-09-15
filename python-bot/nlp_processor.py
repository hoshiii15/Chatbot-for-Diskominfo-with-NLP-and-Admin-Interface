import nltk
import json
import re
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory
from fuzzywuzzy import fuzz
import numpy as np

class NLPProcessor:
    def __init__(self, faq_file=None, fuzzy_threshold=85, fuzzy_short_threshold=90, match_threshold=0.35):
        """Initialize NLP processor and tunable thresholds.

        Parameters:
        - faq_file: filename under ./data to load (default: 'faq_ppid.json')
        - fuzzy_threshold: fuzzy match threshold for medium/long tokens
        - fuzzy_short_threshold: higher fuzzy threshold for short tokens (<=4 chars)
        - match_threshold: combined score threshold for TF-IDF+fuzzy matching
        """
        print("Initializing NLP Processor...")
        self._download_nltk_data()
        print("Loading Sastrawi components...")
        self.stemmer = StemmerFactory().create_stemmer()
        self.stopword_remover = StopWordRemoverFactory().create_stop_word_remover()
        self.vectorizer = TfidfVectorizer()

        # file and thresholds
        self.faq_file = faq_file or 'faq_ppid.json'
        self.fuzzy_threshold = int(fuzzy_threshold)
        self.fuzzy_short_threshold = int(fuzzy_short_threshold)
        self.match_threshold = float(match_threshold)

        # load data and prepare models
        self.load_faq_data(self.faq_file)
        self.prepare_corpus()
        self._init_ppid_categories()
        print("NLP Processor initialized successfully!")
    
    def _init_ppid_categories(self):
        """Initialize PPID information categories.
        Prefer to load category keywords/descriptions from the loaded FAQ data (if the FAQ
        entries include explicit `keywords`), otherwise group FAQ `questions` by their
        `category` and use those as keywords. If no FAQ-derived categories can be built,
        fall back to the original hard-coded set so behavior remains unchanged.
        """
        # Build categories from both explicit 'keywords' (when present) and
        # by grouping questions per category. Previously the logic returned
        # early when any FAQ had explicit 'keywords', which caused FAQs
        # without keywords to be omitted. To avoid that, always aggregate
        # both sources and merge them.
        self.ppid_categories = {}
        # map individual keyword (lowercased) -> faq dict for precise answers
        self.keyword_to_faq = {}

        # 1) Add explicit keyword entries first (aggregate per category)
        for faq in getattr(self, 'faqs', []) or []:
            kws = faq.get('keywords') or []
            # also extract link texts as useful keywords (e.g., 'LHKPN')
            links = faq.get('links') or []
            link_texts = [l.get('text', '').lower() for l in links if isinstance(l, dict) and l.get('text')]

            if kws or link_texts:
                key = faq.get('category') or f"faq_{faq.get('id')}"
                if key not in self.ppid_categories:
                    self.ppid_categories[key] = {
                        'keywords': [],
                        'description': faq.get('answer', '')
                    }

                # extend existing keywords with new ones (avoid duplicates)
                existing = set(self.ppid_categories[key].get('keywords', []))
                for k in kws:
                    if k is not None:
                        kw = str(k).lower()
                        existing.add(kw)
                        # map keyword to originating faq for precise answers
                        if kw not in self.keyword_to_faq:
                            self.keyword_to_faq[kw] = faq
                for lt in link_texts:
                    if lt:
                        existing.add(lt)
                        if lt not in self.keyword_to_faq:
                            self.keyword_to_faq[lt] = faq

                self.ppid_categories[key]['keywords'] = list(existing)
                # keep description if not already set
                if not self.ppid_categories[key].get('description'):
                    self.ppid_categories[key]['description'] = faq.get('answer', '')

        # 2) Group remaining FAQs by category and use their questions as keywords
        grouped = {}
        for faq in getattr(self, 'faqs', []) or []:
            cat = faq.get('category') or f"faq_{faq.get('id')}"
            if cat not in grouped:
                grouped[cat] = {'keywords': set(), 'description': None}
            for q in faq.get('questions', []) or []:
                if isinstance(q, str) and q.strip():
                    grouped[cat]['keywords'].add(q.lower())
            if not grouped[cat]['description']:
                grouped[cat]['description'] = faq.get('answer', '')

        # Merge grouped keywords into categories that don't already have explicit keywords
        for cat, data in grouped.items():
            if data['keywords']:
                if cat in self.ppid_categories:
                    # extend existing explicit keywords with grouped questions
                    existing = set(self.ppid_categories[cat].get('keywords', []))
                    for q in data['keywords']:
                        existing.add(q)
                        # map question-string keyword to originating faq if possible
                        # find a representative faq for this category/questions by scanning faqs
                        for faq in getattr(self, 'faqs', []) or []:
                            if faq.get('category') == cat and q in [qq.lower() for qq in (faq.get('questions') or [])]:
                                if q not in self.keyword_to_faq:
                                    self.keyword_to_faq[q] = faq
                                break
                    merged = list(existing)
                    self.ppid_categories[cat]['keywords'] = merged
                    if not self.ppid_categories[cat].get('description'):
                        self.ppid_categories[cat]['description'] = data['description'] or f"Informasi tentang {cat}"
                else:
                    self.ppid_categories[cat] = {
                        'keywords': list(data['keywords']),
                        'description': data['description'] or f"Informasi tentang {cat}"
                    }
                    # map grouped question keywords to a representative faq in this category
                    for q in data['keywords']:
                        for faq in getattr(self, 'faqs', []) or []:
                            if faq.get('category') == cat and q in [qq.lower() for qq in (faq.get('questions') or [])]:
                                if q not in self.keyword_to_faq:
                                    self.keyword_to_faq[q] = faq
                                break

        # 3) Final fallback: original hard-coded dictionary to preserve previous behavior
        if not self.ppid_categories:
            self.ppid_categories = {
                "profil_badan_publik": {
                    "keywords": [
                        "kedudukan", "domisili", "alamat kantor", "visi misi", "tugas fungsi", 
                        "struktur organisasi", "profil pimpinan", "profil pegawai", "profil ppid", 
                        "struktur ppid", "lhkpn", "lhkan"
                    ],
                    "description": "Informasi tentang profil badan publik"
                },
                "program_kegiatan": {
                    "keywords": [
                        "program kegiatan", "penanggungjawab program", "pelaksana program", "target capaian", 
                        "jadwal pelaksanaan", "sumber anggaran", "kak program", "agenda pelaksanaan",
                        "e-samsat", "layanan online disdukcapil", "harga barang kebutuhan pokok",
                        "penerimaan pegawai", "penerimaan peserta didik"
                    ],
                    "description": "Ringkasan program dan kegiatan yang sedang dijalankan"
                },
                "kinerja": {
                    "keywords": [
                        "laporan kinerja", "lkjip", "sakip", "sistem akuntabilitas kinerja",
                        "ikplhd", "kinerja pengelolaan lingkungan", "lkpj", "laporan keterangan pertanggungjawaban"
                    ],
                    "description": "Ringkasan informasi tentang kinerja"
                },
                "laporan_keuangan": {
                    "keywords": [
                        "kua", "kebijakan umum apbd", "ppas", "prioritas plafon anggaran", "apbd",
                        "anggaran pendapatan belanja", "daftar aset", "calk", "catatan laporan keuangan",
                        "neraca keuangan", "lra", "laporan realisasi anggaran", "laporan operasional",
                        "laporan arus kas", "laporan perubahan ekuitas", "laporan perubahan saldo anggaran",
                        "opini bpk", "rka", "rencana kerja anggaran", "dpa", "dokumen pelaksanaan anggaran",
                        "rko", "rencana kerja operasional", "rfk", "realisasi fisik keuangan",
                        "lkpd", "laporan keuangan pemerintah daerah"
                    ],
                    "description": "Ringkasan laporan keuangan"
                },
                "akses_informasi": {
                    "keywords": [
                        "laporan layanan informasi", "infografis laporan", "register permohonan",
                        "rekapitulasi pelayanan", "indeks kepuasan masyarakat"
                    ],
                    "description": "Laporan akses informasi publik"
                },
                "peraturan_keputusan": {
                    "keywords": [
                        "daftar peraturan", "daftar keputusan", "pembentukan rancangan peraturan",
                        "dokumen pendukung", "jdih dprd", "jaringan dokumentasi informasi hukum"
                    ],
                    "description": "Informasi tentang peraturan, keputusan, dan/atau kebijakan"
                },
                "tata_cara_informasi": {
                    "keywords": [
                        "hak memperoleh informasi", "tata cara memperoleh informasi", 
                        "tata cara pengajuan keberatan", "proses penyelesaian sengketa",
                        "tata cara fasilitasi sengketa"
                    ],
                    "description": "Informasi tentang hak dan tata cara memperoleh informasi publik"
                },
                "pengaduan": {
                    "keywords": [
                        "tata cara pengaduan", "penyalahgunaan wewenang", "pelanggaran",
                        "penggunaan aplikasi lapor", "pengaduan pelayanan informasi",
                        "formulir pengaduan", "standar pelayanan inspektorat",
                        "hasil penanganan pengaduan"
                    ],
                    "description": "Informasi tentang tata cara pengaduan penyalahgunaan wewenang atau pelanggaran"
                },
                "pengadaan_barang_jasa": {
                    "keywords": [
                        "pengadaan barang", "pengadaan jasa", "tahap perencanaan", "sirup",
                        "rencana umum pengadaan", "tahap pemilihan", "tahap pelaksanaan",
                        "lpse", "layanan pengadaan elektronik", "proyek strategis"
                    ],
                    "description": "Pengumuman pengadaan barang dan jasa"
                },
                "ketenagakerjaan": {
                    "keywords": [
                        "e-makaryo", "lowongan pekerjaan", "info lowongan", "penerimaan calon pegawai"
                    ],
                    "description": "Informasi tentang ketenagakerjaan"
                },
                "kependudukan": {
                    "keywords": [
                        "profil perkembangan kependudukan", "buku data kependudukan", "profil gender"
                    ],
                    "description": "Informasi tentang kependudukan"
                },
                "peringatan_dini_bencana": {
                    "keywords": [
                        "informasi kebencanaan", "peringatan dini", "prosedur evakuasi",
                        "keadaan darurat", "peta rawan bencana"
                    ],
                    "description": "Informasi prosedur peringatan dini bencana"
                },
                "sop": {
                    "keywords": [
                        "sop", "standar operasional prosedur", "penyusunan daftar informasi",
                        "pelayanan permohonan informasi", "pelayanan informasi inklusi",
                        "uji konsekuensi informasi", "penanganan keberatan",
                        "fasilitasi sengketa", "maklumat pelayanan", "pengumuman informasi",
                        "standar biaya perolehan", "pelayanan informasi terintegrasi"
                    ],
                    "description": "Standar Operasional Prosedur"
                }
            }
    
    def check_ppid_category(self, question):
        """Check if question relates to PPID information categories"""
        if not question:
            return None

        question_lower = question.lower()

        for category, data in self.ppid_categories.items():
            for keyword in data.get("keywords", []):
                if not isinstance(keyword, str) or not keyword:
                    continue
                kw = keyword.lower()
                # direct substring match (fast)
                if kw in question_lower or question_lower in kw:
                    result = {
                        "category": category,
                        "description": data.get("description"),
                        "matched_keyword": keyword
                    }
                    # if we have an originating faq for this keyword, attach it
                    faq_obj = self.keyword_to_faq.get(kw)
                    if faq_obj:
                        result['faq'] = faq_obj
                    return result

                # fuzzy match in both directions to handle short/long tokens
                try:
                    # pick threshold depending on keyword length: short tokens need higher threshold
                    thresh = self.fuzzy_short_threshold if len(kw) <= 4 else self.fuzzy_threshold
                    if fuzz.partial_ratio(question_lower, kw) > thresh or fuzz.partial_ratio(kw, question_lower) > thresh:
                        result = {
                            "category": category,
                            "description": data.get("description"),
                            "matched_keyword": keyword
                        }
                        faq_obj = self.keyword_to_faq.get(kw)
                        if faq_obj:
                            result['faq'] = faq_obj
                        return result
                except Exception:
                    # if fuzzy matching fails for some token, skip it
                    continue
        return None
    
    def _download_nltk_data(self):
        """Download required NLTK data"""
        try:
            nltk.data.find('tokenizers/punkt')
            print("NLTK punkt tokenizer already downloaded")
        except LookupError:
            print("Downloading NLTK punkt tokenizer...")
            nltk.download('punkt')
        
        try:
            nltk.data.find('corpora/stopwords')
            print("NLTK stopwords already downloaded")
        except LookupError:
            print("Downloading NLTK stopwords...")
            nltk.download('stopwords')
    
    def load_faq_data(self, faq_file=None):
        """Load FAQ data from JSON file (default: faq_stunting.json)"""
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            file_name = faq_file or self.faq_file or 'faq_stunting.json'
            faq_path = os.path.join(current_dir, 'data', file_name)
            print(f"Loading FAQ data from: {faq_path}")
            with open(faq_path, 'r', encoding='utf-8') as file:
                # Support both array and dict with 'faqs' key
                data = json.load(file)
                if isinstance(data, dict) and 'faqs' in data:
                    self.faqs = data['faqs']
                else:
                    self.faqs = data
            print(f"Loaded {len(self.faqs)} FAQ entries")
        except FileNotFoundError:
            print(f"ERROR: FAQ data file not found! ({faq_file})")
            self.faqs = []
        except json.JSONDecodeError as e:
            print(f"ERROR: Invalid JSON format: {e}")
            self.faqs = []
        except Exception as e:
            print(f"ERROR: Failed to load FAQ data: {e}")
            self.faqs = []
    def switch_faq(self, faq_file):
        """Switch FAQ data to another file and re-prepare corpus"""
        self.faq_file = faq_file
        self.load_faq_data(faq_file)
        self.prepare_corpus()
    
    def preprocess_text(self, text):
        """Preprocess Indonesian text"""
        if not text:
            return ""
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        try:
            text = self.stopword_remover.remove(text)
        except Exception as e:
            print(f"Warning: Stopword removal failed: {e}")
        try:
            text = self.stemmer.stem(text)
        except Exception as e:
            print(f"Warning: Stemming failed: {e}")
        
        return text
    
    def prepare_corpus(self):
        """Prepare corpus for TF-IDF"""
        if not self.faqs:
            print("No FAQ data available for corpus preparation")
            self.processed_questions = []
            self.question_to_faq = []
            return
        
        print("Preparing corpus for TF-IDF...")
        
        self.processed_questions = []
        self.question_to_faq = []
        
        for faq in self.faqs:
            for question in faq['questions']:
                processed_q = self.preprocess_text(question)
                if processed_q:
                    self.processed_questions.append(processed_q)
                    self.question_to_faq.append(faq)
        
        print(f"Processed {len(self.processed_questions)} questions")
        
        if self.processed_questions:
            try:
                self.tfidf_matrix = self.vectorizer.fit_transform(self.processed_questions)
                print("TF-IDF matrix created successfully")
            except Exception as e:
                print(f"ERROR: Failed to create TF-IDF matrix: {e}")
                self.tfidf_matrix = None
        else:
            self.tfidf_matrix = None
    
    def find_best_answer(self, user_question, threshold=None):
        """Find the best answer for user question.

        If threshold is None, use the instance's configured match_threshold.
        Returns (faq_obj, score) or (None, score).
        """
        if not self.processed_questions or self.tfidf_matrix is None:
            print("No processed questions available")
            return None, 0

        processed_user_q = self.preprocess_text(user_question)
        if not processed_user_q:
            print("Processed user question is empty")
            return None, 0

        try:
            user_tfidf = self.vectorizer.transform([processed_user_q])
            similarities = cosine_similarity(user_tfidf, self.tfidf_matrix).flatten()
            fuzzy_scores = []
            for q in self.processed_questions:
                fuzzy_score = fuzz.ratio(processed_user_q, q) / 100.0
                fuzzy_scores.append(fuzzy_score)

            combined_scores = 0.7 * similarities + 0.3 * np.array(fuzzy_scores)
            best_idx = int(np.argmax(combined_scores))
            best_score = float(combined_scores[best_idx])

            th = threshold if threshold is not None else self.match_threshold
            print(f"Best match score: {best_score:.3f} (threshold used: {th})")

            if best_score >= th:
                return self.question_to_faq[best_idx], best_score
            return None, best_score

        except Exception as e:
            print(f"Error in finding best answer: {e}")
            return None, 0
    
    def generate_ppid_response(self, ppid_info):
        """Generate response for PPID information query"""
        # if check_ppid_category attached an originating faq, prefer that faq's exact answer/links
        faq_obj = ppid_info.get('faq') if isinstance(ppid_info, dict) else None
        if faq_obj:
            resp = {
                'answer': faq_obj.get('answer', ppid_info.get('description', '') + ' dapat ditemukan di'),
                'confidence': 0.95,
                'category': faq_obj.get('category', 'ppid_informasi'),
                'faq_id': faq_obj.get('id'),
                'status': 'found'
            }
            if faq_obj.get('links'):
                resp['links'] = faq_obj.get('links')
            return resp

        return {
            'answer': f"{ppid_info['description']} dapat ditemukan di",
            'confidence': 0.95,
            'category': 'ppid_informasi',
            'faq_id': ppid_info['category'],
            'status': 'ppid_link',
            'matched_keyword': ppid_info['matched_keyword'],
            'links': [{
                'text': 'Lihat Daftar Informasi Berkala PPID',
                'url': 'https://ppid.sukoharjokab.go.id/daftar-informasi-berkala/'
            }]
        }
    
    def get_response(self, user_question, env=None):
        """Get response for user question, with env-aware fallback"""
        print(f"Processing question: {user_question}")
        
        # Check for PPID information categories first
        ppid_info = self.check_ppid_category(user_question)
        if ppid_info:
            print(f"PPID category detected: {ppid_info['category']} (keyword: {ppid_info['matched_keyword']})")
            return self.generate_ppid_response(ppid_info)
        
        # Continue with regular FAQ matching
        best_faq, confidence = self.find_best_answer(user_question)
        if best_faq:
            response = {
                'answer': best_faq['answer'],
                'confidence': float(confidence),
                'category': best_faq['category'],
                'faq_id': best_faq['id'],
                'status': 'found'
            }
            
            # Include links if available
            if 'links' in best_faq and best_faq['links']:
                response['links'] = best_faq['links']
                
                # Optional: Format answer with clickable links for HTML display
                formatted_answer = best_faq['answer']
                if best_faq['links']:
                    formatted_answer += "\n\nLink terkait:"
                    for link in best_faq['links']:
                        formatted_answer += f"\n• {link['text']}: {link['url']}"
                
                response['formatted_answer'] = formatted_answer
            
            print(f"Answer found with confidence: {confidence:.3f}")
            if 'links' in response:
                print(f"Including {len(response['links'])} links in response")
        else:
            # Fallback sesuai env
            env_key = env or self.faq_file.replace('.json','')
            if 'ppid' in env_key:
                fallback_answers = [
                    "Maaf, saya tidak dapat menemukan jawaban yang tepat untuk pertanyaan Anda.",
                    "Berikut beberapa topik yang bisa saya bantu:",
                    "• Apa itu PPID?",
                    "• Cara permohonan informasi publik",
                    "• Prosedur pengajuan keberatan",
                    "• Jenis informasi publik",
                    "• Layanan website PPID",
                    "• Kontak dan alamat PPID",
                    "",
                    "Silakan ajukan pertanyaan dengan kata kunci yang lebih spesifik, atau hubungi petugas PPID untuk informasi lebih lanjut."
                ]
            else:
                fallback_answers = [
                    "Maaf, saya tidak dapat menemukan jawaban yang tepat untuk pertanyaan Anda.",
                    "Berikut beberapa topik yang bisa saya bantu:",
                    "• Apa itu stunting?",
                    "• Penyebab dan cara mencegah stunting",
                    "• Gizi ibu hamil dan ASI eksklusif", 
                    "• MPASI dan nutrisi anak",
                    "• Imunisasi dan posyandu",
                    "",
                    "Silakan ajukan pertanyaan dengan kata kunci yang lebih spesifik, atau hubungi petugas kesehatan untuk informasi lebih lanjut."
                ]
            response = {
                'answer': "\n".join(fallback_answers),
                'confidence': float(confidence),
                'category': 'unknown',
                'faq_id': None,
                'status': 'not_found'
            }
            print(f"No suitable answer found. Confidence: {confidence:.3f}")
        return response
    
    def get_all_categories(self):
        """Get all available categories"""
        if not self.faqs:
            return []
        
        categories = list(set(faq['category'] for faq in self.faqs))
        return sorted(categories)
    
    def get_questions_by_category(self, category):
        """Get all questions for a specific category"""
        if not self.faqs:
            return []
        
        questions = []
        for faq in self.faqs:
            if faq['category'] == category:
                questions.extend(faq['questions'])
        
        return questions

if __name__ == "__main__":
    print("=== Testing NLP Processor ===")
    
    try:
        processor = NLPProcessor()
        
        test_questions = [
            "apa itu stunting?",
            "bagaimana cara mencegah stunting?", 
            "apa saja gejala stunting?",
            "kenapa anak bisa stunting?",
            "asi eksklusif berapa lama?",
            "pertanyaan yang tidak ada jawabannya"
        ]
        
        print("\n=== Testing Questions ===")
        for question in test_questions:
            print(f"\nQ: {question}")
            response = processor.get_response(question)
            print(f"A: {response['answer'][:150]}...")
            print(f"Confidence: {response['confidence']:.3f}")
            print(f"Category: {response['category']}")
            print(f"Status: {response['status']}")
            print("-" * 50)
            
        print("\n=== Available Categories ===")
        categories = processor.get_all_categories()
        for cat in categories:
            print(f"- {cat}")
            
    except Exception as e:
        print(f"Error during testing: {e}")
        import traceback
        traceback.print_exc()