import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, Building2, Store, Warehouse } from 'lucide-react';
import api from '@/lib/api';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import { OrgTypeBadge, DeviceStatusBadge } from '@/components/Badges';
import type { Organization, Device } from '@/types';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

export default function Organizations() {
  const [tree, setTree] = useState<Organization[]>([]);
  const [list, setList] = useState<Organization[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set([1]));
  const [selected, setSelected] = useState<number | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', type: 'store' as 'enterprise' | 'store' | 'warehouse' });
  const isAdmin = useAuthStore(s => s.isAdmin);

  const fetchData = () => {
    api.get('/organizations').then(res => {
      if (res.data.success) {
        setTree(res.data.tree || []);
        setList(res.data.list || []);
      }
    });
  };

  useEffect(() => {
    document.title = '组织架构 - 云瞳视频监控';
    fetchData();
  }, []);

  useEffect(() => {
    if (selected != null) {
      api.get(`/organizations/${selected}/devices`).then(res => {
        if (res.data.success) setDevices(res.data.devices);
      });
    } else {
      setDevices([]);
    }
  }, [selected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/organizations/${editingId}`, { name: form.name });
      } else {
        await api.post('/organizations', { ...form, parentId });
      }
      setShowModal(false);
      fetchData();
      resetForm();
    } catch (e: any) {
      alert(e.response?.data?.error || '操作失败');
    }
  };

  const resetForm = () => {
    setForm({ name: '', type: 'store' });
    setEditingId(null);
    setParentId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/organizations/${deleteId}`);
      setDeleteId(null);
      if (selected === deleteId) setSelected(null);
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.error || '删除失败');
    }
  };

  const toggleExpand = (id: number) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpanded(next);
  };

  const openAdd = (parent: number | null) => {
    resetForm();
    setParentId(parent);
    setShowModal(true);
  };

  const openEdit = (node: Organization) => {
    setEditingId(node.id);
    setForm({ name: node.name, type: node.type });
    setParentId(node.parent_id);
    setShowModal(true);
  };

  const typeIconMap = {
    enterprise: Building2,
    store: Store,
    warehouse: Warehouse,
  };

  const renderTreeNode = (node: Organization, level = 0) => {
    const Icon = typeIconMap[node.type];
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group",
            selected === node.id ? "bg-vms-primary/15 border border-vms-primary/30" : "hover:bg-vms-surface-2"
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
          onClick={() => setSelected(node.id)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
              className="w-5 h-5 flex items-center justify-center text-vms-text-muted hover:text-vms-text"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-5" />
          )}
          <Icon className={cn("w-4 h-4", node.type === 'enterprise' ? 'text-purple-400' : node.type === 'store' ? 'text-blue-400' : 'text-amber-400')} />
          <span className="flex-1 text-sm truncate">{node.name}</span>
          <OrgTypeBadge status={node.type} className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" />
          {isAdmin && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); openAdd(node.id); }}
                className="p-1 rounded hover:bg-vms-bg text-vms-text-muted hover:text-vms-primary"
                title="添加子节点"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); openEdit(node); }}
                className="p-1 rounded hover:bg-vms-bg text-vms-text-muted hover:text-amber-400"
                title="编辑"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              {node.id !== 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteId(node.id); }}
                  className="p-1 rounded hover:bg-vms-bg text-vms-text-muted hover:text-red-400"
                  title="删除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>{node.children?.map(child => renderTreeNode(child, level + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 min-h-full">
      <PageHeader
        title="组织架构"
        subtitle="管理企业、门店、仓库的分级组织架构，支持树形层级"
        breadcrumbs={[{ label: '组织架构' }]}
        actions={isAdmin && (
          <button onClick={() => openAdd(null)} className="vms-btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> 新增节点
          </button>
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="vms-card p-4">
          <h3 className="font-semibold text-white font-mono mb-3 px-2">组织树</h3>
          <div className="space-y-0.5">
            {tree.map(node => renderTreeNode(node))}
          </div>
        </div>

        <div className="lg:col-span-2 vms-card p-4">
          <h3 className="font-semibold text-white font-mono mb-3 px-1">
            {selected ? (
              <>
                绑定设备 - {list.find(n => n.id === selected)?.name || '详情'}
                <span className="ml-2 text-xs text-vms-text-muted font-normal">共 {devices.length} 台</span>
              </>
            ) : (
              '请选择左侧组织节点查看设备'
            )}
          </h3>
          {selected ? (
            <div className="overflow-x-auto">
              <table className="vms-table">
                <thead>
                  <tr>
                    <th>设备名称</th>
                    <th>设备ID</th>
                    <th>协议</th>
                    <th>IP 地址</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map(d => (
                    <tr key={d.id}>
                      <td className="font-medium text-white">{d.name}</td>
                      <td className="font-mono text-xs">{d.device_id}</td>
                      <td className="font-mono text-xs">{d.protocol}</td>
                      <td className="font-mono text-xs text-vms-text-muted">{d.ip}:{d.port || '-'}</td>
                      <td><DeviceStatusBadge status={d.status} /></td>
                    </tr>
                  ))}
                  {devices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-vms-text-muted">该组织下暂无设备</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-vms-text-muted">
              请选择左侧组织节点
            </div>
          )}
        </div>
      </div>

      <Modal
        title={editingId ? '编辑节点' : '新增组织节点'}
        open={showModal}
        onClose={() => setShowModal(false)}
        size="md"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="vms-btn-secondary">取消</button>
            <button onClick={handleSubmit} className="vms-btn-primary">{editingId ? '保存' : '创建'}</button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingId && (
            <div className="space-y-2">
              <label className="text-sm text-vms-text-muted">上级节点</label>
              <select value={parentId || ''} onChange={e => setParentId(e.target.value ? parseInt(e.target.value) : null)} className="vms-input">
                <option value="">无（顶级节点）</option>
                {list.map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm text-vms-text-muted">节点名称</label>
            <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="vms-input" placeholder="如：北京朝阳店" />
          </div>
          {!editingId && (
            <div className="space-y-2">
              <label className="text-sm text-vms-text-muted">节点类型</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as any }))} className="vms-input">
                <option value="enterprise">企业</option>
                <option value="store">门店</option>
                <option value="warehouse">仓库</option>
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
        <p className="text-vms-text">确认删除该组织节点？子节点和设备绑定关系将一并解除。</p>
      </Modal>
    </div>
  );
}
