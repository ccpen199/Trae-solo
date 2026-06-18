import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, User, Phone, FileText, CheckCircle, ChevronRight } from 'lucide-react';
import { createAppointment } from '../../services/api';
import type { Appointment } from '../../../shared/types';

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
];

const serviceTypes = [
  { key: 'health_check', label: '健康检测', desc: '专业健康指标检测与分析', duration: '60分钟', price: '免费' },
  { key: 'experience', label: '产品体验', desc: '明星产品免费体验', duration: '45分钟', price: '免费' },
  { key: 'counseling', label: '咨询服务', desc: '一对一健康顾问咨询', duration: '30分钟', price: '免费' },
  { key: 'therapy', label: '理疗服务', desc: '专业理疗师经络调理', duration: '90分钟', price: '¥198' },
  { key: 'training', label: '培训讲座', desc: '健康养生知识讲座', duration: '120分钟', price: '免费' },
];

const stores = [
  { id: 1, name: '北京朝阳生活馆', address: '北京市朝阳区建国路88号' },
  { id: 2, name: '北京海淀生活馆', address: '北京市海淀区中关村大街1号' },
  { id: 3, name: '上海浦东生活馆', address: '上海市浦东新区陆家嘴环路1000号' },
];

export default function AppointmentCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storeIdParam = searchParams.get('storeId');
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    storeId: storeIdParam ? parseInt(storeIdParam) : '',
    serviceType: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '',
    customerName: '',
    customerPhone: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleNext = () => {
    if (step === 1 && (!formData.storeId || !formData.serviceType)) return;
    if (step === 2 && (!formData.appointmentDate || !formData.appointmentTime)) return;
    if (step === 3 && (!formData.customerName || !formData.customerPhone)) return;
    setStep(s => Math.min(4, s + 1));
  };

  const handlePrev = () => {
    setStep(s => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const res = await createAppointment({
        ...formData,
        storeId: formData.storeId as number,
        status: 'pending',
        salesId: 1,
        customerId: 1,
        storeName: '',
      } as unknown as Omit<Appointment, 'id' | 'createdAt'>);
      if (res.code === 0) {
        setSuccess(true);
      }
    } catch (err) {
      console.error('Failed to create appointment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStore = stores.find(s => s.id === formData.storeId);
  const selectedService = serviceTypes.find(s => s.key === formData.serviceType);

  const steps = [
    { num: 1, title: '选择门店' },
    { num: 2, title: '选择服务' },
    { num: 3, title: '预约时间' },
    { num: 4, title: '填写信息' },
  ];

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">预约提交成功</h2>
          <p className="text-gray-500 mb-6">
            我们已收到您的预约申请，生活馆将在30分钟内与您联系确认
          </p>
          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
            <h4 className="font-semibold text-gray-900 mb-4">预约信息</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">生活馆</span>
                <span className="font-medium">{selectedStore?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">服务类型</span>
                <span className="font-medium">{selectedService?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">预约时间</span>
                <span className="font-medium">{formData.appointmentDate} {formData.appointmentTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">预约人</span>
                <span className="font-medium">{formData.customerName}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate('/field/appointments')} className="btn btn-secondary">
              返回列表
            </button>
            <button onClick={() => navigate('/field/stores')} className="btn btn-primary">
              查看门店
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/field/appointments')}
        className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        返回预约列表
      </button>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step > s.num ? 'bg-primary-600 text-white' :
                  step === s.num ? 'bg-primary-600 text-white' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                </div>
                <span className={`text-xs mt-2 ${step >= s.num ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                  {s.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-16 md:w-24 h-1 mx-2 md:mx-4 rounded ${step > s.num ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" />
              选择生活馆
            </h3>
            <div className="grid gap-4">
              {stores.map((store) => (
                <div
                  key={store.id}
                  onClick={() => setFormData(d => ({ ...d, storeId: store.id }))}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.storeId === store.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{store.name}</h4>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4" />
                        {store.address}
                      </p>
                    </div>
                    {formData.storeId === store.id && (
                      <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              选择服务类型
            </h3>
            <div className="grid gap-4">
              {serviceTypes.map((service) => (
                <div
                  key={service.key}
                  onClick={() => setFormData(d => ({ ...d, serviceType: service.key }))}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.serviceType === service.key
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-gray-900">{service.label}</h4>
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">
                          {service.duration}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                          {service.price}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{service.desc}</p>
                    </div>
                    {formData.serviceType === service.key && (
                      <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              选择预约时间
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">预约日期</label>
              <input
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => setFormData(d => ({ ...d, appointmentDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="input w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                预约时段
                <span className="text-gray-400 font-normal ml-2">(点击选择)</span>
              </label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setFormData(d => ({ ...d, appointmentTime: time }))}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      formData.appointmentTime === time
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Clock className="w-4 h-4 mx-auto mb-1" />
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              填写预约信息
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData(d => ({ ...d, customerName: e.target.value }))}
                    placeholder="请输入您的姓名"
                    className="input pl-10 w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号 *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData(d => ({ ...d, customerPhone: e.target.value }))}
                    placeholder="请输入您的手机号"
                    className="input pl-10 w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(d => ({ ...d, notes: e.target.value }))}
                  placeholder="如有特殊需求请在此说明..."
                  className="input w-full h-24"
                />
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3">预约信息确认</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">生活馆</span>
                  <span className="font-medium">{selectedStore?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">服务类型</span>
                  <span className="font-medium">{selectedService?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">预约时间</span>
                  <span className="font-medium">{formData.appointmentDate} {formData.appointmentTime}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
          {step > 1 && (
            <button onClick={handlePrev} className="btn btn-secondary flex-1">
              上一步
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && (!formData.storeId || !formData.serviceType)) ||
                (step === 2 && (!formData.appointmentDate || !formData.appointmentTime)) ||
                (step === 3 && (!formData.customerName || !formData.customerPhone))
              }
              className="btn btn-primary flex-1"
            >
              下一步 <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn btn-primary flex-1"
            >
              {submitting ? '提交中...' : '确认预约'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
