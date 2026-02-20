-- =============================================
-- BAKERY MANAGEMENT SYSTEM - SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & AUTH
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'Viewer',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 3. EMPLOYEES / HR
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  designation TEXT DEFAULT 'Mr',
  email TEXT,
  phone TEXT,
  department TEXT,
  role TEXT,
  category TEXT DEFAULT 'Baker',
  hire_date DATE,
  status TEXT DEFAULT 'Active',
  next_of_kin TEXT,
  next_of_kin_phone TEXT,
  address TEXT,
  id_number TEXT,
  driver_license_id TEXT,
  driver_license_expiry DATE,
  hygiene_cert_no TEXT,
  hygiene_cert_expiry DATE,
  bank_name TEXT,
  bank_account_no TEXT,
  nhif_no TEXT,
  nssf_no TEXT,
  kra_pin TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_certificates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number TEXT,
  issue_date DATE,
  expiry_date DATE
);

-- 4. INVENTORY
CREATE TABLE IF NOT EXISTS inventory_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Consumable',
  description TEXT
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES inventory_categories(id),
  sku TEXT,
  quantity DECIMAL DEFAULT 0,
  unit TEXT DEFAULT 'kg',
  min_order_qty DECIMAL DEFAULT 0,
  reorder_level DECIMAL DEFAULT 0,
  unit_cost DECIMAL DEFAULT 0,
  location TEXT,
  supplier TEXT,
  last_received DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'In Stock',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_id UUID REFERENCES inventory_items(id),
  type TEXT NOT NULL, -- 'Received', 'Issued', 'Adjusted', 'Returned'
  quantity DECIMAL NOT NULL,
  reference TEXT,
  notes TEXT,
  performed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RECIPES & PRODUCTS
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  category_id UUID REFERENCES product_categories(id),
  yield_qty DECIMAL DEFAULT 1,
  cost_per_unit DECIMAL DEFAULT 0,
  selling_price DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  unit TEXT DEFAULT 'kg'
);

-- 6. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'Retail',
  phone TEXT,
  email TEXT,
  location TEXT,
  address TEXT,
  gps_lat DECIMAL,
  gps_lng DECIMAL,
  credit_limit DECIMAL DEFAULT 0,
  credit_days INTEGER DEFAULT 0,
  payment_terms TEXT DEFAULT 'Cash',
  segment TEXT DEFAULT 'Regular',
  total_purchases DECIMAL DEFAULT 0,
  rating DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  order_type TEXT DEFAULT 'Assisted', -- 'Self-Service', 'Assisted', 'Walk-In'
  status TEXT DEFAULT 'Pending', -- 'Pending', 'Confirmed', 'Processing', 'Ready', 'Dispatched', 'Delivered', 'Cancelled'
  total_amount DECIMAL DEFAULT 0,
  paid_amount DECIMAL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'Unpaid',
  delivery_date DATE,
  delivery_address TEXT,
  assigned_driver TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  unit_price DECIMAL NOT NULL,
  total DECIMAL NOT NULL
);

-- 8. DELIVERIES
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tracking_number TEXT UNIQUE,
  order_id UUID REFERENCES orders(id),
  customer_name TEXT,
  destination TEXT,
  driver_id UUID REFERENCES employees(id),
  driver_name TEXT,
  vehicle TEXT,
  status TEXT DEFAULT 'Scheduled', -- 'Scheduled', 'Dispatched', 'In Transit', 'Delivered', 'Failed'
  scheduled_date DATE,
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  dispatch_checked_by TEXT,
  dispatch_approved_by TEXT,
  delivery_confirmed_by TEXT,
  delivery_notes TEXT,
  items_count INTEGER DEFAULT 0,
  invoice_number TEXT,
  invoice_amount DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. DEBTORS
CREATE TABLE IF NOT EXISTS debtors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  name TEXT NOT NULL,
  phone TEXT,
  total_debt DECIMAL DEFAULT 0,
  credit_limit DECIMAL DEFAULT 0,
  credit_days INTEGER DEFAULT 30,
  debt_days INTEGER DEFAULT 0,
  last_payment_date DATE,
  last_payment_amount DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'Current', -- 'Current', 'Overdue', 'Defaulted', 'Settled'
  approval_status TEXT DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
  approved_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debtor_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  debtor_id UUID REFERENCES debtors(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'Credit Sale', 'Payment', 'Adjustment'
  amount DECIMAL NOT NULL,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CREDITORS
CREATE TABLE IF NOT EXISTS creditors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supplier_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  total_credit DECIMAL DEFAULT 0,
  credit_limit DECIMAL DEFAULT 0,
  credit_days INTEGER DEFAULT 30,
  payment_terms TEXT DEFAULT 'Net 30',
  next_payment_date DATE,
  last_payment_date DATE,
  last_payment_amount DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'Current', -- 'Current', 'Overdue', 'Settled'
  bank_name TEXT,
  bank_account TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creditor_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creditor_id UUID REFERENCES creditors(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'Credit Purchase', 'Payment', 'Adjustment'
  amount DECIMAL NOT NULL,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ASSETS
CREATE TABLE IF NOT EXISTS asset_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  depreciation_method TEXT DEFAULT 'Straight Line',
  useful_life_years INTEGER DEFAULT 5
);

CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES asset_categories(id),
  category TEXT,
  serial_number TEXT,
  purchase_date DATE,
  purchase_price DECIMAL DEFAULT 0,
  current_value DECIMAL DEFAULT 0,
  salvage_value DECIMAL DEFAULT 0,
  depreciation_rate DECIMAL DEFAULT 0,
  annual_depreciation DECIMAL DEFAULT 0,
  accumulated_depreciation DECIMAL DEFAULT 0,
  useful_life_years INTEGER DEFAULT 5,
  replacement_date DATE,
  condition TEXT DEFAULT 'Good',
  capacity TEXT,
  location TEXT,
  assigned_to TEXT,
  warranty_expiry DATE,
  status TEXT DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. POS / SALES
CREATE TABLE IF NOT EXISTS pos_sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  receipt_number TEXT UNIQUE,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT DEFAULT 'Walk-In',
  sale_type TEXT DEFAULT 'Retail', -- 'Retail', 'Wholesale'
  payment_method TEXT DEFAULT 'Cash', -- 'Cash', 'Card', 'M-Pesa', 'Credit'
  mpesa_reference TEXT,
  subtotal DECIMAL DEFAULT 0,
  tax DECIMAL DEFAULT 0,
  discount DECIMAL DEFAULT 0,
  total DECIMAL DEFAULT 0,
  amount_paid DECIMAL DEFAULT 0,
  change_amount DECIMAL DEFAULT 0,
  cashier TEXT,
  status TEXT DEFAULT 'Completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pos_sale_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID REFERENCES pos_sales(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  unit_price DECIMAL NOT NULL,
  total DECIMAL NOT NULL
);

-- 13. PRODUCTION
CREATE TABLE IF NOT EXISTS production_runs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_code TEXT,
  batch_size DECIMAL DEFAULT 0,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  yield_qty DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'scheduled',
  operator TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. WASTE CONTROL
CREATE TABLE IF NOT EXISTS waste_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  product_code TEXT,
  product_name TEXT,
  quantity DECIMAL DEFAULT 0,
  unit TEXT DEFAULT 'units',
  reason TEXT,
  cost DECIMAL DEFAULT 0,
  batch_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. P&L / ACCOUNTING
CREATE TABLE IF NOT EXISTS cost_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  category TEXT NOT NULL, -- 'Raw Materials', 'Labor', 'Utilities', 'Rent', 'Transport', 'Marketing', 'Other'
  description TEXT,
  amount DECIMAL NOT NULL,
  payment_status TEXT DEFAULT 'Paid', -- 'Paid', 'Due', 'Overdue'
  due_date DATE,
  allocated_to TEXT, -- Department or Unit
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS revenue_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  source TEXT NOT NULL, -- 'POS Sales', 'Orders', 'Other'
  description TEXT,
  amount DECIMAL NOT NULL,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  period TEXT NOT NULL,
  tax_type TEXT NOT NULL, -- 'VAT', 'Income Tax', 'PAYE', 'Other'
  taxable_amount DECIMAL DEFAULT 0,
  tax_amount DECIMAL DEFAULT 0,
  payment_status TEXT DEFAULT 'Pending',
  due_date DATE,
  paid_date DATE,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE creditors ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_entries ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for authenticated users - customize as needed)
CREATE POLICY "Allow all for authenticated" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON roles FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON permissions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON employees FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON inventory_items FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON deliveries FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON debtors FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON creditors FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON assets FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON pos_sales FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON production_runs FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON waste_records FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON cost_entries FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON revenue_entries FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON tax_entries FOR ALL USING (true);
