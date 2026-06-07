import { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, Plus, ArrowRight, FileDown, Eye, Award, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import StatsCard from '@/components/StatsCard';
import Modal from '@/components/Modal';

interface CreditRecord {
  id: string;
  enterpriseName: string;
  creditCode: string;
  creditScore: number;
  creditLevel: 'A' | 'B' | 'C' | 'D';
  reportCount: number;
  lastUpdate: string;
  status: 'active' | 'warning' | 'abnormal';
}

export default function Credit() {
  const [records, setRecords] = useState<CreditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CreditRecord | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/credit');
        const data = await res.json().catch(() => [
          { id: '1', enterpriseName: '广东科技有限公司', creditCode: '91440000MA58XXXXXX', creditScore: 92, creditLevel: 'A' as const, reportCount: 15, lastUpdate: '2024-01-15', status: 'active' as const },
          { id: '2', enterpriseName: '深圳市创新科技集团', creditCode: '91440300MA5DXXXXXX', creditScore: 88, creditLevel: 'A' as const, reportCount: 23, lastUpdate: '2024-01-14', status: 'active' as const },
          { id: '3', enterpriseName: '广州智能制造股份公司', creditCode: '91440100MA59XXXXXX', creditScore: 76, creditLevel: 'B' as const, reportCount: 18, lastUpdate: '2024-01-13', status: 'warning' as const },
          { id: '4', enterpriseName: '佛山新材料有限公司', creditCode: '91440600MA5UXXXXXX', creditScore: 65, creditLevel: 'C' as const, reportCount: 8, lastUpdate: '2024-01-12', status: 'warning' as const },
          { id: '5', enterpriseName: '东莞电子科技有限公司', creditCode: '91441900MA52XXXXXX', creditScore: 95, creditLevel: 'A' as const, reportCount: 31, lastUpdate: '2024-01-11', status: 'active' as const },
          { id: '6', enterpriseName: '珠海生物医药股份公司', creditCode: '91440400MA5LXXXXXX', creditScore: 52, creditLevel: 'D' as const, reportCount: 5, lastUpdate: '2024-01-10', status: 'abnormal' as const },
          { id: '7', enterpriseName: '惠州新能源有限公司', creditCode: '91441300MA5MXXXXXX', creditScore: 82, creditLevel: 'B' as const, reportCount: 12, lastUpdate: '2024-01-09', status: 'active' as const },
        ]);
        setRecords(data);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredData = records.filter((item) => {
    const matchesSearch = item.enterpriseName.includes(searchTerm) || item.creditCode.includes(searchTerm);
    const matchesLevel = !levelFilter || item.creditLevel === levelFilter;
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const avgScore = records.length > 0 ? Math.round(records.reduce((sum, r) => sum + r.creditScore, 0) / records.length) : 0;
  const aLevelCount = records.filter(r => r.creditLevel === 'A').length;
  const warningCount = records.filter(r => r.status === 'warning').length;
  const abnormalCount = records.filter(r => r.status === 'abnormal').length;

  const handleGenerateReport = (record: CreditRecord) => {
    setSelectedRecord(record);
    setIsReportModalOpen(true);
  };

  const confirmGenerate = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    setIsReportModalOpen(false);
    if (selectedRecord) {
      setRecords(records.map(r =>
        r.id === selectedRecord.id ? { ...r, reportCount: r.reportCount + 1, lastUpdate: new Date().toISOString().split('T')[0] } : r
      ));
    }
  };

  const getCreditLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      A: 'text-emerald-600 bg-emerald-100',
      B: 'text-blue-600 bg-blue-100',
      C: 'text-yellow-600 bg-yellow-100',
      D: 'text-red-600 bg-red-100',
    };
    return colors[level] || colors.B;
  };

  const columns = [
    { key: 'enterpriseName', label: '企业名称', className: 'min-w-[200px]' },
    { key: 'creditCode', label: '统一社会信用代码' },
    {
      key: 'creditScore',
      label: '信用评分',
      render: (row: CreditRecord) => (
        <div className="flex items-center gap-3">
          <div className="w-24 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${row.creditScore >= 80 ? 'bg-emerald-500' : row.creditScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${row.creditScore}%` }}
            />
          </div>
          <span className={`font-semibold ${row.creditScore >= 80 ? 'text-emerald-600' : row.creditScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
            {row.creditScore}
          </span>
        </div>
      ),
    },
    {
      key: 'creditLevel',
      label: '信用等级',
      render: (row: CreditRecord) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold ${getCreditLevelColor(row.creditLevel)}`}>
          <Award className="w-4 h-4 mr-1" />
          {row.creditLevel}级
        </span>
      ),
    },
    { key: 'reportCount', label: '报告次数' },
    { key: 'lastUpdate', label: '更新时间' },
    {
      key: 'status',
      label: '状态',
      render: (row: CreditRecord) => (
        <StatusBadge status={row.status === 'active' ? 'active' : row.status === 'warning' ? 'pending' : 'rejected'}>
          {row.status === 'active' && '正常'}
          {row.status === 'warning' && '预警'}
          {row.status === 'abnormal' && '异常'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      render: (row: CreditRecord) => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleGenerateReport(row)}
            className="text-[#1a56db] hover:underline text-sm flex items-center gap-1"
          >
            生成报告 <FileDown className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">信用档案</h1>
        <p className="page-description">企业信用档案管理和信用报告生成</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard title="企业平均信用分" value={avgScore} icon={ShieldCheck} iconColor="text-emerald-600" />
        <StatsCard title="A级信用企业" value={aLevelCount} icon={Award} iconColor="text-blue-600" />
        <StatsCard title="信用预警企业" value={warningCount} icon={AlertTriangle} iconColor="text-yellow-600" />
        <StatsCard title="信用异常企业" value={abnormalCount} icon={Clock} iconColor="text-red-600" />
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索企业名称或统一社会信用代码..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">全部等级</option>
              <option value="A">A级</option>
              <option value="B">B级</option>
              <option value="C">C级</option>
              <option value="D">D级</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">全部状态</option>
              <option value="active">正常</option>
              <option value="warning">预警</option>
              <option value="abnormal">异常</option>
            </select>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            信用修复
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={filteredData} loading={loading} />

      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="生成信用报告"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsReportModalOpen(false)} className="btn-secondary">取消</button>
            <button
              onClick={confirmGenerate}
              disabled={isGenerating}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <FileDown className="w-5 h-5" />
                  确认生成
                </>
              )}
            </button>
          </div>
        }
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">即将生成信用报告</p>
                  <p className="text-sm text-blue-700 mt-1">
                    系统将为 <span className="font-semibold">{selectedRecord.enterpriseName}</span> 生成企业信用报告，包含企业基本信息、信用评分、信用记录等内容。
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">统一社会信用代码: </span>
                <span className="text-gray-900">{selectedRecord.creditCode}</span>
              </div>
              <div>
                <span className="text-gray-500">当前信用评分: </span>
                <span className="font-semibold text-emerald-600">{selectedRecord.creditScore}分</span>
              </div>
              <div>
                <span className="text-gray-500">信用等级: </span>
                <span className={`font-semibold ${selectedRecord.creditLevel === 'A' ? 'text-emerald-600' : selectedRecord.creditLevel === 'B' ? 'text-blue-600' : 'text-yellow-600'}`}>
                  {selectedRecord.creditLevel}级
                </span>
              </div>
              <div>
                <span className="text-gray-500">已生成报告: </span>
                <span className="text-gray-900">{selectedRecord.reportCount}份</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              报告生成后将自动保存，可随时下载和打印。
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
