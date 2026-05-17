# Slack通知の設定手順

## ✅ 実装状況

貸出申請時のSlack通知機能は**既に実装済み**です！
現在、以下の通知が送信されます：

1. 🆕 **新規申請通知** - お客さんが申請を送信したとき
2. ♻️ **回収依頼通知** - お客さんが返却依頼を送ったとき
3. ⚠️ **低在庫アラート** - 在庫が閾値を下回ったとき

ただし、Slack Webhook URLが設定されていないため、現在はコンソールログのみ出力されています。

---

## 🔧 Slack Webhook URLの設定方法

### Step 1: Slack Appの作成

1. [Slack API](https://api.slack.com/apps)にアクセスしてログイン
2. **「Create New App」**をクリック
3. **「From scratch」**を選択
4. App Name: `AI Village Notifications`（任意の名前）
5. Workspace: 通知を送りたいワークスペースを選択
6. **「Create App」**をクリック

### Step 2: Incoming Webhookの有効化

1. 左メニューから **「Incoming Webhooks」** を選択
2. 右上のトグルスイッチを**オン**に切り替え
3. ページ下部の **「Add New Webhook to Workspace」** をクリック
4. 通知を送るチャンネルを選択（例：#general, #ai-village）
5. **「許可する」**をクリック
6. 生成された **Webhook URL**（`https://hooks.slack.com/services/...`）をコピー

### Step 3: ローカル環境に設定

`.env.local`ファイルを編集：

```bash
# Slack（オプション）
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

保存後、開発サーバーを再起動：

```bash
# Ctrl+C で停止してから
npm run dev
```

### Step 4: Vercel（本番環境）に設定

1. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
2. プロジェクトを選択
3. **Settings** → **Environment Variables**
4. 新しい変数を追加：
   - **Name**: `SLACK_WEBHOOK_URL`
   - **Value**: コピーしたWebhook URL
   - **Environments**: Production, Preview, Development（全てチェック）
5. **Save**をクリック
6. **Deployments**タブから最新のデプロイを**Redeploy**

---

## 🧪 動作確認

### ローカル環境で確認

1. 開発サーバーを起動：
   ```bash
   npm run dev
   ```

2. ブラウザで申請テスト：
   ```
   http://localhost:3000/request?seat=TEST-1
   ```

3. 物品を選択して申請を送信

4. **Slackチャンネルに通知が届く**ことを確認：
   ```
   🆕 新規申請
   👤 テスト太郎 様
   📍 席 TEST-1

   📦 HDMIケーブル × 1
   📦 モバイルバッテリー × 2

   🕐 2026-05-17 09:00:00

   [詳細を見る] ボタン
   ```

### 本番環境で確認

Vercelで環境変数を設定後、再デプロイすると本番環境でも通知が送られます。

---

## 📋 通知の種類と内容

### 1. 新規申請通知

**送信タイミング**: お客さんが申請を送信した直後

**通知内容**:
- 申請者名
- 席番号
- 申請物品リスト
- 申請日時
- スタッフキューへのリンク

### 2. 回収依頼通知

**送信タイミング**: お客さんが返却依頼を送った直後

**通知内容**:
- 申請者名
- 席番号
- 返却物品リスト
- 貸出からの経過時間
- スタッフキューへのリンク

### 3. 低在庫アラート

**送信タイミング**: 在庫が閾値を下回ったとき

**通知内容**:
- 物品名
- 現在の在庫数
- アラート閾値

---

## ⚠️ トラブルシューティング

### 通知が届かない場合

1. **Webhook URLが正しいか確認**
   - `.env.local`または環境変数の値をチェック
   - URLが`https://hooks.slack.com/services/`で始まっているか

2. **開発サーバーを再起動**
   ```bash
   # Ctrl+C で停止してから
   npm run dev
   ```

3. **ブラウザのコンソールを確認**
   - F12 → Console タブ
   - `📢 Slack通知` のログが出ているか確認

4. **Slackアプリの権限を確認**
   - Slack API Dashboard → Your Apps → AI Village Notifications
   - Incoming Webhooksが有効になっているか

### Webhook URLを再取得したい場合

1. [Slack API](https://api.slack.com/apps)にアクセス
2. AI Village Notificationsアプリを選択
3. **Incoming Webhooks**を開く
4. 既存のWebhookを削除して新規作成
   または、**「Add New Webhook to Workspace」**で追加

---

## 🎉 完了！

これで貸出申請があるたびにSlackに通知が送られます！
スタッフは通知からワンクリックで申請キュー画面にアクセスできます。
