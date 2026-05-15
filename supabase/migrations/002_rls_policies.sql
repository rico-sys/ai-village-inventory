-- Row Level Security (RLS) ポリシー

-- RLS有効化
alter table staff enable row level security;
alter table categories enable row level security;
alter table items enable row level security;
alter table requests enable row level security;
alter table request_items enable row level security;
alter table transactions enable row level security;

-- スタッフテーブル: 全員読み取り可能、認証済みユーザーは編集可能
create policy "staff_select_all" on staff for select using (true);
create policy "staff_modify_authenticated" on staff for all using (auth.role() = 'authenticated');

-- カテゴリテーブル: 全員読み取り可能、認証済みユーザーは編集可能
create policy "categories_select_all" on categories for select using (true);
create policy "categories_modify_authenticated" on categories for all using (auth.role() = 'authenticated');

-- 物品テーブル: 全員読み取り可能、認証済みユーザーは編集可能
create policy "items_select_all" on items for select using (true);
create policy "items_modify_authenticated" on items for all using (auth.role() = 'authenticated');

-- 申請テーブル: 全員作成可能、自分の申請は閲覧可能、認証済みユーザーは全て閲覧・編集可能
create policy "requests_insert_all" on requests for insert with check (true);
create policy "requests_select_all" on requests for select using (true);
create policy "requests_modify_authenticated" on requests for update using (auth.role() = 'authenticated');

-- 申請明細テーブル: 申請テーブルに準拠
create policy "request_items_insert_all" on request_items for insert with check (true);
create policy "request_items_select_all" on request_items for select using (true);
create policy "request_items_modify_authenticated" on request_items for update using (auth.role() = 'authenticated');

-- トランザクションテーブル: 全員作成可能、全員読み取り可能
create policy "transactions_insert_all" on transactions for insert with check (true);
create policy "transactions_select_all" on transactions for select using (true);
