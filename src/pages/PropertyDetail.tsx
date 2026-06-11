import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Heart,
  Bell,
  Flag,
  CheckCircle2,
  MapPin,
  Ruler,
  BedDouble,
  Bath,
  Layers,
  Compass,
  Palette,
  Calendar,
  Building2,
  Home,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Loader2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  FileText,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import {
  getProperty,
  getPropertyPriceHistory,
  getPriceComparison,
  getCompetitorMatrix,
} from '@/services/api';
import type { Property, PricePoint, CompetitorItem } from '@/mock/data';
import type { VerificationNode } from '@shared/types';
import PriceHistoryChart from '@/components/charts/PriceHistoryChart';
import TransactionScatter from '@/components/charts/TransactionScatter';
import CompetitorMatrix from '@/components/charts/CompetitorMatrix';
import VerificationChain from '@/components/VerificationChain';
import PriceAlertBadge from '@/components/PriceAlertBadge';

const categoryLabels: Record<string, string> = {
  secondhand: '二手房',
  new: '新房',
  rental: '租房',
  overseas: '海外房产',
  vacation: '度假房产',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { isDark } = useTheme();

  const [property, setProperty] = useState<Property | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [comparisonProperties, setComparisonProperties] = useState<Property[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [propertyData, priceHistoryData, comparisonData, competitorsData] =
          await Promise.all([
            getProperty(id),
            getPropertyPriceHistory({ id, range: '180d' }),
            getPriceComparison({ propertyId: id }),
            getCompetitorMatrix({ propertyId: id }),
          ]);

        setProperty(propertyData);
        setPriceHistory(priceHistoryData);
        setComparisonProperties(comparisonData);
        setCompetitors(competitorsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const districtAvgPrice = priceHistory.length > 0
    ? Math.round(priceHistory.reduce((sum, p) => sum + p.price, 0) / priceHistory.length * 1.02)
    : 0;

  const priceDeviation = property && districtAvgPrice > 0
    ? ((property.unitPrice - districtAvgPrice) / districtAvgPrice) * 100
    : 0;

  const buildingAge: number | null = null;

  const verificationNodes: VerificationNode[] = property?.verificationChain
    ? property.verificationChain.map((node, index) => ({
        id: `${property.id}-verification-${index}`,
        propertyId: property.id,
        step: index + 1,
        title: node.type === 'broker' ? '经纪人认证' :
               node.type === 'owner' ? '业主授权' :
               node.type === 'vr' ? 'VR 水印' : '区块链存证',
        description: node.type === 'broker' ? '经纪人身份与资质核验' :
                     node.type === 'owner' ? '房屋产权证明与业主委托验证' :
                     node.type === 'vr' ? 'VR 全景拍摄与防伪水印嵌入' : '验证数据上链，不可篡改',
        status: node.status,
        operator: node.operator,
        timestamp: node.timestamp,
        hash: node.hash || '',
        previousHash: '',
        evidence: node.evidence ? [node.evidence] : undefined,
      }))
    : [];

  const scatterData: PricePoint[] = comparisonProperties.flatMap(p =>
    p.priceHistory.filter(h => h.type === 'transaction')
  );

  const handlePrevImage = () => {
    if (!property) return;
    setCurrentImageIndex(prev =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!property) return;
    setCurrentImageIndex(prev =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
          <p className="text-neutral-600 dark:text-neutral-400">加载房源详情中...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="flex flex-col items-center gap-4 text-center p-8">
          <AlertTriangle className="w-16 h-16 text-accent-up" />
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
            {error || '房源不存在'}
          </h2>
          <Link
            to="/"
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8">
      <div className="container mx-auto px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.nav variants={itemVariants} className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              <li>
                <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  <Home className="w-4 h-4 inline" />
                  <span className="ml-1">首页</span>
                </Link>
              </li>
              <li><ChevronRight className="w-4 h-4" /></li>
              <li>
                <Link to={`/properties?category=${property.category}`} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {categoryLabels[property.category]}
                </Link>
              </li>
              <li><ChevronRight className="w-4 h-4" /></li>
              <li>
                <Link to={`/properties?district=${property.districtCode}`} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {property.district}
                </Link>
              </li>
              <li><ChevronRight className="w-4 h-4" /></li>
              <li className="text-neutral-800 dark:text-neutral-200 font-medium truncate max-w-xs">
                {property.title}
              </li>
            </ol>
          </motion.nav>

          <motion.header variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-xl shadow-card p-6 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {property.title}
                  </h1>
                  {property.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent-verified/10 text-accent-verified rounded-full text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      已核验
                    </span>
                  )}
                  <PriceAlertBadge deviation={priceDeviation} size="md" />
                </div>
                <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {property.address}
                  </span>
                  <span>发布于 {property.listingDate}</span>
                  <span>来源：{property.source}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="text-3xl font-bold text-accent-up">
                    ¥{(property.price / 10000).toFixed(1)}万
                  </span>
                </div>
                <div className="text-lg text-neutral-600 dark:text-neutral-400 mt-1">
                  ¥{property.unitPrice.toLocaleString()}/㎡
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsFavorite(!isFavorite)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all',
                  isFavorite
                    ? 'bg-accent-up/10 border-accent-up/30 text-accent-up'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-primary-300 dark:hover:border-primary-600'
                )}
              >
                <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
                {isFavorite ? '已收藏' : '收藏'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-primary-300 dark:hover:border-primary-600 transition-all"
              >
                <Bell className="w-4 h-4" />
                订阅降价
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-accent-up/30 hover:text-accent-up transition-all"
              >
                <Flag className="w-4 h-4" />
                举报
              </motion.button>
            </div>
          </motion.header>

          <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-xl shadow-card p-6 mb-6">
            <div className="relative mb-4">
              <div className="aspect-video rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-700">
                <img
                  src={property.images[currentImageIndex]}
                  alt={`${property.title} - 图片 ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {property.images.length > 1 && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronRightIcon className="w-6 h-6" />
                  </motion.button>
                </>
              )}
              <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
                {currentImageIndex + 1} / {property.images.length}
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {property.images.map((img, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    'flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all',
                    index === currentImageIndex
                      ? 'border-primary-500 shadow-md'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  )}
                >
                  <img
                    src={img}
                    alt={`缩略图 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-card p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-600" />
                房源详情
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                  <Ruler className="w-5 h-5 text-primary-500" />
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">建筑面积</div>
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">{property.area} ㎡</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                  <BedDouble className="w-5 h-5 text-primary-500" />
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">户型</div>
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">{property.bedrooms}室{property.bathrooms}卫</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                  <Bath className="w-5 h-5 text-primary-500" />
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">卫生间</div>
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">{property.bathrooms}个</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                  <Layers className="w-5 h-5 text-primary-500" />
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">楼层</div>
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">{property.floor}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                  <Compass className="w-5 h-5 text-primary-500" />
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">朝向</div>
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">{property.orientation}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                  <Palette className="w-5 h-5 text-primary-500" />
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">装修</div>
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">{property.decoration}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary-500" />
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">楼龄</div>
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">
                      {buildingAge !== null ? `${buildingAge}年` : '未知'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                  <Home className="w-5 h-5 text-primary-500" />
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">挂牌日期</div>
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">{property.listingDate}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg col-span-2">
                  <Building2 className="w-5 h-5 text-primary-500" />
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">来源</div>
                    <div className="font-medium text-neutral-800 dark:text-neutral-200">
                      {property.source}
                      {property.brokerName && ` · 经纪人: ${property.brokerName}`}
                      {property.brokerCompany && ` (${property.brokerCompany})`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-card p-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                近6个月价格走势
              </h2>
              <PriceHistoryChart
                data={priceHistory}
                districtAvgPrice={districtAvgPrice}
                height={350}
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-xl shadow-card p-6 mb-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent-verified" />
              房源核验流程
            </h2>
            <VerificationChain nodes={verificationNodes} />
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-xl shadow-card p-6 mb-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              同户型成交价对比
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              近3个月{property.district}同户型（{property.bedrooms}室）成交价格分布
            </p>
            <TransactionScatter
              data={scatterData}
              housingType={property.category}
              height={400}
            />
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-xl shadow-card p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-600" />
                周边同类型房源对比
              </h2>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                共 {competitors.length} 套可比房源
              </span>
            </div>
            <CompetitorMatrix
              data={competitors}
              basePrice={property.price}
            />
          </motion.div>

          {property.description && (
            <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-800 rounded-xl shadow-card p-6 mb-6">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                房源描述
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {property.description}
              </p>
            </motion.div>
          )}


        </motion.div>
      </div>
    </div>
  );
}
