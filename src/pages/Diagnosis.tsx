import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Brain,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { useResumeStore } from '../store/resumeStore';
import { diagnoseResume } from '../utils/aiDiagnosis';
import { addAuditLog } from '../utils/audit';
import type { DiagnosisResult, EmptyPhraseIssue, TimelineConflict } from '../types';

function ScoreRing({ score }: { score: number }) {
  const radius = 70;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80
      ? '#10b981'
      : score >= 60
        ? '#f59e0b'
        : '#ef4444';

  const bgColor =
    score >= 80
      ? '#ecfdf5'
      : score >= 60
        ? '#fffbeb'
        : '#fef2f2';

  const textColor =
    score >= 80
      ? 'text-emerald-600'
      : score >= 60
        ? 'text-amber-600'
        : 'text-red-600';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth} className="-rotate-90">
        <circle
          cx={(radius * 2 + strokeWidth) / 2}
          cy={(radius * 2 + strokeWidth) / 2}
          r={radius}
          fill={bgColor}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={(radius * 2 + strokeWidth) / 2}
          cy={(radius * 2 + strokeWidth) / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${textColor}`}>{score}</span>
        <span className="text-xs text-navy-400 mt-0.5">综合评分</span>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  count,
  accentColor,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  accentColor: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-navy-25 transition-colors duration-150"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: accentColor + '18', color: accentColor }}
          >
            {icon}
          </div>
          <span className="font-semibold text-navy-700">{title}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: accentColor + '18', color: accentColor }}
          >
            {count} 项
          </span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-navy-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-navy-400" />
        )}
      </button>
      {open && <div className="px-6 pb-5 space-y-4">{children}</div>}
    </div>
  );
}

function EmptyPhraseCard({ issue }: { issue: EmptyPhraseIssue }) {
  return (
    <div className="border border-orange-100 rounded-xl p-4 bg-orange-25/40">
      <div className="flex items-start gap-2 mb-2">
        <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-navy-700 font-medium break-all">{issue.text}</p>
          <p className="text-xs text-navy-400 mt-1">位置：{issue.location}</p>
        </div>
      </div>
      <div className="ml-6 space-y-2">
        <div className="text-sm text-navy-600">
          <span className="text-orange-500 font-medium">改写建议：</span>
          {issue.suggestion}
        </div>
        <div className="bg-white rounded-lg p-3 border border-orange-100">
          <p className="text-xs font-semibold text-navy-500 mb-1">STAR 模板参考</p>
          <pre className="text-xs text-navy-600 whitespace-pre-wrap leading-relaxed font-sans">
            {issue.starTemplate}
          </pre>
        </div>
      </div>
    </div>
  );
}

function TimelineConflictCard({ conflict }: { conflict: TimelineConflict }) {
  return (
    <div className="border border-amber-100 rounded-xl p-4 bg-amber-25/40">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                conflict.type === 'invalid'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              {conflict.type === 'invalid' ? '日期无效' : '时间重叠'}
            </span>
            <span className="text-xs text-navy-400">{conflict.location}</span>
          </div>
          <p className="text-sm text-navy-600">{conflict.message}</p>
        </div>
      </div>
    </div>
  );
}

export default function Diagnosis() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentResume, loadResume } = useResumeStore();
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  useEffect(() => {
    if (id) {
      loadResume(id);
    }
  }, [id, loadResume]);

  useEffect(() => {
    if (currentResume) {
      const diagnosis = diagnoseResume(currentResume, (String(currentResume.templateId).split('-')[0] as any) || 'tech');
      setResult(diagnosis);
      addAuditLog('ai.diagnosis', { resumeId: id, score: diagnosis.score, title: currentResume.title });
    }
  }, [currentResume, id]);

  const handleRerun = () => {
    if (currentResume) {
      const diagnosis = diagnoseResume(currentResume, (String(currentResume.templateId).split('-')[0] as any) || 'tech');
      setResult(diagnosis);
      addAuditLog('ai.diagnosis', { resumeId: id, score: diagnosis.score, title: currentResume.title, rerun: true });
    }
  };

  if (!currentResume || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-navy-300 border-t-navy-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-navy-400">正在加载诊断结果...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-25 to-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-navy-600" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-navy-700">AI简历诊断</h1>
          </div>
          <p className="text-navy-400 text-sm">
            「{currentResume.title}」的诊断报告
          </p>
        </div>

        <div className="flex justify-center mb-10">
          <ScoreRing score={result.score} />
        </div>

        <div className="space-y-5 mb-10">
          <CollapsibleSection
            title="空洞表述"
            icon={<AlertCircle className="w-4 h-4" />}
            count={result.emptyPhraseIssues.length}
            accentColor="#f97316"
          >
            {result.emptyPhraseIssues.length === 0 ? (
              <p className="text-sm text-navy-400 py-2">未检测到空洞表述，非常棒！</p>
            ) : (
              result.emptyPhraseIssues.map((issue, idx) => (
                <EmptyPhraseCard key={idx} issue={issue} />
              ))
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title="时序矛盾"
            icon={<AlertTriangle className="w-4 h-4" />}
            count={result.timelineConflicts.length}
            accentColor="#f59e0b"
          >
            {result.timelineConflicts.length === 0 ? (
              <p className="text-sm text-navy-400 py-2">未检测到时序矛盾，非常棒！</p>
            ) : (
              result.timelineConflicts.map((conflict, idx) => (
                <TimelineConflictCard key={idx} conflict={conflict} />
              ))
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title="缺失关键词"
            icon={<Lightbulb className="w-4 h-4" />}
            count={result.missingKeywordIssues.missingKeywords.length}
            accentColor="#6366f1"
          >
            <div className="space-y-3">
              {result.missingKeywordIssues.existingKeywords.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-navy-400 mb-2">已有关键词</p>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywordIssues.existingKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {result.missingKeywordIssues.missingKeywords.length > 0 ? (
                <div>
                  <p className="text-xs font-medium text-navy-400 mb-2">缺失关键词</p>
                  <div className="flex flex-wrap gap-2">
                    {result.missingKeywordIssues.missingKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 font-medium"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-navy-400 py-2">关键词覆盖良好！</p>
              )}
            </div>
          </CollapsibleSection>
        </div>

        {result.suggestions.length > 0 && (
          <div className="card p-6 mb-10">
            <h2 className="font-semibold text-navy-700 mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-gold-500" />
              综合建议
            </h2>
            <ul className="space-y-3">
              {result.suggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-navy-600">
                  <span className="w-5 h-5 rounded-full bg-navy-50 text-navy-500 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRerun}
            className="btn-ghost inline-flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重新诊断
          </button>
          <button
            onClick={() => navigate(`/editor/${id}`)}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            返回编辑
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
