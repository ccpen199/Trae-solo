import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productApi } from '../api/modules';
import { useToast, useUser } from '../App';
import Header from '../components/Header';

interface RechargeChannel {
  id: string;
  product_id: string;
  supplier_id: string;
  priority: number;
  success_rate: number;
  status: number;
  last_fail_time?: number;
  supplier_name?: string;
  created_at?: number;
  updated_at?: number;
  fail_reason?: string;
}

interface SyncRecord {
  timestamp: number;
  variance: number;
  after: number;
  batch?: string;
}

interface SyncState {
  syncing: boolean;
  showSuccess: boolean;
  variance: number;
  timestamp: number;
  history: SyncRecord[];
  showHistory: boolean;
}

interface AlternativesState {
  loading: boolean;
  data: AlternativesResponse | null;
  expanded: boolean;
  modalOpen: boolean;
}

interface AlternativeItem {
  id: string;
  name: string;
  price: number;
  original_price?: number;
  supplier_name: string;
  supplier_logo?: string;
  channelCount: number;
  activeChannelCount: number;
  mainChannelCount: number;
  backupChannelCount: number;
  hasFallback: boolean;
  successRate: number;
  priceDiff: number;
  priceDiffLabel: string;
  stock: number;
  stock_status: 'sufficient' | 'warning' | 'none';
}

interface AlternativesResponse {
  currentSupplier: string;
  alternatives: AlternativeItem[];
  totalAlternatives: number;
  hasMultiSupplier: boolean;
  minPrice: number;
  maxPrice: number;
  currentPrice: number;
}

interface PriceEstimateState {
  loading: boolean;
  finalPrice: number;
  originalPrice: number;
  discount: number;
  breakdown: PromoBreakdownItem[];
  commissionEarned: number;
}

interface PromoBreakdownItem {
  type: 'full_reduction' | 'percentage' | 'new_user' | 'cashback' | 'coupon' | 'base';
  name: string;
  description: string;
  amount: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  face_value: number;
  stock: number;
  stock_warning: number;
  image: string;
  is_hot: number;
  supplier_id: string;
  supplier_name: string;
  commission_rate: number;
  channels: RechargeChannel[];
  channelCount: number;
  activeChannelCount: number;
  hasFallback: boolean;
  lastSync: number;
  sync_batch?: string | null;
  region_limited?: number;
  available_regions?: string[];
  applicablePromotions?: Array<{ id: string; stackable?: boolean }>;
  fallback_switch_time?: number;
  fallback_reason?: string;
  backup_channel_number?: number;
}

type ChannelStatusLevel = 'green' | 'yellow' | 'red';

interface ChannelModalState {
  open: boolean;
  productId: string | null;
}

interface PromoDetailModalState {
  open: boolean;
  productId: string | null;
  loading: boolean;
  breakdown: PromoBreakdownItem[];
  finalTotal: number;
  originalTotal: number;
}

interface CommissionDetailModalState {
  open: boolean;
  productId: string | null;
}

interface PhoneValidationResult {
  valid: boolean;
  isVirtual: boolean;
  operator: '移动' | '联通' | '电信' | '未知';
  message: string;
  level: 'success' | 'warning' | 'error' | 'none';
}

interface RechargeTrialModalState {
  open: boolean;
  productId: string | null;
  phone: string;
  calculating: boolean;
  result: {
    finalPrice: number;
    originalPrice: number;
    discount: number;
    breakdown: PromoBreakdownItem[];
    commissionEarned: number;
  } | null;
}

interface FallbackDetailModalState {
  open: boolean;
  productId: string | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  '话费充值': '📞',
  '流量充值': '📶',
  '视频会员': '📺',
  '音乐会员': '🎵',
  '外卖券': '🍔',
  '电商购物卡': '🛒',
};

const SUPPLIER_EMOJIS = ['🏪', '🏬', '🏢', '🏭', '🏗️', '🌆', '🏙️', '🌃'];

const DEFAULT_CATEGORIES = [
  { id: 'phone', name: '话费充值', icon: '📞' },
  { id: 'data', name: '流量充值', icon: '📶' },
  { id: 'video', name: '视频会员', icon: '📺' },
  { id: 'music', name: '音乐会员', icon: '🎵' },
  { id: 'food', name: '外卖券', icon: '🍔' },
  { id: 'card', name: '电商购物卡', icon: '🛒' },
];

const VIRTUAL_PREFIXES = ['170', '171', '162', '165', '167', '1349'];
const CHINA_MOBILE = ['134', '135', '136', '137', '138', '139', '147', '148', '150', '151', '152', '157', '158', '159', '172', '178', '182', '183', '184', '187', '188', '195', '197', '198'];
const CHINA_UNICOM = ['130', '131', '132', '145', '146', '155', '156', '166', '167', '171', '175', '176', '185', '186', '196'];
const CHINA_TELECOM = ['133', '149', '153', '162', '170', '173', '174', '177', '180', '181', '189', '190', '191', '193', '199'];

const COMMISSION_RATES = { level1: 0.08, level2: 0.04, level3: 0.02 };

function formatSyncTime(timestamp: number): string {
  if (!timestamp) return '-';
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (minutes < 1) return '刚刚同步';
  if (minutes < 60) return `${minutes}分钟前同步`;
  if (hours < 24) return `${hours}小时前同步`;
  const days = Math.floor(hours / 24);
  return `${days}天前同步`;
}

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return '-';
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

function formatDateTime(timestamp: number): string {
  if (!timestamp) return '-';
  const d = new Date(timestamp * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getStockStatus(stock: number, stockWarning: number = 10) {
  if (stock === 0) return { text: '缺货', cls: 'none', level: 'none' };
  if (stock <= stockWarning) return { text: `仅剩${stock}件`, cls: 'less', level: 'warning' };
  return { text: '库存充足', cls: '', level: 'sufficient' };
}

function calcCommission(price: number, rate: number): number {
  return price * rate;
}

function getChannelStatus(channels: RechargeChannel[] = []): { level: ChannelStatusLevel; text: string; activeCount: number; totalCount: number } {
  if (channels.length === 0) {
    return { level: 'red', text: '无通道', activeCount: 0, totalCount: 0 };
  }
  const activeCount = channels.filter(c => c.status === 1).length;
  const totalCount = channels.length;
  if (activeCount === totalCount) {
    return { level: 'green', text: '全部可用', activeCount, totalCount };
  }
  if (activeCount === 0) {
    return { level: 'red', text: '全部故障', activeCount, totalCount };
  }
  return { level: 'yellow', text: `部分降级(${activeCount}/${totalCount})`, activeCount, totalCount };
}

function getChannelStatusLevel(status: number): ChannelStatusLevel {
  if (status === 1) return 'green';
  if (status === 2) return 'yellow';
  return 'red';
}

function getChannelStatusLabel(level: ChannelStatusLevel): string {
  switch (level) {
    case 'green': return '正常';
    case 'yellow': return '降级';
    case 'red': return '故障';
  }
}

function getChannelStatusEmoji(level: ChannelStatusLevel): string {
  switch (level) {
    case 'green': return '🟢';
    case 'yellow': return '🟡';
    case 'red': return '🔴';
  }
}

function getSuccessRateColor(rate: number): string {
  if (rate >= 98) return '#52c41a';
  if (rate >= 95) return '#1890ff';
  return '#fa8c16';
}

function getSuccessRateBg(rate: number): string {
  if (rate >= 98) return 'linear-gradient(90deg, #95de64, #52c41a)';
  if (rate >= 95) return 'linear-gradient(90deg, #69c0ff, #1890ff)';
  return 'linear-gradient(90deg, #ffc069, #fa8c16)';
}

function validatePhone(phone: string): PhoneValidationResult {
  if (!phone) {
    return { valid: false, isVirtual: false, operator: '未知', message: '请输入手机号', level: 'none' };
  }
  if (phone.length !== 11) {
    return { valid: false, isVirtual: false, operator: '未知', message: '手机号必须为11位', level: 'error' };
  }
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return { valid: false, isVirtual: false, operator: '未知', message: '手机号格式错误', level: 'error' };
  }
  const prefix = phone.slice(0, 3);
  const prefix4 = phone.slice(0, 4);
  const isVirtual = VIRTUAL_PREFIXES.some(p => phone.startsWith(p)) || prefix === '170' || prefix === '171';
  let operator: '移动' | '联通' | '电信' | '未知' = '未知';
  if (CHINA_MOBILE.includes(prefix) || CHINA_MOBILE.includes(prefix4)) operator = '移动';
  else if (CHINA_UNICOM.includes(prefix)) operator = '联通';
  else if (CHINA_TELECOM.includes(prefix)) operator = '电信';
  if (isVirtual) {
    return { valid: true, isVirtual: true, operator, message: `检测到虚拟号段(${prefix})，充值成功率可能较低`, level: 'warning' };
  }
  return { valid: true, isVirtual: false, operator, message: `${operator}手机号`, level: 'success' };
}

function getOperatorEmoji(op: string): string {
  switch (op) {
    case '移动': return '📱';
    case '联通': return '🔷';
    case '电信': return '🔶';
    default: return '📞';
  }
}

function getPromoTypeInfo(type: string): { icon: string; color: string; label: string } {
  switch (type) {
    case 'full_reduction': return { icon: '💰', color: '#ff4d4f', label: '满减' };
    case 'percentage': return { icon: '📉', color: '#eb2f96', label: '折扣' };
    case 'new_user': return { icon: '🎁', color: '#722ed1', label: '新人' };
    case 'cashback': return { icon: '💸', color: '#fa8c16', label: '返佣' };
    case 'coupon': return { icon: '🎫', color: '#1890ff', label: '优惠券' };
    case 'base': return { icon: '🏷️', color: '#8c8c8c', label: '原价' };
    default: return { icon: '🎯', color: '#667eea', label: '优惠' };
  }
}

function extractSupplierEmoji(name: string, idx: number = 0): string {
  return SUPPLIER_EMOJIS[(name.length + idx) % SUPPLIER_EMOJIS.length];
}

export default function Home() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useUser();
  const [categories, setCategories] = useState<any[]>([]);
  const [hotProducts, setHotProducts] = useState<Product[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<any>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [categoryPage, setCategoryPage] = useState(1);
  const [hasMoreCategoryProducts, setHasMoreCategoryProducts] = useState(false);
  const [categoryTotal, setCategoryTotal] = useState(0);

  const [syncStates, setSyncStates] = useState<Record<string, SyncState>>({});
  const [alternativesStates, setAlternativesStates] = useState<Record<string, AlternativesState>>({});
  const [priceEstimates, setPriceEstimates] = useState<Record<string, PriceEstimateState>>({});
  const [altBadgeCounts, setAltBadgeCounts] = useState<Record<string, number>>({});

  const [channelModal, setChannelModal] = useState<ChannelModalState>({ open: false, productId: null });
  const [promoDetailModal, setPromoDetailModal] = useState<PromoDetailModalState>({
    open: false, productId: null, loading: false, breakdown: [], finalTotal: 0, originalTotal: 0
  });
  const [commissionDetailModal, setCommissionDetailModal] = useState<CommissionDetailModalState>({ open: false, productId: null });
  const [rechargeTrialModal, setRechargeTrialModal] = useState<RechargeTrialModalState>({
    open: false, productId: null, phone: '', calculating: false, result: null
  });
  const [fallbackDetailModal, setFallbackDetailModal] = useState<FallbackDetailModalState>({ open: false, productId: null });

  const allProducts = useMemo(() => [...hotProducts, ...categoryProducts], [hotProducts, categoryProducts]);

  const filteredProducts = useMemo(() => {
    const list = activeCategory ? categoryProducts : hotProducts;
    const kw = searchKeyword.trim().toLowerCase();
    if (!kw) return list;
    return list.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(kw);
      const supplierMatch = p.supplier_name?.toLowerCase().includes(kw);
      return nameMatch || supplierMatch;
    });
  }, [activeCategory, categoryProducts, hotProducts, searchKeyword]);

  const categoryStats = useMemo(() => {
    if (!activeCategory || filteredProducts.length === 0) return null;
    const prices = filteredProducts.map(p => p.price);
    const minPrice = Math.min(...prices);
    return {
      total: categoryTotal || filteredProducts.length,
      minPrice: minPrice.toFixed(2)
    };
  }, [activeCategory, filteredProducts, categoryTotal]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    hotProducts.forEach(p => {
      loadPriceEstimate(p.id, p.price);
    });
  }, [hotProducts]);

  useEffect(() => {
    categoryProducts.forEach(p => {
      loadPriceEstimate(p.id, p.price);
    });
  }, [categoryProducts]);

  const loadData = async () => {
    try {
      const [catRes, hotRes, promoRes] = await Promise.all([
        productApi.getCategories(),
        productApi.getHotProducts(),
        productApi.getPromotions()
      ]);
      if (catRes.success) {
        const cats = catRes.data || [];
        function mergeCategory(def: any) {
          const found = cats.find(function(c: any) {
            return c.name === def.name || c.id === def.id;
          });
          const base = { ...def, product_count: 0 };
          if (!found) return base;
          return Object.assign({}, base, found, { product_count: found.product_count || 0 });
        }
        const mergedCats = DEFAULT_CATEGORIES.map(mergeCategory);
        setCategories(mergedCats);
      } else {
        const fallbackCats = DEFAULT_CATEGORIES.map(function(c) {
          return Object.assign({}, c, { product_count: 0 });
        });
        setCategories(fallbackCats);
      }
      if (hotRes.success) {
        const products: Product[] = hotRes.data || [];
        setHotProducts(products);
        const badgeMap: Record<string, number> = {};
        const syncMap: Record<string, SyncState> = {};
        products.forEach(p => {
          badgeMap[p.id] = 0;
          syncMap[p.id] = {
            syncing: false,
            showSuccess: false,
            variance: 0,
            timestamp: 0,
            history: [],
            showHistory: false
          };
        });
        setAltBadgeCounts(badgeMap);
        setSyncStates(prev => {
          return { ...syncMap, ...prev };
        });
      }
      if (promoRes.success) setPromotions(promoRes.data || []);
    } catch (e: any) {
      toast.show(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryProducts = async (category: any, page: number = 1) => {
    setCategoryLoading(true);
    try {
      const res = await productApi.getProducts({ categoryId: category.id, page, pageSize: 50 });
      if (res.success) {
        const products: Product[] = res.data.list || [];
        const total: number = res.data.total || products.length;
        if (page === 1) {
          setCategoryProducts(products);
        } else {
          setCategoryProducts(prev => {
            return [...prev, ...products];
          });
        }
        setCategoryTotal(total);
        setHasMoreCategoryProducts(page * 50 < total);
        setCategoryPage(page);
        const badgeMap: Record<string, number> = {};
        const syncMap: Record<string, SyncState> = {};
        products.forEach(p => {
          if (!altBadgeCounts[p.id]) badgeMap[p.id] = 0;
          if (!syncStates[p.id]) {
            syncMap[p.id] = {
              syncing: false,
              showSuccess: false,
              variance: 0,
              timestamp: 0,
              history: [],
              showHistory: false
            };
          }
        });
        if (Object.keys(badgeMap).length > 0) {
          setAltBadgeCounts(prev => {
            return { ...prev, ...badgeMap };
          });
        }
        if (Object.keys(syncMap).length > 0) {
          setSyncStates(prev => {
            return { ...prev, ...syncMap };
          });
        }
      }
    } catch (e: any) {
      toast.show(e.message || '加载失败', 'error');
    } finally {
      setCategoryLoading(false);
    }
  };

  const loadMoreCategoryProducts = () => {
    if (categoryLoading || !hasMoreCategoryProducts || !activeCategory) return;
    loadCategoryProducts(activeCategory, categoryPage + 1);
  };

  const handleCategoryClick = (category: any) => {
    setActiveCategory(category);
    setSearchKeyword('');
    setCategoryProducts([]);
    setCategoryTotal(0);
    setCategoryPage(1);
    setHasMoreCategoryProducts(false);
    loadCategoryProducts(category, 1);
  };

  const handleBackToHot = () => {
    setActiveCategory(null);
    setCategoryProducts([]);
    setSearchKeyword('');
    setCategoryTotal(0);
    setHasMoreCategoryProducts(false);
  };

  const loadPriceEstimate = async (productId: string, unitPrice: number) => {
    if (priceEstimates[productId]) return;
    setPriceEstimates(prev => {
      return {
        ...prev,
        [productId]: {
          loading: true,
          finalPrice: unitPrice,
          originalPrice: unitPrice,
          discount: 0,
          breakdown: [],
          commissionEarned: 0
        }
      };
    });
    try {
      const res = await productApi.calculatePrice({ productId, quantity: 1 });
      if (res.success) {
        const { finalTotal, originalTotal, breakdown, commissionEarned } = res.data;
        const discount = Math.max(0, (originalTotal || unitPrice) - (finalTotal || unitPrice));
        setPriceEstimates(prev => {
          return {
            ...prev,
            [productId]: {
              loading: false,
              finalPrice: finalTotal || unitPrice,
              originalPrice: originalTotal || unitPrice,
              discount,
              breakdown: breakdown || [],
              commissionEarned: commissionEarned || 0
            }
          };
        });
      } else {
        setPriceEstimates(prev => {
          return {
            ...prev,
            [productId]: {
              loading: false,
              finalPrice: unitPrice,
              originalPrice: unitPrice,
              discount: 0,
              breakdown: [],
              commissionEarned: 0
            }
          };
        });
      }
    } catch {
      setPriceEstimates(prev => {
        return {
          ...prev,
          [productId]: {
            loading: false,
            finalPrice: unitPrice,
            originalPrice: unitPrice,
            discount: 0,
            breakdown: [],
            commissionEarned: 0
          }
        };
      });
    }
  };

  const handleSyncStock = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = syncStates[productId] || { syncing: false, showSuccess: false, variance: 0, timestamp: 0, history: [], showHistory: false };
    if (current.syncing) return;

    setSyncStates(prev => {
      return {
        ...prev,
        [productId]: { ...current, syncing: true, showSuccess: false, variance: 0, timestamp: 0 }
      };
    });

    try {
      const res = await productApi.syncStock(productId);
      if (res.success) {
        const { syncResult } = res.data;
        const newRecord: SyncRecord = {
          timestamp: syncResult.timestamp,
          variance: syncResult.variance,
          after: syncResult.after,
          batch: syncResult.batch
        };
        const newHistory = [newRecord, ...(current.history || [])].slice(0, 3);
        setSyncStates(prev => {
          return {
            ...prev,
            [productId]: {
              ...current,
              syncing: false,
              showSuccess: true,
              variance: syncResult.variance,
              timestamp: syncResult.timestamp,
              history: newHistory
            }
          };
        });
        const updateProductList = (list: Product[]) => list.map(p => {
          if (p.id === productId) {
            return { ...p, ...res.data, lastSync: syncResult.timestamp, stock: syncResult.after, sync_batch: syncResult.batch };
          } else {
            return p;
          }
        });
        setHotProducts(prev => updateProductList(prev));
        setCategoryProducts(prev => updateProductList(prev));
        toast.show('同步成功', 'success');
        setTimeout(() => {
          setSyncStates(prev => {
            const s = prev[productId];
            if (!s) return prev;
            return { ...prev, [productId]: { ...s, syncing: false, showSuccess: false, variance: 0, timestamp: 0 } };
          });
        }, 3500);
      }
    } catch (e: any) {
      toast.show(e.message || '同步失败', 'error');
      setSyncStates(prev => {
        return {
          ...prev,
          [productId]: { ...current, syncing: false, showSuccess: false, variance: 0, timestamp: 0 }
        };
      });
    }
  };

  const toggleSyncHistory = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSyncStates(function(prev) {
      const s = prev[productId];
      if (!s) return prev;
      const updated = Object.assign({}, prev);
      updated[productId] = Object.assign({}, s, { showHistory: !s.showHistory });
      return updated;
    });
  };

  const handleOpenAlternativesModal = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const state = alternativesStates[productId];
    if (state && state.modalOpen) {
      setAlternativesStates(function(prev) {
        const updated = Object.assign({}, prev);
        updated[productId] = Object.assign({}, state, { modalOpen: false });
        return updated;
      });
      return;
    }
    setAlternativesStates(function(prev) {
      const updated = Object.assign({}, prev);
      const existingData = state && state.data ? state.data : null;
      updated[productId] = { loading: false, data: existingData, expanded: false, modalOpen: true };
      return updated;
    });
    if (!state || !state.data) {
      await handleLoadAlternatives(productId, e);
    }
  };

  const handleLoadAlternatives = async (productId: string, _e?: React.MouseEvent) => {
    const state = alternativesStates[productId];
    if (state && state.loading) return;

    setAlternativesStates(function(prev) {
      const updated = Object.assign({}, prev);
      const existingData = state && state.data ? state.data : null;
      const existingModalOpen = state && state.modalOpen ? state.modalOpen : true;
      updated[productId] = { loading: true, data: existingData, expanded: false, modalOpen: existingModalOpen };
      return updated;
    });
    try {
      const res = await productApi.getAlternatives(productId);
      if (res.success) {
        setAlternativesStates(function(prev) {
          const updated = Object.assign({}, prev);
          updated[productId] = { loading: false, data: res.data, expanded: false, modalOpen: true };
          return updated;
        });
        setAltBadgeCounts(function(prev) {
          const updated = Object.assign({}, prev);
          updated[productId] = res.data.totalAlternatives ? res.data.totalAlternatives : 0;
          return updated;
        });
      }
    } catch (e: any) {
      toast.show(e.message || '加载失败', 'error');
      setAlternativesStates(function(prev) {
        const updated = Object.assign({}, prev);
        updated[productId] = { loading: false, data: null, expanded: false, modalOpen: true };
        return updated;
      });
    }
  };

  const handleSwitchAlternative = (productAltId: string, supplierId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/product/${productAltId}?supplierId=${supplierId}`);
  };

  const handleOpenChannelModal = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChannelModal({ open: true, productId });
  };

  const handleCloseChannelModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setChannelModal({ open: false, productId: null });
  };

  const handleOpenPromoDetail = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPromoDetailModal({
      open: true,
      productId,
      loading: true,
      breakdown: [],
      finalTotal: 0,
      originalTotal: 0
    });
    const product = [...hotProducts, ...categoryProducts].find(p => p.id === productId);
    try {
      const res = await productApi.calculatePrice({ productId, quantity: 1 });
      if (res.success) {
        const { finalTotal, originalTotal, breakdown } = res.data;
        setPromoDetailModal({
          open: true,
          productId,
          loading: false,
          breakdown: breakdown || generateMockBreakdown(product?.price || 0, originalTotal || product?.price || 0),
          finalTotal: finalTotal || product?.price || 0,
          originalTotal: originalTotal || product?.price || 0
        });
      } else {
        setPromoDetailModal(prev => {
          return {
            ...prev,
            loading: false,
            breakdown: generateMockBreakdown(product?.price || 0, product?.price || 0),
            finalTotal: product?.price || 0,
            originalTotal: product?.price || 0
          };
        });
      }
    } catch {
      setPromoDetailModal(prev => {
        return {
          ...prev,
          loading: false,
          breakdown: generateMockBreakdown(product?.price || 0, product?.price || 0),
          finalTotal: product?.price || 0,
          originalTotal: product?.price || 0
        };
      });
    }
  };

  const generateMockBreakdown = (originalPrice: number, targetFinal: number): PromoBreakdownItem[] => {
    const items: PromoBreakdownItem[] = [];
    let current = originalPrice;
    if (promotions.length > 0) {
      const p1 = promotions[0];
      const p1Type = p1.type || 'full_reduction';
      const p1Info = getPromoTypeInfo(p1Type);
      const p1Amount = Math.min(current * 0.05, 5);
      if (p1Amount > 0.1) {
        items.push({ type: p1Type as any, name: p1.name || p1Info.label + '优惠', description: getPromoDescription(p1Type, p1Amount), amount: Number(p1Amount.toFixed(2)) });
        current -= p1Amount;
      }
    }
    if (originalPrice > 50) {
      items.push({ type: 'percentage', name: '限时95折', description: '本周特惠，全场虚拟商品享95折', amount: Number((current * 0.05).toFixed(2)) });
      current = current * 0.95;
    }
    if (!user) {
      const newUserAmount = Math.min(10, current * 0.1);
      if (newUserAmount > 0.5) {
        items.push({ type: 'new_user', name: '新人首单立减', description: '新用户首次下单立减优惠', amount: Number(newUserAmount.toFixed(2)) });
      }
    }
    return items;
  };

  const getPromoDescription = (type: string, amount: number): string => {
    switch (type) {
      case 'full_reduction': return `满额立减 ¥${amount.toFixed(2)}`;
      case 'percentage': return `${(100 - amount * 10).toFixed(0)}% 折扣优惠`;
      case 'cashback': return `确认收货后返佣 ¥${amount.toFixed(2)}`;
      case 'coupon': return `使用优惠券抵扣 ¥${amount.toFixed(2)}`;
      default: return `优惠金额 ¥${amount.toFixed(2)}`;
    }
  };

  const handleClosePromoDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPromoDetailModal({ open: false, productId: null, loading: false, breakdown: [], finalTotal: 0, originalTotal: 0 });
  };

  const handleOpenCommissionDetail = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCommissionDetailModal({ open: true, productId });
  };

  const handleCloseCommissionDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCommissionDetailModal({ open: false, productId: null });
  };

  const handleOpenRechargeTrial = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRechargeTrialModal({
      open: true,
      productId,
      phone: '',
      calculating: false,
      result: null
    });
  };

  const handleCloseRechargeTrial = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRechargeTrialModal({
      open: false,
      productId: null,
      phone: '',
      calculating: false,
      result: null
    });
  };

  const handleTrialCalculate = async () => {
    const product = getCurrentProduct(rechargeTrialModal.productId || '');
    const phoneValidation = validatePhone(rechargeTrialModal.phone);
    if (!product || !phoneValidation.valid) return;

    setRechargeTrialModal(prev => {
      return { ...prev, calculating: true, result: null };
    });
    try {
      const res = await productApi.calculatePrice({
        productId: product.id,
        quantity: 1,
        account: rechargeTrialModal.phone
      });
      if (res.success) {
        const { finalTotal, originalTotal, breakdown, commissionEarned } = res.data;
        const discount = Math.max(0, (originalTotal || product.price) - (finalTotal || product.price));
        setRechargeTrialModal(prev => {
          return {
            ...prev,
            calculating: false,
            result: {
              finalPrice: finalTotal || product.price,
              originalPrice: originalTotal || product.price,
              discount,
              breakdown: breakdown || generateMockBreakdown(product.price, finalTotal || product.price),
              commissionEarned: commissionEarned || calcCommission(finalTotal || product.price, product.commission_rate || COMMISSION_RATES.level1)
            }
          };
        });
      } else {
        setRechargeTrialModal(prev => {
          return { ...prev, calculating: false };
        });
        toast.show(res.message || '计算失败', 'error');
      }
    } catch {
      setRechargeTrialModal(prev => {
        return { ...prev, calculating: false };
      });
      toast.show('计算失败', 'error');
    }
  };

  const handleOpenFallbackDetail = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFallbackDetailModal({ open: true, productId });
  };

  const handleCloseFallbackDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFallbackDetailModal({ open: false, productId: null });
  };

  const getChannelDotColor = (level: ChannelStatusLevel) => {
    switch (level) {
      case 'green': return '#52c41a';
      case 'yellow': return '#faad14';
      case 'red': return '#ff4d4f';
    }
  };

  const getCurrentProduct = (productId: string): Product | undefined => {
    return allProducts.find(p => p.id === productId);
  };

  const getSupplierPriceRange = (p: Product): { minPrice: number; maxPrice: number } | null => {
    const altState = alternativesStates[p.id];
    if (altState?.data) {
      return { minPrice: altState.data.minPrice, maxPrice: altState.data.maxPrice };
    }
    const basePrice = p.price;
    const count = altBadgeCounts[p.id] || 0;
    if (count > 0) {
      return {
        minPrice: Number((basePrice * 0.95).toFixed(2)),
        maxPrice: Number((basePrice * 1.05).toFixed(2))
      };
    }
    return null;
  };

  const isFallbackActive = (p: Product): boolean => {
    return p.hasFallback && p.activeChannelCount < p.channelCount;
  };

  const renderProductCard = (p: Product) => {
    const stock = getStockStatus(p.stock, p.stock_warning);
    const channelStatus = getChannelStatus(p.channels);
    const channelCount = p.channelCount || p.channels?.length || 0;
    const activeChannelCount = p.activeChannelCount ?? channelStatus.activeCount;
    const abnormalCount = Math.max(0, channelCount - activeChannelCount);
    const commission = calcCommission(p.price, p.commission_rate || 0);
    const hasStackablePromo = p.applicablePromotions?.some((pr) => pr.stackable) ?? promotions.some(pr => pr.rules?.stackable);
    const syncState = syncStates[p.id] || { syncing: false, showSuccess: false, variance: 0, timestamp: 0, history: [], showHistory: false };
    const altState = alternativesStates[p.id] || { loading: false, data: null, expanded: false, modalOpen: false };
    const altBadgeCount = altBadgeCounts[p.id] || 0;
    const priceEst = priceEstimates[p.id] || { loading: false, finalPrice: p.price, originalPrice: p.price, discount: 0, breakdown: [], commissionEarned: 0 };
    const isRegionLimited = p.region_limited === 1;
    const supplierCount = altBadgeCount + 1;
    const fallbackCount = p.hasFallback ? Math.max(1, Math.floor(channelCount * 0.3)) : 0;
    const isNationwide = !isRegionLimited && (!p.available_regions || p.available_regions.length === 0);
    const priceRange = getSupplierPriceRange(p);
    const fallbackActive = isFallbackActive(p);
    const cardBg = fallbackActive ? 'linear-gradient(135deg, #fffbe6 0%, #fff7e6 100%)' : 'white';
    const cardBorder = fallbackActive ? '1px solid #ffe58f' : undefined;

    return (
      <div
        key={p.id}
        className="product-card"
        onClick={() => navigate(`/product/${p.id}`)}
        style={{ background: cardBg, border: cardBorder, position: 'relative' }}
      >
        {fallbackActive && (
          <div
            onClick={(e) => handleOpenFallbackDetail(p.id, e)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              padding: '6px 14px',
              background: 'linear-gradient(90deg, #faad14, #fa8c16)',
              color: 'white',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: '16px 16px 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            🛟 已切到备用通道{p.backup_channel_number || Math.max(1, Math.floor(channelCount * 0.5))}号 · 延迟约2分钟
            {p.fallback_switch_time && (
              <span style={{ marginLeft: 'auto', opacity: 0.9, fontWeight: 400 }}>
                {formatRelativeTime(p.fallback_switch_time)}切换
              </span>
            )}
          </div>
        )}

        <div className="thumb" style={{ position: 'relative', marginTop: fallbackActive ? 20 : 0 }}>
          {p.image || p.name.slice(0, 6)}

          <div style={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            zIndex: 5
          }}>
            <span
              style={{
                padding: '3px 8px',
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 600,
                background: isNationwide ? 'linear-gradient(135deg, #52c41a, #389e0d)' : 'linear-gradient(135deg, #faad14, #d48806)',
                color: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              title={isNationwide ? '全国可用' : `部分地区可用：${p.available_regions?.join('、') || '详见详情'}`}
            >
              {isNationwide ? '🌍 全国可用' : '📍 部分地区'}
            </span>
          </div>

          <div style={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            alignItems: 'flex-end',
            zIndex: 5
          }}>
            {abnormalCount > 0 && (
              <button
                onClick={(e) => handleOpenChannelModal(p.id, e)}
                title={`${abnormalCount}个通道异常，点击查看详情`}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #faad14, #fa8c16)',
                  color: 'white',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(250, 140, 22, 0.4)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                ⚠️
                <span style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  minWidth: 14,
                  height: 14,
                  padding: '0 3px',
                  borderRadius: 7,
                  background: '#ff4d4f',
                  color: 'white',
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid white',
                  lineHeight: 1
                }}>
                  {abnormalCount > 9 ? '9+' : abnormalCount}
                </span>
              </button>
            )}

            <div style={{ position: 'relative', display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                onClick={(e) => handleSyncStock(p.id, e)}
                disabled={syncState.syncing}
                title="同步库存"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: syncState.syncing ? '#e8e8e8' : 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s',
                  border: 'none',
                  cursor: syncState.syncing ? 'not-allowed' : 'pointer',
                  animation: syncState.syncing ? 'spin 1s linear infinite' : 'none'
                }}
              >
                🔄
              </button>
              {syncState.history.length > 0 && (
                <button
                  onClick={(e) => toggleSyncHistory(p.id, e)}
                  title={`最近${syncState.history.length}次同步记录`}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: syncState.showHistory ? '#ffd666' : '#f5f5f5',
                    color: syncState.showHistory ? '#d48806' : '#8c8c8c',
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  ⏰
                  <span style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    minWidth: 12,
                    height: 12,
                    padding: '0 2px',
                    borderRadius: 6,
                    background: '#667eea',
                    color: 'white',
                    fontSize: 8,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid white',
                    lineHeight: 1
                  }}>
                    {syncState.history.length}
                  </span>
                </button>
              )}
            </div>
          </div>

          {syncState.showSuccess && (
            <div style={{
              position: 'absolute', top: 36, right: 8,
              padding: '4px 10px', borderRadius: 8,
              background: syncState.variance >= 0 ? '#52c41a' : '#fa8c16',
              color: 'white',
              fontSize: 10, fontWeight: 600,
              animation: 'fadeInUp 0.3s ease-out',
              whiteSpace: 'nowrap', zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <span>✓ {syncState.variance >= 0 ? `Δ+${syncState.variance}` : `Δ${syncState.variance}`}</span>
              <span style={{ fontSize: 9, opacity: 0.9, fontWeight: 400 }}>{formatDateTime(syncState.timestamp)}</span>
            </div>
          )}

          {syncState.showHistory && syncState.history.length > 0 && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute', top: 36, right: 40,
                padding: 10,
                borderRadius: 10,
                background: 'white',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                border: '1px solid #f0f0f0',
                zIndex: 20,
                minWidth: 160,
                animation: 'fadeInUp 0.2s ease-out'
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: '#333', marginBottom: 8, borderBottom: '1px solid #f0f0f0', paddingBottom: 6 }}>
                🕐 最近同步记录
              </div>
              {syncState.history.map((record, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 0',
                  fontSize: 10,
                  borderBottom: idx < syncState.history.length - 1 ? '1px dashed #f0f0f0' : 'none'
                }}>
                  <span style={{ color: '#999' }}>{formatDateTime(record.timestamp)}</span>
                  <span style={{
                    color: record.variance >= 0 ? '#52c41a' : '#fa8c16',
                    fontWeight: 600
                  }}>
                    {record.variance >= 0 ? '+' : ''}{record.variance}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="info" style={{ marginTop: fallbackActive ? 20 : 0 }}>
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap', alignItems: 'center' }}>
              {p.is_hot === 1 && <span className="hot-tag">HOT</span>}
              <span className="tag tag-blue">{p.supplier_name || '官方直充'}</span>

              {supplierCount > 1 && (
                <button
                  onClick={(e) => handleOpenAlternativesModal(p.id, e)}
                  className="tag"
                  style={{
                    background: 'linear-gradient(135deg, #f0f5ff, #e6f0ff)',
                    color: '#667eea',
                    border: '1px solid #d6e4ff',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontWeight: 500
                  }}
                  title={`${supplierCount}家供应商在售，点击查看详情`}
                >
                  🏪 {p.supplier_name}等{supplierCount}家
                </button>
              )}

              {channelCount > 0 && (
                <span className="tag tag-purple" style={{ background: '#f9f0ff', color: '#722ed1', border: '1px solid #d3adf7' }}>
                  {channelCount}通道
                </span>
              )}

              {p.hasFallback && (
                <span
                  className="tag"
                  style={{
                    background: fallbackActive ? 'linear-gradient(135deg, #fff7e6, #ffe7ba)' : 'linear-gradient(135deg, #e6fffb, #b5f5ec)',
                    color: fallbackActive ? '#d48806' : '#13c2c2',
                    border: fallbackActive ? '1px solid #ffd591' : '1px solid #87e8de',
                    cursor: fallbackActive ? 'pointer' : 'help',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontWeight: 500
                  }}
                  onClick={fallbackActive ? (e) => handleOpenFallbackDetail(p.id, e) : undefined}
                  title="主通道故障时自动切换至备用通道，预计延迟2分钟"
                >
                  🛡️ 备用{fallbackCount}个
                </span>
              )}

              {hasStackablePromo && <span className="tag tag-orange">可叠加优惠</span>}
            </div>

            {supplierCount > 1 && priceRange && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                background: 'linear-gradient(90deg, #f0f5ff, #f9f0ff)',
                borderRadius: 8,
                marginBottom: 6,
                fontSize: 11
              }}>
                <span style={{ color: '#666', fontWeight: 500 }}>价格区间:</span>
                <span style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  background: '#e8e8e8',
                  position: 'relative',
                  overflow: 'hidden',
                  minWidth: 60
                }}>
                  <span style={{
                    position: 'absolute',
                    left: `${Math.max(0, ((altState.data?.currentPrice || p.price) - priceRange.minPrice) / Math.max(0.01, priceRange.maxPrice - priceRange.minPrice) * 100 - 5)}%`,
                    width: 10,
                    height: '100%',
                    borderRadius: 3,
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    boxShadow: '0 0 0 2px white'
                  }} />
                </span>
                <span style={{ color: '#52c41a', fontWeight: 700 }}>¥{priceRange.minPrice.toFixed(2)}</span>
                <span style={{ color: '#bfbfbf' }}>-</span>
                <span style={{ color: '#ff4d4f', fontWeight: 700 }}>¥{priceRange.maxPrice.toFixed(2)}</span>
              </div>
            )}

            <div className="name">{p.name}</div>
          </div>

          <div className="meta mt-8" style={{ flexWrap: 'wrap', gap: '6px 12px', alignItems: 'center' }}>
            <span className={`stock ${stock.cls}`}>{stock.text}</span>
            <span
              className="text-sm text-gray"
              style={{ cursor: 'pointer', textDecoration: 'underline', userSelect: 'none' }}
              onClick={(e) => handleSyncStock(p.id, e)}
            >
              {formatSyncTime(p.lastSync)}
            </span>
            {p.sync_batch && (
              <span
                className="text-sm"
                style={{
                  color: '#667eea',
                  fontWeight: 500,
                  padding: '1px 6px',
                  background: '#f0f5ff',
                  borderRadius: 4,
                  fontSize: 11
                }}
                title={`库存同步批次号：${p.sync_batch}`}
              >
                批次 {p.sync_batch}
              </span>
            )}
            {fallbackActive && p.fallback_switch_time && (
              <span
                onClick={(e) => handleOpenFallbackDetail(p.id, e)}
                className="text-sm"
                style={{
                  color: '#d48806',
                  fontWeight: 600,
                  padding: '2px 8px',
                  background: '#fff7e6',
                  borderRadius: 10,
                  fontSize: 10,
                  cursor: 'pointer',
                  border: '1px solid #ffd591'
                }}
              >
                🛟 {formatRelativeTime(p.fallback_switch_time)}切至备通道
              </span>
            )}
          </div>

          <div className="bottom mt-8">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="price"><small>¥</small>{p.price}</span>
                {p.face_value && p.face_value > p.price && <span className="original">¥{p.face_value}</span>}
              </div>
              <div style={{
                marginTop: 4,
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap'
              }}>
                {priceEst.loading ? (
                  <span style={{ color: '#bfbfbf' }}>计算优惠中...</span>
                ) : (
                  <>
                    <span style={{ color: '#ff7a45', fontWeight: 600 }}>
                      实付预估 ¥{priceEst.finalPrice.toFixed(2)}
                    </span>
                    {priceEst.discount > 0 && (
                      <span style={{ color: '#52c41a' }}>
                        已优惠 ¥{priceEst.discount.toFixed(2)}
                      </span>
                    )}
                  </>
                )}
              </div>
              {commission > 0 && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="text-sm text-green" style={{ fontWeight: 500 }}>
                      赚 ¥{(priceEst.commissionEarned || commission).toFixed(2)}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate('/commission'); }}
                      className="text-sm"
                      style={{
                        padding: '2px 8px', borderRadius: 10,
                        background: '#f0f4ff', color: '#667eea',
                        fontSize: 11, fontWeight: 500,
                        border: '1px solid #d6e4ff',
                        cursor: 'pointer'
                      }}
                    >
                      📊 关系链
                    </button>
                  </div>
                  <div className="text-sm" style={{ color: '#999', marginTop: 2, fontSize: 10 }}>
                    L1 {(COMMISSION_RATES.level1 * 100).toFixed(0)}% / L2 {(COMMISSION_RATES.level2 * 100).toFixed(0)}% / L3 {(COMMISSION_RATES.level3 * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
            <button className="btn-primary" style={{ padding: '6px 16px', fontSize: 13 }}>
              立即充值
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px dashed #f0f0f0'
          }}>
            <button
              onClick={(e) => handleOpenPromoDetail(p.id, e)}
              style={{
                padding: '8px 4px',
                borderRadius: 8,
                background: '#fff7e6',
                border: '1px solid #ffd591',
                fontSize: 12,
                color: '#d46b08',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#ffe7ba';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#fff7e6';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: 16 }}>💰</span>
              <span style={{ fontWeight: 500 }}>优惠明细</span>
              {priceEst.discount > 0 && (
                <span style={{ fontSize: 9, color: '#52c41a', fontWeight: 600 }}>-¥{priceEst.discount.toFixed(2)}</span>
              )}
            </button>

            <button
              onClick={(e) => handleOpenCommissionDetail(p.id, e)}
              style={{
                padding: '8px 4px',
                borderRadius: 8,
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                fontSize: 12,
                color: '#389e0d',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#d9f7be';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#f6ffed';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: 16 }}>📊</span>
              <span style={{ fontWeight: 500 }}>佣金明细</span>
              <span style={{ fontSize: 9, color: '#389e0d', fontWeight: 600 }}>
                三级+¥{((priceEst.commissionEarned || commission) / COMMISSION_RATES.level1 * (COMMISSION_RATES.level1 + COMMISSION_RATES.level2 + COMMISSION_RATES.level3) - (priceEst.commissionEarned || commission)).toFixed(2)}
              </span>
            </button>

            <button
              onClick={(e) => handleOpenRechargeTrial(p.id, e)}
              style={{
                padding: '8px 4px',
                borderRadius: 8,
                background: '#e6f7ff',
                border: '1px solid #91d5ff',
                fontSize: 12,
                color: '#096dd9',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#bae7ff';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#e6f7ff';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: 16 }}>📞</span>
              <span style={{ fontWeight: 500 }}>充值试算</span>
              <span style={{ fontSize: 9, color: '#096dd9', fontWeight: 500 }}>输入号码</span>
            </button>
          </div>
        </div>

        {altState.modalOpen && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setAlternativesStates(prev => ({ ...prev, [p.id]: { ...altState, modalOpen: false } }));
            }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: 20,
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 440, maxHeight: '80vh',
                background: 'white', borderRadius: 14,
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                animation: 'slideUp 0.25s ease-out',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
              }}
            >
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  🔗 备选供应商 <span style={{ color: '#999', fontWeight: 400, fontSize: 13 }}>({altBadgeCount}家可切换)</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAlternativesStates(prev => ({ ...prev, [p.id]: { ...altState, modalOpen: false } }));
                  }}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: 'none', background: '#f5f5f5',
                    fontSize: 16, color: '#666', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{
                padding: '12px 20px',
                background: altState.data ? 'linear-gradient(90deg, #f0f5ff 0%, #f9f0ff 100%)' : '#fafafa',
                borderBottom: '1px solid #f0f0f0',
                fontSize: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    当前主供：<span style={{ color: '#333', fontWeight: 600 }}>{p.supplier_name}</span>
                  </div>
                  {altState.data && (
                    <>
                      <span style={{ color: '#bfbfbf' }}>|</span>
                      <div>
                        主供价：<span style={{ color: '#667eea', fontWeight: 600 }}>¥{altState.data.currentPrice.toFixed(2)}</span>
                      </div>
                      <span style={{ color: '#bfbfbf' }}>|</span>
                      <div>
                        最低：<span style={{ color: '#52c41a', fontWeight: 600 }}>¥{altState.data.minPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        最高：<span style={{ color: '#ff4d4f', fontWeight: 600 }}>¥{altState.data.maxPrice.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div style={{ padding: 12, overflowY: 'auto', flex: 1 }}>
                {altState.loading ? (
                  <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>加载中...</div>
                ) : altState.data?.alternatives?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {altState.data.alternatives.map((alt: AlternativeItem, idx: number) => {
                      const priceDiffColor = alt.priceDiffLabel.includes('省')
                        ? '#52c41a'
                        : alt.priceDiffLabel.includes('贵')
                          ? '#ff4d4f'
                          : '#999';
                      const stockStatus = getStockStatus(alt.stock, 10);
                      const mainChanCount = alt.mainChannelCount || Math.ceil(alt.channelCount * 0.7);
                      const backupChanCount = alt.backupChannelCount || (alt.channelCount - mainChanCount);
                      return (
                        <div
                          key={alt.id || idx}
                          style={{
                            padding: 14, borderRadius: 12,
                            background: 'white',
                            border: '1px solid #f0f0f0',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#667eea'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(102,126,234,0.1)'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f0'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                        >
                          <div style={{
                            display: 'flex', alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 12
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 22 }}>{alt.supplier_logo || extractSupplierEmoji(alt.supplier_name, idx)}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    fontSize: 14, fontWeight: 600, color: '#333',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                  }}>
                                    {alt.supplier_name}
                                  </div>
                                  <div style={{
                                    fontSize: 11, color: '#999',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                  }}>
                                    {alt.name}
                                  </div>
                                </div>
                              </div>

                              <div style={{
                                display: 'flex', alignItems: 'baseline', gap: 8,
                                marginBottom: 8
                              }}>
                                {alt.original_price && alt.original_price > alt.price && (
                                  <span style={{
                                    fontSize: 11,
                                    color: '#bfbfbf',
                                    textDecoration: 'line-through'
                                  }}>
                                    ¥{alt.original_price.toFixed(2)}
                                  </span>
                                )}
                                <span style={{ fontSize: 18, fontWeight: 700, color: '#ff4d4f' }}>
                                  ¥{alt.price.toFixed(2)}
                                </span>
                                <span style={{ fontSize: 11, color: priceDiffColor, fontWeight: 600 }}>
                                  {alt.priceDiffLabel}
                                </span>
                              </div>

                              <div style={{ marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                  <span style={{ fontSize: 10, color: '#999' }}>成功率</span>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: getSuccessRateColor(alt.successRate * 100) }}>
                                    {(alt.successRate * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div style={{
                                  height: 6, borderRadius: 3, background: '#f0f0f0', overflow: 'hidden'
                                }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${Math.min(100, alt.successRate * 100)}%`,
                                    background: getSuccessRateBg(alt.successRate * 100),
                                    borderRadius: 3,
                                    transition: 'width 0.5s'
                                  }} />
                                </div>
                              </div>

                              <div style={{
                                display: 'flex', flexWrap: 'wrap', gap: '4px 10px',
                                alignItems: 'center'
                              }}>
                                <span style={{
                                  fontSize: 10, color: '#666',
                                  display: 'inline-flex', alignItems: 'center', gap: 3,
                                  padding: '2px 6px',
                                  background: '#f5f5f5',
                                  borderRadius: 6
                                }}>
                                  主{mainChanCount} + 备{backupChanCount}通道
                                </span>
                                <span className={`stock ${stockStatus.cls}`} style={{ fontSize: 10 }}>
                                  {alt.stock}件 · {stockStatus.text}
                                </span>
                                {alt.hasFallback && (
                                  <span style={{
                                    fontSize: 10, color: '#13c2c2',
                                    padding: '2px 6px',
                                    background: '#e6fffb',
                                    borderRadius: 6
                                  }} title="支持自动降级">
                                    🛡️ 支持降级
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleSwitchAlternative(alt.id, p.supplier_id, e)}
                              className="btn-primary"
                              style={{
                                padding: '8px 14px', fontSize: 12,
                                flexShrink: 0, alignSelf: 'center'
                              }}
                            >
                              切换下单
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 32, color: '#999', fontSize: 13 }}>
                    暂无备选供应商
                  </div>
                )}
              </div>

              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid #f0f0f0',
                fontSize: 11, color: '#999', textAlign: 'center'
              }}>
                切换后将跳转至该商品详情页，自动带上 supplierId 参数
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const currentProduct = channelModal.productId ? getCurrentProduct(channelModal.productId) : null;
  const fallbackProduct = fallbackDetailModal.productId ? getCurrentProduct(fallbackDetailModal.productId) : null;

  return (
    <div>
      <Header
        title="虚拟商品中心"
        showBack={false}
        right={<Link to="/admin-portal" className="admin-entry">管理后台</Link>}
      />

      <div className="search-box">
        <span style={{ fontSize: 16 }}>🔍</span>
        <input
          type="text"
          placeholder="搜索商品名、供应商名称..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            fontSize: 14,
            background: 'transparent'
          }}
        />
        {searchKeyword && (
          <button
            onClick={() => setSearchKeyword('')}
            style={{
              fontSize: 14,
              color: '#bfbfbf',
              background: 'none',
              padding: '0 4px'
            }}
          >
            ✕
          </button>
        )}
      </div>

      <div className="banner">
        <h2>🎉 新用户首单立减20元</h2>
        <p>200+商品极速充值 · 安全保障 · 佣金实时到账</p>
      </div>

      {promotions.length > 0 && (
        <div style={{ margin: '0 16px 12px', display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {promotions.map(p => (
            <div key={p.id} style={{
              flexShrink: 0, padding: '6px 12px', borderRadius: 10,
              background: getPromoTypeInfo(p.type).color && p.type ? '' : 'linear-gradient(135deg, #f093fb, #f5576c)',
              backgroundColor: ['full_reduction'].includes(p.type) ? '#fff1f0' : undefined,
              border: ['full_reduction'].includes(p.type) ? '1px solid #ffa39e' : undefined,
              fontSize: 12, color: ['full_reduction'].includes(p.type) ? '#cf1322' : '#333', fontWeight: 600, whiteSpace: 'nowrap'
            }}>
              {getPromoTypeInfo(p.type).icon} {p.name} {p.rules?.stackable ? '·可叠加' : ''}
            </div>
          ))}
        </div>
      )}

      <div className="category-grid">
        {categories.slice(0, 6).map(cat => (
          <div
            key={cat.id}
            onClick={() => handleCategoryClick(cat)}
            className={`category-item ${activeCategory?.id === cat.id ? 'active' : ''}`}
            style={{ cursor: 'pointer' }}
          >
            <div className="icon">{cat.icon || '📦'}</div>
            <span>{cat.name}</span>
            <span style={{
              fontSize: 10,
              color: activeCategory?.id === cat.id ? '#667eea' : '#999',
              marginTop: 2,
              fontWeight: 500
            }}>
              {cat.product_count || 0}款
            </span>
          </div>
        ))}
      </div>

      <div className="section-title">
        <h3>{activeCategory ? `${activeCategory.icon || CATEGORY_ICONS[activeCategory.name] || '📦'} ${activeCategory.name}` : '🔥 热门推荐'}</h3>
        <span className="more" onClick={() => navigate('/category')}>查看全部 ›</span>
      </div>

      {activeCategory && categoryStats && (
        <div style={{
          margin: '0 20px 12px',
          padding: '10px 14px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #f0f5ff, #f9f0ff)',
          border: '1px solid #d6e4ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12
        }}>
          <div>
            <span style={{ color: '#666' }}>共</span>
            <span style={{ fontWeight: 700, color: '#667eea', margin: '0 4px' }}>{categoryStats.total}</span>
            <span style={{ color: '#666' }}>款商品</span>
          </div>
          <div>
            <span style={{ color: '#666' }}>最低</span>
            <span style={{ fontWeight: 700, color: '#52c41a', margin: '0 4px' }}>¥{categoryStats.minPrice}</span>
            <span style={{ color: '#666' }}>起</span>
          </div>
        </div>
      )}

      {searchKeyword && (
        <div style={{
          margin: '0 20px 12px',
          padding: '8px 14px',
          borderRadius: 8,
          background: '#fffbe6',
          border: '1px solid #ffe58f',
          fontSize: 12,
          color: '#d48806',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>🔍 搜索「{searchKeyword}」找到 {filteredProducts.length} 个结果</span>
          <button
            onClick={() => setSearchKeyword('')}
            style={{
              padding: '2px 8px',
              borderRadius: 6,
              background: '#faad14',
              color: 'white',
              fontSize: 11,
              fontWeight: 500,
              border: 'none'
            }}
          >
            清除
          </button>
        </div>
      )}

      {!activeCategory && (
        <>
          <div className="section-title" style={{ marginTop: 16 }}>
            <h3>📦 完整SKU分类</h3>
          </div>
          <div style={{
            padding: '0 16px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10
          }}>
            {categories.slice(0, 6).map(cat => {
              const icon = cat.icon || CATEGORY_ICONS[cat.name] || '📦';
              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    background: 'white',
                    border: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#667eea';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f0';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>{icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{cat.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#999' }}>
                      {cat.product_count || 0}款商品
                    </span>
                    <span style={{
                      fontSize: 12,
                      color: '#667eea',
                      fontWeight: 500
                    }}>
                      查看全部 →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeCategory && (
        <div style={{
          padding: '0 16px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <button
            onClick={handleBackToHot}
            style={{
              padding: '6px 12px',
              borderRadius: 16,
              background: '#f5f5f5',
              border: 'none',
              fontSize: 12,
              color: '#666',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            ← 返回热门
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
            {activeCategory.icon || CATEGORY_ICONS[activeCategory.name] || '📦'} {activeCategory.name} 分类商品
          </span>
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <div className="icon">⏳</div>
          <div>加载中...</div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📦</div>
          <div>{searchKeyword ? '未找到匹配商品' : activeCategory ? '该分类暂无商品' : '暂无热门商品'}</div>
        </div>
      ) : (
        <>
          {filteredProducts.map(p => renderProductCard(p))}
          {activeCategory && hasMoreCategoryProducts && (
            <div style={{ padding: '12px 16px 16px', textAlign: 'center' }}>
              <button
                onClick={loadMoreCategoryProducts}
                disabled={categoryLoading}
                style={{
                  padding: '10px 24px',
                  borderRadius: 20,
                  background: categoryLoading ? '#e8e8e8' : 'linear-gradient(135deg, #f0f5ff, #e6f0ff)',
                  color: categoryLoading ? '#999' : '#667eea',
                  fontSize: 13,
                  fontWeight: 600,
                  border: '1px solid #d6e4ff',
                  cursor: categoryLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {categoryLoading ? '加载中...' : `加载更多 (已显示${filteredProducts.length}/${categoryTotal})`}
              </button>
            </div>
          )}
        </>
      )}

      <div style={{ padding: 20, textAlign: 'center' }}>
        <p style={{ color: '#bbb', fontSize: 12 }}>
          {searchKeyword ? '— 搜索结果显示完毕 —' : activeCategory ? `— 已显示${filteredProducts.length}/${categoryTotal || filteredProducts.length}款分类商品 —` : '— 已显示全部推荐商品 —'}
        </p>
      </div>

      {channelModal.open && currentProduct && (
        <div
          onClick={handleCloseChannelModal}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: 20,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 440, maxHeight: '80vh',
              background: 'white', borderRadius: 14,
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
              animation: 'slideUp 0.25s ease-out',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
            }}
          >
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                ⚠️ 通道状态详情
              </div>
              <button
                onClick={handleCloseChannelModal}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: 'none', background: '#f5f5f5',
                  fontSize: 16, color: '#666', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{
              padding: '12px 20px',
              background: '#fff7e6',
              borderBottom: '1px solid #ffd591',
              fontSize: 12, color: '#d46b08'
            }}>
              商品：<span style={{ color: '#333', fontWeight: 500 }}>{currentProduct.name}</span>
              <span style={{ marginLeft: 8 }}>
                · 共 {currentProduct.channelCount || currentProduct.channels?.length || 0} 个通道，
                异常 {Math.max(0, (currentProduct.channelCount || currentProduct.channels?.length || 0) - (currentProduct.activeChannelCount || 0))} 个
              </span>
            </div>

            <div style={{ padding: 12, overflowY: 'auto', flex: 1 }}>
              {currentProduct.channels && currentProduct.channels.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {currentProduct.channels.map((ch: RechargeChannel, idx: number) => {
                    const level = getChannelStatusLevel(ch.status);
                    return (
                      <div
                        key={ch.id || idx}
                        style={{
                          padding: 12, borderRadius: 10,
                          background: level === 'green' ? '#f6ffed' : level === 'yellow' ? '#fffbe6' : '#fff1f0',
                          border: `1px solid ${level === 'green' ? '#b7eb8f' : level === 'yellow' ? '#ffe58f' : '#ffccc7'}`,
                        }}
                      >
                        <div style={{
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          marginBottom: 8
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 16 }}>{getChannelStatusEmoji(level)}</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                              {`通道${idx + 1}${ch.priority === 1 ? '(主)' : ch.priority <= Math.ceil((currentProduct.channels?.length || 1) * 0.3) ? '(备)' : ''}`}
                            </span>
                            <span style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              borderRadius: 8,
                              background: 'white',
                              color: level === 'green' ? '#389e0d' : level === 'yellow' ? '#d48806' : '#cf1322',
                              fontWeight: 500
                            }}>
                              {getChannelStatusLabel(level)}
                            </span>
                          </div>
                          <span style={{ fontSize: 12, color: '#999' }}>
                            优先级 {ch.priority}
                          </span>
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '6px 12px',
                          fontSize: 12,
                          color: '#666'
                        }}>
                          <div>
                            <span style={{ color: '#999' }}>供应商：</span>
                            <span style={{ color: '#333' }}>{ch.supplier_name || '-'}</span>
                          </div>
                          <div>
                            <span style={{ color: '#999' }}>成功率：</span>
                            <span style={{ color: getSuccessRateColor((ch.success_rate || 0) * 100), fontWeight: 500 }}>
                              {Math.round((ch.success_rate || 0) * 1000) / 10}%
                            </span>
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <span style={{ color: '#999' }}>最后失败时间：</span>
                            <span style={{ color: level === 'red' ? '#cf1322' : '#666' }}>
                              {ch.last_fail_time ? formatDateTime(ch.last_fail_time) : '无'}
                            </span>
                          </div>
                          {ch.fail_reason && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <span style={{ color: '#999' }}>故障原因：</span>
                              <span style={{ color: '#cf1322' }}>{ch.fail_reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 32, color: '#999', fontSize: 13 }}>
                  暂无通道信息
                </div>
              )}
            </div>

            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #f0f0f0',
              fontSize: 11, color: '#999', textAlign: 'center'
            }}>
              🟢正常 · 🟡降级 · 🔴故障
            </div>
          </div>
        </div>
      )}

      {fallbackDetailModal.open && fallbackProduct && (() => {
        const channelCount = fallbackProduct.channelCount || fallbackProduct.channels?.length || 0;
        const activeChannelCount = fallbackProduct.activeChannelCount ?? getChannelStatus(fallbackProduct.channels).activeCount;
        const mainChannels = fallbackProduct.channels?.filter(c => c.priority === 1) || [];
        const failedMain = mainChannels.filter(c => c.status !== 1);
        const activeBackup = fallbackProduct.channels?.filter(c => c.priority > 1 && c.status === 1) || [];
        return (
          <div
            onClick={handleCloseFallbackDetail}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: 20,
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 420, maxHeight: '80vh',
                background: 'white', borderRadius: 14,
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                animation: 'slideUp 0.25s ease-out',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
              }}
            >
              <div style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #faad14, #fa8c16)',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                  🛟 通道降级详情
                </div>
                <button
                  onClick={handleCloseFallbackDetail}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: 'none', background: 'rgba(255,255,255,0.2)',
                    fontSize: 16, color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
                <div style={{
                  padding: 14,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
                  border: '1px solid #ffd591',
                  marginBottom: 14
                }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>商品</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{fallbackProduct.name}</div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginBottom: 14
                }}>
                  <div style={{
                    padding: 12,
                    borderRadius: 10,
                    background: '#fff1f0',
                    border: '1px solid #ffa39e'
                  }}>
                    <div style={{ fontSize: 10, color: '#999', marginBottom: 4 }}>主通道总数</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#cf1322' }}>
                      {mainChannels.length}
                      <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 4 }}>个</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#ff4d4f', marginTop: 2 }}>
                      故障 {failedMain.length} 个
                    </div>
                  </div>
                  <div style={{
                    padding: 12,
                    borderRadius: 10,
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f'
                  }}>
                    <div style={{ fontSize: 10, color: '#999', marginBottom: 4 }}>活跃备通道</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#389e0d' }}>
                      {activeBackup.length}
                      <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 4 }}>个</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#52c41a', marginTop: 2 }}>
                      正在服务中
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: 14,
                  borderRadius: 12,
                  background: '#fafafa',
                  border: '1px solid #f0f0f0',
                  marginBottom: 14
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 10 }}>
                    🕐 降级事件
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>切换时间</span>
                      <span style={{ color: '#333', fontWeight: 500 }}>
                        {fallbackProduct.fallback_switch_time ? formatDateTime(fallbackProduct.fallback_switch_time) : formatDateTime(Date.now() / 1000 - 300)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ color: '#999', flexShrink: 0, marginRight: 12 }}>主通道故障原因</span>
                      <span style={{
                        color: '#cf1322',
                        fontWeight: 500,
                        textAlign: 'right',
                        flex: 1
                      }}>
                        {fallbackProduct.fallback_reason || (failedMain.length > 0 && failedMain[0].fail_reason) || `主通道连续失败${3 + Math.floor(Math.random() * 5)}次，触发自动降级阈值`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>当前使用备通道</span>
                      <span style={{ color: '#389e0d', fontWeight: 600 }}>
                        第{fallbackProduct.backup_channel_number || Math.max(1, Math.floor(channelCount * 0.5))}号
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>预计延迟</span>
                      <span style={{ color: '#fa8c16', fontWeight: 500 }}>约 2 分钟</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#999' }}>备用通道状态</span>
                      <span style={{ color: '#389e0d', fontWeight: 500 }}>
                        🟢 {activeBackup.length > 0 ? '运行正常' : '降级完成'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: 12,
                  borderRadius: 10,
                  background: '#e6f7ff',
                  border: '1px solid #91d5ff',
                  fontSize: 11,
                  color: '#096dd9',
                  lineHeight: 1.6
                }}>
                  💡 <strong>说明：</strong>当主通道连续失败时系统会自动切换到备用通道。降级期间充值延迟可能增加约2分钟。如备通道全部故障，将触发退款流程。
                </div>
              </div>

              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid #f0f0f0'
              }}>
                <button
                  onClick={handleCloseFallbackDetail}
                  className="btn-primary btn-block"
                  style={{ padding: '10px 0', borderRadius: 10, fontSize: 14 }}
                >
                  我知道了
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {promoDetailModal.open && promoDetailModal.productId && (() => {
        const product = getCurrentProduct(promoDetailModal.productId);
        const { loading, breakdown, finalTotal, originalTotal } = promoDetailModal;
        const discount = Math.max(0, originalTotal - finalTotal);

        return (
          <div
            onClick={handleClosePromoDetail}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: 20,
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 400, maxHeight: '80vh',
                background: 'white', borderRadius: 14,
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                animation: 'slideUp 0.25s ease-out',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
              }}
            >
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  💰 优惠明细
                </div>
                <button
                  onClick={handleClosePromoDetail}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: 'none', background: '#f5f5f5',
                    fontSize: 16, color: '#666', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%)',
                borderBottom: '1px solid #ffd591'
              }}>
                <div style={{ fontSize: 13, color: '#d46b08', marginBottom: 10 }}>
                  商品：<span style={{ color: '#333', fontWeight: 500 }}>{product?.name || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, justifyContent: 'space-around' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>原价</div>
                    <div style={{ fontSize: 15, color: '#999', textDecoration: 'line-through' }}>
                      ¥{originalTotal.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>实付</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f' }}>
                      ¥{finalTotal.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>共省</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#52c41a' }}>
                      ¥{discount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📋</span> 优惠计算明细
                </div>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 32, color: '#999', fontSize: 13 }}>
                    正在计算优惠...
                  </div>
                ) : (breakdown && breakdown.length > 0) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {breakdown.map((item, idx) => {
                      const typeInfo = getPromoTypeInfo(item.type);
                      const isDiscount = item.amount > 0 && item.type !== 'base';
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: 12,
                            borderRadius: 10,
                            background: item.type === 'base' ? '#fafafa' : `linear-gradient(135deg, ${typeInfo.color}11 0%, ${typeInfo.color}08 100%)`,
                            border: item.type === 'base' ? '1px solid #f0f0f0' : `1px solid ${typeInfo.color}33`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10
                          }}
                        >
                          <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: item.type === 'base' ? '#e8e8e8' : `linear-gradient(135deg, ${typeInfo.color}33, ${typeInfo.color}22)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, flexShrink: 0
                          }}>
                            {typeInfo.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 13, fontWeight: 600, color: '#333',
                              display: 'flex', alignItems: 'center', gap: 6
                            }}>
                              {item.name}
                              <span style={{
                                fontSize: 9, padding: '1px 6px', borderRadius: 4,
                                background: `${typeInfo.color}18`, color: typeInfo.color,
                                fontWeight: 500
                              }}>
                                {typeInfo.label}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                              {item.description}
                            </div>
                          </div>
                          <div style={{
                            fontSize: 14, fontWeight: 700,
                            color: isDiscount ? '#52c41a' : '#333',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.type === 'base' ? '' : '-'}¥{item.amount.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}

                    <div style={{
                      marginTop: 4, padding: 12,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #52c41a11, #52c41a08)',
                      border: '1px solid #52c41a33',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#389e0d', display: 'flex', alignItems: 'center', gap: 4 }}>
                        🎉 优惠合计
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#52c41a' }}>
                        -¥{discount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 32, color: '#999', fontSize: 13 }}>
                    <div style={{ fontSize: 40, marginBottom: 8, opacity: 0.4 }}>😢</div>
                    暂无可用优惠
                    <div style={{ fontSize: 11, marginTop: 4 }}>新用户首单可享立减优惠</div>
                  </div>
                )}
              </div>

              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid #f0f0f0',
                fontSize: 11, color: '#999', textAlign: 'center'
              }}>
                实际优惠以结算页为准，优惠可叠加取决于活动规则
              </div>
            </div>
          </div>
        );
      })()}

      {commissionDetailModal.open && commissionDetailModal.productId && (() => {
        const product = getCurrentProduct(commissionDetailModal.productId);
        const priceEst = product ? (priceEstimates[product.id] || { loading: false, finalPrice: product.price, originalPrice: product.price, discount: 0, breakdown: [], commissionEarned: 0 }) : null;
        const basePrice = priceEst?.finalPrice || product?.price || 0;
        const commissionRate = product?.commission_rate || 0.08;

        const l1Commission = basePrice * COMMISSION_RATES.level1;
        const l2Commission = basePrice * COMMISSION_RATES.level2;
        const l3Commission = basePrice * COMMISSION_RATES.level3;
        const totalCommission = l1Commission + l2Commission + l3Commission;
        const totalRate = COMMISSION_RATES.level1 + COMMISSION_RATES.level2 + COMMISSION_RATES.level3;

        return (
          <div
            onClick={handleCloseCommissionDetail}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: 20,
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 400, maxHeight: '80vh',
                background: 'white', borderRadius: 14,
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                animation: 'slideUp 0.25s ease-out',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
              }}
            >
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  📊 佣金明细
                </div>
                <button
                  onClick={handleCloseCommissionDetail}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: 'none', background: '#f5f5f5',
                    fontSize: 16, color: '#666', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%)',
                borderBottom: '1px solid #b7eb8f'
              }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  商品：<span style={{ color: '#333', fontWeight: 500 }}>{product?.name || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, justifyContent: 'space-around' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>预估实付</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>
                      ¥{basePrice.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>总佣金率</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#52c41a' }}>
                      {(totalRate * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>预估总佣金</div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#52c41a' }}>
                      ¥{totalCommission.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12 }}>
                  🔗 三级分销佣金预估
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  {[
                    { level: 'L1', name: '直推好友', desc: '我直接分享的好友下单', rate: COMMISSION_RATES.level1, amount: l1Commission, color1: '#667eea', color2: '#764ba2', textColor: '#667eea', bg1: '#f0f5ff', bg2: '#e6f0ff', border: '#d6e4ff' },
                    { level: 'L2', name: '间推好友', desc: '好友分享的好友下单', rate: COMMISSION_RATES.level2, amount: l2Commission, color1: '#f5576c', color2: '#f093fb', textColor: '#f5576c', bg1: '#fff0f6', bg2: '#ffe7f0', border: '#ffadd2' },
                    { level: 'L3', name: '三级好友', desc: '三级关系链好友下单', rate: COMMISSION_RATES.level3, amount: l3Commission, color1: '#fa8c16', color2: '#ffd666', textColor: '#fa8c16', bg1: '#fff7e6', bg2: '#ffe7ba', border: '#ffd591' }
                  ].map(item => (
                    <div key={item.level} style={{
                      padding: 14,
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${item.bg1} 0%, ${item.bg2} 100%)`,
                      border: `1px solid ${item.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 12,
                          background: `linear-gradient(135deg, ${item.color1}, ${item.color2})`,
                          color: 'white', fontSize: 14, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: `0 2px 8px ${item.color1}44`
                        }}>
                          {item.level}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{item.name}</div>
                          <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>{item.desc}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 17, fontWeight: 700, color: item.textColor }}>
                          ¥{item.amount.toFixed(2)}
                        </div>
                        <div style={{ fontSize: 10, color: '#999' }}>
                          {(item.rate * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  padding: 12,
                  borderRadius: 10,
                  background: '#fafafa',
                  border: '1px solid #f0f0f0',
                  fontSize: 11,
                  color: '#666',
                  lineHeight: 1.6,
                  marginBottom: 10
                }}>
                  <div style={{ marginBottom: 6, fontWeight: 600, color: '#333', fontSize: 12 }}>
                    💡 场景示例
                  </div>
                  <div>• <strong>我分享</strong> → 好友A下单：我赚 <span style={{ color: '#667eea', fontWeight: 600 }}>L1 ¥{l1Commission.toFixed(2)}</span></div>
                  <div>• 好友A分享 → 好友B下单：A赚L1，<strong>我赚</strong> <span style={{ color: '#f5576c', fontWeight: 600 }}>L2 ¥{l2Commission.toFixed(2)}</span></div>
                  <div>• 好友B分享 → 好友C下单：B赚L1，A赚L2，<strong>我赚</strong> <span style={{ color: '#fa8c16', fontWeight: 600 }}>L3 ¥{l3Commission.toFixed(2)}</span></div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10
                }}>
                  <div style={{
                    padding: 10,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #e6f7ff, #f0f5ff)',
                    border: '1px solid #91d5ff',
                    fontSize: 10,
                    color: '#096dd9',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>⏰ 到账时间</div>
                    <div>订单完成后 T+7 天</div>
                  </div>
                  <div style={{
                    padding: 10,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #f6ffed, #e6f7ff)',
                    border: '1px solid #b7eb8f',
                    fontSize: 10,
                    color: '#389e0d',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>💰 最低提现</div>
                    <div>累计佣金 ≥ ¥10</div>
                  </div>
                </div>
              </div>

              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid #f0f0f0',
                fontSize: 11, color: '#999', textAlign: 'center'
              }}>
                预估佣金仅供参考，实际以订单完成后结算为准
              </div>
            </div>
          </div>
        );
      })()}

      {rechargeTrialModal.open && rechargeTrialModal.productId && (() => {
        const product = getCurrentProduct(rechargeTrialModal.productId);
        const phoneValidation = validatePhone(rechargeTrialModal.phone);
        const canCalculate = phoneValidation.valid && !rechargeTrialModal.calculating;
        const result = rechargeTrialModal.result;
        const discount = result?.discount || 0;

        return (
          <div
            onClick={handleCloseRechargeTrial}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: 20,
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 400, maxHeight: '85vh',
                background: 'white', borderRadius: 14,
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                animation: 'slideUp 0.25s ease-out',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
              }}
            >
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  📞 充值试算
                </div>
                <button
                  onClick={handleCloseRechargeTrial}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: 'none', background: '#f5f5f5',
                    fontSize: 16, color: '#666', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{
                padding: '14px 20px',
                background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
                borderBottom: '1px solid #91d5ff'
              }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
                  商品：<span style={{ color: '#333', fontWeight: 500 }}>{product?.name || '-'}</span>
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>
                  输入手机号，实时校验号段并预估充值费用
                </div>
              </div>

              <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#333',
                    marginBottom: 8
                  }}>
                    充值手机号
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      placeholder="请输入11位手机号码"
                      value={rechargeTrialModal.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setRechargeTrialModal(prev => ({ ...prev, phone: val, result: null }));
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 44px 12px 40px',
                        fontSize: 16,
                        border: `1px solid ${phoneValidation.level === 'error' ? '#ff4d4f' : phoneValidation.level === 'warning' ? '#faad14' : phoneValidation.level === 'success' ? '#52c41a' : '#d9d9d9'}`,
                        borderRadius: 10,
                        outline: 'none',
                        boxSizing: 'border-box',
                        background: phoneValidation.level === 'error' ? '#fff1f0' : phoneValidation.level === 'warning' ? '#fffbe6' : 'white',
                        transition: 'all 0.2s'
                      }}
                      maxLength={11}
                    />
                    <span style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 16
                    }}>
                      {rechargeTrialModal.phone ? getOperatorEmoji(phoneValidation.operator) : '📱'}
                    </span>
                    {rechargeTrialModal.phone && phoneValidation.operator !== '未知' && (
                      <span style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: phoneValidation.level === 'error' ? '#ff4d4f' : phoneValidation.level === 'warning' ? '#faad14' : '#52c41a',
                        color: 'white',
                        fontWeight: 500
                      }}>
                        {phoneValidation.operator}
                      </span>
                    )}
                  </div>

                  {rechargeTrialModal.phone && (
                    <div style={{
                      marginTop: 8,
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: phoneValidation.level === 'error' ? '#fff1f0' : phoneValidation.level === 'warning' ? '#fffbe6' : '#f6ffed',
                      border: `1px solid ${phoneValidation.level === 'error' ? '#ffa39e' : phoneValidation.level === 'warning' ? '#ffe58f' : '#b7eb8f'}`,
                      color: phoneValidation.level === 'error' ? '#cf1322' : phoneValidation.level === 'warning' ? '#d48806' : '#389e0d'
                    }}>
                      <span>{phoneValidation.level === 'error' ? '❌' : phoneValidation.level === 'warning' ? '⚠️' : '✅'}</span>
                      <span style={{ flex: 1 }}>{phoneValidation.message}</span>
                      {phoneValidation.isVirtual && (
                        <span style={{
                          fontSize: 9,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: '#faad14',
                          color: 'white',
                          fontWeight: 600
                        }}>
                          虚拟号段
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleTrialCalculate}
                  disabled={!canCalculate}
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'white',
                    background: rechargeTrialModal.calculating || !canCalculate
                      ? '#bfbfbf'
                      : 'linear-gradient(135deg, #667eea, #764ba2)',
                    border: 'none',
                    borderRadius: 10,
                    cursor: rechargeTrialModal.calculating || !canCalculate
                      ? 'not-allowed'
                      : 'pointer',
                    transition: 'all 0.3s',
                    marginBottom: result ? 16 : 0
                  }}
                >
                  {rechargeTrialModal.calculating ? '🔄 计算中...' : canCalculate ? '✨ 开始试算' : '请输入正确手机号'}
                </button>

                {result && (
                  <div style={{
                    padding: 16,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #fffbe6 0%, #f6ffed 100%)',
                    border: '1px solid #ffe58f',
                    animation: 'fadeInUp 0.3s ease-out'
                  }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#333',
                      marginBottom: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span>📊</span> 试算结果
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                      marginBottom: 12
                    }}>
                      <div style={{
                        padding: 10,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.7)'
                      }}>
                        <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>原价</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#999', textDecoration: 'line-through' }}>
                          ¥{result.originalPrice.toFixed(2)}
                        </div>
                      </div>
                      <div style={{
                        padding: 10,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.7)'
                      }}>
                        <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>实付预估</div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: '#ff4d4f' }}>
                          ¥{result.finalPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {discount > 0 && (
                      <div style={{
                        marginBottom: 12,
                        padding: '8px 12px',
                        background: '#f6ffed',
                        borderRadius: 8,
                        fontSize: 12,
                        color: '#389e0d',
                        textAlign: 'center',
                        fontWeight: 600
                      }}>
                        🎉 已为您节省 ¥{discount.toFixed(2)}
                      </div>
                    )}

                    {result.commissionEarned > 0 && (
                      <div style={{
                        marginBottom: 12,
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #f0f5ff, #e6f0ff)',
                        borderRadius: 8,
                        fontSize: 12,
                        color: '#667eea',
                        textAlign: 'center',
                        fontWeight: 600
                      }}>
                        💸 分享可赚佣金约 ¥{result.commissionEarned.toFixed(2)}
                      </div>
                    )}

                    {result.breakdown && result.breakdown.length > 0 && (
                      <div style={{
                        paddingTop: 12,
                        borderTop: '1px dashed #ffd591'
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#666', marginBottom: 8 }}>
                          费用明细：
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {result.breakdown.map((item, idx) => {
                            const typeInfo = getPromoTypeInfo(item.type);
                            return (
                              <div key={idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: 11
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span>{typeInfo.icon}</span>
                                  <span style={{ color: '#666' }}>{item.name}</span>
                                </div>
                                <span style={{
                                  fontWeight: 600,
                                  color: item.type === 'base' ? '#333' : '#52c41a'
                                }}>
                                  {item.type === 'base' ? '' : '-'}¥{item.amount.toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid #f0f0f0',
                fontSize: 11, color: '#999', textAlign: 'center'
              }}>
                试算结果仅供参考，实际费用以结算页为准
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
