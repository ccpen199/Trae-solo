import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Clock, Shield, Monitor, Laptop, Smartphone,
  RefreshCw, Save, GitCompare, Download,
  ArrowRightLeft, Trash2,
} from 'lucide-react';
import { useResumeStore } from '@/stores/resumeStore';

const tabs = [
  { key: 'versions', label: '版本管理', icon: Clock },
  { key: 'sync', label: '同步状态', icon: RefreshCw },
  { key: 'security', label: '数据安全', icon: Shield },
] as const;
type TabKey = typeof tabs[number]['key'];

const mockVersions = [
  { id: 'v3', label: 'v3 - 投递阿里', date: '2026-06-10', diff: '更新了项目经历描述，强化STAR法则；调整了技能排序' },
  { id: 'v2', label: 'v2 - 星巴克投递版', date: '2026-06-05', diff: '新增了星巴克实习经历；修改了个人总结措辞' },
  { id: 'v1', label: 'v1 - 初始版本', date: '2026-05-28', diff: '简历初始创建，包含基本信息、教育背景和工作经历' },
];

const devices = [
  { icon: Monitor, name: 'Web浏览器', status: '已同步', time: '3分钟前', color: 'bg-green-500' },
  { icon: Laptop, name: 'macOS桌面客户端', status: '同步中...', time: '', color: 'bg-yellow-500 animate-pulse' },
  { icon: Smartphone, name: '微信小程序', status: '未连接', time: '', color: 'bg-red-500' },
];

export default function Profile() {
  const [tab, setTab] = useState<TabKey>('versions');
  const [expandedV, setExpandedV] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCompare, setSelectedCompare] = useState<string[]>([]);
  const [encryptOn, setEncryptOn] = useState(true);
  const [exportFmt, setExportFmt] = useState('json');
  const { saveVersion } = useResumeStore();

  const toggleCompareSelect = (id: string) => {
    setSelectedCompare((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 2 ? [...prev, id] : prev,
    );
  };

  return (
    <div className="min-h-screen bg-surface-50 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <User className="w-6 h-6 text-brand-500" />
        <h1 className="font-display text-3xl font-bold text-brand-900">个人中心</h1>
      </div>
      <div className="flex items-center gap-4 mb-8 bg-white rounded-xl border border-surface-200 p-5">
        <div className="w-14 h-14 rounded-full bg-brand-500/10 flex items-center justify-center text-xl font-bold text-brand-500">U</div>
        <div>
          <p className="font-display text-lg font-semibold text-brand-900">张明远</p>
          <p className="font-body text-sm text-surface-300">zhangmy@example.com</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-surface-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setExpandedV(null); setSelectedCompare([]); setCompareMode(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-brand-500 text-brand-500' : 'border-transparent text-surface-300 hover:text-brand-500'
            }`}
          >
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'versions' && (
          <motion.div key="versions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => saveVersion('手动保存')} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
                <Save className="w-4 h-4" />保存当前版本
              </button>
              <button onClick={() => { setCompareMode(!compareMode); setSelectedCompare([]); }}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors ${
                  compareMode ? 'bg-brand-500 text-white border-brand-500' : 'border-surface-200 text-surface-300 hover:border-brand-500 hover:text-brand-500'
                }`}>
                <GitCompare className="w-4 h-4" />对比版本
              </button>
            </div>

            <div className="relative pl-6 border-l-2 border-brand-200 space-y-0">
              {mockVersions.map((v) => (
                <div key={v.id} className="relative mb-5 last:mb-0">
                  <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-brand-500 border-2 border-white" />
                  {compareMode && (
                    <input type="checkbox" checked={selectedCompare.includes(v.id)} onChange={() => toggleCompareSelect(v.id)}
                      className="absolute -left-[50px] top-1 w-3.5 h-3.5 accent-brand-500" disabled={!selectedCompare.includes(v.id) && selectedCompare.length >= 2} />
                  )}
                  <div className="bg-white rounded-lg border border-surface-200 p-4 cursor-pointer hover:border-brand-300 transition-colors"
                    onClick={() => !compareMode && setExpandedV(expandedV === v.id ? null : v.id)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-display font-semibold text-brand-900 text-sm">{v.label}</p>
                        <p className="font-body text-xs text-surface-300 mt-0.5">{v.date}</p>
                      </div>
                      <div className="w-12 h-16 rounded bg-brand-50 border border-surface-200 flex flex-col gap-1 p-1.5">
                        <div className="h-1.5 w-6 bg-brand-500/20 rounded" /><div className="h-1 w-full bg-surface-100 rounded" /><div className="h-1 w-3/4 bg-surface-100 rounded" />
                      </div>
                    </div>
                    <AnimatePresence>
                      {expandedV === v.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="mt-3 pt-3 border-t border-surface-100 text-xs font-body text-surface-300 leading-relaxed">{v.diff}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>

            {compareMode && selectedCompare.length === 2 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid grid-cols-2 gap-4">
                {selectedCompare.map((sid) => {
                  const sv = mockVersions.find((x) => x.id === sid)!;
                  return (
                    <div key={sid} className="bg-white rounded-lg border border-brand-300 p-4">
                      <p className="font-display font-semibold text-brand-900 text-sm mb-1">{sv.label}</p>
                      <p className="font-body text-xs text-surface-300 mb-2">{sv.date}</p>
                      <p className="text-xs font-body text-surface-300 leading-relaxed">{sv.diff}</p>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        )}

        {tab === 'sync' && (
          <motion.div key="sync" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <div className="space-y-3 mb-6">
              {devices.map((d) => (
                <div key={d.name} className="flex items-center gap-4 bg-white rounded-lg border border-surface-200 p-4">
                  <d.icon className="w-5 h-5 text-surface-300" />
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-brand-900 text-sm">{d.name}</p>
                    <p className="font-body text-xs text-surface-300">{d.status}{d.time && ` (${d.time})`}</p>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${d.color} shrink-0`} />
                  <button className="btn-ghost text-xs px-3 py-1 flex items-center gap-1"><RefreshCw className="w-3 h-3" />同步</button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="font-body text-xs text-surface-300">上次全量同步：2026-06-12 09:15</p>
              <button className="btn-primary flex items-center gap-2 text-sm px-4 py-2"><RefreshCw className="w-4 h-4" />全部同步</button>
            </div>
          </motion.div>
        )}

        {tab === 'security' && (
          <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-5">
            {/* Encryption */}
            <div className="bg-white rounded-xl border border-surface-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center"><Shield className="w-5 h-5 text-brand-500" /></div>
                  <div>
                    <p className="font-display font-semibold text-brand-900">端到端加密</p>
                    <p className={`text-sm font-medium ${encryptOn ? 'text-brand-500' : 'text-surface-300'}`}>{encryptOn ? '已启用' : '未启用'}</p>
                  </div>
                </div>
                <button onClick={() => setEncryptOn(!encryptOn)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${encryptOn ? 'bg-brand-500' : 'bg-surface-200'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${encryptOn ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
              {encryptOn && <p className="font-mono text-xs text-surface-300 bg-surface-50 rounded px-3 py-1.5">密钥指纹: a3:f7:2b:9c:e1:4d:8a:5f</p>}
            </div>

            {/* Export */}
            <div className="bg-white rounded-xl border border-surface-200 p-5">
              <h3 className="font-display font-semibold text-brand-900 mb-3">数据导出</h3>
              <div className="flex gap-3 mb-4">
                {[{ k: 'json', l: 'JSON' }, { k: 'pdf', l: 'PDF打包' }, { k: 'word', l: 'Word打包' }].map((f) => (
                  <label key={f.k} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                    exportFmt === f.k ? 'border-brand-500 bg-brand-50 text-brand-500' : 'border-surface-200 text-surface-300 hover:border-brand-300'
                  }`}>
                    <input type="radio" name="fmt" value={f.k} checked={exportFmt === f.k} onChange={() => setExportFmt(f.k)} className="sr-only" />
                    <span className="text-sm font-medium">{f.l}</span>
                  </label>
                ))}
              </div>
              <button className="btn-secondary flex items-center gap-2 text-sm px-4 py-2"><Download className="w-4 h-4" />导出</button>
            </div>

            {/* Migration */}
            <div className="bg-white rounded-xl border border-surface-200 p-5">
              <h3 className="font-display font-semibold text-brand-900 mb-1">数据迁移</h3>
              <p className="font-body text-xs text-surface-300 mb-3">支持 JSON、Markdown 等格式，便于迁移至其他简历平台</p>
              <button className="btn-ghost flex items-center gap-2 text-sm px-4 py-2"><ArrowRightLeft className="w-4 h-4" />生成迁移包</button>
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl border-2 border-red-300 bg-red-50/50 p-5">
              <h3 className="font-display font-semibold text-red-600 mb-2">危险区域</h3>
              <button className="bg-red-500 hover:bg-red-600 text-white font-body font-semibold rounded-lg px-4 py-2 text-sm inline-flex items-center gap-2 transition-colors">
                <Trash2 className="w-4 h-4" />删除所有数据
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
