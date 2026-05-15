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
    const baseStyles = 'neu-button transition-all duration-300 font-semibold rounded-2xl flex items-center justify-center gap-2'

    // サイズ
    const sizeStyles = {
      sm: 'px-5 py-2.5 text-sm min-h-[40px]',
      md: 'px-7 py-3.5 text-base min-h-[48px]',
      lg: 'px-9 py-4 text-lg min-h-[56px]',
    }

    // バリアント
    const variantStyles = {
      primary: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
      secondary: 'bg-neu-bg text-neu-text-muted neu-convex hover:neu-hover active:neu-pressed',
      success: 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
      warning: 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
      danger: 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
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
