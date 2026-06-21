import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Check, X, Smartphone, FileText, ShieldCheck, Loader2, Briefcase } from 'lucide-react';
import { mockCertification } from '@/mock/data';

type Step = 'ocr' | 'confirm' | 'verify' | 'result';

export default function Certification() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('confirm');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [phone, setPhone] = useState('13812345678');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'success' | 'fail'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cert = mockCertification;

  const steps = [
    { key: 'ocr', label: '上传执照', icon: FileText },
    { key: 'confirm', label: '信息确认', icon: Check },
    { key: 'verify', label: '法人验证', icon: Smartphone },
    { key: 'result', label: '认证结果', icon: ShieldCheck },
  ];

  const currentIndex = steps.findIndex((s) => s.key === step);

  const handleFileUpload = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('confirm');
    }, 2000);
  };

  const handleSendCode = () => {
    if (!phone || phone.length !== 11) return;
    setCountdown(60);
    setCode('888888');
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) clearInterval(timer);
        return c - 1;
      });
    }, 1000);
  };

  const handleVerify = () => {
    if (code.length !== 6) return;
    setVerifyStatus('verifying');
    setTimeout(() => {
      setVerifyStatus('success');
      setTimeout(() => {
        setStep('result');
      }, 800);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="card p-8 mb-8">
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i <= currentIndex;
            const isCompleted = i < currentIndex;
            return (
              <div key={s.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted
                        ? 'bg-spruce-500 border-spruce-500 text-white'
                        : isActive
                          ? 'bg-terracotta-50 border-terracotta-500 text-terracotta-500'
                          : 'bg-white border-ash-200 text-ash-300'
                    }`}
                  >
                    {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${
                      isActive ? 'text-ash-700' : 'text-ash-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      i < currentIndex ? 'bg-spruce-500' : 'bg-ash-100'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {step === 'ocr' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-serif text-xl font-semibold text-ash-700 mb-2">
                上传营业执照
              </h3>
              <p className="text-sm text-ash-500">
                请上传清晰的营业执照正本或副本照片，系统将通过OCR自动识别企业信息。
              </p>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFileUpload();
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-terracotta-500 bg-terracotta-50'
                  : 'border-ash-200 hover:border-terracotta-400 hover:bg-ash-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              {isProcessing ? (
                <div className="space-y-4">
                  <Loader2 size={48} className="mx-auto text-terracotta-500 animate-spin" />
                  <p className="text-ash-700 font-medium">正在OCR识别中...</p>
                  <p className="text-sm text-ash-500">请稍候，系统正在识别营业执照信息</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-terracotta-50 flex items-center justify-center">
                    <Upload size={28} className="text-terracotta-500" />
                  </div>
                  <div>
                    <p className="text-ash-700 font-medium">
                      点击上传或将文件拖拽到此处
                    </p>
                    <p className="text-sm text-ash-500 mt-1">
                      支持 JPG、PNG 格式，文件大小不超过 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-serif text-xl font-semibold text-ash-700 mb-2">
                确认企业信息
              </h3>
              <p className="text-sm text-ash-500">
                OCR已识别到以下信息，请确认是否正确。如有错误可手动修改。
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ash-600 mb-1.5">
                    企业名称
                  </label>
                  <input
                    type="text"
                    defaultValue={cert.companyName}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ash-600 mb-1.5">
                    统一社会信用代码
                  </label>
                  <input
                    type="text"
                    defaultValue={cert.creditCode}
                    className="input-field font-mono text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ash-600 mb-1.5">
                    法定代表人
                  </label>
                  <input
                    type="text"
                    defaultValue={cert.legalPerson}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ash-600 mb-1.5">
                    注册地址
                  </label>
                  <input
                    type="text"
                    defaultValue="云南省昆明市五华区高新区**大厦"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-4 bg-spruce-50 rounded-lg">
                <ShieldCheck size={20} className="text-spruce-500 flex-shrink-0" />
                <p className="text-sm text-spruce-700">
                  OCR识别置信度：<span className="font-semibold">96.5%</span>，信息已自动校验通过
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setStep('ocr')} className="btn-secondary flex-1">
                重新上传
              </button>
              <button onClick={() => setStep('verify')} className="btn-primary flex-1">
                信息确认无误，下一步
              </button>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-serif text-xl font-semibold text-ash-700 mb-2">
                法人手机号实名绑定
              </h3>
              <p className="text-sm text-ash-500">
                请输入法定代表人的手机号，我们将发送验证码完成实名绑定。
              </p>
            </div>

            <div className="p-6 bg-ash-50 rounded-xl space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-terracotta-100 flex items-center justify-center">
                  <span className="text-terracotta-600 font-bold">{cert.legalPerson[0]}</span>
                </div>
                <div>
                  <p className="font-medium text-ash-700">法定代表人</p>
                  <p className="text-ash-500">{cert.legalPerson}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ash-600 mb-1.5">
                  法人手机号
                </label>
                <div className="relative">
                  <Smartphone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ash-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="请输入法人手机号"
                    className="input-field pl-11"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ash-600 mb-1.5">
                  短信验证码
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="请输入6位验证码"
                    className="input-field flex-1"
                  />
                  <button
                    onClick={handleSendCode}
                    disabled={countdown > 0 || phone.length !== 11}
                    className="btn-secondary whitespace-nowrap disabled:opacity-50"
                  >
                    {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
                  </button>
                </div>
                {countdown > 0 && (
                  <p className="text-xs text-spruce-600 mt-2 flex items-center gap-1">
                    <Check size={12} />
                    验证码已发送至法人手机（演示验证码：888888）
                  </p>
                )}
              </div>

              <div className="flex items-start gap-2 text-sm text-ash-500">
                <ShieldCheck size={16} className="text-spruce-500 mt-0.5 flex-shrink-0" />
                <p>您的手机号仅用于实名验证，我们将严格保护您的隐私，不会用于其他商业用途。</p>
              </div>
            </div>

            {verifyStatus === 'verifying' && (
              <div className="p-4 bg-sand-50 rounded-xl flex items-center gap-3">
                <Loader2 size={20} className="text-sand-500 animate-spin" />
                <p className="text-sm text-sand-700 font-medium">正在验证中，请稍候...</p>
              </div>
            )}

            {verifyStatus === 'success' && (
              <div className="p-4 bg-spruce-50 rounded-xl flex items-center gap-3">
                <Check size={20} className="text-spruce-500" />
                <p className="text-sm text-spruce-700 font-medium">法人实名绑定成功！正在跳转认证结果...</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep('confirm')}
                className="btn-secondary flex-1"
                disabled={verifyStatus === 'verifying'}
              >
                上一步
              </button>
              <button
                onClick={handleVerify}
                disabled={phone.length !== 11 || code.length !== 6 || verifyStatus === 'verifying' || verifyStatus === 'success'}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                完成实名认证
              </button>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="text-center py-12 space-y-6">
            {cert.status === 'approved' ? (
              <>
                <div className="w-20 h-20 mx-auto rounded-full bg-spruce-100 flex items-center justify-center">
                  <ShieldCheck size={48} className="text-spruce-500" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-ash-700">
                    企业认证已通过
                  </h3>
                  <p className="text-ash-500 mt-2">
                    您的企业认证已成功通过审核，现在可以发布职位开始招聘了。
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-spruce-50 rounded-full">
                    <Check size={16} className="text-spruce-500" />
                    <span className="text-sm text-spruce-700 font-medium">营业执照核验通过</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-spruce-50 rounded-full">
                    <Check size={16} className="text-spruce-500" />
                    <span className="text-sm text-spruce-700 font-medium">法人实名绑定成功</span>
                  </div>
                </div>

                <div className="mt-6 p-6 bg-ash-50 rounded-xl text-left max-w-lg mx-auto space-y-3">
                  <h4 className="font-medium text-ash-700 mb-3">认证信息摘要</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-ash-500">企业名称</span>
                      <p className="text-ash-700 font-medium">{cert.companyName}</p>
                    </div>
                    <div>
                      <span className="text-ash-500">统一社会信用代码</span>
                      <p className="text-ash-700 font-mono text-xs">{cert.creditCode}</p>
                    </div>
                    <div>
                      <span className="text-ash-500">法定代表人</span>
                      <p className="text-ash-700 font-medium">{cert.legalPerson}</p>
                    </div>
                    <div>
                      <span className="text-ash-500">认证时间</span>
                      <p className="text-ash-700 font-medium">{cert.createdAt}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center mt-8">
                  <button onClick={() => navigate('/enterprise/jobs')} className="btn-primary flex items-center gap-2">
                    <Briefcase size={18} />
                    前往发布职位
                  </button>
                  <button onClick={() => navigate('/enterprise/jobs/create')} className="btn-outline flex items-center gap-2">
                    立即发布新职位
                  </button>
                </div>
              </>
            ) : cert.status === 'rejected' ? (
              <>
                <div className="w-20 h-20 mx-auto rounded-full bg-terracotta-100 flex items-center justify-center">
                  <X size={48} className="text-terracotta-500" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-ash-700">
                    认证未通过
                  </h3>
                  <p className="text-ash-500 mt-2">
                    您的认证资料存在问题，请修改后重新提交。
                  </p>
                </div>
                <div className="p-4 bg-terracotta-50 rounded-xl text-left max-w-lg mx-auto">
                  <p className="text-sm text-terracotta-700 font-medium">未通过原因：</p>
                  <p className="text-sm text-terracotta-600 mt-1">{cert.rejectReason || '营业执照信息与工商注册信息不一致，请核实后重新提交。'}</p>
                </div>
                <button onClick={() => { setStep('ocr'); setVerifyStatus('idle'); }} className="btn-primary mt-4">
                  重新提交认证
                </button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto rounded-full bg-sand-100 flex items-center justify-center">
                  <Loader2 size={48} className="text-sand-500 animate-spin" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-ash-700">
                    认证审核中
                  </h3>
                  <p className="text-ash-500 mt-2">
                    您的认证资料正在审核中，预计1-2个工作日完成审核。
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
