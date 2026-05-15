'use client'

import { useEffect, useState } from 'react'

const WEEKDAY_JP = ['日', '月', '火', '水', '木', '金', '土'] as const

/**
 * 今日の日付を表示するバッジ。
 * サーバーレンダリング時とクライアントで日付が一致せず Hydration mismatch が起きるため、
 * マウント後に setState して描画する。
 */
export default function TodayBadge() {
  const [today, setToday] = useState<Date | null>(null)

  useEffect(() => {
    setToday(new Date())
  }, [])

  // 初回SSR/Hydration時はプレースホルダーを返す（高さズレ防止）
  if (!today) {
    return (
      <div
        className="text-right text-xs"
        style={{ color: 'var(--text-muted)', minWidth: 90 }}
      >
        <span>&nbsp;</span>
        <div
          className="mt-0.5 font-bold leading-tight"
          style={{ fontSize: 22, color: 'var(--text)' }}
        >
          &nbsp;
        </div>
      </div>
    )
  }

  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const day = today.getDate()
  const weekday = WEEKDAY_JP[today.getDay()]

  return (
    <div
      className="text-right text-xs"
      style={{ color: 'var(--text-muted)' }}
    >
      {year}年 {month}月
      <div
        className="mt-0.5 font-bold leading-tight"
        style={{ color: 'var(--text)' }}
      >
        <span style={{ fontSize: 22 }}>{day}</span>
        <small style={{ fontSize: 14, fontWeight: 500, marginLeft: 2 }}>
          （{weekday}）
        </small>
      </div>
    </div>
  )
}
