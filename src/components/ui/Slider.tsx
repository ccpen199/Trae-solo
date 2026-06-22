import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ min = 0, max = 100, step = 1, value, defaultValue = 0, onChange, onChangeEnd, disabled = false, className }, ref) => {
    const [internalValue, setInternalValue] = React.useState(value ?? defaultValue);
    const sliderRef = React.useRef<HTMLDivElement>(null);
    const isDragging = React.useRef(false);

    const currentValue = value ?? internalValue;

    const percentage = React.useMemo(() => {
      return ((currentValue - min) / (max - min)) * 100;
    }, [currentValue, min, max]);

    const updateValue = React.useCallback((clientX: number) => {
      if (!sliderRef.current || disabled) return;

      const rect = sliderRef.current.getBoundingClientRect();
      let newValue = ((clientX - rect.left) / rect.width) * (max - min) + min;

      if (step > 0) {
        newValue = Math.round(newValue / step) * step;
      }

      newValue = Math.max(min, Math.min(max, newValue));

      if (value === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    }, [min, max, step, disabled, value, onChange]);

    const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
      if (disabled) return;
      isDragging.current = true;
      updateValue(e.clientX);
    }, [disabled, updateValue]);

    const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
      if (disabled) return;
      isDragging.current = true;
      updateValue(e.touches[0].clientX);
    }, [disabled, updateValue]);

    React.useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        updateValue(e.clientX);
      };

      const handleMouseUp = () => {
        if (isDragging.current) {
          isDragging.current = false;
          onChangeEnd?.(currentValue);
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging.current) return;
        updateValue(e.touches[0].clientX);
      };

      const handleTouchEnd = () => {
        if (isDragging.current) {
          isDragging.current = false;
          onChangeEnd?.(currentValue);
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }, [updateValue, onChangeEnd, currentValue]);

    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full h-10 flex items-center',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <div
          ref={sliderRef}
          className="relative w-full h-2 bg-paper-200 rounded-full cursor-pointer"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div
            className="absolute h-full bg-gradient-brand rounded-full transition-all duration-75"
            style={{ width: `${percentage}%` }}
          />

          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
              'w-5 h-5 bg-white rounded-full shadow-medium border-2 border-brand-500',
              'transition-transform duration-150 hover:scale-110 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2',
              disabled && 'cursor-not-allowed hover:scale-100'
            )}
            style={{ left: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export interface RangeSliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: [number, number];
  defaultValue?: [number, number];
  onChange?: (value: [number, number]) => void;
  onChangeEnd?: (value: [number, number]) => void;
  disabled?: boolean;
  className?: string;
}

const RangeSlider = React.forwardRef<HTMLDivElement, RangeSliderProps>(
  ({ min = 0, max = 100, step = 1, value, defaultValue = [25, 75], onChange, onChangeEnd, disabled = false, className }, ref) => {
    const [internalValue, setInternalValue] = React.useState<[number, number]>(value ?? defaultValue);
    const sliderRef = React.useRef<HTMLDivElement>(null);
    const activeThumb = React.useRef<'min' | 'max' | null>(null);

    const currentValue = value ?? internalValue;
    const [minVal, maxVal] = currentValue;

    const minPercentage = React.useMemo(() => {
      return ((minVal - min) / (max - min)) * 100;
    }, [minVal, min, max]);

    const maxPercentage = React.useMemo(() => {
      return ((maxVal - min) / (max - min)) * 100;
    }, [maxVal, min, max]);

    const getValueFromPosition = React.useCallback((clientX: number): number => {
      if (!sliderRef.current) return min;

      const rect = sliderRef.current.getBoundingClientRect();
      let newValue = ((clientX - rect.left) / rect.width) * (max - min) + min;

      if (step > 0) {
        newValue = Math.round(newValue / step) * step;
      }

      return Math.max(min, Math.min(max, newValue));
    }, [min, max, step]);

    const updateValue = React.useCallback((clientX: number) => {
      if (!activeThumb.current || disabled) return;

      const newValue = getValueFromPosition(clientX);
      let newMinVal = minVal;
      let newMaxVal = maxVal;

      if (activeThumb.current === 'min') {
        newMinVal = Math.min(newValue, maxVal - step);
      } else {
        newMaxVal = Math.max(newValue, minVal + step);
      }

      const tuple: [number, number] = [newMinVal, newMaxVal];

      if (value === undefined) {
        setInternalValue(tuple);
      }
      onChange?.(tuple);
    }, [disabled, minVal, maxVal, step, getValueFromPosition, value, onChange]);

    const handleMouseDown = React.useCallback((thumb: 'min' | 'max') => (e: React.MouseEvent) => {
      if (disabled) return;
      e.stopPropagation();
      activeThumb.current = thumb;
    }, [disabled]);

    const handleTouchStart = React.useCallback((thumb: 'min' | 'max') => (e: React.TouchEvent) => {
      if (disabled) return;
      e.stopPropagation();
      activeThumb.current = thumb;
    }, [disabled]);

    React.useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (!activeThumb.current) return;
        updateValue(e.clientX);
      };

      const handleMouseUp = () => {
        if (activeThumb.current) {
          activeThumb.current = null;
          onChangeEnd?.(currentValue);
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!activeThumb.current) return;
        updateValue(e.touches[0].clientX);
      };

      const handleTouchEnd = () => {
        if (activeThumb.current) {
          activeThumb.current = null;
          onChangeEnd?.(currentValue);
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }, [updateValue, onChangeEnd, currentValue]);

    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full h-10 flex items-center',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <div
          ref={sliderRef}
          className="relative w-full h-2 bg-paper-200 rounded-full cursor-pointer"
        >
          <div
            className="absolute h-full bg-gradient-brand rounded-full"
            style={{
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`,
            }}
          />

          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10',
              'w-5 h-5 bg-white rounded-full shadow-medium border-2 border-brand-500',
              'transition-transform duration-150 hover:scale-110 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2',
              disabled && 'cursor-not-allowed hover:scale-100'
            )}
            style={{ left: `${minPercentage}%` }}
            onMouseDown={handleMouseDown('min')}
            onTouchStart={handleTouchStart('min')}
          />

          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10',
              'w-5 h-5 bg-white rounded-full shadow-medium border-2 border-brand-500',
              'transition-transform duration-150 hover:scale-110 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2',
              disabled && 'cursor-not-allowed hover:scale-100'
            )}
            style={{ left: `${maxPercentage}%` }}
            onMouseDown={handleMouseDown('max')}
            onTouchStart={handleTouchStart('max')}
          />
        </div>
      </div>
    );
  }
);

RangeSlider.displayName = 'RangeSlider';

export { Slider, RangeSlider };
