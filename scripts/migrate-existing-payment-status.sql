-- Set all existing orders with NULL or empty payment_status to 'paid'
UPDATE orders
SET payment_status = 'paid'
WHERE payment_status IS NULL
   OR payment_status = '';
