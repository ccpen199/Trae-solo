import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import {
  CalendarDays, Search, Download, Phone, MapPin, User, Clock,
  CheckCircle2, XCircle, MessageSquare, ChevronLeft, ChevronRight,
  GripVertical, AlertCircle, Home,
} from 'lucide-react';
import {
  DatePicker, Select, Input, Avatar, Progress, Modal, Button,
  Tag, Empty, Tooltip,
} from 'antd';

const { RangePicker } = DatePicker;
const { Option } = Select;

type AppointmentStatus = 'pending' | 'accepted' | 'ongoing' | 'completed' | 'cancelled';

interface Appointment {
  id: number;
  customerName: string;
  customerAvatar: string;
  phone: string;
  address: string;
  fullAddress: string;
  area: number;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string;
  assignee?: string;
  houseType: string;
  decorationType: string;
}

const weekDays = (() => {
  const days = [];
  const today = dayjs();
  for (let i = 0; i < 7; i++) {
    const d = today.add(i, 'day');
    days.push({
      date: d.format('YYYY-MM-DD'),
      day: d.format('DD'),
      weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.day()],
      isToday: d.isSame(today, 'day'),
    });
  }
  return days;
})();

const timeSlots = Array.from({ length: 9 }, (_, i) => {
  const hour = 9 + i;
  return `${hour.toString().padStart(2, '0')}:00`;
});

const appointments: Appointment[] = [
  {
    id: 1,
    customerName: '张女士',
    customerAvatar: 'Z',
    phone: '138****5678',
    address: '阳光花园3栋',
    fullAddress: '阳光花园小区3栋2301室',
    area: 128,
    date: weekDays[0].date,
    startTime: '10:00',
    endTime: '11:30',
    status: 'pending',
    notes: '业主希望现代简约风格，关注收纳设计，预算25万左右',
    assignee: '张工',
    houseType: '三室两厅',
    decorationType: '全屋整装',
  },
  {
    id: 2,
    customerName: '王先生',
    customerAvatar: 'W',
    phone: '139****1234',
    address: '滨江壹号5栋',
    fullAddress: '滨江壹号小区5栋1202室',
    area: 186,
    date: weekDays[0].date,
    startTime: '14:00',
    endTime: '16:00',
    status: 'accepted',
    notes: '大平层，看重设计感，倾向新中式+现代混搭，预约设计师李工',
    assignee: '李工',
    houseType: '四室三厅',
    decorationType: '精装改造',
  },
  {
    id: 3,
    customerName: '李先生',
    customerAvatar: 'L',
    phone: '136****8899',
    address: '绿城春江月',
    fullAddress: '绿城春江月小区7栋803室',
    area: 105,
    date: weekDays[0].date,
    startTime: '09:30',
    endTime: '10:30',
    status: 'ongoing',
    notes: '年轻夫妻，首套房，北欧风格倾向，需要智能家电预留',
    assignee: '王工',
    houseType: '三室两厅',
    decorationType: '全屋整装',
  },
  {
    id: 4,
    customerName: '赵女士',
    customerAvatar: 'Z',
    phone: '137****4455',
    address: '万科城六期',
    fullAddress: '万科城六期2栋1501室',
    area: 89,
    date: weekDays[1].date,
    startTime: '10:00',
    endTime: '11:00',
    status: 'completed',
    notes: '已完成量房，方案预计周五出',
    assignee: '张工',
    houseType: '两室两厅',
    decorationType: '简装出租',
  },
  {
    id: 5,
    customerName: '刘女士',
    customerAvatar: 'L',
    phone: '135****7788',
    address: '江南府',
    fullAddress: '江南府小区10栋1806室',
    area: 142,
    date: weekDays[1].date,
    startTime: '14:30',
    endTime: '16:00',
    status: 'accepted',
    notes: '改善型住房，轻奢风，预算40万',
    assignee: '李工',
    houseType: '四室两厅',
    decorationType: '全屋整装',
  },
  {
    id: 6,
    customerName: '陈先生',
    customerAvatar: 'C',
    phone: '133****6677',
    address: '春风十里3栋',
    fullAddress: '春风十里花园3栋1102室',
    area: 133,
    date: weekDays[2].date,
    startTime: '09:00',
    endTime: '10:30',
    status: 'pending',
    notes: '二手房改造，保留部分硬装，需现场评估拆除量',
    houseType: '三室两厅',
    decorationType: '局部改造',
  },
  {
    id: 7,
    customerName: '周女士',
    customerAvatar: 'Z',
    phone: '131****2233',
    address: '保利时光印象',
    fullAddress: '保利时光印象6栋905室',
    area: 98,
    date: weekDays[3].date,
    startTime: '15:00',
    endTime: '16:30',
    status: 'pending',
    notes: '周末方便，需提前电话确认',
    houseType: '三室一厅',
    decorationType: '全屋整装',
  },
];

const statusConfig: Record<AppointmentStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  pending: { label: '待确认', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', dot: 'bg-amber-500' },
  accepted: { label: '已接单', color: 'text-haze-700', bg: 'bg-haze-50', border: 'border-haze-300', dot: 'bg-haze-500' },
  ongoing: { label: '进行中', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', dot: 'bg-emerald-500' },
  completed: { label: '已完成', color: 'text-ivory-700', bg: 'bg-ivory-100', border: 'border-ivory-300', dot: 'bg-ivory-500' },
  cancelled: { label: '已取消', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-300', dot: 'bg-rose-500' },
};

const AppointmentSchedule = () => {
  const [selectedDay, setSelectedDay] = useState(0);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [searchText, setSearchText] = useState('');
  const [modalAppointment, setModalAppointment] = useState<Appointment | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const days = weekDays;
  const currentDate = days[selectedDay].date;

  const dayAppointments = useMemo(() => {
    return appointments.filter(
      (a) => a.date === currentDate
        && (statusFilter === 'all' || a.status === statusFilter)
        && (!searchText || a.customerName.includes(searchText) || a.address.includes(searchText))
    );
  }, [currentDate, statusFilter, searchText]);

  const pendingList = appointments.filter((a) => a.status === 'pending');

  const weeklyStats = {
    total: 28,
    accepted: 24,
    completed: 16,
    cancelled: 2,
  };

  const assignees = [
    { name: '张工', count: 4, color: '#C4623A', max: 8 },
    { name: '李工', count: 5, color: '#6B8E9F', max: 8 },
    { name: '王工', count: 3, color: '#8B6914', max: 8 },
  ];

  const openAppointmentDetail = (apt: Appointment) => {
    setModalAppointment(apt);
    setModalVisible(true);
  };

  const renderTimeSlot = (time: string, slotIdx: number) => {
    const slotAppointments = dayAppointments.filter((a) => {
      const start = parseInt(a.startTime.split(':')[0], 10);
      const end = parseInt(a.endTime.split(':')[0], 10);
      const slotHour = 9 + slotIdx;
      return slotHour >= start && slotHour < end;
    });

    return (
      <div key={time} className="flex border-b border-ivory-100 last:border-b-0">
        <div className="w-20 flex-shrink-0 pr-3 pt-3 text-right border-r border-ivory-100">
          <span className="font-mono text-xs text-ivory-500">{time}</span>
        </div>
        <div className="flex-1 min-h-16 relative group hover:bg-ivory-50/60 transition-colors p-2">
          {slotAppointments.length > 0 ? (
            <div className="space-y-1.5">
              {slotAppointments.map((apt) => {
                const config = statusConfig[apt.status];
                const isFirstSlot = parseInt(apt.startTime.split(':')[0], 10) === 9 + slotIdx;
                if (!isFirstSlot) return null;
                const duration = (parseInt(apt.endTime.split(':')[0], 10) + parseInt(apt.endTime.split(':')[1], 10) / 60)
                  - (parseInt(apt.startTime.split(':')[0], 10) + parseInt(apt.startTime.split(':')[1], 10) / 60);
                const heightPx = Math.max(64, duration * 64 - 4);

                return (
                  <motion.div
                    key={apt.id}
                    layoutId={`apt-${apt.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    style={{ minHeight: heightPx }}
                    onClick={() => openAppointmentDetail(apt)}
                    className={`relative rounded-xl p-3 cursor-pointer border ${config.border} ${config.bg} group/card overflow-hidden hover:shadow-md transition-all duration-200`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.dot} rounded-l-xl`} />
                    <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                      <GripVertical className="w-4 h-4 text-ivory-400 cursor-grab" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar size={24} className={`!bg-gradient-to-br !from-${
                        apt.status === 'pending' ? 'amber' : apt.status === 'accepted' ? 'haze' : apt.status === 'ongoing' ? 'emerald' : 'ivory'
                      }-400 !to-${
                        apt.status === 'pending' ? 'amber' : apt.status === 'accepted' ? 'haze' : apt.status === 'ongoing' ? 'emerald' : 'ivory'
                      }-500 !text-white !text-[10px]`}>
                        {apt.customerAvatar}
                      </Avatar>
                      <span className={`text-xs font-semibold ${config.color}`}>
                        {apt.customerName}
                      </span>
                      <span className="font-mono text-[10px] text-ivory-500 ml-auto">
                        {apt.startTime}-{apt.endTime}
                      </span>
                    </div>
                    <p className="text-xs text-carbon-700 font-medium line-clamp-1 mb-1">
                      <MapPin className="w-3 h-3 inline mr-1 text-ivory-400" />
                      {apt.address}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-ivory-600">{apt.area}㎡</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${config.border} ${config.color} ${config.bg} font-medium`}>
                        {config.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <button className="w-full h-full min-h-14 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-haze-600 bg-haze-50 border border-haze-200 px-3 py-1 rounded-full hover:bg-haze-100 transition-colors">
                + 新建预约
              </span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="section-title">量房预约调度</h1>
          <p className="text-ivory-600">本周共 {weeklyStats.total} 个预约 · 待确认 {pendingList.length} 单</p>
        </div>
      </div>

      <div className="card-base p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-ivory-500" />
            <RangePicker
              defaultValue={[dayjs(), dayjs().add(6, 'day')]}
              className="!rounded-btn"
              size="middle"
            />
          </div>
          <Select
            defaultValue="all"
            className="!w-36"
            size="middle"
            onChange={(v: AppointmentStatus | 'all' | undefined) => setStatusFilter(v ?? 'all')}
          >
            <Option value="all">全部状态</Option>
            <Option value="pending">待确认</Option>
            <Option value="accepted">已接单</Option>
            <Option value="ongoing">进行中</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
          <div className="flex-1 min-w-64">
            <Input
              prefix={<Search className="w-4 h-4 text-ivory-400" />}
              placeholder="搜索客户名/地址/电话"
              className="!rounded-btn"
              size="middle"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <button className="btn-secondary text-sm">
            <Download className="w-4 h-4" />
            导出调度表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-8">
          <div className="card-base overflow-hidden">
            <div className="grid grid-cols-7 border-b border-ivory-200 bg-gradient-to-b from-ivory-50/60 to-transparent">
              {days.map((d, idx) => (
                <button
                  key={d.date}
                  onClick={() => setSelectedDay(idx)}
                  className={`relative py-4 px-2 transition-all duration-300 border-r border-ivory-100 last:border-r-0 ${
                    idx === selectedDay
                      ? 'bg-gradient-to-b from-terracotta-50/80 to-transparent'
                      : 'hover:bg-ivory-50/60'
                  }`}
                >
                  {idx === selectedDay && (
                    <motion.div
                      layoutId="activeDayIndicator"
                      className="absolute left-2 right-2 top-0 h-0.5 bg-gradient-to-r from-terracotta-400 to-terracotta-500 rounded-full"
                    />
                  )}
                  <p className={`text-xs mb-1 ${
                    d.isToday ? 'text-terracotta-600 font-semibold' : 'text-ivory-500'
                  }`}>
                    {d.isToday ? '今天' : d.weekday}
                  </p>
                  <div className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-mono text-sm font-semibold ${
                    idx === selectedDay
                      ? 'bg-gradient-to-br from-terracotta-400 to-terracotta-500 text-white shadow-md shadow-terracotta-500/30'
                      : d.isToday
                      ? 'bg-terracotta-50 text-terracotta-600 border border-terracotta-200'
                      : 'text-carbon-700'
                  }`}>
                    {d.day}
                  </div>
                  <div className="mt-2 flex justify-center gap-0.5">
                    {appointments.filter((a) => a.date === d.date).slice(0, 3).map((a) => (
                      <Tooltip key={a.id} title={`${a.customerName} - ${statusConfig[a.status].label}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[a.status].dot}`} />
                      </Tooltip>
                    ))}
                    {appointments.filter((a) => a.date === d.date).length > 3 && (
                      <span className="text-[9px] text-ivory-500">+{appointments.filter((a) => a.date === d.date).length - 3}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute left-20 top-0 bottom-0 w-px bg-ivory-200/70" />
              {timeSlots.map((time, idx) => renderTimeSlot(time, idx))}
            </div>

            {dayAppointments.length === 0 && (
              <div className="py-20">
                <Empty
                  description={
                    <div>
                      <p className="text-carbon-600 font-medium">当天暂无预约</p>
                      <p className="text-xs text-ivory-500 mt-1">点击空闲时段可创建新预约</p>
                    </div>
                  }
                />
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-5">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="card-base p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg text-carbon-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                待确认预约
              </h3>
              <span className="badge-warning">{pendingList.length} 单</span>
            </div>
            <div className="space-y-3">
              {pendingList.map((apt, idx) => {
                const config = statusConfig[apt.status];
                return (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + idx * 0.1 }}
                    className="p-4 rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50/70 to-white relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-terracotta-400" />
                    <div className="flex items-start gap-3">
                      <Avatar size={36} className="!bg-gradient-to-br !from-amber-400 !to-terracotta-500 !text-white !font-semibold">
                        {apt.customerAvatar}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-carbon-800">{apt.customerName}</span>
                          <span className="font-mono text-[11px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                            {apt.startTime}
                          </span>
                        </div>
                        <p className="text-xs text-ivory-600 mt-0.5 line-clamp-1">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {apt.fullAddress}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-ivory-600">
                          <span className="font-mono">{apt.area}㎡</span>
                          <span>·</span>
                          <span>{apt.houseType}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button className="px-3 py-2 rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-500 text-white text-sm font-medium hover:from-emerald-500 hover:to-emerald-600 transition-all duration-200 border border-emerald-400/30 shadow-sm shadow-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4 inline mr-1 -mt-0.5" />
                        接单
                      </button>
                      <button className="px-3 py-2 rounded-lg bg-white text-rose-600 text-sm font-medium border border-rose-200 hover:bg-rose-50 transition-all duration-200">
                        <XCircle className="w-4 h-4 inline mr-1 -mt-0.5" />
                        拒绝
                      </button>
                    </div>
                  </motion.div>
                );
              })}
              {pendingList.length === 0 && (
                <p className="text-center text-sm text-ivory-500 py-8">暂无待确认预约</p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card-base p-5"
          >
            <h3 className="font-serif text-lg text-carbon-800 mb-4 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-haze-500" />
              本周量房统计
            </h3>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: '总预约', value: weeklyStats.total, color: 'terracotta' },
                { label: '已接', value: weeklyStats.accepted, color: 'haze' },
                { label: '完成', value: weeklyStats.completed, color: 'emerald' },
                { label: '取消', value: weeklyStats.cancelled, color: 'rose' },
              ].map((item) => (
                <div key={item.label} className="text-center p-2 rounded-xl bg-ivory-50/60">
                  <p className={`font-mono text-2xl font-bold text-${item.color}-${item.color === 'emerald' ? '600' : item.color === 'rose' ? '600' : '500'}`}>
                    {item.value}
                  </p>
                  <p className="text-[11px] text-ivory-600 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="w-full h-1.5 bg-ivory-100 rounded-full overflow-hidden mb-6 flex">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(weeklyStats.completed / weeklyStats.total) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((weeklyStats.accepted - weeklyStats.completed) / weeklyStats.total) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="h-full bg-gradient-to-r from-haze-400 to-haze-500"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((weeklyStats.total - weeklyStats.accepted - weeklyStats.cancelled) / weeklyStats.total) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
              />
            </div>

            <h4 className="text-sm font-medium text-carbon-700 mb-3">量房师负载</h4>
            <div className="space-y-4">
              {assignees.map((a, idx) => (
                <motion.div
                  key={a.name}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                >
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <Avatar size={20} className={`!text-white !text-[10px]`} style={{ backgroundColor: a.color }}>
                        {a.name[0]}
                      </Avatar>
                      <span className="font-medium text-carbon-700">{a.name}</span>
                    </div>
                    <span className="font-mono text-xs text-ivory-600">{a.count} / {a.max} 单</span>
                  </div>
                  <Progress
                    percent={(a.count / a.max) * 100}
                    showInfo={false}
                    size="small"
                    strokeColor={a.color}
                    trailColor="#E8E4DD"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {modalVisible && modalAppointment && (
          <Modal
            open={modalVisible}
            onCancel={() => setModalVisible(false)}
            footer={null}
            width={560}
            centered
            destroyOnClose
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="px-2"
            >
              <div className="flex items-start justify-between mb-6 pb-5 border-b border-ivory-200">
                <div className="flex items-center gap-4">
                  <Avatar size={56} className={`!bg-gradient-to-br !from-${
                    modalAppointment.status === 'pending' ? 'amber' : modalAppointment.status === 'accepted' ? 'haze' : modalAppointment.status === 'ongoing' ? 'emerald' : 'ivory'
                  }-400 !to-${
                    modalAppointment.status === 'pending' ? 'amber' : modalAppointment.status === 'accepted' ? 'haze' : modalAppointment.status === 'ongoing' ? 'emerald' : 'ivory'
                  }-500 !text-white !text-lg !font-semibold`}>
                    {modalAppointment.customerAvatar}
                  </Avatar>
                  <div>
                    <h3 className="font-serif text-xl text-carbon-800">{modalAppointment.customerName}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`badge ${
                        modalAppointment.status === 'pending' ? 'badge-warning'
                        : modalAppointment.status === 'accepted' ? 'badge-haze'
                        : modalAppointment.status === 'ongoing' ? 'badge-success'
                        : modalAppointment.status === 'completed' ? 'badge-wood'
                        : 'badge-danger'
                      }`}>
                        {statusConfig[modalAppointment.status].label}
                      </span>
                      <span className="text-xs text-ivory-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {modalAppointment.startTime} - {modalAppointment.endTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-ivory-50/60">
                    <p className="text-xs text-ivory-500 mb-1">联系电话</p>
                    <p className="font-mono font-medium text-carbon-800">{modalAppointment.phone}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-ivory-50/60">
                    <p className="text-xs text-ivory-500 mb-1">房屋面积</p>
                    <p className="font-mono font-medium text-carbon-800">{modalAppointment.area}㎡ · {modalAppointment.houseType}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-haze-50/60 to-ivory-50/40 border border-haze-200/50">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-haze-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-ivory-500 mb-0.5">详细地址</p>
                      <p className="text-sm font-medium text-carbon-800">{modalAppointment.fullAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-wood-50/50 border border-wood-200/50">
                  <div className="flex items-start gap-2">
                    <Home className="w-4 h-4 text-wood-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-ivory-500 mb-1.5">装修需求</p>
                      <Tag color="orange" className="!m-0">{modalAppointment.decorationType}</Tag>
                      {modalAppointment.assignee && (
                        <p className="text-xs text-ivory-600 mt-2">安排设计师：{modalAppointment.assignee}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-ivory-200">
                  <p className="text-xs text-ivory-500 mb-2 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    历史备注
                  </p>
                  <p className="text-sm text-carbon-700 leading-relaxed">{modalAppointment.notes}</p>
                </div>
              </div>

              <div className="pt-5 border-t border-ivory-200 flex gap-3">
                <Button size="large" className="flex-1 !rounded-btn !h-11 flex items-center justify-center gap-2" icon={<Phone className="w-4 h-4" />}>
                  联系客户
                </Button>
                {modalAppointment.status === 'pending' && (
                  <>
                    <Button
                      size="large"
                      danger
                      ghost
                      className="!rounded-btn !h-11 !px-6"
                      icon={<XCircle className="w-4 h-4" />}
                    >
                      拒绝
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      className="!rounded-btn !h-11 !px-6 !bg-gradient-to-b !from-terracotta-400 !to-terracotta-500 !border-terracotta-500/30 hover:!from-terracotta-500 hover:!to-terracotta-600"
                      icon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      确认接单
                    </Button>
                  </>
                )}
                {(modalAppointment.status === 'accepted' || modalAppointment.status === 'ongoing') && (
                  <Button
                    type="primary"
                    size="large"
                    className="!rounded-btn !h-11 !px-6 !bg-gradient-to-b !from-emerald-400 !to-emerald-500 !border-emerald-500/30 hover:!from-emerald-500 hover:!to-emerald-600"
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    标记完成
                  </Button>
                )}
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppointmentSchedule;
