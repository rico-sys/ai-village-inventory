'use client'

// スタッフ側 - スタッフ選択画面

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Staff } from '@/types/database'

export default function StaffSelectPage() {
  const router = useRouter()
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [rememberDevice, setRememberDevice] = useState(true)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) throw error
      setStaffList(data || [])
    } catch (error) {
      console.error('スタッフ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectStaff = (staff: Staff) => {
    if (rememberDevice) {
      localStorage.setItem('staff_id', staff.id)
    }
    router.push('/staff')
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full px-5 py-8 flex items-center justify-center">
        <div style={{ color: 'var(--text-muted)' }}>読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full px-5 py-8">
      <div className="mx-auto w-full max-w-[720px] pb-20">

        {/* ヘッダー */}
        <header className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
            style={{ background: 'var(--bg-alt)', color: 'var(--text)' }}
            aria-label="トップへ戻る"
          >
            ‹
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-wide">スタッフ選択</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              あなたの名前を選択してください
            </p>
          </div>
        </header>

        {/* スタッフ一覧 */}
        {staffList.length === 0 ? (
          <div className="surface-card px-5 py-10 text-center" style={{ color: 'var(--text-muted)' }}>
            スタッフが登録されていません
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-6">
            {staffList.map((staff) => (
              <button
                key={staff.id}
                onClick={() => handleSelectStaff(staff)}
                className="surface-card surface-card-hover flex items-center gap-4 px-5 py-4 text-left"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold"
                  style={{
                    background: 'var(--staff-bg)',
                    color: 'var(--staff-ink)',
                  }}
                  aria-hidden="true"
                >
                  {staff.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold">{staff.name}</h3>
                  {staff.email && (
                    <p className="mt-0.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {staff.email}
                    </p>
                  )}
                </div>
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
                  style={{ background: 'var(--bg-alt)', color: 'var(--text)' }}
                  aria-hidden="true"
                >
                  ›
                </div>
              </button>
            ))}
          </div>
        )}

        {/* デバイス記憶オプション */}
        <div className="surface-card px-5 py-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="h-5 w-5 cursor-pointer accent-[var(--brand-green)]"
            />
            <span className="text-sm">
              このデバイスに記憶する（次回から選択をスキップ）
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}
