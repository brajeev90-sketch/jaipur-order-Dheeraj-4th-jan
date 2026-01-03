# JAIPUR Furniture App - Deployment Scripts

This folder contains deployment scripts for Hostinger VPS.

## Files

| File | Description |
|------|-------------|
| `install.sh` | Full installation script for fresh VPS |
| `update.sh` | Update application from GitHub |
| `backup.sh` | Backup MongoDB database |
| `status.sh` | Check all services status |

## Quick Start

### 1. First-time Installation

```bash
# Upload install.sh to your VPS or copy its content
# Then run:
sudo bash install.sh
```

The script will ask for:
- Your domain name
- Email for SSL certificate
- GitHub repository URL

### 2. Update Application

```bash
sudo bash update.sh
```

### 3. Backup Database

```bash
sudo bash backup.sh
```

### 4. Check Status

```bash
bash status.sh
```

## Default Credentials

- **Username:** admin
- **Password:** admin123

⚠️ **Change the password after first login!**

## Useful Commands

```bash
# View backend logs
sudo tail -f /var/log/jaipur/backend.err.log

# Restart backend
sudo supervisorctl restart jaipur-backend

# Restart nginx
sudo systemctl restart nginx

# Restart MongoDB
sudo systemctl restart mongod
```
