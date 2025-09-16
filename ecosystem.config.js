/**
 * File Konfigurasi PM2 (Final)
 * =================================
 * File ini mendefinisikan bagaimana setiap aplikasi (frontend, backend, python-bot)
 * harus dijalankan oleh PM2 di lingkungan produksi.
 * 'admin-backend' sekarang menggunakan 'npm start' yang sudah diperbaiki.
 */
module.exports = {
  apps: [
    {
      name: 'admin-frontend',
      cwd: './admin-frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'admin-backend',
      cwd: './admin-backend',
      // Konfigurasi ini sekarang akan bekerja karena package.json
      // sudah menunjuk ke path yang benar.
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'python-bot',
      cwd: './python-bot',
      script: './venv/bin/gunicorn',
      args: '--config gunicorn.conf.py app:app',
      interpreter: 'none',
    },
  ],
};


