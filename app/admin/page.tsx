'use client'

// 管理者側 - ダッシュボード

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Item } from '@/types/database'

interface DashboardStats {
  todayRequests: number
  activeRequests: number
  lowStockItems: Item[]
}

type MenuItem = {
  title: string
  icon: string
  href: string
  description: string
  bgVar: string
  inkVar: string
}

const menuItems: MenuItem[] = [
  {
    title: '物品管理',
    icon: '📦',
    href: '/admin/items',
    description: '物品の追加・編集・削除',
    bgVar: 'var(--customer-bg)',
    inkVar: 'var(--customer-ink)',
  },
  {
    title: 'カテゴリ管理',
    icon: '🗂️',
    href: '/admin/categories',
    description: 'カテゴリの追加・編集',
    bgVar: 'var(--staff-bg)',
    inkVar: 'var(--staff-ink)',
  },
  {
    title: 'スタッフ管理',
    icon: '👥',
    href: '/admin/staff',
    description: 'スタッフの追加・編集',
    bgVar: 'var(--admin-bg)',
    inkVar: 'var(--admin-ink)',
  },
  {
    title: 'ログ閲覧',
    icon: '📜',
    href: '/admin/logs',
    description: '全トランザクションログ',
    bgVar: '#FFF4E0',
    inkVar: '#B25C2C',
  },
]

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    todayRequests: 0,
    activeRequests: 0,
    lowStockItems: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const supabase = createClient()

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count: todayCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .gte('requested_at', today.toISOString())

      const { count: activeCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'delivered', 'return_requested'])

      const { data: allItems } = await supabase
        .from('items')
        .select('*')
        .gt('low_stock_alert', 0)

      const lowStock = (allItems || []).filter(
        // @ts-ignore - Supabase generated types issue
        (item) => item.current_stock <= item.low_stock_alert
      // @ts-ignore - Supabase generated types issue
      ) as Item[]

      setStats({
        todayRequests: todayCount || 0,
        activeRequests: activeCount || 0,
        lowStockItems: lowStock,
      })
    } catch (error) {
      console.error('統計取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full px-5 py-8">
      <div className="mx-auto w-full max-w-[720px] pb-20">

        {/* ヘッダー */}
        <header className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
            style={{ background: 'var(--bg-alt)', color: 'var(--text)' }}
            aria-label="トップへ戻る"
          >
            ‹
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-wide">管理ダッシュボード</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              システム全体の状況を確認できます
            </p>
          </div>
        </header>

        {/* 統計カード */}
        <section className="surface-card relative mb-6 overflow-hidden px-5 py-5">
          <div
            className="absolute left-0 right-0 top-0 h-[3px]"
            style={{ background: 'var(--brand-gradient-h)' }}
          />
          <div className="mb-1 flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>📊</span>
            <span>本日のサマリー</span>
          </div>
          <div className="mb-4 text-base font-bold">
            {loading ? '読み込み中...' : '在庫状況を確認しましょう'}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatCard num={loading ? '—' : String(stats.todayRequests)} label="本日の申請" tone="info" />
            <StatCard num={loading ? '—' : String(stats.activeRequests)} label="貸出中"     tone="ok" />
            <StatCard num={loading ? '—' : String(stats.lowStockItems.length)} label="補充必要" tone="alert" />
          </div>
        </section>

        {/* 低在庫アラート */}
        {!loading && stats.lowStockItems.length > 0 && (
          <section
            className="surface-card mb-6 px-5 py-4"
            style={{ background: '#FFF8F0' }}
          >
            <div className="mb-2 flex items-center gap-2 text-sm font-bold" style={{ color: '#B25C2C' }}>
              <span>⚠️</span>
              <span>低在庫アラート</span>
            </div>
            <ul className="space-y-2">
              {stats.lowStockItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-white px-3 py-2"
                >
                  <span className="font-medium">{item.name}</span>
                  <span
                    className="pill"
                    style={{ background: '#FFE4D0', color: '#B25C2C' }}
                  >
                    残り {item.current_stock}個
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* セクションタイトル */}
        <div className="mx-1 mb-3 text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
          管理メニュー
        </div>

        {/* メニュー */}
        <nav className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="surface-card surface-card-hover flex items-center gap-4 p-5 text-left"
            >
              <div
                className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[16px] text-[26px]"
                style={{ background: item.bgVar }}
                aria-hidden="true"
              >
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="mb-1 text-base font-bold tracking-wide">
                  {item.title}
                </h3>
                <p className="text-[12px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                  {item.description}
                </p>
              </div>
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
                style={{ background: 'var(--bg-alt)', color: 'var(--text)' }}
                aria-hidden="true"
              >
                ›
              </div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

type StatTone = 'info' | 'ok' | 'alert'

function StatCard({ num, label, tone }: { num: string; label: string; tone: StatTone }) {
  const colorVar =
    tone === 'info'  ? 'var(--brand-blue)'  :
    tone === 'ok'    ? 'var(--brand-green)' :
                       'var(--danger)'

  return (
    <div
      className="rounded-2xl px-3 py-3.5 text-center"
      style={{ background: 'var(--bg-alt)' }}
    >
      <div className="text-2xl font-bold leading-none" style={{ color: colorVar }}>
        {num}
      </div>
      <div className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
    </div>
  )
}
