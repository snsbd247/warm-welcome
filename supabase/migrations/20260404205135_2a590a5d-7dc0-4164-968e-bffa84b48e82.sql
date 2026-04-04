-- Performance indexes for frequently queried tables

-- Payments: commonly filtered by customer, method, date
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments (customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_method_date ON public.payments (payment_method, paid_at);

-- Bills: commonly filtered by month, status, reseller
CREATE INDEX IF NOT EXISTS idx_bills_month_status ON public.bills (month, status);
CREATE INDEX IF NOT EXISTS idx_bills_reseller_id ON public.bills (reseller_id);
CREATE INDEX IF NOT EXISTS idx_bills_customer_status ON public.bills (customer_id, status);

-- Customers: dashboard queries filter by tenant + status
CREATE INDEX IF NOT EXISTS idx_customers_tenant_status ON public.customers (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_connection ON public.customers (tenant_id, connection_status);
CREATE INDEX IF NOT EXISTS idx_customers_reseller_id ON public.customers (reseller_id);

-- Reseller wallet transactions: ordered by date
CREATE INDEX IF NOT EXISTS idx_reseller_wallet_txn_reseller ON public.reseller_wallet_transactions (reseller_id, created_at DESC);

-- Customer ledger: filtered by customer + ordered by date
CREATE INDEX IF NOT EXISTS idx_customer_ledger_customer_date ON public.customer_ledger (customer_id, date DESC);

-- Expenses: filtered by tenant + date range
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_date ON public.expenses (tenant_id, date);

-- Reseller package commissions: lookup by reseller + package
CREATE INDEX IF NOT EXISTS idx_reseller_pkg_comm_lookup ON public.reseller_package_commissions (reseller_id, package_id);

-- Activity logs: filtered by tenant + date
CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant_date ON public.activity_logs (tenant_id, created_at DESC);

-- Audit logs: filtered by table + date
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_date ON public.audit_logs (table_name, created_at DESC);