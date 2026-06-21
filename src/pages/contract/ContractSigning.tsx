import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Building2,
  User,
  PenLine,
  Hash,
  Calendar,
  Clock,
  DollarSign,
  ShieldCheck,
  FileCheck2,
  Users,
  ChevronRight,
} from 'lucide-react';
import { mockContracts, mockSignRecords, mockContractTemplates } from '@/mock/data';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDateTime } from '@/utils/helpers';
import type { SignRecord } from '../../../shared/types';

const steps = [
  { id: 1, name: '阅读条款' },
  { id: 2, name: '双方确认' },
  { id: 3, name: '电子签名' },
  { id: 4, name: '存证备案' },
];

export default function ContractSigning() {
  const { id } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(3);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeAll, setAgreeAll] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signatureDrawn, setSignatureDrawn] = useState(false);

  const contract = useMemo(() => {
    return mockContracts.find(c => c.id === id) || mockContracts[0];
  }, [id]);

  const contractSignRecords = useMemo<SignRecord[]>(() => {
    return mockSignRecords.filter(r => r.contractId === contract?.id);
  }, [contract]);

  const employerRecord = contractSignRecords.find(r => r.signerRole === 'employer');
  const jobseekerRecord = contractSignRecords.find(r => r.signerRole === 'jobseeker');

  const template = mockContractTemplates.find(t => t.id === contract?.templateId);
  const content = template?.content || contract?.content || '';

  const canSign = agreeTerms && agreeAll && signatureDrawn;

  const handleSign = () => {
    if (!canSign) return;
    setSigned(true);
    setCurrentStep(4);
  };

  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const isChapter = line.startsWith('第');
      const isClause = line.startsWith('第') && line.includes('条');
      const isHighlight = line.includes('薪酬') || line.includes('工资') ||
        line.includes('工作时间') || line.includes('加班') ||
        line.includes('解除') || line.includes('终止');

      if (line.trim() === '') {
        return <div key={idx} className="h-3" />;
      }

      return (
        <p
          key={idx}
          className={`text-sm leading-relaxed ${
            isChapter ? 'text-base font-bold text-[#1E3A5F] mt-4 mb-2' : ''
          } ${isClause ? 'font-semibold text-gray-800' : 'text-gray-700'} ${
            isHighlight ? 'bg-yellow-50 -mx-2 px-2 py-1 rounded-lg' : ''
          }`}
        >
          {line}
        </p>
      );
    });
  };

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">电子签约</h1>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      currentStep >= step.id
                        ? 'bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/30'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{step.id}</span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      currentStep >= step.id ? 'text-[#FF6B35]' : 'text-gray-400'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 mx-2 mb-6">
                    <div
                      className={`h-1 rounded-full transition-all duration-500 ${
                        currentStep > step.id ? 'bg-[#FF6B35]' : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{contract?.templateName}</h2>
            <p className="text-sm text-gray-500 mb-6">合同编号：{contract?.id.toUpperCase()}</p>

            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#1E3A5F]/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-4 w-4 text-[#1E3A5F]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">甲方（企业）</p>
                  <p className="text-sm font-semibold text-gray-900">{contract?.companyName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-[#FF6B35]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">乙方（劳动者）</p>
                  <p className="text-sm font-semibold text-gray-900">{contract?.userName}</p>
                </div>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto pr-4 space-y-1 custom-scrollbar">
              {renderContent(content)}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Hash className="h-5 w-5 text-[#1E3A5F]" />
              合同摘要
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">合同名称</span>
                <span className="text-sm font-medium text-gray-900">{contract?.templateName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">模板类型</span>
                <span className="text-sm font-medium text-gray-900">标准模板</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  合同期限
                </span>
                <span className="text-sm font-medium text-gray-900">2026.04 - 2026.10</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  薪资标准
                </span>
                <span className="text-sm font-semibold text-[#FF6B35]">22-28 元/时</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  工作时间
                </span>
                <span className="text-sm font-medium text-gray-900">弹性排班</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                甲方：{contract?.companyName} · 乙方：{contract?.userName}
              </span>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#1E3A5F]" />
              签约确认
            </h3>
            <div className="space-y-3 mb-5">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={e => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35] cursor-pointer"
                  />
                </div>
                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors leading-snug">
                  我已完整阅读并理解合同全部条款
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreeAll}
                    onChange={e => setAgreeAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35] cursor-pointer"
                  />
                </div>
                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors leading-snug">
                  我同意接受本合同各项约定
                </span>
              </label>
            </div>

            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">电子签名</p>
              <div
                onClick={() => !signed && setSignatureDrawn(true)}
                className={`h-24 rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${
                  signatureDrawn || signed
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-[#FF6B35]/50 hover:bg-gray-50 cursor-pointer'
                }`}
              >
                {signatureDrawn || signed ? (
                  <div className="text-center">
                    <PenLine className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <p className="text-xs font-medium text-green-700">
                      {contract?.userName} 已签名
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <PenLine className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">点击签名</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <p className="text-sm font-medium text-gray-700">签约记录</p>
              {employerRecord && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-900 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-[#1E3A5F]" />
                      雇主签署
                    </span>
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    {employerRecord.signerName} · {formatDateTime(employerRecord.signedAt)}
                  </p>
                  <p className="text-xs text-gray-400 font-mono truncate">
                    {employerRecord.blockchainHash.slice(0, 20)}...
                  </p>
                </div>
              )}
              {jobseekerRecord && (
                <div className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-900 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#FF6B35]" />
                      劳动者签署
                    </span>
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    {jobseekerRecord.signerName} · {formatDateTime(jobseekerRecord.signedAt)}
                  </p>
                  <p className="text-xs text-gray-400 font-mono truncate">
                    {jobseekerRecord.blockchainHash.slice(0, 20)}...
                  </p>
                </div>
              )}
              {!employerRecord && !jobseekerRecord && (
                <p className="text-xs text-gray-400 text-center py-3">暂无签署记录</p>
              )}
            </div>

            {signed && (
              <div className="mb-5 p-3 bg-[#1E3A5F]/5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#1E3A5F]" />
                    <span className="text-xs font-medium text-gray-800">区块链存证</span>
                  </div>
                  <StatusBadge status="filed" type="filing" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-4 w-4 text-[#1E3A5F]" />
                    <span className="text-xs font-medium text-gray-800">人社备案</span>
                  </div>
                  <StatusBadge status="filing" type="filing" />
                </div>
              </div>
            )}

            <button
              onClick={handleSign}
              disabled={!canSign || signed}
              className={`w-full py-3.5 rounded-xl text-base font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                !canSign || signed
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/30 hover:bg-[#FF6B35]/90 hover:shadow-xl hover:shadow-[#FF6B35]/40 active:scale-[0.98]'
              }`}
            >
              {signed ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  已完成签署
                </>
              ) : (
                <>
                  <PenLine className="h-5 w-5" />
                  确认签署
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>

            {!canSign && !signed && (
              <p className="mt-3 text-xs text-center text-gray-400">
                请勾选确认项并完成签名后继续
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
