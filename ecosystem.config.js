const path = require('path');

module.exports = {
  apps: [
    {
      name: 'chatbot-backend',
      // run from repo-root/admin-backend
      cwd: './admin-backend',
      // run the compiled backend JS directly (path is relative to cwd)
      script: 'node',
      args: 'dist/admin-backend/src/app.js',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: path.resolve(__dirname, './logs/backend-error.log'),
      out_file: path.resolve(__dirname, './logs/backend-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      watch: false,
      max_restarts: 10,
      min_uptime: '5s'
    },
    {
      name: 'chatbot-frontend',
      cwd: './admin-frontend',
      // run Next standalone server (produced by `next build` with `output: 'standalone'`)
      // this avoids invoking npm on Windows and uses node directly
      script: 'node',
      args: '.next/standalone/admin-frontend/server.js',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: path.resolve(__dirname, './logs/frontend-error.log'),
      out_file: path.resolve(__dirname, './logs/frontend-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      watch: false,
      max_restarts: 5,
      min_uptime: '5s'
    },
    {
      name: 'chatbot-python',
      // use relative cwd so config is portable across machines
      cwd: './python-bot',
      // run the Python app directly (app.py must exist in python-bot)
      // interpreter 'python' works on Windows and on many Linux setups; change to 'python3' if needed on Linux
      script: 'app.py',
      interpreter: 'python',
      env: {
        PYTHONUNBUFFERED: '1',
        FLASK_RUN_PORT: '5000',
        PORT: '5000'
      },
      error_file: path.resolve(__dirname, './logs/python-error.log'),
      out_file: path.resolve(__dirname, './logs/python-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_restarts: 10,
      min_uptime: '5s'
    }
  ]
};
