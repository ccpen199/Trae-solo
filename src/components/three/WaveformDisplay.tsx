interface WaveformDisplayProps {
  waveform: number[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export default function WaveformDisplay({ waveform, currentTime, duration }: WaveformDisplayProps) {
  const sampled = waveform.filter((_, i) => i % 4 === 0);
  const progress = duration > 0 ? currentTime / duration : 0;
  const playedIndex = Math.floor(progress * sampled.length);

  return (
    <div className="flex items-end gap-px h-full w-full">
      {sampled.map((value, index) => {
        const isPlayed = index <= playedIndex;
        return (
          <div
            key={index}
            className="flex-shrink-0 rounded-sm transition-colors duration-150"
            style={{
              height: `${Math.max(4, value * 100)}%`,
              width: sampled.length > 100 ? '2px' : '3px',
              backgroundColor: isPlayed ? '#D97706' : '#4B5563',
              minHeight: '2px',
            }}
          />
        );
      })}
    </div>
  );
}
