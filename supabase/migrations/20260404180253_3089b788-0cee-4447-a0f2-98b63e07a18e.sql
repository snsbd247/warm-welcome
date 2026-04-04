
-- Clean up orphaned rows without tenant_id (legacy data from before multi-tenant fix)
DELETE FROM accounts WHERE tenant_id IS NULL;
DELETE FROM payment_gateways WHERE tenant_id IS NULL;
DELETE FROM expense_heads WHERE tenant_id IS NULL;
DELETE FROM income_heads WHERE tenant_id IS NULL;
DELETE FROM system_settings WHERE tenant_id IS NULL;
