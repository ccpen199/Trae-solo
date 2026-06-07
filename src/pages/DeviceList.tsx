import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, RefreshCw, MoreHorizontal, Eye, Edit, Trash2, Wifi, WifiOff } from 'lucide-react';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Pagination from '@/components/Pagination';
import Modal from '@/components/Modal';
import { DeviceStatusBadge, P2PStatusBadge, ProtocolBadge } from '@/components/Badges';
import { formatDateTime } from '@/lib/utils';
import type { Device, Organization } from '@/types';
import { useAuthStore } from '@/store/auth';

export default function DeviceList() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const [orgId, setOrgId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const isAdmin = useAuthStore(s => s.isAdmin);

  const [form, setForm] = useState({
    name: '',
    deviceId: '',
    secret: '',
    protocol: 'GB28181' as 'GB28181' | 'ONVIF',
    ip: '',
    port: '',
    orgId: '',
  });

  const fetchData = () => {
    setLoading(true);
    api.get('/devices', { params: { page, pageSize, keyword, status, orgId } })
      .then(res => {
        if (res.data.success) {
          setDevices(res.data.list);
          setTotal(res.data.total);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = '设备管理 - 云瞳视频监控';
    fetchData();
    api.get('/organizations').then(res => {
      if (res.data.success) setOrgs(res.data.list || []);
    });
  }, [page, pageSize, status, orgId, keyword]);

  useEffect(() => {
    const t = setTimeout(fetchData, 400);
    return () => clearTimeout(t);
  }, [keyword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDevice) {
        await api.put(`/devices/${editingDevice.id}`, {
          name: form.name,
          orgId: form.orgId ? parseInt(form.orgId) : null,
        });
      } else {
        await api.post('/devices', {
          name: form.name,
          deviceId: form.deviceId,
          secret: form.secret,
          protocol: form.protocol,
          ip: form.ip || null,
          port: form.port ? parseInt(form.port) : null,
          orgId: form.orgId ? parseInt(form.orgId) : null,
        });
      }
      setShowModal(false);
      fetchData();
      resetForm();
    } catch (e: any) {
      alert(e.response?.data?.error || '操作失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/devices/${deleteId}`);
      setDeleteId(null);
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.error || '删除失败');
    }
  };

  const resetForm = () => {
    setForm({ name: '', deviceId: '', secret: '', protocol: 'GB28181', ip: '', port: '', orgId: '' });
    setEditingDevice(null);
  };

  const openEdit = (d: Device) => {
    setEditingDevice(d);
    setForm({
      name: d.name,
      deviceId: d.device_id,
      secret: '',
      protocol: d.protocol,
      ip: d.ip || '',
      port: d.port ? String(d.port) : '',
      orgId: d.org_id ? String(d.org_id) : '',
    });
    setShowModal(true);
  };

  return (
    <div className="p-6 min-h-full">
      <PageHeader
        title="设备管理"
        subtitle={`共 ${total} 台设备，支持国标 GB28181 与 ONVIF 协议`}
        breadcrumbs={[{ label: '设备管理' }]}
        actions={isAdmin && (
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="vms-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> 添加设备
          </button>
        )}
      />

      <div className="vms-card p-4 mb-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vms-text-muted" />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="搜索设备名称或设备ID..."
              className="vms-input pl-9"
            />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="vms-input w-36">
            <option value="all">全部状态</option>
            <option value="online">在线</option>
            <option value="offline">离线</option>
            <option value="maintenance">维护中</option>
          </select>
          <select value={orgId} onChange={e => setOrgId(e.target.value)} className="vms-input w-44">
            <option value="all">全部组织</option>
            {orgs.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          <button onClick={fetchData} className="vms-btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> 刷新
          </button>
        </div>
      </div>

      <div className="vms-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-vms-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="vms-table">
              <thead>
                <tr>
                  <th>设备名称</th>
                  <th>设备ID</th>
                  <th>协议</th>
                  <th>IP 地址</th>
                  <th>所属组织</th>
                  <th>设备状态</th>
                  <th>P2P 状态</th>
                  <th>固件版本</th>
                  <th>最后心跳</th>
                  <th className="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {devices.map(d => (
                  <tr key={d.id}>
                    <td className="font-medium text-white">{d.name}</td>
                    <td className="font-mono text-xs">{d.device_id}</td>
                    <td><ProtocolBadge status={d.protocol} /></td>
                    <td className="font-mono text-xs text-vms-text-muted">{d.ip}:{d.port || '-'}</td>
                    <td>{d.org_name || '-'}</td>
                    <td><DeviceStatusBadge status={d.status} /></td>
                    <td><P2PStatusBadge status={d.p2p_status} /></td>
                    <td className="text-xs font-mono">{d.firmware_version || '-'}</td>
                    <td className="text-xs text-vms-text-muted">{formatDateTime(d.last_heartbeat)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/devices/${d.id}`} className="p-1.5 rounded-lg hover:bg-vms-surface-2 text-vms-text-muted hover:text-vms-primary transition-colors" title="查看详情">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {isAdmin && (
                          <>
                            <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-vms-surface-2 text-vms-text-muted hover:text-amber-400 transition-colors" title="编辑">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteId(d.id)} className="p-1.5 rounded-lg hover:bg-vms-surface-2 text-vms-text-muted hover:text-red-400 transition-colors" title="删除">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {devices.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-vms-text-muted">暂无设备数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {total > 0 && (
          <div className="px-4 py-4 border-t border-vms-border/50">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
            />
          </div>
        )}
      </div>

      <Modal
        title={editingDevice ? '编辑设备' : '扫码绑定设备'}
        open={showModal}
        onClose={() => setShowModal(false)}
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="vms-btn-secondary">取消</button>
            <button onClick={handleSubmit} className="vms-btn-primary">{editingDevice ? '保存' : '绑定'}</button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-vms-text-muted">设备名称</label>
            <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="vms-input" placeholder="请输入设备名称" />
          </div>
          {!editingDevice && (
            <>
              <div className="space-y-2">
                <label className="text-sm text-vms-text-muted">设备ID</label>
                <input required value={form.deviceId} onChange={e => setForm(p => ({ ...p, deviceId: e.target.value }))} className="vms-input font-mono" placeholder="扫码或手动输入设备ID" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-vms-text-muted">设备密钥</label>
                <input required type="password" value={form.secret} onChange={e => setForm(p => ({ ...p, secret: e.target.value }))} className="vms-input font-mono" placeholder="设备标签上的密钥" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-vms-text-muted">接入协议</label>
                  <select value={form.protocol} onChange={e => setForm(p => ({ ...p, protocol: e.target.value as any }))} className="vms-input">
                    <option value="GB28181">国标 GB28181</option>
                    <option value="ONVIF">ONVIF</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-vms-text-muted">所属组织</label>
                  <select value={form.orgId} onChange={e => setForm(p => ({ ...p, orgId: e.target.value }))} className="vms-input">
                    <option value="">请选择</option>
                    {orgs.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-vms-text-muted">IP 地址</label>
                  <input value={form.ip} onChange={e => setForm(p => ({ ...p, ip: e.target.value }))} className="vms-input font-mono" placeholder="可选，如 192.168.1.100" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-vms-text-muted">端口</label>
                  <input type="number" value={form.port} onChange={e => setForm(p => ({ ...p, port: e.target.value }))} className="vms-input font-mono" placeholder="如 5060" />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-vms-primary/5 border border-vms-primary/30 text-sm text-vms-text-muted">
                <div className="flex items-start gap-2">
                  <Wifi className="w-4 h-4 mt-0.5 flex-shrink-0 text-vms-primary" />
                  <div>系统将自动通过 GB28181/ONVIF 协议发现设备能力集，并启动 P2P 穿透协商。P2P 连接成功后设备自动上线。</div>
                </div>
              </div>
            </>
          )}
          {editingDevice && (
            <div className="space-y-2">
              <label className="text-sm text-vms-text-muted">所属组织</label>
              <select value={form.orgId} onChange={e => setForm(p => ({ ...p, orgId: e.target.value }))} className="vms-input">
                <option value="">请选择</option>
                {orgs.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          )}
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
        <p className="text-vms-text">确认删除该设备？删除后相关录像和告警不会立即清除。</p>
      </Modal>
    </div>
  );
}
