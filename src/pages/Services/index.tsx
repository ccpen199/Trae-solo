import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus,
  Film,
  Briefcase,
  Building2,
  Cloud,
  Package,
  Zap,
  Phone,
  Search,
  ChevronRight,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  Heart,
  Car,
  GraduationCap,
  Stethoscope,
  ShoppingBag
} from 'lucide-react';
import { useServiceStore } from '@/stores/useServiceStore';
import ServiceCard from '@/components/business/ServiceCard';
import Input from '@/components/common/Input';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Tag from '@/components/common/Tag';
import { cn } from '@/lib/utils';

const mainServices = [
  {
    id: 'bus',
    name: '客运交通',
    description: '查询客运班次、购票出行',
    icon: 'bus',
    path: '/transport',
    color: 'westlake' as const,
    bgGradient: 'from-blue-500 to-blue-600',
    iconComponent: Bus
  },
  {
    id: 'cinema',
    name: '电影演出',
    description: '最新电影、影院排片',
    icon: 'film',
    path: '/cinema',
    color: 'chaojing' as const,
    bgGradient: 'from-orange-500 to-orange-600',
    iconComponent: Film
  },
  {
    id: 'job',
    name: '招聘求职',
    description: '找好工作、招优秀人才',
    icon: 'briefcase',
    path: '/jobs',
    color: 'honghua' as const,
    bgGradient: 'from-green-500 to-green-600',
    iconComponent: Briefcase
  },
  {
    id: 'gov',
    name: '政务服务',
    description: '在线预约、办事指南',
    icon: 'building',
    path: '/government',
    color: 'westlake' as const,
    bgGradient: 'from-purple-500 to-purple-600',
    iconComponent: Building2
  }
];

const quickServices = [
  { icon: Cloud, name: '天气预报', color: 'bg-blue-100 text-blue-600' },
  { icon: Package, name: '快递查询', color: 'bg-orange-100 text-orange-600' },
  { icon: Zap, name: '水电缴费', color: 'bg-yellow-100 text-yellow-600' },
  { icon: Phone, name: '常用电话', color: 'bg-green-100 text-green-600' },
  { icon: MapPin, name: '地图导航', color: 'bg-red-100 text-red-600' },
  { icon: Calendar, name: '日历黄历', color: 'bg-purple-100 text-purple-600' },
  { icon: FileText, name: '发票查询', color: 'bg-indigo-100 text-indigo-600' },
  { icon: Heart, name: '便民服务', color: 'bg-pink-100 text-pink-600' },
  { icon: Car, name: '违章查询', color: 'bg-teal-100 text-teal-600' },
  { icon: GraduationCap, name: '教育服务', color: 'bg-cyan-100 text-cyan-600' },
  { icon: Stethoscope, name: '医疗健康', color: 'bg-rose-100 text-rose-600' },
  { icon: ShoppingBag, name: '生活购物', color: 'bg-amber-100 text-amber-600' }
];

const announcements = [
  { id: 1, title: '惠州汽车总站端午节加班班次通知', date: '2026-06-20', type: 'important' },
  { id: 2, title: '2026年惠州中考各考点交通管制通告', date: '2026-06-19', type: 'normal' },
  { id: 3, title: '惠城区政务服务中心搬迁公告', date: '2026-06-18', type: 'normal' },
  { id: 4, title: '暑期热门电影预售已开启，提前购票享优惠', date: '2026-06-17', type: 'normal' },
  { id: 5, title: 'TCL、德赛等知名企业夏季招聘火热进行中', date: '2026-06-16', type: 'important' }
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function ServiceIndex() {
  const navigate = useNavigate();
  const { fetchBusSchedules, fetchMovies, fetchJobs, fetchGovernmentServices } = useServiceStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0);

  useEffect(() => {
    fetchBusSchedules();
    fetchMovies();
    fetchJobs();
    fetchGovernmentServices();
  }, [fetchBusSchedules, fetchMovies, fetchJobs, fetchGovernmentServices]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAnnouncement((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleServiceClick = (path: string) => {
    navigate(path);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      if (searchKeyword.includes('车') || searchKeyword.includes('票')) {
        navigate('/transport');
      } else if (searchKeyword.includes('电影') || searchKeyword.includes('影院')) {
        navigate('/cinema');
      } else if (searchKeyword.includes('工作') || searchKeyword.includes('招聘') || searchKeyword.includes('求职')) {
        navigate('/jobs');
      } else if (searchKeyword.includes('政务') || searchKeyword.includes('办事') || searchKeyword.includes('预约')) {
        navigate('/government');
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-neutral-50"
    >
      <div className="container pb-20">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pt-6 pb-4"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">生活服务</h1>
          <p className="text-neutral-500">一站式便民服务平台，让生活更便捷</p>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <form onSubmit={handleSearch}>
            <Input
              placeholder="搜索服务、车次、电影、职位..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              size="lg"
              prefix={<Search className="w-5 h-5 text-neutral-400" />}
              clearable
            />
          </form>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <h2 className="text-lg font-bold text-neutral-800 mb-4">四大服务板块</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mainServices.map((service, index) => {
              const IconComponent = service.iconComponent;
              return (
                <motion.div
                  key={service.id}
                  variants={fadeInUp}
                  custom={index}
                  onClick={() => handleServiceClick(service.path)}
                  className={cn(
                    'relative rounded-2xl p-6 cursor-pointer overflow-hidden group',
                    'bg-gradient-to-br shadow-lg hover:shadow-xl',
                    service.bgGradient
                  )}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-300">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                    <p className="text-white/80 text-sm mb-4">{service.description}</p>
                    <div className="flex items-center text-white/90 text-sm font-medium">
                      立即体验
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <Card>
            <h2 className="text-lg font-bold text-neutral-800 mb-4">快捷服务</h2>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
              {quickServices.map((service, index) => (
                <motion.button
                  key={service.name}
                  variants={fadeInUp}
                  custom={index}
                  className="flex flex-col items-center gap-2 group"
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center',
                      service.color
                    )}
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    <service.icon className="w-6 h-6" />
                  </motion.div>
                  <span className="text-xs text-neutral-700 font-medium group-hover:text-westlake-600 transition-colors">
                    {service.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <Card className="p-0 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-westlake-50 to-transparent border-b border-neutral-100 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-westlake-500" />
              <h2 className="font-bold text-neutral-800">服务公告</h2>
            </div>
            <div className="relative h-12 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentAnnouncement}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex items-center justify-between px-4"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Tag
                      color={announcements[currentAnnouncement].type === 'important' ? 'chaojing' : 'neutral'}
                      size="sm"
                    >
                      {announcements[currentAnnouncement].type === 'important' ? '重要' : '通知'}
                    </Tag>
                    <span className="text-neutral-700 truncate">{announcements[currentAnnouncement].title}</span>
                  </div>
                  <span className="text-xs text-neutral-400 flex-shrink-0 ml-2">
                    {announcements[currentAnnouncement].date}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-800">热门服务推荐</h2>
            <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
              更多
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ServiceCard
              service={{
                id: 's1',
                name: '惠州汽车总站',
                description: '查询发往全省各地的客运班次，在线购票',
                icon: 'bus',
                path: '/transport',
                color: 'westlake'
              }}
            />
            <ServiceCard
              service={{
                id: 's2',
                name: '万达影城（华贸店）',
                description: '查看最新电影排片，在线选座购票',
                icon: 'film',
                path: '/cinema',
                color: 'chaojing'
              }}
            />
            <ServiceCard
              service={{
                id: 's3',
                name: 'TCL科技集团招聘',
                description: '高薪技术岗位火热招聘中，五险一金',
                icon: 'briefcase',
                path: '/jobs',
                color: 'honghua'
              }}
            />
            <ServiceCard
              service={{
                id: 's4',
                name: '居民身份证办理',
                description: '首次申领、换领、补领，支持在线预约',
                icon: 'building',
                path: '/government',
                color: 'westlake'
              }}
            />
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-800">今日推荐</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Card hover onClick={() => navigate('/transport')}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bus className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-800 mb-1">端午出行高峰已至，提前购票</h3>
                  <p className="text-sm text-neutral-500">惠州至广州、深圳等热门线路余票紧张</p>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
              </div>
            </Card>
            <Card hover onClick={() => navigate('/jobs')}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-800 mb-1">夏季招聘季，优质职位等你</h3>
                  <p className="text-sm text-neutral-500">TCL、德赛、亿纬锂能等名企热招中</p>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
