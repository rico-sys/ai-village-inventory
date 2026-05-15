'use client'

// ニューモグラフィック数量ステッパーコンポーネント

import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  className?: string
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  disabled = false,
  className,
}: StepperProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1)
    }
  }

  const isMinDisabled = value <= min || disabled
  const isMaxDisabled = value >= max || disabled

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={isMinDisabled}
        className={cn(
          'w-10 h-10 rounded-full bg-neu-bg flex items-center justify-center transition-all',
          'neu-convex active:neu-pressed',
          isMinDisabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
        aria-label="減らす"
      >
        <Minus size={18} className="text-neu-text" />
      </button>

      <div className="min-w-[48px] text-center">
        <span className="text-lg font-bold text-neu-text">{value}</span>
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={isMaxDisabled}
        className={cn(
          'w-10 h-10 rounded-full bg-neu-bg flex items-center justify-center transition-all',
          'neu-convex active:neu-pressed',
          isMaxDisabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
        aria-label="増やす"
      >
        <Plus size={18} className="text-neu-text" />
      </button>
    </div>
  )
}
