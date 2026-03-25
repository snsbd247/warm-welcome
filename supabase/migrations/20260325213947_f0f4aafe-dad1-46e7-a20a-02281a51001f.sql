
-- Designations
INSERT INTO designations (id, name, description, status) VALUES
  ('a1000001-0000-0000-0000-000000000001', 'Network Engineer', 'Manages network infrastructure', 'active'),
  ('a1000001-0000-0000-0000-000000000002', 'Field Technician', 'On-site installation and repair', 'active'),
  ('a1000001-0000-0000-0000-000000000003', 'Customer Support', 'Handles customer queries', 'active'),
  ('a1000001-0000-0000-0000-000000000004', 'Accountant', 'Manages financial records', 'active'),
  ('a1000001-0000-0000-0000-000000000005', 'Office Manager', 'General office management', 'active')
ON CONFLICT DO NOTHING;

-- Employees
INSERT INTO employees (id, employee_id, name, phone, email, designation_id, salary, joining_date, nid, address, status) VALUES
  ('a2000001-0000-0000-0000-000000000001', 'EMP-001', 'Rafiq Ahmed', '01711111111', 'rafiq@smartisp.com', 'a1000001-0000-0000-0000-000000000001', 35000, '2023-01-15', '1990123456789', 'Mirpur-10, Dhaka', 'active'),
  ('a2000001-0000-0000-0000-000000000002', 'EMP-002', 'Kamal Hossain', '01722222222', 'kamal@smartisp.com', 'a1000001-0000-0000-0000-000000000002', 20000, '2023-03-01', '1991234567890', 'Uttara Sec-7, Dhaka', 'active'),
  ('a2000001-0000-0000-0000-000000000003', 'EMP-003', 'Nasima Begum', '01733333333', 'nasima@smartisp.com', 'a1000001-0000-0000-0000-000000000003', 18000, '2023-06-10', '1992345678901', 'Dhanmondi-27, Dhaka', 'active'),
  ('a2000001-0000-0000-0000-000000000004', 'EMP-004', 'Jahangir Alam', '01744444444', 'jahangir@smartisp.com', 'a1000001-0000-0000-0000-000000000004', 25000, '2023-02-20', '1993456789012', 'Mohammadpur, Dhaka', 'active'),
  ('a2000001-0000-0000-0000-000000000005', 'EMP-005', 'Ruma Akter', '01755555555', 'ruma@smartisp.com', 'a1000001-0000-0000-0000-000000000005', 22000, '2024-01-05', '1994567890123', 'Banani, Dhaka', 'active')
ON CONFLICT DO NOTHING;

-- Customers
INSERT INTO customers (id, customer_id, name, phone, alt_phone, email, father_name, area, road, house, city, district, package_id, monthly_bill, discount, due_date_day, pppoe_username, pppoe_password, installation_date, status, connection_status, username) VALUES
  ('f1000001-0000-0000-0000-000000000001', 'CUST-0001', 'Md. Rahim Uddin', '01811111111', '01811111112', 'rahim@gmail.com', 'Abdul Karim', 'Mirpur', 'Road 5', 'House 12', 'Dhaka', 'Dhaka', 'e0000001-0000-0000-0000-000000000001', 500, 0, 5, 'rahim_pppoe', 'pass123', '2024-01-15', 'active', 'active', 'rahim'),
  ('f1000001-0000-0000-0000-000000000002', 'CUST-0002', 'Fatima Khatun', '01822222222', NULL, 'fatima@gmail.com', 'Md. Hasan', 'Uttara', 'Sector 7, Road 3', 'House 8', 'Dhaka', 'Dhaka', 'e0000001-0000-0000-0000-000000000002', 800, 50, 10, 'fatima_pppoe', 'pass123', '2024-02-01', 'active', 'active', 'fatima'),
  ('f1000001-0000-0000-0000-000000000003', 'CUST-0003', 'Karim Sheikh', '01833333333', NULL, NULL, 'Late Sobhan', 'Dhanmondi', 'Road 27', 'House 15A', 'Dhaka', 'Dhaka', 'e0000001-0000-0000-0000-000000000003', 1200, 0, 1, 'karim_pppoe', 'pass123', '2024-01-20', 'active', 'active', 'karim'),
  ('f1000001-0000-0000-0000-000000000004', 'CUST-0004', 'Sultana Razia', '01844444444', '01844444445', 'sultana@yahoo.com', 'Md. Iqbal', 'Mirpur', 'Road 11', 'House 3B', 'Dhaka', 'Dhaka', 'e0000001-0000-0000-0000-000000000001', 500, 0, 15, 'sultana_pppoe', 'pass123', '2024-03-10', 'active', 'active', 'sultana'),
  ('f1000001-0000-0000-0000-000000000005', 'CUST-0005', 'Jamal Hossain', '01855555555', NULL, 'jamal@gmail.com', 'Abul Hossain', 'Uttara', 'Sector 11, Road 1', 'House 22', 'Dhaka', 'Dhaka', 'e0000001-0000-0000-0000-000000000004', 2000, 200, 5, 'jamal_pppoe', 'pass123', '2024-04-01', 'active', 'active', 'jamal'),
  ('f1000001-0000-0000-0000-000000000006', 'CUST-0006', 'Nusrat Jahan', '01866666666', NULL, NULL, 'Farid Ahmed', 'Mirpur', 'Road 2', 'House 7', 'Dhaka', 'Dhaka', 'e0000001-0000-0000-0000-000000000002', 800, 0, 10, 'nusrat_pppoe', 'pass123', '2024-05-15', 'active', 'active', 'nusrat'),
  ('f1000001-0000-0000-0000-000000000007', 'CUST-0007', 'Imran Khan', '01877777777', NULL, 'imran@outlook.com', 'Salim Khan', 'Dhanmondi', 'Road 8', 'House 19', 'Dhaka', 'Dhaka', 'e0000001-0000-0000-0000-000000000003', 1200, 100, 1, 'imran_pppoe', 'pass123', '2024-02-28', 'suspended', 'suspended', NULL),
  ('f1000001-0000-0000-0000-000000000008', 'CUST-0008', 'Sabina Yesmin', '01888888888', NULL, NULL, 'Abdul Mannan', 'Uttara', 'Sector 3, Road 5', 'House 11', 'Dhaka', 'Dhaka', 'e0000001-0000-0000-0000-000000000001', 500, 0, 20, 'sabina_pppoe', 'pass123', '2024-06-01', 'active', 'active', 'sabina'),
  ('f1000001-0000-0000-0000-000000000009', 'CUST-0009', 'Tanvir Rahman', '01899999999', '01899999990', 'tanvir@gmail.com', 'Mokhlesur Rahman', 'Mirpur', 'Road 14', 'House 5C', 'Dhaka', 'Dhaka', 'e0000001-0000-0000-0000-000000000004', 2000, 0, 5, 'tanvir_pppoe', 'pass123', '2024-03-20', 'active', 'active', 'tanvir'),
  ('f1000001-0000-0000-0000-000000000010', 'CUST-0010', 'Ariful Islam', '01800000000', NULL, 'arif@gmail.com', 'Nurul Islam', 'Dhanmondi', 'Road 15', 'House 2', 'Dhaka', 'Dhaka', 'e0000001-0000-0000-0000-000000000002', 800, 0, 10, 'ariful_pppoe', 'pass123', '2024-07-01', 'disconnected', 'suspended', NULL)
ON CONFLICT DO NOTHING;

-- Bills (using valid hex UUIDs - b->bb, p->aa, etc)
INSERT INTO bills (id, customer_id, month, amount, status, due_date, paid_date) VALUES
  ('bb000001-0000-0000-0000-000000000001', 'f1000001-0000-0000-0000-000000000001', '2025-01', 500, 'paid', '2025-01-05', '2025-01-03'),
  ('bb000001-0000-0000-0000-000000000002', 'f1000001-0000-0000-0000-000000000002', '2025-01', 750, 'paid', '2025-01-10', '2025-01-08'),
  ('bb000001-0000-0000-0000-000000000003', 'f1000001-0000-0000-0000-000000000003', '2025-01', 1200, 'paid', '2025-01-01', '2025-01-01'),
  ('bb000001-0000-0000-0000-000000000004', 'f1000001-0000-0000-0000-000000000004', '2025-01', 500, 'paid', '2025-01-15', '2025-01-14'),
  ('bb000001-0000-0000-0000-000000000005', 'f1000001-0000-0000-0000-000000000005', '2025-01', 1800, 'paid', '2025-01-05', '2025-01-05'),
  ('bb000001-0000-0000-0000-000000000006', 'f1000001-0000-0000-0000-000000000006', '2025-01', 800, 'paid', '2025-01-10', '2025-01-09'),
  ('bb000001-0000-0000-0000-000000000007', 'f1000001-0000-0000-0000-000000000007', '2025-01', 1100, 'unpaid', '2025-01-01', NULL),
  ('bb000001-0000-0000-0000-000000000008', 'f1000001-0000-0000-0000-000000000008', '2025-01', 500, 'paid', '2025-01-20', '2025-01-18'),
  ('bb000001-0000-0000-0000-000000000009', 'f1000001-0000-0000-0000-000000000009', '2025-01', 2000, 'paid', '2025-01-05', '2025-01-04'),
  ('bb000001-0000-0000-0000-000000000010', 'f1000001-0000-0000-0000-000000000010', '2025-01', 800, 'unpaid', '2025-01-10', NULL),
  ('bb000001-0000-0000-0000-000000000011', 'f1000001-0000-0000-0000-000000000001', '2025-02', 500, 'paid', '2025-02-05', '2025-02-04'),
  ('bb000001-0000-0000-0000-000000000012', 'f1000001-0000-0000-0000-000000000002', '2025-02', 750, 'paid', '2025-02-10', '2025-02-09'),
  ('bb000001-0000-0000-0000-000000000013', 'f1000001-0000-0000-0000-000000000003', '2025-02', 1200, 'paid', '2025-02-01', '2025-02-02'),
  ('bb000001-0000-0000-0000-000000000014', 'f1000001-0000-0000-0000-000000000004', '2025-02', 500, 'unpaid', '2025-02-15', NULL),
  ('bb000001-0000-0000-0000-000000000015', 'f1000001-0000-0000-0000-000000000005', '2025-02', 1800, 'paid', '2025-02-05', '2025-02-05'),
  ('bb000001-0000-0000-0000-000000000016', 'f1000001-0000-0000-0000-000000000006', '2025-02', 800, 'paid', '2025-02-10', '2025-02-10'),
  ('bb000001-0000-0000-0000-000000000017', 'f1000001-0000-0000-0000-000000000009', '2025-02', 2000, 'paid', '2025-02-05', '2025-02-06'),
  ('bb000001-0000-0000-0000-000000000018', 'f1000001-0000-0000-0000-000000000001', '2025-03', 500, 'unpaid', '2025-03-05', NULL),
  ('bb000001-0000-0000-0000-000000000019', 'f1000001-0000-0000-0000-000000000002', '2025-03', 750, 'unpaid', '2025-03-10', NULL),
  ('bb000001-0000-0000-0000-000000000020', 'f1000001-0000-0000-0000-000000000003', '2025-03', 1200, 'paid', '2025-03-01', '2025-03-01'),
  ('bb000001-0000-0000-0000-000000000021', 'f1000001-0000-0000-0000-000000000005', '2025-03', 1800, 'unpaid', '2025-03-05', NULL),
  ('bb000001-0000-0000-0000-000000000022', 'f1000001-0000-0000-0000-000000000009', '2025-03', 2000, 'unpaid', '2025-03-05', NULL)
ON CONFLICT DO NOTHING;

-- Payments
INSERT INTO payments (id, customer_id, bill_id, amount, payment_method, status, month, paid_at) VALUES
  ('aa000001-0000-0000-0000-000000000001', 'f1000001-0000-0000-0000-000000000001', 'bb000001-0000-0000-0000-000000000001', 500, 'cash', 'completed', '2025-01', '2025-01-03'),
  ('aa000001-0000-0000-0000-000000000002', 'f1000001-0000-0000-0000-000000000002', 'bb000001-0000-0000-0000-000000000002', 750, 'bkash', 'completed', '2025-01', '2025-01-08'),
  ('aa000001-0000-0000-0000-000000000003', 'f1000001-0000-0000-0000-000000000003', 'bb000001-0000-0000-0000-000000000003', 1200, 'cash', 'completed', '2025-01', '2025-01-01'),
  ('aa000001-0000-0000-0000-000000000004', 'f1000001-0000-0000-0000-000000000004', 'bb000001-0000-0000-0000-000000000004', 500, 'nagad', 'completed', '2025-01', '2025-01-14'),
  ('aa000001-0000-0000-0000-000000000005', 'f1000001-0000-0000-0000-000000000005', 'bb000001-0000-0000-0000-000000000005', 1800, 'bkash', 'completed', '2025-01', '2025-01-05'),
  ('aa000001-0000-0000-0000-000000000006', 'f1000001-0000-0000-0000-000000000006', 'bb000001-0000-0000-0000-000000000006', 800, 'cash', 'completed', '2025-01', '2025-01-09'),
  ('aa000001-0000-0000-0000-000000000007', 'f1000001-0000-0000-0000-000000000008', 'bb000001-0000-0000-0000-000000000008', 500, 'cash', 'completed', '2025-01', '2025-01-18'),
  ('aa000001-0000-0000-0000-000000000008', 'f1000001-0000-0000-0000-000000000009', 'bb000001-0000-0000-0000-000000000009', 2000, 'bank', 'completed', '2025-01', '2025-01-04'),
  ('aa000001-0000-0000-0000-000000000009', 'f1000001-0000-0000-0000-000000000001', 'bb000001-0000-0000-0000-000000000011', 500, 'cash', 'completed', '2025-02', '2025-02-04'),
  ('aa000001-0000-0000-0000-000000000010', 'f1000001-0000-0000-0000-000000000002', 'bb000001-0000-0000-0000-000000000012', 750, 'bkash', 'completed', '2025-02', '2025-02-09'),
  ('aa000001-0000-0000-0000-000000000011', 'f1000001-0000-0000-0000-000000000003', 'bb000001-0000-0000-0000-000000000013', 1200, 'cash', 'completed', '2025-02', '2025-02-02'),
  ('aa000001-0000-0000-0000-000000000012', 'f1000001-0000-0000-0000-000000000005', 'bb000001-0000-0000-0000-000000000015', 1800, 'nagad', 'completed', '2025-02', '2025-02-05'),
  ('aa000001-0000-0000-0000-000000000013', 'f1000001-0000-0000-0000-000000000006', 'bb000001-0000-0000-0000-000000000016', 800, 'cash', 'completed', '2025-02', '2025-02-10'),
  ('aa000001-0000-0000-0000-000000000014', 'f1000001-0000-0000-0000-000000000009', 'bb000001-0000-0000-0000-000000000017', 2000, 'bank', 'completed', '2025-02', '2025-02-06'),
  ('aa000001-0000-0000-0000-000000000015', 'f1000001-0000-0000-0000-000000000003', 'bb000001-0000-0000-0000-000000000020', 1200, 'bkash', 'completed', '2025-03', '2025-03-01')
ON CONFLICT DO NOTHING;

-- Products
INSERT INTO products (id, name, sku, category, buy_price, sell_price, stock, unit, description, status) VALUES
  ('ee000001-0000-0000-0000-000000000001', 'ONU Device (GPON)', 'ONU-GP-001', 'Network Equipment', 800, 1200, 50, 'pcs', 'GPON ONU for fiber connection', 'active'),
  ('ee000001-0000-0000-0000-000000000002', 'WiFi Router (TP-Link)', 'RTR-TP-001', 'Network Equipment', 1500, 2200, 30, 'pcs', 'TP-Link AC1200 WiFi Router', 'active'),
  ('ee000001-0000-0000-0000-000000000003', 'Fiber Patch Cord 3m', 'FPC-3M-001', 'Cable Accessories', 80, 150, 200, 'pcs', '3 meter SC-SC fiber patch cord', 'active'),
  ('ee000001-0000-0000-0000-000000000004', 'RJ45 Connector (100pc)', 'RJ45-100', 'Cable Accessories', 300, 500, 100, 'box', 'Cat6 RJ45 connectors pack of 100', 'active'),
  ('ee000001-0000-0000-0000-000000000005', 'Cat6 UTP Cable (305m)', 'CAT6-305', 'Cable Accessories', 4500, 6000, 20, 'roll', '305 meter Cat6 UTP cable roll', 'active'),
  ('ee000001-0000-0000-0000-000000000006', 'MikroTik hEX S', 'MK-HEX-S', 'Network Equipment', 6500, 8500, 10, 'pcs', 'MikroTik RouterBOARD hEX S', 'active'),
  ('ee000001-0000-0000-0000-000000000007', 'Fiber Splitter 1:8', 'FSPL-1-8', 'Network Equipment', 1200, 1800, 25, 'pcs', 'PLC Fiber Optic Splitter 1x8', 'active'),
  ('ee000001-0000-0000-0000-000000000008', 'UPS (650VA)', 'UPS-650', 'Power', 2500, 3500, 15, 'pcs', '650VA Line Interactive UPS', 'active')
ON CONFLICT DO NOTHING;

-- Suppliers
INSERT INTO suppliers (id, name, phone, email, company, address, total_due, status) VALUES
  ('cc000001-0000-0000-0000-000000000001', 'Md. Shahidul Islam', '01911111111', 'shahidul@bdcom.com', 'BDCOM Networks', 'Gulshan-2, Dhaka', 15000, 'active'),
  ('cc000001-0000-0000-0000-000000000002', 'Tariqul Hasan', '01922222222', 'tariq@netplus.com', 'NetPlus Technologies', 'Banani, Dhaka', 8500, 'active'),
  ('cc000001-0000-0000-0000-000000000003', 'Rezaul Karim', '01933333333', 'reza@fiberbd.com', 'FiberBD Solutions', 'Uttara, Dhaka', 0, 'active')
ON CONFLICT DO NOTHING;

-- Purchases
INSERT INTO purchases (id, purchase_no, supplier_id, date, total_amount, paid_amount, status, notes) VALUES
  ('dd000001-0000-0000-0000-000000000001', 'PO-00001', 'cc000001-0000-0000-0000-000000000001', '2025-01-10', 40000, 25000, 'partial', 'ONU devices bulk order'),
  ('dd000001-0000-0000-0000-000000000002', 'PO-00002', 'cc000001-0000-0000-0000-000000000002', '2025-01-20', 45000, 45000, 'paid', 'Router and cable stock'),
  ('dd000001-0000-0000-0000-000000000003', 'PO-00003', 'cc000001-0000-0000-0000-000000000003', '2025-02-15', 24000, 24000, 'paid', 'Fiber splitters and patch cords')
ON CONFLICT DO NOTHING;

INSERT INTO purchase_items (id, purchase_id, product_id, quantity, unit_price, description) VALUES
  ('dd100001-0000-0000-0000-000000000001', 'dd000001-0000-0000-0000-000000000001', 'ee000001-0000-0000-0000-000000000001', 50, 800, 'ONU Device GPON'),
  ('dd100001-0000-0000-0000-000000000002', 'dd000001-0000-0000-0000-000000000002', 'ee000001-0000-0000-0000-000000000002', 30, 1500, 'WiFi Router'),
  ('dd100001-0000-0000-0000-000000000003', 'dd000001-0000-0000-0000-000000000003', 'ee000001-0000-0000-0000-000000000007', 20, 1200, 'Fiber Splitter')
ON CONFLICT DO NOTHING;

-- Expenses
INSERT INTO expenses (id, category, amount, date, description, payment_method, status) VALUES
  ('ae000001-0000-0000-0000-000000000001', 'Rent', 25000, '2025-01-01', 'Office rent January 2025', 'bank', 'active'),
  ('ae000001-0000-0000-0000-000000000002', 'Utility', 5500, '2025-01-05', 'Electricity bill January', 'cash', 'active'),
  ('ae000001-0000-0000-0000-000000000003', 'Internet', 15000, '2025-01-10', 'Bandwidth bill from NTTN', 'bank', 'active'),
  ('ae000001-0000-0000-0000-000000000004', 'Salary', 120000, '2025-01-28', 'Staff salary January 2025', 'bank', 'active'),
  ('ae000001-0000-0000-0000-000000000005', 'Rent', 25000, '2025-02-01', 'Office rent February 2025', 'bank', 'active'),
  ('ae000001-0000-0000-0000-000000000006', 'Utility', 6200, '2025-02-05', 'Electricity bill February', 'cash', 'active'),
  ('ae000001-0000-0000-0000-000000000007', 'Internet', 15000, '2025-02-10', 'Bandwidth bill from NTTN', 'bank', 'active'),
  ('ae000001-0000-0000-0000-000000000008', 'Transport', 3500, '2025-02-15', 'Field team transport', 'cash', 'active'),
  ('ae000001-0000-0000-0000-000000000009', 'Maintenance', 8000, '2025-03-01', 'Server room AC repair', 'cash', 'active'),
  ('ae000001-0000-0000-0000-000000000010', 'Rent', 25000, '2025-03-01', 'Office rent March 2025', 'bank', 'active')
ON CONFLICT DO NOTHING;

-- Sales
INSERT INTO sales (id, sale_no, customer_name, customer_phone, sale_date, total, discount, tax, paid_amount, payment_method, status, notes) VALUES
  ('af000001-0000-0000-0000-000000000001', 'INV-00001', 'Md. Rahim Uddin', '01811111111', '2025-01-15', 3400, 0, 0, 3400, 'cash', 'completed', 'ONU plus Router'),
  ('af000001-0000-0000-0000-000000000002', 'INV-00002', 'Jamal Hossain', '01855555555', '2025-01-20', 1200, 100, 0, 1100, 'bkash', 'completed', 'ONU replacement'),
  ('af000001-0000-0000-0000-000000000003', 'INV-00003', 'Nusrat Jahan', '01866666666', '2025-02-05', 2350, 0, 0, 2350, 'cash', 'completed', 'Router plus patch cord'),
  ('af000001-0000-0000-0000-000000000004', 'INV-00004', 'Tanvir Rahman', '01899999999', '2025-03-10', 8500, 500, 0, 8000, 'bank', 'completed', 'MikroTik hEX S')
ON CONFLICT DO NOTHING;

INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, description) VALUES
  ('af100001-0000-0000-0000-000000000001', 'af000001-0000-0000-0000-000000000001', 'ee000001-0000-0000-0000-000000000001', 1, 1200, 'ONU Device'),
  ('af100001-0000-0000-0000-000000000002', 'af000001-0000-0000-0000-000000000001', 'ee000001-0000-0000-0000-000000000002', 1, 2200, 'WiFi Router'),
  ('af100001-0000-0000-0000-000000000003', 'af000001-0000-0000-0000-000000000002', 'ee000001-0000-0000-0000-000000000001', 1, 1200, 'ONU Device'),
  ('af100001-0000-0000-0000-000000000004', 'af000001-0000-0000-0000-000000000003', 'ee000001-0000-0000-0000-000000000002', 1, 2200, 'Router'),
  ('af100001-0000-0000-0000-000000000005', 'af000001-0000-0000-0000-000000000003', 'ee000001-0000-0000-0000-000000000003', 1, 150, 'Patch Cord'),
  ('af100001-0000-0000-0000-000000000006', 'af000001-0000-0000-0000-000000000004', 'ee000001-0000-0000-0000-000000000006', 1, 8500, 'MikroTik hEX S')
ON CONFLICT DO NOTHING;

-- Expense/Income Heads
INSERT INTO expense_heads (id, name, description, status) VALUES
  ('ab000001-0000-0000-0000-000000000001', 'Rent', 'Office rent', 'active'),
  ('ab000001-0000-0000-0000-000000000002', 'Salary', 'Employee salaries', 'active'),
  ('ab000001-0000-0000-0000-000000000003', 'Utility', 'Electricity water gas', 'active'),
  ('ab000001-0000-0000-0000-000000000004', 'Internet/Bandwidth', 'NTTN bandwidth', 'active'),
  ('ab000001-0000-0000-0000-000000000005', 'Transport', 'Field team transport', 'active'),
  ('ab000001-0000-0000-0000-000000000006', 'Maintenance', 'Equipment maintenance', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO income_heads (id, name, description, status) VALUES
  ('ac000001-0000-0000-0000-000000000001', 'Monthly Subscription', 'Monthly internet fees', 'active'),
  ('ac000001-0000-0000-0000-000000000002', 'Connection Fee', 'Installation charges', 'active'),
  ('ac000001-0000-0000-0000-000000000003', 'Equipment Sales', 'Equipment revenue', 'active'),
  ('ac000001-0000-0000-0000-000000000004', 'Late Fee', 'Late payment penalty', 'active')
ON CONFLICT DO NOTHING;

-- Customer Ledger
INSERT INTO customer_ledger (id, customer_id, date, type, description, debit, credit, balance) VALUES
  ('ad000001-0000-0000-0000-000000000001', 'f1000001-0000-0000-0000-000000000001', '2025-01-01', 'bill', 'January 2025 Bill', 500, 0, 500),
  ('ad000001-0000-0000-0000-000000000002', 'f1000001-0000-0000-0000-000000000001', '2025-01-03', 'payment', 'Payment received Cash', 0, 500, 0),
  ('ad000001-0000-0000-0000-000000000003', 'f1000001-0000-0000-0000-000000000001', '2025-02-01', 'bill', 'February 2025 Bill', 500, 0, 500),
  ('ad000001-0000-0000-0000-000000000004', 'f1000001-0000-0000-0000-000000000001', '2025-02-04', 'payment', 'Payment received Cash', 0, 500, 0),
  ('ad000001-0000-0000-0000-000000000005', 'f1000001-0000-0000-0000-000000000001', '2025-03-01', 'bill', 'March 2025 Bill', 500, 0, 500),
  ('ad000001-0000-0000-0000-000000000006', 'f1000001-0000-0000-0000-000000000003', '2025-01-01', 'bill', 'January 2025 Bill', 1200, 0, 1200),
  ('ad000001-0000-0000-0000-000000000007', 'f1000001-0000-0000-0000-000000000003', '2025-01-01', 'payment', 'Payment received Cash', 0, 1200, 0),
  ('ad000001-0000-0000-0000-000000000008', 'f1000001-0000-0000-0000-000000000005', '2025-01-01', 'bill', 'January 2025 Bill', 1800, 0, 1800),
  ('ad000001-0000-0000-0000-000000000009', 'f1000001-0000-0000-0000-000000000005', '2025-01-05', 'payment', 'Payment received bKash', 0, 1800, 0)
ON CONFLICT DO NOTHING;

-- Merchant Payments
INSERT INTO merchant_payments (id, sender_phone, transaction_id, amount, payment_date, status, matched_customer_id, matched_bill_id, sms_text) VALUES
  ('ba000001-0000-0000-0000-000000000001', '01822222222', 'TRX1234567890', 750, '2025-01-08', 'matched', 'f1000001-0000-0000-0000-000000000002', 'bb000001-0000-0000-0000-000000000002', 'bKash payment Tk 750'),
  ('ba000001-0000-0000-0000-000000000002', '01855555555', 'TRX2345678901', 1800, '2025-01-05', 'matched', 'f1000001-0000-0000-0000-000000000005', 'bb000001-0000-0000-0000-000000000005', 'bKash payment Tk 1800'),
  ('ba000001-0000-0000-0000-000000000003', '01899000000', 'TRX3456789012', 500, '2025-02-20', 'unmatched', NULL, NULL, 'bKash payment Tk 500'),
  ('ba000001-0000-0000-0000-000000000004', '01811111111', 'TRX4567890123', 500, '2025-03-02', 'unmatched', NULL, NULL, 'bKash payment Tk 500')
ON CONFLICT DO NOTHING;

-- Support Tickets
INSERT INTO support_tickets (id, ticket_id, customer_id, subject, status, priority, category) VALUES
  ('ca000001-0000-0000-0000-000000000001', 'TKT-0001', 'f1000001-0000-0000-0000-000000000001', 'Slow internet speed', 'open', 'high', 'technical'),
  ('ca000001-0000-0000-0000-000000000002', 'TKT-0002', 'f1000001-0000-0000-0000-000000000003', 'Package upgrade request', 'resolved', 'low', 'billing'),
  ('ca000001-0000-0000-0000-000000000003', 'TKT-0003', 'f1000001-0000-0000-0000-000000000007', 'Connection down', 'in_progress', 'critical', 'technical'),
  ('ca000001-0000-0000-0000-000000000004', 'TKT-0004', 'f1000001-0000-0000-0000-000000000005', 'WiFi router issue', 'open', 'medium', 'technical')
ON CONFLICT DO NOTHING;

INSERT INTO ticket_replies (id, ticket_id, message, sender_name, sender_type) VALUES
  ('cb000001-0000-0000-0000-000000000001', 'ca000001-0000-0000-0000-000000000001', 'We are investigating.', 'Admin', 'admin'),
  ('cb000001-0000-0000-0000-000000000002', 'ca000001-0000-0000-0000-000000000002', 'Package upgraded. Thank you!', 'Admin', 'admin'),
  ('cb000001-0000-0000-0000-000000000003', 'ca000001-0000-0000-0000-000000000003', 'Technician assigned.', 'Admin', 'admin')
ON CONFLICT DO NOTHING;

-- Transactions
INSERT INTO transactions (id, account_id, type, description, debit, credit, date, reference) VALUES
  ('da000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000010', 'income', 'ISP Billing Collection Jan 2025', 8050, 0, '2025-01-31', 'JAN-2025-BILLING'),
  ('da000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000060', 'income', 'ISP Billing Revenue Jan 2025', 0, 8050, '2025-01-31', 'JAN-2025-BILLING'),
  ('da000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000080', 'expense', 'Office Rent Jan 2025', 25000, 0, '2025-01-01', 'JAN-2025-RENT'),
  ('da000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000010', 'expense', 'Office Rent Payment Jan 2025', 0, 25000, '2025-01-01', 'JAN-2025-RENT'),
  ('da000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000080', 'expense', 'Salary Expense Jan 2025', 120000, 0, '2025-01-28', 'JAN-2025-SALARY'),
  ('da000001-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000010', 'expense', 'Salary Payment Jan 2025', 0, 120000, '2025-01-28', 'JAN-2025-SALARY'),
  ('da000001-0000-0000-0000-000000000007', 'c0000001-0000-0000-0000-000000000010', 'income', 'ISP Billing Collection Feb 2025', 7550, 0, '2025-02-28', 'FEB-2025-BILLING'),
  ('da000001-0000-0000-0000-000000000008', 'c0000001-0000-0000-0000-000000000060', 'income', 'ISP Billing Revenue Feb 2025', 0, 7550, '2025-02-28', 'FEB-2025-BILLING')
ON CONFLICT DO NOTHING;

-- SMS Templates
INSERT INTO sms_templates (id, name, message) VALUES
  ('db000001-0000-0000-0000-000000000001', 'Bill Generated', 'Dear {customer_name}, your bill of Tk {amount} for {month} has been generated. - Smart ISP'),
  ('db000001-0000-0000-0000-000000000002', 'Payment Received', 'Dear {customer_name}, we received Tk {amount} for {month}. Thank you! - Smart ISP'),
  ('db000001-0000-0000-0000-000000000003', 'Due Reminder', 'Dear {customer_name}, your bill of Tk {amount} is due. Please pay before {due_date}. - Smart ISP'),
  ('db000001-0000-0000-0000-000000000004', 'Connection Suspended', 'Dear {customer_name}, your connection suspended. Pay Tk {amount} to restore. - Smart ISP')
ON CONFLICT DO NOTHING;

-- Daily Reports
INSERT INTO daily_reports (id, date, total_collection, total_expense, total_billed, new_customers, notes) VALUES
  ('dc000001-0000-0000-0000-000000000001', '2025-01-01', 1700, 30500, 9850, 0, 'New year start'),
  ('dc000001-0000-0000-0000-000000000002', '2025-01-05', 2300, 5500, 0, 1, 'Normal day'),
  ('dc000001-0000-0000-0000-000000000003', '2025-01-10', 800, 15000, 0, 0, 'Bandwidth bill paid'),
  ('dc000001-0000-0000-0000-000000000004', '2025-01-15', 500, 0, 0, 1, 'New customer added'),
  ('dc000001-0000-0000-0000-000000000005', '2025-02-01', 1200, 25000, 7550, 0, 'Feb billing start'),
  ('dc000001-0000-0000-0000-000000000006', '2025-02-10', 1550, 6200, 0, 0, 'Utility bills'),
  ('dc000001-0000-0000-0000-000000000007', '2025-03-01', 1200, 33000, 6250, 0, 'Mar billing start')
ON CONFLICT DO NOTHING;

-- Attendance
INSERT INTO attendance (id, employee_id, date, status, check_in, check_out) VALUES
  ('de000001-0000-0000-0000-000000000001', 'a2000001-0000-0000-0000-000000000001', '2025-03-24', 'present', '09:00', '18:00'),
  ('de000001-0000-0000-0000-000000000002', 'a2000001-0000-0000-0000-000000000002', '2025-03-24', 'present', '09:15', '18:00'),
  ('de000001-0000-0000-0000-000000000003', 'a2000001-0000-0000-0000-000000000003', '2025-03-24', 'present', '09:00', '17:30'),
  ('de000001-0000-0000-0000-000000000004', 'a2000001-0000-0000-0000-000000000004', '2025-03-24', 'absent', NULL, NULL),
  ('de000001-0000-0000-0000-000000000005', 'a2000001-0000-0000-0000-000000000005', '2025-03-24', 'present', '09:30', '18:00')
ON CONFLICT DO NOTHING;

-- Salary Sheets
INSERT INTO salary_sheets (id, employee_id, month, basic_salary, bonus, deduction, loan_deduction, net_salary, status, paid_date) VALUES
  ('df000001-0000-0000-0000-000000000001', 'a2000001-0000-0000-0000-000000000001', '2025-01', 35000, 2000, 0, 0, 37000, 'paid', '2025-01-28'),
  ('df000001-0000-0000-0000-000000000002', 'a2000001-0000-0000-0000-000000000002', '2025-01', 20000, 0, 500, 0, 19500, 'paid', '2025-01-28'),
  ('df000001-0000-0000-0000-000000000003', 'a2000001-0000-0000-0000-000000000003', '2025-01', 18000, 0, 0, 0, 18000, 'paid', '2025-01-28'),
  ('df000001-0000-0000-0000-000000000004', 'a2000001-0000-0000-0000-000000000004', '2025-01', 25000, 1000, 0, 2000, 24000, 'paid', '2025-01-28'),
  ('df000001-0000-0000-0000-000000000005', 'a2000001-0000-0000-0000-000000000005', '2025-01', 22000, 0, 0, 0, 22000, 'paid', '2025-01-28')
ON CONFLICT DO NOTHING;

-- Loans
INSERT INTO loans (id, employee_id, amount, monthly_deduction, paid_amount, reason, status, approved_date) VALUES
  ('ef000001-0000-0000-0000-000000000001', 'a2000001-0000-0000-0000-000000000004', 50000, 2000, 4000, 'Medical emergency', 'active', '2024-12-01'),
  ('ef000001-0000-0000-0000-000000000002', 'a2000001-0000-0000-0000-000000000002', 30000, 1500, 30000, 'Home renovation', 'paid', '2024-06-01')
ON CONFLICT DO NOTHING;

-- Supplier Payments
INSERT INTO supplier_payments (id, supplier_id, purchase_id, amount, payment_method, paid_date, notes) VALUES
  ('fa000001-0000-0000-0000-000000000001', 'cc000001-0000-0000-0000-000000000001', 'dd000001-0000-0000-0000-000000000001', 25000, 'bank', '2025-01-10', 'Partial payment for ONU order'),
  ('fa000001-0000-0000-0000-000000000002', 'cc000001-0000-0000-0000-000000000002', 'dd000001-0000-0000-0000-000000000002', 45000, 'bank', '2025-01-20', 'Full payment for router and cable'),
  ('fa000001-0000-0000-0000-000000000003', 'cc000001-0000-0000-0000-000000000003', 'dd000001-0000-0000-0000-000000000003', 24000, 'bank', '2025-02-15', 'Full payment for fiber splitters')
ON CONFLICT DO NOTHING;
