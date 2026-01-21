-- Add catering source fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS catering_quote_id UUID REFERENCES catering_quotes(id) ON DELETE SET NULL;

-- Add index for filtering catering orders
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);
CREATE INDEX IF NOT EXISTS idx_orders_catering_quote_id ON orders(catering_quote_id);

-- Note: converted_order_id and converted_at already exist in catering_quotes table
