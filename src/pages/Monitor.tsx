import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import type { VideoLinkStatus } from '@/types';
import { cn } from '@/lib/utils';
import {
  Camera,
  Circle,
  Mic,
  Eye,
  EyeOff,
  Maximize,
  Radio,
  Wifi,
  Tv,
  Clock,
  Signal,
} from 'lucide-react';

export default function Monitor() {
  const { currentDevice, videoLinkStatus, fetchVideoLinkStatus } = useAppStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isIntercomActive, setIsIntercomActive] = useState(false);
  const [isNightVision, setIsNightVision] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState<'1080p' | '720p' | '480p'>('1080p');
  const [showScanLines, setShowScanLines] = useState(true);
  const [timestamp, setTimestamp] = useState(new Date());

  useEffect(() => {
    fetchVideoLinkStatus();
    const interval = setInterval(fetchVideoLinkStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchVideoLinkStatus]);

  useEffect(() => {
    const tick = setInterval(() => setTimestamp(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const [uptime, setUptime] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setUptime((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatUptime = useCallback((s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  }, []);

  const link = videoLinkStatus;
  const activeLink = link?.activeLink ?? 'p2p';
  const activeData = activeLink === 'p2p' ? link?.p2p : link?.relay;

  const resolutions: ('1080p' | '720p' | '480p')[] = ['1080p', '720p', '480p'];

  return (
    <div className="animate-fade-in-up flex h-full flex-col gap-4 p-4 lg:p-6">
      <div className="flex gap-4 lg:gap-6">
        {/* Video Player Area */}
        <div className="flex-1 min-w-0">
          <div className="hud-corner glass-card relative aspect-video overflow-hidden rounded-lg">
            {/* Simulated video background */}
            <div className="absolute inset-0 bg-deep-950">
              <div className="flex h-full items-center justify-center">
                <Tv className="h-16 w-16 text-deep-700" />
              </div>
            </div>

            {/* Scan lines */}
            {showScanLines && (
              <div
                className="pointer-events-none absolute inset-0 z-10"
                style={{
                  background:
                    'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.03) 2px, rgba(0,212,255,0.03) 4px)',
                  animation: 'scanMove 8s linear infinite',
                }}
              />
            )}

            {/* LIVE indicator */}
            <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded bg-black/60 px-2 py-1 font-mono text-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-danger" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-danger" />
              </span>
              <span className="font-semibold text-accent-danger">LIVE</span>
            </div>

            {/* Timestamp */}
            <div className="absolute right-3 top-3 z-20 rounded bg-black/60 px-2 py-1 font-mono text-xs text-slate-300">
              {timestamp.toLocaleString('zh-CN', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
              })}
            </div>

            {/* HUD overlay bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-20 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-3">
              <div className="flex gap-3 font-mono text-[10px] text-cyan-glow/70">
                <span>{link?.codec ?? 'H.265'}</span>
                <span>{selectedResolution.toUpperCase()}</span>
                <span>{link?.fps ?? 15}FPS</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-accent-success">
                <Wifi className="h-3 w-3" />
                <span>{activeLink.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="glass-card mt-3 flex items-center justify-between rounded-lg px-4 py-2.5">
            <div className="flex items-center gap-2">
              <ActionButton icon={Camera} label="截图" />
              <ActionButton
                icon={Circle}
                label="录制"
                className={cn(isRecording && 'text-accent-danger')}
                iconClassName={cn(isRecording && 'fill-accent-danger animate-pulse')}
                onClick={() => setIsRecording(!isRecording)}
              />
              <ActionButton
                icon={Mic}
                label="对讲"
                className={cn(isIntercomActive && 'text-accent-primary')}
                iconClassName={cn(isIntercomActive && 'animate-pulse')}
                onClick={() => setIsIntercomActive(!isIntercomActive)}
              />
              <ActionButton
                icon={isNightVision ? EyeOff : Eye}
                label="夜视"
                className={cn(isNightVision && 'text-accent-primary')}
                onClick={() => setIsNightVision(!isNightVision)}
              />
            </div>

            <div className="flex items-center gap-3">
              {resolutions.map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedResolution(r)}
                  className={cn(
                    'font-mono text-xs px-2 py-0.5 rounded transition-colors',
                    selectedResolution === r
                      ? 'bg-accent-primary/20 text-accent-primary'
                      : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowScanLines(!showScanLines)}
                className={cn(
                  'text-xs font-mono px-2 py-0.5 rounded transition-colors',
                  showScanLines ? 'text-accent-primary' : 'text-slate-500'
                )}
              >
                SCAN
              </button>
              <ActionButton icon={Maximize} label="全屏" />
            </div>
          </div>
        </div>

        {/* Link Status Panel */}
        <div className="hidden w-64 shrink-0 flex-col gap-3 lg:flex">
          <h3 className="font-display text-sm font-semibold text-slate-300">链路状态</h3>
          <LinkCard
            label="P2P 链路"
            connected={link?.p2p.connected ?? true}
            latency={link?.p2p.latency ?? 35}
            bitrate={link?.p2p.bitrate ?? 2048}
            isActive={activeLink === 'p2p'}
          />
          <LinkCard
            label="Relay 链路"
            connected={link?.relay.connected ?? true}
            latency={link?.relay.latency ?? 120}
            bitrate={link?.relay.bitrate ?? 1024}
            isActive={activeLink === 'relay'}
          />
          <div className="glass-card mt-1 flex items-center justify-between rounded-lg px-3 py-2">
            <span className="text-xs text-slate-400">自动切换</span>
            <button
              className={cn(
                'relative h-5 w-9 rounded-full transition-colors',
                'bg-accent-primary/30'
              )}
            >
              <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-accent-primary shadow-glow-cyan transition-transform translate-x-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Device Info Sidebar (bottom) */}
      <div className="glass-card flex items-center gap-6 rounded-lg px-5 py-3">
        <div className="flex items-center gap-2">
          <Signal className="h-4 w-4 text-accent-primary" />
          <div>
            <p className="text-sm font-semibold text-slate-200">{currentDevice?.deviceName ?? '智能门铃 Pro'}</p>
            <p className="font-mono text-[10px] text-slate-500">ID: {currentDevice?.deviceId ?? 'DB-2024-001'}</p>
          </div>
        </div>
        <div className="h-8 w-px bg-deep-700" />
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent-info" />
          <div>
            <p className="text-xs text-slate-400">运行时间</p>
            <p className="font-mono text-sm text-slate-200">{formatUptime(uptime)}</p>
          </div>
        </div>
        <div className="h-8 w-px bg-deep-700" />
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-slate-400">连接质量</span>
            <span className="font-mono text-xs text-accent-success">
              {Math.max(0, Math.min(100, 100 + (currentDevice?.signalStrength ?? -50)))}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-deep-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-success transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, 100 + (currentDevice?.signalStrength ?? -50)))}%` }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanMove {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  className,
  iconClassName,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  className?: string;
  iconClassName?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-deep-700 hover:text-slate-200',
        className
      )}
    >
      <Icon className={cn('h-4 w-4', iconClassName)} />
      <span>{label}</span>
    </button>
  );
}

function LinkCard({
  label,
  connected,
  latency,
  bitrate,
  isActive,
}: {
  label: string;
  connected: boolean;
  latency: number;
  bitrate: number;
  isActive: boolean;
}) {
  return (
    <div
      className={cn(
        'glass-card rounded-lg px-3 py-3',
        isActive && 'animate-glow border-accent-primary/30'
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-cyan-glow" />
          <span className="text-xs font-semibold text-slate-300">{label}</span>
        </div>
        {isActive && (
          <span className="rounded bg-accent-primary/20 px-1.5 py-0.5 font-mono text-[10px] text-accent-primary">
            ACTIVE
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={cn('status-dot', connected ? 'online' : 'offline')} />
        <span className={cn('text-xs', connected ? 'text-accent-success' : 'text-slate-500')}>
          {connected ? '已连接' : '断开'}
        </span>
      </div>
      <div className="flex gap-4 font-mono text-[11px]">
        <div>
          <span className="text-slate-500">延迟</span>
          <span className={cn('ml-1', latency < 80 ? 'text-accent-success' : 'text-accent-warning')}>
            {latency}ms
          </span>
        </div>
        <div>
          <span className="text-slate-500">码率</span>
          <span className="ml-1 text-cyan-glow">{bitrate}kbps</span>
        </div>
      </div>
    </div>
  );
}
