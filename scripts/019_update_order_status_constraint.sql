-- Update the status check constraint to use the new status values
-- Old statuses: pending, packed, delivered, cancelled
-- New statuses: new, in_progress, packed, delivered

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('new', 'in_progress', 'packed', 'delivered'));

-- Migrate existing statuses to new values
UPDATE public.orders 
SET status = 'new' 
WHERE status = 'pending';

UPDATE public.orders 
SET status = 'delivered' 
WHERE status = 'completed';

-- Delete cancelled orders as per requirements
DELETE FROM public.order_items 
WHERE order_id IN (SELECT id FROM public.orders WHERE status = 'cancelled');

DELETE FROM public.orders 
WHERE status = 'cancelled';
