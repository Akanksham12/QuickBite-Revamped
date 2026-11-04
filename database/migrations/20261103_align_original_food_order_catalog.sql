USE quickbite_revamped;

ALTER TABLE foods
  ADD UNIQUE KEY uq_foods_category_title (category_id, title);

START TRANSACTION;

UPDATE categories SET active = FALSE;
UPDATE foods SET active = FALSE;

INSERT INTO categories (title, description, image_name, featured, active) VALUES
  ('Pizza', 'Freshly made pizza favorites.', 'category/Food_category_769.jfif', TRUE, TRUE),
  ('Burger', 'Freshly made burgers.', 'category/Food_category_818.jpeg', TRUE, TRUE),
  ('Main Course', 'Satisfying Indian main course dishes.', 'category/Food_category_107.jfif', TRUE, TRUE),
  ('Desserts', 'Sweet treats and desserts.', 'category/Food_category_398.jfif', TRUE, TRUE),
  ('Beverages', 'Hot and cold beverages.', 'category/Food_category_206.jfif', TRUE, TRUE),
  ('Side Dishes', 'Snacks and savory side dishes.', 'category/Food_category_387.jfif', TRUE, TRUE)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  image_name = VALUES(image_name),
  featured = VALUES(featured),
  active = VALUES(active);

DELETE FROM foods
WHERE id NOT IN (SELECT food_id FROM order_items);

INSERT INTO foods (title, description, price, image_name, category_id, featured, active)
SELECT item.title, item.description, item.price, item.image_name, category.id, TRUE, TRUE
FROM (
  SELECT 'Pizza' AS category_title, 'Margherita Pizza' AS title, 'Classic pizza topped with tomato sauce, mozzarella cheese, and fresh basil.' AS description, 250.00 AS price, 'food/Food_Name_2340.jfif' AS image_name
  UNION ALL SELECT 'Pizza', 'Vegetarian Pizza', 'Pizza with assorted vegetables such as bell peppers, onions, mushrooms, and olives.', 200.00, 'food/Food_Name_9617.jfif'
  UNION ALL SELECT 'Burger', 'Veggie Burger', 'Veggie patty made from beans, grains, or vegetables, with lettuce, tomato, onion etc a whole wheat bun.', 229.00, 'food/Food-Name-2424.jfif'
  UNION ALL SELECT 'Burger', 'Classic Cheeseburger', 'Beef patty with American cheese, lettuce, tomato, onion, pickles, and mayo on a sesame seed bun.', 220.00, 'food/Food-Name-5382.jfif'
  UNION ALL SELECT 'Burger', 'Chicken Burger', 'Grilled or breaded chicken breast with lettuce, tomato, onion, pickles.', 269.00, 'food/Food-Name-7594.jfif'
  UNION ALL SELECT 'Burger', 'Paneer Burger', 'A paneer burger features a spiced, grilled paneer patty with fresh veggies and tangy chutney in a toasted bun.', 240.00, 'food/Food-Name-5244.jfif'
  UNION ALL SELECT 'Main Course', 'Sahi paneer', 'Paneer (Indian cottage cheese) cooked in a rich and creamy tomato-based gravy.', 199.00, 'food/Food-Name-5785.jfif'
  UNION ALL SELECT 'Main Course', 'Chole Kulche', 'Chole kulche is a popular street food from North India, specifically Punjab, consisting of spicy chickpea curry (chole) served with soft, leavened bread (kulcha).', 205.00, 'food/Food-Name-9111.jfif'
  UNION ALL SELECT 'Main Course', 'South Indian thali', 'A South Indian thali typically includes a variety of dishes like rice, sambar, rasam, vegetable curry, papad, yogurt, and sweets, showcasing a balance of spicy, tangy, and savory flavors.', 269.00, 'food/Food-Name-1815.jfif'
  UNION ALL SELECT 'Desserts', 'Rasgulla', 'Rasgulla is a spongy, syrup-soaked Indian dessert made from chenna (cheese curds) and sugar, offering a delicate sweetness in each bite.', 20.00, 'food/Food_Name_1193.jfif'
  UNION ALL SELECT 'Desserts', 'Gulab Jamun', 'Deep-fried dough balls made from milk solids, soaked in a sugar syrup flavored with cardamom and rose water.', 20.00, 'food/Food_Name_460.jfif'
  UNION ALL SELECT 'Desserts', 'Macarons', 'Delicate, colorful almond meringue cookies filled with buttercream, ganache, or jam.', 100.00, 'food/Food_Name_1496.jfif'
  UNION ALL SELECT 'Desserts', 'Black Forest Cake', 'A chocolate sponge cake layered with whipped cream and cherries, often decorated with chocolate shavings and more cherries.', 300.00, 'food/Food_Name_744.jfif'
  UNION ALL SELECT 'Beverages', 'Masala Chai', 'A spiced tea made by brewing black tea with a blend of aromatic spices and herbs such as cardamom, cinnamon, ginger, cloves, and black pepper, typically sweetened and served with milk.', 20.00, 'food/Food_Name_8589.jfif'
  UNION ALL SELECT 'Beverages', 'Lassi', 'Creamy yogurt drink with a hint of sweetness, enriched with fresh fruits or spices for a refreshing tangy flavor.', 60.00, 'food/Food_Name_5372.jfif'
  UNION ALL SELECT 'Beverages', 'Hot Chocolate', 'Made by mixing melted chocolate or cocoa powder with hot milk and sugar, sometimes topped with whipped cream or marshmallows.', 80.00, 'food/Food_Name_9993.jfif'
  UNION ALL SELECT 'Beverages', 'Latte', 'A coffee drink made with one shot of espresso and a larger amount of steamed milk, topped with a small amount of milk foam.', 200.00, 'food/Food_Name_5477.jfif'
  UNION ALL SELECT 'Side Dishes', 'Samosa', 'Deep-fried pastry filled with spiced potatoes, peas, and sometimes meat, typically served with tamarind or mint chutney.', 20.00, 'food/Food_Name_177.jfif'
  UNION ALL SELECT 'Side Dishes', 'Pakora', 'Deep-fried fritters made with vegetables like onions, potatoes, or spinach, coated in a gram flour batter and seasoned with spices.', 50.00, 'food/Food_Name_4360.jfif'
  UNION ALL SELECT 'Side Dishes', 'French Fries', 'Thin strips of potatoes deep-fried until crispy and golden, often seasoned with salt and served with ketchup or mayonnaise.', 100.00, 'food/Food_Name_8578.jfif'
  UNION ALL SELECT 'Side Dishes', 'Momos', 'Steamed or fried dumplings filled with vegetables or meat, served with spicy dipping sauce.', 100.00, 'food/Food_Name_7678.jfif'
  UNION ALL SELECT 'Side Dishes', 'Spring Rolls', 'Thin pastry rolls filled with vegetables, meat, or seafood, deep-fried until crispy, and served with sweet chili sauce or soy sauce.', 100.00, 'food/Food_Name_4533.jfif'
  UNION ALL SELECT 'Side Dishes', 'Garlic Bread', 'Bread slices spread with garlic butter and herbs, then baked or grilled until crispy and golden.', 100.00, 'food/Food_Name_2557.jfif'
) AS item
JOIN categories AS category ON category.title = item.category_title
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  price = VALUES(price),
  image_name = VALUES(image_name),
  featured = VALUES(featured),
  active = VALUES(active);

COMMIT;
