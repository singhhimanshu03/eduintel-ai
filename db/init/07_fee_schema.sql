\c fee_db;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID,
  course_id UUID,
  semester INT,
  academic_year VARCHAR(20),
  total_amount DECIMAL(10,2) NOT NULL,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fee_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  institution_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN ('cash','online','dd','cheque')),
  receipt_number VARCHAR(100) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'completed' CHECK (
    payment_status IN ('pending','completed','failed')
  ),
  transaction_date TIMESTAMPTZ DEFAULT now(),
  UNIQUE(receipt_number, institution_id)
);

CREATE TABLE IF NOT EXISTS student_fee_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID UNIQUE NOT NULL,
  total_fee DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) DEFAULT 0,
  fee_status VARCHAR(20) DEFAULT 'unpaid' CHECK (
    fee_status IN ('paid','partially_paid','unpaid')
  ),
  last_payment_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fee_transactions_student ON fee_transactions(student_id);
CREATE INDEX idx_fee_ledger_status ON student_fee_ledger(fee_status);
