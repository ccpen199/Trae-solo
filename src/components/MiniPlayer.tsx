import { PlayCircleOutlined, PauseCircleOutlined, StepBackwardOutlined, StepForwardOutlined } from '@ant-design/icons';
import { Slider } from 'antd';
import { usePlayerStore } from '../store/playerStore';

export default function MiniPlayer() {
  const { currentBook, isPlaying, currentTime, duration, togglePlay, setCurrentTime } = usePlayerStore();

  if (!currentBook) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 animate-slide-up">
      <div className="h-1 bg-gray-100">
        <div className="h-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex items-center px-4 py-3">
        <img src={currentBook.cover} alt={currentBook.title} className="w-12 h-12 rounded-lg object-cover shadow-md" />
        <div className="flex-1 ml-3 min-w-0">
          <div className="text-sm font-medium text-gray-800 truncate">{currentBook.title}</div>
          <div className="text-xs text-gray-500">{formatTime(currentTime)} / {formatTime(duration)}</div>
        </div>
        <div className="flex items-center space-x-4">
          <StepBackwardOutlined className="text-xl text-gray-600 cursor-pointer hover:text-orange-500" />
          {isPlaying ? (
            <PauseCircleOutlined 
              className="text-3xl text-orange-500 cursor-pointer" 
              onClick={togglePlay}
            />
          ) : (
            <PlayCircleOutlined 
              className="text-3xl text-orange-500 cursor-pointer" 
              onClick={togglePlay}
            />
          )}
          <StepForwardOutlined className="text-xl text-gray-600 cursor-pointer hover:text-orange-500" />
        </div>
      </div>
      <div className="px-4 pb-2">
        <Slider 
        min={0}
        max={duration || 100}
        value={currentTime}
        onChange={setCurrentTime}
        tooltip={{ formatter: formatTime }}
        />
      </div>
    </div>
  );
}
