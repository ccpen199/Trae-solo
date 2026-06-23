import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TonePatternProps {
  tones: number[]
  className?: string
  showLabel?: boolean
}

const toneNames: Record<number, string> = {
  1: '阴平',
  2: '阳平',
  3: '上声',
  4: '去声',
}

function getToneLabel(tone: number): '平' | '仄' {
  return tone === 1 || tone === 2 ? '平' : '仄'
}

export function TonePattern({ tones, className, showLabel = true }: TonePatternProps) {
  const pattern = tones.map(getToneLabel).join('')

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="flex items-center gap-3">
        {tones.map((tone, index) => {
          const isZe = tone === 3 || tone === 4
          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                  isZe
                    ? 'bg-ink-700 text-ink-50 border-ink-800'
                    : 'bg-transparent text-jade-700 border-jade-500'
                )}
              >
                {tone}
              </div>
              <span className="text-[10px] text-ink-400">{toneNames[tone] || ''}</span>
            </div>
          )
        })}
      </div>
      {showLabel && (
        <div className="text-sm font-serif font-semibold text-jade-700 tracking-widest">
          {pattern}
        </div>
      )}
    </div>
  )
}

export default TonePattern
