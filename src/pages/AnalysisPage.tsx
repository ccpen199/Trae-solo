import { useState, useEffect, useRef, useCallback } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { AudioAnalyzer } from '@/audio/audioAnalyzer';
import { EmotionClassifier } from '@/audio/emotionClassifier';
import { AudioRecorder } from '@/audio/audioRecorder';
import { WaveformRenderer } from '@/audio/waveformRenderer';
import { emotions } from '@/data/emotions';
import { scenes } from '@/data/scenes';
import { useJournalStore } from '@/store/journalStore';
import type { AnalysisResult, EmotionCategory } from '@/types';
import {
  Upload, Mic, Square, Save, Sparkles, AlertTriangle, Heart,
  Activity, Waves, BarChart3, Eye, FileAudio, Info,
  CheckCircle2, ShieldCheck, Sparkle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'waveform' | 'spectrum' | 'both';

const emotionIcons: Record<EmotionCategory, string> = {
  purr: '😺', meow: '🐱', hiss: '😾', wail: '😿', growl: '🙀', content: '😻',
};
const colorMap: Record<string, 'mint' | 'coral' | 'purple' | 'sky' | 'amber'> = {
  '#34D399': 'mint', '#F59E0B': 'amber', '#F87171': 'coral', '#A78BFA': 'purple', '#60A5FA': 'sky', '#EF4444': 'coral',
};
const sIcons = ['💡', '🎯', '✨', '🌟', '💫'];

function AC({ value, suffix = '', decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [d, setD] = useState(0);
  const s = useRef<number | null>(null);
  const raf = useRef<number>();
  useEffect(() => {
    s.current = null;
    const sv = d;
    const a = (ts: number) => {
      if (s.current === null) s.current = ts;
      const p = Math.min((ts - s.current) / 1500, 1);
      setD(sv + (value - sv) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(a);
    };
    raf.current = requestAnimationFrame(a);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span className="font-mono tabular-nums">{d.toFixed(decimals)}{suffix}</span>;
}

function FC({ icon, label, value, suffix, decimals, color }: {
  icon: React.ReactNode; label: string; value: number; suffix?: string; decimals?: number; color: string;
}) {
  return (
    <div className="glass-card p-4 rounded-xl transition-all duration-300 hover:border-deep-sea-light/50 group">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg transition-transform group-hover:scale-110" style={{ backgroundColor: `${color}20`, color }}>{icon}</div>
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-lg font-semibold text-white"><AC value={value} suffix={suffix} decimals={decimals} /></p>
        </div>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const addEntry = useJournalStore((s) => s.addEntry);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState(scenes[0].name);
  const [catReaction, setCatReaction] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const wcRef = useRef<HTMLCanvasElement>(null);
  const scRef = useRef<HTMLCanvasElement>(null);
  const lcRef = useRef<HTMLCanvasElement>(null);
  const wRRef = useRef<WaveformRenderer | null>(null);
  const sRRef = useRef<WaveformRenderer | null>(null);
  const lRRef = useRef<WaveformRenderer | null>(null);
  const aARef = useRef<AudioAnalyzer | null>(null);
  const cRRef = useRef<EmotionClassifier | null>(null);
  const rRRef = useRef<AudioRecorder | null>(null);
  const afRef = useRef<number>();
  const fiRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    aARef.current = new AudioAnalyzer();
    cRRef.current = new EmotionClassifier(emotions);
    rRRef.current = new AudioRecorder();
  }, []);

  const rc = useCallback((c: HTMLCanvasElement | null) => {
    if (!c) return;
    const r = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = r.width * dpr; c.height = r.height * dpr;
    c.getContext('2d')?.scale(dpr, dpr);
    return { width: r.width, height: r.height };
  }, []);

  useEffect(() => {
    const setup = [
      { c: wcRef.current, r: wRRef }, { c: scRef.current, r: sRRef }, { c: lcRef.current, r: lRRef },
    ];
    setup.forEach(({ c, r }) => {
      if (c) { const s = rc(c); if (s) { r.current = new WaveformRenderer(c); r.current.resize(s.width, s.height); } }
    });
    const hR = () => setup.forEach(({ c, r }) => {
      if (c && r.current) { const s = rc(c); if (s) r.current.resize(s.width, s.height); }
    });
    window.addEventListener('resize', hR);
    return () => window.removeEventListener('resize', hR);
  }, [rc]);

  useEffect(() => {
    if (!isRecording) return;
    const rec = rRRef.current; const rend = lRRef.current;
    if (!rec || !rend) return;
    const t = () => {
      rend.drawWaveform(rec.getLiveWaveform(128), '#F59E0B');
      afRef.current = requestAnimationFrame(t);
    };
    afRef.current = requestAnimationFrame(t);
    return () => { if (afRef.current) cancelAnimationFrame(afRef.current); };
  }, [isRecording]);

  const analyze = useCallback(async (ab: AudioBuffer) => {
    setIsAnalyzing(true); setError(null); setResult(null); setSaved(false);
    try {
      const a = aARef.current; const c = cRRef.current; if (!a || !c) return;
      const f = a.extractFeatures(ab);
      const w = a.getWaveformData(ab, 256);
      const sp = a.getSpectrum(ab, 2048);
      if (wRRef.current) wRRef.current.drawWaveform(w, '#60A5FA');
      if (sRRef.current) sRRef.current.drawSpectrum(sp, '#A78BFA');
      await new Promise((r) => setTimeout(r, 2000));
      const ar = c.classify(f);
      ar.duration = ab.duration;
      if (wRRef.current) wRRef.current.drawWaveform(w, ar.emotion.color);
      if (sRRef.current) sRRef.current.drawSpectrum(sp, ar.emotion.color);
      setResult(ar);
    } catch (e) {
      setError(e instanceof Error ? e.message : '分析失败，请重试');
    } finally { setIsAnalyzing(false); }
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.includes('audio')) { setError('请选择音频文件（.mp3 或 .wav）'); return; }
    try { const a = aARef.current; if (!a) return; await analyze(await a.loadAudio(file)); }
    catch (e) { setError(e instanceof Error ? e.message : '文件加载失败'); }
  }, [analyze]);

  const toggleRec = useCallback(async () => {
    const r = rRRef.current; if (!r) return;
    if (!isRecording) {
      try { await r.start(); setIsRecording(true); setError(null); }
      catch { setError('无法访问麦克风，请检查权限设置'); }
    } else {
      try {
        const ad = await r.stop(); setIsRecording(false);
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        const buf = ctx.createBuffer(1, ad.length, 44100);
        buf.getChannelData(0).set(ad);
        await analyze(buf); await ctx.close();
      } catch (e) {
        setError(e instanceof Error ? e.message : '录音处理失败'); setIsRecording(false);
      }
    }
  }, [isRecording, analyze]);

  const handleSave = useCallback(() => {
    if (!result) return;
    addEntry({
      type: 'analysis', emotion: result.emotion, confidence: result.confidence,
      scene: selectedScene, catReaction: catReaction || undefined, notes: notes || undefined,
      duration: result.duration, audioFeatures: result.audioFeatures,
    });
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  }, [result, selectedScene, catReaction, notes, addEntry]);

  const df = result ? {
    rms: result.audioFeatures.rms, df: result.audioFeatures.dominantFrequency,
    sc: result.audioFeatures.spectralCentroid, zcr: result.audioFeatures.zeroCrossingRate,
  } : null;

  const viewBtns: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'waveform', label: '波形', icon: <Activity className="w-3.5 h-3.5" /> },
    { mode: 'spectrum', label: '频谱', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { mode: 'both', label: '双视图', icon: <Eye className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out]">
        <header className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-amber-orange-light via-mood-mint to-mood-sky bg-clip-text text-transparent">声纹情绪分析</h1>
          <p className="text-slate-400 text-lg">上传或录制猫咪叫声，AI 识别情绪状态</p>
          <Badge variant="mint" size="sm"><ShieldCheck className="w-3.5 h-3.5 mr-1" />100% 本地处理，音频不上传</Badge>
        </header>

        <GlassCard className="relative overflow-hidden" padding="lg">
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
            <svg className="absolute bottom-0 w-[200%] h-24 animate-wave" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <defs><linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#34D399" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.3" />
              </linearGradient></defs>
              <path d="M0,60 C150,100 350,20 600,60 C850,100 1050,20 1200,60 L1200,120 L0,120 Z" fill="url(#wg)" />
            </svg>
          </div>
          <div className="relative z-10">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              className={cn(
                'border-2 border-dashed rounded-2xl p-8 md:p-12 transition-all duration-300 text-center mb-6',
                isDragging ? 'border-amber-orange bg-amber-orange/10 scale-[1.01]' : 'border-deep-sea-light/50 hover:border-deep-sea-light bg-deep-sea-dark/30'
              )}
            >
              {isRecording ? (
                <div className="space-y-4">
                  <div className="relative h-24"><canvas ref={lcRef} className="absolute inset-0 w-full h-full" /></div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-mood-coral animate-pulse" />
                    <span className="text-mood-coral font-medium">录音中...</span>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className={cn('w-12 h-12 mx-auto mb-4', isDragging ? 'text-amber-orange' : 'text-slate-500')} />
                  <p className="text-slate-300 font-medium mb-2">{isDragging ? '松开以上传音频文件' : '拖拽音频文件到此处'}</p>
                  <p className="text-slate-500 text-sm mb-6">支持 .mp3 / .wav 格式</p>
                </>
              )}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <input ref={fiRef} type="file" accept=".mp3,.wav,audio/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
                <Button variant="secondary" onClick={() => fiRef.current?.click()} disabled={isRecording || isAnalyzing} icon={<FileAudio className="w-4 h-4" />}>选择文件</Button>
                <Button variant={isRecording ? 'danger' : 'primary'} onClick={toggleRec} disabled={isAnalyzing}
                  icon={isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  className={cn(isRecording && 'animate-pulse-slow')}>{isRecording ? '停止录音' : '开始录音'}</Button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-mood-coral/10 border border-mood-coral/30 text-mood-coral text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}
          </div>
        </GlassCard>

        {(result || isAnalyzing) && (
          <GlassCard padding="lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2"><Waves className="w-5 h-5 text-amber-orange" />波形可视化</h2>
              <div className="flex gap-1 p-1 rounded-xl bg-deep-sea-dark/50">
                {viewBtns.map(({ mode, label, icon }) => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    className={cn('px-3 py-1.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-1.5',
                      viewMode === mode ? 'bg-amber-orange text-white shadow-glow' : 'text-slate-400 hover:text-white hover:bg-deep-sea-light/30')}>
                    {icon}{label}
                  </button>
                ))}
              </div>
            </div>
            {isAnalyzing ? (
              <div className="relative flex items-center justify-center h-48">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="absolute rounded-full border-2 animate-ping"
                    style={{ width: `${80 + i * 40}px`, height: `${80 + i * 40}px`, borderColor: '#F59E0B', opacity: 0.6 - i * 0.15, animationDelay: `${i * 0.5}s`, animationDuration: '2s' }} />
                ))}
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <Waves className="w-10 h-10 animate-pulse text-amber-orange" />
                  <span className="text-sm text-slate-300">AI 分析中...</span>
                </div>
              </div>
            ) : (
              <div className={cn(viewMode === 'both' ? 'space-y-4' : '')}>
                {(viewMode === 'waveform' || viewMode === 'both') && (
                  <div className="h-32 rounded-xl overflow-hidden bg-deep-sea-dark/50 border border-deep-sea-light/30"><canvas ref={wcRef} className="w-full h-full" /></div>
                )}
                {(viewMode === 'spectrum' || viewMode === 'both') && (
                  <div className="h-32 rounded-xl overflow-hidden bg-deep-sea-dark/50 border border-deep-sea-light/30"><canvas ref={scRef} className="w-full h-full" /></div>
                )}
              </div>
            )}
          </GlassCard>
        )}

        {result && !isAnalyzing && (
          <>
            <GlassCard padding="lg" style={{ borderColor: `${result.emotion.color}40` }}>
              <h2 className="text-xl font-display font-semibold text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: result.emotion.color }} />情绪分析结果
              </h2>
              <div className="glass-card rounded-2xl p-6 md:p-8 mb-6 transition-all duration-500 hover:scale-[1.01]"
                style={{ borderColor: `${result.emotion.color}50`, boxShadow: `0 0 40px ${result.emotion.color}20` }}>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl transition-transform hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${result.emotion.color}30, ${result.emotion.color}10)`, boxShadow: `0 0 30px ${result.emotion.color}30` }}>
                    {emotionIcons[result.emotion.category]}
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <h3 className="text-2xl font-bold text-white">{result.emotion.name}</h3>
                      <Badge variant={colorMap[result.emotion.color] || 'amber'} size="sm">{result.emotion.nameEn}</Badge>
                    </div>
                    <p className="text-slate-400 text-sm mb-4 max-w-xl">{result.emotion.description}</p>
                    <div className="flex items-end justify-center md:justify-start gap-3">
                      <span className="text-5xl font-display font-bold" style={{ color: result.emotion.color }}>
                        <AC value={result.confidence * 100} suffix="%" decimals={1} />
                      </span>
                      <span className="text-slate-500 text-sm pb-1">置信度</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" />六类情绪置信度分布</h3>
                <div className="space-y-3">
                  {emotions.map((e) => (
                    <ProgressBar key={e.id} value={result.emotionScores[e.category] * 100}
                      label={<span className="flex items-center gap-2"><span>{emotionIcons[e.category]}</span><span>{e.name}</span></span>}
                      color={colorMap[e.color] || 'amber'} />
                  ))}
                </div>
              </div>
              {df && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><Activity className="w-4 h-4" />音频特征指标</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <FC icon={<Activity className="w-5 h-5" />} label="RMS 音量" value={df.rms} decimals={3} color="#60A5FA" />
                    <FC icon={<Waves className="w-5 h-5" />} label="主频率" value={df.df} suffix=" Hz" color="#34D399" />
                    <FC icon={<Sparkle className="w-5 h-5" />} label="频谱质心" value={df.sc} suffix=" Hz" color="#A78BFA" />
                    <FC icon={<BarChart3 className="w-5 h-5" />} label="过零率" value={df.zcr * 1000} suffix=" /ks" decimals={1} color="#F59E0B" />
                  </div>
                </div>
              )}
            </GlassCard>

            <GlassCard padding="lg">
              <h2 className="text-xl font-display font-semibold text-white mb-6 flex items-center gap-2"><Heart className="w-5 h-5 text-mood-coral" />行为建议</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {result.suggestions.map((s, i) => (
                  <div key={i} className="glass-card rounded-xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-deep-sea-light/50 group">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl transition-transform group-hover:scale-110 flex-shrink-0">{sIcons[i % sIcons.length]}</div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">建议 {i + 1}</h4>
                        <p className="text-slate-400 text-sm leading-relaxed">{s}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard padding="lg">
              <h2 className="text-xl font-display font-semibold text-white mb-6 flex items-center gap-2"><Save className="w-5 h-5 text-mood-mint" />保存到日志</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">场景 <span className="text-mood-coral">*</span></label>
                  <select value={selectedScene} onChange={(e) => setSelectedScene(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-deep-sea-dark/50 border border-deep-sea-light/50 text-white focus:outline-none focus:border-amber-orange/50 focus:ring-2 focus:ring-amber-orange/20 transition-all">
                    {scenes.map((s) => <option key={s.id} value={s.name}>{s.icon} {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">猫咪反应 <span className="text-slate-500">(可选)</span></label>
                  <input type="text" value={catReaction} onChange={(e) => setCatReaction(e.target.value)} placeholder="例如：尾巴放松、耳朵前倾..."
                    className="w-full h-11 px-4 rounded-xl bg-deep-sea-dark/50 border border-deep-sea-light/50 text-white placeholder-slate-500 focus:outline-none focus:border-amber-orange/50 focus:ring-2 focus:ring-amber-orange/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">备注 <span className="text-slate-500">(可选)</span></label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="记录其他观察或想法..." rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-deep-sea-dark/50 border border-deep-sea-light/50 text-white placeholder-slate-500 focus:outline-none focus:border-amber-orange/50 focus:ring-2 focus:ring-amber-orange/20 transition-all resize-none" />
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400"><Info className="w-4 h-4" />分析结果将保存到本地日志</div>
                  <Button variant={saved ? 'secondary' : 'primary'} onClick={handleSave}
                    icon={saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}>
                    {saved ? '已保存 ✓' : '保存实验记录'}
                  </Button>
                </div>
              </div>
            </GlassCard>
          </>
        )}
      </div>
  );
}
