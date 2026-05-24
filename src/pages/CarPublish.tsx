import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  Car,
  FileText,
  Image,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { createCar, updateCar, getCar, checkVin } from '@/api/modules/cars';
import { CAR_BRANDS } from '@/utils/constants';
import type { CarDocument } from '@/types';

interface Step {
  id: number;
  title: string;
  icon: React.ElementType;
}

const steps: Step[] = [
  { id: 1, title: '基础信息', icon: Car },
  { id: 2, title: '配置信息', icon: Image },
  { id: 3, title: '证件上传', icon: FileText },
];

interface FormData {
  vin: string;
  brand: string;
  model: string;
  year: string;
  month: string;
  mileage: string;
  color: string;
  price: string;
  configuration: string;
  images: string[];
  documents: CarDocument[];
}

const initialFormData: FormData = {
  vin: '',
  brand: '',
  model: '',
  year: '',
  month: '',
  mileage: '',
  color: '',
  price: '',
  configuration: '',
  images: [],
  documents: [],
};

interface FormErrors {
  vin?: string;
  brand?: string;
  model?: string;
  year?: string;
  month?: string;
  mileage?: string;
  color?: string;
  price?: string;
  configuration?: string;
}

export default function CarPublish() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [vinCheckResult, setVinCheckResult] = useState<{ loading: boolean; duplicate: boolean; checked: boolean }>({
    loading: false,
    duplicate: false,
    checked: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [vinDebounceTimer, setVinDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (editId) {
      loadCarData(Number(editId));
    }
  }, [editId]);

  const loadCarData = async (id: number) => {
    try {
      const car = await getCar(id);
      setFormData({
        vin: car.vin,
        brand: car.brand,
        model: car.model,
        year: String(car.year),
        month: String(car.month),
        mileage: String(car.mileage),
        color: car.color,
        price: String(car.price),
        configuration: car.configuration,
        images: car.images || [],
        documents: car.documents || [],
      });
      setVinCheckResult({ loading: false, duplicate: false, checked: true });
    } catch (error) {
      console.error('加载车源数据失败:', error);
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.vin.trim()) {
      newErrors.vin = '请输入VIN码';
    } else if (formData.vin.length !== 17) {
      newErrors.vin = 'VIN码必须为17位';
    } else if (vinCheckResult.duplicate) {
      newErrors.vin = '该VIN码已存在';
    }

    if (!formData.brand) {
      newErrors.brand = '请选择品牌';
    }
    if (!formData.model.trim()) {
      newErrors.model = '请输入车型';
    }
    if (!formData.year) {
      newErrors.year = '请选择年份';
    }
    if (!formData.month) {
      newErrors.month = '请选择月份';
    }
    if (!formData.mileage || Number(formData.mileage) < 0) {
      newErrors.mileage = '请输入有效的里程数';
    }
    if (!formData.color.trim()) {
      newErrors.color = '请输入颜色';
    }
    if (!formData.price || Number(formData.price) <= 0) {
      newErrors.price = '请输入有效的价格';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.configuration.trim()) {
      newErrors.configuration = '请输入配置描述';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVinChange = (value: string) => {
    setFormData(prev => ({ ...prev, vin: value.toUpperCase() }));
    setErrors(prev => ({ ...prev, vin: undefined }));
    setVinCheckResult({ loading: false, duplicate: false, checked: false });

    if (vinDebounceTimer) {
      clearTimeout(vinDebounceTimer);
    }

    if (value.length === 17 && !editId) {
      const timer = setTimeout(async () => {
        setVinCheckResult(prev => ({ ...prev, loading: true }));
        try {
          const result = await checkVin(value);
          setVinCheckResult({
            loading: false,
            duplicate: result.duplicate,
            checked: true,
          });
          if (result.duplicate) {
            setErrors(prev => ({ ...prev, vin: '该VIN码已存在' }));
          }
        } catch (error) {
          console.error('VIN校验失败:', error);
          setVinCheckResult({ loading: false, duplicate: false, checked: false });
        }
      }, 500);
      setVinDebounceTimer(timer);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | string[] | CarDocument[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleImageUpload = () => {
    const mockImages = [
      `https://picsum.photos/800/500?random=${Date.now()}`,
    ];
    handleInputChange('images', [...formData.images, ...mockImages]);
  };

  const removeImage = (index: number) => {
    handleInputChange('images', formData.images.filter((_, i) => i !== index));
  };

  const handleDocumentUpload = (type: CarDocument['type']) => {
    const typeNames: Record<string, string> = {
      registration: '行驶证',
      insurance: '保险单',
      maintenance: '维保记录',
      other: '其他证件',
    };
    const newDoc: CarDocument = {
      type,
      name: `${typeNames[type]}_${Date.now()}.pdf`,
      url: `https://example.com/docs/${type}_${Date.now()}.pdf`,
    };
    handleInputChange('documents', [...formData.documents, newDoc]);
  };

  const removeDocument = (index: number) => {
    handleInputChange('documents', formData.documents.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    }

    if (isValid) {
      setCurrentStep(prev => Math.min(3, prev + 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      const carData = {
        vin: formData.vin,
        brand: formData.brand,
        model: formData.model,
        year: Number(formData.year),
        month: Number(formData.month),
        mileage: Number(formData.mileage),
        color: formData.color,
        price: Number(formData.price),
        configuration: formData.configuration,
        images: formData.images,
        documents: formData.documents,
        dealerId: user.id,
        status: 'draft' as const,
      };

      if (editId) {
        await updateCar(Number(editId), carData);
      } else {
        await createCar(carData);
      }

      navigate('/cars');
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const documentTypes: Array<{ type: CarDocument['type']; label: string }> = [
    { type: 'registration', label: '行驶证' },
    { type: 'insurance', label: '保险单' },
    { type: 'maintenance', label: '维保记录' },
    { type: 'other', label: '其他证件' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/cars')}
            className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-noto-serif-sc text-2xl font-bold text-neutral-800 mb-1">
              {editId ? '编辑车源' : '发布车源'}
            </h1>
            <p className="text-sm text-neutral-500">
              {editId ? '修改车辆信息' : '填写车辆信息，发布您的车源'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-primary-700 text-white'
                        : isCompleted
                        ? 'bg-success-500 text-white'
                        : 'bg-neutral-200 text-neutral-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:block ${
                      isActive ? 'text-primary-700' : isCompleted ? 'text-success-600' : 'text-neutral-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded-full ${
                      isCompleted ? 'bg-success-500' : 'bg-neutral-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="card p-6 mb-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    VIN码 <span className="text-danger-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.vin}
                      onChange={(e) => handleVinChange(e.target.value)}
                      placeholder="请输入17位VIN码"
                      maxLength={17}
                      className={`input-field pr-10 font-mono uppercase ${
                        errors.vin ? 'border-danger-500 focus:ring-danger-500' : ''
                      }`}
                    />
                    {vinCheckResult.loading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 animate-spin" />
                    )}
                    {vinCheckResult.checked && !vinCheckResult.duplicate && !errors.vin && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-success-500" />
                    )}
                    {(vinCheckResult.duplicate || errors.vin) && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-danger-500" />
                    )}
                  </div>
                  {errors.vin && (
                    <p className="mt-1 text-sm text-danger-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.vin}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-neutral-500">
                    已输入 {formData.vin.length}/17 位
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    品牌 <span className="text-danger-500">*</span>
                  </label>
                  <select
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    className={`input-field ${errors.brand ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  >
                    <option value="">请选择品牌</option>
                    {CAR_BRANDS.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                  {errors.brand && (
                    <p className="mt-1 text-sm text-danger-500">{errors.brand}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    车型 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="例如：宝马5系 2023款 530Li"
                    className={`input-field ${errors.model ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  />
                  {errors.model && (
                    <p className="mt-1 text-sm text-danger-500">{errors.model}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    颜色 <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    placeholder="例如：黑色、白色"
                    className={`input-field ${errors.color ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  />
                  {errors.color && (
                    <p className="mt-1 text-sm text-danger-500">{errors.color}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    出厂年份 <span className="text-danger-500">*</span>
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    className={`input-field ${errors.year ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  >
                    <option value="">请选择年份</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}年
                      </option>
                    ))}
                  </select>
                  {errors.year && (
                    <p className="mt-1 text-sm text-danger-500">{errors.year}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    出厂月份 <span className="text-danger-500">*</span>
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => handleInputChange('month', e.target.value)}
                    className={`input-field ${errors.month ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  >
                    <option value="">请选择月份</option>
                    {months.map((month) => (
                      <option key={month} value={month}>
                        {month}月
                      </option>
                    ))}
                  </select>
                  {errors.month && (
                    <p className="mt-1 text-sm text-danger-500">{errors.month}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    表显里程(公里) <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => handleInputChange('mileage', e.target.value)}
                    placeholder="请输入里程数"
                    className={`input-field ${errors.mileage ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  />
                  {errors.mileage && (
                    <p className="mt-1 text-sm text-danger-500">{errors.mileage}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    售价(元) <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="请输入售价"
                    className={`input-field ${errors.price ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-danger-500">{errors.price}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  配置描述 <span className="text-danger-500">*</span>
                </label>
                <textarea
                  value={formData.configuration}
                  onChange={(e) => handleInputChange('configuration', e.target.value)}
                  rows={6}
                  placeholder="请详细描述车辆配置，包括发动机、变速箱、天窗、座椅、导航等..."
                  className={`input-field ${errors.configuration ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                />
                {errors.configuration && (
                  <p className="mt-1 text-sm text-danger-500">{errors.configuration}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  车辆图片
                </label>
                <p className="text-sm text-neutral-500 mb-4">
                  建议上传车辆外观、内饰、发动机舱等多角度图片（最多9张）
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                  {formData.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden border border-neutral-200"
                    >
                      <img
                        src={image}
                        alt={`车辆图片 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-danger-500 text-white rounded-full hover:bg-danger-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {formData.images.length < 9 && (
                    <button
                      onClick={handleImageUpload}
                      className="aspect-square rounded-lg border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center gap-2 text-neutral-500 hover:border-primary-500 hover:text-primary-500 transition-colors"
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-xs">上传图片</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  证件上传
                </label>
                <p className="text-sm text-neutral-500 mb-4">
                  请上传相关证件照片，以便我们审核您的车源
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {documentTypes.map((docType) => (
                    <button
                      key={docType.type}
                      onClick={() => handleDocumentUpload(docType.type)}
                      className="p-4 border-2 border-dashed border-neutral-300 rounded-lg flex items-center gap-3 hover:border-primary-500 hover:bg-primary-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Upload className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-neutral-700">上传{docType.label}</p>
                        <p className="text-xs text-neutral-500">支持PDF、JPG、PNG格式</p>
                      </div>
                    </button>
                  ))}
                </div>

                {formData.documents.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-neutral-700 mb-2">已上传证件</h4>
                    {formData.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary-600" />
                          <div>
                            <p className="text-sm font-medium text-neutral-700">{doc.name}</p>
                            <p className="text-xs text-neutral-500">
                              {doc.type === 'registration' && '行驶证'}
                              {doc.type === 'insurance' && '保险单'}
                              {doc.type === 'maintenance' && '维保记录'}
                              {doc.type === 'other' && '其他证件'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeDocument(index)}
                          className="p-1 text-neutral-400 hover:text-danger-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            上一步
          </button>

          {currentStep < 3 ? (
            <button
              onClick={nextStep}
              className="btn-primary flex items-center gap-2"
            >
              下一步
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {editId ? '保存修改' : '提交发布'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
