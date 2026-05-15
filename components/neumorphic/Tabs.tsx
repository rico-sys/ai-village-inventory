'use client'

// ニューモグラフィックタブコンポーネント

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TabsProps {
  tabs: Array<{
    label: string
    value: string
    icon?: ReactNode
  }>
  activeTab: string
  onChange: (value: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-2 p-2 bg-neu-bg rounded-2xl neu-concave', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex-1 px-4 py-3 rounded-xl font-medium transition-all',
            'flex items-center justify-center gap-2',
            activeTab === tab.value
              ? 'neu-concave text-neu-accent'
              : 'neu-convex text-neu-text-muted hover:text-neu-text'
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}
