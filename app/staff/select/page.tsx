'use client'

// スタッフ側 - スタッフ選択画面

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Staff } from '@/types/database'
import { Card } from '@/components/neumorphic'
import { User, Check } from 'lucide-react'

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
      <div className="min-h-screen bg-neu-bg flex items-center justify-center">
        <div className="text-neu-text">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neu-bg py-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neu-text mb-2">スタッフ選択</h1>
          <p className="text-sm text-neu-text-muted">
            あなたの名前を選択してください
          </p>
        </div>

        {/* スタッフ一覧 */}
        <div className="grid gap-4 mb-6">
          {staffList.map((staff) => (
            <Card
              key={staff.id}
              className="cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]"
              onClick={() => handleSelectStaff(staff)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-neu-bg neu-concave flex items-center justify-center flex-shrink-0">
                  <User size={24} className="text-neu-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-neu-text">{staff.name}</h3>
                  {staff.email && (
                    <p className="text-sm text-neu-text-muted">{staff.email}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* デバイス記憶オプション */}
        <Card>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                rememberDevice
                  ? 'bg-neu-accent'
                  : 'bg-neu-bg neu-concave'
              }`}
              onClick={(e) => {
                e.preventDefault()
                setRememberDevice(!rememberDevice)
              }}
            >
              {rememberDevice && <Check size={16} className="text-white" />}
            </div>
            <span className="text-sm text-neu-text">
              このデバイスに記憶する（次回から選択をスキップ）
            </span>
          </label>
        </Card>
      </div>
    </div>
  )
}
