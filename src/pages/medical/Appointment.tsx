import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Stethoscope, Calendar, Clock, User, Check, ChevronDown, ChevronRight, MapPin, Star, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '@/api/client';
import type { Hospital, Department, Doctor } from '../../../shared/types';
import { cn } from '@/lib/utils';

type Step = 'hospital' | 'department' | 'datetime' | 'doctor' | 'confirm';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface SelectedInfo {
  hospital: Hospital | null;
  department: Department | null;
  date: string;
  time: string;
  doctor: Doctor | null;
}

export default function Appointment() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('hospital');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [expandedHospitalId, setExpandedHospitalId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedInfo, setSelectedInfo] = useState<SelectedInfo>({
    hospital: null,
    department: null,
    date: '',
    time: '',
    doctor: null,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const steps = [
    { key: 'hospital', label: '选择医院', icon: Building },
    { key: 'department', label: '选择科室', icon: Stethoscope },
    { key: 'datetime', label: '选择时间', icon: Calendar },
    { key: 'doctor', label: '选择医生', icon: User },
    { key: 'confirm', label: '确认预约', icon: Check },
  ];

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      value: date.toISOString().split('T')[0],
      label: `${date.getMonth() + 1}月${date.getDate()}日`,
      weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()],
    };
  });

  const timeSlots: TimeSlot[] = [
    { time: '08:00', available: true },
    { time: '08:30', available: true },
    { time: '09:00', available: false },
    { time: '09:30', available: true },
    { time: '10:00', available: true },
    { time: '10:30', available: false },
    { time: '11:00', available: true },
    { time: '14:00', available: true },
    { time: '14:30', available: true },
    { time: '15:00', available: true },
    { time: '15:30', available: false },
    { time: '16:00', available: true },
  ];

  useEffect(() => {
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    try {
      const data = await api.medical.getHospitals();
      setHospitals(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load hospitals:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async (hospitalId: string) => {
    try {
      const data = await api.medical.getDepartments(hospitalId);
      setDepartments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load departments:', e);
    }
  };

  const handleHospitalSelect = (hospital: Hospital) => {
    setSelectedInfo((prev) => ({ ...prev, hospital, department: null, doctor: null }));
    if (expandedHospitalId === hospital.id) {
      setExpandedHospitalId(null);
    } else {
      setExpandedHospitalId(hospital.id);
      loadDepartments(hospital.id);
    }
  };

  const handleDepartmentSelect = (department: Department) => {
    setSelectedInfo((prev) => ({ ...prev, department, doctor: null }));
    setCurrentStep('datetime');
  };

  const handleDateSelect = (date: string) => {
    setSelectedInfo((prev) => ({ ...prev, date, time: '' }));
  };

  const handleTimeSelect = (time: string) => {
    setSelectedInfo((prev) => ({ ...prev, time }));
    setCurrentStep('doctor');
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    if (!doctor.available) return;
    setSelectedInfo((prev) => ({ ...prev, doctor }));
    setCurrentStep('confirm');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.medical.createAppointment({
        hospitalId: selectedInfo.hospital?.id,
        departmentId: selectedInfo.department?.id,
        doctorId: selectedInfo.doctor?.id,
        date: selectedInfo.date,
        time: selectedInfo.time,
      });
      setSuccess(true);
    } catch (e) {
      console.error('Failed to create appointment:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrev = () => {
    const stepOrder: Step[] = ['hospital', 'department', 'datetime', 'doctor', 'confirm'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    } else {
      navigate('/medical');
    }
  };

  const isStepCompleted = (step: Step) => {
    const stepOrder: Step[] = ['hospital', 'department', 'datetime', 'doctor', 'confirm'];
    return stepOrder.indexOf(step) < stepOrder.indexOf(currentStep);
  };

  if (success) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/medical')}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">预约成功</h1>
            <p className="text-gray-500 mt-1">您的挂号预约已提交</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-card text-center">
          <div className="w-20 h-20 rounded-full bg-eco-100 flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-10 h-10 text-eco-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">预约成功！</h2>
          <p className="text-gray-500 mb-6">请按时就诊，如有变动请提前取消</p>

          <div className="bg-gray-50 rounded-xl p-6 text-left max-w-md mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">就诊医院</span>
              <span className="font-medium text-gray-800">{selectedInfo.hospital?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">就诊科室</span>
              <span className="font-medium text-gray-800">{selectedInfo.department?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">就诊医生</span>
              <span className="font-medium text-gray-800">{selectedInfo.doctor?.name} ({selectedInfo.doctor?.title})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">就诊时间</span>
              <span className="font-medium text-gray-800">{selectedInfo.date} {selectedInfo.time}</span>
            </div>
          </div>

          <div className="flex gap-4 mt-8 justify-center">
            <button
              onClick={() => navigate('/medical')}
              className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              返回首页
            </button>
            <button
              onClick={() => {
                setSuccess(false);
                setCurrentStep('hospital');
                setSelectedInfo({ hospital: null, department: null, date: '', time: '', doctor: null });
              }}
              className="px-8 py-3 bg-gradient-to-r from-eco-500 to-eco-600 text-white rounded-xl font-medium hover:from-eco-600 hover:to-eco-700 transition-all shadow-lg hover:shadow-glow-green"
            >
              继续预约
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={handlePrev}
          className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">预约挂号</h1>
          <p className="text-gray-500 mt-1">选择医院和科室，轻松完成预约</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.key;
            const isCompleted = isStepCompleted(step.key as Step);
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300',
                      isActive && 'bg-gradient-to-br from-eco-500 to-eco-600 text-white shadow-lg shadow-glow-green',
                      isCompleted && 'bg-eco-100 text-eco-600',
                      !isActive && !isCompleted && 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <span className={cn('text-xs mt-2 font-medium', isActive ? 'text-eco-600' : isCompleted ? 'text-eco-500' : 'text-gray-400')}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn('flex-1 h-1 mx-2 rounded-full transition-colors', isCompleted ? 'bg-eco-500' : 'bg-gray-200')} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {currentStep === 'hospital' && (
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Building className="w-5 h-5 text-eco-500" />
            选择就诊医院
          </h3>
          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-xl">
                  <div className="h-5 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              ))
            ) : hospitals.length > 0 ? (
              hospitals.map((hospital) => (
                <div key={hospital.id} className="border border-gray-100 rounded-xl overflow-hidden transition-all">
                  <div
                    className={cn(
                      'flex items-center justify-between p-4 cursor-pointer transition-colors',
                      selectedInfo.hospital?.id === hospital.id ? 'bg-eco-50' : 'bg-gray-50 hover:bg-gray-100'
                    )}
                    onClick={() => handleHospitalSelect(hospital)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-eco-100 to-eco-200 flex items-center justify-center">
                        <Building className="w-6 h-6 text-eco-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{hospital.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-eco-100 text-eco-600 text-xs font-medium rounded-full">
                            {hospital.level}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {hospital.address}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{hospital.departments?.length || 0}个科室</span>
                      {expandedHospitalId === hospital.id ? (
                        <ChevronDown className="w-5 h-5 text-eco-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {expandedHospitalId === hospital.id && departments.length > 0 && (
                    <div className="border-t border-gray-100 p-4 bg-white">
                      <p className="text-sm text-gray-500 mb-3">选择科室：</p>
                      <div className="grid grid-cols-2 gap-2">
                        {departments.map((dept) => (
                          <button
                            key={dept.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDepartmentSelect(dept);
                            }}
                            className={cn(
                              'p-3 rounded-xl text-left transition-all',
                              selectedInfo.department?.id === dept.id
                                ? 'bg-eco-500 text-white shadow-lg'
                                : 'bg-gray-50 hover:bg-eco-50 text-gray-700'
                            )}
                          >
                            <div className="font-medium text-sm">{dept.name}</div>
                            <div className={cn('text-xs mt-1', selectedInfo.department?.id === dept.id ? 'text-eco-100' : 'text-gray-400')}>
                              候诊约 {dept.waitTime} 分钟
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">暂无医院数据</div>
            )}
          </div>

          {selectedInfo.hospital && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setCurrentStep('department')}
                className="px-8 py-3 bg-gradient-to-r from-eco-500 to-eco-600 text-white rounded-xl font-medium hover:from-eco-600 hover:to-eco-700 transition-all shadow-lg hover:shadow-glow-green"
              >
                下一步
              </button>
            </div>
          )}
        </div>
      )}

      {currentStep === 'department' && (
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-eco-500" />
            选择就诊科室
          </h3>
          <div className="mb-6 p-4 bg-eco-50 rounded-xl">
            <p className="text-sm text-eco-600">已选择医院：<span className="font-medium">{selectedInfo.hospital?.name}</span></p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => handleDepartmentSelect(dept)}
                className={cn(
                  'p-5 rounded-2xl text-left transition-all',
                  selectedInfo.department?.id === dept.id
                    ? 'bg-gradient-to-br from-eco-500 to-eco-600 text-white shadow-lg shadow-glow-green'
                    : 'bg-gray-50 hover:bg-eco-50 text-gray-700 border-2 border-transparent hover:border-eco-200'
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <Stethoscope className={cn('w-5 h-5', selectedInfo.department?.id === dept.id ? 'text-white' : 'text-eco-500')} />
                </div>
                <h4 className="font-semibold text-lg">{dept.name}</h4>
                <div className={cn('text-sm mt-2', selectedInfo.department?.id === dept.id ? 'text-eco-100' : 'text-gray-500')}>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    候诊约 {dept.waitTime} 分钟
                  </div>
                  <div className="mt-1">
                    {dept.doctors?.length || 0} 位医生
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {currentStep === 'datetime' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-eco-500" />
              选择就诊日期
            </h3>
            <div className="mb-4 p-4 bg-eco-50 rounded-xl">
              <p className="text-sm text-eco-600">
                已选择：{selectedInfo.hospital?.name} - {selectedInfo.department?.name}
              </p>
            </div>
            <div className="grid grid-cols-4 lg:grid-cols-7 gap-3">
              {dates.map((date) => (
                <button
                  key={date.value}
                  onClick={() => handleDateSelect(date.value)}
                  className={cn(
                    'p-4 rounded-xl text-center transition-all',
                    selectedInfo.date === date.value
                      ? 'bg-gradient-to-br from-eco-500 to-eco-600 text-white shadow-lg'
                      : 'bg-gray-50 hover:bg-eco-50'
                  )}
                >
                  <div className={cn('text-sm', selectedInfo.date === date.value ? 'text-eco-100' : 'text-gray-500')}>
                    {date.weekday}
                  </div>
                  <div className={cn('font-semibold text-lg mt-1', selectedInfo.date === date.value ? 'text-white' : 'text-gray-800')}>
                    {date.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedInfo.date && (
            <div className="bg-white rounded-2xl p-6 shadow-card">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-eco-500" />
                选择就诊时间
              </h3>
              <div className="grid grid-cols-4 lg:grid-cols-6 gap-3">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => handleTimeSelect(slot.time)}
                    className={cn(
                      'py-3 px-4 rounded-xl text-center font-medium transition-all',
                      !slot.available && 'bg-gray-100 text-gray-300 cursor-not-allowed line-through',
                      slot.available && selectedInfo.time === slot.time && 'bg-gradient-to-r from-eco-500 to-eco-600 text-white shadow-lg',
                      slot.available && selectedInfo.time !== slot.time && 'bg-gray-50 hover:bg-eco-50 text-gray-700'
                    )}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {currentStep === 'doctor' && (
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-eco-500" />
            选择就诊医生
          </h3>
          <div className="mb-6 p-4 bg-eco-50 rounded-xl">
            <p className="text-sm text-eco-600">
              已选择：{selectedInfo.hospital?.name} - {selectedInfo.department?.name} - {selectedInfo.date} {selectedInfo.time}
            </p>
          </div>
          <div className="space-y-4">
            {selectedInfo.department?.doctors?.map((doctor) => (
              <button
                key={doctor.id}
                disabled={!doctor.available}
                onClick={() => handleDoctorSelect(doctor)}
                className={cn(
                  'w-full flex items-center justify-between p-5 rounded-2xl text-left transition-all',
                  !doctor.available && 'bg-gray-50 opacity-60 cursor-not-allowed',
                  doctor.available && selectedInfo.doctor?.id === doctor.id
                    ? 'bg-gradient-to-r from-eco-50 to-eco-100 border-2 border-eco-500 shadow-lg'
                    : doctor.available && 'bg-gray-50 hover:bg-eco-50 border-2 border-transparent'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-14 h-14 rounded-full flex items-center justify-center',
                    doctor.available ? 'bg-gradient-to-br from-eco-100 to-eco-200' : 'bg-gray-200'
                  )}>
                    <User className={cn('w-7 h-7', doctor.available ? 'text-eco-600' : 'text-gray-400')} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-lg">{doctor.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{doctor.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-xs font-medium">4.9</span>
                      </div>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-gray-500">接诊 2000+ 次</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {doctor.available ? (
                    <span className="px-4 py-2 bg-eco-100 text-eco-600 text-sm font-medium rounded-full">
                      可预约
                    </span>
                  ) : (
                    <span className="px-4 py-2 bg-red-100 text-red-600 text-sm font-medium rounded-full flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      已约满
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {currentStep === 'confirm' && (
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Check className="w-5 h-5 text-eco-500" />
            确认预约信息
          </h3>

          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-eco-500 to-eco-600 rounded-2xl p-6 text-white mb-6">
              <h4 className="text-xl font-bold mb-4">预约信息</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-eco-100">就诊医院</span>
                  <span className="font-medium">{selectedInfo.hospital?.name}</span>
                </div>
                <div className="h-px bg-white/20" />
                <div className="flex items-center justify-between">
                  <span className="text-eco-100">就诊科室</span>
                  <span className="font-medium">{selectedInfo.department?.name}</span>
                </div>
                <div className="h-px bg-white/20" />
                <div className="flex items-center justify-between">
                  <span className="text-eco-100">就诊医生</span>
                  <span className="font-medium">{selectedInfo.doctor?.name} ({selectedInfo.doctor?.title})</span>
                </div>
                <div className="h-px bg-white/20" />
                <div className="flex items-center justify-between">
                  <span className="text-eco-100">就诊时间</span>
                  <span className="font-medium">{selectedInfo.date} {selectedInfo.time}</span>
                </div>
              </div>
            </div>

            <div className="bg-warm-50 border border-warm-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warm-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warm-700">温馨提示</p>
                  <p className="text-sm text-warm-600 mt-1">
                    1. 请提前15分钟到达医院取号；
                    <br />
                    2. 如需取消预约，请提前2小时操作；
                    <br />
                    3. 就诊时请携带有效身份证件和医保卡。
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep('doctor')}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                返回修改
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-to-r from-eco-500 to-eco-600 text-white rounded-xl font-medium hover:from-eco-600 hover:to-eco-700 transition-all shadow-lg hover:shadow-glow-green disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    确认预约
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
