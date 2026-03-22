# Smart ISP — cPanel Deployment Guide (বাংলা + English)

## 📁 ফোল্ডার স্ট্রাকচার (cPanel এ)

```
public_html/
├── api/                    ← Laravel backend (laravel-backend/ এর সব ফাইল)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── public/             ← Laravel public folder
│   │   ├── index.php       ← ⚠️ এটা এডিট করতে হবে (নিচে দেখুন)
│   │   └── .htaccess
│   ├── routes/
│   ├── storage/
│   ├── vendor/
│   ├── .env                ← Production environment
│   ├── artisan
│   └── composer.json
├── assets/                 ← React build এর assets (auto-generated)
├── index.html              ← React SPA entry point
├── .htaccess               ← React SPA routing
└── favicon.ico
```

---

## 🚀 Step-by-Step Setup

### Step 1: Laravel Backend Upload

1. **cPanel File Manager** অথবা **FTP** দিয়ে `public_html/api/` ফোল্ডার তৈরি করুন
2. `laravel-backend/` এর সব ফাইল `public_html/api/` তে আপলোড করুন
3. **গুরুত্বপূর্ণ**: `vendor/` ফোল্ডার আপলোড করবেন না — SSH দিয়ে install করুন

### Step 2: Composer Install (SSH)

```bash
cd ~/public_html/api
composer install --optimize-autoloader --no-dev
```

> **SSH নেই?** লোকাল মেশিনে `composer install --no-dev` করে `vendor/` ফোল্ডারসহ আপলোড করুন।

### Step 3: Environment Setup

```bash
cd ~/public_html/api
cp .env.example .env
php artisan key:generate
```

`.env` ফাইল এডিট করুন:

```env
APP_NAME="Smart ISP"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com/api

FRONTEND_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=your_cpanel_db_name
DB_USERNAME=your_cpanel_db_user
DB_PASSWORD=your_db_password

SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com
```

### Step 4: Laravel public/index.php এডিট করুন

`public_html/api/public/index.php` এডিট:

```php
<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

require __DIR__.'/../vendor/autoload.php';

(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
```

> এটা সাধারণত ডিফল্ট থাকে, কিন্তু চেক করে নিন path ঠিক আছে কিনা।

### Step 5: .htaccess for API subfolder

`public_html/api/public/.htaccess` ঠিক আছে কিনা চেক করুন (ডিফল্ট Laravel .htaccess কাজ করবে)।

**গুরুত্বপূর্ণ**: cPanel এ `public_html/api/.htaccess` তৈরি করুন যাতে সব request `public/` ফোল্ডারে যায়:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

### Step 6: Database Setup

1. **cPanel → MySQL Databases** → নতুন database তৈরি করুন
2. নতুন user তৈরি করুন ও database এ assign করুন (All Privileges)
3. `.env` তে database credentials আপডেট করুন

```bash
cd ~/public_html/api
php artisan migrate --seed
```

### Step 7: Storage Link ও Permissions

```bash
cd ~/public_html/api
php artisan storage:link
chmod -R 775 storage bootstrap/cache
```

### Step 8: Cache Config (Production)

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Step 9: React Frontend Build ও Upload

**লোকাল মেশিনে:**

```bash
# .env.production আপডেট করুন
VITE_API_URL="https://yourdomain.com/api/api"

# Build করুন
npm run build
```

`dist/` ফোল্ডারের সব ফাইল `public_html/` তে আপলোড করুন (api/ ফোল্ডার বাদে)।

### Step 10: Cron Job Setup

**cPanel → Cron Jobs** → প্রতি মিনিটে:

```
* * * * * cd /home/yourusername/public_html/api && php artisan schedule:run >> /dev/null 2>&1
```

---

## 🔧 Troubleshooting

### "500 Internal Server Error"
- `storage/` ও `bootstrap/cache/` permissions চেক করুন (775)
- `php artisan config:clear` রান করুন
- `.env` তে `APP_DEBUG=true` করে error দেখুন

### "CORS Error"
- `config/cors.php` তে আপনার domain যোগ করুন
- `SANCTUM_STATEFUL_DOMAINS` চেক করুন

### "API URL Not Found"
- `VITE_API_URL` সঠিক কিনা চেক করুন
- URL হবে: `https://yourdomain.com/api/api` (একটা `/api` Laravel folder, আরেকটা `/api` route prefix)

### Subdomain API Setup (বিকল্প)
API কে subdomain এ রাখতে চাইলে:
1. cPanel → Subdomains → `api.yourdomain.com` তৈরি করুন
2. Document root: `public_html/api/public`
3. `.env.production`: `VITE_API_URL="https://api.yourdomain.com/api"`

---

## ✅ Checklist

- [ ] Laravel ফাইল `public_html/api/` তে আপলোড হয়েছে
- [ ] `composer install` হয়েছে
- [ ] `.env` তে database credentials সেট হয়েছে
- [ ] `php artisan key:generate` হয়েছে
- [ ] `php artisan migrate --seed` হয়েছে
- [ ] `php artisan storage:link` হয়েছে
- [ ] `storage/` ও `bootstrap/cache/` permissions 775
- [ ] React `dist/` build `public_html/` তে আপলোড হয়েছে
- [ ] `.htaccess` ফাইল ঠিক আছে
- [ ] Cron job সেটআপ হয়েছে
- [ ] `APP_DEBUG=false` প্রোডাকশনে
- [ ] HTTPS কাজ করছে
