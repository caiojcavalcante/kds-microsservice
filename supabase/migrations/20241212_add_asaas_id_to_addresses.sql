-- Migration: Support Asaas Customers in Addresses
-- Add asaas_customer_id column
ALTER TABLE addresses 
ADD COLUMN IF NOT EXISTS asaas_customer_id TEXT;

-- Make user_id nullable to support external customers who don't have a local auth.users record
ALTER TABLE addresses 
ALTER COLUMN user_id DROP NOT NULL;

-- Create index for performance on lookups by Asaas ID
CREATE INDEX IF NOT EXISTS idx_addresses_asaas_customer_id ON addresses(asaas_customer_id);

-- Optional: Comment/Documentation
COMMENT ON COLUMN addresses.asaas_customer_id IS 'ID do cliente no Asaas (para clientes externos)';
