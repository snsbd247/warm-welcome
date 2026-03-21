# Smart ISP — Laravel Backend

Complete Laravel API backend for the ISP Billing System (no Supabase).

## Quick Setup

### 1. Prerequisites
- PHP 8.1+ (with extensions: pdo_mysql, mbstring, openssl, json, curl, sockets)
- Composer 2.x
- MySQL 8.0+ (or XAMPP/Laragon)
- Node.js 18+ (for frontend)

### 2. Create Laravel Project

```bash
composer create-project laravel/laravel smart-isp
cd smart-isp
```

### 3. Copy Files Into Laravel Project

Copy these folders/files into your Laravel project:

```
app/Traits/HasUuid.php
app/Models/*.php           → Replace all model files
app/Http/Middleware/*.php   → AdminAuth, CustomerAuth, CheckPermission
app/Http/Controllers/Api/*.php
app/Services/*.php
app/Console/Commands/*.php
database/migrations/*.php  → Replace default migrations
database/seeders/DefaultSeeder.php
routes/api.php             → Replace default
routes/console.php         → Replace default
config/cors.php            → Replace default
.env.example               → Copy and rename to .env
```

### 4. Register Middleware

In `bootstrap/app.php` (Laravel 11+):

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'admin.auth' => \App\Http\Middleware\AdminAuth::class,
        'customer.auth' => \App\Http\Middleware\CustomerAuth::class,
        'check.permission' => \App\Http\Middleware\CheckPermission::class,
    ]);
})
```

### 5. Configure Database

```bash
# Create MySQL database
mysql -u root -e "CREATE DATABASE isp_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Edit `.env`:
```
DB_DATABASE=isp_management
DB_USERNAME=root
DB_PASSWORD=
```

### 6. Run Migrations & Seed

```bash
php artisan key:generate
php artisan migrate
php artisan db:seed --class=DefaultSeeder
```

### 7. Start Server

```bash
php artisan serve
# API runs at http://localhost:8000/api
```

### 8. Default Login
- **Email:** admin@smartisp.com
- **Password:** admin123

## Scheduler (Cron)

Add to system crontab:
```
* * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
```

Scheduled tasks:
- `bills:generate` — 1st of every month
- `customers:auto-suspend` — Daily at 2 AM
- `sessions:cleanup` — Every hour

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/login` | No | Admin login |
| POST | `/api/admin/logout` | Admin | Admin logout |
| GET | `/api/dashboard/stats` | Admin | Dashboard stats |
| POST | `/api/bills/generate` | Admin | Generate monthly bills |
| POST | `/api/payments` | Admin | Record payment |
| POST | `/api/sms/send` | Admin | Send SMS |
| POST | `/api/mikrotik/sync` | Admin | Sync customer to router |
| GET/POST/PUT/DELETE | `/api/{table}` | Admin | Generic CRUD |
| POST | `/api/portal/login` | No | Customer portal login |
| GET | `/api/portal/dashboard` | Customer | Portal dashboard |

## File Structure

```
app/
├── Console/Commands/       # Artisan commands
├── Http/
│   ├── Controllers/Api/    # All API controllers
│   └── Middleware/          # Auth & permission middleware
├── Models/                 # 29 Eloquent models
├── Services/               # Business logic services
│   ├── BillingService.php
│   ├── LedgerService.php
│   ├── SmsService.php
│   ├── EmailService.php
│   ├── BkashService.php
│   ├── NagadService.php
│   ├── MikrotikService.php
│   └── WhatsappService.php
└── Traits/
    └── HasUuid.php
database/
├── migrations/             # 29 MySQL migrations
└── seeders/
    └── DefaultSeeder.php
routes/
├── api.php                 # All API routes
└── console.php             # Scheduled tasks
```
