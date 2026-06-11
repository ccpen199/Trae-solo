import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Clock, Shield, Monitor, Laptop, Smartphone,
  RefreshCw, Save, GitCompare, Download,
  ArrowRightLeft, Trash2, X, Check, Copy, Key, AlertTriangle,
  Upload, Eye, FileJson, FileText, ChevronRight, Lock, Unlock,
} from 'lucide-react';
import { useResumeStore } from '@/stores/resumeStore';

const tabs = [
  { key: 'versions', label: '版本管理', icon: Clock },
  { key: 'sync', label: '同步状态', icon: RefreshCw },
  { key: 'security', label: '数据安全', icon: Shield },
] as const;
type TabKey = typeof tabs[number]['key'];
type DeviceSyncState = 'idle' | 'syncing' | 'done';
interface Device { icon: typeof Monitor; name: string; status: string; time: string; color: string; syncState?: DeviceSyncState; syncResult?: string; }

const mockVersions = [
  { id: 'v3', label: 'v3 - 投递阿里', date: '2026-06-10', diff: '更新了项目经历描述，强化STAR法则；调整了技能排序' },
  { id: 'v2', label: 'v2 - 星巴克投递版', date: '2026-06-05', diff: '新增了星巴克实习经历；修改了个人总结措辞' },
  { id: 'v1', label: 'v1 - 初始版本', date: '2026-05-28', diff: '简历初始创建，包含基本信息、教育背景和工作经历' },
];

const encryptLogs = [
  { time: '2026-06-12 09:15', action: '简历数据自动加密' },
  { time: '2026-06-12 08:42', action: '用户手动解密查看' },
  { time: '2026-06-11 22:10', action: '版本快照加密保存' },
  { time: '2026-06-11 18:30', action: '跨设备同步加密传输' },
  { time: '2026-06-11 09:00', action: '系统启动自动加密' },
];

export default function Profile() {
  const [tab, setTab] = useState<TabKey>('versions');
  const [expandedV, setExpandedV] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCompare, setSelectedCompare] = useState<string[]>([]);
  const [encryptOn, setEncryptOn] = useState(true);
  const [showEncryptModal, setShowEncryptModal] = useState(false);
  const [encryptStep, setEncryptStep] = useState(1);
  const [encryptPhrase] = useState('简历-成长-翡翠-2026-星辰-大海');
  const [confirmYes, setConfirmYes] = useState('');
  const [showEncryptLogs, setShowEncryptLogs] = useState(false);
  const [showMigrateModal, setShowMigrateModal] = useState(false);
  const [migrateStep, setMigrateStep] = useState(1);
  const [migrateItems, setMigrateItems] = useState({ resumes: true, versions: true, favorites: false, settings: true });
  const [migrateFormat, setMigrateFormat] = useState<'json' | 'pdf' | 'word'>('json');
  const [migratePassword, setMigratePassword] = useState('');
  const [migrateProgress, setMigrateProgress] = useState(0);
  const [migrateDone, setMigrateDone] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSyncLog, setShowSyncLog] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([
    { icon: Monitor, name: 'Web浏览器', status: '已同步', time: '3分钟前', color: 'bg-green-500', syncState: 'idle' },
    { icon: Laptop, name: 'macOS桌面客户端', status: '待同步', time: '15分钟前', color: 'bg-yellow-500', syncState: 'idle' },
    { icon: Smartphone, name: '微信小程序', status: '未连接', time: '', color: 'bg-red-500', syncState: 'idle' },
  ]);
  const { saveVersion } = useResumeStore();
  const migrateTimerRef = useRef<number | null>(null);

  const toggleCompareSelect = (id: string) => {
    setSelectedCompare((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 2 ? [...prev, id] : prev);
  };

  const handleEncryptToggle = () => {
    setEncryptStep(1);
    setConfirmYes('');
    setShowEncryptModal(true);
  };

  const confirmEncryptChange = (enable: boolean) => {
    if (enable) {
      if (encryptStep < 2) { setEncryptStep(2); return; }
      setEncryptOn(true); setShowEncryptModal(false);
    } else {
      if (encryptStep < 2) { setEncryptStep(2); return; }
      if (confirmYes !== 'YES') return;
      setEncryptOn(false); setShowEncryptModal(false);
    }
  };

  const handleDeviceSync = (idx: number) => {
    const newDevices = [...devices];
    newDevices[idx].syncState = 'syncing';
    newDevices[idx].status = '同步中...';
    setDevices(newDevices);
    setTimeout(() => {
      const d = [...devices];
      d[idx].syncState = 'done';
      d[idx].status = '已同步';
      d[idx].time = '刚刚';
      d[idx].color = 'bg-green-500';
      d[idx].syncResult = '✓ 已同步 · 简历 3 份 / 版本快照 12 个 / 设置 1 组 · 耗时 1.2s';
      setDevices(d);
      setTimeout(() => {
        const r = [...devices];
        r[idx].syncState = 'idle';
        setDevices(r);
      }, 5000);
    }, 1500);
  };

  const handleMigrateNext = () => {
    if (migrateStep < 4) { setMigrateStep(migrateStep + 1); return; }
    setMigrateProgress(0);
    migrateTimerRef.current = window.setInterval(() => {
      setMigrateProgress((p) => {
        if (p >= 100) { if (migrateTimerRef.current) clearInterval(migrateTimerRef.current); setMigrateDone(true); return 100; }
        return p + 4;
      });
    }, 40);
  };

  const handleMigrateDownload = () => {
    const content = `ResumeForge Migration Package\nFormat: ${migrateFormat}\nItems: ${JSON.stringify(migrateItems)}\nEncrypted: ${migratePassword ? 'AES-256' : 'none'}\nGenerated: ${new Date().toISOString()}`;
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `resumeforge-migration.${migrateFormat}`; a.click();
    URL.revokeObjectURL(url);
  };

  const resetMigrate = () => {
    setMigrateStep(1); setMigrateProgress(0); setMigrateDone(false); setMigratePassword('');
    if (migrateTimerRef.current) clearInterval(migrateTimerRef.current);
  };

  return (
    <div className="min-h-screen bg-surface-50 p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6"><User className="w-6 h-6 text-brand-500" /><h1 className="font-display text-3xl font-bold text-brand-900">个人中心</h1></div>
      <div className="flex items-center gap-4 mb-6 bg-white rounded-xl border border-surface-200 p-4">
        <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center text-lg font-bold text-brand-500">U</div>
        <div><p className="font-display text-lg font-semibold text-brand-900">张明远</p><p className="font-body text-sm text-surface-300">zhangmy@example.com</p></div>
      </div>
      <div className="flex gap-1 mb-5 border-b border-surface-200">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setExpandedV(null); setSelectedCompare([]); setCompareMode(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-brand-500 text-brand-500' : 'border-transparent text-surface-300 hover:text-brand-500'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'versions' && (
          <motion.div key="versions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => saveVersion('手动保存')} className="btn-primary flex items-center gap-2 text-sm px-4 py-2"><Save className="w-4 h-4" />保存当前版本</button>
              <button onClick={() => { setCompareMode(!compareMode); setSelectedCompare([]); }}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors ${compareMode ? 'bg-brand-500 text-white border-brand-500' : 'border-surface-200 text-surface-300 hover:border-brand-500 hover:text-brand-500'}`}>
                <GitCompare className="w-4 h-4" />对比版本
              </button>
            </div>
            <div className="relative pl-6 border-l-2 border-brand-200 space-y-0">
              {mockVersions.map((v) => (
                <div key={v.id} className="relative mb-4 last:mb-0">
                  <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-brand-500 border-2 border-white" />
                  {compareMode && <input type="checkbox" checked={selectedCompare.includes(v.id)} onChange={() => toggleCompareSelect(v.id)} className="absolute -left-[50px] top-1 w-3.5 h-3.5 accent-brand-500" disabled={!selectedCompare.includes(v.id) && selectedCompare.length >= 2} />}
                  <div className="bg-white rounded-lg border border-surface-200 p-3.5 cursor-pointer hover:border-brand-300 transition-colors" onClick={() => !compareMode && setExpandedV(expandedV === v.id ? null : v.id)}>
                    <div className="flex items-center justify-between">
                      <div><p className="font-display font-semibold text-brand-900 text-sm">{v.label}</p><p className="font-body text-xs text-surface-300 mt-0.5">{v.date}</p></div>
                      <div className="w-10 h-14 rounded bg-brand-50 border border-surface-200 flex flex-col gap-1 p-1"><div className="h-1 w-5 bg-brand-500/20 rounded" /><div className="h-0.5 w-full bg-surface-100 rounded" /><div className="h-0.5 w-3/4 bg-surface-100 rounded" /></div>
                    </div>
                    <AnimatePresence>{expandedV === v.id && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="mt-2.5 pt-2.5 border-t border-surface-100 text-xs font-body text-surface-300 leading-relaxed">{v.diff}</div></motion.div>}</AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
            {compareMode && selectedCompare.length === 2 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid grid-cols-2 gap-4">
                {selectedCompare.map((sid) => { const sv = mockVersions.find((x) => x.id === sid)!; return (
                  <div key={sid} className="bg-white rounded-lg border border-brand-300 p-4">
                    <p className="font-display font-semibold text-brand-900 text-sm mb-1">{sv.label}</p>
                    <p className="font-body text-xs text-surface-300 mb-2">{sv.date}</p>
                    <p className="text-xs font-body text-surface-300 leading-relaxed">{sv.diff}</p>
                  </div>
                ); })}
              </motion.div>
            )}
          </motion.div>
        )}

        {tab === 'sync' && (
          <motion.div key="sync" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <div className="space-y-3 mb-5">
              {devices.map((d, idx) => (
                <div key={d.name} className="bg-white rounded-lg border border-surface-200 p-4">
                  <div className="flex items-center gap-4">
                    <d.icon className="w-5 h-5 text-surface-300" />
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-brand-900 text-sm">{d.name}</p>
                      <p className="font-body text-xs text-surface-300">{d.status}{d.time && ` (${d.time})`}</p>
                      {d.syncState === 'syncing' && <div className="mt-1.5 w-full h-1.5 bg-surface-100 rounded-full overflow-hidden"><motion.div className="h-full bg-brand-500 rounded-full" animate={{ width: ['0%', '100%'] }} transition={{ duration: 1.2, repeat: Infinity }} /></div>}
                      {d.syncState === 'done' && d.syncResult && <p className="text-[11px] font-body text-brand-600 mt-1">{d.syncResult} · {new Date().toLocaleTimeString('zh-CN')}</p>}
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full ${d.color} shrink-0 ${d.syncState === 'syncing' ? 'animate-pulse' : ''}`} />
                    <button onClick={() => handleDeviceSync(idx)} disabled={d.syncState === 'syncing'} className="btn-ghost text-xs px-3 py-1 flex items-center gap-1 disabled:opacity-50">
                      {d.syncState === 'syncing' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}同步
                    </button>
                  </div>
                  {d.syncState === 'done' && <button onClick={() => setShowSyncLog(showSyncLog === d.name ? null : d.name)} className="mt-2 text-[11px] text-surface-400 hover:text-brand-500 font-body">同步失败? 查看同步日志</button>}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between"><p className="font-body text-xs text-surface-300">上次全量同步：2026-06-12 09:15</p><button className="btn-primary flex items-center gap-2 text-sm px-4 py-2"><RefreshCw className="w-4 h-4" />全部同步</button></div>
          </motion.div>
        )}

        {tab === 'security' && (
          <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
            <div className="bg-white rounded-xl border border-surface-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">{encryptOn ? <Lock className="w-5 h-5 text-brand-500" /> : <Unlock className="w-5 h-5 text-surface-300" />}</div>
                  <div><p className="font-display font-semibold text-brand-900">端到端加密</p><p className={`text-sm font-medium ${encryptOn ? 'text-brand-500' : 'text-surface-300'}`}>{encryptOn ? '已启用' : '未启用'}</p></div>
                </div>
                <button onClick={handleEncryptToggle} className={`relative w-11 h-6 rounded-full transition-colors ${encryptOn ? 'bg-brand-500' : 'bg-surface-200'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${encryptOn ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              {encryptOn && (
                <div className="space-y-2">
                  <p className="font-mono text-xs text-surface-300 bg-surface-50 rounded px-3 py-1.5">密钥指纹: a3:f7:2b:9c:e1:4d:8a:5f</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-body text-surface-400 flex items-center gap-1.5"><Key className="w-3.5 h-3.5" /> 🔑 最近解密: 3分钟前</p>
                    <button onClick={() => setShowEncryptLogs(!showEncryptLogs)} className="text-xs text-brand-500 hover:text-brand-600 font-body flex items-center gap-1"><Eye className="w-3.5 h-3.5" />查看加密日志</button>
                  </div>
                  {showEncryptLogs && <div className="mt-2 bg-surface-50 rounded-lg p-3 space-y-1.5">{encryptLogs.map((l, i) => <div key={i} className="flex items-center justify-between text-[11px] font-body"><span className="text-surface-400 font-mono">{l.time}</span><span className="text-surface-600">{l.action}</span></div>)}</div>}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-surface-200 p-5">
              <h3 className="font-display font-semibold text-brand-900 mb-3">数据迁移</h3>
              <p className="font-body text-xs text-surface-300 mb-4">支持 JSON、PDF、Word 等格式，便于迁移至其他简历平台</p>
              <div className="flex gap-3">
                <button onClick={() => { resetMigrate(); setShowMigrateModal(true); }} className="btn-ghost flex items-center gap-2 text-sm px-4 py-2"><ArrowRightLeft className="w-4 h-4" />生成迁移包</button>
                <button onClick={() => setShowImportModal(true)} className="btn-ghost flex items-center gap-2 text-sm px-4 py-2 border border-surface-200"><Upload className="w-4 h-4" />导入迁移包</button>
              </div>
            </div>

            <div className="rounded-xl border-2 border-red-300 bg-red-50/50 p-5">
              <h3 className="font-display font-semibold text-red-600 mb-2">危险区域</h3>
              <button className="bg-red-500 hover:bg-red-600 text-white font-body font-semibold rounded-lg px-4 py-2 text-sm inline-flex items-center gap-2 transition-colors"><Trash2 className="w-4 h-4" />删除所有数据</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEncryptModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEncryptModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-surface-100">
                <h3 className="font-display font-bold text-brand-900">端到端加密设置</h3>
                <button onClick={() => setShowEncryptModal(false)} className="text-surface-300 hover:text-brand-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                {encryptStep === 1 && (
                  <div className="text-center space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 flex items-center justify-center"><AlertTriangle className="w-7 h-7 text-amber-500" /></div>
                    <p className="font-body text-sm text-brand-900 leading-relaxed">端到端加密是保护您简历数据的核心功能，确定要修改吗？</p>
                  </div>
                )}
                {encryptStep === 2 && !encryptOn && (
                  <div className="space-y-3">
                    <p className="text-xs font-body font-medium text-brand-900">请设置加密密钥助记词（请记牢这串文字，用于恢复数据）</p>
                    <div className="flex items-center gap-2 bg-brand-50 rounded-lg p-3 border border-brand-100">
                      <p className="font-mono text-sm text-brand-700 flex-1">{encryptPhrase}</p>
                      <button onClick={() => navigator.clipboard?.writeText(encryptPhrase)} className="text-brand-500 hover:text-brand-600"><Copy className="w-4 h-4" /></button>
                    </div>
                    <p className="text-[11px] text-surface-400 font-body">请妥善保管此助记词，丢失将无法恢复加密数据</p>
                  </div>
                )}
                {encryptStep === 2 && encryptOn && (
                  <div className="space-y-3">
                    <p className="text-xs font-body font-medium text-red-600">⚠ 关闭加密后数据将以明文存储，确定？输入 YES 确认：</p>
                    <input value={confirmYes} onChange={(e) => setConfirmYes(e.target.value)} placeholder="请输入 YES" className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:border-brand-500 font-mono" />
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowEncryptModal(false)} className="flex-1 py-2 text-sm font-medium rounded-lg border border-surface-200 text-surface-500 hover:border-brand-300 hover:text-brand-500 transition-colors">取消</button>
                  <button onClick={() => confirmEncryptChange(!encryptOn)} disabled={encryptStep === 2 && encryptOn && confirmYes !== 'YES'} className="flex-1 btn-primary py-2 text-sm disabled:opacity-50">
                    {encryptStep < 2 ? '下一步' : (encryptOn ? '确认关闭' : '确认启用')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showMigrateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowMigrateModal(false); resetMigrate(); }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-surface-100">
                <div><h3 className="font-display font-bold text-brand-900">生成迁移包</h3><p className="text-[11px] font-body text-surface-400 mt-0.5">步骤 {migrateStep} / 4</p></div>
                <button onClick={() => { setShowMigrateModal(false); resetMigrate(); }} className="text-surface-300 hover:text-brand-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5">
                {migrateStep === 1 && (
                  <div className="space-y-3">
                    <p className="text-xs font-body font-medium text-brand-900 mb-2">选择要迁移的内容</p>
                    {[{ k: 'resumes', l: '全部简历' }, { k: 'versions', l: '全部版本' }, { k: 'favorites', l: '案例收藏' }, { k: 'settings', l: '个人设置' }].map((it) => (
                      <label key={it.k} className="flex items-center gap-2.5 cursor-pointer py-1">
                        <input type="checkbox" checked={(migrateItems as any)[it.k]} onChange={(e) => setMigrateItems({ ...migrateItems, [it.k]: e.target.checked })} className="w-4 h-4 accent-brand-500 rounded" />
                        <span className="text-sm font-body text-surface-600">{it.l}</span>
                      </label>
                    ))}
                  </div>
                )}
                {migrateStep === 2 && (
                  <div className="space-y-3">
                    <p className="text-xs font-body font-medium text-brand-900 mb-2">选择导出格式</p>
                    <div className="space-y-2">
                      {[{ k: 'json', l: 'JSON', ic: FileJson }, { k: 'pdf', l: 'PDF包', ic: FileText }, { k: 'word', l: 'Word包', ic: FileText }].map((f) => (
                        <label key={f.k} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${migrateFormat === f.k ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-surface-200 text-surface-500 hover:border-brand-300'}`}>
                          <input type="radio" name="fmt2" value={f.k} checked={migrateFormat === f.k} onChange={() => setMigrateFormat(f.k as any)} className="sr-only" />
                          <f.ic className="w-4 h-4" /><span className="text-sm font-medium flex-1">{f.l}</span>
                          {migrateFormat === f.k && <Check className="w-4 h-4" />}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {migrateStep === 3 && (
                  <div className="space-y-3">
                    <p className="text-xs font-body font-medium text-brand-900 mb-2">设置访问密码（可选）</p>
                    <input type="password" value={migratePassword} onChange={(e) => setMigratePassword(e.target.value)} placeholder="留空则不加密" className="w-full px-3 py-2.5 text-sm border border-surface-200 rounded-lg focus:outline-none focus:border-brand-500 font-body" />
                    <p className="text-[11px] text-surface-400 font-body">设置密码后，迁移包将使用 AES-256 加密</p>
                  </div>
                )}
                {migrateStep === 4 && !migrateDone && (
                  <div className="py-6 space-y-4 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-brand-50 flex items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" /></div>
                    <p className="font-display font-semibold text-brand-900 text-sm">正在生成迁移包... {migrateProgress < 60 ? '打包数据' : '加密中'}</p>
                    <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden"><motion.div className="h-full bg-brand-500 rounded-full" style={{ width: `${migrateProgress}%` }} /></div>
                    <p className="text-center text-xs font-mono text-surface-400">{migrateProgress}%</p>
                  </div>
                )}
                {migrateStep === 4 && migrateDone && (
                  <div className="py-4 space-y-4 text-center">
                    <div className="w-14 h-14 mx-auto rounded-full bg-brand-500/10 flex items-center justify-center"><Check className="w-7 h-7 text-brand-500" /></div>
                    <div><p className="font-display font-bold text-brand-900 text-lg">✓ 迁移包已生成</p><p className="text-xs font-body text-surface-400 mt-1">12.4MB · 加密: {migratePassword ? 'AES-256' : '未加密'}</p></div>
                    <div className="flex gap-3">
                      <button onClick={() => { setShowMigrateModal(false); resetMigrate(); }} className="flex-1 py-2 text-sm font-medium rounded-lg border border-surface-200 text-surface-500 hover:border-brand-300 hover:text-brand-500 transition-colors">关闭</button>
                      <button onClick={handleMigrateDownload} className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-2"><Download className="w-4 h-4" /> 下载</button>
                    </div>
                  </div>
                )}
                {migrateStep < 4 && (
                  <div className="flex gap-3 pt-5">
                    <button onClick={() => migrateStep > 1 ? setMigrateStep(migrateStep - 1) : setShowMigrateModal(false)} className="flex-1 py-2 text-sm font-medium rounded-lg border border-surface-200 text-surface-500 hover:border-brand-300 hover:text-brand-500 transition-colors">{migrateStep > 1 ? '上一步' : '取消'}</button>
                    <button onClick={handleMigrateNext} className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-1.5">下一步<ChevronRight className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showImportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowImportModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-surface-100"><h3 className="font-display font-bold text-brand-900">导入迁移包</h3><button onClick={() => setShowImportModal(false)} className="text-surface-300 hover:text-brand-500"><X className="w-5 h-5" /></button></div>
              <div className="p-5">
                <div className="border-2 border-dashed border-surface-200 rounded-xl p-10 text-center hover:border-brand-400 transition-colors cursor-pointer">
                  <Upload className="w-10 h-10 mx-auto text-surface-300 mb-3" />
                  <p className="font-body text-sm text-brand-900 font-medium">点击或拖拽上传迁移包</p>
                  <p className="text-[11px] text-surface-400 mt-1">支持 .json / .zip 格式</p>
                </div>
                <div className="mt-4"><p className="text-xs font-body font-medium text-brand-900 mb-2">访问密码（如已加密）</p><input type="password" placeholder="请输入密码" className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:outline-none focus:border-brand-500 font-body" /></div>
                <button onClick={() => setShowImportModal(false)} className="w-full btn-primary py-2.5 text-sm mt-5 flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> 开始导入</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
