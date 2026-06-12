import { useState, useRef, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Activity,
  ChevronDown,
  ChevronUp,
  Ear,
  Volume2,
  Heart,
  AlertTriangle,
  Zap,
  Smile,
  Sparkles,
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import { references, catPhysiology } from '@/data/knowledge';
import { cn } from '@/lib/utils';

type TabKey = 'refs' | 'physiology';

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'refs', label: '参考文献', icon: <BookOpen className="w-4 h-4" /> },
  { key: 'physiology', label: '生理常识图谱', icon: <Activity className="w-4 h-4" /> },
];

const keywordMap: Record<string, 'mint' | 'coral' | 'purple' | 'sky' | 'amber'> = {
  呼噜: 'mint',
  频率: 'sky',
  交流: 'amber',
  行为: 'purple',
  音乐: 'mint',
  压力: 'coral',
  情境: 'purple',
  感知: 'sky',
  共鸣: 'amber',
  声学: 'sky',
  发声: 'amber',
  骨骼: 'mint',
  沟通: 'amber',
};

function extractKeywords(abstract: string): string[] {
  const candidates = Object.keys(keywordMap);
  return candidates.filter((k) => abstract.includes(k));
}

function RefCard({ ref }: { ref: (typeof references)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const keywords = extractKeywords(ref.abstract);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [ref.abstract]);

  return (
    <div className="relative pl-8 pb-8 last:pb-0">
      <div
        className="absolute left-[11px] top-2 bottom-0 w-[2px]"
        style={{
          background:
            'linear-gradient(to bottom, #F59E0B, #D97706, rgba(245,158,11,0.2), transparent)',
        }}
      />
      <div
        className="absolute left-0 top-2 w-6 h-6 rounded-full border-2 border-amber-orange bg-deep-sea-dark flex items-center justify-center z-10"
        style={{ boxShadow: '0 0 12px rgba(245,158,11,0.5)' }}
      >
        <div className="w-2 h-2 rounded-full bg-amber-orange" />
      </div>

      <GlassCard padding="md" hoverable className="group">
        <button
          className="w-full text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <h3 className="font-display text-lg font-bold text-white group-hover:text-amber-orange-light transition-colors pr-8">
            {ref.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-slate-400">
            <span>{ref.author}</span>
            <span className="text-deep-sea-light">|</span>
            <span className="font-mono text-amber-orange">{ref.year}</span>
            <span className="text-deep-sea-light">|</span>
            <span className="italic">{ref.journal}</span>
          </div>
        </button>

        <div
          className="overflow-hidden transition-all duration-500 ease-in-out"
          style={{ maxHeight: expanded ? contentHeight + 80 : 0 }}
        >
          <div ref={contentRef} className="pt-4">
            <div className="relative">
              <p
                className={cn(
                  'text-slate-300 leading-relaxed text-sm',
                  !expanded && 'line-clamp-2'
                )}
              >
                {ref.abstract}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {keywords.map((kw) => (
                <Badge key={kw} variant={keywordMap[kw]} size="sm">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1 mt-3 text-xs text-amber-orange hover:text-amber-orange-light transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            展开摘要
          </button>
        )}
        {expanded && (
          <button
            onClick={() => setExpanded(false)}
            className="flex items-center gap-1 mt-3 text-xs text-amber-orange hover:text-amber-orange-light transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            收起
          </button>
        )}
      </GlassCard>
    </div>
  );
}

function HearingRangeChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padLeft = 60;
    const padRight = 30;
    const padTop = 50;
    const padBottom = 60;
    const chartW = w - padLeft - padRight;

    ctx.clearRect(0, 0, w, h);

    const minFreq = 20;
    const maxFreq = 65000;
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);

    const freqToX = (freq: number) =>
      padLeft + ((Math.log10(freq) - logMin) / (logMax - logMin)) * chartW;

    ctx.strokeStyle = 'rgba(148,163,184,0.15)';
    ctx.lineWidth = 1;
    const freqTicks = [20, 50, 100, 500, 1000, 5000, 10000, 20000, 65000];
    freqTicks.forEach((f) => {
      const x = freqToX(f);
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, h - padBottom);
      ctx.stroke();

      ctx.fillStyle = 'rgba(148,163,184,0.6)';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      let label: string;
      if (f >= 1000) {
        label = `${f / 1000}kHz`;
      } else {
        label = `${f}Hz`;
      }
      ctx.fillText(label, x, h - padBottom + 20);
    });

    const barY = padTop + 10;
    const barH = 36;
    const humanMax = 20000;
    const humanX2 = freqToX(humanMax);
    const humanX1 = freqToX(minFreq);
    const grad1 = ctx.createLinearGradient(humanX1, 0, humanX2, 0);
    grad1.addColorStop(0, 'rgba(96,165,250,0.3)');
    grad1.addColorStop(1, 'rgba(96,165,250,0.6)');
    ctx.fillStyle = grad1;
    roundRect(ctx, humanX1, barY, humanX2 - humanX1, barH, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(96,165,250,0.8)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, humanX1, barY, humanX2 - humanX1, barH, 6);
    ctx.stroke();
    ctx.fillStyle = '#60A5FA';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('人类听觉 20Hz - 20kHz', (humanX1 + humanX2) / 2, barY + barH / 2 + 4);

    const catBarY = barY + barH + 16;
    const catMax = 65000;
    const catX2 = freqToX(catMax);
    const catX1 = freqToX(minFreq);
    const grad2 = ctx.createLinearGradient(catX1, 0, catX2, 0);
    grad2.addColorStop(0, 'rgba(245,158,11,0.3)');
    grad2.addColorStop(0.6, 'rgba(245,158,11,0.6)');
    grad2.addColorStop(1, 'rgba(245,158,11,0.8)');
    ctx.fillStyle = grad2;
    roundRect(ctx, catX1, catBarY, catX2 - catX1, barH, 6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(245,158,11,0.8)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, catX1, catBarY, catX2 - catX1, barH, 6);
    ctx.stroke();
    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('猫咪听觉 20Hz - 65kHz', (catX1 + catX2) / 2, catBarY + barH / 2 + 4);

    const callRanges = [
      { label: '呼噜声', min: 25, max: 150, color: '#34D399' },
      { label: '喵叫', min: 500, max: 1500, color: '#F59E0B' },
      { label: '低吼', min: 100, max: 300, color: '#EF4444' },
      { label: '嘶叫', min: 3000, max: 8000, color: '#F87171' },
      { label: '哀鸣', min: 800, max: 2000, color: '#A78BFA' },
    ];

    const callBarY = catBarY + barH + 30;
    const callBarH = 18;
    const callGap = 6;
    const callLabelX = padLeft - 6;

    ctx.fillStyle = 'rgba(148,163,184,0.5)';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('叫声频率区间', callLabelX - 8, callBarY + 4);

    callRanges.forEach((range, i) => {
      const y = callBarY + i * (callBarH + callGap) + 16;
      const x1 = freqToX(range.min);
      const x2 = freqToX(range.max);

      ctx.fillStyle = 'rgba(148,163,184,0.7)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(range.label, callLabelX, y + callBarH / 2 + 4);

      const grad3 = ctx.createLinearGradient(x1, 0, x2, 0);
      grad3.addColorStop(0, range.color + '40');
      grad3.addColorStop(1, range.color + 'CC');
      ctx.fillStyle = grad3;
      roundRect(ctx, x1, y, Math.max(x2 - x1, 4), callBarH, 4);
      ctx.fill();
      ctx.strokeStyle = range.color + 'AA';
      ctx.lineWidth = 1;
      roundRect(ctx, x1, y, Math.max(x2 - x1, 4), callBarH, 4);
      ctx.stroke();

      if (x2 - x1 > 60) {
        ctx.fillStyle = range.color;
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${range.min >= 1000 ? range.min / 1000 + 'k' : range.min}-${range.max >= 1000 ? range.max / 1000 + 'k' : range.max}Hz`,
          (x1 + x2) / 2,
          y + callBarH / 2 + 3
        );
      }
    });
  }, []);

  useEffect(() => {
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);

  return (
    <GlassCard padding="md">
      <h4 className="text-sm text-amber-orange font-semibold mb-4 flex items-center gap-2">
        <Ear className="w-4 h-4" />
        猫咪听觉范围可视化
      </h4>
      <div className="rounded-xl overflow-hidden bg-deep-sea-dark/60 border border-deep-sea-light/30 p-4">
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg"
          style={{ height: '380px' }}
        />
      </div>
      <p className="text-slate-400 text-xs mt-3 leading-relaxed">
        {catPhysiology.hearingRange.description}
      </p>
    </GlassCard>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

const organPositions = [
  { name: '鼻腔', top: '8%', left: '52%', width: '36%', height: '16%', color: '#60A5FA' },
  { name: '口腔', top: '28%', left: '48%', width: '40%', height: '22%', color: '#F59E0B' },
  { name: '喉头', top: '54%', left: '50%', width: '28%', height: '18%', color: '#34D399' },
  { name: '声带', top: '50%', left: '50%', width: '20%', height: '10%', color: '#F87171' },
  { name: '横膈膜', top: '78%', left: '38%', width: '46%', height: '10%', color: '#A78BFA' },
];

function VocalOrgansDiagram() {
  const [hovered, setHovered] = useState<string | null>(null);

  const organInfo = catPhysiology.vocalOrgans;

  return (
    <GlassCard padding="md">
      <h4 className="text-sm text-amber-orange font-semibold mb-4 flex items-center gap-2">
        <Volume2 className="w-4 h-4" />
        发声器官示意图
      </h4>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="relative w-full lg:w-1/2" style={{ minHeight: '320px' }}>
          <div
            className="absolute inset-0 rounded-2xl border border-deep-sea-light/30 bg-deep-sea-dark/60 overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, rgba(96,165,250,0.05) 0%, rgba(245,158,11,0.05) 50%, rgba(167,139,250,0.05) 100%)',
            }}
          >
            <svg
              viewBox="0 0 200 320"
              className="w-full h-full"
              style={{ minHeight: '300px' }}
            >
              <ellipse
                cx="100"
                cy="40"
                rx="40"
                ry="22"
                fill="none"
                stroke="rgba(96,165,250,0.3)"
                strokeWidth="1.5"
              />
              <path
                d="M60 60 Q80 62 100 62 Q120 62 140 60 L145 180 Q120 185 100 185 Q80 185 55 180 Z"
                fill="none"
                stroke="rgba(245,158,11,0.3)"
                strokeWidth="1.5"
              />
              <ellipse
                cx="100"
                cy="175"
                rx="35"
                ry="14"
                fill="none"
                stroke="rgba(52,211,153,0.3)"
                strokeWidth="1.5"
              />
              <path
                d="M92 168 Q100 160 108 168"
                fill="none"
                stroke="rgba(248,113,113,0.5)"
                strokeWidth="2"
              />
              <line
                x1="60"
                y1="250"
                x2="140"
                y2="250"
                stroke="rgba(167,139,250,0.4)"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <path
                d="M70 255 Q100 265 130 255"
                fill="none"
                stroke="rgba(167,139,250,0.3)"
                strokeWidth="1.5"
              />
            </svg>

            {organPositions.map((organ) => {
              const isHovered = hovered === organ.name;
              return (
                <div
                  key={organ.name}
                  className="absolute cursor-pointer transition-all duration-300"
                  style={{
                    top: organ.top,
                    left: organ.left,
                    width: organ.width,
                    height: organ.height,
                    transform: `translate(-50%, 0) ${isHovered ? 'scale(1.05)' : 'scale(1)'}`,
                  }}
                  onMouseEnter={() => setHovered(organ.name)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div
                    className="w-full h-full rounded-xl flex items-center justify-center font-display font-bold text-sm transition-all duration-300"
                    style={{
                      backgroundColor: isHovered
                        ? organ.color + '30'
                        : organ.color + '10',
                      border: `1.5px solid ${organ.color}${isHovered ? '80' : '40'}`,
                      color: organ.color,
                      boxShadow: isHovered
                        ? `0 0 20px ${organ.color}40`
                        : 'none',
                    }}
                  >
                    {organ.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {organInfo.map((organ) => {
            const pos = organPositions.find((p) => organ.name.startsWith(p.name));
            const isHovered = hovered !== null && organ.name.startsWith(hovered);
            return (
              <div
                key={organ.name}
                className={cn(
                  'rounded-xl p-4 transition-all duration-300 border',
                  isHovered
                    ? 'bg-deep-sea-light/30 border-amber-orange/30'
                    : 'bg-deep-sea-dark/40 border-deep-sea-light/20'
                )}
                onMouseEnter={() => setHovered(pos?.name ?? null)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: pos?.color ?? '#F59E0B' }}
                  />
                  <h5
                    className="font-display font-bold text-sm"
                    style={{ color: pos?.color ?? '#F59E0B' }}
                  >
                    {organ.name}
                  </h5>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {organ.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

const emotionMeta: {
  icon: React.ReactNode;
  color: string;
  badge: 'mint' | 'coral' | 'purple' | 'amber' | 'sky';
}[] = [
  { icon: <Heart className="w-5 h-5" />, color: '#34D399', badge: 'mint' },
  { icon: <Zap className="w-5 h-5" />, color: '#F59E0B', badge: 'amber' },
  { icon: <AlertTriangle className="w-5 h-5" />, color: '#A78BFA', badge: 'purple' },
  { icon: <Sparkles className="w-5 h-5" />, color: '#F87171', badge: 'coral' },
  { icon: <Smile className="w-5 h-5" />, color: '#60A5FA', badge: 'sky' },
];

function EmotionExpressionCards() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const expressions = catPhysiology.emotionExpressions;

  return (
    <GlassCard padding="md">
      <h4 className="text-sm text-amber-orange font-semibold mb-4 flex items-center gap-2">
        <Heart className="w-4 h-4" />
        情绪表现交互卡片
      </h4>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {expressions.map((expr, i) => {
          const meta = emotionMeta[i];
          const isExpanded = expandedIdx === i;
          return (
            <div
              key={expr.emotion}
              className={cn(
                'rounded-2xl border p-4 cursor-pointer transition-all duration-300',
                isExpanded ? 'md:col-span-2 lg:col-span-3 xl:col-span-5' : ''
              )}
              style={{
                backgroundColor: isExpanded ? meta.color + '15' : meta.color + '08',
                borderColor: isExpanded ? meta.color + '60' : meta.color + '25',
                boxShadow: isExpanded ? `0 0 24px ${meta.color}30` : 'none',
              }}
              onClick={() => setExpandedIdx(isExpanded ? null : i)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: meta.color + '20',
                    color: meta.color,
                  }}
                >
                  {meta.icon}
                </div>
                <div>
                  <h5 className="font-display font-bold text-white text-sm">
                    {expr.emotion}
                  </h5>
                  <Badge variant={meta.badge} size="sm">
                    {['正面', '中性', '焦虑', '攻击', '满足'][i]}
                  </Badge>
                </div>
                <div className="ml-auto">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" style={{ color: meta.color }} />
                  ) : (
                    <ChevronDown className="w-4 h-4" style={{ color: meta.color }} />
                  )}
                </div>
              </div>

              <div
                className="overflow-hidden transition-all duration-500"
                style={{ maxHeight: isExpanded ? 300 : 0 }}
              >
                <div className="space-y-3 pt-2">
                  <div className="rounded-xl bg-deep-sea-dark/50 p-3">
                    <p className="text-xs font-semibold mb-1" style={{ color: meta.color }}>
                      🐾 肢体语言
                    </p>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {expr.bodyLanguage}
                    </p>
                  </div>
                  <div className="rounded-xl bg-deep-sea-dark/50 p-3">
                    <p className="text-xs font-semibold mb-1" style={{ color: meta.color }}>
                      🔊 发声特征
                    </p>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {expr.vocalization}
                    </p>
                  </div>
                  <div className="rounded-xl bg-deep-sea-dark/50 p-3">
                    <p className="text-xs font-semibold mb-1" style={{ color: meta.color }}>
                      🐈 尾巴动作
                    </p>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {expr.tailMovement}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

const funFacts = [
  {
    title: '呼噜频率与骨骼愈合',
    content:
      '猫咪呼噜声的频率在25-150Hz之间，这一频率范围已被证实可以促进骨骼生长和骨折愈合，甚至有助于减轻疼痛和组织修复。',
    icon: '🦴',
  },
  {
    title: '猫咪不会对同类喵喵叫',
    content:
      '成年猫之间几乎不会用"喵喵"声交流，喵叫是猫咪专门进化出来与人类沟通的声音。猫与猫之间更多依赖肢体语言和气味。',
    icon: '🗣️',
  },
  {
    title: '猫咪能发出超过100种声音',
    content:
      '相比之下，狗只能发出约10种不同的声音。猫咪丰富多变的发声系统使它们成为最善于"说话"的家养动物之一。',
    icon: '🎵',
  },
  {
    title: '猫耳有32块肌肉',
    content:
      '人类耳朵只有6块肌肉，而猫咪拥有32块！这让猫咪的耳朵可以像雷达一样旋转180度，精准定位声源方向。',
    icon: '👂',
  },
  {
    title: '白猫多为聋子',
    content:
      '拥有蓝色眼睛的白猫中，约65-85%存在先天耳聋。这是由于导致白色毛皮的基因同时影响了内耳的发育。',
    icon: '🤍',
  },
];

function FunFactCards() {
  return (
    <GlassCard padding="md">
      <h4 className="text-sm text-amber-orange font-semibold mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        冷知识卡片
      </h4>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {funFacts.map((fact, i) => (
          <div
            key={i}
            className="rounded-xl bg-deep-sea-dark/60 border border-deep-sea-light/20 p-5 hover:border-amber-orange/30 transition-all duration-300 group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
              {fact.icon}
            </div>
            <h5 className="font-display font-bold text-white text-sm mb-2 group-hover:text-amber-orange-light transition-colors">
              {fact.title}
            </h5>
            <p className="text-slate-400 text-xs leading-relaxed">{fact.content}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function ReferencesTab() {
  return (
    <div className="mt-8">
      {references.map((ref) => (
        <RefCard key={ref.id} ref={ref} />
      ))}
    </div>
  );
}

function PhysiologyTab() {
  return (
    <div className="mt-8 space-y-6">
      <HearingRangeChart />
      <VocalOrgansDiagram />
      <EmotionExpressionCards />
      <FunFactCards />
    </div>
  );
}

export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('refs');

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 text-center relative">
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-[600px] h-64 -z-10"
            style={{
              background:
                'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
            }}
          />
          <h1 className="font-display text-5xl font-bold mb-3">
            <span className="glow-text">科普知识库</span>
          </h1>
          <p className="text-slate-400 text-lg">
            动物行为学参考与猫咪生理常识
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-xl font-display font-semibold text-sm transition-all duration-300',
                activeTab === tab.key
                  ? 'bg-amber-orange text-white shadow-glow'
                  : 'bg-deep-sea-light/30 text-slate-300 border border-deep-sea-light/30 hover:border-amber-orange/40 hover:text-amber-orange'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'refs' && <ReferencesTab />}
        {activeTab === 'physiology' && <PhysiologyTab />}
      </div>
    </PageLayout>
  );
}
