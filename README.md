# AI Village 備品管理システム

AI Village（コワーキング施設）の備品貸出・在庫管理システムです。

## 技術スタック

- **フレームワーク**: Next.js 14+ (App Router)
- **言語**: TypeScript (strict mode)
- **スタイリング**: Tailwind CSS + ニューモグラフィックデザイン
- **データベース**: Supabase (PostgreSQL)
- **ホスティング**: Vercel
- **通知**: Slack Incoming Webhook

## セットアップ手順

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にログイン
2. 新しいプロジェクトを作成
3. プロジェクト設定からAPI情報を取得

### 3. データベースのセットアップ

Supabaseダッシュボードの「SQL Editor」で以下のSQLファイルを順番に実行：

1. `supabase/migrations/001_initial_schema.sql` - テーブル作成とトリガー
2. `supabase/migrations/002_rls_policies.sql` - セキュリティポリシー
3. `supabase/seed.sql` - 初期データ投入

### 4. Slack Webhook URLの取得

1. Slackワークスペースで新しいアプリを作成
2. Incoming Webhookを有効化
3. Webhook URLを取得

### 5. 環境変数の設定

`.env.local` ファイルを作成し、以下の変数を設定：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Slack
SLACK_WEBHOOK_URL=your_slack_webhook_url

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアクセスできます。

## 利用方法

### お客さん側

1. 席のQRコードをスキャン
2. 必要な物品をカートに追加
3. 氏名を入力して申請
4. スタッフが物品をお届け
5. 利用後、返却ボタンをタップ

### スタッフ側

1. ロッカー前のNFCタグをタップ
2. スタッフ選択（初回のみ）
3. 「借りる/返す/消耗品補充/申請対応」を実行

### 管理者側

- `/admin` - ダッシュボード
- `/admin/items` - 物品管理
- `/admin/categories` - カテゴリ管理
- `/admin/staff` - スタッフ管理
- `/admin/logs` - ログ閲覧・CSV出力

## Vercelデプロイ

1. GitHubにリポジトリをプッシュ
2. Vercelで新しいプロジェクトを作成
3. リポジトリを接続
4. 環境変数を設定（上記と同じ）
5. デプロイ

## QRコード・NFCタグの設定

### QRコード（お客さん用）

各席用のQRコードを生成：

```
https://your-domain.com/request?seat=A-1
https://your-domain.com/request?seat=A-2
...
```

### NFCタグ（スタッフ用）

ロッカー前のNFCタグに書き込むURL：

```
https://your-domain.com/staff
```

## ライセンス

MIT
