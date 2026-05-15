'use client'

// スタッフ側 - 返す画面

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card } from '@/components/neumorphic'
import { Staff, Transaction, Item } from '@/types/database'
import { ArrowLeft, Package, CheckCircle2 } from 'lucide-react'

interface BorrowedItem {
  itemId: string
  itemName: string
  quantity: number
  borrowedAt: string
}

export default function StaffReturnPage() {
  const router = useRouter()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    checkStaff()
  }, [])

  useEffect(() => {
    if (staff) {
      fetchBorrowedItems()
    }
  }, [staff])

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
        router.push('/staff/select')
        return
      }

      setStaff(data)
    } catch (error) {
      console.error('スタッフ確認エラー:', error)
      router.push('/staff/select')
    }
  }

  const fetchBorrowedItems = async () => {
    if (!staff) return

    try {
      const supabase = createClient()

      // このスタッフの全トランザクションを取得
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*, item:items(*)')
        .eq('actor_type', 'staff')
        .eq('actor_id', staff.id)
        .order('timestamp', { ascending: false })

      if (error) throw error

      // 物品ごとに貸出-返却を計算
      const itemMap = new Map<string, BorrowedItem>()

      transactions?.forEach((tx: Transaction & { item: Item | null }) => {
        if (!tx.item) return

        const existing = itemMap.get(tx.item_id!)

        if (tx.action === 'out') {
          if (existing) {
            existing.quantity += tx.quantity
            // より古い借用日時を保持
            if (tx.timestamp < existing.borrowedAt) {
              existing.borrowedAt = tx.timestamp
            }
          } else {
            itemMap.set(tx.item_id!, {
              itemId: tx.item_id!,
              itemName: tx.item.name,
              quantity: tx.quantity,
              borrowedAt: tx.timestamp,
            })
          }
        } else if (tx.action === 'in') {
          if (existing) {
            existing.quantity -= tx.quantity
            if (existing.quantity <= 0) {
              itemMap.delete(tx.item_id!)
            }
          }
        }
      })

      // 借りている物品のみを抽出
      const borrowed = Array.from(itemMap.values()).filter(
        (item) => item.quantity > 0
      )

      setBorrowedItems(borrowed)
    } catch (error) {
      console.error('借用物品取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReturn = async (item: BorrowedItem) => {
    if (!staff) return

    setActionLoading(true)
    try {
      const supabase = createClient()

      // トランザクション記録（在庫増加）
      const { error } = await supabase.from('transactions').insert({
        item_id: item.itemId,
        action: 'in',
        quantity: item.quantity,
        actor_type: 'staff',
        actor_id: staff.id,
      })

      if (error) throw error

      alert('返却を記録しました')
      fetchBorrowedItems()
    } catch (error) {
      console.error('返却エラー:', error)
      alert('返却に失敗しました')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neu-bg flex items-center justify-center">
        <div className="text-neu-text">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neu-bg py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/staff')}
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neu-text">備品を返す</h1>
            <p className="text-sm text-neu-text-muted">
              借りている物品を返却してください
            </p>
          </div>
        </div>

        {/* 借用物品一覧 */}
        {borrowedItems.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-neu-text-muted">借りている物品はありません</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {borrowedItems.map((item) => (
              <Card key={item.itemId}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neu-bg neu-concave flex items-center justify-center">
                      <Package size={20} className="text-neu-accent" />
                    </div>
                    <div>
                      <h3 className="font-bold text-neu-text">{item.itemName}</h3>
                      <p className="text-sm text-neu-text-muted">
                        数量: {item.quantity}個
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="success"
                  size="sm"
                  fullWidth
                  onClick={() => handleReturn(item)}
                  disabled={actionLoading}
                >
                  <CheckCircle2 size={16} className="mr-2" />
                  返却する
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
