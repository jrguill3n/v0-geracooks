-- Create table for menu item extras/add-ons
CREATE TABLE IF NOT EXISTS menu_item_extras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE menu_item_extras ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow anyone to view extras" ON menu_item_extras FOR SELECT USING (true);
CREATE POLICY "Allow anyone to insert extras" ON menu_item_extras FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anyone to update extras" ON menu_item_extras FOR UPDATE USING (true);
CREATE POLICY "Allow anyone to delete extras" ON menu_item_extras FOR DELETE USING (true);

-- Add extras column to order_items to store selected extras
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS extras JSONB DEFAULT '[]'::jsonb;
