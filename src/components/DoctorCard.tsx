import { Star, MessageCircle, Stethoscope, CheckCircle2 } from 'lucide-react';
import type { Doctor } from '@shared/types';
import { cn } from '@/lib/utils';

interface DoctorCardProps {
  doctor: Doctor;
  onConsult?: () => void;
}

export default function DoctorCard({ doctor, onConsult }: DoctorCardProps) {
  return (
    <div className="card">
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
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-forest-50">
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
    </div>
  );
}
