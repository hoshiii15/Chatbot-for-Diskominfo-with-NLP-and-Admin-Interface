module.exports = {
  apps: [
    {
      name: 'chatbot-backend',
      cwd: './admin-backend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'chatbot-frontend',
      cwd: './admin-frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
{
  name: 'chatbot-python',
  cwd: '/home/sukokab/Chatbot-for-Diskominfo-with-NLP-and-Admin-Interface/python-bot',
  script: './start.sh',
  interpreter: 'bash',
  env: {
    PYTHONUNBUFFERED: '1',
    FLASK_RUN_PORT: '5000',
    PORT: '5000'
  },
  error_file: './error.log',
  out_file: './access.log',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  max_restarts: 10,
  min_uptime: '5s'
}
  ]
};
