import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft,
  Car as CarIcon,
  Upload,
  X,
  Plus,
  Trash2,
  Save,
  Send,
  Loader2,
  Droplets,
  Flame,
  Wrench,
  Paintbrush,
  Gauge,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { getCars } from '@/api/modules/cars';
import { createInspection, updateInspection, getInspection } from '@/api/modules/inspections';
import type {
  Car,
  InspectionItem,
  MaintenanceRecord,
  PaintworkItem,
  RoadTest,
  InspectionStatus,
} from '@/types';
import { formatPrice } from '@/utils';

interface FormData {
  carId: number | null;
  accident: InspectionItem;
  waterDamage: InspectionItem;
  fireDamage: InspectionItem;
  maintenance: MaintenanceRecord[];
  paintwork: PaintworkItem[];
  roadTest: RoadTest;
  overallComment: string;
}

const initialInspectionItem: InspectionItem = {
  result: 'normal',
  description: '',
  images: [],
};

const initialRoadTest: RoadTest = {
  engine: '',
  transmission: '',
  brake: '',
  steering: '',
  suspension: '',
  overall: '',
};

const initialFormData: FormData = {
  carId: null,
  accident: { ...initialInspectionItem },
  waterDamage: { ...initialInspectionItem },
  fireDamage: { ...initialInspectionItem },
  maintenance: [],
  paintwork: [],
  roadTest: { ...initialRoadTest },
  overallComment: '',
};

const paintworkPositions = [
  '前保险杠', '后保险杠', '左前翼子板', '右前翼子板',
  '左后翼子板', '右后翼子板', '左前门', '右前门',
  '左后门', '右后门', '引擎盖', '后备箱盖', '车顶',
];

const resultOptions = [
  { value: 'normal', label: '正常', icon: CheckCircle, color: 'text-success-500' },
  { value: 'abnormal', label: '异常', icon: XCircle, color: 'text-danger-500' },
  { value: 'suspicious', label: '可疑', icon: AlertCircle, color: 'text-warning-500' },
];

export default function InspectionCreate() {
  const { carId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const { user } = useAuthStore();

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const carsData = await getCars({ status: 'pending_inspection' });
      setCars(carsData);

      if (editId) {
        const inspection = await getInspection(Number(editId));
        setFormData({
          carId: inspection.carId,
          accident: inspection.accident,
          waterDamage: inspection.waterDamage,
          fireDamage: inspection.fireDamage,
          maintenance: inspection.maintenance || [],
          paintwork: inspection.paintwork || [],
          roadTest: inspection.roadTest || initialRoadTest,
          overallComment: inspection.overallComment || '',
        });
        if (inspection.car) {
          setSelectedCar(inspection.car);
        }
      } else if (carId) {
        const car = carsData.find(c => c.id === Number(carId));
        if (car) {
          setSelectedCar(car);
          setFormData(prev => ({ ...prev, carId: Number(carId) }));
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [carId, editId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateScore = (): number => {
    let score = 100;

    if (formData.accident.result === 'abnormal') score -= 25;
    else if (formData.accident.result === 'suspicious') score -= 10;

    if (formData.waterDamage.result === 'abnormal') score -= 30;
    else if (formData.waterDamage.result === 'suspicious') score -= 15;

    if (formData.fireDamage.result === 'abnormal') score -= 30;
    else if (formData.fireDamage.result === 'suspicious') score -= 15;

    const abnormalPaintwork = formData.paintwork.filter(
      p => !p.originalPaint || p.repainted || p.sheetMetal
    ).length;
    score -= abnormalPaintwork * 2;

    const roadTestFields = ['engine', 'transmission', 'brake', 'steering', 'suspension'];
    roadTestFields.forEach(field => {
      const value = formData.roadTest[field as keyof RoadTest];
      if (value && value.includes('异常')) score -= 5;
      else if (value && value.includes('一般')) score -= 2;
    });

    return Math.max(0, Math.min(100, score));
  };

  const handleCarChange = (carId: string) => {
    const car = cars.find(c => c.id === Number(carId));
    setSelectedCar(car || null);
    setFormData(prev => ({ ...prev, carId: car ? Number(carId) : null }));
  };

  const handleInspectionItemChange = (
    field: 'accident' | 'waterDamage' | 'fireDamage',
    key: keyof InspectionItem,
    value: string | string[]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [key]: value,
      },
    }));
  };

  const handleImageUpload = (field: 'accident' | 'waterDamage' | 'fireDamage') => {
    const mockImage = `https://picsum.photos/400/300?random=${Date.now()}`;
    handleInspectionItemChange(
      field,
      'images',
      [...(formData[field].images || []), mockImage]
    );
  };

  const removeImage = (field: 'accident' | 'waterDamage' | 'fireDamage', index: number) => {
    handleInspectionItemChange(
      field,
      'images',
      formData[field].images?.filter((_, i) => i !== index) || []
    );
  };

  const addMaintenanceRecord = () => {
    const newRecord: MaintenanceRecord = {
      date: new Date().toISOString().split('T')[0],
      mileage: selectedCar?.mileage || 0,
      item: '',
      cost: 0,
      shop: '',
    };
    setFormData(prev => ({
      ...prev,
      maintenance: [...prev.maintenance, newRecord],
    }));
  };

  const updateMaintenanceRecord = (index: number, field: keyof MaintenanceRecord, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      maintenance: prev.maintenance.map((r, i) =>
        i === index ? { ...r, [field]: value } : r
      ),
    }));
  };

  const removeMaintenanceRecord = (index: number) => {
    setFormData(prev => ({
      ...prev,
      maintenance: prev.maintenance.filter((_, i) => i !== index),
    }));
  };

  const addPaintworkItem = () => {
    const usedPositions = formData.paintwork.map(p => p.position);
    const availablePosition = paintworkPositions.find(p => !usedPositions.includes(p));
    if (!availablePosition) return;

    const newItem: PaintworkItem = {
      position: availablePosition,
      originalPaint: true,
      repainted: false,
      sheetMetal: false,
      description: '',
    };
    setFormData(prev => ({
      ...prev,
      paintwork: [...prev.paintwork, newItem],
    }));
  };

  const updatePaintworkItem = (index: number, field: keyof PaintworkItem, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      paintwork: prev.paintwork.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      ),
    }));
  };

  const removePaintworkItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      paintwork: prev.paintwork.filter((_, i) => i !== index),
    }));
  };

  const handleRoadTestChange = (field: keyof RoadTest, value: string) => {
    setFormData(prev => ({
      ...prev,
      roadTest: {
        ...prev.roadTest,
        [field]: value,
      },
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.carId) {
      newErrors.carId = '请选择车源';
    }

    if (!formData.accident.description.trim()) {
      newErrors.accident = '请填写事故检测描述';
    }
    if (!formData.waterDamage.description.trim()) {
      newErrors.waterDamage = '请填写水泡检测描述';
    }
    if (!formData.fireDamage.description.trim()) {
      newErrors.fireDamage = '请填写火烧检测描述';
    }
    if (!formData.overallComment.trim()) {
      newErrors.overallComment = '请填写总体评价';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (submit: boolean = false) => {
    if (!user) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      const inspectionData = {
        carId: formData.carId!,
        inspectorId: user.id,
        accident: formData.accident,
        waterDamage: formData.waterDamage,
        fireDamage: formData.fireDamage,
        maintenance: formData.maintenance,
        paintwork: formData.paintwork,
        roadTest: formData.roadTest,
        overallScore: calculateScore(),
        overallComment: formData.overallComment,
        status: (submit ? 'submitted' : 'draft') as InspectionStatus,
      };

      if (editId) {
        await updateInspection(Number(editId), inspectionData);
      } else {
        await createInspection(inspectionData);
      }

      navigate('/inspections');
    } catch (error) {
      console.error('保存检测报告失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const renderInspectionItemForm = (
    title: string,
    icon: React.ElementType,
    field: 'accident' | 'waterDamage' | 'fireDamage'
  ) => {
    const Icon = icon;
    const item = formData[field];

    return (
      <div className={`card p-6 border-2 ${errors[field] ? 'border-danger-300' : 'border-neutral-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-lg text-neutral-800">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {resultOptions.map((option) => {
              const OptionIcon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInspectionItemChange(field, 'result', option.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                    item.result === option.value
                      ? `border-primary-500 bg-primary-50 ${option.color}`
                      : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                  }`}
                >
                  <OptionIcon className="w-5 h-5" />
                  <span className="font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {errors[field] && (
          <p className="mb-4 text-sm text-danger-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors[field]}
          </p>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-700 mb-2">检测描述</label>
          <textarea
            value={item.description}
            onChange={(e) => handleInspectionItemChange(field, 'description', e.target.value)}
            rows={4}
            placeholder={`请详细描述${title}结果...`}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">检测图片</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {item.images?.map((image, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden border border-neutral-200"
              >
                <img src={image} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(field, index)}
                  className="absolute top-1 right-1 p-1 bg-danger-500 text-white rounded-full hover:bg-danger-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => handleImageUpload(field)}
              className="aspect-square rounded-lg border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center gap-2 text-neutral-500 hover:border-primary-500 hover:text-primary-500 transition-colors"
            >
              <Upload className="w-6 h-6" />
              <span className="text-xs">上传图片</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/inspections')}
            className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-noto-serif-sc text-2xl font-bold text-neutral-800 mb-1">
              {editId ? '编辑检测报告' : '创建检测报告'}
            </h1>
            <p className="text-sm text-neutral-500">
              请填写车辆检测的详细信息
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-neutral-200">
            <div className="text-sm text-neutral-500 mr-2">预估评分</div>
            <div className={`text-3xl font-bold ${
              calculateScore() >= 90 ? 'text-success-600' :
              calculateScore() >= 70 ? 'text-primary-600' :
              calculateScore() >= 60 ? 'text-warning-600' :
              'text-danger-600'
            }`}>
              {calculateScore()}
            </div>
            <div className="text-sm text-neutral-400">/100</div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-lg text-neutral-800 mb-4 flex items-center gap-2">
              <CarIcon className="w-5 h-5 text-primary-700" />
              选择车源
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  车源 <span className="text-danger-500">*</span>
                </label>
                <select
                  value={formData.carId || ''}
                  onChange={(e) => handleCarChange(e.target.value)}
                  className={`input-field ${errors.carId ? 'border-danger-500' : ''}`}
                  disabled={!!carId || !!editId}
                >
                  <option value="">请选择车源</option>
                  {cars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.brand} {car.model} ({car.vin.slice(-6)})
                    </option>
                  ))}
                </select>
                {errors.carId && (
                  <p className="mt-1 text-sm text-danger-500">{errors.carId}</p>
                )}
              </div>
              {selectedCar && (
                <div className="lg:col-span-2 flex items-start gap-4 p-4 bg-neutral-50 rounded-lg">
                  {selectedCar.images && selectedCar.images[0] ? (
                    <img
                      src={selectedCar.images[0]}
                      alt=""
                      className="w-24 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-16 rounded-lg bg-neutral-200 flex items-center justify-center">
                      <CarIcon className="w-8 h-8 text-neutral-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-800">
                      {selectedCar.brand} {selectedCar.model}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <span className="text-neutral-500">VIN：</span>
                        <span className="font-mono">{selectedCar.vin}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">年份：</span>
                        <span>{selectedCar.year}年{selectedCar.month}月</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">里程：</span>
                        <span>{(selectedCar.mileage / 10000).toFixed(1)}万公里</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">售价：</span>
                        <span className="text-primary-700 font-medium">{formatPrice(selectedCar.price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {renderInspectionItemForm('事故检测', CarIcon, 'accident')}
          {renderInspectionItemForm('水泡检测', Droplets, 'waterDamage')}
          {renderInspectionItemForm('火烧检测', Flame, 'fireDamage')}

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-neutral-800 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary-700" />
                维保记录
              </h2>
              <button
                type="button"
                onClick={addMaintenanceRecord}
                className="btn-secondary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加记录
              </button>
            </div>

            {formData.maintenance.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <Wrench className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                <p>暂无维保记录，点击上方按钮添加</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.maintenance.map((record, index) => (
                  <div key={index} className="p-4 bg-neutral-50 rounded-lg relative">
                    <button
                      type="button"
                      onClick={() => removeMaintenanceRecord(index)}
                      className="absolute top-2 right-2 p-1 text-neutral-400 hover:text-danger-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-600 mb-1">日期</label>
                        <input
                          type="date"
                          value={record.date}
                          onChange={(e) => updateMaintenanceRecord(index, 'date', e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-600 mb-1">里程(公里)</label>
                        <input
                          type="number"
                          value={record.mileage}
                          onChange={(e) => updateMaintenanceRecord(index, 'mileage', Number(e.target.value))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-600 mb-1">保养项目</label>
                        <input
                          type="text"
                          value={record.item}
                          onChange={(e) => updateMaintenanceRecord(index, 'item', e.target.value)}
                          placeholder="如：更换机油"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-600 mb-1">费用(元)</label>
                        <input
                          type="number"
                          value={record.cost}
                          onChange={(e) => updateMaintenanceRecord(index, 'cost', Number(e.target.value))}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-600 mb-1">门店</label>
                        <input
                          type="text"
                          value={record.shop}
                          onChange={(e) => updateMaintenanceRecord(index, 'shop', e.target.value)}
                          placeholder="如：4S店"
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-neutral-800 flex items-center gap-2">
                <Paintbrush className="w-5 h-5 text-primary-700" />
                漆面检测
              </h2>
              <button
                type="button"
                onClick={addPaintworkItem}
                className="btn-secondary flex items-center gap-2"
                disabled={formData.paintwork.length >= paintworkPositions.length}
              >
                <Plus className="w-4 h-4" />
                添加部位
              </button>
            </div>

            {formData.paintwork.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <Paintbrush className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                <p>暂无漆面检测记录，点击上方按钮添加</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.paintwork.map((item, index) => (
                  <div key={index} className={`p-4 rounded-lg border-2 relative ${
                    !item.originalPaint || item.repainted || item.sheetMetal
                      ? 'border-danger-300 bg-danger-50/50'
                      : 'border-neutral-200 bg-neutral-50'
                  }`}>
                    <button
                      type="button"
                      onClick={() => removePaintworkItem(index)}
                      className="absolute top-2 right-2 p-1 text-neutral-400 hover:text-danger-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center justify-between mb-3">
                      <select
                        value={item.position}
                        onChange={(e) => updatePaintworkItem(index, 'position', e.target.value)}
                        className="input-field text-sm"
                      >
                        {paintworkPositions.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2">
                        {!item.originalPaint && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-danger-100 text-danger-700 rounded">
                            非原漆
                          </span>
                        )}
                        {item.repainted && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-warning-100 text-warning-700 rounded">
                            补漆
                          </span>
                        )}
                        {item.sheetMetal && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-danger-100 text-danger-700 rounded">
                            钣金
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.originalPaint}
                          onChange={(e) => updatePaintworkItem(index, 'originalPaint', e.target.checked)}
                          className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-600">原漆</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.repainted}
                          onChange={(e) => updatePaintworkItem(index, 'repainted', e.target.checked)}
                          className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-600">补漆</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.sheetMetal}
                          onChange={(e) => updatePaintworkItem(index, 'sheetMetal', e.target.checked)}
                          className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-600">钣金</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updatePaintworkItem(index, 'description', e.target.value)}
                      placeholder="描述详情..."
                      className="input-field text-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-lg text-neutral-800 mb-4 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary-700" />
              路试结果
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'engine', label: '发动机' },
                { key: 'transmission', label: '变速箱' },
                { key: 'brake', label: '刹车系统' },
                { key: 'steering', label: '转向系统' },
                { key: 'suspension', label: '悬挂系统' },
                { key: 'overall', label: '综合评价' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">{label}</label>
                  <select
                    value={formData.roadTest[key as keyof RoadTest]}
                    onChange={(e) => handleRoadTestChange(key as keyof RoadTest, e.target.value)}
                    className="input-field"
                  >
                    <option value="">请选择{label}</option>
                    <option value="正常">正常</option>
                    <option value="良好">良好</option>
                    <option value="一般">一般</option>
                    <option value="轻微异常">轻微异常</option>
                    <option value="严重异常">严重异常</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-lg text-neutral-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-700" />
              总体评价
            </h2>
            <textarea
              value={formData.overallComment}
              onChange={(e) => setFormData(prev => ({ ...prev, overallComment: e.target.value }))}
              rows={4}
              placeholder="请对该车辆的整体状况进行评价..."
              className={`input-field ${errors.overallComment ? 'border-danger-500' : ''}`}
            />
            {errors.overallComment && (
              <p className="mt-1 text-sm text-danger-500">{errors.overallComment}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              onClick={() => navigate('/inspections')}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={submitting}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              保存草稿
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={submitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              提交审核
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
