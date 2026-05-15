// 共通ユーティリティ関数

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Tailwindクラスをマージ
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 日時フォーマット
 */
export function formatDate(date: string | Date, format: 'full' | 'short' = 'full'): string {
  const d = typeof date === 'string' ? new Date(date) : date

  if (format === 'short') {
    return d.toLocaleDateString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 経過時間を人間が読める形式で表示
 */
export function formatDuration(startDate: string | Date): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 60) {
    return `${diffMinutes}分前`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}時間前`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}日前`
}

/**
 * ステータスの日本語表示
 */
export function getStatusLabel(
  status: 'pending' | 'delivered' | 'return_requested' | 'returned' | 'cancelled'
): string {
  const labels = {
    pending: '申請中',
    delivered: '貸出中',
    return_requested: '回収依頼',
    returned: '返却済み',
    cancelled: 'キャンセル',
  }
  return labels[status] || status
}

/**
 * ステータスの色
 */
export function getStatusColor(
  status: 'pending' | 'delivered' | 'return_requested' | 'returned' | 'cancelled'
): string {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    delivered: 'bg-blue-100 text-blue-800',
    return_requested: 'bg-orange-100 text-orange-800',
    returned: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || colors.pending
}
