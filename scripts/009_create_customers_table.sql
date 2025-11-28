-- Create customers table with phone as unique identifier
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    name TEXT,
    nickname TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add customer_id to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- Create index on phone for fast lookups
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);

-- Enable RLS on customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for customers table
CREATE POLICY "Allow anyone to view customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow anyone to insert customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anyone to update customers" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Allow anyone to delete customers" ON public.customers FOR DELETE USING (true);

-- Migrate existing orders to create customer records
INSERT INTO public.customers (phone, name)
SELECT DISTINCT phone, customer_name
FROM public.orders
WHERE phone IS NOT NULL AND phone != ''
ON CONFLICT (phone) DO NOTHING;

-- Update orders to link to customers
UPDATE public.orders o
SET customer_id = c.id
FROM public.customers c
WHERE o.phone = c.phone AND o.customer_id IS NULL;

COMMENT ON TABLE public.customers IS 'Stores customer information with phone as unique identifier';
COMMENT ON COLUMN public.customers.phone IS 'Customer phone number (unique identifier)';
COMMENT ON COLUMN public.customers.nickname IS 'Optional nickname assigned by admin for easier identification';
