
-- Add missing modules
INSERT INTO modules (id, name, slug, description, icon, is_core, is_active, sort_order)
VALUES
  ('b0000000-0000-0000-0000-000000000019', 'Reseller', 'reseller', 'Reseller management system', 'Users', false, true, 19),
  ('b0000000-0000-0000-0000-000000000020', 'Network Map', 'network_map', 'Network topology and map', 'Network', false, true, 20)
ON CONFLICT (id) DO NOTHING;

-- Add missing permissions
INSERT INTO permissions (id, module, action, description) VALUES
  ('c0000000-0000-0000-0017-000000000001', 'fiber_network', 'view', 'View fiber network'),
  ('c0000000-0000-0000-0017-000000000002', 'fiber_network', 'create', 'Create fiber network'),
  ('c0000000-0000-0000-0017-000000000003', 'fiber_network', 'edit', 'Edit fiber network'),
  ('c0000000-0000-0000-0017-000000000004', 'fiber_network', 'delete', 'Delete fiber network'),
  ('c0000000-0000-0000-0018-000000000001', 'reseller', 'view', 'View resellers'),
  ('c0000000-0000-0000-0018-000000000002', 'reseller', 'create', 'Create resellers'),
  ('c0000000-0000-0000-0018-000000000003', 'reseller', 'edit', 'Edit resellers'),
  ('c0000000-0000-0000-0018-000000000004', 'reseller', 'delete', 'Delete resellers'),
  ('c0000000-0000-0000-0019-000000000001', 'network_map', 'view', 'View network map'),
  ('c0000000-0000-0000-0019-000000000002', 'network_map', 'create', 'Create network map'),
  ('c0000000-0000-0000-0019-000000000003', 'network_map', 'edit', 'Edit network map'),
  ('c0000000-0000-0000-0019-000000000004', 'network_map', 'delete', 'Delete network map')
ON CONFLICT (id) DO NOTHING;

-- Add new permissions to Admin & Owner roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd0000000-0000-0000-0000-000000000002', id FROM permissions WHERE module IN ('fiber_network', 'reseller', 'network_map')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd0000000-0000-0000-0000-000000000003', id FROM permissions WHERE module IN ('fiber_network', 'reseller', 'network_map')
ON CONFLICT DO NOTHING;

-- Manager gets all new except delete
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd0000000-0000-0000-0000-000000000004', id FROM permissions WHERE module IN ('fiber_network', 'reseller', 'network_map') AND action != 'delete'
ON CONFLICT DO NOTHING;

-- Technician gets fiber_network and network_map view/create/edit
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'd0000000-0000-0000-0000-000000000006', id FROM permissions WHERE module IN ('fiber_network', 'network_map') AND action IN ('view', 'create', 'edit')
ON CONFLICT DO NOTHING;
