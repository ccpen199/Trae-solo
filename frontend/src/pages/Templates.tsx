import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  subject: string;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { campaigns: number };
}

export function TemplatesPage() {
  const [loading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: '促销邮件模板',
      description: '适用于产品促销活动的邮件模板',
      category: '促销',
      subject: '{{name}}，限时优惠不容错过！',
      isActive: true,
      isPublic: true,
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      _count: { campaigns: 12 },
    },
    {
      id: '2',
      name: '欢迎邮件模板',
      description: '新用户注册后的欢迎邮件',
      category: '通知',
      subject: '欢迎加入{{company}}！',
      isActive: true,
      isPublic: true,
      createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      _count: { campaigns: 8 },
    },
    {
      id: '3',
      name: '产品更新通知',
      description: '告知用户产品功能更新',
      category: '通知',
      subject: '新功能上线：{{feature}}现已推出',
      isActive: true,
      isPublic: false,
      createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
      _count: { campaigns: 5 },
    },
    {
      id: '4',
      name: '会员生日祝福',
      description: '会员生日专属祝福邮件',
      category: '问候',
      subject: '生日快乐，{{name}}！',
      isActive: true,
      isPublic: true,
      createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      _count: { campaigns: 3 },
    },
  ]);
  const [pagination] = useState({
    page: 1,
    limit: 10,
    total: 24,
    pages: 3,
  });
  const [filters] = useState({
    category: '',
    search: '',
    isActive: '',
  });
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">模板管理</h1>
          <p className="text-neutral-500 mt-1">管理邮件模板，支持动态变量渲染</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          新建模板
        </button>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="搜索模板名称、描述..."
                value={filters.search}
                className="input pl-10"
              />
            </div>
            <select className="input w-full md:w-40">
              <option value="">全部分类</option>
              <option value="促销">促销</option>
              <option value="通知">通知</option>
              <option value="问候">问候</option>
            </select>
            <select className="input w-full md:w-40">
              <option value="">全部状态</option>
              <option value="true">启用</option>
              <option value="false">禁用</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div key={template.id} className="card">
            <div className="card-header flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900">{template.name}</h3>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {template.category || '未分类'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${template.isActive ? 'badge-success' : 'badge-default'}`}>
                  {template.isActive ? '启用' : '禁用'}
                </span>
              </div>
            </div>
            <div className="card-body space-y-3">
              <p className="text-sm text-neutral-600">
                {template.description || '暂无描述'}
              </p>
              <div className="bg-neutral-50 rounded-lg p-3">
                <p className="text-xs text-neutral-500 mb-1">邮件主题</p>
                <p className="text-sm text-neutral-900 font-mono">{template.subject}</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">
                  使用次数: <span className="font-medium text-neutral-900">{formatNumber(template._count.campaigns)}</span>
                </span>
                <span className="text-neutral-500">
                  更新于 {formatDate(template.updatedAt).split(' ')[0]}
                </span>
              </div>
            </div>
            <div className="card-footer flex items-center justify-end gap-2">
              <button className="btn-ghost btn-sm">
                <Eye className="w-4 h-4" />
                预览
              </button>
              <button className="btn-ghost btn-sm">
                <Edit className="w-4 h-4" />
                编辑
              </button>
              <button className="btn-ghost btn-sm text-danger-600 hover:bg-danger-50">
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="card-footer flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          共 {formatNumber(pagination.total)} 条记录，第 {pagination.page} / {pagination.pages} 页
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
  );
}

export default TemplatesPage;
