import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { useParams, useNavigate } from 'react-router-dom';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exceptionType, setExceptionType] = useState('');
  const [exceptionDesc, setExceptionDesc] = useState('');
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [message, setMessage] = useState(null);
  const [signature, setSignature] = useState('');

  useEffect(() => {
    loadDetail();
  }, [id]);

  const loadDetail = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setData(res.data);
    } catch (e) {
      setMessage({ type: 'error', text: '加载失败' });
    } finally {
      setLoading(false);
    }
  };

  const handlePick = async () => {
    try {
      await api.post(`/orders/${id}/pick`);
      setMessage({ type: 'success', text: '取餐成功' });
      loadDetail();
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || '操作失败' });
    }
  };

  const handleDeliver = async () => {
    try {
      const res = await api.post(`/orders/${id}/deliver`, {
        signer_name: data.order.customer_name,
        signature_data: signature
      });
      setMessage({ type: 'success', text: `送达成功，已秒级结算 ¥${res.data.settledAmount}` });
      loadDetail();
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.error || '操作失败' });
    }
  };

  const handleException = async () => {
    if (!exceptionType) {
      alert('请选择异常类型');
      return;
    }
    try {
      await api.post(`/orders/${id}/exception`, {
        exception_type: exceptionType,
        description: exceptionDesc
      });
      setMessage({ type: 'success', text: '异常已上报' });
      setShowExceptionModal(false);
      loadDetail();
    } catch (e) {
      setMessage({ type: 'error', text: '上报失败' });
    }
  };

  const handleAppeal = async () => {
    try {
      await api.post('/platform/appeals', {
        order_id: id,
        type: 'order_issue',
        title: `订单 ${data.order.order_no} 申诉`,
        description: '骑手对订单处理结果有异议'
      });
      setMessage({ type: 'success', text: '申诉已提交' });
    } catch (e) {
      setMessage({ type: 'error', text: '申诉提交失败' });
    }
  };

  if (loading) return <div className="container"><div className="spinner" /> 加载中...</div>;
  if (!data) return <div className="container">订单不存在</div>;

  const { order, events, exceptions, signature: sig } = data;

  return (
    <div className="container">
      <div className="breadcrumb">
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/rider/orders'); }}>← 返回订单列表</a>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`} onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <div className="card">
        <div className="order-header">
          <h2 className="order-no">{order.order_no}</h2>
          <div className="order-amount">¥{order.rider_fee}</div>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <span className={`badge ${order.status === 'delivered' || order.status === 'settled' ? 'badge-success' : 'badge-warning'}`}>
            {order.status === 'accepted' && '待取餐'}
            {order.status === 'picked' && '配送中'}
            {order.status === 'delivered' && '已送达'}
            {order.status === 'settled' && '已结算'}
            {order.status === 'exception' && '异常'}
          </span>
          <span className="badge badge-info" style={{ marginLeft: '8px' }}>
            结算状态：{order.settlement_status === 'settled' ? '已结算' : order.settlement_status === 'settling' ? '结算中' : '待结算'}
          </span>
        </div>

        <div className="grid grid-2" style={{ marginBottom: '20px' }}>
          <div className="card" style={{ margin: 0 }}>
            <h3 style={{ marginBottom: '12px' }}>📍 取餐地址</h3>
            <div style={{ fontWeight: 600 }}>{order.merchant_name}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{order.merchant_address}</div>
          </div>
          <div className="card" style={{ margin: 0 }}>
            <h3 style={{ marginBottom: '12px' }}>🏠 送餐地址</h3>
            <div style={{ fontWeight: 600 }}>{order.customer_name} <span className="mask">{order.customer_phone}</span></div>
            <div style={{ color: 'var(--text-secondary)' }}>{order.customer_address}</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '12px' }}>📦 商品信息</h3>
          <div>{order.goods_description}</div>
          <div style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
            距离约 {(order.estimated_distance / 1000).toFixed(1)} 公里 · 预计 {order.estimated_duration} 分钟
          </div>
        </div>

        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '12px' }}>💰 费用明细</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span>基础配送费</span><span>¥{order.base_fee}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span>小费</span><span>¥{order.tip_fee}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 600, borderTop: '1px solid var(--border)' }}>
            <span>实际收入</span><span style={{ color: 'var(--success)' }}>¥{order.rider_fee}</span>
          </div>
        </div>

        {(order.status === 'accepted' || order.status === 'picked') && (
          <div className="grid grid-2" style={{ marginBottom: '20px' }}>
            {order.status === 'accepted' && (
              <button className="btn btn-success btn-lg btn-block" onClick={handlePick}>
                ✓ 确认取餐
              </button>
            )}
            {order.status === 'picked' && (
              <>
                <div className="form-group">
                  <label className="form-label">电子签收人姓名</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="请输入签收人姓名"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                  />
                </div>
                <button className="btn btn-success btn-lg btn-block" onClick={handleDeliver}>
                  ✓ 确认送达并结算
                </button>
              </>
            )}
            <button className="btn btn-danger btn-lg btn-block" onClick={() => setShowExceptionModal(true)}>
              ⚠ 上报异常
            </button>
          </div>
        )}

        {(order.status === 'delivered' || order.status === 'settled') && (
          <div className="grid grid-2" style={{ marginBottom: '20px' }}>
            <button className="btn btn-block" onClick={handleAppeal}>
              申诉
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="card-title">📝 订单流转记录</h3>
        <table className="table">
          <thead>
            <tr>
              <th>时间</th>
              <th>事件</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={i}>
                <td>{new Date(e.created_at * 1000).toLocaleString()}</td>
                <td>
                  {e.event_type === 'accepted' && '订单已接单'}
                  {e.event_type === 'picked' && '已取餐'}
                  {e.event_type === 'delivered' && '已送达'}
                  {e.event_type === 'settled' && `已结算 ¥${JSON.parse(e.event_data || '{}').amount}`}
                  {e.event_type === 'exception_reported' && `异常上报：${JSON.parse(e.event_data || '{}').type}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {exceptions.length > 0 && (
        <div className="card">
          <h3 className="card-title">⚠️ 异常记录</h3>
          {exceptions.map((e, i) => (
            <div key={i} className="alert alert-warning" style={{ marginBottom: '8px' }}>
              <strong>{e.exception_type === 'timeout' ? '超时' : e.exception_type === 'reject' ? '拒收' : '错送'}</strong>
              <div style={{ marginTop: '4px' }}>{e.description}</div>
              <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {new Date(e.created_at * 1000).toLocaleString()} · 状态：
                <span className={`badge ${e.status === 'resolved' ? 'badge-success' : 'badge-warning'}`}>
                  {e.status === 'resolved' ? '已处理' : '处理中'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showExceptionModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <h3 className="card-title">上报异常</h3>
            <div className="form-group">
              <label className="form-label">异常类型</label>
              <select className="form-select" value={exceptionType} onChange={(e) => setExceptionType(e.target.value)}>
                <option value="">请选择</option>
                <option value="timeout">超时</option>
                <option value="reject">用户拒收</option>
                <option value="wrong_delivery">错送</option>
                <option value="goods_damaged">商品破损</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">详细描述</label>
              <textarea className="textarea" value={exceptionDesc} onChange={(e) => setExceptionDesc(e.target.value)} placeholder="请详细描述异常情况" />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-block" onClick={() => setShowExceptionModal(false)}>取消</button>
              <button className="btn btn-primary btn-block" onClick={handleException}>提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
