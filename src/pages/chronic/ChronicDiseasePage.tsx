import { useState, useEffect } from 'react';
import {
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  CalendarRange,
  Stethoscope,
  Upload,
  ChevronRight,
  Activity,
  FileText,
  UserCheck,
  Building2,
} from 'lucide-react';
import { chronicApi } from '@/services/api';
import { formatDate, getStatusText, getStatusColor } from '@/utils/format';
import type { ChronicDisease } from '@shared/types';

interface ProgressStep {
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  date?: string;
}

function ChronicDiseasePage() {
  const [diseases, setDiseases] = useState<ChronicDisease[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    diseaseType: '',
    materials: [] as string[],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await chronicApi.getList();
        setDiseases(res.data);
      } catch (error) {
        console.error('Failed to fetch chronic disease data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const progressSteps: ProgressStep[] = [
    {
      title: '提交申请',
      description: '线上提交认定材料',
      status: 'completed',
      date: '2026-06-15 09:30',
    },
    {
      title: '材料审核',
      description: '医保经办机构审核',
      status: 'completed',
      date: '2026-06-16 14:20',
    },
    {
      title: '专家评审',
      description: '医疗专家进行认定评审',
      status: 'current',
    },
    {
      title: '结果公示',
      description: '认定结果公示',
      status: 'pending',
    },
    {
      title: '待遇生效',
      description: '享受慢特病医保待遇',
      status: 'pending',
    },
  ];

  const approvedDiseases = diseases.filter((d) => d.status === 'approved');
  const pendingDiseases = diseases.filter((d) => d.status === 'pending');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-5 h-5 text-medical-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-warning-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-danger-500" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-slate-400" />;
      default:
        return <FileCheck className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStepIcon = (status: string, index: number) => {
    if (status === 'completed') {
      return (
        <div className="w-10 h-10 rounded-full bg-medical-500 flex items-center justify-center text-white">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      );
    }
    if (status === 'current') {
      return (
        <div className="w-10 h-10 rounded-full bg-insurance-500 flex items-center justify-center text-white ring-4 ring-insurance-100 animate-pulse-slow">
          <Activity className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
        <span className="text-sm font-medium">{index + 1}</span>
      </div>
    );
  };

  const handleApply = async () => {
    if (!applyForm.diseaseType) return;
    try {
      await chronicApi.apply(applyForm);
      setShowApplyModal(false);
      setApplyForm({ diseaseType: '', materials: [] });
    } catch (error) {
      console.error('Failed to submit application:', error);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="skeleton h-32 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-96 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <div className="skeleton h-80 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">慢特病认定</h1>
          <p className="text-slate-500 mt-1">查询和申请门诊慢特病医保待遇资格</p>
        </div>
        <button
          onClick={() => setShowApplyModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          新增申请
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 bg-gradient-to-br from-insurance-500 to-insurance-700 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="w-6 h-6" />
                  <h3 className="text-lg font-semibold">认定状态</h3>
                </div>
                <p className="text-insurance-100 text-sm mb-4">
                  当前已认定 {approvedDiseases.length} 种慢特病
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">{approvedDiseases.length}</p>
                <p className="text-insurance-200 text-sm">有效认定</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-insurance-200 text-xs mb-1">审核中</p>
                <p className="text-xl font-semibold">{pendingDiseases.length}</p>
              </div>
              <div>
                <p className="text-insurance-200 text-xs mb-1">已过期</p>
                <p className="text-xl font-semibold">
                  {diseases.filter((d) => d.status === 'expired').length}
                </p>
              </div>
              <div>
                <p className="text-insurance-200 text-xs mb-1">累计申请</p>
                <p className="text-xl font-semibold">{diseases.length}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="section-title flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-insurance-500" />
              有效期展示
            </h3>
            {approvedDiseases.length > 0 ? (
              <div className="space-y-3">
                {approvedDiseases.map((disease) => (
                  <div
                    key={disease.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-medical-50 border border-medical-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-medical-100 flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-medical-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{disease.diseaseName}</p>
                        <p className="text-sm text-slate-500">
                          认定日期：{formatDate(disease.confirmedDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="badge-success mb-1">有效</span>
                      <p className="text-sm text-slate-600">
                        至 {formatDate(disease.expiryDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无有效的慢特病认定</p>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="section-title flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-insurance-500" />
              认定病种列表
            </h3>
            <div className="space-y-3">
              {diseases.length > 0 ? (
                diseases.map((disease) => (
                  <div
                    key={disease.id}
                    className="p-4 rounded-xl border border-slate-100 hover:border-insurance-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            disease.status === 'approved'
                              ? 'bg-medical-50'
                              : disease.status === 'pending'
                              ? 'bg-warning-500/10'
                              : disease.status === 'rejected'
                              ? 'bg-danger-500/10'
                              : 'bg-slate-50'
                          }`}
                        >
                          {getStatusIcon(disease.status)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">{disease.diseaseName}</p>
                            <span className={getStatusColor(disease.status)}>
                              {getStatusText(disease.status)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">
                            病种编码：{disease.diseaseType}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">认定日期</p>
                        <p className="text-slate-900 font-medium">
                          {formatDate(disease.confirmedDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">有效期至</p>
                        <p className="text-slate-900 font-medium">
                          {formatDate(disease.expiryDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">报销比例</p>
                        <p className="text-insurance-600 font-medium">门诊 80%</p>
                      </div>
                    </div>
                    {disease.approvalNotes && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                        <span className="font-medium text-slate-700">审批备注：</span>
                        {disease.approvalNotes}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无认定记录</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="section-title flex items-center gap-2">
              <Activity className="w-5 h-5 text-insurance-500" />
              申请进度追踪
            </h3>
            <div className="relative">
              {progressSteps.map((step, index) => (
                <div key={step.title} className="relative pb-8 last:pb-0">
                  {index < progressSteps.length - 1 && (
                    <div
                      className={`absolute left-5 top-10 w-0.5 h-full ${
                        step.status === 'completed'
                          ? 'bg-medical-400'
                          : 'bg-slate-200'
                      }`}
                    />
                  )}
                  <div className="flex gap-4">
                    {getStepIcon(step.status, index)}
                    <div className="flex-1 pt-1">
                      <p
                        className={`font-medium ${
                          step.status === 'current'
                            ? 'text-insurance-600'
                            : step.status === 'completed'
                            ? 'text-slate-900'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">{step.description}</p>
                      {step.date && (
                        <p className="text-xs text-slate-400 mt-1">{step.date}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="section-title flex items-center gap-2">
              <FileText className="w-5 h-5 text-insurance-500" />
              申请须知
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-insurance-500 mt-1.5 flex-shrink-0" />
                需提供二级以上医院近一年内的住院病历或门诊病历
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-insurance-500 mt-1.5 flex-shrink-0" />
                提供相关检查检验报告、病理诊断证明
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-insurance-500 mt-1.5 flex-shrink-0" />
                认定通过后待遇有效期为2年
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-insurance-500 mt-1.5 flex-shrink-0" />
                可申请病种包括恶性肿瘤、尿毒症、糖尿病等20种
              </li>
            </ul>
          </div>

          <div className="card p-6 bg-gradient-to-br from-medical-50 to-white">
            <h3 className="section-title mb-4 text-medical-700">
              <UserCheck className="w-5 h-5 inline-block mr-2" />
              医保待遇说明
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-insurance-500" />
                  <span className="text-sm text-slate-600">门诊报销比例</span>
                </div>
                <span className="font-semibold text-insurance-600">80%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-insurance-500" />
                  <span className="text-sm text-slate-600">年度支付限额</span>
                </div>
                <span className="font-semibold text-insurance-600">¥150,000</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-2">
                  <CalendarRange className="w-4 h-4 text-insurance-500" />
                  <span className="text-sm text-slate-600">待遇有效期</span>
                </div>
                <span className="font-semibold text-insurance-600">24个月</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg animate-fade-in-up">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-semibold text-slate-900">新增慢特病认定申请</h3>
              <p className="text-sm text-slate-500 mt-1">请如实填写信息并上传相关材料</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  选择病种
                </label>
                <select
                  value={applyForm.diseaseType}
                  onChange={(e) =>
                    setApplyForm((prev) => ({ ...prev, diseaseType: e.target.value }))
                  }
                  className="input-field"
                >
                  <option value="">请选择认定病种</option>
                  <option value="C01">恶性肿瘤</option>
                  <option value="C02">尿毒症（终末期肾病）</option>
                  <option value="C03">糖尿病</option>
                  <option value="C04">高血压Ⅲ期</option>
                  <option value="C05">冠心病</option>
                  <option value="C06">肝硬化</option>
                  <option value="C07">再生障碍性贫血</option>
                  <option value="C08">系统性红斑狼疮</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  上传证明材料
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-insurance-300 transition-colors cursor-pointer">
                  <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">点击或拖拽上传病历材料</p>
                  <p className="text-xs text-slate-400 mt-1">支持 PDF、JPG、PNG 格式，单文件不超过 10MB</p>
                </div>
              </div>
              <div className="p-4 bg-insurance-50 rounded-lg">
                <p className="text-sm text-insurance-700">
                  <AlertCircle className="w-4 h-4 inline-block mr-1" />
                  需上传的材料：住院病历首页、出院小结、疾病诊断证明、相关检查检验报告
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleApply}
                disabled={!applyForm.diseaseType}
                className="btn-primary"
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChronicDiseasePage;
