import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';

function Finance({ user }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_type: 'deposit',
    amount: '',
    payment_method: 'cash',
    transaction_no: ''
  });
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractForm, setContractForm] = useState({
    contract_number: '',
    final_price: ''
  });
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({
    amount: '',
    reason: ''
  });

  useEffect(() => {
    loadSubscriptions();
    loadPayments();
  }, [activeTab, user]);

  const loadSubscriptions = async () => {
    try {
      const response = await api.get('/subscriptions');
      if (activeTab === 'pending') {
        setSubscriptions(response.data.filter(s => s.status === 'approved' || s.status === 'contract_pending'));
      } else {
        setSubscriptions(response.data.filter(s => s.status === 'contracted' || s.status === 'refunded'));
      }
    } catch (error) {
      console.error('加载认购单失败:', error);
    }
  };

  const loadPayments = async () => {
    try {
      const response = await api.get('/payments');
      setPayments(response.data);
    } catch (error) {
      console.error('加载收款记录失败:', error);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!selectedSubscription || !paymentForm.amount) {
      alert('请填写完整信息');
      return;
    }

    try {
      await api.post('/payments', {
        subscription_id: selectedSubscription.id,
        ...paymentForm,
        amount: Number(paymentForm.amount)
      });

      alert('收款成功！');
      setShowPaymentModal(false);
      setPaymentForm({
        payment_type: 'deposit',
        amount: '',
        payment_method: 'cash',
        transaction_no: ''
      });
      setSelectedSubscription(null);
      loadSubscriptions();
      loadPayments();
    } catch (error) {
      alert(error.response?.data?.error || '收款失败');
    }
  };

  const handleContract = async (e) => {
    e.preventDefault();
    if (!selectedSubscription || !contractForm.contract_number) {
      alert('请填写完整信息');
      return;
    }

    try {
      await api.post('/contracts', {
        subscription_id: selectedSubscription.id,
        contract_number: contractForm.contract_number,
        final_price: Number(contractForm.final_price) || selectedSubscription.agreed_price
      });

      alert('签约完成！');
      setShowContractModal(false);
      setContractForm({ contract_number: '', final_price: '' });
      setSelectedSubscription(null);
      loadSubscriptions();
    } catch (error) {
      alert(error.response?.data?.error || '签约失败');
    }
  };

  const handleRefund = async (e) => {
    e.preventDefault();
    if (!selectedSubscription || !refundForm.amount || !refundForm.reason) {
      alert('请填写完整信息');
      return;
    }

    try {
      await api.post('/refunds', {
        subscription_id: selectedSubscription.id,
        amount: Number(refundForm.amount),
        reason: refundForm.reason
      });

      alert('退款成功，房源已退回可售状态！');
      setShowRefundModal(false);
      setRefundForm({ amount: '', reason: '' });
      setSelectedSubscription(null);
      loadSubscriptions();
    } catch (error) {
      alert(error.response?.data?.error || '退款失败');
    }
  };

  const getPaymentTypeText = (type) => {
    const map = {
      deposit: '定金',
      down_payment: '首付',
      installment: '分期',
      final: '尾款'
    };
    return map[type] || type;
  };

  const getStatusText = (status) => {
    const map = {
      approved: '已审批待付款',
      contract_pending: '待签约',
      contracted: '已签约',
      refunded: '已退款'
    };
    return map[status] || status;
  };

  return (
    <div>
      <div className="tabs">
        <div
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          待处理
        </div>
        <div
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          已完成
        </div>
      </div>

      <h3 style={{ marginBottom: '16px' }}>认购单列表</h3>
      <table className="table" style={{ marginBottom: '32px' }}>
        <thead>
          <tr>
            <th>编号</th>
            <th>房源</th>
            <th>客户</th>
            <th>成交总价</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                {activeTab === 'pending' ? '暂无待处理的认购单' : '暂无已完成的认购单'}
              </td>
            </tr>
          ) : (
            subscriptions.map((sub) => {
              const totalPrice = Number(sub.agreed_price) * (sub.area || 100);
              return (
                <tr key={sub.id}>
                  <td>#{sub.id}</td>
                  <td>{sub.building_name} {sub.unit_number}</td>
                  <td>{sub.customer_name}</td>
                  <td>¥{(totalPrice / 10000).toFixed(2)}万</td>
                  <td>
                    <span className={`tag ${sub.status === 'contracted' ? 'tag-success' : sub.status === 'refunded' ? 'tag-error' : 'tag-warning'}`}>
                      {getStatusText(sub.status)}
                    </span>
                  </td>
                  <td>
                    {(user.role === 'finance' || user.role === 'admin') && sub.status === 'approved' && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => {
                          setSelectedSubscription(sub);
                          setPaymentForm({ ...paymentForm, amount: Math.round(totalPrice * 0.3) });
                          setShowPaymentModal(true);
                        }}
                      >
                        收款
                      </button>
                    )}
                    {(user.role === 'finance' || user.role === 'admin') && sub.status === 'contract_pending' && (
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ marginLeft: '8px' }}
                        onClick={() => {
                          setSelectedSubscription(sub);
                          setContractForm({ ...contractForm, final_price: totalPrice });
                          setShowContractModal(true);
                        }}
                      >
                        签约
                      </button>
                    )}
                    {(user.role === 'finance' || user.role === 'admin') && (sub.status === 'approved' || sub.status === 'contract_pending') && (
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ marginLeft: '8px' }}
                        onClick={() => {
                          setSelectedSubscription(sub);
                          setRefundForm({ ...refundForm, amount: 50000 });
                          setShowRefundModal(true);
                        }}
                      >
                        退房退款
                      </button>
                    )}
                    {user.role === 'manager' && (
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {sub.status === 'approved' ? '⏳ 待财务收款' :
                         sub.status === 'contract_pending' ? '⏳ 待财务签约' : ''}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <h3 style={{ marginBottom: '16px' }}>收款记录</h3>
      <table className="table">
        <thead>
          <tr>
            <th>收款编号</th>
            <th>客户</th>
            <th>款项类型</th>
            <th>金额</th>
            <th>支付方式</th>
            <th>交易号</th>
            <th>操作人</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>#{payment.id}</td>
              <td>{payment.customer_name}</td>
              <td>{getPaymentTypeText(payment.payment_type)}</td>
              <td>¥{Number(payment.amount).toLocaleString()}</td>
              <td>{payment.payment_method}</td>
              <td>{payment.transaction_no || '-'}</td>
              <td>{payment.operator_name}</td>
              <td>{payment.paid_at || payment.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>财务收款</h3>
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
              <div>房源: {selectedSubscription?.building_name} {selectedSubscription?.unit_number}</div>
              <div>客户: {selectedSubscription?.customer_name}</div>
              <div>成交总价: ¥{(Number(selectedSubscription?.agreed_price) * 100 / 10000).toFixed(2)}万</div>
            </div>
            <form onSubmit={handlePayment}>
              <div className="form-group">
                <label>款项类型</label>
                <select
                  value={paymentForm.payment_type}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_type: e.target.value })}
                >
                  <option value="deposit">定金</option>
                  <option value="down_payment">首付</option>
                  <option value="installment">分期</option>
                  <option value="final">尾款</option>
                </select>
              </div>
              <div className="form-group">
                <label>金额（元）*</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>支付方式</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                >
                  <option value="cash">现金</option>
                  <option value="bank">银行转账</option>
                  <option value="pos">POS刷卡</option>
                  <option value="wechat">微信</option>
                  <option value="alipay">支付宝</option>
                </select>
              </div>
              <div className="form-group">
                <label>交易号</label>
                <input
                  type="text"
                  value={paymentForm.transaction_no}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transaction_no: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">确认收款</button>
                <button type="button" className="btn btn-default" onClick={() => setShowPaymentModal(false)}>
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showContractModal && (
        <div className="modal-overlay" onClick={() => setShowContractModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>签约完成</h3>
            <form onSubmit={handleContract}>
              <div className="form-group">
                <label>合同编号 *</label>
                <input
                  type="text"
                  value={contractForm.contract_number}
                  onChange={(e) => setContractForm({ ...contractForm, contract_number: e.target.value })}
                  placeholder="请输入合同编号"
                  required
                />
              </div>
              <div className="form-group">
                <label>最终成交总价（元）</label>
                <input
                  type="number"
                  value={contractForm.final_price}
                  onChange={(e) => setContractForm({ ...contractForm, final_price: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">确认签约</button>
                <button type="button" className="btn btn-default" onClick={() => setShowContractModal(false)}>
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRefundModal && (
        <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>退房退款</h3>
            <p style={{ color: '#faad14', marginBottom: '16px' }}>
              ⚠️ 退款后房源将退回可售状态，请谨慎操作
            </p>
            <form onSubmit={handleRefund}>
              <div className="form-group">
                <label>退款金额（元）*</label>
                <input
                  type="number"
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>退款原因 *</label>
                <input
                  type="text"
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                  placeholder="请输入退款原因"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-danger">确认退款</button>
                <button type="button" className="btn btn-default" onClick={() => setShowRefundModal(false)}>
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Finance;
