-- Create menu_sections table
CREATE TABLE IF NOT EXISTS menu_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID REFERENCES menu_sections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE menu_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Create policies for menu_sections
CREATE POLICY "Allow anyone to view menu sections" ON menu_sections FOR SELECT USING (true);
CREATE POLICY "Allow anyone to insert menu sections" ON menu_sections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anyone to update menu sections" ON menu_sections FOR UPDATE USING (true);
CREATE POLICY "Allow anyone to delete menu sections" ON menu_sections FOR DELETE USING (true);

-- Create policies for menu_items
CREATE POLICY "Allow anyone to view menu items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Allow anyone to insert menu items" ON menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anyone to update menu items" ON menu_items FOR UPDATE USING (true);
CREATE POLICY "Allow anyone to delete menu items" ON menu_items FOR DELETE USING (true);

-- Insert initial menu data
INSERT INTO menu_sections (name, display_order) VALUES
  ('POLLO', 1),
  ('RES', 2),
  ('PAVO', 3),
  ('CERDO', 4),
  ('VEGANO', 5),
  ('VEGETARIANO', 6);

-- Insert initial menu items
INSERT INTO menu_items (section_id, name, price, display_order)
SELECT 
  (SELECT id FROM menu_sections WHERE name = 'POLLO'),
  item.name,
  item.price,
  item.order
FROM (VALUES
  ('Pechuga de Pollo Asada', 12.99, 1),
  ('Pechuga de Pollo Empanizada', 13.99, 2),
  ('Fajitas de Pollo', 14.99, 3),
  ('Pollo al Horno con Papas', 13.49, 4),
  ('Pollo en Mole', 15.99, 5),
  ('Alitas de Pollo BBQ', 11.99, 6)
) AS item(name, price, "order");

INSERT INTO menu_items (section_id, name, price, display_order)
SELECT 
  (SELECT id FROM menu_sections WHERE name = 'RES'),
  item.name,
  item.price,
  item.order
FROM (VALUES
  ('Carne Asada', 16.99, 1),
  ('Bistec Encebollado', 15.99, 2),
  ('Carne con Papas', 17.49, 3),
  ('Carne en Chile Colorado', 16.49, 4),
  ('Bistec Ranchero', 15.49, 5)
) AS item(name, price, "order");

INSERT INTO menu_items (section_id, name, price, display_order)
SELECT 
  (SELECT id FROM menu_sections WHERE name = 'PAVO'),
  item.name,
  item.price,
  item.order
FROM (VALUES
  ('Pechuga de Pavo al Horno', 13.99, 1),
  ('Pavo en Adobo', 14.99, 2),
  ('Medallones de Pavo', 15.49, 3)
) AS item(name, price, "order");

INSERT INTO menu_items (section_id, name, price, display_order)
SELECT 
  (SELECT id FROM menu_sections WHERE name = 'CERDO'),
  item.name,
  item.price,
  item.order
FROM (VALUES
  ('Chuletas de Cerdo', 14.99, 1),
  ('Carnitas', 13.99, 2),
  ('Cerdo en Salsa Verde', 15.49, 3),
  ('Costillas BBQ', 16.99, 4)
) AS item(name, price, "order");

INSERT INTO menu_items (section_id, name, price, display_order)
SELECT 
  (SELECT id FROM menu_sections WHERE name = 'VEGANO'),
  item.name,
  item.price,
  item.order
FROM (VALUES
  ('Tofu al Curry', 11.99, 1),
  ('Hamburguesa Vegana', 10.99, 2),
  ('Ensalada de Quinoa', 9.99, 3),
  ('Pasta Primavera', 12.49, 4)
) AS item(name, price, "order");

INSERT INTO menu_items (section_id, name, price, display_order)
SELECT 
  (SELECT id FROM menu_sections WHERE name = 'VEGETARIANO'),
  item.name,
  item.price,
  item.order
FROM (VALUES
  ('Quesadillas de Queso', 9.99, 1),
  ('Enchiladas Vegetarianas', 11.99, 2),
  ('Chile Relleno', 10.99, 3),
  ('Pasta Alfredo', 12.99, 4)
) AS item(name, price, "order");
