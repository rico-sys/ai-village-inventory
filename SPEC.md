# AI Village 備品管理システム 仕様書

AI Village（コワーキング施設）の備品貸出・在庫管理システム開発仕様書です。 Claude Codeでこの仕様書に従って実装してください。

---

## 1\. プロジェクト概要

### システムの目的

AI Village内の備品（貸出物品・消耗品）の貸出・返却・在庫管理を、スマートフォンから直感的に操作できるシステムを構築する。

### 2つの利用導線

| 入口 | 利用者 | アクセス方法 | 用途 |
| :---- | :---- | :---- | :---- |
| **席のQRコード** | お客さん | QRスキャン → ブラウザ起動 | 申請型の貸出（コンシェルジュ式） |
| **ロッカー前NFCタグ** | スタッフ | NFCタップ → ブラウザ起動 | スタッフ自身の借用・返却・在庫補充 |

### 運用フロー（お客さん）

1. お客さんが席のQRコードをスキャン  
2. 在庫リストを閲覧し、必要な物品をカートに追加  
3. 氏名を入力して一括申請  
4. Slack通知を受けたスタッフが物品をお届け  
5. 利用後、お客さんが返却ボタンをタップ  
6. Slack通知を受けたスタッフが回収に向かう

### 運用フロー（スタッフ）

1. ロッカー前でNFCタグをタップ  
2. スタッフ選択（初回のみ、Cookie記憶可）  
3. 「借りる/返す/消耗品補充/申請対応」のいずれかを実行

---

## 2\. 技術スタック

| レイヤー | 採用技術 |
| :---- | :---- |
| フレームワーク | Next.js 14+ (App Router, TypeScript) |
| ホスティング | Vercel |
| データベース | Supabase (PostgreSQL) |
| 認証 | Supabase Auth |
| リアルタイム通信 | Supabase Realtime |
| スタイリング | Tailwind CSS \+ 自作ニューモグラフィックCSS |
| UIライブラリ | shadcn/ui（必要に応じて） |
| アイコン | Lucide React |
| グラフ描画 | Recharts |
| 通知 | Slack Incoming Webhook |
| PWA対応 | next-pwa |

---

## 3\. データモデル

### 3.1 テーブル定義

\-- スタッフ

create table staff (

  id uuid primary key default gen\_random\_uuid(),

  name text not null,

  email text,

  active boolean default true,

  created\_at timestamptz default now()

);

\-- カテゴリ

create table categories (

  id uuid primary key default gen\_random\_uuid(),

  name text not null,

  type text not null check (type in ('rental', 'consumable')),

  created\_at timestamptz default now()

);

\-- 物品

create table items (

  id uuid primary key default gen\_random\_uuid(),

  name text not null,

  category\_id uuid references categories(id),

  current\_stock int default 0,

  low\_stock\_alert int default 0,

  created\_at timestamptz default now()

);

\-- 申請（お客さん用）

create table requests (

  id uuid primary key default gen\_random\_uuid(),

  visitor\_name text not null,

  seat\_number text not null,

  status text not null check (status in (

    'pending','delivered','return\_requested','returned','cancelled'

  )),

  requested\_at timestamptz default now(),

  delivered\_at timestamptz,

  delivered\_by uuid references staff(id),

  return\_requested\_at timestamptz,

  returned\_at timestamptz,

  returned\_by uuid references staff(id),

  note text

);

\-- 申請明細

create table request\_items (

  id uuid primary key default gen\_random\_uuid(),

  request\_id uuid references requests(id) on delete cascade,

  item\_id uuid references items(id),

  quantity int not null default 1,

  item\_status text not null check (item\_status in (

    'pending','delivered','return\_requested','returned','cancelled'

  )),

  delivered\_at timestamptz,

  returned\_at timestamptz

);

\-- トランザクション（全在庫移動の正本）

create table transactions (

  id uuid primary key default gen\_random\_uuid(),

  item\_id uuid references items(id),

  action text not null check (action in ('out','in','restock','adjust')),

  quantity int not null,

  actor\_type text not null check (actor\_type in ('staff','visitor')),

  actor\_id uuid references staff(id),

  visitor\_name text,

  request\_item\_id uuid references request\_items(id),

  timestamp timestamptz default now(),

  note text

);

### 3.2 在庫加減算トリガー

`transactions` への INSERT 時に `items.current_stock` を自動更新する。

create or replace function update\_item\_stock()

returns trigger as $$

begin

  if NEW.action \= 'out' then

    update items set current\_stock \= current\_stock \- NEW.quantity where id \= NEW.item\_id;

  elsif NEW.action \= 'in' or NEW.action \= 'restock' then

    update items set current\_stock \= current\_stock \+ NEW.quantity where id \= NEW.item\_id;

  elsif NEW.action \= 'adjust' then

    \-- adjust は差分を quantity に入れる仕様（負数も許容）

    update items set current\_stock \= current\_stock \+ NEW.quantity where id \= NEW.item\_id;

  end if;

  return NEW;

end;

$$ language plpgsql;

create trigger trigger\_update\_stock

after insert on transactions

for each row execute function update\_item\_stock();

### 3.3 インデックス

create index idx\_transactions\_item\_id on transactions(item\_id);

create index idx\_transactions\_timestamp on transactions(timestamp desc);

create index idx\_requests\_status on requests(status);

create index idx\_request\_items\_request\_id on request\_items(request\_id);

create index idx\_items\_category\_id on items(category\_id);

### 3.4 RLSポリシー

- お客さん（未認証）：自分の `request_id` を持つレコードのみ閲覧可能  
- スタッフ（認証済み）：全テーブルRead/Write可能  
- 詳細はSupabase Authと連携して実装

### 3.5 初期マスタデータ

\-- カテゴリ初期データ

insert into categories (name, type) values

  ('貸出物品', 'rental'),

  ('消耗品', 'consumable');

---

## 4\. 画面仕様

### 4.1 お客さん側

#### `/request?seat=A-3` \- 申請画面

- URLパラメータ `seat` で席番号を自動入力  
- 氏名入力欄（localStorage保存、次回スキップ）  
- タブで「貸出物品 / 消耗品」切替  
- 物品ごとに \[−\]\[数量\]\[+\] ステッパー  
- フッター固定カート（合計点数表示）→ 確認画面へ  
- 在庫が0または `low_stock_alert` 未満は視覚的に区別（グレーアウト/赤バッジ）

#### `/request/confirm` \- 確認画面

- カート内容と氏名・席番号を表示  
- 「申請する」ボタンで `requests` \+ `request_items` 作成  
- Slack Webhook通知を送信  
- 完了後 `/request/[id]` へリダイレクト

#### `/request/[id]` \- 申請ステータス画面

- 申請内容、ステータス、各物品の状態を表示  
- 各物品ごとに「返却を依頼」ボタン  
- 「すべて返却を依頼」ボタン（一括返却）  
- 返却依頼で `item_status` を `return_requested` に変更  
- Slack通知（回収依頼）を送信  
- Supabase Realtimeで状態自動更新

### 4.2 スタッフ側

#### `/staff` \- スタッフホーム

- 初回はスタッフ選択画面（一覧から選択、「このデバイスに記憶」チェックボックス）  
- Cookie保存で次回スキップ可能  
- メニュー：  
  - 📥 申請キュー（バッジで件数表示、Realtime更新）  
  - 🤝 自分用：\[借りる\] \[返す\]  
  - 📦 在庫管理：\[消耗品補充\]

#### `/staff/select` \- スタッフ選択

- `active=true` のスタッフをカードで一覧表示  
- 選択でCookieに `staff_id` 保存

#### `/staff/queue` \- 申請キュー

- ステータス別にグループ化：pending / delivered / return\_requested  
- 各申請カードで明細を表示  
- アクションボタン：\[お渡し完了\]\[回収完了\]\[キャンセル\]  
- 物品単位での状態管理（明細ごとにボタン）  
- Supabase Realtimeで新規申請を自動表示

#### `/staff/borrow` \- 自分用：借りる

- 物品リスト（在庫\>0のみ）→ タップ → 数量選択 → 確定  
- `transactions` に `out`、`actor_type=staff` で記録

#### `/staff/return` \- 自分用：返す

- 自分が `out` している物品で `in` されていないものを表示  
- タップで `in` トランザクション登録

#### `/staff/restock` \- 消耗品補充

- 消耗品カテゴリの物品を一覧  
- 補充数量・メモを入力  
- `transactions` に `restock` で記録

### 4.3 管理者側

#### `/admin` \- 管理ダッシュボード

- 本日の申請数  
- 現在貸出中の物品数  
- 低在庫アラート一覧

#### `/admin/items` \- 物品管理

- 一覧、検索、追加、編集、削除  
- 在庫数、カテゴリ、`low_stock_alert` 設定

#### `/admin/categories` \- カテゴリ管理

- 追加・削除（タイプ：rental/consumable）

#### `/admin/staff` \- スタッフ管理

- 追加・編集・無効化（物理削除はしない、履歴整合性のため）

#### `/admin/logs` \- 全ログ

- `transactions` を時系列表示  
- フィルタ：期間、物品、スタッフ、アクション  
- CSV出力機能

#### `/admin/items/[id]/logs` \- 個別物品ログ

- 該当物品の全トランザクション  
- 在庫推移グラフ（Recharts）

---

## 5\. デザイン仕様

### 5.1 ニューモグラフィック

**カラーパレット**

:root {

  \--bg: \#e0e5ec;

  \--text: \#2c3e50;

  \--text-muted: \#5a6c7d;

  \--accent: \#6c7ee1;

  \--accent-hover: \#5568d3;

  \--success: \#4caf50;

  \--warning: \#ff9800;

  \--danger: \#f44336;

  \--shadow-light: \#ffffff;

  \--shadow-dark: \#a3b1c6;

}

**基本シャドウパターン**

/\* 凸（ボタン、カード） \*/

.neu-convex {

  box-shadow: 9px 9px 16px var(--shadow-dark),

              \-9px \-9px 16px var(--shadow-light);

}

/\* 凹（入力欄、選択中状態） \*/

.neu-concave {

  box-shadow: inset 6px 6px 12px var(--shadow-dark),

              inset \-6px \-6px 12px var(--shadow-light);

}

/\* タップ時のトランジション \*/

.neu-button:active {

  box-shadow: inset 4px 4px 8px var(--shadow-dark),

              inset \-4px \-4px 8px var(--shadow-light);

}

**デザインルール**

- 角丸は大きめ（16px〜24px）  
- グラデーションは控えめ  
- スマホファースト、タップ領域は最低44px×44pxを確保  
- アニメーションはタップ時に「凸→凹」へ遷移（押し込み感）  
- フォントは日本語: Noto Sans JP、英数字: Inter を推奨

### 5.2 レスポンシブ

| ブレークポイント | レイアウト |
| :---- | :---- |
| 〜640px（スマホ） | 1カラム、フッター固定カート |
| 641px〜1023px（タブレット） | 2カラム、サイドメニュー表示 |
| 1024px〜（PC） | 管理画面表示最適化 |

### 5.3 コンポーネント要件

`components/neumorphic/` 配下に以下を実装：

- `Button.tsx` \- 凸ボタン、タップで凹  
- `Card.tsx` \- 凸カード（コンテナ）  
- `Input.tsx` \- 凹インプット  
- `Stepper.tsx` \- 数量増減（−／＋）  
- `Tabs.tsx` \- タブ切替（選択中は凹）  
- `Badge.tsx` \- ステータスバッジ  
- `Modal.tsx` \- 確認モーダル

---

## 6\. Slack通知

`.env.local` の `SLACK_WEBHOOK_URL` を使用。Block Kit形式で実装。

### 6.1 新規申請

🆕 新規申請

👤 {visitor\_name} 様

📍 席 {seat\_number}

📦 {item\_name} × {quantity}

   {item\_name} × {quantity}

🕐 {time}

\[詳細を見る\] → /staff/queue

### 6.2 回収依頼

♻️ 回収依頼

👤 {visitor\_name} 様

📍 席 {seat\_number}

📦 {item\_name} × {quantity}

🕐 {time}（貸出から {duration}）

\[詳細を見る\] → /staff/queue

### 6.3 低在庫アラート

⚠️ 在庫不足

📦 {item\_name}

📊 残り {current\_stock}個（閾値: {low\_stock\_alert}個）

### 6.4 実装方針

- `lib/slack.ts` にユーティリティ関数を集約  
- 通知失敗してもアプリ機能は止めない（try/catch \+ ログ）  
- 開発環境では `SLACK_WEBHOOK_URL` 未設定時はコンソール出力

---

## 7\. 環境変数

`.env.example` を作成し、以下を含めること：

\# Supabase

NEXT\_PUBLIC\_SUPABASE\_URL=

NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=

SUPABASE\_SERVICE\_ROLE\_KEY=

\# Slack

SLACK\_WEBHOOK\_URL=

\# App

NEXT\_PUBLIC\_APP\_URL=http://localhost:3000

---

## 8\. 開発の進め方

各ステップ完了時に動作確認を行い、コミットを分けること。

### Step 1: プロジェクト初期化

- Next.js \+ TypeScript \+ Tailwind セットアップ  
- Supabase接続設定  
- `.env.example` 作成  
- `package.json`、`tsconfig.json`、基本ディレクトリ構造

### Step 2: データベース構築

- 上記スキーマのSQL一式（`supabase/migrations/` に配置）  
- 在庫加減算トリガー関数  
- RLSポリシー  
- 初期マスタデータ（`supabase/seed.sql`）

### Step 3: 共通基盤

- ニューモグラフィックCSSコンポーネント（`components/neumorphic/`）  
- Supabaseクライアント（`lib/supabase/client.ts`, `lib/supabase/server.ts`）  
- 型定義（`types/database.ts`）  
- Slack通知ユーティリティ（`lib/slack.ts`）

### Step 4: お客さん側

- `/request?seat=X` 申請画面（カート機能込み）  
- `/request/confirm` 確認画面  
- `/request/[id]` ステータス画面（Realtime対応）

### Step 5: スタッフ側

- `/staff` ホーム＋スタッフ選択  
- `/staff/queue` 申請キュー（Realtime）  
- `/staff/borrow`, `/staff/return`, `/staff/restock`

### Step 6: 管理者側

- `/admin` ダッシュボード  
- 物品・カテゴリ・スタッフ管理  
- ログビュー＋CSV出力  
- 個別物品ログ＋グラフ

### Step 7: 仕上げ

- PWA設定（manifest、Service Worker）  
- ニューモCSSの最終調整  
- エラーハンドリング・ローディング状態  
- README.md（セットアップ手順、Vercelデプロイ手順、QRコード生成方法）

---

## 9\. ディレクトリ構成（参考）

.

├── app/

│   ├── (visitor)/

│   │   └── request/

│   │       ├── page.tsx

│   │       ├── confirm/page.tsx

│   │       └── \[id\]/page.tsx

│   ├── staff/

│   │   ├── page.tsx

│   │   ├── select/page.tsx

│   │   ├── queue/page.tsx

│   │   ├── borrow/page.tsx

│   │   ├── return/page.tsx

│   │   └── restock/page.tsx

│   ├── admin/

│   │   ├── page.tsx

│   │   ├── items/

│   │   ├── categories/

│   │   ├── staff/

│   │   └── logs/

│   ├── api/

│   │   └── slack/route.ts

│   ├── layout.tsx

│   └── globals.css

├── components/

│   ├── neumorphic/

│   │   ├── Button.tsx

│   │   ├── Card.tsx

│   │   ├── Input.tsx

│   │   ├── Stepper.tsx

│   │   └── ...

│   └── shared/

├── lib/

│   ├── supabase/

│   │   ├── client.ts

│   │   └── server.ts

│   ├── slack.ts

│   └── utils.ts

├── types/

│   └── database.ts

├── supabase/

│   ├── migrations/

│   └── seed.sql

├── public/

│   ├── manifest.json

│   └── icons/

├── .env.example

├── next.config.js

├── tailwind.config.ts

├── tsconfig.json

├── package.json

├── README.md

└── SPEC.md

---

## 10\. 品質基準

- **型安全**: TypeScript strict mode、`any` 禁止  
- **エラーハンドリング**: 全DB操作・API呼び出しに try/catch  
- **ローディング状態**: 全非同期処理にスピナー/スケルトン表示  
- **アクセシビリティ**: セマンティックHTML、aria属性、キーボード操作対応  
- **コメント**: 複雑なロジックには日本語コメント  
- **コミット**: Step ごとに分ける、Conventional Commits推奨

---

## 11\. 開発時の注意事項

- 各Stepを1つずつ進めて、終わったら確認してから次へ  
- 仕様の曖昧な部分は実装前に確認してください  
- 商用品質のコード（型安全、エラーハンドリング、適切なコメント）  
- ファイル構成は Next.js のベストプラクティスに従う  
- ニューモグラフィックは「凸→凹」のインタラクションを必ず実装

---

## 12\. デプロイ手順（README.mdに記載）

1. Supabaseプロジェクト作成 → migrations実行 → seed投入  
2. Slack Incoming Webhook作成 → URL取得  
3. Vercelにリポジトリ連携  
4. 環境変数を設定  
5. デプロイ  
6. NFCタグにスタッフ用URLを書き込み（NFC Toolsアプリ等）  
7. 各席にQRコード（`/request?seat=XX`）を貼付

---

**この仕様書に従って、Step 1から順に実装をお願いします。**  
