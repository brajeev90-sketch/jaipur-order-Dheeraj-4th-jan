#!/bin/bash

# ============================================
# JAIPUR Furniture App - VPS Installation Script
# ============================================
# Run this script on a fresh Ubuntu 22.04 VPS
# Usage: sudo bash install.sh
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}JAIPUR Furniture App - VPS Installation${NC}"
echo -e "${GREEN}============================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (sudo bash install.sh)${NC}"
  exit 1
fi

# Get domain from user
read -p "Enter your domain (e.g., app.yourdomain.com): " DOMAIN
read -p "Enter your email for SSL certificate: " EMAIL
read -p "Enter GitHub repository URL: " GITHUB_REPO

echo -e "\n${YELLOW}Starting installation...${NC}\n"

# Update system
echo -e "${GREEN}[1/10] Updating system packages...${NC}"
apt update && apt upgrade -y

# Install essential tools
echo -e "${GREEN}[2/10] Installing essential tools...${NC}"
apt install -y git curl wget unzip software-properties-common build-essential

# Install Python 3.11
echo -e "${GREEN}[3/10] Installing Python 3.11...${NC}"
add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Install Node.js 18
echo -e "${GREEN}[4/10] Installing Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
npm install -g yarn

# Install MongoDB 6.0
echo -e "${GREEN}[5/10] Installing MongoDB 6.0...${NC}"
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Install Nginx
echo -e "${GREEN}[6/10] Installing Nginx...${NC}"
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Install Supervisor
echo -e "${GREEN}[7/10] Installing Supervisor...${NC}"
apt install -y supervisor

# Clone repository
echo -e "${GREEN}[8/10] Cloning repository...${NC}"
mkdir -p /var/www/jaipur-furniture
cd /var/www/jaipur-furniture
git clone $GITHUB_REPO .

# Generate JWT secret
JWT_SECRET=$(openssl rand -hex 32)

# Setup Backend
echo -e "${GREEN}[9/10] Setting up Backend...${NC}"
cd /var/www/jaipur-furniture/backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create backend .env
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=jaipur_furniture
JWT_SECRET=$JWT_SECRET
EOF

# Setup Frontend
echo -e "${GREEN}[9/10] Setting up Frontend...${NC}"
cd /var/www/jaipur-furniture/frontend
yarn install

# Create frontend .env
cat > .env << EOF
REACT_APP_BACKEND_URL=https://$DOMAIN
EOF

# Build frontend
yarn build

# Create log directory
mkdir -p /var/log/jaipur
chown -R www-data:www-data /var/log/jaipur
chown -R www-data:www-data /var/www/jaipur-furniture

# Configure Supervisor
echo -e "${GREEN}[10/10] Configuring services...${NC}"
cat > /etc/supervisor/conf.d/jaipur-backend.conf << EOF
[program:jaipur-backend]
command=/var/www/jaipur-furniture/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
directory=/var/www/jaipur-furniture/backend
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/jaipur/backend.err.log
stdout_logfile=/var/log/jaipur/backend.out.log
environment=MONGO_URL="mongodb://localhost:27017",DB_NAME="jaipur_furniture",JWT_SECRET="$JWT_SECRET"
EOF

supervisorctl reread
supervisorctl update
supervisorctl start jaipur-backend

# Configure Nginx
cat > /etc/nginx/sites-available/jaipur-furniture << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    root /var/www/jaipur-furniture/frontend/build;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        client_max_body_size 50M;
    }
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

ln -sf /etc/nginx/sites-available/jaipur-furniture /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# Setup SSL with Certbot
echo -e "${GREEN}Setting up SSL...${NC}"
apt install -y certbot python3-certbot-nginx
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL

# Configure Firewall
echo -e "${GREEN}Configuring firewall...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "\nYour JAIPUR Furniture App is now running at:"
echo -e "${YELLOW}https://$DOMAIN${NC}"
echo -e "\nDefault admin login:"
echo -e "Username: ${YELLOW}admin${NC}"
echo -e "Password: ${YELLOW}admin123${NC}"
echo -e "\n${RED}IMPORTANT: Change the admin password after first login!${NC}"
echo -e "\nUseful commands:"
echo -e "  View backend logs: ${YELLOW}sudo tail -f /var/log/jaipur/backend.err.log${NC}"
echo -e "  Restart backend:   ${YELLOW}sudo supervisorctl restart jaipur-backend${NC}"
echo -e "  Restart nginx:     ${YELLOW}sudo systemctl restart nginx${NC}"
