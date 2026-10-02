-- Set ALL existing orders to 'paid' status
-- This treats all orders in the database right now as legacy/migrated orders
-- Going forward, new orders will default to 'unpaid' via the application code
UPDATE orders 
SET payment_status = 'paid'
WHERE payment_status = 'unpaid';
