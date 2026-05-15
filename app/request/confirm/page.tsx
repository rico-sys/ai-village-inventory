'use client'

// お客さん側 - 確認画面

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/neumorphic'
import { notifyNewRequest } from '@/lib/slack'
import { CheckCircle2, ArrowLeft } from 'lucide-react'

interface CartItem {
  itemId: string
  itemName: string
  quantity: number
  currentStock: number
}

function ConfirmPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [visitorName, setVisitorName] = useState('')
  const [seatNumber, setSeatNumber] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    const name = searchParams.get('name')
    const seat = searchParams.get('seat')
    const itemsJson = searchParams.get('items')

    if (!name || !seat || !itemsJson) {
      router.push('/request')
      return
    }

    setVisitorName(name)
    setSeatNumber(seat)
    setCart(JSON.parse(itemsJson))
  }, [searchParams, router])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // 申請レコード作成
      const { data: request, error: requestError } = await supabase
        .from('requests')
        .insert({
          visitor_name: visitorName,
          seat_number: seatNumber,
          status: 'pending',
        })
        .select()
        .single()

      if (requestError) throw requestError

      // 申請明細を作成
      const requestItems = cart.map((item) => ({
        request_id: request.id,
        item_id: item.itemId,
        quantity: item.quantity,
        item_status: 'pending' as const,
      }))

      const { error: itemsError } = await supabase
        .from('request_items')
        .insert(requestItems)

      if (itemsError) throw itemsError

      // トランザクション記録（在庫減少）
      const transactions = cart.map((item) => ({
        item_id: item.itemId,
        action: 'out' as const,
        quantity: item.quantity,
        actor_type: 'visitor' as const,
        visitor_name: visitorName,
      }))

      const { error: transError } = await supabase
        .from('transactions')
        .insert(transactions)

      if (transError) throw transError

      // Slack通知
      await notifyNewRequest({
        visitorName,
        seatNumber,
        items: cart.map((item) => ({
          name: item.itemName,
          quantity: item.quantity,
        })),
        requestId: request.id,
      })

      // ステータス画面へリダイレクト
      router.push(`/request/${request.id}`)
    } catch (error) {
      console.error('申請エラー:', error)
      alert('申請に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-neu-bg py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-neu-text mb-2">申請内容の確認</h1>
          <p className="text-sm text-neu-text-muted">
            内容をご確認の上、申請ボタンを押してください
          </p>
        </div>

        {/* 申請者情報 */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>申請者情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-neu-text-muted">氏名</span>
                <span className="font-medium text-neu-text">{visitorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neu-text-muted">席番号</span>
                <span className="font-medium text-neu-text">{seatNumber}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 申請物品 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>申請物品（{totalItems}点）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div
                  key={item.itemId}
                  className={`flex justify-between items-center ${
                    index > 0 ? 'pt-3 border-t border-neu-shadow-dark' : ''
                  }`}
                >
                  <span className="text-neu-text">{item.itemName}</span>
                  <span className="font-bold text-neu-text">× {item.quantity}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ボタン */}
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              '申請中...'
            ) : (
              <>
                <CheckCircle2 size={20} className="mr-2" />
                申請する
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => router.back()}
            disabled={loading}
          >
            <ArrowLeft size={18} className="mr-2" />
            戻る
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neu-bg flex items-center justify-center">読み込み中...</div>}>
      <ConfirmPageContent />
    </Suspense>
  )
}
