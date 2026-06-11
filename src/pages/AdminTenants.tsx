import { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, ChevronRight, ChevronDown, Users, Phone } from 'lucide-react';

const API = '/api';

interface Tenant {
  id: number;
  name: string;
  type: 'group' | 'branch';
  parent_id: number | null;
  contact: string;
}

interface TreeNode {
  id: number;
  name: string;
  type: 'group' | 'branch';
  parent_id: number | null;
  contact: string;
  children: TreeNode[];
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, options);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || '请求失败');
  return json.data;
}

function buildTree(items: Tenant[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];
  items.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });
  map.forEach((node) => {
    if (node.parent_id === null) {
      roots.push(node);
    } else {
      const parent = map.get(node.parent_id);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
  });
  return roots;
}

function OrgTreeNode({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-3 py-3 px-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
        style={{ paddingLeft: `${depth * 24 + 16}px` }}
      >
        <button onClick={() => hasChildren && setExpanded(!expanded)} className="shrink-0">
          {hasChildren ? (
            expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />
          ) : <span className="w-4" />}
        </button>
        <div className={`p-1.5 rounded-lg ${node.type === 'group' ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-600'}`}>
          <Building2 size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800 text-sm truncate">{node.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${node.type === 'group' ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-600'}`}>
              {node.type === 'group' ? '集团' : '分公司'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Phone size={10} />{node.contact}</span>
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary transition-colors text-xs shrink-0">
          <Users size={14} />查看用户
        </button>
      </div>
      {expanded && hasChildren && node.children.map((child) => (
        <OrgTreeNode key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function AdminTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'branch' as 'group' | 'branch', parent_id: '' as string, contact: '' });

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<Tenant[]>('/admin/tenants');
      const items = Array.isArray(data) ? data : [];
      setTenants(items);
      setTree(buildTree(items));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const groupCount = tenants.filter((t) => t.type === 'group').length;
  const branchCount = tenants.filter((t) => t.type === 'branch').length;
  const groupOptions = tenants.filter((t) => t.type === 'group');

  const handleCreate = async () => {
    setCreating(true);
    try {
      await apiFetch('/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          parent_id: form.type === 'branch' && form.parent_id ? Number(form.parent_id) : null,
          contact: form.contact,
        }),
      });
      setShowCreate(false);
      setForm({ name: '', type: 'branch', parent_id: '', contact: '' });
      fetchTenants();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-bold text-gray-800">租户管理</h2>
          <p className="text-sm text-gray-500 mt-0.5">集团号管理下属城市分公司账号</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />新增租户
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-base p-5">
          <h3 className="font-heading font-semibold text-gray-800 mb-4">组织架构</h3>
          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : tree.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无租户数据</div>
          ) : (
            <div>
              {tree.map((node) => (
                <OrgTreeNode key={node.id} node={node} />
              ))}
            </div>
          )}
        </div>

        <div className="card-base p-5">
          <h3 className="font-heading font-semibold text-gray-800 mb-4">统计概览</h3>
          <div className="space-y-4">
            {[
              { label: '集团总数', value: groupCount, color: 'text-primary' },
              { label: '分公司总数', value: branchCount, color: 'text-blue-600' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{stat.label}</span>
                <span className={`font-mono font-bold text-lg ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl p-6 w-[440px] shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-heading font-bold text-gray-800 text-lg mb-4">新增租户</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">机构名称</label>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="请输入机构名称" className="input-base" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">机构类型</label>
                <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as 'group' | 'branch' }))} className="input-base">
                  <option value="group">集团</option>
                  <option value="branch">分公司</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">联系方式</label>
                <input value={form.contact} onChange={(e) => setForm((p) => ({ ...p, contact: e.target.value }))} placeholder="请输入联系方式" className="input-base" />
              </div>
              {form.type === 'branch' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">上级机构</label>
                  <select value={form.parent_id} onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value }))} className="input-base">
                    <option value="">请选择上级集团</option>
                    {groupOptions.map((g) => (
                      <option key={g.id} value={String(g.id)}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="btn-outline flex-1">取消</button>
              <button onClick={handleCreate} disabled={creating} className="btn-primary flex-1 disabled:opacity-50">
                {creating ? '创建中...' : '确认创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
