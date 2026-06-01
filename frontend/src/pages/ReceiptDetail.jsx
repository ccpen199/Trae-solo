import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import dayjs from 'dayjs';

export default function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [receivedBy, setReceivedBy] = useState('');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    loadReceipt();
  }, [id]);

  const loadReceipt = async () => {
    const res = await api.get(`/receipts/${id}`);
    setReceipt(res.data);
    setReceivedBy(res.data.received_by || '');
    setRemark(res.data.remark || '');
  };

  const updateItem = (idx, field, value) => {
    const newItems = [...receipt.items];
    newItems[idx][field] = value;
    setReceipt({ ...receipt, items: newItems });
  };

  const saveReceipt = async (status) => {
    await api.patch(`/receipts/${id}`, {
      items: receipt.items,
      received_by: receivedBy,
      remark,
      status
    });
    
    alert(status === 'completed' ? '收货完成' : '保存成功');
    loadReceipt();
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: ['badge-pending', '待收货'],
      completed: ['badge-received', '已收货']
    };
    const [cls, text] = map[status] || ['badge-pending', status];
    return <span className={`badge ${cls}`}>{text}</span>;
  };

  if (!receipt) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>收货单详情 - {receipt.receipt_no}</h1>
        <button className="btn" onClick={() => navigate('/receipts')}>返回</button>
      </div>
      
      <div className="card">
        <div className="form-row">
          <div>
            <strong>订单号：</strong>{receipt.order_no}
          </div>
          <div>
            <strong>门店：</strong>{receipt.store_name}
          </div>
          <div>
            <strong>司机：</strong>{receipt.driver}
          </div>
          <div>
            <strong>状态：</strong>{getStatusBadge(receipt.status)}
          </div>
        </div>
        <div className="form-row mt-20">
          <div className="form-group">
            <label>收货人</label>
            <input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />
          </div>
          <div className="form-group">
            <label>备注</label>
            <input value={remark} onChange={(e) => setRemark(e.target.value)} />
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3>收货明细</h3>
        <table style={{ marginTop: '15px' }}>
          <thead>
            <tr>
              <th>商品</th>
              <th>规格</th>
              <th>发货数量</th>
              <th>实收数量</th>
              <th>拒收数量</th>
              <th>拒收原因</th>
              <th>温度(℃)</th>
              <th>临期</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item, idx) => (
              <tr key={item.id}>
                <td>{item.product_name}</td>
                <td>{item.spec}</td>
                <td>{item.shipped_qty}</td>
                <td>
                  <input 
                    type="number" 
                    value={item.received_qty || 0} 
                    min="0"
                    onChange={(e) => updateItem(idx, 'received_qty', parseFloat(e.target.value))}
                    style={{ width: '80px' }}
                  />
                </td>
                <td className="text-danger">
                  <input 
                    type="number" 
                    value={item.rejected_qty || 0} 
                    min="0"
                    onChange={(e) => updateItem(idx, 'rejected_qty', parseFloat(e.target.value))}
                    style={{ width: '80px' }}
                  />
                </td>
                <td>
                  <select 
                    value={item.reject_reason || ''} 
                    onChange={(e) => updateItem(idx, 'reject_reason', e.target.value)}
                    style={{ width: '100px' }}
                  >
                    <option value="">无</option>
                    <option value="破损">破损</option>
                    <option value="变质">变质</option>
                    <option value="温度异常">温度异常</option>
                    <option value="临期">临期</option>
                    <option value="其他">其他</option>
                  </select>
                </td>
                <td>
                  <input 
                    type="number" 
                    step="0.1"
                    value={item.temperature || ''} 
                    onChange={(e) => updateItem(idx, 'temperature', parseFloat(e.target.value))}
                    style={{ width: '70px' }}
                    placeholder="温度"
                  />
                </td>
                <td>
                  <input 
                    type="checkbox"
                    checked={item.is_expiring_soon === 1}
                    onChange={(e) => updateItem(idx, 'is_expiring_soon', e.target.checked ? 1 : 0)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex gap-10">
        <button className="btn btn-primary" onClick={() => saveReceipt('pending')}>保存</button>
        {receipt.status !== 'completed' && (
          <button className="btn btn-success" onClick={() => saveReceipt('completed')}>确认收货完成</button>
        )}
      </div>
    </div>
  );
}
