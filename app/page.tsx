import Link from 'next/link'
import { Card } from '@/components/neumorphic'
import { QrCode, Users, Settings } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-neu-bg flex items-center justify-center py-20 px-6">
      <div className="max-w-7xl w-full">
        {/* ヘッダー */}
        <div className="text-center mb-20">
          <div className="inline-block mb-6">
            <div className="w-20 h-20 rounded-3xl bg-neu-bg neu-convex flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Settings size={32} className="text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-neu-text mb-4 tracking-tight">
            AI Village 備品管理
          </h1>
          <p className="text-lg text-neu-text-muted max-w-2xl mx-auto">
            コワーキング施設の備品貸出・在庫管理をスマートに
          </p>
        </div>

        {/* メニューカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* お客さん用 */}
          <Link href="/request" className="group">
            <Card className="cursor-pointer neu-hover h-full">
              <div className="text-center py-12 px-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-neu-bg neu-concave flex items-center justify-center group-hover:neu-flat transition-all duration-300">
                  <QrCode size={36} className="text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-neu-text mb-3">
                  お客さん用
                </h2>
                <p className="text-sm text-neu-text-muted mb-6 leading-relaxed">
                  備品の申請・返却
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-medium text-neu-text-muted bg-neu-bg neu-concave rounded-full py-3 px-5">
                  <QrCode size={14} />
                  <span>QRコードスキャン</span>
                </div>
              </div>
            </Card>
          </Link>

          {/* スタッフ用 */}
          <Link href="/staff" className="group">
            <Card className="cursor-pointer neu-hover h-full">
              <div className="text-center py-12 px-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-neu-bg neu-concave flex items-center justify-center group-hover:neu-flat transition-all duration-300">
                  <Users size={36} className="text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-neu-text mb-3">
                  スタッフ用
                </h2>
                <p className="text-sm text-neu-text-muted mb-6 leading-relaxed">
                  申請対応・借用・返却・補充
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-medium text-neu-text-muted bg-neu-bg neu-concave rounded-full py-3 px-5">
                  <Users size={14} />
                  <span>NFCタグタップ</span>
                </div>
              </div>
            </Card>
          </Link>

          {/* 管理者用 */}
          <Link href="/admin" className="group">
            <Card className="cursor-pointer neu-hover h-full">
              <div className="text-center py-12 px-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-neu-bg neu-concave flex items-center justify-center group-hover:neu-flat transition-all duration-300">
                  <Settings size={36} className="text-pink-600" />
                </div>
                <h2 className="text-2xl font-bold text-neu-text mb-3">
                  管理者用
                </h2>
                <p className="text-sm text-neu-text-muted mb-6 leading-relaxed">
                  物品・スタッフ・ログ管理
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-medium text-neu-text-muted bg-neu-bg neu-concave rounded-full py-3 px-5">
                  <Settings size={14} />
                  <span>ダッシュボード</span>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* フッター */}
        <div className="text-center mt-20">
          <p className="text-xs text-neu-text-muted">
            © 2026 AI Village. Built with Next.js + Supabase
          </p>
        </div>
      </div>
    </div>
  )
}
