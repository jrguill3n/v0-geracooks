-- Add description column to menu_items table
ALTER TABLE menu_items
ADD COLUMN description TEXT;

-- Add some sample descriptions for common items (you can customize these later)
UPDATE menu_items SET description = 'Tender chicken marinated in traditional Mexican spices, slow-cooked to perfection.' WHERE LOWER(name) LIKE '%pollo%';
UPDATE menu_items SET description = 'Juicy beef prepared with authentic seasonings and herbs.' WHERE LOWER(name) LIKE '%res%';
UPDATE menu_items SET description = 'Succulent turkey seasoned with aromatic Mexican spices.' WHERE LOWER(name) LIKE '%pavo%';
UPDATE menu_items SET description = 'Savory pork marinated in a blend of traditional spices.' WHERE LOWER(name) LIKE '%puerco%' OR LOWER(name) LIKE '%cerdo%';
UPDATE menu_items SET description = 'Fresh seafood prepared with vibrant citrus and spices.' WHERE LOWER(name) LIKE '%pescado%' OR LOWER(name) LIKE '%camar%';
