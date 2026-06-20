import * as React from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StepItem } from '@/types';

interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  className?: string;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, className }) => {
  return (
    <div className={cn('w-full py-4', className)}>
      <div className="flex items-start justify-between relative">
        <div
          className="absolute top-5 left-0 right-0 h-[2px] bg-ink-700 -z-0"
          style={{ marginLeft: 'calc(20px + 0%)', marginRight: 'calc(20px + 0%)' }}
        />
        <div
          className="absolute top-5 h-[2px] bg-gold-gradient z-0 transition-all duration-700 ease-out"
          style={{
            left: 'calc(20px + 0%)',
            right: `calc(20px + ${100 - ((currentStep + 1) / steps.length) * 100}%)`,
          }}
        />
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const status = isCompleted ? 'completed' : isCurrent ? 'current' : 'pending';

          return (
            <div
              key={index}
              className="flex flex-col items-center flex-1 relative z-10 px-2"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-500',
                  'border-2',
                  isCompleted && 'bg-gold-gradient border-gold-500 text-ink-950 shadow-gold-sm',
                  isCurrent &&
                    'bg-ink-850 border-gold-500 text-gold-400 shadow-[0_0_20px_rgba(201,169,98,0.35)] animate-pulse-slow',
                  !isCompleted && !isCurrent && 'bg-ink-800 border-ink-600 text-ink-400',
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" strokeWidth={3} />
                ) : (
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      isCurrent ? 'text-gold-400' : 'text-ink-400',
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </div>
              <div className="mt-3 text-center space-y-1">
                <p
                  className={cn(
                    'text-sm font-semibold transition-colors duration-300',
                    isCompleted && 'text-gold-300',
                    isCurrent && 'text-ink-50',
                    !isCompleted && !isCurrent && 'text-ink-400',
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-ink-400 leading-relaxed max-w-[140px] mx-auto">
                    {step.description}
                  </p>
                )}
              </div>
              {isCurrent && (
                <Circle
                  className="w-2 h-2 mt-2 text-gold-500 fill-gold-500 animate-ping"
                  strokeWidth={0}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { Stepper };
