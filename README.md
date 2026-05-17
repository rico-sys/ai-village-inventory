# AI Village 備品管理システム

AI Village（コワーキング施設）の備品貸出・在庫管理システムです。スマートフォンから直感的に操作できるニューモグラフィックデザインのWebアプリケーションです。

## 技術スタック

- **フレームワーク**: Next.js 16.2+ (App Router)
- **言語**: TypeScript (strict mode)
- **スタイリング**: Tailwind CSS 4 + ニューモグラフィックデザイン
- **データベース**: Supabase (PostgreSQL)
- **ホスティング**: Vercel
- **通知**: Slack Incoming Webhook
- **リアルタイム更新**: Supabase Realtime

## 主な機能

### お客さん向け
- QRコードスキャンで備品申請
- リアルタイムステータス確認
- 物品ごとの返却依頼

### スタッフ向け
- NFCタグで簡単アクセス
- 申請キュー管理（リアルタイム更新）
- 個人用借用・返却
- 消耗品補充

### 管理者向け
- ダッシュボード
- 物品・カテゴリ管理
- スタッフ管理
- トランザクションログ・CSV出力

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd ai-village-inventory
npm install
```

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセス
2. 新しいプロジェクトを作成
3. **Settings → API** から以下の情報を取得：
   - `Project URL`
   - `anon public` キー
   - `service_role` キー（管理者権限、慎重に扱うこと）

### 3. データベースのセットアップ

Supabaseダッシュボードの **SQL Editor** で以下のSQLファイルを**順番に**実行：

1. `supabase/migrations/001_initial_schema.sql`
   - テーブル作成
   - インデックス設定
   - 在庫自動更新トリガー

2. `supabase/migrations/002_rls_policies.sql`
   - Row Level Security (RLS) ポリシー設定
   - アクセス制御

3. `supabase/seed.sql`
   - 初期カテゴリデータ
   - サンプルスタッフ
   - サンプル物品データ

### 4. Slack Webhook URLの取得（オプション）

1. [Slack API](https://api.slack.com/apps)にアクセス
2. 「Create New App」→「From scratch」
3. **Incoming Webhooks** を有効化
4. チャンネルを選択してWebhook URLを取得

### 5. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Slack（オプション）
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> `.env.example` に空のテンプレートがあります

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## Vercelへのデプロイ

### 方法1: Vercel CLI（推奨）

```bash
# Vercel CLIのインストール（初回のみ）
npm install -g vercel

# デプロイ
vercel

# 本番環境へデプロイ
vercel --prod
```

### 方法2: Vercel Dashboard

1. GitHubにリポジトリをプッシュ
2. [Vercel](https://vercel.com/)にログイン
3. **New Project** → リポジトリを接続
4. **Environment Variables** で環境変数を設定：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SLACK_WEBHOOK_URL`（オプション）
   - `NEXT_PUBLIC_APP_URL`（本番URLに変更）
5. **Deploy** をクリック

## 本番環境での設定

### 1. QRコードの生成

各席用のQRコードを生成して印刷・設置：

```
https://your-domain.vercel.app/request?seat=A-1
https://your-domain.vercel.app/request?seat=A-2
https://your-domain.vercel.app/request?seat=B-1
...
```

推奨QRコード生成ツール：
- https://www.qr-code-generator.com/
- `qrencode` コマンド（Linux/Mac）

### 2. NFCタグの設定

ロッカー前のNFCタグに以下のURLを書き込み：

```
https://your-domain.vercel.app/staff
```

NFCタグ書き込みアプリ：
- **NFC Tools**（iOS/Android）
- **Tagwriter by NXP**（Android）

## 利用方法

### お客さん
1. 席のQRコードをスマホでスキャン
2. 物品を選択してカートに追加
3. 氏名を入力して申請
4. スタッフからの受け渡しを待つ
5. 返却時は「返却を依頼」ボタンをタップ

### スタッフ
1. ロッカー前のNFCタグをスマホでタップ
2. 自分の名前を選択（初回のみ、以降は自動記憶）
3. メニューから操作を選択：
   - **申請キュー**：お客さんからの申請対応
   - **借りる**：自分用に物品を借用
   - **返す**：借りていた物品を返却
   - **消耗品補充**：在庫を補充

### 管理者
- `/admin` - ダッシュボード（本日の申請数、貸出中の物品、低在庫アラート）
- `/admin/items` - 物品の追加・編集・削除
- `/admin/categories` - カテゴリ管理
- `/admin/staff` - スタッフ管理
- `/admin/logs` - 全トランザクションログ・CSV出力

## ディレクトリ構成

```
.
├── app/                    # Next.js App Router
│   ├── request/           # お客さん側画面
│   ├── staff/             # スタッフ側画面
│   ├── admin/             # 管理者側画面
│   ├── layout.tsx         # ルートレイアウト
│   └── globals.css        # グローバルスタイル
├── components/
│   └── neumorphic/        # ニューモグラフィックUIコンポーネント
├── lib/
│   ├── supabase/          # Supabaseクライアント
│   ├── slack.ts           # Slack通知ユーティリティ
│   └── utils.ts           # 共通ユーティリティ
├── types/
│   └── database.ts        # TypeScript型定義
├── supabase/
│   ├── migrations/        # DBマイグレーション
│   └── seed.sql           # 初期データ
├── public/                # 静的ファイル
├── .env.example           # 環境変数テンプレート
├── .env.local             # 環境変数（Gitに含めない）
├── next.config.ts         # Next.js設定
├── vercel.json            # Vercel設定
└── package.json           # 依存関係
```

## トラブルシューティング

### ビルドエラーが発生する場合

```bash
# node_modulesを削除して再インストール
rm -rf node_modules .next
npm install
npm run build
```

### Supabase接続エラー

- `.env.local` の環境変数が正しいか確認
- SupabaseプロジェクトのURLとキーが一致しているか確認
- Supabase Dashboard → Settings → API で再確認

### RLSポリシーエラー

- `002_rls_policies.sql` が正しく実行されているか確認
- Supabase Dashboard → Authentication → Policies で確認

## ライセンス

MIT

## お問い合わせ

プロジェクトに関する質問や提案は、Issuesまでお願いします。
