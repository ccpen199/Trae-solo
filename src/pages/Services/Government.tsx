import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Search,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Filter,
  X,
  FileText,
  CreditCard,
  Home,
  Car,
  Briefcase,
  Heart,
  BookOpen,
  CheckCircle,
  Clock as ClockIcon,
  XCircle,
  ExternalLink,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { useServiceStore } from '@/stores/useServiceStore';
import type { GovernmentService, BookingRecord } from '@/types';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Tag from '@/components/common/Tag';
import Badge from '@/components/common/Badge';
import { cn } from '@/lib/utils';

const serviceCategories = [
  { id: 'all', name: '全部服务', icon: Building2, color: 'bg-westlake-100 text-westlake-600' },
  { id: '户籍证件', name: '户籍办理', icon: UserCheck, color: 'bg-blue-100 text-blue-600' },
  { id: '社会保障', name: '社保医保', icon: CreditCard, color: 'bg-green-100 text-green-600' },
  { id: '不动产登记', name: '住房公积金', icon: Home, color: 'bg-orange-100 text-orange-600' },
  { id: '企业登记', name: '企业开办', icon: Briefcase, color: 'bg-purple-100 text-purple-600' },
  { id: '交通出行', name: '交通出行', icon: Car, color: 'bg-teal-100 text-teal-600' },
  { id: '计生服务', name: '计生服务', icon: Heart, color: 'bg-pink-100 text-pink-600' },
  { id: '教育服务', name: '教育服务', icon: BookOpen, color: 'bg-indigo-100 text-indigo-600' },
  { id: '优抚服务', name: '优抚服务', icon: Heart, color: 'bg-red-100 text-red-600' }
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function GovernmentService() {
  const navigate = useNavigate();
  const { governmentServices, bookingRecords, fetchGovernmentServices, fetchBookingRecords, bookService } = useServiceStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'services' | 'bookings'>('services');
  const [selectedService, setSelectedService] = useState<GovernmentService | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedCategory, activeTab]);

  const loadData = async () => {
    setLoading(true);
    const category = selectedCategory === 'all' ? undefined : selectedCategory;
    await fetchGovernmentServices(category);
    if (activeTab === 'bookings') {
      await fetchBookingRecords();
    }
    setLoading(false);
  };

  const filteredServices = useMemo(() => {
    return governmentServices.filter(service => {
      if (searchKeyword) {
        return service.name.includes(searchKeyword) ||
          service.department.includes(searchKeyword) ||
          service.description.includes(searchKeyword);
      }
      return true;
    });
  }, [governmentServices, searchKeyword]);

  const getStatusBadge = (status: BookingRecord['status']) => {
    const config = {
      pending: { label: '待办理', variant: 'chaojing' as const, icon: ClockIcon },
      confirmed: { label: '已预约', variant: 'westlake' as const, icon: CheckCircle },
      completed: { label: '已完成', variant: 'honghua' as const, icon: CheckCircle },
      cancelled: { label: '已取消', variant: 'neutral' as const, icon: XCircle }
    };
    return config[status];
  };

  const getCategoryInfo = (categoryName: string) => {
    return serviceCategories.find(c => c.id === categoryName) || serviceCategories[0];
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleBookService = async (service: GovernmentService) => {
    if (!service.onlineBooking) {
      alert('该服务暂不支持在线预约，请前往办事大厅办理');
      return;
    }
    setSelectedService(service);
    setBookingDate('');
    setBookingTime('');
    setShowBookingModal(true);
  };

  const submitBooking = async () => {
    if (!selectedService || !bookingDate || !bookingTime) {
      alert('请选择预约日期和时间');
      return;
    }

    setBookingLoading(true);
    try {
      const result = await bookService(selectedService.id, new Date(bookingDate), bookingTime);
      alert(`预约成功！\n服务：${selectedService.name}\n日期：${bookingDate}\n时间：${bookingTime}\n预约号：${result.id}`);
      setShowBookingModal(false);
      setActiveTab('bookings');
    } catch (error) {
      alert('预约失败，请稍后重试');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

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
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">政务预约</h1>
          <p className="text-neutral-500">在线预约、办事指南，让政务服务更便捷</p>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <Card className="p-0 overflow-hidden">
            <div className="flex border-b border-neutral-100">
              <button
                onClick={() => setActiveTab('services')}
                className={cn(
                  'flex-1 py-4 font-medium text-center transition-colors',
                  activeTab === 'services'
                    ? 'text-westlake-600 border-b-2 border-westlake-500'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                服务列表
                <Badge variant="westlake" className="ml-2">{filteredServices.length}</Badge>
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={cn(
                  'flex-1 py-4 font-medium text-center transition-colors',
                  activeTab === 'bookings'
                    ? 'text-westlake-600 border-b-2 border-westlake-500'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                我的预约
                {bookingRecords.length > 0 && (
                  <Badge variant="chaojing" className="ml-2">{bookingRecords.length}</Badge>
                )}
              </button>
            </div>
          </Card>
        </motion.div>

        {activeTab === 'services' && (
          <>
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mb-6"
            >
              <form onSubmit={handleSearch} className="flex gap-3">
                <Input
                  placeholder="搜索服务名称、办理部门..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  size="lg"
                  prefix={<Search className="w-5 h-5 text-neutral-400" />}
                  clearable
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="lg"
                  leftIcon={<Search className="w-5 h-5" />}
                >
                  搜索
                </Button>
              </form>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              className="mb-6"
            >
              <Card>
                <h3 className="font-bold text-neutral-800 mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-westlake-500" />
                  服务分类
                </h3>
                <div className="flex flex-wrap gap-2">
                  {serviceCategories.map((category, index) => {
                    const IconComponent = category.icon;
                    return (
                      <motion.button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                          selectedCategory === category.id
                            ? 'bg-westlake-500 text-white shadow-lg'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                        )}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        {selectedCategory === category.id ? (
                          <IconComponent className="w-4 h-4" />
                        ) : (
                          <span className={cn('w-6 h-6 rounded-full flex items-center justify-center', category.color)}>
                            <IconComponent className="w-3 h-3" />
                          </span>
                        )}
                        {category.name}
                      </motion.button>
                    );
                  })}
                </div>
              </Card>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-westlake-500" />
                </div>
              ) : filteredServices.length === 0 ? (
                <Card className="text-center py-12">
                  <Building2 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500">暂无符合条件的服务</p>
                  <p className="text-sm text-neutral-400 mt-1">请尝试修改搜索条件</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {filteredServices.map((service, index) => {
                      const categoryInfo = getCategoryInfo(service.category);
                      const CategoryIcon = categoryInfo.icon;
                      return (
                        <motion.div
                          key={service.id}
                          variants={fadeInUp}
                          custom={index}
                          layout
                        >
                          <Card
                            hover
                            onClick={() => setSelectedService(selectedService?.id === service.id ? null : service)}
                            className={cn(
                              selectedService?.id === service.id && 'ring-2 ring-westlake-500'
                            )}
                          >
                            <div className="flex items-start gap-4">
                              <div className={cn(
                                'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                                categoryInfo.color
                              )}>
                                <CategoryIcon className="w-6 h-6" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-bold text-lg text-neutral-800">{service.name}</h3>
                                      {service.onlineBooking ? (
                                        <Badge variant="honghua">可预约</Badge>
                                      ) : (
                                        <Badge variant="neutral">线下办理</Badge>
                                      )}
                                      <Tag size="sm" color="neutral">{service.category}</Tag>
                                    </div>
                                    <p className="text-sm text-neutral-500 mb-2">{service.description}</p>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
                                      <span className="flex items-center gap-1">
                                        <Building2 className="w-4 h-4" />
                                        {service.department}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {service.processingTime}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <CreditCard className="w-4 h-4" />
                                        {service.fee}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-2 flex-shrink-0">
                                    {service.onlineBooking && (
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleBookService(service);
                                        }}
                                      >
                                        <Calendar className="w-4 h-4" />
                                        在线预约
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        alert(`办事指南：\n${service.name}\n所需材料：${service.requiredMaterials.join('、')}`);
                                      }}
                                    >
                                      <FileText className="w-4 h-4" />
                                      办事指南
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <AnimatePresence>
                              {selectedService?.id === service.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-4 pt-4 border-t border-neutral-100">
                                    <h4 className="font-semibold text-neutral-800 mb-3">所需材料</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                                      {service.requiredMaterials.map((material, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center gap-2 text-sm text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2"
                                        >
                                          <CheckCircle className="w-4 h-4 text-honghua-500 flex-shrink-0" />
                                          {material}
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-sm text-neutral-500">
                                        <span className="font-medium">办理时间：</span>{service.processingTime}
                                      </div>
                                      <div className="text-sm text-neutral-500">
                                        <span className="font-medium">费用：</span>{service.fee}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </>
        )}

        {activeTab === 'bookings' && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-westlake-500" />
              </div>
            ) : bookingRecords.length === 0 ? (
              <Card className="text-center py-12">
                <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500">暂无预约记录</p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={() => setActiveTab('services')}
                >
                  去预约服务
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {bookingRecords.map((record, index) => {
                    const statusInfo = getStatusBadge(record.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <motion.div
                        key={record.id}
                        variants={fadeInUp}
                        custom={index}
                      >
                        <Card>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant={statusInfo.variant}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                              <span className="text-xs text-neutral-400">
                                预约号：{record.id}
                              </span>
                            </div>
                            <span className="text-xs text-neutral-400">
                              提交时间：{formatDate(record.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-westlake-100 rounded-xl flex items-center justify-center flex-shrink-0">
                              <FileText className="w-6 h-6 text-westlake-600" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg text-neutral-800 mb-1">
                                {record.service.name}
                              </h3>
                              <p className="text-sm text-neutral-500 mb-2">
                                {record.service.department}
                              </p>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(record.bookingDate)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {record.bookingTime}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  惠州市政务服务中心
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-neutral-500">
                              <span className="font-medium">办理时间：</span>
                              {record.service.processingTime}
                            </div>
                            <div className="flex gap-2">
                              {record.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => alert('即将导航到惠州市政务服务中心')}
                                  >
                                    <MapPin className="w-4 h-4" />
                                    导航
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => alert('预约已取消')}
                                  >
                                    取消预约
                                  </Button>
                                </>
                              )}
                              {record.status === 'completed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => alert('查看评价页面')}
                                >
                                  评价服务
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                rightIcon={<ExternalLink className="w-4 h-4" />}
                                onClick={() => window.open(record.service.bookingUrl, '_blank')}
                              >
                                详情
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        <AnimatePresence>
          {showBookingModal && selectedService && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowBookingModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-neutral-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-neutral-800">在线预约</h3>
                    <button
                      onClick={() => setShowBookingModal(false)}
                      className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5 text-neutral-400" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="bg-neutral-50 rounded-xl p-4 mb-6">
                    <h4 className="font-semibold text-neutral-800 mb-2">{selectedService.name}</h4>
                    <p className="text-sm text-neutral-500">{selectedService.department}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedService.processingTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-4 h-4" />
                        {selectedService.fee}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-700 mb-2 block">
                        选择日期
                      </label>
                      <input
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2.5 rounded-button border border-neutral-200 bg-white focus:ring-2 focus:ring-westlake-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-neutral-700 mb-2 block">
                        选择时段
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {timeSlots.map((time) => (
                          <motion.button
                            key={time}
                            type="button"
                            onClick={() => setBookingTime(time)}
                            className={cn(
                              'py-2 px-3 rounded-lg text-sm font-medium transition-all',
                              bookingTime === time
                                ? 'bg-westlake-500 text-white'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                            )}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {time}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-chaojing-50 rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-chaojing-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-chaojing-700">
                          <p className="font-medium mb-1">温馨提示</p>
                          <ul className="list-disc list-inside space-y-1 text-chaojing-600">
                            <li>请携带所需材料原件及复印件</li>
                            <li>请提前15分钟到达现场取号</li>
                            <li>如需取消请提前24小时操作</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-neutral-100 flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => setShowBookingModal(false)}
                  >
                    取消
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1"
                    loading={bookingLoading}
                    onClick={submitBooking}
                    leftIcon={<Calendar className="w-5 h-5" />}
                  >
                    确认预约
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
