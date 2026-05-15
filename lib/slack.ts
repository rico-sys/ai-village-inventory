// Slack通知ユーティリティ

interface SlackMessage {
  text: string
  blocks?: Array<{
    type: string
    text?: {
      type: string
      text: string
    }
    elements?: Array<{
      type: string
      text?: string
      url?: string
      action_id?: string
    }>
  }>
}

/**
 * Slack Webhookに通知を送信
 */
export async function sendSlackNotification(message: SlackMessage): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL

  // 開発環境でWebhook URLが未設定の場合はコンソール出力のみ
  if (!webhookUrl) {
    console.log('📢 Slack通知（Webhook URL未設定）:', message.text)
    return true
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error('Slack通知エラー:', error)
    // 通知失敗してもアプリ機能は止めない
    return false
  }
}

/**
 * 新規申請通知
 */
export async function notifyNewRequest(params: {
  visitorName: string
  seatNumber: string
  items: Array<{ name: string; quantity: number }>
  requestId: string
}) {
  const itemList = params.items.map((item) => `📦 ${item.name} × ${item.quantity}`).join('\n')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const message: SlackMessage = {
    text: `🆕 新規申請 - ${params.visitorName}様（席${params.seatNumber}）`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🆕 新規申請',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `👤 *${params.visitorName}* 様\n📍 席 *${params.seatNumber}*\n\n${itemList}\n\n🕐 ${new Date().toLocaleString('ja-JP')}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: '詳細を見る',
            url: `${appUrl}/staff/queue`,
          },
        ],
      },
    ],
  }

  return sendSlackNotification(message)
}

/**
 * 回収依頼通知
 */
export async function notifyReturnRequest(params: {
  visitorName: string
  seatNumber: string
  items: Array<{ name: string; quantity: number }>
  requestId: string
  deliveredAt: Date
}) {
  const itemList = params.items.map((item) => `📦 ${item.name} × ${item.quantity}`).join('\n')
  const duration = Math.floor((Date.now() - params.deliveredAt.getTime()) / (1000 * 60))
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const message: SlackMessage = {
    text: `♻️ 回収依頼 - ${params.visitorName}様（席${params.seatNumber}）`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '♻️ 回収依頼',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `👤 *${params.visitorName}* 様\n📍 席 *${params.seatNumber}*\n\n${itemList}\n\n🕐 ${new Date().toLocaleString('ja-JP')}（貸出から${duration}分）`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: '詳細を見る',
            url: `${appUrl}/staff/queue`,
          },
        ],
      },
    ],
  }

  return sendSlackNotification(message)
}

/**
 * 低在庫アラート通知
 */
export async function notifyLowStock(params: {
  itemName: string
  currentStock: number
  lowStockAlert: number
}) {
  const message: SlackMessage = {
    text: `⚠️ 在庫不足 - ${params.itemName}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '⚠️ 在庫不足',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📦 *${params.itemName}*\n📊 残り *${params.currentStock}個*（閾値: ${params.lowStockAlert}個）`,
        },
      },
    ],
  }

  return sendSlackNotification(message)
}
