import { useEffect, useState, useRef, useMemo } from 'react';
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

interface ErrorCodeDetail {
  code: string;
  label: string;
  reasons: string[];
  solutions: string[];
}

interface ChannelPriceAdjust {
  baseAdjust: number;
  percentAdjust: number;
}

const ERROR_CODE_TABLE: Array<{ code: string; reason: string; solution: string; retryable: boolean }> = [
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

const PRODUCT_ERROR_CODES: Record<string, ErrorCodeDetail> = {
  'ERR-1001': {
    code: 'ERR-1001',
    label: '号段格式错误',
    reasons: ['输入非1开头手机号', '包含非数字字符', '长度不足11位或超过11位'],
    solutions: ['请输入以1开头的11位纯数字手机号', '检查是否误输入空格或特殊字符']
  },
  'ERR-1002': {
    code: 'ERR-1002',
    label: '虚拟运营商号段',
    reasons: ['170/171号段为虚拟运营商常用号段', '162/165/167号段为新兴虚拟号段', '1349号段为卫星电话号段'],
    solutions: ['建议更换为三大运营商手机号', '如确认支持可继续下单，但可能失败']
  },
  'ERR-1003': {
    code: 'ERR-1003',
    label: '运营商不匹配',
    reasons: ['当前商品仅支持特定运营商', '手机号所属运营商不在支持列表'],
    solutions: ['请选择对应运营商的商品', '联系客服确认该号段是否支持']
  },
  'ERR-1004': {
    code: 'ERR-1004',
    label: '库存不足',
    reasons: ['当前商品库存低于购买数量', '该面值暂时缺货', '供应商临时下架'],
    solutions: ['减少购买数量后重试', '选择其他面值商品', '稍后再来查看库存']
  },
  'ERR-1005': {
    code: 'ERR-1005',
    label: '商品已下架',
    reasons: ['该商品临时维护中', '供应商停止供货', '商品已售罄'],
    solutions: ['选择同类其他商品', '稍后再试', '联系客服确认上架时间']
  },
  'ERR-1006': {
    code: 'ERR-1006',
    label: '号段地区限制',
    reasons: ['该商品仅支持特定省份充值', '手机号归属地不在支持范围', '运营商跨省充值限制'],
    solutions: ['选择支持您所在地区的商品', '查看同类型其他商品', '联系客服确认支持地区']
  },
  'ERR-1007': {
    code: 'ERR-1007',
    label: '通道维护中',
    reasons: ['主通道正在升级维护', '备用通道也在维护', '供应商系统升级'],
    solutions: ['等待维护完成后重试（通常30分钟-2小时）', '选择其他同类商品', '联系客服获取维护进度']
  },
  'ERR-1008': {
    code: 'ERR-1008',
    label: '风控异常',
    reasons: ['短时间内频繁下单被系统拦截', 'IP地址异常', '账号行为可疑'],
    solutions: ['等待24小时后再试', '更换网络环境后重试', '联系客服解除限制']
  }
};

const CARRIER_CONFIG: Record<string, { logo: string; color: string; bgColor: string; borderColor: string }> = {
  mobile: { logo: '📱', color: '#52c41a', bgColor: '#f6ffed', borderColor: '#b7eb8f' },
  unicom: { logo: '📱', color: '#ff4d4f', bgColor: '#fff1f0', borderColor: '#ffa39e' },
  telecom: { logo: '📱', color: '#1890ff', bgColor: '#e6f7ff', borderColor: '#91d5ff' },
  unknown: { logo: '❓', color: '#8c8c8c', bgColor: '#f5f5f5', borderColor: '#d9d9d9' }
};

const PROMO_ICONS: Record<string, string> = {
  full_reduction: '💰',
  percentage: '📉',
  new_user: '🎁',
  cashback: '💸',
  coupon: '🎫',
  other: '🎁'
};

const VIRTUAL_PREFIXES = ['170', '171', '162', '165', '167', '1349', '1705', '1709'];
const MOBILE_PREFIXES = ['139', '138', '137', '136', '135', '134', '150', '151', '152', '157', '158', '159', '182', '183', '184', '187', '188', '178', '198', '147', '148'];
const UNICOM_PREFIXES = ['130', '131', '132', '155', '156', '185', '186', '176', '145', '146', '166', '175', '1704', '1707', '1708', '1709'];
const TELECOM_PREFIXES = ['133', '153', '177', '173', '180', '181', '189', '199', '1700', '1701', '1702', '162', '141', '149'];

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

function validatePhone(phone: string): AccountValidation {
  if (!phone) return { isValid: false, isVirtual: false, carrier: '', carrierType: 'unknown', message: '' };

  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    if (phone.length < 11) {
      return { isValid: false, isVirtual: false, carrier: '', carrierType: 'unknown', message: `还需输入${11 - phone.length}位手机号` };
    }
    return { isValid: false, isVirtual: false, carrier: '', carrierType: 'unknown', message: '请输入正确的11位手机号（以13-19开头）' };
  }

  const isVirtual = VIRTUAL_PREFIXES.some(prefix => phone.startsWith(prefix));

  let carrier = '';
  let carrierType: 'mobile' | 'unicom' | 'telecom' | 'unknown' = 'unknown';

  if (MOBILE_PREFIXES.some(prefix => phone.startsWith(prefix))) {
    carrier = '中国移动';
    carrierType = 'mobile';
  } else if (UNICOM_PREFIXES.some(prefix => phone.startsWith(prefix))) {
    carrier = '中国联通';
    carrierType = 'unicom';
  } else if (TELECOM_PREFIXES.some(prefix => phone.startsWith(prefix))) {
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
    virtualTip = '虚拟运营商号段充值成功率约85%，建议确认号段支持后再下单';
  } else if (carrier && carrierType !== 'unknown') {
    message = `已识别：${carrier}`;
  }

  return { isValid: true, isVirtual, carrier, carrierType, message, virtualTip };
}

function getRegionFromPhone(phone: string): string {
  if (phone.length < 7) return '';
  const prefix = phone.substring(0, 3);
  const regions: Record<string, string[]> = {
    '移动': ['134-139', '150-152', '157-159', '182-184', '187-188', '178', '198'],
    '联通': ['130-132', '155-156', '185-186', '176', '166', '175'],
    '电信': ['133', '153', '177', '173', '180-181', '189', '199']
  };
  for (const [carrier, ranges] of Object.entries(regions)) {
    for (const range of ranges) {
      const [start, end] = range.split('-').map(Number);
      const preNum = Number(prefix);
      if (preNum >= start && preNum <= end) {
        return carrier.replace('移动', '中国移动').replace('联通', '中国联通').replace('电信', '中国电信');
      }
    }
  }
  return '';
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
  const [expandedSupplier, setExpandedSupplier] = useState<boolean>(true);
  const [expandedCommissionFaq, setExpandedCommissionFaq] = useState<number | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<number>(0);
  const [accountValidation, setAccountValidation] = useState<AccountValidation>({ isValid: true, isVirtual: false, carrier: '', carrierType: 'unknown', message: '' });
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    visible: false, calculating: false, finalPrice: null, originalPrice: null, savedAmount: null
  });
  const [showErrorCodeModal, setShowErrorCodeModal] = useState(false);
  const [expandedErrorCode, setExpandedErrorCode] = useState<string | null>(null);
  const [channelPriceAdj, setChannelPriceAdj] = useState<Record<number, ChannelPriceAdjust>>({});
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [calculateLoading, setCalculateLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (product) {
      calculate();
      loadAlternatives();
      generateChannelPriceAdj();
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
      const cleaned = form.account.replace(/\D/g, '').slice(0, 11);
      if (cleaned !== form.account) {
        setForm(prev => ({ ...prev, account: cleaned }));
      } else {
        setAccountValidation(validatePhone(form.account));
      }
    } else {
      setAccountValidation({ isValid: true, isVirtual: false, carrier: '', carrierType: 'unknown', message: '' });
    }
  }, [form.account, product]);

  useEffect(() => {
    if (product && (form.account || selectedChannel !== 0)) {
      const timer = setTimeout(calculate, 300);
      return () => clearTimeout(timer);
    }
  }, [form.account, selectedChannel]);

  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    };
  }, []);

  const generateChannelPriceAdj = () => {
    if (!product?.channels) return;
    const adj: Record<number, ChannelPriceAdjust> = {};
    product.channels.forEach((_ch: any, i: number) => {
      if (i === 0) {
        adj[i] = { baseAdjust: 0, percentAdjust: 0 };
      } else {
        const randomBase = Math.round((Math.random() * 2.5 - 0.5) * 100) / 100;
        const randomPercent = Math.round((Math.random() * 3 - 1) * 100) / 100;
        adj[i] = { baseAdjust: randomBase, percentAdjust: randomPercent };
      }
    });
    setChannelPriceAdj(adj);
  };

  const getChannelAdjustedPrice = (basePrice: number, channelIdx: number): number => {
    const adj = channelPriceAdj[channelIdx] || { baseAdjust: 0, percentAdjust: 0 };
    const adjusted = basePrice + adj.baseAdjust + basePrice * adj.percentAdjust / 100;
    return Math.round(adjusted * 100) / 100;
  };

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
    setCalculateLoading(true);
    try {
      const res: any = await productApi.calculatePrice({
        items: [{
          productId: product.id,
          quantity: form.quantity
        }],
        account: form.account || undefined,
        channelId: product.channels?.[selectedChannel]?.id
      });
      if (res.success) {
        const data = res.data;
        if (selectedChannel !== 0) {
          const adj = channelPriceAdj[selectedChannel];
          if (adj) {
            const baseOrig = data.originalPrice || data.originalAmount;
            const baseFinal = data.finalPrice || data.finalAmount;
            data.originalPrice = getChannelAdjustedPrice(baseOrig, selectedChannel);
            data.finalPrice = getChannelAdjustedPrice(baseFinal, selectedChannel);
            if (data.originalAmount) data.originalAmount = data.originalPrice;
            if (data.finalAmount) data.finalAmount = data.finalPrice;
          }
        }
        setPriceResult(data);
      }
    } catch {
    } finally {
      setCalculateLoading(false);
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

  const productRestrictions = useMemo(() => {
    if (!product) return [];
    const restrictions: Array<{ code: string; message: string; severity: 'warn' | 'error' }> = [];
    if (product.region_limited && product.available_regions?.length) {
      restrictions.push({
        code: 'ERR-1006',
        message: `当前号段不在支持范围内，仅支持：${product.available_regions.join('、')}`,
        severity: 'error'
      });
    }
    if (product.stock <= 5 && product.stock > 0) {
      restrictions.push({
        code: 'ERR-1004',
        message: `库存紧张，仅剩${product.stock}件，建议尽快下单`,
        severity: 'warn'
      });
    }
    if (product.stock === 0) {
      restrictions.push({
        code: 'ERR-1004',
        message: '商品暂时缺货，无法下单',
        severity: 'error'
      });
    }
    if (accountValidation.isVirtual && isPhoneProduct) {
      restrictions.push({
        code: 'ERR-1002',
        message: '虚拟运营商号段可能失败，建议确认归属',
        severity: 'warn'
      });
    }
    const activeChannels = product.channels?.filter((c: any) => c.status === 1)?.length || 0;
    if (activeChannels === 0) {
      restrictions.push({
        code: 'ERR-1007',
        message: '所有充值通道均在维护中，请稍后再试',
        severity: 'error'
      });
    }
    if (activeChannels === 1 && product.channels?.length > 1) {
      restrictions.push({
        code: 'ERR-1007',
        message: '仅1个通道可用，其他通道正在维护',
        severity: 'warn'
      });
    }
    return restrictions;
  }, [product, accountValidation, isPhoneProduct]);

  const getPreCheckResult = (): PreCheckResult => {
    const channelTotal = product?.channels?.length || product?.channelCount || 0;
    const channelActive = product?.channels?.filter((c: any) => c.status === 1).length || Math.max(0, channelTotal - 1);
    const promoCount = priceResult?.discountDetails?.length || priceResult?.breakdown?.length || 0;
    const fallbackAmount = (product?.price ?? 0) * form.quantity;
    const originalAmount = priceResult?.originalAmount ?? priceResult?.originalPrice ?? fallbackAmount;
    const finalAmount = priceResult?.finalAmount ?? priceResult?.finalPrice ?? fallbackAmount;
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
      accountOk, accountMessage, promoCount, totalSaved,
      finalPay: finalAmount, channelTotal, channelActive,
      hasFallback: product?.hasFallback || false, passed, failReason
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

    setConfirmModal({ visible: true, calculating: true, finalPrice: null, originalPrice: null, savedAmount: null });

    try {
      const res: any = await productApi.calculatePrice({
        items: [{ productId: product.id, quantity: form.quantity }],
        account: form.account,
        channelId: product.channels?.[selectedChannel]?.id
      });
      if (res.success) {
        let finalAmount = res.data.finalAmount ?? res.data.finalPrice ?? 0;
        let originalAmount = res.data.originalAmount ?? res.data.originalPrice ?? (product.price * form.quantity);
        if (selectedChannel !== 0) {
          finalAmount = getChannelAdjustedPrice(finalAmount, selectedChannel);
          originalAmount = getChannelAdjustedPrice(originalAmount, selectedChannel);
        }
        setConfirmModal({
          visible: true, calculating: false,
          finalPrice: finalAmount, originalPrice: originalAmount,
          savedAmount: originalAmount - finalAmount
        });
        setPriceResult({ ...res.data, finalAmount, originalAmount });
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
      } catch {}

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
        quantity: form.quantity,
        channelId: product.channels?.[selectedChannel]?.id
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
              } else if (['paid', 'recharging', 'processing', 'retrying', 'channel_switch'].includes(payStatus)) {
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
    const val = d.value ?? d.rules?.value ?? d.discount ?? 0;
    switch (d.type) {
      case 'full_reduction':
        return `满${d.threshold || d.rules?.threshold || 'X'}减${val}`;
      case 'percentage':
        return `${(val || 1) * 100}折`;
      case 'new_user':
        return `新人专享减¥${val}`;
      case 'cashback':
        return `返¥${val}`;
      case 'coupon':
        return `减¥${val}`;
      default:
        return '';
    }
  };

  const getDiscountDetails = () => {
    if (priceResult?.discountDetails) return priceResult.discountDetails;
    if (priceResult?.breakdown) return priceResult.breakdown.map((b: any) => ({
      ...b,
      discountAmount: b.discount,
      name: b.name,
      type: b.type,
      description: b.description
    }));
    return [];
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
      const amt = d.discountAmount ?? d.discount ?? 0;
      if (groups[type]) {
        groups[type].amount += amt;
        groups[type].items.push(d);
      } else {
        groups.other.amount += amt;
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
  const discountDetails = getDiscountDetails();
  const discountGroups = discountDetails.length > 0 ? groupDiscountsByType(discountDetails) : null;
  const hasStackablePromo = product.applicablePromotions?.some((p: any) => p.stackable) ?? false;
  const originalPrice = priceResult?.originalAmount ?? priceResult?.originalPrice ?? (product.price * form.quantity);
  const finalPrice = priceResult?.finalAmount ?? priceResult?.finalPrice ?? (product.price * form.quantity);
  const totalDiscount = Math.max(0, originalPrice - finalPrice);
  const commission = finalPrice * commissionRate;
  const validDiscountCount = discountDetails.filter((d: any) => (d.discountAmount ?? d.discount ?? 0) > 0).length;

  const getAccountInputStyle = () => {
    if (!isPhoneProduct || !form.account) return {};
    if (!accountValidation.isValid) {
      return {
        fontSize: 16,
        borderColor: '#ff4d4f',
        borderWidth: 2,
        background: '#fff1f0'
      };
    }
    if (accountValidation.isVirtual) {
      return {
        fontSize: 16,
        borderColor: '#faad14',
        borderWidth: 2,
        background: '#fffbe6'
      };
    }
    return {
      fontSize: 16,
      borderColor: '#52c41a',
      borderWidth: 2,
      background: '#f6ffed'
    };
  };

  const getSuccessRateStyle = (rate: number) => {
    if (rate >= 98) return { bg: '#f6ffed', color: '#52c41a', border: '#b7eb8f' };
    if (rate >= 95) return { bg: '#e6f7ff', color: '#1890ff', border: '#91d5ff' };
    return { bg: '#fffbe6', color: '#faad14', border: '#ffe58f' };
  };

  const getChannelFailure24h = (channelIdx: number) => {
    const baseRates = [1.2, 2.5, 3.2, 5.8];
    return baseRates[channelIdx % baseRates.length];
  };

  return (
    <div style={{ paddingBottom: 100 }}>
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

      {productRestrictions.length > 0 && (
        <div className="card" style={{ marginTop: 0 }}>
          <div className="text-bold mb-12" style={{ fontSize: 15 }}>
            ⚠️ 下单须知 & 限制提示
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {productRestrictions.map((r, idx) => {
              const errorDetail = PRODUCT_ERROR_CODES[r.code];
              const isExpanded = expandedErrorCode === r.code;
              return (
                <div key={idx} style={{
                  border: `1px solid ${r.severity === 'error' ? '#ffa39e' : '#ffe58f'}`,
                  background: r.severity === 'error' ? '#fff1f0' : '#fffbe6',
                  borderRadius: 12,
                  overflow: 'hidden'
                }}>
                  <div
                    style={{
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      cursor: 'pointer'
                    }}
                    onClick={() => setExpandedErrorCode(isExpanded ? null : r.code)}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0 }}>
                      {r.severity === 'error' ? '🛑' : '⚠️'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                        marginBottom: 4
                      }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: r.severity === 'error' ? '#ff4d4f' : '#faad14',
                          color: 'white'
                        }}>
                          {r.code}
                        </span>
                        <span style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: r.severity === 'error' ? '#ff4d4f' : '#d46b08'
                        }}>
                          {errorDetail?.label || '限制提示'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: r.severity === 'error' ? '#cf1322' : '#873800', lineHeight: 1.5 }}>
                        {r.message}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 12,
                      color: '#999',
                      flexShrink: 0,
                      transition: 'transform 0.2s',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>▼</span>
                  </div>
                  {isExpanded && errorDetail && (
                    <div style={{
                      padding: '0 14px 14px 50px',
                      borderTop: `1px dashed ${r.severity === 'error' ? '#ffccc7' : '#ffe58f'}`
                    }}>
                      <div style={{ paddingTop: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 8 }}>
                          📋 常见原因（{errorDetail.reasons.length}条）
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                          {errorDetail.reasons.map((reason, i) => (
                            <div key={i} style={{ fontSize: 12, color: '#666', display: 'flex', gap: 6 }}>
                              <span style={{ color: r.severity === 'error' ? '#ff4d4f' : '#faad14' }}>{i + 1}.</span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 8 }}>
                          💡 解决方案（{errorDetail.solutions.length}条）
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {errorDetail.solutions.map((sol, i) => (
                            <div key={i} style={{ fontSize: 12, color: '#666', display: 'flex', gap: 6 }}>
                              <span style={{ color: '#52c41a' }}>✓</span>
                              <span>{sol}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
          <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -10, width: 100, height: 100, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 6, position: 'relative', zIndex: 1 }}>
            {calculateLoading ? '价格计算中...' : `叠加${validDiscountCount}项优惠后实付价`}
          </div>
          <div style={{ color: 'white', fontWeight: 800, letterSpacing: -1, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
            <span style={{ fontSize: 36, fontWeight: 700, marginRight: 2 }}>¥</span>
            <span style={{ fontSize: 52, lineHeight: 1 }}>{finalPrice.toFixed(2)}</span>
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'line-through', fontSize: 14 }}>
              原价 ¥{originalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 14 }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ color: '#52c41a', fontWeight: 700, fontSize: 15 }}>
              🎉 已省¥{totalDiscount.toFixed(2)}
            </div>
          </div>
          <div style={{ width: 1, background: '#f0f0f0' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ color: '#fa8c16', fontWeight: 700, fontSize: 15 }}>
              💰 预计返佣¥{commission.toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
              (L1 {Math.round(commissionRate * 100)}%)
            </div>
          </div>
        </div>
      </div>

      {discountDetails.length > 0 && (
        <div className="card" style={{ marginTop: 0 }}>
          <div className="flex-between mb-12">
            <span className="text-bold" style={{ fontSize: 15 }}>🎁 优惠明细（已自动叠加）</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="tag tag-orange" style={{ fontSize: 10, padding: '1px 6px' }}>
                已叠加{validDiscountCount}项
              </span>
              <span className="text-sm text-gray">共省¥{totalDiscount.toFixed(2)}</span>
            </div>
          </div>

          <div style={{
            padding: '8px 12px',
            background: validDiscountCount === 1 ? '#fff7e6' : '#f6ffed',
            border: `1px solid ${validDiscountCount === 1 ? '#ffd591' : '#b7eb8f'}`,
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 12,
            color: validDiscountCount === 1 ? '#d46b08' : '#389e0d',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            {validDiscountCount === 1 ? '🛒 优惠力度可叠加其他商品，欢迎凑单~' : '✨ 以下优惠已自动叠加，享受最优价格'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {discountDetails.map((d: any, i: number) => {
              const colorConfig = getPromoTypeColor(d.type);
              const icon = PROMO_ICONS[d.type] || PROMO_ICONS.other;
              const amt = d.discountAmount ?? d.discount ?? 0;
              return (
                <div key={i} style={{
                  borderRadius: 12,
                  border: '1px solid #f0f0f0',
                  background: '#fafafa',
                  overflow: 'hidden',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}>
                  <span style={{
                    minWidth: 40,
                    height: 40,
                    borderRadius: 10,
                    background: colorConfig.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                    color: colorConfig.color,
                    fontWeight: 700
                  }}>
                    {icon}
                    <span style={{ display: 'none' }}>{getPromoTypeLabel(d.type)}</span>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      color: '#333',
                      fontWeight: 600,
                      marginBottom: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      {d.name || getPromoValueLabel(d)}
                      <span style={{
                        fontSize: 10,
                        padding: '1px 6px',
                        borderRadius: 6,
                        background: colorConfig.bg,
                        color: colorConfig.color,
                        fontWeight: 500
                      }}>
                        {getPromoTypeLabel(d.type)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#999', lineHeight: 1.4 }}>
                      {d.description || d.rules?.description || getPromoValueLabel(d)}
                    </div>
                  </div>
                  <span style={{
                    color: '#52c41a',
                    fontWeight: 700,
                    fontSize: 15,
                    flexShrink: 0
                  }}>
                    -¥{amt.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '2px dashed #e8e8e8'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
              flexWrap: 'wrap',
              gap: 6
            }}>
              <span style={{ fontSize: 12, color: '#666', fontWeight: 500 }}>
                已叠加 <span style={{ color: '#fa8c16', fontWeight: 700, fontSize: 14 }}>{validDiscountCount}</span> 项优惠
              </span>
              <span style={{ fontSize: 14, color: '#52c41a', fontWeight: 800 }}>
                共省 ¥{totalDiscount.toFixed(2)}
              </span>
            </div>
            {discountGroups && Object.values(discountGroups).some(g => g.amount > 0) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                {Object.values(discountGroups).filter(g => g.amount > 0).map((g, i) => (
                  <span key={i} style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: '#f0f5ff',
                    color: '#667eea',
                    border: '1px solid #d6e4ff'
                  }}>
                    {g.label} -¥{g.amount.toFixed(2)}
                  </span>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, color: '#fa8c16', lineHeight: 1.5, fontWeight: 500 }}>
              💸 返佣 ¥{commission.toFixed(2)} 将于订单完成后T+7天到账
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
            {[
              { level: 'L1', rate: 8, desc: '直推好友', c1: '#667eea', c2: '#764ba2' },
              { level: 'L2', rate: 4, desc: '间推好友', c1: '#f5576c', c2: '#f093fb' },
              { level: 'L3', rate: 2, desc: '三级好友', c1: '#fa8c16', c2: '#ffd666' }
            ].map((t, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${t.c1}, ${t.c2})`,
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, margin: '0 auto 6px',
                  boxShadow: `0 2px 8px ${t.c1}44`
                }}>{t.level}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: t.c1 }}>{t.rate}%</div>
                <div style={{ fontSize: 10, color: '#999' }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
          <div style={{ padding: '10px 8px', background: '#f0f5ff', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#667eea', fontWeight: 600 }}>T+7到账</div>
            <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>订单完成后</div>
          </div>
          <div style={{ padding: '10px 8px', background: '#f6ffed', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: '#52c41a', fontWeight: 600 }}>最低¥10提现</div>
            <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>手续费1%</div>
          </div>
          <div style={{ padding: '10px 8px', background: '#fff1f0', borderRadius: 8, textAlign: 'center' }}>
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
                  position: 'absolute', left: -24, width: 20, height: 20,
                  borderRadius: '50%', background: step.color, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, zIndex: 1
                }}>
                  {step.done ? '✓' : idx + 1}
                </div>
                {idx < 4 && (
                  <div style={{
                    position: 'absolute', left: -15, top: 20, width: 2,
                    height: 'calc(100% - 4px)', background: '#f0f0f0'
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
                    style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
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
                      padding: '0 12px 12px 36px', fontSize: 12, color: '#666', lineHeight: 1.8,
                      borderTop: '1px dashed #91d5ff', paddingTop: 8,
                      marginLeft: 4, marginRight: 4, marginBottom: 4
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
          <div style={{ position: 'relative' }}>
            <input
              className="form-input"
              type="tel"
              placeholder={getPlaceholder()}
              value={form.account}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                setForm({ ...form, account: val });
              }}
              style={getAccountInputStyle()}
              maxLength={11}
            />
            {form.account && isPhoneProduct && (
              <div style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                {!accountValidation.isValid && (
                  <span style={{ fontSize: 20 }}>❌</span>
                )}
                {accountValidation.isValid && accountValidation.isVirtual && (
                  <span style={{ fontSize: 20 }}>⚠️</span>
                )}
                {accountValidation.isValid && !accountValidation.isVirtual && accountValidation.carrierType !== 'unknown' && (
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: CARRIER_CONFIG[accountValidation.carrierType]?.bgColor,
                    border: `1px solid ${CARRIER_CONFIG[accountValidation.carrierType]?.borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14
                  }}>
                    {CARRIER_CONFIG[accountValidation.carrierType]?.logo || '📱'}
                  </div>
                )}
              </div>
            )}
          </div>
          {form.account && isPhoneProduct && (
            <div style={{
              marginTop: 10,
              padding: '12px 14px',
              borderRadius: 12,
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
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>❌</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>手机号格式错误</span>
                  </div>
                  <div style={{ marginLeft: 26, fontSize: 12 }}>{accountValidation.message}</div>
                </div>
              ) : accountValidation.isVirtual ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>⚠️</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>虚拟运营商号段</span>
                  </div>
                  <div style={{ marginLeft: 26, marginBottom: 6, opacity: 0.9, fontSize: 12 }}>
                    {accountValidation.message}
                  </div>
                  <div style={{ marginLeft: 26, fontSize: 11, opacity: 0.8 }}>
                    💡 {accountValidation.virtualTip}
                  </div>
                  {accountValidation.carrier && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, marginTop: 10,
                      marginLeft: 26, padding: '6px 10px',
                      background: 'rgba(255,255,255,0.6)', borderRadius: 8, width: 'fit-content'
                    }}>
                      <span>{CARRIER_CONFIG[accountValidation.carrierType]?.logo || '📱'}</span>
                      <span style={{ fontSize: 11, fontWeight: 500 }}>{accountValidation.carrier}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: CARRIER_CONFIG[accountValidation.carrierType]?.bgColor || '#f5f5f5',
                    border: `2px solid ${CARRIER_CONFIG[accountValidation.carrierType]?.borderColor || '#d9d9d9'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    color: CARRIER_CONFIG[accountValidation.carrierType]?.color
                  }}>
                    {CARRIER_CONFIG[accountValidation.carrierType]?.logo || '📱'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#333' }}>
                      ✅ {accountValidation.carrier || '已识别运营商'}
                    </div>
                    <div style={{ fontSize: 11, color: '#52c41a', marginTop: 2, fontWeight: 500 }}>
                      ✓ 号段校验通过 · 可正常充值
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
                  width: 36, height: 36, borderRadius: 10, border: '2px solid #e8e8e8', background: '#fafafa',
                  fontSize: 20, fontWeight: 700, color: form.quantity <= 1 ? '#ccc' : '#333'
                }}
                onClick={() => form.quantity > 1 && setForm({ ...form, quantity: form.quantity - 1 })}
                disabled={form.quantity <= 1}
              >−</button>
              <span style={{ fontSize: 18, fontWeight: 700, minWidth: 36, textAlign: 'center' }}>{form.quantity}</span>
              <button
                style={{
                  width: 36, height: 36, borderRadius: 10, border: '2px solid #e8e8e8', background: '#fafafa',
                  fontSize: 20, fontWeight: 700, color: form.quantity >= 10 ? '#ccc' : '#333'
                }}
                onClick={() => form.quantity < 10 && setForm({ ...form, quantity: form.quantity + 1 })}
                disabled={form.quantity >= 10}
              >+</button>
            </div>
          </div>
        </div>

        {product.stock <= 10 && product.stock > 0 && (
          <div style={{
            color: '#d46b08', fontSize: 12, marginTop: 12, padding: '8px 12px',
            background: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f'
          }}>
            ⚠️ 库存紧张，仅剩 {product.stock} 件，建议尽快下单
          </div>
        )}
        {product.stock === 0 && (
          <div style={{
            color: '#cf1322', fontSize: 12, marginTop: 12, padding: '8px 12px',
            background: '#fff1f0', borderRadius: 8, border: '1px solid #ffa39e'
          }}>
            ❌ 暂时缺货，无法下单，请选择其他商品
          </div>
        )}
      </div>

      {product.channels && product.channels.length > 0 && (
        <div className="card" style={{ marginTop: 0 }}>
          <div className="flex-between mb-12">
            <span className="text-bold" style={{ fontSize: 15 }}>
              🔌 充值通道选择
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="tag tag-blue" style={{ fontSize: 10 }}>
                智能推荐
              </span>
              <span className="text-sm text-gray">共 {product.channels.length} 个</span>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: product.channels.length <= 2 ? 'repeat(2, 1fr)' :
              product.channels.length === 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
            gap: 10
          }}>
            {product.channels.map((ch: any, i: number) => {
              const isSelected = i === selectedChannel;
              const isActive = ch.status === 1;
              const isMain = ch.isMain || i === 0;
              const successRate = ch.success_rate ?? ch.successRate ?? (98 - i * 2);
              const arriveTime = ch.arrive_time || ch.arriveTime || (i === 0 ? '秒级' : i === 1 ? '1-3分钟' : '5分钟');
              const channelName = ch.name || (isMain ? '主通道' : `备用${i}`);
              const srStyle = getSuccessRateStyle(successRate);
              const failRate = getChannelFailure24h(i);
              const priceDiff = selectedChannel === i ? 0 :
                (getChannelAdjustedPrice(product.price, i) - product.price);

              return (
                <div
                  key={ch.id || i}
                  style={{
                    padding: '12px 10px',
                    borderRadius: 14,
                    border: `2px solid ${isSelected ? '#1890ff' : isActive ? '#f0f0f0' : '#e8e8e8'}`,
                    background: isSelected
                      ? 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)'
                      : isActive ? '#fafafa' : '#f5f5f5',
                    opacity: isActive ? 1 : 0.5,
                    cursor: isActive ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    boxShadow: isSelected ? '0 4px 12px rgba(24,144,255,0.15)' : 'none'
                  }}
                  onClick={() => {
                    if (isActive) {
                      setSelectedChannel(i);
                    }
                  }}
                >
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: 6, right: 6, width: 20, height: 20,
                      borderRadius: '50%', background: '#1890ff', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700
                    }}>✓</div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 8,
                      background: isMain
                        ? 'linear-gradient(135deg, #1890ff, #40a9ff)'
                        : 'linear-gradient(135deg, #8c8c8c, #bfbfbf)',
                      color: 'white'
                    }}>
                      {isMain ? '🏆 主通道' : `备用${i}`}
                    </span>
                  </div>

                  <div style={{
                    fontSize: 13, fontWeight: 700, color: isSelected ? '#1890ff' : '#333',
                    marginBottom: 8, lineHeight: 1.3
                  }}>
                    {channelName}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    <span style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 6,
                      background: srStyle.bg, color: srStyle.color,
                      border: `1px solid ${srStyle.border}`, fontWeight: 600
                    }}>
                      成功率 {successRate}%
                    </span>
                    <span style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 6,
                      background: '#f0f5ff', color: '#667eea', border: '1px solid #d6e4ff',
                      fontWeight: 500
                    }}>
                      ⏱ {arriveTime}
                    </span>
                  </div>

                  {!isMain && isActive && priceDiff !== 0 && (
                    <div style={{
                      fontSize: 10, fontWeight: 600,
                      color: priceDiff < 0 ? '#52c41a' : '#ff4d4f',
                      marginBottom: 4
                    }}>
                      {priceDiff < 0 ? `💰 省¥${Math.abs(priceDiff).toFixed(2)}` : `📈 贵¥${priceDiff.toFixed(2)}`}
                    </div>
                  )}

                  {failRate > 3 && (
                    <div style={{
                      fontSize: 9, color: '#d46b08',
                      padding: '3px 6px', background: '#fff7e6',
                      borderRadius: 4, marginTop: 2
                    }}>
                      ⚠️ 24h失败率{failRate}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedChannel !== 0 && getChannelFailure24h(selectedChannel) > 3 && (
            <div style={{
              marginTop: 12, padding: '10px 12px', background: '#fffbe6',
              border: '1px solid #ffe58f', borderRadius: 10,
              fontSize: 12, color: '#d46b08', lineHeight: 1.5
            }}>
              ⚠️ 该通道最近24小时失败率 {getChannelFailure24h(selectedChannel)}%，建议选择主通道以获得更高成功率
            </div>
          )}

          <div style={{
            marginTop: 12, fontSize: 11, color: '#999', lineHeight: 1.6,
            padding: '8px 12px', background: '#fafafa', borderRadius: 8
          }}>
            💡 系统会自动选择最优通道，如遇充值失败将<strong>自动切换备用通道重试</strong>，无需手动操作
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 0 }}>
        <div className="text-bold mb-12" style={{ fontSize: 15 }}>🔍 下单预检</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            padding: '12px 14px', borderRadius: 12,
            background: preCheck.accountOk ? (accountValidation.isVirtual ? '#fffbe6' : '#f6ffed') : '#fff1f0',
            border: `1px solid ${preCheck.accountOk ? (accountValidation.isVirtual ? '#ffe58f' : '#b7eb8f') : '#ffa39e'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📱</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>充值账号校验</span>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: preCheck.accountOk ? (accountValidation.isVirtual ? '#d46b08' : '#389e0d') : '#cf1322'
              }}>
                {preCheck.accountOk
                  ? (accountValidation.isVirtual ? '⚠️ ' : '✅ ') + preCheck.accountMessage
                  : '❌ ' + preCheck.accountMessage}
              </span>
            </div>
          </div>

          <div style={{
            padding: '12px 14px', borderRadius: 12,
            background: preCheck.promoCount > 0 ? '#f6ffed' : '#fafafa',
            border: `1px solid ${preCheck.promoCount > 0 ? '#b7eb8f' : '#f0f0f0'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>💰</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>优惠预计算</span>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: preCheck.promoCount > 0 ? '#389e0d' : '#999'
              }}>
                {preCheck.promoCount > 0
                  ? `🎁 已选${preCheck.promoCount}项 · 省¥${preCheck.totalSaved.toFixed(2)} · 实付¥${preCheck.finalPay.toFixed(2)}`
                  : '暂无可用优惠'}
              </span>
            </div>
          </div>

          <div style={{
            padding: '12px 14px', borderRadius: 12,
            background: preCheck.channelActive > 0 ? '#e6f7ff' : '#fff1f0',
            border: `1px solid ${preCheck.channelActive > 0 ? '#91d5ff' : '#ffa39e'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📡</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>通道状态</span>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: preCheck.channelActive > 0 ? '#1890ff' : '#cf1322'
              }}>
                {preCheck.channelActive > 0
                  ? `✅ 使用 ${preCheck.channelActive}/${preCheck.channelTotal} 通道${preCheck.hasFallback ? ' · 含降级备用' : ''}`
                  : '❌ 暂无可用通道'}
              </span>
            </div>
          </div>
        </div>

        {!preCheck.passed && (
          <div style={{
            marginTop: 14, padding: '12px 14px', background: '#fff1f0',
            border: '2px solid #ffa39e', borderRadius: 12,
            fontSize: 13, color: '#cf1322', fontWeight: 600
          }}>
            ⚠️ {preCheck.failReason || '预检未通过，请检查上述项目'}
          </div>
        )}
        {preCheck.passed && (
          <div style={{
            marginTop: 14, padding: '12px 14px', background: '#f6ffed',
            border: '2px solid #b7eb8f', borderRadius: 12,
            fontSize: 13, color: '#389e0d', fontWeight: 600
          }}>
            ✅ 所有预检项已通过，可以安全下单！
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
            fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'transform 0.2s', transform: expandedSupplier ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>▼</span>
        </div>
        {expandedSupplier && (
          <>
            {alternatives.loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>加载中...</div>
            ) : alternatives.data?.alternatives?.length > 0 ? (
              <div>
                <div style={{
                  fontSize: 12, color: '#666', marginBottom: 12, padding: '10px 12px',
                  background: '#f0f5ff', borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <span>当前供应商：<span style={{ fontWeight: 700, color: '#667eea' }}>{alternatives.data.currentSupplier || product.supplier_name}</span></span>
                  {alternatives.data.hasMultiSupplier && (
                    <span className="tag tag-purple" style={{ fontSize: 10, padding: '1px 6px' }}>多供应商竞价</span>
                  )}
                </div>
                {alternatives.data.alternatives.map((alt: any, idx: number) => {
                  const successRate = alt.successRate ?? 95;
                  const isCheaper = alt.priceDiff < 0;
                  const isExpensive = alt.priceDiff > 0;
                  return (
                    <div key={idx} style={{
                      padding: '14px', marginBottom: idx < alternatives.data.alternatives.length - 1 ? 10 : 0,
                      background: '#fafafa', borderRadius: 14,
                      border: `2px solid ${isCheaper ? '#b7eb8f' : isExpensive ? '#ffa39e' : '#f0f0f0'}`,
                      position: 'relative'
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'flex-start',
                        justifyContent: 'space-between', gap: 10, marginBottom: 10
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>{alt.name}</span>
                            {alt.hasFallback && (
                              <span style={{
                                fontSize: 10, padding: '1px 6px', borderRadius: 8,
                                background: '#e6fffb', color: '#13c2c2', border: '1px solid #87e8de'
                              }}>🛡️降级</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                            <span style={{
                              fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
                              background: isCheaper ? '#f6ffed' : isExpensive ? '#fff1f0' : '#f5f5f5',
                              color: isCheaper ? '#52c41a' : isExpensive ? '#ff4d4f' : '#666'
                            }}>
                              {alt.priceDiffLabel || '价格相同'}
                            </span>
                            <span style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>
                              📊 通道 {(alt.channels?.length || alt.channelCount || 1)}个
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSwitchSupplier(alt.id)}
                          className="btn-primary"
                          style={{
                            padding: '8px 18px', fontSize: 12, borderRadius: 20,
                            flexShrink: 0, fontWeight: 700,
                            background: isCheaper
                              ? 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'
                              : undefined
                          }}
                        >切换</button>
                      </div>
                      <div>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', marginBottom: 4, fontSize: 11, color: '#666', fontWeight: 500
                        }}>
                          <span>充值成功率</span>
                          <span style={{
                            fontWeight: 700, fontSize: 13,
                            color: successRate >= 98 ? '#52c41a' : successRate >= 95 ? '#1890ff' : '#faad14'
                          }}>
                            {successRate}%
                          </span>
                        </div>
                        <div style={{
                          width: '100%', height: 8, background: '#f0f0f0',
                          borderRadius: 4, overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${successRate}%`, height: '100%',
                            background: successRate >= 98
                              ? 'linear-gradient(90deg, #52c41a, #73d13d)'
                              : successRate >= 95
                                ? 'linear-gradient(90deg, #1890ff, #40a9ff)'
                                : 'linear-gradient(90deg, #faad14, #ffc53d)',
                            borderRadius: 4, transition: 'width 0.5s ease'
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 20px', color: '#999', fontSize: 13 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✨</div>
                当前已是最优选择，暂无更合适的备选供应商
              </div>
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

      {confirmModal.visible && (
        <div className="modal-mask" onClick={closeConfirmModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 0, maxWidth: 420 }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '22px 20px', color: 'white',
              borderTopLeftRadius: 20, borderTopRightRadius: 20, textAlign: 'center'
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🎯 确认订单信息</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>请仔细核对充值账号和金额</div>
            </div>

            <div style={{ padding: '20px' }}>
              {confirmModal.calculating ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin 1s linear infinite' }}>🔄</div>
                  <div style={{ color: '#666', fontSize: 14, fontWeight: 500 }}>正在计算最终优惠价格...</div>
                  <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>请稍候，正在匹配最优优惠组合</div>
                </div>
              ) : (
                <>
                  <div style={{
                    background: '#fafafa', borderRadius: 14, padding: '16px', marginBottom: 14,
                    border: '1px solid #f0f0f0'
                  }}>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>商品名称</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>{product.name}</div>
                  </div>

                  <div style={{
                    background: isPhoneProduct && accountValidation.isVirtual ? '#fffbe6' : '#f6ffed',
                    border: `2px solid ${isPhoneProduct && accountValidation.isVirtual ? '#ffe58f' : '#b7eb8f'}`,
                    borderRadius: 14, padding: '16px', marginBottom: 14
                  }}>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 8 }}>
                      {isPhoneProduct ? '📱 充值手机号' : '🔢 充值账号'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{
                        fontSize: 20, fontWeight: 800, color: '#333', letterSpacing: 2,
                        fontFamily: 'monospace'
                      }}>
                        {isPhoneProduct
                          ? form.account.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3')
                          : form.account}
                      </div>
                      {isPhoneProduct && accountValidation.carrier && (
                        <span style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 12,
                          background: 'white',
                          color: CARRIER_CONFIG[accountValidation.carrierType]?.color || '#667eea',
                          border: `1px solid ${CARRIER_CONFIG[accountValidation.carrierType]?.borderColor || '#667eea33'}`,
                          fontWeight: 600
                        }}>
                          {CARRIER_CONFIG[accountValidation.carrierType]?.logo} {accountValidation.carrier}
                        </span>
                      )}
                    </div>
                    {isPhoneProduct && accountValidation.isVirtual && (
                      <div style={{
                        fontSize: 11, color: '#d46b08', marginTop: 8,
                        padding: '6px 10px', background: 'rgba(255,255,255,0.8)', borderRadius: 8
                      }}>
                        ⚠️ 虚拟号段，请确认可充值后继续
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ color: '#999', fontSize: 13 }}>购买数量</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>×{form.quantity}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ color: '#999', fontSize: 13 }}>使用通道</span>
                    <span style={{
                      fontSize: 13, fontWeight: 600, color: '#1890ff',
                      padding: '2px 10px', background: '#e6f7ff', borderRadius: 8
                    }}>
                      {product.channels?.[selectedChannel]?.name || '主通道'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ color: '#999', fontSize: 13 }}>商品原价</span>
                    <span style={{ fontSize: 14, color: '#999', textDecoration: 'line-through' }}>
                      ¥{confirmModal.originalPrice?.toFixed(2)}
                    </span>
                  </div>

                  {discountDetails.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: 8
                      }}>
                        <span style={{ color: '#999', fontSize: 13 }}>优惠明细</span>
                        <span style={{ fontSize: 12, color: '#52c41a', fontWeight: 700 }}>
                          🎁 {discountDetails.length}项共省¥{confirmModal.savedAmount?.toFixed(2)}
                        </span>
                      </div>
                      <div style={{
                        background: '#fafafa', borderRadius: 12, padding: '10px 12px',
                        border: '1px solid #f0f0f0'
                      }}>
                        {discountDetails.slice(0, 4).map((d: any, i: number) => (
                          <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: i < Math.min(discountDetails.length, 4) - 1 ? '5px 0' : '5px 0 0'
                          }}>
                            <span style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{
                                display: 'inline-block', padding: '1px 6px', borderRadius: 6,
                                background: getPromoTypeColor(d.type).bg,
                                color: getPromoTypeColor(d.type).color,
                                fontSize: 10, fontWeight: 700
                              }}>
                                {PROMO_ICONS[d.type] || '🎁'} {getPromoTypeLabel(d.type)}
                              </span>
                              {d.name || getPromoValueLabel(d)}
                            </span>
                            <span style={{ fontSize: 12, color: '#52c41a', fontWeight: 700 }}>
                              -¥{(d.discountAmount ?? d.discount ?? 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                        {discountDetails.length > 4 && (
                          <div style={{ fontSize: 11, color: '#999', textAlign: 'center', paddingTop: 6 }}>
                            ...还有{discountDetails.length - 4}项优惠已自动应用
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {commission > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ color: '#999', fontSize: 13 }}>预计返佣 (L1 {Math.round(commissionRate * 100)}%)</span>
                      <span style={{ fontSize: 14, color: '#fa8c16', fontWeight: 700 }}>
                        +¥{commission.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '2px dashed #e8e8e8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        onClick={() => setShowErrorCodeModal(true)}
                        style={{
                          fontSize: 11, color: '#1890ff', background: 'transparent',
                          padding: 0, textDecoration: 'none', fontWeight: 500
                        }}
                      >
                        📋 常见错误码说明
                      </button>
                    </div>
                    <div style={{
                      marginTop: 12, display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '12px 16px',
                      background: 'linear-gradient(135deg, #fff1f0 0%, #fff7e6 100%)',
                      borderRadius: 14, border: '2px solid #ffa39e'
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>💰 实付金额</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', color: '#ff4d4f' }}>
                        <span style={{ fontSize: 20, fontWeight: 700 }}>¥</span>
                        <span style={{ fontSize: 32, fontWeight: 800 }}>{confirmModal.finalPrice?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
              <button
                style={{
                  flex: 1, padding: '14px', borderRadius: 14,
                  background: '#f5f5f5', color: '#666',
                  fontSize: 14, fontWeight: 700, border: 'none'
                }}
                onClick={closeConfirmModal}
                disabled={ordering || confirmModal.calculating}
              >取消</button>
              <button
                className="btn-primary"
                style={{
                  flex: 2, padding: '14px', borderRadius: 14,
                  fontSize: 16, fontWeight: 800,
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                  boxShadow: '0 4px 16px rgba(238,90,111,0.3)'
                }}
                onClick={doOrder}
                disabled={ordering || confirmModal.calculating}
              >
                {ordering ? '⏳ 正在创建订单...' : `✅ 确认支付 ¥${confirmModal.finalPrice?.toFixed(2) || '0.00'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showErrorCodeModal && (
        <div className="modal-mask" onClick={() => setShowErrorCodeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', maxWidth: 440 }}>
            <div style={{
              padding: '18px 20px', borderBottom: '1px solid #f0f0f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>📋 常见错误码对照表</span>
              <button
                onClick={() => setShowErrorCodeModal(false)}
                style={{ background: 'transparent', fontSize: 24, color: '#999', border: 'none' }}
              >×</button>
            </div>
            <div style={{ padding: '12px 20px 20px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '100px 1fr 60px',
                gap: '10px', fontSize: 11, fontWeight: 700,
                color: '#999', padding: '10px 0',
                borderBottom: '2px solid #f0f0f0', marginBottom: 8
              }}>
                <span>错误码</span>
                <span>说明 & 解决方案</span>
                <span style={{ textAlign: 'center' }}>重试</span>
              </div>
              {ERROR_CODE_TABLE.map((item, idx) => (
                <div key={idx} style={{
                  display: 'grid', gridTemplateColumns: '100px 1fr 60px',
                  gap: '10px', padding: '12px 0',
                  borderBottom: idx < ERROR_CODE_TABLE.length - 1 ? '1px solid #f5f5f5' : 'none',
                  alignItems: 'start'
                }}>
                  <span style={{
                    fontFamily: 'monospace', fontWeight: 700,
                    background: 'linear-gradient(135deg, #ff4d4f, #ff7875)',
                    color: 'white', padding: '4px 8px',
                    borderRadius: 6, fontSize: 10, textAlign: 'center',
                    alignSelf: 'start'
                  }}>
                    {item.code}
                  </span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 4 }}>
                      {item.reason}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>
                      💡 {item.solution}
                    </div>
                  </div>
                  <span style={{
                    textAlign: 'center', alignSelf: 'center',
                    fontSize: 18, color: item.retryable ? '#52c41a' : '#ff4d4f'
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
        zIndex: 100,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ color: '#999', fontSize: 11 }}>实付</span>
            <div style={{ color: '#ff4d4f', fontWeight: 800, display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>¥</span>
              <span style={{ fontSize: 28 }}>{finalPrice.toFixed(2)}</span>
            </div>
          </div>
          <div style={{
            display: 'flex', gap: 8, marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {totalDiscount > 0 && (
              <span style={{ fontSize: 11, color: '#52c41a', fontWeight: 600 }}>
                省¥{totalDiscount.toFixed(2)}
              </span>
            )}
            <span style={{ fontSize: 11, color: '#fa8c16', fontWeight: 600 }}>
              返佣¥{commission.toFixed(2)}
            </span>
          </div>
        </div>
        <button
          className="btn-primary btn-block"
          style={{
            flex: 1.5, padding: '14px 16px',
            background: !preCheck.passed || product.stock === 0
              ? 'linear-gradient(135deg, #bfbfbf 0%, #8c8c8c 100%)'
              : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
            borderRadius: 16, fontSize: 16, fontWeight: 800,
            boxShadow: !preCheck.passed || product.stock === 0
              ? 'none'
              : '0 4px 16px rgba(238,90,111,0.35)',
            transition: 'all 0.2s'
          }}
          onClick={openConfirmModal}
          disabled={!preCheck.passed || ordering || product.stock === 0}
        >
          {product.stock === 0 ? '❌ 暂时缺货' :
            !preCheck.passed ? preCheck.failReason?.substring(0, 8) || '⚠️ 请完善信息' :
              ordering ? '⏳ 下单中...' : '🚀 立即充值'}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
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
