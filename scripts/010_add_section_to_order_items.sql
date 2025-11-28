-- Add section column to order_items table to track which menu section each item belongs to
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS section TEXT;

-- Update existing order items with their section by joining with menu_items
UPDATE order_items oi
SET section = ms.name
FROM menu_items mi
JOIN menu_sections ms ON mi.section_id = ms.id
WHERE oi.item_name = mi.name
AND oi.section IS NULL;
