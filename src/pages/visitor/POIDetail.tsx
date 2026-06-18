import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, Share2, Copy } from 'lucide-react';
import { useScenicStore } from '@/store/useScenicStore';
import { getARContentByPOI } from '@/services/api';
import { formatDuration } from '@/utils/waveform';
import type { ARContent, InteractionNode, HistoryImage } from '@/types';

function WaveformBars({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-center gap-[3px] h-8">
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full bg-amber-600 ${playing ? 'animate-pulse' : ''}`}
          style={{
            height: `${16 + Math.sin(i * 0.7) * 20 + Math.random() * 14}%`,
            animationDelay: `${i * 60}ms`,
            animationDuration: `${600 + i * 30}ms`,
          }}
        />
      ))}
    </div>
  );
}

function AudioSection({ arContent }: { arContent: ARContent | undefined }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [langIdx, setLangIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tracks = arContent?.audioTracks ?? [];
  const currentTrack = tracks[langIdx];
  const duration = currentTrack?.duration ?? 0;

  useEffect(() => {
    if (playing && duration > 0) {
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= duration) {
            setPlaying(false);
            return duration;
          }
          return p + 0.5;
        });
      }, 500);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, duration]);

  const langLabels: Record<string, string> = { 'zh-CN': '中文', 'en-US': 'English', 'ja-JP': '日本語' };

  return (
    <div className="px-5 py-4">
      <h2 className="text-base font-semibold mb-3">语音讲解</h2>
      <div className="flex items-center gap-4">
        <button
          onClick={() => setPlaying(!playing)}
          className="w-11 h-11 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0"
        >
          {playing ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <WaveformBars playing={playing} />
          <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-amber-600 rounded-full transition-all duration-300"
              style={{ width: duration > 0 ? `${(progress / duration) * 100}%` : '0%' }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>{formatDuration(progress)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>
      </div>
      {tracks.length > 1 && (
        <div className="flex gap-2 mt-3">
          {tracks.map((t, i) => (
            <button
              key={t.id}
              onClick={() => { setLangIdx(i); setProgress(0); setPlaying(false); }}
              className={`px-3 py-1 rounded-full text-xs ${
                i === langIdx ? 'bg-amber-600 text-white' : 'bg-white/5 text-gray-400'
              }`}
            >
              {langLabels[t.language] || t.language}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HistorySection({ images }: { images: HistoryImage[] }) {
  if (images.length === 0) return null;
  return (
    <div className="py-4">
      <h2 className="text-base font-semibold px-5 mb-3">历史影像</h2>
      <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-none">
        {images.map((img) => (
          <div key={img.id} className="flex-shrink-0 w-44">
            <img src={img.url} alt={img.caption} className="w-44 h-28 object-cover rounded-xl" />
            <p className="text-xs text-amber-500 mt-1.5 font-mono">{img.year}年</p>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{img.caption}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizSection({ interaction }: { interaction: InteractionNode }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="px-5 py-4">
      <h2 className="text-base font-semibold mb-3">互动问答</h2>
      <p className="text-sm text-gray-300 mb-3">{interaction.question}</p>
      <div className="space-y-2">
        {interaction.options?.map((opt, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
              selected === null
                ? 'bg-white/5 hover:bg-white/10'
                : i === selected
                ? opt.correct
                  ? 'bg-emerald-500/20 border border-emerald-500/50'
                  : 'bg-red-500/20 border border-red-500/50'
                : opt.correct
                ? 'bg-emerald-500/20 border border-emerald-500/50'
                : 'bg-white/5'
            }`}
          >
            {opt.text}
            {selected !== null && i === selected && (
              <span className="ml-2">{opt.correct ? '✓' : '✗'}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function POIDetail() {
  const { poiId } = useParams<{ poiId: string }>();
  const navigate = useNavigate();
  const { pois } = useScenicStore();
  const [arContent, setArContent] = useState<ARContent | undefined>();

  const poi = pois.find((p) => p.id === poiId);

  useEffect(() => {
    if (!poiId) return;
    const content = getARContentByPOI(poiId);
    setArContent(content);
  }, [poiId]);

  const quizInteraction = arContent?.interactions?.find((n) => n.type === 'quiz');

  return (
    <div className="min-h-screen bg-[#0F1120] text-white">
      <div className="relative h-64 overflow-hidden">
        <img
          src={poi?.images?.[0] || `https://picsum.photos/seed/${poiId}/800/400`}
          alt={poi?.name || '景点'}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0F1120]" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full glass flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-5 -mt-8 relative z-10">
          <h1 className="font-serif text-2xl font-bold">{poi?.name || '景点详情'}</h1>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">{poi?.description}</p>
        </div>

        <div className="h-px bg-white/5 my-2" />

        {arContent && <AudioSection arContent={arContent} />}

        <div className="h-px bg-white/5 my-2" />

        {arContent?.historyImages && arContent.historyImages.length > 0 && (
          <>
            <HistorySection images={arContent.historyImages} />
            <div className="h-px bg-white/5 my-2" />
          </>
        )}

        {quizInteraction && (
          <>
            <QuizSection interaction={quizInteraction} />
            <div className="h-px bg-white/5 my-2" />
          </>
        )}

        <div className="px-5 py-5">
          <h2 className="text-base font-semibold mb-3">分享</h2>
          <div className="flex gap-3">
            <button className="flex-1 py-3 rounded-xl bg-emerald-600/20 text-sm text-emerald-400 flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" />
              微信
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              className="flex-1 py-3 rounded-xl bg-white/5 text-sm text-gray-300 flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              复制链接
            </button>
          </div>
        </div>

        <div className="h-10" />
      </motion.div>
    </div>
  );
}
