# Smart ISP — VPS Production Deployment Guide

## 🖥️ Server Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| CPU | 2 vCPU | 4 vCPU |
| RAM | 2 GB | 4 GB |
| Storage | 20 GB SSD | 50 GB SSD |
| PHP | 8.2 | 8.2+ |
| MySQL | 8.0 | 8.0+ |
| Node.js | 18 | 20 LTS |

---

## 🚀 Quick Start

### Step 1: Initial Server Setup

```bash
# SSH into your VPS
ssh root@your-server-ip

# Download and run setup script
wget https://raw.githubusercontent.com/your-repo/deploy/vps-setup.sh
chmod +x vps-setup.sh
sudo ./vps-setup.sh
```

This installs: Nginx, PHP 8.2, MySQL 8, Node.js 20, Composer

### Step 2: Clone & Configure

```bash
# Clone backend
cd /var/www/smartisp
git clone https://github.com/your-org/ISP-Backend.git backend

# Clone frontend
git clone https://github.com/your-org/smart-isp-frontend.git frontend
```

### Step 3: Configure Backend .env

```bash
cd /var/www/smartisp/backend
cp .env.example .env
nano .env
```

Set these values:
```env
APP_NAME="Smart ISP"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://smartispapp.com/api
APP_TIMEZONE=Asia/Dhaka

FRONTEND_URL=https://smartispapp.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=smartisp_db
DB_USER=smartisp_user
DB_PASSWORD=<password from setup>

# Multi-Tenant
CENTRAL_DOMAINS=smartispapp.com,www.smartispapp.com
SERVER_IP=<your-vps-ip>

SESSION_DRIVER=database
CACHE_STORE=database
LOG_CHANNEL=single
LOG_LEVEL=error
```

### Step 4: Deploy

```bash
sudo /var/www/smartisp/deploy-update.sh
```

---

## 🌐 DNS Configuration

### Wildcard Subdomain (*.smartispapp.com)

Add these DNS records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `YOUR_SERVER_IP` | 300 |
| A | * | `YOUR_SERVER_IP` | 300 |
| A | www | `YOUR_SERVER_IP` | 300 |

### Client Custom Domain

When a client (e.g., Sariul Net Bazar) wants `billing.sariulnetbazar.com`:

**Client does:**
| Type | Name | Value |
|------|------|-------|
| A | billing | `YOUR_SERVER_IP` |

**Or CNAME:**
| Type | Name | Value |
|------|------|-------|
| CNAME | billing | `smartispapp.com` |

**Admin does:**
- Go to Settings → Domain Management
- Add `billing.sariulnetbazar.com`
- Click Verify

---

## 🔒 SSL Configuration

### Option A: Cloudflare (Recommended)

1. Add domain to Cloudflare
2. Set SSL mode to **Full (Strict)**
3. Enable **Always Use HTTPS**
4. Cloudflare auto-handles wildcard SSL

### Option B: Let's Encrypt Wildcard

```bash
# Install certbot
apt install certbot python3-certbot-nginx python3-certbot-dns-cloudflare

# For Cloudflare DNS challenge (wildcard)
certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /root/.cloudflare.ini \
  -d smartispapp.com \
  -d "*.smartispapp.com"

# Update Nginx SSL paths
nano /etc/nginx/sites-available/smartisp
# Change ssl_certificate paths to:
#   /etc/letsencrypt/live/smartispapp.com/fullchain.pem
#   /etc/letsencrypt/live/smartispapp.com/privkey.pem

nginx -t && systemctl reload nginx
```

### For Client Custom Domains (individual certs)

```bash
# Issue cert for a custom domain
certbot certonly --nginx -d billing.sariulnetbazar.com

# Auto-renewal is handled by certbot timer
systemctl status certbot.timer
```

---

## 📁 Directory Structure

```
/var/www/smartisp/
├── backend/              ← Laravel backend (ISP-Backend)
│   ├── public/           ← Laravel public (API entry)
│   ├── storage/
│   └── .env
├── frontend/             ← React source code
│   ├── src/
│   ├── dist/             ← Build output
│   └── package.json
├── public_html/          ← Nginx web root (synced from dist/)
│   ├── index.html
│   └── assets/
└── deploy-update.sh      ← Update deployment script
```

---

## 🔄 Updating Production

After pushing changes to Git:

```bash
cd /var/www/smartisp

# Pull latest code
cd backend && git pull origin main && cd ..
cd frontend && git pull origin main && cd ..

# Run deploy script
sudo ./deploy-update.sh
```

---

## 📊 Monitoring

### Check Logs

```bash
# Nginx logs
tail -f /var/log/nginx/smartisp-error.log

# PHP-FPM logs
tail -f /var/log/php/smartisp-error.log

# Laravel logs
tail -f /var/www/smartisp/backend/storage/logs/laravel.log
```

### Service Status

```bash
systemctl status nginx
systemctl status php8.2-fpm
systemctl status mysql
```

---

## 🛡️ Security Checklist

- [x] UFW firewall enabled (ports 22, 80, 443)
- [x] PHP-FPM runs as www-data
- [x] Nginx security headers
- [x] Rate limiting on API and login
- [x] MySQL with strong password
- [x] SSL/TLS enforced
- [ ] Set up fail2ban: `apt install fail2ban`
- [ ] Disable root SSH login
- [ ] Set up SSH key authentication
- [ ] Regular backups (MySQL + storage)

---

## 🔧 Troubleshooting

| Issue | Fix |
|-------|-----|
| 502 Bad Gateway | `systemctl restart php8.2-fpm` |
| Permission denied | `chown -R www-data:www-data storage bootstrap/cache` |
| API 404 | Check Nginx `@laravel_api` block, run `php artisan route:cache` |
| Tenant not found | Check `domains` table and `CENTRAL_DOMAINS` env |
| SSL error | Verify cert paths in Nginx config |
