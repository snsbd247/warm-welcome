#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Smart ISP — VPS Production Deployment Script (Ubuntu 22/24)
# ═══════════════════════════════════════════════════════════════
#
# Usage:
#   chmod +x deploy.sh
#   sudo ./deploy.sh
#
# This script:
#   1. Installs Nginx, PHP 8.2, MySQL 8, Node.js 20, Composer
#   2. Configures Nginx for wildcard + custom domains
#   3. Deploys Laravel backend + React frontend
#   4. Sets up SSL with Let's Encrypt (wildcard via Cloudflare DNS)
#   5. Configures systemd services and cron jobs
#
# ⚠️ Run as root or with sudo
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────
DOMAIN="smartispsolution.com"
APP_DIR="/var/www/smartisp"
BACKEND_DIR="${APP_DIR}/backend"
FRONTEND_DIR="${APP_DIR}/frontend"
DB_NAME="smartisp_db"
DB_USER="smartisp_user"
DB_PASS="$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32)"
PHP_VERSION="8.2"
NODE_VERSION="20"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
section() { echo -e "\n${CYAN}═══ $1 ═══${NC}\n"; }

# ── Pre-checks ────────────────────────────────────────────────
if [ "$EUID" -ne 0 ]; then
    err "Please run as root: sudo ./deploy.sh"
fi

section "1/8 — System Update"
apt update && apt upgrade -y
apt install -y software-properties-common curl wget git unzip acl ufw

# ── PHP 8.2 ───────────────────────────────────────────────────
section "2/8 — Installing PHP ${PHP_VERSION}"
add-apt-repository -y ppa:ondrej/php
apt update
apt install -y \
    php${PHP_VERSION}-fpm \
    php${PHP_VERSION}-cli \
    php${PHP_VERSION}-mysql \
    php${PHP_VERSION}-mbstring \
    php${PHP_VERSION}-xml \
    php${PHP_VERSION}-curl \
    php${PHP_VERSION}-zip \
    php${PHP_VERSION}-bcmath \
    php${PHP_VERSION}-gd \
    php${PHP_VERSION}-intl \
    php${PHP_VERSION}-redis \
    php${PHP_VERSION}-opcache \
    php${PHP_VERSION}-readline \
    php${PHP_VERSION}-tokenizer

# PHP-FPM tuning
cat > /etc/php/${PHP_VERSION}/fpm/pool.d/smartisp.conf << 'PHPPOOL'
[smartisp]
user = www-data
group = www-data
listen = /var/run/php/php8.2-fpm-smartisp.sock
listen.owner = www-data
listen.group = www-data
listen.mode = 0660

pm = dynamic
pm.max_children = 30
pm.start_servers = 5
pm.min_spare_servers = 3
pm.max_spare_servers = 10
pm.max_requests = 500
pm.process_idle_timeout = 10s

php_admin_value[error_log] = /var/log/php/smartisp-error.log
php_admin_value[memory_limit] = 256M
php_admin_value[upload_max_filesize] = 50M
php_admin_value[post_max_size] = 50M
php_admin_value[max_execution_time] = 120
PHPPOOL

mkdir -p /var/log/php
systemctl restart php${PHP_VERSION}-fpm
log "PHP ${PHP_VERSION} installed and configured"

# ── MySQL 8 ───────────────────────────────────────────────────
section "3/8 — Installing MySQL"
apt install -y mysql-server

systemctl start mysql
systemctl enable mysql

mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

log "MySQL configured — DB: ${DB_NAME}, User: ${DB_USER}"

# ── Node.js ───────────────────────────────────────────────────
section "4/8 — Installing Node.js ${NODE_VERSION}"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs
npm install -g npm@latest
log "Node.js $(node -v) + npm $(npm -v) installed"

# ── Composer ──────────────────────────────────────────────────
section "5/8 — Installing Composer"
if ! command -v composer &> /dev/null; then
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi
log "Composer $(composer --version --no-ansi 2>/dev/null | head -1) installed"

# ── Application Directory ────────────────────────────────────
section "6/8 — Setting Up Application"
mkdir -p ${APP_DIR}
mkdir -p ${BACKEND_DIR}
mkdir -p ${FRONTEND_DIR}/dist

# Create deployment helper script
cat > ${APP_DIR}/deploy-update.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
# ═══ Smart ISP — Update Deployment Script ═══
# Run after pulling new code: sudo ./deploy-update.sh

set -euo pipefail
APP_DIR="/var/www/smartisp"
BACKEND_DIR="${APP_DIR}/backend"
FRONTEND_DIR="${APP_DIR}/frontend"
PHP_VERSION="8.2"

echo "🔄 Deploying Smart ISP update..."

# Backend
cd ${BACKEND_DIR}
composer install --no-dev --optimize-autoloader --no-interaction
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link 2>/dev/null || true

# Frontend
cd ${FRONTEND_DIR}
npm ci --production=false
npm run build

# Copy frontend build to Nginx root
rsync -a --delete ${FRONTEND_DIR}/dist/ ${APP_DIR}/public_html/

# Permissions
chown -R www-data:www-data ${BACKEND_DIR}/storage ${BACKEND_DIR}/bootstrap/cache
chmod -R 775 ${BACKEND_DIR}/storage ${BACKEND_DIR}/bootstrap/cache

# Restart services
systemctl restart php${PHP_VERSION}-fpm
systemctl reload nginx

echo "✅ Deployment complete!"
DEPLOY_SCRIPT
chmod +x ${APP_DIR}/deploy-update.sh

# Create public_html for frontend
mkdir -p ${APP_DIR}/public_html

log "Application directories created"

# ── Nginx Configuration ──────────────────────────────────────
section "7/8 — Configuring Nginx"
apt install -y nginx

# Main server block — handles ALL domains (wildcard + custom)
cat > /etc/nginx/sites-available/smartisp << 'NGINXCONF'
# ═══════════════════════════════════════════════════════════════
# Smart ISP — Nginx Configuration
# Handles: *.smartispsolution.com + custom client domains
# ═══════════════════════════════════════════════════════════════

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# Upstream PHP-FPM
upstream php_fpm {
    server unix:/var/run/php/php8.2-fpm-smartisp.sock;
}

# ── HTTP → HTTPS Redirect ────────────────────────────────────
server {
    listen 80;
    server_name _;

    # Let's Encrypt challenge (keep accessible over HTTP)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }

    # Redirect everything else to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# ── Main HTTPS Server Block ──────────────────────────────────
server {
    listen 443 ssl http2;
    server_name _;

    # ── SSL (Cloudflare or Let's Encrypt) ─────────────────────
    # Replace with your actual certificate paths
    ssl_certificate     /etc/ssl/smartisp/fullchain.pem;
    ssl_certificate_key /etc/ssl/smartisp/privkey.pem;

    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # ── Roots ─────────────────────────────────────────────────
    # Frontend: React SPA
    root /var/www/smartisp/public_html;
    index index.html;

    # Request size
    client_max_body_size 50M;

    # ── Gzip Compression ──────────────────────────────────────
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # ── API Routes → Laravel Backend ──────────────────────────
    location /api {
        alias /var/www/smartisp/backend/public;

        # Rewrite /api/xxx to /index.php with the path
        location ~ ^/api/(.+\.php)$ {
            alias /var/www/smartisp/backend/public/$1;
            fastcgi_pass php_fpm;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
            fastcgi_param HTTP_HOST $host;

            # Rate limiting for API
            limit_req zone=api_limit burst=20 nodelay;
        }

        # All /api/* requests → Laravel's index.php
        location ~ ^/api(/.*)?$ {
            try_files $uri $uri/ @laravel_api;
        }
    }

    location @laravel_api {
        fastcgi_pass php_fpm;
        fastcgi_param SCRIPT_FILENAME /var/www/smartisp/backend/public/index.php;
        include fastcgi_params;
        fastcgi_param REQUEST_URI $request_uri;
        fastcgi_param HTTP_HOST $host;
        fastcgi_param HTTPS on;

        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;
    }

    # ── Login rate limiting ───────────────────────────────────
    location ~ ^/api/(admin/login|portal/login|customer/login) {
        limit_req zone=login_limit burst=3 nodelay;
        try_files $uri @laravel_api;
    }

    # ── Static assets caching ─────────────────────────────────
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # ── Laravel Storage (uploaded files) ──────────────────────
    location /storage {
        alias /var/www/smartisp/backend/storage/app/public;
        expires 7d;
        add_header Cache-Control "public";
    }

    # ── React SPA Fallback ────────────────────────────────────
    # All non-API, non-file requests → React's index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ── Block hidden files ────────────────────────────────────
    location ~ /\.(?!well-known) {
        deny all;
    }

    # ── PHP files in frontend root (deny) ─────────────────────
    location ~ \.php$ {
        deny all;
    }

    # ── Logs ──────────────────────────────────────────────────
    access_log /var/log/nginx/smartisp-access.log;
    error_log /var/log/nginx/smartisp-error.log;
}
NGINXCONF

# Enable site
ln -sf /etc/nginx/sites-available/smartisp /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Create SSL directory (placeholder)
mkdir -p /etc/ssl/smartisp

# Create self-signed cert for initial setup (replace with real cert)
if [ ! -f /etc/ssl/smartisp/fullchain.pem ]; then
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/smartisp/privkey.pem \
        -out /etc/ssl/smartisp/fullchain.pem \
        -subj "/CN=*.${DOMAIN}" 2>/dev/null
    warn "Self-signed SSL created — replace with real certificate!"
fi

# Create certbot webroot
mkdir -p /var/www/certbot

# Test Nginx config
nginx -t
systemctl restart nginx
systemctl enable nginx

log "Nginx configured for wildcard + custom domains"

# ── Firewall ──────────────────────────────────────────────────
section "8/8 — Firewall & Security"
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 3306/tcp  # MySQL (remove if not needed externally)

log "Firewall configured"

# ── Cron Jobs ─────────────────────────────────────────────────
# Laravel scheduler
(crontab -l 2>/dev/null; echo "* * * * * cd ${BACKEND_DIR} && php artisan schedule:run >> /dev/null 2>&1") | sort -u | crontab -

log "Cron jobs configured"

# ── Summary ───────────────────────────────────────────────────
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Smart ISP VPS Setup Complete!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${YELLOW}Database:${NC}"
echo -e "    DB Name:  ${DB_NAME}"
echo -e "    DB User:  ${DB_USER}"
echo -e "    DB Pass:  ${DB_PASS}"
echo ""
echo -e "  ${YELLOW}Directories:${NC}"
echo -e "    Backend:  ${BACKEND_DIR}"
echo -e "    Frontend: ${FRONTEND_DIR}"
echo -e "    Web Root: ${APP_DIR}/public_html"
echo ""
echo -e "  ${YELLOW}Next Steps:${NC}"
echo -e "    1. Clone your repos into ${BACKEND_DIR} and ${FRONTEND_DIR}"
echo -e "    2. Copy .env.example → .env and configure database credentials"
echo -e "    3. Run: sudo ${APP_DIR}/deploy-update.sh"
echo -e "    4. Set up SSL certificate (Cloudflare or Let's Encrypt)"
echo -e "    5. Point *.${DOMAIN} DNS to this server's IP"
echo ""
echo -e "  ${YELLOW}SSL Setup Options:${NC}"
echo -e "    A) Cloudflare (recommended): Use Full (Strict) SSL mode"
echo -e "    B) Let's Encrypt wildcard: certbot with DNS challenge"
echo ""
echo -e "  ${RED}⚠ SAVE THESE CREDENTIALS — they won't be shown again!${NC}"
echo ""

# Save credentials to file
cat > /root/.smartisp-credentials << EOF
Smart ISP — Server Credentials
Generated: $(date)
================================
Database: ${DB_NAME}
Username: ${DB_USER}
Password: ${DB_PASS}
================================
EOF
chmod 600 /root/.smartisp-credentials
log "Credentials saved to /root/.smartisp-credentials"
