import { useEffect, useState } from 'react';
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
}

interface SyncState {
  syncing: boolean;
  showSuccess: boolean;
  variance: number;
  timestamp: number;
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
  supplier_name: string;
  channelCount: number;
  activeChannelCount: number;
  hasFallback: boolean;
  successRate: number;
  priceDiff: number;
  priceDiffLabel: string;
  stock: number;
}

interface AlternativesResponse {
  currentSupplier: string;
  alternatives: AlternativeItem[];
  totalAlternatives: number;
  hasMultiSupplier: boolean;
}

interface PriceEstimateState {
  loading: boolean;
  finalPrice: number;
  originalPrice: number;
  discount: number;
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
}

type ChannelStatusLevel = 'green' | 'yellow' | 'red';

interface ChannelModalState {
  open: boolean;
  productId: string | null;
}

interface PromoDetailModalState {
  open: boolean;
  productId: string | null;
}

interface CommissionDetailModalState {
  open: boolean;
  productId: string | null;
}

interface RechargeTrialModalState {
  open: boolean;
  productId: string | null;
  phone: string;
  calculating: boolean;
  result: { finalPrice: number; originalPrice: number; discount: number } | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  '话费充值': '📞',
  '流量充值': '📶',
  '视频会员': '📺',
  '音乐会员': '🎵',
  '外卖券': '🍔',
  '电商购物卡': '🛒',
};

const DEFAULT_CATEGORIES = [
  { id: 'phone', name: '话费充值', icon: '📞' },
  { id: 'data', name: '流量充值', icon: '📶' },
  { id: 'video', name: '视频会员', icon: '📺' },
  { id: 'music', name: '音乐会员', icon: '🎵' },
  { id: 'food', name: '外卖券', icon: '🍔' },
  { id: 'card', name: '电商购物卡', icon: '🛒' },
];

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

const COMMISSION_RATES = { level1: 0.08, level2: 0.04, level3: 0.02 };

export default function Home() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useUser();
  const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://127.0.0.1:49213';
  const [categories, setCategories] = useState<any[]>([]);
  const [hotProducts, setHotProducts] = useState<Product[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<any>(null);
  const [syncStates, setSyncStates] = useState<Record<string, SyncState>>({});
  const [alternativesStates, setAlternativesStates] = useState<Record<string, AlternativesState>>({});
  const [priceEstimates, setPriceEstimates] = useState<Record<string, PriceEstimateState>>({});
  const [altBadgeCounts, setAltBadgeCounts] = useState<Record<string, number>>({});
  const [channelModal, setChannelModal] = useState<ChannelModalState>({ open: false, productId: null });
  const [promoDetailModal, setPromoDetailModal] = useState<PromoDetailModalState>({ open: false, productId: null });
  const [commissionDetailModal, setCommissionDetailModal] = useState<CommissionDetailModalState>({ open: false, productId: null });
  const [rechargeTrialModal, setRechargeTrialModal] = useState<RechargeTrialModalState>({
    open: false,
    productId: null,
    phone: '',
    calculating: false,
    result: null
  });

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
        const mergedCats = DEFAULT_CATEGORIES.map(def => {
          const found = cats.find((c: any) => c.name === def.name || c.id === def.id);
          return found ? { ...def, ...found, product_count: found.product_count || 0 } : { ...def, product_count: 0 };
        });
        setCategories(mergedCats);
      } else {
        setCategories(DEFAULT_CATEGORIES.map(c => ({ ...c, product_count: 0 })));
      }
      if (hotRes.success) {
        const products: Product[] = hotRes.data || [];
        setHotProducts(products);
        const badgeMap: Record<string, number> = {};
        products.forEach(p => {
          badgeMap[p.id] = 0;
        });
        setAltBadgeCounts(badgeMap);
      }
      if (promoRes.success) setPromotions(promoRes.data || []);
    } catch (e: any) {
      toast.show(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryProducts = async (category: any) => {
    setCategoryLoading(true);
    try {
      const res = await productApi.getProducts({ categoryId: category.id, pageSize: 50 });
      if (res.success) {
        const products: Product[] = res.data.list || [];
        setCategoryProducts(products);
        const badgeMap: Record<string, number> = {};
        products.forEach(p => {
          if (!altBadgeCounts[p.id]) {
            badgeMap[p.id] = 0;
          }
        });
        if (Object.keys(badgeMap).length > 0) {
          setAltBadgeCounts(prev => ({ ...prev, ...badgeMap }));
        }
      }
    } catch (e: any) {
      toast.show(e.message || '加载失败', 'error');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleCategoryClick = (category: any) => {
    setActiveCategory(category);
    loadCategoryProducts(category);
  };

  const handleBackToHot = () => {
    setActiveCategory(null);
    setCategoryProducts([]);
  };

  const loadPriceEstimate = async (productId: string, unitPrice: number) => {
    if (priceEstimates[productId]) return;
    setPriceEstimates(prev => ({ ...prev, [productId]: { loading: true, finalPrice: unitPrice, originalPrice: unitPrice, discount: 0 } }));
    try {
      const res = await productApi.calculatePrice({ items: [{ productId, quantity: 1 }] });
      if (res.success) {
        const { finalTotal, originalTotal } = res.data;
        const discount = Math.max(0, (originalTotal || unitPrice) - (finalTotal || unitPrice));
        setPriceEstimates(prev => ({
          ...prev,
          [productId]: {
            loading: false,
            finalPrice: finalTotal || unitPrice,
            originalPrice: originalTotal || unitPrice,
            discount
          }
        }));
      } else {
        setPriceEstimates(prev => ({ ...prev, [productId]: { loading: false, finalPrice: unitPrice, originalPrice: unitPrice, discount: 0 } }));
      }
    } catch {
      setPriceEstimates(prev => ({ ...prev, [productId]: { loading: false, finalPrice: unitPrice, originalPrice: unitPrice, discount: 0 } }));
    }
  };

  const handleSyncStock = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (syncStates[productId]?.syncing) return;

    setSyncStates(prev => ({ ...prev, [productId]: { syncing: true, showSuccess: false, variance: 0, timestamp: 0 } }));

    try {
      const res = await productApi.syncStock(productId);
      if (res.success) {
        const { syncResult } = res.data;
        setSyncStates(prev => ({
          ...prev,
          [productId]: {
            syncing: false,
            showSuccess: true,
            variance: syncResult.variance,
            timestamp: syncResult.timestamp
          }
        }));
        const updateProductList = (list: Product[]) => list.map(p =>
          p.id === productId ? { ...p, ...res.data, lastSync: syncResult.timestamp, stock: syncResult.after } : p
        );
        setHotProducts(prev => updateProductList(prev));
        setCategoryProducts(prev => updateProductList(prev));
        toast.show('同步成功', 'success');
        setTimeout(() => {
          setSyncStates(prev => ({ ...prev, [productId]: { syncing: false, showSuccess: false, variance: 0, timestamp: 0 } }));
        }, 3500);
      }
    } catch (e: any) {
      toast.show(e.message || '同步失败', 'error');
      setSyncStates(prev => ({ ...prev, [productId]: { syncing: false, showSuccess: false, variance: 0, timestamp: 0 } }));
    }
  };

  const handleOpenAlternativesModal = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const state = alternativesStates[productId];
    if (state?.modalOpen) {
      setAlternativesStates(prev => ({ ...prev, [productId]: { ...state, modalOpen: false } }));
      return;
    }
    setAlternativesStates(prev => ({
      ...prev,
      [productId]: { loading: false, data: state?.data || null, expanded: false, modalOpen: true }
    }));
    if (!state?.data) {
      await handleLoadAlternatives(productId, e);
    }
  };

  const handleLoadAlternatives = async (productId: string, _e?: React.MouseEvent) => {
    const state = alternativesStates[productId];
    if (state?.loading) return;

    setAlternativesStates(prev => ({
      ...prev,
      [productId]: { loading: true, data: state?.data || null, expanded: false, modalOpen: state?.modalOpen || true }
    }));
    try {
      const res = await productApi.getAlternatives(productId);
      if (res.success) {
        setAlternativesStates(prev => ({
          ...prev,
          [productId]: { loading: false, data: res.data, expanded: false, modalOpen: true }
        }));
        setAltBadgeCounts(prev => ({ ...prev, [productId]: res.data.totalAlternatives || 0 }));
      }
    } catch (e: any) {
      toast.show(e.message || '加载失败', 'error');
      setAlternativesStates(prev => ({
        ...prev,
        [productId]: { loading: false, data: null, expanded: false, modalOpen: true }
      }));
    }
  };

  const handleSwitchAlternative = (altId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/product/${altId}`);
  };

  const handleOpenChannelModal = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChannelModal({ open: true, productId });
  };

  const handleCloseChannelModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setChannelModal({ open: false, productId: null });
  };

  const handleOpenPromoDetail = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPromoDetailModal({ open: true, productId });
  };

  const handleClosePromoDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPromoDetailModal({ open: false, productId: null });
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
    if (!product || !rechargeTrialModal.phone) return;

    setRechargeTrialModal(prev => ({ ...prev, calculating: true, result: null }));
    try {
      const res = await productApi.calculatePrice({
        items: [{ productId: product.id, quantity: 1, account: rechargeTrialModal.phone }]
      });
      if (res.success) {
        const { finalTotal, originalTotal } = res.data;
        const discount = Math.max(0, (originalTotal || product.price) - (finalTotal || product.price));
        setRechargeTrialModal(prev => ({
          ...prev,
          calculating: false,
          result: {
            finalPrice: finalTotal || product.price,
            originalPrice: originalTotal || product.price,
            discount
          }
        }));
      } else {
        setRechargeTrialModal(prev => ({ ...prev, calculating: false }));
        toast.show(res.message || '计算失败', 'error');
      }
    } catch {
      setRechargeTrialModal(prev => ({ ...prev, calculating: false }));
      toast.show('计算失败', 'error');
    }
  };

  const getPromoTypeLabel = (type: string) => {
    switch (type) {
      case 'full_reduction': return '满减';
      case 'percentage': return '折扣';
      case 'cashback': return '返现';
      default: return '优惠';
    }
  };

  const getPromoGradient = (type: string) => {
    switch (type) {
      case 'full_reduction': return 'linear-gradient(135deg, #ff9a9e, #fecfef)';
      case 'percentage': return 'linear-gradient(135deg, #a8edea, #fed6e3)';
      case 'cashback': return 'linear-gradient(135deg, #ffecd2, #fcb69f)';
      default: return 'linear-gradient(135deg, #667eea, #764ba2)';
    }
  };

  const getChannelDotColor = (level: ChannelStatusLevel) => {
    switch (level) {
      case 'green': return '#52c41a';
      case 'yellow': return '#faad14';
      case 'red': return '#ff4d4f';
    }
  };

  const getChannelStatusText = (level: ChannelStatusLevel) => {
    switch (level) {
      case 'green': return '通道正常';
      case 'yellow': return '部分降级';
      case 'red': return '通道故障';
    }
  };

  const getCurrentProduct = (productId: string): Product | undefined => {
    return [...hotProducts, ...categoryProducts].find(p => p.id === productId);
  };

  const renderProductCard = (p: Product) => {
    const stock = getStockStatus(p.stock, p.stock_warning);
    const channelStatus = getChannelStatus(p.channels);
    const channelCount = p.channelCount || p.channels?.length || 0;
    const activeChannelCount = p.activeChannelCount ?? channelStatus.activeCount;
    const abnormalCount = Math.max(0, channelCount - activeChannelCount);
    const commission = calcCommission(p.price, p.commission_rate || 0);
    const hasStackablePromo = p.applicablePromotions?.some((pr) => pr.stackable) ?? promotions.some(pr => pr.rules?.stackable);
    const syncState = syncStates[p.id] || { syncing: false, showSuccess: false, variance: 0, timestamp: 0 };
    const altState = alternativesStates[p.id] || { loading: false, data: null, expanded: false, modalOpen: false };
    const altBadgeCount = altBadgeCounts[p.id] || 0;
    const priceEst = priceEstimates[p.id] || { loading: false, finalPrice: p.price, originalPrice: p.price, discount: 0 };
    const isRegionLimited = p.region_limited === 1;
    const supplierCount = altBadgeCount + 1;
    const fallbackCount = p.hasFallback ? Math.max(1, Math.floor(channelCount * 0.3)) : 0;
    const isNationwide = !isRegionLimited && (!p.available_regions || p.available_regions.length === 0);

    return (
      <div key={p.id} className="product-card" onClick={() => navigate(`/product/${p.id}`)}>
        <div className="thumb" style={{ position: 'relative' }}>
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
          </div>

          {syncState.showSuccess && (
            <div style={{
              position: 'absolute', top: 36, right: 8,
              padding: '2px 8px', borderRadius: 8,
              background: '#52c41a', color: 'white',
              fontSize: 10, fontWeight: 600,
              animation: 'fadeInUp 0.3s ease-out',
              whiteSpace: 'nowrap', zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2
            }}>
              <span>✓ {syncState.variance >= 0 ? `+${syncState.variance}` : syncState.variance}</span>
              <span style={{ fontSize: 9, opacity: 0.9, fontWeight: 400 }}>{formatDateTime(syncState.timestamp)}</span>
            </div>
          )}
        </div>
        <div className="info">
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap', alignItems: 'center' }}>
              {p.is_hot === 1 && <span className="hot-tag">HOT</span>}
              <span className="tag tag-blue">{p.supplier_name || '官方直充'}</span>
              
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
                🏪 {supplierCount}家供应商
              </button>
              
              {channelCount > 0 && (
                <span className="tag tag-purple" style={{ background: '#f9f0ff', color: '#722ed1', border: '1px solid #d3adf7' }}>
                  {channelCount}通道
                </span>
              )}
              
              {p.hasFallback && (
                <span
                  className="tag"
                  style={{
                    background: 'linear-gradient(135deg, #e6fffb, #b5f5ec)',
                    color: '#13c2c2',
                    border: '1px solid #87e8de',
                    cursor: 'help',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontWeight: 500
                  }}
                  title="主通道故障时自动切换至备用通道，预计延迟2分钟"
                >
                  🛡️ 备用{fallbackCount}个
                </span>
              )}
              
              {hasStackablePromo && <span className="tag tag-orange">可叠加优惠</span>}
            </div>
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
                      赚 ¥{commission.toFixed(2)}
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
                  🔗 备选供应商 <span style={{ color: '#999', fontWeight: 400, fontSize: 13 }}>({altBadgeCount})</span>
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
                background: '#fafafa',
                borderBottom: '1px solid #f0f0f0',
                fontSize: 12, color: '#666'
              }}>
                当前：<span style={{ color: '#333', fontWeight: 500 }}>{p.supplier_name}</span>
                <span style={{ marginLeft: 8, color: '#999' }}>· 可切换至其他供应商</span>
              </div>

              <div style={{ padding: 12, overflowY: 'auto', flex: 1 }}>
                {altState.loading ? (
                  <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>加载中...</div>
                ) : altState.data?.alternatives?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {altState.data.alternatives.map((alt: AlternativeItem, idx: number) => {
                      const priceDiffColor = alt.priceDiffLabel.includes('省')
                        ? '#52c41a'
                        : alt.priceDiffLabel.includes('贵')
                          ? '#ff4d4f'
                          : '#999';
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: 12, borderRadius: 10,
                            background: 'white',
                            border: '1px solid #f0f0f0',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#667eea'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#f0f0f0'; }}
                        >
                          <div style={{
                            display: 'flex', alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 12
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: 14, fontWeight: 500, color: '#333',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                              }}>
                                {alt.supplier_name}
                              </div>
                              <div style={{
                                fontSize: 13, color: '#666', marginTop: 2,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                              }}>
                                {alt.name}
                              </div>
                              <div style={{
                                display: 'flex', flexWrap: 'wrap', gap: '6px 10px',
                                marginTop: 8, alignItems: 'center'
                              }}>
                                <span style={{ fontSize: 16, fontWeight: 700, color: '#ff4d4f' }}>
                                  ¥{alt.price.toFixed(2)}
                                </span>
                                <span style={{ fontSize: 11, color: priceDiffColor, fontWeight: 500 }}>
                                  {alt.priceDiffLabel}
                                </span>
                              </div>
                              <div style={{
                                display: 'flex', flexWrap: 'wrap', gap: '4px 10px',
                                marginTop: 6, alignItems: 'center'
                              }}>
                                <span style={{
                                  fontSize: 11, color: '#666',
                                  display: 'inline-flex', alignItems: 'center', gap: 3
                                }}>
                                  <span style={{
                                    display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
                                    background: alt.activeChannelCount === alt.channelCount ? '#52c41a' : alt.activeChannelCount > 0 ? '#faad14' : '#ff4d4f'
                                  }} />
                                  {alt.activeChannelCount}/{alt.channelCount}通道
                                </span>
                                <span style={{ fontSize: 11, color: '#1890ff', fontWeight: 500 }}>
                                  {alt.successRate}%成功率
                                </span>
                                {alt.hasFallback && (
                                  <span style={{ fontSize: 11, color: '#13c2c2' }} title="支持7天自动降级">🛡️</span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleSwitchAlternative(alt.id, e)}
                              className="btn-primary"
                              style={{
                                padding: '6px 14px', fontSize: 12,
                                flexShrink: 0, alignSelf: 'center'
                              }}
                            >
                              切换
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
                切换供应商后将跳转至该商品详情页
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const currentProduct = channelModal.productId ? getCurrentProduct(channelModal.productId) : null;

  return (
    <div>
      <Header
        title="虚拟商品中心"
        showBack={false}
        right={<a href={adminUrl} className="admin-entry">运营后台</a>}
      />

      <div className="banner">
        <h2>🎉 新用户首单立减20元</h2>
        <p>200+商品极速充值 · 安全保障 · 佣金实时到账</p>
      </div>

      {promotions.length > 0 && (
        <div style={{ margin: '0 16px 12px', display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {promotions.map(p => (
            <div key={p.id} style={{
              flexShrink: 0, padding: '6px 12px', borderRadius: 10,
              background: getPromoGradient(p.type),
              fontSize: 12, color: '#333', fontWeight: 600, whiteSpace: 'nowrap'
            }}>
              🔥 {p.name} {p.rules?.stackable ? '·可叠加' : ''}
            </div>
          ))}
        </div>
      )}

      <div className="category-grid">
        {categories.slice(0, 6).map(cat => (
          <Link key={cat.id} to={`/category?cat=${cat.id}`} className="category-item">
            <div className="icon">{cat.icon || '📦'}</div>
            <span>{cat.name}</span>
            <span style={{
              fontSize: 10,
              color: '#999',
              marginTop: 2
            }}>
              {cat.product_count || 0}款
            </span>
          </Link>
        ))}
      </div>

      <div className="section-title">
        <h3>🔥 热门推荐</h3>
        <span className="more" onClick={() => navigate('/category')}>查看全部 ›</span>
      </div>

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
                  {cat.product_count || 0}个商品
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
      ) : activeCategory ? (
        categoryLoading ? (
          <div className="empty-state">
            <div className="icon">⏳</div>
            <div>加载中...</div>
          </div>
        ) : categoryProducts.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📦</div>
            <div>该分类暂无商品</div>
          </div>
        ) : (
          categoryProducts.map(p => renderProductCard(p))
        )
      ) : hotProducts.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📦</div>
          <div>暂无热门商品</div>
        </div>
      ) : (
        hotProducts.map(p => renderProductCard(p))
      )}

      <div style={{ padding: 20, textAlign: 'center' }}>
        <p style={{ color: '#bbb', fontSize: 12 }}>
          {activeCategory ? '— 已显示该分类全部商品 —' : '— 已显示全部推荐商品 —'}
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
                              {`通道${idx + 1}`}
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
                            <span style={{ color: '#333' }}>{Math.round((ch.success_rate || 0) * 100)}%</span>
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <span style={{ color: '#999' }}>最后失败时间：</span>
                            <span style={{ color: level === 'red' ? '#cf1322' : '#666' }}>
                              {ch.last_fail_time ? formatDateTime(ch.last_fail_time) : '无'}
                            </span>
                          </div>
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

      {promoDetailModal.open && promoDetailModal.productId && (() => {
        const product = getCurrentProduct(promoDetailModal.productId);
        const priceEst = product ? (priceEstimates[product.id] || { loading: false, finalPrice: product.price, originalPrice: product.price, discount: 0 }) : null;
        const applicablePromos = product?.applicablePromotions || [];
        
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
                <div style={{ fontSize: 13, color: '#d46b08', marginBottom: 8 }}>
                  商品：<span style={{ color: '#333', fontWeight: 500 }}>{product?.name || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 12, color: '#999' }}>原价</span>
                    <div style={{ fontSize: 14, color: '#999', textDecoration: 'line-through' }}>
                      ¥{priceEst?.originalPrice.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: '#999' }}>实付</span>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#ff4d4f' }}>
                      ¥{priceEst?.finalPrice.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: '#999' }}>已省</span>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#52c41a' }}>
                      ¥{priceEst?.discount.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12 }}>
                  可用优惠组合
                </div>
                {applicablePromos.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {applicablePromos.map((promo: any, idx: number) => {
                      const promoInfo = promotions.find(p => p.id === promo.id) || {};
                      const promoType = (promoInfo as any).type || 'unknown';
                      const promoName = (promoInfo as any).name || '系统优惠';
                      const isStackable = promo.stackable;
                      
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: 12,
                            borderRadius: 10,
                            background: getPromoGradient(promoType),
                            border: '1px solid #f0f0f0',
                            position: 'relative'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                              {promoName}
                            </div>
                            {isStackable && (
                              <span style={{
                                fontSize: 10,
                                padding: '2px 6px',
                                borderRadius: 6,
                                background: '#fff',
                                color: '#fa8c16',
                                fontWeight: 500
                              }}>
                                可叠加
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                            {getPromoTypeLabel(promoType)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : promotions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {promotions.slice(0, 3).map((promo: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          background: getPromoGradient(promo.type),
                          border: '1px solid #f0f0f0'
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                          {promo.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                          {getPromoTypeLabel(promo.type)}
                          {promo.rules?.stackable ? ' · 可叠加' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#999', fontSize: 13 }}>
                    暂无可用优惠
                  </div>
                )}
              </div>

              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid #f0f0f0',
                fontSize: 11, color: '#999', textAlign: 'center'
              }}>
                实际优惠以结算页为准
              </div>
            </div>
          </div>
        );
      })()}

      {commissionDetailModal.open && commissionDetailModal.productId && (() => {
        const product = getCurrentProduct(commissionDetailModal.productId);
        const priceEst = product ? (priceEstimates[product.id] || { loading: false, finalPrice: product.price, originalPrice: product.price, discount: 0 }) : null;
        const basePrice = priceEst?.finalPrice || product?.price || 0;
        const commissionRate = product?.commission_rate || 0.08;
        
        const l1Commission = basePrice * COMMISSION_RATES.level1;
        const l2Commission = basePrice * COMMISSION_RATES.level2;
        const l3Commission = basePrice * COMMISSION_RATES.level3;
        const totalCommission = l1Commission + l2Commission + l3Commission;
        
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
                <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                  商品：<span style={{ color: '#333', fontWeight: 500 }}>{product?.name || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 12, color: '#999' }}>预估实付</span>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>
                      ¥{basePrice.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: '#999' }}>总佣金率</span>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#52c41a' }}>
                      {((COMMISSION_RATES.level1 + COMMISSION_RATES.level2 + COMMISSION_RATES.level3) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 12, color: '#999' }}>预估总佣金</span>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>
                      ¥{totalCommission.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12 }}>
                  三级分销佣金预估
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{
                    padding: 14,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f0ff 100%)',
                    border: '1px solid #d6e4ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white', fontSize: 13, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        L1
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>直推好友</div>
                        <div style={{ fontSize: 11, color: '#999' }}>一级分销</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#667eea' }}>
                        ¥{l1Commission.toFixed(2)}
                      </div>
                      <div style={{ fontSize: 11, color: '#999' }}>
                        {(COMMISSION_RATES.level1 * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: 14,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #fff0f6 0%, #ffe7f0 100%)',
                    border: '1px solid #ffadd2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #f5576c, #f093fb)',
                        color: 'white', fontSize: 13, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        L2
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>间推好友</div>
                        <div style={{ fontSize: 11, color: '#999' }}>二级分销</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#f5576c' }}>
                        ¥{l2Commission.toFixed(2)}
                      </div>
                      <div style={{ fontSize: 11, color: '#999' }}>
                        {(COMMISSION_RATES.level2 * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: 14,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
                    border: '1px solid #ffd591',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #fa8c16, #ffd666)',
                        color: 'white', fontSize: 13, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        L3
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>三级好友</div>
                        <div style={{ fontSize: 11, color: '#999' }}>三级分销</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fa8c16' }}>
                        ¥{l3Commission.toFixed(2)}
                      </div>
                      <div style={{ fontSize: 11, color: '#999' }}>
                        {(COMMISSION_RATES.level3 * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 10,
                  background: '#fafafa',
                  fontSize: 11,
                  color: '#999',
                  lineHeight: 1.6
                }}>
                  <div style={{ marginBottom: 4 }}>💡 说明：</div>
                  <div>• 佣金基于商品实付金额计算</div>
                  <div>• 订单完成后 T+7 天自动结算</div>
                  <div>• 退款将按比例扣减相应佣金</div>
                </div>
              </div>

              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid #f0f0f0',
                fontSize: 11, color: '#999', textAlign: 'center'
              }}>
                预估佣金仅供参考，实际以结算为准
              </div>
            </div>
          </div>
        );
      })()}

      {rechargeTrialModal.open && rechargeTrialModal.productId && (() => {
        const product = getCurrentProduct(rechargeTrialModal.productId);
        
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
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
                borderBottom: '1px solid #91d5ff'
              }}>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                  商品：<span style={{ color: '#333', fontWeight: 500 }}>{product?.name || '-'}</span>
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  输入手机号，实时预估充值费用
                </div>
              </div>

              <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#333',
                    marginBottom: 8
                  }}>
                    充值手机号
                  </label>
                  <input
                    type="tel"
                    placeholder="请输入11位手机号码"
                    value={rechargeTrialModal.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setRechargeTrialModal(prev => ({ ...prev, phone: val }));
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: 16,
                      border: '1px solid #d9d9d9',
                      borderRadius: 10,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    maxLength={11}
                  />
                </div>

                <button
                  onClick={handleTrialCalculate}
                  disabled={rechargeTrialModal.calculating || rechargeTrialModal.phone.length !== 11}
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'white',
                    background: rechargeTrialModal.calculating || rechargeTrialModal.phone.length !== 11
                      ? '#bfbfbf'
                      : 'linear-gradient(135deg, #667eea, #764ba2)',
                    border: 'none',
                    borderRadius: 10,
                    cursor: rechargeTrialModal.calculating || rechargeTrialModal.phone.length !== 11
                      ? 'not-allowed'
                      : 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  {rechargeTrialModal.calculating ? '计算中...' : '开始试算'}
                </button>

                {rechargeTrialModal.result && (
                  <div style={{
                    marginTop: 20,
                    padding: 16,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #fff7e6 0%, #f6ffed 100%)',
                    border: '1px solid #ffd591'
                  }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#333',
                      marginBottom: 12
                    }}>
                      📊 试算结果
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>原价</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#999', textDecoration: 'line-through' }}>
                          ¥{rechargeTrialModal.result.originalPrice.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>实付预估</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#ff4d4f' }}>
                          ¥{rechargeTrialModal.result.finalPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    {rechargeTrialModal.result.discount > 0 && (
                      <div style={{
                        marginTop: 12,
                        padding: '8px 12px',
                        background: '#f6ffed',
                        borderRadius: 8,
                        fontSize: 12,
                        color: '#52c41a',
                        textAlign: 'center',
                        fontWeight: 500
                      }}>
                        🎉 已为您节省 ¥{rechargeTrialModal.result.discount.toFixed(2)}
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
                试算结果仅供参考，实际以结算为准
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
