import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productApi, orderApi } from '../api/modules';
import { useToast, useUser } from '../App';
import Header from '../components/Header';

interface AccountValidation {
  isValid: boolean;
  isVirtual: boolean;
  carrier: string;
  carrierType: 'mobile' | 'unicom' | 'telecom' | 'unknown';
  message: string;
  virtualTip?: string;
}

interface AlternativesState {
  loading: boolean;
  data: any;
}

interface ConfirmModalState {
  visible: boolean;
  calculating: boolean;
  finalPrice: number | null;
  originalPrice: number | null;
  savedAmount: number | null;
}

interface PreCheckResult {
  accountOk: boolean;
  accountMessage: string;
  promoCount: number;
  totalSaved: number;
  finalPay: number;
  channelTotal: number;
  channelActive: number;
  hasFallback: boolean;
  passed: boolean;
  failReason: string;
}

interface ErrorCodeItem {
  code: string;
  reason: string;
  solution: string;
  retryable: boolean;
}

const ERROR_CODE_TABLE: ErrorCodeItem[] = [
  { code: 'SUPPLIER_TIMEOUT', reason: '供应商响应超时', solution: '请稍后重试，或切换其他通道', retryable: true },
  { code: 'SUPPLIER_ERROR', reason: '供应商接口异常', solution: '请稍后重试，或联系客服', retryable: true },
  { code: 'INVALID_ACCOUNT', reason: '充值账号无效', solution: '请检查充值账号是否正确', retryable: false },
  { code: 'INSUFFICIENT_BALANCE', reason: '供应商余额不足', solution: '请稍后重试，系统将自动切换通道', retryable: true },
  { code: 'PRODUCT_OFFLINE', reason: '商品已下架', solution: '请选择其他商品', retryable: false },
  { code: 'CHANNEL_ERROR', reason: '通道异常', solution: '请稍后重试，系统将自动切换通道', retryable: true },
  { code: 'STOCK_INSUFFICIENT', reason: '库存不足', solution: '请减少购买数量或选择其他商品', retryable: false },
  { code: 'RISK_REJECTED', reason: '风控拦截', solution: '请稍后再试或联系客服', retryable: true },
  { code: 'ORDER_DUPLICATE', reason: '订单重复提交', solution: '请查看订单列表确认状态', retryable: false },
  { code: 'UNKNOWN_ERROR', reason: '未知错误', solution: '请联系客服处理', retryable: true }
];

function formatSyncTime(timestamp: number): string {
  if (!timestamp) return '-';
  const now = Date.now();
  const diff = now - timestamp * 1000;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (minutes < 1) return '刚刚同步';
  if (minutes < 60) return minutes + '分钟前同步';
  if (hours < 24) return hours + '小时前同步';
  const days = Math.floor(hours / 24);
  return days + '天前同步';
}

function getStockStatus(stock: number, stockWarning: number = 10) {
  if (stock === 0) return { text: '缺货', cls: 'none' };
  if (stock <= stockWarning) return { text: `仅剩${stock}件`, cls: 'less' };
  return { text: '库存充足', cls: '' };
}

const CARRIER_CONFIG: Record<string, { logo: string; color: string; bgColor: string; borderColor: string }> = {
  mobile: { logo: '📱', color: '#1890ff', bgColor: '#e6f7ff', borderColor: '#91d5ff' },
  unicom: { logo: '🍊', color: '#fa8c16', bgColor: '#fff7e6', borderColor: '#ffd591' },
  telecom: { logo: '🔵', color: '#52c41a', bgColor: '#f6ffed', borderColor: '#b7eb8f' },
  unknown: { logo: '❓', color: '#8c8c8c', bgColor: '#f5f5f5', borderColor: '#d9d9d9' }
};

const PROMO_ICONS: Record<string, string> = {
  full_reduction: '🏷️',
  percentage: '📉',
  new_user: '🆕',
  cashback: '💰',
  coupon: '🎫',
  other: '🎁'
};

function validatePhone(phone: string): AccountValidation {
  if (!phone) return { isValid: false, isVirtual: false, carrier: '', carrierType: 'unknown', message: '' };

  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return { isValid: false, isVirtual: false, carrier: '', carrierType: 'unknown', message: '请输入正确的11位手机号' };
  }

  const virtualPrefixes = ['170', '171', '162', '165', '167', '1349', '1705', '1709'];
  const isVirtual = virtualPrefixes.some(prefix => phone.startsWith(prefix));

  let carrier = '';
  let carrierType: 'mobile' | 'unicom' | 'telecom' | 'unknown' = 'unknown';

  const mobilePrefixes = ['139', '138', '137', '136', '135', '134', '150', '151', '152', '157', '158', '159', '182', '183', '184', '187', '188', '178', '198', '147', '148'];
  const unicomPrefixes = ['130', '131', '132', '155', '156', '185', '186', '176', '145', '146', '166', '175', '1704', '1707', '1708', '1709'];
  const telecomPrefixes = ['133', '153', '177', '173', '180', '181', '189', '199', '1700', '1701', '1702', '162', '141', '149'];

  if (mobilePrefixes.some(prefix => phone.startsWith(prefix))) {
    carrier = '中国移动';
    carrierType = 'mobile';
  } else if (unicomPrefixes.some(prefix => phone.startsWith(prefix))) {
    carrier = '中国联通';
    carrierType = 'unicom';
  } else if (telecomPrefixes.some(prefix => phone.startsWith(prefix))) {
    carrier = '中国电信';
    carrierType = 'telecom';
  } else {
    carrier = '未知运营商';
    carrierType = 'unknown';
  }

  let message = '';
  let virtualTip = '';
  if (isVirtual) {
    message = '该号段为虚拟运营商号段，可能充值失败，请确认归属地';
    virtualTip = '建议确认号段支持后再下单，避免充值失败';
  } else if (carrier) {
    message = `已识别：${carrier}`;
  }

  return { isValid: true, isVirtual, carrier, carrierType, message, virtualTip };
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useUser();
  const [product, setProduct] = useState<any>(null);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [alternatives, setAlternatives] = useState<AlternativesState>({ loading: false, data: null });
  const [form, setForm] = useState({ account: '', quantity: 1 });
  const [priceResult, setPriceResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [expandedPromo, setExpandedPromo] = useState<string | null>(null);
  const [expandedDiscount, setExpandedDiscount] = useState<number | null>(null);
  const [expandedSupplier, setExpandedSupplier] = useState<boolean>(true);
  const [expandedCommissionFaq, setExpandedCommissionFaq] = useState<number | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<number>(0);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [accountValidation, setAccountValidation] = useState<AccountValidation>({ isValid: true, isVirtual: false, carrier: '', carrierType: 'unknown', message: '' });
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    visible: false,
    calculating: false,
    finalPrice: null,
    originalPrice: null,
    savedAmount: null
  });
  const [showErrorCodeModal, setShowErrorCodeModal] = useState(false);
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (product) {
      calculate();
      loadAlternatives();
    }
  }, [product, form.quantity]);

  useEffect(() => {
    const isPhone = product && (
      product?.sku_type === 'recharge' ||
      product?.category_id?.includes('phone') ||
      product?.category_name?.includes('话费') ||
      product?.category_name?.includes('流量')
    );
    if (isPhone && form.account) {
      setAccountValidation(validatePhone(form.account));
    } else {
      setAccountValidation({ isValid: true, isVirtual: false, carrier: '', carrierType: 'unknown', message: '' });
    }
  }, [form.account, product]);

  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    };
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, promoRes] = await Promise.all([
        productApi.getProductDetail(id!),
        productApi.getPromotions()
      ]);
      if (prodRes.success) {
        setProduct(prodRes.data);
      }
      if (promoRes.success) {
        setPromotions(promoRes.data || []);
      }
    } catch (e: any) {
      toast.show(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAlternatives = async () => {
    if (!id) return;
    setAlternatives({ loading: true, data: null });
    try {
      const res = await productApi.getAlternatives(id);
      if (res.success) {
        setAlternatives({ loading: false, data: res.data });
      }
    } catch {
      setAlternatives({ loading: false, data: null });
    }
  };

  const calculate = async () => {
    if (!product) return;
    try {
      const res: any = await productApi.calculatePrice({
        items: [{
          productId: product.id,
          quantity: form.quantity
        }]
      });
      if (res.success) {
        setPriceResult(res.data);
      }
    } catch {
    }
  };

  const getPlaceholder = () => {
    if (!product) return '请输入充值账号';
    if (product.category_name?.includes('话费') || product.category_name?.includes('流量')) {
      return '请输入11位手机号码';
    }
    if (product.name?.includes('会员')) return '请输入手机号/账号';
    return '请输入收货手机号';
  };

  const isPhoneProduct = product && (
    product?.sku_type === 'recharge' ||
    product?.category_id?.includes('phone') ||
    product?.category_name?.includes('话费') ||
    product?.category_name?.includes('流量')
  );

  const getPreCheckResult = (): PreCheckResult => {
    const channelTotal = product?.channels?.length || product?.channelCount || 0;
    const channelActive = product?.channels?.filter((c: any) => c.status === 'active').length || Math.max(0, channelTotal - 1);
    const promoCount = priceResult?.discountDetails?.length || 0;
    const fallbackAmount = (product?.price ?? 0) * form.quantity;
    const originalAmount = priceResult?.originalAmount ?? fallbackAmount;
    const finalAmount = priceResult?.finalAmount ?? fallbackAmount;
    const totalSaved = Math.max(0, originalAmount - finalAmount);

    let accountOk = true;
    let accountMessage = '';
    if (isPhoneProduct) {
      if (!form.account) {
        accountOk = false;
        accountMessage = '请输入充值手机号';
      } else if (!accountValidation.isValid) {
        accountOk = false;
        accountMessage = accountValidation.message || '手机号格式错误';
      } else if (accountValidation.isVirtual) {
        accountOk = true;
        accountMessage = '虚拟号段，请谨慎下单';
      } else {
        accountOk = true;
        accountMessage = accountValidation.carrier || '已识别运营商';
      }
    } else {
      if (!form.account) {
        accountOk = false;
        accountMessage = '请输入充值账号';
      } else {
        accountOk = true;
        accountMessage = '账号格式正确';
      }
    }

    const stockOk = (product?.stock ?? 0) >= form.quantity;
    const channelOk = channelActive > 0;
    const passed = accountOk && stockOk && channelOk;

    let failReason = '';
    if (!accountOk) failReason = accountMessage;
    else if (!stockOk) failReason = '库存不足';
    else if (!channelOk) failReason = '暂无可用通道';

    return {
      accountOk,
      accountMessage,
      promoCount,
      totalSaved,
      finalPay: finalAmount,
      channelTotal,
      channelActive,
      hasFallback: product?.hasFallback || false,
      passed,
      failReason
    };
  };

  const preCheck = getPreCheckResult();

  const openConfirmModal = async () => {
    if (!user) {
      return navigate('/login', { state: { from: location.pathname } });
    }
    if (!preCheck.passed) {
      return toast.show(preCheck.failReason || '预检未通过', 'error');
    }
    if (!product || product.stock < form.quantity) {
      return toast.show('库存不足', 'error');
    }

    setConfirmModal({
      visible: true,
      calculating: true,
      finalPrice: null,
      originalPrice: null,
      savedAmount: null
    });

    try {
      const res: any = await productApi.calculatePrice({
        items: [{
          productId: product.id,
          quantity: form.quantity,
          account: form.account
        }]
      });
      if (res.success) {
        const finalAmount = res.data.finalAmount ?? 0;
        const originalAmount = res.data.originalAmount ?? (product.price * form.quantity);
        setConfirmModal({
          visible: true,
          calculating: false,
          finalPrice: finalAmount,
          originalPrice: originalAmount,
          savedAmount: originalAmount - finalAmount
        });
        setPriceResult(res.data);
      } else {
        toast.show(res.message || '价格计算失败', 'error');
        setConfirmModal({ visible: false, calculating: false, finalPrice: null, originalPrice: null, savedAmount: null });
      }
    } catch (e: any) {
      toast.show(e.message || '价格计算失败', 'error');
      setConfirmModal({ visible: false, calculating: false, finalPrice: null, originalPrice: null, savedAmount: null });
    }
  };

  const closeConfirmModal = () => {
    if (!ordering) {
      setConfirmModal({ visible: false, calculating: false, finalPrice: null, originalPrice: null, savedAmount: null });
    }
  };

  const startPolling = (orderId: string) => {
    let pollCount = 0;
    const maxPolls = 15;

    pollingTimerRef.current = setInterval(async () => {
      pollCount++;
      try {
        const res: any = await orderApi.detail(orderId);
        if (res.success) {
          const status = res.data.status;
          if (status === 'completed') {
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
            if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
            const commissionAmount = (res.data.final_amount || 0) * (product?.commission_rate || 0.08);
            toast.show(`充值成功，预计5分钟到账 | 返佣 ¥${commissionAmount.toFixed(2)} 预计T+7到账`, 'success');
            navigate(`/order/${orderId}`);
          } else if (status === 'failed') {
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
            if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
            toast.show('充值失败', 'error');
            navigate(`/order/${orderId}?expandDiagnostic=1`);
          }
        }
      } catch {
      }

      if (pollCount >= maxPolls) {
        if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
        toast.show('充值处理中，请在订单详情查看进度', 'info');
        navigate(`/order/${orderId}`);
      }
    }, 2000);

    pollingTimeoutRef.current = setTimeout(() => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      toast.show('充值处理超时，请在订单详情查看状态', 'info');
      navigate(`/order/${orderId}`);
    }, 30000);
  };

  const doOrder = async () => {
    setOrdering(true);
    try {
      const res: any = await orderApi.create({
        productId: id,
        rechargeAccount: form.account,
        quantity: form.quantity
      });
      if (res.success) {
        const orderId = res.data.id;
        setConfirmModal({ visible: false, calculating: false, finalPrice: null, originalPrice: null, savedAmount: null });
        toast.show('订单创建成功，正在支付...', 'info');

        setTimeout(async () => {
          try {
            const payRes: any = await orderApi.pay(orderId);
            if (payRes.success) {
              const payStatus = payRes.data?.status || res.data.status;
              const commissionAmount = (confirmModal.finalPrice || 0) * (product?.commission_rate || 0.08);

              if (payStatus === 'completed') {
                toast.show(`充值成功，预计5分钟到账 | 返佣 ¥${commissionAmount.toFixed(2)} 预计T+7到账`, 'success');
                navigate(`/order/${orderId}`);
              } else if (payStatus === 'failed') {
                toast.show('充值失败', 'error');
                navigate(`/order/${orderId}?expandDiagnostic=1`);
              } else if (payStatus === 'processing') {
                toast.show('充值中...', 'info');
                startPolling(orderId);
              } else {
                navigate(`/order/${orderId}`);
              }
            } else {
              toast.show(payRes.message || '支付失败', 'error');
              navigate(`/order/${orderId}`);
            }
          } catch (pe: any) {
            toast.show(pe.message || '支付失败', 'error');
            navigate(`/order/${orderId}`);
          }
        }, 500);
      }
    } catch (e: any) {
      toast.show(e.message || '下单失败', 'error');
    } finally {
      setOrdering(false);
    }
  };

  const getPromoTypeLabel = (type: string) => {
    switch (type) {
      case 'full_reduction': return '满减';
      case 'percentage': return '折扣';
      case 'new_user': return '新人';
      case 'cashback': return '返佣';
      case 'coupon': return '优惠券';
      default: return '优惠';
    }
  };

  const getPromoTypeColor = (type: string) => {
    switch (type) {
      case 'full_reduction': return { bg: 'linear-gradient(135deg, #ff9a9e, #fecfef)', color: '#c0443c' };
      case 'percentage': return { bg: 'linear-gradient(135deg, #a8edea, #fed6e3)', color: '#237804' };
      case 'new_user': return { bg: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#ffffff' };
      case 'cashback': return { bg: 'linear-gradient(135deg, #ffecd2, #fcb69f)', color: '#d46b08' };
      case 'coupon': return { bg: 'linear-gradient(135deg, #ffd666, #ff9c6e)', color: '#ad4e00' };
      default: return { bg: '#f0f0f0', color: '#666' };
    }
  };

  const getPromoValueLabel = (d: any) => {
    switch (d.type) {
      case 'full_reduction':
        return `满${d.threshold || d.rules?.threshold || 'X'}减${d.value || d.rules?.value || 'Y'}`;
      case 'percentage':
        return `${(d.value || d.rules?.value || 1) * 100}折`;
      case 'new_user':
        return `新人专享减¥${d.value || d.rules?.value || '0'}`;
      case 'cashback':
        return `返¥${d.value || d.rules?.value || '0'}`;
      case 'coupon':
        return `减¥${d.value || d.rules?.value || '0'}`;
      default:
        return '';
    }
  };

  const groupDiscountsByType = (details: any[]) => {
    const groups: Record<string, { label: string; amount: number; items: any[] }> = {
      full_reduction: { label: '满减', amount: 0, items: [] },
      percentage: { label: '折扣', amount: 0, items: [] },
      new_user: { label: '新人', amount: 0, items: [] },
      cashback: { label: '返佣', amount: 0, items: [] },
      coupon: { label: '优惠券', amount: 0, items: [] },
      other: { label: '其他', amount: 0, items: [] }
    };
    details.forEach(d => {
      const type = d.type || 'other';
      if (groups[type]) {
        groups[type].amount += d.discountAmount;
        groups[type].items.push(d);
      } else {
        groups.other.amount += d.discountAmount;
        groups.other.items.push(d);
      }
    });
    return groups;
  };

  const handleSwitchSupplier = (altId: string) => {
    navigate(`/product/${altId}`);
  };

  const commissionFaqList = [
    { q: '返佣什么时候到账？', a: '订单完成后T+7天自动结算到账户余额。T为订单确认收货/充值成功的日期。' },
    { q: '最低提现金额是多少？', a: '最低提现金额为¥10，提现手续费1%（最低¥0.1），单笔最高¥50000。' },
    { q: '退款了佣金怎么算？', a: '若订单发生全额退款，已结算的佣金将从余额中追回；部分退款则按比例扣减。未结算的佣金直接取消。' },
    { q: '三级分销比例是多少？', a: 'L1（直推）8%，L2（间推）4%，L3（三级）2%。比例基于商品实付金额计算。' },
    { q: '佣金可以直接消费吗？', a: '可以。佣金到账后可直接用于充值消费，或提现到微信/支付宝。' }
  ];

  if (loading || !product) {
    return (
      <div>
        <Header title="商品详情" />
        <div className="empty-state"><div className="icon">⏳</div>加载中...</div>
      </div>
    );
  }

  const stock = getStockStatus(product.stock, product.stock_warning);
  const channelCount = product.channelCount || product.channels?.length || 0;
  const commissionRate = product.commission_rate || 0.08;
  const commission = (priceResult?.finalAmount || product.price * form.quantity) * commissionRate;
  const discountGroups = priceResult?.discountDetails ? groupDiscountsByType(priceResult.discountDetails) : null;
  const hasStackablePromo = product.applicablePromotions?.some((p: any) => p.stackable) ?? false;
  const totalDiscount = priceResult?.originalAmount && priceResult?.finalAmount
    ? priceResult.originalAmount - priceResult.finalAmount
    : 0;
  const originalPrice = priceResult?.originalAmount ?? (product.price * form.quantity);
  const finalPrice = priceResult?.finalAmount ?? (product.price * form.quantity);

  const getAccountStatusCard = () => {
    if (!isPhoneProduct) {
      if (!form.account) {
        return { status: 'none', text: '请输入充值账号', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' };
      }
      return { status: 'ok', text: '账号格式正确', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' };
    }
    if (!form.account) {
      return { status: 'none', text: '请输入手机号', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' };
    }
    if (!accountValidation.isValid) {
      return { status: 'error', text: '❌ ' + (accountValidation.message || '格式错误'), color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' };
    }
    if (accountValidation.isVirtual) {
      return { status: 'warn', text: '⚠️ 虚拟号段 ' + (accountValidation.carrier || ''), color: '#d46b08', bg: '#fffbe6', border: '#ffe58f' };
    }
    return { status: 'ok', text: '✅ ' + (accountValidation.carrier || '已识别运营商'), color: '#389e0d', bg: '#f6ffed', border: '#b7eb8f' };
  };

  const accountCard = getAccountStatusCard();

  return (
    <div style={{ paddingBottom: 90 }}>
      <Header title="商品详情" />

      <div style={{
        height: 180,
        background: 'linear-gradient(135deg, #667eea33 0%, #764ba233 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 48, fontWeight: 700, color: '#667eea',
        margin: 16, borderRadius: 16, letterSpacing: 2
      }}>
        {product.name?.slice(0, 8) || '商品图片'}
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
              {product.is_hot === 1 && <span className="hot-tag">HOT 热卖</span>}
              <span className="tag tag-blue">{product.sku_type === 'card' ? '卡密发货' : '官方直充'}</span>
              <span className="tag tag-gray">{product.supplier_name || '官方供应商'}</span>
              {channelCount > 1 && <span className="tag tag-purple" style={{ background: '#f9f0ff', color: '#722ed1', border: '1px solid #d3adf7' }}>🔄 多通道</span>}
              {product.hasFallback && <span className="tag tag-cyan" style={{ background: '#e6fffb', color: '#13c2c2', border: '1px solid #87e8de' }}>🛡️ 降级备用</span>}
              {hasStackablePromo && <span className="tag tag-orange">可叠加优惠</span>}
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, lineHeight: 1.4 }}>{product.name}</h2>
          </div>
        </div>

        <div className="divider" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <div style={{ textAlign: 'center' }}>
            <div className={`text-sm ${stock.cls === 'none' ? 'text-red' : stock.cls === 'less' ? 'text-orange' : 'text-green'}`}>{stock.text}</div>
            <div className="text-sm text-gray" style={{ marginTop: 4 }}>库存状态</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="text-sm text-bold">{channelCount} 个</div>
            <div className="text-sm text-gray" style={{ marginTop: 4 }}>通道数量</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="text-sm text-bold">{formatSyncTime(product.lastSync)}</div>
            <div className="text-sm text-gray" style={{ marginTop: 4 }}>最后同步</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <div style={{
          background: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
          borderRadius: 16,
          padding: '20px 16px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(255,77,79,0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: -20, right: -20,
            width: 80, height: 80,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute',
            bottom: -30, left: -10,
            width: 100, height: 100,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '50%'
          }} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 6, position: 'relative', zIndex: 1 }}>叠加优惠后实付价</div>
          <div style={{ color: 'white', fontWeight: 800, letterSpacing: -1, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
            <span style={{ fontSize: 36, fontWeight: 700, marginRight: 2 }}>¥</span>
            <span style={{ fontSize: 52, lineHeight: 1 }}>{finalPrice.toFixed(2)}</span>
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
            <span style={{
              color: 'rgba(255,255,255,0.7)',
              textDecoration: 'line-through',
              fontSize: 14
            }}>
              原价 ¥{originalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 14 }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ color: '#52c41a', fontWeight: 700, fontSize: 15 }}>
              🎉 已节省 ¥{totalDiscount.toFixed(2)}
            </div>
          </div>
          <div style={{ width: 1, background: '#f0f0f0' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ color: '#fa8c16', fontWeight: 700, fontSize: 15 }}>
              💰 预计返佣 ¥{commission.toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              (L1 {Math.round(commissionRate * 100)}%)
            </div>
          </div>
        </div>
      </div>

      {priceResult?.discountDetails?.length > 0 && (
        <div className="card" style={{ marginTop: 0 }}>
          <div className="flex-between mb-12">
            <span className="text-bold" style={{ fontSize: 15 }}>🎁 优惠明细</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="tag tag-orange" style={{ fontSize: 10, padding: '1px 6px' }}>
                已叠加{priceResult.discountDetails.length}项
              </span>
              <span className="text-sm text-gray">共省¥{totalDiscount.toFixed(2)}</span>
            </div>
          </div>

          <div style={{
            padding: '8px 12px',
            background: '#fff7e6',
            border: '1px solid #ffd591',
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 12,
            color: '#d46b08',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            ✨ 以下优惠已自动叠加，享受最优价格
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {priceResult.discountDetails.map((d: any, i: number) => {
              const colorConfig = getPromoTypeColor(d.type);
              const isExpanded = expandedDiscount === i;
              const icon = PROMO_ICONS[d.type] || PROMO_ICONS.other;
              return (
                <div key={i} style={{
                  borderRadius: 12,
                  border: `1px solid ${isExpanded ? '#ffd591' : '#f0f0f0'}`,
                  background: isExpanded ? '#fffbe6' : '#fafafa',
                  overflow: 'hidden',
                  transition: 'all 0.2s'
                }}>
                  <div
                    style={{
                      padding: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer'
                    }}
                    onClick={() => setExpandedDiscount(isExpanded ? null : i)}
                  >
                    <span style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: colorConfig.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      flexShrink: 0
                    }}>
                      {icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13,
                        color: '#333',
                        fontWeight: 600,
                        marginBottom: 2
                      }}>
                        {d.name || getPromoValueLabel(d)}
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: '#999',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {getPromoTypeLabel(d.type)} · {d.description || d.rules?.description || getPromoValueLabel(d)}
                      </div>
                    </div>
                    <span style={{
                      color: '#52c41a',
                      fontWeight: 700,
                      fontSize: 14,
                      flexShrink: 0
                    }}>
                      -¥{d.discountAmount.toFixed(2)}
                    </span>
                    <span style={{
                      fontSize: 12,
                      color: '#999',
                      flexShrink: 0,
                      transition: 'transform 0.2s',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>▼</span>
                  </div>
                  {isExpanded && (
                    <div style={{
                      padding: '0 12px 12px 12px',
                      borderTop: '1px dashed #ffe58f',
                      paddingTop: 10,
                      marginLeft: 4,
                      marginRight: 4,
                      marginBottom: 4
                    }}>
                      <div style={{ fontSize: 12, lineHeight: 2, color: '#666' }}>
                        <div style={{ display: 'flex' }}>
                          <span style={{ color: '#999', width: 68, flexShrink: 0 }}>优惠类型：</span>
                          <span>{getPromoTypeLabel(d.type)}</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                          <span style={{ color: '#999', width: 68, flexShrink: 0 }}>优惠名称：</span>
                          <span>{d.name || '系统自动优惠'}</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                          <span style={{ color: '#999', width: 68, flexShrink: 0 }}>优惠描述：</span>
                          <span style={{ flex: 1 }}>{d.description || d.rules?.description || '暂无详细描述'}</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                          <span style={{ color: '#999', width: 68, flexShrink: 0 }}>优惠规则：</span>
                          <span>{getPromoValueLabel(d)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ color: '#999', width: 68, flexShrink: 0 }}>节省金额：</span>
                          <span style={{ color: '#52c41a', fontWeight: 600 }}>¥{d.discountAmount.toFixed(2)}</span>
                        </div>
                        {d.stackable && (
                          <div style={{ display: 'flex', color: '#fa8c16' }}>
                            <span style={{ width: 68, flexShrink: 0 }}></span>
                            <span>✓ 可与其他优惠叠加使用</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px dashed #e8e8e8'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6
            }}>
              <span style={{ fontSize: 12, color: '#666' }}>
                已叠加 <span style={{ color: '#fa8c16', fontWeight: 600 }}>{priceResult.discountDetails.length}</span> 项优惠
              </span>
              <span style={{ fontSize: 14, color: '#52c41a', fontWeight: 700 }}>
                共省 ¥{totalDiscount.toFixed(2)}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#999', lineHeight: 1.5 }}>
              💡 优惠以最终下单为准，部分优惠不可叠加
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 0 }}>
        <div className="text-bold mb-12" style={{ fontSize: 15 }}>💰 返佣结算口径说明</div>

        <div style={{
          background: 'linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%)',
          borderRadius: 12,
          padding: '14px',
          marginBottom: 14
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 10 }}>三级分销佣金比例</div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700,
                margin: '0 auto 6px',
                boxShadow: '0 2px 8px rgba(102,126,234,0.4)'
              }}>L1</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#667eea' }}>8%</div>
              <div style={{ fontSize: 10, color: '#999' }}>直推好友</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f5576c, #f093fb)',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700,
                margin: '0 auto 6px',
                boxShadow: '0 2px 8px rgba(245,87,108,0.4)'
              }}>L2</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f5576c' }}>4%</div>
              <div style={{ fontSize: 10, color: '#999' }}>间推好友</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fa8c16, #ffd666)',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700,
                margin: '0 auto 6px',
                boxShadow: '0 2px 8px rgba(250,140,22,0.4)'
              }}>L3</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fa8c16' }}>2%</div>
              <div style={{ fontSize: 10, color: '#999' }}>三级好友</div>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          marginBottom: 14
        }}>
          <div style={{
            padding: '10px 8px',
            background: '#f0f5ff',
            borderRadius: 8,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 12, color: '#667eea', fontWeight: 600 }}>T+7到账</div>
            <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>订单完成后</div>
          </div>
          <div style={{
            padding: '10px 8px',
            background: '#f6ffed',
            borderRadius: 8,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 12, color: '#52c41a', fontWeight: 600 }}>最低¥10提现</div>
            <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>手续费1%</div>
          </div>
          <div style={{
            padding: '10px 8px',
            background: '#fff1f0',
            borderRadius: 8,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 12, color: '#ff4d4f', fontWeight: 600 }}>退款追回</div>
            <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>按比例扣减</div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 12 }}>📅 结算时间线</div>
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            {[
              { title: '下单支付', desc: '佣金进入冻结状态', color: '#1890ff', done: true },
              { title: '充值/发货成功', desc: '订单状态变为已完成', color: '#1890ff', done: true },
              { title: 'T+7个自然日', desc: '等待售后期结束', color: '#faad14', done: false },
              { title: '自动结算', desc: '佣金解冻到账余额', color: '#52c41a', done: false },
              { title: '提现/消费', desc: '自由支配佣金', color: '#52c41a', done: false }
            ].map((step, idx) => (
              <div key={idx} style={{ display: 'flex', position: 'relative', paddingBottom: idx < 4 ? 16 : 0 }}>
                <div style={{
                  position: 'absolute',
                  left: -24,
                  width: 20, height: 20,
                  borderRadius: '50%',
                  background: step.color,
                  color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600,
                  zIndex: 1
                }}>
                  {step.done ? '✓' : idx + 1}
                </div>
                {idx < 4 && (
                  <div style={{
                    position: 'absolute',
                    left: -15,
                    top: 20,
                    width: 2,
                    height: 'calc(100% - 4px)',
                    background: '#f0f0f0'
                  }} />
                )}
                <div style={{ flex: 1, paddingLeft: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{step.title}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 10 }}>❓ 常见问题</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {commissionFaqList.map((faq, idx) => {
              const isExpanded = expandedCommissionFaq === idx;
              return (
                <div key={idx} style={{
                  borderRadius: 10,
                  border: `1px solid ${isExpanded ? '#bae7ff' : '#f0f0f0'}`,
                  background: isExpanded ? '#e6f7ff' : '#fafafa',
                  overflow: 'hidden'
                }}>
                  <div
                    style={{
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer'
                    }}
                    onClick={() => setExpandedCommissionFaq(isExpanded ? null : idx)}
                  >
                    <span style={{ fontSize: 14 }}>Q</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#333' }}>{faq.q}</span>
                    <span style={{
                      fontSize: 12, color: '#999',
                      transition: 'transform 0.2s',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>▼</span>
                  </div>
                  {isExpanded && (
                    <div style={{
                      padding: '0 12px 12px 36px',
                      fontSize: 12,
                      color: '#666',
                      lineHeight: 1.8,
                      borderTop: '1px dashed #91d5ff',
                      paddingTop: 8,
                      marginLeft: 4,
                      marginRight: 4,
                      marginBottom: 4
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            {isPhoneProduct ? '📱 充值手机号' : '🔢 充值账号'}
            {isPhoneProduct && <span style={{ color: '#ff4d4f' }}>*</span>}
          </label>
          <input
            className="form-input"
            type={isPhoneProduct ? 'tel' : 'text'}
            placeholder={getPlaceholder()}
            value={form.account}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 11);
              setForm({ ...form, account: val });
            }}
            style={{
              fontSize: 16,
              borderColor: isPhoneProduct && form.account ? (
                !accountValidation.isValid ? '#ff4d4f' :
                accountValidation.isVirtual ? '#faad14' : '#52c41a'
              ) : undefined,
              background: isPhoneProduct && form.account ? (
                !accountValidation.isValid ? '#fff1f0' :
                accountValidation.isVirtual ? '#fffbe6' : '#f6ffed'
              ) : undefined
            }}
            maxLength={11}
          />
          {form.account && isPhoneProduct && (
            <div style={{
              marginTop: 8,
              padding: '12px',
              borderRadius: 10,
              fontSize: 12,
              lineHeight: 1.6,
              background: !accountValidation.isValid ? '#fff1f0' :
                accountValidation.isVirtual ? '#fffbe6' : '#f6ffed',
              border: `1px solid ${!accountValidation.isValid ? '#ffa39e' :
                accountValidation.isVirtual ? '#ffe58f' : '#b7eb8f'}`,
              color: !accountValidation.isValid ? '#ff4d4f' :
                accountValidation.isVirtual ? '#d46b08' : '#389e0d'
            }}>
              {!accountValidation.isValid ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>❌</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>手机号格式错误</span>
                  </div>
                  <div style={{ marginLeft: 26 }}>{accountValidation.message}</div>
                </>
              ) : accountValidation.isVirtual ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>⚠️</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>虚拟运营商号段</span>
                  </div>
                  <div style={{ marginLeft: 26, marginBottom: 6, opacity: 0.9 }}>
                    {accountValidation.message}
                  </div>
                  <div style={{ marginLeft: 26, fontSize: 11, opacity: 0.8 }}>
                    {accountValidation.virtualTip}
                  </div>
                  {accountValidation.carrier && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      marginTop: 8,
                      marginLeft: 26,
                      padding: '4px 8px',
                      background: 'rgba(255,255,255,0.5)',
                      borderRadius: 6,
                      width: 'fit-content'
                    }}>
                      <span>{CARRIER_CONFIG[accountValidation.carrierType]?.logo || '📱'}</span>
                      <span style={{ fontSize: 11 }}>{accountValidation.carrier}</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: CARRIER_CONFIG[accountValidation.carrierType]?.bgColor || '#f5f5f5',
                    border: `1px solid ${CARRIER_CONFIG[accountValidation.carrierType]?.borderColor || '#d9d9d9'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16
                  }}>
                    {CARRIER_CONFIG[accountValidation.carrierType]?.logo || '📱'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#333' }}>
                      {accountValidation.carrier}
                    </div>
                    <div style={{ fontSize: 11, color: '#52c41a', marginTop: 2 }}>
                      ✓ 号段校验通过
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-group" style={{ marginTop: 16, marginBottom: 0 }}>
          <div className="flex-between" style={{ alignItems: 'center' }}>
            <span className="form-label" style={{ margin: 0 }}>📦 购买数量</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid #e8e8e8', background: '#fafafa',
                  fontSize: 18, fontWeight: 600
                }}
                onClick={() => form.quantity > 1 && setForm({ ...form, quantity: form.quantity - 1 })}
                disabled={form.quantity <= 1}
              >
                −
              </button>
              <span style={{ fontSize: 16, fontWeight: 600, minWidth: 30, textAlign: 'center' }}>{form.quantity}</span>
              <button
                style={{
                  width: 32, height: 32, borderRadius: 8, border: '1px solid #e8e8e8', background: '#fafafa',
                  fontSize: 18, fontWeight: 600
                }}
                onClick={() => form.quantity < 10 && setForm({ ...form, quantity: form.quantity + 1 })}
                disabled={form.quantity >= 10}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {product.stock <= 10 && product.stock > 0 && (
          <div style={{ color: '#faad14', fontSize: 12, marginTop: 12 }}>⚠️ 库存紧张，仅剩 {product.stock} 件</div>
        )}
        {product.stock === 0 && (
          <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 12 }}>❌ 暂时缺货</div>
        )}
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <div className="text-bold mb-12" style={{ fontSize: 15 }}>🔍 下单预检</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            padding: '12px',
            borderRadius: 10,
            background: accountCard.bg,
            border: `1px solid ${accountCard.border}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📱</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>充值账号校验</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: accountCard.color }}>
                {accountCard.text}
              </span>
            </div>
          </div>

          <div style={{
            padding: '12px',
            borderRadius: 10,
            background: preCheck.promoCount > 0 ? '#f6ffed' : '#fafafa',
            border: `1px solid ${preCheck.promoCount > 0 ? '#b7eb8f' : '#f0f0f0'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>💰</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>优惠预计算</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: preCheck.promoCount > 0 ? '#389e0d' : '#999' }}>
                {preCheck.promoCount > 0 ? `已选${preCheck.promoCount}项优惠 · 省¥${preCheck.totalSaved.toFixed(2)} · 实付¥${preCheck.finalPay.toFixed(2)}` : '暂无可用优惠'}
              </span>
            </div>
          </div>

          <div style={{
            padding: '12px',
            borderRadius: 10,
            background: preCheck.channelActive > 0 ? '#e6f7ff' : '#fff1f0',
            border: `1px solid ${preCheck.channelActive > 0 ? '#91d5ff' : '#ffa39e'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📡</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>通道状态</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: preCheck.channelActive > 0 ? '#1890ff' : '#ff4d4f' }}>
                {preCheck.channelActive > 0
                  ? `使用 ${preCheck.channelActive}/${preCheck.channelTotal} 正常通道${preCheck.hasFallback ? ' · 已自动切换备用' : ''}`
                  : '暂无可用通道'}
              </span>
            </div>
          </div>
        </div>

        {!preCheck.passed && (
          <div style={{
            marginTop: 12,
            padding: '10px 12px',
            background: '#fff1f0',
            border: '1px solid #ffa39e',
            borderRadius: 8,
            fontSize: 12,
            color: '#ff4d4f',
            fontWeight: 500
          }}>
            ⚠️ {preCheck.failReason}
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <div
          className="flex-between"
          style={{ cursor: 'pointer', marginBottom: expandedSupplier ? 12 : 0 }}
          onClick={() => setExpandedSupplier(!expandedSupplier)}
        >
          <span className="text-bold" style={{ fontSize: 15 }}>🔗 备选供应商</span>
          <span style={{
            fontSize: 12,
            color: '#999',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'transform 0.2s',
            transform: expandedSupplier ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>▼</span>
        </div>

        {expandedSupplier && (
          <>
            {alternatives.loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>加载中...</div>
            ) : alternatives.data?.alternatives?.length > 0 ? (
              <div>
                <div style={{
                  fontSize: 12,
                  color: '#666',
                  marginBottom: 12,
                  padding: '8px 12px',
                  background: '#f0f5ff',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>当前供应商：<span style={{ fontWeight: 600, color: '#667eea' }}>{alternatives.data.currentSupplier}</span></span>
                  {alternatives.data.hasMultiSupplier && (
                    <span className="tag tag-purple" style={{ fontSize: 10, padding: '1px 6px' }}>多供应商竞价</span>
                  )}
                </div>
                {alternatives.data.alternatives.map((alt: any, idx: number) => {
                  const successRate = alt.successRate ?? 95;
                  const isCheaper = alt.priceDiffLabel?.includes('省');
                  const isExpensive = alt.priceDiffLabel?.includes('贵');
                  return (
                    <div key={idx} style={{
                      padding: '14px',
                      marginBottom: idx < alternatives.data.alternatives.length - 1 ? 10 : 0,
                      background: '#fafafa',
                      borderRadius: 12,
                      border: `1px solid ${isCheaper ? '#b7eb8f' : isExpensive ? '#ffa39e' : '#f0f0f0'}`,
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{alt.name}</span>
                            {alt.hasFallback && (
                              <span style={{
                                fontSize: 10,
                                padding: '1px 6px',
                                borderRadius: 8,
                                background: '#e6fffb',
                                color: '#13c2c2',
                                border: '1px solid #87e8de'
                              }}>🛡️降级</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                            <span style={{
                              fontSize: 13,
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 8,
                              background: isCheaper ? '#f6ffed' : isExpensive ? '#fff1f0' : '#f5f5f5',
                              color: isCheaper ? '#52c41a' : isExpensive ? '#ff4d4f' : '#666'
                            }}>
                              {alt.priceDiffLabel || '价格相同'}
                            </span>
                            <span style={{ fontSize: 12, color: '#999' }}>
                              📊 通道 {(alt.channels?.length || 1)}个
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSwitchSupplier(alt.id)}
                          className="btn-primary"
                          style={{
                            padding: '6px 14px',
                            fontSize: 12,
                            borderRadius: 16,
                            flexShrink: 0,
                            background: isCheaper
                              ? 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'
                              : undefined
                          }}
                        >
                          切换
                        </button>
                      </div>

                      <div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 4,
                          fontSize: 11,
                          color: '#666'
                        }}>
                          <span>充值成功率</span>
                          <span style={{ fontWeight: 600, color: successRate >= 98 ? '#52c41a' : successRate >= 95 ? '#1890ff' : '#faad14' }}>
                            {successRate}%
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: 6,
                          background: '#f0f0f0',
                          borderRadius: 3,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${successRate}%`,
                            height: '100%',
                            background: successRate >= 98
                              ? 'linear-gradient(90deg, #52c41a, #73d13d)'
                              : successRate >= 95
                                ? 'linear-gradient(90deg, #1890ff, #40a9ff)'
                                : 'linear-gradient(90deg, #faad14, #ffc53d)',
                            borderRadius: 3,
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginTop: 6,
                          fontSize: 10,
                          color: '#bbb'
                        }}>
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: 13 }}>暂无备选供应商，当前已是最优选择</div>
            )}
          </>
        )}
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <div className="text-bold mb-12">📋 商品说明</div>
        <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
          {product.description || `• 本商品为虚拟商品，售出后不支持退款
• 充值完成后不可取消订单
• 如遇充值失败，系统将自动发起退款
• 请确认充值账号，避免输错造成损失
• 客服工作时间：9:00 - 22:00`}
        </div>
      </div>

      {product.channels && product.channels.length > 0 && (
        <div className="card" style={{ marginTop: 0 }}>
          <div className="flex-between mb-12">
            <span className="text-bold" style={{ fontSize: 15 }}>🔌 充值通道</span>
            <span className="text-sm text-gray">共 {product.channels.length} 个可用通道</span>
          </div>

          <div
            style={{
              padding: '14px',
              background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
              border: '1px solid #91d5ff',
              borderRadius: 12,
              cursor: 'pointer',
              position: 'relative'
            }}
            onClick={() => setShowChannelDropdown(!showChannelDropdown)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'white',
                  border: '1px solid #91d5ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18
                }}>
                  📡
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1890ff' }}>
                    当前通道：{product.channels[selectedChannel]?.name || '主通道'}
                  </div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                    {product.channels[selectedChannel]?.isMain ? '🏆 主通道推荐' : '备用通道'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#52c41a' }}>
                    {product.channels[selectedChannel]?.successRate || 98}%
                  </div>
                  <div style={{ fontSize: 10, color: '#999' }}>成功率</div>
                </div>
                <span style={{
                  fontSize: 12,
                  color: '#999',
                  transition: 'transform 0.2s',
                  transform: showChannelDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>▼</span>
              </div>
            </div>
          </div>

          {showChannelDropdown && (
            <div style={{
              marginTop: 10,
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid #e8e8e8',
              animation: 'slideDown 0.2s ease-out'
            }}>
              {product.channels.map((ch: any, i: number) => {
                const isSelected = i === selectedChannel;
                const isActive = ch.status === 'active';
                const isMain = ch.isMain || i === 0;
                const successRate = ch.successRate || (98 - i * 2);
                const arriveTime = ch.arriveTime || (1 + i) + '分钟';
                return (
                  <div
                    key={i}
                    style={{
                      padding: '12px 14px',
                      background: isSelected ? '#e6f7ff' : i % 2 === 0 ? '#fafafa' : 'white',
                      borderBottom: i < product.channels.length - 1 ? '1px solid #f0f0f0' : 'none',
                      opacity: isActive ? 1 : 0.5,
                      cursor: isActive ? 'pointer' : 'not-allowed'
                    }}
                    onClick={() => {
                      if (isActive) {
                        setSelectedChannel(i);
                        setShowChannelDropdown(false);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: isActive ? '#f6ffed' : '#f5f5f5',
                          border: `1px solid ${isActive ? '#b7eb8f' : '#d9d9d9'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14
                        }}>
                          {isActive ? '✓' : '✗'}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#333' : '#999' }}>
                            {ch.name || `通道${i + 1}`}
                            {isMain && (
                              <span style={{
                                marginLeft: 6,
                                padding: '1px 6px',
                                background: 'linear-gradient(135deg, #ffd666, #ff9c6e)',
                                color: 'white',
                                fontSize: 10,
                                borderRadius: 8,
                                fontWeight: 500
                              }}>
                                推荐
                              </span>
                            )}
                            {!isMain && isActive && (
                              <span style={{
                                marginLeft: 6,
                                padding: '1px 6px',
                                background: '#f5f5f5',
                                color: '#999',
                                fontSize: 10,
                                borderRadius: 8
                              }}>
                                备用
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                            预计{arriveTime}到账
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: successRate >= 98 ? '#52c41a' : successRate >= 95 ? '#1890ff' : '#faad14'
                        }}>
                          {successRate}%
                        </div>
                        <div style={{ fontSize: 10, color: '#999' }}>成功率</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        right: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#1890ff',
                        fontSize: 16
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 10, fontSize: 11, color: '#999', lineHeight: 1.5 }}>
            💡 系统会自动选择最优通道，如遇充值失败将自动切换备用通道
          </div>
        </div>
      )}

      {confirmModal.visible && (
        <div className="modal-mask" onClick={closeConfirmModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 0 }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px',
              color: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>确认订单信息</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>请确认以下信息无误后再支付</div>
            </div>

            <div style={{ padding: '20px' }}>
              {confirmModal.calculating ? (
                <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
                  <div style={{ color: '#666', fontSize: 14 }}>正在计算最终价格...</div>
                </div>
              ) : (
                <>
                  <div style={{
                    background: '#fafafa',
                    borderRadius: 12,
                    padding: '14px',
                    marginBottom: 14
                  }}>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>商品名称</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{product.name}</div>
                  </div>

                  <div style={{
                    background: isPhoneProduct && accountValidation.isVirtual ? '#fffbe6' : '#f6ffed',
                    border: `1px solid ${isPhoneProduct && accountValidation.isVirtual ? '#ffe58f' : '#b7eb8f'}`,
                    borderRadius: 12,
                    padding: '14px',
                    marginBottom: 14
                  }}>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                      {isPhoneProduct ? '充值手机号' : '充值账号'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#333', letterSpacing: 1 }}>
                        {isPhoneProduct ? form.account.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3') : form.account}
                      </div>
                      {isPhoneProduct && accountValidation.carrier && (
                        <span style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 10,
                          background: 'white',
                          color: '#667eea',
                          border: '1px solid #667eea33'
                        }}>
                          {accountValidation.carrier}
                        </span>
                      )}
                    </div>
                    {isPhoneProduct && accountValidation.isVirtual && (
                      <div style={{ fontSize: 11, color: '#d46b08', marginTop: 6 }}>
                        ⚠️ 虚拟号段，请确认可充值后继续
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ color: '#999', fontSize: 13 }}>购买数量</span>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>×{form.quantity}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ color: '#999', fontSize: 13 }}>商品原价</span>
                    <span style={{
                      fontSize: 14,
                      color: '#999',
                      textDecoration: 'line-through'
                    }}>¥{confirmModal.originalPrice?.toFixed(2)}</span>
                  </div>

                  {priceResult?.discountDetails?.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ color: '#999', fontSize: 13 }}>优惠明细</span>
                        <span style={{ fontSize: 12, color: '#52c41a', fontWeight: 600 }}>共{priceResult.discountDetails.length}项</span>
                      </div>
                      <div style={{ background: '#fafafa', borderRadius: 10, padding: '10px 12px' }}>
                        {priceResult.discountDetails.map((d: any, i: number) => (
                          <div key={i} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: i < priceResult.discountDetails.length - 1 ? '4px 0' : '4px 0 0'
                          }}>
                            <span style={{ fontSize: 12, color: '#666' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '1px 6px',
                                borderRadius: 6,
                                background: getPromoTypeColor(d.type).bg,
                                color: getPromoTypeColor(d.type).color,
                                fontSize: 10,
                                marginRight: 6,
                                fontWeight: 600
                              }}>{getPromoTypeLabel(d.type)}</span>
                              {d.name || getPromoValueLabel(d)}
                            </span>
                            <span style={{ fontSize: 12, color: '#52c41a', fontWeight: 600 }}>-¥{d.discountAmount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {confirmModal.savedAmount && confirmModal.savedAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ color: '#999', fontSize: 13 }}>优惠减免合计</span>
                      <span style={{ fontSize: 14, color: '#52c41a', fontWeight: 600 }}>
                        -¥{confirmModal.savedAmount.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {commission > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ color: '#999', fontSize: 13 }}>预计返佣 (L1 {Math.round(commissionRate * 100)}%)</span>
                      <span style={{ fontSize: 14, color: '#fa8c16', fontWeight: 600 }}>
                        +¥{commission.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px dashed #e8e8e8',
                    textAlign: 'right'
                  }}>
                    <button
                      onClick={() => setShowErrorCodeModal(true)}
                      style={{
                        fontSize: 12,
                        color: '#1890ff',
                        background: 'transparent',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      📋 查看错误码映射
                    </button>
                  </div>

                  <div className="divider" />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>实付金额</span>
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      color: '#ff4d4f'
                    }}>
                      <span style={{ fontSize: 18, fontWeight: 600 }}>¥</span>
                      <span style={{ fontSize: 28, fontWeight: 800 }}>{confirmModal.finalPrice?.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{
              padding: '0 20px 20px',
              display: 'flex',
              gap: 10
            }}>
              <button
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 14,
                  background: '#f5f5f5',
                  color: '#666',
                  fontSize: 14,
                  fontWeight: 600
                }}
                onClick={closeConfirmModal}
                disabled={ordering || confirmModal.calculating}
              >
                取消
              </button>
              <button
                className="btn-primary"
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: 14,
                  fontSize: 15,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
                }}
                onClick={doOrder}
                disabled={ordering || confirmModal.calculating}
              >
                {ordering ? '正在创建订单...' : `确认支付 ¥${confirmModal.finalPrice?.toFixed(2) || '0.00'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showErrorCodeModal && (
        <div className="modal-mask" onClick={() => setShowErrorCodeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>📋 常见错误码对照表</span>
              <button
                onClick={() => setShowErrorCodeModal(false)}
                style={{ background: 'transparent', fontSize: 20, color: '#999' }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '12px 20px 20px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '90px 1fr 1fr 60px',
                gap: '8px',
                fontSize: 11,
                fontWeight: 600,
                color: '#999',
                padding: '8px 0',
                borderBottom: '1px solid #f0f0f0',
                marginBottom: 8
              }}>
                <span>错误码</span>
                <span>原因</span>
                <span>建议方案</span>
                <span style={{ textAlign: 'center' }}>可重试</span>
              </div>
              {ERROR_CODE_TABLE.map((item, idx) => (
                <div key={idx} style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 1fr 1fr 60px',
                  gap: '8px',
                  fontSize: 11,
                  padding: '8px 0',
                  borderBottom: idx < ERROR_CODE_TABLE.length - 1 ? '1px solid #f5f5f5' : 'none',
                  alignItems: 'start'
                }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    background: '#ff4d4f',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 10,
                    textAlign: 'center',
                    alignSelf: 'start'
                  }}>
                    {item.code}
                  </span>
                  <span style={{ color: '#333' }}>{item.reason}</span>
                  <span style={{ color: '#666' }}>{item.solution}</span>
                  <span style={{
                    textAlign: 'center',
                    color: item.retryable ? '#52c41a' : '#ff4d4f',
                    fontWeight: 600
                  }}>
                    {item.retryable ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'white', padding: '12px 16px 20px',
        borderTop: '1px solid #eee', display: 'flex', gap: 12,
        zIndex: 100
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ color: '#999', fontSize: 11 }}>实付</span>
            <div style={{ color: '#ff4d4f', fontWeight: 800, display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>¥</span>
              <span style={{ fontSize: 24 }}>{finalPrice.toFixed(2)}</span>
            </div>
          </div>
          {totalDiscount > 0 && (
            <div style={{ fontSize: 10, color: '#52c41a', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              已省¥{totalDiscount.toFixed(2)}
            </div>
          )}
        </div>
        <button
          className="btn-primary btn-block"
          style={{
            flex: 1.5,
            padding: '12px',
            background: !preCheck.passed || product.stock === 0
              ? '#bfbfbf'
              : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 700
          }}
          onClick={openConfirmModal}
          disabled={!preCheck.passed || ordering || product.stock === 0}
        >
          {product.stock === 0 ? '暂时缺货' : !preCheck.passed ? preCheck.failReason || '预检未通过' : '立即充值'}
        </button>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tag-purple {
          background: #f9f0ff;
          color: #722ed1;
          border: 1px solid #d3adf7;
        }
        .tag-cyan {
          background: #e6fffb;
          color: #13c2c2;
          border: 1px solid #87e8de;
        }
      `}</style>
    </div>
  );
}
