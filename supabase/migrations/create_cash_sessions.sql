-- Migration: Create cash_sessions table for PDV cash register management
-- Execute this in the Supabase SQL Editor

-- Table for cash register sessions (abertura/fechamento de caixa)
CREATE TABLE IF NOT EXISTS cash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Session timing
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Who opened/closed
  opened_by_id UUID REFERENCES auth.users(id),
  opened_by_name TEXT NOT NULL,
  closed_by_id UUID REFERENCES auth.users(id),
  closed_by_name TEXT,
  
  -- Initial balance (fundo de caixa)
  initial_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Closing values (preenchido ao fechar)
  expected_cash DECIMAL(10,2),       -- Dinheiro esperado (inicial + vendas em dinheiro)
  counted_cash DECIMAL(10,2),        -- Dinheiro contado fisicamente
  variance DECIMAL(10,2),            -- Diferença (sobra/falta)
  
  -- Totals for the session (calculated from orders)
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_pix DECIMAL(10,2) DEFAULT 0,
  total_card DECIMAL(10,2) DEFAULT 0,
  total_cash_sales DECIMAL(10,2) DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  
  -- Notes and status
  notes TEXT,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_opened_at ON cash_sessions(opened_at);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_opened_by ON cash_sessions(opened_by_id);

-- RLS Policies
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all sessions
CREATE POLICY "Allow read access for authenticated users" ON cash_sessions
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert sessions
CREATE POLICY "Allow insert for authenticated users" ON cash_sessions
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update sessions
CREATE POLICY "Allow update for authenticated users" ON cash_sessions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE cash_sessions IS 'Cash register sessions for PDV (abertura/fechamento de caixa)';
COMMENT ON COLUMN cash_sessions.initial_balance IS 'Starting cash balance (fundo de caixa)';
COMMENT ON COLUMN cash_sessions.expected_cash IS 'Expected cash at closing (initial + cash sales)';
COMMENT ON COLUMN cash_sessions.counted_cash IS 'Actual cash counted at closing';
COMMENT ON COLUMN cash_sessions.variance IS 'Difference between expected and counted (positive = surplus, negative = shortage)';
