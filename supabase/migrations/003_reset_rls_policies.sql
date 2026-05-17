-- RLSポリシーのリセットと再作成
-- 既存のポリシーを全て削除してから、新しいポリシーを作成します

-- ========================================
-- Step 1: 既存のポリシーを全て削除
-- ========================================

-- 新しいポリシー名
DROP POLICY IF EXISTS "staff_all_access" ON staff;
DROP POLICY IF EXISTS "categories_all_access" ON categories;
DROP POLICY IF EXISTS "items_all_access" ON items;
DROP POLICY IF EXISTS "requests_all_access" ON requests;
DROP POLICY IF EXISTS "request_items_all_access" ON request_items;
DROP POLICY IF EXISTS "transactions_all_access" ON transactions;

-- 古いポリシー名（もし存在する場合）
DROP POLICY IF EXISTS "staff_select_all" ON staff;
DROP POLICY IF EXISTS "staff_modify_authenticated" ON staff;
DROP POLICY IF EXISTS "categories_select_all" ON categories;
DROP POLICY IF EXISTS "categories_modify_authenticated" ON categories;
DROP POLICY IF EXISTS "items_select_all" ON items;
DROP POLICY IF EXISTS "items_modify_authenticated" ON items;
DROP POLICY IF EXISTS "requests_insert_all" ON requests;
DROP POLICY IF EXISTS "requests_select_all" ON requests;
DROP POLICY IF EXISTS "requests_modify_authenticated" ON requests;
DROP POLICY IF EXISTS "request_items_insert_all" ON request_items;
DROP POLICY IF EXISTS "request_items_select_all" ON request_items;
DROP POLICY IF EXISTS "request_items_modify_authenticated" ON request_items;
DROP POLICY IF EXISTS "transactions_insert_all" ON transactions;
DROP POLICY IF EXISTS "transactions_select_all" ON transactions;

-- ========================================
-- Step 2: 新しいポリシーを作成
-- ========================================
-- このシステムは認証なしで動作するため、全てのテーブルに対して完全なアクセスを許可

-- スタッフテーブル: 全員が全ての操作可能
CREATE POLICY "staff_all_access" ON staff FOR ALL USING (true) WITH CHECK (true);

-- カテゴリテーブル: 全員が全ての操作可能
CREATE POLICY "categories_all_access" ON categories FOR ALL USING (true) WITH CHECK (true);

-- 物品テーブル: 全員が全ての操作可能
CREATE POLICY "items_all_access" ON items FOR ALL USING (true) WITH CHECK (true);

-- 申請テーブル: 全員が全ての操作可能
CREATE POLICY "requests_all_access" ON requests FOR ALL USING (true) WITH CHECK (true);

-- 申請明細テーブル: 全員が全ての操作可能
CREATE POLICY "request_items_all_access" ON request_items FOR ALL USING (true) WITH CHECK (true);

-- トランザクションテーブル: 全員が全ての操作可能
CREATE POLICY "transactions_all_access" ON transactions FOR ALL USING (true) WITH CHECK (true);
