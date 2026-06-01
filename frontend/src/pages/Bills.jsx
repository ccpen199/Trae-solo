import React, { useState, useEffect } from 'react';
import { getBills, getBill, payBill, applyReduction } from '../api.js';

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [showDetail, setShowDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReductionModal, setShowReductionModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [reductionAmount, setReductionAmount] = useState('');
  const [reductionReason, setReductionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadBills();
  }, [filterStatus]);

  const loadBills = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await getBills(params);
      console.log('账单列表API返回:', res.data);
      setBills(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('加载账单失败:', error);
      setBills([]);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await getBill(id);
      console.log('账单详情API返回:', res.data);
      setDetailData(res.data || {});
      setShowDetail(id);
    } catch (error) {
      console.error('加载账单详情失败:', error);
      setDetailData({});
    }
  };

  const handleOpenPayModal = (bill) => {
    setSelectedBill(bill);
    const amount = Number(bill.amount) || 0;
    const paid = Number(bill.paid_amount) || 0;
    setPayAmount(Math.max(0, amount - paid).toString());
    setShowPayModal(true);
  };

  const handlePay = async (e) => {
    e.preventDefault();
    try {
      await payBill(selectedBill.id, { amount: parseFloat(payAmount) });
      setShowPayModal(false);
      loadBills();
      if (showDetail) {
        handleViewDetail(showDetail);
      }
    } catch (error) {
      alert('付款失败: ' + error.message);
    }
  };

  const handleOpenReductionModal = (bill) => {
    setSelectedBill(bill);
    setReductionAmount('');
    setReductionReason('');
    setShowReductionModal(true);
  };

  const handleReduction = async (e) => {
    e.preventDefault();
    try {
      await applyReduction(selectedBill.id, {
        reduction_amount: parseFloat(reductionAmount),
        reason: reductionReason
      });
      setShowReductionModal(false);
      loadBills();
      if (showDetail) {
        handleViewDetail(showDetail);
      }
    } catch (error) {
      alert('减免失败: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'unpaid': ['未支付', 'danger'],
      'partial': ['部分支付', 'warning'],
      'paid': ['已支付', 'success']
    };
    const [text, type] = map[status] || ['未知', 'secondary'];
    return <span className={`badge ${type}`}>{text}</span>;
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>账单收款管理</h1>
          <p>租金、押金、罚息及减免管理</p>
        </div>
        <select className="form-group" style={{ margin: 0, width: '150px' }}
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">全部状态</option>
          <option value="unpaid">未支付</option>
          <option value="partial">部分支付</option>
          <option value="paid">已支付</option>
        </select>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>账单编号</th>
              <th>合同编号</th>
              <th>客户名称</th>
              <th>类型</th>
              <th>金额</th>
              <th>已付</th>
              <th>到期日</th>
              <th>逾期天数</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center text-muted py-4">暂无账单数据</td>
              </tr>
            ) : (
              bills.map(bill => (
                <tr key={bill.id}>
                  <td><code>{bill.bill_no || '-'}</code></td>
                  <td>{bill.contract_no || '-'}</td>
                  <td>{bill.customer_name || '-'}</td>
                  <td>{bill.bill_type === 'rent' ? '租金' : bill.bill_type === 'deposit' ? '押金' : bill.bill_type === 'penalty' ? '罚息' : (bill.bill_type || '-')}</td>
                  <td>¥{bill.amount != null ? Number(bill.amount).toLocaleString() : '-'}</td>
                  <td>¥{bill.paid_amount != null ? Number(bill.paid_amount).toLocaleString() : '-'}</td>
                  <td>{bill.due_date || '-'}</td>
                  <td>{bill.overdue_days > 0 ? (
                    <span className="text-danger">{bill.overdue_days} 天</span>
                  ) : <span className="text-muted">-</span>}</td>
                  <td>{getStatusBadge(bill.status)}</td>
                  <td>
                    <div className="flex-gap">
                      <button className="btn btn-sm btn-primary" onClick={() => handleViewDetail(bill.id)}>
                        详情
                      </button>
                      {bill.status !== 'paid' && (
                        <button className="btn btn-sm btn-success" onClick={() => handleOpenPayModal(bill)}>
                          收款
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showDetail && detailData && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>账单详情 - {detailData.bill_no || '-'}</h2>
              <button className="close-btn" onClick={() => setShowDetail(null)}>&times;</button>
            </div>
            <div className="grid-2 mb-2">
              <div>合同编号: {detailData.contract_no || '-'}</div>
              <div>客户名称: {detailData.customer_name || '-'}</div>
              <div>账单类型: {detailData.bill_type === 'rent' ? '租金' : detailData.bill_type === 'deposit' ? '押金' : detailData.bill_type === 'penalty' ? '罚息' : (detailData.bill_type || '-')}</div>
              <div>状态: {getStatusBadge(detailData.status)}</div>
              <div>账单金额: ¥{detailData.amount != null ? Number(detailData.amount).toLocaleString() : '-'}</div>
              <div>已付金额: ¥{detailData.paid_amount != null ? Number(detailData.paid_amount).toLocaleString() : '-'}</div>
              <div>减免金额: ¥{detailData.reduction != null ? Number(detailData.reduction).toLocaleString() : '-'}</div>
              <div>罚息: ¥{detailData.penalty != null ? Number(detailData.penalty).toLocaleString() : '-'}</div>
              <div>到期日: {detailData.due_date || '-'}</div>
              <div>逾期天数: {detailData.overdue_days != null ? detailData.overdue_days + ' 天' : '-'}</div>
            </div>
            <div className="mb-2">
              <div className="flex-between">
                <h4>收款操作</h4>
                <div className="flex-gap">
                  <button className="btn btn-sm btn-primary" onClick={() => handleOpenReductionModal(detailData)}>
                    申请减免
                  </button>
                  {detailData.status !== 'paid' && (
                    <button className="btn btn-sm btn-success" onClick={() => handleOpenPayModal(detailData)}>
                      登记收款
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <h4>催收记录</h4>
              {(detailData.collections || []).length === 0 ? (
                <div className="text-muted">暂无催收记录</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>方式</th>
                      <th>催收人</th>
                      <th>结果</th>
                      <th>备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailData.collections || []).map(c => (
                      <tr key={c.id}>
                        <td>{c.collection_date || '-'}</td>
                        <td>{c.collection_method === 'phone' ? '电话' : c.collection_method === 'email' ? '邮件' : c.collection_method === 'on_site' ? '上门' : (c.collection_method || '-')}</td>
                        <td>{c.collector || '-'}</td>
                        <td>{c.result === 'pending' ? '待跟进' : c.result === 'promised' ? '承诺还款' : c.result === 'paid' ? '已还款' : c.result === 'failed' ? '失败' : (c.result || '-')}</td>
                        <td>{c.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>登记收款</h2>
              <button className="close-btn" onClick={() => setShowPayModal(false)}>&times;</button>
            </div>
            <form onSubmit={handlePay}>
              <div className="mb-2">
                <div className="text-muted">账单: {selectedBill?.bill_no || '-'}</div>
                <div className="text-muted">客户: {selectedBill?.customer_name || '-'}</div>
                <div className="text-muted">待收金额: ¥{
                  selectedBill ? 
                    Math.max(0, (Number(selectedBill.amount) || 0) - (Number(selectedBill.paid_amount) || 0)).toLocaleString() 
                    : '-'
                }</div>
              </div>
              <div className="form-group">
                <label>收款金额(元) *</label>
                <input type="number" required value={payAmount}
                  max={selectedBill?.amount - selectedBill?.paid_amount}
                  onChange={e => setPayAmount(e.target.value)} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>取消</button>
                <button type="submit" className="btn btn-success">确认收款</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReductionModal && (
        <div className="modal-overlay" onClick={() => setShowReductionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>申请账单减免</h2>
              <button className="close-btn" onClick={() => setShowReductionModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleReduction}>
              <div className="mb-2">
                <div className="text-muted">账单: {selectedBill?.bill_no}</div>
                <div className="text-muted">待收金额: ¥{(selectedBill?.amount - selectedBill?.paid_amount - (selectedBill?.reduction || 0))?.toLocaleString()}</div>
              </div>
              <div className="form-group">
                <label>减免金额(元) *</label>
                <input type="number" required value={reductionAmount}
                  onChange={e => setReductionAmount(e.target.value)} />
              </div>
              <div className="form-group">
                <label>减免原因</label>
                <textarea rows="3" value={reductionReason}
                  onChange={e => setReductionReason(e.target.value)}
                  placeholder="请说明减免原因" />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReductionModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">提交申请</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
