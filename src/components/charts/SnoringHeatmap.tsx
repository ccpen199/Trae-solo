import React, { useMemo } from 'react';
import type { SnoringMetrics } from '@/types';
import { cn, formatDuration } from '@/lib/utils';

interface SnoringHeatmapProps {
  metrics: SnoringMetrics;
  className?: string;
}

export default function SnoringHeatmap({
  metrics,
  className,
}: SnoringHeatmapProps) {
  const heatmap = metrics.spectrumHeatmap;
  const freqBins = heatmap.length;
  const timeBins = heatmap[0]?.length || 0;

  const maxValue = useMemo(() => {
    let max = 0;
    for (const row of heatmap) {
      for (const v of row) {
        max = Math.max(max, v);
      }
    }
    return max || 1;
  }, [heatmap]);

  const getColor = (value: number) => {
    const normalized = Math.min(value / maxValue, 1);
    if (normalized < 0.1) return 'rgba(109, 130, 201, 0.1)';
    if (normalized < 0.25) return 'rgba(109, 130, 201, 0.3)';
    if (normalized < 0.4) return 'rgba(155, 126, 219, 0.5)';
    if (normalized < 0.6) return 'rgba(255, 107, 107, 0.6)';
    if (normalized < 0.8) return 'rgba(255, 107, 107, 0.8)';
    return 'rgba(255, 184, 184, 1)';
  };

  const cellWidth = 100 / timeBins;
  const cellHeight = 100 / freqBins;

  const freqLabels = useMemo(() => {
    const labels = [];
    for (let i = 0; i < freqBins; i += Math.ceil(freqBins / 6)) {
      labels.push({
        index: i,
        label: `${Math.round((i / freqBins) * 500)}Hz`,
      });
    }
    return labels;
  }, [freqBins]);

  const timeLabels = useMemo(() => {
    const labels = [];
    const step = Math.ceil(timeBins / 6);
    for (let i = 0; i < timeBins; i += step) {
      const totalSeconds = (i / timeBins) * 8 * 3600;
      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      labels.push({
        index: i,
        label: `${hrs}:${mins.toString().padStart(2, '0')}`,
      });
    }
    return labels;
  }, [timeBins]);

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-white">鼾声频谱热力图</div>
          <div className="text-xs text-silver-400">整晚打鼾能量分布</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-mono font-semibold text-coral-300">
            {metrics.totalEpisodes}
            <span className="ml-1 text-sm font-normal text-silver-400">次</span>
          </div>
          <div className="text-xs text-silver-500">
            累计 {formatDuration(metrics.totalDuration)}
          </div>
        </div>
      </div>

      <div className="flex">
        <div className="mr-2 flex flex-col justify-between py-1">
          {freqLabels.map((item, i) => (
            <span
              key={i}
              className="text-[10px] font-mono text-silver-500"
              style={{ transform: 'translateY(50%)' }}
            >
              {item.label}
            </span>
          ))}
        </div>

        <div className="flex-1">
          <div
            className="relative w-full overflow-hidden rounded-xl bg-night-800/50"
            style={{ aspectRatio: `${timeBins}/${freqBins}` }}
          >
            {heatmap.map((row, freqIndex) =>
              row.map((value, timeIndex) => (
                <div
                  key={`${freqIndex}-${timeIndex}`}
                  className="absolute transition-colors duration-200"
                  style={{
                    left: `${timeIndex * cellWidth}%`,
                    top: `${freqIndex * cellHeight}%`,
                    width: `${cellWidth + 0.5}%`,
                    height: `${cellHeight + 0.5}%`,
                    backgroundColor: getColor(value),
                  }}
                  title={`${Math.round((value / maxValue) * 100)}% 能量`}
                />
              ))
            )}
          </div>

          <div className="mt-1 flex justify-between px-1">
            {timeLabels.map((item, i) => (
              <span
                key={i}
                className="text-[10px] font-mono text-silver-500"
              >
                {item.label}
              </span>
            ))}
          </div>

          <div className="mt-2 text-center text-[10px] text-silver-500">
            时间 →
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-silver-400">能量</span>
          <div className="flex h-3 w-32 overflow-hidden rounded-full">
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((v, i) => (
              <div
                key={i}
                className="flex-1"
                style={{ backgroundColor: getColor(v) }}
              />
            ))}
          </div>
          <span className="text-xs text-silver-400">高</span>
        </div>

        <div className="text-xs text-silver-400">
          平均响度：
          <span className="font-mono text-coral-300">
            {metrics.avgLoudness} dB
          </span>
        </div>
      </div>

      {metrics.frequencyBands.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-xs text-silver-400">频段能量分布</div>
          {metrics.frequencyBands.map((band, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-20 flex-shrink-0 text-[11px] font-mono text-silver-400">
                {band.band}
              </span>
              <div className="flex-1 h-2 overflow-hidden rounded-full bg-night-700">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${band.energy * 100}%`,
                    background: `linear-gradient(90deg, #6D82C9, #9B7EDB, #FF6B6B)`,
                    opacity: 0.6 + band.energy * 0.4,
                  }}
                />
              </div>
              <span className="w-10 text-right text-[11px] font-mono text-silver-300">
                {Math.round(band.energy * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
