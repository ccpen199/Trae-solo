import { useMemo, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { useAREditorStore } from '@/store/useAREditorStore';
import WaveformDisplay from './WaveformDisplay';
import type { TimelineSegment } from '@/types';

const TRACK_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  audio: { label: '音频', color: 'text-green-400', bgColor: 'bg-green-900/40' },
  'model-animation': { label: '动画', color: 'text-blue-400', bgColor: 'bg-blue-900/40' },
  interaction: { label: '互动', color: 'text-amber-400', bgColor: 'bg-amber-900/40' },
  image: { label: '图片', color: 'text-purple-400', bgColor: 'bg-purple-900/40' },
};

function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  return `${s}s`;
}

function TimelineRuler({ totalDuration }: { totalDuration: number }) {
  const ticks = useMemo(() => {
    const step = totalDuration <= 30 ? 5 : 10;
    const result: number[] = [];
    for (let t = 0; t <= totalDuration; t += step) {
      result.push(t);
    }
    return result;
  }, [totalDuration]);

  return (
    <div className="relative h-6 border-b border-[var(--border)] flex items-end">
      {ticks.map((t) => (
        <div
          key={t}
          className="absolute bottom-0 flex flex-col items-center"
          style={{ left: `${(t / totalDuration) * 100}%` }}
        >
          <span className="text-[10px] text-[var(--text-muted)] leading-none mb-0.5">
            {formatTime(t)}
          </span>
          <div className="w-px h-2 bg-[var(--border)]" />
        </div>
      ))}
    </div>
  );
}

function SegmentBlock({
  segment,
  totalDuration,
  isSelected,
  onClick,
}: {
  segment: TimelineSegment;
  totalDuration: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const config = TRACK_CONFIG[segment.type];
  if (!config) return null;

  const left = (segment.startTime / totalDuration) * 100;
  const width = ((segment.endTime - segment.startTime) / totalDuration) * 100;

  return (
    <div
      className={`absolute top-1 bottom-1 rounded cursor-pointer transition-all ${config.bgColor} ${
        isSelected ? 'ring-2 ring-amber-400' : 'hover:brightness-125'
      }`}
      style={{ left: `${left}%`, width: `${width}%` }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <span className={`text-[10px] px-1 truncate block ${config.color}`}>
        {segment.label || config.label}
      </span>
    </div>
  );
}

function AudioTrackRow({
  totalDuration,
  currentTime,
  isPlaying,
  waveform,
}: {
  totalDuration: number;
  currentTime: number;
  isPlaying: boolean;
  waveform: number[];
}) {
  return (
    <div className="relative h-10 border-b border-[var(--border)]/30">
      <div className="absolute inset-0 px-1 py-1">
        <WaveformDisplay
          waveform={waveform}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={totalDuration}
        />
      </div>
    </div>
  );
}

function TrackRow({
  label,
  color,
  bgColor,
  segments,
  totalDuration,
  selectedSegmentId,
  onSelectSegment,
  children,
}: {
  label: string;
  color: string;
  bgColor: string;
  segments: TimelineSegment[];
  totalDuration: number;
  selectedSegmentId: string | null;
  onSelectSegment: (id: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex">
      <div className={`w-16 flex-shrink-0 flex items-center justify-center text-[10px] font-medium border-r border-b border-[var(--border)]/30 ${color} ${bgColor}`}>
        {label}
      </div>
      <div className="flex-1 relative">
        {segments.map((seg) => (
          <SegmentBlock
            key={seg.id}
            segment={seg}
            totalDuration={totalDuration}
            isSelected={selectedSegmentId === seg.id}
            onClick={() => onSelectSegment(seg.id)}
          />
        ))}
        {children}
      </div>
    </div>
  );
}

export default function TimelineEditor() {
  const {
    currentContent,
    selectedTimelineSegment,
    isPlaying,
    currentTime,
    totalDuration,
    selectSegment,
    togglePlay,
    setCurrentTime,
  } = useAREditorStore();

  const timeline = currentContent?.timeline ?? [];
  const audioTracks = currentContent?.audioTracks ?? [];

  const groupedSegments = useMemo(() => {
    const groups: Record<string, TimelineSegment[]> = {
      audio: [],
      'model-animation': [],
      interaction: [],
      image: [],
    };
    timeline.forEach((seg) => {
      if (groups[seg.type]) {
        groups[seg.type].push(seg);
      }
    });
    return groups;
  }, [timeline]);

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      setCurrentTime(ratio * totalDuration);
    },
    [totalDuration, setCurrentTime],
  );

  if (!currentContent) {
    return (
      <div className="w-full h-full bg-[var(--bg-secondary)] rounded-lg flex items-center justify-center text-[var(--text-muted)]">
        暂无时间轴数据
      </div>
    );
  }

  const cursorLeft = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="w-full h-full bg-[var(--bg-secondary)] rounded-lg flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--border)]">
        <button
          onClick={togglePlay}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-600 hover:bg-amber-500 transition-colors text-white"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <div className="flex-1 text-sm text-[var(--text-secondary)]">
          <span className="text-amber-400 font-mono">{currentTime.toFixed(1)}s</span>
          <span className="mx-2">/</span>
          <span className="font-mono">{totalDuration.toFixed(1)}s</span>
        </div>
        <div className="w-32 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-600 rounded-full transition-[width] duration-100"
            style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex">
          <div className="w-16 flex-shrink-0" />
          <div className="flex-1">
            <TimelineRuler totalDuration={totalDuration} />
          </div>
        </div>

        <div className="relative" onClick={handleTimelineClick}>
          <TrackRow
            label="音频"
            color="text-green-400"
            bgColor="bg-green-900/20"
            segments={groupedSegments.audio}
            totalDuration={totalDuration}
            selectedSegmentId={selectedTimelineSegment}
            onSelectSegment={selectSegment}
          >
            {audioTracks.length > 0 && (
              <AudioTrackRow
                totalDuration={totalDuration}
                currentTime={currentTime}
                isPlaying={isPlaying}
                waveform={audioTracks[0].waveform}
              />
            )}
          </TrackRow>

          <TrackRow
            label="动画"
            color="text-blue-400"
            bgColor="bg-blue-900/20"
            segments={groupedSegments['model-animation']}
            totalDuration={totalDuration}
            selectedSegmentId={selectedTimelineSegment}
            onSelectSegment={selectSegment}
          />

          <TrackRow
            label="互动"
            color="text-amber-400"
            bgColor="bg-amber-900/20"
            segments={groupedSegments.interaction}
            totalDuration={totalDuration}
            selectedSegmentId={selectedTimelineSegment}
            onSelectSegment={selectSegment}
          />

          <TrackRow
            label="图片"
            color="text-purple-400"
            bgColor="bg-purple-900/20"
            segments={groupedSegments.image}
            totalDuration={totalDuration}
            selectedSegmentId={selectedTimelineSegment}
            onSelectSegment={selectSegment}
          />

          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-20 pointer-events-none"
            style={{ left: `${cursorLeft}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-amber-500 rotate-45 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
