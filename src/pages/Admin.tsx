import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Shield, FileArchive, ArrowRight, Users, Briefcase, FileWarning, Clock } from 'lucide-react';

const API = '/api';

interface ComplianceData {
  total_users: number;
  active_jobs: number;
  unsigned_contracts: number;
  overtime_alerts: number;
}

const modules = [
  { key: 'tenants', label: '租户管理', icon: Building2, path: '/admin/tenants', color: 'bg-blue-50 text-blue-600' },
  { key: 'permissions', label: '权限配置', icon: Shield, path: '/admin/permissions', color: 'bg-purple-50 text-purple-600' },
  { key: 'compliance', label: '合规留存', icon: FileArchive, path: '/admin/compliance', color: 'bg-emerald-50 text-emerald-600' },
];

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, options);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || '请求失败');
  return json.data;
}

export default function Admin() {
  const navigate = useNavigate();
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiFetch<ComplianceData>('/admin/compliance');
      setData(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statCards = data ? [
    { label: '总用户数', value: data.total_users, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: '活跃岗位', value: data.active_jobs, icon: Briefcase, color: 'bg-emerald-50 text-emerald-600' },
    { label: '未签合同', value: data.unsigned_contracts, icon: FileWarning, color: 'bg-amber-50 text-amber-600' },
    { label: '加班预警', value: data.overtime_alerts, icon: Clock, color: 'bg-red-50 text-red-600' },
  ] : [];

  const moduleDescriptions: Record<string, string> = data ? {
    tenants: `管理${data.total_users}个用户账号，层级树状展示`,
    permissions: '角色权限矩阵配置，细粒度功能权限控制',
    compliance: `${data.unsigned_contracts}份未签合同，${data.overtime_alerts}条加班预警`,
  } : {
    tenants: '集团号管理下属城市分公司账号，层级树状展示',
    permissions: '角色权限矩阵配置，细粒度功能权限控制',
    compliance: '用工数据归档管理，满足《网络招聘服务管理规定》留存要求',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-heading font-bold text-gray-800">系统管理</h2>
        <p className="text-sm text-gray-500 mt-0.5">多租户架构、权限配置与合规数据管理</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400">加载中...</div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`card-base p-4 animate-fade-in stagger-${i + 1}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${s.color}`}><Icon size={18} /></div>
                  <div>
                    <p className="text-xl font-bold font-heading font-mono">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {modules.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.key}
              className={`card-base p-6 cursor-pointer animate-fade-in stagger-${i + 1}`}
              onClick={() => navigate(mod.path)}
            >
              <div className={`p-3 rounded-xl ${mod.color} w-fit mb-4`}>
                <Icon size={24} />
              </div>
              <h3 className="font-heading font-semibold text-gray-800 text-lg">{mod.label}</h3>
              <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{moduleDescriptions[mod.key]}</p>
              <div className="flex items-center gap-1 mt-4 text-primary text-sm font-medium">
                进入管理 <ArrowRight size={14} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
