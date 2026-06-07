import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowLeft, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import type { AlertRule, Device } from '@/types';
import { useAuthStore } from '@/store/auth';

export default function AlertRules() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    deviceId: '',
    type: 'motion',
    sensitivity: 50,
    schedule: { start: '00:00', end: '23:59', days: [1, 2, 3, 4, 5, 6, 7] as number[] },
    notification: { type: 'web', target: 'all_admins' },
  });
  const isAdmin = useAuthStore(s => s.isAdmin);

  const fetchData = () => {
    api.get('/alerts/rules').then(res => {
      if (res.data.success) setRules(res.data.rules);
    });
    api.get('/devices?pageSize=100').then(res => {
      if (res.data.success) setDevices(res.data.list);
    });
  };

  useEffect(() => {
    document.title = '告警规则 - 云瞳视频监控';
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/alerts/rules/${editingId}`, {
          ...form,
          deviceId: form.deviceId ? parseInt(form.deviceId) : null,
        });
      } else {
        await api.post('/alerts/rules', {
          ...form,
          deviceId: form.deviceId ? parseInt(form.deviceId) : null,
        });
      }
      setShowModal(false);
      fetchData();
      resetForm();
    } catch (e: any) {
      alert(e.response?.data?.error || '操作失败');
    }
  };

  const resetForm = () => {
    setForm({
      name: '', deviceId: '', type: 'motion', sensitivity: 50,
      schedule: { start: '00:00', end: '23:59', days: [1, 2, 3, 4, 5, 6, 7] },
      notification: { type: 'web', target: 'all_admins' },
    });
    setEditingId(null);
  };

  const toggleRule = async (id: number, currentEnabled: number) => {
    try {
      await api.put(`/alerts/rules/${id}`, { enabled: currentEnabled ? 0 : 1 });
      fetchData();
    } catch (e) {
      alert('操作失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/alerts/rules/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e) {
      alert('删除失败');
    }
  };

  const openEdit = (r: AlertRule) => {
    try {
      const sched = r.schedule ? JSON.parse(r.schedule) : { start: '00:00', end: '23:59', days: [1, 2, 3, 4, 5, 6, 7] };
      const notif = r.notification ? JSON.parse(r.notification) : { type: 'web', target: 'all_admins' };
      setEditingId(r.id);
      setForm({
        name: r.name,
        deviceId: r.device_id ? String(r.device_id) : '',
        type: r.type,
        sensitivity: r.sensitivity,
        schedule: sched,
        notification: notif,
      });
      setShowModal(true);
    } catch (e) {
      alert('数据解析失败');
    }
  };

  const toggleDay = (day: number) => {
    const days = form.schedule.days.includes(day)
      ? form.schedule.days.filter(d => d !== day)
      : [...form.schedule.days, day];
    setForm(p => ({ ...p, schedule: { ...p.schedule, days } }));
  };

  const typeMap: Record<string, string> = {
    motion: '移动侦测', crossing: '区域越界', occlusion: '画面遮挡', offline: '设备离线', storage_low: '存储不足',
  };
  const dayLabels = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="p-6 min-h-full">
      <PageHeader
        title="告警规则配置"
        subtitle="可视化配置告警触发条件、时间段、灵敏度和通知方式"
        breadcrumbs={[{ label: '告警中心', path: '/alerts' }, { label: '告警规则' }]}
        actions={
          <>
            <Link to="/alerts" className="vms-btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> 返回告警
            </Link>
            {isAdmin && (
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="vms-btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> 新增规则
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map(r => (
          <div key={r.id} className="vms-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-white">{r.name}</h4>
                <div className="text-xs text-vms-text-muted mt-1">
                  {typeMap[r.type] || r.type}
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => toggleRule(r.id, r.enabled)} className="text-vms-primary hover:opacity-80">
                  {r.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6 opacity-50" />}
                </button>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-vms-text-muted">灵敏度</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-vms-surface-2 rounded-full overflow-hidden">
                    <div className="h-full bg-vms-primary" style={{ width: `${r.sensitivity}%` }} />
                  </div>
                  <span className="font-mono text-xs text-vms-text">{r.sensitivity}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-vms-text-muted">适用设备</span>
                <span className="text-vms-text">{r.device_id ? devices.find(d => d.id === r.device_id)?.name || '未知' : '全部设备'}</span>
              </div>
              <div className="p-2 bg-vms-surface-2 rounded-lg">
                <div className="text-xs text-vms-text-muted mb-1">触发时段</div>
                <div className="text-sm text-vms-text font-mono">
                  {r.schedule ? (() => {
                    try {
                      const s = JSON.parse(r.schedule);
                      return `${s.start} - ${s.end}`;
                    } catch { return '-'; }
                  })() : '-'}
                </div>
                <div className="flex gap-1 mt-1.5">
                  {[1,2,3,4,5,6,7].map(d => {
                    let included = false;
                    try { included = JSON.parse(r.schedule || '{}').days?.includes(d); } catch {}
                    return (
                      <div key={d} className={`w-5 h-5 rounded text-[10px] flex items-center justify-center font-mono ${included ? 'bg-vms-primary text-white' : 'bg-vms-bg text-vms-text-muted'}`}>
                        {dayLabels[d-1]}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-vms-border/50">
                <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-vms-surface-2 text-vms-text-muted hover:text-amber-400 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded-lg hover:bg-vms-surface-2 text-vms-text-muted hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
        {rules.length === 0 && (
          <div className="col-span-full vms-card p-12 text-center text-vms-text-muted">
            暂无告警规则
          </div>
        )}
      </div>

      <Modal
        title={editingId ? '编辑告警规则' : '新增告警规则'}
        open={showModal}
        onClose={() => setShowModal(false)}
        size="lg"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="vms-btn-secondary">取消</button>
            <button onClick={handleSubmit} className="vms-btn-primary">{editingId ? '保存' : '创建'}</button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-vms-text-muted">规则名称</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="vms-input" placeholder="如：夜间越界检测" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-vms-text-muted">告警类型</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="vms-input">
                {Object.entries(typeMap).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-vms-text-muted">适用设备</label>
              <select value={form.deviceId} onChange={e => setForm(p => ({ ...p, deviceId: e.target.value }))} className="vms-input">
                <option value="">全部设备</option>
                {devices.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-vms-text-muted">灵敏度：{form.sensitivity}</label>
              <input
                type="range" min="1" max="100" value={form.sensitivity}
                onChange={e => setForm(p => ({ ...p, sensitivity: parseInt(e.target.value) }))}
                className="w-full accent-vms-primary mt-1"
              />
              <div className="flex justify-between text-xs text-vms-text-muted">
                <span>低</span><span>高</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-vms-surface-2 rounded-xl space-y-4">
            <div className="font-medium text-white text-sm">生效时间</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-vms-text-muted">开始时间</label>
                <input type="time" value={form.schedule.start} onChange={e => setForm(p => ({ ...p, schedule: { ...p.schedule, start: e.target.value } }))} className="vms-input" />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-vms-text-muted">结束时间</label>
                <input type="time" value={form.schedule.end} onChange={e => setForm(p => ({ ...p, schedule: { ...p.schedule, end: e.target.value } }))} className="vms-input" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-vms-text-muted">重复</label>
              <div className="flex gap-2">
                {[1,2,3,4,5,6,7].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      form.schedule.days.includes(d)
                        ? 'bg-vms-primary text-white'
                        : 'bg-vms-bg text-vms-text-muted hover:bg-vms-border'
                    }`}
                  >
                    周{dayLabels[d-1]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4 bg-vms-surface-2 rounded-xl space-y-4">
            <div className="font-medium text-white text-sm">通知方式</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-vms-text-muted">通知类型</label>
                <select
                  value={form.notification.type}
                  onChange={e => setForm(p => ({ ...p, notification: { ...p.notification, type: e.target.value } }))}
                  className="vms-input"
                >
                  <option value="web">站内通知</option>
                  <option value="email">邮件通知</option>
                  <option value="sms">短信通知</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-vms-text-muted">通知目标</label>
                <input
                  value={form.notification.target}
                  onChange={e => setForm(p => ({ ...p, notification: { ...p.notification, target: e.target.value } }))}
                  className="vms-input"
                  placeholder="如 all_admins"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        title="确认删除"
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        size="sm"
        footer={
          <>
            <button onClick={() => setDeleteId(null)} className="vms-btn-secondary">取消</button>
            <button onClick={handleDelete} className="vms-btn-danger">确认删除</button>
          </>
        }
      >
        <p className="text-vms-text">确认删除该告警规则？删除后将不再匹配此类告警。</p>
      </Modal>
    </div>
  );
}
