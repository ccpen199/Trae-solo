import { useState } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit3,
  Sliders,
  ArrowRight,
  RefreshCw,
  Database,
  Clock,
  Copy,
  Bookmark,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';

const demoText = `钟宝申先生现任隆基绿能科技股份有限公司董事长一职。隆基绿能通过全资子公司隆基乐叶开展组件制造业务。通威股份与福斯特签署了为期三年的光伏胶膜采购框架协议。市场传闻高瓴资本将参与海康威视最新一轮定向增发。`;

export default function ExtractionCenter() {
  const { triples, verifyTriple } = useAppStore();
  const [text, setText] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState(0);
  const [showVerified, setShowVerified] = useState<'all' | 'verified' | 'pending'>('all');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startExtract = () => {
    if (!text.trim()) return;
    setIsExtracting(true);
    setTimeout(() => {
      setIsExtracting(false);
      setExtracted(true);
    }, 1600);
  };

  const loadDemo = () => {
    setText(demoText);
  };

  const displayTriples = triples.filter((t) => {
    if (t.confidence < confidenceFilter) return false;
    if (showVerified === 'verified' && !t.verified) return false;
    if (showVerified === 'pending' && t.verified) return false;
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-6">
      <div className="mb-6 animate-fade-in-up">
        <h1 className="font-serif text-2xl font-semibold text-gold-200">信息抽取中心</h1>
        <p className="mt-1 text-sm text-slate-500">
          上传文档或粘贴文本，自动抽取财经实体关系三元组，并支持人工校验修正
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 space-y-5 animate-fade-in-up">
          <div className="glass-panel rounded-xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <FileText className="h-4 w-4 text-gold-400" />
                文本输入
              </h3>
              <button
                onClick={loadDemo}
                className="text-xs text-gold-400 hover:text-gold-300"
              >
                加载示例文本
              </button>
            </div>
            <div className="rounded-lg border border-dashed border-gold-500/15 bg-finance-900/40 p-3">
              <div className="mb-3 flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-gold-500/15 bg-finance-800/60 px-3 py-1.5 text-xs text-slate-300 transition hover:border-gold-500/30 hover:text-gold-300">
                  <Upload className="h-3.5 w-3.5" />
                  上传 PDF / Word
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" />
                </label>
                <span className="text-[11px] text-slate-600">支持单个文件 ≤ 20MB</span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="在此粘贴公告、研报或新闻内容，系统将自动识别实体并抽取关系三元组..."
                className="h-56 w-full resize-none rounded-md border border-gold-500/10 bg-finance-900/60 p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-gold-500/40 focus:outline-none"
              />
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
                <span>{text.length} 字符</span>
                <span>建议 500-5000 字获得最佳效果</span>
              </div>
            </div>
            <button
              onClick={startExtract}
              disabled={!text.trim() || isExtracting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-gold-500 to-gold-600 py-2.5 text-sm font-medium text-finance-900 shadow-gold transition hover:from-gold-400 hover:to-gold-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  LLM 正在抽取三元组...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  开始抽取
                </>
              )}
            </button>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
              <Clock className="h-4 w-4 text-gold-400" />
              抽取历史
            </h3>
            <div className="space-y-2">
              {[
                { name: '光伏行业2025中期策略.pdf', count: 42, time: '今天 10:24', status: 'done' },
                { name: '腾讯控股-2025Q1业绩公告.pdf', count: 28, time: '昨天 16:48', status: 'done' },
                { name: '财联社-海康威视定增报道.txt', count: 12, time: '昨天 09:12', status: 'pending' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border border-gold-500/10 bg-finance-900/30 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-finance-700/50 text-slate-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-200">{item.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.time} · 抽取 {item.count} 条三元组
                      </p>
                    </div>
                  </div>
                  {item.status === 'done' ? (
                    <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" />
                      已完成
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">
                      <Database className="h-3 w-3" />
                      待审核
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-7 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <div className="glass-panel flex h-full flex-col rounded-xl">
            <div className="flex items-center justify-between border-b border-gold-500/10 px-5 py-3">
              <div className="flex items-center gap-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <Sparkles className="h-4 w-4 text-gold-400" />
                  抽取结果 · 三元组
                </h3>
                <span className="rounded bg-gold-500/10 px-2 py-0.5 text-[11px] text-gold-300">
                  {displayTriples.length} 条
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-md border border-gold-500/10 bg-finance-800/60 p-0.5 text-[11px]">
                  {(['all', 'verified', 'pending'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setShowVerified(v)}
                      className={`rounded px-2.5 py-1 transition ${
                        showVerified === v
                          ? 'bg-gold-500/15 text-gold-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {v === 'all' ? '全部' : v === 'verified' ? '已审核' : '待审核'}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 rounded-md border border-gold-500/10 bg-finance-800/60 px-2.5 py-1 text-[11px] text-slate-400">
                  <Sliders className="h-3 w-3" />
                  <span>置信度 ≥</span>
                  <input
                    type="range"
                    min={0}
                    max={0.95}
                    step={0.05}
                    value={confidenceFilter}
                    onChange={(e) => setConfidenceFilter(parseFloat(e.target.value))}
                    className="w-20 accent-gold-500"
                  />
                  <span className="w-8 text-right text-gold-300">
                    {(confidenceFilter * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {!extracted && !isExtracting && displayTriples.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/10">
                    <Sparkles className="h-8 w-8 text-gold-400" />
                  </div>
                  <p className="mt-4 text-sm text-slate-300">
                    请在左侧输入文本或上传文档以开始抽取
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    系统将识别主体、谓词、客体，并生成结构化三元组
                  </p>
                </div>
              ) : isExtracting ? (
                <div className="flex h-full flex-col items-center justify-center">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-full border-2 border-gold-500/20 border-t-gold-500 animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-gold-400" />
                  </div>
                  <p className="mt-4 text-sm text-slate-300">LLM 正在解析文本...</p>
                  <p className="mt-1 text-xs text-slate-500">识别实体 → 构建关系 → 置信度评分</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayTriples.map((t, i) => (
                    <div
                      key={t.id}
                      className="animate-fade-in-up rounded-lg border border-gold-500/10 bg-finance-900/40 p-4 transition hover:border-gold-500/25"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex flex-1 items-center gap-2 rounded-md bg-finance-800/70 p-2">
                          <span className="shrink-0 rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] text-blue-300">
                            主体
                          </span>
                          <span className="flex-1 text-sm text-slate-200">{t.subject.name}</span>
                          <span className="text-[10px] text-slate-500">{t.subject.type}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-gold-500" />
                        <div className="flex flex-1 items-center gap-2 rounded-md bg-gold-500/5 p-2 ring-1 ring-gold-500/20">
                          <span className="shrink-0 rounded bg-gold-500/15 px-1.5 py-0.5 text-[10px] text-gold-300">
                            谓词
                          </span>
                          {editingId === t.id ? (
                            <input
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => setEditingId(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') setEditingId(null);
                              }}
                              className="flex-1 bg-transparent text-sm text-gold-200 outline-none"
                            />
                          ) : (
                            <span className="flex-1 text-sm font-medium text-gold-200">
                              {t.predicate}
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setEditingId(t.id);
                              setEditValue(t.predicate);
                            }}
                            className="shrink-0 text-slate-500 hover:text-gold-400"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-gold-500" />
                        <div className="flex flex-1 items-center gap-2 rounded-md bg-finance-800/70 p-2">
                          <span className="shrink-0 rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] text-purple-300">
                            客体
                          </span>
                          <span className="flex-1 text-sm text-slate-200">{t.object.name}</span>
                          <span className="text-[10px] text-slate-500">{t.object.type}</span>
                        </div>
                      </div>

                      <p className="mt-3 rounded-md bg-finance-900/60 px-3 py-2 text-xs text-slate-400 ring-1 ring-gold-500/5">
                        <span className="mr-2 text-[10px] uppercase tracking-wider text-slate-500">
                          原文片段：
                        </span>
                        {t.sourceText}
                      </p>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-finance-700">
                              <div
                                className={`h-full rounded-full ${
                                  t.confidence >= 0.9
                                    ? 'bg-signal-positive'
                                    : t.confidence >= 0.8
                                      ? 'bg-signal-warning'
                                      : 'bg-signal-danger'
                                }`}
                                style={{ width: `${t.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-slate-400">
                              置信度 {(t.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          {t.verified ? (
                            <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" />
                              已审核
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">
                              <Clock className="h-3 w-3" />
                              待审核
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-slate-400 transition hover:bg-finance-700/50 hover:text-slate-200">
                            <Copy className="h-3 w-3" />
                            复制
                          </button>
                          <button className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-slate-400 transition hover:bg-finance-700/50 hover:text-slate-200">
                            <Bookmark className="h-3 w-3" />
                            收藏
                          </button>
                          {!t.verified ? (
                            <>
                              <button
                                onClick={() => verifyTriple(t.id, false)}
                                className="flex items-center gap-1 rounded border border-red-500/20 bg-red-500/10 px-2 py-1 text-[11px] text-red-300 transition hover:bg-red-500/20"
                              >
                                <XCircle className="h-3 w-3" />
                                驳回
                              </button>
                              <button
                                onClick={() => verifyTriple(t.id, true)}
                                className="flex items-center gap-1 rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-300 transition hover:bg-emerald-500/20"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                通过
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
