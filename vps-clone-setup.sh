#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# Smart ISP — VPS Clone & Setup Script
# ═══════════════════════════════════════════════════════════════════
#
# এই স্ক্রিপ্ট GitHub থেকে ক্লোন করার পর VPS-এ সঠিক ফোল্ডারে
# ফাইলগুলো কপি করে দেয়।
#
# Usage:
#   git clone https://github.com/YOUR_ORG/YOUR_REPO.git /tmp/smartisp-repo
#   cd /tmp/smartisp-repo
#   sudo bash vps-clone-setup.sh
#
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="/var/www/smartisp"
BACKEND_DIR="${APP_DIR}/backend"
FRONTEND_DIR="${APP_DIR}/frontend"

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   Smart ISP — VPS Clone & Setup                         ║"
echo "║   GitHub Repo → VPS ফোল্ডার ম্যাপিং                     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ── Verify repo structure ─────────────────────────────────────
if [ ! -d "${REPO_DIR}/ISP-Backend" ] || [ ! -d "${REPO_DIR}/src" ]; then
    echo -e "${RED}✗ Error: ISP-Backend/ বা src/ ফোল্ডার পাওয়া যায়নি!${NC}"
    echo "  এই স্ক্রিপ্ট রিপোজিটরির রুট থেকে রান করুন।"
    exit 1
fi

echo -e "${YELLOW}Repo directory:${NC} ${REPO_DIR}"
echo -e "${YELLOW}Target directory:${NC} ${APP_DIR}"
echo ""

# ── Create directories ────────────────────────────────────────
echo -e "${CYAN}[1/6] ডিরেক্টরি তৈরি করছি...${NC}"
mkdir -p ${BACKEND_DIR}
mkdir -p ${FRONTEND_DIR}
mkdir -p ${APP_DIR}/public_html
echo -e "${GREEN}  ✓ /var/www/smartisp/{backend,frontend,public_html} তৈরি হয়েছে${NC}"

# ═══════════════════════════════════════════════════════════════
# BACKEND ফাইল ম্যাপিং
# GitHub: ISP-Backend/*  →  VPS: /var/www/smartisp/backend/
# ═══════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}[2/6] Backend ফাইল কপি করছি...${NC}"
echo -e "${YELLOW}  ISP-Backend/ → ${BACKEND_DIR}/${NC}"

# ISP-Backend/ এর সব ফাইল backend/ এ কপি
rsync -a --exclude='.git' \
    "${REPO_DIR}/ISP-Backend/" "${BACKEND_DIR}/"

echo -e "${GREEN}  ✓ Backend ফাইল কপি সম্পন্ন${NC}"
echo ""
echo -e "  কপি হওয়া ফোল্ডার/ফাইলগুলো:"
echo -e "    ISP-Backend/app/          → backend/app/"
echo -e "    ISP-Backend/bootstrap/    → backend/bootstrap/"
echo -e "    ISP-Backend/config/       → backend/config/"
echo -e "    ISP-Backend/database/     → backend/database/"
echo -e "    ISP-Backend/public/       → backend/public/"
echo -e "    ISP-Backend/resources/    → backend/resources/"
echo -e "    ISP-Backend/routes/       → backend/routes/"
echo -e "    ISP-Backend/storage/      → backend/storage/"
echo -e "    ISP-Backend/tests/        → backend/tests/"
echo -e "    ISP-Backend/.env.example  → backend/.env.example"
echo -e "    ISP-Backend/artisan       → backend/artisan"
echo -e "    ISP-Backend/composer.json → backend/composer.json"
echo -e "    ISP-Backend/deploy/       → backend/deploy/"
echo -e "    ISP-Backend/deploy.sh     → backend/deploy.sh"
echo -e "    ISP-Backend/setup.sh      → backend/setup.sh"

# ═══════════════════════════════════════════════════════════════
# FRONTEND ফাইল ম্যাপিং
# GitHub Root: src/, public/, package.json, etc  →  VPS: /var/www/smartisp/frontend/
# ═══════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}[3/6] Frontend ফাইল কপি করছি...${NC}"
echo -e "${YELLOW}  Root files → ${FRONTEND_DIR}/${NC}"

# Frontend ফাইলগুলোর তালিকা (রুট থেকে)
FRONTEND_DIRS=("src" "public" "supabase")
FRONTEND_FILES=(
    "package.json"
    "package-lock.json"
    "vite.config.ts"
    "tsconfig.json"
    "tsconfig.app.json"
    "tsconfig.node.json"
    "tailwind.config.ts"
    "postcss.config.js"
    "index.html"
    "components.json"
    "eslint.config.js"
    "vitest.config.ts"
    ".env"
    ".env.production"
)

# ফোল্ডার কপি
for dir in "${FRONTEND_DIRS[@]}"; do
    if [ -d "${REPO_DIR}/${dir}" ]; then
        rsync -a "${REPO_DIR}/${dir}/" "${FRONTEND_DIR}/${dir}/"
        echo -e "    ${dir}/           → frontend/${dir}/"
    fi
done

# ফাইল কপি
for file in "${FRONTEND_FILES[@]}"; do
    if [ -f "${REPO_DIR}/${file}" ]; then
        cp "${REPO_DIR}/${file}" "${FRONTEND_DIR}/${file}"
        echo -e "    ${file}  → frontend/${file}"
    fi
done

# bun.lock কপি (যদি থাকে)
for lockfile in "bun.lock" "bun.lockb"; do
    if [ -f "${REPO_DIR}/${lockfile}" ]; then
        cp "${REPO_DIR}/${lockfile}" "${FRONTEND_DIR}/${lockfile}"
        echo -e "    ${lockfile}  → frontend/${lockfile}"
    fi
done

echo -e "${GREEN}  ✓ Frontend ফাইল কপি সম্পন্ন${NC}"

# ═══════════════════════════════════════════════════════════════
# DEPLOY SCRIPTS
# ═══════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}[4/6] Deploy স্ক্রিপ্ট সেটআপ...${NC}"

# deploy-update.sh রুটে কপি
if [ -f "${BACKEND_DIR}/deploy/deploy-update.sh" ]; then
    cp "${BACKEND_DIR}/deploy/deploy-update.sh" "${APP_DIR}/deploy-update.sh"
    chmod +x "${APP_DIR}/deploy-update.sh"
    echo -e "    deploy/deploy-update.sh → ${APP_DIR}/deploy-update.sh"
fi

# deploy.sh executable
chmod +x "${BACKEND_DIR}/deploy.sh" 2>/dev/null || true
chmod +x "${BACKEND_DIR}/setup.sh" 2>/dev/null || true

echo -e "${GREEN}  ✓ Deploy স্ক্রিপ্ট সেটআপ সম্পন্ন${NC}"

# ═══════════════════════════════════════════════════════════════
# NGINX CONFIG
# ═══════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}[5/6] Nginx কনফিগারেশন...${NC}"

if [ -f "${BACKEND_DIR}/deploy/nginx-smartispapp.conf" ]; then
    cp "${BACKEND_DIR}/deploy/nginx-smartispapp.conf" \
       /etc/nginx/sites-available/smartispapp.com 2>/dev/null || true
    ln -sf /etc/nginx/sites-available/smartispapp.com \
       /etc/nginx/sites-enabled/ 2>/dev/null || true
    rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
    echo -e "${GREEN}  ✓ Nginx কনফিগ কপি হয়েছে${NC}"
else
    echo -e "${YELLOW}  ⚠ nginx-smartispapp.conf পাওয়া যায়নি${NC}"
fi

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}[6/6] ফাইনাল চেক...${NC}"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Clone & Setup Complete!                             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}VPS ডিরেক্টরি স্ট্রাকচার:${NC}"
echo ""
echo -e "  /var/www/smartisp/"
echo -e "  ├── backend/              ← Laravel Backend"
echo -e "  │   ├── app/"
echo -e "  │   ├── config/"
echo -e "  │   ├── database/"
echo -e "  │   ├── deploy/"
echo -e "  │   │   ├── vps-setup.sh"
echo -e "  │   │   ├── deploy-update.sh"
echo -e "  │   │   ├── nginx-smartispapp.conf"
echo -e "  │   │   ├── .env.production"
echo -e "  │   │   └── smartisp-queue.service"
echo -e "  │   ├── public/"
echo -e "  │   ├── routes/"
echo -e "  │   ├── storage/"
echo -e "  │   ├── .env.example"
echo -e "  │   ├── artisan"
echo -e "  │   ├── composer.json"
echo -e "  │   ├── deploy.sh"
echo -e "  │   └── setup.sh"
echo -e "  ├── frontend/             ← React Frontend"
echo -e "  │   ├── src/"
echo -e "  │   ├── public/"
echo -e "  │   ├── index.html"
echo -e "  │   ├── package.json"
echo -e "  │   ├── vite.config.ts"
echo -e "  │   ├── tailwind.config.ts"
echo -e "  │   └── tsconfig.json"
echo -e "  ├── public_html/          ← Nginx root (build output)"
echo -e "  └── deploy-update.sh      ← Full update script"
echo ""
echo -e "  ${YELLOW}Next Steps:${NC}"
echo -e "    1. Backend সেটাপ:"
echo -e "       cd ${BACKEND_DIR}"
echo -e "       cp deploy/.env.production .env"
echo -e "       nano .env   # DB_PASSWORD সেট করুন"
echo -e "       php artisan key:generate"
echo -e "       composer install --no-dev --optimize-autoloader"
echo -e "       php artisan migrate --force"
echo -e "       php artisan db:seed --class=DefaultSeeder --force"
echo -e "       php artisan db:seed --class=GeoSeeder --force"
echo -e "       php artisan storage:link"
echo -e ""
echo -e "    2. Frontend বিল্ড:"
echo -e "       cd ${FRONTEND_DIR}"
echo -e "       npm ci"
echo -e "       VITE_DEPLOY_TARGET=vps npm run build"
echo -e "       rsync -a --delete dist/ ${APP_DIR}/public_html/"
echo -e ""
echo -e "    3. Permissions:"
echo -e "       chown -R www-data:www-data ${APP_DIR}"
echo -e "       chmod -R 775 ${BACKEND_DIR}/storage ${BACKEND_DIR}/bootstrap/cache"
echo -e ""
echo -e "    4. Nginx:"
echo -e "       nginx -t && systemctl reload nginx"
echo ""
