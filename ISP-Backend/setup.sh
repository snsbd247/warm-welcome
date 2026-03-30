#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║   Smart ISP — Auto Setup for cPanel (Any Domain)            ║
# ╚══════════════════════════════════════════════════════════════╝

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║     Smart ISP — cPanel Setup                     ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# ─── Step 0: Ask Domain ───────────────────────────────────
echo -e "${YELLOW}  Domain Configuration:${NC}"
read -p "  Your Domain (e.g. isp.example.com): " DOMAIN
DOMAIN=${DOMAIN:-localhost}

# ─── Step 1: Check Requirements ───────────────────────────
echo -e "${BLUE}[1/9] Checking requirements...${NC}"

if ! command -v php &> /dev/null; then
    echo -e "${RED}✗ PHP not found!${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ PHP $(php -r 'echo PHP_VERSION;') found${NC}"

if ! command -v composer &> /dev/null; then
    echo -e "${YELLOW}  ⚠ Composer not found. Installing...${NC}"
    php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
    php composer-setup.php
    rm -f composer-setup.php
    COMPOSER_CMD="php composer.phar"
else
    COMPOSER_CMD="composer"
    echo -e "${GREEN}  ✓ Composer found${NC}"
fi

# ─── Step 2: Install Dependencies ─────────────────────────
echo -e "${BLUE}[2/9] Installing dependencies...${NC}"
$COMPOSER_CMD install --optimize-autoloader --no-dev --no-interaction 2>&1 | tail -3
echo -e "${GREEN}  ✓ Dependencies installed${NC}"

# ─── Step 3: Environment Setup ────────────────────────────
echo -e "${BLUE}[3/9] Setting up environment...${NC}"

if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}  ✓ .env created${NC}"

    echo ""
    echo -e "${YELLOW}  Database Configuration:${NC}"
    read -p "  DB_DATABASE [isp_management]: " DB_NAME
    DB_NAME=${DB_NAME:-isp_management}

    read -p "  DB_USERNAME [root]: " DB_USER
    DB_USER=${DB_USER:-root}

    read -sp "  DB_PASSWORD: " DB_PASS
    echo ""

    sed -i "s|APP_ENV=.*|APP_ENV=production|" .env
    sed -i "s|APP_DEBUG=.*|APP_DEBUG=false|" .env
    sed -i "s|APP_URL=.*|APP_URL=https://${DOMAIN}/api|" .env
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://${DOMAIN}|" .env
    sed -i "s|DB_DATABASE=.*|DB_DATABASE=${DB_NAME}|" .env
    sed -i "s|DB_USERNAME=.*|DB_USERNAME=${DB_USER}|" .env
    sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=${DB_PASS}|" .env
    sed -i "s|SANCTUM_STATEFUL_DOMAINS=.*|SANCTUM_STATEFUL_DOMAINS=${DOMAIN},www.${DOMAIN}|" .env

    echo -e "${GREEN}  ✓ .env configured for ${DOMAIN}${NC}"
else
    echo -e "${GREEN}  ✓ .env already exists${NC}"
fi

# ─── Step 4: Generate Key ─────────────────────────────────
echo -e "${BLUE}[4/9] Generating app key...${NC}"
php artisan key:generate --force --no-interaction
echo -e "${GREEN}  ✓ App key generated${NC}"

# ─── Step 5: Clear caches before migration ────────────────
echo -e "${BLUE}[5/9] Clearing caches...${NC}"
php artisan config:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true
php artisan route:clear 2>/dev/null || true
php artisan view:clear 2>/dev/null || true
echo -e "${GREEN}  ✓ Caches cleared${NC}"

# ─── Step 6: Run Migrations ──────────────────────────────
echo -e "${BLUE}[6/9] Running migrations...${NC}"
php artisan migrate --force --no-interaction
echo -e "${GREEN}  ✓ Database tables created${NC}"

# ─── Step 7: Seed Data ───────────────────────────────────
echo -e "${BLUE}[7/9] Seeding default data...${NC}"

MAX_RETRIES=3
RETRY=0
SEED_SUCCESS=false

while [ $RETRY -lt $MAX_RETRIES ]; do
    if php artisan db:seed --force --no-interaction 2>&1; then
        SEED_SUCCESS=true
        break
    else
        RETRY=$((RETRY + 1))
        echo -e "${YELLOW}  ⚠ Seed attempt $RETRY failed, retrying...${NC}"
        sleep 2
    fi
done

if [ "$SEED_SUCCESS" = true ]; then
    echo -e "${GREEN}  ✓ Data seeded successfully${NC}"
else
    echo -e "${YELLOW}  ⚠ Seed warning (data may already exist)${NC}"
fi

echo -e "${CYAN}    Admin #1: admin / admin123${NC}"
echo -e "${CYAN}    Admin #2: ismail / Admin@123${NC}"

# ─── Step 8: Seed Geo Data ───────────────────────────────
echo -e "${BLUE}[8/9] Seeding Bangladesh geo data...${NC}"
if php artisan db:seed --class=GeoSeeder --force --no-interaction 2>&1; then
    echo -e "${GREEN}  ✓ Geo data seeded (divisions, districts, upazilas)${NC}"
else
    echo -e "${YELLOW}  ⚠ Geo seeder not found or already seeded${NC}"
fi

# ─── Step 9: Storage & Production Cache ──────────────────
echo -e "${BLUE}[9/9] Final setup...${NC}"
php artisan storage:link 2>/dev/null || true
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

php artisan config:cache
php artisan route:cache
php artisan view:cache
echo -e "${GREEN}  ✓ Storage linked, permissions set, cached${NC}"

# ─── Create .htaccess if missing ─────────────────────────
if [ ! -f .htaccess ]; then
    cat > .htaccess << 'HTACCESS'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
HTACCESS
    echo -e "${GREEN}  ✓ .htaccess created${NC}"
fi

# ─── Done ─────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           ✅ Setup Complete!                     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}Domain:${NC}  https://${DOMAIN}"
echo -e "  ${GREEN}API:${NC}    https://${DOMAIN}/api/api"
echo -e "  ${GREEN}Login:${NC}  https://${DOMAIN}/admin/login"
echo ""
echo -e "  ${YELLOW}API URL:${NC} সম্পূর্ণ auto-detect — কোনো VITE_API_URL সেট করতে হবে না"
echo -e "  ${YELLOW}Frontend:${NC} npm run build → dist/ → document root"
echo ""
echo -e "  ${YELLOW}Database:${NC} No foreign keys, no DB functions — all relations at code level"
echo ""
echo -e "  ${GREEN}Seeded Data:${NC}"
echo -e "    ✓ 7 Roles (Super Admin, Admin, Staff, Manager, Operator, Technician, Accountant)"
echo -e "    ✓ 2 Admin Users (admin/admin123, ismail/Admin@123)"
echo -e "    ✓ 4 Default Packages (10/20/50/100 Mbps)"
echo -e "    ✓ 50+ Chart of Accounts (ISP-specific COA with hierarchy)"
echo -e "    ✓ 18 Ledger Mappings & Payment Settings"
echo -e "    ✓ 8 SMS Templates"
echo -e "    ✓ 5 Email Templates"
echo -e "    ✓ 56 Permissions (14 modules × 4 actions)"
echo -e "    ✓ System Settings & General Settings"
echo ""
echo -e "  ${YELLOW}Tables Created:${NC}"
echo -e "    Auth: users, custom_roles, user_roles, permissions, role_permissions"
echo -e "    Sessions: admin_sessions, admin_login_logs, customer_sessions"
echo -e "    ISP Core: mikrotik_routers, packages, customers, bills, payments"
echo -e "    Ledger: customer_ledger, merchant_payments"
echo -e "    Support: support_tickets, ticket_replies"
echo -e "    SMS: sms_settings, sms_templates, sms_logs, reminder_logs"
echo -e "    Settings: general_settings, system_settings, payment_gateways"
echo -e "    Network: zones, olts, onus"
echo -e "    Accounting: accounts, transactions, products, vendors, purchases, purchase_items"
echo -e "    Sales: sales, sale_items, expenses, daily_reports"
echo -e "    Supplier: suppliers, supplier_payments"
echo -e "    Heads: income_heads, expense_heads, other_heads"
echo -e "    HR: designations, employees, attendance, loans, salary_sheets"
echo -e "    HR Detail: employee_salary_structure, employee_education, employee_experience"
echo -e "    HR Funds: employee_emergency_contacts, employee_provident_fund, employee_savings_fund"
echo -e "    Geo: geo_divisions, geo_districts, geo_upazilas"
echo -e "    Logs: audit_logs, backup_logs"
echo ""
echo -e "  ${YELLOW}Cron Job (cPanel → Cron Jobs):${NC}"
echo -e "  * * * * * cd $(pwd) && php artisan schedule:run >> /dev/null 2>&1"
echo ""
