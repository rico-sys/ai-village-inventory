'use client'

// 管理者側 - スタッフ管理

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Staff } from '@/types/database'

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{ name: string; email: string; active: boolean }>({
    name: '',
    email: '',
    active: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('name')
      if (error) throw error
      setStaff((data || []) as Staff[])
    } catch (error) {
      console.error('スタッフ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    setEditingId(null)
    setFormData({ name: '', email: '', active: true })
    setShowModal(true)
  }

  const openEdit = (s: Staff) => {
    setEditingId(s.id)
    setFormData({ name: s.name, email: s.email ?? '', active: s.active })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('名前を入力してください')
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        active: formData.active,
      }

      if (editingId) {
        // @ts-ignore - Supabase generated types issue
        const { error } = await supabase
          .from('staff')
          .update(payload)
          .eq('id', editingId)
        if (error) throw error
      } else {
        // @ts-ignore - Supabase generated types issue
        const { error } = await supabase.from('staff').insert(payload)
        if (error) throw error
      }
      setShowModal(false)
      await fetchData()
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (s: Staff) => {
    try {
      const supabase = createClient()
      // @ts-ignore - Supabase generated types issue
      const { error } = await supabase
        .from('staff')
        .update({ active: !s.active })
        .eq('id', s.id)
      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('更新エラー:', error)
      alert('更新に失敗しました')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`スタッフ「${name}」を削除しますか？\n（このスタッフが関連するログ・申請は残ります）`)) return
    try {
      const supabase = createClient()
      const { error } = await supabase.from('staff').delete().eq('id', id)
      if (error) throw error
      await fetchData()
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました。トランザクションログから参照されています。「無効化」を検討してください。')
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
              <h1 className="text-xl font-bold tracking-wide">スタッフ管理</h1>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                対応スタッフの登録・無効化を行います
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
        ) : staff.length === 0 ? (
          <div className="surface-card px-5 py-10 text-center" style={{ color: 'var(--text-muted)' }}>
            まだスタッフが登録されていません。右上の「＋追加」から登録してください。
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {staff.map((s) => (
              <li
                key={s.id}
                className="surface-card flex items-center gap-4 px-5 py-4"
                style={{ opacity: s.active ? 1 : 0.55 }}
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold"
                  style={{
                    background: s.active ? 'var(--staff-bg)' : 'var(--bg-alt)',
                    color: s.active ? 'var(--staff-ink)' : 'var(--text-muted)',
                  }}
                  aria-hidden="true"
                >
                  {s.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{s.name}</h3>
                    {s.active ? (
                      <span
                        className="pill"
                        style={{ background: 'var(--staff-bg)', color: 'var(--staff-ink)' }}
                      >
                        有効
                      </span>
                    ) : (
                      <span
                        className="pill"
                        style={{ background: 'var(--bg-alt)', color: 'var(--text-muted)' }}
                      >
                        無効
                      </span>
                    )}
                  </div>
                  {s.email && (
                    <p className="mt-0.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {s.email}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(s)}
                    className="rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{ background: 'var(--bg-alt)', color: 'var(--text)' }}
                  >
                    {s.active ? '無効化' : '有効化'}
                  </button>
                  <button
                    onClick={() => openEdit(s)}
                    className="rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{ background: 'var(--bg-alt)', color: 'var(--text)' }}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    className="rounded-full px-3 py-1.5 text-xs font-medium"
                    style={{ background: '#FCE5E0', color: 'var(--danger)' }}
                  >
                    削除
                  </button>
                </div>
              </li>
            ))}
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
                {editingId ? 'スタッフ編集' : 'スタッフ追加'}
              </h2>
              <p className="mb-5 text-xs" style={{ color: 'var(--text-muted)' }}>
                名前は必須です。メールアドレスは任意。
              </p>

              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                名前
              </label>
              <input
                type="text"
                className="mb-4 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-[var(--brand-blue)]"
                style={{ borderColor: 'var(--border-color)', background: 'var(--bg-alt)' }}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例：山田 太郎"
              />

              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                メールアドレス（任意）
              </label>
              <input
                type="email"
                className="mb-4 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-[var(--brand-blue)]"
                style={{ borderColor: 'var(--border-color)', background: 'var(--bg-alt)' }}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="例：taro@example.com"
              />

              <label className="mb-6 flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-5 w-5 cursor-pointer accent-[var(--brand-green)]"
                />
                <span className="text-sm font-medium">アクティブ（有効）</span>
              </label>

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
