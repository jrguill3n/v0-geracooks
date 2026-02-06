-- Add payment_status column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';

-- Map existing statuses to new fulfillment statuses:
-- pending -> new
-- delivered -> completed
-- packed and cancelled stay the same
UPDATE orders SET status = 'new' WHERE status = 'pending';
UPDATE orders SET status = 'completed' WHERE status = 'delivered';
