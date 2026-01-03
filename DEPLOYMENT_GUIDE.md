# 🚀 JAIPUR Furniture App - Hostinger VPS Deployment Guide

This guide will help you deploy your JAIPUR Furniture application on a Hostinger VPS server.

## 📋 Prerequisites

### VPS Requirements
- **OS:** Ubuntu 22.04 LTS (recommended)
- **RAM:** Minimum 2GB (4GB recommended)
- **Storage:** Minimum 20GB SSD
- **CPU:** 1 vCPU minimum (2 vCPU recommended)

### Domain Setup
- Point your domain (e.g., `app.yourdomain.com`) to your VPS IP address
- Create an A record in your DNS settings

---

## 🔧 Step 1: Initial Server Setup

### 1.1 Connect to your VPS
```bash
ssh root@your-vps-ip
```

### 1.2 Update system packages
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Create a non-root user (recommended)
```bash
adduser jaipur
usermod -aG sudo jaipur
su - jaipur
```

### 1.4 Install essential tools
```bash
sudo apt install -y git curl wget unzip software-properties-common
```

---

## 🐍 Step 2: Install Python 3.11

```bash
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Verify installation
python3.11 --version
```

---

## 📦 Step 3: Install Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Yarn
sudo npm install -g yarn

# Verify installation
node --version
yarn --version
```

---

## 🍃 Step 4: Install MongoDB 6.0

```bash
# Import MongoDB GPG key
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

### 4.1 Secure MongoDB (Optional but recommended)
```bash
# Connect to MongoDB
mongosh

# Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "your_secure_password",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

# Create app database user
use jaipur_furniture
db.createUser({
  user: "jaipur_app",
  pwd: "your_app_password",
  roles: [ { role: "readWrite", db: "jaipur_furniture" } ]
})

exit
```

---

## 🌐 Step 5: Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
```

---

## 📂 Step 6: Clone and Setup Application

### 6.1 Create application directory
```bash
sudo mkdir -p /var/www/jaipur-furniture
sudo chown -R $USER:$USER /var/www/jaipur-furniture
cd /var/www/jaipur-furniture
```

### 6.2 Clone repository from GitHub
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
```

### 6.3 Setup Backend
```bash
cd /var/www/jaipur-furniture/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=jaipur_furniture
JWT_SECRET=your_super_secret_jwt_key_change_this
EOF

# Test backend
python -c "from server import app; print('Backend OK!')"
```

### 6.4 Setup Frontend
```bash
cd /var/www/jaipur-furniture/frontend

# Install dependencies
yarn install

# Create production .env
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://your-domain.com
EOF

# Build for production
yarn build
```

---

## ⚙️ Step 7: Configure Process Manager (Supervisor)

### 7.1 Install Supervisor
```bash
sudo apt install -y supervisor
```

### 7.2 Create Backend Service Configuration
```bash
sudo cat > /etc/supervisor/conf.d/jaipur-backend.conf << 'EOF'
[program:jaipur-backend]
command=/var/www/jaipur-furniture/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
directory=/var/www/jaipur-furniture/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/jaipur/backend.err.log
stdout_logfile=/var/log/jaipur/backend.out.log
environment=MONGO_URL="mongodb://localhost:27017",DB_NAME="jaipur_furniture",JWT_SECRET="your_super_secret_jwt_key"
EOF
```

### 7.3 Create log directory and start services
```bash
sudo mkdir -p /var/log/jaipur
sudo chown -R www-data:www-data /var/log/jaipur
sudo chown -R www-data:www-data /var/www/jaipur-furniture

sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start jaipur-backend
```

---

## 🔒 Step 8: Configure Nginx

### 8.1 Create Nginx configuration
```bash
sudo cat > /etc/nginx/sites-available/jaipur-furniture << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Frontend (React build)
    root /var/www/jaipur-furniture/frontend/build;
    index index.html;
    
    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        client_max_body_size 50M;
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF
```

### 8.2 Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/jaipur-furniture /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

---

## 🔐 Step 9: Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is set up automatically
# Test renewal
sudo certbot renew --dry-run
```

---

## 🔥 Step 10: Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## ✅ Step 11: Verify Deployment

### Check all services are running:
```bash
# Check MongoDB
sudo systemctl status mongod

# Check Backend
sudo supervisorctl status jaipur-backend

# Check Nginx
sudo systemctl status nginx

# Check logs
sudo tail -f /var/log/jaipur/backend.err.log
sudo tail -f /var/log/nginx/error.log
```

### Test API endpoint:
```bash
curl -X GET https://your-domain.com/api/health
```

---

## 🔄 Updating the Application

```bash
cd /var/www/jaipur-furniture

# Pull latest changes
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo supervisorctl restart jaipur-backend

# Update frontend
cd ../frontend
yarn install
yarn build

# Reload Nginx
sudo systemctl reload nginx
```

---

## 📊 Monitoring & Maintenance

### View logs
```bash
# Backend logs
sudo tail -100 /var/log/jaipur/backend.err.log
sudo tail -100 /var/log/jaipur/backend.out.log

# Nginx logs
sudo tail -100 /var/log/nginx/access.log
sudo tail -100 /var/log/nginx/error.log
```

### Restart services
```bash
sudo supervisorctl restart jaipur-backend
sudo systemctl restart nginx
sudo systemctl restart mongod
```

### Backup MongoDB
```bash
mongodump --db jaipur_furniture --out /backup/mongodb/$(date +%Y%m%d)
```

---

## 🆘 Troubleshooting

### Backend not starting
```bash
# Check logs
sudo tail -50 /var/log/jaipur/backend.err.log

# Test manually
cd /var/www/jaipur-furniture/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
```

### MongoDB connection issues
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -50 /var/log/mongodb/mongod.log
```

### Nginx 502 Bad Gateway
```bash
# Backend might not be running
sudo supervisorctl status jaipur-backend

# Check if port 8001 is listening
sudo netstat -tlnp | grep 8001
```

---

## 📞 Support

For issues specific to:
- **Hostinger VPS:** Contact Hostinger support
- **Application bugs:** Check GitHub issues or contact developer
- **MongoDB:** Check MongoDB documentation

---

**Happy Deploying! 🎉**
