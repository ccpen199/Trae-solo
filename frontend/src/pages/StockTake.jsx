import React, { useState, useEffect } from 'react';
import { stockTakes, liquors } from '../api.js';
import Modal from '../components/Modal.jsx';

function StockTake() {
  const [stockTakeList, setStockTakeList] = useState([]);
  const [liquorList, setLiquorList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingStockTake, setEditingStockTake] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [stockTakesRes, liquorsRes] = await Promise.all([
        stockTakes.getAll(),
        liquors.getAll(),
      ]);
      setStockTakeList(stockTakesRes.data);
      setLiquorList(liquorsRes.data);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const initialItems = liquorList.map(l => ({
        liquor_id: l.id,
        liquor_name: l.name,
        expected_bottles: l.total_bottles,
        expected_opened: l.opened_bottles,
        actual_bottles: l.total_bottles,
        actual_opened: l.opened_bottles,
        variance: 0,
        variance_reason: ''
      }));
      setItems(initialItems);
      setEditingStockTake(null);
      setShowModal(true);
    } catch (err) {
      alert('创建失败: ' + err.message);
    }
  };

  const handleSave = async () => {
    try {
      if (editingStockTake) {
        await stockTakes.update(editingStockTake.id, { items, status: 'completed' });
      } else {
        await stockTakes.create({
          take_date: new Date().toISOString().split('T')[0],
          items,
          created_by: 1
        });
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('保存失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleReview = async (stockTake) => {
    if (!confirm('确认复核并调整库存？')) return;
    try {
      await stockTakes.review(stockTake.id, { reviewed_by: 1, comments: '店长复核通过' });
      loadData();
    } catch (err) {
      alert('复核失败: ' + err.message);
    }
  };

  const viewDetail = async (stockTake) => {
    const detail = await stockTakes.get(stockTake.id);
    setItems(detail.data.items);
    setEditingStockTake(stockTake);
    setShowDetailModal(true);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    if (field === 'variance_reason') {
      newItems[index][field] = value;
    } else {
      newItems[index][field] = parseFloat(value) || 0;
    }
    
    const expectedTotal = newItems[index].expected_bottles * 1000 + newItems[index].expected_opened;
    const actualTotal = newItems[index].actual_bottles * 1000 + newItems[index].actual_opened;
    newItems[index].variance = actualTotal - expectedTotal;
    
    setItems(newItems);
  };

  const updateDetailItem = (index, field, value) => {
    const newItems = [...items];
    if (field === 'variance_reason') {
      newItems[index][field] = value;
    } else {
      newItems[index][field] = parseFloat(value) || 0;
    }
    
    const expectedTotal = newItems[index].expected_bottles * 1000 + newItems[index].expected_opened;
    const actualTotal = newItems[index].actual_bottles * 1000 + newItems[index].actual_opened;
    newItems[index].variance = actualTotal - expectedTotal;
    
    setItems(newItems);
  };

  const handleSaveDetail = async () => {
    try {
      await stockTakes.update(editingStockTake.id, { items, status: 'completed' });
      setShowDetailModal(false);
      loadData();
    } catch (err) {
      alert('保存失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'reviewed': return <span className="badge badge-success">已复核</span>;
      case 'completed': return <span className="badge badge-warning">待复核</span>;
      case 'pending': return <span className="badge badge-info">进行中</span>;
      default: return <span className="badge badge-info">{status}</span>;
    }
  };

  const abnormalCount = items.filter(i => Math.abs(i.variance) > 1000).length;

  return (
    <div>
      <div className="page-header">
        <h2>库存盘点</h2>
        <button className="btn btn-primary" onClick={handleCreate}>
          + 新建盘点
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div>加载中...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>盘点日期</th>
                  <th>商品数量</th>
                  <th>差异金额</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {stockTakeList.map((st) => (
                  <tr key={st.id}>
                    <td className="font-bold">{st.take_date}</td>
                    <td>{st.item_count || 0}</td>
                    <td className={st.total_variance < 0 ? 'variance-negative' : 'variance-positive'}>
                      {st.total_variance > 0 ? '+' : ''}{(st.total_variance / 1000).toFixed(1)} 瓶
                    </td>
                    <td>{getStatusBadge(st.status)}</td>
                    <td>{new Date(st.created_at).toLocaleString('zh-CN')}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => viewDetail(st)}>
                          查看
                        </button>
                        {st.status === 'completed' && (
                          <button className="btn btn-sm btn-success" onClick={() => handleReview(st)}>
                            复核
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {stockTakeList.length === 0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <div className="empty-state-icon">📦</div>
                        <div>暂无盘点记录，点击右上角新建盘点</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="新建盘点"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
            <button className="btn btn-primary" onClick={handleSave}>保存盘点</button>
          </>
        }
      >
        {abnormalCount > 0 && (
          <div style={{ 
            padding: '12px', 
            background: 'rgba(237, 137, 54, 0.1)', 
            borderRadius: '8px', 
            marginBottom: '16px',
            color: 'var(--warning)'
          }}>
            ⚠️ 有 {abnormalCount} 项差异超过 1 瓶，需要重点关注
          </div>
        )}
        
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {items.map((item, index) => (
            <div key={item.liquor_id} className="stock-take-item">
              <div className="stock-take-item-header">
                <span className="font-bold">{item.liquor_name}</span>
                <span className={Math.abs(item.variance) > 1000 ? 'variance-negative' : item.variance > 0 ? 'variance-positive' : ''}>
                  差异: {item.variance > 0 ? '+' : ''}{item.variance.toFixed(0)}ml
                </span>
              </div>
              <div className="stock-take-fields">
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>系统整瓶</label>
                  <div>{item.expected_bottles}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>系统开瓶</label>
                  <div>{item.expected_opened.toFixed(0)}ml</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>实际整瓶</label>
                  <input
                    type="number"
                    className="form-control"
                    value={item.actual_bottles}
                    onChange={(e) => updateItem(index, 'actual_bottles', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>实际开瓶</label>
                  <input
                    type="number"
                    className="form-control"
                    value={item.actual_opened}
                    onChange={(e) => updateItem(index, 'actual_opened', e.target.value)}
                    style={{ width: '100%', padding: '6px 10px' }}
                  />
                </div>
              </div>
              {Math.abs(item.variance) > 0 && (
                <input
                  type="text"
                  className="form-control"
                  placeholder="差异原因说明..."
                  value={item.variance_reason || ''}
                  onChange={(e) => updateItem(index, 'variance_reason', e.target.value)}
                  style={{ marginTop: '10px' }}
                />
              )}
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`盘点详情 - ${editingStockTake?.take_date}`}
        footer={
          editingStockTake?.status !== 'reviewed' && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={() => handleSaveDetail()}>保存盘点</button>
            </>
          )
        }
      >
        <div style={{ marginBottom: '16px' }}>
          <span>状态: {getStatusBadge(editingStockTake?.status)}</span>
        </div>
        {abnormalCount > 0 && editingStockTake?.status !== 'reviewed' && (
          <div style={{ 
            padding: '12px', 
            background: 'rgba(237, 137, 54, 0.1)', 
            borderRadius: '8px', 
            marginBottom: '16px',
            color: 'var(--warning)'
          }}>
            ⚠️ 有 {abnormalCount} 项差异超过 1 瓶，需要重点关注
          </div>
        )}
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {items.map((item, index) => (
            <div key={item.liquor_id} className="stock-take-item">
              <div className="stock-take-item-header">
                <span className="font-bold">{item.liquor_name}</span>
                <span className={item.is_abnormal || Math.abs(item.variance) > 1000 ? 'variance-negative' : item.variance > 0 ? 'variance-positive' : ''}>
                  差异: {item.variance > 0 ? '+' : ''}{item.variance.toFixed(0)}ml
                </span>
              </div>
              <div className="stock-take-fields">
                {editingStockTake?.status === 'reviewed' ? (
                  <>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>系统整瓶</label>
                      <div>{item.expected_bottles}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>系统开瓶</label>
                      <div>{item.expected_opened.toFixed(0)}ml</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>系统整瓶</label>
                      <input
                        type="number"
                        className="form-control"
                        value={item.expected_bottles}
                        onChange={(e) => updateDetailItem(index, 'expected_bottles', e.target.value)}
                        style={{ width: '100%', padding: '6px 10px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>系统开瓶</label>
                      <input
                        type="number"
                        className="form-control"
                        value={item.expected_opened}
                        onChange={(e) => updateDetailItem(index, 'expected_opened', e.target.value)}
                        style={{ width: '100%', padding: '6px 10px' }}
                      />
                    </div>
                  </>
                )}
                {editingStockTake?.status === 'reviewed' ? (
                  <>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>实际整瓶</label>
                      <div>{item.actual_bottles}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>实际开瓶</label>
                      <div>{item.actual_opened.toFixed(0)}ml</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>实际整瓶</label>
                      <input
                        type="number"
                        className="form-control"
                        value={item.actual_bottles}
                        onChange={(e) => updateDetailItem(index, 'actual_bottles', e.target.value)}
                        style={{ width: '100%', padding: '6px 10px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>实际开瓶</label>
                      <input
                        type="number"
                        className="form-control"
                        value={item.actual_opened}
                        onChange={(e) => updateDetailItem(index, 'actual_opened', e.target.value)}
                        style={{ width: '100%', padding: '6px 10px' }}
                      />
                    </div>
                  </>
                )}
              </div>
              {editingStockTake?.status !== 'reviewed' && Math.abs(item.variance) > 0 && (
                <input
                  type="text"
                  className="form-control"
                  placeholder="差异原因说明..."
                  value={item.variance_reason || ''}
                  onChange={(e) => updateDetailItem(index, 'variance_reason', e.target.value)}
                  style={{ marginTop: '10px' }}
                />
              )}
              {editingStockTake?.status === 'reviewed' && item.variance_reason && (
                <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  差异原因: {item.variance_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export default StockTake;
