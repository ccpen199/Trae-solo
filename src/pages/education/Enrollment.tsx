import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  IdCard,
  School as SchoolIcon,
  Upload,
  CheckCircle,
  FileText,
  Calendar,
  MapPin,
  Phone,
  Home,
  AlertCircle,
  ChevronRight,
  Plus,
  X,
  Check,
  Clock,
  Info
} from 'lucide-react';
import { api } from '@/api/client';
import type { School, EnrollmentApplication } from '../../../shared/types';
import { cn } from '@/lib/utils';

const steps = [
  { id: 1, name: '基本信息', icon: User },
  { id: 2, name: '子女信息', icon: IdCard },
  { id: 3, name: '材料上传', icon: Upload },
  { id: 4, name: '确认提交', icon: CheckCircle },
];

const enrollmentStatusMap: Record<string, { name: string; color: string; bgColor: string }> = {
  pending: { name: '待审核', color: 'text-warm-600', bgColor: 'bg-warm-100' },
  reviewing: { name: '审核中', color: 'text-primary-600', bgColor: 'bg-primary-100' },
  approved: { name: '已通过', color: 'text-eco-600', bgColor: 'bg-eco-100' },
  rejected: { name: '已驳回', color: 'text-red-600', bgColor: 'bg-red-100' },
};

interface FormData {
  parentName: string;
  parentIdCard: string;
  parentPhone: string;
  address: string;
  childName: string;
  childIdCard: string;
  childBirthDate: string;
  gender: 'male' | 'female' | '';
  schoolId: string;
  documents: {
    householdRegister: File | null;
    propertyProof: File | null;
    socialSecurity: File | null;
    vaccination: File | null;
  };
}

const initialFormData: FormData = {
  parentName: '',
  parentIdCard: '',
  parentPhone: '',
  address: '',
  childName: '',
  childIdCard: '',
  childBirthDate: '',
  gender: '',
  schoolId: '',
  documents: {
    householdRegister: null,
    propertyProof: null,
    socialSecurity: null,
    vaccination: null,
  },
};

export default function Enrollment() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [schools, setSchools] = useState<School[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentApplication[]>([]);
  const [guidelines, setGuidelines] = useState<{
    title: string;
    content: string;
    timeline: Array<{ date: string; event: string }>;
    requiredDocuments: string[];
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<{
    applicationId: string;
    estimatedReviewDate: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'records'>('form');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [schoolsData, enrollmentsData, guidelinesData] = await Promise.all([
        api.education.getSchools('primary'),
        api.education.getEnrollments(),
        api.education.getEnrollmentGuidelines(),
      ]);
      setSchools(Array.isArray(schoolsData) ? schoolsData : []);
      setEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : []);
      setGuidelines(guidelinesData as any);
    } catch (e) {
      console.error('Failed to load enrollment data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.parentName.trim()) newErrors.parentName = '请输入监护人姓名';
      if (!formData.parentIdCard.trim()) {
        newErrors.parentIdCard = '请输入监护人身份证号';
      } else if (!/^\d{17}[\dXx]$/.test(formData.parentIdCard)) {
        newErrors.parentIdCard = '身份证号格式不正确';
      }
      if (!formData.parentPhone.trim()) {
        newErrors.parentPhone = '请输入联系电话';
      } else if (!/^1[3-9]\d{9}$/.test(formData.parentPhone)) {
        newErrors.parentPhone = '手机号格式不正确';
      }
      if (!formData.address.trim()) newErrors.address = '请输入家庭住址';
    }

    if (step === 2) {
      if (!formData.childName.trim()) newErrors.childName = '请输入子女姓名';
      if (!formData.childIdCard.trim()) {
        newErrors.childIdCard = '请输入子女身份证号';
      } else if (!/^\d{17}[\dXx]$/.test(formData.childIdCard)) {
        newErrors.childIdCard = '身份证号格式不正确';
      }
      if (!formData.childBirthDate) newErrors.childBirthDate = '请选择出生日期';
      if (!formData.gender) newErrors.gender = '请选择性别';
      if (!formData.schoolId) newErrors.schoolId = '请选择报名学校';
    }

    if (step === 3) {
      if (!formData.documents.householdRegister) newErrors.householdRegister = '请上传户口本';
      if (!formData.documents.propertyProof) newErrors.propertyProof = '请上传房产证明';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const submitData = {
        userId: 'user-001',
        childName: formData.childName,
        childIdCard: formData.childIdCard,
        schoolId: formData.schoolId,
        address: formData.address,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        parentIdCard: formData.parentIdCard,
        documents: {
          householdRegister: formData.documents.householdRegister?.name || '',
          propertyProof: formData.documents.propertyProof?.name || '',
          socialSecurity: formData.documents.socialSecurity?.name || '',
        },
      };
      const result = await api.education.submitEnrollment(submitData);
      setSubmitSuccess(result as any);
      await loadData();
    } catch (e) {
      console.error('Failed to submit enrollment:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (field: keyof FormData['documents'], file: File | null) => {
    setFormData({
      ...formData,
      documents: {
        ...formData.documents,
        [field]: file,
      },
    });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setSubmitSuccess(null);
    setErrors({});
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300',
                step.id < currentStep
                  ? 'bg-eco-500 text-white'
                  : step.id === currentStep
                  ? 'bg-primary-500 text-white shadow-glow scale-110'
                  : 'bg-gray-200 text-gray-400'
              )}
            >
              {step.id < currentStep ? (
                <Check className="w-6 h-6" />
              ) : (
                <step.icon className="w-6 h-6" />
              )}
            </div>
            <span
              className={cn(
                'mt-2 text-sm font-medium transition-colors',
                step.id <= currentStep ? 'text-primary-600' : 'text-gray-400'
              )}
            >
              {step.name}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'w-16 lg:w-24 h-1 mx-2 rounded transition-colors duration-300',
                step.id < currentStep ? 'bg-eco-500' : 'bg-gray-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <User className="w-5 h-5 text-primary-500" />
        监护人基本信息
      </h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            监护人姓名 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.parentName}
              onChange={(e) => handleInputChange('parentName', e.target.value)}
              placeholder="请输入监护人姓名"
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                errors.parentName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'
              )}
            />
          </div>
          {errors.parentName && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.parentName}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            身份证号 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.parentIdCard}
              onChange={(e) => handleInputChange('parentIdCard', e.target.value)}
              placeholder="请输入18位身份证号"
              maxLength={18}
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                errors.parentIdCard ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'
              )}
            />
          </div>
          {errors.parentIdCard && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.parentIdCard}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            联系电话 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={formData.parentPhone}
              onChange={(e) => handleInputChange('parentPhone', e.target.value)}
              placeholder="请输入11位手机号"
              maxLength={11}
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                errors.parentPhone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'
              )}
            />
          </div>
          {errors.parentPhone && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.parentPhone}
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            家庭住址 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Home className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="请输入详细家庭住址"
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                errors.address ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'
              )}
            />
          </div>
          {errors.address && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.address}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <IdCard className="w-5 h-5 text-primary-500" />
        子女信息
      </h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            子女姓名 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.childName}
              onChange={(e) => handleInputChange('childName', e.target.value)}
              placeholder="请输入子女姓名"
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                errors.childName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'
              )}
            />
          </div>
          {errors.childName && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.childName}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            身份证号 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.childIdCard}
              onChange={(e) => handleInputChange('childIdCard', e.target.value)}
              placeholder="请输入18位身份证号"
              maxLength={18}
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                errors.childIdCard ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'
              )}
            />
          </div>
          {errors.childIdCard && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.childIdCard}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            出生日期 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={formData.childBirthDate}
              onChange={(e) => handleInputChange('childBirthDate', e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                errors.childBirthDate ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'
              )}
            />
          </div>
          {errors.childBirthDate && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.childBirthDate}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            性别 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleInputChange('gender', 'male')}
              className={cn(
                'flex-1 py-3 rounded-xl border-2 font-medium transition-all',
                formData.gender === 'male'
                  ? 'border-primary-500 bg-primary-50 text-primary-600'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              )}
            >
              男孩
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('gender', 'female')}
              className={cn(
                'flex-1 py-3 rounded-xl border-2 font-medium transition-all',
                formData.gender === 'female'
                  ? 'border-primary-500 bg-primary-50 text-primary-600'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              )}
            >
              女孩
            </button>
          </div>
          {errors.gender && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.gender}
            </p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择学校 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <SchoolIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={formData.schoolId}
              onChange={(e) => handleInputChange('schoolId', e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20 appearance-none bg-white',
                errors.schoolId ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-primary-500'
              )}
            >
              <option value="">请选择报名学校</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name} - {school.address}
                </option>
              ))}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none rotate-90" />
          </div>
          {errors.schoolId && (
            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.schoolId}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const fileFields = [
      { key: 'householdRegister', name: '户口本', required: true, desc: '父母及子女户口本页扫描件' },
      { key: 'propertyProof', name: '房产证明', required: true, desc: '房产证或购房合同扫描件' },
      { key: 'socialSecurity', name: '社保证明', required: false, desc: '近一年社保缴费证明（非本市户籍需提供）' },
      { key: 'vaccination', name: '预防接种证', required: false, desc: '儿童预防接种证扫描件' },
    ];

    return (
      <div className="space-y-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary-500" />
          材料上传
        </h3>
        <div className="bg-warm-50 border border-warm-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-warm-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-warm-700">
            <p className="font-medium">上传须知</p>
            <p className="mt-1">请上传清晰的扫描件或照片，支持 JPG、PNG、PDF 格式，单个文件不超过 10MB</p>
          </div>
        </div>
        <div className="grid gap-6">
          {fileFields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.name} {field.required && <span className="text-red-500">*</span>}
              </label>
              <p className="text-xs text-gray-500 mb-2">{field.desc}</p>
              {formData.documents[field.key as keyof FormData['documents']] ? (
                <div className="flex items-center justify-between p-4 bg-eco-50 border border-eco-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-eco-100 flex items-center justify-center text-eco-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {formData.documents[field.key as keyof FormData['documents']]?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(formData.documents[field.key as keyof FormData['documents']]?.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-eco-500" />
                    <button
                      type="button"
                      onClick={() => handleFileChange(field.key as keyof FormData['documents'], null)}
                      className="p-1 hover:bg-eco-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 transition-all">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">点击或拖拽文件到此处上传</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      handleFileChange(field.key as keyof FormData['documents'], file);
                    }}
                  />
                </label>
              )}
              {errors[field.key] && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors[field.key]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    const selectedSchool = schools.find((s) => s.id === formData.schoolId);

    return (
      <div className="space-y-6 animate-fade-in">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary-500" />
          确认报名信息
        </h3>
        <div className="bg-gray-50 rounded-xl p-6 space-y-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary-500" />
              监护人信息
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">姓名</span>
                <span className="font-medium text-gray-800">{formData.parentName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">身份证号</span>
                <span className="font-medium text-gray-800">{formData.parentIdCard}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">联系电话</span>
                <span className="font-medium text-gray-800">{formData.parentPhone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 md:col-span-2">
                <span className="text-gray-500">家庭住址</span>
                <span className="font-medium text-gray-800">{formData.address}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
              <IdCard className="w-4 h-4 text-primary-500" />
              子女信息
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">姓名</span>
                <span className="font-medium text-gray-800">{formData.childName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">身份证号</span>
                <span className="font-medium text-gray-800">{formData.childIdCard}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">出生日期</span>
                <span className="font-medium text-gray-800">{formData.childBirthDate}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">性别</span>
                <span className="font-medium text-gray-800">{formData.gender === 'male' ? '男孩' : '女孩'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200 md:col-span-2">
                <span className="text-gray-500">报名学校</span>
                <span className="font-medium text-primary-600">{selectedSchool?.name}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-500" />
              已上传材料
            </h4>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              {Object.entries(formData.documents).map(([key, file]) => (
                file && (
                  <div key={key} className="flex items-center gap-2 py-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-eco-500" />
                    <span>{key === 'householdRegister' ? '户口本' : key === 'propertyProof' ? '房产证明' : key === 'socialSecurity' ? '社保证明' : '预防接种证'}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <span className="text-sm text-primary-700">
              我已阅读并同意《南宁市小学入学报名须知》和《个人信息保护声明》，承诺所填信息真实有效，如有虚假，愿承担相应法律责任。
            </span>
          </label>
        </div>
      </div>
    );
  };

  const renderSuccess = () => (
    <div className="text-center py-12 animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-eco-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-eco-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2">报名提交成功！</h3>
      <p className="text-gray-500 mb-6">您的入学报名申请已成功提交，请耐心等待审核</p>
      <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto text-left">
        <div className="flex justify-between py-3 border-b border-gray-200">
          <span className="text-gray-500">申请编号</span>
          <span className="font-mono font-medium text-primary-600">{submitSuccess?.applicationId}</span>
        </div>
        <div className="flex justify-between py-3 border-b border-gray-200">
          <span className="text-gray-500">学生姓名</span>
          <span className="font-medium text-gray-800">{formData.childName}</span>
        </div>
        <div className="flex justify-between py-3 border-b border-gray-200">
          <span className="text-gray-500">报名学校</span>
          <span className="font-medium text-gray-800">{schools.find((s) => s.id === formData.schoolId)?.name}</span>
        </div>
        <div className="flex justify-between py-3">
          <span className="text-gray-500">预计审核日期</span>
          <span className="font-medium text-warm-600">{submitSuccess?.estimatedReviewDate} 前</span>
        </div>
      </div>
      <div className="flex gap-4 justify-center mt-8">
        <button
          onClick={resetForm}
          className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          继续报名
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
        >
          查看报名记录
        </button>
      </div>
    </div>
  );

  const renderRecords = () => (
    <div className="space-y-6 animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary-500" />
        我的报名记录
      </h3>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : enrollments.length > 0 ? (
        <div className="space-y-4">
          {enrollments.map((record) => {
            const school = schools.find((s) => s.id === record.schoolId);
            const status = enrollmentStatusMap[record.status];
            return (
              <div
                key={record.id}
                className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-800">{record.childName}</h4>
                    <p className="text-sm text-gray-500 mt-1">{school?.name}</p>
                  </div>
                  <span className={cn('px-3 py-1 rounded-full text-sm font-medium', status.bgColor, status.color)}>
                    {status.name}
                  </span>
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">身份证号</span>
                    <p className="font-medium text-gray-800 mt-1">{record.childIdCard}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">申请编号</span>
                    <p className="font-mono text-gray-800 mt-1">{record.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">申请时间</span>
                    <p className="text-gray-800 mt-1">{new Date(record.createdAt).toLocaleDateString('zh-CN')}</p>
                  </div>
                </div>
                {record.reviewComment && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <span className="text-gray-500">审核意见：</span>
                    <span className="text-gray-700">{record.reviewComment}</span>
                  </div>
                )}
                <div className="flex gap-3 mt-4">
                  <button className="px-4 py-2 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors">
                    查看详情
                  </button>
                  {record.status === 'pending' && (
                    <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                      撤销申请
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-2">暂无报名记录</p>
          <p className="text-sm text-gray-400">点击"新建报名"开始您的第一次报名</p>
        </div>
      )}
    </div>
  );

  const renderGuidelines = () => (
    <div className="bg-white rounded-2xl p-6 shadow-card">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4">
        <Info className="w-5 h-5 text-primary-500" />
        报名指南
      </h3>
      {guidelines && (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">报名条件</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{guidelines.content}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-3">时间安排</h4>
            <div className="space-y-2">
              {guidelines.timeline.map((item, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary-500" />
                  <span className="text-primary-600 font-medium w-28">{item.date}</span>
                  <span className="text-gray-600">{item.event}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-3">所需材料</h4>
            <div className="grid grid-cols-2 gap-2">
              {guidelines.requiredDocuments.map((doc, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-eco-500" />
                  {doc}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/education')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">小学入学报名</h1>
          <p className="text-gray-500 mt-1">填写信息，上传材料，完成入学报名</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setActiveTab('form'); if (submitSuccess) resetForm(); }}
          className={cn(
            'px-6 py-2 rounded-xl font-medium transition-all',
            activeTab === 'form'
              ? 'bg-primary-500 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-50 shadow-card'
          )}
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建报名
          </span>
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={cn(
            'px-6 py-2 rounded-xl font-medium transition-all',
            activeTab === 'records'
              ? 'bg-primary-500 text-white shadow-lg'
              : 'bg-white text-gray-600 hover:bg-gray-50 shadow-card'
          )}
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            报名记录
            {enrollments.length > 0 && (
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {enrollments.length}
              </span>
            )}
          </span>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'form' ? (
            <div className="bg-white rounded-2xl p-6 shadow-card">
              {submitSuccess ? (
                renderSuccess()
              ) : (
                <>
                  {renderStepIndicator()}
                  <div className="min-h-96">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}
                  </div>
                  <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                    <button
                      onClick={handlePrev}
                      disabled={currentStep === 1}
                      className={cn(
                        'px-6 py-3 rounded-xl font-medium transition-colors',
                        currentStep === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      上一步
                    </button>
                    {currentStep < 4 ? (
                      <button
                        onClick={handleNext}
                        className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-lg hover:shadow-glow"
                      >
                        下一步
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg hover:shadow-glow disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            提交中...
                          </span>
                        ) : '提交报名'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-card">
              {renderRecords()}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {renderGuidelines()}

          <div className="bg-gradient-to-br from-warm-500 to-warm-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5" />
              <h3 className="font-semibold">温馨提示</h3>
            </div>
            <ul className="space-y-2 text-sm text-warm-100">
              <li className="flex items-start gap-2">
                <span className="text-warm-300">•</span>
                请在规定时间内完成报名，逾期不予受理
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warm-300">•</span>
                确保所填信息真实有效，虚假信息将取消报名资格
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warm-300">•</span>
                审核结果将通过短信通知，请保持手机畅通
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warm-300">•</span>
                如有疑问，请拨打服务热线：0771-12345
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
