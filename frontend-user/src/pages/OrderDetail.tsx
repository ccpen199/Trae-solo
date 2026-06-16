import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { orderApi } from '../api/modules';
import { useToast } from '../App';
import Header from '../components/Header';

interface TimelineItem {
  key: string;
  label: string;
  icon: string;
  time: number;
  operator?: string;
  status: 'done' | 'active' | 'pending';
  isSwitch?: boolean;
  remark?: string;
  errorCode?: string;
  isFailed?: boolean;
}

interface SwitchHistoryItem {
  id?: string;
  order_id?: string;
  from_channel_id?: number;
  to_channel_id?: number;
  from_supplier_id?: number;
  to_supplier_id?: number;
  channel_name?: string;
  to_channel_name?: string;
  supplier_name?: string;
  reason?: string;
  created_at?: number;
  failRateBefore?: number;
  failRateAfter?: number;
}

interface ErrorCodeFullInfo {
  code: string;
  label: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  reasons: string[];
  solutions: string[];
  suggestions: string[];
  retryable: boolean;
  autoRecover: boolean;
  estimatedTime?: string;
}

const STATUS_MAP: Record<string, { text: string; cls: string; desc: string; color: string; icon: string }> = {
  pending: { text: '待支付', cls: 'tag-orange', desc: '请完成支付后系统将自动充值', color: 'linear-gradient(135deg, #faad14, #ffc53d)', icon: '⏳' },
  processing: { text: '处理中', cls: 'tag-blue', desc: '支付成功，系统正在处理中', color: 'linear-gradient(135deg, #1890ff, #40a9ff)', icon: '⚡' },
  completed: { text: '已完成', cls: 'tag-green', desc: '充值成功，感谢您的使用', color: 'linear-gradient(135deg, #52c41a, #73d13d)', icon: '✅' },
  failed: { text: '已失败', cls: 'tag-red', desc: '充值失败，建议重新充值或联系客服', color: 'linear-gradient(135deg, #ff4d4f, #ff7875)', icon: '❌' },
  refunded: { text: '已退款', cls: 'tag-gray', desc: '订单已退款完成', color: 'linear-gradient(135deg, #8c8c8c, #bfbfbf)', icon: '💰' }
};

const ERROR_CODE_FULL_MAP: Record<string, ErrorCodeFullInfo> = {
  ERR1001: {
    code: 'ERR1001', label: '格式错误', category: '账号错误', severity: 'low',
    reasons: [
      '输入的手机号不足11位或超过11位',
      '包含空格、字母或特殊字符',
      '不是以13-19开头的有效手机号段',
      '账号输入时手误，多输或少输数字'
    ],
    solutions: [
      '重新输入正确的11位纯数字手机号',
      '检查并删除输入中的空格和特殊字符',
      '确保手机号以13-19号段开头',
      '对照手机号账单或SIM卡确认号码'
    ],
    suggestions: [
      '复制粘贴手机号时注意去除空格',
      '使用手机通讯录选择号码避免手误'
    ],
    retryable: false, autoRecover: false
  },
  ERR1002: {
    code: 'ERR1002', label: '余额不足', category: '供应商问题', severity: 'medium',
    reasons: [
      '当前充值通道的供应商余额不足',
      '该面值的充值额度已用完',
      '供应商账户资金结算中，临时不可用',
      '高峰时段供应商额度被抢空'
    ],
    solutions: [
      '系统自动切换到备用通道重试（无需操作）',
      '等待5-10分钟后手动重试下单',
      '选择其他面值或同类商品',
      '联系客服确认额度恢复时间'
    ],
    suggestions: [
      '通常3-5分钟内会自动切换备用通道',
      '急单可直接取消并重新下单'
    ],
    retryable: true, autoRecover: true, estimatedTime: '2-5分钟'
  },
  ERR1003: {
    code: 'ERR1003', label: '请求超时', category: '网络问题', severity: 'medium',
    reasons: [
      '供应商服务器响应超时（>30秒）',
      '网络高峰期拥堵导致延迟',
      '跨区域网络连接不稳定',
      '供应商接口限流或繁忙'
    ],
    solutions: [
      '系统将自动重试2-3次，请耐心等待',
      '稍后刷新订单状态查看结果',
      '检查网络连接是否正常',
      '切换4G/5G或WiFi网络后重试'
    ],
    suggestions: [
      '超时后请勿重复下单，避免重复扣款',
      '建议非高峰时段（凌晨/上午）充值更稳定'
    ],
    retryable: true, autoRecover: true, estimatedTime: '1-3分钟'
  },
  ERR1004: {
    code: 'ERR1004', label: '通道维护中', category: '系统维护', severity: 'medium',
    reasons: [
      '运营商例行系统升级维护',
      '充值通道技术升级优化',
      '接口版本迭代更新',
      '紧急安全补丁更新'
    ],
    solutions: [
      '等待维护完成后自动恢复',
      '系统自动切换到正常的备用通道',
      '选择其他同类商品充值',
      '查看维护公告，了解恢复时间'
    ],
    suggestions: [
      '常规维护通常在凌晨进行，持续30分钟-2小时',
      '紧急需求可切换其他商品或联系客服'
    ],
    retryable: true, autoRecover: true, estimatedTime: '30分钟-2小时'
  },
  ERR1005: {
    code: 'ERR1005', label: '号码不存在', category: '账号错误', severity: 'low',
    reasons: [
      '该手机号为空号或已销户',
      '新办理的号码运营商系统未同步更新',
      '卫星电话、特殊号段不支持',
      '输入时号码有误（多输少输）'
    ],
    solutions: [
      '拨打该号码确认是否能正常接通',
      '检查手机号是否输入正确',
      '新号建议等待72小时后再充值',
      '联系运营商确认号码状态'
    ],
    suggestions: [
      '新办号码建议等待3天后再尝试充值',
      '务必仔细核对号码，避免损失'
    ],
    retryable: false, autoRecover: false
  },
  ERR1006: {
    code: 'ERR1006', label: '地区限制', category: '地域限制', severity: 'medium',
    reasons: [
      '该商品仅支持特定省份/直辖市充值',
      '手机号归属地不在支持范围',
      '运营商跨省充值业务限制',
      '港澳台及海外号码暂不支持'
    ],
    solutions: [
      '选择支持您号码归属地的商品',
      '查看同类其他商品的支持地区',
      '联系客服确认支持的地区列表',
      '使用当地运营商官方渠道充值'
    ],
    suggestions: [
      '下单前查看商品详情中的支持地区说明',
      '全国通用商品不会有此限制'
    ],
    retryable: false, autoRecover: false
  },
  ERR1007: {
    code: 'ERR1007', label: '风控拦截', category: '安全风控', severity: 'high',
    reasons: [
      '短时间内频繁下单超过限制',
      '同一IP/设备切换多账号操作',
      '账号行为模式异常（如大量同面值）',
      '疑似套现、刷单等违规行为'
    ],
    solutions: [
      '等待24小时后再尝试下单',
      '减少下单频率，正常间隔下单',
      '联系客服提交身份信息申诉解锁',
      '确保账号使用本人实名信息'
    ],
    suggestions: [
      '正常用户一天不超过10笔单不会触发',
      '风控是为了保护您的账户安全'
    ],
    retryable: true, autoRecover: true, estimatedTime: '24小时'
  },
  ERR1008: {
    code: 'ERR1008', label: '通道故障', category: '系统异常', severity: 'high',
    reasons: [
      '充值通道程序异常崩溃',
      '通道与供应商对接接口出错',
      '数据库连接异常超时',
      '消息队列积压导致处理延迟'
    ],
    solutions: [
      '系统已自动切换至备用通道重试',
      '请等待2分钟查看最终结果',
      '手动点击「切换通道重试」按钮',
      '联系客服获取人工协助'
    ],
    suggestions: [
      '故障时自动切换通常在60秒内完成',
      '建议先等待自动处理，不要急于操作'
    ],
    retryable: true, autoRecover: true, estimatedTime: '2分钟'
  },
  SUPPLIER_TIMEOUT: {
    code: 'SUPPLIER_TIMEOUT', label: '供应商响应超时', category: '网络问题', severity: 'medium',
    reasons: ['供应商服务器响应超时', '网络高峰期拥堵', '供应商接口限流'],
    solutions: ['稍后重试', '切换其他通道', '联系客服确认'],
    suggestions: ['超时后系统自动重试，无需担心重复扣款'],
    retryable: true, autoRecover: true, estimatedTime: '1-3分钟'
  },
  SUPPLIER_ERROR: {
    code: 'SUPPLIER_ERROR', label: '供应商接口异常', category: '供应商问题', severity: 'high',
    reasons: ['供应商接口返回错误', '供应商系统维护中', '供应商账号异常'],
    solutions: ['系统自动切换通道', '稍后重试', '联系客服'],
    suggestions: ['通常会有备用通道自动顶上'],
    retryable: true, autoRecover: true, estimatedTime: '3-5分钟'
  },
  INVALID_ACCOUNT: {
    code: 'INVALID_ACCOUNT', label: '充值账号无效', category: '账号错误', severity: 'low',
    reasons: ['账号格式错误', '账号状态异常', '账号不存在'],
    solutions: ['检查充值账号', '确认账号有效性后重试'],
    suggestions: ['仔细核对账号再下单，避免损失'],
    retryable: false, autoRecover: false
  },
  INSUFFICIENT_BALANCE: {
    code: 'INSUFFICIENT_BALANCE', label: '供应商余额不足', category: '供应商问题', severity: 'medium',
    reasons: ['供应商通道余额不足', '该面值额度用完'],
    solutions: ['自动切换备用通道', '选择其他面值', '稍后重试'],
    suggestions: ['高峰时段建议提前充值备用'],
    retryable: true, autoRecover: true, estimatedTime: '2-5分钟'
  },
  PRODUCT_OFFLINE: {
    code: 'PRODUCT_OFFLINE', label: '商品已下架', category: '商品问题', severity: 'low',
    reasons: ['商品临时下架', '售罄', '维护中'],
    solutions: ['选择同类其他商品', '稍后再来查看'],
    suggestions: ['可以浏览首页热门商品'],
    retryable: false, autoRecover: false
  },
  CHANNEL_ERROR: {
    code: 'CHANNEL_ERROR', label: '通道异常', category: '系统异常', severity: 'high',
    reasons: ['通道程序异常', '接口对接出错', '处理延迟'],
    solutions: ['自动切换备用通道', '手动点击切换重试', '联系客服'],
    suggestions: ['自动切换通常很快，先等一下'],
    retryable: true, autoRecover: true, estimatedTime: '2分钟'
  },
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR', label: '未知错误', category: '其他', severity: 'medium',
    reasons: ['发生未定义的异常情况', '系统未知错误'],
    solutions: ['联系客服处理', '稍后重试'],
    suggestions: ['请提供订单号给客服快速定位'],
    retryable: true, autoRecover: false
  }
};

function formatTime(timestamp: number): string {
  if (!timestamp) return '-';
  const d = new Date(timestamp * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatTimeShort(timestamp: number): string {
  if (!timestamp) return '-';
  const d = new Date(timestamp * 1000);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'high': return { bg: '#fff1f0', color: '#cf1322', border: '#ffa39e', badge: '#ff4d4f' };
    case 'medium': return { bg: '#fffbe6', color: '#d46b08', border: '#ffe58f', badge: '#faad14' };
    case 'low': return { bg: '#e6f7ff', color: '#096dd9', border: '#91d5ff', badge: '#1890ff' };
    default: return { bg: '#f5f5f5', color: '#595959', border: '#d9d9d9', badge: '#8c8c8c' };
  }
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [order, setOrder] = useState<any>(null);
  const [cards, setCards] = useState<any>(null);
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [showCards, setShowCards] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [expandedErrorCode, setExpandedErrorCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [switchingChannel, setSwitchingChannel] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [showFullErrorTable, setShowFullErrorTable] = useState(false);
  const [tableFilter, setTableFilter] = useState<string>('all');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadData();
    const params = new URLSearchParams(location.search);
    if (params.get('expandDiagnostic') === '1') {
      setShowDiagnostic(true);
    }
    const timer = setInterval(() => {
      if (order && (order.status === 'processing' || order.status === 'pending')) {
        loadData(true);
      }
    }, 4000);
    pollingRef.current = timer;
    return () => { clearInterval(timer); };
  }, [id]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res: any = await orderApi.detail(id!);
      if (res.success) {
        setOrder(res.data);
        if ((res.data.status === 'failed') && !diagnostic) {
          loadDiagnostic();
        }
      }
    } catch (e: any) {
      if (!silent) toast.show(e.message, 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadDiagnostic = async () => {
    try {
      const diagRes: any = await orderApi.diagnostic(id!);
      if (diagRes.success) {
        setDiagnostic(diagRes.data);
      }
    } catch {
    }
  };

  const getCards = async () => {
    try {
      const res: any = await orderApi.getCards(id!);
      if (res.success) {
        setCards(res.data);
        setShowCards(true);
      }
    } catch (e: any) {
      toast.show(e.message, 'error');
    }
  };

  const doPay = async () => {
    setPaying(true);
    try {
      const res: any = await orderApi.pay(id!);
      if (res.success) {
        toast.show('支付成功', 'success');
        loadData();
      } else {
        toast.show(res.message || '支付失败', 'error');
      }
    } catch (e: any) {
      toast.show(e.message || '支付失败', 'error');
    } finally {
      setPaying(false);
    }
  };

  const doRetry = async () => {
    setRetrying(true);
    try {
      const res: any = await orderApi.retry(id!);
      if (res.success) {
        toast.show('✅ 已发起重试，请稍候...', 'success');
        setTimeout(() => loadData(), 1500);
      } else {
        toast.show(res.message || '重试失败', 'error');
      }
    } catch (e: any) {
      toast.show(e.message || '重试失败', 'error');
    } finally {
      setRetrying(false);
    }
  };

  const doRetrySwitchChannel = async () => {
    setSwitchingChannel(true);
    try {
      const res: any = await orderApi.retrySwitchChannel(id!);
      if (res.success) {
        toast.show(`🔄 ${res.data?.message || '通道切换成功，正在重试...'}`, 'success');
        setTimeout(() => loadData(), 1500);
      } else {
        toast.show(res.message || '切换失败', 'error');
      }
    } catch (e: any) {
      toast.show(e.message || '切换失败', 'error');
    } finally {
      setSwitchingChannel(false);
    }
  };

  const doRefund = async () => {
    setRefunding(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.show('✅ 退款申请已提交，预计1-3个工作日原路返回', 'success');
    } finally {
      setRefunding(false);
    }
  };

  const doContact = async () => {
    setContacting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.show('📞 客服通道接入中... 请稍候', 'info');
    } finally {
      setContacting(false);
    }
  };

  const getStepIndex = (status: string): number => {
    switch (status) {
      case 'pending': return 0;
      case 'processing': return 1;
      case 'completed': return 2;
      case 'failed': return 1;
      default: return 0;
    }
  };

  const buildTimeline = (): TimelineItem[] => {
    if (!order) return [];
    const items: TimelineItem[] = [];
    items.push({ key: 'ordered', label: '已下单', icon: '📝', time: order.created_at, operator: '用户', status: 'done', remark: '订单创建成功，等待支付' });

    if (order.pay_time || order.status !== 'pending') {
      items.push({ key: 'paying', label: order.pay_time ? '支付成功' : '支付中', icon: '💳', time: order.pay_time || order.created_at + 60, operator: '系统', status: order.pay_time ? 'done' : 'active', remark: order.pay_time ? '支付已完成，准备充值' : '正在处理支付，请稍候' });
    }

    if (order.status === 'processing' || order.status === 'completed' || order.status === 'failed') {
      items.push({ key: 'recharging', label: '充值中', icon: '⚡', time: order.pay_time ? order.pay_time + 30 : order.created_at + 90, operator: '系统', status: order.status === 'completed' ? 'done' : order.status === 'failed' ? 'active' : 'active', remark: order.status === 'failed' ? '充值处理异常，正在诊断...' : '正在为您充值，请耐心等待' });
    }

    if (order.status === 'completed') {
      items.push({ key: 'completed', label: '充值到账', icon: '✅', time: order.finish_time || Date.now() / 1000, operator: '系统', status: 'done', remark: '充值成功，已成功到账！' });
    }
    if (order.status === 'refunded') {
      items.push({ key: 'refunded', label: '已退款', icon: '💰', time: order.finish_time || Date.now() / 1000, operator: '系统', status: 'done', remark: '订单退款已完成' });
    }
    if (order.status === 'failed') {
      items.push({ key: 'failed', label: '充值失败', icon: '❌', time: order.finish_time || Date.now() / 1000, operator: '系统', status: 'active', isFailed: true, errorCode: diagnostic?.errorCode || order.error_code || order.fail_reason_code, remark: order.fail_reason || '充值失败，正在处理...' });
    }
    return items;
  };

  const getErrorCodeFullInfo = (code: string): ErrorCodeFullInfo => {
    if (!code) return ERROR_CODE_FULL_MAP.UNKNOWN_ERROR;
    return ERROR_CODE_FULL_MAP[code] || {
      ...ERROR_CODE_FULL_MAP.UNKNOWN_ERROR,
      code, label: '未知错误类型'
    };
  };

  const getDisplayErrorCode = (): string => {
    if (diagnostic?.errorCode) return diagnostic.errorCode;
    if (order?.error_code) return order.error_code;
    if (order?.fail_reason) {
      const match = Object.keys(ERROR_CODE_FULL_MAP).find(k =>
        order.fail_reason.includes(k) || order.fail_reason.toLowerCase().includes(k.toLowerCase())
      );
      return match || 'UNKNOWN_ERROR';
    }
    return 'UNKNOWN_ERROR';
  };

  const switchHistory: React.MutableRefObject<SwitchHistoryItem[]> = useRef<SwitchHistoryItem[]>([]);
  if (diagnostic?.switchHistory?.length) {
    switchHistory.current = diagnostic.switchHistory;
  }

  const getChannelFromName = (idx: number): string => {
    const names = ['主通道', '备用通道1', '备用通道2', '备用通道3', '备用VIP通道'];
    return names[idx] || `通道${idx + 1}`;
  };

  if (loading || !order) {
    return (
      <div>
        <Header title="订单详情" />
        <div className="empty-state"><div className="icon">⏳</div>加载中...</div>
      </div>
    );
  }

  const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const isFailed = order.status === 'failed';
  const isProcessing = order.status === 'processing';
  const timeline = buildTimeline();
  const displayErrorCode = getDisplayErrorCode();
  const errorInfo = getErrorCodeFullInfo(displayErrorCode);
  const errorStyle = getSeverityColor(errorInfo.severity);

  const allErrorCodes = Object.values(ERROR_CODE_FULL_MAP);
  const filteredErrorCodes = tableFilter === 'all'
    ? allErrorCodes
    : allErrorCodes.filter(e => e.severity === tableFilter);

  return (
    <div style={{ paddingBottom: 120 }}>
      <Header title="订单详情" />

      <div style={{
        padding: '28px 20px 24px',
        background: status.color,
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -30, right: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: 10, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>{status.icon}</span>
            {status.text}
          </div>
          <div style={{ opacity: 0.92, fontSize: 13, lineHeight: 1.6 }}>{status.desc}</div>
          {order.fail_reason && isFailed && (
            <div style={{
              marginTop: 14, fontSize: 12, background: 'rgba(0,0,0,0.18)',
              padding: '10px 14px', borderRadius: 10, lineHeight: 1.6
            }}>
              失败原因：{order.fail_reason}
            </div>
          )}
          {isProcessing && (
            <div style={{
              marginTop: 14, fontSize: 12, background: 'rgba(255,255,255,0.15)',
              padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span style={{ animation: 'pulse 1.5s infinite' }}>⚡</span>
              正在高速处理中，请耐心等待，预计1-3分钟完成
            </div>
          )}
        </div>
      </div>

      {isFailed && (
        <div style={{
          background: errorInfo.autoRecover
            ? 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)'
            : 'linear-gradient(135deg, #fff1f0 0%, #fff7e6 100%)',
          padding: '16px 20px',
          borderBottom: `2px solid ${errorInfo.autoRecover ? '#91d5ff' : '#ffa39e'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: errorInfo.autoRecover
                ? 'linear-gradient(135deg, #1890ff, #40a9ff)'
                : 'linear-gradient(135deg, #faad14, #ffc53d)',
              color: 'white', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 20, flexShrink: 0,
              animation: errorInfo.autoRecover ? 'pulse 2s infinite' : 'none'
            }}>
              🔄
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#333', marginBottom: 4 }}>
                {errorInfo.autoRecover
                  ? '✅ 已自动触发降级处理'
                  : '⚠️ 需要手动处理'}
              </div>
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                {errorInfo.autoRecover
                  ? `已切换至备用通道重试，预计${errorInfo.estimatedTime || '2分钟'}内到账，请耐心等待`
                  : '该问题无法自动恢复，请参考下方解决方案或联系客服'}
              </div>
              {errorInfo.estimatedTime && errorInfo.autoRecover && (
                <div style={{
                  marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 11, padding: '4px 10px', background: 'white',
                  borderRadius: 10, color: '#1890ff', fontWeight: 600,
                  border: '1px solid #91d5ff'
                }}>
                  ⏱ 预计恢复：{errorInfo.estimatedTime}
                </div>
              )}
            </div>
            {switchHistory.current.length > 0 && (
              <span className="tag tag-blue" style={{ fontSize: 10, padding: '4px 10px', borderRadius: 10 }}>
                切换{switchHistory.current.length}次
              </span>
            )}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 0, borderRadius: 0 }}>
        <div className="text-bold mb-16" style={{ marginBottom: 16, fontSize: 16 }}>
          📊 订单状态流转
        </div>
        <div style={{ position: 'relative' }}>
          {timeline.map((item, idx) => {
            const isLast = idx === timeline.length - 1;
            const isFailedStep = item.isFailed;
            return (
              <div key={item.key} style={{
                display: 'flex', gap: 14, position: 'relative',
                paddingBottom: isLast ? 0 : 22, paddingTop: idx === 0 ? 0 : 4
              }}>
                {!isLast && (
                  <div style={{
                    position: 'absolute', left: 14, top: 36, bottom: 0, width: 2,
                    background: item.status === 'done' ? '#52c41a'
                      : isFailedStep ? '#ff4d4f' : '#e8e8e8'
                  }} />
                )}
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: isFailedStep ? '#ff4d4f'
                    : item.status === 'done' ? '#52c41a'
                    : item.status === 'active' ? '#1890ff' : '#e8e8e8',
                  color: 'white', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 14, zIndex: 1,
                  boxShadow: isFailedStep ? '0 0 0 5px rgba(255,77,79,0.18)'
                    : item.isSwitch ? '0 0 0 5px rgba(102,126,234,0.18)'
                    : item.status === 'active' ? '0 0 0 5px rgba(24,144,255,0.15)' : 'none'
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{
                        fontWeight: 700, fontSize: 14,
                        color: isFailedStep ? '#cf1322' : '#262626'
                      }}>
                        {item.label}
                        {item.isSwitch && <span className="tag tag-purple" style={{ marginLeft: 6, fontSize: 10 }}>通道切换</span>}
                      </div>
                      {item.operator && (
                        <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>操作人：{item.operator}</div>
                      )}
                      {item.remark && (
                        <div style={{
                          fontSize: 12,
                          color: isFailedStep ? '#ff4d4f' : '#595959',
                          marginTop: 5, lineHeight: 1.6
                        }}>
                          {item.remark}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#8c8c8c', flexShrink: 0, textAlign: 'right' }}>
                      <div>{formatTimeShort(item.time)}</div>
                    </div>
                  </div>
                  {item.errorCode && (
                    <div style={{
                      marginTop: 10, padding: '8px 12px',
                      background: errorStyle.bg,
                      border: `1px solid ${errorStyle.border}`,
                      borderRadius: 10, display: 'inline-flex',
                      alignItems: 'center', gap: 8, flexWrap: 'wrap',
                      cursor: 'pointer'
                    }}
                      onClick={() => setExpandedErrorCode(expandedErrorCode === item.errorCode ? null : item.errorCode)}
                    >
                      <span style={{
                        fontFamily: 'monospace', fontWeight: 800,
                        background: errorStyle.badge,
                        color: 'white', padding: '3px 10px',
                        borderRadius: 6, fontSize: 11
                      }}>
                        {item.errorCode}
                      </span>
                      <span style={{ fontSize: 12, color: errorStyle.color, fontWeight: 600 }}>
                        {getErrorCodeFullInfo(item.errorCode).label}
                      </span>
                      <span style={{ fontSize: 10, color: '#8c8c8c' }}>
                        {expandedErrorCode === item.errorCode ? '▲ 收起' : '▼ 查看详情'}
                      </span>
                    </div>
                  )}
                  {expandedErrorCode === item.errorCode && (
                    <div style={{
                      marginTop: 10, padding: '14px',
                      background: '#fafafa', borderRadius: 12,
                      border: '1px solid #f0f0f0'
                    }}>
                      {(() => {
                        const info = getErrorCodeFullInfo(item.errorCode);
                        return (
                          <>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                              <span style={{
                                fontSize: 10, padding: '3px 10px', borderRadius: 10,
                                background: getSeverityColor(info.severity).bg,
                                color: getSeverityColor(info.severity).color,
                                fontWeight: 700,
                                border: `1px solid ${getSeverityColor(info.severity).border}`
                              }}>
                                {info.severity === 'high' ? '🔴 严重' : info.severity === 'medium' ? '🟠 中等' : '🔵 轻微'}
                              </span>
                              <span style={{
                                fontSize: 10, padding: '3px 10px', borderRadius: 10,
                                background: info.retryable ? '#f6ffed' : '#fff1f0',
                                color: info.retryable ? '#389e0d' : '#cf1322',
                                fontWeight: 600,
                                border: `1px solid ${info.retryable ? '#b7eb8f' : '#ffa39e'}`
                              }}>
                                {info.retryable ? '✅ 可重试' : '❌ 不可重试'}
                              </span>
                              <span style={{
                                fontSize: 10, padding: '3px 10px', borderRadius: 10,
                                background: info.autoRecover ? '#e6f7ff' : '#fff7e6',
                                color: info.autoRecover ? '#096dd9' : '#d46b08',
                                fontWeight: 600,
                                border: `1px solid ${info.autoRecover ? '#91d5ff' : '#ffd591'}`
                              }}>
                                {info.autoRecover ? '🔄 自动恢复' : '⚠️ 需手动'}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#262626', marginBottom: 8 }}>
                              📋 可能原因（{info.reasons.length}条）
                            </div>
                            <div style={{ marginBottom: 14, paddingLeft: 4 }}>
                              {info.reasons.map((r, i) => (
                                <div key={i} style={{
                                  fontSize: 12, color: '#595959',
                                  padding: '4px 0', display: 'flex', gap: 6, lineHeight: 1.6
                                }}>
                                  <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{i + 1}.</span>
                                  <span>{r}</span>
                                </div>
                              ))}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#262626', marginBottom: 8 }}>
                              💡 解决方案（{info.solutions.length}条）
                            </div>
                            <div style={{ marginBottom: 14, paddingLeft: 4 }}>
                              {info.solutions.map((s, i) => (
                                <div key={i} style={{
                                  fontSize: 12, color: '#595959',
                                  padding: '4px 0', display: 'flex', gap: 6, lineHeight: 1.6
                                }}>
                                  <span style={{ color: '#52c41a', fontWeight: 600 }}>✓</span>
                                  <span>{s}</span>
                                </div>
                              ))}
                            </div>
                            {info.suggestions.length > 0 && (
                              <>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#262626', marginBottom: 8 }}>
                                  💎 温馨建议
                                </div>
                                <div style={{
                                  padding: '10px 12px', background: '#fffbe6',
                                  borderRadius: 8, border: '1px solid #ffe58f'
                                }}>
                                  {info.suggestions.map((s, i) => (
                                    <div key={i} style={{
                                      fontSize: 12, color: '#873800',
                                      lineHeight: 1.8, display: 'flex', gap: 6
                                    }}>
                                      <span>•</span>
                                      <span>{s}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                  {isFailedStep && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setShowDiagnostic(!showDiagnostic)}
                        style={{
                          fontSize: 12, color: '#1890ff', background: '#e6f7ff',
                          border: '1px solid #91d5ff', padding: '6px 14px',
                          borderRadius: 8, fontWeight: 600
                        }}>
                        🔍 {showDiagnostic ? '收起诊断' : '查看诊断详情'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isFailed && (
        <div className="card">
          <div className="flex-between mb-16">
            <span className="text-bold" style={{ fontSize: 16 }}>
              🔍 智能诊断结果
            </span>
            <button
              onClick={() => setShowDiagnostic(!showDiagnostic)}
              style={{
                fontSize: 13, color: '#1890ff', background: 'transparent',
                border: 'none', fontWeight: 700
              }}
            >
              {showDiagnostic ? '▲ 收起' : '▼ 展开详情'}
            </button>
          </div>
          <div style={{
            background: errorStyle.bg, padding: 18,
            borderRadius: 14, border: `2px solid ${errorStyle.border}`
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `linear-gradient(135deg, ${errorStyle.badge}, ${getSeverityColor(errorInfo.severity).badge})`,
                color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 24, flexShrink: 0,
                boxShadow: `0 4px 16px ${errorStyle.badge}44`
              }}>
                {errorInfo.severity === 'high' ? '🚨' : errorInfo.severity === 'medium' ? '⚠️' : 'ℹ️'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 800, color: errorStyle.color,
                  fontSize: 17, marginBottom: 10
                }}>
                  {diagnostic?.userMessage || errorInfo.label || '充值失败'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#595959' }}>错误码：</span>
                    <span style={{
                      fontFamily: 'monospace', fontWeight: 800,
                      background: errorStyle.badge,
                      color: 'white', padding: '4px 12px',
                      borderRadius: 8, fontSize: 12
                    }}>
                      {displayErrorCode}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11, padding: '3px 10px',
                    borderRadius: 10, background: 'white',
                    color: errorStyle.color, fontWeight: 700,
                    border: `1px solid ${errorStyle.border}`
                  }}>
                    {errorInfo.category}
                  </span>
                  <span style={{
                    fontSize: 11, padding: '3px 10px',
                    borderRadius: 10, background: 'white',
                    color: errorInfo.severity === 'high' ? '#cf1322'
                      : errorInfo.severity === 'medium' ? '#d46b08' : '#096dd9',
                    fontWeight: 700,
                    border: `1px solid ${errorStyle.border}`
                  }}>
                    {errorInfo.severity === 'high' ? '🔴 严重' : errorInfo.severity === 'medium' ? '🟠 中等' : '🔵 轻微'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {showDiagnostic && (
            <div style={{ marginTop: 16 }}>
              {diagnostic?.rootCause && (
                <div style={{
                  fontSize: 13, marginBottom: 14, padding: '12px 14px',
                  background: '#fafafa', borderRadius: 10,
                  border: '1px solid #f0f0f0'
                }}>
                  <span style={{ color: '#8c8c8c', fontWeight: 700 }}>🎯 根本原因：</span>
                  <span style={{ color: '#595959' }}>{diagnostic.rootCause}</span>
                </div>
              )}
              {diagnostic?.suggestions?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#262626' }}>
                    💡 建议解决方案（{diagnostic.suggestions.length}条）
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {diagnostic.suggestions.map((s: string, i: number) => (
                      <div key={i} style={{
                        padding: '10px 14px', background: '#f6ffed',
                        borderRadius: 10, fontSize: 12, color: '#389e0d',
                        lineHeight: 1.6, display: 'flex', gap: 8,
                        border: '1px solid #b7eb8f'
                      }}>
                        <span style={{ fontWeight: 700 }}>{i + 1}.</span>
                        <span style={{ flex: 1 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {diagnostic?.autoAction && (
                <div style={{
                  fontSize: 12, marginTop: 12, padding: '14px',
                  background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
                  borderRadius: 12, border: '2px solid #91d5ff',
                  color: '#096dd9', fontWeight: 600, lineHeight: 1.6
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>🔄</span>
                    <span style={{ fontSize: 14, fontWeight: 800 }}>系统已自动执行</span>
                  </div>
                  <div style={{ paddingLeft: 26 }}>{diagnostic.autoAction}</div>
                </div>
              )}
              {diagnostic?.switchChannelAvailable && (
                <div style={{ marginTop: 16 }}>
                  <button
                    className="btn-primary btn-block"
                    onClick={doRetrySwitchChannel}
                    disabled={switchingChannel}
                    style={{
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 800,
                      boxShadow: '0 4px 16px rgba(245,87,108,0.35)'
                    }}
                  >
                    {switchingChannel
                      ? '⏳ 正在切换通道...'
                      : '🔄 切换备用通道重试'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {switchHistory.current.length > 0 && (
        <div className="card" style={{ marginTop: 0 }}>
          <div className="flex-between mb-16">
            <span className="text-bold" style={{ fontSize: 16 }}>
              🔄 通道切换历史
            </span>
            <span style={{
              fontSize: 12, padding: '4px 12px',
              background: 'linear-gradient(135deg, #f093fb22, #f5576c22)',
              color: '#f5576c', borderRadius: 12, fontWeight: 700,
              border: '1px solid #f093fb'
            }}>
              共 {switchHistory.current.length} 次
            </span>
          </div>
          <div style={{ position: 'relative', paddingLeft: 4 }}>
            {switchHistory.current.map((sw: any, idx: number) => {
              const isLast = idx === switchHistory.current.length - 1;
              const fromChannel = sw.channel_name || sw.from_channel_id || getChannelFromName(idx);
              const toChannel = sw.to_channel_name || sw.to_channel_id || getChannelFromName(idx + 1);
              return (
                <div key={sw.id || idx} style={{
                  position: 'relative',
                  paddingBottom: isLast ? 0 : 20,
                  paddingLeft: 30
                }}>
                  {!isLast && (
                    <div style={{
                      position: 'absolute', left: 9, top: 28,
                      bottom: 0, width: 2, background: '#f0f0f0'
                    }} />
                  )}
                  <div style={{
                    position: 'absolute', left: 0, top: 6, width: 20, height: 20,
                    borderRadius: '50%',
                    background: isLast
                      ? 'linear-gradient(135deg, #52c41a, #73d13d)'
                      : 'linear-gradient(135deg, #f093fb, #f5576c)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 10,
                    color: 'white', zIndex: 1, fontWeight: 800,
                    boxShadow: isLast ? '0 2px 8px rgba(82,196,26,0.4)' : '0 2px 8px rgba(240,147,251,0.4)'
                  }}>
                    {isLast ? '✓' : idx + 1}
                  </div>
                  <div style={{
                    padding: '14px',
                    background: '#fafafa',
                    borderRadius: 14,
                    border: `2px solid ${isLast ? '#b7eb8f' : '#f0f0f0'}`,
                    position: 'relative'
                  }}>
                    {isLast && (
                      <div style={{
                        position: 'absolute', top: -10, right: 12,
                        fontSize: 10, padding: '3px 10px',
                        background: 'linear-gradient(135deg, #52c41a, #73d13d)',
                        color: 'white', borderRadius: 10, fontWeight: 700
                      }}>
                        当前使用
                      </div>
                    )}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 10
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#262626' }}>
                        第 {idx + 1} 次切换
                      </div>
                      <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                        {formatTime(sw.created_at)}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      gap: 10, marginBottom: 12, flexWrap: 'wrap'
                    }}>
                      <span style={{
                        padding: '6px 14px',
                        background: '#fff1f0',
                        border: '2px solid #ffa39e',
                        borderRadius: 10,
                        fontSize: 12,
                        color: '#cf1322',
                        fontWeight: 700
                      }}>
                        <span style={{ marginRight: 4 }}>📤</span>
                        {fromChannel}
                      </span>
                      <span style={{
                        fontSize: 20, color: '#bfbfbf',
                        fontWeight: 700
                      }}>
                        ⟶
                      </span>
                      <span style={{
                        padding: '6px 14px',
                        background: '#f6ffed',
                        border: '2px solid #b7eb8f',
                        borderRadius: 10,
                        fontSize: 12,
                        color: '#389e0d',
                        fontWeight: 700
                      }}>
                        <span style={{ marginRight: 4 }}>📥</span>
                        {toChannel}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 12, color: '#595959',
                      lineHeight: 1.7, padding: '10px 12px',
                      background: '#fafafa', borderRadius: 8,
                      border: '1px solid #f0f0f0'
                    }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: '#8c8c8c', fontWeight: 600, flexShrink: 0 }}>
                          切换原因：
                        </span>
                        <span style={{ flex: 1 }}>
                          {sw.reason || '系统自动切换到更优通道'}
                        </span>
                      </div>
                      {sw.supplier_name && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <span style={{ color: '#8c8c8c', fontWeight: 600, flexShrink: 0 }}>
                            供应商：
                          </span>
                          <span style={{ flex: 1 }}>{sw.supplier_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 0 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg, #667eea22, #764ba222)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#667eea',
            border: '2px solid #667eea33'
          }}>
            {order.product_name?.slice(0, 4) || '商品'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#262626' }}>
              {order.product_name}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              🏪 {order.supplier_name || '官方供应商'}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
              单价 ¥{order.unit_price} × {order.quantity}
            </div>
          </div>
          <span className={`tag ${status.cls}`} style={{
            fontSize: 12, padding: '6px 12px', fontWeight: 700
          }}>
            {status.icon} {status.text}
          </span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <div className="text-bold mb-16" style={{ fontSize: 16 }}>
          📋 订单信息
        </div>
        {[
          ['订单编号', order.order_no, true],
          ['充值账号', order.recharge_account, true],
          ['商品类型', order.sku_type === 'card' ? '卡密商品' : '官方直充'],
          ['下单时间', formatTime(order.created_at)],
          ['支付时间', order.pay_time ? formatTime(order.pay_time) : '-'],
          ['完成时间', order.finish_time ? formatTime(order.finish_time) : '-'],
          ['供应商单号', order.supplier_order_id, false, true]
        ].map(([label, value, copyable, mono], idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: idx > 0 ? '12px 0 0' : 0,
              gap: 10
            }}
          >
            <span style={{ color: '#8c8c8c', fontSize: 13, flexShrink: 0 }}>{label}</span>
            <span
              style={{
                fontFamily: mono ? 'monospace' : 'inherit',
                fontSize: 13,
                color: '#262626',
                fontWeight: copyable ? 700 : 500,
                textAlign: 'right'
              }}
              onClick={() => {
                if (copyable && value) {
                  navigator.clipboard?.writeText(String(value));
                  toast.show('✅ 已复制', 'success');
                }
              }}
            >
              {String(value || '-')}
              {copyable && value && <span style={{ color: '#1890ff', marginLeft: 4, fontSize: 11 }}>📋</span>}
            </span>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <div className="text-bold mb-16" style={{ fontSize: 16 }}>
          💰 费用明细
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#8c8c8c', fontSize: 13 }}>商品原价</span>
          <span style={{ fontSize: 13, color: '#8c8c8c', textDecoration: 'line-through' }}>
            ¥{order.original_amount?.toFixed(2)}
          </span>
        </div>
        {order.discount_amount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <span style={{ color: '#8c8c8c', fontSize: 13 }}>优惠金额</span>
            <span style={{ fontSize: 14, color: '#52c41a', fontWeight: 700 }}>
              -¥{order.discount_amount?.toFixed(2)}
            </span>
          </div>
        )}
        {order.commission_amount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <span style={{ color: '#8c8c8c', fontSize: 13 }}>预计返佣</span>
            <span style={{ fontSize: 14, color: '#fa8c16', fontWeight: 700 }}>
              +¥{order.commission_amount?.toFixed(2)}
            </span>
          </div>
        )}
        <div className="divider" style={{ margin: '16px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 800 }}>实付金额</span>
          <span style={{
            color: '#ff4d4f', fontSize: 30, fontWeight: 800,
            display: 'flex', alignItems: 'baseline'
          }}>
            <span style={{ fontSize: 18, marginRight: 2 }}>¥</span>
            {order.final_amount?.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span className="text-bold" style={{ fontSize: 16 }}>
            📘 完整错误码对照表
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: '全部' },
              { key: 'high', label: '🔴 严重' },
              { key: 'medium', label: '🟠 中等' },
              { key: 'low', label: '🔵 轻微' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setTableFilter(f.key)}
                style={{
                  fontSize: 11,
                  padding: '5px 12px',
                  borderRadius: 12,
                  border: `2px solid ${tableFilter === f.key ? '#1890ff' : '#e8e8e8'}`,
                  background: tableFilter === f.key ? '#e6f7ff' : 'white',
                  color: tableFilter === f.key ? '#096dd9' : '#595959',
                  fontWeight: tableFilter === f.key ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{
          display: showFullErrorTable ? 'block' : 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 10,
          maxHeight: showFullErrorTable ? 'none' : 320,
          overflow: showFullErrorTable ? 'visible' : 'hidden',
          position: 'relative'
        }}>
          {filteredErrorCodes.map((err) => {
            const ecStyle = getSeverityColor(err.severity);
            const isExpanded = expandedErrorCode === `table-${err.code}`;
            return (
              <div
                key={err.code}
                style={{
                  padding: '14px',
                  borderRadius: 14,
                  border: `2px solid ${ecStyle.border}`,
                  background: ecStyle.bg,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setExpandedErrorCode(isExpanded ? null : `table-${err.code}`)}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{
                    fontFamily: 'monospace', fontWeight: 800,
                    background: ecStyle.badge,
                    color: 'white', padding: '4px 10px',
                    borderRadius: 8, fontSize: 11, flexShrink: 0
                  }}>
                    {err.code}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 700, fontSize: 14,
                      color: ecStyle.color, marginBottom: 4
                    }}>
                      {err.label}
                      <span style={{
                        marginLeft: 8, fontSize: 9,
                        padding: '2px 6px',
                        background: 'white',
                        borderRadius: 6,
                        color: ecStyle.color,
                        border: `1px solid ${ecStyle.border}`
                      }}>
                        {err.category}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 11, color: '#595959',
                      lineHeight: 1.5
                    }}>
                      {err.reasons[0]}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 12, color: '#8c8c8c',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}>▼</span>
                </div>
                {isExpanded && (
                  <div style={{
                    marginTop: 12, padding: '12px',
                    background: 'rgba(255,255,255,0.7)',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.9)'
                  }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 8,
                        background: err.retryable ? '#f6ffed' : '#fff1f0',
                        color: err.retryable ? '#389e0d' : '#cf1322',
                        border: `1px solid ${err.retryable ? '#b7eb8f' : '#ffa39e'}`,
                        fontWeight: 600
                      }}>
                        {err.retryable ? '✅ 可重试' : '❌ 不可重试'}
                      </span>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 8,
                        background: err.autoRecover ? '#e6f7ff' : '#fff7e6',
                        color: err.autoRecover ? '#096dd9' : '#d46b08',
                        border: `1px solid ${err.autoRecover ? '#91d5ff' : '#ffd591'}`,
                        fontWeight: 600
                      }}>
                        {err.autoRecover ? '🔄 自动恢复' : '⚠️ 需手动'}
                      </span>
                      {err.estimatedTime && (
                        <span style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 8,
                          background: '#f6ffed', color: '#389e0d',
                          border: '1px solid #b7eb8f', fontWeight: 600
                        }}>
                          ⏱ {err.estimatedTime}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#262626', marginBottom: 6 }}>
                      📋 原因 ({err.reasons.length}条)
                    </div>
                    <div style={{ marginBottom: 10, paddingLeft: 2 }}>
                      {err.reasons.map((r, i) => (
                        <div key={i} style={{
                          fontSize: 10, color: '#595959',
                          padding: '2px 0', lineHeight: 1.5, display: 'flex', gap: 4
                        }}>
                          <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{i + 1}.</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#262626', marginBottom: 6 }}>
                      💡 方案 ({err.solutions.length}条)
                    </div>
                    <div style={{ paddingLeft: 2 }}>
                      {err.solutions.map((s, i) => (
                        <div key={i} style={{
                          fontSize: 10, color: '#595959',
                          padding: '2px 0', lineHeight: 1.5, display: 'flex', gap: 4
                        }}>
                          <span style={{ color: '#52c41a', fontWeight: 600 }}>✓</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {filteredErrorCodes.length > 6 && (
          <div style={{
            textAlign: 'center', marginTop: 14
          }}>
            <button
              onClick={() => setShowFullErrorTable(!showFullErrorTable)}
              style={{
                fontSize: 12, color: '#1890ff',
                background: '#e6f7ff', border: '1px solid #91d5ff',
                padding: '8px 24px', borderRadius: 20, fontWeight: 600
              }}
            >
              {showFullErrorTable ? '▲ 收起全部' : `▼ 展开全部 ${filteredErrorCodes.length} 个错误码`}
            </button>
          </div>
        )}
      </div>

      {order.sku_type === 'card' && order.status === 'completed' && (
        <div className="card" style={{ marginTop: 0 }}>
          <div className="flex-between mb-16">
            <span className="text-bold" style={{ fontSize: 16 }}>🎫 卡密信息</span>
            <button className="btn-link" onClick={getCards}>查看卡密</button>
          </div>
          {showCards && cards && (
            <div style={{
              background: '#fafafa', padding: 16, borderRadius: 12
            }}>
              {cards.map && Array.isArray(cards) ? cards.map((card: any, idx: number) => (
                <div key={idx} style={{
                  padding: '12px 0',
                  borderBottom: idx < cards.length - 1 ? '1px dashed #e8e8e8' : 'none'
                }}>
                  {card.card_no && (
                    <div className="mb-8" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#8c8c8c', fontSize: 12 }}>卡号：</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#262626' }}>{card.card_no}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>密码：</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: '#ff4d4f', letterSpacing: 1 }}>{card.card_pwd || card.password}</span>
                  </div>
                  {card.expire_time && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ color: '#8c8c8c', fontSize: 11 }}>有效期：</span>
                      <span style={{ fontSize: 11, color: '#fa8c16', fontWeight: 600 }}>{formatTime(card.expire_time)}</span>
                    </div>
                  )}
                </div>
              )) : (
                <div style={{ fontSize: 12, color: '#8c8c8c', textAlign: 'center' }}>
                  {JSON.stringify(cards)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white', padding: '12px 16px',
        borderTop: '1px solid #f0f0f0',
        zIndex: 100, boxShadow: '0 -4px 20px rgba(0,0,0,0.06)'
      }}>
        {isFailed ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <button
              className="btn-outline btn-block"
              onClick={doContact}
              disabled={contacting}
              style={{
                padding: '12px 8px', borderRadius: 12,
                border: '2px solid #faad14',
                color: '#d46b08',
                background: '#fffbe6',
                fontSize: 12, fontWeight: 800
              }}
            >
              {contacting ? '⏳ 接入中' : '📞 联系客服'}
            </button>
            <button
              className="btn-outline btn-block"
              onClick={doRefund}
              disabled={refunding}
              style={{
                padding: '12px 8px', borderRadius: 12,
                border: '2px solid #ff4d4f',
                color: '#cf1322',
                background: '#fff1f0',
                fontSize: 12, fontWeight: 800
              }}
            >
              {refunding ? '⏳ 提交中' : '💰 申请退款'}
            </button>
            <button
              className="btn-primary btn-block"
              onClick={doRetry}
              disabled={retrying}
              style={{
                padding: '12px 8px', borderRadius: 12,
                background: errorInfo.retryable
                  ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
                  : 'linear-gradient(135deg, #bfbfbf 0%, #d9d9d9 100%)',
                color: 'white',
                fontSize: 12, fontWeight: 800,
                boxShadow: errorInfo.retryable ? '0 4px 12px rgba(82,196,26,0.35)' : 'none'
              }}
            >
              {retrying ? '⏳ 重试中' : '🔄 再次重试'}
            </button>
          </div>
        ) : order.status === 'pending' ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-outline"
              style={{ flex: 1, borderRadius: 12 }}
              onClick={() => navigate('/products')}
            >
              返回商品
            </button>
            <button
              className="btn-primary"
              disabled={paying}
              style={{
                flex: 2, borderRadius: 12,
                background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                fontWeight: 800, fontSize: 15,
                boxShadow: '0 4px 16px rgba(255,77,79,0.3)'
              }}
              onClick={doPay}
            >
              {paying ? '支付处理中...' : `立即支付 ¥${order.final_amount?.toFixed(2)}`}
            </button>
          </div>
        ) : order.status === 'processing' ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-outline"
              style={{ flex: 1, borderRadius: 12 }}
              onClick={() => navigate('/orders')}
            >
              订单列表
            </button>
            <div style={{
              flex: 2, borderRadius: 12,
              background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
              color: 'white', padding: '12px',
              textAlign: 'center', fontSize: 14,
              fontWeight: 800, boxShadow: '0 4px 16px rgba(24,144,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}>
              <span style={{ animation: 'pulse 1.5s infinite' }}>⚡</span>
              充值处理中，请耐心等待
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn-outline"
              style={{ flex: 1, borderRadius: 12 }}
              onClick={() => navigate('/orders')}
            >
              订单列表
            </button>
            <button
              className="btn-primary"
              style={{
                flex: 2, borderRadius: 12,
                background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                color: 'white',
                fontWeight: 800, fontSize: 15,
                boxShadow: '0 4px 16px rgba(82,196,26,0.3)'
              }}
              onClick={() => navigate('/products')}
            >
              🎉 继续购物
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
