#!/bin/bash
# ══════════════════════════════════════════════════════════
# Smart ISP - Production Deployment Script
# Usage: bash deploy.sh
# ══════════════════════════════════════════════════════════

set -e

APP_DIR="/var/www/smartispapp.com/api"
FRONTEND_DIR="/var/www/smartispapp.com/frontend"

echo "═══════════════════════════════════════════"
echo "  Smart ISP - Production Deploy"
echo "═══════════════════════════════════════════"

cd "$APP_DIR"

# ── 1. Maintenance mode ──────────────────────────────
echo "🔧 Enabling maintenance mode..."
php artisan down --retry=60 2>/dev/null || true

# ── 2. Install dependencies ──────────────────────────
echo "📦 Installing dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

# ── 3. Run migrations ────────────────────────────────
echo "🗄️ Running migrations..."
php artisan migrate --force

# ── 4. Cache everything ──────────────────────────────
echo "⚡ Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# ── 5. Storage link ──────────────────────────────────
echo "🔗 Storage link..."
php artisan storage:link 2>/dev/null || true

# ── 6. Create backup directories ─────────────────────
echo "📁 Ensuring backup directories..."
mkdir -p storage/app/backups/full
mkdir -p storage/app/backups/tenants

# ── 7. Permissions ───────────────────────────────────
echo "🔒 Setting permissions..."
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
find storage -type f -exec chmod 664 {} \;
find storage -type d -exec chmod 775 {} \;

# ── 8. Restart services ─────────────────────────────
echo "🔄 Restarting services..."
if systemctl is-active --quiet php8.2-fpm; then
    systemctl restart php8.2-fpm
fi
if systemctl is-active --quiet nginx; then
    systemctl reload nginx
fi

# ── 9. Bring back online ────────────────────────────
echo "✅ Going live..."
php artisan up

echo ""
echo "═══════════════════════════════════════════"
echo "✅ Deployment complete!"
echo ""
echo "Verify:"
echo "  curl -s https://smartispapp.com/api/api/health | python3 -m json.tool"
echo "═══════════════════════════════════════════"
