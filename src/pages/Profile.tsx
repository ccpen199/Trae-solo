import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Lock,
  ShieldCheck,
  Upload,
  ScanLine,
  Brain,
  FileDown,
  ChevronRight,
  Eye,
  Clock,
  List,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useResumeStore } from '../store/resumeStore';
import { getAuditLogs, ACTION_LABELS } from '../utils/audit';
import type { AuditLogEntry } from '../utils/audit';
import { formatTime, cn } from '../lib/utils';

export default function Profile() {
  const {
    resumes,
    settings,
    lastDiagnosis,
    lastAtsCheck,
    atsPassed,
    loadAllResumes,
    loadSettings,
  } = useResumeStore();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [showAllLogs, setShowAllLogs] = useState(false);

  useEffect(() => {
    loadAllResumes();
    loadSettings();
    loadAuditLogs();
  }, [loadAllResumes, loadSettings]);

  const loadAuditLogs = async () => {
    const logs = await getAuditLogs();
    setAuditLogs(logs);
  };

  const latestResume = resumes[0];
  const latestDiagnosis = latestResume ? lastDiagnosis[latestResume.id] : null;
  const latestAtsCheck = latestResume ? lastAtsCheck[latestResume.id] : null;
  const latestAtsPassed = latestResume ? atsPassed[latestResume.id] : false;

  const getScoreColor = (score: number, type: 'diag' | 'ats') => {
    if (type === 'diag') {
      return score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600';
    }
    return score >= 85 ? 'text-emerald-600' : score >= 65 ? 'text-amber-600' : 'text-red-600';
  };

  const getScoreBg = (score: number, type: 'diag' | 'ats') => {
    if (type === 'diag') {
      return score >= 80 ? 'bg-emerald-100' : score >= 60 ? 'bg-amber-100' : 'bg-red-100';
    }
    return score >= 85 ? 'bg-emerald-100' : score >= 65 ? 'bg-amber-100' : 'bg-red-100';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-navy-700 mb-2">个人中心</h1>
        <p className="text-navy-400">查看本地账号状态、简历缓存、导入来源和导出前复查链路。</p>
      </div>

      {/* 状态卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="card p-5">
          <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-navy-600" />
          </div>
          <p className="text-sm text-navy-400">我的简历</p>
          <p className="text-3xl font-semibold text-navy-700">{resumes.length}</p>
          {resumes.length > 0 && (
            <p className="text-xs text-navy-400 mt-1">最近更新：{formatTime(latestResume?.updatedAt || 0)}</p>
          )}
        </div>
        <div className="card p-5">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
            settings.privacyMode ? 'bg-emerald-50' : 'bg-amber-50'
          )}>
            <Lock className={cn('w-5 h-5', settings.privacyMode ? 'text-emerald-600' : 'text-amber-600')} />
          </div>
          <p className="text-sm text-navy-400">隐私模式状态</p>
          <p className="text-lg font-semibold text-navy-700">
            {settings.privacyMode ? 'AES 本地加密已开启' : '本地明文存储'}
          </p>
          <p className="text-xs text-navy-400 mt-1">
            {settings.privacyMode ? '所有简历数据已 AES-256 加密存储' : '建议开启隐私模式保护个人信息'}
          </p>
        </div>
        <div className="card p-5">
          <div className="w-10 h-10 rounded-lg bg-gold-50 flex items-center justify-center mb-3">
            <List className="w-5 h-5 text-gold-600" />
          </div>
          <p className="text-sm text-navy-400">事件审计记录</p>
          <p className="text-lg font-semibold text-navy-700">{auditLogs.length} 条记录</p>
          {auditLogs.length > 0 && (
            <p className="text-xs text-navy-400 mt-1">
              最近：{ACTION_LABELS[auditLogs[0]?.action] || auditLogs[0]?.action} · {formatTime(auditLogs[0]?.timestamp)}
            </p>
          )}
        </div>
      </div>

      {/* 最近简历工作流 */}
      {latestResume && (
        <section className="card p-6 mb-8">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="section-title text-xl">最近简历工作流</h2>
              <p className="text-sm text-navy-400">保存来源、导入状态、诊断与导出前校验集中展示。</p>
            </div>
            <Link to="/templates" className="btn-primary inline-flex items-center gap-2">
              <Upload className="w-4 h-4" />
              新建 / 导入
            </Link>
          </div>

          <div className="border border-navy-100 rounded-lg p-4 mb-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-navy-700">
                    {latestResume.title || '未命名简历'}
                  </h3>
                  {settings.privacyMode && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-medium text-emerald-600">
                      <Lock className="w-3 h-3" />
                      AES加密
                    </span>
                  )}
                </div>
                <p className="text-sm text-navy-400">
                  保存来源：{latestResume.templateId} · 最近更新：{formatTime(latestResume.updatedAt)}
                </p>
              </div>
              <Link to={`/editor/${latestResume.id}`} className="btn-secondary inline-flex items-center justify-center">
                继续编辑
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* AI 诊断结果 */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-navy-600" />
              <h4 className="font-medium text-navy-700">AI 诊断结果</h4>
              <span className="text-xs text-navy-400">（空洞表述 · 时序矛盾 · 关键词缺失 · HR改写建议）</span>
            </div>

            {latestDiagnosis ? (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-navy-50 p-3 text-center">
                  <div className={cn(
                    'w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl font-bold mb-2',
                    getScoreBg(latestDiagnosis.score, 'diag')
                  )}>
                    <span className={getScoreColor(latestDiagnosis.score, 'diag')}>
                      {latestDiagnosis.score}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-navy-700">综合评分</p>
                  <p className="text-[10px] text-navy-400">满分100</p>
                </div>
                <div className="rounded-lg bg-orange-50 p-3 text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {latestDiagnosis.emptyPhrases?.length || 0}
                  </div>
                  <p className="text-xs font-medium text-navy-700">空洞表述</p>
                  <p className="text-[10px] text-navy-400">处需优化</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-center">
                  <div className="text-2xl font-bold text-amber-600 mb-1">
                    {latestDiagnosis.timelineConflicts?.length || 0}
                  </div>
                  <p className="text-xs font-medium text-navy-700">时序矛盾</p>
                  <p className="text-[10px] text-navy-400">处需检查</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-3 text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {latestDiagnosis.missingKeywords?.length || 0}
                  </div>
                  <p className="text-xs font-medium text-navy-700">关键词缺失</p>
                  <p className="text-[10px] text-navy-400">个待补充</p>
                </div>
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-navy-200 rounded-lg text-center bg-navy-25/20">
                <Brain className="w-12 h-12 text-navy-200 mx-auto mb-3" />
                <p className="text-sm text-navy-500 mb-1">尚未进行 AI 诊断</p>
                <p className="text-xs text-navy-400 mb-4">检测空洞表述、时序矛盾、关键词缺失，获取 HR 视角改写建议</p>
                <Link to={`/diagnosis/${latestResume.id}`} className="btn-primary inline-flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  立即进行 AI 诊断
                </Link>
              </div>
            )}

            {latestDiagnosis && (
              <Link to={`/diagnosis/${latestResume.id}`} className="mt-3 text-sm text-navy-500 hover:text-gold-500 inline-flex items-center gap-1">
                查看完整诊断报告与 HR 视角改写建议
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* ATS 检测结果 */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <ScanLine className="w-4 h-4 text-emerald-600" />
              <h4 className="font-medium text-navy-700">ATS 兼容性检测</h4>
              <span className="text-xs text-navy-400">（字体嵌入 · 表格结构 · 超链接有效性 · 关键词密度）</span>
              {latestAtsPassed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[11px] font-medium text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" />
                  已通过
                </span>
              )}
            </div>

            {latestAtsCheck ? (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-emerald-50 p-3 text-center">
                  <div className={cn(
                    'w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl font-bold mb-2',
                    getScoreBg(latestAtsCheck.score, 'ats')
                  )}>
                    <span className={getScoreColor(latestAtsCheck.score, 'ats')}>
                      {latestAtsCheck.score}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-navy-700">ATS评分</p>
                  <p className="text-[10px] text-navy-400">≥85分通过</p>
                </div>
                <div className="rounded-lg p-3 text-center" style={{ backgroundColor: latestAtsCheck.fontSafety?.isSafe ? '#ecfdf5' : '#fef2f2' }}>
                  {latestAtsCheck.fontSafety?.isSafe ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  )}
                  <p className="text-xs font-medium text-navy-700">字体嵌入</p>
                  <p className="text-[10px] text-navy-400">
                    {latestAtsCheck.fontSafety?.isSafe ? 'ATS安全字体' : '需调整字体'}
                  </p>
                </div>
                <div className="rounded-lg p-3 text-center" style={{ backgroundColor: latestAtsCheck.tableStructure?.isValid ? '#ecfdf5' : '#fffbeb' }}>
                  {latestAtsCheck.tableStructure?.isValid ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  )}
                  <p className="text-xs font-medium text-navy-700">表格结构</p>
                  <p className="text-[10px] text-navy-400">
                    {latestAtsCheck.tableStructure?.isValid ? '结构规范' : `${latestAtsCheck.tableStructure?.issues?.length || 0}个问题`}
                  </p>
                </div>
                <div className="rounded-lg p-3 text-center" style={{ backgroundColor: (latestAtsCheck.linkValidity?.invalidCount || 0) === 0 ? '#ecfdf5' : '#fffbeb' }}>
                  {(latestAtsCheck.linkValidity?.invalidCount || 0) === 0 ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  )}
                  <p className="text-xs font-medium text-navy-700">链接有效性</p>
                  <p className="text-[10px] text-navy-400">
                    {latestAtsCheck.linkValidity?.totalCount || 0}个链接
                    {(latestAtsCheck.linkValidity?.invalidCount || 0) > 0 && ` · ${latestAtsCheck.linkValidity.invalidCount}失效`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 border-2 border-dashed border-emerald-200 rounded-lg text-center bg-emerald-25/20">
                <ScanLine className="w-12 h-12 text-emerald-200 mx-auto mb-3" />
                <p className="text-sm text-navy-500 mb-1">尚未进行 ATS 兼容性检测</p>
                <p className="text-xs text-navy-400 mb-4">检测字体嵌入、表格结构、超链接有效性，导出前强制通过</p>
                <Link to={`/ats-check/${latestResume.id}`} className="btn-primary inline-flex items-center gap-2" style={{ backgroundColor: '#059669' }}>
                  <ScanLine className="w-4 h-4" />
                  立即进行 ATS 检测
                </Link>
              </div>
            )}

            {latestAtsCheck && (
              <Link to={`/ats-check/${latestResume.id}`} className="mt-3 text-sm text-navy-500 hover:text-gold-500 inline-flex items-center gap-1">
                查看完整检测报告与修复建议
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* 导出状态 */}
          <div className="p-4 bg-navy-25/50 rounded-lg border border-navy-100">
            <div className="flex items-center gap-2 mb-2">
              <FileDown className="w-4 h-4 text-navy-600" />
              <h4 className="font-medium text-navy-700">Word 原生导出</h4>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-navy-500">
                导出前 ATS 检测：
                {latestAtsPassed ? (
                  <span className="text-emerald-600 font-medium ml-1">✓ 已通过，可直接导出</span>
                ) : (
                  <span className="text-amber-600 font-medium ml-1">⚠ 未检测/未通过，导出时将提示</span>
                )}
              </span>
            </div>
            <p className="text-xs text-navy-400 mt-2">
              .docx 格式原生生成，非 PDF 转换，保留完整格式、表格、超链接
            </p>
          </div>
        </section>
      )}

      {/* 所有简历列表 */}
      {resumes.length > 0 && (
        <section className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="section-title text-xl">全部简历缓存</h2>
              <p className="text-sm text-navy-400">本地存储的所有简历，隐私模式下自动加密</p>
            </div>
          </div>

          <div className="space-y-3">
            {resumes.map((resume) => {
              const diag = lastDiagnosis[resume.id];
              const ats = lastAtsCheck[resume.id];
              const passed = atsPassed[resume.id];

              return (
                <div key={resume.id} className="border border-navy-100 rounded-lg p-4 hover:border-gold-300 transition-colors">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-navy-700 truncate">
                          {resume.title || '未命名简历'}
                        </h3>
                        {settings.privacyMode && (
                          <span className="text-emerald-500">
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-navy-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(resume.updatedAt)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-navy-50">
                          {resume.templateId}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {resume.modules?.length || 0} 模块
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {diag && (
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          diag.score >= 80 ? 'bg-emerald-50 text-emerald-600' :
                          diag.score >= 60 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                        )}>
                          AI {diag.score}分
                        </span>
                      )}
                      {ats && (
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          passed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        )}>
                          ATS {ats.score}分
                        </span>
                      )}
                      <Link to={`/editor/${resume.id}`} className="btn-ghost text-xs px-3 py-1.5">
                        编辑
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 事件审计摘要 */}
      <section className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="section-title text-xl">事件审计记录</h2>
            <p className="text-sm text-navy-400">所有关键操作的本地审计日志，可追溯可复查</p>
          </div>
          <Link to="/settings" className="btn-secondary inline-flex items-center gap-2 text-sm">
            管理后台
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 审计分类统计 */}
        {auditLogs.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-1">简历操作</p>
              <p className="text-xl font-bold text-blue-700">
                {auditLogs.filter(l => l.action.startsWith('resume.')).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
              <p className="text-xs text-purple-600 font-medium mb-1">模块操作</p>
              <p className="text-xl font-bold text-purple-700">
                {auditLogs.filter(l => l.action.startsWith('module.')).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <p className="text-xs text-emerald-600 font-medium mb-1">AI检测</p>
              <p className="text-xl font-bold text-emerald-700">
                {auditLogs.filter(l => l.action === 'ai.diagnosis' || l.action === 'ats.check').length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
              <p className="text-xs text-amber-600 font-medium mb-1">模板使用</p>
              <p className="text-xl font-bold text-amber-700">
                {auditLogs.filter(l => l.action.startsWith('template.')).length}
              </p>
            </div>
          </div>
        )}

        {auditLogs.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-navy-200 rounded-lg">
            <List className="w-12 h-12 text-navy-200 mx-auto mb-3" />
            <p className="text-sm text-navy-400">暂无审计记录</p>
            <p className="text-xs text-navy-300 mt-1">创建或编辑简历后，操作记录将显示在这里</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {auditLogs.slice(0, showAllLogs ? auditLogs.length : 5).map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-navy-25/40 border border-navy-100">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-navy-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-navy-700">
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                    <span className="text-xs text-navy-300">{formatTime(log.timestamp)}</span>
                  </div>
                  <div className="text-xs text-navy-400 font-mono bg-white/60 px-2 py-1 rounded mt-1 break-all">
                    {JSON.stringify(log.details)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {auditLogs.length > 5 && (
          <button
            onClick={() => setShowAllLogs(!showAllLogs)}
            className="mt-4 text-sm text-navy-500 hover:text-gold-500 inline-flex items-center gap-1 mx-auto block"
          >
            {showAllLogs ? '收起' : `查看全部 ${auditLogs.length} 条记录`}
            <ChevronRight className={cn('w-4 h-4 transition-transform', showAllLogs && 'rotate-90')} />
          </button>
        )}
      </section>
    </div>
  );
}
