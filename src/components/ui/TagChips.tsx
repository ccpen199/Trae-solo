import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export interface TagChipsItem {
  value: string
  label: string
  disabled?: boolean
}

export interface TagChipsProps {
  items: TagChipsItem[]
  selected: string[]
  onChange: (selected: string[]) => void
  showAllOption?: boolean
  allLabel?: string
  multiSelect?: boolean
  canDeselect?: boolean
  className?: string
}

const TagChips: React.FC<TagChipsProps> = ({
  items,
  selected,
  onChange,
  showAllOption = true,
  allLabel = '全部',
  multiSelect = true,
  canDeselect = true,
  className = '',
}) => {
  const isAllSelected = showAllOption && selected.length === items.length

  const handleAllToggle = () => {
    if (isAllSelected) {
      onChange([])
    } else {
      onChange(items.filter((i) => !i.disabled).map((i) => i.value))
    }
  }

  const handleItemToggle = (itemValue: string) => {
    const isSelected = selected.includes(itemValue)

    if (isSelected && !canDeselect && selected.length === 1) {
      return
    }

    if (multiSelect) {
      if (isSelected) {
        onChange(selected.filter((v) => v !== itemValue))
      } else {
        onChange([...selected, itemValue])
      }
    } else {
      if (isSelected && canDeselect) {
        onChange([])
      } else {
        onChange([itemValue])
      }
    }
  }

  const ChipButton: React.FC<{
    isActive: boolean
    onClick: () => void
    disabled?: boolean
    children: React.ReactNode
  }> = ({ isActive, onClick, disabled, children }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium',
        'transition-all duration-200 ease-out',
        'hover:scale-105 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2',
        isActive
          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-md shadow-emerald-200/60'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-700',
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100',
      )}
    >
      {isActive && <Check className="h-3.5 w-3.5" />}
      {children}
    </button>
  )

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {showAllOption && (
        <ChipButton isActive={isAllSelected} onClick={handleAllToggle}>
          {allLabel}
        </ChipButton>
      )}
      {items.map((item) => (
        <ChipButton
          key={item.value}
          isActive={selected.includes(item.value)}
          onClick={() => handleItemToggle(item.value)}
          disabled={item.disabled}
        >
          {item.label}
        </ChipButton>
      ))}
    </div>
  )
}

export { TagChips }
