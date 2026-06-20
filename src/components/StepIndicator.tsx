import React from 'react';
import { Check, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  label: string;
  icon?: LucideIcon;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: {
    icon: 'w-6 h-6',
    iconInner: 'w-3 h-3',
    line: 'h-1',
    text: 'text-xs',
  },
  md: {
    icon: 'w-10 h-10',
    iconInner: 'w-5 h-5',
    line: 'h-1',
    text: 'text-sm',
  },
  lg: {
    icon: 'w-12 h-12',
    iconInner: 'w-6 h-6',
    line: 'h-1.5',
    text: 'text-base',
  },
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  variant = 'horizontal',
  size = 'md',
  className,
}) => {
  const sizes = sizeClasses[size];

  if (variant === 'vertical') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const Icon = step.icon;

          return (
            <div key={index} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full transition-all duration-300',
                    sizes.icon,
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-primary text-white ring-4 ring-primary/20 animate-pulse-slow'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {isCompleted ? (
                    <Check className={sizes.iconInner} />
                  ) : Icon ? (
                    <Icon className={sizes.iconInner} />
                  ) : (
                    <span className={cn('font-bold', sizes.text)}>{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-1 flex-1 my-2 transition-colors duration-300',
                      index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
              <div className="pt-2 pb-6">
                <p
                  className={cn(
                    'font-medium transition-colors duration-300',
                    sizes.text,
                    isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-between w-full', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const Icon = step.icon;

        return (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div
                className={cn(
                  'flex items-center justify-center rounded-full transition-all duration-300',
                  sizes.icon,
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-primary text-white ring-4 ring-primary/20 animate-pulse-slow'
                    : 'bg-gray-200 text-gray-500'
                )}
              >
                {isCompleted ? (
                  <Check className={sizes.iconInner} />
                ) : Icon ? (
                  <Icon className={sizes.iconInner} />
                ) : (
                  <span className={cn('font-bold', sizes.text)}>{index + 1}</span>
                )}
              </div>
              <p
                className={cn(
                  'font-medium text-center transition-colors duration-300 whitespace-nowrap',
                  sizes.text,
                  isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                )}
              >
                {step.label}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 mx-2 transition-colors duration-300 rounded-full',
                  sizes.line,
                  index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;
