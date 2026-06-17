import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { orderApi } from '../api';

const STATUS_MAP: Record<string, { text: string; cls: string; color: string }> = {
  pending: { text: '待支付', cls: 'tag-gray', color: '#64748b' },
  paid: { text: '待充值', cls: 'tag-blue', color: '#3b82f6' },
  recharging: { text: '充值中', cls: 'tag-blue', color: '#3b82f6' },
  completed: { text: '已成功', cls: 'tag-green', color: '#10b981' },
  failed: { text: '已失败', cls: 'tag-red', color: '#ef4444' },
  refunded: { text: '已退款', cls: 'tag-orange', color: '#f59e0b' }
};

const SEVERITY_MAP: Record<string, { icon: string; label: string; color: string }> = {
  high: { icon: '🔴', label: '严重', color: '#ef4444' },
  medium: { icon: '🟠', label: '中等', color: '#f59e0b' },
  low: { icon: '🔵', label: '轻微', color: '#3b82f6' }
};

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  network_timeout: { label: '网络超时', color: '#3b82f6' },
  stock_empty: { label: '库存不足', color: '#f59e0b' },
  account_error: { label: '账号错误', color: '#8b5cf6' },
  region_limit: { label: '地域限制', color: '#10b981' },
  supplier_maintenance: { label: '供应商维护', color: '#6366f1' },
  system_error: { label: '系统错误', color: '#ef4444' }
};

const ERROR_CODE_DETAILS = [
  { code: 'T1001', name: '运营商系统维护', reason: '供应商系统正在维护升级', solution: '等待维护完成或切换备用通道', retryable: true, autoRecover: true },
  { code: 'T1002', name: '号码归属地不支持', reason: '该号码归属地暂不支持此产品充值', solution: '建议用户选择其他适配商品', retryable: false, autoRecover: false },
  { code: 'T1003', name: '账号异常暂停', reason: '充值账号存在异常，已被风控拦截', solution: '联系客服核实账号状态', retryable: false, autoRecover: false },
  { code: 'T1004', name: '余额充足无需充值', reason: '账号余额已超过充值阈值', solution: '无需操作，告知用户当前余额', retryable: false, autoRecover: false },
  { code: 'Q2001', name: '爱奇艺账号异常', reason: '爱奇艺账号状态异常，可能被封禁', solution: '建议用户检查爱奇艺账号状态', retryable: false, autoRecover: false },
  { code: 'Q2002', name: '激活码已过期', reason: '卡密激活码已过期或已被使用', solution: '切换通道重新获取卡密', retryable: true, autoRecover: true },
  { code: 'M1001', name: '美团券库存不足', reason: '美团券商品库存暂时不足', solution: '等待补货或切换供应商', retryable: true, autoRecover: true },
  { code: 'M1002', name: '券码已发放', reason: '券码已成功发放至用户卡包', solution: '无需操作，引导用户查收', retryable: false, autoRecover: false },
  { code: 'J3001', name: '京东E卡库存不足', reason: '京东E卡库存不足，需紧急补货', solution: '联系采购部门补货或切换通道', retryable: true, autoRecover: true },
  { code: 'J3002', name: '卡密校验失败', reason: '卡密格式或有效性校验失败', solution: '切换通道重新获取卡密', retryable: true, autoRecover: true },
  { code: 'TIMEOUT', name: '充值请求超时', reason: '网络连接超时或供应商响应慢', solution: '系统自动重试或切换通道', retryable: true, autoRecover: true },
  { code: 'SIGN_ERROR', name: '签名校验失败', reason: '接口签名验证不通过', solution: '联系技术人员检查配置', retryable: true, autoRecover: false },
  { code: 'STOCK_EMPTY', name: '商品库存不足', reason: '商品库存已售罄', solution: '等待补货或推荐同类商品', retryable: false, autoRecover: false },
  { code: 'ACCOUNT_INVALID', name: '充值账号格式错误', reason: '充值账号不符合格式要求', solution: '引导用户核对账号后重试', retryable: false, autoRecover: false },
  { code: 'UNKNOWN', name: '未知错误', reason: '未能识别的错误类型', solution: '联系客服人工处理', retryable: false, autoRecover: false }
];

function formatTime(timestamp: number | null | undefined): string {
  if (!timestamp) return '-';
  return new Date(timestamp * 1000).toLocaleString('zh-CN');
}

function maskPhone(phone: string): string {
  if (!phone) return '-';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
  return phone;
}

function extractErrorCode(failReason: string): string {
  if (!failReason) return '';
  const match = failReason.match(/[A-Z0-9_-]+/g);
  if (match) {
    for (const m of match) {
      if (m.length >= 4 && m.length <= 15) {
        return m;
      }
    }
  }
  const parts = failReason.split(':');
  return parts[0]?.replace(/[^A-Z0-9]/g, '').toUpperCase().slice(0, 8) || '';
}

function getErrorDetail(code: string): typeof ERROR_CODE_DETAILS[0] {
  const shortCode = code.replace(/^[^:]*:/, '').toUpperCase();
  return ERROR_CODE_DETAILS.find(e => 
    shortCode.includes(e.code) || code.includes(e.code)
  ) || ERROR_CODE_DETAILS[ERROR_CODE_DETAILS.length - 1];
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useApp();
  
  const [order, setOrder] = useState<any>(null);
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [errorCodes, setErrorCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorCodesExpanded, setErrorCodesExpanded] = useState(false);
  const [detailExportStatus, setDetailExportStatus] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [orderRes, diagRes, errorRes] = await Promise.all([
        orderApi.getOrderDetail(id) as Promise<any>,
        orderApi.getOrderDiagnostic(id).catch(() => ({ success: false, data: null })) as Promise<any>,
        orderApi.getErrorCodes().catch(() => ({ success: false, data: [] })) as Promise<any>
      ]);
      
      if (orderRes.success) setOrder(orderRes.data);
      if (diagRes.success) setDiagnostic(diagRes.data);
      if (errorRes.success) setErrorCodes(errorRes.data);
    } catch (e: any) {
      showToast(e.message || '加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (actionLoading || !id) return;
    if (!confirm('确定要使用当前通道重试该订单吗？')) return;
    
    setActionLoading('retry');
    try {
      const res: any = await orderApi.retryOrder(id);
      if (res.success) {
        showToast('重试已启动，正在处理中...', 'success');
        setTimeout(() => {
          loadData();
          setActionLoading(null);
        }, 2000);
      }
    } catch (e: any) {
      showToast(e.message || '重试失败', 'error');
      setActionLoading(null);
    }
  };

  const handleSwitchChannel = async () => {
    if (actionLoading || !id) return;
    if (!confirm('确定要切换到备用通道并重试吗？')) return;
    
    setActionLoading('switch');
    try {
      const res: any = await orderApi.retrySwitchChannel(id);
      if (res.success) {
        showToast(res.data.message || '通道切换成功，正在重试...', 'success');
        setTimeout(() => {
          loadData();
          setActionLoading(null);
        }, 2000);
      }
    } catch (e: any) {
      showToast(e.message || '切换通道失败', 'error');
      setActionLoading(null);
    }
  };

  const handleRefund = async () => {
    if (actionLoading || !id) return;
    if (!confirm('确定要给该订单退款吗？退款将原路返回用户余额。')) return;
    
    setActionLoading('refund');
    try {
      const res: any = await orderApi.refundOrder(id);
      if (res.success) {
        showToast(`退款成功：¥${res.data.refundedAmount.toFixed(2)}`, 'success');
        loadData();
      }
    } catch (e: any) {
      showToast(e.message || '退款失败', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = () => {
    if (!order) return;
    setDetailExportStatus('正在生成订单详情报告...');
    showToast('正在生成详情报告...', 'info');
    
    setTimeout(() => {
      const content = `
订单详情报告
========================================
订单号：${order.order_no}
商品：${order.product_name}
充值账号：${order.recharge_account}
状态：${STATUS_MAP[order.status]?.text || order.status}
创建时间：${formatTime(order.created_at)}
完成时间：${formatTime(order.finish_time)}
========================================
金额明细：
  原价：¥${Number(order.original_amount || order.final_amount || 0).toFixed(2)}
  优惠：¥${Number(order.discount_amount || 0).toFixed(2)}
  实付：¥${Number(order.final_amount || 0).toFixed(2)}
  返佣：¥${Number(order.commission_amount || 0).toFixed(2)}
========================================
供应商：${order.supplier_name || '-'}
通道：${order.channel_name || '-'}
${order.fail_reason ? `失败原因：${order.fail_reason}` : ''}
      `;
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `订单详情_${order.order_no}_${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setDetailExportStatus(`导出详情完成：订单 ${order.order_no} 的报告已生成 ${new Date().toLocaleTimeString('zh-CN')}`);
      showToast('详情报告已下载', 'success');
    }, 800);
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 60 }}>
        <div className="empty-icon">⏳</div>
        <div>加载中...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 60 }}>
        <div className="empty-icon">❌</div>
        <div>订单不存在</div>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/orders')}>
          返回订单列表
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[order.status] || { text: order.status, cls: 'tag-gray', color: '#64748b' };
  
  let errorCode = extractErrorCode(order.fail_reason || '');
  if (!errorCode && diagnostic) {
    errorCode = extractErrorCode(diagnostic.errorCode || diagnostic.rootCause || diagnostic.userMessage || '');
  }
  if (!errorCode && order.status === 'failed') {
    errorCode = 'UNKNOWN';
  }
  
  const errorDetail = getErrorDetail(errorCode || order.fail_reason || '');
  const severity = SEVERITY_MAP[diagnostic?.severity || 'medium'];
  const category = diagnostic?.category ? CATEGORY_MAP[diagnostic.category] : null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn btn-default btn-sm" onClick={() => navigate('/orders')}>
          ← 返回列表
        </button>
        <h2 style={{ margin: 0, fontSize: 18 }}>订单详情</h2>
        <div style={{ flex: 1 }} />
        <button className="btn btn-default btn-sm" onClick={handleExport}>
          导出详情
        </button>
      </div>
      {detailExportStatus && (
        <div className="card" style={{ marginBottom: 16, padding: '10px 14px', color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          {detailExportStatus}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 600 }}>
                {order.order_no}
              </span>
              <span className={`tag ${statusInfo.cls}`} style={{ fontSize: 14, padding: '4px 12px' }}>
                {statusInfo.text}
              </span>
              {order.status === 'failed' && errorCode && (
                <span style={{ 
                  fontFamily: 'monospace', 
                  fontSize: 13, 
                  color: '#ef4444', 
                  background: '#fef2f2', 
                  padding: '4px 10px', 
                  borderRadius: 6,
                  letterSpacing: 1
                }}>
                  ERR-{errorCode.slice(0, 8)}
                </span>
              )}
            </div>

            <div className="grid-2" style={{ marginBottom: 0 }}>
              <div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>商品信息</div>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>{order.product_name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  面值：{order.face_value ? `¥${order.face_value}` : '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>充值账号</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 500, marginBottom: 8 }}>
                  {order.recharge_account}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  用户：{maskPhone(order.user_phone || '')} {order.user_name ? `(${order.user_name})` : ''}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>供应商 / 通道</div>
                <div style={{ fontWeight: 500 }}>
                  {order.supplier_name || '-'} / {order.channel_name || '默认通道'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>创建 / 完成时间</div>
                <div style={{ fontSize: 13 }}>{formatTime(order.created_at)}</div>
                <div style={{ fontSize: 12, color: statusInfo.color }}>{formatTime(order.finish_time || order.updated_at)}</div>
              </div>
            </div>
          </div>

          <div style={{ width: 240, padding: 20, background: '#f8fafc', borderRadius: 12 }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>金额明细</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span className="text-muted">原价</span>
              <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>
                ¥{Number(order.original_amount || order.final_amount || 0).toFixed(2)}
              </span>
            </div>
            {order.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span className="text-muted">优惠</span>
                <span style={{ color: '#10b981' }}>-¥{Number(order.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div style={{ height: 1, background: '#e2e8f0', margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span className="text-muted">实付</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>
                ¥{Number(order.final_amount || 0).toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span className="text-muted">返佣</span>
              <span style={{ color: '#10b981' }}>+¥{Number(order.commission_amount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>📊 状态流转时间轴</div>
        <div style={{ position: 'relative', paddingLeft: 30 }}>
          {(order.statusHistory || []).map((item: any, index: number) => {
            const s = STATUS_MAP[item.status] || { text: item.label, color: '#64748b' };
            const isFailed = item.status === 'failed';
            const isLast = index === (order.statusHistory || []).length - 1;
            
            return (
              <div key={index} style={{ position: 'relative', paddingBottom: index < (order.statusHistory || []).length - 1 ? 24 : 0 }}>
                {!isLast && (
                  <div style={{
                    position: 'absolute',
                    left: -23,
                    top: 16,
                    bottom: -8,
                    width: 2,
                    background: isFailed ? '#fecaca' : '#e2e8f0'
                  }} />
                )}
                <div style={{
                  position: 'absolute',
                  left: -30,
                  top: 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: isFailed ? '#ef4444' : s.color,
                  border: '3px solid #fff',
                  boxShadow: `0 0 0 2px ${isFailed ? '#ef444440' : s.color + '40'}`
                }} />
                <div style={{
                  padding: 12,
                  borderRadius: 8,
                  background: isFailed ? '#fef2f2' : '#f8fafc',
                  border: isFailed ? '1px solid #fecaca' : '1px solid #e2e8f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, color: isFailed ? '#ef4444' : '#1e293b' }}>
                      {item.label}
                    </span>
                    <span className={`tag ${STATUS_MAP[item.status]?.cls || 'tag-gray'}`} style={{ fontSize: 11 }}>
                      {s.text}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                    {formatTime(item.time)} · {item.operator}
                  </div>
                  {item.remark && (
                    <div style={{ fontSize: 12, color: isFailed ? '#991b1b' : '#475569' }}>
                      {item.remark}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {order.status === 'failed' && (
        <div className="card" style={{ marginBottom: 16, padding: 20, borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#ef4444' }}>
            🔴 失败诊断
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 14,
              fontWeight: 600,
              padding: '8px 16px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 6,
              color: '#991b1b',
              letterSpacing: 1
            }}>
              ERR-{errorCode || 'UNKNOWN'}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: severity.color + '15',
              borderRadius: 6,
              color: severity.color
            }}>
              <span>{severity.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{severity.label}</span>
            </div>
            {category && (
              <div style={{
                padding: '6px 12px',
                background: category.color + '15',
                borderRadius: 6,
                color: category.color,
                fontSize: 13
              }}>
                {category.label}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>根本原因分析</div>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#475569', fontSize: 13 }}>
              {diagnostic?.rootCause && <li style={{ marginBottom: 6 }}>{diagnostic.rootCause}</li>}
              {diagnostic?.primaryIssue && <li style={{ marginBottom: 6 }}>{diagnostic.primaryIssue}</li>}
              {order.fail_reason && <li style={{ marginBottom: 6 }}>{order.fail_reason}</li>}
              {order.retry_count ? <li style={{ marginBottom: 6 }}>已重试 {order.retry_count} 次</li> : <li style={{ marginBottom: 6 }}>尚未尝试重试</li>}
              {order.channel_switched === 1 ? <li style={{ marginBottom: 6 }}>已尝试切换通道</li> : <li style={{ marginBottom: 6 }}>未切换通道</li>}
              <li style={{ marginBottom: 6 }}>{errorDetail.reason}</li>
              {order.supplier_name && <li style={{ marginBottom: 6 }}>供应商：{order.supplier_name}</li>}
            </ul>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>💡 解决方案</div>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#1e293b', fontSize: 13 }}>
              {diagnostic?.suggestions?.map((s: string, i: number) => (
                <li key={i} style={{ marginBottom: 6 }}>{s}</li>
              ))}
              <li style={{ marginBottom: 6 }}>{errorDetail.solution}</li>
              {errorDetail.retryable && <li style={{ marginBottom: 6 }}>可使用当前通道重试</li>}
              {!errorDetail.retryable && <li style={{ marginBottom: 6 }}>建议切换通道或联系客服</li>}
            </ul>
          </div>

          {(diagnostic?.autoAction && diagnostic.autoAction !== '无') && (
            <div style={{
              padding: 12,
              background: '#eff6ff',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 13
            }}>
              <span style={{ color: '#3b82f6', fontWeight: 500 }}>⚙️ 已自动执行：</span>
              {diagnostic.autoAction}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={handleRetry}
              disabled={!!actionLoading}
            >
              {actionLoading === 'retry' ? '⏳ 处理中...' : '🔄 重试（同通道）'}
            </button>
            <button
              className="btn btn-success"
              onClick={handleSwitchChannel}
              disabled={!!actionLoading}
            >
              {actionLoading === 'switch' ? '⏳ 处理中...' : '🔀 切换通道重试'}
            </button>
            <button
              className="btn btn-warning"
              onClick={handleRefund}
              disabled={!!actionLoading}
            >
              {actionLoading === 'refund' ? '⏳ 处理中...' : '💰 退款'}
            </button>
          </div>
        </div>
      )}

      {(diagnostic?.switchHistory?.length > 0 || order?.channel_id) && (
        <div className="card" style={{ marginBottom: 16, padding: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            ⏳ 通道切换历史
          </div>
          <div style={{ position: 'relative', paddingLeft: 30 }}>
            {(diagnostic?.switchHistory?.length > 0 ? diagnostic.switchHistory : []).map((item: any, index: number, arr: any[]) => {
              const fromName = item.from_channel_id ? `通道#${item.from_channel_id}` : '初始通道';
              const toName = item.channel_name || (item.to_channel_id ? `通道#${item.to_channel_id}` : '原通道');
              const supplierName = item.supplier_name || '';
              const isCurrent = index === 0;
              
              return (
                <div key={index} style={{ position: 'relative', paddingBottom: index < arr.length - 1 ? 20 : 0 }}>
                  {index < arr.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      left: -20,
                      top: 20,
                      bottom: 0,
                      width: 2,
                      background: '#e2e8f0'
                    }} />
                  )}
                  <div style={{
                    position: 'absolute',
                    left: -26,
                    top: 10,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: isCurrent ? '#10b981' : '#6366f1',
                    border: '2px solid #fff',
                    boxShadow: `0 0 0 2px ${isCurrent ? '#10b98140' : '#6366f140'}`
                  }} />
                  <div style={{
                    padding: 12,
                    borderRadius: 8,
                    background: isCurrent ? '#f0fdf4' : '#f8fafc',
                    border: `1px solid ${isCurrent ? '#bbf7d0' : '#e2e8f0'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>
                        {fromName}
                      </span>
                      <span style={{ color: '#94a3b8' }}>→</span>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 500, color: isCurrent ? '#10b981' : '#6366f1' }}>
                        {toName}
                      </span>
                      {supplierName && (
                        <span className="tag tag-blue" style={{ fontSize: 10, padding: '1px 6px' }}>
                          {supplierName}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                      {formatTime(item.created_at)}
                    </div>
                    <div style={{ fontSize: 12, color: '#475569' }}>
                      原因：{item.reason || '自动切换'}
                    </div>
                    {isCurrent && (
                      <div style={{ 
                        marginTop: 6, 
                        fontSize: 11, 
                        color: '#10b981',
                        fontWeight: 500,
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: '#dcfce7',
                        borderRadius: 4
                      }}>
                        ✓ 当前使用
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {(!diagnostic?.switchHistory || diagnostic.switchHistory.length === 0) && order?.channel_id && (
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: -26,
                  top: 10,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '2px solid #fff',
                  boxShadow: '0 0 0 2px #10b98140'
                }} />
                <div style={{
                  padding: 12,
                  borderRadius: 8,
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 500, color: '#10b981' }}>
                      {order.channel_name || `通道#${order.channel_id}`}
                    </span>
                    {order.supplier_name && (
                      <span className="tag tag-blue" style={{ fontSize: 10, padding: '1px 6px' }}>
                        {order.supplier_name}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                    初始分配
                  </div>
                  <div style={{ 
                    marginTop: 6, 
                    fontSize: 11, 
                    color: '#10b981',
                    fontWeight: 500,
                    display: 'inline-block',
                    padding: '2px 8px',
                    background: '#dcfce7',
                    borderRadius: 4
                  }}>
                    ✓ 当前使用
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 20 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: errorCodesExpanded ? 16 : 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          onClick={() => setErrorCodesExpanded(!errorCodesExpanded)}
        >
          <span>📘 错误码对照表</span>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
            {errorCodesExpanded ? '收起 ▲' : '展开 ▼'}
          </span>
        </div>
        
        {errorCodesExpanded && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ borderRadius: 0, boxShadow: 'none' }}>
              <thead>
                <tr>
                  <th>错误码</th>
                  <th>名称</th>
                  <th>可能原因</th>
                  <th>解决方案</th>
                  <th>可重试</th>
                  <th>自动恢复</th>
                </tr>
              </thead>
              <tbody>
                {ERROR_CODE_DETAILS.map(e => {
                  const isCurrent = errorCode && (
                    errorCode.toUpperCase().includes(e.code) || 
                    e.code.includes(errorCode.toUpperCase())
                  );
                  return (
                    <tr key={e.code} style={isCurrent ? { background: '#fef2f2' } : {}}>
                      <td style={{ fontFamily: 'monospace', color: isCurrent ? '#ef4444' : undefined }}>
                        {e.code}
                      </td>
                      <td style={isCurrent ? { color: '#ef4444', fontWeight: 500 } : {}}>
                        {e.name}
                      </td>
                      <td style={{ fontSize: 12 }}>{e.reason}</td>
                      <td style={{ fontSize: 12 }}>{e.solution}</td>
                      <td>
                        <span className={`tag ${e.retryable ? 'tag-green' : 'tag-gray'}`}>
                          {e.retryable ? '是' : '否'}
                        </span>
                      </td>
                      <td>
                        <span className={`tag ${e.autoRecover ? 'tag-blue' : 'tag-gray'}`}>
                          {e.autoRecover ? '是' : '否'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
