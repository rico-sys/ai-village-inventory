-- Row Level Security (RLS) ポリシー（修正版）
-- このシステムは認証なしで動作するため、全てのテーブルに対して完全なアクセスを許可

-- RLS有効化
alter table staff enable row level security;
alter table categories enable row level security;
alter table items enable row level security;
alter table requests enable row level security;
alter table request_items enable row level security;
alter table transactions enable row level security;

-- スタッフテーブル: 全員が全ての操作可能
create policy "staff_all_access" on staff for all using (true) with check (true);

-- カテゴリテーブル: 全員が全ての操作可能
create policy "categories_all_access" on categories for all using (true) with check (true);

-- 物品テーブル: 全員が全ての操作可能
create policy "items_all_access" on items for all using (true) with check (true);

-- 申請テーブル: 全員が全ての操作可能
create policy "requests_all_access" on requests for all using (true) with check (true);

-- 申請明細テーブル: 全員が全ての操作可能
create policy "request_items_all_access" on request_items for all using (true) with check (true);

-- トランザクションテーブル: 全員が全ての操作可能
create policy "transactions_all_access" on transactions for all using (true) with check (true);
