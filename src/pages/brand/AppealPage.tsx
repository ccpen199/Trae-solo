import { useState } from 'react';
import { MessageSquareWarning, Plus, Upload, Clock, CheckCircle2, AlertCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface Appeal {
  id: number;
  reportId: number;
  reportTitle: string;
  reason: string;
  evidence: string[];
  status: 'pending' | 'processing' | 'upheld' | 'rejected';
  createdAt: string;
  processedAt?: string;
  processorNote?: string;
}

const mockAppeals: Appeal[] = [
  {
    id: 1,
    reportId: 103,
    reportTitle: '海天酱油添加剂安全分析报告',
    reason: '报告中关于"添加剂使用量超标"的描述与实际检测数据不符，我司产品严格符合GB2760国家标准。',
    evidence: ['检验报告-20250601.pdf', '生产批次记录.xlsx'],
    status: 'processing',
    createdAt: '2025-06-12',
    processorNote: '已受理，正在进行数据复核。',
  },
  {
    id: 2,
    reportId: 104,
    reportTitle: '新东方教育服务质量评测',
    reason: '服务体验维度评分偏低，主要数据来源于第三方平台的非实名评价，建议补充官方渠道调研数据。',
    evidence: ['用户满意度调查报告.pdf'],
    status: 'pending',
    createdAt: '2025-06-15',
  },
  {
    id: 3,
    reportId: 98,
    reportTitle: '某品牌服务体验专项评测',
    reason: '数据抽样方法异议，样本量不足且抽样区域集中。',
    evidence: ['数据分析报告.pdf', '抽样分布图表.png'],
    status: 'upheld',
    createdAt: '2025-05-20',
    processedAt: '2025-05-28',
    processorNote: '申诉成立，已重新调整抽样方法并复评。',
  },
  {
    id: 4,
    reportId: 95,
    reportTitle: '某产品性价比评价报告',
    reason: '价格对比数据来源不准确。',
    evidence: ['价格对比数据.xlsx'],
    status: 'rejected',
    createdAt: '2025-05-10',
    processedAt: '2025-05-18',
    processorNote: '经核实，价格数据来源为公开可查的电商平台标价，申诉不成立。',
  },
];

const statusTabs = [
  { code: 'all', name: '全部' },
  { code: 'pending', name: '待处理' },
  { code: 'processing', name: '处理中' },
  { code: 'upheld', name: '已支持' },
  { code: 'rejected', name: '已驳回' },
];

export function AppealPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    reportId: '',
    reason: '',
    evidence: [] as string[],
  });

  const filteredAppeals = mockAppeals.filter(
    (a) => activeTab === 'all' || a.status === activeTab
  );

  const counts = {
    all: mockAppeals.length,
    pending: mockAppeals.filter(a => a.status === 'pending').length,
    processing: mockAppeals.filter(a => a.status === 'processing').length,
    upheld: mockAppeals.filter(a => a.status === 'upheld').length,
    rejected: mockAppeals.filter(a => a.status === 'rejected').length,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowForm(false);
    setFormData({ reportId: '', reason: '', evidence: [] });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-warning" />;
      case 'processing': return <AlertCircle className="w-5 h-5 text-blue-400" />;
      case 'upheld': return <CheckCircle2 className="w-5 h-5 text-primary" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-danger" />;
      default: return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white mb-1 flex items-center gap-2">
            <MessageSquareWarning className="w-6 h-6 text-primary" />
            申诉中心
          </h1>
          <p className="text-slate-400 text-sm">对评价结果有异议？提交申诉，我们将在3-5个工作日内处理</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-1" />
          新建申诉
        </button>
      </div>

      {/* New Appeal Form */}
      {showForm && (
        <div className="card p-6 mb-6 animate-fade-in">
          <h3 className="font-serif font-semibold text-white mb-4">新建申诉</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">关联报告编号</label>
              <input
                type="text"
                value={formData.reportId}
                onChange={(e) => setFormData({ ...formData, reportId: e.target.value })}
                placeholder="请输入报告编号，例如：103"
                className="input"
              />
            </div>
            <div>
              <label className="label">申诉理由</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="请详细说明申诉理由，包括具体的数据异议点、相关依据等..."
                rows={4}
                className="input resize-none"
              />
            </div>
            <div>
              <label className="label">佐证材料</label>
              <div className="border-2 border-dashed border-border rounded-md p-6 text-center transition-all cursor-pointer hover:border-primary/50">
                <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">点击或拖拽上传佐证材料</p>
                <p className="text-xs text-slate-600 mt-1">支持 PDF、图片、Excel 等格式</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline flex-1">
                取消
              </button>
              <button type="submit" className="btn btn-primary flex-1">
                提交申诉
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Status Tabs */}
      <div className="card mb-6 overflow-hidden">
        <div className="flex border-b border-slate-700/50 overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.code}
              onClick={() => setActiveTab(tab.code)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.code
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-surface-light/50'
              }`}
            >
              {tab.name}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                activeTab === tab.code ? 'bg-primary/20 text-primary' : 'bg-slate-700 text-slate-400'
              }`}>
                {counts[tab.code as keyof typeof counts]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Appeal List */}
      <div className="space-y-4">
        {filteredAppeals.map((appeal) => (
          <div key={appeal.id} className="card overflow-hidden">
            <div
              className="p-5 cursor-pointer hover:bg-surface-light/30 transition-colors"
              onClick={() => setExpandedId(expandedId === appeal.id ? null : appeal.id)}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center flex-shrink-0">
                  {getStatusIcon(appeal.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <StatusBadge status={appeal.status} />
                    <span className="text-xs text-slate-500">#{String(appeal.id).padStart(6, '0')}</span>
                  </div>
                  <h3 className="font-medium text-white truncate">{appeal.reportTitle}</h3>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">{appeal.reason}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>提交于 {appeal.createdAt}</span>
                    {appeal.processedAt && <span>处理于 {appeal.processedAt}</span>}
                    {appeal.evidence.length > 0 && <span>{appeal.evidence.length} 份佐证材料</span>}
                  </div>
                </div>
                {expandedId === appeal.id ? (
                  <ChevronUp className="w-5 h-5 text-slate-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />
                )}
              </div>
            </div>

            {expandedId === appeal.id && (
              <div className="px-5 pb-5 border-t border-slate-700/50 pt-4 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">申诉理由</h4>
                    <p className="text-sm text-slate-400 leading-relaxed bg-surface-light/30 rounded p-3">
                      {appeal.reason}
                    </p>
                  </div>

                  {appeal.evidence.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2">佐证材料</h4>
                      <div className="space-y-2">
                        {appeal.evidence.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-surface-light/30 rounded text-sm text-slate-300">
                            <Upload className="w-4 h-4 text-primary" />
                            {file}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {appeal.processorNote && (
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">处理结果</h4>
                      <div className={`p-3 rounded text-sm ${
                        appeal.status === 'upheld'
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : appeal.status === 'rejected'
                          ? 'bg-danger/10 text-danger border border-danger/30'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}>
                        {appeal.processorNote}
                      </div>
                    </div>
                  )}
                </div>

                {(appeal.status === 'pending' || appeal.status === 'processing') && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-end gap-3">
                    <button className="btn btn-outline text-sm">
                      补充材料
                    </button>
                    <button className="btn btn-ghost text-sm text-danger">
                      撤回申诉
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {filteredAppeals.length === 0 && (
          <div className="card p-12 text-center">
            <MessageSquareWarning className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">暂无申诉记录</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AppealPage;
