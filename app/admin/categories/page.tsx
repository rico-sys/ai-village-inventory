'use client'

// 管理者側 - カテゴリ管理

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/types/database'

type CategoryType = 'rental' | 'consumable'

const TYPE_LABEL: Record<CategoryType, string> = {
  rental: '貸出品',
  consumable: '消耗品',
}

const TYPE_COLOR: Record<CategoryType, { bg: string; ink: string }> = {
  rental:     { bg: 'var(--customer-bg)', ink: 'var(--customer-ink)' },
  consumable: { bg: 'var(--staff-bg)',    ink: 'var(--staff-ink)' },
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{ name: string; type: CategoryType }>({
    name: '',
    type: 'rental',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      if (error) throw error
      setCategories((data || []) as Category[])
    } catch (error) {
      console.error('カテゴリ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    setEditingId(null)
    setFormData({ name: '', type: 'rental' })
    setShowModal(true)
  }

  const openEdit = (c: Category) => {
    setEditingId(c.id)
    setFormData({ name: c.name, type: c.type })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('カテゴリ名を入力してください')
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const payload = { name: formData.name.trim(), type: formData.type }

      if (editingId) {
        // @ts-ignore - Supabase generated types issue
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
      } else {
        // @ts-ignore - Supabase generated types issue
        const { error } = await supabase.from('categories').insert(payload)
        if (error) throw error
      }
      setShowModal(false)
      await fetchData()
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました。物品が紐づいているカテゴリ名の重複などをご確認ください。')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`カテゴリ「${name}」を削除しますか？\n（このカテゴリに紐づく物品が残っている場合は失敗します）`)) return
    try {
      const supabase = createClient()
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました。先にこのカテゴリに属する物品を別カテゴリへ移すか削除してください。')
    }
  }

  return (
    <div className="min-h-screen w-full px-5 py-8">
      <div className="mx-auto w-full max-w-[720px] pb-20">

        {/* ヘッダー */}
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
              style={{ background: 'var(--bg-alt)', color: 'var(--text)' }}
              aria-label="戻る"
            >
              ‹
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-wide">カテゴリ管理</h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                物品を分類するためのカテゴリを管理します
              </p>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="cta-brand flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold"
          >
            ＋ 追加
          </button>
        </header>

        {/* 一覧 */}
        {loading ? (
          <div className="surface-card px-5 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
            読み込み中...
          </div>
        ) : categories.length === 0 ? (
          <div className="surface-card px-5 py-10 text-center" style={{ color: 'var(--text-muted)' }}>
            まだカテゴリがありません。右上の「＋追加」から作成してください。
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {categories.map((c) => {
              const color = TYPE_COLOR[c.type]
              return (
                <li
                  key={c.id}
                  className="surface-card flex items-center gap-4 px-5 py-4"
                >
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl"
                    style={{ background: color.bg }}
                    aria-hidden="true"
                  >
                    {c.type === 'rental' ? '🔁' : '🧴'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold">{c.name}</h3>
                    <span
                      className="pill mt-1"
                      style={{ background: color.bg, color: color.ink }}
                    >
                      {TYPE_LABEL[c.type]}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(c)}
                      className="rounded-full px-3 py-1.5 text-xs font-medium"
                      style={{ background: 'var(--bg-alt)', color: 'var(--text)' }}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="rounded-full px-3 py-1.5 text-xs font-medium"
                      style={{ background: '#FCE5E0', color: 'var(--danger)' }}
                    >
                      削除
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* モーダル */}
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
            style={{ background: 'rgba(15, 23, 41, 0.32)' }}
            onClick={() => !saving && setShowModal(false)}
          >
            <div
              className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6"
              style={{ boxShadow: 'var(--shadow-strong)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-1 text-lg font-bold">
                {editingId ? 'カテゴリ編集' : 'カテゴリ追加'}
              </h2>
              <p className="mb-5 text-xs" style={{ color: 'var(--text-muted)' }}>
                カテゴリ名と種別（貸出品 or 消耗品）を選んでください
              </p>

              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                カテゴリ名
              </label>
              <input
                type="text"
                className="mb-4 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-[var(--brand-blue)]"
                style={{ borderColor: 'var(--border-color)', background: 'var(--bg-alt)' }}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例：文房具"
              />

              <label className="mb-2 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                種別
              </label>
              <div className="mb-6 grid grid-cols-2 gap-2">
                {(['rental', 'consumable'] as const).map((t) => {
                  const isActive = formData.type === t
                  const color = TYPE_COLOR[t]
                  return (
                    <button
                      key={t}
                      onClick={() => setFormData({ ...formData, type: t })}
                      className="rounded-2xl px-4 py-3 text-sm font-bold transition"
                      style={{
                        background: isActive ? color.bg : 'var(--bg-alt)',
                        color: isActive ? color.ink : 'var(--text-muted)',
                        boxShadow: isActive ? 'var(--shadow-soft)' : 'none',
                      }}
                    >
                      {t === 'rental' ? '🔁 貸出品' : '🧴 消耗品'}
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="flex-1 rounded-2xl py-3 text-sm font-bold"
                  style={{ background: 'var(--bg-alt)', color: 'var(--text)' }}
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="cta-brand flex-1 rounded-2xl py-3 text-sm font-bold"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
