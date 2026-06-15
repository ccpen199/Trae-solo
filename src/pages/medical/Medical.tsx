import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Thermometer, CreditCard, FileText, MapPin, Building, Clock, ChevronRight, Heart, TrendingUp, Star, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/api/client';
import type { Hospital } from '../../../shared/types';
import { cn } from '@/lib/utils';

const services = [
  { name: '预约挂号', icon: CalendarDays, path: '/medical/appointment', color: 'from-eco-400 to-eco-600', desc: '在线预约，省时省心' },
  { name: '候诊热力图', icon: Thermometer, path: '/medical/heatmap', color: 'from-warm-400 to-warm-600', desc: '实时查看候诊情况' },
  { name: '在线缴费', icon: CreditCard, path: '#', color: 'from-primary-400 to-primary-600', desc: '缴费不排队，轻松结算' },
  { name: '健康档案', icon: FileText, path: '#', color: 'from-purple-400 to-purple-600', desc: '我的健康数据中心' },
];

interface Appointment {
  id: string;
  hospitalName: string;
  department: string;
  doctorName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export default function Medical() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [hospitalData, appointmentData] = await Promise.all([
        api.medical.getHospitals(),
        api.medical.getAppointments(),
      ]);
      setHospitals(Array.isArray(hospitalData) ? hospitalData : []);
      setAppointments(Array.isArray(appointmentData) ? appointmentData.slice(0, 3) : []);
    } catch (e) {
      console.error('Failed to load medical data:', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: Appointment['status']) => {
    const configs = {
      pending: { text: '待确认', color: 'bg-warm-100 text-warm-600', icon: Clock },
      confirmed: { text: '已确认', color: 'bg-eco-100 text-eco-600', icon: CheckCircle },
      completed: { text: '已完成', color: 'bg-gray-100 text-gray-600', icon: Star },
      cancelled: { text: '已取消', color: 'bg-red-100 text-red-600', icon: AlertCircle },
    };
    return configs[status];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">医疗健康服务</h1>
          <p className="text-gray-500 mt-1">预约挂号、候诊查询，智慧医疗服务</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-eco-50 text-eco-600 rounded-xl">
          <Heart className="w-4 h-4" />
          <span className="text-sm font-medium">健康南宁</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((service, index) => (
          <button
            key={service.name}
            onClick={() => navigate(service.path)}
            className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 text-left group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg', service.color)}>
              <service.icon className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg mb-1">{service.name}</h3>
            <p className="text-sm text-gray-500">{service.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Building className="w-5 h-5 text-eco-500" />
              合作医院
            </h3>
            <span className="text-sm text-gray-500">共 {hospitals.length} 家医院</span>
          </div>
          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-xl">
                  <div className="h-5 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
              ))
            ) : hospitals.length > 0 ? (
              hospitals.map((hospital) => (
                <div
                  key={hospital.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-eco-50 transition-colors cursor-pointer group"
                  onClick={() => navigate('/medical/appointment')}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-eco-100 to-eco-200 flex items-center justify-center">
                      <Building className="w-7 h-7 text-eco-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800 group-hover:text-eco-600 transition-colors">{hospital.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-eco-100 text-eco-600 text-xs font-medium rounded-full">
                          {hospital.level}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {hospital.address}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-500">
                          科室：<span className="text-gray-700 font-medium">{hospital.departments?.length || 0}个</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          医生：<span className="text-gray-700 font-medium">
                            {hospital.departments?.reduce((acc, dept) => acc + (dept.doctors?.length || 0), 0) || 0}位
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-eco-500 transition-colors" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">暂无医院数据</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-eco-500" />
              我的预约
            </h3>
            <button
              onClick={() => navigate('/medical/appointment')}
              className="text-sm text-eco-600 font-medium hover:text-eco-700"
            >
              查看全部
            </button>
          </div>
          <div className="space-y-4">
            {loading ? (
              [1, 2].map((i) => (
                <div key={i} className="animate-pulse p-4 bg-gray-50 rounded-xl">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              ))
            ) : appointments.length > 0 ? (
              appointments.map((apt) => {
                const statusConfig = getStatusConfig(apt.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <div
                    key={apt.id}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-eco-200 hover:bg-eco-50 transition-all cursor-pointer"
                    onClick={() => navigate('/medical/appointment')}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-800 text-sm">{apt.hospitalName}</h4>
                      <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1', statusConfig.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.text}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{apt.department} · {apt.doctorName}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {apt.date} {apt.time}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-eco-100 flex items-center justify-center mx-auto mb-3">
                  <CalendarDays className="w-8 h-8 text-eco-500" />
                </div>
                <p className="text-gray-500">暂无预约记录</p>
                <p className="text-sm text-gray-400 mt-1">点击预约挂号开始您的健康之旅</p>
              </div>
            )}
          </div>
          {appointments.length > 0 && (
            <button
              onClick={() => navigate('/medical/appointment')}
              className="w-full mt-4 py-3 bg-gradient-to-r from-eco-500 to-eco-600 text-white rounded-xl font-medium hover:from-eco-600 hover:to-eco-700 transition-all shadow-lg hover:shadow-glow-green"
            >
              新建预约
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-eco-100 flex items-center justify-center text-eco-600">
              <Building className="w-5 h-5" />
            </div>
            <TrendingUp className="w-4 h-4 text-eco-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{hospitals.length}</p>
          <p className="text-sm text-gray-500 mt-1">合作医院</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
              <FileText className="w-5 h-5" />
            </div>
            <TrendingUp className="w-4 h-4 text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {hospitals.reduce((acc, h) => acc + (h.departments?.length || 0), 0)}
          </p>
          <p className="text-sm text-gray-500 mt-1">科室数量</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center text-warm-600">
              <Star className="w-5 h-5" />
            </div>
            <TrendingUp className="w-4 h-4 text-warm-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">98.5%</p>
          <p className="text-sm text-gray-500 mt-1">患者满意度</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Clock className="w-5 h-5" />
            </div>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">25分钟</p>
          <p className="text-sm text-gray-500 mt-1">平均候诊时间</p>
        </div>
      </div>
    </div>
  );
}
