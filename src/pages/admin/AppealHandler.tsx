import { useState } from 'react';
import { Search, Filter, Clock, CheckCircle, XCircle, AlertTriangle, Eye, FileText, MessageSquare } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

interface Appeal {
  id: number;
  brandName: string;
  reportTitle: string;
  reason: string;
  evidenceCount: number;
  status: 'pending' | 'processing' | 'upheld' | 'rejected';
  createdAt: string;
}

const mockAppeals: Appeal[] = [
  {
    id: 1,
    brandName: '美好食品有限公司',
    reportTitle: '2026年Q2美好有机牛奶评测报告',
    reason: '评测中引用的电商销量数据与实际数据存在差异，我方提供的后台销售数据显示同期销量高出23%，请求重新复核数据。',
    evidenceCount: 5,
    status: 'pending',
    createdAt: '2026-06-12 14:30',
  },
  {
    id: 2,
    brandName: '华美医疗美容',
    reportTitle: '华美双眼皮整形术综合评价',
    reason: '黑猫投诉数据中存在3条恶意差评，已由平台判定为不实信息并删除，请求从数据源中移除相关记录。',
    evidenceCount: 8,
    status: 'processing',
    createdAt: '2026-06-10 09:15',
  },
  {
    id: 3,
    brandName: '精英教育集团',
    reportTitle: '上海地区高考冲刺辅导班横向评测',
    reason: '办学资质评分中未包含我方2026年新取得的AAA级信用认证，请求补充计入。',
    evidenceCount: 3,
    status: 'upheld',
    createdAt: '2026-06-05 16:45',
  },
  {
    id: 4,
    brandName: '山水旅游集团',
    reportTitle: '苏州古镇景区季度服务质量评测',
    reason: '游客排队时长数据采集时间为五一假期峰值期间，不代表常态，请求采用加权平均方式重算。',
    evidenceCount: 2,
    status: 'rejected',
    createdAt: '2026-06-01 11:20',
  },
];

export default function AppealHandler() {
  const [appeals, setAppeals] = useState<Appeal[]>(mockAppeals);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [processorNote, setProcessorNote] = useState('');

  const filtered = appeals.filter(a => {
    const matchSearch = a.brandName.includes(searchTerm) || a.reportTitle.includes(searchTerm);
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleProcess = (appealId: number, decision: 'upheld' | 'rejected') => {
    setAppeals(prev => prev.map(a =>
      a.id === appealId
        ? { ...a, status: decision, processedAt: new Date().toISOString() }
        : a
    ));
    if (selectedAppeal?.id === appealId) {
      setSelectedAppeal({ ...selectedAppeal, status: decision });
    }
  };

  const statusConfig = {
    pending: { label: '待处理', color: 'warning' as const, icon: Clock },
    processing: { label: '处理中', color: 'info' as const, icon: AlertTriangle },
    upheld: { label: '申诉成立', color: 'success' as const, icon: CheckCircle },
    rejected: { label: '驳回申诉', color: 'danger' as const, icon: XCircle },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-white">品牌申诉处理</h1>
          <p className="text-slate-400 mt-1">处理品牌方提交的评价申诉请求，保障公平公正</p>
        </div>
        <div className="flex gap-2">
          <div className="badge bg-warning/20 text-warning border border-warning/30">
            {appeals.filter(a => a.status === 'pending').length} 待处理
          </div>
          <div className="badge bg-blue-500/20 text-blue-400 border border-blue-500/30">
            {appeals.filter(a => a.status === 'processing').length} 处理中
          </div>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="搜索品牌名称或报告标题..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-[160px]"
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="upheld">申诉成立</option>
            <option value="rejected">驳回申诉</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3 max-h-[calc(100vh-260px)] overflow-y-auto scrollbar-thin pr-2">
          {filtered.map((appeal, idx) => {
            const cfg = statusConfig[appeal.status];
            const Icon = cfg.icon;
            return (
              <div
                key={appeal.id}
                onClick={() => setSelectedAppeal(appeal)}
                className={`card p-4 cursor-pointer transition-all duration-200 animate-slide-up stagger-${(idx % 5) + 1} ${
                  selectedAppeal?.id === appeal.id
                    ? 'border-primary/50 shadow-glow-primary'
                    : 'hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-white">{appeal.brandName}</span>
                  <StatusBadge status={appeal.status} />
                </div>
                <div className="text-sm text-slate-300 mb-2 line-clamp-2">
                  <FileText className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  {appeal.reportTitle}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {appeal.evidenceCount} 份证据
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {appeal.createdAt}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-3">
          {selectedAppeal ? (
            <div className="card p-6 animate-fade-in">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">申诉 #{selectedAppeal.id}</h2>
                  <p className="text-slate-400 text-sm">提交于 {selectedAppeal.createdAt}</p>
                </div>
                <StatusBadge status={selectedAppeal.status} className="text-sm px-3 py-1" />
              </div>

              <div className="space-y-5">
                <div>
                  <label className="label">申诉品牌</label>
                  <div className="text-white font-medium">{selectedAppeal.brandName}</div>
                </div>
                <div>
                  <label className="label">涉事报告</label>
                  <div className="flex items-center gap-2 text-primary hover:text-primary-dark cursor-pointer">
                    <Eye className="w-4 h-4" />
                    {selectedAppeal.reportTitle}
                  </div>
                </div>
                <div>
                  <label className="label">申诉理由</label>
                  <div className="card p-4 bg-surface-light/50 text-slate-200 leading-relaxed">
                    {selectedAppeal.reason}
                  </div>
                </div>
                <div>
                  <label className="label">证据材料 ({selectedAppeal.evidenceCount}份)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Array.from({ length: selectedAppeal.evidenceCount }).map((_, i) => (
                      <div
                        key={i}
                        className="card p-3 bg-surface-light/40 border-dashed hover:border-primary/40 cursor-pointer transition-all"
                      >
                        <FileText className="w-8 h-8 mx-auto text-slate-500 mb-1" />
                        <div className="text-xs text-center text-slate-400">证据{i + 1}.pdf</div>
                      </div>
                    ))}
                  </div>
                </div>

                {(selectedAppeal.status === 'pending' || selectedAppeal.status === 'processing') && (
                  <>
                    <div className="divider" />
                    <div>
                      <label className="label">处理意见</label>
                      <textarea
                        value={processorNote}
                        onChange={(e) => setProcessorNote(e.target.value)}
                        className="input min-h-[100px] resize-y"
                        placeholder="请填写详细的处理意见和说明..."
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleProcess(selectedAppeal.id, 'upheld')}
                        className="btn-primary flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        申诉成立（重新评测）
                      </button>
                      <button
                        onClick={() => handleProcess(selectedAppeal.id, 'rejected')}
                        className="btn-danger flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        驳回申诉
                      </button>
                    </div>
                  </>
                )}

                {selectedAppeal.status === 'upheld' && (
                  <div className="card p-4 bg-primary/10 border-primary/30">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-primary mb-1">申诉已受理</div>
                        <p className="text-sm text-slate-300">
                          已启动重新评测流程，预计3个工作日内完成数据复核并更新评价结果。
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedAppeal.status === 'rejected' && (
                  <div className="card p-4 bg-danger/10 border-danger/30">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-danger mb-1">申诉已驳回</div>
                        <p className="text-sm text-slate-300">
                          经复核，原评测数据来源有效且采集流程合规，维持原评价结果不变。
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center text-slate-500">
              <AlertTriangle className="w-16 h-16 mb-4 opacity-40" />
              <p className="text-lg">请从左侧选择一条申诉进行处理</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
