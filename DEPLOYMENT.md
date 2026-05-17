# デプロイ手順書

このドキュメントでは、AI Village備品管理システムをVercelとSupabaseにデプロイする手順を詳しく説明します。

## 前提条件

- GitHubアカウント
- Vercelアカウント（GitHubでサインアップ可能）
- Supabaseアカウント

## Step 1: Supabaseのセットアップ

### 1.1 プロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセスしてログイン
2. 「New project」をクリック
3. プロジェクト情報を入力：
   - Name: `ai-village-inventory`（任意の名前）
   - Database Password: 強力なパスワードを設定（必ず保存）
   - Region: `Tokyo (Northeast Asia)`（推奨）
4. 「Create new project」をクリック
5. プロジェクトの準備が完了するまで約2分待つ

### 1.2 APIキーの取得

1. サイドメニューから **Settings** → **API** を開く
2. 以下の情報をメモ：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** キー（長い文字列）
   - **service_role** キー（長い文字列、慎重に扱うこと）

### 1.3 データベースのセットアップ

1. サイドメニューから **SQL Editor** を開く
2. 「New query」をクリック
3. 以下のSQLファイルの内容を**順番に**コピー&ペーストして実行：

#### 実行順序1: `supabase/migrations/001_initial_schema.sql`

```sql
-- テーブル作成、インデックス、トリガー
-- ファイルの内容を全てコピーして実行
```

実行後、右上の「Run」ボタンをクリック。成功メッセージを確認。

#### 実行順序2: `supabase/migrations/002_rls_policies.sql`

```sql
-- Row Level Security ポリシー
-- ファイルの内容を全てコピーして実行
```

#### 実行順序3: `supabase/seed.sql`

```sql
-- 初期データ（カテゴリ、サンプルスタッフ、サンプル物品）
-- ファイルの内容を全てコピーして実行
```

### 1.4 データの確認

1. サイドメニューから **Table Editor** を開く
2. 以下のテーブルが作成されていることを確認：
   - `staff`（3件のサンプルデータ）
   - `categories`（2件）
   - `items`（17件のサンプルデータ）
   - `requests`
   - `request_items`
   - `transactions`

## Step 2: Slack Webhook（オプション）

### 2.1 Slack Appの作成

1. [Slack API](https://api.slack.com/apps)にアクセス
2. 「Create New App」→ 「From scratch」
3. App Name: `AI Village Notifications`（任意）
4. Workspace: 通知を送りたいワークスペースを選択
5. 「Create App」をクリック

### 2.2 Incoming Webhookの有効化

1. サイドメニューから「Incoming Webhooks」を選択
2. 「Activate Incoming Webhooks」をオンに切り替え
3. 下部の「Add New Webhook to Workspace」をクリック
4. 通知を送るチャンネルを選択（例：#general, #ai-village）
5. 「許可する」をクリック
6. 生成された **Webhook URL**（`https://hooks.slack.com/services/...`）をコピー

## Step 3: GitHubリポジトリの準備

### 3.1 リポジトリの作成

ローカルでGitリポジトリを初期化（未実施の場合）：

```bash
cd /Users/ricomurakami/Desktop/ai-village-inventory
git init
git add .
git commit -m "Initial commit: AI Village inventory system"
```

### 3.2 GitHubにプッシュ

1. [GitHub](https://github.com/)で新しいリポジトリを作成
   - Repository name: `ai-village-inventory`
   - Private または Public を選択
   - 「Create repository」をクリック

2. ローカルからプッシュ：

```bash
git remote add origin https://github.com/your-username/ai-village-inventory.git
git branch -M main
git push -u origin main
```

## Step 4: Vercelへのデプロイ

### 4.1 Vercelプロジェクトの作成

1. [Vercel](https://vercel.com/)にアクセスしてログイン（GitHubアカウント推奨）
2. 「Add New...」→ 「Project」をクリック
3. GitHubリポジトリ一覧から `ai-village-inventory` を選択
4. 「Import」をクリック

### 4.2 環境変数の設定

「Environment Variables」セクションで以下を追加：

| Name | Value | 説明 |
|------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Step 1.2で取得したProject URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Step 1.2で取得したanon public キー |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Step 1.2で取得したservice_role キー |
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/services/...` | Step 2で取得したWebhook URL（オプション） |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | デプロイ後のURL（仮で入力、後で更新） |

### 4.3 デプロイの実行

1. 「Deploy」ボタンをクリック
2. ビルドとデプロイが完了するまで約2-3分待つ
3. 成功すると「Congratulations!」画面が表示される
4. デプロイされたURLが表示される（例：`https://ai-village-inventory-xxxxx.vercel.app`）

### 4.4 環境変数の更新

1. Vercel Dashboard → プロジェクト → 「Settings」→ 「Environment Variables」
2. `NEXT_PUBLIC_APP_URL` の値を実際のデプロイURLに更新
3. 「Save」をクリック
4. 「Deployments」タブから最新のデプロイを「Redeploy」

## Step 5: 動作確認

### 5.1 基本動作確認

ブラウザでデプロイしたURLにアクセス：

1. トップページが表示されることを確認
2. `/request?seat=A-1` にアクセスして申請画面を確認
3. `/staff` にアクセスしてスタッフ画面を確認
4. `/admin` にアクセスして管理画面を確認

### 5.2 データベース接続確認

1. `/admin/items` で物品一覧が表示されるか確認
2. `/admin/staff` でスタッフ一覧が表示されるか確認

### 5.3 Slack通知確認（設定した場合）

1. `/request?seat=TEST-1` で備品を申請
2. Slackの指定チャンネルに通知が届くか確認

## Step 6: QRコード・NFCタグの設定

### 6.1 QRコードの生成

各席のQRコードを生成：

**方法1: オンラインツール**

1. [QR Code Generator](https://www.qr-code-generator.com/)にアクセス
2. URL入力欄に以下を入力（席番号を変更）：
   ```
   https://your-app.vercel.app/request?seat=A-1
   ```
3. 「Create QR Code」をクリック
4. 「Download」で画像を保存
5. 各席分（A-1, A-2, B-1...）を繰り返す

**方法2: コマンド（Mac/Linux）**

```bash
# qrencodeのインストール（Homebrew）
brew install qrencode

# QRコード生成スクリプト
for seat in A-{1..10} B-{1..10}; do
  qrencode -o "qr-${seat}.png" "https://your-app.vercel.app/request?seat=${seat}"
done
```

### 6.2 NFCタグの書き込み

**必要なもの：**
- NFCタグ（NTAG213以上推奨）
- スマートフォン（NFC対応）
- NFC書き込みアプリ

**手順：**

1. **NFC Tools** アプリをインストール（iOS/Android）
2. アプリを開いて「Write」タブを選択
3. 「Add a record」→ 「URL/URI」を選択
4. 以下のURLを入力：
   ```
   https://your-app.vercel.app/staff
   ```
5. 「Write」ボタンをタップ
6. NFCタグをスマホに近づける
7. 書き込み完了

**設置場所の推奨：**
- ロッカー前の壁
- スタッフルーム入口
- 受付カウンター

## トラブルシューティング

### デプロイが失敗する場合

**エラー: Build failed**
```bash
# ローカルでビルドテスト
npm run build

# エラーがある場合は修正してコミット
git add .
git commit -m "Fix build errors"
git push
```

**エラー: Environment variables not found**
- Vercel Dashboardで環境変数が正しく設定されているか確認
- 環境変数の値に余分なスペースや改行が入っていないか確認

### Supabase接続エラー

**エラー: Failed to fetch**
- 環境変数のURLとキーが正しいか確認
- Supabaseプロジェクトが起動しているか確認（Dashboard→Settings→General）

**エラー: Row Level Security policy violation**
- `002_rls_policies.sql` が正しく実行されているか確認
- Supabase Dashboard → Authentication → Policies で確認

### Slack通知が届かない

- Webhook URLが正しいか確認
- Slackアプリがワークスペースにインストールされているか確認
- 通知チャンネルの権限を確認

## セキュリティのベストプラクティス

1. **環境変数の管理**
   - `.env.local` をGitにコミットしない（`.gitignore`に含まれている）
   - `SUPABASE_SERVICE_ROLE_KEY` は絶対にクライアント側で使用しない

2. **Supabase RLS**
   - Row Level Security ポリシーが有効になっているか定期確認
   - 未認証ユーザーのアクセス範囲を最小限に

3. **定期的な更新**
   - 依存パッケージを定期的に更新
   ```bash
   npm update
   npm audit fix
   ```

## 本番運用のチェックリスト

- [ ] Supabaseデータベースが正しくセットアップされている
- [ ] 全ての環境変数が設定されている
- [ ] Vercelデプロイが成功している
- [ ] トップページにアクセスできる
- [ ] データベース接続が正常
- [ ] Slack通知が届く（設定した場合）
- [ ] QRコードが生成・印刷されている
- [ ] NFCタグが書き込まれ、設置されている
- [ ] スタッフへの使い方説明が完了している

## サポート

問題が発生した場合：
1. このドキュメントのトラブルシューティングセクションを確認
2. [Vercel ドキュメント](https://vercel.com/docs)を参照
3. [Supabase ドキュメント](https://supabase.com/docs)を参照
4. GitHubリポジトリのIssuesで報告
