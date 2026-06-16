import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  Phone,
  Clock,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Lock,
  AlertTriangle,
  TrendingUp,
  Users,
  Stethoscope,
  BarChart3,
  Eye,
  FileText,
} from 'lucide-react';
import type { Hospital } from '@shared/types';
import { cn } from '@/lib/utils';

interface HospitalCardProps {
  hospital: Hospital;
  compact?: boolean;
}

export default function HospitalCard({ hospital, compact }: HospitalCardProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const mockSchedule = [
    { day: '周一', doctors: ['王建国（内科）', '李芳（外科）'] },
    { day: '周二', doctors: ['张伟（影像）', '王建国（内科）'] },
    { day: '周三', doctors: ['李芳（外科）', '赵敏（皮肤）'] },
    { day: '周四', doctors: ['王建国（内科）'] },
    { day: '周五', doctors: ['张伟（影像）', '赵敏（皮肤）'] },
    { day: '周六', doctors: ['李芳（外科）值班'] },
    { day: '周日', doctors: ['急诊值班'] },
  ];

  const mockConsultationStats = {
    totalEncrypted: 1286,
    thisMonth: 148,
    avgResponseMin: 12,
    encryptionRate: '100%',
  };

  const mockReviewAntiFraud = {
    totalReviews: hospital.reviewCount,
    flaggedCount: 23,
    removedCount: 7,
    avgFraudScore: 0.12,
    riskLevel: 'low' as const,
  };

  const licenseStatus = hospital.verified
    ? { label: '资质已核验', color: 'bg-forest-100 text-forest-700', icon: CheckCircle2 }
    : { label: '资质待审核', color: 'bg-warm-100 text-warm-600', icon: AlertTriangle };

  const LicenseIcon = licenseStatus.icon;

  if (compact) {
    return (
      <button
        onClick={() => navigate(`/hospitals/${hospital.id}`)}
        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white hover:bg-cream-50 transition-colors text-left border border-forest-50"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-forest-100 to-forest-200 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-6 h-6 text-forest-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-gray-900 truncate">{hospital.name}</p>
            {hospital.verified && <CheckCircle2 className="w-4 h-4 text-forest-500 flex-shrink-0" />}
          </div>
          <p className="text-xs text-gray-500 truncate">{hospital.address}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>
    );
  }

  return (
    <div className="card space-y-4">
      <div
        onClick={() => navigate(`/hospitals/${hospital.id}`)}
        className="cursor-pointer group"
      >
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-forest-100 to-forest-200 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-10 h-10 text-forest-500" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-bold text-gray-900 truncate">{hospital.name}</h3>
              {hospital.verified && <CheckCircle2 className="w-4 h-4 text-forest-500 flex-shrink-0" />}
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-warm-400 fill-warm-400" />
                <span className="font-semibold text-gray-900">{hospital.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({hospital.reviewCount}条评价)</span>
              </div>
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1', licenseStatus.color)}>
                <LicenseIcon className="w-3 h-3" />
                {licenseStatus.label}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="truncate">{hospital.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{hospital.businessHours}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{hospital.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {hospital.services.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-forest-50">
          {hospital.services.slice(0, 4).map((service) => (
            <span key={service.id} className="tag tag-green">
              {service.name}
            </span>
          ))}
          {hospital.services.length > 4 && (
            <span className="tag tag-gray">+{hospital.services.length - 4}</span>
          )}
        </div>
      )}

      <div className="border-t border-forest-50 pt-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-sm font-semibold text-forest-700 hover:text-forest-900 transition-colors"
        >
          <span className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            业务监管视图
          </span>
          <ChevronRight className={cn('w-4 h-4 transition-transform', expanded && 'rotate-90')} />
        </button>

        {expanded && (
          <div className="mt-4 space-y-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-purple-800">资质审核状态</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-white/60 text-center">
                  <p className="text-[10px] text-gray-500">营业执照</p>
                  <p className="text-xs font-semibold text-forest-600">已核验 ✓</p>
                </div>
                <div className="p-2 rounded-lg bg-white/60 text-center">
                  <p className="text-[10px] text-gray-500">诊疗许可证</p>
                  <p className="text-xs font-semibold text-forest-600">已核验 ✓</p>
                </div>
                <div className="p-2 rounded-lg bg-white/60 text-center">
                  <p className="text-[10px] text-gray-500">环评报告</p>
                  <p className="text-xs font-semibold text-forest-600">已核验 ✓</p>
                </div>
                <div className="p-2 rounded-lg bg-white/60 text-center">
                  <p className="text-[10px] text-gray-500">年度校验</p>
                  <p className="text-xs font-semibold text-warm-600">2026年8月到期</p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-blue-800">本周医生排班</span>
              </div>
              <div className="space-y-1.5">
                {mockSchedule.slice(0, 5).map((s) => (
                  <div key={s.day} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/60 text-[11px]">
                    <span className="font-semibold text-blue-700 w-8 shrink-0">{s.day}</span>
                    <span className="text-gray-600 truncate">{s.doctors.join('、')}</span>
                  </div>
                ))}
                <button className="text-[10px] text-blue-600 font-semibold hover:underline">
                  查看完整排班 →
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gradient-to-br from-forest-50 to-emerald-50 border border-forest-100 space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-forest-600" />
                <span className="text-xs font-bold text-forest-800">问诊记录加密存储</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-white/60 text-center">
                  <p className="text-[10px] text-gray-500">加密记录总量</p>
                  <p className="text-sm font-bold text-forest-700">{mockConsultationStats.totalEncrypted}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/60 text-center">
                  <p className="text-[10px] text-gray-500">本月新增</p>
                  <p className="text-sm font-bold text-forest-700">{mockConsultationStats.thisMonth}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/60 text-center">
                  <p className="text-[10px] text-gray-500">平均响应</p>
                  <p className="text-sm font-bold text-forest-700">{mockConsultationStats.avgResponseMin}分钟</p>
                </div>
                <div className="p-2 rounded-lg bg-white/60 text-center">
                  <p className="text-[10px] text-gray-500">加密率</p>
                  <p className="text-sm font-bold text-forest-700">{mockConsultationStats.encryptionRate}</p>
                </div>
              </div>
              <p className="text-[10px] text-forest-600 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                AES-256-CBC 加密 · 问诊记录仅医患双方可解密查看
              </p>
            </div>

            <div className="p-3 rounded-xl bg-gradient-to-br from-warm-50 to-orange-50 border border-warm-100 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-warm-600" />
                <span className="text-xs font-bold text-warm-800">评价反作弊监控</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-white/60 text-center">
                  <p className="text-[10px] text-gray-500">评价总数</p>
                  <p className="text-sm font-bold text-gray-700">{mockReviewAntiFraud.totalReviews}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/60 text-center">
                  <p className="text-[10px] text-gray-500">异常标记</p>
                  <p className="text-sm font-bold text-warm-600">{mockReviewAntiFraud.flaggedCount}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/60 text-center">
                  <p className="text-[10px] text-gray-500">已清除</p>
                  <p className="text-sm font-bold text-red-600">{mockReviewAntiFraud.removedCount}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/60 text-center">
                  <p className="text-[10px] text-gray-500">风险等级</p>
                  <span className={cn(
                    'text-xs font-semibold px-1.5 py-0.5 rounded-full',
                    mockReviewAntiFraud.riskLevel === 'low' ? 'bg-forest-100 text-forest-700' :
                    mockReviewAntiFraud.riskLevel === 'medium' ? 'bg-warm-100 text-warm-600' :
                    'bg-red-100 text-red-600'
                  )}>
                    {mockReviewAntiFraud.riskLevel === 'low' ? '低风险' :
                     mockReviewAntiFraud.riskLevel === 'medium' ? '中风险' : '高风险'}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-warm-600 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                平均欺诈分数 {mockReviewAntiFraud.avgFraudScore.toFixed(2)} · IP/设备/行为多维度检测
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
