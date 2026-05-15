-- AI Village 備品管理システム 初期データ

-- カテゴリ初期データ
insert into categories (name, type) values
  ('貸出物品', 'rental'),
  ('消耗品', 'consumable');

-- サンプルスタッフ
insert into staff (name, email, active) values
  ('山田太郎', 'yamada@example.com', true),
  ('佐藤花子', 'sato@example.com', true),
  ('鈴木一郎', 'suzuki@example.com', true);

-- サンプル物品（貸出物品）
insert into items (name, category_id, current_stock, low_stock_alert)
select
  item_name,
  (select id from categories where type = 'rental' limit 1),
  stock,
  alert
from (values
  ('HDMIケーブル', 10, 3),
  ('USB-Cケーブル', 15, 5),
  ('モバイルバッテリー', 8, 2),
  ('イヤホン', 5, 2),
  ('マウス', 10, 3),
  ('キーボード', 5, 2),
  ('ノートパソコンスタンド', 3, 1),
  ('Webカメラ', 4, 1),
  ('マイク', 3, 1)
) as data(item_name, stock, alert);

-- サンプル物品（消耗品）
insert into items (name, category_id, current_stock, low_stock_alert)
select
  item_name,
  (select id from categories where type = 'consumable' limit 1),
  stock,
  alert
from (values
  ('コピー用紙（A4）', 500, 100),
  ('ボールペン（黒）', 50, 10),
  ('ボールペン（赤）', 30, 10),
  ('付箋（大）', 20, 5),
  ('付箋（小）', 30, 10),
  ('クリアファイル', 40, 10),
  ('ホッチキス針', 100, 20),
  ('マスキングテープ', 15, 5)
) as data(item_name, stock, alert);
