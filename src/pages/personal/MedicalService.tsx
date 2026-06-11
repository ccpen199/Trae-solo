import React, { useState, useMemo } from 'react';
import {
  Search,
  Hospital,
  Pill,
  FileText,
  Wallet,
  TrendingUp,
  Percent,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Filter,
  Building2,
  Eye,
  X,
  Receipt,
  ChevronRight,
  Star,
  ShieldCheck,
  ArrowUpRight,
  Calendar,
  User,
  Clock,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Card from '@/components/ui/Card';
import { mockMedicalRecords, mockHospitals, mockDrugs, mockInsuranceSummaries } from '@/mock/data';
import { formatCurrency, formatDate, getVisitTypeName, getStatusText, getHospitalTypeName, getDesignatedTypeName, getReimbursementScope } from '@/utils/format';
import type { VisitType, Hospital as HospitalType, MedicalRecord, FeeDetailItem } from '@/types';

type TabType = 'records' | 'hospitals' | 'drugs';

const MedicalService: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('records');

  const medicalSummary = mockInsuranceSummaries.find((s) => s.type === 'medical');

  const totalReimbursement = mockMedicalRecords.reduce(
    (sum, r) => sum + r.reimbursementAmount,
    0
  );
  const avgReimbursementRatio =
    mockMedicalRecords.reduce((sum, r) => sum + r.reimbursementRatio, 0) /
    mockMedicalRecords.length;

  const tabs = [
    { key: 'records' as TabType, label: '就医记录', icon: FileText },
    { key: 'hospitals' as TabType, label: '定点医院', icon: Hospital },
    { key: 'drugs' as TabType, label: '药品目录', icon: Pill },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 text-white">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <div className="animate-fade-in-up">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">医保服务</h1>
            <p className="text-white/70 text-sm md:text-base">
              就医记录查询 · 定点医院导航 · 药品目录检索
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-6 mt-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 md:w-5 md:h-5 text-white/80" />
                <span className="text-xs md:text-sm text-white/70">账户余额</span>
              </div>
              <p className="text-xl md:text-2xl font-bold">
                ¥{formatCurrency(medicalSummary?.personalBalance || 0, 0)}
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-white/80" />
                <span className="text-xs md:text-sm text-white/70">本年度报销</span>
              </div>
              <p className="text-xl md:text-2xl font-bold">
                ¥{formatCurrency(totalReimbursement, 0)}
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 md:w-5 md:h-5 text-white/80" />
                <span className="text-xs md:text-sm text-white/70">报销比例</span>
              </div>
              <p className="text-xl md:text-2xl font-bold">
                {avgReimbursementRatio.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-4 relative z-10 pb-8">
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex border-b border-neutral-100">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all relative ${
                  activeTab === tab.key
                    ? 'text-primary-500'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="pt-5">
            {activeTab === 'records' && <MedicalRecordsTab />}
            {activeTab === 'hospitals' && <HospitalsTab />}
            {activeTab === 'drugs' && <DrugsTab />}
          </div>
        </Card>
      </div>
    </div>
  );
};

const MedicalRecordsTab: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<VisitType | 'all'>('all');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  const filteredRecords = useMemo(() => {
    return mockMedicalRecords.filter((record) => {
      const matchSearch = record.hospitalName
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const matchType = filterType === 'all' || record.visitType === filterType;
      return matchSearch && matchType;
    });
  }, [searchText, filterType]);

  const typeFilters = [
    { key: 'all' as const, label: '全部' },
    { key: 'outpatient' as const, label: '门诊' },
    { key: 'inpatient' as const, label: '住院' },
    { key: 'pharmacy' as const, label: '药店购药' },
  ];

  const totalAmount = filteredRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const reimbursementAmount = filteredRecords.reduce(
    (sum, r) => sum + r.reimbursementAmount,
    0
  );
  const personalPayment = filteredRecords.reduce(
    (sum, r) => sum + r.personalPayment,
    0
  );

  const pieData = [
    { name: '报销金额', value: reimbursementAmount, color: '#165DFF' },
    { name: '个人支付', value: personalPayment, color: '#86909C' },
  ];

  const categoryColors: Record<string, string> = {
    诊疗费: '#165DFF',
    检查费: '#0FC6C2',
    化验费: '#722ED1',
    西药费: '#FF7D00',
    中成药: '#14C9C9',
    床位费: '#F7BA1E',
    护理费: '#F53F3F',
    麻醉费: '#86909C',
    手术费: '#165DFF',
    卫生材料: '#FF7D00',
    其他: '#86909C',
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
          <input
            type="text"
            placeholder="搜索医院名称、诊断或科室..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="input-base pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
          <div className="flex gap-1">
            {typeFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setFilterType(filter.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterType === filter.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-5">
        <div className="md:col-span-2 space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无就医记录</p>
            </div>
          ) : (
            filteredRecords.map((record, index) => (
              <div
                key={record.id}
                className="p-4 bg-neutral-50 rounded-xl hover:bg-primary-50/50 transition-colors animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-500">
                      <Hospital className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-600">
                        {record.hospitalName}
                      </h3>
                      <p className="text-xs text-neutral-400">
                        {record.hospitalLevel} · {record.department}
                        {record.doctorName ? ` · ${record.doctorName}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-500">
                    {getVisitTypeName(record.visitType)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-neutral-400 mb-0.5">费用总额</p>
                    <p className="text-sm font-semibold text-neutral-600">
                      ¥{formatCurrency(record.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 mb-0.5">报销金额</p>
                    <p className="text-sm font-semibold text-success-500">
                      ¥{formatCurrency(record.reimbursementAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 mb-0.5">个人支付</p>
                    <p className="text-sm font-semibold text-warning-500">
                      ¥{formatCurrency(record.personalPayment)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-200/50">
                  <div className="flex items-center gap-4 text-xs text-neutral-400">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(record.visitDate)}
                    </span>
                    <span>诊断：{record.diagnosis}</span>
                  </div>
                  <button
                    onClick={() => setSelectedRecord(record)}
                    className="inline-flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    查看费用明细
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-neutral-50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-neutral-600 mb-4">费用构成</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `¥${formatCurrency(value)}`}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary-500" />
                <span className="text-neutral-500">报销金额</span>
              </div>
              <span className="font-medium text-neutral-600">
                ¥{formatCurrency(reimbursementAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-neutral-300" />
                <span className="text-neutral-500">个人支付</span>
              </div>
              <span className="font-medium text-neutral-600">
                ¥{formatCurrency(personalPayment)}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-200/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">总费用</span>
              <span className="text-lg font-bold text-neutral-600">
                ¥{formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-bold">医疗费用明细单</h3>
                  <p className="text-xs text-white/70">
                    {selectedRecord.hospitalName} · {formatDate(selectedRecord.visitDate)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-400 mb-1">就医类型</p>
                  <p className="text-sm font-semibold text-neutral-700">
                    {getVisitTypeName(selectedRecord.visitType)}
                  </p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-400 mb-1">就诊科室</p>
                  <p className="text-sm font-semibold text-neutral-700">
                    {selectedRecord.department}
                  </p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-400 mb-1">诊断</p>
                  <p className="text-sm font-semibold text-neutral-700 truncate">
                    {selectedRecord.diagnosis}
                  </p>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-400 mb-1">报销比例</p>
                  <p className="text-sm font-semibold text-success-600">
                    {selectedRecord.reimbursementRatio.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl mb-4 border border-primary-100">
                <div>
                  <p className="text-xs text-neutral-500 mb-0.5">费用总额</p>
                  <p className="text-2xl font-bold text-neutral-700">
                    ¥{formatCurrency(selectedRecord.totalAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-success-600 mb-0.5">医保报销</p>
                  <p className="text-xl font-bold text-success-600">
                    ¥{formatCurrency(selectedRecord.reimbursementAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-warning-600 mb-0.5">个人自付</p>
                  <p className="text-xl font-bold text-warning-600">
                    ¥{formatCurrency(selectedRecord.personalPayment)}
                  </p>
                </div>
              </div>

              {selectedRecord.feeDetails && selectedRecord.feeDetails.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-neutral-700 inline-flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-primary-500" />
                      费用明细（共 {selectedRecord.feeDetails.length} 项）
                    </h4>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-neutral-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-neutral-50">
                          <th className="px-3 py-2.5 text-left text-xs font-medium text-neutral-400">
                            项目名称
                          </th>
                          <th className="px-3 py-2.5 text-left text-xs font-medium text-neutral-400">
                            类别
                          </th>
                          <th className="px-3 py-2.5 text-right text-xs font-medium text-neutral-400">
                            单价
                          </th>
                          <th className="px-3 py-2.5 text-right text-xs font-medium text-neutral-400">
                            数量
                          </th>
                          <th className="px-3 py-2.5 text-right text-xs font-medium text-neutral-400">
                            小计
                          </th>
                          <th className="px-3 py-2.5 text-right text-xs font-medium text-neutral-400">
                            医保报销
                          </th>
                          <th className="px-3 py-2.5 text-right text-xs font-medium text-neutral-400">
                            个人自付
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-50">
                        {selectedRecord.feeDetails.map((item, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50/60">
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="text-neutral-700">{item.name}</span>
                                {!item.isReimbursable && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded">
                                    全自费
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <span
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${
                                    categoryColors[item.category] || '#86909C'
                                  }15`,
                                  color: categoryColors[item.category] || '#86909C',
                                }}
                              >
                                {item.category}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right text-neutral-600">
                              ¥{formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-3 py-2.5 text-right text-neutral-600">
                              {item.qty}
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium text-neutral-700">
                              ¥{formatCurrency(item.totalAmount)}
                            </td>
                            <td className="px-3 py-2.5 text-right text-success-600">
                              ¥{formatCurrency(item.reimbursement)}
                            </td>
                            <td className="px-3 py-2.5 text-right text-warning-600 font-medium">
                              ¥{formatCurrency(item.personal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 grid md:grid-cols-2 gap-3">
                    <div className="p-4 bg-success-50 rounded-xl border border-success-100">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-success-500" />
                        <h5 className="text-sm font-semibold text-success-700">
                          医保报销构成
                        </h5>
                      </div>
                      <p className="text-xs text-success-600/70 mb-2">
                        可报销项目由医保统筹基金按比例支付
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-success-700">
                          统筹基金支付
                        </span>
                        <span className="text-lg font-bold text-success-600">
                          ¥{formatCurrency(selectedRecord.reimbursementAmount)}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 bg-warning-50 rounded-xl border border-warning-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-4 h-4 text-warning-500" />
                        <h5 className="text-sm font-semibold text-warning-700">
                          个人自付构成
                        </h5>
                      </div>
                      <p className="text-xs text-warning-600/70 mb-2">
                        起付线以下、报销比例外及全自费项目由个人承担
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-warning-700">个人账户+现金</span>
                        <span className="text-lg font-bold text-warning-600">
                          ¥{formatCurrency(selectedRecord.personalPayment)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-neutral-400">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>该记录暂无可追溯的费用明细</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const HospitalsTab: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedHospitalId, setExpandedHospitalId] = useState<string | null>(null);

  const levels = ['all', '三级甲等', '三级', '二级', '一级'];
  const typeOptions = [
    { value: 'all', label: '全部类型' },
    { value: 'general', label: '综合医院' },
    { value: 'specialized', label: '专科医院' },
    { value: 'community', label: '社区卫生服务中心' },
  ];

  const filteredHospitals = useMemo(() => {
    return mockHospitals.filter((hospital) => {
      const matchSearch =
        hospital.name.toLowerCase().includes(searchText.toLowerCase()) ||
        hospital.address.toLowerCase().includes(searchText.toLowerCase());
      const matchLevel =
        levelFilter === 'all' || hospital.level.includes(levelFilter.replace('级', ''));
      const matchType = typeFilter === 'all' || hospital.type === typeFilter;
      return matchSearch && matchLevel && matchType;
    });
  }, [searchText, levelFilter, typeFilter]);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
          <input
            type="text"
            placeholder="搜索医院名称、地址..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="input-base pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-neutral-400" />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="input-base w-auto text-sm"
          >
            {levels.map((level) => (
              <option key={level} value={level}>
                {level === 'all' ? '全部等级' : level}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-base w-auto text-sm"
          >
            {typeOptions.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filteredHospitals.length === 0 ? (
          <div className="col-span-full py-12 text-center text-neutral-400">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无符合条件的医院</p>
          </div>
        ) : (
          filteredHospitals.map((hospital, index) => {
            const isExpanded = expandedHospitalId === hospital.id;
            const typeName = getHospitalTypeName(hospital.type);
            const designatedType =
              hospital.designatedType || getDesignatedTypeName(hospital.isDesignated, hospital.type);
            const reimbursementScope =
              hospital.reimbursementScope || getReimbursementScope(hospital.level, hospital.type);

            return (
              <div
                key={hospital.id}
                className="bg-neutral-50 rounded-xl overflow-hidden hover:shadow-md transition-all animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div
                  className="p-4 cursor-pointer hover:bg-primary-50/50 transition-colors"
                  onClick={() =>
                    setExpandedHospitalId(isExpanded ? null : hospital.id)
                  }
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white flex-shrink-0">
                      <Hospital className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-neutral-600 truncate">
                          {hospital.name}
                        </h3>
                        {hospital.isDesignated ? (
                          <span className="flex items-center gap-0.5 text-xs text-success-500 bg-success-500/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            医保定点
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" />
                            非定点
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-500 rounded font-medium">
                          {hospital.level}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            hospital.type === 'community'
                              ? 'bg-emerald-50 text-emerald-600'
                              : hospital.type === 'specialized'
                              ? 'bg-violet-50 text-violet-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {typeName}
                        </span>
                        <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
                          {designatedType}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{hospital.address}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{hospital.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-primary-500" />
                          <span className="text-primary-600 font-medium">
                            报销范围：{reimbursementScope}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {hospital.distance !== undefined && (
                        <>
                          <p className="text-lg font-bold text-primary-500">
                            {hospital.distance}
                          </p>
                          <p className="text-xs text-neutral-400">公里</p>
                        </>
                      )}
                      <div
                        className={`text-primary-500 mt-1 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && hospital.departments && hospital.departments.length > 0 && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="p-3 bg-white rounded-lg border border-primary-50">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Star className="w-3.5 h-3.5 text-warning-500" />
                        <h4 className="text-xs font-semibold text-neutral-600">
                          重点科室
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {hospital.departments.map((dept) => (
                          <span
                            key={dept}
                            className="text-[11px] px-2 py-1 bg-neutral-100 text-neutral-600 rounded hover:bg-primary-50 hover:text-primary-500 transition-colors cursor-default"
                          >
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const DrugsTab: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = useMemo(() => {
    const cats = new Set(mockDrugs.map((d) => d.category));
    return ['all', ...Array.from(cats)];
  }, []);

  const filteredDrugs = useMemo(() => {
    return mockDrugs.filter((drug) => {
      const matchSearch = drug.name.toLowerCase().includes(searchText.toLowerCase());
      const matchCategory =
        categoryFilter === 'all' || drug.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [searchText, categoryFilter]);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
          <input
            type="text"
            placeholder="搜索药品名称..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="input-base pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-base w-auto text-sm"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? '全部分类' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredDrugs.length === 0 ? (
          <div className="py-12 text-center text-neutral-400">
            <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无符合条件的药品</p>
          </div>
        ) : (
          filteredDrugs.map((drug, index) => (
            <div
              key={drug.id}
              className="p-4 bg-neutral-50 rounded-xl hover:bg-primary-50/50 transition-colors cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      drug.isReimbursable
                        ? 'bg-success-100 text-success-500'
                        : 'bg-neutral-200 text-neutral-400'
                    }`}
                  >
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-neutral-600">{drug.name}</h3>
                      {drug.isReimbursable ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-success-500/10 text-success-500">
                          医保报销
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-400">
                          自费
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mb-1">
                      规格：{drug.spec}
                    </p>
                    <p className="text-xs text-neutral-400">
                      生产厂家：{drug.manufacturer}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-500">
                    ¥{formatCurrency(drug.price)}
                  </p>
                  <p className="text-xs text-neutral-400">/ {drug.unit}</p>
                  {drug.isReimbursable && (
                    <p className="text-xs text-success-500 mt-1">
                      报销比例 {drug.reimbursementRatio}%
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MedicalService;
