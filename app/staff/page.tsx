'use client'

// スタッフ側 - ホーム画面

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Staff } from '@/types/database'

export default function StaffHomePage() {
  const router = useRouter()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    checkStaff()
    fetchPendingCount()
  }, [])

  // Realtime: 申請数の更新を購読
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
        },
        () => {
          fetchPendingCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const checkStaff = async () => {
    try {
      const staffId = localStorage.getItem('staff_id')
      if (!staffId) {
        router.push('/staff/select')
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', staffId)
        .eq('active', true)
        .single()

      if (error || !data) {
        localStorage.removeItem('staff_id')
        router.push('/staff/select')
        return
      }

      setStaff(data)
    } catch (error) {
      console.error('スタッフ確認エラー:', error)
      router.push('/staff/select')
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingCount = async () => {
    try {
      const supabase = createClient()
      const { count } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'delivered', 'return_requested'])

      setPendingCount(count || 0)
    } catch (error) {
      console.error('申請数取得エラー:', error)
    }
  }

  const handleChangeStaff = () => {
    localStorage.removeItem('staff_id')
    router.push('/staff/select')
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full px-5 py-8 flex items-center justify-center">
        <div style={{ color: 'var(--text-muted)' }}>読み込み中...</div>
      </div>
    )
  }

  if (!staff) {
    return null
  }

  const menuItems = [
    {
      title: '申請キュー',
      description: 'お客さんからの申請を確認',
      icon: '📥',
      href: '/staff/queue',
      badge: pendingCount > 0 ? pendingCount : undefined,
      bgVar: 'var(--customer-bg)',
      inkVar: 'var(--customer-ink)',
    },
    {
      title: '借りる',
      description: 'スタッフ自身が備品を借りる',
      icon: '📦',
      href: '/staff/borrow',
      bgVar: 'var(--staff-bg)',
      inkVar: 'var(--staff-ink)',
    },
    {
      title: '返す',
      description: 'スタッフ自身が備品を返却',
      icon: '📤',
      href: '/staff/return',
      bgVar: 'var(--admin-bg)',
      inkVar: 'var(--admin-ink)',
    },
    {
      title: '消耗品補充',
      description: '消耗品の在庫を補充',
      icon: '🔄',
      href: '/staff/restock',
      bgVar: '#FFF4E0',
      inkVar: '#B25C2C',
    },
  ]

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
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-wide">スタッフメニュー</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                👤 {staff.name}
              </span>
              <button
                onClick={handleChangeStaff}
                className="text-xs"
                style={{ color: 'var(--brand-blue)' }}
              >
                変更
              </button>
            </div>
          </div>
        </header>

        {/* メニュー */}
        <nav className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {menuItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="surface-card surface-card-hover flex items-center gap-4 p-5 text-left relative"
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
              {item.badge !== undefined && (
                <div
                  className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: 'var(--danger)' }}
                >
                  {item.badge}
                </div>
              )}
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
