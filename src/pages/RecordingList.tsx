import { useEffect, useState } from 'react';
import { Search, Download, Play, Calendar, HardDrive, Tag } from 'lucide-react';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import { AiTagBadge, StorageTypeBadge } from '@/components/Badges';
import type { Recording, Device } from '@/types';
import { formatDateTime, formatFileSize, getDaysAgoDate } from '@/lib/utils';

export default function RecordingList() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [deviceId, setDeviceId] = useState('all');
  const [startDate, setStartDate] = useState(getDaysAgoDate(7));
  const [endDate, setEndDate] = useState('');
  const [aiTag, setAiTag] = useState('all');
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);

  const fetchData = () => {
    setLoading(true);
    api.get('/recordings', { params: { page, pageSize, deviceId, startDate, endDate, aiTag } })
      .then(res => {
        if (res.data.success) {
          setRecordings(res.data.list);
          setTotal(res.data.total);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = '录像检索 - 云瞳视频监控';
    fetchData();
    api.get('/devices?pageSize=100').then(res => {
      if (res.data.success) setDevices(res.data.list);
    });
  }, [page, pageSize, deviceId, startDate, endDate, aiTag]);

  const aiTagOptions = [
    { value: 'all', label: '全部标签' },
    { value: 'person', label: '人形' },
    { value: 'vehicle', label: '车辆' },
    { value: 'license_plate', label: '车牌' },
  ];

  const parseTags = (tags: string) => {
    try { return JSON.parse(tags) as string[]; } catch { return []; }
  };

  const formatDuration = (start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const diff = Math.floor((e - s) / 1000);
    const m = Math.floor(diff / 60);
    const sec = diff % 60;
    return `${m}分${sec}秒`;
  };

  return (
    <div className="p-6 min-h-full">
      <PageHeader
        title="录像检索"
        subtitle={`共 ${total} 条录像片段，支持按设备、时间、AI 标签检索`}
        breadcrumbs={[{ label: '录像检索' }]}
      />

      <div className="vms-card p-4 mb-5">
        <div className="flex flex-wrap items-center gap-4">
          <select value={deviceId} onChange={e => setDeviceId(e.target.value)} className="vms-input w-48">
            <option value="all">全部设备</option>
            {devices.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-vms-text-muted" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="vms-input w-40" />
            <span className="text-vms-text-muted">至</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="vms-input w-40" />
          </div>
          <select value={aiTag} onChange={e => setAiTag(e.target.value)} className="vms-input w-36">
            {aiTagOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button onClick={fetchData} className="vms-btn-primary flex items-center gap-2">
            <Search className="w-4 h-4" /> 检索
          </button>
        </div>
      </div>

      {playingId && (
        <div className="vms-card p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white font-mono">录像回放</h3>
            <button onClick={() => setPlayingId(null)} className="vms-btn-secondary text-xs">关闭</button>
          </div>
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-vms-border">
            <div className="absolute inset-0 bg-vms-grid bg-vms-grid opacity-30" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-vms-primary/20 flex items-center justify-center mb-3">
                <Play className="w-10 h-10 text-vms-primary ml-1" />
              </div>
              <div className="text-sm text-vms-text-muted">回放播放器区域</div>
              <div className="text-xs text-vms-text-muted mt-1 font-mono">
                {recordings.find(r => r.id === playingId)?.device_name || ''}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
              <div className="h-1 bg-vms-border rounded-full overflow-hidden mb-2">
                <div className="h-full bg-vms-primary w-1/3" />
              </div>
              <div className="flex items-center justify-between text-xs text-white/80 font-mono">
                <span>00:00:15</span>
                <div className="flex items-center gap-2">
                  <button className="px-2 py-0.5 rounded bg-vms-primary/30">0.5x</button>
                  <button className="px-2 py-0.5 rounded bg-vms-primary text-white">1x</button>
                  <button className="px-2 py-0.5 rounded bg-vms-primary/30">2x</button>
                </div>
                <span>{formatDuration(
                  recordings.find(r => r.id === playingId)?.start_time || '',
                  recordings.find(r => r.id === playingId)?.end_time || ''
                )}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-vms-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-5">
            {recordings.map(r => {
              const tags = parseTags(r.ai_tags);
              return (
                <div key={r.id} className="vms-card overflow-hidden group hover:border-vms-primary transition-colors cursor-pointer"
                  onClick={() => setPlayingId(r.id)}
                >
                  <div className="relative aspect-video bg-vms-surface-2 overflow-hidden">
                    <img
                      src={`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`surveillance camera footage still frame with ${tags.join(' and ') || 'security'} at night or indoor`)}&image_size=square_hd`}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <StorageTypeBadge status={r.storage_type} className="text-[10px]" />
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded text-xs text-white font-mono">
                      <HardDrive className="w-3 h-3" /> {formatFileSize(r.file_size)}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <div className="w-14 h-14 rounded-full bg-vms-primary/80 flex items-center justify-center shadow-vms-glow">
                        <Play className="w-7 h-7 text-white ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                      <div className="text-xs text-white font-mono">{formatDuration(r.start_time, r.end_time)}</div>
                      <button className="p-1.5 rounded bg-black/40 hover:bg-black/60 text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-medium text-white truncate">{r.device_name}</div>
                    <div className="text-xs text-vms-text-muted mt-0.5">{formatDateTime(r.start_time)}</div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tags.map((t, i) => (
                          <AiTagBadge key={i} tag={t} className="text-[10px]" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {recordings.length === 0 && (
            <div className="vms-card p-12 text-center text-vms-text-muted">
              暂无符合条件的录像片段
            </div>
          )}
        </>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
        />
      )}
    </div>
  );
}
