import { useState, useEffect } from 'react';
import { privacyApi } from '@/services/api';
import type { StorageInfo } from '@/types';
import { cn } from '@/lib/utils';
import {
  Shield,
  Lock,
  Unlock,
  HardDrive,
  Trash2,
  Download,
  FileVideo,
  Camera,
  CheckCircle,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const CLIPS = [
  { id: 'c1', time: '2026-06-14 09:12', dur: '00:32', size: 24.5, type: 'motion' },
  { id: 'c2', time: '2026-06-14 08:45', dur: '01:15', size: 58.2, type: 'visitor' },
  { id: 'c3', time: '2026-06-13 22:30', dur: '00:18', size: 14.1, type: 'motion' },
  { id: 'c4', time: '2026-06-13 18:05', dur: '02:40', size: 128.7, type: 'visitor' },
  { id: 'c5', time: '2026-06-13 14:22', dur: '00:45', size: 33.6, type: 'pet' },
  { id: 'c6', time: '2026-06-12 11:10', dur: '00:08', size: 6.3, type: 'motion' },
  { id: 'c7', time: '2026-06-12 07:33', dur: '01:52', size: 86.4, type: 'visitor' },
];

const PIE_COLORS = ['#00D4FF', '#1C3456', '#0F1F38'];

export default function Privacy() {
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [keyId, setKeyId] = useState('aes-256-gcm::7f3a…c9e2');
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    total: 128, used: 62.4, videoCount: 47, snapshotCount: 213, encrypted: true,
  });
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());

  useEffect(() => {
    privacyApi.getStorageInfo().then(setStorageInfo).catch(() => {});
    privacyApi.getEncryptionStatus().then((r) => {
      setEncryptionEnabled(r.enabled);
      setKeyId(r.keyId);
    }).catch(() => {});
  }, []);

  const toggleEncryption = async () => {
    const next = !encryptionEnabled;
    setEncryptionEnabled(next);
    try { await privacyApi.updateEncryption(next); } catch { setEncryptionEnabled(!next); }
  };

  const toggleClip = (id: string) => {
    setSelectedClips((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const free = storageInfo.total - storageInfo.used;
  const pct = storageInfo.total > 0 ? Math.round((storageInfo.used / storageInfo.total) * 100) : 0;
  const pieData = [
    { name: 'Video', value: storageInfo.used * 0.7 },
    { name: 'Snapshots', value: storageInfo.used * 0.3 },
    { name: 'Free', value: free },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold font-display gradient-text">隐私与存储</h1>

      <div className="grid grid-cols-2 gap-4">
        {/* Encryption Status */}
        <div className="glass-card hud-corner rounded-xl p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center',
              encryptionEnabled
                ? 'bg-accent-success/10 shadow-[0_0_24px_rgba(46,213,115,0.3)]'
                : 'bg-accent-danger/10 shadow-[0_0_24px_rgba(255,71,87,0.3)]',
            )}>
              <Shield className={cn('w-8 h-8', encryptionEnabled ? 'text-accent-success' : 'text-accent-danger')} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400">端到端加密</h3>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={toggleEncryption}
                  className={cn(
                    'relative h-7 w-12 rounded-full transition-colors',
                    encryptionEnabled ? 'bg-accent-success/30' : 'bg-deep-700',
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 h-6 w-6 rounded-full transition-all shadow-md',
                    encryptionEnabled
                      ? 'left-[22px] bg-accent-success shadow-[0_0_12px_rgba(46,213,115,0.5)]'
                      : 'left-0.5 bg-slate-400',
                  )} />
                </button>
                <div className="flex items-center gap-1.5">
                  {encryptionEnabled ? <Lock className="w-3.5 h-3.5 text-accent-success animate-pulse" /> : <Unlock className="w-3.5 h-3.5 text-accent-danger" />}
                  <span className={cn('text-xs font-semibold', encryptionEnabled ? 'text-accent-success' : 'text-accent-danger')}>
                    {encryptionEnabled ? '已启用' : '已禁用'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">密钥ID</span>
              <span className="text-cyan-glow truncate max-w-[200px]">{keyId}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-accent-success/15 px-2 py-0.5 text-[10px] font-mono text-accent-success">
                <CheckCircle className="w-3 h-3" /> 设备端零明文存储已强制执行
              </span>
            </div>
          </div>
        </div>

        {/* Storage Overview */}
        <div className="glass-card hud-corner rounded-xl p-5">
          <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 mb-4">存储概览</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(#00D4FF 0% ${pct}%, #1C3456 ${pct}% 100%)`,
                  WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 10px), #000 calc(100% - 9px))',
                  mask: 'radial-gradient(farthest-side, transparent calc(100% - 10px), #000 calc(100% - 9px))',
                }}
              />
              <span className="font-mono text-xl font-bold text-cyan-glow z-10">{pct}%</span>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">总计</span>
              <span className="text-slate-300">{storageInfo.total.toFixed(1)} GB</span>
            </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">已用</span>
              <span className="text-cyan-glow">{storageInfo.used.toFixed(1)} GB</span>
            </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">可用</span>
              <span className="text-slate-300">{free.toFixed(1)} GB</span>
            </div>
            <div className="h-px bg-deep-700 my-1" />
            <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1"><FileVideo className="w-3 h-3" />视频</span>
              <span className="text-slate-200">{storageInfo.videoCount}</span>
            </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1"><Camera className="w-3 h-3" />抓拍</span>
                <span className="text-slate-200">{storageInfo.snapshotCount}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={14} outerRadius={26} paddingAngle={2} dataKey="value" stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Video Clips Management */}
      <div className="glass-card hud-corner rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 mb-4">视频片段</h3>
          <div className="flex items-center gap-3">
            {selectedClips.size > 0 && (
              <button
                onClick={() => setSelectedClips(new Set())}
                className="flex items-center gap-1.5 rounded-md bg-accent-danger/15 px-3 py-1.5 text-xs font-mono text-accent-danger hover:bg-accent-danger/25 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> 删除 {selectedClips.size}
              </button>
            )}
            <button
              onClick={() => {
                const all = new Set(CLIPS.map((c) => c.id));
                setSelectedClips(selectedClips.size === CLIPS.length ? new Set() : all);
              }}
              className="text-xs font-mono text-slate-400 hover:text-cyan-glow transition-colors"
            >
              {selectedClips.size === CLIPS.length ? '取消全选' : '全选'}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {CLIPS.map((clip) => (
            <div
              key={clip.id}
              onClick={() => toggleClip(clip.id)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors',
                selectedClips.has(clip.id) ? 'bg-accent-primary/10 border border-accent-primary/20' : 'bg-deep-800/40 hover:bg-deep-800/60',
              )}
            >
              <div className={cn(
                'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                selectedClips.has(clip.id) ? 'border-accent-primary bg-accent-primary/20' : 'border-deep-600',
              )}>
                {selectedClips.has(clip.id) && <CheckCircle className="w-3 h-3 text-accent-primary" />}
              </div>
              <FileVideo className="w-4 h-4 text-cyan-glow flex-shrink-0" />
              <span className="text-[10px] rounded bg-accent-primary/15 px-1.5 py-0.5 font-mono text-accent-primary flex-shrink-0 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />ENC
              </span>
              <span className="text-xs font-mono text-slate-300 flex-1">{clip.time}</span>
              <span className="text-xs font-mono text-slate-400">{clip.dur}</span>
              <span className="text-xs font-mono text-cyan-glow">{clip.size} MB</span>
              <span className="text-[10px] font-mono text-slate-500 uppercase w-14 text-right">{clip.type}</span>
              <div className="flex items-center gap-1 ml-2">
                <button className="p-1 rounded hover:bg-deep-700 text-slate-500 hover:text-accent-danger transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button className="p-1 rounded hover:bg-deep-700 text-slate-500 hover:text-accent-primary transition-colors">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Storage Actions & Privacy Policy */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card hud-corner rounded-xl p-5">
          <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 mb-4">存储操作</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 rounded-lg bg-deep-800/60 px-4 py-3 text-sm text-slate-300 hover:bg-accent-danger/10 hover:text-accent-danger transition-colors">
              <Trash2 className="w-4 h-4" />
              <span className="flex-1 text-left">清理30天前录像</span>
              <span className="text-[10px] font-mono text-slate-500">&gt; 30天</span>
            </button>
            <button className="w-full flex items-center gap-3 rounded-lg bg-deep-800/60 px-4 py-3 text-sm text-slate-300 hover:bg-accent-primary/10 hover:text-accent-primary transition-colors">
              <Download className="w-4 h-4" />
              <span className="flex-1 text-left">导出全部加密数据</span>
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-2">
              <HardDrive className="w-3.5 h-3.5" />
              <span>增长趋势: +2.4 GB/周 — 预计约27天后满</span>
            </div>
          </div>
        </div>

        <div className="glass-card hud-corner rounded-xl p-5">
          <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 mb-4">隐私策略</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            所有数据均在设备本地处理，未经明确导出不会离开您的网络。加密密钥仅在您的硬件上生成和存储。
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-accent-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-300">本地优先处理</p>
                <p className="text-[10px] text-slate-500">所有AI推理均在设备端运行</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-accent-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-300">设备端零明文</p>
                <p className="text-[10px] text-slate-500">所有录像均已加密存储</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-accent-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-300">用户自有加密密钥</p>
                <p className="text-[10px] text-slate-500">密钥永不离开您的设备</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
