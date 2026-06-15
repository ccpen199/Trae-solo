import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useResumeStore } from '../store/resumeStore';
import { checkAtsCompatibility } from '../utils/atsCheck';
import { exportResumeToWord } from '../utils/wordExport';
import type { AtsCheckResult } from '../types';

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 85
      ? '#10b981'
      : score >= 65
        ? '#f59e0b'
        : '#ef4444';

  const bgColor =
    score >= 85
      ? 'bg-emerald-50'
      : score >= 65
        ? 'bg-amber-50'
        : 'bg-red-50';

  const textColor =
    score >= 85
      ? 'text-emerald-600'
      : score >= 65
        ? 'text-amber-600'
        : 'text-red-600';

  const label =
    score >= 85
      ? '优秀'
      : score >= 65
        ? '良好'
        : '需优化';

  return (
    <div className={`card p-6 ${bgColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ScanLine className={`w-5 h-5 ${textColor}`} />
          <span className="font-semibold text-navy-700">ATS 兼容性评分</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-3xl font-bold ${textColor}`}>{score}</span>
          <span className={`text-sm font-medium ${textColor}`}>{label}</span>
        </div>
      </div>
      <div className="w-full h-3 bg-white rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function FontSafetyCard({ fontSafety }: { fontSafety: AtsCheckResult['fontSafety'] }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🔤</span>
        <h3 className="font-semibold text-navy-700">字体安全性</h3>
        {fontSafety.isSafe ? (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            通过
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
            <XCircle className="w-3 h-3" />
            未通过
          </span>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-sm text-navy-600">
          当前字体：<span className="font-medium">{fontSafety.font || '未设置'}</span>
        </p>
        {!fontSafety.isSafe && fontSafety.safeAlternatives.length > 0 && (
          <div>
            <p className="text-xs text-navy-400 mb-1.5">推荐 ATS 安全字体：</p>
            <div className="flex flex-wrap gap-2">
              {fontSafety.safeAlternatives.map((font) => (
                <span
                  key={font}
                  className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-medium"
                >
                  {font}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TableStructureCard({ issues }: { issues: AtsCheckResult['tableStructure'] }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📊</span>
        <h3 className="font-semibold text-navy-700">表格结构</h3>
        {issues.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            通过
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
            <AlertTriangle className="w-3 h-3" />
            {issues.length} 个问题
          </span>
        )}
      </div>
      {issues.length === 0 ? (
        <p className="text-sm text-navy-400">简历结构简单扁平，有利于 ATS 解析</p>
      ) : (
        <div className="space-y-3">
          {issues.map((issue, idx) => (
            <div key={idx} className="border border-amber-100 rounded-lg p-3 bg-amber-25/40">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-navy-700">{issue.location}</p>
                  <p className="text-xs text-navy-500 mt-0.5">{issue.issue}</p>
                  <p className="text-xs text-navy-400 mt-1">建议：{issue.suggestion}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LinkValidityCard({ links }: { links: AtsCheckResult['linkValidity'] }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🔗</span>
        <h3 className="font-semibold text-navy-700">链接有效性</h3>
        {links.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-navy-50 text-navy-500 font-medium">
            无链接
          </span>
        ) : links.every((l) => l.isValid) ? (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            全部通过
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">
            <XCircle className="w-3 h-3" />
            存在无效链接
          </span>
        )}
      </div>
      {links.length === 0 ? (
        <p className="text-sm text-navy-400">简历中未检测到链接</p>
      ) : (
        <div className="space-y-2">
          {links.map((link, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 p-3 rounded-lg border ${
                link.isValid
                  ? 'border-emerald-100 bg-emerald-25/40'
                  : 'border-red-100 bg-red-25/40'
              }`}
            >
              {link.isValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-navy-700 break-all">{link.url}</p>
                <p className={`text-xs mt-0.5 ${link.isValid ? 'text-emerald-600' : 'text-red-500'}`}>
                  {link.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KeywordDensityCard({ keywords }: { keywords: AtsCheckResult['keywordDensity'] }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📈</span>
        <h3 className="font-semibold text-navy-700">关键词密度</h3>
        {keywords.length === 0 ? (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-navy-50 text-navy-500 font-medium">
            无数据
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-navy-50 text-navy-500 font-medium">
            {keywords.length} 个关键词
          </span>
        )}
      </div>
      {keywords.length === 0 ? (
        <p className="text-sm text-navy-400">未检测到关键词密度数据</p>
      ) : (
        <div className="space-y-3">
          {keywords.map((kw, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-navy-700 font-medium">{kw.keyword}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-navy-400">
                    密度 {kw.density.toFixed(2)}%
                  </span>
                  {kw.isOptimal ? (
                    <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      最优
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      偏离
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full h-2 bg-navy-50 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    kw.isOptimal ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                  style={{ width: `${Math.min(kw.density * 33.33, 100)}%` }}
                />
                <div className="absolute top-0 left-[16.67%] w-px h-full bg-navy-200" />
                <div className="absolute top-0 left-[100%] w-px h-full bg-navy-200" />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[10px] text-navy-300">0.5%</span>
                <span className="text-[10px] text-navy-300">3%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AtsCheck() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentResume, loadResume } = useResumeStore();
  const [result, setResult] = useState<AtsCheckResult | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (id) {
      loadResume(id);
    }
  }, [id, loadResume]);

  useEffect(() => {
    if (currentResume) {
      const check = checkAtsCompatibility(currentResume, currentResume.fontFamily);
      setResult(check);
    }
  }, [currentResume]);

  const handleExportWord = async () => {
    if (!currentResume) return;
    setExporting(true);
    try {
      await exportResumeToWord(currentResume);
    } finally {
      setExporting(false);
    }
  };

  if (!currentResume || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-navy-300 border-t-navy-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-navy-400">正在加载检测报告...</p>
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
              <ScanLine className="w-5 h-5 text-navy-600" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-navy-700">ATS 兼容性检测</h1>
          </div>
          <p className="text-navy-400 text-sm">
            「{currentResume.title}」的检测报告
          </p>
        </div>

        <div className="mb-10">
          <ScoreBar score={result.score} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          <FontSafetyCard fontSafety={result.fontSafety} />
          <TableStructureCard issues={result.tableStructure} />
          <LinkValidityCard links={result.linkValidity} />
          <KeywordDensityCard keywords={result.keywordDensity} />
        </div>

        {result.suggestions.length > 0 && (
          <div className="card p-6 mb-10">
            <h2 className="font-semibold text-navy-700 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-gold-500" />
              修复建议
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
            onClick={() => navigate(`/editor/${id}`)}
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            返回编辑
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportWord}
            disabled={exporting}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {exporting && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            导出 Word
          </button>
        </div>
      </div>
    </div>
  );
}
