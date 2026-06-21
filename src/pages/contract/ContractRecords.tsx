import { useState, useMemo } from 'react';
import {
  Archive,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  FileCheck2,
  ShieldCheck,
  Building2,
  User,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  FileText,
  Layers,
  CheckCheck,
  AlertTriangle,
} from 'lucide-react';
import { mockContracts, mockSignRecords } from '@/mock/data';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/ui/StatCard';
import { formatDate, formatDateTime } from '@/utils/helpers';
import type { Contract, FilingStatus, ContractStatus, SignRecord } from '../../../shared/types';

const filterTabs: { id: string; label: string; status?: ContractStatus; filingStatus?: FilingStatus }[] = [
  { id: 'all', label: '全部合同' },
  { id: 'active', label: '已生效', status: 'signed' },
  { id: 'filing', label: '备案中', filingStatus: 'filing' },
  { id: 'terminated', label: '已终止', status: 'terminated' },
  { id: 'failed', label: '备案失败', filingStatus: 'failed' },
];

const stats = [
  { title: '累计签约', value: '156份', icon: <FileText className="h-5 w-5" /> },
  { title: '已备案', value: '142份', icon: <CheckCheck className="h-5 w-5" /> },
  { title: '备案中', value: '8份', icon: <Clock className="h-5 w-5" /> },
  { title: '备案失败', value: '6份', icon: <AlertTriangle className="h-5 w-5" /> },
];

export default function ContractRecords() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredContracts = useMemo(() => {
    return mockContracts.filter(contract => {
      const tab = filterTabs.find(t => t.id === activeTab);
      let matchTab = true;
      if (tab?.status) matchTab = contract.status === tab.status;
      if (tab?.filingStatus) matchTab = contract.filingStatus === tab.filingStatus;

      const matchSearch =
        !searchText ||
        contract.templateName.includes(searchText) ||
        (contract.companyName?.includes(searchText) ?? false) ||
        (contract.userName?.includes(searchText) ?? false) ||
        contract.id.includes(searchText);

      let matchDate = true;
      if (startDate && contract.createdAt) {
        matchDate = matchDate && new Date(contract.createdAt) >= new Date(startDate);
      }
      if (endDate && contract.createdAt) {
        matchDate = matchDate && new Date(contract.createdAt) <= new Date(endDate + 'T23:59:59');
      }

      return matchTab && matchSearch && matchDate;
    });
  }, [activeTab, searchText, startDate, endDate]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getSignRecords = (contractId: string): SignRecord[] => {
    return mockSignRecords.filter(r => r.contractId === contractId);
  };

  const renderFilingInfo = (contract: Contract) => {
    if (contract.filingStatus === 'filed') {
      return (
        <div className="p-4 bg-green-50/50 rounded-xl border border-green-100">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-gray-900">人社备案成功</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">备案编号</p>
              <p className="font-mono text-gray-900 font-medium">RS-{contract.id.toUpperCase().slice(-8)}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">备案时间</p>
              <p className="font-medium text-gray-900">{contract.filingAt ? formatDateTime(contract.filingAt) : '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">人社系统返回</p>
              <p className="font-medium text-green-700">备案审核通过，数据已同步</p>
            </div>
          </div>
        </div>
      );
    }

    if (contract.filingStatus === 'filing') {
      return (
        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
            <span className="font-semibold text-gray-900">人社备案处理中</span>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-500">备案进度</span>
              <span className="font-medium text-blue-600">60%</span>
            </div>
            <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full w-3/5 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all" />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-500">
              预计完成时间：<span className="font-medium text-gray-900">约 2-3 个工作日</span>
            </p>
            <button className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              刷新状态
            </button>
          </div>
        </div>
      );
    }

    if (contract.filingStatus === 'failed') {
      return (
        <div className="p-4 bg-red-50/50 rounded-xl border border-red-100">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="font-semibold text-gray-900">备案失败</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">错误信息</p>
              <p className="font-medium text-red-700">身份信息核验不通过，请核对乙方身份证号码</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">提交时间</p>
              <p className="font-medium text-gray-900">{contract.filingAt ? formatDateTime(contract.filingAt) : '-'}</p>
            </div>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B35] rounded-xl hover:bg-[#FF6B35]/90 transition-colors flex items-center gap-2 shadow-sm">
            <RefreshCw className="h-4 w-4" />
            重新提交备案
          </button>
        </div>
      );
    }

    return (
      <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
        <p className="text-sm text-gray-500">暂无备案信息，合同签署完成后将自动提交备案</p>
      </div>
    );
  };

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center">
            <Archive className="h-5 w-5 text-[#1E3A5F]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">签约记录</h1>
        </div>
        <p className="text-gray-500 ml-13">管理所有合同记录，查看区块链存证与人社备案状态</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, idx) => (
          <StatCard
            key={idx}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="glass rounded-2xl p-4 mb-6">
        <div className="flex flex-wrap gap-1 p-1 bg-gray-50 rounded-xl mb-4">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-[#1E3A5F] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索合同编号、名称、企业或劳动者..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 focus:border-[#FF6B35]/50 bg-white"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 focus:border-[#FF6B35]/50 bg-white text-sm"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 focus:border-[#FF6B35]/50 bg-white text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">合同编号</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">合同名称</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">甲方(企业)</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">乙方(劳动者)</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">签署日期</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">合同状态</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">备案状态</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredContracts.map(contract => (
                <>
                  <tr
                    key={contract.id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(contract.id)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">{contract.id.toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">{contract.templateName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1E3A5F]/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-3.5 w-3.5 text-[#1E3A5F]" />
                        </div>
                        <span className="text-sm text-gray-700">{contract.companyName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-3.5 w-3.5 text-[#FF6B35]" />
                        </div>
                        <span className="text-sm text-gray-700">{contract.userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{contract.signedAt ? formatDate(contract.signedAt) : '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={contract.status} type="contract" />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={contract.filingStatus} type="filing" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => e.stopPropagation()}
                          className="p-2 text-gray-500 hover:text-[#1E3A5F] hover:bg-[#1E3A5F]/10 rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={e => e.stopPropagation()}
                          className="p-2 text-gray-500 hover:text-[#1E3A5F] hover:bg-[#1E3A5F]/10 rounded-lg transition-colors"
                          title="下载合同"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {contract.filingStatus !== 'not_filed' && (
                          <button
                            onClick={e => e.stopPropagation()}
                            className="p-2 text-gray-500 hover:text-[#FF6B35] hover:bg-[#FF6B35]/10 rounded-lg transition-colors"
                            title="备案详情"
                          >
                            <FileCheck2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {expandedId === contract.id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400 mx-auto" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                  </tr>
                  {expandedId === contract.id && (
                    <tr className="bg-[#1E3A5F]/[0.02]">
                      <td colSpan={9} className="px-6 py-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <Layers className="h-4 w-4 text-[#1E3A5F]" />
                              签约时间线
                            </h4>
                            <div className="relative pl-6 space-y-4">
                              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />
                              <div className="relative">
                                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-[#1E3A5F] flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-[#1E3A5F]" />
                                </div>
                                <p className="text-sm font-medium text-gray-900">合同创建</p>
                                <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(contract.createdAt)}</p>
                              </div>
                              {getSignRecords(contract.id).map((record, idx) => (
                                <div key={record.id} className="relative">
                                  <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 flex items-center justify-center ${
                                    record.signerRole === 'employer' ? 'border-[#1E3A5F]' : 'border-[#FF6B35]'
                                  }`}>
                                    <div className={`w-2 h-2 rounded-full ${
                                      record.signerRole === 'employer' ? 'bg-[#1E3A5F]' : 'bg-[#FF6B35]'
                                    }`} />
                                  </div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {record.signerName} 已签署（{record.signerRole === 'employer' ? '甲方' : '乙方'}）
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(record.signedAt)}</p>
                                </div>
                              ))}
                              {contract.signedAt && (
                                <div className="relative">
                                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-green-500 flex items-center justify-center">
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  </div>
                                  <p className="text-sm font-medium text-gray-900">合同生效</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(contract.signedAt)}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-[#1E3A5F]" />
                                区块链存证信息
                              </h4>
                              <div className="p-4 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-xl border border-blue-100 text-sm space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">区块高度</span>
                                  <span className="font-mono font-medium text-gray-900">#18,742,356</span>
                                </div>
                                <div className="flex justify-between items-start">
                                  <span className="text-gray-500">交易哈希</span>
                                  <span className="font-mono font-medium text-gray-900 text-right ml-4 truncate max-w-[200px]">
                                    0x{contract.id === 'contract-001' ? '1a2b3c4d5e6f7890abcdef12' : '2b3c4d5e6f78901bcdef1234'}...
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">上链时间</span>
                                  <span className="font-medium text-gray-900">
                                    {contract.signedAt ? formatDateTime(contract.signedAt) : '-'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FileCheck2 className="h-4 w-4 text-[#1E3A5F]" />
                                人社备案信息
                              </h4>
                              {renderFilingInfo(contract)}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {filteredContracts.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-1">暂无合同记录</h3>
            <p className="text-sm text-gray-400">请尝试调整筛选条件</p>
          </div>
        )}
      </div>
    </div>
  );
}
