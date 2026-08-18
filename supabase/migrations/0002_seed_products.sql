-- Seeds `products` with the same indicative catalog as
-- src/lib/products/catalog.ts (MOCK_CATALOG). If you edit one, edit the other.
-- This keeps `project_products.product_id` valid as a foreign key while the
-- MVP still resolves prices in-app via MockProductProvider.

insert into products (id, name, category, unit, estimated_unit_price, currency, provider) values
  ('paint-wall-matte', 'Peinture murale mate (10L)', 'peinture murale', 'L', 15, 'EUR', 'mock'),
  ('primer-undercoat', 'Sous-couche universelle (10L)', 'sous-couche', 'L', 9, 'EUR', 'mock'),
  ('wall-filler', 'Enduit de rebouchage / lissage', 'préparation des murs', 'kg', 4.5, 'EUR', 'mock'),
  ('sandpaper-pack', 'Lot de papier abrasif', 'préparation des murs', 'unit', 8, 'EUR', 'mock'),
  ('flooring-laminate-light', 'Parquet stratifié bois clair', 'sol', 'm2', 22, 'EUR', 'mock'),
  ('flooring-tile-beige', 'Carrelage grès cérame beige', 'sol', 'm2', 28, 'EUR', 'mock'),
  ('flooring-underlay', 'Sous-couche isolante pour sol', 'sol', 'm2', 3.5, 'EUR', 'mock'),
  ('skirting-board', 'Plinthes assorties', 'plinthes', 'm', 6, 'EUR', 'mock'),
  ('storage-modular-unit', 'Meuble de rangement modulaire', 'rangement', 'unit', 220, 'EUR', 'mock'),
  ('shelving-open', 'Étagères murales', 'rangement', 'unit', 65, 'EUR', 'mock'),
  ('wardrobe-basic', 'Armoire / penderie', 'rangement', 'unit', 260, 'EUR', 'mock'),
  ('kitchen-cabinet-module', 'Module de cuisine (bas ou haut)', 'cuisine', 'unit', 180, 'EUR', 'mock'),
  ('kitchen-worktop', 'Plan de travail stratifié', 'cuisine', 'm', 90, 'EUR', 'mock'),
  ('kitchen-backsplash', 'Crédence de cuisine', 'cuisine', 'm2', 45, 'EUR', 'mock'),
  ('bathroom-tile', 'Carrelage mural salle de bain', 'salle de bain', 'm2', 32, 'EUR', 'mock'),
  ('bathroom-vanity', 'Meuble vasque', 'salle de bain', 'unit', 240, 'EUR', 'mock'),
  ('bathroom-fixtures', 'Robinetterie', 'salle de bain', 'unit', 95, 'EUR', 'mock'),
  ('lighting-fixture', 'Suspension / plafonnier', 'éclairage', 'unit', 55, 'EUR', 'mock'),
  ('lighting-spot', 'Spot encastrable (lot de 4)', 'éclairage', 'unit', 38, 'EUR', 'mock'),
  ('hardware-screws', 'Visserie et fixations', 'accessoires', 'unit', 25, 'EUR', 'mock'),
  ('hardware-tools', 'Petit outillage / consommables', 'accessoires', 'unit', 40, 'EUR', 'mock'),
  ('hardware-paint-tools', 'Rouleaux, pinceaux, bâches', 'accessoires', 'unit', 30, 'EUR', 'mock'),
  ('textile-curtains', 'Rideaux / voilages', 'décoration', 'unit', 45, 'EUR', 'mock'),
  ('textile-rug', 'Tapis', 'décoration', 'unit', 85, 'EUR', 'mock')
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  unit = excluded.unit,
  estimated_unit_price = excluded.estimated_unit_price;
