import { useState, useEffect } from 'react';
import { Shield, Download, Trash2, Info, CheckCircle2, XCircle } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';

export default function Settings() {
  const { settings, updateSettings, loadSettings, clearData, resumes, loadAllResumes } = useResumeStore();
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
    loadAllResumes();
  }, [loadSettings, loadAllResumes]);

  const handlePrivacyToggle = async (checked: boolean) => {
    await updateSettings({ privacyMode: checked });
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
    setTimeout(() => setExportSuccess(false), 2000);
  };

  const handleClearData = async () => {
    setClearing(true);
    try {
      await clearData();
    } finally {
      setClearing(false);
      setShowClearDialog(false);
    }
  };

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
                    ? '所有数据已启用本地 AES 加密存储，不会上传到任何服务器'
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
                  永久删除本地存储的所有简历和设置，此操作不可恢复
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
                  当隐私保护模式开启时，数据采用 AES 加密算法进行加密存储，即使他人获取您的设备物理访问权限，也无法直接读取您的简历内容。
                </p>
                <p>
                  本应用不会收集、存储或传输任何个人身份信息。您的全部数据完全由您掌控。
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
                    此操作将永久删除本地存储的所有简历和设置，且无法恢复。建议您先导出数据备份。
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
    </Layout>
  );
}
