import { useState } from 'react';
import {
  Plus,
  Search,
  Upload,
  Users,
  Mail,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDate, formatNumber, formatPercentage } from '@/lib/utils';

interface Audience {
  id: string;
  name: string;
  description: string | null;
  filters: Record<string, unknown> | null;
  totalCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { members: number; campaigns: number };
}

export function AudiencesPage() {
  const [loading] = useState(false);
  const [audiences] = useState<Audience[]>([
    {
      id: '1',
      name: '潜在客户列表',
      description: '从官网表单收集的潜在客户',
      filters: { source: 'website_form' },
      totalCount: 2500,
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      _count: { members: 2500, campaigns: 5 },
    },
    {
      id: '2',
      name: '新注册用户',
      description: '最近30天内注册的新用户',
      filters: { registeredWithin: 30 },
      totalCount: 800,
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      _count: { members: 800, campaigns: 3 },
    },
    {
      id: '3',
      name: 'VIP会员',
      description: '付费VIP会员用户',
      filters: { memberType: 'vip' },
      totalCount: 500,
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 15).toISOString(),
      _count: { members: 500, campaigns: 4 },
    },
    {
      id: '4',
      name: '流失用户',
      description: '超过90天未活跃的用户',
      filters: { inactiveDays: 90 },
      totalCount: 1200,
      isActive: false,
      createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      _count: { members: 1200, campaigns: 2 },
    },
  ]);
  const [pagination] = useState({
    page: 1,
    limit: 10,
    total: 8,
    pages: 1,
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">受众管理</h1>
          <p className="text-neutral-500 mt-1">管理目标受众，支持标签筛选和分组</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <Upload className="w-4 h-4" />
            导入
          </button>
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            新建受众
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">受众分组</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {formatNumber(8)}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">总成员数</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {formatNumber(12580)}
                </p>
              </div>
              <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">活跃订阅</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {formatPercentage(96.8)}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-warning-600" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">使用中</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {formatNumber(5)}
                </p>
              </div>
              <div className="w-12 h-12 bg-danger-100 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-danger-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索受众名称、描述..."
              className="input pl-10 max-w-md"
            />
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-80">受众信息</th>
                <th className="w-24">状态</th>
                <th className="w-24">成员数</th>
                <th className="w-24">使用次数</th>
                <th className="w-40">创建时间</th>
                <th className="w-32 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {audiences.map((audience) => (
                <tr key={audience.id}>
                  <td>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{audience.name}</p>
                        <p className="text-sm text-neutral-500">
                          {audience.description || '暂无描述'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${audience.isActive ? 'badge-success' : 'badge-default'}`}>
                      {audience.isActive ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td>
                    <span className="font-medium text-neutral-900">
                      {formatNumber(audience._count.members)}
                    </span>
                  </td>
                  <td>
                    <span className="font-medium text-neutral-900">
                      {formatNumber(audience._count.campaigns)}
                    </span>
                  </td>
                  <td>
                    <span className="text-sm text-neutral-600">
                      {formatDate(audience.createdAt)}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500 hover:text-danger-700 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="card-footer flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            共 {formatNumber(pagination.total)} 条记录
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page === 1}
              className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-neutral-600">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              disabled={pagination.page === pagination.pages}
              className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AudiencesPage;
