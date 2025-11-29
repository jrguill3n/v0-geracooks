-- Update menu item descriptions with short summaries

-- POLLO (Chicken)
UPDATE menu_items SET description = 'Stir-fried chicken with fresh vegetables in Asian-inspired sauce' WHERE name = 'Stir fry c/vegetales';
UPDATE menu_items SET description = 'Shredded chicken in smoky chipotle tomato sauce, a Puebla classic' WHERE name = 'Tinga';
UPDATE menu_items SET description = 'Chicken in rich, complex mole sauce with chocolate and chiles' WHERE name = 'Mole';
UPDATE menu_items SET description = 'Tender seasoned chicken dish with traditional Mexican flavors' WHERE name = 'Pollinita';
UPDATE menu_items SET description = 'Chicken in creamy smoky chipotle sauce' WHERE name = 'Crema de chipotle';
UPDATE menu_items SET description = 'Chicken in creamy poblano pepper and corn sauce' WHERE name = 'Crema de poblano y elote';
UPDATE menu_items SET description = 'Shredded chicken breast, perfectly seasoned and ready to serve' WHERE name = 'Deshebrado 12 oz';
UPDATE menu_items SET description = 'Chicken in tangy green tomatillo sauce with potatoes' WHERE name = 'Salsa verde c/ papas';

-- RES (Beef)
UPDATE menu_items SET description = 'Ground beef in Italian-style tomato sauce with herbs' WHERE name = 'Bolognesa';
UPDATE menu_items SET description = 'Mexican-style fried rice with beef and vegetables' WHERE name = 'Yakimeshi';
UPDATE menu_items SET description = 'Ground beef with green salsa, peppers, and spices' WHERE name = 'Picadillo verde';
UPDATE menu_items SET description = 'Lean ground beef picadillo with vegetables, a healthier version' WHERE name = 'Picadillo fit';
UPDATE menu_items SET description = 'Shredded beef, tender and flavorful, ready to serve' WHERE name = 'Deshebrada 12 oz';
UPDATE menu_items SET description = 'Shredded beef cooked with diced potatoes in savory sauce' WHERE name = 'Deshebrada c/ papa';
UPDATE menu_items SET description = 'Four burritos filled with shredded beef and potato' WHERE name = 'Burritos desheb/papa (4)';
UPDATE menu_items SET description = 'Diced beef stew with roasted poblano peppers' WHERE name = 'Cortadillo c/ poblano';

-- PAVO (Turkey)
UPDATE menu_items SET description = 'Ground turkey picadillo with vegetables and traditional seasonings' WHERE name = 'Picadillo';
UPDATE menu_items SET description = 'Turkey meatballs in spicy smoky chipotle sauce' WHERE name = 'Albóndigas al chipotle';

-- CERDO (Pork)
UPDATE menu_items SET description = 'Slow-cooked tender pork, a lighter take on traditional carnitas' WHERE name = 'Carnitas healthy';
UPDATE menu_items SET description = 'Yucatan-style pork marinated in achiote and citrus, wrapped in banana leaves' WHERE name = 'Cochinita pibil';
UPDATE menu_items SET description = 'Crispy pork rinds simmered in tangy tomatillo green sauce' WHERE name = 'Chicharrón salsa verde';

-- VEGANO (Vegan)
UPDATE menu_items SET description = 'Traditional Mexican red rice cooked with sweet corn' WHERE name = 'Arroz rojo c/elote';
UPDATE menu_items SET description = 'Fluffy rice with fresh cilantro and lime juice' WHERE name = 'Arroz cilantro limón';
UPDATE menu_items SET description = 'Nutritious whole grain brown rice, perfectly cooked' WHERE name = 'Arroz integral';
UPDATE menu_items SET description = 'Sautéed zucchini with tomatoes, onions, and jalapeños' WHERE name = 'Calabacitas a la mexicana';
UPDATE menu_items SET description = 'Tender zucchini cooked with sweet corn kernels' WHERE name = 'Calabacitas con elote';
UPDATE menu_items SET description = 'Toasted vermicelli noodles in savory tomato broth' WHERE name = 'Fideo seco';
UPDATE menu_items SET description = 'Protein-rich lentils cooked with mixed vegetables' WHERE name = 'Lentejas c/vegetales';

-- VEGETARIANO (Vegetarian)
UPDATE menu_items SET description = 'Creamy mashed potatoes with butter and seasonings' WHERE name = 'Puré de papa';
UPDATE menu_items SET description = 'Sweet and smooth mashed sweet potato' WHERE name = 'Puré de camote';
UPDATE menu_items SET description = 'Protein-packed quinoa with colorful sautéed vegetables' WHERE name = 'Quinoa c/vegetales';

-- ESPECIALES (Specials)
UPDATE menu_items SET description = 'Salt cod stewed with tomatoes, olives, capers, and jalapeños' WHERE name = 'Bacalao';
UPDATE menu_items SET description = 'Special holiday package with assorted traditional dishes' WHERE name = 'Paquete Posada';
