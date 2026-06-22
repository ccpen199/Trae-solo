import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  ChevronDown,
  ChevronRight,
  Pill,
  Stethoscope,
  Receipt,
  Building2,
  Search,
  Filter,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { medicalApi } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/format';
import type { MedicalRecord } from '@shared/types';

const highlightKeywords = ['高血压', '糖尿病', '冠心病', '肺炎', '胃炎', '支气管炎', '关节炎', '过敏'];

function MedicalRecordsPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => currentYear - i);
  }, [currentYear]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await medicalApi.getRecords({
          page: 1,
          pageSize: 100,
          year: selectedYear === 'all' ? undefined : selectedYear,
        });
        setRecords(res.data.list);
      } catch (error) {
        console.error('Failed to fetch medical records:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  const groupedRecords = useMemo(() => {
    const filtered = records.filter((record) => {
      if (!searchKeyword) return true;
      const keyword = searchKeyword.toLowerCase();
      return (
        record.hospital.toLowerCase().includes(keyword) ||
        record.department.toLowerCase().includes(keyword) ||
        record.diagnosis.some((d) => d.toLowerCase().includes(keyword)) ||
        record.prescriptions.some((p) => p.drugName.toLowerCase().includes(keyword))
      );
    });

    const groups: Record<string, MedicalRecord[]> = {};
    filtered.forEach((record) => {
      const year = new Date(record.visitDate).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(record);
    });
    return Object.entries(groups).sort((a, b) => Number(b[0]) - Number(a[0]));
  }, [records, searchKeyword]);

  const costChartOption = useMemo(() => {
    if (records.length === 0) return {};

    let totalOverall = 0;
    let totalAccount = 0;
    let totalSelf = 0;

    records.forEach((record) => {
      totalOverall += record.cost.overallPay;
      totalAccount += record.cost.accountPay;
      totalSelf += record.cost.selfPay;
    });

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ¥{c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        itemGap: 12,
        textStyle: { color: '#64748b', fontSize: 12 },
      },
      series: [
        {
          type: 'pie',
          radius: ['55%', '80%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          data: [
            {
              value: totalOverall,
              name: '统筹支付',
              itemStyle: { color: '#1677FF' },
            },
            {
              value: totalAccount,
              name: '账户支付',
              itemStyle: { color: '#00B42A' },
            },
            {
              value: totalSelf,
              name: '现金支付',
              itemStyle: { color: '#FF7D00' },
            },
          ],
        },
      ],
    };
  }, [records]);

  const getDiagnosisHighlight = (diagnosis: string) => {
    let result = diagnosis;
    highlightKeywords.forEach((keyword) => {
      if (diagnosis.includes(keyword)) {
        result = result.replace(
          keyword,
          `<span class="bg-warning-500/15 text-warning-600 px-1 rounded font-medium">${keyword}</span>`
        );
      }
    });
    return result;
  };

  const getInsuranceTagColor = (coverage: string) => {
    if (coverage === '甲类') return 'badge-success';
    if (coverage === '乙类') return 'badge-warning';
    return 'badge';
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="skeleton h-32 rounded-2xl" />
            <div className="skeleton h-14 rounded-xl" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-40 rounded-xl" />
            ))}
          </div>
          <div className="space-y-6">
            <div className="skeleton h-72 rounded-2xl" />
            <div className="skeleton h-56 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">就诊记录</h1>
        <p className="text-slate-500 mt-1">查看您近3年的门诊和住院就诊记录</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">就诊次数</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">{records.length}</p>
                <p className="text-xs text-slate-400 mt-1">近3年累计</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">总费用</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">
                  {formatCurrency(records.reduce((sum, r) => sum + r.cost.total, 0))}
                </p>
                <p className="text-xs text-slate-400 mt-1">医疗总费用</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">统筹支付</p>
                <p className="text-2xl font-bold text-insurance-600 font-mono">
                  {formatCurrency(records.reduce((sum, r) => sum + r.cost.overallPay, 0))}
                </p>
                <p className="text-xs text-slate-400 mt-1">医保报销金额</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">个人负担</p>
                <p className="text-2xl font-bold text-warning-600 font-mono">
                  {formatCurrency(
                    records.reduce((sum, r) => sum + r.cost.accountPay + r.cost.selfPay, 0)
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-1">账户+现金支付</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedYear('all')}
                  className={`tab-item ${selectedYear === 'all' ? 'tab-item-active' : ''}`}
                >
                  全部
                </button>
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`tab-item ${selectedYear === year ? 'tab-item-active' : ''}`}
                  >
                    {year}年
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="搜索医院、诊断、药品..."
                    className="input-field pl-9 pr-4 py-2 text-sm w-56"
                  />
                </div>
                <button className="btn-secondary py-2 px-4 text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  筛选
                </button>
              </div>
            </div>

            {groupedRecords.length > 0 ? (
              <div className="space-y-8">
                {groupedRecords.map(([year, yearRecords]) => (
                  <div key={year}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-insurance-100 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-insurance-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{year}年</h3>
                        <p className="text-sm text-slate-500">
                          共 {yearRecords.length} 次就诊，总费用{' '}
                          {formatCurrency(yearRecords.reduce((sum, r) => sum + r.cost.total, 0))}
                        </p>
                      </div>
                    </div>

                    <div className="relative pl-8">
                      <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-slate-200" />

                      <div className="space-y-4">
                        {yearRecords.map((record) => (
                          <div key={record.id} className="relative">
                            <div className="absolute -left-8 top-6 w-2 h-2 rounded-full bg-insurance-500 border-4 border-white shadow-sm" />

                            <div className="card overflow-hidden">
                              <button
                                onClick={() =>
                                  setExpandedId(expandedId === record.id ? null : record.id)
                                }
                                className="w-full p-5 flex items-start gap-4 bg-white hover:bg-slate-50 transition-colors text-left"
                              >
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                      <h4 className="font-semibold text-slate-900">
                                        {record.hospital}
                                      </h4>
                                      <span className="badge-info">{record.department}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg font-bold text-slate-900 font-mono">
                                        {formatCurrency(record.cost.total)}
                                      </span>
                                      <ChevronDown
                                        className={`w-5 h-5 text-slate-400 transition-transform ${
                                          expandedId === record.id ? 'rotate-180' : ''
                                        }`}
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      {formatDate(record.visitDate)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Stethoscope className="w-4 h-4" />
                                      {record.doctor}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Pill className="w-4 h-4" />
                                      {record.prescriptions.length} 种药品
                                    </span>
                                    {record.examinations.length > 0 && (
                                      <span className="flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {record.examinations.length} 项检查
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm text-slate-500">诊断：</span>
                                    {record.diagnosis.map((d, idx) => (
                                      <span
                                        key={idx}
                                        className="text-sm"
                                        dangerouslySetInnerHTML={{
                                          __html: getDiagnosisHighlight(d),
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </button>

                              {expandedId === record.id && (
                                <div className="border-t border-slate-100 bg-slate-50">
                                  <div className="p-5 space-y-5">
                                    <div>
                                      <h5 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                                        <Receipt className="w-4 h-4 text-insurance-500" />
                                        费用构成
                                      </h5>
                                      <div className="grid grid-cols-4 gap-4">
                                        <div className="bg-white rounded-lg p-3 text-center">
                                          <p className="text-xs text-slate-500 mb-1">总费用</p>
                                          <p className="text-base font-semibold text-slate-900 font-mono">
                                            {formatCurrency(record.cost.total)}
                                          </p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 text-center">
                                          <p className="text-xs text-slate-500 mb-1">统筹支付</p>
                                          <p className="text-base font-semibold text-insurance-600 font-mono">
                                            {formatCurrency(record.cost.overallPay)}
                                          </p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 text-center">
                                          <p className="text-xs text-slate-500 mb-1">账户支付</p>
                                          <p className="text-base font-semibold text-medical-600 font-mono">
                                            {formatCurrency(record.cost.accountPay)}
                                          </p>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 text-center">
                                          <p className="text-xs text-slate-500 mb-1">现金支付</p>
                                          <p className="text-base font-semibold text-warning-600 font-mono">
                                            {formatCurrency(record.cost.selfPay)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    {record.prescriptions.length > 0 && (
                                      <div>
                                        <h5 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
                                          <Pill className="w-4 h-4 text-medical-500" />
                                          处方药品
                                        </h5>
                                        <div className="flex flex-wrap gap-2">
                                          {record.prescriptions.map((p, idx) => (
                                            <div
                                              key={idx}
                                              className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-slate-100"
                                            >
                                              <span className="text-sm font-medium text-slate-700">
                                                {p.drugName}
                                              </span>
                                              <span className={getInsuranceTagColor(p.insuranceCoverage)}>
                                                {p.insuranceCoverage}
                                              </span>
                                              <span className="text-xs text-slate-400 font-mono">
                                                {p.dosage} {p.frequency}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-2">
                                      <button
                                        onClick={() =>
                                          navigate(`/medical/${record.id}`)
                                        }
                                        className="btn-primary py-2 px-5 text-sm flex items-center gap-2"
                                      >
                                        查看详情
                                        <ArrowRight className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium text-slate-600 mb-1">暂无就诊记录</p>
                <p className="text-sm">
                  {selectedYear !== 'all' ? `${selectedYear}年没有` : '近3年暂无'}就诊记录
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="section-title mb-4">费用构成分析</h3>
            {records.length > 0 ? (
              <>
                <ReactECharts option={costChartOption} style={{ height: '220px' }} />
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-insurance-500" />
                      <span className="text-sm text-slate-600">统筹支付</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 font-mono">
                      {formatCurrency(records.reduce((sum, r) => sum + r.cost.overallPay, 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-medical-500" />
                      <span className="text-sm text-slate-600">账户支付</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 font-mono">
                      {formatCurrency(records.reduce((sum, r) => sum + r.cost.accountPay, 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-warning-500" />
                      <span className="text-sm text-slate-600">现金支付</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900 font-mono">
                      {formatCurrency(records.reduce((sum, r) => sum + r.cost.selfPay, 0))}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">暂无费用数据</p>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-4">年度统计</h3>
            <div className="space-y-4">
              {years.map((year) => {
                const yearData = records.filter(
                  (r) => new Date(r.visitDate).getFullYear() === year
                );
                const totalCost = yearData.reduce((sum, r) => sum + r.cost.total, 0);
                const totalReimburse = yearData.reduce((sum, r) => sum + r.cost.overallPay, 0);
                const reimburseRate = totalCost > 0 ? ((totalReimburse / totalCost) * 100).toFixed(1) : '0';

                return (
                  <div
                    key={year}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedYear === year
                        ? 'border-insurance-300 bg-insurance-50'
                        : 'border-slate-100 bg-white hover:border-insurance-200'
                    }`}
                    onClick={() => setSelectedYear(selectedYear === year ? 'all' : year)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-slate-900">{year}年</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-500">就诊次数</p>
                        <p className="font-medium text-slate-900">{yearData.length} 次</p>
                      </div>
                      <div>
                        <p className="text-slate-500">总费用</p>
                        <p className="font-medium text-slate-900 font-mono">
                          {formatCurrency(totalCost)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">报销比例</p>
                        <p className="font-medium text-insurance-600">{reimburseRate}%</p>
                      </div>
                      <div>
                        <p className="text-slate-500">报销金额</p>
                        <p className="font-medium text-medical-600 font-mono">
                          {formatCurrency(totalReimburse)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-insurance-50 to-white border-insurance-100">
            <h3 className="section-title mb-4 text-insurance-700 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              就诊须知
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-insurance-500 mt-1.5 flex-shrink-0" />
                就诊记录仅展示近3年的医保结算数据
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-insurance-500 mt-1.5 flex-shrink-0" />
                费用明细以医院实际结算单据为准
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-insurance-500 mt-1.5 flex-shrink-0" />
                电子票据可在详情页查看和下载
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-insurance-500 mt-1.5 flex-shrink-0" />
                如有疑问请联系医保服务热线12393
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MedicalRecordsPage;
