'use client'

// ニューモグラフィックボタンコンポーネント

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'neu-button transition-all duration-300 font-bold rounded-2xl flex items-center justify-center gap-2'

    // サイズ - スマホで押しやすい大きめサイズ
    const sizeStyles = {
      sm: 'px-8 py-4 text-sm min-h-[48px]',
      md: 'px-10 py-5 text-base min-h-[56px]',
      lg: 'px-12 py-6 text-lg min-h-[64px]',
    }

    // バリアント - ソフトUIスタイル
    const variantStyles = {
      primary: 'bg-[#2C3E5C] hover:bg-[#1E2A4A] text-white shadow-[0_2px_4px_rgba(30,42,74,0.06),0_8px_24px_rgba(30,42,74,0.08)] hover:shadow-[0_4px_8px_rgba(30,42,74,0.08),0_12px_32px_rgba(30,42,74,0.12)] active:scale-[0.97]',
      secondary: 'bg-[var(--background)] hover:bg-[#F0EDE7] text-[#2C3E5C] shadow-[0_1px_2px_rgba(30,42,74,0.04),0_4px_16px_rgba(30,42,74,0.06)] hover:shadow-[0_2px_4px_rgba(30,42,74,0.06),0_8px_24px_rgba(30,42,74,0.08)] active:scale-[0.97]',
      success: 'bg-[#A8C5A4] hover:bg-[#92B58E] text-[#2C3E5C] shadow-[0_2px_4px_rgba(30,42,74,0.06),0_8px_24px_rgba(30,42,74,0.08)] hover:shadow-[0_4px_8px_rgba(30,42,74,0.08),0_12px_32px_rgba(30,42,74,0.12)] active:scale-[0.97]',
      warning: 'bg-[#F4D09D] hover:bg-[#EEC080] text-[#2C3E5C] shadow-[0_2px_4px_rgba(30,42,74,0.06),0_8px_24px_rgba(30,42,74,0.08)] hover:shadow-[0_4px_8px_rgba(30,42,74,0.08),0_12px_32px_rgba(30,42,74,0.12)] active:scale-[0.97]',
      danger: 'bg-[#E8B5A0] hover:bg-[#E09F86] text-white shadow-[0_2px_4px_rgba(30,42,74,0.06),0_8px_24px_rgba(30,42,74,0.08)] hover:shadow-[0_4px_8px_rgba(30,42,74,0.08),0_12px_32px_rgba(30,42,74,0.12)] active:scale-[0.97]',
    }

    const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none'
    const widthStyles = fullWidth ? 'w-full' : ''

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          disabled && disabledStyles,
          widthStyles,
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
