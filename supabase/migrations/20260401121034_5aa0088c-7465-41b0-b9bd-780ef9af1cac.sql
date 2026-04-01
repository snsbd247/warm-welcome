-- System modules registry
CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  is_core boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_modules" ON public.modules FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_modules" ON public.modules FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Plan-Module mapping
CREATE TABLE IF NOT EXISTS public.plan_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(plan_id, module_id)
);

ALTER TABLE public.plan_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_all_plan_modules" ON public.plan_modules FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_plan_modules" ON public.plan_modules FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed default modules
INSERT INTO public.modules (name, slug, description, icon, is_core, sort_order) VALUES
  ('Dashboard', 'dashboard', 'Main dashboard & statistics', 'LayoutDashboard', true, 1),
  ('Customer Management', 'customers', 'Manage ISP customers', 'Users', true, 2),
  ('Billing', 'billing', 'Bill generation & management', 'Receipt', true, 3),
  ('Payments', 'payments', 'Payment collection & tracking', 'CreditCard', true, 4),
  ('Merchant Payments', 'merchant_payments', 'bKash/Nagad merchant payments', 'Smartphone', false, 5),
  ('Support Tickets', 'tickets', 'Customer support system', 'Ticket', false, 6),
  ('SMS & Reminders', 'sms', 'SMS, Email & WhatsApp messaging', 'MessageSquare', false, 7),
  ('Accounting', 'accounting', 'Double-entry accounting system', 'Calculator', false, 8),
  ('Inventory & Sales', 'inventory', 'Product, purchase & sales management', 'Package', false, 9),
  ('Human Resource', 'hr', 'Employee, attendance & payroll', 'UserCog', false, 10),
  ('Supplier Management', 'supplier', 'Supplier & procurement', 'Truck', false, 11),
  ('Reports & Analytics', 'reports', 'Reports, BTRC & analytics', 'BarChart3', false, 12),
  ('User Management', 'users', 'Admin users & access control', 'Shield', true, 13),
  ('Roles & Permissions', 'roles', 'Role-based access control', 'Lock', true, 14),
  ('System Settings', 'settings', 'General & system configuration', 'Settings', true, 15)
ON CONFLICT (slug) DO NOTHING;