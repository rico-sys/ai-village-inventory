'use client'

// スタッフ側 - 消耗品補充画面

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Input, Modal } from '@/components/neumorphic'
import { Staff, ItemWithCategory } from '@/types/database'
import { ArrowLeft, Package, Plus } from 'lucide-react'

export default function StaffRestockPage() {
  const router = useRouter()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [items, setItems] = useState<ItemWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ItemWithCategory | null>(null)
  const [quantity, setQuantity] = useState<string>('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    checkStaff()
    fetchConsumables()
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

  const fetchConsumables = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('items')
        .select('*, category:categories(*)')
        .eq('categories.type', 'consumable')
        .order('name')

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('消耗品取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectItem = (item: ItemWithCategory) => {
    setSelectedItem(item)
    setQuantity('')
    setNote('')
  }

  const handleRestock = async () => {
    if (!staff || !selectedItem) return

    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty <= 0) {
      alert('正しい数量を入力してください')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()

      // トランザクション記録（在庫増加）
      const { error } = await supabase.from('transactions').insert({
        item_id: selectedItem.id,
        action: 'restock',
        quantity: qty,
        actor_type: 'staff',
        actor_id: staff.id,
        note: note || null,
      })

      if (error) throw error

      alert('補充を記録しました')
      setSelectedItem(null)
      fetchConsumables()
    } catch (error) {
      console.error('補充エラー:', error)
      alert('補充に失敗しました')
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
            <h1 className="text-2xl font-bold text-neu-text">消耗品補充</h1>
            <p className="text-sm text-neu-text-muted">
              補充する消耗品を選択してください
            </p>
          </div>
        </div>

        {/* 消耗品一覧 */}
        {items.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-neu-text-muted">消耗品が登録されていません</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isLowStock =
                item.current_stock <= item.low_stock_alert && item.low_stock_alert > 0

              return (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]"
                  onClick={() => handleSelectItem(item)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isLowStock
                            ? 'bg-orange-100'
                            : 'bg-neu-bg neu-concave'
                        }`}
                      >
                        <Package
                          size={20}
                          className={isLowStock ? 'text-orange-600' : 'text-neu-accent'}
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-neu-text">{item.name}</h3>
                        <p
                          className={`text-sm ${
                            isLowStock ? 'text-orange-600 font-medium' : 'text-neu-text-muted'
                          }`}
                        >
                          在庫: {item.current_stock}個
                          {isLowStock && ' (補充推奨)'}
                        </p>
                      </div>
                    </div>
                    <Plus size={20} className="text-neu-text-muted" />
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* 補充モーダル */}
        <Modal
          isOpen={selectedItem !== null}
          onClose={() => setSelectedItem(null)}
          title="補充数量を入力"
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
                onClick={handleRestock}
                disabled={submitting || !quantity}
              >
                {submitting ? '処理中...' : '補充する'}
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
                現在の在庫: {selectedItem?.current_stock}個
              </p>
            </div>

            <Input
              label="補充数量"
              type="number"
              min="1"
              placeholder="例: 50"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            <Input
              label="メモ（任意）"
              placeholder="例: 2024/5/15 入荷分"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </Modal>
      </div>
    </div>
  )
}
