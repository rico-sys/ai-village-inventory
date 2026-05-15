'use client'

// ニューモグラフィックインプットコンポーネント

import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    const baseStyles =
      'w-full px-5 py-3.5 bg-neu-bg text-neu-text rounded-2xl neu-concave focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neu-bg transition-all duration-300 placeholder:text-neu-text-muted/50'

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-neu-text mb-2.5">
            {label}
          </label>
        )}
        <input ref={ref} className={cn(baseStyles, error && 'ring-2 ring-red-500', className)} {...props} />
        {error && <p className="mt-2 text-sm text-red-600 font-medium">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
