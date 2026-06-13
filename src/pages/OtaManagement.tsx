import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import type { OtaHistory, UpgradeStatus } from '@/types';
import { otaApi } from '@/services/api';
import { cn } from '@/lib/utils';
import { Download, Pause, Play, RotateCcw, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_LABEL: Record<UpgradeStatus, string> = {
  idle: '空闲', downloading: '下载中', verifying: '校验中',
  installing: '安装中', rebooting: '重启中', success: '升级成功', failed: '升级失败',
};

const HISTORY_ICON: Record<string, React.ReactNode> = {
  success: <CheckCircle className="w-3.5 h-3.5 text-accent-success" />,
  failed: <XCircle className="w-3.5 h-3.5 text-accent-danger" />,
  rollback: <AlertTriangle className="w-3.5 h-3.5 text-accent-warning" />,
};

const HISTORY_LABEL: Record<string, string> = { success: '成功', failed: '失败', rollback: '回滚' };

const ACTIVE: UpgradeStatus[] = ['downloading', 'verifying', 'installing', 'rebooting'];

function parseMb(s: string): number {
  const n = parseFloat(s);
  if (s.includes('GB')) return n * 1024;
  if (s.includes('KB')) return n / 1024;
  return n;
}

function fmtTime(s?: number): string {
  if (!s) return '--';
  return `${Math.floor(s / 60)}m ${(s % 60).toString().padStart(2, '0')}s`;
}

export default function OtaManagement() {
  const { otaStatus, fetchOtaStatus } = useAppStore();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [history, setHistory] = useState<OtaHistory[]>([]);

  const hasUpdate = otaStatus ? otaStatus.currentVersion !== otaStatus.latestVersion : false;
  const recentFailed = history.length > 0 && history[0].status === 'failed';
  const progress = isUpgrading ? (otaStatus?.upgradeProgress ?? 0) : 0;
  const curStatus = otaStatus?.upgradeStatus ?? 'idle';
  const statusLabel = ACTIVE.includes(curStatus) ? STATUS_LABEL[curStatus] : '准备中...';
  const deltaSaved = otaStatus ? Math.round((1 - parseMb(otaStatus.deltaSize) / parseMb(otaStatus.fullSize)) * 100) : 0;

  useEffect(() => {
    otaApi.getHistory().then(setHistory).catch(() => {});
    fetchOtaStatus();
  }, [fetchOtaStatus]);

  useEffect(() => {
    if (!isUpgrading) return;
    const timer = setInterval(() => {
      fetchOtaStatus().then(() => {
        const s = useAppStore.getState().otaStatus?.upgradeStatus;
        if (s === 'success' || s === 'failed') {
          setIsUpgrading(false);
          setIsPaused(false);
          otaApi.getHistory().then(setHistory).catch(() => {});
        }
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [isUpgrading, fetchOtaStatus]);

  const handleStart = async () => {
    await otaApi.startUpgrade();
    setIsUpgrading(true);
    setIsPaused(false);
    fetchOtaStatus();
  };
  const handlePause = async () => { await otaApi.pauseUpgrade(); setIsPaused(true); };
  const handleResume = async () => { await otaApi.resumeUpgrade(); setIsPaused(false); };
  const handleRollback = async () => { await otaApi.startUpgrade(); fetchOtaStatus(); };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="glass-card hud-corner rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">当前固件版本</p>
            <p className="text-3xl font-mono font-bold gradient-text">{otaStatus?.currentVersion ?? '--'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400 mb-1">最新可用版本</p>
            <p className="text-lg font-mono text-cyan-glow">{otaStatus?.latestVersion ?? '--'}</p>
          </div>
        </div>
        {hasUpdate && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-glow/10 text-cyan-glow border border-cyan-glow/30 shadow-glow-cyan animate-glow">
            <Download className="w-3 h-3" />新版本可用
          </span>
        )}
        {otaStatus?.releaseNotes && (
          <div className="mt-4">
            <button onClick={() => setShowReleaseNotes((v) => !v)} className="flex items-center gap-1 text-sm text-slate-400 hover:text-cyan-glow transition-colors">
              更新说明{showReleaseNotes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showReleaseNotes && (
              <div className="mt-2 p-3 rounded-lg bg-deep-900/60 text-sm text-slate-300 leading-relaxed border border-deep-700">
                {otaStatus.releaseNotes}
              </div>
            )}
          </div>
        )}
      </div>

      {isUpgrading && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-400">{statusLabel}</p>
              {isPaused && otaStatus?.breakpoint != null && (
                <span className="text-xs text-accent-warning">· 断点 {otaStatus.breakpoint}%</span>
              )}
            </div>
            <p className="text-2xl font-mono font-bold gradient-text">{progress}%</p>
          </div>
          <div className="h-3 rounded-full bg-deep-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #00D4FF, #7C3AED)' }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">预计剩余 {fmtTime(otaStatus?.estimatedTime)}</p>
            <button
              onClick={isPaused ? handleResume : handlePause}
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                isPaused ? 'bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30' : 'bg-deep-700 text-slate-300 hover:bg-deep-600'
              )}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? '继续' : '暂停'}
            </button>
          </div>
        </div>
      )}

      {otaStatus && (
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card hud-corner rounded-xl p-5 border-cyan-glow/40 relative">
            <span className="absolute -top-2.5 left-4 px-2 py-0.5 text-[10px] font-bold bg-accent-primary/20 text-accent-primary rounded border border-accent-primary/40">推荐</span>
            <p className="text-sm font-semibold text-slate-200 mb-3">增量升级</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">包大小</span><span className="font-mono text-cyan-glow">{otaStatus.deltaSize}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">预计时间</span><span className="font-mono text-slate-200">~3 min</span></div>
              <div className="flex justify-between"><span className="text-slate-400">节省带宽</span><span className="font-mono text-accent-success">{deltaSaved}%</span></div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-5">
            <p className="text-sm font-semibold text-slate-200 mb-3">完整升级</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">包大小</span><span className="font-mono text-slate-200">{otaStatus.fullSize}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">预计时间</span><span className="font-mono text-slate-200">~8 min</span></div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl p-6">
        <p className="text-sm font-semibold text-slate-200 mb-4">升级历史</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-left pb-3">版本</th><th className="text-left pb-3">日期</th>
                <th className="text-left pb-3">状态</th><th className="text-left pb-3">耗时</th>
                <th className="text-left pb-3">大小</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-t border-deep-700/50 hover:bg-deep-800/40 transition-colors">
                  <td className="py-2.5 font-mono">{item.version}</td>
                  <td className="py-2.5 text-slate-400">{item.timestamp}</td>
                  <td className="py-2.5">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                      item.status === 'success' && 'bg-accent-success/10 text-accent-success',
                      item.status === 'failed' && 'bg-accent-danger/10 text-accent-danger',
                      item.status === 'rollback' && 'bg-accent-warning/10 text-accent-warning'
                    )}>
                      {HISTORY_ICON[item.status]}{HISTORY_LABEL[item.status]}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono text-slate-300">{item.duration}s</td>
                  <td className="py-2.5 font-mono text-slate-300">{item.deltaSize}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-slate-500">暂无升级记录</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!isUpgrading ? (
          <button onClick={handleStart} disabled={!hasUpdate} className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all',
            hasUpdate ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/40 shadow-glow-cyan hover:bg-accent-primary/30' : 'bg-deep-800 text-slate-500 cursor-not-allowed'
          )}>
            <Download className="w-4 h-4" />开始升级
          </button>
        ) : (
          <button onClick={isPaused ? handleResume : handlePause} className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium bg-accent-primary/20 text-accent-primary border border-accent-primary/40 hover:bg-accent-primary/30 transition-all">
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {isPaused ? '继续升级' : '暂停升级'}
          </button>
        )}
        {recentFailed && (
          <button onClick={handleRollback} className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium bg-deep-800 text-accent-warning border border-accent-warning/30 hover:bg-deep-700 transition-all">
            <RotateCcw className="w-4 h-4" />回滚
          </button>
        )}
      </div>
    </div>
  );
}
