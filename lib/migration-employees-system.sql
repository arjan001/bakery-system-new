-- =============================================
-- MIGRATION: Employee System Access & Missing Columns
-- Run this on existing databases to add HR/system access fields
-- =============================================

-- ── EMPLOYEES TABLE ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'employee_id_number') THEN
    ALTER TABLE employees ADD COLUMN employee_id_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'profile_photo_url') THEN
    ALTER TABLE employees ADD COLUMN profile_photo_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'certificates') THEN
    ALTER TABLE employees ADD COLUMN certificates JSONB DEFAULT '[]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'system_access') THEN
    ALTER TABLE employees ADD COLUMN system_access BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'login_email') THEN
    ALTER TABLE employees ADD COLUMN login_email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'login_role') THEN
    ALTER TABLE employees ADD COLUMN login_role TEXT DEFAULT 'Viewer';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'permissions') THEN
    ALTER TABLE employees ADD COLUMN permissions JSONB DEFAULT '[]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'primary_outlet_id') THEN
    ALTER TABLE employees ADD COLUMN primary_outlet_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'primary_outlet_name') THEN
    ALTER TABLE employees ADD COLUMN primary_outlet_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'payroll_payment_method') THEN
    ALTER TABLE employees ADD COLUMN payroll_payment_method TEXT DEFAULT 'bank';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'payroll_mpesa_phone') THEN
    ALTER TABLE employees ADD COLUMN payroll_mpesa_phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'salary_amount') THEN
    ALTER TABLE employees ADD COLUMN salary_amount DECIMAL(12,2) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'salary_payment_frequency') THEN
    ALTER TABLE employees ADD COLUMN salary_payment_frequency TEXT DEFAULT 'monthly';
  END IF;
END $$;

-- Payroll constraints and defaults
UPDATE employees
SET payroll_payment_method = 'bank'
WHERE payroll_payment_method IS NULL OR payroll_payment_method = '' OR payroll_payment_method NOT IN ('bank', 'mpesa');

UPDATE employees
SET salary_payment_frequency = 'monthly'
WHERE salary_payment_frequency IS NULL OR salary_payment_frequency = '' OR salary_payment_frequency NOT IN ('weekly', 'fortnightly', 'monthly');

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_payroll_payment_method_check') THEN
    ALTER TABLE employees
    ADD CONSTRAINT employees_payroll_payment_method_check
    CHECK (payroll_payment_method IN ('bank', 'mpesa'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_salary_payment_frequency_check') THEN
    ALTER TABLE employees
    ADD CONSTRAINT employees_salary_payment_frequency_check
    CHECK (salary_payment_frequency IN ('weekly', 'fortnightly', 'monthly'));
  END IF;
END $$;

-- ── ORDERS TABLE ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'source') THEN
    ALTER TABLE orders ADD COLUMN source TEXT DEFAULT 'Regular';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'fulfillment') THEN
    ALTER TABLE orders ADD COLUMN fulfillment TEXT DEFAULT 'Delivery';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'rejection_reason') THEN
    ALTER TABLE orders ADD COLUMN rejection_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'pos_sale_id') THEN
    ALTER TABLE orders ADD COLUMN pos_sale_id UUID;
  END IF;
END $$;

-- ── POS_SALES TABLE ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pos_sales' AND column_name = 'outlet_id') THEN
    ALTER TABLE pos_sales ADD COLUMN outlet_id UUID;
  END IF;
END $$;

-- ── CUSTOMERS TABLE ──
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'gps_lat') THEN
    ALTER TABLE customers ADD COLUMN gps_lat DECIMAL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'gps_lng') THEN
    ALTER TABLE customers ADD COLUMN gps_lng DECIMAL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'landmark') THEN
    ALTER TABLE customers ADD COLUMN landmark TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'delivery_instructions') THEN
    ALTER TABLE customers ADD COLUMN delivery_instructions TEXT;
  END IF;
END $$;

-- ── EMPLOYEE CATEGORIES TABLE ──
CREATE TABLE IF NOT EXISTS employee_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO employee_categories (name) VALUES
  ('Baker'), ('Driver'), ('Sales'), ('Admin'),
  ('Quality'), ('Packer'), ('Supervisor'), ('Manager'),
  ('Rider'), ('Cleaner'), ('Cashier'), ('Outlet Staff'),
  ('Accounts and Finance'), ('Intern')
ON CONFLICT (name) DO NOTHING;

-- ── BUSINESS SETTINGS TABLE ──
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ──
CREATE INDEX IF NOT EXISTS idx_employees_login_email ON employees(login_email);
CREATE INDEX IF NOT EXISTS idx_employees_system_access ON employees(system_access);
