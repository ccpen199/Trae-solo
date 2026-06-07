import { useState } from 'react';
import { api, apiUpload } from '@/lib/api';
import { Upload, CheckCircle, XCircle, ChevronRight, Award } from 'lucide-react';

interface StepResult {
  name?: string;
  license_number?: string;
  qualification?: string;
  issue_date?: string;
  matched?: boolean;
  credits?: number;
  credits_required?: number;
  verified?: boolean;
}

export default function Verification() {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<StepResult>({});
  const [error, setError] = useState('');

  const steps = [
    { label: '上传护士证', icon: Upload },
    { label: 'OCR识别', icon: Award },
    { label: '卫健委比对', icon: CheckCircle },
    { label: '学分验证', icon: Award },
    { label: '核验完成', icon: CheckCircle },
  ];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('certificate', file);
      const data = await apiUpload<StepResult>('/nurses/verification/ocr', formData);
      setResult(data);
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleCompare = async () => {
    setUploading(true);
    setError('');
    try {
      const data = await api<StepResult>('/nurses/verification/compare', { method: 'POST' });
      setResult((prev) => ({ ...prev, ...data }));
      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '比对失败');
    } finally {
      setUploading(false);
    }
  };

  const handleCredits = async () => {
    setUploading(true);
    setError('');
    try {
      const data = await api<StepResult>('/nurses/verification/credits', { method: 'POST' });
      setResult((prev) => ({ ...prev, ...data }));
      setStep(4);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '验证失败');
    } finally {
      setUploading(false);
    }
  };

  const handleFinish = () => {
    setStep(5);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#1E293B]">资格核验</h1>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex flex-col items-center ${
                i + 1 <= step ? 'text-[#0F6CBD]' : 'text-gray-300'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  i + 1 < step
                    ? 'bg-[#0F6CBD] border-[#0F6CBD] text-white'
                    : i + 1 === step
                    ? 'border-[#0F6CBD] text-[#0F6CBD]'
                    : 'border-gray-300 text-gray-300'
                }`}>
                  {i + 1 < step ? <CheckCircle className="w-5 h-5" /> : <span className="text-sm font-bold">{i + 1}</span>}
                </div>
                <span className="text-xs mt-1 text-center w-16">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className={`w-5 h-5 mx-2 ${i + 1 < step ? 'text-[#0F6CBD]' : 'text-gray-300'}`} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>
        )}

        {step === 1 && (
          <div className="text-center py-8">
            <label className="block cursor-pointer">
              <div className="w-40 h-40 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-[#0F6CBD] transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">上传护士证照片</span>
              </div>
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
            {uploading && <p className="text-sm text-gray-500 mt-4">上传识别中...</p>}
          </div>
        )}

        {step === 2 && result.name && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[#1E293B]">OCR识别结果</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="姓名" value={result.name} />
              <InfoItem label="执业证号" value={result.license_number} />
              <InfoItem label="资质等级" value={result.qualification} />
              <InfoItem label="发证日期" value={result.issue_date} />
            </div>
            <button
              onClick={handleCompare}
              disabled={uploading}
              className="bg-[#0F6CBD] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#0D5DA8] disabled:opacity-50"
            >
              下一步：卫健委比对
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[#1E293B]">卫健委比对结果</h3>
            <div className={`flex items-center gap-3 p-4 rounded-lg ${
              result.matched ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {result.matched ? (
                <CheckCircle className="w-6 h-6 text-[#108043]" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <span className={`font-medium ${result.matched ? 'text-[#108043]' : 'text-red-600'}`}>
                {result.matched ? '比对通过：与卫健委数据一致' : '比对未通过：与卫健委数据不一致'}
              </span>
            </div>
            <button
              onClick={handleCredits}
              disabled={uploading}
              className="bg-[#0F6CBD] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#0D5DA8] disabled:opacity-50"
            >
              下一步：学分验证
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-[#1E293B]">学分验证</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">当前学分</span>
                <span className="font-medium">{result.credits || 0} / {result.credits_required || 25}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    (result.credits || 0) >= (result.credits_required || 25) ? 'bg-[#108043]' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(((result.credits || 0) / (result.credits_required || 25)) * 100, 100)}%` }}
                />
              </div>
              <p className={`text-sm ${(result.credits || 0) >= (result.credits_required || 25) ? 'text-[#108043]' : 'text-yellow-600'}`}>
                {(result.credits || 0) >= (result.credits_required || 25) ? '学分达标' : '学分未达标，需继续学习'}
              </p>
            </div>
            <button
              onClick={handleFinish}
              className="bg-[#0F6CBD] text-white px-6 py-2 rounded-lg text-sm hover:bg-[#0D5DA8]"
            >
              完成核验
            </button>
          </div>
        )}

        {step === 5 && (
          <div className="text-center py-8">
            {result.verified !== false ? (
              <>
                <CheckCircle className="w-16 h-16 text-[#108043] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#108043]">核验通过</h3>
                <p className="text-gray-500 mt-2">您的护士资格已通过核验，可以开始接单服务</p>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-600">核验未通过</h3>
                <p className="text-gray-500 mt-2">请核实您的资质信息后重新提交</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-[#1E293B]">{value || '-'}</p>
    </div>
  );
}
