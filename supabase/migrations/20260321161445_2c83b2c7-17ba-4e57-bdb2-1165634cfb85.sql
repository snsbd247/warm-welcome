
-- =====================================================
-- REMOVE MULTI-TENANCY: Drop tenant_id from all tables
-- and drop tenant-related tables
-- =====================================================

-- Step 1: Drop tenant_id columns (CASCADE drops FK constraints automatically)
ALTER TABLE public.admin_login_logs DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.admin_sessions DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.audit_logs DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.backup_logs DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.bills DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.custom_roles DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.customer_ledger DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.customer_sessions DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.customers DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.general_settings DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.merchant_payments DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.mikrotik_routers DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.olts DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.onus DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.packages DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.payment_gateways DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.payments DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.permissions DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.reminder_logs DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.role_permissions DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.sms_logs DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.sms_settings DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.sms_templates DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.support_tickets DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.ticket_replies DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.user_roles DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.zones DROP COLUMN IF EXISTS tenant_id CASCADE;

-- Step 2: Drop tenant-related tables
DROP TABLE IF EXISTS public.tenant_integrations CASCADE;
DROP TABLE IF EXISTS public.tenant_subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.platform_integrations CASCADE;
DROP TABLE IF EXISTS public.platform_admins CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;
