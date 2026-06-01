import { useEffect, useState } from 'react';
import { apiGet, formatCurrency, formatDate, createRefund, updateRefund, createComplaint, updateComplaint, getStatusBadgeClass, getStatusText } from '../api';
import type { Summary, ConversionData, ScheduleUtilizationItem, PhotographerIncome, Complaint, RefundRecord, Order } from '../api';

type TabKey = 'summary' | 'conversion' | 'utilization' | 'refunds' | 'complaints' | 'earnings';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'summary', label: '总览' },
  { key: 'conversion', label: '转化' },
  { key: 'utilization', label: '档期利用率' },
  { key: 'earnings', label: '摄影师收入' },
  { key: 'refunds', label: '退款' },
  { key: 'complaints', label: '客诉' },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [conversion, setConversion] = useState<ConversionData | null>(null);
  const [utilization, setUtilization] = useState<ScheduleUtilizationItem[]>([]);
  const [earnings, setEarnings] = useState<PhotographerIncome[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showRefundProcessModal, setShowRefundProcessModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showComplaintProcessModal, setShowComplaintProcessModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundRecord | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const [refundForm, setRefundForm] = useState({ order_id: '', amount: '', reason: '' });
  const [refundProcessForm, setRefundProcessForm] = useState({ status: 'approved', resolution: '' });
  const [complaintForm, setComplaintForm] = useState({ order_id: '', client_name: '', content: '' });
  const [complaintProcessForm, setComplaintProcessForm] = useState({ status: 'resolved', resolution: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    const promises: Promise<void>[] = [];

    if (activeTab === 'summary') {
      promises.push(
        apiGet<Summary>('/api/reports/summary')
          .then(setSummary)
          .catch((err) => setError(err.message))
      );
    }
    if (activeTab === 'conversion') {
      promises.push(
        apiGet<ConversionData>('/api/reports/conversion')
          .then(setConversion)
          .catch((err) => setError(err.message))
      );
    }
    if (activeTab === 'utilization') {
      promises.push(
        apiGet<ScheduleUtilizationItem[]>('/api/reports/schedule-utilization')
          .then(setUtilization)
          .catch((err) => setError(err.message))
      );
    }
    if (activeTab === 'earnings') {
      promises.push(
        apiGet<PhotographerIncome[]>('/api/reports/photographer-income')
          .then(setEarnings)
          .catch((err) => setError(err.message))
      );
    }
    if (activeTab === 'refunds') {
      promises.push(
        apiGet<RefundRecord[]>('/api/reports/refunds')
          .then(setRefunds)
          .catch((err) => setError(err.message))
      );
      promises.push(
        apiGet<Order[]>('/api/orders')
          .then((data) => setOrders(data.filter((o) => o.status !== 'cancelled' && o.paid_amount > 0)))
          .catch((err) => setError(err.message))
      );
    }
    if (activeTab === 'complaints') {
      promises.push(
        apiGet<Complaint[]>('/api/reports/complaints')
          .then(setComplaints)
          .catch((err) => setError(err.message))
      );
      promises.push(
        apiGet<Order[]>('/api/orders')
          .then((data) => setOrders(data.filter((o) => o.status !== 'cancelled')))
          .catch((err) => setError(err.message))
      );
    }

    Promise.all(promises).finally(() => setLoading(false));
  }, [activeTab]);

  const handleCreateRefund = async () => {
    if (!refundForm.order_id || !refundForm.amount) {
      setError('请选择订单并填写退款金额');
      return;
    }
    setSubmitting(true);
    try {
      const newRefund = await createRefund({
        order_id: Number(refundForm.order_id),
        amount: Number(refundForm.amount),
        reason: refundForm.reason,
      });
      setRefunds([newRefund, ...refunds]);
      setShowRefundModal(false);
      setRefundForm({ order_id: '', amount: '', reason: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建退款失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedRefund) return;
    setSubmitting(true);
    try {
      const updated = await updateRefund(selectedRefund.id, {
        status: refundProcessForm.status,
        resolution: refundProcessForm.resolution,
      });
      setRefunds(refunds.map((r) => (r.id === updated.id ? updated : r)));
      setShowRefundProcessModal(false);
      setSelectedRefund(null);
      setRefundProcessForm({ status: 'approved', resolution: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理退款失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateComplaint = async () => {
    if (!complaintForm.order_id || !complaintForm.content) {
      setError('请选择订单并填写客诉内容');
      return;
    }
    setSubmitting(true);
    try {
      const newComplaint = await createComplaint({
        order_id: Number(complaintForm.order_id),
        client_name: complaintForm.client_name,
        content: complaintForm.content,
      });
      setComplaints([newComplaint, ...complaints]);
      setShowComplaintModal(false);
      setComplaintForm({ order_id: '', client_name: '', content: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建客诉失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessComplaint = async () => {
    if (!selectedComplaint) return;
    setSubmitting(true);
    try {
      const updated = await updateComplaint(selectedComplaint.id, {
        status: complaintProcessForm.status,
        resolution: complaintProcessForm.resolution,
      });
      setComplaints(complaints.map((c) => (c.id === updated.id ? updated : c)));
      setShowComplaintProcessModal(false);
      setSelectedComplaint(null);
      setComplaintProcessForm({ status: 'resolved', resolution: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理客诉失败');
    } finally {
      setSubmitting(false);
    }
  };

  const totalUtilization = utilization.length > 0
    ? Math.round(utilization.reduce((sum, item) => sum + item.utilization_rate, 0) / utilization.length * 100) / 100
    : 0;
  const totalSlots = utilization.reduce((sum, item) => sum + item.total_available_days, 0);
  const bookedSlots = utilization.reduce((sum, item) => sum + item.booked_days, 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>报表中心</h1>
          <p>运营数据概览与分析</p>
        </div>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div className="loading">加载中...</div>}
      {error && <div className="notice error">{error}</div>}

      {!loading && !error && activeTab === 'summary' && summary && (
        <div>
          <div className="summary-metrics">
            <div className="metric-card">
              <span>预约数</span>
              <strong>{summary.bookingCount}</strong>
            </div>
            <div className="metric-card">
              <span>合同额</span>
              <strong>{formatCurrency(summary.revenue)}</strong>
            </div>
            <div className="metric-card">
              <span>已收款</span>
              <strong>{formatCurrency(summary.paid)}</strong>
            </div>
            <div className="metric-card">
              <span>待收</span>
              <strong style={{ color: 'var(--danger)' }}>{formatCurrency(summary.outstanding)}</strong>
            </div>
            <div className="metric-card">
              <span>未交付</span>
              <strong>{summary.openDeliveries}</strong>
            </div>
            <div className="metric-card">
              <span>收款完成度</span>
              <strong>{summary.revenue > 0 ? Math.round((summary.paid / summary.revenue) * 100) : 0}%</strong>
            </div>
          </div>

          {summary.nextBookings && summary.nextBookings.length > 0 && (
            <div className="card">
              <h3 className="section-title">近期拍摄</h3>
              <div className="booking-list">
                {summary.nextBookings.slice(0, 5).map((b, i) => (
                  <div className="booking-row" key={i}>
                    <div>
                      <strong>{b.client_name}</strong>
                      <p>{b.shoot_type} · {b.location}</p>
                    </div>
                    <div>
                      <span>{formatDate(b.shoot_date)}</span>
                      <small>{b.photographer_name || '未指定'}</small>
                    </div>
                    <span className={`badge ${b.status === 'confirmed' ? 'active' : 'warn'}`}>
                      {b.status === 'confirmed' ? '已确认' : '待确认'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !error && activeTab === 'conversion' && conversion && (
        <div>
          <div className="summary-metrics">
            <div className="metric-card">
              <span>总预约</span>
              <strong>{conversion.total_bookings}</strong>
            </div>
            <div className="metric-card">
              <span>已确认</span>
              <strong style={{ color: 'var(--success)' }}>{conversion.confirmed}</strong>
            </div>
            <div className="metric-card">
              <span>已完成</span>
              <strong style={{ color: 'var(--primary)' }}>{conversion.completed}</strong>
            </div>
            <div className="metric-card">
              <span>已取消</span>
              <strong style={{ color: 'var(--danger)' }}>{conversion.cancelled}</strong>
            </div>
            <div className="metric-card">
              <span>完成转化率</span>
              <strong>{conversion.conversion_rate}%</strong>
            </div>
          </div>
          <div className="card">
            <h3 className="section-title">转化漏斗</h3>
            {[
              { label: '总预约', value: conversion.total_bookings, color: 'var(--primary)' },
              { label: '已确认', value: conversion.confirmed, color: 'var(--primary-light)' },
              { label: '已完成', value: conversion.completed, color: 'var(--success)' },
              { label: '已取消', value: conversion.cancelled, color: 'var(--danger)' },
            ].map((step) => (
              <div className="funnel-step" key={step.label}>
                <div className="step-label">{step.label}</div>
                <div className="step-bar">
                  <div
                    className="step-fill"
                    style={{
                      width: conversion.total_bookings > 0 ? `${(step.value / conversion.total_bookings) * 100}%` : '0%',
                      background: step.color,
                    }}
                  >
                    {step.value}
                  </div>
                </div>
                <div className="step-value">{step.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && activeTab === 'utilization' && (
        <div>
          <div className="summary-metrics">
            <div className="metric-card">
              <span>总档期</span>
              <strong>{totalSlots}</strong>
            </div>
            <div className="metric-card">
              <span>已预订</span>
              <strong>{bookedSlots}</strong>
            </div>
            <div className="metric-card">
              <span>可用</span>
              <strong>{totalSlots - bookedSlots}</strong>
            </div>
            <div className="metric-card">
              <span>平均利用率</span>
              <strong>{totalUtilization}%</strong>
            </div>
          </div>
          <div className="card">
            <h3 className="section-title">各摄影师档期利用率</h3>
            {utilization.length === 0 ? (
              <div className="empty-state">
                <p>暂无档期数据</p>
              </div>
            ) : (
              <div className="bar-chart">
                {utilization.map((p) => (
                  <div className="bar-row" key={p.photographer_id}>
                    <div className="label">{p.photographer_name}</div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${p.utilization_rate}%`,
                          background: p.utilization_rate >= 70 ? 'var(--success)' : p.utilization_rate >= 40 ? 'var(--primary)' : 'var(--warning)',
                        }}
                      >
                        {p.utilization_rate}%
                      </div>
                    </div>
                    <div className="value">{p.booked_days}/{p.total_available_days}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && !error && activeTab === 'earnings' && (
        <div>
          {earnings.length === 0 ? (
            <div className="card empty-state">
              <p>暂无收入数据</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>摄影师</th>
                  <th>订单数</th>
                  <th>总收入</th>
                  <th>平均订单</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map((e) => (
                  <tr key={e.photographer_id}>
                    <td><strong>{e.photographer_name}</strong></td>
                    <td>{e.order_count}</td>
                    <td>{formatCurrency(e.total_income)}</td>
                    <td>{formatCurrency(e.avg_order_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!loading && !error && activeTab === 'refunds' && (
        <div>
          <div className="page-actions">
            <button className="btn btn-primary" onClick={() => setShowRefundModal(true)}>
              + 新增退款
            </button>
          </div>
          {refunds.length === 0 ? (
            <div className="card empty-state">
              <p>暂无退款记录</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>客户</th>
                  <th>订单金额</th>
                  <th>退款金额</th>
                  <th>退款原因</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.order_no}</strong></td>
                    <td>{r.client_name}</td>
                    <td>{formatCurrency(r.order_amount)}</td>
                    <td style={{ color: 'var(--danger)' }}>{formatCurrency(r.amount)}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(r.status)}`}>
                        {getStatusText(r.status)}
                      </span>
                    </td>
                    <td>{formatDate(r.created_at)}</td>
                    <td>
                      {r.status === 'pending' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setSelectedRefund(r);
                            setShowRefundProcessModal(true);
                          }}
                        >
                          处理
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!loading && !error && activeTab === 'complaints' && (
        <div>
          <div className="page-actions">
            <button className="btn btn-primary" onClick={() => setShowComplaintModal(true)}>
              + 新增客诉
            </button>
          </div>
          {complaints.length === 0 ? (
            <div className="card empty-state">
              <p>暂无客诉记录</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>客户</th>
                  <th>客诉内容</th>
                  <th>状态</th>
                  <th>处理结果</th>
                  <th>创建时间</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.order_no}</strong></td>
                    <td>{c.booking_client_name || c.client_name}</td>
                    <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.content}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(c.status)}`}>
                        {getStatusText(c.status)}
                      </span>
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.resolution || '-'}
                    </td>
                    <td>{formatDate(c.created_at)}</td>
                    <td>{formatDate(c.updated_at)}</td>
                    <td>
                      {(c.status === 'open' || c.status === 'processing') && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setSelectedComplaint(c);
                            setComplaintProcessForm({ status: c.status === 'open' ? 'processing' : 'resolved', resolution: c.resolution || '' });
                            setShowComplaintProcessModal(true);
                          }}
                        >
                          处理
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showRefundModal && (
        <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新增退款申请</h3>
              <button className="modal-close" onClick={() => setShowRefundModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>选择订单 *</label>
                <select
                  value={refundForm.order_id}
                  onChange={(e) => setRefundForm({ ...refundForm, order_id: e.target.value })}
                >
                  <option value="">请选择订单</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_no} - {o.client_name} - {formatCurrency(o.paid_amount)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>退款金额 *</label>
                <input
                  type="number"
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                  placeholder="请输入退款金额"
                />
              </div>
              <div className="form-group">
                <label>退款原因</label>
                <textarea
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  placeholder="请输入退款原因"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRefundModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateRefund} disabled={submitting}>
                {submitting ? '提交中...' : '提交申请'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRefundProcessModal && selectedRefund && (
        <div className="modal-overlay" onClick={() => setShowRefundProcessModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>处理退款申请</h3>
              <button className="modal-close" onClick={() => setShowRefundProcessModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>订单号</label>
                <input type="text" value={selectedRefund.order_no} disabled />
              </div>
              <div className="form-group">
                <label>客户</label>
                <input type="text" value={selectedRefund.client_name} disabled />
              </div>
              <div className="form-group">
                <label>退款金额</label>
                <input type="text" value={formatCurrency(selectedRefund.amount)} disabled />
              </div>
              <div className="form-group">
                <label>退款原因</label>
                <textarea value={selectedRefund.reason || ''} disabled rows={2} />
              </div>
              <div className="form-group">
                <label>处理结果 *</label>
                <select
                  value={refundProcessForm.status}
                  onChange={(e) => setRefundProcessForm({ ...refundProcessForm, status: e.target.value })}
                >
                  <option value="approved">批准退款</option>
                  <option value="rejected">拒绝退款</option>
                </select>
              </div>
              <div className="form-group">
                <label>处理备注</label>
                <textarea
                  value={refundProcessForm.resolution}
                  onChange={(e) => setRefundProcessForm({ ...refundProcessForm, resolution: e.target.value })}
                  placeholder="请输入处理备注"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRefundProcessModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleProcessRefund} disabled={submitting}>
                {submitting ? '处理中...' : '确认处理'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showComplaintModal && (
        <div className="modal-overlay" onClick={() => setShowComplaintModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新增客诉记录</h3>
              <button className="modal-close" onClick={() => setShowComplaintModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>选择订单 *</label>
                <select
                  value={complaintForm.order_id}
                  onChange={(e) => setComplaintForm({ ...complaintForm, order_id: e.target.value })}
                >
                  <option value="">请选择订单</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_no} - {o.client_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>客户姓名</label>
                <input
                  type="text"
                  value={complaintForm.client_name}
                  onChange={(e) => setComplaintForm({ ...complaintForm, client_name: e.target.value })}
                  placeholder="请输入客户姓名"
                />
              </div>
              <div className="form-group">
                <label>客诉内容 *</label>
                <textarea
                  value={complaintForm.content}
                  onChange={(e) => setComplaintForm({ ...complaintForm, content: e.target.value })}
                  placeholder="请输入客诉内容"
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowComplaintModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateComplaint} disabled={submitting}>
                {submitting ? '提交中...' : '提交记录'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showComplaintProcessModal && selectedComplaint && (
        <div className="modal-overlay" onClick={() => setShowComplaintProcessModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>处理客诉</h3>
              <button className="modal-close" onClick={() => setShowComplaintProcessModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>订单号</label>
                <input type="text" value={selectedComplaint.order_no} disabled />
              </div>
              <div className="form-group">
                <label>客户</label>
                <input type="text" value={selectedComplaint.booking_client_name || selectedComplaint.client_name} disabled />
              </div>
              <div className="form-group">
                <label>客诉内容</label>
                <textarea value={selectedComplaint.content} disabled rows={3} />
              </div>
              <div className="form-group">
                <label>处理状态 *</label>
                <select
                  value={complaintProcessForm.status}
                  onChange={(e) => setComplaintProcessForm({ ...complaintProcessForm, status: e.target.value })}
                >
                  <option value="processing">处理中</option>
                  <option value="resolved">已解决</option>
                </select>
              </div>
              <div className="form-group">
                <label>处理结果 *</label>
                <textarea
                  value={complaintProcessForm.resolution}
                  onChange={(e) => setComplaintProcessForm({ ...complaintProcessForm, resolution: e.target.value })}
                  placeholder="请输入处理结果"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowComplaintProcessModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleProcessComplaint} disabled={submitting}>
                {submitting ? '处理中...' : '确认处理'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
