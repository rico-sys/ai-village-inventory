'use client'

// 管理者側 - 物品管理

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Input, Modal, Badge } from '@/components/neumorphic'
import { ItemWithCategory, Category } from '@/types/database'
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react'

export default function AdminItemsPage() {
  const router = useRouter()
  const [items, setItems] = useState<ItemWithCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ItemWithCategory | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    current_stock: 0,
    low_stock_alert: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()

      const [itemsRes, categoriesRes] = await Promise.all([
        supabase.from('items').select('*, category:categories(*)').order('name'),
        supabase.from('categories').select('*').order('name'),
      ])

      if (itemsRes.error) throw itemsRes.error
      if (categoriesRes.error) throw categoriesRes.error

      setItems(itemsRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      category_id: categories[0]?.id || '',
      current_stock: 0,
      low_stock_alert: 0,
    })
    setShowModal(true)
  }

  const handleEdit = (item: ItemWithCategory) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category_id: item.category_id || '',
      current_stock: item.current_stock,
      low_stock_alert: item.low_stock_alert,
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    try {
      const supabase = createClient()

      const data = {
        name: formData.name,
        category_id: formData.category_id || null,
        current_stock: formData.current_stock,
        low_stock_alert: formData.low_stock_alert,
      }

      if (editingItem) {
        // 更新
        // @ts-ignore - Supabase generated types issue
        const { error } = await supabase
          .from('items')
          .update(data)
          .eq('id', editingItem.id)

        if (error) throw error
      } else {
        // 新規作成
        // @ts-ignore - Supabase generated types issue
        const { error } = await supabase.from('items').insert(data)

        if (error) throw error
      }

      setShowModal(false)
      fetchData()
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この物品を削除しますか？')) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from('items').delete().eq('id', id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
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
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="sm" onClick={() => router.push('/admin')}>
              <ArrowLeft size={18} />
            </Button>
            <h1 className="text-2xl font-bold text-neu-text">物品管理</h1>
          </div>
          <Button variant="primary" size="sm" onClick={handleAdd}>
            <Plus size={18} className="mr-2" />
            追加
          </Button>
        </div>

        {/* 物品一覧 */}
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-neu-text">{item.name}</h3>
                    <Badge variant="default" size="sm">
                      {item.category?.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-neu-text-muted">
                    在庫: {item.current_stock}個 / アラート閾値: {item.low_stock_alert}個
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(item)}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 編集モーダル */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingItem ? '物品編集' : '物品追加'}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                キャンセル
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                保存
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="物品名"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-neu-text mb-2">
                カテゴリ
              </label>
              <select
                className="w-full px-4 py-3 bg-neu-bg text-neu-text rounded-2xl neu-concave"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="現在の在庫"
              type="number"
              value={formData.current_stock.toString()}
              onChange={(e) =>
                setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })
              }
            />

            <Input
              label="低在庫アラート閾値"
              type="number"
              value={formData.low_stock_alert.toString()}
              onChange={(e) =>
                setFormData({ ...formData, low_stock_alert: parseInt(e.target.value) || 0 })
              }
            />
          </div>
        </Modal>
      </div>
    </div>
  )
}
