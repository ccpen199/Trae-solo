import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import dayjs from 'dayjs';

function Dashboard({ currentUser }) {
  const [stats, setStats] = useState(null);
  const [ordersByStatus, setOrdersByStatus] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsResponse, statusResponse, productsResponse] = await Promise.all([
        api.getDashboardStats(),
        api.getOrdersByStatus(),
        api.getTopProducts(5)
      ]);

      if (statsResponse.success) setStats(statsResponse.data);
      if (statusResponse.success) setOrdersByStatus(statusResponse.data);
      if (productsResponse.success) setTopProducts(productsResponse.data);
    } catch (error) {
      console.error('加载仪表盘数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 8 }}>仪表盘</h2>
        <p style={{ color: '#666', fontSize: 14 }}>
          欢迎使用 AR 试穿试戴系统，当前用户：{currentUser.name}
        </p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card primary">
          <div className="label">总订单数</div>
          <div className="value">{stats?.totalOrders || 0}</div>
        </div>
        <div className="stat-card warning">
          <div className="label">待处理订单</div>
          <div className="value">{stats?.pendingOrders || 0}</div>
        </div>
        <div className="stat-card success">
          <div className="label">已完成订单</div>
          <div className="value">{stats?.completedOrders || 0}</div>
        </div>
        <div className="stat-card danger">
          <div className="label">已取消订单</div>
          <div className="value">{stats?.cancelledOrders || 0}</div>
        </div>
      </div>

      <div className="row">
        <div className="col">
          <div className="card">
            <h2>业务指标</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: 16, background: '#fafafa', borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>
                  {stats?.recognitionSuccessRate || 0}%
                </div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>识别成功率</div>
              </div>
              <div style={{ textAlign: 'center', padding: 16, background: '#fafafa', borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>
                  {stats?.tryonSuccessRate || 0}%
                </div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>试穿成功率</div>
              </div>
              <div style={{ textAlign: 'center', padding: 16, background: '#fafafa', borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#fa8c16' }}>
                  {stats?.conversionRate || 0}%
                </div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>转化率</div>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: 16, background: '#f6ffed', borderRadius: 8 }}>
              <div style={{ fontSize: 14, color: '#52c41a', fontWeight: 500 }}>
                总成交金额
              </div>
              <div style={{ fontSize: 28, fontWeight: 600, color: '#52c41a', marginTop: 8 }}>
                ¥ {(stats?.totalAmount || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <h2>快捷操作</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <button 
                className="btn btn-primary" 
                style={{ height: 60, fontSize: 16 }}
                onClick={() => navigate('/tryon')}
              >
                📷 开始试穿
              </button>
              <button 
                className="btn btn-success" 
                style={{ height: 60, fontSize: 16 }}
                onClick={() => navigate('/orders')}
              >
                📋 查看订单
              </button>
              <button 
                className="btn btn-warning" 
                style={{ height: 60, fontSize: 16 }}
                onClick={() => navigate('/products')}
              >
                👕 商品库
              </button>
              <button 
                className="btn btn-default" 
                style={{ height: 60, fontSize: 16 }}
                onClick={() => navigate('/approval')}
              >
                ✅ 审批中心
              </button>
            </div>
          </div>

          <div className="card">
            <h2>订单状态分布</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(ordersByStatus).map(([status, count]) => (
                <span 
                  key={status} 
                  className={`status-badge status-${status}`}
                  style={{ fontSize: 13, padding: '6px 12px' }}
                >
                  {getStatusLabel(status)}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>热门试穿商品</h2>
        {topProducts.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>商品名称</th>
                <th>SKU</th>
                <th>分类</th>
                <th>价格</th>
                <th>试穿次数</th>
                <th>成交次数</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={product.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ 
                        width: 32, height: 32, 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 14
                      }}>
                        {index + 1}
                      </span>
                      {product.name}
                    </div>
                  </td>
                  <td>{product.sku}</td>
                  <td>{getCategoryLabel(product.category)}</td>
                  <td style={{ color: '#ff4d4f', fontWeight: 500 }}>¥{product.price}</td>
                  <td>{product.tryon_count || 0}</td>
                  <td>{product.order_count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">暂无热门商品数据</div>
        )}
      </div>

      <div className="card">
        <h2>业务流程说明</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          {[
            { step: 1, label: '打开摄像头', icon: '📷' },
            { step: 2, label: '人脸/人体识别', icon: '👤' },
            { step: 3, label: '叠加商品', icon: '👕' },
            { step: 4, label: '保存分享', icon: '📤' },
            { step: 5, label: '下单审批', icon: '✅' }
          ].map((item, index) => (
            <React.Fragment key={item.step}>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 20px',
                background: '#e6f7ff',
                borderRadius: 8,
                fontSize: 14
              }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: '#999' }}>第{item.step}步</div>
                  <div style={{ fontWeight: 500 }}>{item.label}</div>
                </div>
              </div>
              {index < 4 && <span style={{ color: '#999', fontSize: 20 }}>→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function getStatusLabel(status) {
  const labels = {
    draft: '草稿',
    camera_opened: '摄像头已打开',
    pending_recognition: '待识别',
    recognition_in_progress: '识别中',
    recognition_completed: '识别完成',
    pending_tryon: '待试穿',
    tryon_in_progress: '试穿中',
    tryon_completed: '试穿完成',
    shared: '已分享',
    pending_approval: '待审批',
    approved: '已通过',
    rejected: '已驳回',
    order_placed: '已下单',
    paid: '已支付',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
    reversed: '已逆向'
  };
  return labels[status] || status;
}

function getCategoryLabel(category) {
  const labels = {
    eyewear: '眼镜',
    clothing: '服饰',
    accessories: '配饰'
  };
  return labels[category] || category;
}

export default Dashboard;
