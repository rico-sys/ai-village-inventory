// ニューモグラフィックバッジコンポーネント

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md' | 'lg'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-300'

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    }

    const variantStyles = {
      default: 'bg-[#E8E5DF] text-[#2C3E5C]',
      success: 'bg-[#D4E9E2] text-[#2C3E5C]',
      warning: 'bg-[#F4D09D] text-[#2C3E5C]',
      danger: 'bg-[#F5DED3] text-[#2C3E5C]',
      info: 'bg-[#E8DFF5] text-[#2C3E5C]',
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
