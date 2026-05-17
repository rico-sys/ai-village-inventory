'use client'

// 管理者側 - ダッシュボード

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Item } from '@/types/database'

interface DashboardStats {
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
    lowStockItems: [],
  })
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const supabase = createClient()

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
        lowStockItems: lowStock,
      })
    } catch (error) {
      console.error('統計取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // 貸出データをリセット
  const handleResetRentalData = async () => {
    if (!confirm('貸出データをリセットしますか？\n\n削除されるデータ：\n・貸出申請\n・トランザクション履歴\n\n物品、カテゴリ、スタッフは残ります。')) {
      return
    }

    setResetting(true)
    try {
      const supabase = createClient()

      // request_itemsを削除
      await supabase.from('request_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      // requestsを削除
      await supabase.from('requests').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      // transactionsを削除
      await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      // 在庫を初期値にリセット（current_stockをそのままにしておく）
      // 必要に応じて在庫を調整してください

      alert('貸出データをリセットしました')
      fetchStats()
    } catch (error) {
      console.error('リセットエラー:', error)
      alert('リセットに失敗しました')
    } finally {
      setResetting(false)
    }
  }

  // 全データを削除
  const handleDeleteAllData = async () => {
    if (!confirm('⚠️ 警告：全データを削除しますか？\n\nこの操作は取り消せません。\n\n削除されるデータ：\n・すべての貸出申請\n・すべてのトランザクション履歴\n・すべての物品\n・すべてのカテゴリ\n・すべてのスタッフ')) {
      return
    }

    const confirmation = prompt('確認のため「削除」と入力してください')
    if (confirmation !== '削除') {
      alert('キャンセルしました')
      return
    }

    setResetting(true)
    try {
      const supabase = createClient()

      // 依存関係の順序で削除
      await supabase.from('request_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('requests').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      await supabase.from('staff').delete().neq('id', '00000000-0000-0000-0000-000000000000')

      alert('全データを削除しました')
      fetchStats()
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました。依存関係のあるデータが残っている可能性があります。')
    } finally {
      setResetting(false)
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

        {/* データ管理 */}
        <div className="mt-8">
          <div className="mx-1 mb-3 text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
            データ管理
          </div>
          <div className="surface-card p-5">
            <div className="mb-4">
              <h3 className="mb-1 text-sm font-bold">貸出データをリセット</h3>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                貸出申請とトランザクション履歴を削除します。物品・カテゴリ・スタッフは残ります。
              </p>
              <button
                onClick={handleResetRentalData}
                disabled={resetting}
                className="rounded-full px-4 py-2 text-sm font-medium"
                style={{ background: '#FFF4E0', color: '#B25C2C' }}
              >
                {resetting ? 'リセット中...' : '貸出データをリセット'}
              </button>
            </div>

            <div className="border-t pt-4" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="mb-1 text-sm font-bold" style={{ color: 'var(--danger)' }}>
                全データを削除
              </h3>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                ⚠️ すべてのデータを削除します。この操作は取り消せません。
              </p>
              <button
                onClick={handleDeleteAllData}
                disabled={resetting}
                className="rounded-full px-4 py-2 text-sm font-medium"
                style={{ background: '#FCE5E0', color: 'var(--danger)' }}
              >
                {resetting ? '削除中...' : '全データを削除'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
