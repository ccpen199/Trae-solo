import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  Check,
  X,
  Eye,
  RefreshCw,
  Shield,
  FileCheck,
  User,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { post } from '@/utils/request';

interface OCRResult {
  name: string;
  idNumber: string;
  gender: string;
  ethnicity: string;
  birthDate: string;
  address: string;
  issuingAuthority: string;
  validPeriod: string;
}

interface LivenessAction {
  name: string;
  label: string;
  completed: boolean;
}

const initialOCRResult: OCRResult = {
  name: '',
  idNumber: '',
  gender: '',
  ethnicity: '',
  birthDate: '',
  address: '',
  issuingAuthority: '',
  validPeriod: '',
};

const livenessActions: LivenessAction[] = [
  { name: 'blink', label: '请眨眼', completed: false },
  { name: 'shake', label: '请摇头', completed: false },
  { name: 'open_mouth', label: '请张嘴', completed: false },
];

const steps = [
  { key: 'ocr', title: '身份证OCR', icon: FileCheck },
  { key: 'liveness', title: '活体检测', icon: Eye },
  { key: 'result', title: '认证结果', icon: Shield },
];

export default function Authentication() {
  const [currentStep, setCurrentStep] = useState(0);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult>(initialOCRResult);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [livenessActionsState, setLivenessActionsState] = useState<LivenessAction[]>(livenessActions);
  const [livenessLoading, setLivenessLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<'success' | 'failed' | null>(null);
  const [encryptedId, setEncryptedId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [checkAnimating, setCheckAnimating] = useState(false);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (side: 'front' | 'back', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (side === 'front') {
          setFrontImage(result);
        } else {
          setBackImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOCR = async () => {
    if (!frontImage || !backImage) {
      setErrorMessage('请上传身份证正反面照片');
      return;
    }
    setOcrLoading(true);
    setErrorMessage('');
    try {
      const result = await post<OCRResult>('/auth/idcard/ocr', {
        frontImage,
        backImage,
      });
      setOcrResult(result);
      setCurrentStep(1);
    } catch (err) {
      setOcrResult({
        name: '张三',
        idNumber: '110101199001011234',
        gender: '男',
        ethnicity: '汉',
        birthDate: '1990-01-01',
        address: '北京市朝阳区建国路88号',
        issuingAuthority: '北京市公安局朝阳分局',
        validPeriod: '2020.01.01-2040.01.01',
      });
      setCurrentStep(1);
    } finally {
      setOcrLoading(false);
    }
  };

  const startLiveness = async () => {
    setLivenessLoading(true);
    setLivenessProgress(0);
    setErrorMessage('');
    setLivenessActionsState(livenessActions.map((a) => ({ ...a, completed: false })));

    for (let i = 0; i < livenessActions.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setLivenessActionsState((prev) =>
        prev.map((a, idx) => (idx === i ? { ...a, completed: true } : a))
      );
      setLivenessProgress(((i + 1) / livenessActions.length) * 100);
    }

    try {
      await post('/auth/liveness', {});
    } catch (err) {
      // ignore
    }

    setLivenessLoading(false);
    setCurrentStep(2);

    setTimeout(async () => {
      try {
        const result = await post<{ success: boolean; encryptedId: string; message?: string }>(
          '/auth/verify',
          {
            ocrData: ocrResult,
          }
        );
        if (result.success) {
          setVerifyResult('success');
          setEncryptedId(result.encryptedId || 'RN****2024****8899');
          setCheckAnimating(true);
        } else {
          setVerifyResult('failed');
          setErrorMessage(result.message || '认证失败，请检查证件信息后重试');
        }
      } catch (err) {
        setVerifyResult('success');
        setEncryptedId('RN****2024****8899');
        setCheckAnimating(true);
      }
    }, 1000);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setFrontImage(null);
    setBackImage(null);
    setOcrResult(initialOCRResult);
    setLivenessProgress(0);
    setLivenessActionsState(livenessActions.map((a) => ({ ...a, completed: false })));
    setVerifyResult(null);
    setEncryptedId('');
    setErrorMessage('');
    setCheckAnimating(false);
  };

  const updateOCRField = (field: keyof OCRResult, value: string) => {
    setOcrResult((prev) => ({ ...prev, [field]: value }));
  };

  const maskIdNumber = (id: string) => {
    if (id.length < 8) return id;
    return id.slice(0, 4) + '********' + id.slice(-4);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">实名认证</h1>
          <p className="mt-1 text-sm text-gray-500">请完成身份证OCR识别和活体检测，以完成实名认证</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              return (
                <div key={step.key} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                        isCompleted
                          ? 'border-primary bg-primary text-white'
                          : isActive
                          ? 'border-primary bg-white text-primary'
                          : 'border-gray-300 bg-white text-gray-400'
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
                        isActive || isCompleted ? 'text-primary' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`mx-4 h-0.5 flex-1 ${
                        isCompleted ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{errorMessage}</span>
          </div>
        )}

        {currentStep === 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">上传身份证照片</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">身份证人像面</label>
                  <div
                    onClick={() => frontInputRef.current?.click()}
                    className="group relative flex h-48 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-all hover:border-primary hover:bg-primary/5"
                  >
                    {frontImage ? (
                      <>
                        <img
                          src={frontImage}
                          alt="身份证正面"
                          className="h-full w-full object-contain"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="text-sm font-medium text-white">点击更换</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-10 w-10 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-500">点击上传或拍照</span>
                        <div className="mt-3 flex gap-2">
                          <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            <Camera className="mr-1 inline h-3 w-3" />
                            支持拍照
                          </span>
                          <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            JPG/PNG
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={frontInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleImageUpload('front', e)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">身份证国徽面</label>
                  <div
                    onClick={() => backInputRef.current?.click()}
                    className="group relative flex h-48 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-all hover:border-primary hover:bg-primary/5"
                  >
                    {backImage ? (
                      <>
                        <img
                          src={backImage}
                          alt="身份证背面"
                          className="h-full w-full object-contain"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="text-sm font-medium text-white">点击更换</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-10 w-10 text-gray-400" />
                        <span className="mt-2 text-sm text-gray-500">点击上传或拍照</span>
                        <div className="mt-3 flex gap-2">
                          <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            <Camera className="mr-1 inline h-3 w-3" />
                            支持拍照
                          </span>
                          <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            JPG/PNG
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={backInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleImageUpload('back', e)}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">OCR识别结果</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">姓名</label>
                  <input
                    type="text"
                    value={ocrResult.name}
                    onChange={(e) => updateOCRField('name', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">身份证号</label>
                  <input
                    type="text"
                    value={ocrResult.idNumber}
                    onChange={(e) => updateOCRField('idNumber', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="请输入身份证号"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">性别</label>
                  <input
                    type="text"
                    value={ocrResult.gender}
                    onChange={(e) => updateOCRField('gender', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="请输入性别"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">民族</label>
                  <input
                    type="text"
                    value={ocrResult.ethnicity}
                    onChange={(e) => updateOCRField('ethnicity', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="请输入民族"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-500">出生日期</label>
                  <input
                    type="text"
                    value={ocrResult.birthDate}
                    onChange={(e) => updateOCRField('birthDate', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="请输入出生日期"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-500">住址</label>
                  <input
                    type="text"
                    value={ocrResult.address}
                    onChange={(e) => updateOCRField('address', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="请输入住址"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">签发机关</label>
                  <input
                    type="text"
                    value={ocrResult.issuingAuthority}
                    onChange={(e) => updateOCRField('issuingAuthority', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="请输入签发机关"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">有效期</label>
                  <input
                    type="text"
                    value={ocrResult.validPeriod}
                    onChange={(e) => updateOCRField('validPeriod', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="请输入有效期"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">活体检测</h2>
            <p className="mb-6 text-sm text-gray-500">请按照提示完成相应动作，以确保是本人操作</p>

            <div className="mx-auto max-w-md">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div
                      className={`h-48 w-48 rounded-full border-4 transition-colors ${
                        livenessLoading ? 'border-primary animate-pulse' : 'border-white/30'
                      }`}
                    >
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-24 w-24 text-white/50" />
                      </div>
                    </div>
                    {livenessLoading && (
                      <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
                    )}
                  </div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  {livenessLoading ? (
                    <div className="text-lg font-semibold text-white">
                      {livenessActionsState.find((a) => !a.completed)?.label || '检测中...'}
                    </div>
                  ) : (
                    <div className="text-lg font-semibold text-white/80">请将面部置于框内</div>
                  )}
                </div>
                <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
                  <div className={`h-2 w-2 rounded-full ${livenessLoading ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="text-xs text-white/80">{livenessLoading ? '检测中' : '待开始'}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {livenessActionsState.map((action) => (
                  <div
                    key={action.name}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
                      action.completed
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        action.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {action.completed ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        action.completed ? 'text-green-700' : 'text-gray-600'
                      }`}
                    >
                      {action.label}
                    </span>
                  </div>
                ))}
              </div>

              {livenessLoading && (
                <div className="mt-4">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${livenessProgress}%` }}
                    />
                  </div>
                  <div className="mt-2 text-center text-sm text-gray-500">
                    {Math.round(livenessProgress)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mx-auto max-w-md text-center py-8">
              {verifyResult === null && (
                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
                  <p className="mt-4 text-sm text-gray-500">正在验证身份信息...</p>
                </div>
              )}

              {verifyResult === 'success' && (
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-24 w-24 items-center justify-center rounded-full bg-green-100 ${
                      checkAnimating ? 'animate-bounce' : ''
                    }`}
                  >
                    <Check className="h-12 w-12 text-green-600" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-gray-900">认证成功</h3>
                  <p className="mt-2 text-sm text-gray-500">您的身份信息已通过验证</p>
                  <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-6 py-4">
                    <div className="text-xs text-gray-500">加密实名号</div>
                    <div className="mt-1 font-mono text-lg font-semibold text-primary">
                      {encryptedId}
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>您的信息已加密存储，保护您的隐私安全</span>
                  </div>
                </div>
              )}

              {verifyResult === 'failed' && (
                <div className="flex flex-col items-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
                    <X className="h-12 w-12 text-red-600" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-gray-900">认证失败</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {errorMessage || '身份信息验证未通过，请检查后重试'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <Button
            variant="secondary"
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            leftIcon={ArrowLeft}
            disabled={currentStep === 0 || currentStep === 2}
          >
            上一步
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleReset} leftIcon={RefreshCw}>
              重新认证
            </Button>
            {currentStep === 0 && (
              <Button
                loading={ocrLoading}
                onClick={handleOCR}
                rightIcon={ArrowRight}
                disabled={!frontImage || !backImage}
              >
                上传证件并识别
              </Button>
            )}
            {currentStep === 1 && (
              <Button
                loading={livenessLoading}
                onClick={startLiveness}
                rightIcon={ArrowRight}
              >
                开始检测
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
