import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Users,
  CalendarClock,
  FileSignature,
  ShieldCheck,
  Hash,
  Search,
  Filter,
  ChevronDown,
  Eye,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  User,
  Briefcase,
  DollarSign,
  Calendar,
  FileCheck,
  LayoutList,
  Layers,
  Zap,
  Blocks,
  Lock,
  Copy,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { mockLaborContracts, mockEmployees } from '@/mock/data';
import {
  formatCurrency,
  formatDate,
  formatIdCard,
  getContractTypeName,
  getStatusText,
  getStatusColor,
} from '@/utils/format';


type ContractType = 'fixed_term' | 'open_ended' | 'project_based';
type ContractStatus = 'pending_sign' | 'signed' | 'expired' | 'terminated';

interface ContractTemplate {
  id: string;
  name: string;
  scenario: string;
  version: string;
  updateTime: string;
  description: string;
}

const contractTemplates: ContractTemplate[] = [
  {
    id: 'TPL001',
    name: '标准劳动合同模板',
    scenario: '适用于全职员工标准用工',
    version: 'V3.2.1',
    updateTime: '2025-05-15',
    description: '包含完整劳动合同条款，适用于大多数岗位',
  },
  {
    id: 'TPL002',
    name: '无固定期限劳动合同',
    scenario: '适用于资深员工长期聘用',
    version: 'V2.1.0',
    updateTime: '2025-04-20',
    description: '无固定期限劳动合同，满足连续签订条件员工使用',
  },
  {
    id: 'TPL003',
    name: '项目制劳动合同',
    scenario: '适用于项目制临时用工',
    version: 'V1.5.2',
    updateTime: '2025-03-10',
    description: '以完成一定工作任务为期限的劳动合同模板',
  },
  {
    id: 'TPL004',
    name: '试用期劳动合同',
    scenario: '适用于新员工试用期',
    version: 'V2.0.1',
    updateTime: '2025-02-28',
    description: '包含试用期约定及转正考核标准的劳动合同',
  },
];

const contractTypeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'fixed_term', label: '固定期限' },
  { value: 'open_ended', label: '无固定期限' },
  { value: 'project_based', label: '以完成一定工作任务为期限' },
];

const contractStatusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending_sign', label: '待签署' },
  { value: 'signed', label: '已签署' },
  { value: 'expired', label: '已到期' },
  { value: 'terminated', label: '已终止' },
];

const BlockchainHash: React.FC<{ hash: string; showFull?: boolean }> = ({ hash, showFull = false }) => {
  const displayHash = showFull ? hash : hash.slice(0, 10) + '...' + hash.slice(-8);

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs text-neutral-400">
      <Blocks className="w-3 h-3 text-purple-400" />
      <span className="bg-purple-50 px-1.5 py-0.5 rounded text-purple-500">
        {displayHash}
      </span>
    </div>
  );
};

const OverviewCards: React.FC = () => {
  const totalCount = mockLaborContracts.length;
  const validCount = mockLaborContracts.filter((c) => c.status === 'signed').length;
  const expiringSoonCount = mockLaborContracts.filter((c) => {
    if (!c.endDate) return false;
    const daysLeft = Math.ceil(
      (new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysLeft > 0 && daysLeft <= 90;
  }).length;
  const thisMonthNewCount = mockLaborContracts.filter((c) => {
    const createDate = new Date(c.createTime);
    const now = new Date();
    return (
      createDate.getFullYear() === now.getFullYear() &&
      createDate.getMonth() === now.getMonth()
    );
  }).length;

  const overviewData = [
    {
      label: '合同总数',
      value: totalCount,
      icon: <FileText className="w-5 h-5" />,
      gradient: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: '在效合同数',
      value: validCount,
      icon: <CheckCircle2 className="w-5 h-5" />,
      gradient: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      label: '即将到期数',
      value: expiringSoonCount,
      icon: <CalendarClock className="w-5 h-5" />,
      gradient: 'from-orange-500 to-amber-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      label: '本月新签数',
      value: thisMonthNewCount,
      icon: <FileSignature className="w-5 h-5" />,
      gradient: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
      {overviewData.map((item, index) => (
        <Card
          key={item.label}
          className="animate-fade-in-up overflow-hidden"
          style={{ animationDelay: `${index * 0.08}s` }}
        >
          <div className={`h-1 bg-gradient-to-r ${item.gradient}`} />
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-neutral-500">{item.label}</span>
              <div
                className={`w-9 h-9 rounded-lg ${item.bgColor} ${item.textColor} flex items-center justify-center`}
              >
                {item.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-neutral-700">{item.value}</p>
            <div className="mt-2 flex items-center gap-1 text-xs text-neutral-400">
              <ShieldCheck className="w-3 h-3 text-success-500" />
              <span>区块链存证</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const QuickActions: React.FC<{ onTabChange: (tab: string) => void }> = ({
  onTabChange,
}) => {
  const actions = [
    {
      icon: <Plus className="w-6 h-6" />,
      label: '新建合同',
      color: 'text-primary-500',
      bgColor: 'bg-primary-50',
      tab: 'create',
    },
    {
      icon: <Users className="w-6 h-6" />,
      label: '批量签署',
      color: 'text-violet-500',
      bgColor: 'bg-violet-50',
      tab: 'list',
    },
    {
      icon: <Layers className="w-6 h-6" />,
      label: '合同模板',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-50',
      tab: 'templates',
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      label: '存证验证',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      tab: 'list',
    },
  ];

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
      <Card padding="lg">
        <div className="grid grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <button
              key={action.label}
              onClick={() => onTabChange(action.tab)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-neutral-50 transition-all duration-200 group"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div
                className={`w-12 h-12 rounded-xl ${action.bgColor} ${action.color} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}
              >
                {action.icon}
              </div>
              <span className="text-xs text-neutral-600 font-medium">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};

const ContractListTab: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const filteredContracts = useMemo(() => {
    return mockLaborContracts.filter((contract) => {
      const matchSearch =
        contract.employeeName.includes(searchText) ||
        contract.contractNo.includes(searchText);
      const matchType =
        selectedType === 'all' || contract.contractType === selectedType;
      const matchStatus =
        selectedStatus === 'all' || contract.status === selectedStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [searchText, selectedType, selectedStatus]);

  const getStatusIcon = (status: ContractStatus) => {
    switch (status) {
      case 'signed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'pending_sign':
        return <Clock className="w-4 h-4" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4" />;
      case 'terminated':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
          <input
            type="text"
            placeholder="搜索员工姓名/合同编号"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-lg bg-white placeholder:text-neutral-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowTypeDropdown(!showTypeDropdown);
              setShowStatusDropdown(false);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:border-primary-300 transition-colors"
          >
            <Filter className="w-4 h-4 text-neutral-400" />
            {contractTypeOptions.find((o) => o.value === selectedType)?.label}
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </button>
          {showTypeDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-neutral-200 rounded-lg shadow-dropdown z-10 py-1">
              {contractTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedType(option.value);
                    setShowTypeDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-primary-50 transition-colors ${
                    selectedType === option.value
                      ? 'text-primary-500 bg-primary-50'
                      : 'text-neutral-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowStatusDropdown(!showStatusDropdown);
              setShowTypeDropdown(false);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:border-primary-300 transition-colors"
          >
            <Filter className="w-4 h-4 text-neutral-400" />
            {contractStatusOptions.find((o) => o.value === selectedStatus)?.label}
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </button>
          {showStatusDropdown && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-white border border-neutral-200 rounded-lg shadow-dropdown z-10 py-1">
              {contractStatusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedStatus(option.value);
                    setShowStatusDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-primary-50 transition-colors ${
                    selectedStatus === option.value
                      ? 'text-primary-500 bg-primary-50'
                      : 'text-neutral-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-sm text-neutral-400 ml-auto">
          共 {filteredContracts.length} 条记录
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredContracts.map((contract, index) => (
          <Card
            key={contract.id}
            hover
            className="animate-fade-in-up overflow-hidden"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-violet-500 text-white flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-700 font-mono">
                      {contract.contractNo}
                    </p>
                    <span
                      className={`badge badge-${
                        contract.contractType === 'fixed_term'
                          ? 'primary'
                          : contract.contractType === 'open_ended'
                          ? 'success'
                          : 'warning'
                      } mt-0.5`}
                    >
                      {getContractTypeName(contract.contractType)}
                    </span>
                  </div>
                </div>
                <span
                  className={`badge badge-${getStatusColor(contract.status)} flex items-center gap-1`}
                >
                  {getStatusIcon(contract.status as ContractStatus)}
                  {getStatusText(contract.status)}
                </span>
              </div>

              <div className="space-y-2.5 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-neutral-300" />
                  <span className="text-neutral-500">员工姓名：</span>
                  <span className="text-neutral-700 font-medium">
                    {contract.employeeName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="w-4 h-4 text-neutral-300" />
                  <span className="text-neutral-500">身份证号：</span>
                  <span className="text-neutral-700 font-mono">
                    {formatIdCard(contract.idCard)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-neutral-300" />
                  <span className="text-neutral-500">职位：</span>
                  <span className="text-neutral-700">{contract.position}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-neutral-300" />
                  <span className="text-neutral-500">薪资：</span>
                  <span className="text-neutral-700 font-semibold text-primary-500">
                    ¥{formatCurrency(contract.salary, 0)}/月
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-neutral-300" />
                  <span className="text-neutral-500">合同期限：</span>
                  <span className="text-neutral-700">
                    {formatDate(contract.startDate)} ~{' '}
                    {contract.endDate ? formatDate(contract.endDate) : '无固定期限'}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-3 mb-4 border border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-xs text-purple-600 font-medium">
                      存证哈希
                    </span>
                  </div>
                  {contract.storageHash && (
                    <button className="text-xs text-purple-400 hover:text-purple-600 flex items-center gap-1 transition-colors">
                      <Copy className="w-3 h-3" />
                      复制
                    </button>
                  )}
                </div>
                {contract.storageHash ? (
                  <BlockchainHash hash={contract.storageHash} />
                ) : (
                  <p className="text-xs text-neutral-400 mt-1">暂无存证记录</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" icon={<Eye className="w-4 h-4" />}>
                  查看详情
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Download className="w-4 h-4" />}
                  disabled={contract.status === 'pending_sign'}
                >
                  下载合同
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<ShieldCheck className="w-4 h-4" />}
                  disabled={!contract.storageHash}
                >
                  验证存证
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const CreateContractTab: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('TPL001');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [formData, setFormData] = useState({
    contractType: 'fixed_term' as ContractType,
    startDate: '',
    endDate: '',
    probationMonths: 3,
    salary: 15000,
    position: '',
    department: '',
  });

  const filteredEmployees = useMemo(() => {
    return mockEmployees.filter(
      (emp) =>
        emp.employeeName.includes(employeeSearch) ||
        emp.idCard.includes(employeeSearch)
    );
  }, [employeeSearch]);

  const selectedEmployeeData = mockEmployees.find(
    (e) => e.id === selectedEmployee
  );

  return (
    <div className="animate-fade-in space-y-5">
      <Card padding="lg">
        <h3 className="text-base font-semibold text-neutral-700 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary-500" />
          选择合同模板
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contractTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                selectedTemplate === template.id
                  ? 'border-primary-500 bg-primary-50/50'
                  : 'border-neutral-100 hover:border-primary-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-sm font-semibold text-neutral-700">
                  {template.name}
                </h4>
                <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                  {template.version}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mb-2">{template.scenario}</p>
              <p className="text-xs text-neutral-500 line-clamp-2">
                {template.description}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-neutral-300">
                  更新于 {template.updateTime}
                </span>
                {selectedTemplate === template.id && (
                  <CheckCircle2 className="w-5 h-5 text-primary-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-base font-semibold text-neutral-700 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-500" />
          选择员工
        </h3>
        <div className="relative">
          <button
            onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:border-primary-300 transition-colors"
          >
            {selectedEmployeeData ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 text-white flex items-center justify-center text-sm font-medium">
                  {selectedEmployeeData.employeeName.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="font-medium text-neutral-700">
                    {selectedEmployeeData.employeeName}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {selectedEmployeeData.department} · {selectedEmployeeData.position}
                  </p>
                </div>
              </div>
            ) : (
              <span className="text-neutral-400">请选择员工</span>
            )}
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </button>
          {showEmployeeDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-dropdown z-10 overflow-hidden">
              <div className="p-2 border-b border-neutral-100">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                  <input
                    type="text"
                    placeholder="搜索员工姓名/身份证号"
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white placeholder:text-neutral-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredEmployees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => {
                      setSelectedEmployee(emp.id);
                      setShowEmployeeDropdown(false);
                      setFormData({
                        ...formData,
                        position: emp.position,
                        department: emp.department,
                      });
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors ${
                      selectedEmployee === emp.id
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-neutral-600'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 text-white flex items-center justify-center text-xs font-medium">
                      {emp.employeeName.charAt(0)}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium">{emp.employeeName}</p>
                      <p className="text-xs text-neutral-400">
                        {emp.department} · {emp.position}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-base font-semibold text-neutral-700 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-500" />
          合同信息
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-600 mb-1.5">
              合同类型
            </label>
            <select
              value={formData.contractType}
              onChange={(e) =>
                setFormData({ ...formData, contractType: e.target.value as ContractType })
              }
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white text-neutral-600 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            >
              <option value="fixed_term">固定期限</option>
              <option value="open_ended">无固定期限</option>
              <option value="project_based">以完成一定工作任务为期限</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-1.5">岗位</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="请输入岗位"
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white placeholder:text-neutral-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-1.5">部门</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
              placeholder="请输入部门"
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white placeholder:text-neutral-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-1.5">
              薪资（元/月）
            </label>
            <input
              type="number"
              value={formData.salary}
              onChange={(e) =>
                setFormData({ ...formData, salary: Number(e.target.value) })
              }
              placeholder="请输入薪资"
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white placeholder:text-neutral-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-1.5">
              开始日期
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white text-neutral-600 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          {formData.contractType === 'fixed_term' && (
            <div>
              <label className="block text-sm text-neutral-600 mb-1.5">
                结束日期
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white text-neutral-600 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-neutral-600 mb-1.5">
              试用期（月）
            </label>
            <input
              type="number"
              value={formData.probationMonths}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  probationMonths: Number(e.target.value),
                })
              }
              min="0"
              max="6"
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white placeholder:text-neutral-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-base font-semibold text-neutral-700 mb-4 flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-primary-500" />
          电子签章预览
        </h3>
        <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl p-6 border border-neutral-200">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6 border border-neutral-100">
            <div className="text-center mb-4">
              <FileCheck className="w-10 h-10 text-primary-500 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-neutral-700">
                劳动合同书
              </h4>
              <p className="text-xs text-neutral-400 mt-1">
                编号：LDHT-XXXXXXXX
              </p>
            </div>
            <div className="border-t border-dashed border-neutral-200 pt-4">
              <div className="flex justify-between text-xs text-neutral-500 mb-2">
                <span>甲方（用人单位）</span>
                <span>乙方（劳动者）</span>
              </div>
              <div className="flex justify-between items-end">
                <div className="text-center">
                  <div className="w-16 h-16 border-2 border-red-400 rounded-sm flex items-center justify-center text-red-500 text-xs font-bold rotate-[-10deg]">
                    公章
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    北京智慧科技有限公司
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 border-2 border-blue-400 rounded-full flex items-center justify-center text-blue-500 text-xs font-bold">
                    个人章
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    {selectedEmployeeData?.employeeName || '员工姓名'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-neutral-200">
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
                <span>区块链存证，不可篡改</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline">取消</Button>
        <Button variant="primary" icon={<Zap className="w-4 h-4" />}>
          发起签署
        </Button>
      </div>
    </div>
  );
};

const ContractTemplatesTab: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contractTemplates.map((template, index) => (
          <Card
            key={template.id}
            hover
            className="animate-fade-in-up overflow-hidden"
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            <div className="h-1 bg-gradient-to-r from-primary-500 to-violet-500" />
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-50 to-violet-100 text-primary-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-700">
                      {template.name}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {template.scenario}
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">
                  {template.version}
                </span>
              </div>

              <p className="text-sm text-neutral-500 mb-4 leading-relaxed">
                {template.description}
              </p>

              <div className="flex items-center justify-between text-xs text-neutral-400 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>最近更新：{template.updateTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-success-500" />
                  <span>已备案</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Eye className="w-4 h-4" />}
                >
                  预览模板
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                >
                  使用模板
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const LaborContractPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'templates'>(
    'list'
  );

  const tabs = [
    { key: 'list' as const, label: '合同列表', icon: LayoutList },
    { key: 'create' as const, label: '新建合同', icon: Plus },
    { key: 'templates' as const, label: '合同模板', icon: Layers },
  ];

  const handleTabChange = (tab: string) => {
    if (tab === 'list' || tab === 'create' || tab === 'templates') {
      setActiveTab(tab as 'list' | 'create' | 'templates');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-8">
      <div className="bg-gradient-to-br from-primary-600 via-violet-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <FileSignature className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">劳动关系电子合同存证</h1>
                <p className="text-sm text-white/70">
                  区块链存证 · 可信签署 · 智能管理
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                <Blocks className="w-4 h-4 text-cyan-300" />
                <span className="text-xs">区块链存证</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                <Lock className="w-4 h-4 text-emerald-300" />
                <span className="text-xs">不可篡改</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span className="text-xs">司法认可</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-4 relative z-10 space-y-5">
        <OverviewCards />
        <QuickActions onTabChange={handleTabChange} />

        <Card padding="none">
          <div className="flex border-b border-neutral-100">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all relative ${
                  activeTab === tab.key
                    ? 'text-primary-500'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-primary-500 to-violet-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'list' && <ContractListTab />}
            {activeTab === 'create' && <CreateContractTab />}
            {activeTab === 'templates' && <ContractTemplatesTab />}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LaborContractPage;
