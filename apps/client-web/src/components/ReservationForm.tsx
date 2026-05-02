import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { packageApi, reservationApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ReservationForm: React.FC = () => {
  const navigate = useNavigate();
  const { selectedPackage, selectedDate, selectedTimeSlot, setSelectedDate, setSelectedTimeSlot, clearSelection } = useAppStore();
  
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    gender: 'male',
    birthDate: '',
    idCard: '',
    phone: '',
    email: '',
    address: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!selectedPackage) {
      navigate('/packages');
      return;
    }

    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const response = await packageApi.getAvailableSlots(selectedDate);
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('获取可预约时段失败:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!patientInfo.name.trim()) {
      newErrors.name = '请输入姓名';
    }
    if (!patientInfo.gender) {
      newErrors.gender = '请选择性别';
    }
    if (!patientInfo.birthDate) {
      newErrors.birthDate = '请选择出生日期';
    }
    if (!patientInfo.idCard.trim()) {
      newErrors.idCard = '请输入身份证号';
    } else if (!/^\d{17}[\dXx]$/.test(patientInfo.idCard)) {
      newErrors.idCard = '身份证号格式不正确';
    }
    if (!patientInfo.phone.trim()) {
      newErrors.phone = '请输入手机号';
    } else if (!/^1[3-9]\d{9}$/.test(patientInfo.phone)) {
      newErrors.phone = '手机号格式不正确';
    }
    if (!selectedDate) {
      newErrors.date = '请选择预约日期';
    }
    if (!selectedTimeSlot) {
      newErrors.timeSlot = '请选择预约时段';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await reservationApi.create({
        packageId: selectedPackage.id,
        reservationDate: selectedDate,
        timeSlot: selectedTimeSlot,
        patientInfo: {
          name: patientInfo.name,
          gender: patientInfo.gender,
          birthDate: patientInfo.birthDate,
          idCard: patientInfo.idCard,
          phone: patientInfo.phone,
          email: patientInfo.email,
          address: patientInfo.address,
        },
      });

      alert(`预约成功！\n预约码: ${response.data.reservationCode}\n订单号: ${response.data.orderNo}`);
      clearSelection();
      navigate('/reservations');
    } catch (error: any) {
      console.error('预约失败:', error);
      const errorMessage = error.response?.data?.message || '预约失败，请重试';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const generateDateOptions = () => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        options.push(date);
      }
    }
    
    return options;
  };

  if (!selectedPackage) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">确认套餐</h2>
            <div className="flex items-center gap-4">
              <span className="text-lg font-medium">{selectedPackage.name}</span>
              <span className="text-red-600 font-bold">¥{selectedPackage.price}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/packages')}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            更换套餐
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">个人信息</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={patientInfo.name}
                onChange={(e) => setPatientInfo({ ...patientInfo, name: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入姓名"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                性别 <span className="text-red-500">*</span>
              </label>
              <select
                value={patientInfo.gender}
                onChange={(e) => setPatientInfo({ ...patientInfo, gender: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.gender ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
              {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                出生日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={patientInfo.birthDate}
                onChange={(e) => setPatientInfo({ ...patientInfo, birthDate: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.birthDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                身份证号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={patientInfo.idCard}
                onChange={(e) => setPatientInfo({ ...patientInfo, idCard: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.idCard ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入18位身份证号"
                maxLength={18}
              />
              {errors.idCard && <p className="text-red-500 text-sm mt-1">{errors.idCard}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                手机号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={patientInfo.phone}
                onChange={(e) => setPatientInfo({ ...patientInfo, phone: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入手机号"
                maxLength={11}
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <input
                type="email"
                value={patientInfo.email}
                onChange={(e) => setPatientInfo({ ...patientInfo, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入邮箱(选填)"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              联系地址
            </label>
            <input
              type="text"
              value={patientInfo.address}
              onChange={(e) => setPatientInfo({ ...patientInfo, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入联系地址(选填)"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">预约时间</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择日期 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              {generateDateOptions().map((date) => {
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = selectedDate === dateStr;
                const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    <div className="text-sm">{date.getMonth() + 1}月{date.getDate()}日</div>
                    <div className="text-xs mt-1">{dayNames[date.getDay()]}</div>
                  </button>
                );
              })}
            </div>
            {errors.date && <p className="text-red-500 text-sm mt-2">{errors.date}</p>}
          </div>

          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择时段 <span className="text-red-500">*</span>
              </label>
              {loadingSlots ? (
                <div className="text-gray-500">加载中...</div>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.slot}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setSelectedTimeSlot(slot.slot)}
                      className={`p-2 border rounded-lg text-sm transition-colors ${
                        !slot.available
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : selectedTimeSlot === slot.slot
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {slot.slot}
                    </button>
                  ))}
                </div>
              )}
              {errors.timeSlot && <p className="text-red-500 text-sm mt-2">{errors.timeSlot}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-6">
          <div>
            <span className="text-gray-600">预约金额：</span>
            <span className="text-2xl font-bold text-red-600">¥{selectedPackage.price}</span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/packages')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '确认预约'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReservationForm;
