import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bus,
  Search,
  Calendar,
  MapPin,
  Clock,
  Ticket,
  ChevronDown,
  ArrowRightLeft,
  Filter,
  Star,
  User,
  X
} from 'lucide-react';
import { useServiceStore } from '@/stores/useServiceStore';
import type { BusSchedule } from '@/types';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Tag from '@/components/common/Tag';
import Badge from '@/components/common/Badge';
import { cn } from '@/lib/utils';

const departureOptions = [
  { value: '惠州汽车总站', label: '惠州汽车总站' },
  { value: '惠州南线客运站', label: '惠州南线客运站' },
  { value: '惠州河南岸汽车站', label: '惠州河南岸汽车站' },
  { value: '惠州仲恺汽车站', label: '惠州仲恺汽车站' }
];

const destinationOptions = [
  { value: '广州天河客运站', label: '广州天河客运站' },
  { value: '深圳福田汽车站', label: '深圳福田汽车站' },
  { value: '东莞南城汽车站', label: '东莞南城汽车站' },
  { value: '珠海拱北汽车站', label: '珠海拱北汽车站' },
  { value: '佛山汽车站', label: '佛山汽车站' },
  { value: '中山汽车总站', label: '中山汽车总站' },
  { value: '汕头汽车总站', label: '汕头汽车总站' },
  { value: '惠东巽寮湾', label: '惠东巽寮湾' },
  { value: '博罗罗浮山', label: '博罗罗浮山' },
  { value: '龙门南昆山', label: '龙门南昆山' },
  { value: '惠阳大亚湾', label: '惠阳大亚湾' },
  { value: '香港太子地铁站', label: '香港太子地铁站' }
];

const popularRoutes = [
  { name: '广州', icon: '🌆', dest: '广州天河客运站' },
  { name: '深圳', icon: '🏙️', dest: '深圳福田汽车站' },
  { name: '东莞', icon: '🏭', dest: '东莞南城汽车站' },
  { name: '珠海', icon: '🏝️', dest: '珠海拱北汽车站' },
  { name: '巽寮湾', icon: '🌊', dest: '惠东巽寮湾' },
  { name: '罗浮山', icon: '⛰️', dest: '博罗罗浮山' }
];

const timeFilters = [
  { value: 'all', label: '全部时段' },
  { value: 'morning', label: '上午 (06:00-12:00)' },
  { value: 'afternoon', label: '下午 (12:00-18:00)' },
  { value: 'evening', label: '晚上 (18:00-22:00)' }
];

const priceFilters = [
  { value: 'all', label: '全部价格' },
  { value: 'low', label: '50元以下' },
  { value: 'mid', label: '50-100元' },
  { value: 'high', label: '100元以上' }
];

const busTypeFilters = [
  { value: 'all', label: '全部车型' },
  { value: '豪华大巴', label: '豪华大巴' },
  { value: '普通大巴', label: '普通大巴' },
  { value: '跨境大巴', label: '跨境大巴' }
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function BusService() {
  const navigate = useNavigate();
  const { busSchedules, fetchBusSchedules } = useServiceStore();
  const [departure, setDeparture] = useState('惠州汽车总站');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeFilter, setTimeFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [busTypeFilter, setBusTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<BusSchedule | null>(null);

  useEffect(() => {
    loadSchedules();
  }, [departure, destination, departureDate]);

  const loadSchedules = async () => {
    setLoading(true);
    await fetchBusSchedules(departure, destination, departureDate);
    setLoading(false);
  };

  const handleSwapLocations = () => {
    const temp = departure;
    setDeparture(destination || temp);
    setDestination(temp);
  };

  const handleRouteClick = (dest: string) => {
    setDestination(dest);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadSchedules();
  };

  const filteredSchedules = useMemo(() => {
    return busSchedules.filter(schedule => {
      if (timeFilter !== 'all') {
        const hour = parseInt(schedule.departureTime.split(':')[0]);
        if (timeFilter === 'morning' && (hour < 6 || hour >= 12)) return false;
        if (timeFilter === 'afternoon' && (hour < 12 || hour >= 18)) return false;
        if (timeFilter === 'evening' && (hour < 18 || hour >= 22)) return false;
      }
      if (priceFilter !== 'all') {
        if (priceFilter === 'low' && schedule.price >= 50) return false;
        if (priceFilter === 'mid' && (schedule.price < 50 || schedule.price > 100)) return false;
        if (priceFilter === 'high' && schedule.price <= 100) return false;
      }
      if (busTypeFilter !== 'all' && schedule.busType !== busTypeFilter) return false;
      return true;
    });
  }, [busSchedules, timeFilter, priceFilter, busTypeFilter]);

  const getDateDisplay = () => {
    const date = new Date(departureDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    if (date.toDateString() === today.toDateString()) return '今天';
    if (date.toDateString() === tomorrow.toDateString()) return '明天';
    if (date.toDateString() === dayAfter.toDateString()) return '后天';
    
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
  };

  const getSeatsStatus = (seats: number) => {
    if (seats > 30) return { text: '充足', color: 'honghua' as const };
    if (seats > 10) return { text: '紧张', color: 'chaojing' as const };
    return { text: '仅剩少量', color: 'westlake' as const };
  };

  const resetFilters = () => {
    setTimeFilter('all');
    setPriceFilter('all');
    setBusTypeFilter('all');
  };

  const activeFilterCount = [timeFilter, priceFilter, busTypeFilter].filter(f => f !== 'all').length;

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
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">客运查询</h1>
          <p className="text-neutral-500">查询客运班次，在线购票出行</p>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <Card>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-westlake-500" />
                    出发地
                  </label>
                  <Select
                    options={departureOptions}
                    value={departure}
                    onChange={setDeparture}
                    placeholder="选择出发地"
                  />
                </div>

                <div className="flex items-end justify-center pb-1">
                  <motion.button
                    type="button"
                    onClick={handleSwapLocations}
                    className="p-3 rounded-full bg-westlake-100 text-westlake-600 hover:bg-westlake-200 transition-colors"
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ArrowRightLeft className="w-5 h-5" />
                  </motion.button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-honghua-500" />
                    目的地
                  </label>
                  <Select
                    options={destinationOptions}
                    value={destination}
                    onChange={setDestination}
                    placeholder="选择目的地"
                    searchable
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-700 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-chaojing-600" />
                    出发日期
                  </label>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 rounded-button border border-neutral-200 bg-white focus:ring-2 focus:ring-westlake-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="md:col-span-2 flex items-end gap-3">
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1"
                    loading={loading}
                    leftIcon={<Search className="w-5 h-5" />}
                  >
                    查询班次
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(activeFilterCount > 0 && 'border-westlake-500 text-westlake-600')}
                    rightIcon={
                      activeFilterCount > 0 ? (
                        <Badge variant="westlake">{activeFilterCount}</Badge>
                      ) : undefined
                    }
                  >
                    <Filter className="w-5 h-5" />
                    筛选
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 border-t border-neutral-100">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-neutral-700">筛选条件</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={resetFilters}
                          rightIcon={<X className="w-4 h-4" />}
                        >
                          重置
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm text-neutral-600">出发时段</label>
                          <Select
                            options={timeFilters}
                            value={timeFilter}
                            onChange={setTimeFilter}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-neutral-600">票价范围</label>
                          <Select
                            options={priceFilters}
                            value={priceFilter}
                            onChange={setPriceFilter}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm text-neutral-600">车型</label>
                          <Select
                            options={busTypeFilters}
                            value={busTypeFilter}
                            onChange={setBusTypeFilter}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </Card>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <Card>
            <h3 className="font-bold text-neutral-800 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-chaojing-500" />
              热门线路
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {popularRoutes.map((route, index) => (
                <motion.button
                  key={route.name}
                  onClick={() => handleRouteClick(route.dest)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                    destination === route.dest
                      ? 'bg-westlake-100 text-westlake-600'
                      : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                  )}
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <span className="text-2xl">{route.icon}</span>
                  <span className="text-sm font-medium">{route.name}</span>
                </motion.button>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-800">
              {destination ? `${departure} → ${destination}` : '全部班次'}
              <span className="text-sm font-normal text-neutral-500 ml-2">
                {getDateDisplay()} · 共 {filteredSchedules.length} 班
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-westlake-500" />
            </div>
          ) : filteredSchedules.length === 0 ? (
            <Card className="text-center py-12">
              <Bus className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">暂无符合条件的班次</p>
              <p className="text-sm text-neutral-400 mt-1">请尝试修改筛选条件</p>
            </Card>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredSchedules.map((schedule, index) => {
                  const seatsStatus = getSeatsStatus(schedule.seatsAvailable);
                  return (
                    <motion.div
                      key={schedule.id}
                      variants={fadeInUp}
                      custom={index}
                      layout
                    >
                      <Card
                        hover
                        onClick={() => setSelectedSchedule(selectedSchedule?.id === schedule.id ? null : schedule)}
                        className={cn(
                          selectedSchedule?.id === schedule.id && 'ring-2 ring-westlake-500'
                        )}
                      >
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="text-center min-w-[80px]">
                              <div className="text-2xl font-bold text-neutral-800">{schedule.departureTime}</div>
                              <div className="text-xs text-neutral-500">{schedule.from}</div>
                            </div>

                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-2 h-2 rounded-full bg-westlake-500" />
                              <div className="flex-1 h-px bg-dashed bg-neutral-300 relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="bg-white px-2 text-xs text-neutral-500">
                                    {schedule.duration}
                                  </span>
                                </div>
                              </div>
                              <div className="w-2 h-2 rounded-full bg-honghua-500" />
                            </div>

                            <div className="text-center min-w-[80px]">
                              <div className="text-2xl font-bold text-neutral-800">{schedule.arrivalTime}</div>
                              <div className="text-xs text-neutral-500">{schedule.to}</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 border-t md:border-t-0 border-neutral-100 pt-4 md:pt-0">
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-neutral-500">车型：</span>
                                <span className="text-neutral-700">{schedule.busType}</span>
                              </div>
                              <div>
                                <span className="text-neutral-500">运营商：</span>
                                <span className="text-neutral-700">{schedule.operator}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-westlake-600">¥{schedule.price}</div>
                                <div className="flex items-center gap-1 text-xs text-neutral-500">
                                  <User className="w-3 h-3" />
                                  <span>余票 {schedule.seatsAvailable} 张</span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <Badge variant={seatsStatus.color}>
                                  {seatsStatus.text}
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    alert(`即将购票：${schedule.from} → ${schedule.to}，¥${schedule.price}`);
                                  }}
                                >
                                  <Ticket className="w-4 h-4" />
                                  购票
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {selectedSchedule?.id === schedule.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-neutral-100">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="bg-neutral-50 rounded-xl p-3">
                                    <div className="text-xs text-neutral-500 mb-1">出发站点</div>
                                    <div className="font-medium text-neutral-800">{schedule.from}</div>
                                  </div>
                                  <div className="bg-neutral-50 rounded-xl p-3">
                                    <div className="text-xs text-neutral-500 mb-1">到达站点</div>
                                    <div className="font-medium text-neutral-800">{schedule.to}</div>
                                  </div>
                                  <div className="bg-neutral-50 rounded-xl p-3">
                                    <div className="text-xs text-neutral-500 mb-1">车型</div>
                                    <div className="font-medium text-neutral-800">{schedule.busType}</div>
                                  </div>
                                  <div className="bg-neutral-50 rounded-xl p-3">
                                    <div className="text-xs text-neutral-500 mb-1">票价</div>
                                    <div className="font-medium text-westlake-600">¥{schedule.price}</div>
                                  </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-neutral-400" />
                                  <span className="text-sm text-neutral-500">
                                    全程 {schedule.duration}，{schedule.operator} 承运
                                  </span>
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
      </div>
    </motion.div>
  );
}
