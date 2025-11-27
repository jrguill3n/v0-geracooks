-- Delete existing menu data
DELETE FROM menu_items;
DELETE FROM menu_sections;

-- Reset and insert original menu sections
INSERT INTO menu_sections (name, display_order) VALUES
  ('POLLO', 1),
  ('RES', 2),
  ('PAVO', 3),
  ('CERDO', 4),
  ('VEGANO', 5),
  ('VEGETARIANO', 6);

-- Insert original menu items for POLLO
INSERT INTO menu_items (section_id, name, price, display_order)
SELECT 
  (SELECT id FROM menu_sections WHERE name = 'POLLO'),
  item.name,
  item.price,
  item.display_order
FROM (VALUES
  ('Pechuga de Pollo Asada', 12.99, 1),
  ('Pechuga de Pollo Empanizada', 13.99, 2),
  ('Fajitas de Pollo', 14.99, 3),
  ('Pollo al Horno con Papas', 13.49, 4),
  ('Pollo en Mole', 15.99, 5),
  ('Alitas de Pollo BBQ', 11.99, 6)
) AS item(name, price, display_order);

-- Insert original menu items for RES
INSERT INTO menu_items (section_id, name, price, display_order)
SELECT 
  (SELECT id FROM menu_sections WHERE name = 'RES'),
  item.name,
  item.price,
  item.display_order
FROM (VALUES
  ('Carne Asada', 16.99, 1),
  ('Bistec Encebollado', 15.99, 2),
  ('Carne con Papas', 17.49, 3),
  ('Carne en Chile Colorado', 16.49, 4),
  ('Bistec Ranchero', 15.49, 5)
) AS item(name, price, display_order);

-- Insert original menu items for PAVO
INSERT INTO menu_items (section_id, name, price, display_order)
SELECT 
  (SELECT id FROM menu_sections WHERE name = 'PAVO'),
  item.name,
  item.price,
  item.display_order
FROM (VALUES
  ('Pechuga de Pavo al Horno', 13.99, 1),
  ('Pavo en Adobo', 14.99, 2),
  ('Medallones de Pavo', 15.49, 3)
) AS item(name, price, display_order);

-- Insert original menu items for CERDO
INSERT INTO menu_items (section_id, name, price, display_order)
SELECT 
  (SELECT id FROM menu_sections WHERE name = 'CERDO'),
  item.name,
  item.price,
  item.display_order
FROM (VALUES
  ('Chuletas de Cerdo', 14.99, 1),
  ('Carnitas', 13.99, 2),
  ('Cerdo en Salsa Verde', 15.49, 3),
  ('Costillas BBQ', 16.99, 4)
) AS item(name, price, display_order);

-- Insert original menu items for VEGANO
INSERT INTO menu_items (section_id, name, price, display_order)
SELECT 
  (SELECT id FROM menu_sections WHERE name = 'VEGANO'),
  item.name,
  item.price,
  item.display_order
FROM (VALUES
  ('Tofu al Curry', 11.99, 1),
  ('Hamburguesa Vegana', 10.99, 2),
  ('Ensalada de Quinoa', 9.99, 3),
  ('Pasta Primavera', 12.49, 4)
) AS item(name, price, display_order);

-- Insert original menu items for VEGETARIANO
INSERT INTO menu_items (section_id, name, price, display_order)
SELECT 
  (SELECT id FROM menu_sections WHERE name = 'VEGETARIANO'),
  item.name,
  item.price,
  item.display_order
FROM (VALUES
  ('Quesadillas de Queso', 9.99, 1),
  ('Enchiladas Vegetarianas', 11.99, 2),
  ('Chile Relleno', 10.99, 3),
  ('Pasta Alfredo', 12.99, 4)
) AS item(name, price, display_order);
