-- Add payment_status column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';

-- Drop the existing check constraint on status so we can update values
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Map existing statuses to new fulfillment statuses:
-- pending -> new
-- delivered -> completed
-- packed and cancelled stay the same
UPDATE orders SET status = 'new' WHERE status = 'pending';
UPDATE orders SET status = 'completed' WHERE status = 'delivered';

-- Add new check constraint with the updated allowed statuses
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('new', 'packed', 'completed', 'cancelled'));
