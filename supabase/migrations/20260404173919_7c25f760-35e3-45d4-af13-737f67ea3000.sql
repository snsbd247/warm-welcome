
-- Seed custom_roles with correct app_role enum values
INSERT INTO custom_roles (id, name, description, db_role, is_system, tenant_id) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Super Admin', 'Full system access', 'super_admin', true, NULL),
  ('d0000000-0000-0000-0000-000000000002', 'Admin', 'ISP administrator with full tenant access', 'admin', true, NULL),
  ('d0000000-0000-0000-0000-000000000003', 'Owner', 'Tenant owner with full access', 'owner', true, NULL),
  ('d0000000-0000-0000-0000-000000000004', 'Manager', 'Manager with broad access', 'manager', true, NULL),
  ('d0000000-0000-0000-0000-000000000005', 'Staff', 'Regular staff with limited access', 'staff', false, NULL),
  ('d0000000-0000-0000-0000-000000000006', 'Technician', 'Technical staff for network operations', 'technician', false, NULL),
  ('d0000000-0000-0000-0000-000000000007', 'Accountant', 'Accounting and financial access', 'accountant', false, NULL)
ON CONFLICT (id) DO NOTHING;

-- Admin gets ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd0000000-0000-0000-0000-000000000002', id FROM permissions
ON CONFLICT DO NOTHING;

-- Owner gets ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd0000000-0000-0000-0000-000000000003', id FROM permissions
ON CONFLICT DO NOTHING;

-- Manager: All except users/roles/settings delete
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd0000000-0000-0000-0000-000000000004', id FROM permissions
WHERE NOT (module IN ('users', 'roles') AND action = 'delete')
  AND NOT (module = 'settings' AND action = 'delete')
ON CONFLICT DO NOTHING;

-- Staff: customer-facing modules view/create/edit + reports view
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd0000000-0000-0000-0000-000000000005', id FROM permissions
WHERE (module IN ('customers', 'billing', 'payments', 'tickets', 'sms', 'packages', 'merchant_payments') AND action IN ('view', 'create', 'edit'))
   OR (module IN ('reports') AND action = 'view')
ON CONFLICT DO NOTHING;

-- Technician: network modules + customer/ticket view/edit
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd0000000-0000-0000-0000-000000000006', id FROM permissions
WHERE (module IN ('mikrotik', 'fiber_network', 'network_map') AND action IN ('view', 'create', 'edit'))
   OR (module IN ('customers', 'tickets') AND action IN ('view', 'edit'))
   OR (module = 'settings' AND action = 'view')
ON CONFLICT DO NOTHING;

-- Accountant: finance modules + read-only customers/hr
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd0000000-0000-0000-0000-000000000007', id FROM permissions
WHERE (module IN ('accounting', 'billing', 'payments', 'merchant_payments', 'reports', 'supplier', 'inventory') AND action IN ('view', 'create', 'edit'))
   OR (module IN ('customers', 'hr') AND action = 'view')
ON CONFLICT DO NOTHING;
