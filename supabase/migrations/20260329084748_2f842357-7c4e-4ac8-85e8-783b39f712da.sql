-- Reset all transactional data while keeping users, roles, permissions, and accounts (COA)

-- Customer related
DELETE FROM sms_logs;
DELETE FROM reminder_logs;
DELETE FROM admin_login_logs;
DELETE FROM customer_ledger;
DELETE FROM payments;
DELETE FROM bills;
DELETE FROM merchant_payments;
DELETE FROM ticket_replies;
DELETE FROM support_tickets;
DELETE FROM customer_sessions;
DELETE FROM onus;
DELETE FROM customers;

-- Accounting transactions (keep accounts/COA structure)
DELETE FROM transactions;
DELETE FROM expenses;
DELETE FROM daily_reports;

-- Sales & Purchases
DELETE FROM sale_items;
DELETE FROM sales;
DELETE FROM purchase_items;
DELETE FROM purchases;

-- Supplier payments
DELETE FROM supplier_payments;

-- HR transactional
DELETE FROM salary_sheets;
DELETE FROM attendance;
DELETE FROM employee_provident_fund;
DELETE FROM employee_savings_fund;
DELETE FROM loans;

-- Audit logs
DELETE FROM audit_logs;

-- Backup logs
DELETE FROM backup_logs;

-- Reset account balances to 0 (keep structure)
UPDATE accounts SET balance = 0;