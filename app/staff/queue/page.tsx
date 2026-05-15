'use client'

// スタッフ側 - 申請キュー画面

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/neumorphic'
import { RequestWithItems, Staff } from '@/types/database'
import { getStatusLabel, formatDate, formatDuration } from '@/lib/utils'
import { ArrowLeft, CheckCircle2, XCircle, Truck } from 'lucide-react'

export default function StaffQueuePage() {
  const router = useRouter()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [requests, setRequests] = useState<RequestWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    checkStaff()
    fetchRequests()
  }, [])

  // Realtime購読
  useEffect(() => {
    const supabase = createClient()

    const requestsChannel = supabase
      .channel('requests_queue')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
        },
        () => {
          fetchRequests()
        }
      )
      .subscribe()

    const requestItemsChannel = supabase
      .channel('request_items_queue')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'request_items',
        },
        () => {
          fetchRequests()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(requestsChannel)
      supabase.removeChannel(requestItemsChannel)
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
        router.push('/staff/select')
        return
      }

      setStaff(data)
    } catch (error) {
      console.error('スタッフ確認エラー:', error)
      router.push('/staff/select')
    }
  }

  const fetchRequests = async () => {
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
        .in('status', ['pending', 'delivered', 'return_requested'])
        .order('requested_at', { ascending: false })

      if (error) throw error
      setRequests(data as RequestWithItems[])
    } catch (error) {
      console.error('申請取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // お渡し完了
  const handleDeliver = async (requestId: string) => {
    if (!staff) return

    setActionLoading(true)
    try {
      const supabase = createClient()

      // 申請全体を更新
      await supabase
        .from('requests')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          delivered_by: staff.id,
        })
        .eq('id', requestId)

      // 全ての申請明細を更新
      await supabase
        .from('request_items')
        .update({
          item_status: 'delivered',
          delivered_at: new Date().toISOString(),
        })
        .eq('request_id', requestId)

      fetchRequests()
    } catch (error) {
      console.error('お渡し完了エラー:', error)
      alert('お渡し完了に失敗しました')
    } finally {
      setActionLoading(false)
    }
  }

  // 回収完了
  const handleReturn = async (requestId: string) => {
    if (!staff) return

    setActionLoading(true)
    try {
      const supabase = createClient()

      // 申請全体を更新
      await supabase
        .from('requests')
        .update({
          status: 'returned',
          returned_at: new Date().toISOString(),
          returned_by: staff.id,
        })
        .eq('id', requestId)

      // 全ての申請明細を更新
      await supabase
        .from('request_items')
        .update({
          item_status: 'returned',
          returned_at: new Date().toISOString(),
        })
        .eq('request_id', requestId)

      // トランザクション記録（在庫戻し）
      const request = requests.find((r) => r.id === requestId)
      if (request) {
        const transactions = request.request_items.map((item) => ({
          item_id: item.item_id,
          action: 'in' as const,
          quantity: item.quantity,
          actor_type: 'staff' as const,
          actor_id: staff.id,
        }))

        await supabase.from('transactions').insert(transactions)
      }

      fetchRequests()
    } catch (error) {
      console.error('回収完了エラー:', error)
      alert('回収完了に失敗しました')
    } finally {
      setActionLoading(false)
    }
  }

  // キャンセル
  const handleCancel = async (requestId: string) => {
    if (!confirm('この申請をキャンセルしますか？')) return

    setActionLoading(true)
    try {
      const supabase = createClient()

      // 申請全体を更新
      await supabase
        .from('requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)

      // 全ての申請明細を更新
      await supabase
        .from('request_items')
        .update({ item_status: 'cancelled' })
        .eq('request_id', requestId)

      // トランザクション記録（在庫戻し）
      const request = requests.find((r) => r.id === requestId)
      if (request && request.status === 'pending') {
        // まだ渡していない場合のみ在庫を戻す
        const transactions = request.request_items.map((item) => ({
          item_id: item.item_id,
          action: 'in' as const,
          quantity: item.quantity,
          actor_type: 'staff' as const,
          actor_id: staff!.id,
          note: 'キャンセルによる返却',
        }))

        await supabase.from('transactions').insert(transactions)
      }

      fetchRequests()
    } catch (error) {
      console.error('キャンセルエラー:', error)
      alert('キャンセルに失敗しました')
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

  // ステータス別にグループ化
  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const deliveredRequests = requests.filter((r) => r.status === 'delivered')
  const returnRequestedRequests = requests.filter((r) => r.status === 'return_requested')

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
            <h1 className="text-2xl font-bold text-neu-text">申請キュー</h1>
            <p className="text-sm text-neu-text-muted">
              合計 {requests.length}件
            </p>
          </div>
        </div>

        {requests.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-neu-text-muted">申請はありません</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* 申請中 */}
            {pendingRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-neu-text mb-3 flex items-center gap-2">
                  📋 申請中
                  <Badge variant="warning" size="sm">
                    {pendingRequests.length}
                  </Badge>
                </h2>
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <Card key={request.id}>
                      <div className="mb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-neu-text">
                              {request.visitor_name} 様
                            </h3>
                            <p className="text-sm text-neu-text-muted">
                              席 {request.seat_number}
                            </p>
                          </div>
                          <Badge variant="warning" size="sm">
                            {getStatusLabel(request.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-neu-text-muted">
                          {formatDuration(request.requested_at)}
                        </p>
                      </div>

                      <div className="space-y-2 mb-4">
                        {request.request_items.map((item) => (
                          <div
                            key={item.id}
                            className="text-sm text-neu-text flex justify-between"
                          >
                            <span>{item.item?.name}</span>
                            <span className="font-medium">× {item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="success"
                          size="sm"
                          fullWidth
                          onClick={() => handleDeliver(request.id)}
                          disabled={actionLoading}
                        >
                          <CheckCircle2 size={16} className="mr-2" />
                          お渡し完了
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancel(request.id)}
                          disabled={actionLoading}
                        >
                          <XCircle size={16} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 貸出中 */}
            {deliveredRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-neu-text mb-3 flex items-center gap-2">
                  📦 貸出中
                  <Badge variant="info" size="sm">
                    {deliveredRequests.length}
                  </Badge>
                </h2>
                <div className="space-y-3">
                  {deliveredRequests.map((request) => (
                    <Card key={request.id}>
                      <div className="mb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-neu-text">
                              {request.visitor_name} 様
                            </h3>
                            <p className="text-sm text-neu-text-muted">
                              席 {request.seat_number}
                            </p>
                          </div>
                          <Badge variant="info" size="sm">
                            {getStatusLabel(request.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-neu-text-muted">
                          {request.delivered_at && formatDuration(request.delivered_at)}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {request.request_items.map((item) => (
                          <div
                            key={item.id}
                            className="text-sm text-neu-text flex justify-between"
                          >
                            <span>{item.item?.name}</span>
                            <span className="font-medium">× {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 回収依頼 */}
            {returnRequestedRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-neu-text mb-3 flex items-center gap-2">
                  ♻️ 回収依頼
                  <Badge variant="warning" size="sm">
                    {returnRequestedRequests.length}
                  </Badge>
                </h2>
                <div className="space-y-3">
                  {returnRequestedRequests.map((request) => (
                    <Card key={request.id}>
                      <div className="mb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-neu-text">
                              {request.visitor_name} 様
                            </h3>
                            <p className="text-sm text-neu-text-muted">
                              席 {request.seat_number}
                            </p>
                          </div>
                          <Badge variant="warning" size="sm">
                            {getStatusLabel(request.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-neu-text-muted">
                          {request.return_requested_at &&
                            formatDuration(request.return_requested_at)}
                        </p>
                      </div>

                      <div className="space-y-2 mb-4">
                        {request.request_items.map((item) => (
                          <div
                            key={item.id}
                            className="text-sm text-neu-text flex justify-between"
                          >
                            <span>{item.item?.name}</span>
                            <span className="font-medium">× {item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <Button
                        variant="success"
                        size="sm"
                        fullWidth
                        onClick={() => handleReturn(request.id)}
                        disabled={actionLoading}
                      >
                        <Truck size={16} className="mr-2" />
                        回収完了
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
