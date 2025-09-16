# Gunicorn configuration file
import multiprocessing
import os

# Server socket - bind to internal interface only
bind = "192.168.210.165:5000"  # IP spesifik VM
backlog = 2048

# Worker processes - untuk Flask app yang tidak terlalu CPU intensive
# Kurangi jumlah worker untuk menghindari resource exhaustion
workers = min(multiprocessing.cpu_count() * 2 + 1, 4)  # Max 4 workers
worker_class = "sync"
worker_connections = 1000

# Timeout yang lebih panjang untuk NLP processing
timeout = 120
keepalive = 5

# Restart workers after this many requests, to prevent memory leaks
max_requests = 500  # Kurangi untuk mencegah memory leak dari NLP models
max_requests_jitter = 50

# Preload aplikasi untuk sharing memory antar workers
preload_app = True

# Worker timeout untuk startup (penting untuk NLP initialization)
timeout = 120
graceful_timeout = 30

# Logging
accesslog = "access.log"
errorlog = "error.log" 
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Capture output untuk debugging
capture_output = True

# Process naming
proc_name = 'faq-chatbot'

# Server mechanics
daemon = False
pidfile = '/tmp/gunicorn_chatbot.pid'
user = None
group = None
tmp_upload_dir = None

# Memory dan performance tuning
worker_tmp_dir = '/dev/shm'  # Use shared memory untuk temporary files

# Security headers
# Tambahkan environment variables jika diperlukan
raw_env = [
    'PYTHONPATH=/path/to/your/app',  # Sesuaikan dengan path aplikasi Anda
]

# Hook functions untuk debugging
def when_ready(server):
    server.log.info("Server is ready. Spawning workers")

def worker_int(worker):
    worker.log.info("worker received INT or QUIT signal")

def pre_fork(server, worker):
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def post_fork(server, worker):
    server.log.info("Worker spawned (pid: %s)", worker.pid)

def post_worker_init(worker):
    worker.log.info("Worker initialized (pid: %s)", worker.pid)

def worker_abort(worker):
    worker.log.info("Worker received SIGABRT signal")
