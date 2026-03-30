# Smart ISP — cPanel Deployment Guide
# যে কোনো Domain এ কাজ করবে (Domain-Agnostic)

## 📁 cPanel ফোল্ডার স্ট্রাকচার

```
/home/<cpanel-user>/
└── public_html/
    └── <yourdomain.com>/              ← 🔴 Document Root
        ├── api/                        ← Laravel backend
        │   ├── app/
        │   ├── bootstrap/
        │   ├── config/
        │   ├── database/
        │   ├── public/
        │   │   ├── index.php
        │   │   └── .htaccess
        │   ├── routes/
        │   ├── storage/
        │   ├── vendor/                 ← composer install এ তৈরি হবে
        │   ├── .env                    ← Production credentials
        │   ├── .htaccess               ← ⭐ cpanel-htaccess ফাইল
        │   ├── artisan
        │   └── composer.json
        │
        ├── assets/                     ← React build (auto)
        ├── index.html                  ← React SPA
        ├── .htaccess                   ← SPA routing
        └── favicon.ico
```

---

## 🚀 Step-by-Step Setup

### Step 1: React Frontend Build

**আপনার লোকাল মেশিনে:**
```bash
# কোনো .env.production সেটআপ লাগবে না — API URL সম্পূর্ণ auto-detect হয়
npm run build
```

`dist/` ফোল্ডারের সব ফাইল document root এ আপলোড করুন:
- `index.html`
- `assets/` ফোল্ডার
- অন্য সব ফাইল

### Step 2: SPA .htaccess তৈরি করুন

Document root এ `.htaccess` ফাইল তৈরি করুন:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # API requests → Laravel
    RewriteRule ^api/(.*)$ api/public/$1 [L]

    # If file/folder exists, serve it
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d

    # Otherwise → React SPA
    RewriteRule ^ index.html [L]
</IfModule>
```

### Step 3: Laravel Backend আপলোড

**Option A: cPanel File Manager দিয়ে**
1. Document root এ `api` ফোল্ডার তৈরি করুন
2. `ISP-Backend/` এর সব ফাইল `api/` তে আপলোড করুন (vendor/ বাদে)

**Option B: SSH দিয়ে (faster)**
```bash
cd /home/<cpanel-user>
cp -r ISP-Backend/* public_html/<yourdomain.com>/api/
```

### Step 4: api/.htaccess তৈরি করুন

`<document-root>/api/.htaccess` ফাইল তৈরি করুন:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

### Step 5: Composer Install

**Option A: SSH আছে**
```bash
cd <document-root>/api
composer install --optimize-autoloader --no-dev
```

**Option B: SSH নেই**
লোকালে `composer install --no-dev` করে vendor/ সহ আপলোড করুন

### Step 6: Auto Setup (SSH দিয়ে)

```bash
cd <document-root>/api
chmod +x setup.sh
bash setup.sh
```

> setup.sh ইন্টারেক্টিভলি domain, DB credentials জিজ্ঞেস করবে এবং সব সেট করবে।
> সেটআপ স্ক্রিপ্ট অটোমেটিক: মাইগ্রেশন, সিডিং (রোল, পারমিশন, COA, SMS/Email টেমপ্লেট, লেজার ম্যাপিং, প্যাকেজ), স্টোরেজ লিংক, এবং ক্যাশ তৈরি করে।

### Step 6 (Alternative): Manual Setup (SSH ছাড়া)

#### 6a. Environment Setup
```bash
cd <document-root>/api
cp .env.example .env
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
DB_DATABASE=your_db_name
DB_USERNAME=your_db_user
DB_PASSWORD=your_password

SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com
```

> ⚠️ cPanel MySQL Databases থেকে database ও user তৈরি করুন।
> cPanel এ username prefix লাগে, যেমন: `cpaneluser_dbname`

#### 6b. Database Setup

1. **cPanel → MySQL Databases**
   - New Database: `your_db_name`
   - New User: `your_db_user` + password
   - Add User to Database → All Privileges ✓

2. SSH না থাকলে **cPanel → Cron Jobs** দিয়ে একবার রান করুন:
```
cd <document-root>/api && php artisan key:generate --force && php artisan migrate --force --seed
```
> রান হয়ে গেলে Cron Job ডিলিট করুন

#### 6c. Storage & Permissions
```bash
cd <document-root>/api
php artisan storage:link
chmod -R 775 storage bootstrap/cache
```

#### 6d. Production Cache
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Step 7: Cron Job (Laravel Scheduler)

**cPanel → Cron Jobs** → প্রতি মিনিটে:
```
* * * * * cd <document-root>/api && php artisan schedule:run >> /dev/null 2>&1
```

---

## 🔑 Default Login Credentials

| User | Username | Password |
|------|----------|----------|
| Super Admin #1 | `admin` | `admin123` |
| Super Admin #2 | `ismail` | `Admin@123` |

---

## 📦 সিডার দিয়ে যা যা তৈরি হয়

| ক্যাটাগরি | বিবরণ |
|-----------|--------|
| Roles | Super Admin, Admin, Staff, Manager, Operator, Technician, Accountant |
| Admin Users | admin, ismail (Super Admin) |
| Packages | Basic 10Mbps, Standard 20Mbps, Premium 50Mbps, Ultra 100Mbps |
| Chart of Accounts | 50+ ISP-স্পেসিফিক লেজার (Assets, Liabilities, Equity, Income, Expenses) |
| Ledger Mappings | Sales, Purchase, Salary, PF, Vendor, Customer সহ 18টি ম্যাপিং |
| SMS Templates | Bill Generated, Due Reminder, Payment Confirmation সহ 8টি |
| Email Templates | Welcome, Password Reset, Payment Confirm সহ 5টি |
| Permissions | 14 মডিউল × 4 অ্যাকশন = 56টি পারমিশন |
| System Settings | Enabled modules, footer, invoice, ledger type |

---

## 🔧 Troubleshooting

### 500 Error?
```bash
cd <document-root>/api
chmod -R 775 storage bootstrap/cache
php artisan config:clear
```

### CORS Error?
`config/cors.php` → `allowed_origins` ইতিমধ্যে `['*']` সেট আছে।

### Login কাজ করছে না?
- API URL চেক: `https://yourdomain.com/api/api/admin/login`
- `.env` তে `SANCTUM_STATEFUL_DOMAINS=yourdomain.com`

### Data দেখা যাচ্ছে না?
- `php artisan migrate --force` রান হয়েছে কিনা চেক করুন
- `php artisan db:seed --force` রান করুন

---

## ✅ Final Checklist

- [ ] `npm run build` সম্পন্ন (কোনো env সেটআপ লাগবে না)
- [ ] `dist/` ফাইলগুলো document root এ আপলোড
- [ ] Document root এ SPA `.htaccess` তৈরি
- [ ] Document root এর `api/` তে Laravel আপলোড
- [ ] `api/.htaccess` তৈরি (RewriteRule public/)
- [ ] `composer install` সম্পন্ন
- [ ] `.env` তে DB credentials সেট
- [ ] `php artisan key:generate` হয়েছে
- [ ] MySQL database ও user তৈরি
- [ ] `php artisan migrate --seed` সম্পন্ন
- [ ] `php artisan storage:link` হয়েছে
- [ ] Permissions 775 (storage, bootstrap/cache)
- [ ] Cron job সেটআপ
- [ ] `APP_DEBUG=false`
- [ ] HTTPS কাজ করছে
- [ ] Login test সম্পন্ন
