'use client'

// ニューモグラフィックモーダルコンポーネント

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className,
}: ModalProps) {
  // ESCキーで閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      // スクロール防止
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* モーダル本体 */}
      <div
        className={cn(
          'relative w-full bg-neu-bg rounded-3xl p-6 neu-convex',
          sizeStyles[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-neu-text">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neu-bg flex items-center justify-center neu-convex active:neu-pressed transition-all"
              aria-label="閉じる"
            >
              <X size={18} className="text-neu-text-muted" />
            </button>
          </div>
        )}

        {/* コンテンツ */}
        <div className="text-neu-text">{children}</div>

        {/* フッター */}
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  )
}
