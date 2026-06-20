import { cn } from '@/lib/utils';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  fullScreen?: boolean;
  className?: string;
  text?: string;
}

const sizeConfig: Record<SpinnerSize, number> = {
  sm: 20,
  md: 36,
  lg: 56,
};

const LoadingSpinner = ({ size = 'md', fullScreen = false, className, text }: LoadingSpinnerProps) => {
  const spinnerSize = sizeConfig[size];
  const strokeWidth = spinnerSize / 8;
  const radius = (spinnerSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
        <SpinnerInner
          size={spinnerSize}
          strokeWidth={strokeWidth}
          radius={radius}
          circumference={circumference}
        />
        {text && <p className="mt-4 text-neutral-600 font-medium">{text}</p>}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <SpinnerInner
        size={spinnerSize}
        strokeWidth={strokeWidth}
        radius={radius}
        circumference={circumference}
      />
      {text && <p className="mt-2 text-sm text-neutral-500">{text}</p>}
    </div>
  );
};

interface SpinnerInnerProps {
  size: number;
  strokeWidth: number;
  radius: number;
  circumference: number;
}

const SpinnerInner = ({ size, strokeWidth, radius, circumference }: SpinnerInnerProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="animate-spin"
      style={{ animationDuration: '1s' }}
    >
      <defs>
        <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A5F" />
          <stop offset="50%" stopColor="#4ECDC4" />
          <stop offset="100%" stopColor="#FF6B6B" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E9ECEF"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#spinnerGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * 0.75}
      />
    </svg>
  );
};

export { LoadingSpinner };
export type { LoadingSpinnerProps, SpinnerSize };
