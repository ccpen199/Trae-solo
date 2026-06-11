import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight, Star, Clock, CreditCard, Building2, CheckCircle2,
  Circle, AlertCircle, FileText, CalendarDays,
} from 'lucide-react';
import { useServiceStore } from '@/stores/serviceStore';
import { useAuthStore } from '@/stores/authStore';

export default function ServiceDetail() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const getServiceById = useServiceStore((s) => s.getServiceById);
  const domains = useServiceStore((s) => s.domains);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);

  const service = serviceId ? getServiceById(serviceId) : undefined;
  const domain = service ? domains.find((d) => d.id === service.domainId) : undefined;

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gov-text-secondary opacity-40" />
        <h2 className="text-xl font-semibold text-gov-text mb-2">服务未找到</h2>
        <p className="text-gov-text-secondary mb-6">请检查服务地址是否正确</p>
        <Link to="/services" className="gov-btn-primary inline-block">返回服务大厅</Link>
      </div>
    );
  }

  const handleApply = () => {
    if (!isAuthenticated) {
      login('13800138000', '123456');
    }
    navigate(`/apply/${service.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-6"
    >
      <nav className="flex items-center gap-1.5 text-sm text-gov-text-secondary mb-6">
        <Link to="/" className="hover:text-gov-blue transition-colors">首页</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/services" className="hover:text-gov-blue transition-colors">服务大厅</Link>
        <ChevronRight className="w-4 h-4" />
        {domain && (
          <>
            <Link to={`/services?domain=${domain.id}`} className="hover:text-gov-blue transition-colors">{domain.name}</Link>
            <ChevronRight className="w-4 h-4" />
          </>
        )}
        <span className="text-gov-text font-medium">{service.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="gov-card p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gov-blue to-gov-blue-light flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gov-text mb-1">{service.name}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="gov-badge bg-blue-50 text-gov-blue">{service.department}</span>
                  {service.tags.map((tag) => (
                    <span key={tag} className={`gov-badge ${tag === '热门' ? 'gov-badge-hot' : tag === '高频' ? 'gov-badge-new' : 'bg-violet-100 text-violet-700'}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-gov-text-secondary leading-relaxed mb-5">{service.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gov-bg rounded-lg p-3 text-center">
                <Clock className="w-5 h-5 mx-auto mb-1 text-gov-blue" />
                <p className="text-xs text-gov-text-secondary">办理时限</p>
                <p className="text-sm font-semibold text-gov-text mt-0.5">{service.processTime}</p>
              </div>
              <div className="bg-gov-bg rounded-lg p-3 text-center">
                <CreditCard className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                <p className="text-xs text-gov-text-secondary">收费标准</p>
                <p className="text-sm font-semibold text-gov-text mt-0.5">{service.fee}</p>
              </div>
              <div className="bg-gov-bg rounded-lg p-3 text-center">
                <Building2 className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                <p className="text-xs text-gov-text-secondary">办理部门</p>
                <p className="text-sm font-semibold text-gov-text mt-0.5">{service.department}</p>
              </div>
              <div className="bg-gov-bg rounded-lg p-3 text-center">
                <Star className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                <p className="text-xs text-gov-text-secondary">服务评分</p>
                <p className="text-sm font-semibold text-gov-text mt-0.5">{service.rating} 分</p>
              </div>
            </div>
          </div>

          <div className="gov-card p-6">
            <h2 className="text-base font-bold text-gov-text mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gov-blue" />
              所需材料
            </h2>
            <ul className="space-y-3">
              {service.requiredDocuments.map((doc, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-sm text-gov-text">{doc}</span>
                </li>
              ))}
            </ul>
            {service.requiredDocuments.length === 0 && (
              <p className="text-sm text-gov-text-secondary flex items-center gap-2">
                <Circle className="w-4 h-4" />
                本服务无需提供材料
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="gov-card p-6 sticky top-24">
            <h3 className="text-base font-bold text-gov-text mb-4">办理方式</h3>
            <div className="space-y-3">
              <button onClick={handleApply} className="gov-btn-primary w-full flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                立即办理
              </button>
              <button className="gov-btn-secondary w-full flex items-center justify-center gap-2">
                <CalendarDays className="w-4 h-4" />
                预约办理
              </button>
            </div>

            {service.onlineEnabled && (
              <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4" />
                支持全程网办
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gov-border">
              <h4 className="text-sm font-semibold text-gov-text mb-3">温馨提示</h4>
              <ul className="space-y-2 text-xs text-gov-text-secondary leading-relaxed">
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                  请确保提交材料真实有效
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                  办理时限自材料齐全之日起计算
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                  如有疑问请拨打12345服务热线
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
