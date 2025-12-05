-- Migration: Add delivery signature fields and total to orders table
-- Execute this in the Supabase SQL Editor
-- Note: payment_status, encodedImage, copiaecola, invoiceUrl, billingType already exist

-- Adicionar campos de assinatura e total à tabela orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS total DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS delivered_by_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS delivered_by_name TEXT,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Índice para queries por funcionário
CREATE INDEX IF NOT EXISTS idx_orders_delivered_by ON orders(delivered_by_id);

-- Comentário para documentação
COMMENT ON COLUMN orders.total IS 'Valor total do pedido';
COMMENT ON COLUMN orders.delivered_by_id IS 'UUID do funcionário que confirmou a entrega';
COMMENT ON COLUMN orders.delivered_by_name IS 'Nome do funcionário que confirmou a entrega';
COMMENT ON COLUMN orders.delivered_at IS 'Data/hora da confirmação de entrega';

COMMENT ON COLUMN orders.delivered_at IS 'Data/hora da confirmação de entrega';
