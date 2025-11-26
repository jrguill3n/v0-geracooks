-- Add DELETE policies for orders and order_items tables
-- This allows the admin dashboard to delete orders

-- Enable RLS if not already enabled (should already be enabled)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing DELETE policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anyone to delete orders" ON orders;
DROP POLICY IF EXISTS "Allow anyone to delete order items" ON order_items;

-- Create DELETE policy for orders table
CREATE POLICY "Allow anyone to delete orders"
ON orders
FOR DELETE
TO public
USING (true);

-- Create DELETE policy for order_items table
CREATE POLICY "Allow anyone to delete order items"
ON order_items
FOR DELETE
TO public
USING (true);
