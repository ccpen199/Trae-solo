import { useState, useEffect } from 'react';
import { Landmark, CalendarDays, Users, X, Ticket, MapPin, AlertTriangle, CheckCircle2, User, ShieldAlert, History, Clock } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/utils/api';

interface TouristSpot {
  id: number;
  name: string;
  district: string;
  description: string;
  daily_limit: number;
  price: string;
  rating: number;
  color: string;
  remaining_tickets: number;
  reservation_open: boolean;
  reservation_notice?: string;
}

interface Reservation {
  id: number;
  spot: string;
  date: string;
  count: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'used';
  visitor_names: string[];
  qr_code?: string;
  created_at: string;
  can_reschedule?: boolean;
  original_date?: string;
  rescheduled_count?: number;
}

const spots: TouristSpot[] = [
  { id: 1, name: '中山陵', district: '玄武区', description: '国家5A级旅游景区，孙中山先生陵墓', daily_limit: 5000, price: '免费', rating: 4.8, color: 'bg-green-500', remaining_tickets: 3245, reservation_open: true },
  { id: 2, name: '夫子庙秦淮风光带', district: '秦淮区', description: '秦淮河畔历史文化街区', daily_limit: 8000, price: '免费', rating: 4.7, color: 'bg-amber-500', remaining_tickets: 6890, reservation_open: true },
  { id: 3, name: '明孝陵', district: '玄武区', description: '明太祖朱元璋与马皇后陵墓', daily_limit: 3000, price: '¥70', rating: 4.6, color: 'bg-red-500', remaining_tickets: 0, reservation_open: false, reservation_notice: '今日预约已满，请改期' },
  { id: 4, name: '南京博物院', district: '玄武区', description: '中国三大博物馆之一', daily_limit: 3000, price: '免费', rating: 4.9, color: 'bg-blue-500', remaining_tickets: 456, reservation_open: true },
  { id: 5, name: '总统府', district: '玄武区', description: '明清王府、太平天国天王府、民国政府', daily_limit: 2000, price: '¥35', rating: 4.5, color: 'bg-purple-500', remaining_tickets: 1234, reservation_open: true },
  { id: 6, name: '雨花台', district: '雨花台区', description: '红色旅游经典景区', daily_limit: 6000, price: '免费', rating: 4.4, color: 'bg-teal-500', remaining_tickets: 4521, reservation_open: true },
];

const visitorTypes = [
  { type: 'adult', label: '成人', price: 0, max: 4 },
  { type: 'child', label: '儿童（1.2米以下）', price: 0, max: 2 },
  { type: 'senior', label: '老人（60岁以上）', price: 0, max: 2 },
  { type: 'student', label: '学生（持学生证）', price: 0, max: 3 },
];

const idTypes = ['身份证', '护照', '军官证', '港澳通行证', '台胞证'];

export default function Tourism() {
  const { user, isAuthenticated } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<TouristSpot | null>(null);
  const [date, setDate] = useState('');
  const [reservationStep, setReservationStep] = useState<'info' | 'verify' | 'confirm' | 'success'>('info');
  const [visitors, setVisitors] = useState<{ name: string; idType: string; idNo: string }[]>([
    { name: '', idType: '身份证', idNo: '' },
  ]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [showMyReservations, setShowMyReservations] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [newDate, setNewDate] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadReservations();
    }
  }, [isAuthenticated]);

  const loadReservations = async () => {
    try {
      const data = await api.get<Reservation[]>('/tourism/reservations');
      setMyReservations(data);
    } catch (e) {
      // noop
    }
  };

  const nextDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  });

  const openReservation = (spot: TouristSpot) => {
    if (!spot.reservation_open) {
      return;
    }
    setSelectedSpot(spot);
    setDate('');
    setVisitors([{ name: '', idType: '身份证', idNo: '' }]);
    setReservationStep('info');
    setModalOpen(true);
  };

  const addVisitor = () => {
    if (visitors.length >= 5) return;
    setVisitors([...visitors, { name: '', idType: '身份证', idNo: '' }]);
  };

  const removeVisitor = (idx: number) => {
    if (visitors.length <= 1) return;
    setVisitors(visitors.filter((_, i) => i !== idx));
  };

  const updateVisitor = (idx: number, field: string, value: string) => {
    const updated = [...visitors];
    (updated[idx] as any)[field] = value;
    setVisitors(updated);
  };

  const validateIdCard = (idNo: string, idType: string): boolean => {
    if (idType === '身份证') {
      const idCardRegex = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
      return idCardRegex.test(idNo);
    }
    return idNo.trim().length >= 6;
  };

  const maskIdNo = (idNo: string, idType: string): string => {
    if (idType === '身份证' && idNo.length === 18) {
      return idNo.substring(0, 6) + '********' + idNo.substring(14);
    }
    if (idNo.length > 8) {
      return idNo.substring(0, 4) + '****' + idNo.substring(idNo.length - 4);
    }
    return idNo.substring(0, 2) + '****';
  };

  const canProceedToVerify = () => {
    if (!date || visitors.length === 0) return false;
    return visitors.every((v) => 
      v.name.trim().length >= 2 && 
      validateIdCard(v.idNo.trim(), v.idType)
    );
  };

  const handleReserve = async () => {
    if (!selectedSpot || !date) return;
    const agreeCheckbox = document.getElementById('agree') as HTMLInputElement;
    if (!agreeCheckbox?.checked) {
      alert('请先阅读并同意服务协议');
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.post<{ id: number; qr_code: string; reservation_no: string }>('/tourism/reservations', {
        spot_id: selectedSpot.id,
        date,
        visitors: visitors.length,
        visitor_names: visitors.map((v) => v.name),
        visitor_details: visitors.map((v) => ({
          name: v.name,
          id_type: v.idType,
          id_no: v.idNo,
        })),
      });
      if (result && result.reservation_no) {
        lastReservationNo = result.reservation_no;
      }
      setReservationStep('success');
      loadReservations();
    } catch (e) {
      alert('预约失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  let lastReservationNo = '';

  const handleDone = () => {
    setModalOpen(false);
    setShowMyReservations(true);
  };

  const openReschedule = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setNewDate('');
    setRescheduleModalOpen(true);
  };

  const handleReschedule = async () => {
    if (!selectedReservation || !newDate) return;
    setRescheduleLoading(true);
    try {
      await api.put(`/tourism/reservations/${selectedReservation.id}/reschedule`, { new_date: newDate });
      alert(`改期成功！新的参观日期：${newDate}`);
      setRescheduleModalOpen(false);
      loadReservations();
    } catch (e: any) {
      alert(e.message || '改期失败，请重试');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleCancel = async (reservationId: number) => {
    if (!confirm('确定要取消这个预约吗？取消后将无法恢复。')) return;
    setCancelLoading(true);
    try {
      await api.del(`/tourism/reservations/${reservationId}`);
      alert('预约已取消');
      loadReservations();
    } catch (e: any) {
      alert(e.message || '取消失败，请重试');
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-50 text-green-600';
      case 'pending': return 'bg-amber-50 text-amber-600';
      case 'cancelled': return 'bg-warm-100 text-warm-500';
      case 'used': return 'bg-blue-50 text-blue-600';
      default: return 'bg-warm-100 text-warm-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return '已确认';
      case 'pending': return '待审核';
      case 'cancelled': return '已取消';
      case 'used': return '已使用';
      default: return '未知';
    }
  };

  const totalVisitors = visitors.length;
  const ticketPrice = selectedSpot ? (selectedSpot.price === '免费' ? 0 : parseInt(selectedSpot.price.replace('¥', ''))) : 0;
  const totalPrice = ticketPrice * totalVisitors;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif-cn text-2xl font-bold text-warm-800 flex items-center gap-2">
          <Landmark className="w-6 h-6 text-primary" />
          文旅预约
        </h1>
        {isAuthenticated && (
          <button
            onClick={() => setShowMyReservations(!showMyReservations)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-warm-200 rounded-md hover:bg-warm-50"
          >
            <History className="w-4 h-4" />
            我的预约 ({myReservations.length})
          </button>
        )}
      </div>

      {showMyReservations && (
        <div className="mb-8 bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-warm-800 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              我的预约记录
            </h3>
            <button onClick={() => setShowMyReservations(false)} className="text-sm text-primary">
              返回景点列表
            </button>
          </div>
          {myReservations.length === 0 ? (
            <p className="text-center text-warm-500 py-8">暂无预约记录</p>
          ) : (
            <div className="space-y-4">
              {myReservations.map((r) => (
                <div key={r.id} className="border border-warm-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-warm-800">{r.spot}</h4>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(r.status)}`}>
                          {getStatusLabel(r.status)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-warm-500">出行日期：</span>
                          <span className="text-warm-800">{r.date}</span>
                        </div>
                        <div>
                          <span className="text-warm-500">人数：</span>
                          <span className="text-warm-800">{r.count}人</span>
                        </div>
                        <div>
                          <span className="text-warm-500">同行人：</span>
                          <span className="text-warm-800">{r.visitor_names.join('、')}</span>
                        </div>
                        <div>
                          <span className="text-warm-500">提交时间：</span>
                          <span className="text-warm-800">{r.created_at}</span>
                        </div>
                      </div>
                      {r.qr_code && (
                        <div className="mt-3 flex items-center gap-4">
                          <div className="w-24 h-24 bg-white border border-warm-200 rounded flex items-center justify-center">
                            <div className="w-16 h-16 border-2 border-warm-300 rounded flex items-center justify-center text-xs text-warm-400">
                              预约码
                            </div>
                          </div>
                          <div className="text-sm">
                            <p className="text-warm-600">请凭预约码及身份证入园</p>
                            <p className="text-warm-500 text-xs mt-1">预约码：{r.qr_code}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {r.status === 'confirmed' && (
                      <div className="flex flex-col gap-2">
                        {r.can_reschedule && (
                          <button
                            onClick={() => openReschedule(r)}
                            className="px-3 py-1.5 text-sm text-primary border border-primary/30 rounded-md hover:bg-primary/5 flex items-center gap-1"
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                            改期
                          </button>
                        )}
                        <button
                          onClick={() => handleCancel(r.id)}
                          disabled={cancelLoading}
                          className="px-3 py-1.5 text-sm text-accent border border-accent/30 rounded-md hover:bg-accent/5 disabled:opacity-50"
                        >
                          取消预约
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!showMyReservations && (
        <>
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-warm-700">
              <strong>温馨提示：</strong>南京文旅景区实行实名制预约，请提前准备好本人及同行人身份证信息。热门景区建议提前3-7天预约。
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {spots.map((spot) => (
              <div key={spot.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className={`h-36 ${spot.color} flex items-center justify-center relative`}>
                  <Landmark className="w-14 h-14 text-white/60" />
                  <div className="absolute top-3 right-3 flex gap-2">
                    {spot.price === '免费' ? (
                      <span className="bg-white/90 text-green-700 text-xs px-2 py-0.5 rounded font-medium">免费</span>
                    ) : (
                      <span className="bg-white/90 text-amber-700 text-xs px-2 py-0.5 rounded font-medium">{spot.price}</span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-warm-800">{spot.name}</h3>
                    <span className="text-xs bg-primary-50 text-primary px-2 py-0.5 rounded flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 inline mr-0.5" />
                      {spot.district}
                    </span>
                  </div>
                  <p className="text-sm text-warm-500 line-clamp-2 mb-3 h-10">{spot.description}</p>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-warm-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        今日剩余：{spot.remaining_tickets} / {spot.daily_limit}
                      </span>
                      <span className="text-amber-500">★ {spot.rating}</span>
                    </div>
                    <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (1 - spot.remaining_tickets / spot.daily_limit) * 100)}%`,
                          backgroundColor: spot.remaining_tickets < 500 ? '#E53E3E' : spot.remaining_tickets < 1000 ? '#D69E2E' : '#1A365D',
                        }}
                      />
                    </div>
                  </div>

                  {!spot.reservation_open ? (
                    <div className="flex items-center gap-1 text-amber-600 text-sm mb-3">
                      <AlertTriangle className="w-4 h-4" />
                      {spot.reservation_notice || '预约已关闭'}
                    </div>
                  ) : spot.remaining_tickets < 500 ? (
                    <div className="flex items-center gap-1 text-red-600 text-sm mb-3">
                      <AlertTriangle className="w-4 h-4" />
                      余票紧张，仅剩{spot.remaining_tickets}张
                    </div>
                  ) : null}

                  <button
                    onClick={() => openReservation(spot)}
                    disabled={!spot.reservation_open}
                    className="w-full h-10 bg-primary text-white rounded-md text-sm hover:bg-primary-light transition-colors flex items-center justify-center gap-1 disabled:bg-warm-300 disabled:cursor-not-allowed"
                  >
                    <Ticket className="w-4 h-4" />
                    {spot.reservation_open ? '立即预约' : '预约已满'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modalOpen && selectedSpot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {reservationStep === 'info' && (
              <>
                <div className="sticky top-0 bg-white border-b border-warm-200 px-6 py-4 flex items-center justify-between">
                  <h3 className="font-semibold text-warm-800">预约 - {selectedSpot.name}</h3>
                  <button onClick={() => setModalOpen(false)}>
                    <X className="w-5 h-5 text-warm-400" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {selectedSpot.remaining_tickets < 500 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">余票预警</p>
                        <p className="text-sm text-amber-700">当前景点剩余{selectedSpot.remaining_tickets}张门票，请尽快完成预约</p>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-warm-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Landmark className="w-5 h-5 text-primary" />
                      <span className="font-medium text-warm-800">{selectedSpot.name}</span>
                      <span className="text-xs text-warm-500">日限流 {selectedSpot.daily_limit} 人</span>
                    </div>
                    <p className="text-sm text-warm-600">{selectedSpot.description}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1.5">
                      <CalendarDays className="w-4 h-4 inline mr-1" />
                      参观日期 <span className="text-accent">*</span>
                    </label>
                    <select
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">请选择日期</option>
                      {nextDays.map((d) => {
                        const dt = new Date(d);
                        const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dt.getDay()];
                        return (
                          <option key={d} value={d}>
                            {d}（{weekday}）
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-warm-700">
                        <User className="w-4 h-4 inline mr-1" />
                        游客信息 <span className="text-accent">*</span>
                        <span className="text-warm-500 font-normal ml-2">实名制预约，最多5人</span>
                      </label>
                      {visitors.length < 5 && (
                        <button
                          type="button"
                          onClick={addVisitor}
                          className="text-sm text-primary hover:underline"
                        >
                          添加游客
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {visitors.map((visitor, idx) => (
                        <div key={idx} className="p-4 bg-warm-50 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-warm-600">游客 {idx + 1} {idx === 0 && <span className="text-xs bg-primary-50 text-primary px-1.5 py-0.5 rounded ml-2">本人</span>}</span>
                            {visitors.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeVisitor(idx)}
                                className="text-xs text-accent hover:underline"
                              >
                                删除
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-warm-500 mb-1">姓名 <span className="text-accent">*</span></label>
                              <input
                                type="text"
                                value={visitor.name}
                                onChange={(e) => updateVisitor(idx, 'name', e.target.value)}
                                placeholder="请输入真实姓名"
                                className={`w-full h-9 px-3 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                                  visitor.name.trim().length > 0 && visitor.name.trim().length < 2 
                                    ? 'border-red-300 bg-red-50' 
                                    : 'border-warm-200'
                                }`}
                              />
                              {visitor.name.trim().length > 0 && visitor.name.trim().length < 2 && (
                                <p className="text-xs text-red-500 mt-1">姓名至少2个字符</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs text-warm-500 mb-1">证件类型 <span className="text-accent">*</span></label>
                              <select
                                value={visitor.idType}
                                onChange={(e) => updateVisitor(idx, 'idType', e.target.value)}
                                className="w-full h-9 px-3 border border-warm-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              >
                                {idTypes.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-warm-500 mb-1">证件号码 <span className="text-accent">*</span></label>
                              <input
                                type="text"
                                value={visitor.idNo}
                                onChange={(e) => updateVisitor(idx, 'idNo', e.target.value)}
                                placeholder="请输入18位身份证号码"
                                maxLength={visitor.idType === '身份证' ? 18 : undefined}
                                className={`w-full h-9 px-3 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono ${
                                  visitor.idNo.trim().length > 0 && !validateIdCard(visitor.idNo.trim(), visitor.idType)
                                    ? 'border-red-300 bg-red-50' 
                                    : 'border-warm-200'
                                }`}
                              />
                              {visitor.idNo.trim().length > 0 && !validateIdCard(visitor.idNo.trim(), visitor.idType) && (
                                <p className="text-xs text-red-500 mt-1">
                                  {visitor.idType === '身份证' ? '请输入有效的18位身份证号' : '证件号码至少6位'}
                                </p>
                              )}
                              {visitor.idNo.trim().length > 0 && validateIdCard(visitor.idNo.trim(), visitor.idType) && (
                                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  格式正确
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-warm-50 rounded-lg p-4 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-warm-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-warm-600">
                      <strong>实名制预约须知：</strong>根据《南京市文旅景区实名制预约办法》，所有游客均需提供真实身份信息。入园时需凭预约二维码及有效身份证件核验入场。虚假身份信息将导致预约作废。
                    </p>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-warm-200 px-6 py-4 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-warm-500">费用合计：</span>
                    <span className="text-xl font-bold text-accent ml-2">
                      {totalPrice > 0 ? `¥${totalPrice}.00` : '免费'}
                    </span>
                    <span className="text-xs text-warm-500 ml-2">（{totalVisitors}人）</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setModalOpen(false)}
                      className="px-5 h-10 border border-warm-300 rounded-md text-warm-600 hover:bg-warm-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => isAuthenticated ? setReservationStep('verify') : window.location.href = '/login'}
                      disabled={!canProceedToVerify()}
                      className="px-5 h-10 bg-primary text-white rounded-md hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isAuthenticated ? '下一步' : '请先登录'}
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {reservationStep === 'verify' && (
              <>
                <div className="sticky top-0 bg-white border-b border-warm-200 px-6 py-4 flex items-center justify-between">
                  <h3 className="font-semibold text-warm-800 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    实名信息核验
                  </h3>
                  <button onClick={() => setReservationStep('info')}>
                    ← 返回修改
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      根据《南京市文旅景区实名预约管理规定》，您填写的身份信息将与公安部门身份核验系统进行比对，核验通过后方可完成预约。
                    </p>
                  </div>

                  <div className="bg-white border border-warm-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-warm-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-warm-600">序号</th>
                          <th className="px-4 py-3 text-left font-medium text-warm-600">姓名</th>
                          <th className="px-4 py-3 text-left font-medium text-warm-600">证件类型</th>
                          <th className="px-4 py-3 text-left font-medium text-warm-600">证件号码</th>
                          <th className="px-4 py-3 text-left font-medium text-warm-600">核验状态</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warm-100">
                        {visitors.map((v, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-warm-600">{idx + 1}</td>
                            <td className="px-4 py-3 text-warm-800 font-medium">{v.name}</td>
                            <td className="px-4 py-3 text-warm-600">{v.idType}</td>
                            <td className="px-4 py-3 text-warm-600 font-mono">{maskIdNo(v.idNo, v.idType)}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                核验通过
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-warm-50 rounded-lg">
                      <h4 className="font-medium text-warm-800 mb-2">预约信息</h4>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-warm-500">景点</span>
                          <span className="text-warm-800">{selectedSpot.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-warm-500">日期</span>
                          <span className="text-warm-800">{date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-warm-500">人数</span>
                          <span className="text-warm-800">{totalVisitors}人</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-warm-50 rounded-lg">
                      <h4 className="font-medium text-warm-800 mb-2">费用明细</h4>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-warm-500">门票 {ticketPrice > 0 ? `× ${totalVisitors}` : ''}</span>
                          <span className="text-warm-800">{totalPrice > 0 ? `¥${ticketPrice}.00 × ${totalVisitors}` : '免费'}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-warm-200">
                          <span className="font-medium text-warm-700">合计</span>
                          <span className="text-lg font-bold text-accent">{totalPrice > 0 ? `¥${totalPrice}.00` : '免费'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <input type="checkbox" id="agree" className="mt-1" />
                    <label htmlFor="agree" className="text-sm text-warm-600">
                      我已阅读并同意《南京市文旅景区预约服务协议》《个人信息保护政策》，承诺所填身份信息真实有效。
                    </label>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-warm-200 px-6 py-4 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setReservationStep('info')}
                    className="px-5 h-10 border border-warm-300 rounded-md text-warm-600 hover:bg-warm-50"
                  >
                    返回修改
                  </button>
                  <button
                    onClick={() => setReservationStep('confirm')}
                    className="px-5 h-10 bg-primary text-white rounded-md hover:bg-primary-light flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    确认并提交预约
                  </button>
                </div>
              </>
            )}

            {reservationStep === 'confirm' && (
              <>
                <div className="sticky top-0 bg-white border-b border-warm-200 px-6 py-4 flex items-center justify-between">
                  <h3 className="font-semibold text-warm-800">确认预约信息</h3>
                  <button onClick={() => setReservationStep('verify')}>← 返回</button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <Clock className="w-12 h-12 text-green-600 mx-auto mb-2" />
                    <p className="font-medium text-green-800">请确认以下预约信息，点击提交后系统将立即锁定门票</p>
                  </div>

                  <div className="bg-white border border-warm-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between py-2 border-b border-warm-100">
                      <span className="text-warm-500">景点名称</span>
                      <span className="text-warm-800 font-medium">{selectedSpot.name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-warm-100">
                      <span className="text-warm-500">预约日期</span>
                      <span className="text-warm-800 font-medium">{date}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-warm-100">
                      <span className="text-warm-500">游客人数</span>
                      <span className="text-warm-800 font-medium">{totalVisitors}人</span>
                    </div>
                    
                    <div className="py-2 border-b border-warm-100">
                      <div className="text-warm-500 text-sm mb-2">游客实名信息确认</div>
                      <div className="bg-warm-50 rounded-lg p-3 space-y-2">
                        {visitors.map((v, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-warm-600">{idx + 1}.</span>
                              <span className="text-warm-800 font-medium">{v.name}</span>
                              <span className="text-warm-500 text-xs">({v.idType})</span>
                            </div>
                            <span className="text-warm-600 font-mono text-xs">{maskIdNo(v.idNo, v.idType)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between py-2">
                      <span className="text-warm-500">费用合计</span>
                      <span className="text-xl font-bold text-accent">{totalPrice > 0 ? `¥${totalPrice}.00` : '免费'}</span>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-warm-200 px-6 py-4 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setReservationStep('verify')}
                    className="px-5 h-10 border border-warm-300 rounded-md text-warm-600 hover:bg-warm-50"
                  >
                    返回
                  </button>
                  <button
                    onClick={handleReserve}
                    disabled={submitting}
                    className="px-6 h-10 bg-accent text-white rounded-md hover:bg-accent-light flex items-center gap-2 font-medium disabled:opacity-60"
                  >
                    {submitting ? '提交中...' : '确认提交预约'}
                    <Ticket className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {reservationStep === 'success' && (
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
                    <CheckCircle2 className="w-10 h-10 text-green-600 animate-scale-in" />
                  </div>
                  <h3 className="text-xl font-semibold text-warm-800 mb-2">预约提交成功！</h3>
                  <p className="text-warm-600">
                    您的{selectedSpot.name}预约已提交，系统已为您锁定{totalVisitors}张门票
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-5 max-w-md mx-auto mb-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-blue-100">
                    <div>
                      <p className="text-xs text-warm-500 mb-1">预约编号</p>
                      <p className="text-lg font-bold text-primary font-mono">
                        NJ{String(Date.now()).slice(-10)}
                      </p>
                    </div>
                    <div className="w-16 h-16 bg-white border border-warm-200 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-10 h-10 border-2 border-warm-300 rounded flex items-center justify-center">
                          <Ticket className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-[10px] text-warm-400 mt-1">预约码</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-warm-500">景点名称</span>
                      <span className="text-warm-800 font-medium">{selectedSpot.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warm-500">出行日期</span>
                      <span className="text-warm-800">{date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warm-500">预约人数</span>
                      <span className="text-warm-800">{totalVisitors}人</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warm-500">费用合计</span>
                      <span className="text-warm-800 font-bold text-accent">
                        {totalPrice > 0 ? `¥${totalPrice}.00` : '免费'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-blue-100">
                    <p className="text-xs text-warm-500 mb-2">游客名单</p>
                    <div className="flex flex-wrap gap-2">
                      {visitors.map((v, idx) => (
                        <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-warm-200">
                          {v.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-lg p-4 max-w-md mx-auto mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">入园须知</p>
                      <ul className="list-disc list-inside text-xs text-amber-700 space-y-1">
                        <li>请携带预约时使用的有效身份证件原件</li>
                        <li>提前15分钟到达景区入口，配合工作人员核验</li>
                        <li>预约确认短信已发送至您的注册手机</li>
                        <li>如需取消预约，请提前24小时操作</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-5 h-10 border border-warm-300 rounded-md text-warm-600 hover:bg-warm-50"
                  >
                    继续预约
                  </button>
                  <button
                    onClick={handleDone}
                    className="px-5 h-10 bg-primary text-white rounded-md hover:bg-primary-light flex items-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    查看我的预约
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {rescheduleModalOpen && selectedReservation && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-warm-200 flex items-center justify-between">
              <h3 className="font-semibold text-warm-800 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                预约改期
              </h3>
              <button onClick={() => setRescheduleModalOpen(false)}>
                <X className="w-5 h-5 text-warm-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-warm-50 rounded-lg p-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-warm-500">景点</span>
                    <span className="text-warm-800 font-medium">{selectedReservation.spot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-500">当前预约日期</span>
                    <span className="text-warm-800">{selectedReservation.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-500">预约人数</span>
                    <span className="text-warm-800">{selectedReservation.count}人</span>
                  </div>
                </div>
              </div>

              {selectedReservation.original_date && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  已改期 {selectedReservation.rescheduled_count || 1} 次，原日期：{selectedReservation.original_date}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  新的参观日期 <span className="text-accent">*</span>
                </label>
                <select
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full h-10 px-3 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">请选择新日期</option>
                  {nextDays.filter(d => d !== selectedReservation.date).map((d) => {
                    const dt = new Date(d);
                    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dt.getDay()];
                    return (
                      <option key={d} value={d}>
                        {d}（{weekday}）
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">改期须知</p>
                <ul className="list-disc list-inside text-xs space-y-1 text-blue-700">
                  <li>改期后原预约自动取消，新预约需重新确认</li>
                  <li>如已过原预约日期，则无法改期</li>
                  <li>改期成功后将发送短信通知</li>
                </ul>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-warm-200 flex justify-end gap-3">
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="px-5 h-10 border border-warm-300 rounded-md text-warm-600 hover:bg-warm-50"
              >
                取消
              </button>
              <button
                onClick={handleReschedule}
                disabled={!newDate || rescheduleLoading}
                className="px-5 h-10 bg-primary text-white rounded-md hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {rescheduleLoading ? '提交中...' : '确认改期'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
