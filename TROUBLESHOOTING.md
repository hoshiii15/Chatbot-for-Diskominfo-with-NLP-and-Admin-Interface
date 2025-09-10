# Troubleshooting Guide - FAQ Chatbot Admin Dashboard

This guide helps you diagnose and fix common issues when setting up or running the FAQ Chatbot Admin Dashboard system.

## 🔍 Quick Diagnosis

### Check System Status

```bash
# Check if all services are running
npm run dev

# Check individual service status
# Python Bot
curl http://localhost:5000/

# Backend API
curl http://localhost:3001/api/health

# Frontend
curl http://localhost:3000
```

---

## 🏗️ Setup Issues

### 1. Node.js Version Issues

**Problem**: `Error: Node.js version 18+ is required`

**Solution**:
```bash
# Check current version
node --version

# If version is < 18, install Node.js 18+ from https://nodejs.org/
# Or use nvm (Node Version Manager)
nvm install 18
nvm use 18
```

### 2. Python Dependencies Issues

**Problem**: `ModuleNotFoundError: No module named 'flask'`

**Solution**:
```bash
cd python-bot

# Create virtual environment (recommended)
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt
```

### 3. npm Install Failures

**Problem**: `npm ERR! ERESOLVE unable to resolve dependency tree`

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall with legacy peer deps
npm install --legacy-peer-deps

# Or use yarn
npm install -g yarn
yarn install
```

### 4. Permission Issues

**Problem**: `EACCES: permission denied`

**Solution**:
```bash
# Windows (Run PowerShell as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Linux/Mac
sudo chown -R $(whoami) ~/.npm
sudo chmod -R 755 /usr/local/lib/node_modules
```

---

## 🚀 Runtime Issues

### 1. Python Bot Not Starting

**Problem**: `ModuleNotFoundError` or `ImportError`

**Diagnosis**:
```bash
cd python-bot
python -c "import flask, nltk, sklearn; print('All modules available')"
```

**Solutions**:
```bash
# Missing NLTK data
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"

# Missing Python modules
pip install -r requirements.txt

# Check Python path
python -c "import sys; print(sys.path)"
```

### 2. Backend Connection Issues

**Problem**: `ECONNREFUSED` to Python bot

**Diagnosis**:
```bash
# Check if Python bot is running
curl http://localhost:5000/

# Check port availability
netstat -an | grep 5000  # Windows/Linux
lsof -i :5000            # Mac
```

**Solutions**:
```bash
# Ensure Python bot is running first
cd python-bot
python app.py

# Check firewall settings
# Windows: Allow Python through Windows Firewall
# Linux: sudo ufw allow 5000
```

### 3. Database Connection Issues

**Problem**: `SQLITE_CANTOPEN` or `Connection refused`

**Diagnosis**:
```bash
# Check if database file exists
ls -la admin-backend/database.sqlite

# Check database URL in .env
cat admin-backend/.env | grep DATABASE_URL
```

**Solutions**:
```bash
# Create database directory
mkdir -p admin-backend/data

# Fix permissions
chmod 755 admin-backend/
chmod 644 admin-backend/.env

# Reset database
rm admin-backend/database.sqlite
# Restart backend to recreate
```

### 4. Frontend Build Issues

**Problem**: `Module not found` or `Cannot resolve module`

**Diagnosis**:
```bash
cd admin-frontend
npm ls  # Check installed packages
```

**Solutions**:
```bash
# Clear Next.js cache
rm -rf .next/

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript configuration
npx tsc --noEmit
```

---

## 🔧 Environment Issues

### 1. Environment Variables Not Loading

**Problem**: Configuration not applied

**Diagnosis**:
```bash
# Check .env files exist
ls -la admin-backend/.env
ls -la admin-frontend/.env.local

# Verify environment variables
cd admin-backend
node -e "require('dotenv').config(); console.log(process.env.JWT_SECRET)"
```

**Solutions**:
```bash
# Create .env files from examples
cd admin-backend
cp .env.example .env

cd ../admin-frontend  
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# Restart services after changing .env
```

### 2. CORS Issues

**Problem**: `Access-Control-Allow-Origin` errors

**Diagnosis**:
```bash
# Check CORS configuration in backend
grep CORS_ORIGIN admin-backend/.env
```

**Solutions**:
```bash
# Update backend .env
echo "CORS_ORIGIN=http://localhost:3000" >> admin-backend/.env

# For development, allow all origins (not for production)
echo "CORS_ORIGIN=*" >> admin-backend/.env

# Restart backend
```

### 3. JWT Token Issues

**Problem**: `Invalid token` or `Token expired`

**Diagnosis**:
```bash
# Check JWT secret
grep JWT_SECRET admin-backend/.env

# Test token generation
cd admin-backend
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign({test: true}, 'your-secret');
console.log('Token:', token);
"
```

**Solutions**:
```bash
# Generate new JWT secret
cd admin-backend
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))" >> .env

# Clear browser storage and login again
# Or set longer expiry in .env
echo "JWT_EXPIRY=7d" >> .env
```

---

## 📁 File System Issues

### 1. FAQ Files Not Found

**Problem**: `FAQ file not found: faq_stunting.json`

**Diagnosis**:
```bash
# Check FAQ files exist
ls -la python-bot/data/
```

**Solutions**:
```bash
# Ensure FAQ files exist
cd python-bot/data/
ls -la *.json

# Check file permissions
chmod 644 *.json

# Verify JSON format
python -m json.tool faq_stunting.json
```

### 2. Log File Issues

**Problem**: Cannot read `bot.log`

**Diagnosis**:
```bash
# Check log file
ls -la python-bot/bot.log
tail python-bot/bot.log
```

**Solutions**:
```bash
# Create log file if missing
touch python-bot/bot.log
chmod 644 python-bot/bot.log

# Check log rotation
# If file is too large, archive it
mv python-bot/bot.log python-bot/bot.log.old
touch python-bot/bot.log
```

### 3. Backup Directory Issues

**Problem**: Cannot create backups

**Diagnosis**:
```bash
# Check backup directory
ls -la admin-backend/backups/
```

**Solutions**:
```bash
# Create backup directory
mkdir -p admin-backend/backups
chmod 755 admin-backend/backups

# Check disk space
df -h
```

---

## 🌐 Network Issues

### 1. Port Conflicts

**Problem**: `Port 3000 is already in use`

**Diagnosis**:
```bash
# Check what's using the port
netstat -tulpn | grep :3000  # Linux
netstat -an | findstr :3000  # Windows
lsof -i :3000               # Mac
```

**Solutions**:
```bash
# Kill process using port
# Linux/Mac
kill -9 $(lsof -t -i:3000)

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different ports
export PORT=3002  # Backend
# Update NEXT_PUBLIC_API_URL in frontend .env.local
```

### 2. Firewall Blocking

**Problem**: Services not accessible from other machines

**Solutions**:
```bash
# Windows Firewall
# Add inbound rules for ports 3000, 3001, 5000

# Linux UFW
sudo ufw allow 3000
sudo ufw allow 3001  
sudo ufw allow 5000

# Mac
# System Preferences > Security & Privacy > Firewall > Options
```

### 3. DNS/Host Issues

**Problem**: `localhost` not resolving

**Solutions**:
```bash
# Check hosts file
# Windows: C:\Windows\System32\drivers\etc\hosts
# Linux/Mac: /etc/hosts

# Should contain:
127.0.0.1 localhost

# Use IP address instead
curl http://127.0.0.1:3001/api/health
```

---

## 🐳 Docker Issues

### 1. Docker Build Failures

**Problem**: `docker build` fails

**Diagnosis**:
```bash
# Check Docker installation
docker --version
docker-compose --version

# Check Docker daemon
docker ps
```

**Solutions**:
```bash
# Clean Docker cache
docker system prune -a

# Build with no cache
docker-compose build --no-cache

# Check Dockerfile syntax
docker build -t test admin-backend/
```

### 2. Container Communication Issues

**Problem**: Services can't communicate in Docker

**Diagnosis**:
```bash
# Check container status
docker-compose ps

# Check network
docker network ls
docker network inspect faq-chatbot-system_chatbot-network
```

**Solutions**:
```bash
# Restart with fresh network
docker-compose down
docker network prune
docker-compose up

# Check service names in docker-compose.yml
# Use service names as hostnames (e.g., python-bot:5000)
```

### 3. Volume Mount Issues

**Problem**: Files not syncing between host and container

**Solutions**:
```bash
# Check volume mounts in docker-compose.yml
# Ensure paths are correct and permissions allow access

# On Windows, ensure drive sharing is enabled in Docker Desktop
# On Linux, check SELinux contexts if applicable
```

---

## 💾 Data Issues

### 1. FAQ Data Corruption

**Problem**: Invalid JSON or data structure

**Diagnosis**:
```bash
# Validate JSON
python -m json.tool python-bot/data/faq_stunting.json

# Check data structure
node -e "
const data = require('./python-bot/data/faq_stunting.json');
console.log('FAQs count:', data.faqs.length);
console.log('First FAQ:', data.faqs[0]);
"
```

**Solutions**:
```bash
# Restore from backup
cp admin-backend/backups/faq_stunting_backup_*.json python-bot/data/faq_stunting.json

# Or reset to default structure
echo '{
  "faqs": [
    {
      "id": 1,
      "questions": ["test question"],
      "answer": "test answer",
      "category": "test"
    }
  ]
}' > python-bot/data/faq_stunting.json
```

### 2. Database Corruption

**Problem**: SQLite database errors

**Solutions**:
```bash
# Backup current database
cp admin-backend/database.sqlite admin-backend/database.sqlite.backup

# Check database integrity
sqlite3 admin-backend/database.sqlite "PRAGMA integrity_check;"

# Reset database
rm admin-backend/database.sqlite
# Restart backend to recreate
```

---

## 🔍 Debugging Tools

### 1. Enable Debug Mode

```bash
# Backend debug
cd admin-backend
DEBUG=* npm run dev

# Frontend debug
cd admin-frontend
DEBUG=* npm run dev

# Python debug
cd python-bot
FLASK_DEBUG=1 python app.py
```

### 2. Log Analysis

```bash
# View backend logs
tail -f admin-backend/logs/combined.log

# View Python bot logs
tail -f python-bot/bot.log

# View system logs (Linux)
journalctl -f -u your-service-name
```

### 3. Network Debugging

```bash
# Test API endpoints
curl -v http://localhost:3001/api/health

# Test WebSocket connection
npm install -g wscat
wscat -c ws://localhost:3001

# Check network traffic
# Use browser dev tools Network tab
# Or tools like Wireshark for deep debugging
```

---

## 🆘 Getting Help

### 1. Check Logs First

Always check the relevant log files:
- Backend: `admin-backend/logs/`
- Frontend: Browser console (F12)
- Python: `python-bot/bot.log`

### 2. Common Log Patterns

**Connection Refused**:
```
Error: connect ECONNREFUSED 127.0.0.1:5000
```
→ Python bot is not running

**Module Not Found**:
```
Error: Cannot find module 'express'
```
→ Dependencies not installed

**Permission Denied**:
```
Error: EACCES: permission denied
```
→ File permission issues

### 3. Documentation Resources

- [Main README](README.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Setup Script](setup.ps1)

### 4. Support Channels

- **GitHub Issues**: For bugs and feature requests
- **Email**: admin@diskominfo.go.id
- **Documentation**: Check inline code comments

---

## 🔄 Recovery Procedures

### Complete System Reset

If everything fails, follow these steps:

```bash
# 1. Stop all services
pkill -f "node\|python\|npm"

# 2. Clean installation
rm -rf node_modules admin-backend/node_modules admin-frontend/node_modules
rm -rf admin-backend/logs admin-backend/database.sqlite
rm -rf admin-frontend/.next

# 3. Reinstall
npm run setup

# 4. Reset configuration
cp admin-backend/.env.example admin-backend/.env
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > admin-frontend/.env.local

# 5. Restart services
npm run dev
```

### Backup and Restore

```bash
# Create backup
tar -czf faq-system-backup.tar.gz \
  python-bot/data/ \
  admin-backend/database.sqlite \
  admin-backend/.env \
  admin-frontend/.env.local

# Restore backup
tar -xzf faq-system-backup.tar.gz
```

---

**Remember**: Most issues are related to environment setup, file permissions, or service startup order. Always check the basics first!
