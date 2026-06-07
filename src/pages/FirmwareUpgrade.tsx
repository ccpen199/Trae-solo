import { useEffect, useState } from 'react';
import { Plus, ArrowLeftRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import { FirmwareStatusBadge, DeviceStatusBadge } from '@/components/Badges';
import type { FirmwareTask, Device } from '@/types';
import { formatDateTime, cn } from '@/lib/utils';

export default function FirmwareUpgrade() {
  const [tasks, setTasks] = useState<FirmwareTask[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<number[]>([]);
  const [form, setForm] = useState({ version: '', fileUrl: '' });

  const fetchData = () => {
    api.get('/settings/firmware/tasks').then(res => {
      if (res.data.success) setTasks(res.data.tasks);
    });
    api.get('/devices?pageSize=200').then(res => {
      if (res.data.success) setDevices(res.data.list);
    });
  };

  useEffect(() => {
    document.title = '固件升级 - 云瞳视频监控';
    fetchData();
    const t = setInterval(fetchData, 5000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/settings/firmware/tasks', {
        deviceIds: selectedDevices,
        version: form.version,
        fileUrl: form.fileUrl,
      });
      setShowModal(false);
      fetchData();
      setSelectedDevices([]);
      setForm({ version: '', fileUrl: '' });
    } catch (e: any) {
      alert(e.response?.data?.error || '创建失败');
    }
  };

  const toggleDevice = (id: number) => {
    setSelectedDevices(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const toggleAllOnline = () => {
    const onlineIds = devices.filter(d => d.status === 'online').map(d => d.id);
    if (selectedDevices.length === onlineIds.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(onlineIds);
    }
  };

  return (
    <div className="p-6 min-h-full">
      <PageHeader
        title="固件升级管理"
        subtitle="创建批量升级任务，跟踪进度，管理设备固件版本"
        breadcrumbs={[{ label: '系统设置' }, { label: '固件升级' }]}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="vms-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> 创建升级任务
          </button>
        }
      />

      <div className="space-y-4">
        {tasks.map(t => {
          const progress = t.total_devices > 0 ? Math.round((t.completed_devices / t.total_devices) * 100) : 0;
          return (
            <div key={t.id} className="vms-card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold text-white font-mono">v{t.version}</h4>
                    <FirmwareStatusBadge status={t.status} />
                    <span className="text-xs text-vms-text-muted font-mono">Task #{t.id}</span>
                  </div>
                  <div className="text-sm text-vms-text-muted">创建者：{t.created_by_name || '-'} · {formatDateTime(t.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono text-white">{progress}%</div>
                  <div className="text-xs text-vms-text-muted">
                    {t.completed_devices}/{t.total_devices} 成功，{t.failed_devices} 失败
                  </div>
                </div>
              </div>
              <div className="h-2 bg-vms-surface-2 rounded-full overflow-hidden mb-3">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    t.status === 'running' ? "bg-vms-primary animate-pulse" :
                    t.status === 'completed' ? "bg-emerald-500" :
                    t.status === 'failed' ? "bg-red-500" : "bg-vms-text-muted"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1.5 text-vms-text-muted">
                  <Clock className="w-4 h-4" /> 待处理: {t.total_devices - t.completed_devices - t.failed_devices}
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle className="w-4 h-4" /> 成功: {t.completed_devices}
                </div>
                <div className="flex items-center gap-1.5 text-red-400">
                  <XCircle className="w-4 h-4" /> 失败: {t.failed_devices}
                </div>
                <div className="flex items-center gap-1.5 text-vms-text-muted">
                  <ArrowLeftRight className="w-4 h-4" /> 固件: {t.file_url}
                </div>
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="vms-card p-12 text-center text-vms-text-muted">
            暂无升级任务
          </div>
        )}
      </div>

      <Modal
        title="创建固件升级任务"
        open={showModal}
        onClose={() => setShowModal(false)}
        size="xl"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="vms-btn-secondary">取消</button>
            <button
              onClick={handleSubmit}
              disabled={selectedDevices.length === 0 || !form.version || !form.fileUrl}
              className="vms-btn-primary"
            >
              创建任务
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-vms-text-muted">固件版本号</label>
              <input
                required
                value={form.version}
                onChange={e => setForm(p => ({ ...p, version: e.target.value }))}
                className="vms-input font-mono"
                placeholder="如: 2.6.0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-vms-text-muted">固件文件地址</label>
              <input
                required
                value={form.fileUrl}
                onChange={e => setForm(p => ({ ...p, fileUrl: e.target.value }))}
                className="vms-input font-mono"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-vms-text-muted">选择设备（已选 {selectedDevices.length}）</label>
              <button
                type="button"
                onClick={toggleAllOnline}
                className="text-xs text-vms-primary hover:underline"
              >
                {selectedDevices.length === devices.filter(d => d.status === 'online').length ? '取消全选' : '全选在线设备'}
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto border border-vms-border rounded-lg p-2 space-y-1 bg-vms-bg">
              {devices.map(d => {
                const isOnline = d.status === 'online';
                const isSelected = selectedDevices.includes(d.id);
                return (
                  <div
                    key={d.id}
                    onClick={() => isOnline && toggleDevice(d.id)}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg transition-colors",
                      isOnline && isSelected && "bg-vms-primary/15 border border-vms-primary/30",
                      isOnline && !isSelected && "hover:bg-vms-surface-2 cursor-pointer",
                      !isOnline && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                      isSelected ? "bg-vms-primary border-vms-primary" : "border-vms-border"
                    )}>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{d.name}</div>
                      <div className="text-xs text-vms-text-muted font-mono">{d.device_id} · {d.firmware_version || '未知版本'}</div>
                    </div>
                    <DeviceStatusBadge status={d.status} className="text-[10px]" />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
            <strong>注意：</strong>升级过程中请勿断开设备电源，建议选择设备低峰时段执行。
          </div>
        </form>
      </Modal>
    </div>
  );
}
