import { useState } from "react";
import {
  ShieldCheck,
  ChevronRight,
  BarChart3,
  Target,
  TrendingUp,
  Clock,
  Wallet,
  Brain,
  CheckCircle2,
  RotateCcw,
  Award,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

interface Question {
  id: number;
  title: string;
  options: { label: string; score: number }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    title: "您的投资经验如何？",
    options: [
      { label: "完全没有投资经验", score: 1 },
      { label: "有存款/理财经验", score: 2 },
      { label: "投资过基金/股票", score: 3 },
      { label: "有丰富投资经验，熟悉衍生品", score: 4 },
    ],
  },
  {
    id: 2,
    title: "您能接受的最大投资亏损比例是？",
    options: [
      { label: "不能接受任何亏损", score: 1 },
      { label: "10%以内", score: 2 },
      { label: "10%-30%", score: 3 },
      { label: "30%以上", score: 4 },
    ],
  },
  {
    id: 3,
    title: "您的可投资金融资产规模？",
    options: [
      { label: "10万元以下", score: 1 },
      { label: "10万-50万元", score: 2 },
      { label: "50万-200万元", score: 3 },
      { label: "200万元以上", score: 4 },
    ],
  },
  {
    id: 4,
    title: "您倾向的投资期限？",
    options: [
      { label: "1年以内（短期）", score: 1 },
      { label: "1-3年（中短期）", score: 2 },
      { label: "3-5年（中期）", score: 3 },
      { label: "5年以上（长期）", score: 4 },
    ],
  },
  {
    id: 5,
    title: "您的投资主要目标是？",
    options: [
      { label: "保本保息，稳定增值", score: 1 },
      { label: "稳健增值，控制风险", score: 2 },
      { label: "平衡收益与风险", score: 3 },
      { label: "追求高收益，可承担高风险", score: 4 },
    ],
  },
  {
    id: 6,
    title: "当投资亏损15%时，您会如何操作？",
    options: [
      { label: "立即赎回，避免更大损失", score: 1 },
      { label: "部分赎回，降低仓位", score: 2 },
      { label: "继续持有，等待反弹", score: 3 },
      { label: "加仓买入，摊低成本", score: 4 },
    ],
  },
];

const LEVELS = [
  { key: "conservative", label: "保守型", color: "text-emerald-600", bg: "bg-emerald-50", desc: "适合低风险产品，建议R1级理财及存款类产品" },
  { key: "stable", label: "稳健型", color: "text-sky-600", bg: "bg-sky-50", desc: "适合中低风险产品，建议R1-R2级产品" },
  { key: "balanced", label: "平衡型", color: "text-brand-600", bg: "bg-brand-50", desc: "可接受中等风险，建议R1-R3级产品组合" },
  { key: "aggressive", label: "进取型", color: "text-amber-600", bg: "bg-amber-50", desc: "追求较高收益，建议R1-R4级产品组合" },
  { key: "radical", label: "激进型", color: "text-rose-600", bg: "bg-rose-50", desc: "追求高收益，可投资全品类产品" },
];

export default function RiskAssessment() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);

  const q = QUESTIONS[current];
  const progress = ((current + (answers[q?.id] ? 1 : 0)) / QUESTIONS.length) * 100;

  const total = Object.values(answers).reduce((s, v) => s + v, 0);
  const levelIdx = Math.min(Math.floor((total - 6) / 4), 4);
  const level = LEVELS[Math.max(0, levelIdx)];

  const radar = [
    { subject: "风险承受", A: total / 2.4, fullMark: 10 },
    { subject: "投资经验", A: (answers[1] || 2) * 2.5, fullMark: 10 },
    { subject: "资产规模", A: (answers[3] || 2) * 2.5, fullMark: 10 },
    { subject: "投资期限", A: (answers[4] || 2) * 2.5, fullMark: 10 },
    { subject: "收益目标", A: (answers[5] || 2) * 2.5, fullMark: 10 },
    { subject: "波动耐受", A: (answers[6] || 2) * 2.5, fullMark: 10 },
  ];

  const hasAnsweredCurrent = answers[q?.id] !== undefined;

  const select = (score: number) => {
    setAnswers({ ...answers, [q.id]: score });
  };

  const goNext = () => {
    if (!hasAnsweredCurrent) return;
    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1);
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold text-brand-700 flex items-center gap-2">
                  <Award className="w-6 h-6 text-gold-500" /> 测评完成
                </h3>
                <p className="text-sm text-slate-500 mt-1">测评结果有效期1年，请根据结果选择适合您的产品</p>
              </div>
              <button onClick={() => { setFinished(false); setCurrent(0); setAnswers({}); }} className="btn-secondary text-sm">
                <RotateCcw className="w-4 h-4" /> 重新测评
              </button>
            </div>

            <div className={`rounded-xl p-6 ${level.bg} mb-6`}>
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className={`w-8 h-8 ${level.color}`} />
                <div>
                  <div className="text-sm text-slate-500">您的风险承受能力等级</div>
                  <div className={`text-3xl font-bold ${level.color}`}>{level.label}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-sm text-slate-500">测评得分</div>
                  <div className="text-3xl font-bold text-brand-700">{total} <span className="text-lg">/ 24</span></div>
                </div>
              </div>
              <p className="text-sm text-slate-700">{level.desc}</p>
            </div>

            <h4 className="font-semibold text-brand-700 mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4" /> 风险画像分析
            </h4>
            <div className="h-72">
              <ResponsiveContainer>
                <RadarChart data={radar}>
                  <PolarGrid stroke="#c8dcef" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: "#475569" }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar name="能力值" dataKey="A" stroke="#1B3A5C" fill="#1B3A5C" fillOpacity={0.35} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h4 className="font-semibold text-brand-700 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" /> 为您推荐
            </h4>
            <div className="space-y-3">
              {[
                { n: "稳利宝90天", r: "R2", rate: "3.85%", term: "90天", t: "稳健增值" },
                { n: "均衡增利混合", r: "R3", rate: "6.20%", term: "1年", t: "平衡收益" },
                { n: "年年盈年金险", r: "R2", rate: "4.10%", term: "3年", t: "长期保障" },
              ].map((p) => (
                <div key={p.n} className="p-4 rounded-xl bg-gradient-to-br from-brand-50 to-gold-50 border border-brand-100/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-brand-700">{p.n}</span>
                    <span className="tag-info">{p.r}</span>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> 预期年化
                      </div>
                      <div className="text-xl font-bold text-rose-600">{p.rate}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {p.term}
                      </div>
                      <div className="text-xs text-gold-600">{p.t}</div>
                    </div>
                  </div>
                  <button className="w-full btn-primary text-sm mt-3 py-1.5" onClick={() => navigate("/finance")}>
                    查看详情 <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-500" />
              <span className="text-sm text-slate-600">
                第 <span className="font-bold text-brand-600">{current + 1}</span> / {QUESTIONS.length} 题
              </span>
            </div>
            <span className="text-sm text-slate-500">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-gradient transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <h2 className="text-xl font-bold text-brand-800 mb-6 flex items-start gap-3">
          <span className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center text-base shrink-0">
            {current + 1}
          </span>
          {q.title}
        </h2>

        <div className="space-y-3">
          {q.options.map((opt, idx) => {
            const selected = answers[q.id] === opt.score;
            return (
              <div
                key={idx}
                onClick={() => select(opt.score)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selected
                    ? "border-brand-500 bg-brand-50 shadow-sm"
                    : "border-slate-200 hover:border-brand-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selected ? "border-brand-500 bg-brand-500" : "border-slate-300"
                  }`}>
                    {selected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`${selected ? "text-brand-700 font-semibold" : "text-slate-700"}`}>
                    {opt.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setCurrent(Math.max(0, current - 1))}
            disabled={current === 0}
            className="btn-secondary"
          >
            上一题
          </button>
          <div className="flex items-center gap-1">
            {QUESTIONS.map((_, idx) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full transition ${
                  answers[QUESTIONS[idx].id]
                    ? "bg-brand-500"
                    : idx === current
                    ? "bg-brand-300"
                    : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <Wallet className="w-4 h-4" /> 已完成 {Object.keys(answers).length} 题
            </span>
            <button
              onClick={goNext}
              disabled={!hasAnsweredCurrent}
              className={`btn-primary ${!hasAnsweredCurrent ? "opacity-50 cursor-not-allowed bg-slate-300 border-slate-300 hover:bg-slate-300" : ""}`}
            >
              {current === QUESTIONS.length - 1 ? "提交测评" : "下一题"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
