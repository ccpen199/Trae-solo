import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, FileText, Upload, Clock, Bell, Star,
  ChevronRight, ChevronLeft, CheckCircle, AlertCircle,
} from 'lucide-react';
import { useServiceStore } from '@/stores/serviceStore';
import StepBooking from './apply/StepBooking';
import StepApplication from './apply/StepApplication';
import StepUpload from './apply/StepUpload';
import StepTracking from './apply/StepTracking';
import StepResult from './apply/StepResult';
import StepRating from './apply/StepRating';

const stepConfig = [
  { name: '预约', icon: Calendar },
  { name: '申办', icon: FileText },
  { name: '材料上传', icon: Upload },
  { name: '进度追踪', icon: Clock },
  { name: '结果推送', icon: Bell },
  { name: '服务评价', icon: Star },
];

const stepSubtitles = [
  '选择办理时间与地点',
  '填写申请信息',
  '上传所需材料',
  '查看办理进度',
  '查看审批结果',
  '对本次服务评价',
];

export default function Apply() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const getServiceById = useServiceStore((s) => s.getServiceById);
  const service = serviceId ? getServiceById(serviceId) : undefined;

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    date: '',
    timeSlot: '',
    location: '',
    name: '',
    phone: '',
    idCard: '',
    reason: '',
    uploadedDocs: [] as string[],
    rating: 0,
    ratingTags: [] as string[],
    comment: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gov-text-secondary opacity-40" />
        <h2 className="text-xl font-semibold text-gov-text mb-2">服务未找到</h2>
        <p className="text-gov-text-secondary mb-6">请检查服务地址是否正确</p>
        <Link to="/services" className="gov-btn-primary inline-block">返回服务大厅</Link>
      </div>
    );
  }

  const updateForm = (update: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...update }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!formData.date) newErrors.date = '请选择预约日期';
      if (!formData.timeSlot) newErrors.timeSlot = '请选择时段';
      if (!formData.location) newErrors.location = '请选择办理地点';
    } else if (step === 1) {
      if (!formData.name.trim()) newErrors.name = '请输入姓名';
      if (!formData.phone.trim()) newErrors.phone = '请输入联系电话';
      else if (!/^1\d{10}$/.test(formData.phone)) newErrors.phone = '请输入有效手机号';
      if (!formData.idCard.trim()) newErrors.idCard = '请输入证件号码';
      if (!formData.reason.trim()) newErrors.reason = '请输入办理事由';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep <= 1 && !validateStep(currentStep)) return;
    setCurrentStep((prev) => Math.min(prev + 1, stepConfig.length - 1));
  };

  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 py-6"
    >
      <nav className="flex items-center gap-1.5 text-sm text-gov-text-secondary mb-6">
        <Link to="/" className="hover:text-gov-blue transition-colors">首页</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/services" className="hover:text-gov-blue transition-colors">服务大厅</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gov-text font-medium">{service.name}</span>
      </nav>

      <div className="gov-card p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between">
          {stepConfig.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === stepConfig.length - 1;
            return (
              <div key={step.name} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${
                      i < currentStep
                        ? 'bg-gov-blue text-white'
                        : i === currentStep
                        ? 'bg-gov-blue text-white ring-4 ring-gov-blue/20'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {i < currentStep ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs mt-1.5 ${
                      i <= currentStep ? 'text-gov-blue font-medium' : 'text-gray-400'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={`w-4 sm:w-10 h-0.5 mx-0.5 sm:mx-1 mt-[-16px] ${
                      i < currentStep ? 'bg-gov-blue' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="gov-card p-6 mb-6">
        <h2 className="text-base font-bold text-gov-text mb-4">
          {stepConfig[currentStep].name} - {stepSubtitles[currentStep]}
        </h2>

        {currentStep === 0 && (
          <StepBooking
            date={formData.date}
            timeSlot={formData.timeSlot}
            location={formData.location}
            errors={errors}
            onUpdate={updateForm}
          />
        )}
        {currentStep === 1 && (
          <StepApplication
            name={formData.name}
            phone={formData.phone}
            idCard={formData.idCard}
            reason={formData.reason}
            errors={errors}
            onUpdate={updateForm}
          />
        )}
        {currentStep === 2 && (
          <StepUpload
            service={service}
            uploadedDocs={formData.uploadedDocs}
            onUpdate={(docs) => updateForm({ uploadedDocs: docs })}
          />
        )}
        {currentStep === 3 && <StepTracking />}
        {currentStep === 4 && <StepResult />}
        {currentStep === 5 && (
          <StepRating
            rating={formData.rating}
            ratingTags={formData.ratingTags}
            comment={formData.comment}
            onUpdate={updateForm}
            onSubmit={() => {}}
          />
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="gov-btn-secondary flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          上一步
        </button>
        {currentStep < stepConfig.length - 1 ? (
          <button onClick={handleNext} className="gov-btn-primary flex items-center gap-1">
            下一步
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => navigate('/profile')} className="gov-btn-primary flex items-center gap-1">
            完成并返回
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
