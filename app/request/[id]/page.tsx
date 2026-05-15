'use client'

// お客さん側 - ステータス画面

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/neumorphic'
import { notifyReturnRequest } from '@/lib/slack'
import { RequestWithItems, RequestItemWithItem } from '@/types/database'
import { getStatusLabel, getStatusColor, formatDate } from '@/lib/utils'
import { Package, Clock, CheckCircle2, RotateCcw } from 'lucide-react'

export default function RequestStatusPage() {
  const params = useParams()
  const [request, setRequest] = useState<RequestWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const requestId = params.id as string

  // 申請データを取得
  useEffect(() => {
    fetchRequest()
  }, [requestId])

  // Realtime購読
  useEffect(() => {
    const supabase = createClient()

    // requestsテーブルの変更を購読
    const requestChannel = supabase
      .channel(`request_${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
          filter: `id=eq.${requestId}`,
        },
        () => {
          fetchRequest()
        }
      )
      .subscribe()

    // request_itemsテーブルの変更を購読
    const requestItemsChannel = supabase
      .channel(`request_items_${requestId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'request_items',
          filter: `request_id=eq.${requestId}`,
        },
        () => {
          fetchRequest()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(requestChannel)
      supabase.removeChannel(requestItemsChannel)
    }
  }, [requestId])

  const fetchRequest = async () => {
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
        .eq('id', requestId)
        .single()

      if (error) throw error
      setRequest(data as RequestWithItems)
    } catch (error) {
      console.error('申請取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // 個別物品の返却依頼
  const handleItemReturn = async (requestItemId: string) => {
    if (!request) return

    setActionLoading(true)
    try {
      const supabase = createClient()

      // request_itemの状態を更新
      const { error } = await supabase
        .from('request_items')
        .update({
          item_status: 'return_requested',
        })
        .eq('id', requestItemId)

      if (error) throw error

      // 申請全体の状態も確認して更新
      const allReturning = request.request_items.every(
        (item) => item.id === requestItemId || item.item_status === 'return_requested' || item.item_status === 'returned'
      )

      if (allReturning) {
        await supabase
          .from('requests')
          .update({
            status: 'return_requested',
            return_requested_at: new Date().toISOString(),
          })
          .eq('id', requestId)
      }

      // Slack通知
      const item = request.request_items.find((ri) => ri.id === requestItemId)
      if (item && item.item && request.delivered_at) {
        await notifyReturnRequest({
          visitorName: request.visitor_name,
          seatNumber: request.seat_number,
          items: [{ name: item.item.name, quantity: item.quantity }],
          requestId: request.id,
          deliveredAt: new Date(request.delivered_at),
        })
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
    if (!request) return

    setActionLoading(true)
    try {
      const supabase = createClient()

      // 全request_itemsを返却依頼に
      const deliveredItems = request.request_items.filter(
        (item) => item.item_status === 'delivered'
      )

      for (const item of deliveredItems) {
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
        .eq('id', requestId)

      // Slack通知
      if (request.delivered_at) {
        await notifyReturnRequest({
          visitorName: request.visitor_name,
          seatNumber: request.seat_number,
          items: deliveredItems
            .map((item) => ({
              name: item.item?.name || '',
              quantity: item.quantity,
            }))
            .filter((item) => item.name),
          requestId: request.id,
          deliveredAt: new Date(request.delivered_at),
        })
      }
    } catch (error) {
      console.error('返却依頼エラー:', error)
      alert('返却依頼に失敗しました')
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

  if (!request) {
    return (
      <div className="min-h-screen bg-neu-bg flex items-center justify-center">
        <div className="text-neu-text">申請が見つかりません</div>
      </div>
    )
  }

  const hasDeliveredItems = request.request_items.some(
    (item) => item.item_status === 'delivered'
  )

  return (
    <div className="min-h-screen bg-neu-bg py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-neu-text mb-2">申請ステータス</h1>
          <Badge variant="info" size="lg">
            {getStatusLabel(request.status)}
          </Badge>
        </div>

        {/* 申請者情報 */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>申請情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Package size={18} className="text-neu-text-muted" />
                <div>
                  <div className="text-xs text-neu-text-muted">氏名</div>
                  <div className="font-medium text-neu-text">
                    {request.visitor_name}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Package size={18} className="text-neu-text-muted" />
                <div>
                  <div className="text-xs text-neu-text-muted">席番号</div>
                  <div className="font-medium text-neu-text">
                    {request.seat_number}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-neu-text-muted" />
                <div>
                  <div className="text-xs text-neu-text-muted">申請日時</div>
                  <div className="font-medium text-neu-text">
                    {formatDate(request.requested_at)}
                  </div>
                </div>
              </div>
              {request.delivered_at && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-neu-success" />
                  <div>
                    <div className="text-xs text-neu-text-muted">お渡し日時</div>
                    <div className="font-medium text-neu-text">
                      {formatDate(request.delivered_at)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 物品一覧 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>申請物品</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {request.request_items.map((requestItem) => (
                <div
                  key={requestItem.id}
                  className="p-4 rounded-xl neu-concave"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-neu-text mb-1">
                        {requestItem.item?.name}
                      </div>
                      <div className="text-sm text-neu-text-muted">
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

                  {/* 個別返却ボタン */}
                  {requestItem.item_status === 'delivered' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={() => handleItemReturn(requestItem.id)}
                      disabled={actionLoading}
                    >
                      <RotateCcw size={16} className="mr-2" />
                      返却を依頼
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 全て返却ボタン */}
        {hasDeliveredItems && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleAllReturn}
            disabled={actionLoading}
          >
            <RotateCcw size={20} className="mr-2" />
            すべて返却を依頼
          </Button>
        )}

        {/* 完了メッセージ */}
        {request.status === 'returned' && (
          <Card className="mt-4 bg-green-50">
            <CardContent>
              <div className="text-center py-4">
                <CheckCircle2 size={48} className="mx-auto mb-3 text-neu-success" />
                <p className="text-lg font-bold text-neu-text mb-2">
                  返却が完了しました
                </p>
                <p className="text-sm text-neu-text-muted">
                  ご利用ありがとうございました
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
