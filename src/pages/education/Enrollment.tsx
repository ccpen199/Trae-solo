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
  Info,
  Search,
  Building2,
  XCircle,
  Star
} from 'lucide-react';
import { api } from '@/api/client';
import type { School, EnrollmentApplication, SchoolDistrictResult } from '../../../shared/types';
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
    birthCertificate: File | null;
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
    birthCertificate: null,
  },
};

type Tab = 'district' | 'form' | 'records' | 'guide';

const hotSchools = [
  { id: 's001', name: '南宁市滨湖路小学', address: '青秀区滨湖路66号', district: '青秀区', keyword: '滨湖路' },
  { id: 's002', name: '南宁市天桃实验学校', address: '青秀区教育路2号', district: '青秀区', keyword: '天桃' },
  { id: 's003', name: '南宁市民主路小学', address: '青秀区民主路19号', district: '青秀区', keyword: '民主路' },
  { id: 's004', name: '南宁市秀田小学', address: '西乡塘区友爱北路30号', district: '西乡塘区', keyword: '秀田' },
];

export default function Enrollment() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('district');
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
  const [selectedRecord, setSelectedRecord] = useState<EnrollmentApplication | null>(null);

  const [districtAddress, setDistrictAddress] = useState('');
  const [districtResult, setDistrictResult] = useState<SchoolDistrictResult | null>(null);
  const [districtSearching, setDistrictSearching] = useState(false);

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

  const handleDistrictSearch = async () => {
    if (!districtAddress.trim()) return;
    setDistrictSearching(true);
    try {
      const data = await api.education.getSchoolByAddress(districtAddress);
      setDistrictResult(data as SchoolDistrictResult);
    } catch (e) {
      console.error('Failed to search district:', e);
    } finally {
      setDistrictSearching(false);
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
          vaccination: formData.documents.vaccination?.name || '',
          birthCertificate: formData.documents.birthCertificate?.name || '',
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

  const handleUseDistrictResult = () => {
    if (districtResult) {
      handleInputChange('address', districtAddress);
      handleInputChange('schoolId', districtResult.schoolId);
      setActiveTab('form');
    }
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

  const renderDistrictSearch = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary-500" />
          学区查询
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          输入您的家庭住址，系统将为您匹配对应的学区学校
        </p>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={districtAddress}
              onChange={(e) => setDistrictAddress(e.target.value)}
              placeholder="请输入家庭详细住址，如：南宁市青秀区滨湖路66号"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              onKeyPress={(e) => e.key === 'Enter' && handleDistrictSearch()}
            />
          </div>
          <button
            onClick={handleDistrictSearch}
            disabled={districtSearching || !districtAddress.trim()}
            className={cn(
              'px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2',
              districtSearching || !districtAddress.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg hover:shadow-glow'
            )}
          >
            {districtSearching ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                查询中
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                查询学区
              </>
            )}
          </button>
        </div>
      </div>

      {districtResult && (
        <div className="bg-white rounded-2xl p-6 shadow-card animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
              <SchoolIcon className="w-8 h-8 text-primary-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-800 mb-2">{districtResult.schoolName}</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{districtResult.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span>{districtResult.district}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-warm-500" />
                  <span>距离约 {districtResult.distance} 公里</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span>今年招生名额：{districtResult.enrollmentQuota} 人</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleUseDistrictResult}
              className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg hover:shadow-glow"
            >
              使用此学校报名
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              查看报名指南
            </button>
          </div>
        </div>
      )}

      {!districtResult && !districtSearching && (
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <Star className="w-4 h-4 text-warm-500" />
              热门学区推荐
            </h4>
            <span className="text-xs text-gray-400">点击快速查询</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {hotSchools.map(school => (
              <button
                key={school.id}
                onClick={() => { setDistrictAddress(school.keyword); handleDistrictSearch(); }}
                className="p-4 rounded-xl bg-gray-50 hover:bg-primary-50 text-left transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
                    <SchoolIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{school.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {school.district}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              输入您的家庭住址，精准匹配所属学区
            </p>
          </div>
        </div>
      )}
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
      { key: 'birthCertificate', name: '出生医学证明', required: false, desc: '儿童出生医学证明扫描件' },
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
                    <span>
                      {key === 'householdRegister' ? '户口本' : 
                       key === 'propertyProof' ? '房产证明' : 
                       key === 'socialSecurity' ? '社保证明' : 
                       key === 'vaccination' ? '预防接种证' :
                       key === 'birthCertificate' ? '出生医学证明' : key}
                    </span>
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
    <div className="space-y-4 animate-fade-in">
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 shadow-card text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : enrollments.length > 0 ? (
        enrollments.map((record) => {
          const school = schools.find((s) => s.id === record.schoolId);
          const status = enrollmentStatusMap[record.status];
          return (
            <div
              key={record.id}
              className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer"
              onClick={() => setSelectedRecord(record)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{record.childName}</h4>
                    <p className="text-sm text-gray-500 mt-1">{school?.name}</p>
                  </div>
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
        })
      ) : (
        <div className="bg-white rounded-2xl p-12 shadow-card text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-2">暂无报名记录</p>
          <p className="text-sm text-gray-400 mb-6">点击"立即报名"开始您的第一次报名</p>
          <button
            onClick={() => setActiveTab('form')}
            className="px-6 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
          >
            立即报名
          </button>
        </div>
      )}

      {selectedRecord && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-slide-up max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary-500 to-primary-600 text-white sticky top-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">报名详情</h3>
                  <p className="text-sm text-primary-100 mt-1">{selectedRecord.id}</p>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">审核状态</span>
                <span className={cn('px-3 py-1 rounded-full text-sm font-medium', enrollmentStatusMap[selectedRecord.status].bgColor, enrollmentStatusMap[selectedRecord.status].color)}>
                  {enrollmentStatusMap[selectedRecord.status].name}
                </span>
              </div>

              <div className="py-2">
                <span className="text-gray-500 block mb-3 text-sm">审核进度</span>
                <div className="relative">
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />
                  <div className="space-y-4">
                    {[
                      { key: 'submitted', label: '提交申请', desc: '报名信息已提交', done: true },
                      { key: 'pending', label: '材料初审', desc: '审核员核验提交材料', done: selectedRecord.status !== 'pending' },
                      { key: 'reviewing', label: '资格复核', desc: '教育局复核入学资格', done: selectedRecord.status === 'approved' || selectedRecord.status === 'rejected' },
                      { key: 'result', label: '结果公布', desc: '公布录取/审核结果', done: selectedRecord.status === 'approved' || selectedRecord.status === 'rejected' },
                    ].map((step, i) => (
                      <div key={step.key} className="flex items-center gap-4 relative">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0',
                          step.done ? 'bg-eco-500 text-white' : 'bg-gray-200 text-gray-400'
                        )}>
                          {step.done ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-medium">{i + 1}</span>}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className={cn('text-sm font-medium', step.done ? 'text-gray-800' : 'text-gray-400')}>
                            {step.label}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between py-2 border-t border-gray-100">
                <span className="text-gray-500">学生姓名</span>
                <span className="font-medium text-gray-800">{selectedRecord.childName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">身份证号</span>
                <span className="font-medium text-gray-800">{selectedRecord.childIdCard}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">报名学校</span>
                <span className="font-medium text-gray-800">{schools.find(s => s.id === selectedRecord.schoolId)?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">申请时间</span>
                <span className="font-medium text-gray-800">{new Date(selectedRecord.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              {selectedRecord.reviewComment && (
                <div className="py-2">
                  <span className="text-gray-500 block mb-2">审核意见</span>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                    {selectedRecord.reviewComment}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50">
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderGuide = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
          <Info className="w-5 h-5 text-primary-500" />
          报名指南
        </h3>
        {guidelines && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">报名条件</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{guidelines.content}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-4">时间安排</h4>
              <div className="relative">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-primary-200" />
                <div className="space-y-4">
                  {guidelines.timeline.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 relative">
                      <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-medium z-10">
                        {index + 1}
                      </div>
                      <div className="flex-1 bg-primary-50 rounded-xl p-4">
                        <span className="text-primary-600 font-medium">{item.date}</span>
                        <span className="text-gray-600 ml-3">{item.event}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-3">所需材料</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {guidelines.requiredDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-eco-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-warm-500 to-warm-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5" />
          <h3 className="font-semibold text-lg">温馨提示</h3>
        </div>
        <ul className="space-y-3 text-sm text-warm-100">
          <li className="flex items-start gap-2">
            <span className="text-warm-300 mt-0.5">•</span>
            请在规定时间内完成报名，逾期不予受理
          </li>
          <li className="flex items-start gap-2">
            <span className="text-warm-300 mt-0.5">•</span>
            确保所填信息真实有效，虚假信息将取消报名资格
          </li>
          <li className="flex items-start gap-2">
            <span className="text-warm-300 mt-0.5">•</span>
            审核结果将通过短信通知，请保持手机畅通
          </li>
          <li className="flex items-start gap-2">
            <span className="text-warm-300 mt-0.5">•</span>
            如有疑问，请拨打服务热线：0771-12345
          </li>
          <li className="flex items-start gap-2">
            <span className="text-warm-300 mt-0.5">•</span>
            建议提前准备好所有材料，避免因材料不全影响报名
          </li>
        </ul>
      </div>
    </div>
  );

  const renderForm = () => (
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
  );

  const tabConfig = [
    { key: 'district' as Tab, label: '学区查询', icon: MapPin },
    { key: 'form' as Tab, label: '我要报名', icon: Plus },
    { key: 'records' as Tab, label: '报名记录', icon: FileText },
    { key: 'guide' as Tab, label: '报名指南', icon: Info },
  ];

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

      <div className="flex flex-wrap gap-2">
        {tabConfig.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === 'form' && submitSuccess) resetForm();
              }}
              className={cn(
                'px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2',
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-glow'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow-card'
              )}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'district' && renderDistrictSearch()}
      {activeTab === 'form' && renderForm()}
      {activeTab === 'records' && renderRecords()}
      {activeTab === 'guide' && renderGuide()}
    </div>
  );
}
