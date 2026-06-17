import { useState } from 'react';
import {
  Star,
  MessageCircle,
  Stethoscope,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  FileText,
  Lock,
  AlertTriangle,
  BarChart3,
  Clock,
} from 'lucide-react';
import type { Doctor } from '@shared/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

interface DoctorCardProps {
  doctor: Doctor;
  onConsult?: () => void;
}

export default function DoctorCard({ doctor, onConsult }: DoctorCardProps) {
  const { user, impersonateRole } = useAuthStore();
  const effectiveRole = impersonateRole || user?.role;
  const canSeeAdminView = !!(effectiveRole && effectiveRole !== 'owner');
  const [expanded, setExpanded] = useState(false);

  const licenseStatus = doctor.licenseVerified
    ? { label: '执业资质已核验', color: 'bg-forest-100 text-forest-700', icon: CheckCircle2 }
    : { label: '资质待审核', color: 'bg-warm-100 text-warm-600', icon: AlertTriangle };

  const LicenseIcon = licenseStatus.icon;

  const mockPracticeInfo = {
    licenseNo: 'VET-BJ-2024-00891',
    certNo: '2020110110000123',
    range: '小动物内科',
    education: '中国农业大学 硕士',
    validUntil: '2027-12-31',
  };

  const mockEncryptedRecords = {
    totalEncrypted: 486,
    thisMonth: 52,
    prescriptionsSigned: 128,
    avgResponseMin: 8,
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-forest-100 to-forest-200 flex items-center justify-center overflow-hidden">
            <Stethoscope className="w-8 h-8 text-forest-500" />
          </div>
          {doctor.isOnline && (
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-bold text-gray-900">{doctor.name}</h3>
            {doctor.licenseVerified && (
              <CheckCircle2 className="w-4 h-4 text-forest-500" />
            )}
          </div>
          <p className="text-sm text-forest-600 font-medium">{doctor.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{doctor.department}</p>
          <div className="mt-1.5">
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1', licenseStatus.color)}>
              <LicenseIcon className="w-3 h-3" />
              {licenseStatus.label}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-3 border-t border-forest-50">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-warm-400 fill-warm-400" />
          <span className="font-semibold text-gray-900">{doctor.rating.toFixed(1)}</span>
        </div>
        <div className="text-sm text-gray-500">
          接诊 <span className="font-semibold text-gray-700">{doctor.consultationCount}</span> 次
        </div>
        <div className="ml-auto">
          {doctor.isOnline ? (
            <button
              onClick={onConsult}
              className="btn-primary !px-4 !py-2 text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              问诊
            </button>
          ) : (
            <span className={cn('tag tag-gray')}>离线</span>
          )}
        </div>
      </div>

      {canSeeAdminView && (
        <div className="border-t border-forest-50 pt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-sm font-semibold text-forest-700 hover:text-forest-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              执业监管视图
            </span>
            <ChevronRight className={cn('w-4 h-4 transition-transform', expanded && 'rotate-90')} />
          </button>

          {expanded && (
            <div className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-purple-800">执业资质</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-white/60 text-center">
                    <p className="text-[10px] text-gray-500">执业证号</p>
                    <p className="text-[11px] font-mono font-semibold text-purple-700">{mockPracticeInfo.licenseNo}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/60 text-center">
                    <p className="text-[10px] text-gray-500">资格证号</p>
                    <p className="text-[11px] font-mono font-semibold text-purple-700">{mockPracticeInfo.certNo}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/60 text-center">
                    <p className="text-[10px] text-gray-500">执业范围</p>
                    <p className="text-xs font-semibold text-purple-700">{mockPracticeInfo.range}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/60 text-center">
                    <p className="text-[10px] text-gray-500">有效期至</p>
                    <p className="text-xs font-semibold text-forest-600">{mockPracticeInfo.validUntil}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gradient-to-br from-forest-50 to-emerald-50 border border-forest-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-forest-600" />
                  <span className="text-xs font-bold text-forest-800">问诊记录加密</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-white/60 text-center">
                    <p className="text-[10px] text-gray-500">加密记录</p>
                    <p className="text-sm font-bold text-forest-700">{mockEncryptedRecords.totalEncrypted}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/60 text-center">
                    <p className="text-[10px] text-gray-500">本月新增</p>
                    <p className="text-sm font-bold text-forest-700">{mockEncryptedRecords.thisMonth}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/60 text-center">
                    <p className="text-[10px] text-gray-500">处方签名</p>
                    <p className="text-sm font-bold text-forest-700">{mockEncryptedRecords.prescriptionsSigned}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/60 text-center">
                    <p className="text-[10px] text-gray-500">平均响应</p>
                    <p className="text-sm font-bold text-forest-700">{mockEncryptedRecords.avgResponseMin}分钟</p>
                  </div>
                </div>
                <p className="text-[10px] text-forest-600 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  AES-256-CBC · 电子病历仅医患双方可解密
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-blue-800">处方流转统计</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/60 text-[11px]">
                    <span className="text-gray-600">已签发处方</span>
                    <span className="font-semibold text-blue-700">{mockEncryptedRecords.prescriptionsSigned} 份</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/60 text-[11px]">
                    <span className="text-gray-600">宠主知情确认率</span>
                    <span className="font-semibold text-forest-600">98.4%</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/60 text-[11px]">
                    <span className="text-gray-600">复诊提醒触发</span>
                    <span className="font-semibold text-blue-700">86 次</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/60 text-[11px]">
                    <span className="text-gray-600">处方药双签完成率</span>
                    <span className="font-semibold text-forest-600">100%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
