import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Check, AlertTriangle, Phone, Shield, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProfileStore } from '@/store/useProfileStore';
import {
  PHQ9_QUESTIONS,
  GAD7_QUESTIONS,
  SCALE_OPTIONS,
  LIFE_EVENT_LABELS,
  COUNSELING_GOAL_TEMPLATES,
  RISK_LEVEL_CONFIG,
} from '@/types';
import type { LifeEventTag, RiskLevel } from '@/types';

const ADJECTIVES = ['温柔的', '勇敢的', '安静的', '明亮的', '坚定的', '自由的', '温暖的', '清澈的'];
const NOUNS = ['星星', '月亮', '海浪', '云朵', '萤火', '微风', '晨露', '飞鸟'];

function generateName() {
  return ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)] + NOUNS[Math.floor(Math.random() * NOUNS.length)];
}

function calcRiskLevel(phq9: number, gad7: number, phq9Q9: number): RiskLevel {
  if (phq9Q9 > 0) return 'high';
  const max = Math.max(phq9, gad7);
  if (max >= 20) return 'critical';
  if (max >= 15) return 'high';
  if (max >= 10) return 'medium';
  return 'low';
}

function getPhq9Level(score: number) {
  if (score >= 20) return { label: '重度抑郁', color: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-500' };
  if (score >= 15) return { label: '中重度抑郁', color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-500' };
  if (score >= 10) return { label: '中度抑郁', color: 'text-yellow-600', bg: 'bg-yellow-50', bar: 'bg-yellow-500' };
  if (score >= 5) return { label: '轻度抑郁', color: 'text-purple-600', bg: 'bg-purple-50', bar: 'bg-purple-500' };
  return { label: '无/极轻微', color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' };
}

function getGad7Level(score: number) {
  if (score >= 15) return { label: '重度焦虑', color: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-500' };
  if (score >= 10) return { label: '中度焦虑', color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-500' };
  if (score >= 5) return { label: '轻度焦虑', color: 'text-purple-600', bg: 'bg-purple-50', bar: 'bg-purple-500' };
  return { label: '无/极轻微', color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' };
}

type StepCode = 'welcome' | 'phq9' | 'phq9_result' | 'gad7' | 'gad7_result' | 'tags' | 'goals' | 'review' | 'done';
const STEPS: StepCode[] = ['welcome', 'phq9', 'phq9_result', 'gad7', 'gad7_result', 'tags', 'goals', 'review', 'done'];
const STEP_LABELS: Record<StepCode, string> = {
  welcome: '欢迎', phq9: 'PHQ-9', phq9_result: 'PHQ-9结果',
  gad7: 'GAD-7', gad7_result: '综合评估', tags: '生活事件',
  goals: '咨询目标', review: '确认提交', done: '完成',
};

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

export default function Profile() {
  const navigate = useNavigate();
  const { profile: existingProfile, setProfile, clearAll } = useProfileStore();

  const [stepIdx, setStepIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [anonymousName, setAnonymousName] = useState(() => generateName());
  const [phq9Answers, setPhq9Answers] = useState<number[]>(Array(9).fill(-1));
  const [gad7Answers, setGad7Answers] = useState<number[]>(Array(7).fill(-1));
  const [phq9Q, setPhq9Q] = useState(0);
  const [gad7Q, setGad7Q] = useState(0);
  const [selectedTags, setSelectedTags] = useState<LifeEventTag[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [savedProfile, setSavedProfile] = useState<any>(null);

  const step = STEPS[stepIdx];

  const phq9Score = useMemo(() => phq9Answers.reduce((s, v) => s + (v >= 0 ? v : 0), 0), [phq9Answers]);
  const gad7Score = useMemo(() => gad7Answers.reduce((s, v) => s + (v >= 0 ? v : 0), 0), [gad7Answers]);
  const phq9Answered = phq9Answers.filter((a) => a >= 0).length;
  const gad7Answered = gad7Answers.filter((a) => a >= 0).length;
  const phq9Q9Answer = phq9Answers[8];

  const phq9Level = getPhq9Level(phq9Score);
  const gad7Level = getGad7Level(gad7Score);
  const currentRisk = calcRiskLevel(phq9Score, gad7Score, phq9Q9Answer);
  const riskConf = RISK_LEVEL_CONFIG[currentRisk] || RISK_LEVEL_CONFIG.low;

  const goNext = useCallback(() => { setDir(1); setStepIdx((i) => Math.min(i + 1, STEPS.length - 1)); }, []);
  const goBack = useCallback(() => { setDir(-1); setStepIdx((i) => Math.max(i - 1, 0)); }, []);

  function answerPhq9(value: number) {
    const next = [...phq9Answers];
    next[phq9Q] = value;
    setPhq9Answers(next);
    if (phq9Q === 8 && value > 0) {
      setShowCrisisModal(true);
    }
    if (phq9Q < 8) {
      setTimeout(() => setPhq9Q(phq9Q + 1), 350);
    }
  }

  function answerGad7(value: number) {
    const next = [...gad7Answers];
    next[gad7Q] = value;
    setGad7Answers(next);
    if (gad7Q < 6) {
      setTimeout(() => setGad7Q(gad7Q + 1), 350);
    }
  }

  async function handleSubmit() {
    const goals = [...selectedGoals];
    if (customGoal.trim()) goals.push(customGoal.trim());
    const riskLevel = calcRiskLevel(phq9Score, gad7Score, phq9Q9Answer);

    setSubmitting(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anonymous_name: anonymousName,
          phq9_score: phq9Score,
          gad7_score: gad7Score,
          life_event_tags: selectedTags,
          counseling_goals: goals.join('、'),
          risk_level: riskLevel,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const saved = { ...json.data, risk_level: json.data.risk_level || riskLevel };
        setProfile(saved);
        setSavedProfile(saved);
        goNext();
      }
    } finally {
      setSubmitting(false);
    }
  }

  function toggleTag(tag: LifeEventTag) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }
  function toggleGoal(goal: string) {
    setSelectedGoals((prev) => prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]);
  }

  const stepProgress = Math.round(((STEPS.indexOf(step)) / (STEPS.length - 1)) * 100);

  if (existingProfile && step === 'welcome' && !savedProfile) {
    const rc = RISK_LEVEL_CONFIG[existingProfile.risk_level] || RISK_LEVEL_CONFIG.low;
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-lg p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500"><Shield size={28} /></div>
            <h1 className="font-serif text-2xl text-purple-700 mb-2">你的匿名档案</h1>
            <p className="text-gray-400 text-sm mb-8">档案已创建，你可以随时继续下一步</p>
            <div className="bg-purple-50 rounded-2xl p-6 text-left space-y-3 mb-6">
              <div className="flex justify-between"><span className="text-sm text-gray-400">匿名昵称</span><span className="font-serif text-lg text-purple-700">{existingProfile.anonymous_name}</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-400">PHQ-9</span><span className="font-semibold text-purple-700">{existingProfile.phq9_score} 分</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-400">GAD-7</span><span className="font-semibold text-purple-700">{existingProfile.gad7_score} 分</span></div>
              <div className="flex justify-between"><span className="text-sm text-gray-400">风险等级</span><span className={cn('px-3 py-1 rounded-full text-xs font-semibold', rc.bg, rc.color)}>{rc.label}</span></div>
              {existingProfile.life_event_tags?.length > 0 && (
                <div className="flex justify-between items-center"><span className="text-sm text-gray-400">生活事件</span><div className="flex flex-wrap gap-1 justify-end">{existingProfile.life_event_tags.map((t) => <span key={t} className="bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full">{LIFE_EVENT_LABELS[t] || t}</span>)}</div></div>
              )}
              {existingProfile.counseling_goals && (
                <div className="flex justify-between"><span className="text-sm text-gray-400">咨询目标</span><span className="text-sm text-purple-600 max-w-[200px] truncate">{existingProfile.counseling_goals}</span></div>
              )}
            </div>
            <div className="space-y-3">
              <button className="w-full rounded-full bg-purple-600 px-8 py-3 text-white font-semibold hover:bg-purple-700 transition" onClick={() => navigate('/vent')}>前往倾诉初筛</button>
              <button className="w-full rounded-full bg-emerald-500 px-8 py-3 text-white font-semibold hover:bg-emerald-600 transition" onClick={() => navigate('/match')}>查看匹配咨询师</button>
              <button className="w-full text-sm text-gray-400 hover:text-purple-600 transition py-2" onClick={() => navigate('/dashboard')}>前往个人中心</button>
              <button className="w-full rounded-full border border-gray-200 px-8 py-3 text-gray-500 font-semibold hover:text-red-500 hover:border-red-200 transition mt-4" onClick={() => { clearAll(); setSavedProfile(null); setStepIdx(0); setPhq9Answers(Array(9).fill(-1)); setGad7Answers(Array(7).fill(-1)); setPhq9Q(0); setGad7Q(0); setSelectedTags([]); setSelectedGoals([]); setCustomGoal(''); }}>重新建档</button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {step !== 'welcome' && step !== 'done' && (
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-purple-100 px-4 py-3">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="font-medium text-purple-700">{STEP_LABELS[step]}</span>
              <span className="text-gray-400">{stepProgress}%</span>
            </div>
            <div className="flex gap-1">
              {STEPS.filter((s) => s !== 'welcome' && s !== 'done').map((s, i) => (
                <div key={s} className={cn('h-1.5 flex-1 rounded-full transition-all', STEPS.indexOf(s) <= stepIdx ? 'bg-purple-500' : 'bg-purple-100')} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">

          <AnimatePresence mode="wait" custom={dir}>
            {step === 'welcome' && (
              <motion.div key="welcome" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="bg-white rounded-3xl shadow-lg p-10 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><Sparkles size={28} /></div>
                <h1 className="font-serif text-3xl text-purple-700 mb-3">创建你的匿名档案</h1>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">你的真实身份将被完全隐藏，所有数据均脱敏存储。<br />我们只关心你的感受，而非你是谁。</p>
                <div className="bg-purple-50 rounded-2xl px-6 py-4 mb-6">
                  <p className="text-xs text-purple-400 mb-1">你的匿名昵称</p>
                  <p className="font-serif text-2xl text-purple-700">{anonymousName}</p>
                </div>
                <button className="text-sm text-purple-500 hover:text-purple-700 underline underline-offset-4 transition" onClick={() => setAnonymousName(generateName())}>换一个</button>
                <div className="mt-6">
                  <button className="rounded-full bg-purple-600 px-10 py-3.5 text-white font-semibold hover:bg-purple-700 transition text-lg" onClick={goNext}>开始自评 <ArrowRight className="inline w-5 h-5 ml-1" /></button>
                </div>
                <p className="text-xs text-gray-300 mt-4">包含 PHQ-9 抑郁量表 + GAD-7 焦虑量表，约3分钟</p>
              </motion.div>
            )}

            {step === 'phq9' && (
              <motion.div key="phq9" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="font-serif text-2xl text-purple-700 mb-1">PHQ-9 抑郁量表</h2>
                  <p className="text-sm text-gray-400">过去两周内，以下情况出现的频率</p>
                </div>
                <div className="flex gap-1 mb-4">
                  {PHQ9_QUESTIONS.map((_, i) => (
                    <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-all', i < phq9Q ? 'bg-purple-500' : i === phq9Q ? 'bg-purple-300' : 'bg-purple-100')} />
                  ))}
                </div>
                <p className="text-xs text-gray-400 text-center mb-2">第 {phq9Q + 1} 题 / 共 9 题 {phq9Q === 8 && <span className="text-red-400 font-medium ml-1">（关键题）</span>}</p>

                <div className={cn('bg-white rounded-3xl shadow-lg p-8 transition-all', phq9Q === 8 ? 'border-2 border-red-200' : 'border border-purple-100')}>
                  <p className="font-serif text-xl text-gray-800 text-center mb-8 leading-relaxed">
                    {PHQ9_QUESTIONS[phq9Q]}
                  </p>
                  <div className="space-y-3">
                    {SCALE_OPTIONS.map((opt) => (
                      <button key={opt.value} className={cn(
                        'w-full rounded-2xl py-4 px-6 text-left transition-all text-base',
                        phq9Answers[phq9Q] === opt.value
                          ? phq9Q === 8 && opt.value > 0 ? 'bg-red-50 text-red-700 ring-2 ring-red-400 font-semibold' : 'bg-purple-50 text-purple-700 ring-2 ring-purple-400 font-semibold'
                          : 'bg-gray-50 text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                      )} onClick={() => answerPhq9(opt.value)}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {phq9Answered > 0 && (
                  <div className={cn('rounded-2xl p-3 flex items-center justify-between', riskConf.bg)}>
                    <span className="text-sm text-gray-600">当前得分 <span className="font-bold text-purple-700">{phq9Score}</span></span>
                    <span className={cn('px-3 py-1 rounded-full text-xs font-bold', phq9Level.bg, phq9Level.color)}>{phq9Level.label}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button className="flex-1 rounded-2xl border border-gray-200 py-3 text-gray-500 font-medium hover:bg-gray-50 transition" onClick={goBack}>上一步</button>
                  {phq9Answered === 9 ? (
                    <button className="flex-1 rounded-2xl bg-purple-600 py-3 text-white font-bold hover:bg-purple-700 transition" onClick={goNext}>查看结果 <ArrowRight className="inline w-4 h-4" /></button>
                  ) : (
                    <button className="flex-1 rounded-2xl bg-gray-100 py-3 text-gray-400 font-medium cursor-not-allowed" disabled>请答完9题</button>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'phq9_result' && (
              <motion.div key="phq9_result" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="font-serif text-2xl text-purple-700 mb-1">PHQ-9 评估结果</h2>
                  <p className="text-sm text-gray-400">你的抑郁量表评估</p>
                </div>
                <div className={cn('rounded-3xl p-8 text-center', phq9Level.bg)}>
                  <p className="text-sm text-gray-500 mb-1">PHQ-9 得分</p>
                  <p className="text-5xl font-bold text-purple-700 mb-2">{phq9Score}</p>
                  <p className={cn('text-lg font-semibold', phq9Level.color)}>{phq9Level.label}</p>
                  <div className="mt-4 h-2 bg-white/60 rounded-full overflow-hidden max-w-xs mx-auto">
                    <div className={cn('h-full rounded-full transition-all', phq9Level.bar)} style={{ width: `${Math.min((phq9Score / 27) * 100, 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">0-4 无/极轻微 · 5-9 轻度 · 10-14 中度 · 15-19 中重度 · 20-27 重度</p>
                </div>
                {phq9Q9Answer > 0 && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-700 text-sm">检测到自伤意念</p>
                      <p className="text-xs text-red-600 mt-1">你的第9题答案表明存在自伤风险，我们将安排人工关怀介入。请继续完成焦虑量表评估。</p>
                    </div>
                  </div>
                )}
                <button className="w-full rounded-2xl bg-purple-600 py-4 text-white font-bold hover:bg-purple-700 transition shadow-lg" onClick={goNext}>继续：GAD-7 焦虑量表 <ArrowRight className="inline w-5 h-5 ml-1" /></button>
                <button className="w-full text-sm text-gray-400 hover:text-purple-600 transition py-2" onClick={goBack}>返回修改</button>
              </motion.div>
            )}

            {step === 'gad7' && (
              <motion.div key="gad7" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="font-serif text-2xl text-purple-700 mb-1">GAD-7 焦虑量表</h2>
                  <p className="text-sm text-gray-400">过去两周内，以下情况出现的频率</p>
                </div>
                <div className="flex gap-1 mb-4">
                  {GAD7_QUESTIONS.map((_, i) => (
                    <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-all', i < gad7Q ? 'bg-purple-500' : i === gad7Q ? 'bg-purple-300' : 'bg-purple-100')} />
                  ))}
                </div>
                <p className="text-xs text-gray-400 text-center mb-2">第 {gad7Q + 1} 题 / 共 7 题</p>

                <div className="bg-white rounded-3xl shadow-lg p-8 border border-purple-100">
                  <p className="font-serif text-xl text-gray-800 text-center mb-8 leading-relaxed">
                    {GAD7_QUESTIONS[gad7Q]}
                  </p>
                  <div className="space-y-3">
                    {SCALE_OPTIONS.map((opt) => (
                      <button key={opt.value} className={cn(
                        'w-full rounded-2xl py-4 px-6 text-left transition-all text-base',
                        gad7Answers[gad7Q] === opt.value
                          ? 'bg-purple-50 text-purple-700 ring-2 ring-purple-400 font-semibold'
                          : 'bg-gray-50 text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                      )} onClick={() => answerGad7(opt.value)}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {gad7Answered > 0 && (
                  <div className={cn('rounded-2xl p-3 flex items-center justify-between', gad7Level.bg)}>
                    <span className="text-sm text-gray-600">当前得分 <span className="font-bold text-purple-700">{gad7Score}</span></span>
                    <span className={cn('px-3 py-1 rounded-full text-xs font-bold', gad7Level.bg, gad7Level.color)}>{gad7Level.label}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button className="flex-1 rounded-2xl border border-gray-200 py-3 text-gray-500 font-medium hover:bg-gray-50 transition" onClick={goBack}>上一步</button>
                  {gad7Answered === 7 ? (
                    <button className="flex-1 rounded-2xl bg-purple-600 py-3 text-white font-bold hover:bg-purple-700 transition" onClick={goNext}>查看综合评估 <ArrowRight className="inline w-4 h-4" /></button>
                  ) : (
                    <button className="flex-1 rounded-2xl bg-gray-100 py-3 text-gray-400 font-medium cursor-not-allowed" disabled>请答完7题</button>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'gad7_result' && (
              <motion.div key="gad7_result" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="font-serif text-2xl text-purple-700 mb-1">综合评估</h2>
                  <p className="text-sm text-gray-400">你的心理健康评估总览</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className={cn('rounded-2xl p-5 text-center', phq9Level.bg)}>
                    <p className="text-xs text-gray-500 mb-1">PHQ-9 抑郁</p>
                    <p className="text-3xl font-bold text-purple-700">{phq9Score}</p>
                    <p className={cn('text-sm font-semibold mt-1', phq9Level.color)}>{phq9Level.label}</p>
                  </div>
                  <div className={cn('rounded-2xl p-5 text-center', gad7Level.bg)}>
                    <p className="text-xs text-gray-500 mb-1">GAD-7 焦虑</p>
                    <p className="text-3xl font-bold text-purple-700">{gad7Score}</p>
                    <p className={cn('text-sm font-semibold mt-1', gad7Level.color)}>{gad7Level.label}</p>
                  </div>
                </div>
                <div className={cn('rounded-2xl p-5 flex items-center justify-between', riskConf.bg)}>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <span className="font-medium text-gray-700">综合风险等级</span>
                  </div>
                  <span className={cn('px-4 py-1.5 rounded-full text-sm font-bold', riskConf.bg, riskConf.color)}>{riskConf.label}</span>
                </div>
                {(currentRisk === 'high' || currentRisk === 'critical' || currentRisk === 'crisis') && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">根据评估结果，我们建议你在使用平台的同时也寻求专业线下支持。完成后平台将安排人工关怀。</p>
                  </div>
                )}
                <button className="w-full rounded-2xl bg-purple-600 py-4 text-white font-bold hover:bg-purple-700 transition shadow-lg" onClick={goNext}>继续：选择生活事件 <ArrowRight className="inline w-5 h-5 ml-1" /></button>
                <button className="w-full text-sm text-gray-400 hover:text-purple-600 transition py-2" onClick={goBack}>返回修改</button>
              </motion.div>
            )}

            {step === 'tags' && (
              <motion.div key="tags" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="bg-white rounded-3xl shadow-lg p-8">
                <h2 className="font-serif text-2xl text-purple-700 text-center mb-2">最近生活中发生了什么？</h2>
                <p className="text-sm text-gray-400 text-center mb-6">可以选择多个，帮助我们更好地匹配咨询师</p>
                <div className="flex flex-wrap gap-3 justify-center mb-8">
                  {(Object.entries(LIFE_EVENT_LABELS) as [LifeEventTag, string][]).map(([tag, label]) => (
                    <button key={tag} className={cn(
                      'px-5 py-3 rounded-full text-sm font-medium transition-all',
                      selectedTags.includes(tag) ? 'bg-purple-600 text-white shadow-md scale-105' : 'bg-gray-50 text-gray-600 hover:bg-purple-50'
                    )} onClick={() => toggleTag(tag)}>{label}</button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 rounded-2xl border border-gray-200 py-3 text-gray-500 font-medium hover:bg-gray-50 transition" onClick={goBack}>上一步</button>
                  <button className="flex-1 rounded-2xl bg-purple-600 py-3 text-white font-bold hover:bg-purple-700 transition" onClick={goNext}>下一步 <ArrowRight className="inline w-4 h-4" /></button>
                </div>
              </motion.div>
            )}

            {step === 'goals' && (
              <motion.div key="goals" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="bg-white rounded-3xl shadow-lg p-8">
                <h2 className="font-serif text-2xl text-purple-700 text-center mb-2">你希望从咨询中获得什么？</h2>
                <p className="text-sm text-gray-400 text-center mb-6">可以选择多个，也可以自己写</p>
                <div className="flex flex-wrap gap-3 justify-center mb-6">
                  {COUNSELING_GOAL_TEMPLATES.map((goal) => (
                    <button key={goal} className={cn(
                      'px-5 py-2.5 rounded-full text-sm font-medium transition-all',
                      selectedGoals.includes(goal) ? 'bg-purple-600 text-white shadow-md scale-105' : 'bg-gray-50 text-gray-600 hover:bg-purple-50'
                    )} onClick={() => toggleGoal(goal)}>{goal}</button>
                  ))}
                </div>
                <textarea className="w-full rounded-2xl border border-purple-200 bg-gray-50 p-4 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" rows={3} placeholder="或者写下你的其他期望..." value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} />
                <div className="flex gap-3 mt-6">
                  <button className="flex-1 rounded-2xl border border-gray-200 py-3 text-gray-500 font-medium hover:bg-gray-50 transition" onClick={goBack}>上一步</button>
                  <button className="flex-1 rounded-2xl bg-purple-600 py-3 text-white font-bold hover:bg-purple-700 transition" onClick={goNext}>查看并提交 <ArrowRight className="inline w-4 h-4" /></button>
                </div>
              </motion.div>
            )}

            {step === 'review' && (
              <motion.div key="review" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="font-serif text-2xl text-purple-700 mb-1">确认你的档案</h2>
                  <p className="text-sm text-gray-400">检查信息后提交，创建匿名档案</p>
                </div>
                <div className="bg-white rounded-3xl shadow-lg p-6 space-y-3">
                  <div className="flex justify-between"><span className="text-sm text-gray-400">匿名昵称</span><span className="font-serif text-lg text-purple-700">{anonymousName}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-400">PHQ-9</span><div className="flex items-center gap-2"><span className="font-bold text-purple-700">{phq9Score}分</span><span className={cn('text-xs px-2 py-0.5 rounded-full', phq9Level.bg, phq9Level.color)}>{phq9Level.label}</span></div></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-400">GAD-7</span><div className="flex items-center gap-2"><span className="font-bold text-purple-700">{gad7Score}分</span><span className={cn('text-xs px-2 py-0.5 rounded-full', gad7Level.bg, gad7Level.color)}>{gad7Level.label}</span></div></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-400">风险等级</span><span className={cn('px-3 py-1 rounded-full text-xs font-bold', riskConf.bg, riskConf.color)}>{riskConf.label}</span></div>
                  {selectedTags.length > 0 && <div className="flex justify-between items-center"><span className="text-sm text-gray-400">生活事件</span><div className="flex flex-wrap gap-1 justify-end">{selectedTags.map((t) => <span key={t} className="bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full">{LIFE_EVENT_LABELS[t]}</span>)}</div></div>}
                  {(selectedGoals.length > 0 || customGoal.trim()) && <div className="flex justify-between"><span className="text-sm text-gray-400">咨询目标</span><span className="text-sm text-purple-600 max-w-[260px] truncate">{[...selectedGoals, customGoal.trim()].filter(Boolean).join('、')}</span></div>}
                </div>
                {(currentRisk === 'high' || currentRisk === 'critical' || currentRisk === 'crisis') && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">根据评估结果，提交后平台将安排人工关怀介入。</p>
                  </div>
                )}
                <button className={cn(
                  'w-full rounded-2xl py-4 text-base font-bold transition-all shadow-lg',
                  submitting ? 'bg-purple-200 text-purple-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'
                )} disabled={submitting} onClick={handleSubmit}>
                  <Check className="inline w-5 h-5 mr-1" />{submitting ? '提交中...' : '完成建档'}
                </button>
                <button className="w-full text-sm text-gray-400 hover:text-purple-600 transition py-2" onClick={goBack}>返回修改</button>
              </motion.div>
            )}

            {step === 'done' && savedProfile && (
              <motion.div key="done" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="bg-white rounded-3xl shadow-lg p-10 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }} className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500"><Check size={36} /></motion.div>
                <h2 className="font-serif text-2xl text-purple-700 mb-2">建档完成 🎉</h2>
                <p className="text-sm text-gray-400 mb-8">你的匿名档案已安全创建，所有后续页面均可使用</p>
                <div className="bg-purple-50 rounded-2xl p-6 text-left space-y-3 mb-6">
                  <div className="flex justify-between"><span className="text-sm text-gray-400">匿名昵称</span><span className="font-serif text-lg text-purple-700">{savedProfile.anonymous_name}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-400">PHQ-9</span><span className="font-bold text-purple-700">{savedProfile.phq9_score}分</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-400">GAD-7</span><span className="font-bold text-purple-700">{savedProfile.gad7_score}分</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-400">风险等级</span><span className={cn('px-3 py-1 rounded-full text-xs font-bold', (RISK_LEVEL_CONFIG[savedProfile.risk_level] || RISK_LEVEL_CONFIG.low).bg, (RISK_LEVEL_CONFIG[savedProfile.risk_level] || RISK_LEVEL_CONFIG.low).color)}>{(RISK_LEVEL_CONFIG[savedProfile.risk_level] || RISK_LEVEL_CONFIG.low).label}</span></div>
                </div>
                <div className="space-y-3">
                  <button className="w-full rounded-full bg-purple-600 px-8 py-3.5 text-white font-semibold hover:bg-purple-700 transition text-lg" onClick={() => navigate('/vent')}>前往倾诉初筛</button>
                  <button className="w-full rounded-full bg-emerald-500 px-8 py-3 text-white font-semibold hover:bg-emerald-600 transition" onClick={() => navigate('/match')}>查看匹配咨询师</button>
                  <button className="w-full text-sm text-gray-400 hover:text-purple-600 transition py-2" onClick={() => navigate('/dashboard')}>前往个人中心</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showCrisisModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowCrisisModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4"><Heart className="w-8 h-8 text-red-400" /><h2 className="font-serif text-xl text-gray-800">我们关心你的安全</h2></div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">你在第9题中选择了有自伤意念的选项。我们非常重视你的安全，以下资源可以立即帮助你：</p>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="w-4 h-4 text-red-400 shrink-0" /><span>24小时心理援助热线：400-161-9995</span></div>
                <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="w-4 h-4 text-red-400 shrink-0" /><span>北京心理危机研究与干预中心：010-82951332</span></div>
                <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="w-4 h-4 text-red-400 shrink-0" /><span>生命热线：400-821-1215</span></div>
              </div>
              <div className="flex gap-3">
                <a href="tel:4001619995" className="flex-1 bg-red-400 text-white rounded-full py-3 text-center text-sm font-semibold hover:bg-red-500 transition">我需要立即帮助</a>
                <button onClick={() => setShowCrisisModal(false)} className="flex-1 bg-purple-600 text-white rounded-full py-3 text-sm font-semibold hover:bg-purple-700 transition">继续评估</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
