import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Building2,
  Stethoscope,
  User,
  Pill,
  FileText,
  Receipt,
  Download,
  Printer,
  AlertCircle,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { medicalApi } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/format';
import type { MedicalRecord, Prescription, Examination } from '@shared/types';

type TabType = 'diagnosis' | 'prescription' | 'examination' | 'cost';

const tabItems: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'diagnosis', label: '诊断信息', icon: <Stethoscope className="w-4 h-4" /> },
  { key: 'prescription', label: '处方详情', icon: <Pill className="w-4 h-4" /> },
  { key: 'examination', label: '检查检验', icon: <FileText className="w-4 h-4" /> },
  { key: 'cost', label: '费用明细', icon: <Receipt className="w-4 h-4" /> },
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildMedicalReceiptUrl(record: MedicalRecord) {
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>就诊费用凭证</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 24px; color: #0f172a; }
    h1 { margin-bottom: 8px; }
    .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; background: #f8fafc; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
    th { background: #e2e8f0; }
  </style>
</head>
<body>
  <h1>就诊费用凭证</h1>
  <div class="card">
    <div>医院：${escapeHtml(record.hospital)}</div>
    <div>科室：${escapeHtml(record.department)}</div>
    <div>医生：${escapeHtml(record.doctor)}</div>
    <div>就诊日期：${escapeHtml(formatDate(record.visitDate))}</div>
    <div>诊断：${escapeHtml(record.diagnosis.join('、'))}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>费用项目</th>
        <th>金额</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>总费用</td><td>￥${record.cost.total.toFixed(2)}</td></tr>
      <tr><td>统筹支付</td><td>￥${record.cost.overallPay.toFixed(2)}</td></tr>
      <tr><td>账户支付</td><td>￥${record.cost.accountPay.toFixed(2)}</td></tr>
      <tr><td>现金支付</td><td>￥${record.cost.selfPay.toFixed(2)}</td></tr>
    </tbody>
  </table>
</body>
</html>`;

  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

function MedicalRecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('diagnosis');
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const res = await medicalApi.getRecordDetail(id);
        setRecord(res.data);
      } catch (error) {
        console.error('Failed to fetch medical record detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const costPieOption = useMemo(() => {
    if (!record) return {};

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
          radius: ['50%', '75%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 3,
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}\n¥{c}',
            fontSize: 12,
          },
          labelLine: {
            show: true,
            length: 10,
            length2: 15,
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
              value: record.cost.overallPay,
              name: '统筹支付',
              itemStyle: { color: '#1677FF' },
            },
            {
              value: record.cost.accountPay,
              name: '账户支付',
              itemStyle: { color: '#00B42A' },
            },
            {
              value: record.cost.selfPay,
              name: '现金支付',
              itemStyle: { color: '#FF7D00' },
            },
          ],
        },
      ],
    };
  }, [record]);

  const handleViewReceipt = async () => {
    if (!record) return;
    setReceiptUrl(buildMedicalReceiptUrl(record));
    setShowReceipt(true);
  };

  const getInsuranceTagColor = (coverage: string) => {
    if (coverage === '甲类') return 'badge-success';
    if (coverage === '乙类') return 'badge-warning';
    return 'badge';
  };

  const getResultStatus = (result: string) => {
    const abnormalKeywords = ['偏高', '偏低', '异常', '阳性', '↑', '↓'];
    const isAbnormal = abnormalKeywords.some((kw) => result.includes(kw));
    return isAbnormal ? 'danger' : 'success';
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="space-y-6">
          <div className="skeleton h-10 w-32 rounded-lg" />
          <div className="skeleton h-48 rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="skeleton h-12 rounded-xl mb-4" />
              <div className="skeleton h-96 rounded-2xl" />
            </div>
            <div className="space-y-6">
              <div className="skeleton h-72 rounded-2xl" />
              <div className="skeleton h-56 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="page-content">
        <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium text-slate-600 mb-2">未找到就诊记录</p>
          <p className="text-sm text-slate-400 mb-6">该记录可能不存在或已被删除</p>
          <button onClick={() => navigate('/medical')} className="btn-primary">
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <button
        onClick={() => navigate('/medical')}
        className="flex items-center gap-2 text-slate-600 hover:text-insurance-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回就诊记录列表</span>
      </button>

      <div className="card p-6 mb-6 bg-gradient-to-r from-insurance-500 to-insurance-600 text-white">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">{record.hospital}</h1>
              <p className="text-insurance-100 mb-3">{record.department} · {record.doctor}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(record.visitDate)}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  主治医师
                </span>
                <span className="badge bg-white/20 text-white border-0">
                  {record.diagnosis[0]}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-insurance-100 text-sm mb-1">本次就诊总费用</p>
            <p className="text-4xl font-bold font-mono mb-2">
              {formatCurrency(record.cost.total)}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span>
                统筹支付 <span className="font-mono font-medium">{formatCurrency(record.cost.overallPay)}</span>
              </span>
              <span>
                个人支付 <span className="font-mono font-medium">{formatCurrency(record.cost.accountPay + record.cost.selfPay)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-2">
            <div className="flex flex-wrap gap-1">
              {tabItems.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`tab-item flex items-center gap-2 flex-1 justify-center ${
                    activeTab === tab.key ? 'tab-item-active' : ''
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6">
            {activeTab === 'diagnosis' && (
              <div className="space-y-6">
                <div>
                  <h3 className="section-title mb-4 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-insurance-500" />
                    诊断信息
                  </h3>
                  <div className="bg-insurance-50 rounded-xl p-5 border border-insurance-100">
                    <h4 className="font-semibold text-slate-800 mb-3">西医诊断</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {record.diagnosis.map((d, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-white rounded-lg border border-insurance-200 text-insurance-700 font-medium"
                        >
                          {d}
                        </span>
                      ))}
                    </div>

                    <h4 className="font-semibold text-slate-800 mb-3">主诉症状</h4>
                    <p className="text-slate-600 leading-relaxed bg-white rounded-lg p-4 border border-slate-100">
                      {record.symptoms}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h4 className="font-medium text-slate-700 mb-2">就诊科室</h4>
                    <p className="text-lg font-semibold text-slate-900">{record.department}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h4 className="font-medium text-slate-700 mb-2">主治医师</h4>
                    <p className="text-lg font-semibold text-slate-900">{record.doctor}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h4 className="font-medium text-slate-700 mb-2">就诊日期</h4>
                    <p className="text-lg font-semibold text-slate-900">{formatDate(record.visitDate)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-5">
                    <h4 className="font-medium text-slate-700 mb-2">就诊医院</h4>
                    <p className="text-lg font-semibold text-slate-900">{record.hospital}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'prescription' && (
              <div className="space-y-6">
                <h3 className="section-title mb-4 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-medical-500" />
                  处方详情
                  <span className="badge-info ml-2">
                    共 {record.prescriptions.length} 种药品
                  </span>
                </h3>

                {record.prescriptions.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                            药品名称
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                            规格
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                            用法用量
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-slate-600">
                            数量
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">
                            单价
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">
                            金额
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-slate-600">
                            医保类型
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {record.prescriptions.map((prescription: Prescription, index: number) => (
                          <tr key={index} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4">
                              <p className="font-medium text-slate-900">{prescription.drugName}</p>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600">
                              {prescription.spec}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600">
                              <p>{prescription.dosage}</p>
                              <p className="text-slate-400">{prescription.frequency}</p>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600 text-center">
                              {prescription.quantity}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600 text-right font-mono">
                              {formatCurrency(prescription.unitPrice)}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-900 text-right font-medium font-mono">
                              {formatCurrency(prescription.amount)}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={getInsuranceTagColor(prescription.insuranceCoverage)}>
                                {prescription.insuranceCoverage}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50">
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-right font-medium text-slate-600">
                            药品费用合计
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900 font-mono">
                            {formatCurrency(
                              record.prescriptions.reduce((sum, p) => sum + p.amount, 0)
                            )}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">本次就诊未开具处方药品</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'examination' && (
              <div className="space-y-6">
                <h3 className="section-title mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-warning-500" />
                  检查检验
                  <span className="badge-warning ml-2">
                    共 {record.examinations.length} 项检查
                  </span>
                </h3>

                {record.examinations.length > 0 ? (
                  <div className="space-y-4">
                    {record.examinations.map((exam: Examination, index: number) => {
                      const status = getResultStatus(exam.result);
                      return (
                        <div
                          key={index}
                          className={`rounded-xl border p-5 transition-colors ${
                            status === 'danger'
                              ? 'border-danger-200 bg-danger-500/5'
                              : 'border-slate-200 bg-white hover:border-insurance-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  status === 'danger'
                                    ? 'bg-danger-100 text-danger-600'
                                    : 'bg-medical-100 text-medical-600'
                                }`}
                              >
                                {status === 'danger' ? (
                                  <AlertCircle className="w-5 h-5" />
                                ) : (
                                  <CheckCircle className="w-5 h-5" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900">{exam.name}</h4>
                                <p className="text-sm text-slate-500">{exam.type}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={getInsuranceTagColor(exam.insuranceCoverage)}>
                                {exam.insuranceCoverage}
                              </span>
                              <p className="text-sm font-medium text-slate-900 font-mono mt-1">
                                {formatCurrency(exam.amount)}
                              </p>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-4 border border-slate-100">
                            <p className="text-sm text-slate-500 mb-1">检查结果</p>
                            <p
                              className={`font-medium ${
                                status === 'danger' ? 'text-danger-600' : 'text-slate-700'
                              }`}
                            >
                              {exam.result}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">本次就诊未进行检查检验</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'cost' && (
              <div className="space-y-6">
                <h3 className="section-title mb-4 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-insurance-500" />
                  费用明细
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-insurance-50 rounded-xl p-5 border border-insurance-100">
                    <p className="text-sm text-insurance-600 mb-1">总费用</p>
                    <p className="text-2xl font-bold text-insurance-700 font-mono">
                      {formatCurrency(record.cost.total)}
                    </p>
                  </div>
                  <div className="bg-medical-50 rounded-xl p-5 border border-medical-100">
                    <p className="text-sm text-medical-600 mb-1">医保报销</p>
                    <p className="text-2xl font-bold text-medical-700 font-mono">
                      {formatCurrency(record.cost.overallPay)}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                          费用项目
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">
                          金额
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">
                          支付方式
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-600">
                          支付金额
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-900">药品费用</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                          {formatCurrency(
                            record.prescriptions.reduce((sum, p) => sum + p.amount, 0)
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">统筹基金支付</td>
                        <td className="px-4 py-3 text-right font-mono text-insurance-600 font-medium">
                          {formatCurrency(record.cost.overallPay)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-900">检查检验费</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                          {formatCurrency(
                            record.examinations.reduce((sum, e) => sum + e.amount, 0)
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">个人账户支付</td>
                        <td className="px-4 py-3 text-right font-mono text-medical-600 font-medium">
                          {formatCurrency(record.cost.accountPay)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-900">其他费用</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                          {formatCurrency(
                            record.cost.total -
                              record.prescriptions.reduce((sum, p) => sum + p.amount, 0) -
                              record.examinations.reduce((sum, e) => sum + e.amount, 0)
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">现金支付</td>
                        <td className="px-4 py-3 text-right font-mono text-warning-600 font-medium">
                          {formatCurrency(record.cost.selfPay)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-50">
                      <tr>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          合计
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                          {formatCurrency(record.cost.total)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          合计支付
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono">
                          {formatCurrency(record.cost.overallPay + record.cost.accountPay + record.cost.selfPay)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="section-title mb-4">费用构成</h3>
            <ReactECharts option={costPieOption} style={{ height: '260px' }} />
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-4">报销信息</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">报销比例</span>
                <span className="text-lg font-bold text-insurance-600">
                  {((record.cost.overallPay / record.cost.total) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-insurance-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${(record.cost.overallPay / record.cost.total) * 100}%`,
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-insurance-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-insurance-600 mb-1">统筹支付</p>
                  <p className="font-semibold text-insurance-700 font-mono text-sm">
                    {formatCurrency(record.cost.overallPay)}
                  </p>
                </div>
                <div className="bg-warning-500/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-warning-600 mb-1">个人负担</p>
                  <p className="font-semibold text-warning-700 font-mono text-sm">
                    {formatCurrency(record.cost.accountPay + record.cost.selfPay)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-4">电子票据</h3>
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-insurance-100 flex items-center justify-center">
                <Receipt className="w-8 h-8 text-insurance-600" />
              </div>
              <p className="text-sm text-slate-600 mb-4">
                可查看和下载本次就诊的正式电子票据
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleViewReceipt}
                  className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  查看电子票据
                </button>
                <button className="w-full btn-secondary py-2.5 flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  下载票据
                </button>
                <button className="w-full btn-secondary py-2.5 flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" />
                  打印票据
                </button>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-medical-50 to-white border-medical-100">
            <h3 className="section-title mb-4 text-medical-700 flex items-center gap-2">
              <Pill className="w-5 h-5" />
              用药提醒
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-medical-500 mt-1.5 flex-shrink-0" />
                请严格按照医嘱服用药品，不要自行调整剂量
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-medical-500 mt-1.5 flex-shrink-0" />
                用药期间注意观察不良反应，如有不适请及时就医
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-medical-500 mt-1.5 flex-shrink-0" />
                药品应妥善保存，避免儿童接触
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-medical-500 mt-1.5 flex-shrink-0" />
                定期复诊，根据病情调整治疗方案
              </li>
            </ul>
          </div>
        </div>
      </div>

      {showReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">电子票据</h3>
              <button
                onClick={() => setShowReceipt(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-64px)]">
              {receiptUrl ? (
                <iframe
                  src={receiptUrl}
                  className="w-full h-[600px] rounded-lg border border-slate-200"
                  title="电子票据"
                />
              ) : (
                <div className="text-center py-20 text-slate-400">
                  <Receipt className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium text-slate-600 mb-1">票据加载中...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicalRecordDetailPage;
