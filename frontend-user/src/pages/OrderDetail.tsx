import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const STATUS_MAP: Record<string, { text: string; cls: string; desc: string; color: string }> = {
  pending: { text: '待支付', cls: 'tag-orange', desc: '请完成支付后系统将自动充值', color: 'linear-gradient(135deg, #faad14, #ffc53d)' },
  processing: { text: '处理中', cls: 'tag-blue', desc: '支付成功，等待系统处理', color: 'linear-gradient(135deg, #1890ff, #40a9ff)' },
  completed: { text: '已完成', cls: 'tag-green', desc: '充值成功，感谢您的使用', color: 'linear-gradient(135deg, #52c41a, #73d13d)' },
  failed: { text: '已失败', cls: 'tag-red', desc: '充值失败，建议重新充值或联系客服', color: 'linear-gradient(135deg, #ff4d4f, #ff7875)' },
  refunded: { text: '已退款', cls: 'tag-gray', desc: '订单已退款', color: 'linear-gradient(135deg, #8c8c8c, #bfbfbf)' }
};

type ErrorCodeInfo = {
  label: string;
  reason: string;
  solution: string;
  suggestion: string;
  retryable: boolean;
};

const ERROR_CODE_MAP: Record<string, ErrorCodeInfo> = {
  ERR1001: { label: '格式错误', reason: '充值账号格式不正确', solution: '请检查充值账号是否为正确的11位手机号', suggestion: '确认号码后重新下单', retryable: false },
  ERR1002: { label: '余额不足', reason: '供应商通道余额不足', solution: '系统将自动切换到备用通道重试', suggestion: '请耐心等待2分钟，或手动切换通道重试', retryable: true },
  ERR1003: { label: '超时', reason: '供应商响应超时', solution: '可能是网络波动或供应商繁忙', suggestion: '建议稍后重试，或联系客服确认', retryable: true },
  ERR1004: { label: '维护中', reason: '该运营商通道正在维护升级', solution: '请稍后再试，或选择其他通道', suggestion: '维护通常持续30分钟-2小时，请耐心等待', retryable: true },
  ERR1005: { label: '号码不存在', reason: '充值号码为空号或未启用', solution: '请检查号码是否正确，或联系运营商确认', suggestion: '确认号码有效性后重新下单', retryable: false },
  ERR1006: { label: '地区限制', reason: '该号码归属地不支持此商品充值', solution: '请选择支持该地区的其他商品', suggestion: '查看同类型其他商品，选择支持您地区的', retryable: false },
  ERR1007: { label: '风控拦截', reason: '订单触发风险控制规则', solution: '可能是频繁下单或异常操作导致', suggestion: '请24小时后再试，或联系客服解除限制', retryable: true },
  ERR1008: { label: '通道故障', reason: '充值通道临时故障', solution: '系统已自动切换备用通道重试', suggestion: '请等待自动重试，或手动切换通道', retryable: true },
  SUPPLIER_TIMEOUT: { label: '供应商响应超时', reason: '供应商接口响应超时', solution: '可能是网络波动，建议稍后重试', suggestion: '请稍后重试，或切换其他通道', retryable: true },
  SUPPLIER_ERROR: { label: '供应商接口异常', reason: '供应商接口返回异常', solution: '供应商可能在维护或升级', suggestion: '请稍后重试，或联系客服', retryable: true },
  INVALID_ACCOUNT: { label: '充值账号无效', reason: '充值账号格式或状态异常', solution: '请检查充值账号是否正确', suggestion: '确认账号无误后重新下单', retryable: false },
  INSUFFICIENT_BALANCE: { label: '供应商余额不足', reason: '供应商通道余额不足', solution: '系统将自动切换通道重试', suggestion: '请稍后重试，系统将自动切换通道', retryable: true },
  PRODUCT_OFFLINE: { label: '商品已下架', reason: '该商品已下架或售罄', solution: '请选择其他同类商品', suggestion: '查看更多同类商品', retryable: false },
  CHANNEL_ERROR: { label: '通道异常', reason: '当前充值通道异常', solution: '系统将自动切换备用通道', suggestion: '请稍后重试，或手动切换通道', retryable: true },
  UNKNOWN_ERROR: { label: '未知错误', reason: '发生未知错误', solution: '请联系客服处理', suggestion: '请联系客服，我们将尽快为您解决', retryable: true }
};

function formatTime(timestamp: number): string {
  if (!timestamp) return '-';
  const d = new Date(timestamp * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatTimeShort(timestamp: number): string {
  if (!timestamp) return '-';
  const d = new Date(timestamp * 1000);
  return `${String(d.getMonth() + 1)}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [order, setOrder] = useState<any>(null);
  const [cards, setCards] = useState<any>(null);
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [showCards, setShowCards] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [showErrorCodeTable, setShowErrorCodeTable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [switchingChannel, setSwitchingChannel] = useState(false);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      if (order && order.status === 'processing') {
        loadData();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [id]);

  const loadData = async () => {
    try {
      const res: any = await orderApi.detail(id!);
      if (res.success) {
        setOrder(res.data);
        if (res.data.status === 'failed' && !diagnostic) {
          loadDiagnostic();
        }
      }
    } catch (e: any) {
      toast.show(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDiagnostic = async () => {
    try {
      const diagRes: any = await orderApi.diagnostic(id!);
      if (diagRes.success) {
        setDiagnostic(diagRes.data);
        setShowDiagnostic(true);
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
        toast.show('已发起重试', 'success');
        setTimeout(loadData, 1000);
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
        toast.show(res.data.message || '通道切换成功', 'success');
        setTimeout(loadData, 1000);
      } else {
        toast.show(res.message || '切换失败', 'error');
      }
    } catch (e: any) {
      toast.show(e.message || '切换失败', 'error');
    } finally {
      setSwitchingChannel(false);
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#faad14';
      case 'low': return '#1890ff';
      default: return '#999';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return '严重';
      case 'medium': return '中等';
      case 'low': return '轻微';
      default: return '未知';
    }
  };

  const buildTimeline = (): TimelineItem[] => {
    if (!order) return [];
    const items: TimelineItem[] = [];

    items.push({
      key: 'ordered',
      label: '已下单',
      icon: '📝',
      time: order.created_at,
      operator: '用户',
      status: 'done',
      remark: '订单创建成功，等待支付'
    });

    if (order.pay_time || order.status !== 'pending') {
      items.push({
        key: 'paying',
        label: order.pay_time ? '支付成功' : '支付中',
        icon: '💳',
        time: order.pay_time || order.created_at + 60,
        operator: '系统',
        status: order.pay_time ? 'done' : 'active',
        remark: order.pay_time ? '支付已完成' : '正在处理支付'
      });
    }

    if (order.status === 'processing' || order.status === 'completed' || order.status === 'failed') {
      items.push({
        key: 'recharging',
        label: '充值中',
        icon: '⚡',
        time: order.pay_time ? order.pay_time + 30 : order.created_at + 90,
        operator: '系统',
        status: order.status === 'completed' ? 'done' : order.status === 'failed' ? 'active' : 'active',
        remark: order.status === 'failed' ? '充值处理异常' : '正在为您充值，请稍候'
      });
    }

    if (order.status === 'completed') {
      items.push({
        key: 'completed',
        label: '已到账',
        icon: '✅',
        time: order.finish_time || Date.now() / 1000,
        operator: '系统',
        status: 'done',
        remark: '充值成功，已到账'
      });
    }

    if (order.status === 'failed') {
      items.push({
        key: 'failed',
        label: '充值失败',
        icon: '❌',
        time: order.finish_time || Date.now() / 1000,
        operator: '系统',
        status: 'active',
        isFailed: true,
        errorCode: diagnostic?.errorCode || order.error_code,
        remark: order.fail_reason || '充值失败'
      });
    }

    return items;
  };

  const getErrorCodeInfo = (errorCode: string): ErrorCodeInfo => {
    return ERROR_CODE_MAP[errorCode] || { 
      label: '未知错误', 
      reason: '发生未知错误', 
      solution: '请联系客服处理', 
      suggestion: '请联系客服，我们将尽快为您解决',
      retryable: true 
    };
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
  const currentStep = getStepIndex(order.status);
  const isFailed = order.status === 'failed';
  const timeline = buildTimeline();
  const switchHistory = diagnostic?.switchHistory || [];
  const errorCodeInfo = diagnostic?.errorCode ? getErrorCodeInfo(diagnostic.errorCode) : null;

  return (
    <div style={{ paddingBottom: 100 }}>
      <Header title="订单详情" />

      <div style={{
        padding: '24px 20px',
        background: status.color,
        color: 'white'
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
          {isFailed ? '❌ ' : order.status === 'completed' ? '✅ ' : '⏳ '}
          {status.text}
        </div>
        <div style={{ opacity: 0.9, fontSize: 13 }}>{status.desc}</div>
        {order.fail_reason && isFailed && (
          <div style={{ marginTop: '8', fontSize: 12, opacity: 0.85, background: 'rgba(0,0,0,0.1)', padding: '8px 12px', borderRadius: 8 }}>
            失败原因：{order.fail_reason}
          </div>
        )}
      </div>

      {isFailed && switchHistory.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
          padding: '12px 20px',
          borderBottom: '1px solid #bae7ff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🔄</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1890ff' }}>
                已自动切换备用通道重试
              </div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                预计2分钟内到账，请耐心等待
              </div>
            </div>
            <span className="tag tag-blue" style={{ fontSize: 10 }}>
              已切换 {switchHistory.length} 次
            </span>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 0, borderRadius: 0 }}>
        <div className="text-bold mb-12" style={{ marginBottom: 16, fontSize: 15 }}>
          📊 订单状态流转
        </div>
        <div style={{ position: 'relative' }}>
          {timeline.map((item, idx) => {
            const isLast = idx === timeline.length - 1;
            const isFailedStep = item.isFailed;
            return (
              <div key={item.key} style={{ 
                display: 'flex', 
                gap: 12, 
                position: 'relative', 
                paddingBottom: isLast ? 0 : 24,
                paddingTop: idx === 0 ? 0 : 4
              }}>
                {!isLast && (
                  <div style={{
                    position: 'absolute', left: 13, top: 36, bottom: 0, width: 2,
                    background: item.status === 'done' ? '#52c41a' : isFailedStep ? '#ff4d4f' : '#e8e8e8'
                  }} />
                )}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: isFailedStep ? '#ff4d4f' :
                    item.status === 'done' ? '#52c41a' : 
                    item.status === 'active' ? '#1890ff' : '#e8e8e8',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, zIndex: 1,
                  boxShadow: isFailedStep ? '0 0 0 4px rgba(255, 77, 79, 0.2)' : 
                    item.isSwitch ? '0 0 0 4px rgba(102, 126, 234, 0.2)' : 'none'
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ 
                        fontWeight: 600, 
                        fontSize: 14,
                        color: isFailedStep ? '#ff4d4f' : '#333'
                      }}>
                        {item.label}
                        {item.isSwitch && <span className="tag tag-purple" style={{ marginLeft: 6, fontSize: 10 }}>切换</span>}
                      </div>
                      {item.operator && (
                        <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                          操作人：{item.operator}
                        </div>
                      )}
                      {item.remark && (
                        <div style={{ 
                          fontSize: 12, 
                          color: isFailedStep ? '#ff4d4f' : '#666', 
                          marginTop: 4 
                        }}>
                          {item.remark}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: '#999', flexShrink: 0, textAlign: 'right' }}>
                      <div>{formatTimeShort(item.time)}</div>
                    </div>
                  </div>
                  
                  {item.errorCode && (
                    <div style={{ 
                      marginTop: 8, 
                      padding: '6px 10px', 
                      background: '#fff1f0', 
                      border: '1px solid #ffa39e',
                      borderRadius: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span style={{
                        fontFamily: 'monospace', 
                        fontWeight: 600, 
                        background: '#ff4d4f',
                        color: 'white', 
                        padding: '1px 6px', 
                        borderRadius: 4, 
                        fontSize: 10
                      }}>
                        {item.errorCode}
                      </span>
                      <span style={{ fontSize: 11, color: '#ff4d4f' }}>
                        {getErrorCodeInfo(item.errorCode).label}
                      </span>
                    </div>
                  )}

                  {isFailedStep && (
                    <div style={{ 
                      display: 'flex', 
                      gap: 8, 
                      marginTop: 10,
                      flexWrap: 'wrap'
                    }}>
                      <button
                        onClick={() => setShowDiagnostic(!showDiagnostic)}
                        style={{ 
                          fontSize: 12, 
                          color: '#1890ff', 
                          background: '#e6f7ff',
                          border: '1px solid #91d5ff',
                          padding: '4px 12px',
                          borderRadius: 6
                        }}>
                        🔍 诊断详情
                      </button>
                      {diagnostic?.switchChannelAvailable ? (
                        <button
                          onClick={doRetrySwitchChannel}
                          disabled={switchingChannel}
                          style={{ 
                            fontSize: 12, 
                            color: 'white', 
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            padding: '4px 12px',
                            borderRadius: 6,
                            border: 'none'
                          }}>
                          {switchingChannel ? '切换中...' : '🔄 切换通道'}
                        </button>
                      ) : (
                        <button
                          onClick={doRetry}
                          disabled={retrying}
                          style={{ 
                            fontSize: 12, 
                            color: 'white', 
                            background: '#52c41a',
                            padding: '4px 12px',
                            borderRadius: 6,
                            border: 'none'
                          }}>
                          {retrying ? '重试中...' : '� 立即重试'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isFailed && diagnostic && (
        <div className="card">
          <div className="flex-between mb-12">
            <span className="text-bold">🔍 智能诊断结果</span>
            <button
              className="text-blue text-sm"
              style={{ fontWeight: 600 }}
              onClick={() => setShowDiagnostic(!showDiagnostic)}
            >
              {showDiagnostic ? '收起' : '展开详情'}
            </button>
          </div>

          <div style={{
            background: '#fff1f0', padding: 16, borderRadius: 12, border: '1px solid #ffa39e'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff4d4f, #ff7875)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0
              }}>
                ❌
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#ff4d4f', fontSize: 15, marginBottom: 8 }}>
                  {diagnostic.userMessage || errorCodeInfo?.label || '充值失败'}
                </div>
                {diagnostic.errorCode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#8c8c8c' }}>错误码：</span>
                    <span style={{
                      fontFamily: 'monospace', fontWeight: 700, background: '#ff4d4f',
                      color: 'white', padding: '3px 10px', borderRadius: 6, fontSize: 12
                    }}>
                      {diagnostic.errorCode}
                    </span>
                    <button
                      onClick={() => {
                        toast.show('正在跳转帮助中心...', 'info');
                      }}
                      style={{
                        fontSize: 11,
                        color: '#1890ff',
                        background: 'transparent',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      📖 查看帮助中心
                    </button>
                  </div>
                )}
                {diagnostic.category && (
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 6 }}>
                    问题分类：{diagnostic.category}
                    {diagnostic.severity && (
                      <span style={{
                        marginLeft: 8,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: getSeverityColor(diagnostic.severity),
                        color: 'white',
                        fontSize: 10
                      }}>
                        {getSeverityLabel(diagnostic.severity)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {showDiagnostic && (
            <div style={{ marginTop: 16 }}>
              {errorCodeInfo && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    background: '#fafafa',
                    borderRadius: 10,
                    padding: '14px',
                    border: '1px solid #f0f0f0'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#333' }}>
                      📋 错误码详情
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#999', flexShrink: 0, width: 70 }}>可能原因：</span>
                        <span style={{ fontSize: 12, color: '#666', flex: 1 }}>{errorCodeInfo.reason}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#999', flexShrink: 0, width: 70 }}>解决方案：</span>
                        <span style={{ fontSize: 12, color: '#666', flex: 1 }}>{errorCodeInfo.solution}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#999', flexShrink: 0, width: 70 }}>建议操作：</span>
                        <span style={{ fontSize: 12, color: '#1890ff', flex: 1 }}>{errorCodeInfo.suggestion}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {diagnostic.rootCause && (
                <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
                  <span className="text-gray">根本原因：</span>{diagnostic.rootCause}
                </div>
              )}
              {diagnostic.suggestions?.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>💡 建议解决方案：</div>
                  <div style={{ fontSize: 13, color: '#666' }}>
                    {diagnostic.suggestions.map((s: string, i: number) => (
                      <div key={i} style={{ padding: '4px 0', lineHeight: 1.6 }}>
                        • {s}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {diagnostic.autoAction && (
                <div style={{ fontSize: 13, color: '#52c41a', marginTop: 12, padding: 12, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
                  🔄 系统已自动执行：{diagnostic.autoAction}
                </div>
              )}
              {diagnostic.switchChannelAvailable && (
                <div style={{ marginTop: 12 }}>
                  <button
                    className="btn-primary btn-block"
                    onClick={doRetrySwitchChannel}
                    disabled={switchingChannel}
                    style={{
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    }}
                  >
                    {switchingChannel ? '切换中...' : '🔄 切换通道重试'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {switchHistory.length > 0 && (
        <div className="card" style={{ marginTop: 0 }}>
          <div className="flex-between mb-12">
            <span className="text-bold">🔄 通道切换历史</span>
            <span className="text-sm text-gray">共 {switchHistory.length} 次切换</span>
          </div>
          <div style={{ position: 'relative', paddingLeft: 8 }}>
            {switchHistory.map((sw: any, idx: number) => {
              const isLast = idx === switchHistory.length - 1;
              return (
                <div key={sw.id || idx} style={{ 
                  position: 'relative',
                  paddingBottom: isLast ? 0 : 16,
                  paddingLeft: 24
                }}>
                  {!isLast && (
                    <div style={{
                      position: 'absolute',
                      left: 7,
                      top: 24,
                      bottom: 0,
                      width: 2,
                      background: '#e8e8e8'
                    }} />
                  )}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 4,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    color: 'white',
                    zIndex: 1
                  }}>
                    🔄
                  </div>
                  <div style={{
                    padding: '12px',
                    background: '#fafafa',
                    borderRadius: 10,
                    border: '1px solid #f0f0f0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                        第 {idx + 1} 次切换
                      </div>
                      <div style={{ fontSize: 11, color: '#999' }}>{formatTime(sw.created_at)}</div>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      marginBottom: 8,
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        padding: '3px 8px',
                        background: '#fff1f0',
                        border: '1px solid #ffa39e',
                        borderRadius: 6,
                        fontSize: 11,
                        color: '#ff4d4f'
                      }}>
                        {sw.channel_name || '原通道'}
                      </span>
                      <span style={{ fontSize: 12, color: '#999' }}>→</span>
                      <span style={{
                        padding: '3px 8px',
                        background: '#f6ffed',
                        border: '1px solid #b7eb8f',
                        borderRadius: 6,
                        fontSize: 11,
                        color: '#52c41a'
                      }}>
                        {sw.to_channel_name || sw.to_channel_id || '备用通道'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span className="text-gray">原因：</span>
                        <span style={{ flex: 1 }}>{sw.reason || '系统自动切换'}</span>
                      </div>
                      {sw.supplier_name && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <span className="text-gray">供应商：</span>
                          <span>{sw.supplier_name}</span>
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
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: 'linear-gradient(135deg, #667eea22, #764ba222)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 600, color: '#667eea'
          }}>
            {order.product_name?.slice(0, 4) || '商品'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{order.product_name}</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              {order.supplier_name || '官方供应商'}
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
              单价 ¥{order.unit_price} × {order.quantity}
            </div>
          </div>
          <span className={`tag ${status.cls}`}>{status.text}</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <div className="text-bold mb-12">📋 订单信息</div>
        <div className="flex-between text-sm">
          <span className="text-gray">订单编号</span>
          <span style={{ fontFamily: 'monospace' }}>{order.order_no}</span>
        </div>
        <div className="flex-between text-sm mt-8">
          <span className="text-gray">充值账号</span>
          <span className="text-bold">{order.recharge_account}</span>
        </div>
        <div className="flex-between text-sm mt-8">
          <span className="text-gray">商品类型</span>
          <span>{order.sku_type === 'card' ? '卡密商品' : '直充商品'}</span>
        </div>
        <div className="flex-between text-sm mt-8">
          <span className="text-gray">下单时间</span>
          <span>{formatTime(order.created_at)}</span>
        </div>
        {order.pay_time && (
          <div className="flex-between text-sm mt-8">
            <span className="text-gray">支付时间</span>
            <span>{formatTime(order.pay_time)}</span>
          </div>
        )}
        {order.finish_time && (
          <div className="flex-between text-sm mt-8">
            <span className="text-gray">完成时间</span>
            <span>{formatTime(order.finish_time)}</span>
          </div>
        )}
        {order.supplier_order_id && (
          <div className="flex-between text-sm mt-8">
            <span className="text-gray">供应商单号</span>
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{order.supplier_order_id}</span>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <div className="text-bold mb-12">💰 费用明细</div>
        <div className="flex-between text-sm">
          <span className="text-gray">商品原价</span>
          <span>¥{order.original_amount?.toFixed(2)}</span>
        </div>
        {order.discount_amount > 0 && (
          <div className="flex-between text-sm mt-8">
            <span className="text-gray">优惠金额</span>
            <span className="text-green">-¥{order.discount_amount?.toFixed(2)}</span>
          </div>
        )}
        <div className="divider" />
        <div className="flex-between">
          <span className="text-bold">实付金额</span>
          <span style={{ color: '#ff4d4f', fontSize: 20, fontWeight: 800 }}>
            ¥{order.final_amount?.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 0 }}>
        <div className="flex-between mb-12">
          <span className="text-bold">📋 错误码对照表</span>
          <button
            onClick={() => setShowErrorCodeTable(!showErrorCodeTable)}
            className="text-blue text-sm"
            style={{ fontWeight: 600 }}
          >
            {showErrorCodeTable ? '收起' : '展开'}
          </button>
        </div>
        {showErrorCodeTable && (
          <div style={{ animation: 'slideDown 0.3s ease-out' }}>
            {Object.entries(ERROR_CODE_MAP).map(([code, info]) => (
              <div key={code} style={{
                padding: '10px 0',
                borderBottom: '1px solid #f0f0f0',
                fontSize: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontFamily: 'monospace', fontWeight: 600,
                    background: '#ff4d4f', color: 'white',
                    padding: '2px 8px', borderRadius: 4, fontSize: 11
                  }}>
                    {code}
                  </span>
                  <span style={{ fontWeight: 500, color: '#333' }}>{info.label}</span>
                </div>
                <div style={{ color: '#666', marginLeft: 0 }}>
                  <span className="text-gray">解决方案：</span>{info.solution}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {order.sku_type === 'card' && order.status === 'completed' && (
        <div className="card" style={{ marginTop: 0 }}>
          <div className="flex-between mb-12">
            <span className="text-bold">🎫 卡密信息</span>
            <button onClick={getCards} className="text-blue text-sm" style={{ fontWeight: 600 }}>
              {cards ? '重新查看' : '点击查看'}
            </button>
          </div>
          {showCards && cards && cards.length > 0 ? (
            cards.map((c: any, i: number) => (
              <div key={i} style={{
                background: '#fffbe6',
                padding: 14,
                borderRadius: 10,
                border: '1px solid #ffe58f',
                fontFamily: 'monospace',
                marginBottom: i < cards.length - 1 ? 10 : 0
              }}>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ color: '#8c8c8c' }}>卡号：</span>
                  <span style={{ fontWeight: 600, letterSpacing: 1 }}>{c.cardNumber}</span>
                </div>
                <div>
                  <span style={{ color: '#8c8c8c' }}>密码：</span>
                  <span style={{ fontWeight: 600, letterSpacing: 1 }}>{c.cardPassword}</span>
                </div>
              </div>
            ))
          ) : showCards ? (
            <div className="text-sm text-gray">暂无卡密信息，请稍后重试</div>
          ) : (
            <div className="text-sm text-gray" style={{ color: '#faad14' }}>
              ⚠️ 卡密信息敏感，请妥善保管，泄露自负
            </div>
          )}
        </div>
      )}

      {order.diagnostic_result && (
        <div className="card" style={{ marginTop: 0 }}>
          <div className="text-bold mb-12">📝 订单备注</div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
            {order.diagnostic_result}
          </div>
        </div>
      )}

      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'white', padding: '12px 16px 20px',
        borderTop: '1px solid #eee',
        display: 'flex', gap: 10,
        zIndex: 100
      }}>
        {order.status === 'pending' && (
          <button className="btn-primary btn-block" onClick={doPay} disabled={paying}>
            {paying ? '支付中...' : `立即支付 ¥${order.final_amount?.toFixed(2)}`}
          </button>
        )}
        {order.status === 'failed' && (
          <>
            <button style={{
              flex: 1, padding: 12, borderRadius: 12, background: '#f5f5f5',
              color: '#666', fontSize: 13, fontWeight: 500
            }} onClick={() => {
              toast.show('正在联系客服...', 'info');
            }}>
              📞 联系客服
            </button>
            <button style={{
              flex: 1, padding: 12, borderRadius: 12, background: '#fff7e6',
              color: '#d46b08', fontSize: 13, fontWeight: 500,
              border: '1px solid #ffd591'
            }} onClick={() => {
              toast.show('退款申请已提交，预计1-3个工作日到账', 'info');
            }}>
              💰 申请退款
            </button>
            {diagnostic?.switchChannelAvailable ? (
              <button
                className="btn-primary"
                style={{ flex: 1.2, padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
                onClick={doRetrySwitchChannel}
                disabled={switchingChannel}
              >
                {switchingChannel ? '切换中...' : '🔄 再次重试'}
              </button>
            ) : (
              <button className="btn-primary" style={{ flex: 1.2, padding: 12, borderRadius: 12, fontSize: 13, fontWeight: 600 }} onClick={doRetry} disabled={retrying}>
                {retrying ? '重试中...' : '🔄 再次重试'}
              </button>
            )}
          </>
        )}
        {order.status === 'completed' && (
          <>
            <button style={{
              flex: 1, padding: 14, borderRadius: 14, background: '#f5f5f5',
              color: '#666'
            }} onClick={() => navigate('/')}>
              继续购物
            </button>
            <button className="btn-primary btn-block" style={{ flex: 1 }} onClick={() => navigate('/share')}>
              去分享赚钱
            </button>
          </>
        )}
        {order.status === 'processing' && (
          <button className="btn-primary btn-block" onClick={loadData}>
            刷新状态
          </button>
        )}
        {order.status === 'refunded' && (
          <button className="btn-primary btn-block" onClick={() => navigate('/orders')}>
            查看订单列表
          </button>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
