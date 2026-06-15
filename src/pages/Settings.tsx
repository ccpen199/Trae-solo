import { useState, useEffect } from 'react';
import { Shield, Download, Trash2, Info, CheckCircle2, XCircle, Lock, CloudOff, Database, HardDrive, Clock, List, RotateCcw } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { getAuditLogs, clearAuditLogs, addAuditLog, type AuditLogEntry } from '../utils/audit';
import { formatTime } from '../lib/utils';

export default function Settings() {
  const { settings, updateSettings, loadSettings, clearData, resumes, loadAllResumes } = useResumeStore();
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [clearingAudit, setClearingAudit] = useState(false);

  useEffect(() => {
    loadSettings();
    loadAllResumes();
    loadAuditLogs();
  }, [loadSettings, loadAllResumes]);

  const loadAuditLogs = async () => {
    const logs = await getAuditLogs();
    setAuditLogs(logs);
  };

  const handlePrivacyToggle = async (checked: boolean) => {
    await updateSettings({ privacyMode: checked });
    await addAuditLog('privacy.toggle', { enabled: checked });
    await loadAuditLogs();
  };

  const handleExportData = () => {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      resumes: resumes,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    addAuditLog('data.export', { resumeCount: resumes.length });
    loadAuditLogs();
    setTimeout(() => setExportSuccess(false), 2000);
  };

  const handleClearData = async () => {
    setClearing(true);
    try {
      await addAuditLog('data.clear', { resumeCount: resumes.length });
      await clearData();
    } finally {
      setClearing(false);
      setShowClearDialog(false);
    }
  };

  const handleClearAuditLogs = async () => {
    setClearingAudit(true);
    try {
      await clearAuditLogs();
      await loadAuditLogs();
    } finally {
      setClearingAudit(false);
    }
  };

  const totalModules = resumes.reduce((sum, r) => sum + (r.modules?.length || 0), 0);
  const encryptedCount = resumes.filter(r => (r as any)._encrypted).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-navy-700 mb-2">
          设置
        </h1>
        <p className="text-navy-400">
          管理您的隐私、数据和应用偏好
        </p>
      </div>

      <section className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-navy-600" />
          </div>
          <div>
            <h2 className="section-title text-xl">隐私设置</h2>
          </div>
        </div>

        <div className="card p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-navy-700">隐私保护模式</span>
                {settings.privacyMode ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" />
                    已开启
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                    <XCircle className="w-3 h-3" />
                    已关闭
                  </span>
                )}
              </div>
              <p className="text-sm text-navy-400">
                {settings.privacyMode
                  ? '所有数据已启用本地 AES-256-GCM 加密存储，不会上传到任何服务器'
                  : '数据以明文形式存储在本地，请确保设备安全'}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={settings.privacyMode}
              onClick={() => handlePrivacyToggle(!settings.privacyMode)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gold-500/40 ${
                settings.privacyMode ? 'bg-navy-600' : 'bg-navy-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.privacyMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-navy-100" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-navy-100 bg-navy-25/40">
              <div className="flex items-center gap-2 mb-2">
                <CloudOff className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-navy-500">云端存储</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-emerald-600">已关闭</span>
              </div>
              <p className="text-xs text-navy-400 mt-1">数据不会上传到任何服务器</p>
            </div>
            <div className="p-4 rounded-lg border border-navy-100 bg-navy-25/40">
              <div className="flex items-center gap-2 mb-2">
                {settings.privacyMode ? <Lock className="w-4 h-4 text-emerald-500" /> : <Database className="w-4 h-4 text-amber-500" />}
                <span className="text-xs font-medium text-navy-500">存储方式</span>
              </div>
              <div className="flex items-center gap-1.5">
                {settings.privacyMode ? (
                  <>
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-600">AES加密</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-600">明文</span>
                  </>
                )}
              </div>
              <p className="text-xs text-navy-400 mt-1">{settings.privacyMode ? 'PBKDF2 密钥派生 + AES-GCM' : '建议开启加密保护'}</p>
            </div>
            <div className="p-4 rounded-lg border border-navy-100 bg-navy-25/40">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-navy-400" />
                <span className="text-xs font-medium text-navy-500">缓存位置</span>
              </div>
              <div className="text-sm font-semibold text-navy-700">IndexedDB</div>
              <p className="text-xs text-navy-400 mt-1">浏览器本地数据库</p>
            </div>
          </div>

          <div className="h-px bg-navy-100" />

          <div>
            <h3 className="font-medium text-navy-700 mb-3">本地缓存记录</h3>
            {resumes.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-navy-200 text-center">
                <p className="text-sm text-navy-400">暂无缓存数据</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {resumes.map(resume => (
                  <div key={resume.id} className="flex items-center justify-between p-3 rounded-lg border border-navy-100 bg-white">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {settings.privacyMode && <Lock className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                      <span className="text-sm text-navy-700 truncate">{resume.title || '未命名简历'}</span>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <span className="text-xs text-navy-400">{(resume.modules?.length || 0)} 个模块</span>
                      <span className="text-xs text-navy-400">{formatTime(resume.updatedAt)}</span>
                      {settings.privacyMode && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">已加密</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-navy-400 mt-2">
              共 {resumes.length} 份简历 · {totalModules} 个模块 · {encryptedCount} 份已加密
            </p>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center">
            <Database className="w-5 h-5 text-navy-600" />
          </div>
          <div>
            <h2 className="section-title text-xl">数据管理</h2>
          </div>
        </div>

        <div className="card p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-medium text-navy-700 mb-1">导出数据</h3>
              <p className="text-sm text-navy-400">
                将所有简历导出为 JSON 文件，共 {resumes.length} 份简历
              </p>
            </div>
            <button
              onClick={handleExportData}
              disabled={resumes.length === 0}
              className={`btn-secondary inline-flex items-center gap-2 text-sm ${
                exportSuccess ? '!bg-emerald-50 !text-emerald-600 !border-emerald-200' : ''
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {exportSuccess ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exportSuccess ? '已导出' : '导出 JSON'}
            </button>
          </div>

          <div className="h-px bg-navy-100" />

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-medium text-navy-700 mb-1">清空所有数据</h3>
              <p className="text-sm text-navy-400">
                永久删除本地 IndexedDB 中的所有简历和设置，此操作不可恢复
              </p>
            </div>
            <button
              onClick={() => setShowClearDialog(true)}
              className="inline-flex items-center gap-2 text-sm px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium border border-red-100 hover:bg-red-100 transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
              清空数据
            </button>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center">
            <List className="w-5 h-5 text-navy-600" />
          </div>
          <div>
            <h2 className="section-title text-xl">操作审计</h2>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-navy-700 mb-1">事件审计记录</h3>
              <p className="text-sm text-navy-400">
                记录您的所有关键操作，共 {auditLogs.length} 条（保留最近100条）
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadAuditLogs}
                className="btn-ghost text-sm inline-flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                刷新
              </button>
              <button
                onClick={() => setShowAuditLogs(!showAuditLogs)}
                className="btn-secondary text-sm inline-flex items-center gap-1"
              >
                <List className="w-4 h-4" />
                {showAuditLogs ? '收起' : '查看全部'}
              </button>
            </div>
          </div>

          {showAuditLogs && (
            <div className="space-y-3 mt-4 pt-4 border-t border-navy-100">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-navy-200 rounded-lg">
                  <Clock className="w-12 h-12 text-navy-200 mx-auto mb-3" />
                  <p className="text-sm text-navy-400">暂无操作记录</p>
                  <p className="text-xs text-navy-300 mt-1">创建或编辑简历后，操作记录将显示在这里</p>
                </div>
              ) : (
                <>
                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-navy-25/40 border border-navy-100">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-navy-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-navy-700">{log.action}</span>
                            <span className="text-xs text-navy-300">{formatTime(log.timestamp)}</span>
                          </div>
                          <div className="text-xs text-navy-400 font-mono bg-white/60 px-2 py-1 rounded mt-1 break-all">
                            {JSON.stringify(log.details)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-3 border-t border-navy-100">
                    <button
                      onClick={handleClearAuditLogs}
                      disabled={clearingAudit}
                      className="text-xs text-navy-400 hover:text-red-500 flex items-center gap-1 disabled:opacity-50"
                    >
                      {clearingAudit && (
                        <span className="w-3 h-3 border border-navy-300 border-t-navy-600 rounded-full animate-spin" />
                      )}
                      <Trash2 className="w-3 h-3" />
                      清空审计记录
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center">
            <Info className="w-5 h-5 text-navy-600" />
          </div>
          <div>
            <h2 className="section-title text-xl">关于</h2>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <div>
            <h3 className="text-sm font-medium text-navy-400 mb-1">版本号</h3>
            <p className="text-navy-700">v1.0.0</p>
          </div>

          <div className="h-px bg-navy-100" />

          <div>
            <h3 className="text-sm font-medium text-navy-400 mb-1">技术栈</h3>
            <p className="text-navy-700">
              React 18 + TypeScript + Vite · Zustand 状态管理 · Tailwind CSS · IndexedDB 本地存储 · Web Crypto API 加密
            </p>
          </div>

          <div className="h-px bg-navy-100" />

          <div>
            <h3 className="text-sm font-medium text-navy-400 mb-2">隐私声明</h3>
            <div className="text-navy-500 text-sm space-y-2 leading-relaxed">
              <p>
                本应用高度重视您的隐私。所有简历数据均仅存储在您的本地设备中，不会上传至任何服务器。
              </p>
              <p>
                当隐私保护模式开启时，数据采用 AES-256-GCM 加密算法进行加密存储，通过 PBKDF2 派生密钥，即使他人获取您的设备物理访问权限，也无法直接读取您的简历内容。
              </p>
              <p>
                本应用不会收集、存储或传输任何个人身份信息。您的全部数据完全由您掌控。您可以随时导出或清空数据。
              </p>
            </div>
          </div>
        </div>
      </section>

      {showClearDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm"
            onClick={() => !clearing && setShowClearDialog(false)}
          />
          <div className="relative card p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-navy-700 text-lg">确认清空所有数据？</h3>
                <p className="text-sm text-navy-400 mt-1">
                  此操作将永久删除本地 IndexedDB 中的所有 {resumes.length} 份简历和设置，且无法恢复。建议您先导出数据备份。
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowClearDialog(false)}
                disabled={clearing}
                className="btn-ghost disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleClearData}
                disabled={clearing}
                className="px-5 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                {clearing && (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {clearing ? '清空中...' : '确认清空'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
