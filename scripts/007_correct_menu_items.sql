-- Delete existing menu data
DELETE FROM menu_items;
DELETE FROM menu_sections;

-- Insert menu sections in correct order
INSERT INTO menu_sections (name, display_order) VALUES
('POLLO', 1),
('RES', 2),
('PAVO', 3),
('CERDO', 4),
('VEGANO', 5),
('VEGETARIANO', 6);

-- Insert POLLO items
INSERT INTO menu_items (section_id, name, price, display_order)
SELECT id, 'Stir fry c/vegetales', 13, 1 FROM menu_sections WHERE name = 'POLLO'
UNION ALL
SELECT id, 'Tinga', 12, 2 FROM menu_sections WHERE name = 'POLLO'
UNION ALL
SELECT id, 'Mole', 12, 3 FROM menu_sections WHERE name = 'POLLO'
UNION ALL
SELECT id, 'Pollinita', 13, 4 FROM menu_sections WHERE name = 'POLLO'
UNION ALL
SELECT id, 'Crema de chipotle', 14, 5 FROM menu_sections WHERE name = 'POLLO'
UNION ALL
SELECT id, 'Crema de poblano y elote', 14, 6 FROM menu_sections WHERE name = 'POLLO'
UNION ALL
SELECT id, 'Deshebrado 12 oz', 10, 7 FROM menu_sections WHERE name = 'POLLO'
UNION ALL
SELECT id, 'Salsa verde c/ papas', 12, 8 FROM menu_sections WHERE name = 'POLLO';

-- Insert RES items
INSERT INTO menu_items (section_id, name, price, display_order)
SELECT id, 'Bolognesa', 15, 1 FROM menu_sections WHERE name = 'RES'
UNION ALL
SELECT id, 'Yakimeshi', 12, 2 FROM menu_sections WHERE name = 'RES'
UNION ALL
SELECT id, 'Picadillo verde', 14, 3 FROM menu_sections WHERE name = 'RES'
UNION ALL
SELECT id, 'Picadillo fit', 15, 4 FROM menu_sections WHERE name = 'RES'
UNION ALL
SELECT id, 'Deshebrada 12 oz', 16, 5 FROM menu_sections WHERE name = 'RES'
UNION ALL
SELECT id, 'Deshebrada c/ papa', 15, 6 FROM menu_sections WHERE name = 'RES'
UNION ALL
SELECT id, 'Burritos desheb/papa (4)', 20, 7 FROM menu_sections WHERE name = 'RES'
UNION ALL
SELECT id, 'Cortadillo c/ poblano', 16, 8 FROM menu_sections WHERE name = 'RES';

-- Insert PAVO items
INSERT INTO menu_items (section_id, name, price, display_order)
SELECT id, 'Picadillo', 13, 1 FROM menu_sections WHERE name = 'PAVO'
UNION ALL
SELECT id, 'Albóndigas al chipotle', 15, 2 FROM menu_sections WHERE name = 'PAVO';

-- Insert CERDO items
INSERT INTO menu_items (section_id, name, price, display_order)
SELECT id, 'Carnitas healthy', 16, 1 FROM menu_sections WHERE name = 'CERDO'
UNION ALL
SELECT id, 'Cochinita pibil', 16, 2 FROM menu_sections WHERE name = 'CERDO'
UNION ALL
SELECT id, 'Chicharrón salsa verde', 13, 3 FROM menu_sections WHERE name = 'CERDO';

-- Insert VEGANO items
INSERT INTO menu_items (section_id, name, price, display_order)
SELECT id, 'Arroz rojo c/elote', 6, 1 FROM menu_sections WHERE name = 'VEGANO'
UNION ALL
SELECT id, 'Arroz cilantro limón', 6, 2 FROM menu_sections WHERE name = 'VEGANO'
UNION ALL
SELECT id, 'Arroz integral', 6, 3 FROM menu_sections WHERE name = 'VEGANO'
UNION ALL
SELECT id, 'Calabacitas a la mexicana', 9, 4 FROM menu_sections WHERE name = 'VEGANO'
UNION ALL
SELECT id, 'Calabacitas con elote', 9, 5 FROM menu_sections WHERE name = 'VEGANO'
UNION ALL
SELECT id, 'Fideo seco', 6, 6 FROM menu_sections WHERE name = 'VEGANO'
UNION ALL
SELECT id, 'Lentejas c/vegetales', 9, 7 FROM menu_sections WHERE name = 'VEGANO';

-- Insert VEGETARIANO items
INSERT INTO menu_items (section_id, name, price, display_order)
SELECT id, 'Puré de papa', 7, 1 FROM menu_sections WHERE name = 'VEGETARIANO'
UNION ALL
SELECT id, 'Puré de camote', 9, 2 FROM menu_sections WHERE name = 'VEGETARIANO'
UNION ALL
SELECT id, 'Quinoa c/vegetales', 6, 3 FROM menu_sections WHERE name = 'VEGETARIANO';
