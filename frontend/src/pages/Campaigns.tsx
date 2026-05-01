import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { api, PaginationData } from '@/lib/api';
import {
  formatDate,
  getStatusColor,
  getStatusDot,
  getStatusLabel,
  formatNumber,
} from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  subject: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  creator: { id: string; name: string; email: string };
  template: { id: string; name: string } | null;
  audience: { id: string; name: string; totalCount: number } | null;
  _count: { sendBatches: number; journeys: number };
  stats: Record<string, number>;
}

export function CampaignsPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  
  useEffect(() => {
    fetchCampaigns();
  }, [pagination.page, filters]);
  
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      
      const response = await api.get<PaginationData<Campaign[]>>(`/api/campaigns?${params}`);
      if (response.success) {
        if (Array.isArray(response.data)) {
          setCampaigns(response.data);
        } else if ('campaigns' in response.data) {
            setCampaigns(response.data.campaigns);
            setPagination(response.data.pagination);
          }
        }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      setCampaigns([
        {
          id: '1',
          name: '2024春季促销活动',
          description: '春季新品上市促销邮件',
          status: 'SENDING',
          subject: '春季新品上市，限时8折优惠！',
          scheduledAt: null,
          startedAt: new Date().toISOString(),
          completedAt: null,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          creator: { id: '1', name: '张三', email: 'zhangsan@example.com' },
          template: { id: '1', name: '促销邮件模板' },
          audience: { id: '1', name: '潜在客户列表', totalCount: 2500 },
          _count: { sendBatches: 3, journeys: 1 },
          stats: { totalSent: 1250, totalOpened: 450, totalClicked: 120 },
        },
        {
          id: '2',
          name: '新用户欢迎邮件序列',
          description: '新用户注册后的自动欢迎邮件',
          status: 'COMPLETED',
          subject: '欢迎加入我们！',
          scheduledAt: null,
          startedAt: new Date(Date.now() - 172800000).toISOString(),
          completedAt: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          creator: { id: '2', name: '李四', email: 'lisi@example.com' },
          template: { id: '2', name: '欢迎邮件模板' },
          audience: { id: '2', name: '新注册用户', totalCount: 800 },
          _count: { sendBatches: 1, journeys: 0 },
          stats: { totalSent: 800, totalOpened: 520, totalClicked: 210 },
        },
        {
          id: '3',
          name: '产品更新通知',
          description: '告知用户产品功能更新',
          status: 'PENDING_REVIEW',
          subject: '新功能上线通知',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          startedAt: null,
          completedAt: null,
          createdAt: new Date(Date.now() - 43200000).toISOString(),
          creator: { id: '1', name: '张三', email: 'zhangsan@example.com' },
          template: { id: '3', name: '通知邮件模板' },
          audience: { id: '3', name: '所有活跃用户', totalCount: 5000 },
          _count: { sendBatches: 0, journeys: 0 },
          stats: {},
        },
        {
          id: '4',
          name: '会员专属优惠活动',
          description: '针对VIP会员的专属折扣',
          status: 'DRAFT',
          subject: null,
          scheduledAt: null,
          startedAt: null,
          completedAt: null,
          createdAt: new Date(Date.now() - 21600000).toISOString(),
          creator: { id: '3', name: '王五', email: 'wangwu@example.com' },
          template: null,
          audience: null,
          _count: { sendBatches: 0, journeys: 0 },
          stats: {},
        },
      ]);
      setPagination({
        page: 1,
        limit: 10,
        total: 24,
        pages: 3,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };
  
  const viewCampaignDetail = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowDetail(true);
  };
  
  const statusOptions = [
    { value: '', label: '全部状态' },
    { value: 'DRAFT', label: '草稿' },
    { value: 'PENDING_REVIEW', label: '待审核' },
    { value: 'REVIEW_APPROVED', label: '审核通过' },
    { value: 'PENDING_SEND', label: '待发送' },
    { value: 'SENDING', label: '发送中' },
    { value: 'COMPLETED', label: '已完成' },
    { value: 'PAUSED', label: '已暂停' },
    { value: 'CANCELLED', label: '已取消' },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">营销活动</h1>
          <p className="text-neutral-500 mt-1">管理和监控所有邮件营销活动</p>
        </div>
        <Link to="/campaigns/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          新建活动
        </Link>
      </div>
      
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="搜索活动名称、描述..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="input"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn-secondary">
              <Filter className="w-4 h-4" />
              更多筛选
            </button>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-80">活动信息</th>
                <th className="w-32">状态</th>
                <th className="w-40">发送统计</th>
                <th className="w-32">创建者</th>
                <th className="w-40">创建时间</th>
                <th className="w-32 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto" />
                    <p className="text-neutral-500 mt-2">加载中...</p>
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-500">暂无营销活动</p>
                    <Link to="/campaigns/new" className="btn-primary mt-4">
                      <Plus className="w-4 h-4" />
                      创建第一个活动
                    </Link>
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr key={campaign.id} className="cursor-pointer" onClick={() => viewCampaignDetail(campaign)}>
                    <td>
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                          campaign.status === 'SENDING' ? 'bg-warning-100' :
                          campaign.status === 'COMPLETED' ? 'bg-success-100' :
                          campaign.status === 'PENDING_REVIEW' ? 'bg-primary-100' :
                          'bg-neutral-100'
                        )}>
                          {campaign.status === 'SENDING' && <Play className="w-5 h-5 text-warning-600" />}
                          {campaign.status === 'COMPLETED' && <CheckCircle className="w-5 h-5 text-success-600" />}
                          {campaign.status === 'PENDING_REVIEW' && <Eye className="w-5 h-5 text-primary-600" />}
                          {campaign.status === 'DRAFT' && <FileText className="w-5 h-5 text-neutral-600" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-900 truncate">{campaign.name}</p>
                          <p className="text-sm text-neutral-500 truncate">
                            {campaign.description || '暂无描述'}
                          </p>
                          {campaign.subject && (
                            <p className="text-xs text-neutral-400 truncate mt-1">
                              主题: {campaign.subject}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={getStatusDot(campaign.status)} />
                        <span className={cn('badge', getStatusColor(campaign.status))}>
                          {getStatusLabel(campaign.status)}
                        </span>
                      </div>
                    </td>
                    <td>
                      {campaign.stats && Object.keys(campaign.stats).length > 0 ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-neutral-500">发送:</span>
                            <span className="font-medium text-neutral-900">
                              {formatNumber(campaign.stats.totalSent || 0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-neutral-500">打开:</span>
                            <span className="font-medium text-primary-600">
                              {formatNumber(campaign.stats.totalOpened || 0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-neutral-500">点击:</span>
                            <span className="font-medium text-success-600">
                              {formatNumber(campaign.stats.totalClicked || 0)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-400">-</span>
                      )}
                    </td>
                    <td>
                      <p className="text-sm font-medium text-neutral-900">
                        {campaign.creator.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {campaign.creator.email}
                      </p>
                    </td>
                    <td>
                      <p className="text-sm text-neutral-900">
                        {formatDate(campaign.createdAt)}
                      </p>
                      {campaign.startedAt && (
                        <p className="text-xs text-neutral-500">
                          开始: {formatDate(campaign.startedAt)}
                        </p>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors" title="查看详情">
                        <Eye className="w-4 h-4" />
                      </button>
                      {campaign.status === 'DRAFT' && (
                        <button className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 transition-colors" title="编辑">
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {campaign.status === 'SENDING' && (
                        <button className="p-1.5 rounded-lg hover:bg-warning-50 text-warning-600 hover:text-warning-700 transition-colors" title="暂停">
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      {(campaign.status === 'DRAFT' || campaign.status === 'CANCELLED') && (
                        <button className="p-1.5 rounded-lg hover:bg-danger-50 text-danger-500 hover:text-danger-700 transition-colors" title="删除">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
        
        {pagination.pages > 1 && (
          <div className="card-footer flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              共 {formatNumber(pagination.total)} 条记录，第 {pagination.page} / {pagination.pages} 页
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNum: number;
                if (pagination.pages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={cn(
                      'btn-sm',
                      pagination.page === pageNum ? 'btn-primary' : 'btn-ghost'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CampaignsPage;
