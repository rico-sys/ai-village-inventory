import Link from 'next/link'
import { Card } from '@/components/neumorphic'

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center py-20 px-6">
      <div className="max-w-7xl w-full">
        {/* ヘッダー */}
        <div className="text-center mb-20">
          <div className="inline-block mb-6">
            <div className="w-20 h-20 rounded-2xl bg-[#2C3E5C] flex items-center justify-center shadow-[0_4px_8px_rgba(30,42,74,0.08),0_12px_32px_rgba(30,42,74,0.12)]">
              <span className="text-4xl">📦</span>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-[#2C3E5C] mb-4 tracking-tight">
            AI Village 備品管理
          </h1>
          <p className="text-lg text-[#8B8478] max-w-2xl mx-auto">
            コワーキング施設の備品貸出・在庫管理をスマートに
          </p>
        </div>

        {/* メニューカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* お客さん用 */}
          <Link href="/request" className="group">
            <Card className="cursor-pointer neu-hover h-full">
              <div className="text-center py-12 px-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#D4E9E2] flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <span className="text-4xl">🌱</span>
                </div>
                <h2 className="text-2xl font-bold text-[#2C3E5C] mb-3">
                  お客さん用
                </h2>
                <p className="text-sm text-[#8B8478] mb-6 leading-relaxed">
                  備品の申請・返却
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-medium text-[#8B8478] bg-[var(--bg)] neu-concave rounded-full py-3 px-5">
                  <span>📱</span>
                  <span>QRコードスキャン</span>
                </div>
              </div>
            </Card>
          </Link>

          {/* スタッフ用 */}
          <Link href="/staff" className="group">
            <Card className="cursor-pointer neu-hover h-full">
              <div className="text-center py-12 px-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#E8DFF5] flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <span className="text-4xl">🍇</span>
                </div>
                <h2 className="text-2xl font-bold text-[#2C3E5C] mb-3">
                  スタッフ用
                </h2>
                <p className="text-sm text-[#8B8478] mb-6 leading-relaxed">
                  申請対応・借用・返却・補充
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-medium text-[#8B8478] bg-[var(--bg)] neu-concave rounded-full py-3 px-5">
                  <span>👥</span>
                  <span>NFCタグタップ</span>
                </div>
              </div>
            </Card>
          </Link>

          {/* 管理者用 */}
          <Link href="/admin" className="group">
            <Card className="cursor-pointer neu-hover h-full">
              <div className="text-center py-12 px-8">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#F5DED3] flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <span className="text-4xl">🍷</span>
                </div>
                <h2 className="text-2xl font-bold text-[#2C3E5C] mb-3">
                  管理者用
                </h2>
                <p className="text-sm text-[#8B8478] mb-6 leading-relaxed">
                  物品・スタッフ・ログ管理
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-medium text-[#8B8478] bg-[var(--bg)] neu-concave rounded-full py-3 px-5">
                  <span>⚙️</span>
                  <span>ダッシュボード</span>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* フッター */}
        <div className="text-center mt-20">
          <p className="text-xs text-[#8B8478]">
            © 2026 AI Village. Built with Next.js + Supabase
          </p>
        </div>
      </div>
    </div>
  )
}
