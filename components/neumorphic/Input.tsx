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
      'w-full px-6 py-5 neu-concave text-[#2C3E5C] rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-[#2C3E5C] focus:ring-opacity-20 transition-all duration-300 placeholder:text-[#8B8478] text-base min-h-[56px]'

    return (
      <div className="w-full">
        {label && (
          <label className="block text-base font-semibold text-[#2C3E5C] mb-3">
            {label}
          </label>
        )}
        <input ref={ref} className={cn(baseStyles, error && 'ring-2 ring-[#E8B5A0]', className)} {...props} />
        {error && <p className="mt-2 text-sm text-[#E8B5A0] font-medium">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
