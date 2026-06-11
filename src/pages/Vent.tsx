import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RadarChart, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { Phone, AlertTriangle, ChevronRight } from 'lucide-react';
import { useProfileStore } from '@/store/useProfileStore';
import { RISK_LEVEL_CONFIG, type EmotionClustering, type RiskLevel } from '@/types';
import { DEMO_PROFILE } from '@/lib/demoData';

const EMOTION_AXES = [
  { key: 'anxiety', label: '焦虑' },
  { key: 'depression', label: '抑郁' },
  { key: 'anger', label: '愤怒' },
  { key: 'calm', label: '平静' },
  { key: 'hope', label: '希望' },
  { key: 'fear', label: '恐惧' },
] as const;

const RISK_POSITIONS: Record<RiskLevel, number> = {
  low: 10,
  medium: 35,
  high: 60,
  critical: 82,
  crisis: 95,
};

export default function Vent() {
  const navigate = useNavigate();
  const { profile, setVentRecord, setRiskLevel, setEmotionClustering } = useProfileStore();
  const effectiveProfile = profile ?? DEMO_PROFILE;

  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    emotion_clustering: EmotionClustering;
    risk_level: RiskLevel;
    keywords: string[];
  } | null>(null);
  const [showCrisisModal, setShowCrisisModal] = useState(false);

  const handleAnalyze = async () => {
    if (text.trim().length < 10) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/vent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: effectiveProfile.id, content: text }),
      });
      const json = await res.json();
      if (json.success) {
        const data = json.data;
        setResult({
          emotion_clustering: data.emotion_clustering,
          risk_level: data.risk_level,
          keywords: data.keywords,
        });
        setVentRecord(data);
        setRiskLevel(data.risk_level);
        setEmotionClustering(data.emotion_clustering);
        if (data.risk_level === 'critical' || data.risk_level === 'crisis') {
          setShowCrisisModal(true);
        }
      }
    } catch {
      console.error('分析失败');
    } finally {
      setAnalyzing(false);
    }
  };

  const radarData = result
    ? EMOTION_AXES.map(({ key, label }) => ({
        subject: label,
        value: result.emotion_clustering[key],
      }))
    : [];

  const riskConfig = result ? RISK_LEVEL_CONFIG[result.risk_level] : null;
  const riskPos = result ? RISK_POSITIONS[result.risk_level] : 0;
  const isCrisis = result?.risk_level === 'critical' || result?.risk_level === 'crisis';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-[60%]">
          <h1 className="font-serif text-3xl text-lavender-600 mb-2">说出你最近的感受</h1>
          <p className="text-slate-dark-400 text-sm mb-6">
            你的文字将被安全分析，仅用于匹配最适合的咨询师
          </p>

          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-2xl border border-lavender-200 focus:border-lavender-400 focus:ring-2 focus:ring-lavender-200 outline-none p-4 min-h-[200px] resize-y text-slate-dark-800 placeholder:text-slate-dark-300"
              placeholder="在这里写下你最近的感受、困扰或想法..."
            />
            <span className="absolute bottom-3 right-4 text-xs text-slate-dark-400">
              {text.length}
            </span>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={text.trim().length < 10 || analyzing}
            className="mt-4 bg-lavender-500 text-white rounded-full px-8 py-3 hover:bg-lavender-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {analyzing ? '分析中...' : '分析我的情绪'}
          </button>

          <p className="mt-3 text-xs text-slate-dark-400">
            你的倾诉内容将脱敏存储，不会泄露给第三方
          </p>
        </div>

        <div className="lg:w-[40%]">
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className={`space-y-6 ${isCrisis ? 'animate-pulse-border' : ''}`}
              >
                <div className="bg-white rounded-3xl p-6 shadow-soft">
                  <h3 className="font-serif text-lg text-lavender-600 mb-4">情绪雷达图</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#7C3AED', fontSize: 13 }}
                      />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        dataKey="value"
                        stroke="#A78BFA"
                        fill="#A78BFA"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-soft">
                  <h3 className="font-serif text-lg text-lavender-600 mb-4">风险等级</h3>
                  <div className="relative h-3 rounded-full overflow-hidden bg-gradient-to-r from-mint-300 via-yellow-300 via-orange-300 to-red-400">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                      style={{ left: `${riskPos}%` }}
                    >
                      <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-slate-dark-800" />
                    </div>
                  </div>
                  {riskConfig && (
                    <p className={`mt-2 text-sm font-medium ${riskConfig.color}`}>
                      {riskConfig.label}
                    </p>
                  )}
                </div>

                {result.keywords.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 shadow-soft">
                    <h3 className="font-serif text-lg text-lavender-600 mb-3">识别关键词</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="bg-lavender-50 text-lavender-600 text-xs px-3 py-1 rounded-full"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => navigate('/match')}
                  className="w-full bg-lavender-500 text-white rounded-full py-3 hover:bg-lavender-600 transition flex items-center justify-center gap-2"
                >
                  查看匹配咨询师
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showCrisisModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCrisisModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-soft-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-coral-400" />
                <h2 className="font-serif text-xl text-slate-dark-800">
                  我们注意到你可能需要更多帮助
                </h2>
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-slate-dark-600">
                  <Phone className="w-4 h-4 text-coral-400" />
                  <span>24小时心理援助热线：400-161-9995</span>
                </div>
                <div className="flex items-center gap-2 text-slate-dark-600">
                  <Phone className="w-4 h-4 text-coral-400" />
                  <span>北京心理危机研究与干预中心：010-82951332</span>
                </div>
              </div>
              <div className="flex gap-3">
                <a
                  href="tel:4001619995"
                  className="flex-1 bg-coral-400 text-white rounded-full py-3 text-center hover:bg-coral-500 transition"
                >
                  我需要立即帮助
                </a>
                <button
                  onClick={() => {
                    setShowCrisisModal(false);
                    navigate('/match');
                  }}
                  className="flex-1 bg-lavender-500 text-white rounded-full py-3 hover:bg-lavender-600 transition"
                >
                  继续匹配咨询师
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
          border-radius: 1.5rem;
        }
      `}</style>
    </div>
  );
}
