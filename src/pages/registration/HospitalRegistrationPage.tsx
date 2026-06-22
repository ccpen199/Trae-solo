import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  ChevronLeft,
  MapPin,
  Building2,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  Stethoscope,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  XCircle,
  QrCode,
  Download,
  Share2,
  X,
  ArrowLeft,
} from 'lucide-react';
import { registrationApi } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/format';
import type {
  Hospital,
  Department,
  Doctor,
  TimeSlot,
  Appointment,
} from '@shared/types';

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

function HospitalRegistrationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null
  );
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [loading, setLoading] = useState({
    hospital: true,
    departments: false,
    doctors: false,
    slots: false,
    booking: false,
  });
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const dateOptions = useMemo(() => {
    const dates: { date: string; label: string; weekday: string; isToday: boolean }[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = formatDate(d, 'YYYY-MM-DD');
      dates.push({
        date: dateStr,
        label: `${d.getMonth() + 1}月${d.getDate()}日`,
        weekday: `周${weekDays[d.getDay()]}`,
        isToday: i === 0,
      });
    }
    return dates;
  }, []);

  useEffect(() => {
    if (dateOptions.length > 0 && !selectedDate) {
      setSelectedDate(dateOptions[0].date);
    }
  }, [dateOptions, selectedDate]);

  useEffect(() => {
    const fetchHospital = async () => {
      if (!id) return;
      try {
        setLoading((prev) => ({ ...prev, hospital: true }));
        const res = await registrationApi.getHospital(id);
        setHospital(res.data);
      } catch (error) {
        console.error('Failed to fetch hospital:', error);
      } finally {
        setLoading((prev) => ({ ...prev, hospital: false }));
      }
    };
    fetchHospital();
  }, [id]);

  useEffect(() => {
    const fetchDepartments = async () => {
      if (!id) return;
      try {
        setLoading((prev) => ({ ...prev, departments: true }));
        const res = await registrationApi.getDepartments(id);
        setDepartments(res.data);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      } finally {
        setLoading((prev) => ({ ...prev, departments: false }));
      }
    };
    fetchDepartments();
  }, [id]);

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!selectedDepartment || !selectedDate) return;
      try {
        setLoading((prev) => ({ ...prev, doctors: true }));
        const res = await registrationApi.getDoctors(
          selectedDepartment,
          selectedDate
        );
        setDoctors(res.data);
        setSelectedDoctor(null);
        setSelectedSlot(null);
      } catch (error) {
        console.error('Failed to fetch doctors:', error);
      } finally {
        setLoading((prev) => ({ ...prev, doctors: false }));
      }
    };
    fetchDoctors();
  }, [selectedDepartment, selectedDate]);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedDoctor || !selectedDate) return;
      try {
        setLoading((prev) => ({ ...prev, slots: true }));
        const res = await registrationApi.getTimeSlots(
          selectedDoctor.id,
          selectedDate
        );
        setTimeSlots(res.data);
        setSelectedSlot(null);
      } catch (error) {
        console.error('Failed to fetch time slots:', error);
      } finally {
        setLoading((prev) => ({ ...prev, slots: false }));
      }
    };
    fetchTimeSlots();
  }, [selectedDoctor, selectedDate]);

  const generateQRCode = async (data: string) => {
    try {
      const url = await QRCode.toDataURL(data, {
        width: 220,
        margin: 2,
        color: {
          dark: '#001D66',
          light: '#ffffff',
        },
      });
      setQrCodeDataUrl(url);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const handleBookAppointment = async () => {
    if (!id || !selectedDepartment || !selectedDoctor || !selectedSlot) return;

    try {
      setLoading((prev) => ({ ...prev, booking: true }));
      const res = await registrationApi.createAppointment({
        hospitalId: id,
        departmentId: selectedDepartment,
        doctorId: selectedDoctor.id,
        date: selectedDate,
        timeSlot: selectedSlot.time,
      });
      setAppointment(res.data);
      await generateQRCode(res.data.qrCode);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to create appointment:', error);
    } finally {
      setLoading((prev) => ({ ...prev, booking: false }));
    }
  };

  const getSlotStatusInfo = (status: string) => {
    switch (status) {
      case 'available':
        return { label: '充足', color: 'badge-success', icon: CheckCircle2 };
      case 'limited':
        return { label: '紧张', color: 'badge-warning', icon: AlertCircle };
      case 'full':
        return { label: '已满', color: 'badge-danger', icon: XCircle };
      default:
        return { label: '充足', color: 'badge-success', icon: CheckCircle2 };
    }
  };

  const groupedSlots = useMemo(() => {
    return {
      morning: timeSlots.filter((s) => s.period === 'morning'),
      afternoon: timeSlots.filter((s) => s.period === 'afternoon'),
      evening: timeSlots.filter((s) => s.period === 'evening'),
    };
  }, [timeSlots]);

  const handleDeptClick = (deptId: string) => {
    if (expandedDept === deptId) {
      setExpandedDept(null);
    } else {
      setExpandedDept(deptId);
    }
  };

  const handleDeptSelect = (deptId: string) => {
    setSelectedDepartment(deptId);
  };

  if (loading.hospital) {
    return (
      <div className="page-content">
        <div className="skeleton h-12 w-48 rounded-lg mb-6" />
        <div className="skeleton h-32 rounded-2xl mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="skeleton h-96 rounded-xl" />
          </div>
          <div className="lg:col-span-3 space-y-6">
            <div className="skeleton h-24 rounded-xl" />
            <div className="skeleton h-48 rounded-xl" />
            <div className="skeleton h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <button
        onClick={() => navigate('/registration')}
        className="flex items-center gap-2 text-slate-600 hover:text-insurance-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回医院列表
      </button>

      {hospital && (
        <div className="card p-6 mb-6 bg-gradient-to-r from-insurance-500 to-insurance-600 text-white">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{hospital.name}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-white/20 text-sm">
                  {hospital.level}
                </span>
                {hospital.isInsurancePoint && (
                  <span className="px-3 py-1 rounded-full bg-medical-400/30 text-sm flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    医保定点医院
                  </span>
                )}
              </div>
              <p className="text-insurance-100 mt-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {hospital.address}
              </p>
              {hospital.isInsurancePoint && (
                <div className="flex items-center gap-6 mt-4 text-sm">
                  <div>
                    <span className="text-insurance-200">报销比例</span>
                    <p className="text-xl font-bold">
                      {hospital.insurancePolicy.reimbursementRate}%
                    </p>
                  </div>
                  <div>
                    <span className="text-insurance-200">起付标准</span>
                    <p className="text-xl font-bold">
                      {formatCurrency(hospital.insurancePolicy.deductible)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="card p-4 sticky top-6">
            <h3 className="section-title mb-4 text-lg">
              <Stethoscope className="w-5 h-5 inline-block mr-2 text-insurance-500" />
              科室导航
            </h3>
            {loading.departments ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton h-10 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2">
                {departments.map((dept) => (
                  <div key={dept.id}>
                    <button
                      onClick={() => handleDeptClick(dept.id)}
                      className={`w-full px-3 py-2.5 rounded-lg text-left flex items-center justify-between transition-colors ${
                        selectedDepartment === dept.id
                          ? 'bg-insurance-100 text-insurance-700'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="font-medium">{dept.name}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expandedDept === dept.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedDept === dept.id && dept.description && (
                      <div className="px-3 py-2 text-sm text-slate-500 bg-slate-50 rounded-b-lg -mt-1 mb-1">
                        {dept.description}
                      </div>
                    )}
                    <button
                      onClick={() => handleDeptSelect(dept.id)}
                      className={`w-full px-3 py-2 text-sm rounded-lg mb-1 flex items-center justify-between transition-colors ${
                        selectedDepartment === dept.id
                          ? 'bg-insurance-500 text-white'
                          : 'text-insurance-600 hover:bg-insurance-50'
                      }`}
                    >
                      <span>选择该科室</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="card p-4">
            <h3 className="section-title mb-4 text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-insurance-500" />
              选择就诊日期
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {dateOptions.map((d) => (
                <button
                  key={d.date}
                  onClick={() => setSelectedDate(d.date)}
                  className={`flex-shrink-0 px-4 py-3 rounded-xl text-center transition-all ${
                    selectedDate === d.date
                      ? 'bg-insurance-500 text-white shadow-btn'
                      : 'bg-slate-50 hover:bg-insurance-50 text-slate-700'
                  }`}
                >
                  <p
                    className={`text-sm ${
                      selectedDate === d.date ? 'text-insurance-100' : 'text-slate-500'
                    }`}
                  >
                    {d.weekday}
                  </p>
                  <p className="text-lg font-bold">{d.label}</p>
                  {d.isToday && (
                    <p
                      className={`text-xs mt-1 ${
                        selectedDate === d.date ? 'text-white' : 'text-insurance-600'
                      }`}
                    >
                      今天
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedDepartment ? (
            <>
              <div className="card p-4">
                <h3 className="section-title mb-4 text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-insurance-500" />
                  选择医生
                </h3>
                {loading.doctors ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="skeleton h-32 rounded-xl" />
                    ))}
                  </div>
                ) : doctors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {doctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        onClick={() => setSelectedDoctor(doctor)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedDoctor?.id === doctor.id
                            ? 'border-insurance-500 bg-insurance-50'
                            : 'border-slate-100 hover:border-insurance-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-insurance-100 to-insurance-50 flex items-center justify-center flex-shrink-0">
                            {doctor.avatar ? (
                              <img
                                src={doctor.avatar}
                                alt={doctor.name}
                                className="w-full h-full rounded-xl object-cover"
                              />
                            ) : (
                              <User className="w-7 h-7 text-insurance-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-slate-900">
                                {doctor.name}
                              </h4>
                              <span className="badge-info">{doctor.title}</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                              {doctor.department}
                            </p>
                            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                              <span className="text-slate-400">专长：</span>
                              {doctor.specialty}
                            </p>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                              <span className="text-sm text-slate-500">
                                挂号费：
                                <span className="text-insurance-600 font-bold">
                                  {formatCurrency(doctor.registrationFee)}
                                </span>
                              </span>
                              {selectedDoctor?.id === doctor.id && (
                                <CheckCircle2 className="w-5 h-5 text-insurance-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>该科室当日暂无出诊医生</p>
                    <p className="text-sm mt-1">请选择其他日期或科室</p>
                  </div>
                )}
              </div>

              {selectedDoctor && (
                <div className="card p-4">
                  <h3 className="section-title mb-4 text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-insurance-500" />
                    选择号源时段
                  </h3>
                  {loading.slots ? (
                    <div className="space-y-6">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-3">
                          <div className="skeleton h-5 w-20 rounded" />
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map((j) => (
                              <div key={j} className="skeleton h-16 rounded-xl" />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(['morning', 'afternoon', 'evening'] as const).map(
                        (period) => {
                          const slots = groupedSlots[period];
                          if (slots.length === 0) return null;
                          const periodLabels: Record<string, string> = {
                            morning: '上午',
                            afternoon: '下午',
                            evening: '晚上',
                          };
                          return (
                            <div key={period}>
                              <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-slate-400" />
                                {periodLabels[period]}
                              </h4>
                              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                {slots.map((slot) => {
                                  const statusInfo = getSlotStatusInfo(
                                    slot.status
                                  );
                                  const StatusIcon = statusInfo.icon;
                                  const isDisabled = slot.status === 'full';
                                  const isSelected = selectedSlot?.id === slot.id;

                                  return (
                                    <button
                                      key={slot.id}
                                      disabled={isDisabled}
                                      onClick={() =>
                                        !isDisabled && setSelectedSlot(slot)
                                      }
                                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                                        isDisabled
                                          ? 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'
                                          : isSelected
                                          ? 'border-insurance-500 bg-insurance-50'
                                          : 'border-slate-100 hover:border-insurance-200 hover:bg-insurance-50'
                                      }`}
                                    >
                                      <p
                                        className={`font-semibold ${
                                          isDisabled
                                            ? 'text-slate-400'
                                            : isSelected
                                            ? 'text-insurance-700'
                                            : 'text-slate-900'
                                        }`}
                                      >
                                        {slot.time}
                                      </p>
                                      <div
                                        className={`mt-2 flex items-center justify-center gap-1 ${
                                          isDisabled
                                            ? 'text-slate-400'
                                            : isSelected
                                            ? 'text-insurance-600'
                                            : ''
                                        }`}
                                      >
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        <span className="text-xs font-medium">
                                          {statusInfo.label}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-400 mt-1">
                                        剩余 {slot.available}/{slot.total}
                                      </p>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedSlot && (
                <div className="card p-6 bg-gradient-to-r from-insurance-50 to-white border-insurance-100">
                  <h3 className="section-title mb-4 text-lg text-insurance-700">
                    <CheckCircle2 className="w-5 h-5 inline-block mr-2" />
                    预约信息确认
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">医院</p>
                      <p className="font-medium text-slate-900">
                        {hospital?.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">科室</p>
                      <p className="font-medium text-slate-900">
                        {
                          departments.find((d) => d.id === selectedDepartment)
                            ?.name
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">医生</p>
                      <p className="font-medium text-slate-900">
                        {selectedDoctor?.name} {selectedDoctor?.title}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">日期</p>
                      <p className="font-medium text-slate-900">
                        {
                          dateOptions.find((d) => d.date === selectedDate)
                            ?.label
                        }{' '}
                        {
                          dateOptions.find((d) => d.date === selectedDate)
                            ?.weekday
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">时段</p>
                      <p className="font-medium text-slate-900">
                        {selectedSlot.time}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">挂号费</p>
                      <p className="font-medium text-insurance-600 text-lg">
                        {formatCurrency(selectedDoctor?.registrationFee || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                      <ShieldCheck className="w-4 h-4 inline-block mr-1 text-medical-500" />
                      本次挂号支持医保实时结算
                    </p>
                    <button
                      onClick={handleBookAppointment}
                      disabled={loading.booking}
                      className="btn-primary px-8"
                    >
                      {loading.booking ? '预约中...' : '确认预约挂号'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card p-12 text-center">
              <Stethoscope className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">
                请先选择就诊科室
              </h3>
              <p className="text-slate-500">
                从左侧科室导航中选择您需要就诊的科室
              </p>
            </div>
          )}
        </div>
      </div>

      {showSuccessModal && appointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="p-6 text-center bg-gradient-to-b from-insurance-500 to-insurance-600 text-white rounded-t-2xl">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold mb-2">预约成功</h2>
              <p className="text-insurance-100">您的挂号预约已成功提交</p>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-slate-500 mb-3">
                  医保电子凭证就诊码
                </p>
                <div className="inline-block p-4 bg-white rounded-2xl border-2 border-insurance-100">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="就诊码"
                      className="w-48 h-48"
                    />
                  ) : (
                    <div className="w-48 h-48 skeleton rounded-xl" />
                  )}
                </div>
                <p className="mt-3 font-mono text-lg font-bold text-slate-900 tracking-wider">
                  {appointment.medicalCode}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <h4 className="font-medium text-slate-900 mb-3">就诊信息</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">医院</span>
                    <span className="text-slate-900 font-medium">
                      {appointment.hospital}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">科室</span>
                    <span className="text-slate-900 font-medium">
                      {appointment.department}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">医生</span>
                    <span className="text-slate-900 font-medium">
                      {appointment.doctor}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">日期</span>
                    <span className="text-slate-900 font-medium">
                      {appointment.date} {appointment.timeSlot}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-500">挂号费</span>
                    <span className="text-insurance-600 font-bold">
                      {formatCurrency(appointment.registrationFee)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-medical-50 rounded-xl p-4 mb-6 border border-medical-100">
                <p className="text-sm text-medical-700 flex items-start gap-2">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>
                    请在就诊当日携带有效身份证件，提前30分钟到达医院，
                    出示此医保电子凭证就诊码进行签到就诊。
                  </span>
                </p>
              </div>

              <div className="flex gap-3">
                <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  保存凭证
                </button>
                <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4" />
                  分享
                </button>
              </div>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/');
                }}
                className="btn-primary w-full mt-3"
              >
                完成，返回首页
              </button>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HospitalRegistrationPage;
