
INSERT INTO system_settings (setting_key, setting_value, tenant_id) VALUES
  ('footer_text', '© 2025-{year} ISP Billing System. All Rights Reserved.', NULL),
  ('company_name', 'ISP Billing System', NULL),
  ('footer_link', '#', NULL),
  ('footer_developer', 'Sync & Solutions IT', NULL),
  ('system_version', '1.0.1', NULL),
  ('auto_update_year', 'true', NULL),
  ('enabled_modules', '["billing","payments","merchant_payments","tickets","sms","accounting","inventory","supplier","reports","users","roles","settings","hr","customers","mikrotik","packages","fiber_network","reseller","network_map"]', NULL),
  ('invoice_footer', 'Thank you for using our internet service.', NULL),
  ('ledger_type', 'running_balance', NULL)
ON CONFLICT ON CONSTRAINT system_settings_tenant_setting_key DO NOTHING;
