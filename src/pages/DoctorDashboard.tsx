import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  MessageCircle,
  Users,
  Star,
  Clock,
  TrendingUp,
  DollarSign,
  Calendar,
  ChevronRight,
  CheckCircle,
  User,
  PawPrint,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import type { Consultation } from '@shared/types';
import { cn } from '@/lib/utils';

const mockConsultations: Consultation[] = [
  {
    id: 'c1',
    ownerId: 'u1',
    doctorId: 'd1',
    petId: '1',
    type: 'text',
    status: 'pending',
    symptoms: '狗狗最近食欲不振，有点拉稀',
    createdAt: '2025-06-15T10:00:00Z',
  },
  {
    id: 'c2',
    ownerId: 'u2',
    doctorId: 'd1',
    petId: '2',
    type: 'video',
    status: 'ongoing',
    symptoms: '猫咪抓耳朵，怀疑耳螨',
    createdAt: '2025-06-15T09:30:00Z',
  },
  {
    id: 'c3',
    ownerId: 'u3',
    doctorId: 'd1',
    petId: '3',
    type: 'text',
    status: 'ongoing',
    symptoms: '金毛饮食建议咨询',
    createdAt: '2025-06-15T09:00:00Z',
  },
];

const stats = [
  { label: '今日问诊', value: '8', Icon: MessageCircle, color: 'from-forest-400 to-forest-600' },
  { label: '服务用户', value: '1,256', Icon: Users, color: 'from-blue-400 to-blue-600' },
  { label: '好评率', value: '98.5%', Icon: Star, color: 'from-warm-300 to-warm-500' },
  { label: '本月收入', value: '¥12,580', Icon: DollarSign, color: 'from-pink-400 to-pink-600' },
];

const todaySchedule = [
  { time: '09:00', title: '图文问诊 - 金毛肠胃问题', status: 'completed' },
  { time: '09:30', title: '视频问诊 - 猫咪耳螨', status: 'ongoing' },
  { time: '10:00', title: '图文问诊 - 狗狗食欲不振', status: 'pending' },
  { time: '14:00', title: '电话问诊 - 老年犬护理', status: 'pending' },
  { time: '15:30', title: '图文问诊 - 猫咪疫苗咨询', status: 'pending' },
];

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-forest-100 to-forest-200 flex items-center justify-center relative">
            <Stethoscope className="w-8 h-8 text-forest-500" />
            {isOnline && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              </span>
            )}
          </div>
          <div>
            <h1 className="section-title">{user?.nickname || '医生'}，您好！</h1>
            <p className="section-subtitle">
              {user?.role === 'doctor' ? '主任医师 · 内科' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={cn(
            'px-6 py-3 rounded-full font-medium transition-all',
            isOnline
              ? 'bg-green-500 text-white shadow-soft hover:bg-green-600'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          )}
        >
          {isOnline ? '● 在线接诊中' : '○ 离线休息'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card !p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                <stat.Icon className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-forest-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-0.5">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-gray-900">待处理问诊</h2>
              <button
                onClick={() => navigate('/consultations')}
                className="text-sm text-forest-600 hover:text-forest-700 font-medium flex items-center gap-1"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {mockConsultations.map((consultation) => (
                <div
                  key={consultation.id}
                  onClick={() => navigate(`/consultations/${consultation.id}`)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-cream-50 hover:bg-cream-100 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-forest-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">宠主用户</p>
                      <span
                        className={cn(
                          'tag text-xs',
                          consultation.status === 'pending'
                            ? 'tag-orange'
                            : consultation.status === 'ongoing'
                            ? 'bg-blue-100 text-blue-600'
                            : 'tag-green'
                        )}
                      >
                        {consultation.status === 'pending'
                          ? '等待接诊'
                          : consultation.status === 'ongoing'
                          ? '问诊中'
                          : '已完成'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1">{consultation.symptoms}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {consultation.type === 'text' && (
                      <MessageCircle className="w-5 h-5 text-forest-500" />
                    )}
                    {consultation.type === 'video' && (
                      <PawPrint className="w-5 h-5 text-blue-500" />
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-forest-500" />
                <h2 className="font-display font-bold text-lg text-gray-900">今日日程</h2>
              </div>
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="space-y-2">
              {todaySchedule.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-center gap-4 p-3 rounded-xl transition-colors',
                    item.status === 'completed'
                      ? 'bg-gray-50'
                      : item.status === 'ongoing'
                      ? 'bg-forest-50 ring-2 ring-forest-200'
                      : 'bg-cream-50 hover:bg-cream-100'
                  )}
                >
                  <div className="w-14 text-center">
                    <p className="text-sm font-semibold text-gray-900">{item.time}</p>
                  </div>
                  <div className="flex-1">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        item.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'
                      )}
                    >
                      {item.title}
                    </p>
                  </div>
                  {item.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-gray-400" />
                  )}
                  {item.status === 'ongoing' && (
                    <span className="tag bg-blue-100 text-blue-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 进行中
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="font-display font-bold text-lg text-gray-900 mb-4">数据概览</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">本周问诊量</span>
                  <span className="font-semibold text-gray-900">42 / 50</span>
                </div>
                <div className="h-2 bg-forest-50 rounded-full overflow-hidden">
                  <div className="h-full w-[84%] bg-gradient-to-r from-forest-400 to-forest-600 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">响应时间</span>
                  <span className="font-semibold text-gray-900">平均 3 分钟</span>
                </div>
                <div className="h-2 bg-forest-50 rounded-full overflow-hidden">
                  <div className="h-full w-[95%] bg-gradient-to-r from-warm-300 to-warm-500 rounded-full" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">好评率</span>
                  <span className="font-semibold text-gray-900">98.5%</span>
                </div>
                <div className="h-2 bg-forest-50 rounded-full overflow-hidden">
                  <div className="h-full w-[98.5%] bg-gradient-to-r from-pink-400 to-pink-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-forest-500 to-forest-700 text-white">
            <h3 className="font-display font-bold text-lg mb-2">快速操作</h3>
            <p className="text-forest-100 text-sm mb-4">高效管理您的问诊工作</p>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  我的处方模板
                </span>
                <ChevronRight className="w-5 h-5" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                <span className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5" />
                  执业资质管理
                </span>
                <ChevronRight className="w-5 h-5" />
              </button>
              <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                <span className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  查看评价
                </span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
