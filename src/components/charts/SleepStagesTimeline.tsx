import React, { useState } from 'react';
import type { SleepStage } from '@/types';
import { cn, formatDuration, stageColor, stageLabel, dayjs } from '@/lib/utils';

interface SleepStagesTimelineProps {
  stages: SleepStage[];
  startTime?: string;
  className?: string;
  onStageClick?: (stage: SleepStage, index: number) => void;
}

export default function SleepStagesTimeline({
  stages,
  startTime,
  className,
  onStageClick,
}: SleepStagesTimelineProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalDuration = stages.reduce((sum, s) => sum + s.duration, 0);

  const handleStageClick = (stage: SleepStage, index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);
    onStageClick?.(stage, index);
  };

  const formatTimeLabel = (secondsFromStart: number) => {
    if (startTime) {
      return dayjs(startTime).add(secondsFromStart, 'second').format('HH:mm');
    }
    const hrs = Math.floor(secondsFromStart / 3600);
    const mins = Math.floor((secondsFromStart % 3600) / 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const timeTicks = [];
  const tickInterval = Math.ceil(totalDuration / 3600) > 6 ? 3600 : 1800;
  for (let t = 0; t <= totalDuration; t += tickInterval) {
    timeTicks.push(t);
  }
  if (timeTicks[timeTicks.length - 1] < totalDuration) {
    timeTicks.push(totalDuration);
  }

  const selectedStage = selectedIndex !== null ? stages[selectedIndex] : null;

  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-20 w-full overflow-hidden rounded-2xl bg-night-800/50">
        <div className="flex h-full w-full">
          {stages.map((stage, index) => {
            const widthPercent = (stage.duration / totalDuration) * 100;
            const isSelected = selectedIndex === index;
            const isHovered = hoveredIndex === index;
            return (
              <button
                key={index}
                onClick={() => handleStageClick(stage, index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  'h-full transition-all duration-200 cursor-pointer relative',
                  isSelected && 'ring-2 ring-white/30 ring-inset z-10',
                  isHovered && 'brightness-110'
                )}
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: stageColor(stage.stage),
                  minWidth: '2px',
                }}
              >
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 z-20 -translate-x-1/2 -translate-y-2 whitespace-nowrap rounded-lg bg-night-900/95 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur-sm">
                    <div className="font-medium">{stageLabel(stage.stage)}</div>
                    <div className="text-silver-300">{formatDuration(stage.duration)}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mt-2 h-6">
        {timeTicks.map((tick, index) => (
          <div
            key={index}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${(tick / totalDuration) * 100}%` }}
          >
            <div className="h-2 w-px bg-silver-500/30" />
            <span className="mt-1 text-[10px] font-mono text-silver-400">
              {formatTimeLabel(tick)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        {(['deep', 'rem', 'light', 'awake'] as const).map((s) => {
          const stageTotal = stages
            .filter((st) => st.stage === s)
            .reduce((sum, st) => sum + st.duration, 0);
          const percent = totalDuration > 0 ? stageTotal / totalDuration : 0;
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: stageColor(s) }}
              />
              <span className="text-xs text-silver-300">
                {stageLabel(s)}
              </span>
              <span className="text-xs font-mono text-silver-400">
                {Math.round(percent * 100)}%
              </span>
            </div>
          );
        })}
      </div>

      {selectedStage && (
        <div className="mt-4 rounded-xl border border-white/5 bg-night-800/50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <div
              className="h-4 w-4 rounded"
              style={{ backgroundColor: stageColor(selectedStage.stage) }}
            />
            <span className="font-medium text-white">
              {stageLabel(selectedStage.stage)}
            </span>
            <span className="text-sm text-silver-400">详情</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-silver-400">持续时间</div>
              <div className="font-mono text-white">{formatDuration(selectedStage.duration)}</div>
            </div>
            <div>
              <div className="text-silver-400">开始时间</div>
              <div className="font-mono text-white">
                {formatTimeLabel(selectedStage.startTime)}
              </div>
            </div>
            <div>
              <div className="text-silver-400">置信度</div>
              <div className="font-mono text-white">
                {Math.round(selectedStage.confidence * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
