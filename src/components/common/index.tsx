import { TrendingUp, TrendingDown, FileText, CheckCircle, Clock, Smile, HeartHandshake, UserCircle, Stethoscope, Building2, Store, Heart, Receipt, Grid3X3 } from 'lucide-react';
import type { StatCardData, ServiceItem, Application } from '../../shared/types';

const iconMap: Record<string, React.ElementType> = {
  FileText,
  CheckCircle,
  Clock,
  Smile,
  HeartHandshake,
  UserCircle,
  Stethoscope,
  Building2,
  Store,
  Heart,
  Receipt,
  Grid3X3,
};

const gradientClasses: Record<string, string> = {
  blue: 'gradient-card',
  orange: 'gradient-card-orange',
  green: 'gradient-card-green',
  purple: 'gradient-card-purple',
};

export const StatCard = ({ data }: { data: StatCardData }) => {
  const Icon = iconMap[data.icon] || FileText;

  return (
    <div className="gov-card p-5 overflow-hidden relative group">
      <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full ${gradientClasses[data.gradient]} opacity-10 group-hover:opacity-20 transition-opacity`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gov-gray-400 font-medium">{data.title}</p>
            <p className="text-3xl font-bold text-gov-gray-700 mt-2 animate-number">
              {data.value}
            </p>
            {data.change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                data.trend === 'up' ? 'text-gov-green' : 'text-gov-red'
              }`}>
                {data.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-medium">{Math.abs(data.change)}%</span>
                <span className="text-gov-gray-400">较昨日</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl ${gradientClasses[data.gradient]} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ServiceCard = ({ service, onApply }: { service: ServiceItem; onApply?: () => void }) => {
  return (
    <div className="gov-card p-5 hover:shadow-card-hover transition-all duration-300 cursor-pointer group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gov-gray-700 group-hover:text-primary-500 transition-colors">
              {service.name}
            </h3>
            {service.hotLevel > 900 && (
              <span className="gov-badge-danger text-[10px]">热门</span>
            )}
          </div>
          <p className="text-sm text-gov-gray-400 line-clamp-2 mb-3">
            {service.description}
          </p>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-gov-gray-400">
              <Building2 className="w-3.5 h-3.5" />
              {service.department}
            </span>
            <span className="flex items-center gap-1 text-gov-gray-400">
              <Clock className="w-3.5 h-3.5" />
              {service.handlingTime}
            </span>
          </div>
        </div>
        {service.isOnline && (
          <button
            onClick={onApply}
            className="gov-btn-primary text-sm px-4 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-4"
          >
            立即办理
          </button>
        )}
      </div>
      <div className="gov-divider" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {service.requiredMaterials.slice(0, 3).map((mat, idx) => (
            <span key={idx} className="gov-tag text-[11px]">
              {mat.name}
            </span>
          ))}
          {service.requiredMaterials.length > 3 && (
            <span className="text-xs text-gov-gray-400">+{service.requiredMaterials.length - 3}项</span>
          )}
        </div>
        <span className="text-xs text-gov-gray-400">
          {service.hotLevel}人已办理
        </span>
      </div>
    </div>
  );
};

export const ApplicationCard = ({ application, onClick }: { application: Application; onClick?: () => void }) => {
  const statusConfig = {
    draft: { label: '草稿', class: 'gov-badge-info' },
    submitted: { label: '已提交', class: 'gov-badge-info' },
    reviewing: { label: '审核中', class: 'gov-badge-warning' },
    supplement: { label: '待补正', class: 'gov-badge-danger' },
    approved: { label: '已完成', class: 'gov-badge-success' },
    rejected: { label: '已驳回', class: 'gov-badge-danger' },
  };

  const config = statusConfig[application.status];

  return (
    <div
      onClick={onClick}
      className="gov-card p-5 hover:shadow-card-hover transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gov-gray-700">{application.serviceName}</h3>
          <p className="text-xs text-gov-gray-400 mt-1">
            申请编号：{application.id.toUpperCase()}
          </p>
        </div>
        <span className={config.class}>{config.label}</span>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gov-gray-400 mb-2">
          <span>办理进度</span>
          <span>{application.currentStep}/{application.totalSteps}步</span>
        </div>
        <div className="h-2 bg-gov-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
            style={{ width: `${(application.currentStep / application.totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gov-gray-400">
        <span>预计办理：{application.estimatedTime}</span>
        <span>提交时间：{new Date(application.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export const StatusBadge = ({ status }: { status: 'normal' | 'warning' | 'error' }) => {
  const config = {
    normal: { label: '正常', class: 'text-gov-green bg-green-50' },
    warning: { label: '异常', class: 'text-gov-orange bg-orange-50' },
    error: { label: '故障', class: 'text-gov-red bg-red-50' },
  };

  const cfg = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.class}`}>
      <span className={`w-2 h-2 rounded-full ${
        status === 'normal' ? 'bg-gov-green' :
        status === 'warning' ? 'bg-gov-orange' : 'bg-gov-red'
      } ${status !== 'error' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  );
};

export const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`${sizeClass[size]} border-primary-200 border-t-primary-500 rounded-full animate-spin`} />
  );
};

export const EmptyState = ({ icon, title, description }: { icon?: React.ReactNode; title: string; description?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gov-gray-100 flex items-center justify-center mb-4">
        {icon || <FileText className="w-8 h-8 text-gov-gray-300" />}
      </div>
      <h3 className="text-gov-gray-600 font-medium mb-1">{title}</h3>
      {description && <p className="text-sm text-gov-gray-400">{description}</p>}
    </div>
  );
};
