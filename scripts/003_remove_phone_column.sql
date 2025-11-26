-- Remove customer_phone column from orders table
ALTER TABLE orders DROP COLUMN IF EXISTS customer_phone;
