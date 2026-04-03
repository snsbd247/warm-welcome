INSERT INTO tenants (id, name, subdomain, email, phone, plan, plan_id, plan_expire_date, status, max_customers, max_users, setup_status, setup_geo, setup_accounts, setup_templates, setup_ledger, setup_payment_gateways, grace_days) VALUES
('b48f2347-3fc4-402c-87ef-7b977a64e075', 'SpeedNet BD', 'speednet', 'admin@speednet.com.bd', '01711223344', 'Business', '99861956-baa9-42b6-9d5b-255dfa0ff7a2', '2027-04-03', 'active', 500, 10, 'completed', true, true, true, true, true, 3),
('d3a2ae80-298d-47a6-85cf-6d5adead05d1', 'NetZone Pro', 'netzone', 'admin@netzone.com.bd', '01912345678', 'Starter', '78a59abc-0099-458d-b305-586f5f79fd45', '2027-04-03', 'active', 100, 3, 'completed', true, true, true, true, true, 3),
('64a1637e-3441-4de7-adeb-befdbd4e816f', 'FiberLink ISP', 'fiberlink', 'info@fiberlink.net', '01812345678', 'Enterprise', 'b3e4dfbd-7e2b-45ce-a359-a7190fc47b95', '2027-04-03', 'active', 5000, 50, 'completed', true, true, true, true, true, 5);

INSERT INTO profiles (id, full_name, email, username, password_hash, mobile, staff_id, status, tenant_id, must_change_password, language) VALUES
('bb95d295-4198-4171-908f-4de8cf19e9bd', 'Rahim Uddin', 'rahim@speednet.com.bd', 'rahim_owner', '$2b$10$DY6vy1vQT0OSRye4yHMVouYAN4KEqd3nEH9S3IqZdJ1hrS3OqK2nK', '01711111111', 'SN-001', 'active', 'b48f2347-3fc4-402c-87ef-7b977a64e075', false, 'bn'),
('c5310552-4462-4a4b-97c6-823cc8b8636a', 'Karim Hossain', 'karim@speednet.com.bd', 'karim_staff', '$2b$10$DY6vy1vQT0OSRye4yHMVouYAN4KEqd3nEH9S3IqZdJ1hrS3OqK2nK', '01711111112', 'SN-002', 'active', 'b48f2347-3fc4-402c-87ef-7b977a64e075', false, 'bn'),
('2549a2de-18da-4c62-ae1e-6a714c346e4f', 'Jamil Ahmed', 'jamil@speednet.com.bd', 'jamil_tech', '$2b$10$DY6vy1vQT0OSRye4yHMVouYAN4KEqd3nEH9S3IqZdJ1hrS3OqK2nK', '01711111113', 'SN-003', 'active', 'b48f2347-3fc4-402c-87ef-7b977a64e075', false, 'bn'),
('4d9756ee-c653-4bae-b82e-6bfdead8b179', 'Sharif Khan', 'sharif@netzone.com.bd', 'sharif_owner', '$2b$10$DY6vy1vQT0OSRye4yHMVouYAN4KEqd3nEH9S3IqZdJ1hrS3OqK2nK', '01922222221', 'NZ-001', 'active', 'd3a2ae80-298d-47a6-85cf-6d5adead05d1', false, 'en'),
('54afd8fc-19a0-421a-a1ab-6403294abc64', 'Anik Roy', 'anik@netzone.com.bd', 'anik_staff', '$2b$10$DY6vy1vQT0OSRye4yHMVouYAN4KEqd3nEH9S3IqZdJ1hrS3OqK2nK', '01922222222', 'NZ-002', 'active', 'd3a2ae80-298d-47a6-85cf-6d5adead05d1', false, 'en'),
('2bd5bc5c-5374-45e0-a43b-c8d224d53c30', 'Md Ismail Hosain', 'ismail@fiberlink.net', 'ismail162', '$2b$10$DY6vy1vQT0OSRye4yHMVouYAN4KEqd3nEH9S3IqZdJ1hrS3OqK2nK', '01717589069', 'FL-001', 'active', '64a1637e-3441-4de7-adeb-befdbd4e816f', false, 'bn'),
('3d54bda6-11c6-400e-8380-047eacd67caf', 'Tanvir Alam', 'tanvir@fiberlink.net', 'tanvir_ops', '$2b$10$DY6vy1vQT0OSRye4yHMVouYAN4KEqd3nEH9S3IqZdJ1hrS3OqK2nK', '01833333332', 'FL-002', 'active', '64a1637e-3441-4de7-adeb-befdbd4e816f', false, 'bn'),
('09cb433f-7b0d-41f0-aac2-495a45b255a1', 'Sadia Jahan', 'sadia@fiberlink.net', 'sadia_billing', '$2b$10$DY6vy1vQT0OSRye4yHMVouYAN4KEqd3nEH9S3IqZdJ1hrS3OqK2nK', '01833333333', 'FL-003', 'active', '64a1637e-3441-4de7-adeb-befdbd4e816f', false, 'bn'),
('89b763a9-8359-4298-87da-3b8d82cee7d9', 'Ratul Das', 'ratul@fiberlink.net', 'ratul_tech', '$2b$10$DY6vy1vQT0OSRye4yHMVouYAN4KEqd3nEH9S3IqZdJ1hrS3OqK2nK', '01833333334', 'FL-004', 'active', '64a1637e-3441-4de7-adeb-befdbd4e816f', false, 'en');

INSERT INTO custom_roles (id, name, db_role, description, is_system) VALUES
('95a3de97-e4c4-4109-8bd4-756f7e94c486', 'Owner', 'owner', 'Full system access', true),
('52e9a611-3123-467b-9a02-08220994b09a', 'Admin', 'admin', 'Administrative access', true),
('8e8e208f-57b7-4f21-bee1-c001b9f67ba7', 'Manager', 'manager', 'Manager level access', false),
('9192857f-a1ee-4fce-a55a-a3134a16eed3', 'Billing Officer', 'accountant', 'Billing and payment management', false),
('6b8679b8-26c5-4905-ae07-7427fcd46412', 'Technician', 'technician', 'Technical support', false),
('b919a3ed-719c-4a10-86b4-93b821328382', 'Viewer', 'staff', 'Read only access', false);

INSERT INTO user_roles (id, user_id, role, custom_role_id) VALUES
('a1a1a1a1-0001-0001-0001-000000000001', 'bb95d295-4198-4171-908f-4de8cf19e9bd', 'owner', '95a3de97-e4c4-4109-8bd4-756f7e94c486'),
('a1a1a1a1-0001-0001-0001-000000000002', 'c5310552-4462-4a4b-97c6-823cc8b8636a', 'manager', '8e8e208f-57b7-4f21-bee1-c001b9f67ba7'),
('a1a1a1a1-0001-0001-0001-000000000003', '2549a2de-18da-4c62-ae1e-6a714c346e4f', 'technician', '6b8679b8-26c5-4905-ae07-7427fcd46412'),
('a1a1a1a1-0001-0001-0001-000000000004', '4d9756ee-c653-4bae-b82e-6bfdead8b179', 'owner', '95a3de97-e4c4-4109-8bd4-756f7e94c486'),
('a1a1a1a1-0001-0001-0001-000000000005', '54afd8fc-19a0-421a-a1ab-6403294abc64', 'accountant', '9192857f-a1ee-4fce-a55a-a3134a16eed3'),
('a1a1a1a1-0001-0001-0001-000000000006', '2bd5bc5c-5374-45e0-a43b-c8d224d53c30', 'owner', '95a3de97-e4c4-4109-8bd4-756f7e94c486'),
('a1a1a1a1-0001-0001-0001-000000000007', '3d54bda6-11c6-400e-8380-047eacd67caf', 'admin', '52e9a611-3123-467b-9a02-08220994b09a'),
('a1a1a1a1-0001-0001-0001-000000000008', '09cb433f-7b0d-41f0-aac2-495a45b255a1', 'accountant', '9192857f-a1ee-4fce-a55a-a3134a16eed3'),
('a1a1a1a1-0001-0001-0001-000000000009', '89b763a9-8359-4298-87da-3b8d82cee7d9', 'technician', '6b8679b8-26c5-4905-ae07-7427fcd46412');