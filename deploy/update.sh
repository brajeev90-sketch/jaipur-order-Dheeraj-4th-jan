#!/bin/bash

# ============================================
# JAIPUR Furniture App - Update Script
# ============================================
# Run this script to update the application
# Usage: sudo bash update.sh
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}JAIPUR Furniture App - Update${NC}"
echo -e "${GREEN}============================================${NC}"

cd /var/www/jaipur-furniture

# Pull latest changes
echo -e "${YELLOW}Pulling latest changes from GitHub...${NC}"
git pull origin main

# Update backend
echo -e "${YELLOW}Updating backend...${NC}"
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate

# Restart backend
echo -e "${YELLOW}Restarting backend...${NC}"
sudo supervisorctl restart jaipur-backend

# Update frontend
echo -e "${YELLOW}Updating frontend...${NC}"
cd ../frontend
yarn install
yarn build

# Reload nginx
echo -e "${YELLOW}Reloading Nginx...${NC}"
sudo systemctl reload nginx

echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}Update Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
