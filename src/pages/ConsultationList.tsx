import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  MessageCircle,
  Video,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Stethoscope,
  Search,
} from 'lucide-react';
import DoctorCard from '@/components/DoctorCard';
import type { Consultation, Doctor } from '@shared/types';
import { cn } from '@/lib/utils';

const mockConsultations: Consultation[] = [
  {
    id: 'c1',
    ownerId: '1',
    doctorId: '1',
    petId: '1',
    type: 'text',
    status: 'ongoing',
    symptoms: '狗狗最近食欲不振，有点拉稀',
    createdAt: '2025-06-14T10:00:00Z',
  },
  {
    id: 'c2',
    ownerId: '1',
    doctorId: '2',
    petId: '2',
    type: 'video',
    status: 'completed',
    symptoms: '猫咪抓耳朵，怀疑耳螨',
    diagnosis: '确诊为耳螨，已开处方药',
    createdAt: '2025-06-10T15:30:00Z',
    completedAt: '2025-06-10T16:15:00Z',
  },
  {
    id: 'c3',
    ownerId: '1',
    doctorId: '3',
    petId: '1',
    type: 'text',
    status: 'pending',
    symptoms: '想咨询一下金毛的饮食建议',
    createdAt: '2025-06-15T08:00:00Z',
  },
];

const mockDoctors: Doctor[] = [
  {
    id: '1',
    userId: 'd1',
    hospitalId: 'h1',
    name: '王医生',
    title: '主任医师',
    department: '内科',
    licenseNumber: 'VET20200001',
    licenseVerified: true,
    rating: 4.9,
    consultationCount: 1256,
    isOnline: true,
  },
  {
    id: '2',
    userId: 'd2',
    hospitalId: 'h1',
    name: '李医生',
    title: '副主任医师',
    department: '外科',
    licenseNumber: 'VET20200002',
    licenseVerified: true,
    rating: 4.8,
    consultationCount: 892,
    isOnline: true,
  },
  {
    id: '3',
    userId: 'd3',
    hospitalId: 'h2',
    name: '张医生',
    title: '执业兽医师',
    department: '皮肤科',
    licenseNumber: 'VET20210015',
    licenseVerified: true,
    rating: 4.7,
    consultationCount: 534,
    isOnline: false,
  },
];

const statusConfig = {
  pending: { label: '等待接诊', className: 'tag-orange', Icon: Clock },
  ongoing: { label: '问诊中', className: 'bg-blue-100 text-blue-600', Icon: MessageCircle },
  completed: { label: '已完成', className: 'tag-green', Icon: CheckCircle },
  cancelled: { label: '已取消', className: 'tag-gray', Icon: XCircle },
};

const typeConfig = {
  text: { label: '图文', Icon: MessageCircle },
  video: { label: '视频', Icon: Video },
  audio: { label: '电话', Icon: Phone },
};

const tabs = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待接诊' },
  { value: 'ongoing', label: '问诊中' },
  { value: 'completed', label: '已完成' },
];

export default function ConsultationList() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [showDoctors, setShowDoctors] = useState(true);
  const [search, setSearch] = useState('');

  const filteredConsultations = mockConsultations.filter((c) => {
    const matchesTab = tab === 'all' || c.status === tab;
    return matchesTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title">在线问诊</h1>
          <p className="section-subtitle">专业兽医一对一为你解答</p>
        </div>
        <button onClick={() => setShowDoctors(!showDoctors)} className="btn-primary">
          <Plus className="w-5 h-5" />
          发起问诊
        </button>
      </div>

      {showDoctors && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-gray-900">选择医生</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索医生或科室..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-forest-100 text-sm focus:outline-none focus:border-forest-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onConsult={() => navigate(`/consultations/new?doctorId=${doctor.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display font-bold text-lg text-gray-900 mb-4">我的问诊</h2>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                tab === t.value
                  ? 'bg-forest-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-forest-50 border border-forest-100'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {filteredConsultations.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-forest-50 flex items-center justify-center">
              <Stethoscope className="w-10 h-10 text-forest-300" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">暂无问诊记录</h3>
            <p className="text-sm text-gray-500">点击上方按钮发起问诊</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConsultations.map((consultation) => {
              const status = statusConfig[consultation.status];
              const type = typeConfig[consultation.type];
              const doctor = mockDoctors.find((d) => d.id === consultation.doctorId);
              const StatusIcon = status.Icon;
              const TypeIcon = type.Icon;
              return (
                <div
                  key={consultation.id}
                  onClick={() => navigate(`/consultations/${consultation.id}`)}
                  className="card cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-forest-100 to-forest-200 flex items-center justify-center flex-shrink-0">
                        <Stethoscope className="w-6 h-6 text-forest-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{doctor?.name || '医生'}</h3>
                          <span className={cn('tag', status.className, 'flex items-center gap-1')}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">{consultation.symptoms}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(consultation.createdAt).toLocaleDateString('zh-CN', {
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={cn('tag', 'flex items-center gap-1 flex-shrink-0',
                      consultation.type === 'text' ? 'tag-green' :
                      consultation.type === 'video' ? 'bg-blue-100 text-blue-600' : 'tag-orange'
                    )}>
                      <TypeIcon className="w-3 h-3" />
                      {type.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
