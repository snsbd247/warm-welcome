# Smart ISP — VPS Deployment Guide (GitHub থেকে SSH দিয়ে সেটাপ)

> **Domain:** smartispapp.com | **Server:** 163.245.223.54

---

## 📁 রিপোজিটরি স্ট্রাকচার

```
GitHub Repository
├── ISP-Backend/                    ← Laravel Backend (এই ফোল্ডার)
│   ├── app/
│   ├── config/
│   ├── database/
│   ├── deploy/                     ← ★ সব ডিপ্লয়মেন্ট ফাইল এখানে
│   │   ├── vps-setup.sh            ← Step 1: সার্ভার সেটাপ স্ক্রিপ্ট
│   │   ├── deploy-update.sh        ← Step 6: আপডেট স্ক্রিপ্ট
│   │   ├── nginx-smartispapp.conf  ← Nginx কনফিগারেশন
│   │   ├── .env.production         ← প্রোডাকশন .env টেমপ্লেট
│   │   ├── smartisp-queue.service  ← Queue Worker systemd service
│   │   └── VPS-DEPLOYMENT-GUIDE.md ← এই ফাইল
│   ├── routes/
│   ├── deploy.sh                   ← ব্যাকএন্ড-only ডিপ্লয় স্ক্রিপ্ট
│   ├── setup.sh                    ← cPanel সেটাপ স্ক্রিপ্ট
│   └── .env.example
├── src/                            ← React Frontend
├── public/
└── package.json
```

---

## 🚀 VPS সার্ভারে ডিরেক্টরি স্ট্রাকচার

```
/var/www/smartisp/
├── backend/              ← Laravel (GitHub: ISP-Backend/)
│   ├── app/
│   ├── public/
│   ├── storage/
│   └── .env
├── frontend/             ← React source (GitHub root)
│   ├── src/
│   ├── dist/             ← Build output
│   └── package.json
├── public_html/          ← Nginx root (dist/ থেকে sync হয়)
│   ├── index.html
│   └── assets/
└── deploy-update.sh      ← আপডেট স্ক্রিপ্ট
```

---

## 📋 Step 1: DNS Setup

ডোমেইন রেজিস্ট্রারে যান এবং এই DNS রেকর্ড যোগ করুন:

| Type | Name | Value |
|------|------|-------|
| A | @ | 163.245.223.54 |
| A | * | 163.245.223.54 |
| A | www | 163.245.223.54 |

---

## 📋 Step 2: সার্ভার সেটাপ

```bash
# SSH দিয়ে সার্ভারে লগইন
ssh root@163.245.223.54

# সেটাপ স্ক্রিপ্ট ডাউনলোড ও রান
# (vps-setup.sh ফাইল ISP-Backend/deploy/ তে আছে)
# অথবা সরাসরি GitHub থেকে:
wget https://raw.githubusercontent.com/YOUR_ORG/YOUR_REPO/main/ISP-Backend/deploy/vps-setup.sh
chmod +x vps-setup.sh
sudo ./vps-setup.sh
```

**এই স্ক্রিপ্ট অটোমেটিক ইনস্টল করবে:**
- ✅ Nginx
- ✅ PHP 8.2 + FPM (custom pool)
- ✅ MySQL 8 + Database ও User তৈরি
- ✅ Node.js 20
- ✅ Composer
- ✅ UFW Firewall
- ✅ Self-signed SSL (পরে রিপ্লেস করবেন)

> ⚠️ **গুরুত্বপূর্ণ:** সেটাপ শেষে DB credentials স্ক্রিনে দেখাবে এবং `/root/.smartisp-credentials` এ সেভ হবে। এই পাসওয়ার্ড কপি করে রাখুন!

---

## 📋 Step 3: GitHub থেকে ক্লোন

```bash
cd /var/www/smartisp

# Backend ক্লোন (ISP-Backend ফোল্ডার → backend হিসেবে)
git clone https://github.com/YOUR_ORG/YOUR_REPO.git temp-clone
cp -r temp-clone/ISP-Backend/* backend/
cp -r temp-clone/ISP-Backend/.* backend/ 2>/dev/null || true

# Frontend ক্লোন (রুট ফোল্ডার → frontend হিসেবে)
mkdir -p frontend
cp -r temp-clone/src frontend/
cp -r temp-clone/public frontend/
cp temp-clone/package.json frontend/
cp temp-clone/vite.config.ts frontend/
cp temp-clone/tsconfig*.json frontend/
cp temp-clone/tailwind.config.ts frontend/
cp temp-clone/postcss.config.js frontend/
cp temp-clone/index.html frontend/
cp temp-clone/components.json frontend/ 2>/dev/null || true

# অথবা আলাদা রিপো থাকলে:
# git clone https://github.com/YOUR_ORG/ISP-Backend.git backend
# git clone https://github.com/YOUR_ORG/smart-isp-frontend.git frontend

# Temp ক্লিনআপ
rm -rf temp-clone
```

---

## 📋 Step 4: Backend কনফিগার

```bash
cd /var/www/smartisp/backend

# Production .env কপি
cp deploy/.env.production .env

# .env এডিট করুন — DB পাসওয়ার্ড সেট করুন
nano .env
# DB_PASSWORD=<Step 2 এ পাওয়া পাসওয়ার্ড>

# App key জেনারেট
php artisan key:generate

# Dependencies ইনস্টল
composer install --no-dev --optimize-autoloader

# Migrations ও Seeder রান
php artisan migrate --force
php artisan db:seed --class=DefaultSeeder --force
php artisan db:seed --class=GeoSeeder --force

# Storage link ও permissions
php artisan storage:link
mkdir -p storage/app/backups/full storage/app/backups/tenants
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Production cache
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 📋 Step 5: Frontend বিল্ড

```bash
cd /var/www/smartisp/frontend

# Dependencies ইনস্টল
npm ci

# VPS target দিয়ে বিল্ড (⚠️ এটা অবশ্যই দিতে হবে!)
VITE_DEPLOY_TARGET=vps npm run build

# বিল্ড আউটপুট public_html এ কপি
rsync -a --delete dist/ /var/www/smartisp/public_html/

# Permissions
chown -R www-data:www-data /var/www/smartisp/public_html
```

---

## 📋 Step 6: Nginx কনফিগার

```bash
# Nginx কনফিগ কপি
cp /var/www/smartisp/backend/deploy/nginx-smartispapp.conf \
   /etc/nginx/sites-available/smartispapp.com

# Enable site
ln -sf /etc/nginx/sites-available/smartispapp.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# টেস্ট ও রিলোড
nginx -t
systemctl reload nginx
```

---

## 📋 Step 7: SSL সার্টিফিকেট

### Option A: Cloudflare (রিকমেন্ডেড)
1. Cloudflare এ ডোমেইন যোগ করুন
2. SSL mode: **Full (Strict)**
3. Origin Server Certificate তৈরি করুন
4. `/etc/ssl/smartisp/fullchain.pem` ও `privkey.pem` এ সেভ করুন

### Option B: Let's Encrypt
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d smartispapp.com -d www.smartispapp.com
```

---

## 📋 Step 8: Cron Job ও Queue Worker

```bash
# Laravel Scheduler
(crontab -l 2>/dev/null; echo "* * * * * cd /var/www/smartisp/backend && php artisan schedule:run >> /dev/null 2>&1") | sort -u | crontab -

# Queue Worker (Optional)
cp /var/www/smartisp/backend/deploy/smartisp-queue.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable smartisp-queue
systemctl start smartisp-queue
```

---

## ✅ Step 9: ভেরিফাই

```bash
# API চেক
curl -s https://smartispapp.com/api/api/health | python3 -m json.tool

# Frontend চেক
curl -s -o /dev/null -w "%{http_code}" https://smartispapp.com
```

ব্রাউজারে `https://smartispapp.com` ওপেন করে লগইন টেস্ট করুন।

---

## 🔑 Default Login

| Role | Username | Password |
|------|----------|----------|
| Super Admin | admin | admin123 |
| Super Admin | ismail | Admin@123 |

---

## 🔄 পরবর্তী আপডেট

```bash
# সহজ পদ্ধতি — deploy-update.sh (backend + frontend উভয়ই আপডেট করে)
cd /var/www/smartisp
sudo bash backend/deploy/deploy-update.sh

# অথবা শুধু backend আপডেট
cd /var/www/smartisp/backend
git pull origin main
sudo bash deploy.sh

# অথবা শুধু frontend আপডেট
cd /var/www/smartisp/frontend
git pull origin main
VITE_DEPLOY_TARGET=vps npm run build
rsync -a --delete dist/ /var/www/smartisp/public_html/
```

---

## 🔧 Troubleshooting

| সমস্যা | সমাধান |
|---------|--------|
| 502 Bad Gateway | `systemctl restart php8.2-fpm` |
| Permission denied | `chown -R www-data:www-data storage bootstrap/cache` |
| API 404 | `php artisan route:cache` ও Nginx `@laravel_api` চেক |
| Login error | `.env` তে `SANCTUM_STATEFUL_DOMAINS` চেক |
| Blank page | `VITE_DEPLOY_TARGET=vps` দিয়ে বিল্ড হয়েছে কিনা চেক |
| CORS error | `.env` তে `FRONTEND_URL` চেক |

### Logs চেক

```bash
# Nginx
tail -f /var/log/nginx/smartisp-error.log

# Laravel
tail -f /var/www/smartisp/backend/storage/logs/laravel.log

# PHP-FPM
tail -f /var/log/php/smartisp-error.log
```
