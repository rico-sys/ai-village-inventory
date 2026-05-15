'use client'

// スタッフ側 - 借りる画面

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Modal } from '@/components/neumorphic'
import { Staff, Item } from '@/types/database'
import { ArrowLeft, Package } from 'lucide-react'

export default function StaffBorrowPage() {
  const router = useRouter()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    checkStaff()
    fetchItems()
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
        router.push('/staff/select')
        return
      }

      setStaff(data)
    } catch (error) {
      console.error('スタッフ確認エラー:', error)
      router.push('/staff/select')
    }
  }

  const fetchItems = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .gt('current_stock', 0)
        .order('name')

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('物品取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item)
    setQuantity(1)
  }

  const handleBorrow = async () => {
    if (!staff || !selectedItem) return

    setSubmitting(true)
    try {
      const supabase = createClient()

      // トランザクション記録（在庫減少）
      const { error } = await supabase.from('transactions').insert({
        item_id: selectedItem.id,
        action: 'out',
        quantity,
        actor_type: 'staff',
        actor_id: staff.id,
      })

      if (error) throw error

      alert('借用を記録しました')
      setSelectedItem(null)
      fetchItems()
    } catch (error) {
      console.error('借用エラー:', error)
      alert('借用に失敗しました')
    } finally {
      setSubmitting(false)
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
            <h1 className="text-2xl font-bold text-neu-text">備品を借りる</h1>
            <p className="text-sm text-neu-text-muted">
              借りる物品を選択してください
            </p>
          </div>
        </div>

        {/* 物品一覧 */}
        {items.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-neu-text-muted">在庫のある物品がありません</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]"
                onClick={() => handleSelectItem(item)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neu-bg neu-concave flex items-center justify-center">
                      <Package size={20} className="text-neu-accent" />
                    </div>
                    <div>
                      <h3 className="font-bold text-neu-text">{item.name}</h3>
                      <p className="text-sm text-neu-text-muted">
                        在庫: {item.current_stock}個
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 数量選択モーダル */}
        <Modal
          isOpen={selectedItem !== null}
          onClose={() => setSelectedItem(null)}
          title="数量を選択"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setSelectedItem(null)}
                disabled={submitting}
              >
                キャンセル
              </Button>
              <Button
                variant="primary"
                onClick={handleBorrow}
                disabled={submitting || quantity < 1}
              >
                {submitting ? '処理中...' : '借りる'}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="text-neu-text font-medium mb-2">
                {selectedItem?.name}
              </p>
              <p className="text-sm text-neu-text-muted">
                在庫: {selectedItem?.current_stock}個
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neu-text mb-2">
                数量
              </label>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </Button>
                <span className="text-2xl font-bold text-neu-text min-w-[48px] text-center">
                  {quantity}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setQuantity(
                      Math.min(selectedItem?.current_stock || 1, quantity + 1)
                    )
                  }
                  disabled={quantity >= (selectedItem?.current_stock || 1)}
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
