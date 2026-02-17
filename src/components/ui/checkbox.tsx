'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, checked, defaultChecked, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(defaultChecked ?? false)
    const controlledChecked = checked !== undefined ? checked : isChecked

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (checked === undefined) {
        setIsChecked(e.target.checked)
      }
      onChange?.(e)
      onCheckedChange?.(e.target.checked)
    }

    return (
      <label className={cn('relative inline-flex cursor-pointer', className)}>
        <input
          type="checkbox"
          ref={ref}
          className="peer sr-only"
          checked={controlledChecked}
          onChange={handleChange}
          {...props}
        />
        <div
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gray-300 bg-white transition-colors',
            'peer-checked:border-indigo-600 peer-checked:bg-indigo-600',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50'
          )}
        >
          <Check 
            className={cn(
              'h-3 w-3 stroke-[3] text-white transition-opacity',
              controlledChecked ? 'opacity-100' : 'opacity-0'
            )} 
          />
        </div>
      </label>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
