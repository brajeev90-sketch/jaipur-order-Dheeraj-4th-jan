#!/bin/bash

# ============================================
# JAIPUR Furniture App - Status Check Script
# ============================================
# Run this script to check all services status
# Usage: bash status.sh
# ============================================

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}JAIPUR Furniture App - Status Check${NC}"
echo -e "${GREEN}============================================${NC}\n"

# Check MongoDB
echo -e "${YELLOW}MongoDB Status:${NC}"
if systemctl is-active --quiet mongod; then
    echo -e "  ${GREEN}✓ MongoDB is running${NC}"
else
    echo -e "  ${RED}✗ MongoDB is NOT running${NC}"
fi

# Check Backend
echo -e "\n${YELLOW}Backend Status:${NC}"
if sudo supervisorctl status jaipur-backend | grep -q "RUNNING"; then
    echo -e "  ${GREEN}✓ Backend is running${NC}"
else
    echo -e "  ${RED}✗ Backend is NOT running${NC}"
fi

# Check Nginx
echo -e "\n${YELLOW}Nginx Status:${NC}"
if systemctl is-active --quiet nginx; then
    echo -e "  ${GREEN}✓ Nginx is running${NC}"
else
    echo -e "  ${RED}✗ Nginx is NOT running${NC}"
fi

# Check port 8001 (backend)
echo -e "\n${YELLOW}Port Check:${NC}"
if netstat -tlnp 2>/dev/null | grep -q ":8001"; then
    echo -e "  ${GREEN}✓ Backend port 8001 is listening${NC}"
else
    echo -e "  ${RED}✗ Backend port 8001 is NOT listening${NC}"
fi

# Check port 80/443 (nginx)
if netstat -tlnp 2>/dev/null | grep -q ":80"; then
    echo -e "  ${GREEN}✓ HTTP port 80 is listening${NC}"
else
    echo -e "  ${RED}✗ HTTP port 80 is NOT listening${NC}"
fi

if netstat -tlnp 2>/dev/null | grep -q ":443"; then
    echo -e "  ${GREEN}✓ HTTPS port 443 is listening${NC}"
else
    echo -e "  ${RED}✗ HTTPS port 443 is NOT listening${NC}"
fi

# Disk usage
echo -e "\n${YELLOW}Disk Usage:${NC}"
df -h / | tail -1 | awk '{print "  Used: " $3 " / " $2 " (" $5 ")"}'

# Memory usage
echo -e "\n${YELLOW}Memory Usage:${NC}"
free -h | grep Mem | awk '{print "  Used: " $3 " / " $2}'

echo -e "\n${GREEN}============================================${NC}"
