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
      'w-full px-6 py-4 bg-white text-neu-text rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 text-base'

    return (
      <div className="w-full">
        {label && (
          <label className="block text-base font-semibold text-gray-700 mb-3">
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
