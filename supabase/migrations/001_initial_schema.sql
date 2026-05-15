-- AI Village 備品管理システム 初期スキーマ

-- スタッフ
create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  active boolean default true,
  created_at timestamptz default now()
);

-- カテゴリ
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('rental', 'consumable')),
  created_at timestamptz default now()
);

-- 物品
create table items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references categories(id),
  current_stock int default 0,
  low_stock_alert int default 0,
  created_at timestamptz default now()
);

-- 申請（お客さん用）
create table requests (
  id uuid primary key default gen_random_uuid(),
  visitor_name text not null,
  seat_number text not null,
  status text not null check (status in (
    'pending','delivered','return_requested','returned','cancelled'
  )),
  requested_at timestamptz default now(),
  delivered_at timestamptz,
  delivered_by uuid references staff(id),
  return_requested_at timestamptz,
  returned_at timestamptz,
  returned_by uuid references staff(id),
  note text
);

-- 申請明細
create table request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references requests(id) on delete cascade,
  item_id uuid references items(id),
  quantity int not null default 1,
  item_status text not null check (item_status in (
    'pending','delivered','return_requested','returned','cancelled'
  )),
  delivered_at timestamptz,
  returned_at timestamptz
);

-- トランザクション（全在庫移動の正本）
create table transactions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id),
  action text not null check (action in ('out','in','restock','adjust')),
  quantity int not null,
  actor_type text not null check (actor_type in ('staff','visitor')),
  actor_id uuid references staff(id),
  visitor_name text,
  request_item_id uuid references request_items(id),
  timestamp timestamptz default now(),
  note text
);

-- インデックス
create index idx_transactions_item_id on transactions(item_id);
create index idx_transactions_timestamp on transactions(timestamp desc);
create index idx_requests_status on requests(status);
create index idx_request_items_request_id on request_items(request_id);
create index idx_items_category_id on items(category_id);

-- 在庫加減算トリガー関数
create or replace function update_item_stock()
returns trigger as $$
begin
  if NEW.action = 'out' then
    update items set current_stock = current_stock - NEW.quantity where id = NEW.item_id;
  elsif NEW.action = 'in' or NEW.action = 'restock' then
    update items set current_stock = current_stock + NEW.quantity where id = NEW.item_id;
  elsif NEW.action = 'adjust' then
    -- adjust は差分を quantity に入れる仕様（負数も許容）
    update items set current_stock = current_stock + NEW.quantity where id = NEW.item_id;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- トリガー作成
create trigger trigger_update_stock
after insert on transactions
for each row execute function update_item_stock();
