import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface KeywordItem {
  text: string;
  value: number;
}

interface KeywordCloudProps {
  data: KeywordItem[];
  maxSize?: number;
  minSize?: number;
}

export default function KeywordCloud({ data, maxSize = 32, minSize = 12 }: KeywordCloudProps) {
  const sizedData = useMemo(() => {
    if (!data.length) return [];
    const max = Math.max(...data.map((d) => d.value));
    const min = Math.min(...data.map((d) => d.value));
    const range = max - min || 1;
    const colorPalette = [
      'text-secondary-600',
      'text-secondary-500',
      'text-secondary-700',
      'text-primary-500',
      'text-primary-600',
      'text-secondary-400',
      'text-secondary-800',
    ];
    return data.map((item, index) => {
      const ratio = (item.value - min) / range;
      const fontSize = minSize + ratio * (maxSize - minSize);
      const opacity = 0.6 + ratio * 0.4;
      return {
        ...item,
        fontSize,
        opacity,
        colorClass: colorPalette[index % colorPalette.length],
        fontWeight: ratio > 0.6 ? 700 : ratio > 0.3 ? 500 : 400,
      };
    });
  }, [data, maxSize, minSize]);

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 p-4">
      {sizedData.map((item, index) => (
        <span
          key={item.text + index}
          className={cn(
            'cursor-pointer hover:scale-110 transition-transform duration-200 select-none',
            item.colorClass
          )}
          style={{
            fontSize: `${item.fontSize}px`,
            opacity: item.opacity,
            fontWeight: item.fontWeight,
          }}
          title={`${item.text}: ${item.value}`}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
}
