import React, { useState, useMemo, useRef } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  ShieldCheck,
  UserPlus,
  UserMinus,
  FileSearch,
  Receipt,
  Search,
  Filter,
  ChevronDown,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Building,
  Briefcase,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { mockEmployees, mockEnterpriseUser } from '@/mock/data';
import {
  formatCurrency,
  formatDate,
  formatIdCard,
  getStatusText,
  getStatusColor,
  getInsuranceTypeName,
} from '@/utils/format';
import type { EmployeeInsurance, InsuranceType, BatchImportResult } from '@/types';

const quickActions = [
  { key: 'batchAdd', label: '批量增员', icon: UserPlus, color: 'from-blue-500 to-blue-600' },
  { key: 'batchReduce', label: '批量减员', icon: UserMinus, color: 'from-orange-500 to-orange-600' },
  { key: 'declarationQuery', label: '申报查询', icon: FileSearch, color: 'from-cyan-500 to-cyan-600' },
  { key: 'paymentNotice', label: '缴费通知单', icon: Receipt, color: 'from-violet-500 to-violet-600' },
];

const departments = ['全部部门', '技术部', '产品部', '市场部', '人事部', '财务部', '运营部', '设计部'];

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'normal', label: '正常' },
  { value: 'suspended', label: '暂停' },
  { value: 'terminated', label: '终止' },
];

const mockDeclarations = [
  {
    id: 'DEC001',
    batchNo: 'SB202506001',
    type: '月度申报',
    employeeCount: 256,
    amount: 1256800.5,
    declareTime: '2025-06-05 10:30:00',
    status: 'approved',
  },
  {
    id: 'DEC002',
    batchNo: 'SB202505001',
    type: '月度申报',
    employeeCount: 248,
    amount: 1218500.0,
    declareTime: '2025-05-06 14:20:00',
    status: 'approved',
  },
  {
    id: 'DEC003',
    batchNo: 'SB202504001',
    type: '月度申报',
    employeeCount: 245,
    amount: 1198000.8,
    declareTime: '2025-04-07 09:15:00',
    status: 'approved',
  },
  {
    id: 'DEC004',
    batchNo: 'SB202503001',
    type: '月度申报',
    employeeCount: 240,
    amount: 1172000.0,
    declareTime: '2025-03-06 16:45:00',
    status: 'approved',
  },
  {
    id: 'DEC005',
    batchNo: 'SB202502001',
    type: '年度调整',
    employeeCount: 235,
    amount: 1145000.5,
    declareTime: '2025-02-10 11:00:00',
    status: 'reviewing',
  },
];

const mockImportResult: BatchImportResult = {
  successCount: 18,
  failCount: 2,
  totalCount: 20,
  failDetails: [
    { rowIndex: 5, employeeName: '测试员工A', errorMessage: '身份证号格式不正确' },
    { rowIndex: 12, employeeName: '测试员工B', errorMessage: '该员工已在本单位参保' },
  ],
};

const EnterpriseHeader: React.FC = () => {
  const insuredCount = mockEmployees.filter((e) => e.status === 'normal').length;
  const monthlyPayment = mockEmployees
    .filter((e) => e.status === 'normal')
    .reduce((sum, e) => sum + e.paymentBase * 0.28, 0);

  return (
    <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{mockEnterpriseUser.companyName}</h1>
              <p className="text-sm text-white/70 mt-1">
                统一社会信用代码：{mockEnterpriseUser.creditCode}
              </p>
            </div>
            <span className="ml-auto px-3 py-1 bg-success-400/20 text-success-200 rounded-full text-sm font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse" />
              正常参保
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-white/70" />
                <span className="text-sm text-white/70">员工总数</span>
              </div>
              <p className="text-2xl font-bold">{mockEnterpriseUser.employeeCount}</p>
              <p className="text-xs text-white/50 mt-1">人</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-white/70" />
                <span className="text-sm text-white/70">参保人数</span>
              </div>
              <p className="text-2xl font-bold">{insuredCount}</p>
              <p className="text-xs text-white/50 mt-1">人</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-white/70" />
                <span className="text-sm text-white/70">本月应缴金额</span>
              </div>
              <p className="text-2xl font-bold">¥{formatCurrency(monthlyPayment, 0)}</p>
              <p className="text-xs text-white/50 mt-1">元</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-white/70" />
                <span className="text-sm text-white/70">参保状态</span>
              </div>
              <p className="text-2xl font-bold">正常</p>
              <p className="text-xs text-white/50 mt-1">最后申报：2025-06</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickActions: React.FC<{ onAction: (key: string) => void }> = ({ onAction }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-4 relative z-10">
      {quickActions.map((action, index) => (
        <Card
          key={action.key}
          hover
          className="animate-fade-in-up cursor-pointer"
          style={{ animationDelay: `${index * 0.08}s` }}
          onClick={() => onAction(action.key)}
        >
          <div className="flex flex-col items-center py-2">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} text-white flex items-center justify-center shadow-lg mb-3`}
            >
              <action.icon className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-neutral-600">{action.label}</span>
          </div>
        </Card>
      ))}
    </div>
  );
};

const EmployeeListTab: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedDept, setSelectedDept] = useState('全部部门');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredEmployees = useMemo(() => {
    return mockEmployees.filter((employee) => {
      const matchSearch =
        employee.employeeName.includes(searchText) ||
        employee.idCard.includes(searchText);
      const matchDept =
        selectedDept === '全部部门' || employee.department === selectedDept;
      const matchStatus =
        selectedStatus === 'all' || employee.status === selectedStatus;
      return matchSearch && matchDept && matchStatus;
    });
  }, [searchText, selectedDept, selectedStatus]);

  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const renderInsuranceTags = (types: InsuranceType[]) => {
    const displayTypes = types.slice(0, 2);
    const hasMore = types.length > 2;
    return (
      <div className="flex flex-wrap gap-1">
        {displayTypes.map((type) => (
          <span
            key={type}
            className="inline-flex items-center px-1.5 py-0.5 text-xs rounded bg-primary-50 text-primary-500"
          >
            {getInsuranceTypeName(type)}
          </span>
        ))}
        {hasMore && (
          <span className="inline-flex items-center px-1.5 py-0.5 text-xs rounded bg-neutral-100 text-neutral-400">
            +{types.length - 2}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="搜索姓名/身份证号"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-neutral-200 rounded-lg placeholder:text-neutral-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowDeptDropdown(!showDeptDropdown);
              setShowStatusDropdown(false);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:border-primary-300 transition-colors"
          >
            <Building className="w-4 h-4 text-neutral-400" />
            {selectedDept}
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </button>
          {showDeptDropdown && (
            <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-neutral-200 rounded-lg shadow-dropdown z-10 py-1">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => {
                    setSelectedDept(dept);
                    setShowDeptDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-primary-50 transition-colors ${
                    selectedDept === dept
                      ? 'text-primary-500 bg-primary-50'
                      : 'text-neutral-600'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowStatusDropdown(!showStatusDropdown);
              setShowDeptDropdown(false);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:border-primary-300 transition-colors"
          >
            <Filter className="w-4 h-4 text-neutral-400" />
            {statusOptions.find((o) => o.value === selectedStatus)?.label}
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </button>
          {showStatusDropdown && (
            <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-neutral-200 rounded-lg shadow-dropdown z-10 py-1">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedStatus(option.value);
                    setShowStatusDropdown(false);
                    setCurrentPage(1);
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
          共 {filteredEmployees.length} 条记录
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider rounded-l-lg">
                姓名
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                身份证号
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                部门
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                职位
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                参保险种
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                缴费基数
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                参保日期
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                状态
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider rounded-r-lg">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {paginatedEmployees.map((employee) => (
              <tr
                key={employee.id}
                className="hover:bg-neutral-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 text-white flex items-center justify-center text-xs font-medium">
                      {employee.employeeName.charAt(0)}
                    </div>
                    <span className="text-sm text-neutral-700 font-medium">
                      {employee.employeeName}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500">
                  {formatIdCard(employee.idCard)}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-neutral-300" />
                    {employee.department}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600">
                  {employee.position}
                </td>
                <td className="px-4 py-3">
                  {renderInsuranceTags(employee.insuranceTypes)}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600">
                  ¥{formatCurrency(employee.paymentBase, 0)}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500">
                  {formatDate(employee.startDate)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`badge badge-${getStatusColor(employee.status)}`}
                  >
                    {getStatusText(employee.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
                      <UserPlus className="w-3.5 h-3.5" />
                      增减员
                    </button>
                    <button className="text-xs text-neutral-400 hover:text-primary-500 font-medium flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      明细
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-neutral-400">
          显示 {(currentPage - 1) * pageSize + 1}-
          {Math.min(currentPage * pageSize, filteredEmployees.length)} 条，共{' '}
          {filteredEmployees.length} 条
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-neutral-200 text-neutral-400 hover:text-primary-500 hover:border-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === pageNum
                    ? 'bg-primary-500 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-neutral-200 text-neutral-400 hover:text-primary-500 hover:border-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const BatchImportTab: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const handleUpload = () => {
    if (!uploadedFile) return;
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setShowResult(true);
    }, 1500);
  };

  const handleSubmit = () => {
    alert('确认提交成功！');
    setShowResult(false);
    setUploadedFile(null);
  };

  const handleDownloadTemplate = () => {
    alert('模板下载中...');
  };

  return (
    <div className="animate-fade-in space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-neutral-700">
              批量增员导入
            </h3>
            <p className="text-sm text-neutral-400 mt-1">
              下载模板填写后上传，支持 Excel 格式文件
            </p>
          </div>
          <Button
            variant="outline"
            icon={<Download className="w-4 h-4" />}
            onClick={handleDownloadTemplate}
          >
            下载模板
          </Button>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
            isDragging
              ? 'border-primary-400 bg-primary-50'
              : 'border-neutral-200 hover:border-primary-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
          {uploadedFile ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-xl bg-success-50 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-8 h-8 text-success-500" />
              </div>
              <p className="text-sm font-medium text-neutral-700 mb-1">
                {uploadedFile.name}
              </p>
              <p className="text-xs text-neutral-400 mb-4">
                {(uploadedFile.size / 1024).toFixed(2)} KB
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  loading={isUploading}
                  icon={<Upload className="w-4 h-4" />}
                  onClick={handleUpload}
                >
                  {isUploading ? '上传中...' : '开始上传'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setUploadedFile(null)}
                >
                  重新选择
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-xl bg-neutral-50 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-neutral-300" />
              </div>
              <p className="text-sm text-neutral-600 mb-2">
                拖拽文件到此处，或
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary-500 hover:text-primary-600 font-medium ml-1"
                >
                  点击选择文件
                </button>
              </p>
              <p className="text-xs text-neutral-400">
                支持 .xlsx, .xls 格式，文件大小不超过 10MB
              </p>
            </div>
          )}
        </div>
      </Card>

      {showResult && (
        <Card className="animate-fade-in-up">
          <h3 className="text-base font-semibold text-neutral-700 mb-4">
            导入结果
          </h3>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-neutral-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-neutral-700">
                {mockImportResult.totalCount}
              </p>
              <p className="text-sm text-neutral-400 mt-1">总记录数</p>
            </div>
            <div className="bg-success-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-success-500">
                {mockImportResult.successCount}
              </p>
              <p className="text-sm text-success-400 mt-1">成功</p>
            </div>
            <div className="bg-danger-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-danger-500">
                {mockImportResult.failCount}
              </p>
              <p className="text-sm text-danger-400 mt-1">失败</p>
            </div>
          </div>

          {mockImportResult.failDetails.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-neutral-600 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-danger-500" />
                失败原因列表
              </h4>
              <div className="bg-neutral-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                {mockImportResult.failDetails.map((detail, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 py-2 border-b border-neutral-100 last:border-0"
                  >
                    <XCircle className="w-4 h-4 text-danger-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm text-neutral-700">
                        第 {detail.rowIndex} 行 - {detail.employeeName}
                      </span>
                      <p className="text-xs text-danger-500 mt-0.5">
                        {detail.errorMessage}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowResult(false)}>
              取消
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              确认提交
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

const DeclarationRecordTab: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-neutral-400">
          共 {mockDeclarations.length} 条记录
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider rounded-l-lg">
                申报批次号
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                申报类型
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                申报人数
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                申报金额
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                申报时间
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                审核状态
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider rounded-r-lg">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {mockDeclarations.map((record) => (
              <tr
                key={record.id}
                className="hover:bg-neutral-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-primary-500">
                    {record.batchNo}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600">
                  {record.type}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600">
                  {record.employeeCount} 人
                </td>
                <td className="px-4 py-3 text-sm text-neutral-700 font-medium">
                  ¥{formatCurrency(record.amount, 2)}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-neutral-300" />
                    {record.declareTime}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`badge badge-${getStatusColor(record.status)}`}
                  >
                    {getStatusText(record.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    查看详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const EnterpriseInsurance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'employees' | 'batchImport' | 'declarations'
  >('employees');

  const tabs = [
    { key: 'employees' as const, label: '员工参保列表', icon: Users },
    { key: 'batchImport' as const, label: '批量增员', icon: UserPlus },
    { key: 'declarations' as const, label: '申报记录', icon: FileText },
  ];

  const handleQuickAction = (key: string) => {
    switch (key) {
      case 'batchAdd':
        setActiveTab('batchImport');
        break;
      case 'batchReduce':
        alert('批量减员功能开发中...');
        break;
      case 'declarationQuery':
        setActiveTab('declarations');
        break;
      case 'paymentNotice':
        alert('缴费通知单功能开发中...');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-8">
      <EnterpriseHeader />

      <div className="container mx-auto px-4">
        <QuickActions onAction={handleQuickAction} />

        <Card padding="none" className="mt-6">
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
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'employees' && <EmployeeListTab />}
            {activeTab === 'batchImport' && <BatchImportTab />}
            {activeTab === 'declarations' && <DeclarationRecordTab />}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EnterpriseInsurance;
