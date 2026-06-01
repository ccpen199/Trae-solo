import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pickingApi, inventoryApi } from '../api';

function PickingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [taskData, setTaskData] = useState(null);
  const [availableInventory, setAvailableInventory] = useState([]);
  const [pickModal, setPickModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pickForm, setPickForm] = useState({ inventory_id: '', picked_quantity: 0, picked_weight: '' });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [taskRes, inventoryRes] = await Promise.all([
        pickingApi.getOne(id),
        inventoryApi.getAvailable()
      ]);
      setTaskData(taskRes.data);
      setAvailableInventory(inventoryRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleStart = async () => {
    try {
      await pickingApi.start(id);
      loadData();
    } catch (err) {
      alert('开始拣货失败');
    }
  };

  const handlePick = async () => {
    try {
      await pickingApi.pickItem(id, {
        task_item_id: selectedItem.id,
        ...pickForm
      });
      setPickModal(false);
      loadData();
    } catch (err) {
      alert('拣货失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleComplete = async () => {
    const allPicked = taskData.items.every(item => item.status === 'picked');
    if (!allPicked) {
      if (!confirm('还有商品未拣完，确定完成拣货？')) {
        return;
      }
    }
    try {
      await pickingApi.complete(id);
      navigate('/picking');
    } catch (err) {
      alert('完成拣货失败');
    }
  };

  if (!taskData) return <div>加载中...</div>;

  const { task, items } = taskData;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <button className="btn" onClick={() => navigate('/picking')}>← 返回</button>
          <h1 className="page-title" style={{ display: 'inline-block', marginLeft: 16, marginBottom: 0 }}>拣货详情</h1>
        </div>
        <div>
          {task.status === 'assigned' && (
            <button className="btn btn-primary" onClick={handleStart}>开始拣货</button>
          )}
          {task.status === 'in_progress' && (
            <button className="btn btn-success" onClick={handleComplete}>完成拣货</button>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>任务信息</h3>
        <div className="grid grid-2">
          <div className="detail-row"><span className="detail-label">订单号:</span><span className="detail-value">{task.order_no}</span></div>
          <div className="detail-row"><span className="detail-label">状态:</span><span className="detail-value">{task.status}</span></div>
          <div className="detail-row"><span className="detail-label">客户:</span><span className="detail-value">{task.customer_name}</span></div>
          <div className="detail-row"><span className="detail-label">地址:</span><span className="detail-value">{task.address}</span></div>
          <div className="detail-row"><span className="detail-label">拣货员:</span><span className="detail-value">{task.picker_name}</span></div>
          <div className="detail-row"><span className="detail-label">时段:</span><span className="detail-value">{task.time_slot}</span></div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>拣货清单</h3>
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>商品名称</th>
              <th>应拣数量</th>
              <th>称重商品</th>
              <th>批次号</th>
              <th>库位</th>
              <th>效期</th>
              <th>实拣数量</th>
              <th>实际重量</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.sku_code}</td>
                <td>{item.name}</td>
                <td>{item.quantity} {item.unit}</td>
                <td>{item.is_weighed ? '是' : '否'}</td>
                <td>{item.batch_no || '-'}</td>
                <td>{item.location || '-'}</td>
                <td>{item.expiry_date || '-'}</td>
                <td>{item.picked_quantity !== null ? item.picked_quantity : '-'}</td>
                <td>{item.picked_weight !== null ? `${item.picked_weight} kg` : '-'}</td>
                <td><span className="badge badge-info">{item.status}</span></td>
                <td>
                  {task.status === 'in_progress' && item.status !== 'picked' && (
                    <button className="btn btn-primary btn-sm" onClick={() => {
                      setSelectedItem(item);
                      const skuInventory = availableInventory.filter(inv => inv.sku_id === item.sku_id);
                      setPickForm({
                        inventory_id: skuInventory[0]?.id || '',
                        picked_quantity: item.quantity,
                        picked_weight: item.is_weighed ? '' : ''
                      });
                      setPickModal(true);
                    }}>拣货</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pickModal && (
        <div className="modal-overlay" onClick={() => setPickModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>拣货 - {selectedItem?.name}</h3>
            <p>应拣数量: {selectedItem?.quantity} {selectedItem?.unit}</p>
            <div className="form-group">
              <label>选择库存</label>
              <select value={pickForm.inventory_id} onChange={e => setPickForm({...pickForm, inventory_id: e.target.value})}>
                <option value="">请选择库存批次</option>
                {availableInventory
                  .filter(inv => inv.sku_id === selectedItem?.sku_id)
                  .map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.batch_no} - {inv.location} - 库存: {inv.quantity} {inv.unit} - 效期: {inv.expiry_date}
                    </option>
                  ))}
              </select>
            </div>
            {selectedItem?.is_weighed ? (
              <div className="form-group">
                <label>实际重量 (kg)</label>
                <input type="number" step="0.01" value={pickForm.picked_weight} onChange={e => setPickForm({...pickForm, picked_weight: e.target.value})} />
              </div>
            ) : (
              <div className="form-group">
                <label>拣货数量</label>
                <input type="number" value={pickForm.picked_quantity} onChange={e => setPickForm({...pickForm, picked_quantity: parseFloat(e.target.value)})} />
              </div>
            )}
            <div className="modal-footer">
              <button className="btn" onClick={() => setPickModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handlePick}>确认拣货</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PickingDetail;
