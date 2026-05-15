'use client'

// 管理者側 - ログ閲覧

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type LogAction = 'out' | 'in' | 'restock' | 'adjust'
type ActorType = 'staff' | 'visitor'

interface LogRow {
  id: string
  action: LogAction
  quantity: number
  actor_type: ActorType
  visitor_name: string | null
  timestamp: string
  note: string | null
  item: { id: string; name: string } | null
  actor: { id: string; name: string } | null
}

const ACTION_META: Record<LogAction, { label: string; icon: string; bg: string; ink: string }> = {
  out:     { label: '出庫',   icon: '↗',  bg: '#FCE5E0', ink: '#C84A2C' },
  in:      { label: '入庫',   icon: '↘',  bg: 'var(--staff-bg)', ink: 'var(--staff-ink)' },
  restock: { label: '補充',   icon: '＋', bg: 'var(--customer-bg)', ink: 'var(--customer-ink)' },
  adjust: { label: '調整',   icon: '⇄',  bg: '#FFF4E0', ink: '#B25C2C' },
}

const ACTION_OPTIONS: { value: 'all' | LogAction; label: string }[] = [
  { value: 'all',     label: 'すべて' },
  { value: 'out',     label: '出庫' },
  { value: 'in',      label: '入庫' },
  { value: 'restock', label: '補充' },
  { value: 'adjust',  label: '調整' },
]

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | LogAction>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          action,
          quantity,
          actor_type,
          visitor_name,
          timestamp,
          note,
          item:items(id, name),
          actor:staff(id, name)
        `)
        .order('timestamp', { ascending: false })
        .limit(300)
      if (error) throw error
      setLogs((data || []) as unknown as LogRow[])
    } catch (error) {
      console.error('ログ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return logs
    return logs.filter((l) => l.action === filter)
  }, [logs, filter])

  return (
    <div className="min-h-screen w-full px-5 py-8">
      <div className="mx-auto w-full max-w-[720px] pb-20">

        {/* ヘッダー */}
        <header className="mb-6 flex items-center gap-3">
          <Link
            href="/admin"
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
            style={{ background: 'var(--bg-alt)', color: 'var(--text)' }}
            aria-label="戻る"
          >
            ‹
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-wide">ログ閲覧</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              直近300件までのトランザクションを表示します
            </p>
          </div>
        </header>

        {/* フィルタ */}
        <div className="mb-5 -mx-1 flex gap-2 overflow-x-auto pb-1">
          {ACTION_OPTIONS.map((opt) => {
            const isActive = filter === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className="shrink-0 rounded-full px-4 py-2 text-xs font-bold transition"
                style={{
                  background: isActive ? '#fff' : 'var(--bg-alt)',
                  color: isActive ? 'var(--brand-blue)' : 'var(--text-muted)',
                  boxShadow: isActive ? 'var(--shadow-soft)' : 'none',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* 一覧 */}
        {loading ? (
          <div className="surface-card px-5 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
            読み込み中...
          </div>
        ) : filtered.length === 0 ? (
          <div className="surface-card px-5 py-10 text-center" style={{ color: 'var(--text-muted)' }}>
            該当するログはありません
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {filtered.map((row) => {
              const meta = ACTION_META[row.action]
              const actorLabel =
                row.actor_type === 'visitor'
                  ? (row.visitor_name || '利用者')
                  : (row.actor?.name || 'スタッフ')

              return (
                <li
                  key={row.id}
                  className="surface-card flex items-center gap-3 px-4 py-3"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold"
                    style={{ background: meta.bg, color: meta.ink }}
                    aria-hidden="true"
                  >
                    {meta.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold truncate">
                        {row.item?.name || '（削除済み物品）'}
                      </span>
                      <span
                        className="pill"
                        style={{ background: meta.bg, color: meta.ink }}
                      >
                        {meta.label} {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
                      </span>
                    </div>
                    <div
                      className="mt-0.5 flex items-center gap-1.5 text-[11px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <span>{actorLabel}</span>
                      <span>·</span>
                      <span>{formatTimestamp(row.timestamp)}</span>
                      {row.note && (
                        <>
                          <span>·</span>
                          <span className="truncate">{row.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  const M = String(d.getMonth() + 1).padStart(2, '0')
  const D = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${M}/${D} ${h}:${m}`
}
