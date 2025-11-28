-- Add phone number column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add an index on phone for faster customer lookups
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
