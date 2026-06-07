import { useState, useEffect } from 'react';
import api from '../utils/api';

const PartsBom = () => {
  const [activeTab, setActiveTab] = useState('vin');
  const [parts, setParts] = useState([]);
  const [vinMatch, setVinMatch] = useState(null);
  const [vinInput, setVinInput] = useState('LGAX4123456789');
  const [orders, setOrders] = useState([]);
  const [traceRecords, setTraceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [selectedPart, setSelectedPart] = useState(null);
  const [showTrace, setShowTrace] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const categories = ['发动机', '制动系统', '电气系统', '空调系统', '悬挂系统', '滤清器'];

  useEffect(() => {
    loadParts();
    loadOrders();
  }, []);

  const loadParts = async () => {
    try {
      let url = '/parts';
      const params = [];
      if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
      if (categoryFilter) params.push(`category=${encodeURIComponent(categoryFilter)}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      const data = await api.get(url);
      setParts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setParts([]);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await api.get('/parts/orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setOrders([]);
    }
  };

  const handleVinMatch = async () => {
    if (!vinInput.trim()) {
      setError('请输入VIN码');
      return;
    }
    setLoading(true);
    setError('');
    setVinMatch(null);
    try {
      const data = await api.post('/parts/vin-match', { vin: vinInput.trim() });
      setVinMatch(data);
      if (data && data.parts && data.parts.length === 0) {
        setError('未找到适配配件，请检查VIN码是否正确');
      }
    } catch (err) {
      setError('VIN匹配失败，请重试');
    }
    setLoading(false);
  };

  const handleOrderPart = async (part) => {
    setLoading(true);
    setError('');
    try {
      await api.post('/parts/orders', {
        requester_id: 1,
        supplier_id: part.supplier_id,
        part_id: part.id,
        quantity: 1,
      });
      setSuccessMsg(`成功订购 ${part.name}！`);
      loadOrders();
      loadParts();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('订购失败，库存可能不足');
    }
    setLoading(false);
  };

  const viewTrace = async (partId) => {
    setLoading(true);
    try {
      const data = await api.get(`/parts/${partId}/trace`);
      setTraceRecords(Array.isArray(data) ? data : []);
      setSelectedPart(parts.find(p => p.id === partId));
      setShowTrace(true);
    } catch (err) {
      setTraceRecords([]);
      setSelectedPart(parts.find(p => p.id === partId));
      setShowTrace(true);
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    const styles = {
      ordered: { bg: '#dbeafe', color: '#1d4ed8', label: '已下单' },
      shipped: { bg: '#fef3c7', color: '#b45309', label: '已发货' },
      delivered: { bg: '#bfdbfe', color: '#1e40af', label: '已送达' },
      installed: { bg: '#dcfce7', color: '#166534', label: '已装车' },
      cancelled: { bg: '#fee2e2', color: '#dc2626', label: '已取消' },
    };
    const s = styles[status] || styles.ordered;
    return <span style={{ padding: '4px 12px', backgroundColor: s.bg, color: s.color, borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>{s.label}</span>;
  };

  const getStockBadge = (qty) => {
    if (qty >= 50) return { bg: '#dcfce7', color: '#166534', label: '库存充足' };
    if (qty >= 10) return { bg: '#fef3c7', color: '#b45309', label: '库存紧张' };
    return { bg: '#fee2e2', color: '#dc2626', label: '库存不足' };
  };

  const getTraceActionLabel = (action) => {
    const labels = {
      factory_out: { label: '出厂', icon: '🏭', color: '#3b82f6' },
      warehouse_in: { label: '入库', icon: '📦', color: '#8b5cf6' },
      warehouse_out: { label: '出库', icon: '🚚', color: '#f59e0b' },
      delivered: { label: '送达', icon: '✅', color: '#10b981' },
      installed: { label: '装车', icon: '🔧', color: '#059669' },
    };
    return labels[action] || { label: action, icon: '📋', color: '#6b7280' };
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8f9fc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#5a5c69' }}>
          🔧 配件BOM智能匹配 · 搜索结果
        </h1>
        <p style={{ margin: 0, color: '#858796', fontSize: '14px' }}>
          搜索框查询配件，查询结果支持按分类筛选；VIN智能推荐 · 供应商库存 · 流通溯源
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px 20px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '12px 20px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '16px' }}>
          ✅ {successMsg}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e3e6f0' }}>
        {[
          { key: 'vin', label: 'VIN匹配', icon: '🔍' },
          { key: 'inventory', label: '分类库存', icon: '📦' },
          { key: 'orders', label: '我的订单', icon: '🛒' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 28px',
              border: 'none',
              backgroundColor: activeTab === tab.key ? '#4e73df' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#5a5c69',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              borderRadius: '8px 8px 0 0',
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'vin' && (
        <div>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0', color: '#5a5c69' }}>🔍 VIN码智能匹配</h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#5a5c69', fontWeight: '500', fontSize: '14px' }}>输入VIN码（车架号）</label>
                <input
                  type="text"
                  placeholder="请输入17位VIN码，如：LGAX4123456789"
                  value={vinInput}
                  onChange={(e) => setVinInput(e.target.value)}
                  style={{ width: '100%', padding: '14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', fontFamily: 'monospace' }}
                />
              </div>
              <button
                onClick={handleVinMatch}
                disabled={loading}
                style={{
                  padding: '14px 36px',
                  backgroundColor: '#4e73df',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? '匹配中...' : '开始匹配'}
              </button>
            </div>
          </div>

          {vinMatch && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', backgroundColor: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#1e40af' }}>✅ 匹配成功！</h3>
                <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#1e40af' }}>
                  <span><strong>车型：</strong>{vinMatch.vehicle_model || '未知车型'}</span>
                  <span><strong>VIN前缀：</strong>{vinMatch.vin_prefix || '-'}</span>
                  <span><strong>年款：</strong>{vinMatch.year_range || '-'}</span>
                </div>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#5a5c69' }}>
                  🔧 推荐适配配件（{vinMatch.parts?.length || 0}件）
                </h4>
                {(vinMatch.parts || []).length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>暂无适配配件</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fc' }}>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>配件编号</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>配件名称</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>分类</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>价格</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>库存</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(vinMatch.parts || []).map((part) => {
                        const stockStatus = getStockBadge(part.stock_quantity);
                        return (
                          <tr key={part.id} style={{ borderBottom: '1px solid #e3e6f0' }}>
                            <td style={{ padding: '12px', fontFamily: 'monospace', color: '#5a5c69', fontSize: '13px' }}>{part.part_number}</td>
                            <td style={{ padding: '12px', fontWeight: '500', color: '#5a5c69' }}>{part.name}</td>
                            <td style={{ padding: '12px', color: '#6b7280', fontSize: '13px' }}>{part.category}</td>
                            <td style={{ padding: '12px', fontWeight: '600', color: '#dc2626' }}>¥{part.price?.toFixed(2)}</td>
                            <td style={{ padding: '12px' }}>
                              <span style={{ padding: '3px 10px', backgroundColor: stockStatus.bg, color: stockStatus.color, borderRadius: '10px', fontSize: '12px', fontWeight: '600' }}>
                                {part.stock_quantity}件 - {stockStatus.label}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <button
                                onClick={() => handleOrderPart(part)}
                                disabled={loading || part.stock_quantity === 0}
                                style={{
                                  padding: '6px 16px',
                                  backgroundColor: part.stock_quantity > 0 ? '#1cc88a' : '#9ca3af',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: part.stock_quantity > 0 && !loading ? 'pointer' : 'not-allowed',
                                  fontSize: '13px',
                                  fontWeight: '500',
                                }}
                              >
                                立即订购
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div>
          <div style={{ backgroundColor: 'white', padding: '20px 24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="搜索配件名称、编号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', minWidth: '150px' }}
              >
                <option value="">全部分类</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                onClick={loadParts}
                style={{ padding: '12px 24px', backgroundColor: '#4e73df', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
              >
                搜索
              </button>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fc' }}>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>配件编号</th>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>配件名称</th>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>分类</th>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>价格</th>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>库存</th>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>供应商</th>
                  <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {parts.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>暂无配件数据</td>
                  </tr>
                ) : (
                  parts.map((part) => {
                    const stockStatus = getStockBadge(part.stock_quantity);
                    return (
                      <tr key={part.id} style={{ borderBottom: '1px solid #e3e6f0' }}>
                        <td style={{ padding: '14px', fontFamily: 'monospace', color: '#5a5c69', fontSize: '13px' }}>{part.part_number}</td>
                        <td style={{ padding: '14px', fontWeight: '500', color: '#5a5c69' }}>{part.name}</td>
                        <td style={{ padding: '14px', color: '#6b7280', fontSize: '13px' }}>{part.category}</td>
                        <td style={{ padding: '14px', fontWeight: '600', color: '#dc2626' }}>¥{part.price?.toFixed(2)}</td>
                        <td style={{ padding: '14px' }}>
                          <span style={{ padding: '3px 10px', backgroundColor: stockStatus.bg, color: stockStatus.color, borderRadius: '10px', fontSize: '12px', fontWeight: '600' }}>
                            {part.stock_quantity}件
                          </span>
                        </td>
                        <td style={{ padding: '14px', color: '#6b7280', fontSize: '13px' }}>{part.supplier_name || '供应商' + part.supplier_id}</td>
                        <td style={{ padding: '14px', display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => viewTrace(part.id)}
                            style={{ padding: '6px 14px', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                          >
                            溯源
                          </button>
                          <button
                            onClick={() => handleOrderPart(part)}
                            disabled={part.stock_quantity === 0}
                            style={{
                              padding: '6px 14px',
                              backgroundColor: part.stock_quantity > 0 ? '#1cc88a' : '#9ca3af',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: part.stock_quantity > 0 ? 'pointer' : 'not-allowed',
                              fontSize: '13px',
                            }}
                          >
                            订购
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e3e6f0' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#5a5c69' }}>🛒 我的订单</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fc' }}>
                <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>订单ID</th>
                <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>配件名称</th>
                <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>数量</th>
                <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>总价</th>
                <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>状态</th>
                <th style={{ padding: '14px', textAlign: 'left', color: '#858796', fontSize: '13px', fontWeight: '600' }}>下单时间</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    暂无订单记录
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #e3e6f0' }}>
                    <td style={{ padding: '14px', fontWeight: '600', color: '#5a5c69' }}>#{order.id}</td>
                    <td style={{ padding: '14px', color: '#5a5c69' }}>{order.part_name || '配件' + order.part_id}</td>
                    <td style={{ padding: '14px', color: '#5a5c69' }}>{order.quantity}件</td>
                    <td style={{ padding: '14px', fontWeight: '600', color: '#dc2626' }}>¥{order.total_price?.toFixed(2)}</td>
                    <td style={{ padding: '14px' }}>{getStatusBadge(order.status)}</td>
                    <td style={{ padding: '14px', fontSize: '13px', color: '#858796' }}>
                      {order.created_at ? new Date(order.created_at).toLocaleString('zh-CN') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showTrace && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#5a5c69' }}>
                📋 配件溯源：{selectedPart?.name || '配件详情'}
              </h2>
              <button onClick={() => { setShowTrace(false); setSelectedPart(null); }} style={{ border: 'none', background: 'none', fontSize: '28px', cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>

            {traceRecords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                <p>暂无溯源记录</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>该配件还没有流通记录</p>
              </div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: '40px' }}>
                <div style={{ position: 'absolute', left: '12px', top: '10px', bottom: '10px', width: '2px', backgroundColor: '#e5e7eb' }} />
                {traceRecords.map((record, i) => {
                  const actionInfo = getTraceActionLabel(record.action);
                  return (
                    <div key={record.id || i} style={{ position: 'relative', marginBottom: '24px' }}>
                      <div style={{
                        position: 'absolute',
                        left: '-36px',
                        top: '2px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: actionInfo.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        boxShadow: `0 2px 8px ${actionInfo.color}40`,
                      }}>
                        {actionInfo.icon}
                      </div>
                      <div style={{ backgroundColor: '#f8f9fc', padding: '16px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '600', color: actionInfo.color, fontSize: '15px' }}>{actionInfo.label}</span>
                          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {record.created_at ? new Date(record.created_at).toLocaleString('zh-CN') : '-'}
                          </span>
                        </div>
                        {record.location && <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6b7280' }}>📍 {record.location}</p>}
                        {record.scan_code && <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6b7280', fontFamily: 'monospace' }}>扫码：{record.scan_code}</p>}
                        {record.notes && <p style={{ margin: 0, fontSize: '13px', color: '#4b5563' }}>📝 {record.notes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartsBom;
