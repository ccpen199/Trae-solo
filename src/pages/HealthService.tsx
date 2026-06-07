import { useState, useEffect } from 'react';
import { Heart, Building2, Stethoscope, CalendarDays, Clock, ChevronRight, CheckCircle2, X, User, ShieldAlert, Ticket, Upload, FileCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/utils/api';

const hospitals = [
  { id: 1, name: '江苏省人民医院', level: '三甲', dept_count: 45, district: '鼓楼区' },
  { id: 2, name: '南京鼓楼医院', level: '三甲', dept_count: 38, district: '鼓楼区' },
  { id: 3, name: '东南大学附属中大医院', level: '三甲', dept_count: 32, district: '玄武区' },
  { id: 4, name: '南京市第一医院', level: '三甲', dept_count: 28, district: '秦淮区' },
  { id: 5, name: '南京医科大学第二附属医院', level: '三甲', dept_count: 26, district: '鼓楼区' },
  { id: 6, name: '南京市中医院', level: '三甲', dept_count: 22, district: '秦淮区' },
];



const timeSlots = [
  { id: '08:00', label: '08:00-08:30', total: 10, used: 3 },
  { id: '08:30', label: '08:30-09:00', total: 10, used: 7 },
  { id: '09:00', label: '09:00-09:30', total: 10, used: 10 },
  { id: '09:30', label: '09:30-10:00', total: 10, used: 5 },
  { id: '10:00', label: '10:00-10:30', total: 10, used: 2 },
  { id: '10:30', label: '10:30-11:00', total: 10, used: 4 },
  { id: '14:00', label: '14:00-14:30', total: 10, used: 1 },
  { id: '14:30', label: '14:30-15:00', total: 10, used: 0 },
  { id: '15:00', label: '15:00-15:30', total: 10, used: 3 },
  { id: '15:30', label: '15:30-16:00', total: 10, used: 6 },
];

type Step = 'hospital' | 'department' | 'doctor' | 'time' | 'verify' | 'confirm';

interface Doctor {
  id: number;
  name: string;
  title: string;
  specialty: string;
  fee: number;
  schedule: string;
  good_at: string[];
  hospital_name?: string;
  hospital_id?: number;
  department_name?: string;
  department_id?: number;
}

interface TimeSlot {
  id: string;
  label: string;
  total: number;
  used: number;
  available: number;
}

interface Hospital {
  id: number;
  name: string;
  level: string;
  district: string;
  departments: { id: number; name: string }[];
}

export default function HealthService() {
  const { user, isAuthenticated } = useAuthStore();
  const [step, setStep] = useState<Step>('hospital');
  const [selectedHospital, setSelectedHospital] = useState<number | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedDeptName, setSelectedDeptName] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showMyAppointments, setShowMyAppointments] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastAppointment, setLastAppointment] = useState<any>(null);
  const [hospitalsData, setHospitalsData] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'none' | 'verifying' | 'success' | 'failed'>('none');

  useEffect(() => {
    loadHospitals();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAppointments();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedDeptId) {
      loadDoctors();
    } else {
      setDoctors([]);
    }
  }, [selectedDeptId]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadSlots();
    } else {
      setSlots([]);
    }
  }, [selectedDoctor?.id, selectedDate]);

  const loadHospitals = async () => {
    try {
      const data = await api.get<Hospital[]>('/health/hospitals');
      setHospitalsData(data);
    } catch (e) {
      // noop
    }
  };

  const loadAppointments = async () => {
    try {
      const data = await api.get<any[]>('/health/appointments');
      setAppointments(data);
    } catch (e) {
      // noop
    }
  };

  const loadDoctors = async () => {
    if (!selectedDeptId) return;
    setLoading(true);
    try {
      const data = await api.get<Doctor[]>(`/health/doctors?department_id=${selectedDeptId}`);
      const doctorsWithGoodAt = data.map((d) => ({
        ...d,
        good_at: d.specialty ? d.specialty.split('，') : [],
      }));
      setDoctors(doctorsWithGoodAt);
    } catch (e) {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;
    try {
      const data = await api.get<TimeSlot[]>(`/health/slots?doctor_id=${selectedDoctor.id}&date=${encodeURIComponent(selectedDate)}`);
      setSlots(data);
    } catch (e) {
      setSlots(timeSlots.map((s) => ({ ...s, available: s.total - s.used })));
    }
  };

  const stepLabels: Record<Step, string> = {
    hospital: '选择医院',
    department: '选择科室',
    doctor: '选择医生',
    time: '号源选择',
    verify: '实名核验',
    confirm: '确认预约',
  };

  const steps: Step[] = ['hospital', 'department', 'doctor', 'time', 'verify', 'confirm'];
  const currentIdx = steps.indexOf(step);

  const hospital = hospitals.find((h) => h.id === selectedHospital);
  const currentHospitalData = hospitalsData.find((h) => h.id === selectedHospital);
  const departments = currentHospitalData?.departments || [];

  const nextDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  });

  const handleConfirm = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTimeSlot) return;
    try {
      const aptData = {
        doctor_id: selectedDoctor.id,
        appointment_time: `${selectedDate} ${selectedTimeSlot.id}`,
      };
      const result = await api.post<any>('/health/appointments', aptData);
      setConfirmOpen(false);
      setLastAppointment({
        id: result?.id || Date.now(),
        hospital_name: selectedDoctor.hospital_name || hospital?.name,
        department: selectedDoctor.department_name || selectedDeptName,
        doctor_name: selectedDoctor.name,
        appointment_time: `${selectedDate} ${selectedTimeSlot.label}`,
        fee: selectedDoctor.fee,
        status: 'confirmed',
      });
      setShowSuccess(true);
      loadAppointments();
    } catch (e) {
      alert('预约失败，请重试');
    }
  };

  const handleNextFromDoctor = (doc: Doctor) => {
    if (!isAuthenticated) {
      alert('请先登录后再预约挂号');
      return;
    }
    setSelectedDoctor(doc);
    setSelectedDate(nextDays[0]);
    setVerifyStatus('none');
    setStep('time');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const switchHospital = (hospitalId: number) => {
    setSelectedHospital(hospitalId);
    setStep('department');
    setSelectedDeptId(null);
    setSelectedDeptName('');
    setSelectedDoctor(null);
    setSelectedDate('');
    setSelectedTimeSlot(null);
    setConfirmOpen(false);
    setShowMyAppointments(false);
    setVerifyStatus('none');
  };

  const handleDeptSelect = (dept: { id: number; name: string }) => {
    setSelectedDeptId(dept.id);
    setSelectedDeptName(dept.name);
    setStep('doctor');
    setSelectedDoctor(null);
    setSelectedDate('');
    setSelectedTimeSlot(null);
  };

  const renderHospitalSwitcher = () => (
    <div className="mb-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {hospitals.map((h) => (
        <button
          key={h.id}
          type="button"
          onClick={() => switchHospital(h.id)}
          className={`rounded-lg border p-3 text-left text-sm transition-colors ${
            selectedHospital === h.id
              ? 'border-primary bg-primary-50 text-primary'
              : 'border-warm-200 bg-white text-warm-700 hover:border-primary'
          }`}
        >
          <span className="font-medium">{h.name}</span>
          {' '}
          <span className="ml-2 text-xs">{h.level}</span>
          {' '}
          <span className="ml-2 text-xs">{h.district}</span>
          {' '}
          <span className="ml-2 text-xs">{h.dept_count}个科室</span>
        </button>
      ))}
    </div>
  );

  const handleBackToDept = () => {
    setStep('department');
    setSelectedDoctor(null);
    setSelectedDate('');
    setSelectedTimeSlot(null);
  };

  const handleBackToDoctor = () => {
    setStep('doctor');
    setSelectedDate('');
    setSelectedTimeSlot(null);
  };

  const handleNextFromTime = () => {
    if (!selectedDate || !selectedTimeSlot) return;
    if (user?.verified) {
      setStep('confirm');
    } else {
      setStep('verify');
    }
  };

  const handleVerify = async (method: 'ocr' | 'sukang' | 'manual' = 'manual') => {
    setVerifyStatus('verifying');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const verifyData = {
        method,
        verify_time: new Date().toISOString(),
        status: 'success',
      };
      try {
        await api.post('/verify/identity', verifyData);
      } catch (e) {
        // noop
      }
      setVerifyStatus('success');
      setTimeout(() => {
        setStep('confirm');
      }, 800);
    } catch (e) {
      setVerifyStatus('failed');
      alert('身份核验失败，请重试');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-50 text-green-600';
      case 'cancelled': return 'bg-warm-100 text-warm-500';
      default: return 'bg-blue-50 text-blue-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return '已确认';
      case 'cancelled': return '已取消';
      default: return '待确认';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif-cn text-2xl font-bold text-warm-800 flex items-center gap-2">
          <Heart className="w-6 h-6 text-accent" />
          预约挂号
        </h1>
        {isAuthenticated && (
          <button
            onClick={() => setShowMyAppointments(!showMyAppointments)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-warm-200 rounded-md hover:bg-warm-50"
          >
            <Ticket className="w-4 h-4" />
            我的挂号 ({appointments.length})
          </button>
        )}
      </div>

      {showMyAppointments && (
        <div className="mb-8 bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-warm-800">我的挂号记录</h3>
            <button onClick={() => setShowMyAppointments(false)} className="text-sm text-primary">
              返回挂号
            </button>
          </div>
          {appointments.length === 0 ? (
            <p className="text-center text-warm-500 py-6">暂无挂号记录</p>
          ) : (
            <div className="divide-y divide-warm-100">
              {appointments.map((apt: any) => (
                <div key={apt.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-warm-800">{apt.hospital_name} - {apt.department}</p>
                    <p className="text-sm text-warm-500">{apt.doctor_name} · {apt.appointment_time}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(apt.status)}`}>
                    {getStatusLabel(apt.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!showMyAppointments && (
        <>
          <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center shrink-0">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                    i <= currentIdx
                      ? 'bg-primary text-white'
                      : 'bg-warm-200 text-warm-500'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                    {i + 1}
                  </span>
                  {stepLabels[s]}
                </div>
                {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-warm-400 mx-1 shrink-0" />}
              </div>
            ))}
          </div>

          {step === 'hospital' && (
            <div className="grid gap-4">
              {hospitals.map((h) => (
                <button
                  key={h.id}
                  onClick={() => switchHospital(h.id)}
                  className="bg-white rounded-lg shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow text-left"
                >
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-warm-800">{h.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs bg-accent-50 text-accent px-2 py-0.5 rounded font-medium">
                        {h.level}
                      </span>
                      <span className="text-sm text-warm-500">{h.district}</span>
                      <span className="text-sm text-warm-500">{h.dept_count}个科室</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-warm-400" />
                </button>
              ))}
            </div>
          )}

          {step === 'department' && (
            <div>
              <button
                onClick={() => setStep('hospital')}
                className="text-sm text-primary hover:underline mb-4"
              >
                ← 返回选择医院
              </button>
              {renderHospitalSwitcher()}
              {departments.length === 0 ? (
                <div className="text-center py-12 text-warm-500">加载中...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => handleDeptSelect(dept)}
                      className={`bg-white rounded-lg shadow-sm p-4 text-center hover:shadow-md transition-all border-2 ${
                        selectedDeptId === dept.id 
                          ? 'border-primary bg-primary-50' 
                          : 'border-transparent hover:border-primary'
                      }`}
                    >
                      <Stethoscope className="w-6 h-6 text-primary mx-auto mb-2" />
                      <span className="text-sm font-medium text-warm-800 block">{dept.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'doctor' && (
            <div>
              <button
                onClick={handleBackToDept}
                className="text-sm text-primary hover:underline mb-4"
              >
                ← 返回选择科室
              </button>
              <div className="mb-4 text-sm text-warm-600">
                当前：{hospital?.name} · <span className="text-primary font-medium">{selectedDeptName}</span>
                {doctors.length > 0 && doctors[0].hospital_name && (
                  <span className="ml-2 text-xs text-warm-500">
                    （{doctors[0].hospital_name}专属号源）
                  </span>
                )}
              </div>
              {renderHospitalSwitcher()}
              {loading ? (
                <div className="text-center py-12 text-warm-500">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                  加载医生信息...
                </div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-12 text-warm-500">该科室暂无排班医生</div>
              ) : (
                <div className="grid gap-3">
                  {doctors.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleNextFromDoctor(doc)}
                      className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xl font-bold text-primary">{doc.name[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-warm-800">{doc.name}</h3>
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                              {doc.title}
                            </span>
                            <span className="text-xs bg-warm-100 text-warm-600 px-2 py-0.5 rounded">
                              {doc.specialty}
                            </span>
                          </div>
                          <p className="text-sm text-warm-500 mt-1">
                            <Clock className="w-3.5 h-3.5 inline mr-1" />
                            {doc.schedule}
                          </p>
                          <p className="text-sm text-warm-600 mt-2">
                            擅长：{doc.good_at.map((g) => (
                              <span key={g} className="inline-block bg-warm-50 text-warm-700 px-1.5 py-0.5 rounded text-xs mr-1.5 mt-1">
                                {g}
                              </span>
                            ))}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-accent font-bold text-lg">¥{doc.fee}</div>
                          <div className="text-xs text-warm-500 mt-0.5">挂号费</div>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleNextFromDoctor(doc);
                            }}
                            className="mt-2 px-4 py-1.5 bg-primary text-white text-sm rounded-md hover:bg-primary-light"
                          >
                            选择预约
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'time' && selectedDoctor && (
            <div>
              <button
                onClick={handleBackToDoctor}
                className="text-sm text-primary hover:underline mb-4"
              >
                ← 返回选择医生
              </button>
              <div className="mb-6 p-4 bg-primary-50 rounded-lg flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{selectedDoctor.name[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-warm-800">
                    {selectedDoctor.name} {selectedDoctor.title}
                  </p>
                  <p className="text-sm text-warm-600">
                    {selectedDoctor.hospital_name || hospital?.name} · {selectedDoctor.department_name || selectedDeptName}
                  </p>
                  <p className="text-xs text-primary mt-1">
                    挂号费：¥{selectedDoctor.fee}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-warm-800 mb-3">选择就诊日期</h3>
                <div className="grid grid-cols-7 gap-2">
                  {nextDays.map((d) => {
                    const dt = new Date(d);
                    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dt.getDay()];
                    return (
                      <button
                        key={d}
                        onClick={() => { setSelectedDate(d); setSelectedTimeSlot(null); }}
                        className={`p-2 rounded-lg text-center transition-colors ${
                          selectedDate === d
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-white border border-warm-200 hover:border-primary'
                        }`}
                      >
                        <div className="text-xs">{weekday}</div>
                        <div className="text-sm font-medium">{d.slice(5)}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <div>
                  <h3 className="font-semibold text-warm-800 mb-3">选择号源时段</h3>
                  {slots.length === 0 ? (
                    <div className="text-center py-8 text-warm-500">加载号源中...</div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {slots.map((slot) => {
                        const remaining = slot.available ?? slot.total - slot.used;
                        const isFull = remaining === 0;
                        return (
                          <button
                            key={slot.id}
                            disabled={isFull}
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`p-3 rounded-lg text-center transition-colors ${
                              isFull
                                ? 'bg-warm-100 text-warm-400 cursor-not-allowed line-through'
                                : selectedTimeSlot?.id === slot.id
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-white border border-warm-200 hover:border-primary'
                            }`}
                          >
                            <div className="text-sm font-medium">{slot.label}</div>
                            <div className={`text-xs mt-1 ${
                              isFull ? 'text-warm-400' : remaining <= 3 ? 'text-accent' : 'text-warm-500'
                            }`}>
                              {isFull ? '已约满' : `余${remaining}个号`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {selectedDate && selectedTimeSlot && (
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleNextFromTime}
                    className="px-6 h-10 bg-primary text-white rounded-md hover:bg-primary-light flex items-center gap-2"
                  >
                    下一步
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'verify' && selectedDoctor && (
            <div>
              <button
                onClick={() => setStep('time')}
                className="text-sm text-primary hover:underline mb-4"
              >
                ← 返回选择号源
              </button>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-6">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-warm-800">就诊人实名核验</h3>
                    <p className="text-sm text-warm-600 mt-1">根据《医疗机构管理条例》要求，挂号需实名就诊。支持苏康码核验和身份证OCR识别。</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <button
                  onClick={() => handleVerify('ocr')}
                  disabled={verifyStatus === 'verifying'}
                  className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary disabled:opacity-50"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Upload className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-warm-800">身份证OCR识别</h4>
                      <p className="text-sm text-warm-500">上传身份证照片自动识别</p>
                    </div>
                  </div>
                  <p className="text-xs text-warm-500">支持正反面识别，信息自动填充，AES-256-GCM加密传输</p>
                </button>

                <button
                  onClick={() => handleVerify('sukang')}
                  disabled={verifyStatus === 'verifying'}
                  className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition-shadow border-2 border-transparent hover:border-green-500 disabled:opacity-50"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center">
                      <FileCheck className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-warm-800">苏康码核验</h4>
                      <p className="text-sm text-warm-500">扫码快速完成身份核验</p>
                    </div>
                  </div>
                  <p className="text-xs text-warm-500">对接江苏省卫健委苏康码系统，实时核验健康状态</p>
                </button>
              </div>

              {verifyStatus === 'verifying' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
                    <div>
                      <p className="font-medium text-blue-800">正在核验身份信息...</p>
                      <p className="text-sm text-blue-600">请稍候，正在与公安身份系统比对</p>
                    </div>
                  </div>
                </div>
              )}

              {verifyStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">身份核验通过</p>
                      <p className="text-sm text-green-600">您的身份信息已完成公安系统核验，可继续预约</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h4 className="font-medium text-warm-800 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  就诊人信息
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1.5">姓名</label>
                    <input
                      type="text"
                      defaultValue={user?.name || ''}
                      className="w-full h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-warm-50"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1.5">身份证号</label>
                    <input
                      type="text"
                      defaultValue={user?.id_number ? `${user.id_number.slice(0, 6)}********${user.id_number.slice(14)}` : '3201**********1234'}
                      className="w-full h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-warm-50 font-mono"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1.5">手机号</label>
                    <input
                      type="text"
                      defaultValue={user?.phone || ''}
                      className="w-full h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-warm-50"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1.5">医保卡号</label>
                    <input
                      type="text"
                      defaultValue="****************"
                      className="w-full h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-warm-50"
                      readOnly
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setStep('time')}
                    className="px-5 h-10 border border-warm-300 rounded-md text-warm-600 hover:bg-warm-50"
                  >
                    返回
                  </button>
                  <button
                    onClick={() => handleVerify('manual')}
                    disabled={verifyStatus === 'verifying'}
                    className="px-5 h-10 bg-primary text-white rounded-md hover:bg-primary-light flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    确认实名信息
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'confirm' && selectedDoctor && selectedDate && selectedTimeSlot && (
            <div>
              <button
                onClick={() => user?.verified ? setStep('time') : setStep('verify')}
                className="text-sm text-primary hover:underline mb-4"
              >
                ← 返回
              </button>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-warm-800 mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  确认预约信息
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-warm-100">
                    <span className="text-warm-500">就诊医院</span>
                    <span className="text-warm-800 font-medium">{selectedDoctor.hospital_name || hospital?.name}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-warm-100">
                    <span className="text-warm-500">就诊科室</span>
                    <span className="text-warm-800 font-medium">{selectedDoctor.department_name || selectedDeptName}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-warm-100">
                    <span className="text-warm-500">主治医生</span>
                    <span className="text-warm-800 font-medium">{selectedDoctor.name} {selectedDoctor.title}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-warm-100">
                    <span className="text-warm-500">就诊日期</span>
                    <span className="text-warm-800 font-medium">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-warm-100">
                    <span className="text-warm-500">就诊时段</span>
                    <span className="text-warm-800 font-medium">{selectedTimeSlot.label}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-warm-100">
                    <span className="text-warm-500">就诊人</span>
                    <span className="text-warm-800 font-medium">{user?.name || '待核验'}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-warm-100">
                    <span className="text-warm-500">挂号费用</span>
                    <span className="text-accent font-bold text-xl">¥{selectedDoctor.fee}.00</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-warm-500">号源状态</span>
                    <span className="text-green-600 font-medium">
                      ✓ 已锁定，剩余 {selectedTimeSlot.available ?? selectedTimeSlot.total - selectedTimeSlot.used} 个号
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mt-6">
                  <p className="text-sm text-blue-700">
                    <strong>温馨提示：</strong>预约成功后，请在就诊当天提前15分钟到医院取号。如需取消请提前24小时操作。
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => user?.verified ? setStep('time') : setStep('verify')}
                    className="flex-1 h-11 border border-warm-300 rounded-md text-warm-600 hover:bg-warm-50"
                  >
                    返回修改
                  </button>
                  <button
                    onClick={() => setConfirmOpen(true)}
                    className="flex-1 h-11 bg-accent text-white rounded-md hover:bg-accent-light font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    确认并支付 ¥{selectedDoctor.fee}.00
                  </button>
                </div>
              </div>
            </div>
          )}

          {confirmOpen && selectedDoctor && hospital && selectedDate && selectedTimeSlot && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-warm-800 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    确认支付
                  </h3>
                  <button onClick={() => setConfirmOpen(false)}>
                    <X className="w-5 h-5 text-warm-400" />
                  </button>
                </div>

                <div className="text-center py-6">
                  <div className="text-3xl font-bold text-accent mb-1">¥{selectedDoctor.fee}.00</div>
                  <p className="text-sm text-warm-500">挂号费 - {selectedDoctor.title}</p>
                </div>

                <div className="space-y-3 text-sm bg-warm-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-warm-500">{selectedDoctor.hospital_name || hospital.name}</span>
                    <span className="text-warm-800">{selectedDoctor.department_name || selectedDeptName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-500">医生</span>
                    <span className="text-warm-800">{selectedDoctor.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-500">就诊时间</span>
                    <span className="text-warm-800">{selectedDate} {selectedTimeSlot.label}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmOpen(false)}
                    className="flex-1 h-10 border border-warm-300 rounded-md text-warm-600 hover:bg-warm-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 h-10 bg-accent text-white rounded-md hover:bg-accent-light flex items-center justify-center gap-2 font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    确认支付
                  </button>
                </div>
              </div>
            </div>
          )}

          {showSuccess && lastAppointment && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-bounce-in">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10 text-green-600 animate-scale-in" />
                  </div>
                  <h3 className="font-bold text-warm-800 text-lg">预约成功</h3>
                  <p className="text-sm text-warm-500 mt-1">您的挂号预约已确认</p>
                </div>

                <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg p-5 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-warm-500">预约编号</span>
                    <span className="font-mono font-bold text-primary">
                      GJ{Date.now().toString().slice(-8)}
                    </span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-warm-500">就诊医院</span>
                      <span className="text-warm-800 font-medium">{lastAppointment.hospital_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warm-500">就诊科室</span>
                      <span className="text-warm-800 font-medium">{lastAppointment.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warm-500">主治医生</span>
                      <span className="text-warm-800 font-medium">{lastAppointment.doctor_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warm-500">就诊时间</span>
                      <span className="text-warm-800 font-medium">{lastAppointment.appointment_time}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-warm-200">
                      <span className="text-warm-500">挂号费用</span>
                      <span className="text-accent font-bold">¥{lastAppointment.fee}.00</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-700">
                    <strong>温馨提示：</strong>请在就诊当天提前15分钟到医院取号。取号时请携带身份证和医保卡。如需取消请提前24小时操作。
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSuccess(false);
                      setShowMyAppointments(true);
                      setStep('hospital');
                      setSelectedHospital(null);
                      setSelectedDeptId(null);
                      setSelectedDeptName('');
                      setSelectedDoctor(null);
                      setSelectedDate('');
                      setSelectedTimeSlot(null);
                    }}
                    className="flex-1 h-10 border border-warm-300 rounded-md text-warm-600 hover:bg-warm-50"
                  >
                    查看我的挂号
                  </button>
                  <button
                    onClick={() => {
                      setShowSuccess(false);
                      setStep('hospital');
                      setSelectedHospital(null);
                      setSelectedDeptId(null);
                      setSelectedDeptName('');
                      setSelectedDoctor(null);
                      setSelectedDate('');
                      setSelectedTimeSlot(null);
                    }}
                    className="flex-1 h-10 bg-primary text-white rounded-md hover:bg-primary-light flex items-center justify-center gap-2 font-medium"
                  >
                    完成
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
