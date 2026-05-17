'use client'

// お客さん側 - 申請画面

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Package, ShoppingCart, Check, RotateCcw, Clock, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Input, Tabs, Stepper, Badge } from '@/components/neumorphic'
import { ItemWithCategory, RequestWithItems } from '@/types/database'
import { notifyReturnRequest } from '@/lib/slack'
import { getStatusLabel } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface CartItem {
  itemId: string
  itemName: string
  quantity: number
  currentStock: number
}

function RequestPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [items, setItems] = useState<ItemWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [visitorName, setVisitorName] = useState('')
  const [seatNumber, setSeatNumber] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeTab, setActiveTab] = useState<'rental' | 'consumable'>('rental')
  const [currentRequest, setCurrentRequest] = useState<RequestWithItems | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // URLパラメータから席番号を取得
  useEffect(() => {
    const seat = searchParams.get('seat')
    if (seat) {
      setSeatNumber(seat)
      fetchCurrentRequest(seat)
    }

    // localStorageから氏名を取得
    const savedName = localStorage.getItem('visitor_name')
    if (savedName) {
      setVisitorName(savedName)
    }
  }, [searchParams])

  // 既存の申請を取得
  const fetchCurrentRequest = async (seat: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('requests')
        .select(
          `
          *,
          request_items (
            *,
            item:items (*)
          )
        `
        )
        .eq('seat_number', seat)
        .in('status', ['pending', 'delivered', 'return_requested'])
        .order('requested_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        // データが見つからない場合はエラーを無視
        if (error.code === 'PGRST116') {
          setCurrentRequest(null)
          return
        }
        throw error
      }

      setCurrentRequest(data as RequestWithItems)
    } catch (error) {
      console.error('既存申請取得エラー:', error)
    }
  }

  // Realtime購読（既存申請がある場合）
  useEffect(() => {
    if (!currentRequest) return

    const supabase = createClient()

    const requestChannel = supabase
      .channel(`request_${currentRequest.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
          filter: `id=eq.${currentRequest.id}`,
        },
        () => {
          if (seatNumber) {
            fetchCurrentRequest(seatNumber)
          }
        }
      )
      .subscribe()

    const requestItemsChannel = supabase
      .channel(`request_items_${currentRequest.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'request_items',
          filter: `request_id=eq.${currentRequest.id}`,
        },
        () => {
          if (seatNumber) {
            fetchCurrentRequest(seatNumber)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(requestChannel)
      supabase.removeChannel(requestItemsChannel)
    }
  }, [currentRequest?.id, seatNumber])

  // 物品一覧を取得
  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('items')
        .select('*, category:categories(*)')
        .order('name')

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('物品取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // カートに追加
  const addToCart = (item: ItemWithCategory, quantity: number) => {
    if (quantity === 0) {
      setCart(cart.filter((c) => c.itemId !== item.id))
      return
    }

    const existingItem = cart.find((c) => c.itemId === item.id)
    if (existingItem) {
      setCart(
        cart.map((c) =>
          c.itemId === item.id ? { ...c, quantity } : c
        )
      )
    } else {
      setCart([
        ...cart,
        {
          itemId: item.id,
          itemName: item.name,
          quantity,
          currentStock: item.current_stock,
        },
      ])
    }
  }

  const getCartQuantity = (itemId: string) => {
    return cart.find((c) => c.itemId === itemId)?.quantity || 0
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  // 個別物品の受取確認
  const handleReceived = async (requestItemId: string) => {
    if (!currentRequest) return

    setActionLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('request_items')
        .update({
          item_status: 'delivered',
          received_at: new Date().toISOString(),
        })
        .eq('id', requestItemId)

      if (error) throw error

      const allDelivered = currentRequest.request_items.every(
        (item) => item.id === requestItemId || item.item_status === 'delivered' || item.item_status === 'returned'
      )

      if (allDelivered) {
        await supabase
          .from('requests')
          .update({
            status: 'delivered',
            delivered_at: new Date().toISOString(),
          })
          .eq('id', currentRequest.id)
      }

      if (seatNumber) {
        await fetchCurrentRequest(seatNumber)
      }
    } catch (error) {
      console.error('受取確認エラー:', error)
      alert('受取確認に失敗しました')
    } finally {
      setActionLoading(false)
    }
  }

  // 個別物品の返却依頼
  const handleItemReturn = async (requestItemId: string) => {
    if (!currentRequest) return

    setActionLoading(true)
    try {
      const supabase = createClient()

      const item = currentRequest.request_items.find((ri) => ri.id === requestItemId)
      if (!item || !item.item) {
        throw new Error('物品が見つかりません')
      }

      // 在庫を戻す
      const { error: stockError } = await supabase
        .from('items')
        .update({
          current_stock: item.item.current_stock + item.quantity,
        })
        .eq('id', item.item.id)

      if (stockError) throw stockError

      // トランザクション記録
      await supabase.from('transactions').insert({
        item_id: item.item.id,
        action: 'in',
        quantity: item.quantity,
        actor_type: 'visitor',
        visitor_name: currentRequest.visitor_name,
        request_item_id: item.id,
        note: `${currentRequest.visitor_name} 様が返却依頼`,
      })

      // request_itemの状態を更新
      const { error } = await supabase
        .from('request_items')
        .update({
          item_status: 'return_requested',
        })
        .eq('id', requestItemId)

      if (error) throw error

      // 全て返却依頼済みかチェック
      const allReturning = currentRequest.request_items.every(
        (item) => item.id === requestItemId || item.item_status === 'return_requested' || item.item_status === 'returned'
      )

      if (allReturning) {
        await supabase
          .from('requests')
          .update({
            status: 'return_requested',
            return_requested_at: new Date().toISOString(),
          })
          .eq('id', currentRequest.id)
      }

      // Slack通知
      if (item && item.item && currentRequest.delivered_at) {
        await notifyReturnRequest({
          visitorName: currentRequest.visitor_name,
          seatNumber: currentRequest.seat_number,
          items: [{ name: item.item.name, quantity: item.quantity }],
          requestId: currentRequest.id,
          deliveredAt: new Date(currentRequest.delivered_at),
        })
      }

      if (seatNumber) {
        await fetchCurrentRequest(seatNumber)
      }
    } catch (error) {
      console.error('返却依頼エラー:', error)
      alert('返却依頼に失敗しました')
    } finally {
      setActionLoading(false)
    }
  }

  // 全て返却依頼
  const handleAllReturn = async () => {
    if (!currentRequest) return

    setActionLoading(true)
    try {
      const supabase = createClient()

      const deliveredItems = currentRequest.request_items.filter(
        (item) => item.item_status === 'delivered'
      )

      for (const item of deliveredItems) {
        if (!item.item) continue

        // 在庫を戻す
        const { error: stockError } = await supabase
          .from('items')
          .update({
            current_stock: item.item.current_stock + item.quantity,
          })
          .eq('id', item.item.id)

        if (stockError) throw stockError

        // トランザクション記録
        await supabase.from('transactions').insert({
          item_id: item.item.id,
          action: 'in',
          quantity: item.quantity,
          actor_type: 'visitor',
          visitor_name: currentRequest.visitor_name,
          request_item_id: item.id,
          note: `${currentRequest.visitor_name} 様が返却依頼`,
        })

        // 状態を更新
        await supabase
          .from('request_items')
          .update({ item_status: 'return_requested' })
          .eq('id', item.id)
      }

      // 申請全体を返却依頼に
      await supabase
        .from('requests')
        .update({
          status: 'return_requested',
          return_requested_at: new Date().toISOString(),
        })
        .eq('id', currentRequest.id)

      // Slack通知
      if (currentRequest.delivered_at) {
        await notifyReturnRequest({
          visitorName: currentRequest.visitor_name,
          seatNumber: currentRequest.seat_number,
          items: deliveredItems
            .map((item) => ({
              name: item.item?.name || '',
              quantity: item.quantity,
            }))
            .filter((item) => item.name),
          requestId: currentRequest.id,
          deliveredAt: new Date(currentRequest.delivered_at),
        })
      }

      if (seatNumber) {
        await fetchCurrentRequest(seatNumber)
      }
    } catch (error) {
      console.error('返却依頼エラー:', error)
      alert('返却依頼に失敗しました')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirm = () => {
    if (!visitorName.trim()) {
      alert('氏名を入力してください')
      return
    }

    if (cart.length === 0) {
      alert('物品を選択してください')
      return
    }

    // localStorageに氏名を保存
    localStorage.setItem('visitor_name', visitorName)

    // 確認画面へ
    const params = new URLSearchParams({
      name: visitorName,
      seat: seatNumber,
      items: JSON.stringify(cart),
    })
    router.push(`/request/confirm?${params.toString()}`)
  }

  // タブで絞り込み
  const filteredItems = items.filter((item) => item.category?.type === activeTab)

  if (loading) {
    return (
      <div className="min-h-screen bg-neu-bg flex items-center justify-center">
        <div className="text-neu-text">読み込み中...</div>
      </div>
    )
  }

  const hasActiveItems = currentRequest?.request_items.some(
    (item) => item.item_status === 'pending' || item.item_status === 'delivered'
  )

  const hasDeliveredItems = currentRequest?.request_items.some(
    (item) => item.item_status === 'delivered'
  )

  return (
    <div className="min-h-screen bg-neu-bg py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-neu-text mb-2">備品申請</h1>
          <p className="text-sm text-neu-text-muted">
            {hasActiveItems ? '現在の貸出状況と新規申請' : '必要な備品を選択して申請してください'}
          </p>
        </div>

        {/* 現在の貸出状況 */}
        {currentRequest && hasActiveItems && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-neu-text mb-4">現在の貸出状況</h2>

            {/* ステータスメッセージ */}
            {currentRequest.status === 'pending' && (
              <Card className="mb-4 bg-blue-50">
                <div className="text-center py-4">
                  <Clock size={40} className="mx-auto mb-3 text-blue-600" />
                  <p className="text-sm font-bold text-neu-text mb-2">
                    申請を受け付けました
                  </p>
                  <p className="text-xs text-neu-text-muted leading-relaxed">
                    スタッフが在庫を確認してお席までお持ちいたします。
                  </p>
                </div>
              </Card>
            )}

            {currentRequest.status === 'delivered' && (
              <Card className="mb-4 bg-green-50">
                <div className="text-center py-4">
                  <CheckCircle2 size={40} className="mx-auto mb-3 text-green-600" />
                  <p className="text-sm font-bold text-neu-text mb-2">
                    お品物をお届けしました
                  </p>
                  <p className="text-xs text-neu-text-muted leading-relaxed">
                    ご利用後は「返却を依頼」ボタンよりご返却をお願いいたします。
                  </p>
                </div>
              </Card>
            )}

            {currentRequest.status === 'return_requested' && (
              <Card className="mb-4 bg-yellow-50">
                <div className="text-center py-4">
                  <RotateCcw size={40} className="mx-auto mb-3 text-yellow-600" />
                  <p className="text-sm font-bold text-neu-text mb-2">
                    返却依頼を受け付けました
                  </p>
                  <p className="text-xs text-neu-text-muted leading-relaxed">
                    スタッフがお席まで回収に伺います。
                  </p>
                </div>
              </Card>
            )}

            {/* 物品一覧 */}
            <Card className="mb-4">
              <div className="space-y-3">
                {currentRequest.request_items.map((requestItem) => (
                  <div
                    key={requestItem.id}
                    className="p-3 rounded-xl neu-concave"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-neu-text text-sm">
                          {requestItem.item?.name}
                        </div>
                        <div className="text-xs text-neu-text-muted">
                          数量: {requestItem.quantity}
                        </div>
                      </div>
                      <Badge
                        variant={
                          requestItem.item_status === 'delivered'
                            ? 'info'
                            : requestItem.item_status === 'return_requested'
                            ? 'warning'
                            : requestItem.item_status === 'returned'
                            ? 'success'
                            : 'default'
                        }
                        size="sm"
                      >
                        {getStatusLabel(requestItem.item_status)}
                      </Badge>
                    </div>

                    {/* 受取確認ボタン */}
                    {requestItem.item_status === 'pending' && (
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => handleReceived(requestItem.id)}
                        disabled={actionLoading}
                      >
                        <Check size={14} className="mr-1" />
                        受取済み
                      </Button>
                    )}

                    {/* 個別返却ボタン */}
                    {requestItem.item_status === 'delivered' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        fullWidth
                        onClick={() => handleItemReturn(requestItem.id)}
                        disabled={actionLoading}
                      >
                        <RotateCcw size={14} className="mr-1" />
                        返却を依頼
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* 全て返却ボタン */}
            {hasDeliveredItems && (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleAllReturn}
                disabled={actionLoading}
                className="mb-6"
              >
                <RotateCcw size={18} className="mr-2" />
                すべて返却を依頼
              </Button>
            )}

            <div className="border-t border-neu-shadow-dark my-6"></div>
          </div>
        )}

        {/* 新規申請フォーム */}
        <h2 className="text-lg font-bold text-neu-text mb-4">
          {hasActiveItems ? '追加で申請する' : '新しい申請'}
        </h2>

        {/* 氏名・席番号入力 */}
        <Card className="mb-6">
          <Input
            label="氏名"
            placeholder="山田太郎"
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            className="mb-4"
          />
          <Input
            label="席番号"
            placeholder="A-1"
            value={seatNumber}
            onChange={(e) => setSeatNumber(e.target.value)}
          />
        </Card>

        {/* タブ切替 */}
        <Tabs
          tabs={[
            { label: '貸出物品', value: 'rental', icon: <Package size={18} /> },
            { label: '消耗品', value: 'consumable', icon: <Package size={18} /> },
          ]}
          activeTab={activeTab}
          onChange={(value) => setActiveTab(value as 'rental' | 'consumable')}
          className="mb-6"
        />

        {/* 物品一覧 */}
        <div className="space-y-3 mb-24">
          {filteredItems.map((item) => {
            const isOutOfStock = item.current_stock === 0
            const isLowStock =
              item.current_stock > 0 && item.current_stock <= item.low_stock_alert

            return (
              <Card key={item.id} padding="md">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-neu-text">{item.name}</span>
                      {isOutOfStock && (
                        <Badge variant="danger" size="sm">
                          在庫なし
                        </Badge>
                      )}
                      {isLowStock && (
                        <Badge variant="warning" size="sm">
                          残りわずか
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-neu-text-muted">
                      在庫: {item.current_stock}個
                    </p>
                  </div>
                  <Stepper
                    value={getCartQuantity(item.id)}
                    onChange={(quantity) => addToCart(item, quantity)}
                    max={item.current_stock}
                    disabled={isOutOfStock}
                  />
                </div>
              </Card>
            )
          })}
        </div>

        {/* カート（固定フッター） */}
        {totalItems > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-neu-bg border-t border-neu-shadow-dark">
            <div className="max-w-2xl mx-auto">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleConfirm}
              >
                <ShoppingCart size={20} className="mr-2" />
                確認画面へ（{totalItems}点）
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


export default function RequestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neu-bg flex items-center justify-center">
        <div className="text-neu-text">読み込み中...</div>
      </div>
    }>
      <RequestPageContent />
    </Suspense>
  )
}
