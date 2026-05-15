'use client'

// スタッフ側 - ホーム画面

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/neumorphic'
import { createClient } from '@/lib/supabase/client'
import { Staff } from '@/types/database'
import { Inbox, PackagePlus, PackageMinus, PackageCheck, User } from 'lucide-react'

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
      <div className="min-h-screen bg-neu-bg flex items-center justify-center">
        <div className="text-neu-text">読み込み中...</div>
      </div>
    )
  }

  if (!staff) {
    return null
  }

  const menuItems = [
    {
      title: '📥 申請キュー',
      description: 'お客さんからの申請を確認',
      icon: Inbox,
      href: '/staff/queue',
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      title: '📦 借りる',
      description: 'スタッフ自身が備品を借りる',
      icon: PackagePlus,
      href: '/staff/borrow',
    },
    {
      title: '📤 返す',
      description: 'スタッフ自身が備品を返却',
      icon: PackageMinus,
      href: '/staff/return',
    },
    {
      title: '🔄 消耗品補充',
      description: '消耗品の在庫を補充',
      icon: PackageCheck,
      href: '/staff/restock',
    },
  ]

  return (
    <div className="min-h-screen bg-neu-bg py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neu-text mb-2">スタッフメニュー</h1>
          <div className="flex items-center justify-center gap-2 text-neu-text-muted">
            <User size={16} />
            <span className="text-sm">{staff.name}</span>
          </div>
          <button
            onClick={handleChangeStaff}
            className="text-xs text-neu-accent hover:underline mt-1"
          >
            スタッフを変更
          </button>
        </div>

        {/* メニュー */}
        <div className="grid gap-4">
          {menuItems.map((item) => (
            <Card
              key={item.href}
              className="cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]"
              onClick={() => router.push(item.href)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-neu-bg neu-concave flex items-center justify-center flex-shrink-0">
                  <item.icon size={24} className="text-neu-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-neu-text">{item.title}</h3>
                    {item.badge !== undefined && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neu-text-muted">{item.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
