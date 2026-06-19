import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ChevronDown, ChevronUp, Mic } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { Interview } from '@shared/types';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const avatarColors = [
  { bg: 'from-emerald-400 to-teal-500' },
  { bg: 'from-violet-400 to-purple-500' },
  { bg: 'from-amber-400 to-orange-500' },
];

const PRACTITIONER_DEFAULTS = [
  { years: 6, city: '北京', level: '资深前端工程师', tags: ['转行建议', '加班情况', '薪资真相', '入行建议'], coreInsights: [{ text: '基础永远是最重要的，框架会变，但HTML/CSS/JS不会', highlight: true }, { text: '第一份工作尽量选大厂，培训体系完善', highlight: true }, { text: '沟通能力比技术能力更决定你的天花板', highlight: true }] },
  { years: 4, city: '上海', level: '高级前端工程师', tags: ['学习方法', '项目实战', '面试技巧'], coreInsights: [{ text: '做项目时要思考为什么这么做，而不只是怎么做', highlight: true }, { text: '简历用STAR法则，量化成果，不要写形容词', highlight: true }] },
  { years: 8, city: '深圳', level: '前端架构师', tags: ['架构设计', '技术管理', '职业规划'], coreInsights: [{ text: '架构师不是头衔，而是一种思维方式：全局视角', highlight: true }, { text: '技术选型永远看业务场景，不要追热点', highlight: true }] },
];

function WaveformBars({ isPlaying }: { isPlaying: boolean }) {
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: 12 }, () => Math.random() * 24 + 8)
  );

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setHeights(Array.from({ length: 12 }, () => Math.random() * 28 + 6));
    }, 150);
    return () => window.clearInterval(id);
  }, [isPlaying]);

  return (
    <div className="flex items-center gap-[3px] h-10">
      {heights.map((h, i) => (
        <motion.div
          key={i}
          animate={{ height: isPlaying ? h : 8 }}
          transition={{ duration: isPlaying ? 0.12 : 0.3, ease: 'easeOut' }}
          className={`w-[3px] rounded-full ${isPlaying ? 'bg-emerald-500' : 'bg-slate-300'}`}
          style={{ minHeight: 4 }}
        />
      ))}
    </div>
  );
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface PractitionerCardProps {
  interview: Interview;
  idx: number;
}

function PractitionerCard({ interview, idx }: PractitionerCardProps) {
  const defaults = PRACTITIONER_DEFAULTS[idx % PRACTITIONER_DEFAULTS.length];
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  const timerRef = useRef<number | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const duration = interview.durationSeconds || (idx === 0 ? 1475 : idx === 1 ? 1100 : 1930);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setProgress((prev) => {
          const next = prev + playbackSpeed;
          if (next >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 1000);
    } else if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, duration]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    setProgress(pct * duration);
  }, [duration]);

  const colorClass = avatarColors[idx % avatarColors.length];
  const nameChar = interview.intervieweeName?.[0] || '访';
  const insights = defaults.coreInsights;
  const tags = interview.tags?.length > 0 ? interview.tags : defaults.tags;

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="glass-card rounded-2xl p-5 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${colorClass.bg} ring-4 ring-white flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0`}>
          {nameChar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-slate-800">{interview.intervieweeName}</span>
            <Badge variant="emerald" size="sm">{interview.currentLevel || defaults.level}</Badge>
          </div>
          <p className="text-xs text-slate-500">{defaults.city} · {interview.yearsOfExperience || defaults.years}年经验</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-200/50 flex-shrink-0 hover:bg-emerald-600 transition-colors"
        >
          {isPlaying ? <Pause className="w-4 h-4" fill="white" /> : <Play className="w-4 h-4 ml-0.5" fill="white" />}
        </motion.button>
        <WaveformBars isPlaying={isPlaying} />
        <div className="flex items-center gap-1">
          {[1, 1.5, 2].map((s) => (
            <button
              key={s}
              onClick={() => setPlaybackSpeed(s)}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                playbackSpeed === s ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="relative h-1.5 bg-slate-200 rounded-full cursor-pointer group"
        >
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
            style={{ width: `${(progress / duration) * 100}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-emerald-500 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${(progress / duration) * 100}%`, transform: `translate(-50%, -50%)` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-slate-400">{formatTime(progress)}</span>
          <span className="text-xs text-slate-400">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="emerald" size="sm">{tag}</Badge>
        ))}
      </div>

      {insights.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {insights.map((insight, i) => (
            <div
              key={i}
              className={`text-xs px-3 py-2 rounded-lg ${
                insight.highlight
                  ? 'bg-emerald-50 text-emerald-800 font-medium border border-emerald-100'
                  : 'text-slate-600'
              }`}
            >
              💡 {insight.text}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 transition-colors"
      >
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {isExpanded ? '收起文字稿' : '展开完整文字稿'}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-4 bg-slate-50 rounded-xl text-sm text-slate-700 leading-relaxed">
              {interview.transcript || '访谈文字稿加载中...'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface Props {
  interviews: Interview[];
  jobName: string;
}

export default function InterviewAudioSection({ interviews, jobName }: Props) {
  const displayInterviews = interviews.length > 0
    ? interviews
    : PRACTITIONER_DEFAULTS.map((p, i) => ({
        id: `p-default-${i}`,
        jobName,
        intervieweeName: ['张明', '李慧', '王强'][i],
        yearsOfExperience: p.years,
        currentLevel: p.level,
        audioUrl: '',
        durationSeconds: i === 0 ? 1475 : i === 1 ? 1100 : 1930,
        transcript: [
          '大家好，我做前端已经很多年了。很多同学问我这个行业是不是饱和了，我觉得不是饱和了，而是低端产能过剩，高端人才永远稀缺。',
          '转行最大的障碍不是技术而是心理落差。我当年从测试转行的时候，薪资直接打7折，但是坚持下来之后发现是值得的。',
          '最重要的一点是：不要只写业务代码，要多关注工程化和性能优化，这些才是你的核心竞争力。',
        ][i],
        keyInsights: p.coreInsights.filter((c) => c.highlight).map((c) => c.text),
        tags: p.tags,
      }));

  return (
    <motion.section id="interviews" variants={fadeInUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200/50">
          <Mic className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-heading text-2xl font-bold text-slate-900">从业者访谈</h2>
          <p className="text-sm text-slate-500">听听过来人的真实声音</p>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-emerald-300/50 to-transparent ml-4" />
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {displayInterviews.map((interview, idx) => (
          <PractitionerCard key={interview.id} interview={interview} idx={idx} />
        ))}
      </div>
    </motion.section>
  );
}
