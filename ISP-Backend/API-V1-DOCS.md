# Smart ISP — Mobile API v1 Documentation

Base URL: `https://yourdomain.com/api/v1`

All responses follow this format:
```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": { ... },
  "meta": { "current_page": 1, "last_page": 5, "per_page": 20, "total": 100 }  // paginated only
}
```

---

## 🔐 Authentication

### Admin Login
```
POST /api/v1/admin/login
```
| Field | Type | Required |
|-------|------|----------|
| email | string | ✅ |
| password | string | ✅ |
| device_name | string | ✅ |
| device_token | string | ❌ (FCM) |

**Response:** `{ user, token, token_type }`

### Customer Login
```
POST /api/v1/tenant/login
```
| Field | Type | Required |
|-------|------|----------|
| phone | string | ✅ |
| password | string | ✅ |
| device_name | string | ✅ |

**Response:** `{ customer, token, token_type, expires_at }`

### Auth Header
All protected endpoints require:
```
Authorization: Bearer {token}
```

### Logout
```
POST /api/v1/admin/logout
POST /api/v1/tenant/logout
```

### Get Profile
```
GET /api/v1/admin/me
GET /api/v1/tenant/profile
```

---

## 📊 Dashboard

```
GET /api/v1/admin/dashboard
```
Returns: total_customers, active_customers, total_billed, total_collected, total_expense, net_income, collection_rate, recent_payments

---

## 👥 Customers

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/customers` | GET | List (paginated, searchable) |
| `/admin/customers/stats` | GET | Count by status |
| `/admin/customers/areas` | GET | Distinct area list |
| `/admin/customers/{id}` | GET | Detail |
| `/admin/customers` | POST | Create |
| `/admin/customers/{id}` | PUT | Update |
| `/admin/customers/{id}/ledger` | GET | Ledger entries |

**Query params:** `search`, `status`, `area`, `connection_status`, `per_page`

---

## 💰 Bills

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/bills` | GET | List (filterable) |
| `/admin/bills/summary` | GET | Monthly summary |
| `/admin/bills/{id}` | GET | Detail |
| `/admin/bills` | POST | Create |
| `/admin/bills/{id}` | PUT | Update |
| `/admin/bills/generate` | POST | Auto-generate |

**Query params:** `month`, `status`, `customer_id`, `per_page`

---

## 💳 Payments

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/payments` | GET | List |
| `/admin/payments` | POST | Record payment |
| `/admin/merchant-payments` | GET | Merchant payments |
| `/admin/merchant-payments/{id}/match` | POST | Match to bill |

---

## 📱 SMS

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/sms/send` | POST | Send single |
| `/admin/sms/send-bulk` | POST | Send bulk |
| `/admin/sms/balance` | GET | Check balance |
| `/admin/sms/logs` | GET | View logs |

---

## 📈 Reports

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/reports/monthly` | GET | Last 6 months |
| `/admin/reports/collection` | GET | By payment method |

---

## 🏠 Customer Portal (Tenant)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tenant/dashboard` | GET | Customer dashboard |
| `/tenant/bills` | GET | My bills |
| `/tenant/payments` | GET | My payments |
| `/tenant/tickets` | GET | My tickets |
| `/tenant/tickets` | POST | Create ticket |
| `/tenant/tickets/{id}/reply` | POST | Reply to ticket |
| `/tenant/profile` | GET | My profile |

---

## 🤝 Reseller

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/reseller/dashboard` | GET | Reseller overview |
| `/reseller/customers` | GET | Assigned customers |
| `/reseller/collect-payment` | POST | Collect cash |

---

## ⚠️ Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Unauthorized (invalid/expired token) |
| 403 | Forbidden (account disabled) |
| 404 | Not found |
| 422 | Unprocessable (business logic error) |
| 429 | Rate limited |
| 500 | Server error |

---

## 📋 Pagination

All list endpoints support pagination:
- `?per_page=20` (default: 20)
- Response includes `meta` object with page info

## 🔍 Search

Customer list supports full-text search:
- `?search=keyword` — searches name, customer_id, phone, pppoe_username

## 🔒 Rate Limiting

- Login endpoints: 10 requests/minute per IP
- Authenticated endpoints: 120 requests/minute per user
