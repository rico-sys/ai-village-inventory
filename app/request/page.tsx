'use client'

// お客さん側 - 申請画面

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Package, ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Input, Tabs, Stepper, Badge } from '@/components/neumorphic'
import { ItemWithCategory } from '@/types/database'

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

  // URLパラメータから席番号を取得
  useEffect(() => {
    const seat = searchParams.get('seat')
    if (seat) {
      setSeatNumber(seat)
    }

    // localStorageから氏名を取得
    const savedName = localStorage.getItem('visitor_name')
    if (savedName) {
      setVisitorName(savedName)
    }
  }, [searchParams])

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

  return (
    <div className="min-h-screen bg-neu-bg py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-neu-text mb-2">備品申請</h1>
          <p className="text-sm text-neu-text-muted">
            必要な備品を選択して申請してください
          </p>
        </div>

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
