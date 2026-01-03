#!/bin/bash

# ============================================
# JAIPUR Furniture App - Backup Script
# ============================================
# Run this script to backup MongoDB data
# Usage: sudo bash backup.sh
# ============================================

set -e

# Configuration
BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}JAIPUR Furniture App - Backup${NC}"
echo -e "${GREEN}============================================${NC}"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB
echo -e "${YELLOW}Backing up MongoDB...${NC}"
mongodump --db jaipur_furniture --out $BACKUP_DIR/$DATE

# Compress backup
echo -e "${YELLOW}Compressing backup...${NC}"
cd $BACKUP_DIR
tar -czf jaipur_furniture_$DATE.tar.gz $DATE
rm -rf $DATE

# Remove old backups
echo -e "${YELLOW}Removing backups older than $RETENTION_DAYS days...${NC}"
find $BACKUP_DIR -name "jaipur_furniture_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}Backup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "Backup saved to: ${YELLOW}$BACKUP_DIR/jaipur_furniture_$DATE.tar.gz${NC}"
