import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet, apiPost, apiPut, formatCurrency, formatDate, getStatusText, getStatusBadgeClass } from '../api';
import type { Order, Booking } from '../api';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const [payAmount, setPayAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('09:00');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [orderPackageName, setOrderPackageName] = useState('');
  const [orderAmount, setOrderAmount] = useState('');

  const searchParams = new URLSearchParams(window.location.search);
  const bookingIdFromQuery = searchParams.get('booking_id');

  function loadData() {
    if (!id && !bookingIdFromQuery) return;
    setLoading(true);
    setError('');
    const promises: Promise<void>[] = [];

    if (id) {
      promises.push(
        apiGet<Order>(`/api/orders/${id}`)
          .then((o) => {
            setOrder(o);
            setDepositAmount(String(o.deposit || 0));
            try {
              const items = JSON.parse(o.checklist || '[]');
              if (Array.isArray(items)) setChecklistItems(items);
            } catch {
              setChecklistItems([]);
            }
            if (o.booking_id) {
              return apiGet<Booking>(`/api/bookings/${o.booking_id}`).then(setBooking);
            }
          })
          .catch((err) => setError(err.message))
      );
    }

    if (bookingIdFromQuery) {
      promises.push(
        apiGet<Booking>(`/api/bookings/${bookingIdFromQuery}`)
          .then((b) => {
            setBooking(b);
            setShowCreateOrder(true);
            setOrderPackageName(b.shoot_type + '套餐');
            setOrderAmount(String(b.budget || 0));
          })
          .catch((err) => setError(err.message))
      );
    }

    Promise.all(promises).finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [id, bookingIdFromQuery]);

  async function handleCreateOrder() {
    if (!bookingIdFromQuery || !orderAmount) return;
    setActionError('');
    try {
      const created = await apiPost<Order>('/api/orders', {
        booking_id: Number(bookingIdFromQuery),
        package_name: orderPackageName,
        amount: Number(orderAmount),
      });
      setActionSuccess('订单创建成功');
      setShowCreateOrder(false);
      setTimeout(() => {
        window.location.href = `/orders/${created.id}`;
      }, 1000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '创建失败');
    }
  }

  async function handlePayDeposit() {
    if (!order || !depositAmount) return;
    setActionError('');
    try {
      await apiPut(`/api/orders/${order.id}`, {
        action: 'pay_deposit',
        deposit: Number(depositAmount),
      });
      setActionSuccess('定金已支付');
      setShowDepositModal(false);
      loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '操作失败');
    }
  }

  async function handlePay() {
    if (!order || !payAmount) return;
    setActionError('');
    try {
      await apiPost(`/api/orders/${order.id}/pay`, {
        amount: Number(payAmount),
      });
      setActionSuccess('付款已记录');
      setShowPayModal(false);
      setPayAmount('');
      loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '操作失败');
    }
  }

  async function handleSign() {
    if (!order) return;
    setActionError('');
    try {
      await apiPut(`/api/orders/${order.id}`, {
        action: 'sign_contract',
      });
      setActionSuccess('合同已签署');
      loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '操作失败');
    }
  }

  async function handleUpdateChecklist() {
    if (!order) return;
    setActionError('');
    try {
      await apiPut(`/api/orders/${order.id}`, {
        action: 'update_checklist',
        checklist: checklistItems,
      });
      setActionSuccess('沟通清单已更新');
      setNewChecklistItem('');
      loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '操作失败');
    }
  }

  function addChecklistItem() {
    if (!newChecklistItem.trim()) return;
    setChecklistItems([...checklistItems, newChecklistItem.trim()]);
    setNewChecklistItem('');
  }

  function removeChecklistItem(index: number) {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  }

  async function handleReminder() {
    if (!order) return;
    setActionError('');
    try {
      await apiPut(`/api/orders/${order.id}`, {
        action: 'send_reminder',
      });
      setActionSuccess('拍摄提醒已发送');
      loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '操作失败');
    }
  }

  async function handleReschedule() {
    if (!order || !rescheduleDate || !rescheduleTime) return;
    setActionError('');
    try {
      await apiPut(`/api/orders/${order.id}`, {
        action: 'reschedule',
        new_date: rescheduleDate,
        new_time: rescheduleTime,
        reschedule_reason: rescheduleReason,
      });
      setActionSuccess('改期成功');
      setShowRescheduleModal(false);
      setRescheduleDate('');
      setRescheduleReason('');
      loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '操作失败');
    }
  }

  async function handleCancel() {
    if (!order) return;
    setActionError('');
    try {
      await apiPut(`/api/orders/${order.id}`, {
        action: 'cancel',
        cancel_reason: cancelReason || '客户取消',
      });
      setActionSuccess('订单已取消');
      setShowCancelModal(false);
      setCancelReason('');
      loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '操作失败');
    }
  }

  function clearSuccess() {
    setActionSuccess('');
  }

  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(clearSuccess, 3000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  if (loading) return <div className="loading">加载中...</div>;
  if (error) return <div className="notice error">加载失败：{error}</div>;

  if (showCreateOrder && booking) {
    return (
      <>
        <div className="page-header">
          <div>
            <h1>创建订单</h1>
            <p>基于预约创建订单</p>
          </div>
          <Link to="/bookings" className="btn btn-secondary">返回预约列表</Link>
        </div>

        {actionError && <div className="notice error">{actionError}</div>}
        {actionSuccess && <div className="notice success">{actionSuccess}</div>}

        <div className="card">
          <h3 className="section-title">预约信息</h3>
          <div className="detail-grid">
            <div className="detail-field">
              <div className="label">客户</div>
              <div className="value">{booking.client_name}</div>
            </div>
            <div className="detail-field">
              <div className="label">拍摄类型</div>
              <div className="value">{booking.shoot_type}</div>
            </div>
            <div className="detail-field">
              <div className="label">拍摄日期</div>
              <div className="value">{formatDate(booking.shoot_date)} {booking.shoot_time}</div>
            </div>
            <div className="detail-field">
              <div className="label">摄影师</div>
              <div className="value">{booking.photographer_name || '未指定'}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">订单信息</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>套餐名称 <span className="required">*</span></label>
              <input type="text" value={orderPackageName} onChange={(e) => setOrderPackageName(e.target.value)} required placeholder="如：婚纱标准套餐" />
            </div>
            <div className="form-group">
              <label>订单金额 ({formatCurrency(0).charAt(0)}) <span className="required">*</span></label>
              <input type="number" value={orderAmount} onChange={(e) => setOrderAmount(e.target.value)} required min={0} placeholder="请输入订单金额" />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleCreateOrder} disabled={!orderAmount}>
              创建订单
            </button>
            <Link to="/bookings" className="btn btn-secondary">取消</Link>
          </div>
        </div>
      </>
    );
  }

  if (!order) return null;

  const isCancelled = order.status === 'cancelled';
  const isCompleted = order.status === 'completed';
  const remaining = Math.max(0, order.amount - order.paid_amount);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>订单详情</h1>
          <p>{order.order_no} · {order.client_name}</p>
        </div>
        <Link to="/orders" className="btn btn-secondary">返回列表</Link>
      </div>

      {actionError && <div className="notice error">{actionError}</div>}
      {actionSuccess && <div className="notice success">{actionSuccess}</div>}

      <div className="card">
        <h3 className="section-title">订单概览</h3>
        <div className="detail-grid">
          <div className="detail-field">
            <div className="label">订单号</div>
            <div className="value">{order.order_no}</div>
          </div>
          <div className="detail-field">
            <div className="label">客户</div>
            <div className="value">{order.client_name}</div>
          </div>
          <div className="detail-field">
            <div className="label">套餐</div>
            <div className="value">{order.package_name || '-'}</div>
          </div>
          <div className="detail-field">
            <div className="label">订单金额</div>
            <div className="value">{formatCurrency(order.amount)}</div>
          </div>
          <div className="detail-field">
            <div className="label">已付金额</div>
            <div className="value">{formatCurrency(order.paid_amount)}</div>
          </div>
          <div className="detail-field">
            <div className="label">待收金额</div>
            <div className="value" style={{ color: remaining > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {formatCurrency(remaining)}
            </div>
          </div>
          <div className="detail-field">
            <div className="label">状态</div>
            <div className="value">
              <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
          </div>
          <div className="detail-field">
            <div className="label">拍摄日期</div>
            <div className="value">{formatDate(order.shoot_date)}</div>
          </div>
          <div className="detail-field">
            <div className="label">拍摄类型</div>
            <div className="value">{order.shoot_type}</div>
          </div>
          <div className="detail-field">
            <div className="label">摄影师</div>
            <div className="value">{order.photographer_name || '-'}</div>
          </div>
          {order.location && (
            <div className="detail-field">
              <div className="label">拍摄地点</div>
              <div className="value">{order.location}</div>
            </div>
          )}
          {order.booking_id && (
            <div className="detail-field">
              <div className="label">关联预约</div>
              <div className="value">#{order.booking_id}</div>
            </div>
          )}
        </div>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3 className="section-title">定金</h3>
          <div className="detail-grid">
            <div className="detail-field">
              <div className="label">定金金额</div>
              <div className="value">{formatCurrency(order.deposit)}</div>
            </div>
            <div className="detail-field">
              <div className="label">支付状态</div>
              <div className="value">
                <span className={`badge ${order.deposit_paid ? 'ok' : 'warn'}`}>
                  {order.deposit_paid ? '已支付' : '待支付'}
                </span>
              </div>
            </div>
          </div>
          {!order.deposit_paid && !isCancelled && !isCompleted && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setDepositAmount(String(order.deposit || Math.round(order.amount * 0.3)));
                setShowDepositModal(true);
              }}
            >
              支付定金
            </button>
          )}
        </div>

        <div className="card">
          <h3 className="section-title">合同</h3>
          <div className="detail-grid">
            <div className="detail-field">
              <div className="label">签署状态</div>
              <div className="value">
                <span className={`badge ${order.contract_signed ? 'ok' : 'warn'}`}>
                  {order.contract_signed ? '已签署' : '待签署'}
                </span>
              </div>
            </div>
          </div>
          {!order.contract_signed && !isCancelled && !isCompleted && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSign}
            >
              标记已签署
            </button>
          )}
        </div>

        <div className="card">
          <h3 className="section-title">拍摄提醒</h3>
          <div className="detail-grid">
            <div className="detail-field">
              <div className="label">提醒状态</div>
              <div className="value">
                <span className={`badge ${order.reminder_sent ? 'ok' : 'warn'}`}>
                  {order.reminder_sent ? '已发送' : '待发送'}
                </span>
              </div>
            </div>
          </div>
          {!order.reminder_sent && !isCancelled && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleReminder}
            >
              发送提醒
            </button>
          )}
        </div>

        <div className="card">
          <h3 className="section-title">改期记录</h3>
          <div className="detail-grid">
            <div className="detail-field">
              <div className="label">改期次数</div>
              <div className="value">{order.reschedule_count} 次</div>
            </div>
          </div>
          {!isCancelled && !isCompleted && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowRescheduleModal(true)}
            >
              申请改期
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">沟通清单</h3>
        {checklistItems.length > 0 ? (
          <ul style={{ marginBottom: 12, paddingLeft: 20 }}>
            {checklistItems.map((item, i) => (
              <li key={i} style={{ padding: '4px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{item}</span>
                {!isCancelled && !isCompleted && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => removeChecklistItem(i)}
                  >
                    删除
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'var(--gray-500)', marginBottom: 12, fontSize: 13 }}>暂无沟通清单</p>
        )}
        {!isCancelled && !isCompleted && (
          <div className="action-row">
            <input
              type="text"
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              placeholder="添加沟通事项"
              style={{ flex: 1, height: 36, padding: '0 12px', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-sm)' }}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
            />
            <button className="btn btn-secondary btn-sm" onClick={addChecklistItem} disabled={!newChecklistItem.trim()}>
              添加
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleUpdateChecklist}>
              保存清单
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">付款记录</h3>
        <div className="detail-grid">
          <div className="detail-field">
            <div className="label">累计已付</div>
            <div className="value">{formatCurrency(order.paid_amount)}</div>
          </div>
          <div className="detail-field">
            <div className="label">剩余待付</div>
            <div className="value">{formatCurrency(remaining)}</div>
          </div>
        </div>
        {remaining > 0 && !isCancelled && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setPayAmount(String(remaining));
              setShowPayModal(true);
            }}
          >
            记录付款
          </button>
        )}
      </div>

      {!isCancelled && !isCompleted && (
        <div className="card">
          <h3 className="section-title" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>取消订单</h3>
          <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 12 }}>
            取消订单将释放摄影师档期，并记录取消原因
          </p>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setShowCancelModal(true)}
          >
            取消订单
          </button>
        </div>
      )}

      {order && (
        <div className="card">
          <h3 className="section-title">交付管理</h3>
          <div className="action-row">
            <Link to="/deliveries" className="btn btn-secondary">查看交付列表</Link>
            <Link to={`/deliveries?order_id=${order.id}`} className="btn btn-primary">创建交付</Link>
          </div>
        </div>
      )}

      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>支付定金</h3>
            <div className="form-group">
              <label>定金金额</label>
              <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} min={0} placeholder="请输入定金金额" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDepositModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handlePayDeposit} disabled={!depositAmount}>确认支付</button>
            </div>
          </div>
        </div>
      )}

      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>记录付款</h3>
            <div className="form-group">
              <label>付款金额</label>
              <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} min={0} placeholder="请输入付款金额" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowPayModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handlePay} disabled={!payAmount}>确认</button>
            </div>
          </div>
        </div>
      )}

      {showRescheduleModal && (
        <div className="modal-overlay" onClick={() => setShowRescheduleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>改期申请</h3>
            <div className="form-group">
              <label>新拍摄日期 <span className="required">*</span></label>
              <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>新拍摄时间 <span className="required">*</span></label>
              <select value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)}>
                {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>改期原因</label>
              <input type="text" value={rescheduleReason} onChange={(e) => setRescheduleReason(e.target.value)} placeholder="请输入改期原因" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowRescheduleModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleReschedule} disabled={!rescheduleDate}>确认改期</button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>取消订单</h3>
            <div className="form-group">
              <label>取消原因</label>
              <input type="text" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="请输入取消原因" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>返回</button>
              <button className="btn btn-danger" onClick={handleCancel}>确认取消</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
