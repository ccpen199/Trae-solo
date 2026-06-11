import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, FileText, Activity, Car, GraduationCap, Coffee, Search, Bell, Star, ChevronRight } from 'lucide-react';
import { useServiceStore } from '@/stores/serviceStore';
import { announcements } from '@/mock/data';
import type { ServiceDomain, ServiceItem } from '@/types';

const iconMap: Record<string, React.ElementType> = {
  Heart, FileText, Activity, Car, GraduationCap, Coffee,
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function DomainCard({ domain }: { domain: ServiceDomain }) {
  const Icon = iconMap[domain.icon] || Heart;
  return (
    <Link to={`/services?domain=${domain.id}`}>
      <motion.div
        variants={fadeUp}
        className="gov-card gov-card-hover p-5 flex flex-col items-center gap-3 cursor-pointer group"
      >
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${domain.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="font-semibold text-gov-text text-sm">{domain.name}</h3>
        <span className="gov-badge bg-blue-50 text-gov-blue">
          {domain.serviceCount}项服务
        </span>
      </motion.div>
    </Link>
  );
}

function PopularServiceCard({ service }: { service: ServiceItem }) {
  const domain = useServiceStore((s) => s.domains.find((d) => d.id === service.domainId));
  return (
    <Link to={`/services/${service.id}`}>
      <motion.div variants={fadeUp} className="gov-card gov-card-hover p-4 cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-gov-text text-sm line-clamp-1">{service.name}</h4>
          <div className="flex gap-1 shrink-0 ml-2">
            {service.tags.includes('热门') && <span className="gov-badge gov-badge-hot">热门</span>}
            {service.tags.includes('高频') && <span className="gov-badge gov-badge-new">高频</span>}
          </div>
        </div>
        <p className="text-xs text-gov-text-secondary mb-2">{service.department}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${i < Math.round(service.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
              />
            ))}
            <span className="text-xs text-gov-text-secondary ml-1">{service.rating}</span>
          </div>
          <span className="text-xs text-gov-text-secondary">
            {service.applicationCount.toLocaleString()}次办理
          </span>
        </div>
        {domain && (
          <div className={`mt-2 inline-block px-2 py-0.5 rounded text-xs bg-gradient-to-r ${domain.gradient} text-white`}>
            {domain.name}
          </div>
        )}
      </motion.div>
    </Link>
  );
}

export default function Home() {
  const { domains, services } = useServiceStore();
  const navigate = useNavigate();
  const [homeSearch, setHomeSearch] = useState('');

  const handleSearch = () => {
    const q = homeSearch.trim();
    if (q) navigate(`/services?q=${encodeURIComponent(q)}`);
  };

  const popularServices = [...services]
    .sort((a, b) => b.applicationCount - a.applicationCount)
    .slice(0, 8);

  return (
    <div>
      <section className="gov-gradient-hero city-skyline relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-24 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            昆山市政务与民生服务统一工作台
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/70 text-base md:text-lg mb-8"
          >
            一站式政务服务 · 让群众少跑腿 · 让数据多跑路
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-xl mx-auto"
          >
            <div className="flex items-center bg-white rounded-xl shadow-xl px-4 py-3">
              <Search className="w-5 h-5 text-gov-text-secondary" />
              <input
                type="text"
                value={homeSearch}
                onChange={(e) => setHomeSearch(e.target.value)}
                placeholder="搜索政务服务、办事指南..."
                className="flex-1 ml-3 border-none outline-none text-gov-text placeholder-gov-text-secondary text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <button onClick={handleSearch} className="gov-btn-primary px-5 py-2 text-sm">搜索</button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {domains.map((domain) => (
            <DomainCard key={domain.id} domain={domain} />
          ))}
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="gov-section-title">
            <Star className="w-5 h-5 text-amber-500" />
            热门服务
          </h2>
          <Link to="/services" className="text-gov-blue text-sm flex items-center gap-1 hover:underline">
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {popularServices.map((service) => (
            <PopularServiceCard key={service.id} service={service} />
          ))}
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 mb-12">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-gov-orange" />
          <h2 className="gov-section-title">公告通知</h2>
        </div>
        <div className="gov-card overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-thin py-3 px-4 gap-6">
            {announcements.map((a) => (
              <div key={a.id} className="flex items-center gap-2 shrink-0 min-w-[280px]">
                <span
                  className={`gov-badge ${
                    a.type === 'policy' ? 'bg-blue-100 text-blue-700' :
                    a.type === 'maintenance' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}
                >
                  {a.type === 'policy' ? '政策' : a.type === 'maintenance' ? '维护' : '提醒'}
                </span>
                <span className="text-sm text-gov-text line-clamp-1">{a.title}</span>
                <span className="text-xs text-gov-text-secondary shrink-0">{a.date}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
