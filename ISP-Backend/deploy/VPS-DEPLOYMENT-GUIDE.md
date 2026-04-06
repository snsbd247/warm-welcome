# Smart ISP — VPS Deployment Guide

> **Domain:** smartispapp.com | **Server:** 163.245.223.54

---

## 📦 GitHub Repo → VPS ফাইল ম্যাপিং

### কোন ফাইল কোথায় যাবে?

```
GitHub Repository (একটি রিপো)
│
├── ISP-Backend/          ──→  /var/www/smartisp/backend/     (Laravel API)
│   ├── app/              ──→  backend/app/
│   ├── bootstrap/        ──→  backend/bootstrap/
│   ├── config/           ──→  backend/config/
│   ├── database/         ──→  backend/database/
│   ├── deploy/           ──→  backend/deploy/               (deploy configs)
│   ├── public/           ──→  backend/public/
│   ├── resources/        ──→  backend/resources/
│   ├── routes/           ──→  backend/routes/
│   ├── storage/          ──→  backend/storage/
│   ├── tests/            ──→  backend/tests/
│   ├── .env.example      ──→  backend/.env.example
│   ├── artisan           ──→  backend/artisan
│   ├── composer.json     ──→  backend/composer.json
│   ├── composer.lock     ──→  backend/composer.lock
│   ├── deploy.sh         ──→  backend/deploy.sh
│   └── setup.sh          ──→  backend/setup.sh
│
├── src/                  ──→  /var/www/smartisp/frontend/src/
├── public/               ──→  frontend/public/
├── supabase/             ──→  frontend/supabase/            (optional)
├── package.json          ──→  frontend/package.json
├── package-lock.json     ──→  frontend/package-lock.json
├── vite.config.ts        ──→  frontend/vite.config.ts
├── tsconfig.json         ──→  frontend/tsconfig.json
├── tsconfig.app.json     ──→  frontend/tsconfig.app.json
├── tsconfig.node.json    ──→  frontend/tsconfig.node.json
├── tailwind.config.ts    ──→  frontend/tailwind.config.ts
├── postcss.config.js     ──→  frontend/postcss.config.js
├── index.html            ──→  frontend/index.html
├── components.json       ──→  frontend/components.json
├── eslint.config.js      ──→  frontend/eslint.config.js
├── .env.production       ──→  frontend/.env.production
│
└── vps-clone-setup.sh    ──→  ★ এই স্ক্রিপ্ট রান করলে সব অটো কপি হয়!
```

### VPS-এ ফাইনাল স্ট্রাকচার

```
/var/www/smartisp/
├── backend/              ← ISP-Backend/ থেকে এসেছে
│   ├── app/
│   ├── config/
│   ├── database/
│   ├── deploy/
│   │   ├── vps-setup.sh
│   │   ├── deploy-update.sh
│   │   ├── nginx-smartispapp.conf
│   │   ├── .env.production
│   │   └── smartisp-queue.service
│   ├── public/
│   ├── routes/
│   ├── storage/
│   ├── .env              ← .env.production থেকে কপি + এডিট
│   ├── artisan
│   ├── composer.json
│   ├── deploy.sh
│   └── setup.sh
├── frontend/             ← রিপো root থেকে এসেছে
│   ├── src/
│   ├── public/
│   ├── dist/             ← npm run build এ তৈরি হয়
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── public_html/          ← dist/ থেকে rsync হয় (Nginx root)
│   ├── index.html
│   └── assets/
└── deploy-update.sh      ← deploy/ থেকে কপি হয়
```

---

## 🚀 সম্পূর্ণ সেটাপ প্রসেস (Step by Step)

### Step 1: DNS Setup

ডোমেইন রেজিস্ট্রারে এই রেকর্ড যোগ করুন:

| Type | Name | Value |
|------|------|-------|
| A | @ | 163.245.223.54 |
| A | * | 163.245.223.54 |
| A | www | 163.245.223.54 |

---

### Step 2: VPS-এ সার্ভার সেটাপ

```bash
ssh root@163.245.223.54

# vps-setup.sh ডাউনলোড ও রান (Nginx, PHP, MySQL, Node.js ইনস্টল)
wget https://raw.githubusercontent.com/YOUR_ORG/YOUR_REPO/main/ISP-Backend/deploy/vps-setup.sh
chmod +x vps-setup.sh
sudo ./vps-setup.sh
```

> ⚠️ সেটাপ শেষে DB credentials স্ক্রিনে দেখাবে — কপি করে রাখুন!
> Credentials `/root/.smartisp-credentials` তেও সেভ হয়।

---

### Step 3: GitHub থেকে ক্লোন ও ফাইল ম্যাপিং (অটোমেটিক)

```bash
# রিপো ক্লোন
cd /tmp
git clone https://github.com/YOUR_ORG/YOUR_REPO.git smartisp-repo

# অটো সেটাপ স্ক্রিপ্ট রান — সব ফাইল সঠিক জায়গায় কপি হবে
cd smartisp-repo
sudo bash vps-clone-setup.sh

# ক্লিনআপ
rm -rf /tmp/smartisp-repo
```

**এই স্ক্রিপ্ট যা করে:**
- ✅ `ISP-Backend/` → `/var/www/smartisp/backend/` কপি
- ✅ `src/`, `public/`, `package.json` ইত্যাদি → `/var/www/smartisp/frontend/` কপি
- ✅ Nginx config ইনস্টল
- ✅ Deploy script সেটআপ

---

### Step 4: Backend কনফিগার

```bash
cd /var/www/smartisp/backend

# .env সেটআপ
cp deploy/.env.production .env
nano .env
# DB_PASSWORD= এর পাশে Step 2 এর পাসওয়ার্ড বসান

# App key জেনারেট
php artisan key:generate

# Dependencies ইনস্টল
composer install --no-dev --optimize-autoloader

# Database setup
php artisan migrate --force
php artisan db:seed --class=DefaultSeeder --force
php artisan db:seed --class=GeoSeeder --force

# Storage & Permissions
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

### Step 5: Frontend বিল্ড

```bash
cd /var/www/smartisp/frontend

# Dependencies ইনস্টল
npm ci

# ⚠️ VPS target অবশ্যই দিতে হবে!
VITE_DEPLOY_TARGET=vps npm run build

# বিল্ড আউটপুট Nginx root এ কপি
rsync -a --delete dist/ /var/www/smartisp/public_html/

# Permissions
chown -R www-data:www-data /var/www/smartisp/public_html
```

---

### Step 6: Nginx রিলোড

```bash
nginx -t
systemctl reload nginx
```

---

### Step 7: SSL সার্টিফিকেট

**Option A: Cloudflare (রিকমেন্ডেড)**
1. Cloudflare এ ডোমেইন যোগ করুন
2. SSL mode: **Full (Strict)**
3. Origin Certificate → `/etc/ssl/smartisp/` এ সেভ করুন

**Option B: Let's Encrypt**
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d smartispapp.com -d www.smartispapp.com
```

---

### Step 8: Cron Job ও Queue Worker

```bash
# Laravel Scheduler (প্রতি মিনিটে)
(crontab -l 2>/dev/null; echo "* * * * * cd /var/www/smartisp/backend && php artisan schedule:run >> /dev/null 2>&1") | sort -u | crontab -

# Queue Worker (Optional)
cp /var/www/smartisp/backend/deploy/smartisp-queue.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable smartisp-queue
systemctl start smartisp-queue
```

---

### Step 9: ভেরিফাই

```bash
curl -s https://smartispapp.com/api/api/health | python3 -m json.tool
curl -s -o /dev/null -w "%{http_code}" https://smartispapp.com
```

ব্রাউজারে `https://smartispapp.com` ওপেন করে লগইন করুন।

---

## 🔑 Default Login

| Role | Username | Password |
|------|----------|----------|
| Super Admin | admin | admin123 |
| Super Admin | ismail | Admin@123 |

---

## 🔄 পরবর্তী আপডেট

### সহজ পদ্ধতি (সব আপডেট):
```bash
cd /tmp
git clone https://github.com/YOUR_ORG/YOUR_REPO.git smartisp-repo
cd smartisp-repo
sudo bash vps-clone-setup.sh
rm -rf /tmp/smartisp-repo

# তারপর backend ও frontend আপডেট
cd /var/www/smartisp
sudo bash deploy-update.sh
```

### শুধু Backend আপডেট:
```bash
cd /tmp && git clone ... smartisp-repo
rsync -a smartisp-repo/ISP-Backend/ /var/www/smartisp/backend/
rm -rf /tmp/smartisp-repo
cd /var/www/smartisp/backend && sudo bash deploy.sh
```

### শুধু Frontend আপডেট:
```bash
cd /tmp && git clone ... smartisp-repo
rsync -a smartisp-repo/src/ /var/www/smartisp/frontend/src/
cp smartisp-repo/package.json /var/www/smartisp/frontend/
rm -rf /tmp/smartisp-repo
cd /var/www/smartisp/frontend
npm ci && VITE_DEPLOY_TARGET=vps npm run build
rsync -a --delete dist/ /var/www/smartisp/public_html/
```

---

## 🔧 Troubleshooting

| সমস্যা | সমাধান |
|---------|--------|
| 502 Bad Gateway | `systemctl restart php8.2-fpm` |
| Permission denied | `chown -R www-data:www-data storage bootstrap/cache` |
| API 404 | `php artisan route:cache` ও Nginx চেক |
| Login error | `.env` তে `SANCTUM_STATEFUL_DOMAINS` চেক |
| Blank page | `VITE_DEPLOY_TARGET=vps` দিয়ে বিল্ড হয়েছে কিনা চেক |
| CORS error | `.env` তে `FRONTEND_URL` চেক |

### Logs

```bash
tail -f /var/log/nginx/smartisp-error.log           # Nginx
tail -f /var/www/smartisp/backend/storage/logs/laravel.log  # Laravel
tail -f /var/log/php/smartisp-error.log              # PHP-FPM
```
