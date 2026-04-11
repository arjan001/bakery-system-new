-- =============================================
-- MIGRATION: Payroll M-PESA + Salary Frequency + Payroll Generation View
-- Run this in Supabase SQL Editor
-- =============================================

-- 1) Employees payroll columns
ALTER TABLE employees ADD COLUMN IF NOT EXISTS payroll_payment_method TEXT DEFAULT 'bank';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS payroll_mpesa_phone TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_payment_frequency TEXT DEFAULT 'monthly';

-- Normalize existing rows before constraints
UPDATE employees
SET payroll_payment_method = 'bank'
WHERE payroll_payment_method IS NULL
  OR payroll_payment_method = ''
  OR payroll_payment_method NOT IN ('bank', 'mpesa');

UPDATE employees
SET salary_payment_frequency = 'monthly'
WHERE salary_payment_frequency IS NULL
  OR salary_payment_frequency = ''
  OR salary_payment_frequency NOT IN ('weekly', 'fortnightly', 'monthly');

-- 2) Constraints
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

-- 3) Useful indexes for payroll generation
CREATE INDEX IF NOT EXISTS idx_employees_salary_frequency ON employees(salary_payment_frequency);
CREATE INDEX IF NOT EXISTS idx_employees_payroll_method ON employees(payroll_payment_method);

-- 4) Payroll generation view (active employees with configured salary)
CREATE OR REPLACE VIEW payroll_generation_view AS
SELECT
  e.id AS employee_id,
  e.employee_id_number,
  e.first_name,
  e.last_name,
  e.department,
  e.role,
  e.status,
  e.salary_amount,
  e.salary_payment_frequency,
  e.payroll_payment_method,
  e.payroll_mpesa_phone,
  e.bank_name,
  e.bank_account_no,
  CASE
    WHEN e.payroll_payment_method = 'mpesa' THEN COALESCE(NULLIF(e.payroll_mpesa_phone, ''), 'M-PESA number missing')
    ELSE COALESCE(NULLIF(e.bank_account_no, ''), 'Bank account missing')
  END AS payout_destination,
  NOW()::date AS generated_for_date
FROM employees e
WHERE e.status = 'Active'
  AND COALESCE(e.salary_amount, 0) > 0;

-- 5) Frequency-specific helper view for dynamic filtering in reports/UI
CREATE OR REPLACE VIEW payroll_generation_current_cycle AS
SELECT *
FROM payroll_generation_view
WHERE salary_payment_frequency IN ('weekly', 'fortnightly', 'monthly');
