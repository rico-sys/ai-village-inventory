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
    const baseStyles = 'neu-button transition-all duration-200 font-semibold rounded-xl flex items-center justify-center gap-2 border'

    // サイズ
    const sizeStyles = {
      sm: 'px-6 py-3 text-sm min-h-[44px]',
      md: 'px-8 py-4 text-base min-h-[52px]',
      lg: 'px-10 py-5 text-lg min-h-[60px]',
    }

    // バリアント
    const variantStyles = {
      primary: 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 hover:border-indigo-700 shadow-sm hover:shadow-md active:scale-[0.98]',
      secondary: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md active:scale-[0.98]',
      success: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 hover:border-emerald-700 shadow-sm hover:shadow-md active:scale-[0.98]',
      warning: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 hover:border-amber-600 shadow-sm hover:shadow-md active:scale-[0.98]',
      danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700 shadow-sm hover:shadow-md active:scale-[0.98]',
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
