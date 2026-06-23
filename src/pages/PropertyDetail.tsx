import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Building2,
  Ruler,
  Compass,
  Home,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Gavel,
  FileText,
  Calculator,
  Eye,
  Users,
  Play,
  ZoomIn,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  FileCheck,
  Download,
  ArrowRight,
  RotateCcw,
  Bell,
  Scale,
  FileSpreadsheet,
  History,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Megaphone,
  Search,
  Wallet,
} from 'lucide-react';
import {
  getPropertyById,
  getPropertyReport,
  getAuctionProcess,
  getBidRecords,
  getDocuments,
  riskTagDescriptions,
  mockMarketData,
} from '@/mock/data';
import {
  formatPrice,
  formatPriceFull,
  formatPricePerSqm,
  formatDate,
  formatDateTime,
  calculateTax,
  getAuctionStatusLabel,
  getAuctionStatusClass,
  cn,
  getRiskLevelLabel,
  getRiskLevelClass,
  getCountdown,
} from '@/utils';
import { useCompareStore } from '@/store';

const tabs = [
  { key: 'info', label: '房源信息', icon: Building2 },
  { key: 'report', label: '产权报告', icon: FileCheck },
  { key: 'tax', label: '税费计算', icon: Calculator },
  { key: 'process', label: '拍卖进程', icon: Clock },
  { key: 'bids', label: '竞价记录', icon: Gavel },
];

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const property = getPropertyById(id || '');
  const report = getPropertyReport(id || '');
  const process = getAuctionProcess(id || '');
  const bidRecords = getBidRecords(id || '');
  const documents = getDocuments(id);
  const { addToCompare, isInCompare } = useCompareStore();

  const urlTab = searchParams.get('tab');
  const initialTab = urlTab === 'docs' ? 'report' : urlTab && tabs.some(t => t.key === urlTab) ? urlTab : 'info';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFirstHouse, setIsFirstHouse] = useState(true);
  const [propertyAge, setPropertyAge] = useState(5);
  const [bidAmount, setBidAmount] = useState(0);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: false });
  const [showVR, setShowVR] = useState(false);
  const [vrAngle, setVrAngle] = useState(0);
  const [showMaterialDetail, setShowMaterialDetail] = useState(false);
  const [expandedRisks, setExpandedRisks] = useState<string[]>([]);
  const [expandedRiskTags, setExpandedRiskTags] = useState<string[]>([]);

  useEffect(() => {
    if (property) {
      setBidAmount(property.startingPrice);
    }
  }, [property]);

  useEffect(() => {
    if (urlTab === 'vr') {
      setShowVR(true);
    }
  }, [urlTab]);

  useEffect(() => {
    if (property?.auctionStartTime) {
      const target = property.status === 'bidding' ? property.auctionEndTime : property.auctionStartTime;
      const timer = setInterval(() => {
        setCountdown(getCountdown(target));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [property]);

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-ink-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-ink-700 mb-2">标的不存在</h2>
          <p className="text-ink-500 mb-6">该拍卖标的可能已下架或不存在</p>
          <Link to="/list" className="btn-primary">
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  const discount = Math.round((1 - property.startingPrice / property.appraisalPrice) * 100);
  const taxResult = calculateTax(property.startingPrice, property.area, isFirstHouse, propertyAge);
  const inCompare = isInCompare(property.id);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const minIncrement = Math.ceil(property.startingPrice * 0.01 / 10000) * 10000;

  const phases = [
    { key: 'notice', label: '公告期', start: process?.noticeStart, end: process?.noticeEnd, description: '法院发布拍卖公告，展示标的信息和竞拍规则' },
    { key: 'due-diligence', label: '尽调期', start: process?.dueDiligenceStart, end: process?.dueDiligenceEnd, description: '意向竞买人可现场看样、咨询、开展尽职调查' },
    { key: 'deposit', label: '保证金缴纳', end: process?.depositDeadline, description: '保证金通过银行监管账户冻结，未成交自动退还' },
    { key: 'bidding', label: '延时竞价', start: process?.auctionStart, end: process?.auctionEnd, description: '结束前5分钟有人出价则自动延时5分钟' },
    { key: 'confirmation', label: '成交确认', description: '最高出价者竞得，签署成交确认书' },
    { key: 'contract', label: '电子签约', description: '线上电子合同存证，法院出具执行裁定书' },
  ];

  const phaseOrder = ['notice', 'due-diligence', 'deposit', 'bidding', 'confirmation', 'contract', 'ended'];
  const currentPhaseIndex = phaseOrder.indexOf(process?.currentPhase || 'notice');

  const toggleRisk = (key: string) => {
    setExpandedRisks((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleRiskTag = (tag: string) => {
    setExpandedRiskTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const getRiskLevelTagClass = (level: string) => {
    const classes: Record<string, string> = {
      high: 'text-danger-600 bg-danger-50',
      medium: 'text-gold-700 bg-gold-50',
      low: 'text-success-600 bg-success-50',
    };
    return classes[level] || '';
  };

  const getRiskInfoByTag = (tag: string) => {
    if (!report) return null;
    const riskMap: Record<string, any> = {
      '有抵押': report.mortgageInfo,
      '有查封': report.seizureRecord,
      '户口未迁出': report.householdInfo,
      '租赁关系存续': report.leaseInfo,
      '有欠费': report.arrears,
    };
    return riskMap[tag];
  };

  return (
    <div className="min-h-screen bg-ink-50 pb-10">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-ink-200">
        <div className="container py-3">
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <Link to="/" className="hover:text-primary-600">首页</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/list" className="hover:text-primary-600">标的列表</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-ink-700 truncate">{property.title}</span>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
              <div className="relative aspect-[16/10] bg-ink-100">
                <img
                  src={property.images[currentImageIndex]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />

                {/* Navigation Arrows */}
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Status Badge */}
                <div className="absolute top-4 left-4">
                  <span className={cn('tag text-sm px-3 py-1', getAuctionStatusClass(property.status))}>
                    {getAuctionStatusLabel(property.status)}
                  </span>
                </div>

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/50 text-white text-sm rounded-full">
                  {currentImageIndex + 1} / {property.images.length}
                </div>

                {/* VR Button */}
                <button
                  onClick={() => setShowVR(true)}
                  className="absolute bottom-4 left-4 px-4 py-2 bg-white/90 backdrop-blur text-ink-800 text-sm font-medium rounded-lg flex items-center gap-2 hover:bg-white transition-colors"
                >
                  <Play className="w-4 h-4 text-primary-600" />
                  VR全景看房
                </button>
              </div>

              {/* Thumbnails */}
              <div className="p-4 border-t border-ink-100">
                <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
                  {property.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        'flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                        currentImageIndex === index
                          ? 'border-primary-500 ring-2 ring-primary-200'
                          : 'border-transparent hover:border-ink-300'
                      )}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Property Title & Info */}
            <div className="bg-white rounded-xl border border-ink-200 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-ink-900 mb-2">
                    {property.title}
                  </h1>
                  <p className="text-ink-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {property.address}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-ink-500 mb-1">起拍价</div>
                  <div className="text-3xl font-bold text-primary-600 font-serif">
                    ¥{formatPrice(property.startingPrice)}
                  </div>
                  <div className="text-xs text-success-600 mt-1">
                    较评估价低{discount}%
                  </div>
                </div>
              </div>

              {/* Key Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-ink-100">
                <div className="text-center">
                  <div className="text-ink-400 text-sm mb-1">评估价</div>
                  <div className="text-ink-900 font-medium">¥{formatPrice(property.appraisalPrice)}</div>
                </div>
                <div className="text-center">
                  <div className="text-ink-400 text-sm mb-1">保证金</div>
                  <div className="text-ink-900 font-medium">¥{formatPrice(property.deposit)}</div>
                </div>
                <div className="text-center">
                  <div className="text-ink-400 text-sm mb-1">单价</div>
                  <div className="text-ink-900 font-medium">{formatPricePerSqm(property.startingPrice, property.area)}</div>
                </div>
                <div className="text-center">
                  <div className="text-ink-400 text-sm mb-1">加价幅度</div>
                  <div className="text-ink-900 font-medium">¥{formatPrice(minIncrement)}</div>
                </div>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-ink-400" />
                  <span className="text-ink-600 text-sm">
                    <span className="text-ink-400">建筑面积</span> {property.area}㎡
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-ink-400" />
                  <span className="text-ink-600 text-sm">
                    <span className="text-ink-400">户型</span> {property.rooms}室{property.halls}厅
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-ink-400" />
                  <span className="text-ink-600 text-sm">
                    <span className="text-ink-400">楼层</span> {property.floor}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-ink-400" />
                  <span className="text-ink-600 text-sm">
                    <span className="text-ink-400">朝向</span> {property.orientation}
                  </span>
                </div>
              </div>
            </div>

            {/* Neighborhood Market - Highlighted */}
            <div className="bg-white rounded-xl border-2 border-primary-200 p-6 shadow-sm shadow-primary-50/50">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-serif font-bold text-xl text-ink-900">同地段近半年行情 · {property.district} {property.title.split(' ')[0]}</h3>
                  <p className="text-sm text-ink-500 mt-1">基于同板块最近6个月成交数据</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  {
                    label: '成交均价',
                    value: '¥' + ((mockMarketData.find(d => d.district === property.district)?.avgPrice || 70000) / 10000).toFixed(1) + '万/㎡',
                    change: (mockMarketData.find(d => d.district === property.district)?.avgPriceChange || 2) >= 0
                      ? '+' + (mockMarketData.find(d => d.district === property.district)?.avgPriceChange || 2) + '%'
                      : (mockMarketData.find(d => d.district === property.district)?.avgPriceChange || 2) + '%',
                    trend: (mockMarketData.find(d => d.district === property.district)?.avgPriceChange || 2) >= 0 ? 'up' : 'down'
                  },
                  {
                    label: '流拍率',
                    value: (mockMarketData.find(d => d.district === property.district)?.unsoldRate || 20) + '%',
                    change: '-2.1%',
                    trend: 'down'
                  },
                  {
                    label: '溢价率',
                    value: (mockMarketData.find(d => d.district === property.district)?.premiumRate || 15) + '%',
                    change: '+1.8%',
                    trend: 'up'
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-gradient-to-br from-ink-50 to-white rounded-xl p-4 border border-ink-100">
                    <div className="text-xs text-ink-500 mb-2">{item.label}</div>
                    <div className="text-xl font-bold text-ink-900 font-serif mb-1">{item.value}</div>
                    <div className={cn(
                      'text-xs font-medium flex items-center gap-0.5',
                      item.trend === 'up' ? 'text-success-600' : 'text-danger-600'
                    )}>
                      {item.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      环比 {item.change}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-5">
                <div className="text-xs text-ink-500 mb-3">近6个月成交量</div>
                <div className="flex items-end justify-between gap-2 h-24 bg-ink-50/50 rounded-lg p-3">
                  {[0.65, 0.78, 0.85, 0.92, 1.0, 1.1].map((ratio, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-primary-600 via-primary-500 to-primary-400 rounded-t-sm transition-all hover:from-primary-700 hover:via-primary-600 hover:to-primary-500 shadow-sm"
                        style={{ height: `${ratio * 100}%`, minHeight: '6px' }}
                      ></div>
                      <span className="text-xs text-ink-400">{['1月', '2月', '3月', '4月', '5月', '6月'][i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <button className="btn-secondary w-full justify-center">
                  查看完整分析
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </button>
              </div>
            </div>

            {/* Tabs Content */}
            <div className="bg-white rounded-xl border border-ink-200 overflow-hidden">
              {/* Tab Nav */}
              <div className="flex border-b border-ink-200 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        'flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                        activeTab === tab.key
                          ? 'text-primary-600 border-primary-600'
                          : 'text-ink-500 border-transparent hover:text-ink-700'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'info' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="font-serif font-bold text-lg text-ink-900 mb-4">基本信息</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { label: '小区名称', value: property.title.split(' ')[0] + '小区' },
                          { label: '所在区域', value: property.district },
                          { label: '详细地址', value: property.address },
                          { label: '建筑面积', value: property.area + '㎡' },
                          { label: '房屋户型', value: property.rooms + '室' + property.halls + '厅1厨2卫' },
                          { label: '所在楼层', value: property.floor },
                          { label: '建筑朝向', value: property.orientation },
                          { label: '装修情况', value: property.decoration || '简装' },
                          { label: '楼龄', value: property.buildingAge + '年' },
                          { label: '房屋类型', value: property.propertyType || '住宅' },
                          { label: '产权性质', value: '商品房' },
                          { label: '执行法院', value: property.court },
                        ].map((item, i) => (
                          <div key={i} className="flex flex-col">
                            <span className="text-xs text-ink-400 mb-1">{item.label}</span>
                            <span className="text-sm text-ink-800">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-lg text-ink-900 mb-4">房源描述</h3>
                      <p className="text-sm text-ink-600 leading-relaxed">
                        该标的位于{property.district}核心区域，周边配套成熟，交通便利。小区环境优美，物业管理完善。
                        房屋户型方正，采光良好，装修保养情况较佳。周边教育、医疗、商业资源丰富，生活便利度高。
                        标的由{property.court}依法公开拍卖，产权清晰，交易安全有保障。
                      </p>
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-lg text-ink-900 mb-4">周边配套</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: '地铁站', value: '步行8分钟', icon: '🚇' },
                          { label: '学校', value: '3所中小学', icon: '🏫' },
                          { label: '医院', value: '2家三甲', icon: '🏥' },
                          { label: '商场', value: '4个商圈', icon: '🛍️' },
                        ].map((item, i) => (
                          <div key={i} className="bg-ink-50 rounded-lg p-4 text-center">
                            <div className="text-2xl mb-2">{item.icon}</div>
                            <div className="text-sm font-medium text-ink-800">{item.label}</div>
                            <div className="text-xs text-ink-500">{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'report' && report && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-bold text-lg text-ink-900">产权核查报告</h3>
                      <span className="text-xs text-ink-400">
                        报告编号：{report.reportNo} | {report.reportDate}
                      </span>
                    </div>

                    <div className="bg-gradient-to-r from-primary-50 to-gold-50 rounded-xl p-6 border border-primary-100">
                      <div className="flex items-center gap-3 mb-4">
                        <Scale className="w-6 h-6 text-primary-600" />
                        <h4 className="font-serif font-bold text-ink-900">法院评估价详情</h4>
                        <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                          法院委托评估
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-ink-500">评估机构：</span>
                          <span className="text-ink-800">{report.appraisalDetail.agency}</span>
                        </div>
                        <div>
                          <span className="text-ink-500">评估基准日：</span>
                          <span className="text-ink-800">{report.appraisalDetail.baseDate}</span>
                        </div>
                        <div>
                          <span className="text-ink-500">评估方法：</span>
                          <span className="text-ink-800">{report.appraisalDetail.method}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 p-4 bg-white/60 rounded-lg">
                        <div className="text-center">
                          <div className="text-xs text-ink-500 mb-1">房屋价值</div>
                          <div className="text-lg font-bold text-ink-900 font-serif">
                            ¥{formatPrice(report.appraisalDetail.houseValue)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-ink-500 mb-1">土地价值</div>
                          <div className="text-lg font-bold text-ink-900 font-serif">
                            ¥{formatPrice(report.appraisalDetail.landValue)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-ink-500 mb-1">装修价值</div>
                          <div className="text-lg font-bold text-ink-900 font-serif">
                            ¥{formatPrice(report.appraisalDetail.decorationValue)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <div>
                          <span className="text-ink-500">评估总价：</span>
                          <span className="text-lg font-bold text-primary-600 font-serif">
                            ¥{formatPrice(property.appraisalPrice)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-ink-500">较起拍价：</span>
                          <span className="text-success-600 font-medium">低 {discount}%</span>
                        </div>
                      </div>
                    </div>

                    <div className={cn(
                      'rounded-xl p-6 border-l-4',
                      report.ownershipStatus === 'clear'
                        ? 'bg-success-50 border-success-500'
                        : 'bg-gold-50 border-gold-500'
                    )}>
                      <div className="flex items-center gap-3 mb-2">
                        {report.ownershipStatus === 'clear' ? (
                          <CheckCircle2 className="w-8 h-8 text-success-600" />
                        ) : (
                          <AlertTriangle className="w-8 h-8 text-gold-600" />
                        )}
                        <div>
                          <div className="text-xs text-ink-500 mb-1">核查结论</div>
                          <div className="text-xl font-bold font-serif text-ink-900">
                            {report.conclusion}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-ink-50 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <History className="w-5 h-5 text-ink-600" />
                        <h4 className="font-medium text-ink-900">复查记录</h4>
                      </div>
                      <div className="relative">
                        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-ink-200"></div>
                        <div className="space-y-4">
                          {report.reviewRecords.slice(0, 3).map((record, index) => (
                            <div key={index} className="relative pl-8">
                              <div className={cn(
                                'absolute left-1.5 top-1 w-3 h-3 rounded-full',
                                index === 0 ? 'bg-primary-500' : 'bg-ink-300'
                              )}></div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-ink-800">{record.date}</span>
                                <span className="text-xs text-ink-500">复查人：{record.reviewer}</span>
                              </div>
                              <p className="text-sm text-ink-600">{record.result}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-ink-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setShowMaterialDetail(!showMaterialDetail)}
                        className="w-full flex items-center justify-between p-4 hover:bg-ink-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-5 h-5 text-ink-600" />
                          <span className="font-medium text-ink-900">材料正文</span>
                        </div>
                        {showMaterialDetail ? (
                          <ChevronUp className="w-5 h-5 text-ink-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-ink-400" />
                        )}
                      </button>
                      {showMaterialDetail && (
                        <div className="px-4 pb-4 pt-2 border-t border-ink-100">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-ink-500">产权证书编号：</span>
                              <span className="text-ink-800">{report.materialDetail.certNo}</span>
                            </div>
                            <div>
                              <span className="text-ink-500">登记时间：</span>
                              <span className="text-ink-800">{report.materialDetail.registerDate}</span>
                            </div>
                            <div>
                              <span className="text-ink-500">产权性质：</span>
                              <span className="text-ink-800">{report.materialDetail.ownershipType}</span>
                            </div>
                            <div>
                              <span className="text-ink-500">共有情况：</span>
                              <span className="text-ink-800">{report.materialDetail.coOwnership}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className={cn(
                        'rounded-xl border overflow-hidden',
                        report.mortgageInfo.hasMortgage
                          ? 'bg-danger-50 border-danger-200'
                          : 'bg-success-50 border-success-200'
                      )}>
                        <button
                          onClick={() => toggleRisk('mortgage')}
                          className="w-full p-4 flex items-center justify-between"
                        >
                          <span className="font-medium text-ink-900 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            抵押情况
                          </span>
                          <div className="flex items-center gap-2">
                            {report.mortgageInfo.hasMortgage ? (
                              <span className="text-xs text-danger-600 font-medium">有抵押</span>
                            ) : (
                              <span className="text-xs text-success-600 font-medium">无抵押</span>
                            )}
                            {expandedRisks.includes('mortgage') ? (
                              <ChevronUp className="w-4 h-4 text-ink-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-ink-400" />
                            )}
                          </div>
                        </button>
                        {expandedRisks.includes('mortgage') && (
                          <div className="px-4 pb-4 space-y-3 border-t border-danger-100/50">
                            {report.mortgageInfo.hasMortgage && (
                              <div className="text-sm text-ink-600 space-y-1 pt-3">
                                <p>抵押权人：{report.mortgageInfo.mortgagee}</p>
                                <p>抵押金额：¥{formatPrice(report.mortgageInfo.mortgageAmount)}</p>
                                <p>抵押日期：{report.mortgageInfo.mortgageDate}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-2 pt-2">
                              <span className="text-xs text-ink-500">风险等级：</span>
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded-full font-medium',
                                getRiskLevelTagClass(report.mortgageInfo.riskLevel)
                              )}>
                                {getRiskLevelLabel(report.mortgageInfo.riskLevel)}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-ink-500">影响程度：</span>
                              <p className="text-sm text-ink-700 mt-1">{report.mortgageInfo.impact}</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Lightbulb className="w-3 h-3 text-primary-500" />
                                <span className="text-xs text-primary-700 font-medium">处置建议</span>
                              </div>
                              <p className="text-sm text-ink-700">{report.mortgageInfo.suggestion}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={cn(
                        'rounded-xl border overflow-hidden',
                        report.seizureRecord.hasSeizure
                          ? 'bg-danger-50 border-danger-200'
                          : 'bg-success-50 border-success-200'
                      )}>
                        <button
                          onClick={() => toggleRisk('seizure')}
                          className="w-full p-4 flex items-center justify-between"
                        >
                          <span className="font-medium text-ink-900 flex items-center gap-2">
                            <Gavel className="w-4 h-4" />
                            查封记录
                          </span>
                          <div className="flex items-center gap-2">
                            {report.seizureRecord.hasSeizure ? (
                              <span className="text-xs text-danger-600 font-medium">
                                {report.seizureRecord.seizureCount}轮查封
                              </span>
                            ) : (
                              <span className="text-xs text-success-600 font-medium">无查封</span>
                            )}
                            {expandedRisks.includes('seizure') ? (
                              <ChevronUp className="w-4 h-4 text-ink-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-ink-400" />
                            )}
                          </div>
                        </button>
                        {expandedRisks.includes('seizure') && (
                          <div className="px-4 pb-4 space-y-3 border-t border-danger-100/50">
                            {report.seizureRecord.hasSeizure && (
                              <div className="text-sm text-ink-600 space-y-1 pt-3">
                                <p>查封法院：{report.seizureRecord.seizureCourt}</p>
                                <p>查封日期：{report.seizureRecord.seizureDate}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-2 pt-2">
                              <span className="text-xs text-ink-500">风险等级：</span>
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded-full font-medium',
                                getRiskLevelTagClass(report.seizureRecord.riskLevel)
                              )}>
                                {getRiskLevelLabel(report.seizureRecord.riskLevel)}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-ink-500">影响程度：</span>
                              <p className="text-sm text-ink-700 mt-1">{report.seizureRecord.impact}</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Lightbulb className="w-3 h-3 text-primary-500" />
                                <span className="text-xs text-primary-700 font-medium">处置建议</span>
                              </div>
                              <p className="text-sm text-ink-700">{report.seizureRecord.suggestion}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={cn(
                        'rounded-xl border overflow-hidden',
                        report.householdInfo.hasHousehold
                          ? 'bg-gold-50 border-gold-200'
                          : 'bg-success-50 border-success-200'
                      )}>
                        <button
                          onClick={() => toggleRisk('household')}
                          className="w-full p-4 flex items-center justify-between"
                        >
                          <span className="font-medium text-ink-900 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            户口情况
                          </span>
                          <div className="flex items-center gap-2">
                            {report.householdInfo.hasHousehold ? (
                              <span className="text-xs text-gold-700 font-medium">有户口未迁出</span>
                            ) : (
                              <span className="text-xs text-success-600 font-medium">无户口</span>
                            )}
                            {expandedRisks.includes('household') ? (
                              <ChevronUp className="w-4 h-4 text-ink-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-ink-400" />
                            )}
                          </div>
                        </button>
                        {expandedRisks.includes('household') && (
                          <div className="px-4 pb-4 space-y-3 border-t border-gold-100/50">
                            {report.householdInfo.hasHousehold && (
                              <div className="text-sm text-ink-600 space-y-1 pt-3">
                                <p>户口数量：{report.householdInfo.householdCount}人</p>
                                <p>能否迁出：{report.householdInfo.canMoveOut ? '可协助迁出' : '暂无法迁出'}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-2 pt-2">
                              <span className="text-xs text-ink-500">风险等级：</span>
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded-full font-medium',
                                getRiskLevelTagClass(report.householdInfo.riskLevel)
                              )}>
                                {getRiskLevelLabel(report.householdInfo.riskLevel)}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-ink-500">影响程度：</span>
                              <p className="text-sm text-ink-700 mt-1">{report.householdInfo.impact}</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Lightbulb className="w-3 h-3 text-primary-500" />
                                <span className="text-xs text-primary-700 font-medium">处置建议</span>
                              </div>
                              <p className="text-sm text-ink-700">{report.householdInfo.suggestion}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={cn(
                        'rounded-xl border overflow-hidden',
                        report.leaseInfo.hasLease
                          ? 'bg-danger-50 border-danger-200'
                          : 'bg-success-50 border-success-200'
                      )}>
                        <button
                          onClick={() => toggleRisk('lease')}
                          className="w-full p-4 flex items-center justify-between"
                        >
                          <span className="font-medium text-ink-900 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            租赁情况
                          </span>
                          <div className="flex items-center gap-2">
                            {report.leaseInfo.hasLease ? (
                              <span className="text-xs text-danger-600 font-medium">有租约</span>
                            ) : (
                              <span className="text-xs text-success-600 font-medium">无租约</span>
                            )}
                            {expandedRisks.includes('lease') ? (
                              <ChevronUp className="w-4 h-4 text-ink-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-ink-400" />
                            )}
                          </div>
                        </button>
                        {expandedRisks.includes('lease') && (
                          <div className="px-4 pb-4 space-y-3 border-t border-danger-100/50">
                            {report.leaseInfo.hasLease && (
                              <div className="text-sm text-ink-600 space-y-1 pt-3">
                                <p>承租人：{report.leaseInfo.lessee}</p>
                                <p>租赁期限：{report.leaseInfo.leaseTerm}</p>
                                <p className="text-danger-600 text-xs mt-2">
                                  提示：根据"买卖不破租赁"原则，租赁合同继续有效
                                </p>
                              </div>
                            )}
                            <div className="flex items-center gap-2 pt-2">
                              <span className="text-xs text-ink-500">风险等级：</span>
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded-full font-medium',
                                getRiskLevelTagClass(report.leaseInfo.riskLevel)
                              )}>
                                {getRiskLevelLabel(report.leaseInfo.riskLevel)}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-ink-500">影响程度：</span>
                              <p className="text-sm text-ink-700 mt-1">{report.leaseInfo.impact}</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Lightbulb className="w-3 h-3 text-primary-500" />
                                <span className="text-xs text-primary-700 font-medium">处置建议</span>
                              </div>
                              <p className="text-sm text-ink-700">{report.leaseInfo.suggestion}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={cn(
                        'rounded-xl border overflow-hidden',
                        report.arrears.totalArrears > 0
                          ? 'bg-gold-50 border-gold-200'
                          : 'bg-success-50 border-success-200'
                      )}>
                        <button
                          onClick={() => toggleRisk('arrears')}
                          className="w-full p-4 flex items-center justify-between"
                        >
                          <span className="font-medium text-ink-900 flex items-center gap-2">
                            <Calculator className="w-4 h-4" />
                            欠费情况
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'text-xs font-medium',
                              report.arrears.totalArrears > 0 ? 'text-gold-700' : 'text-success-600'
                            )}>
                              {report.arrears.totalArrears > 0
                                ? `欠费 ¥${formatPrice(report.arrears.totalArrears)}`
                                : '无欠费'}
                            </span>
                            {expandedRisks.includes('arrears') ? (
                              <ChevronUp className="w-4 h-4 text-ink-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-ink-400" />
                            )}
                          </div>
                        </button>
                        {expandedRisks.includes('arrears') && (
                          <div className="px-4 pb-4 space-y-3 border-t border-gold-100/50">
                            {report.arrears.totalArrears > 0 && (
                              <div className="text-sm text-ink-600 space-y-1 pt-3">
                                <p>物业费：¥{formatPrice(report.arrears.propertyFee)}</p>
                                <p>水电煤：¥{formatPrice(report.arrears.utilityFee)}</p>
                                <p>房产税：¥{formatPrice(report.arrears.propertyTax)}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-2 pt-2">
                              <span className="text-xs text-ink-500">风险等级：</span>
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded-full font-medium',
                                getRiskLevelTagClass(report.arrears.riskLevel)
                              )}>
                                {getRiskLevelLabel(report.arrears.riskLevel)}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-ink-500">影响程度：</span>
                              <p className="text-sm text-ink-700 mt-1">{report.arrears.impact}</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Lightbulb className="w-3 h-3 text-primary-500" />
                                <span className="text-xs text-primary-700 font-medium">处置建议</span>
                              </div>
                              <p className="text-sm text-ink-700">{report.arrears.suggestion}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-center pt-4">
                      <button className="btn-secondary">
                        <Download className="w-4 h-4 mr-2" />
                        下载完整尽调报告
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'tax' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="font-serif font-bold text-lg text-ink-900 mb-4">税费计算器</h3>
                      <p className="text-sm text-ink-500 mb-6">
                        基于当前起拍价估算交易税费，实际费用以过户时税务部门核算为准
                      </p>
                    </div>

                    {/* Calculator Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-2">
                          是否首套房
                        </label>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setIsFirstHouse(true)}
                            className={cn(
                              'flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors',
                              isFirstHouse
                                ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                                : 'bg-ink-50 text-ink-600 border-2 border-transparent'
                            )}
                          >
                            首套房
                          </button>
                          <button
                            onClick={() => setIsFirstHouse(false)}
                            className={cn(
                              'flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors',
                              !isFirstHouse
                                ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                                : 'bg-ink-50 text-ink-600 border-2 border-transparent'
                            )}
                          >
                            非首套房
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-2">
                          房屋年限（影响增值税）
                        </label>
                        <div className="flex gap-3">
                          {[2, 5, 10].map((year) => (
                            <button
                              key={year}
                              onClick={() => setPropertyAge(year)}
                              className={cn(
                                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                propertyAge === year
                                  ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                                  : 'bg-ink-50 text-ink-600 border-2 border-transparent'
                              )}
                            >
                              {year}年
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Tax Result */}
                    <div className="bg-gradient-to-br from-primary-50 to-gold-50 rounded-xl p-6">
                      <div className="text-center mb-6">
                        <div className="text-sm text-ink-500 mb-2">预估税费总额</div>
                        <div className="text-4xl font-bold text-primary-600 font-serif">
                          ¥{formatPrice(taxResult.total)}
                        </div>
                        <div className="text-sm text-ink-500 mt-1">
                          约为房价的 {((taxResult.total / property.startingPrice) * 100).toFixed(2)}%
                        </div>
                      </div>

                      <div className="space-y-3">
                        {taxResult.breakdown.map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-3 border-b border-primary-100/50 last:border-0">
                            <div>
                              <div className="font-medium text-ink-800">{item.name}</div>
                              <div className="text-xs text-ink-500">{item.description}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-ink-900">¥{formatPrice(item.amount)}</div>
                              <div className="text-xs text-primary-600">{item.rate}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-ink-400">
                      * 以上税费仅为估算，实际税费以房屋所在地不动产登记中心及税务部门最终核算为准。
                      法拍房可能存在其他特殊费用，建议咨询专业人士。
                    </p>
                  </motion.div>
                )}

                {activeTab === 'process' && process && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h3 className="font-serif font-bold text-lg text-ink-900">拍卖进程</h3>

                    {/* Countdown */}
                    {property.status === 'bidding' && (
                      <div className="bg-danger-50 rounded-xl p-6 text-center border border-danger-200">
                        <div className="text-sm text-danger-600 mb-3">竞价倒计时</div>
                        <div className="flex items-center justify-center gap-2 md:gap-4">
                          {[
                            { value: countdown.days, label: '天' },
                            { value: countdown.hours, label: '时' },
                            { value: countdown.minutes, label: '分' },
                            { value: countdown.seconds, label: '秒' },
                          ].map((item, i) => (
                            <div key={i} className="text-center">
                              <div className="w-14 h-14 md:w-16 md:h-16 bg-danger-600 text-white text-2xl md:text-3xl font-mono font-bold rounded-lg flex items-center justify-center">
                                {String(item.value).padStart(2, '0')}
                              </div>
                              <div className="text-xs text-danger-600 mt-2">{item.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="relative">
                      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-ink-200"></div>

                      {phases.map((phase, index) => {
                        const phaseIndex = phaseOrder.indexOf(phase.key);
                        const isCompleted = phaseIndex < currentPhaseIndex;
                        const isCurrent = phaseIndex === currentPhaseIndex;

                        return (
                          <div key={phase.key} className="relative pl-12 pb-8 last:pb-0">
                            <div className={cn(
                              'absolute left-2 top-0 w-7 h-7 rounded-full flex items-center justify-center border-2',
                              isCompleted && 'bg-success-500 border-success-500',
                              isCurrent && 'bg-primary-600 border-primary-600 animate-pulse',
                              !isCompleted && !isCurrent && 'bg-white border-ink-300'
                            )}>
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              ) : isCurrent ? (
                                <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                              ) : (
                                <div className="w-2.5 h-2.5 bg-ink-300 rounded-full"></div>
                              )}
                            </div>

                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <h4 className={cn(
                                'font-medium',
                                isCompleted || isCurrent ? 'text-ink-900' : 'text-ink-400'
                              )}>
                                {phase.label}
                              </h4>
                              <span className={cn(
                                'text-xs',
                                isCompleted || isCurrent ? 'text-ink-500' : 'text-ink-400'
                              )}>
                                {phase.start && formatDate(phase.start)}
                                {phase.end && ` ~ ${formatDate(phase.end)}`}
                              </span>
                            </div>

                            <p className={cn(
                              'text-sm mt-1',
                              isCompleted || isCurrent ? 'text-ink-500' : 'text-ink-300'
                            )}>
                              {phase.description}
                            </p>

                            {isCurrent && (
                              <p className="text-sm text-primary-600 mt-1 font-medium">
                                当前阶段进行中
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Important Info */}
                    <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
                      <h4 className="font-medium text-gold-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        重要提示
                      </h4>
                      <ul className="text-sm text-gold-700 space-y-1">
                        <li>• 保证金需在拍卖开始前完成缴纳，逾期将无法参与竞拍</li>
                        <li>• 建议提前完成尽调，充分了解标的状况后再参与竞拍</li>
                        <li>• 竞拍成功后需在规定时间内支付尾款，逾期将没收保证金</li>
                        <li>• 过户税费及可能的欠费由买受人承担，请提前测算成本</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'bids' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-bold text-lg text-ink-900">竞价记录</h3>
                      <span className="text-sm text-ink-500">共 {bidRecords.length} 次出价</span>
                    </div>

                    {/* Current Price */}
                    <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-primary-200 text-sm mb-1">当前最高价</div>
                          <div className="text-3xl font-bold font-serif">
                            ¥{formatPrice(bidRecords.length > 0 ? Math.max(...bidRecords.map(b => b.amount)) : property.startingPrice)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-primary-200 text-sm mb-1">报名人数</div>
                          <div className="text-2xl font-bold">{property.bidCount} 人</div>
                        </div>
                      </div>
                    </div>

                    {/* Bid List */}
                    <div className="border border-ink-200 rounded-lg overflow-hidden">
                      <div className="bg-ink-50 px-4 py-3 border-b border-ink-200 grid grid-cols-3 text-sm font-medium text-ink-600">
                        <span>竞买人</span>
                        <span className="text-center">出价</span>
                        <span className="text-right">时间</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {[...bidRecords].reverse().map((bid, index) => (
                          <div
                            key={bid.id}
                            className={cn(
                              'px-4 py-3 border-b border-ink-100 grid grid-cols-3 items-center last:border-0',
                              index === 0 && 'bg-gold-50'
                            )}
                          >
                            <span className="text-sm text-ink-700">
                              {bid.bidderName}
                              {index === 0 && <span className="ml-2 text-xs text-gold-600">领先</span>}
                            </span>
                            <span className={cn(
                              'text-sm font-medium text-center',
                              index === 0 ? 'text-gold-600' : 'text-ink-900'
                            )}>
                              ¥{formatPrice(bid.amount)}
                            </span>
                            <span className="text-xs text-ink-400 text-right">
                              {formatDateTime(bid.time)}
                            </span>
                          </div>
                        ))}

                        {bidRecords.length === 0 && (
                          <div className="py-12 text-center">
                            <Gavel className="w-10 h-10 text-ink-300 mx-auto mb-3" />
                            <p className="text-sm text-ink-500">暂无出价记录</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Risk Tags Detail */}
            {property.riskTags.length > 0 && (
              <div className="bg-white rounded-xl border border-ink-200 p-6">
                <h3 className="font-serif font-bold text-lg text-ink-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-gold-500" />
                  风险提示
                </h3>
                <div className="space-y-3">
                  {property.riskTags.map((tag) => {
                    const desc = riskTagDescriptions[tag];
                    const riskInfo = getRiskInfoByTag(tag);
                    const isExpanded = expandedRiskTags.includes(tag);
                    return (
                      <div
                        key={tag}
                        className={cn(
                          'rounded-lg border overflow-hidden',
                          desc?.level === 'danger' ? 'border-danger-200 bg-danger-50' : 'border-gold-200 bg-gold-50'
                        )}
                      >
                        <button
                          onClick={() => toggleRiskTag(tag)}
                          className="w-full p-4 flex items-center justify-between"
                        >
                          <span className={cn(
                            'tag',
                            desc?.level === 'danger' ? 'tag-danger' : 'tag-warning'
                          )}>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-ink-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-ink-400" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 space-y-3 border-t border-ink-200/30">
                            <div className="pt-3">
                              <div className="text-xs text-ink-500 mb-1">判定依据</div>
                              <p className="text-sm text-ink-700">{desc?.description}</p>
                            </div>
                            {riskInfo && (
                              <>
                                <div className="flex items-center gap-4">
                                  <div>
                                    <div className="text-xs text-ink-500 mb-1">风险等级</div>
                                    <span className={cn(
                                      'text-xs px-2 py-0.5 rounded-full font-medium',
                                      getRiskLevelTagClass(riskInfo.riskLevel)
                                    )}>
                                      {getRiskLevelLabel(riskInfo.riskLevel)}
                                    </span>
                                  </div>
                                  {report?.reviewRecords[0] && (
                                    <div>
                                      <div className="text-xs text-ink-500 mb-1">最近复查</div>
                                      <span className="text-sm text-ink-700">
                                        {report.reviewRecords[0].date} · {report.reviewRecords[0].reviewer}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-xs text-ink-500 mb-1">复查结果</div>
                                  <p className="text-sm text-ink-700">
                                    {report?.reviewRecords[0]?.result || '暂无复查记录'}
                                  </p>
                                </div>
                                <div>
                                  <div className="text-xs text-ink-500 mb-1">影响程度</div>
                                  <p className="text-sm text-ink-700">{riskInfo.impact}</p>
                                </div>
                              </>
                            )}
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Lightbulb className="w-3 h-3 text-primary-500" />
                                <span className="text-xs text-primary-700 font-medium">应对建议</span>
                              </div>
                              <p className="text-sm text-ink-700">
                                {riskInfo?.suggestion || desc?.suggestion}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-ink-400 mt-4">
                  * 以上风险提示基于平台尽调结果，仅供参考。请仔细阅读法院公告及相关法律文书，谨慎参与竞拍。
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bid Panel */}
            <div className="bg-white rounded-xl border border-ink-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif font-bold text-lg text-ink-900">立即报名</h3>
                <span className={cn('tag', getAuctionStatusClass(property.status))}>
                  {getAuctionStatusLabel(property.status)}
                </span>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-baseline justify-between">
                  <span className="text-ink-500 text-sm">起拍价</span>
                  <span className="text-2xl font-bold text-primary-600 font-serif">
                    ¥{formatPrice(property.startingPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-500">保证金</span>
                  <span className="text-ink-900 font-medium">¥{formatPrice(property.deposit)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-500">评估价</span>
                  <span className="text-ink-900">¥{formatPrice(property.appraisalPrice)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-500">加价幅度</span>
                  <span className="text-ink-900">¥{formatPrice(minIncrement)}</span>
                </div>
              </div>

              {property.status === 'bidding' && (
                <div className="mb-6">
                  <label className="block text-sm text-ink-600 mb-2">我的出价</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBidAmount(Math.max(property.startingPrice, bidAmount - minIncrement))}
                      className="w-10 h-10 rounded-lg bg-ink-100 text-ink-600 flex items-center justify-center hover:bg-ink-200 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 text-center py-2 bg-ink-50 rounded-lg font-medium text-ink-900">
                      ¥{formatPriceFull(bidAmount)}
                    </div>
                    <button
                      onClick={() => setBidAmount(bidAmount + minIncrement)}
                      className="w-10 h-10 rounded-lg bg-ink-100 text-ink-600 flex items-center justify-center hover:bg-ink-200 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {(property.status === 'bidding' || property.status === 'deposit') && (
                  <button className="btn-gold w-full justify-center">
                    <Gavel className="w-4 h-4 mr-2" />
                    立即报名参拍
                  </button>
                )}

                {property.status === 'notice' && (
                  <button className="btn-primary w-full justify-center">
                    <Bell className="w-4 h-4 mr-2" />
                    开拍提醒
                  </button>
                )}

                {property.status === 'sold' && (
                  <div className="text-center py-3 bg-success-50 text-success-700 rounded-lg font-medium">
                    <CheckCircle2 className="w-5 h-5 inline mr-2" />
                    已成交
                  </div>
                )}

                <button
                  onClick={() => !inCompare && addToCompare(property)}
                  className={cn(
                    'w-full justify-center flex items-center px-6 py-2.5 border-2 rounded-md font-medium transition-all',
                    inCompare
                      ? 'border-primary-600 text-primary-600 bg-primary-50'
                      : 'border-ink-200 text-ink-600 hover:border-primary-400 hover:text-primary-600'
                  )}
                >
                  {inCompare ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      已加入对比
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      加入对比
                    </>
                  )}
                </button>
              </div>

              {/* Quick Info */}
              <div className="mt-6 pt-6 border-t border-ink-100 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-ink-600">
                  <Eye className="w-4 h-4 text-ink-400" />
                  <span>{property.viewerCount} 人关注</span>
                </div>
                <div className="flex items-center gap-2 text-ink-600">
                  <Users className="w-4 h-4 text-ink-400" />
                  <span>{property.bidCount} 人已报名</span>
                </div>
                <div className="flex items-center gap-2 text-ink-600">
                  <Building2 className="w-4 h-4 text-ink-400" />
                  <span className="truncate">{property.court}</span>
                </div>
              </div>

              {/* Transaction Security */}
              <div className="mt-6 pt-6 border-t border-ink-100">
                <h4 className="font-medium text-ink-900 mb-4 text-sm">交易流程保障</h4>
                <div className="space-y-3">
                  {[
                    { icon: Shield, title: '保证金监管', desc: '银行存管' },
                    { icon: FileCheck, title: '电子签约', desc: '区块链存证' },
                    { icon: Gavel, title: '过户保障', desc: '法院协助执行' },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4.5 h-4.5 text-primary-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-ink-800">{item.title}</div>
                          <div className="text-xs text-ink-500">{item.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Auction Process Tracking */}
            <div className="bg-white rounded-xl border border-ink-200 p-6">
              <h3 className="font-serif font-bold text-lg text-ink-900 mb-4">交易流程追踪</h3>
              {(() => {
                const statusIndexMap: Record<string, number> = {
                  'notice': 0,
                  'due-diligence': 1,
                  'deposit': 2,
                  'bidding': 3,
                  'ended': 4,
                  'sold': 5,
                };
                const currentStepIndex = statusIndexMap[property.status] ?? 0;
                const progressPercent = property.status === 'sold' ? 100 : Math.round((currentStepIndex / 5) * 100);
                const steps = [
                  { key: 'notice', icon: Megaphone, label: '公告期', extra: '' },
                  { key: 'due-diligence', icon: Search, label: '尽调期', extra: '' },
                  { key: 'deposit', icon: Wallet, label: '保证金缴纳', extra: '监管银行：中国银行' },
                  { key: 'bidding', icon: Gavel, label: '延时竞价', extra: '自动延时机制' },
                  { key: 'confirmation', icon: CheckCircle2, label: '成交确认', extra: '法院出具文书' },
                  { key: 'contract', icon: FileCheck, label: '电子签约', extra: '区块链存证' },
                ];
                return (
                  <>
                    <div className="relative mb-6">
                      <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-ink-200"></div>
                      <div className="space-y-5">
                        {steps.map((step, index) => {
                          const StepIcon = step.icon;
                          const isCompleted = property.status === 'sold' || index < currentStepIndex;
                          const isCurrent = index === currentStepIndex && property.status !== 'sold';
                          return (
                            <div key={step.key} className="relative pl-12 flex items-start">
                              <div className={cn(
                                'absolute left-2 top-0 w-7 h-7 rounded-full flex items-center justify-center border-2',
                                isCompleted && 'bg-success-500 border-success-500',
                                isCurrent && 'bg-gold-500 border-gold-500',
                                !isCompleted && !isCurrent && 'bg-white border-ink-300'
                              )}>
                                {isCurrent && (
                                  <div className="absolute inset-0 rounded-full bg-gold-400 animate-ping opacity-40"></div>
                                )}
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-white relative z-10" />
                                ) : (
                                  <StepIcon className={cn(
                                    'w-3.5 h-3.5 relative z-10',
                                    isCurrent ? 'text-white' : 'text-ink-400'
                                  )} />
                                )}
                              </div>
                              <div className="flex-1 pt-0.5">
                                <div className="flex items-center justify-between">
                                  <span className={cn(
                                    'text-sm font-medium',
                                    isCompleted || isCurrent ? 'text-ink-900' : 'text-ink-400'
                                  )}>
                                    {step.label}
                                  </span>
                                  {step.extra && (
                                    <span className={cn(
                                      'text-xs',
                                      isCurrent ? 'text-gold-600' : 'text-ink-400'
                                    )}>
                                      {step.extra}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-ink-500">当前进度</span>
                        <span className="text-xs font-medium text-primary-600">{progressPercent}%</span>
                      </div>
                      <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-gold-500 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Documents */}
            {documents.length > 0 && (
              <div className="bg-white rounded-xl border border-ink-200 p-6">
                <h3 className="font-serif font-bold text-lg text-ink-900 mb-4">尽调文档</h3>
                <div className="space-y-3">
                  {documents.slice(0, 3).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 bg-ink-50 rounded-lg hover:bg-ink-100 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-ink-800 text-sm truncate">{doc.title}</div>
                        <div className="text-xs text-ink-500">{doc.typeLabel} · {doc.fileSize}</div>
                      </div>
                      <Download className="w-4 h-4 text-ink-400" />
                    </div>
                  ))}
                </div>
                <Link to="/due-diligence" className="mt-4 flex items-center justify-center text-sm text-primary-600 hover:text-primary-700">
                  查看全部文档
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VR Modal */}
      {showVR && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="relative w-full max-w-4xl mx-4">
            <button
              onClick={() => setShowVR(false)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white"
            >
              <XCircle className="w-8 h-8" />
            </button>

            <div className="aspect-video bg-ink-900 rounded-xl overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={property.images[0]}
                  alt="VR全景"
                  className="w-full h-full object-cover"
                  style={{ transform: `rotateY(${vrAngle}deg)` }}
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none"></div>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <button
                  onClick={() => setVrAngle(vrAngle - 30)}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <div className="text-white/80 text-sm">
                  拖动或点击按钮查看全景
                </div>
                <button
                  onClick={() => setVrAngle(vrAngle + 30)}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>

              <div className="absolute top-6 left-6">
                <span className="px-3 py-1 bg-white/20 backdrop-blur text-white text-sm rounded-full">
                  VR 全景看房
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
