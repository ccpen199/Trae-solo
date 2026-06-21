import { useEffect, useState } from 'react';
import { Upload, Check, AlertTriangle, FileText, ScanEye, ShieldCheck, Users } from 'lucide-react';
import { useStore } from '@/store';
import { mockJobs, mockResumes, mockApplications, mockInterviews, mockAnalyticsData, mockCompanies, mockVerificationRecords } from '@/mock/data';
import StatusBadge from '@/components/ui/StatusBadge';
import type { RiskItem } from '@/../shared/types';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

const steps = [
  { id: 0, name: '上传执照', icon: Upload },
  { id: 1, name: 'OCR识别', icon: ScanEye },
  { id: 2, name: '风险扫描', icon: ShieldCheck },
  { id: 3, name: '人工审核', icon: Users },
  { id: 4, name: '认证完成', icon: Check },
];

const riskRadarData = [
  { dimension: '涉诉风险', value: 20, fullMark: 100 },
  { dimension: '执行风险', value: 10, fullMark: 100 },
  { dimension: '失信风险', value: 0, fullMark: 100 },
  { dimension: '行政处罚', value: 0, fullMark: 100 },
  { dimension: '经营异常', value: 15, fullMark: 100 },
];

const riskTypeLabelMap: Record<string, string> = {
  lawsuit: '涉诉风险',
  execution: '执行案件',
  dishonest: '失信记录',
  penalty: '行政处罚',
};

export default function Verification() {
  const {
    setCompany, setVerificationRecord, verificationRecord } = useStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [showOcrResult, setShowOcrResult] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setCompany(mockCompanies[1]);
    setVerificationRecord(mockVerificationRecords[1]);
    if (mockVerificationRecords[1]) {
      const status = mockVerificationRecords[1].status;
      if (status === 'pending_ocr') setCurrentStep(0);
      else if (status === 'ocr_done') setCurrentStep(1);
      else if (status === 'scanning') setCurrentStep(2);
      else if (status === 'pending_review') setCurrentStep(3);
      else if (status === 'approved' || status === 'rejected') setCurrentStep(4);
    }
  }, [setCompany, setVerificationRecord]);

  const handleUploadClick = () => {
    setShowOcrResult(true);
    setCurrentStep(2);
    setTimeout(() => {
      setCurrentStep(3);
    }, 1500);
  };

  const getRiskItems = (): RiskItem[] => {
    return verificationRecord?.riskData?.details || [];
  };

  const currentVerification = mockVerificationRecords[1];

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-gray-900">企业资质认证</h1>
      {currentVerification && (
        <StatusBadge status={currentVerification.status} type="verification" />
      )}
    </div>

      <div className="glass rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-1/2 -translate-x-1/2 h-0.5 bg-gray-200 w-4/5 z-0" />
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          return (
            <div key={step.id} className="flex flex-col items-center z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-success text-white'
                    : isActive
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-5 w-5" />
                )}
              </div>
              <span
                className={`mt-2 text-sm font-medium ${
                  isCompleted || isActive ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">上传营业执照</h2>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleUploadClick();
              }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-primary/50'
              }`}
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Upload className="h-8 w-8" />
                </div>
                <p className="text-gray-900 font-medium mb-1">点击或拖拽上传营业执照</p>
                <p className="text-sm text-gray-500 mb-4">支持 JPG、PNG、PDF 格式，大小不超过 10MB</p>
                <button
                  onClick={handleUploadClick}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  选择文件
                </button>
              </div>
            </div>
          </div>

          {(showOcrResult || currentVerification?.ocrData) && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ScanEye className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">OCR 识别结果</h2>
                <span className="ml-auto text-sm text-gray-500">
                  置信度 {Math.round((currentVerification?.ocrData?.confidence || 0.93) * 100)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">企业名称</label>
                  <input
                    type="text"
                    defaultValue={currentVerification?.ocrData?.companyName}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">统一社会信用代码</label>
                  <input
                    type="text"
                    defaultValue={currentVerification?.ocrData?.licenseNo}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">法定代表人</label>
                  <input
                    type="text"
                    defaultValue={currentVerification?.ocrData?.legalPerson}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">注册资本</label>
                  <input
                    type="text"
                    defaultValue={currentVerification?.ocrData?.registeredCapital}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">成立日期</label>
                  <input
                    type="text"
                    defaultValue={currentVerification?.ocrData?.establishmentDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-500 mb-1">经营范围</label>
                  <textarea
                    defaultValue={currentVerification?.ocrData?.businessScope}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  重新识别
                </button>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  确认并提交
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-gray-900">风险扫描</h2>
              <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info`}>
                {currentVerification?.riskData?.level === 'none'
                  ? '无风险'
                  : currentVerification?.riskData?.level === 'low'
                  ? '低风险'
                  : currentVerification?.riskData?.level === 'medium'
                  ? '中风险'
                  : '高风险'}
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={riskRadarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="风险指数"
                    dataKey="value"
                    stroke="#FF6B35"
                    fill="#FF6B35"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{currentVerification?.riskData?.lawsuitCount || 0}</p>
                <p className="text-xs text-gray-500">涉诉案件</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{currentVerification?.riskData?.executionCount || 0}</p>
                <p className="text-xs text-gray-500">执行案件</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{currentVerification?.riskData?.dishonestCount || 0}</p>
                <p className="text-xs text-gray-500">失信记录</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{currentVerification?.riskData?.administrativePenaltyCount || 0}</p>
                <p className="text-xs text-gray-500">行政处罚</p>
              </div>
            </div>
          </div>

          {getRiskItems().length > 0 && (
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-semibold text-gray-900">风险项详情</h2>
              </div>
              <div className="space-y-3">
                {getRiskItems().map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {riskTypeLabelMap[item.type] || item.type}
                        </span>
                        <span className="text-xs text-gray-500">{item.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{item.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {item.amount && <span>金额：{item.amount}</span>}
                        <span>状态：{item.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-gray-900">认证状态</h2>
            </div>
            <div className="text-center py-6">
              {currentVerification?.status === 'pending_review' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-8 w-8 text-yellow-600" />
                  </div>
                  <p className="text-gray-900 font-medium">正在人工审核中</p>
                  <p className="text-sm text-gray-500 mt-1">
                    预计 1-3 个工作日完成审核，请耐心等待
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    提交时间：{currentVerification?.submittedAt ? new Date(currentVerification.submittedAt).toLocaleString('zh-CN') : ''}
                  </p>
                </>
              ) : currentVerification?.status === 'approved' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                    <Check className="h-8 w-8 text-success" />
                  </div>
                  <p className="text-gray-900 font-medium">认证已通过</p>
                  <p className="text-sm text-gray-500 mt-1">您的企业资质已成功认证</p>
                </>
              ) : currentVerification?.status === 'rejected' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="h-8 w-8 text-danger" />
                  </div>
                  <p className="text-gray-900 font-medium">认证未通过</p>
                  <p className="text-sm text-gray-500 mt-1">请检查您的企业信息后重新提交</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-gray-900 font-medium">请完成上方认证流程</p>
                  <p className="text-sm text-gray-500 mt-1">上传营业执照并完成风险扫描</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
