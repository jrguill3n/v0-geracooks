-- Update the status check constraint to include 'packed' and 'delivered'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'packed', 'delivered', 'cancelled'));
