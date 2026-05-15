// ニューモグラフィックバッジコンポーネント

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full shadow-sm'

    const sizeStyles = {
      sm: 'px-2.5 py-1 text-xs',
      md: 'px-3.5 py-1.5 text-sm',
      lg: 'px-4.5 py-2 text-base',
    }

    const variantStyles = {
      default: 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700',
      success: 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700',
      warning: 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700',
      danger: 'bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700',
      info: 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700',
    }

    return (
      <span
        ref={ref}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
