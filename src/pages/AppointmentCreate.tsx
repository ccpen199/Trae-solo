import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Car as CarIcon,
  User,
  Calendar,
  Clock,
  Phone,
  Star,
  UserPlus,
  ChevronDown,
  Save,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { createAppointment } from '@/api';
import { formatPrice } from '@/utils';
import type { Car, User as UserType, Appointment } from '@/types';

const typeOptions = [
  { value: 'view', label: '看车' },
  { value: 'test_drive', label: '试驾' },
];

const intentionOptions = [
  { value: 'high', label: '高', color: 'text-red-600' },
  { value: 'medium', label: '中', color: 'text-yellow-600' },
  { value: 'low', label: '低', color: 'text-green-600' },
];

const mockCars: Car[] = [
  {
    id: 1,
    vin: 'LFV3A23C8D3000001',
    brand: '宝马',
    model: '5系 2023款 530Li',
    year: 2023,
    month: 6,
    mileage: 15000,
    color: '黑色',
    price: 428000,
    configuration: '豪华套装',
    images: [],
    documents: [],
    dealerId: 1,
    status: 'on_sale',
    statusHistory: [],
    createdAt: '2025-01-15',
    updatedAt: '2025-05-10',
  },
  {
    id: 2,
    vin: 'WDDUG8CBXFA123456',
    brand: '奔驰',
    model: 'E级 2024款 E300L',
    year: 2024,
    month: 1,
    mileage: 5000,
    color: '白色',
    price: 498000,
    configuration: '时尚型',
    images: [],
    documents: [],
    dealerId: 1,
    status: 'on_sale',
    statusHistory: [],
    createdAt: '2025-02-20',
    updatedAt: '2025-05-15',
  },
  {
    id: 3,
    vin: 'LFV3A23C8D3000003',
    brand: '奥迪',
    model: 'A6L 2023款 45TFSI',
    year: 2023,
    month: 8,
    mileage: 12000,
    color: '银色',
    price: 388000,
    configuration: '臻选动感型',
    images: [],
    documents: [],
    dealerId: 1,
    status: 'on_sale',
    statusHistory: [],
    createdAt: '2025-03-10',
    updatedAt: '2025-05-12',
  },
];

const mockBuyers: UserType[] = [
  { id: 1, name: '张先生', username: 'buyer1', role: 'buyer', phone: '13900139001', status: 'active', createdAt: '2024-01-01' },
  { id: 2, name: '李女士', username: 'buyer2', role: 'buyer', phone: '13900139002', status: 'active', createdAt: '2024-01-01' },
  { id: 3, name: '王先生', username: 'buyer3', role: 'buyer', phone: '13900139003', status: 'active', createdAt: '2024-01-01' },
];

const mockSales: UserType[] = [
  { id: 1, name: '王销售', username: 'sales1', role: 'sales', phone: '13800138001', status: 'active', createdAt: '2024-01-01' },
  { id: 2, name: '李销售', username: 'sales2', role: 'sales', phone: '13800138002', status: 'active', createdAt: '2024-01-01' },
  { id: 3, name: '张销售', username: 'sales3', role: 'sales', phone: '13800138003', status: 'active', createdAt: '2024-01-01' },
];

export default function AppointmentCreate() {
  const navigate = useNavigate();
  const { user, checkRole } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    carId: '',
    buyerType: 'existing' as 'existing' | 'new',
    buyerId: '',
    newBuyer: {
      name: '',
      phone: '',
    },
    type: 'view' as 'view' | 'test_drive',
    appointmentDate: '',
    appointmentTime: '',
    contactPhone: '',
    intentionLevel: 'medium' as 'high' | 'medium' | 'low',
    salesAssignment: 'auto' as 'auto' | 'manual',
    salesId: '',
    notes: '',
  });

  const [carSearch, setCarSearch] = useState('');
  const [showCarDropdown, setShowCarDropdown] = useState(false);
  const [buyerSearch, setBuyerSearch] = useState('');
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false);
  const [showSalesDropdown, setShowSalesDropdown] = useState(false);

  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<UserType | null>(null);

  useEffect(() => {
    if (user?.role === 'buyer') {
      setFormData((prev) => ({
        ...prev,
        buyerType: 'existing',
        buyerId: String(user.id),
        contactPhone: user.phone,
      }));
      setSelectedBuyer(user);
    }
  }, [user]);

  const filteredCars = mockCars.filter(
    (car) =>
      car.brand.toLowerCase().includes(carSearch.toLowerCase()) ||
      car.model.toLowerCase().includes(carSearch.toLowerCase()) ||
      car.vin.toLowerCase().includes(carSearch.toLowerCase())
  );

  const filteredBuyers = mockBuyers.filter(
    (buyer) =>
      buyer.name.toLowerCase().includes(buyerSearch.toLowerCase()) ||
      buyer.phone.includes(buyerSearch)
  );

  const handleCarSelect = (car: Car) => {
    setSelectedCar(car);
    setFormData((prev) => ({ ...prev, carId: String(car.id) }));
    setCarSearch(`${car.brand} ${car.model}`);
    setShowCarDropdown(false);
    setErrors((prev) => ({ ...prev, carId: '' }));
  };

  const handleBuyerSelect = (buyer: UserType) => {
    setSelectedBuyer(buyer);
    setFormData((prev) => ({
      ...prev,
      buyerId: String(buyer.id),
      contactPhone: buyer.phone,
    }));
    setBuyerSearch(buyer.name);
    setShowBuyerDropdown(false);
    setErrors((prev) => ({ ...prev, buyerId: '' }));
  };

  const handleSalesSelect = (sales: UserType) => {
    setFormData((prev) => ({ ...prev, salesId: String(sales.id) }));
    setShowSalesDropdown(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.carId) {
      newErrors.carId = '请选择车源';
    }
    if (formData.buyerType === 'existing' && !formData.buyerId) {
      newErrors.buyerId = '请选择买家';
    }
    if (formData.buyerType === 'new') {
      if (!formData.newBuyer.name.trim()) {
        newErrors.buyerName = '请输入买家姓名';
      }
      if (!formData.newBuyer.phone.trim()) {
        newErrors.buyerPhone = '请输入联系电话';
      } else if (!/^1[3-9]\d{9}$/.test(formData.newBuyer.phone)) {
        newErrors.buyerPhone = '请输入正确的手机号';
      }
    }
    if (!formData.appointmentDate) {
      newErrors.appointmentDate = '请选择预约日期';
    }
    if (!formData.appointmentTime) {
      newErrors.appointmentTime = '请选择预约时间';
    }
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = '请输入联系电话';
    } else if (!/^1[3-9]\d{9}$/.test(formData.contactPhone)) {
      newErrors.contactPhone = '请输入正确的手机号';
    }
    if (formData.salesAssignment === 'manual' && !formData.salesId) {
      newErrors.salesId = '请选择销售';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const appointmentData: Partial<Appointment> = {
        carId: Number(formData.carId),
        buyerId: formData.buyerType === 'existing' ? Number(formData.buyerId) : 0,
        type: formData.type,
        appointmentTime: `${formData.appointmentDate} ${formData.appointmentTime}:00`,
        contactPhone: formData.contactPhone,
        intentionLevel: formData.intentionLevel,
        salesId:
          formData.salesAssignment === 'manual' ? Number(formData.salesId) : undefined,
        notes: formData.notes,
      };

      if (formData.buyerType === 'new') {
        appointmentData['buyerInfo'] = formData.newBuyer as Record<string, string>;
      }

      await createAppointment(appointmentData);
      navigate('/appointments');
    } catch (error) {
      console.error('Failed to create appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const isBuyer = checkRole(['buyer']);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-6">
        <Link
          to="/appointments"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回预约列表
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">创建预约</h1>
        <p className="text-sm text-gray-500 mt-1">创建新的看车或试驾预约</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CarIcon className="w-5 h-5 text-primary-600" />
              车源信息
            </h2>
          </div>
          <div className="p-6">
            <div className="max-w-xl">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择车源 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索品牌、型号、VIN码..."
                  value={carSearch}
                  onChange={(e) => {
                    setCarSearch(e.target.value);
                    setShowCarDropdown(true);
                  }}
                  onFocus={() => setShowCarDropdown(true)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.carId ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {showCarDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCars.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">未找到匹配的车源</div>
                    ) : (
                      filteredCars.map((car) => (
                        <button
                          key={car.id}
                          type="button"
                          onClick={() => handleCarSelect(car)}
                          className="w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {car.brand} {car.model}
                              </p>
                              <p className="text-xs text-gray-500">
                                {car.year}年 · {car.mileage.toLocaleString()}公里 · VIN:{' '}
                                {car.vin}
                              </p>
                            </div>
                            <p className="text-primary-600 font-semibold">
                              {formatPrice(car.price)}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {errors.carId && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.carId}
                </p>
              )}

              {selectedCar && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-14 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                      <CarIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {selectedCar.brand} {selectedCar.model}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedCar.year}年 · {selectedCar.month}月上牌 ·{' '}
                        {selectedCar.mileage.toLocaleString()}公里 · {selectedCar.color}
                      </p>
                      <p className="text-sm text-gray-500">配置：{selectedCar.configuration}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-600">
                        {formatPrice(selectedCar.price)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              买家信息
            </h2>
          </div>
          <div className="p-6">
            {!isBuyer && (
              <div className="mb-6">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="buyerType"
                      value="existing"
                      checked={formData.buyerType === 'existing'}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, buyerType: 'existing' }))
                      }
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">已有买家</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="buyerType"
                      value="new"
                      checked={formData.buyerType === 'new'}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, buyerType: 'new' }))
                      }
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">新建买家</span>
                  </label>
                </div>
              </div>
            )}

            {formData.buyerType === 'existing' && !isBuyer ? (
              <div className="max-w-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择买家 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索买家姓名、电话..."
                    value={buyerSearch}
                    onChange={(e) => {
                      setBuyerSearch(e.target.value);
                      setShowBuyerDropdown(true);
                    }}
                    onFocus={() => setShowBuyerDropdown(true)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.buyerId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {showBuyerDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredBuyers.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">未找到匹配的买家</div>
                      ) : (
                        filteredBuyers.map((buyer) => (
                          <button
                            key={buyer.id}
                            type="button"
                            onClick={() => handleBuyerSelect(buyer)}
                            className="w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-primary-600 font-medium text-sm">
                                  {buyer.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{buyer.name}</p>
                                <p className="text-xs text-gray-500">{buyer.phone}</p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {errors.buyerId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.buyerId}
                  </p>
                )}
                {selectedBuyer && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-green-800">已选择买家</p>
                        <p className="text-sm text-green-700">
                          {selectedBuyer.name} - {selectedBuyer.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    买家姓名 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.newBuyer.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          newBuyer: { ...prev.newBuyer, name: e.target.value },
                        }))
                      }
                      placeholder="请输入买家姓名"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.buyerName ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.buyerName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.buyerName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    联系电话 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.newBuyer.phone}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          newBuyer: { ...prev.newBuyer, phone: e.target.value },
                          contactPhone: e.target.value,
                        }));
                      }}
                      placeholder="请输入联系电话"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.buyerPhone ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.buyerPhone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.buyerPhone}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              预约信息
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  预约类型 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  {typeOptions.map((type) => (
                    <label
                      key={type.value}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        formData.type === type.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="appointmentType"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            type: type.value as 'view' | 'test_drive',
                          }))
                        }
                        className="sr-only"
                      />
                      <span className="font-medium">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  意向等级 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {intentionOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          intentionLevel: option.value as 'high' | 'medium' | 'low',
                        }))
                      }
                      className={`flex-1 flex items-center justify-center gap-1 py-2.5 px-4 border-2 rounded-lg transition-colors ${
                        formData.intentionLevel === option.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          formData.intentionLevel === option.value
                            ? option.color
                            : 'text-gray-400'
                        }`}
                      />
                      <span
                        className={`font-medium ${
                          formData.intentionLevel === option.value
                            ? option.color
                            : 'text-gray-600'
                        }`}
                      >
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  预约日期 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, appointmentDate: e.target.value }))
                    }
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.appointmentDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.appointmentDate && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.appointmentDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  预约时间 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, appointmentTime: e.target.value }))
                    }
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.appointmentTime ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.appointmentTime && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.appointmentTime}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))
                    }
                    placeholder="请输入联系电话"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.contactPhone ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.contactPhone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.contactPhone}
                  </p>
                )}
              </div>
            </div>

            {!isBuyer && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="mb-4">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="salesAssignment"
                        value="auto"
                        checked={formData.salesAssignment === 'auto'}
                        onChange={() =>
                          setFormData((prev) => ({ ...prev, salesAssignment: 'auto' }))
                        }
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">自动分配销售</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="salesAssignment"
                        value="manual"
                        checked={formData.salesAssignment === 'manual'}
                        onChange={() =>
                          setFormData((prev) => ({ ...prev, salesAssignment: 'manual' }))
                        }
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">手动选择销售</span>
                    </label>
                  </div>
                </div>

                {formData.salesAssignment === 'manual' && (
                  <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择销售 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setShowSalesDropdown(!showSalesDropdown)}
                        className={`w-full pl-10 pr-10 py-2 border rounded-lg text-left focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.salesId ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        <span className={formData.salesId ? 'text-gray-900' : 'text-gray-400'}>
                          {formData.salesId
                            ? mockSales.find((s) => s.id === Number(formData.salesId))?.name
                            : '请选择销售'}
                        </span>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </button>
                      {showSalesDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {mockSales.map((sales) => (
                            <button
                              key={sales.id}
                              type="button"
                              onClick={() => handleSalesSelect(sales)}
                              className="w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-green-600 font-medium text-sm">
                                    {sales.name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{sales.name}</p>
                                  <p className="text-xs text-gray-500">{sales.phone}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.salesId && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.salesId}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 max-w-3xl">
              <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
                placeholder="请输入备注信息..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            to="/appointments"
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? '提交中...' : '提交预约'}
          </button>
        </div>
      </form>
    </div>
  );
}
