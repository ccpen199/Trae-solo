import { useState, useEffect } from 'react';
import { MessageSquareWarning, Search, Filter, Plus, ArrowRight, MessageCircle, Clock, CheckCircle2, XCircle, Eye, Reply } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StatsCard from '@/components/StatsCard';
import Modal from '@/components/Modal';

interface Appeal {
  id: string;
  title: string;
  enterpriseName: string;
  type: string;
  submitDate: string;
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  priority: 'high' | 'medium' | 'low';
}

export default function Appeals() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyError, setReplyError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/appeals');
        const data = await res.json().catch(() => [
          { id: '1', title: '关于高新技术企业认定审批进度缓慢的投诉', enterpriseName: '广东科技有限公司', type: '投诉举报', submitDate: '2024-01-15', status: 'processing' as const, priority: 'high' as const },
          { id: '2', title: '专精特新政策解读咨询', enterpriseName: '深圳市创新科技集团', type: '政策咨询', submitDate: '2024-01-14', status: 'resolved' as const, priority: 'medium' as const },
          { id: '3', title: '系统登录问题反馈', enterpriseName: '广州智能制造股份公司', type: '问题反馈', submitDate: '2024-01-14', status: 'pending' as const, priority: 'medium' as const },
          { id: '4', title: '申请材料补正说明咨询', enterpriseName: '佛山新材料有限公司', type: '办事咨询', submitDate: '2024-01-13', status: 'resolved' as const, priority: 'low' as const },
          { id: '5', title: '补贴资金未到账问题', enterpriseName: '东莞电子科技有限公司', type: '投诉举报', submitDate: '2024-01-12', status: 'processing' as const, priority: 'high' as const },
          { id: '6', title: '信用修复申请咨询', enterpriseName: '珠海生物医药股份公司', type: '办事咨询', submitDate: '2024-01-11', status: 'rejected' as const, priority: 'medium' as const },
          { id: '7', title: '对行政处罚决定的异议', enterpriseName: '惠州新能源有限公司', type: '投诉举报', submitDate: '2024-01-10', status: 'pending' as const, priority: 'high' as const },
        ]);
        setAppeals(data);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = appeals.filter((item) => {
    const matchesSearch = item.title.includes(searchTerm) || item.enterpriseName.includes(searchTerm);
    const matchesStatus = !statusFilter || item.status === statusFilter;
    const matchesType = !typeFilter || item.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingCount = appeals.filter(a => a.status === 'pending').length;
  const processingCount = appeals.filter(a => a.status === 'processing').length;
  const resolvedCount = appeals.filter(a => a.status === 'resolved').length;
  const rejectedCount = appeals.filter(a => a.status === 'rejected').length;

  const handleViewDetail = (appeal: Appeal) => {
    setSelectedAppeal(appeal);
    setIsDetailModalOpen(true);
    setReplyContent('');
    setReplyError('');
  };

  const handleReply = () => {
    if (!replyContent.trim()) {
      setReplyError('请输入回复内容');
      return;
    }
    if (selectedAppeal) {
      setAppeals(appeals.map(a =>
        a.id === selectedAppeal.id ? { ...a, status: 'processing' as const } : a
      ));
      setIsDetailModalOpen(false);
      setReplyContent('');
      setReplyError('');
    }
  };

  const priorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200',
    };
    const labels: Record<string, string> = {
      high: '紧急',
      medium: '一般',
      low: '低',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[priority]}`}>
        {labels[priority]}
      </span>
    );
  };

  const columns = [
    { key: 'id', label: '诉求编号' },
    { key: 'title', label: '诉求标题', className: 'min-w-[300px]' },
    { key: 'enterpriseName', label: '企业名称' },
    { key: 'type', label: '诉求类型' },
    {
      key: 'priority',
      label: '优先级',
      render: (row: Appeal) => priorityBadge(row.priority),
    },
    { key: 'submitDate', label: '提交日期' },
    {
      key: 'status',
      label: '处理状态',
      render: (row: Appeal) => (
        <StatusBadge status={row.status}>
          {row.status === 'pending' && '待处理'}
          {row.status === 'processing' && '处理中'}
          {row.status === 'resolved' && '已解决'}
          {row.status === 'rejected' && '已驳回'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      render: (row: Appeal) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewDetail(row)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button className="text-[#1a56db] hover:underline text-sm flex items-center gap-1">
            回复 <Reply className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">诉求管理</h1>
        <p className="page-description">处理企业提交的各类诉求、投诉和咨询</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="待处理诉求" value={pendingCount} icon={Clock} iconColor="text-yellow-600" />
        <StatsCard title="处理中诉求" value={processingCount} icon={MessageCircle} iconColor="text-blue-600" />
        <StatsCard title="已解决诉求" value={resolvedCount} icon={CheckCircle2} iconColor="text-green-600" />
        <StatsCard title="已驳回诉求" value={rejectedCount} icon={XCircle} iconColor="text-red-600" />
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索诉求标题或企业名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="resolved">已解决</option>
              <option value="rejected">已驳回</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">全部类型</option>
              <option value="投诉举报">投诉举报</option>
              <option value="政策咨询">政策咨询</option>
              <option value="办事咨询">办事咨询</option>
              <option value="问题反馈">问题反馈</option>
            </select>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            新建工单
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={filteredData} loading={loading} />

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="诉求详情"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsDetailModalOpen(false)} className="btn-secondary">关闭</button>
            <button onClick={handleReply} className="btn-primary">提交回复</button>
          </div>
        }
      >
        {selectedAppeal && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedAppeal.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">诉求编号: {selectedAppeal.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  {priorityBadge(selectedAppeal.priority)}
                  <StatusBadge status={selectedAppeal.status}>
                    {selectedAppeal.status === 'pending' && '待处理'}
                    {selectedAppeal.status === 'processing' && '处理中'}
                    {selectedAppeal.status === 'resolved' && '已解决'}
                    {selectedAppeal.status === 'rejected' && '已驳回'}
                  </StatusBadge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">企业名称: </span>
                  <span className="text-gray-900">{selectedAppeal.enterpriseName}</span>
                </div>
                <div>
                  <span className="text-gray-500">诉求类型: </span>
                  <span className="text-gray-900">{selectedAppeal.type}</span>
                </div>
                <div>
                  <span className="text-gray-500">提交时间: </span>
                  <span className="text-gray-900">{selectedAppeal.submitDate}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">诉求内容</h4>
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-gray-700">
                您好，我司于2023年12月提交的高新技术企业认定申请，至今仍在审批中，距离承诺的15个工作日办理时限已超出多日。我司急需该资质用于投标和享受税收优惠政策，恳请相关部门加快审批进度，谢谢！
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">处理记录</h4>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0" />
                  <div className="flex-1 bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-gray-900">系统已受理，正在分配处理人员</p>
                    <p className="text-xs text-gray-500 mt-1">2024-01-15 09:30:00</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0" />
                  <div className="flex-1 bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-gray-900">已分配至科技厅审批处处理</p>
                    <p className="text-xs text-gray-500 mt-1">2024-01-15 10:15:00</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="form-label">回复内容</label>
              <textarea
                value={replyContent}
                onChange={(e) => { setReplyContent(e.target.value); setReplyError(''); }}
                placeholder="请输入回复内容..."
                rows={4}
                className={`input-field ${replyError ? 'border-red-300' : ''}`}
              />
              {replyError && <p className="mt-1 text-sm text-red-600">{replyError}</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
