# 🤖 Multi-Domain FAQ Chatbot - Assistant untuk Diskominfo

Aplikasi chatbot FAQ berbasis NLP (Natural Language Processing) yang dikembangkan untuk membantu masyarakat mendapatkan informasi terkait berbagai layanan Diskominfo Kota Sukoharjo secara otomatis dan responsif.

## 📋 Deskripsi

Chatbot ini mendukung dua domain utama:

### 🏛️ PPID (Pejabat Pengelola Informasi dan Dokumentasi)

Menjawab pertanyaan seputar layanan PPID, seperti:

- Informasi tentang PPID
- Jenis layanan yang tersedia
- Cara pengajuan permohonan informasi
- Waktu pemrosesan
- Biaya layanan
- Prosedur keberatan informasi

### 👶 Stunting Prevention

Memberikan informasi tentang pencegahan stunting, meliputi:

- Pengertian stunting dan penyebabnya
- Gizi dan nutrisi untuk ibu hamil
- Makanan bergizi untuk anak
- Tanda-tanda stunting pada anak
- Program pemerintah terkait stunting
- Tips pencegahan stunting

## ✨ Fitur Utama

### 🎯 Core Features

- **Multi-Domain Support**: Mendukung PPID dan Stunting Prevention
- **Natural Language Processing**: Memahami pertanyaan dalam bahasa Indonesia
- **Real-time Response**: Jawaban instant untuk pertanyaan umum
- **Template Questions**: Pertanyaan template yang dapat di-collapse
- **Responsive Design**: Mendukung desktop dan mobile dengan UI yang optimal
- **Environment Switching**: Dapat beralih antara mode PPID dan Stunting

### 📱 Mobile Features

- **Slide-in Interface**: Chatbot slide dari kiri di mobile
- **Touch-optimized**: Button dan input yang ramah sentuhan
- **Collapsible Templates**: Template pertanyaan yang dapat disembunyikan
- **Full-width Send Button**: Tombol kirim memanjang penuh di mobile

### 🎨 UI/UX Features

- **Modern Design**: Interface yang bersih dan user-friendly
- **Smooth Animations**: Transisi yang halus dan engaging
- **Typing Indicator**: Indikator saat bot sedang memproses
- **Message Bubbles**: Chat bubble yang intuitif

## 🛠️ Teknologi yang Digunakan

### Backend

- **Python 3.x**: Language utama
- **Flask**: Web framework untuk API
- **NLTK**: Natural Language Processing
- **scikit-learn**: Machine learning untuk similarity matching
- **JSON**: Database FAQ sederhana

### Frontend

- **HTML5**: Struktur halaman
- **CSS3**: Styling dengan responsive design
- **Vanilla JavaScript**: Interaktifitas tanpa dependency
- **ES6 Classes**: Struktur kode yang terorganisir

### Deployment

- **ngrok**: Tunneling untuk development dan testing

## 📁 Struktur Project

```
python-bot/
├── app.py                 # Main Flask application
├── nlp_processor.py       # NLP processing logic
├── test_api.py           # API testing script
├── requirements.txt      # Python dependencies
├── bot.log              # Application logs
├── data/
│   ├── faq_ppid.json    # FAQ data untuk PPID
│   └── faq_stunting.json # FAQ data untuk Stunting
├── __pycache__/         # Python cache files
└── README.md           # Project documentation
```

## 🚀 Instalasi dan Setup

### Prerequisites

- Python 3.7 atau lebih tinggi
- pip (Python package manager)
- Git

### 1. Clone Repository

```bash
git clone https://github.com/hoshiii15/Chatbot-for-Diskominfo-with-NLP.git
cd Chatbot-for-Diskominfo-with-NLP
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Download NLTK Data

```python
import nltk
nltk.download('punkt')
nltk.download('stopwords')
```

### 4. Jalankan Aplikasi

```bash
python app.py
```

Server akan berjalan di `http://localhost:5000`

### 5. Setup ngrok (Opsional untuk Testing)

```bash
# Install ngrok terlebih dahulu
ngrok http 5000
```

## 🔧 Konfigurasi

### Environment Variables

Tidak ada environment variables khusus yang diperlukan untuk development lokal.

### FAQ Data

Edit file FAQ sesuai dengan domain yang diinginkan:

**PPID FAQ (`data/faq_ppid.json`):**

```json
{
  "faqs": [
    {
      "question": "Apa itu PPID?",
      "answer": "PPID adalah Pejabat Pengelola Informasi dan Dokumentasi..."
    }
  ]
}
```

**Stunting FAQ (`data/faq_stunting.json`):**

```json
{
  "faqs": [
    {
      "question": "Apa itu stunting?",
      "answer": "Stunting adalah kondisi gagal tumbuh pada anak..."
    }
  ]
}
```

## 📖 Penggunaan

### API Endpoints

#### POST /ask

Endpoint utama untuk bertanya ke chatbot.

**Request untuk PPID:**

```json
{
  "question": "Apa itu PPID?",
  "env": "ppid"
}
```

**Request untuk Stunting:**

```json
{
  "question": "Apa itu stunting?",
  "env": "stunting"
}
```

**Response:**

```json
{
  "answer": "PPID adalah Pejabat Pengelola Informasi dan Dokumentasi...",
  "confidence": 0.85
}
```

#### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-09-07T07:00:00"
}
```

### Domain Environment

Chatbot mendukung dua environment:

- `"ppid"`: Untuk pertanyaan seputar PPID
- `"stunting"`: Untuk pertanyaan seputar pencegahan stunting

## 🧪 Testing

### Manual Testing

```bash
python test_api.py
```

### API Testing dengan curl

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test PPID endpoint
curl -X POST http://localhost:5000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Apa itu PPID?", "env": "ppid"}'

# Test Stunting endpoint
curl -X POST http://localhost:5000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Apa itu stunting?", "env": "stunting"}'
```

## 🔒 CORS Configuration

Aplikasi sudah dikonfigurasi untuk menerima request dari domain manapun:

```python
CORS(app, origins=['*'])
```

Untuk production, disarankan untuk membatasi origins:

```python
CORS(app, origins=['https://yourdomain.com'])
```

### Template Questions

Tambah/edit pertanyaan template di HTML sesuai domain:

## 🐛 Troubleshooting

### Common Issues

1. **CORS Error**: Pastikan Flask-CORS terinstall dan dikonfigurasi
2. **NLTK Data Missing**: Jalankan `nltk.download()` untuk download data
3. **Port Already in Use**: Ganti port di `app.py` atau stop proses yang menggunakan port 5000
4. **ngrok Connection**: Pastikan ngrok terinstall dan running

### Logging

Check file `bot.log` untuk error logs dan debugging.

## 🚀 Deployment

### Minimum VPS Requirements

#### Development/Testing Environment

```
CPU: 1 vCore
RAM: 1 GB
Storage: 5 GB SSD
Bandwidth: 100 Mbps shared
OS: Ubuntu 20.04/22.04 LTS
```

#### Production Environment (Recommended)

```
CPU: 2 vCore
RAM: 2 GB
Storage: 10 GB SSD
Bandwidth: 500 Mbps shared
OS: Ubuntu 20.04/22.04 LTS
```

#### High Traffic Environment

```
CPU: 2-4 vCore
RAM: 4 GB
Storage: 20 GB SSD
Bandwidth: 1 Gbps shared
OS: Ubuntu 20.04/22.04 LTS
```

### Resource Analysis

- **Memory Usage**: 600-800 MB (with all dependencies loaded)
- **CPU Usage**: Medium during NLP processing
- **Storage**: ~300 MB for application + dependencies
- **Expected Load**: 100-1000 requests/day
- **Concurrent Users**: 5-20 simultaneous users

### Production Deployment

1. **Prepare VPS Environment**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.8+
sudo apt install python3 python3-pip python3-venv git nginx -y

# Install PM2 for process management
npm install -g pm2
```

2. **Clone and Setup Application**

```bash
git clone https://github.com/hoshiii15/Chatbot-for-Diskominfo-with-NLP.git
cd Chatbot-for-Diskominfo-with-NLP
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Download NLTK data
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

3. **Configure Production Server**

```bash
# Install Gunicorn for production WSGI
pip install gunicorn

# Create systemd service
sudo nano /etc/systemd/system/faq-chatbot.service
```

4. **Systemd Service Configuration**

```ini
[Unit]
Description=FAQ Chatbot Application
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/path/to/Chatbot-for-Diskominfo-with-NLP
Environment=PATH=/path/to/venv/bin
ExecStart=/path/to/venv/bin/gunicorn --workers 2 --bind 127.0.0.1:5000 app:app
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
```

5. **Nginx Configuration**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

6. **SSL Setup with Let's Encrypt**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

7. **Performance Optimization**

```python
# app.py - Production settings
app.config['DEBUG'] = False
app.config['TESTING'] = False

# Use production WSGI server
if __name__ == '__main__':
    # Development only
    app.run(host='127.0.0.1', port=5000, debug=False)
```

### Monitoring & Maintenance

1. **Setup Monitoring**

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor application logs
tail -f bot.log

# Monitor system resources
htop
```

2. **Automated Backups**

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "/backup/chatbot_backup_$DATE.tar.gz" \
  /path/to/application \
  --exclude="__pycache__" \
  --exclude="*.log"
EOF

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

3. **Log Rotation**

```bash
sudo nano /etc/logrotate.d/faq-chatbot
```

```
/path/to/application/bot.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 www-data www-data
}
```

### Security Best Practices

1. **Firewall Configuration**

```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

2. **Environment Variables**

```bash
# Create .env file for sensitive configs
cat > .env << 'EOF'
FLASK_ENV=production
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=https://your-domain.com
EOF
```

3. **Rate Limiting**

```python
# Install Flask-Limiter
pip install Flask-Limiter

# Add to app.py
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)

@app.route('/ask', methods=['POST'])
@limiter.limit("10 per minute")
def ask_question():
    # existing code
```

### Performance Optimization

1. **Caching Implementation**

```python
# Install Flask-Caching
pip install Flask-Caching

# Add to app.py
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'simple'})

@app.route('/ask', methods=['POST'])
@cache.memoize(timeout=300)  # Cache for 5 minutes
def cached_ask_question():
    # existing code
```

2. **Database Migration** (Optional)

```bash
# For high traffic, consider migrating from JSON to SQLite/PostgreSQL
pip install SQLAlchemy Flask-SQLAlchemy
```

### VPS Provider Recommendations

#### Budget-Friendly Options

- **DigitalOcean**: $5/month droplet (1 vCore, 1GB RAM, 25GB SSD)
- **Vultr**: $3.50/month (1 vCore, 512MB RAM, 10GB SSD)
- **Linode**: $5/month (1 vCore, 1GB RAM, 25GB SSD)

#### Enterprise Options

- **AWS EC2**: t3.micro/small instances
- **Google Cloud**: e2-micro/small instances
- **Azure**: B1s/B1ms instances

### Production Deployment

1. Use production WSGI server (Gunicorn, uWSGI)
2. Configure proper CORS origins
3. Use environment variables untuk konfigurasi
4. Setup SSL/HTTPS
5. Use proper database instead of JSON files

### Docker Deployment (Coming Soon)

```dockerfile
# Dockerfile akan ditambahkan di versi selanjutnya
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Development Guidelines

- Untuk menambah domain baru, buat file JSON di folder `data/`
- Update `nlp_processor.py` untuk mendukung environment baru
- Buat widget HTML terpisah untuk setiap domain
- Test kedua environment sebelum commit

## 📊 Data Sources

### PPID FAQ

Data FAQ PPID bersumber dari:

- Peraturan perundang-undangan tentang keterbukaan informasi publik
- Panduan layanan PPID Kota Sukoharjo
- FAQ umum dari masyarakat

### Stunting FAQ

Data FAQ Stunting bersumber dari:

- Panduan Kementerian Kesehatan RI
- Program pencegahan stunting nasional
- Edukasi gizi dan kesehatan anak

## 👥 Team

**Dikembangkan oleh Hosea Raka (Anak Magang Diskominfo Kota Sukoharjo)**

- **Role**: Full Stack Development
- **Focus**: NLP, Web Development, UI/UX
- **Contact**: [GitHub](https://github.com/hoshiii15)

## 🙏 Acknowledgments

- Tim Diskominfo Kota Sukoharjo
- NLTK Community
- Flask Community
- Semua pihak yang mendukung pengembangan aplikasi ini

## 📞 Support

Jika mengalami masalah atau memiliki pertanyaan:

1. Check dokumentasi ini terlebih dahulu
2. Check Issues di GitHub repository
3. Create new issue dengan detail yang lengkap

---

**Made with ❤️ for Diskominfo Kota Sukoharjo**
