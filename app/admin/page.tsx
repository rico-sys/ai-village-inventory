'use client'

// 管理者側 - ダッシュボード

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/neumorphic'
import { Item } from '@/types/database'
import { LayoutDashboard, Package, Users, FileText, AlertTriangle } from 'lucide-react'

interface DashboardStats {
  todayRequests: number
  activeRequests: number
  lowStockItems: Item[]
}

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

      // 本日の申請数
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { count: todayCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .gte('requested_at', today.toISOString())

      // 貸出中の申請数
      const { count: activeCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'delivered', 'return_requested'])

      // 低在庫アラート
      const { data: lowStockData } = await supabase
        .from('items')
        .select('*')
        .gt('low_stock_alert', 0)
        .lte('current_stock', supabase.rpc('items.low_stock_alert'))
        .order('current_stock', { ascending: true })

      // 低在庫の条件を手動でフィルタ（Supabaseの制限のため）
      const { data: allItems } = await supabase
        .from('items')
        .select('*')
        .gt('low_stock_alert', 0)

      const lowStock = allItems?.filter(
        (item) => item.current_stock <= item.low_stock_alert
      ) || []

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

  const menuItems = [
    {
      title: '物品管理',
      icon: Package,
      href: '/admin/items',
      description: '物品の追加・編集・削除',
    },
    {
      title: 'カテゴリ管理',
      icon: LayoutDashboard,
      href: '/admin/categories',
      description: 'カテゴリの管理',
    },
    {
      title: 'スタッフ管理',
      icon: Users,
      href: '/admin/staff',
      description: 'スタッフの追加・編集',
    },
    {
      title: 'ログ閲覧',
      icon: FileText,
      href: '/admin/logs',
      description: '全トランザクションログ',
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-neu-bg flex items-center justify-center">
        <div className="text-neu-text">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neu-bg py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neu-text mb-2">管理ダッシュボード</h1>
          <p className="text-sm text-neu-text-muted">
            システム全体の状況を確認できます
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>本日の申請数</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-neu-accent">
                {stats.todayRequests}
              </p>
              <p className="text-sm text-neu-text-muted mt-2">件</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>現在貸出中</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-neu-accent">
                {stats.activeRequests}
              </p>
              <p className="text-sm text-neu-text-muted mt-2">件</p>
            </CardContent>
          </Card>
        </div>

        {/* 低在庫アラート */}
        {stats.lowStockItems.length > 0 && (
          <Card className="mb-8 bg-orange-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-orange-600" />
                <CardTitle>低在庫アラート</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-2 bg-white rounded-lg"
                  >
                    <span className="text-neu-text font-medium">{item.name}</span>
                    <Badge variant="warning" size="sm">
                      残り {item.current_stock}個
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* メニュー */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <h3 className="text-lg font-bold text-neu-text mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-neu-text-muted">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
