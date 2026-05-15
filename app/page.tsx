import Link from 'next/link'
import TodayBadge from '@/components/TodayBadge'

type MenuItem = {
  href: string
  icon: string
  title: string
  desc: string
  pillLabel: string
  pillIcon: string
  bgVar: string
  inkVar: string
}

const menu: MenuItem[] = [
  {
    href: '/request',
    icon: '📱',
    title: 'お客さん用',
    desc: '備品の申請・返却',
    pillLabel: 'QRコードスキャン',
    pillIcon: '',
    bgVar: 'var(--customer-bg)',
    inkVar: 'var(--customer-ink)',
  },
  {
    href: '/staff',
    icon: '👥',
    title: 'スタッフ用',
    desc: '申請対応・借用・返却・補充',
    pillLabel: 'NFCタグタップ',
    pillIcon: '',
    bgVar: 'var(--staff-bg)',
    inkVar: 'var(--staff-ink)',
  },
  {
    href: '/admin',
    icon: '⚙️',
    title: '管理者用',
    desc: '物品・スタッフ・ログ管理',
    pillLabel: 'ダッシュボード',
    pillIcon: '',
    bgVar: 'var(--admin-bg)',
    inkVar: 'var(--admin-ink)',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen w-full px-5 py-8">
      <div className="mx-auto w-full max-w-[480px] pb-20">

        {/* ヘッダー */}
        <header className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white font-black tracking-tight text-lg"
              style={{
                background: 'var(--brand-gradient)',
                boxShadow: 'var(--shadow-brand)',
              }}
              aria-hidden="true"
            >
              AV
            </div>
            <div>
              <div className="text-[18px] font-bold tracking-wide leading-tight">
                <span className="brand-text font-black">AI Village</span>{' '}
                <span style={{ color: 'var(--text)' }}>備品管理</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Inventory System
              </div>
            </div>
          </div>
          <TodayBadge />
        </header>

        {/* セクションタイトル */}
        <div
          className="mx-1 mb-3 text-[13px] font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          ご利用の区分を選んでください
        </div>

        {/* メインメニュー */}
        <nav className="mb-7 flex flex-col gap-3.5">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="surface-card surface-card-hover flex items-center gap-4 p-5"
            >
              <div
                className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-[18px] text-3xl"
                style={{ background: item.bgVar }}
                aria-hidden="true"
              >
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="mb-1 text-[17px] font-bold tracking-wide">
                  {item.title}
                </h3>
                <p
                  className="mb-2 text-[13px] leading-snug"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {item.desc}
                </p>
                <span
                  className="pill"
                  style={{ background: item.bgVar, color: item.inkVar }}
                >
                  {item.pillLabel}
                </span>
              </div>
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
                style={{
                  background: 'var(--bg-alt)',
                  color: 'var(--text)',
                }}
                aria-hidden="true"
              >
                ›
              </div>
            </Link>
          ))}
        </nav>

        {/* ボトムCTA */}
        <Link
          href="/admin/items"
          className="cta-brand flex w-full items-center justify-center gap-2 rounded-[24px] py-[18px] text-[15px] font-bold tracking-wide"
        >
          ＋ 備品を新しく登録する
        </Link>

        {/* フッター */}
        <footer
          className="mt-8 text-center text-[11px]"
          style={{ color: 'var(--text-faint)' }}
        >
          © 2026 AI Village. Built with Next.js + Supabase
        </footer>
      </div>
    </div>
  )
}
