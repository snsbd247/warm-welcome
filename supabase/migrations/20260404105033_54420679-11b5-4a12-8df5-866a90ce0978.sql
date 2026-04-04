
-- ============================================
-- 1. Seed Custom Roles (7 system roles)
-- ============================================
INSERT INTO public.custom_roles (id, name, description, db_role, is_system) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Super Admin', 'Full system access', 'super_admin', true),
  ('a0000000-0000-0000-0000-000000000002', 'Admin', 'Full tenant access', 'admin', true),
  ('a0000000-0000-0000-0000-000000000003', 'Owner', 'Tenant owner', 'owner', true),
  ('a0000000-0000-0000-0000-000000000004', 'Manager', 'Management access', 'manager', true),
  ('a0000000-0000-0000-0000-000000000005', 'Staff', 'Basic operations', 'staff', false),
  ('a0000000-0000-0000-0000-000000000006', 'Technician', 'Technical support', 'technician', false),
  ('a0000000-0000-0000-0000-000000000007', 'Accountant', 'Finance operations', 'accountant', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. Seed Modules (18 modules)
-- ============================================
INSERT INTO public.modules (id, name, slug, description, icon, is_core, is_active, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Dashboard', 'dashboard', 'Main dashboard', 'LayoutDashboard', true, true, 1),
  ('b0000000-0000-0000-0000-000000000002', 'Customers', 'customers', 'Customer management', 'Users', true, true, 2),
  ('b0000000-0000-0000-0000-000000000003', 'Billing', 'billing', 'Bill generation & management', 'Receipt', false, true, 3),
  ('b0000000-0000-0000-0000-000000000004', 'Payments', 'payments', 'Payment collection', 'CreditCard', false, true, 4),
  ('b0000000-0000-0000-0000-000000000005', 'Merchant Payments', 'merchant_payments', 'bKash/Nagad payments', 'Smartphone', false, true, 5),
  ('b0000000-0000-0000-0000-000000000006', 'Packages', 'packages', 'Internet packages', 'Package', true, true, 6),
  ('b0000000-0000-0000-0000-000000000007', 'MikroTik', 'mikrotik', 'Router management', 'Router', false, true, 7),
  ('b0000000-0000-0000-0000-000000000008', 'SMS', 'sms', 'SMS notifications', 'MessageSquare', false, true, 8),
  ('b0000000-0000-0000-0000-000000000009', 'Tickets', 'tickets', 'Support tickets', 'Ticket', false, true, 9),
  ('b0000000-0000-0000-0000-000000000010', 'Accounting', 'accounting', 'Chart of accounts & ledger', 'Calculator', false, true, 10),
  ('b0000000-0000-0000-0000-000000000011', 'Inventory', 'inventory', 'Product & stock management', 'Warehouse', false, true, 11),
  ('b0000000-0000-0000-0000-000000000012', 'Supplier', 'supplier', 'Supplier management', 'Truck', false, true, 12),
  ('b0000000-0000-0000-0000-000000000013', 'HR', 'hr', 'Human resources', 'UserCog', false, true, 13),
  ('b0000000-0000-0000-0000-000000000014', 'Reports', 'reports', 'Reports & analytics', 'BarChart3', false, true, 14),
  ('b0000000-0000-0000-0000-000000000015', 'Users', 'users', 'User management', 'UserPlus', true, true, 15),
  ('b0000000-0000-0000-0000-000000000016', 'Roles', 'roles', 'Role & permission management', 'Shield', true, true, 16),
  ('b0000000-0000-0000-0000-000000000017', 'Settings', 'settings', 'System settings', 'Settings', true, true, 17),
  ('b0000000-0000-0000-0000-000000000018', 'Fiber Network', 'fiber_network', 'FTTH/Fiber management', 'Cable', false, true, 18)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. Seed Permissions (16 modules × 4 actions = 64)
-- ============================================
INSERT INTO public.permissions (id, module, action, description) VALUES
  -- customers
  ('c0000000-0000-0000-0001-000000000001', 'customers', 'view', 'View customers'),
  ('c0000000-0000-0000-0001-000000000002', 'customers', 'create', 'Create customers'),
  ('c0000000-0000-0000-0001-000000000003', 'customers', 'edit', 'Edit customers'),
  ('c0000000-0000-0000-0001-000000000004', 'customers', 'delete', 'Delete customers'),
  -- billing
  ('c0000000-0000-0000-0002-000000000001', 'billing', 'view', 'View billing'),
  ('c0000000-0000-0000-0002-000000000002', 'billing', 'create', 'Create billing'),
  ('c0000000-0000-0000-0002-000000000003', 'billing', 'edit', 'Edit billing'),
  ('c0000000-0000-0000-0002-000000000004', 'billing', 'delete', 'Delete billing'),
  -- payments
  ('c0000000-0000-0000-0003-000000000001', 'payments', 'view', 'View payments'),
  ('c0000000-0000-0000-0003-000000000002', 'payments', 'create', 'Create payments'),
  ('c0000000-0000-0000-0003-000000000003', 'payments', 'edit', 'Edit payments'),
  ('c0000000-0000-0000-0003-000000000004', 'payments', 'delete', 'Delete payments'),
  -- merchant_payments
  ('c0000000-0000-0000-0004-000000000001', 'merchant_payments', 'view', 'View merchant payments'),
  ('c0000000-0000-0000-0004-000000000002', 'merchant_payments', 'create', 'Create merchant payments'),
  ('c0000000-0000-0000-0004-000000000003', 'merchant_payments', 'edit', 'Edit merchant payments'),
  ('c0000000-0000-0000-0004-000000000004', 'merchant_payments', 'delete', 'Delete merchant payments'),
  -- tickets
  ('c0000000-0000-0000-0005-000000000001', 'tickets', 'view', 'View tickets'),
  ('c0000000-0000-0000-0005-000000000002', 'tickets', 'create', 'Create tickets'),
  ('c0000000-0000-0000-0005-000000000003', 'tickets', 'edit', 'Edit tickets'),
  ('c0000000-0000-0000-0005-000000000004', 'tickets', 'delete', 'Delete tickets'),
  -- sms
  ('c0000000-0000-0000-0006-000000000001', 'sms', 'view', 'View sms'),
  ('c0000000-0000-0000-0006-000000000002', 'sms', 'create', 'Create sms'),
  ('c0000000-0000-0000-0006-000000000003', 'sms', 'edit', 'Edit sms'),
  ('c0000000-0000-0000-0006-000000000004', 'sms', 'delete', 'Delete sms'),
  -- accounting
  ('c0000000-0000-0000-0007-000000000001', 'accounting', 'view', 'View accounting'),
  ('c0000000-0000-0000-0007-000000000002', 'accounting', 'create', 'Create accounting'),
  ('c0000000-0000-0000-0007-000000000003', 'accounting', 'edit', 'Edit accounting'),
  ('c0000000-0000-0000-0007-000000000004', 'accounting', 'delete', 'Delete accounting'),
  -- inventory
  ('c0000000-0000-0000-0008-000000000001', 'inventory', 'view', 'View inventory'),
  ('c0000000-0000-0000-0008-000000000002', 'inventory', 'create', 'Create inventory'),
  ('c0000000-0000-0000-0008-000000000003', 'inventory', 'edit', 'Edit inventory'),
  ('c0000000-0000-0000-0008-000000000004', 'inventory', 'delete', 'Delete inventory'),
  -- hr
  ('c0000000-0000-0000-0009-000000000001', 'hr', 'view', 'View hr'),
  ('c0000000-0000-0000-0009-000000000002', 'hr', 'create', 'Create hr'),
  ('c0000000-0000-0000-0009-000000000003', 'hr', 'edit', 'Edit hr'),
  ('c0000000-0000-0000-0009-000000000004', 'hr', 'delete', 'Delete hr'),
  -- supplier
  ('c0000000-0000-0000-0010-000000000001', 'supplier', 'view', 'View supplier'),
  ('c0000000-0000-0000-0010-000000000002', 'supplier', 'create', 'Create supplier'),
  ('c0000000-0000-0000-0010-000000000003', 'supplier', 'edit', 'Edit supplier'),
  ('c0000000-0000-0000-0010-000000000004', 'supplier', 'delete', 'Delete supplier'),
  -- reports
  ('c0000000-0000-0000-0011-000000000001', 'reports', 'view', 'View reports'),
  ('c0000000-0000-0000-0011-000000000002', 'reports', 'create', 'Create reports'),
  ('c0000000-0000-0000-0011-000000000003', 'reports', 'edit', 'Edit reports'),
  ('c0000000-0000-0000-0011-000000000004', 'reports', 'delete', 'Delete reports'),
  -- settings
  ('c0000000-0000-0000-0012-000000000001', 'settings', 'view', 'View settings'),
  ('c0000000-0000-0000-0012-000000000002', 'settings', 'create', 'Create settings'),
  ('c0000000-0000-0000-0012-000000000003', 'settings', 'edit', 'Edit settings'),
  ('c0000000-0000-0000-0012-000000000004', 'settings', 'delete', 'Delete settings'),
  -- users
  ('c0000000-0000-0000-0013-000000000001', 'users', 'view', 'View users'),
  ('c0000000-0000-0000-0013-000000000002', 'users', 'create', 'Create users'),
  ('c0000000-0000-0000-0013-000000000003', 'users', 'edit', 'Edit users'),
  ('c0000000-0000-0000-0013-000000000004', 'users', 'delete', 'Delete users'),
  -- roles
  ('c0000000-0000-0000-0014-000000000001', 'roles', 'view', 'View roles'),
  ('c0000000-0000-0000-0014-000000000002', 'roles', 'create', 'Create roles'),
  ('c0000000-0000-0000-0014-000000000003', 'roles', 'edit', 'Edit roles'),
  ('c0000000-0000-0000-0014-000000000004', 'roles', 'delete', 'Delete roles'),
  -- mikrotik
  ('c0000000-0000-0000-0015-000000000001', 'mikrotik', 'view', 'View mikrotik'),
  ('c0000000-0000-0000-0015-000000000002', 'mikrotik', 'create', 'Create mikrotik'),
  ('c0000000-0000-0000-0015-000000000003', 'mikrotik', 'edit', 'Edit mikrotik'),
  ('c0000000-0000-0000-0015-000000000004', 'mikrotik', 'delete', 'Delete mikrotik'),
  -- packages
  ('c0000000-0000-0000-0016-000000000001', 'packages', 'view', 'View packages'),
  ('c0000000-0000-0000-0016-000000000002', 'packages', 'create', 'Create packages'),
  ('c0000000-0000-0000-0016-000000000003', 'packages', 'edit', 'Edit packages'),
  ('c0000000-0000-0000-0016-000000000004', 'packages', 'delete', 'Delete packages')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. Seed Role Permissions
-- ============================================

-- Helper: collect all 64 permission IDs
-- Super Admin, Admin, Owner → ALL 64 permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.custom_roles r
CROSS JOIN public.permissions p
WHERE r.name IN ('Super Admin', 'Admin', 'Owner')
ON CONFLICT DO NOTHING;

-- Manager → all except users.create, users.delete, roles.create, roles.edit, roles.delete, settings.delete
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.custom_roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Manager'
  AND NOT (p.module = 'users' AND p.action IN ('create', 'delete'))
  AND NOT (p.module = 'roles' AND p.action IN ('create', 'edit', 'delete'))
  AND NOT (p.module = 'settings' AND p.action = 'delete')
ON CONFLICT DO NOTHING;

-- Staff → view all + full CRUD on core modules
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.custom_roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Staff'
  AND (p.action = 'view' OR p.module IN ('customers', 'billing', 'payments', 'merchant_payments', 'tickets', 'sms', 'packages'))
ON CONFLICT DO NOTHING;

-- Technician → view customers, all tickets, all mikrotik, view reports
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.custom_roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Technician'
  AND (
    (p.module = 'customers' AND p.action = 'view')
    OR p.module = 'tickets'
    OR p.module = 'mikrotik'
    OR (p.module = 'reports' AND p.action = 'view')
  )
ON CONFLICT DO NOTHING;

-- Accountant → accounting, payments, billing, merchant_payments, reports, supplier, inventory, hr + view customers
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.custom_roles r
CROSS JOIN public.permissions p
WHERE r.name = 'Accountant'
  AND (
    p.module IN ('accounting', 'payments', 'billing', 'merchant_payments', 'reports', 'supplier', 'inventory', 'hr')
    OR (p.module = 'customers' AND p.action = 'view')
  )
ON CONFLICT DO NOTHING;
