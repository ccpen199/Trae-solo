import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { api } from '../utils/request';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import BottomNav from '../components/BottomNav';

const Logistics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logistics, setLogistics] = useState([]);
  const [activeTab, setActiveTab] = useState('incomplete');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get('/logistics/all', { type: activeTab });
      setLogistics(result?.data || []);
    } catch (err) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      product_name: item.product_name || '',
      courier_company: item.courier_company || '',
      tracking_no: item.tracking_no || '',
      status: item.status || 'transit',
      current_location: item.current_location || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editForm.product_name) {
      showToast('商品名称不能为空', 'error');
      return;
    }

    try {
      await api.put(`/logistics/update/${editingId}`, editForm);
      showToast('保存成功', 'success');
      setEditingId(null);
      fetchData();
    } catch (err) {
      // 错误已在请求拦截器中处理
    }
  };

  const renderLogisticsCard = (item) => {
    const isEditing = editingId === item.id;
    const latestTracking = item?.tracking?.[0] || null;

    if (isEditing) {
      return (
        <div key={item.id} style={styles.card}>
          <div style={styles.editHeader}>
            <h3 style={styles.editTitle}>编辑物流信息</h3>
          </div>
          <div style={styles.editForm}>
            <label style={styles.editLabel}>商品名称</label>
            <input
              style={styles.editInput}
              value={editForm.product_name}
              onChange={(e) => setEditForm({ ...editForm, product_name: e.target.value })}
            />
            <label style={styles.editLabel}>快递公司</label>
            <input
              style={styles.editInput}
              value={editForm.courier_company}
              onChange={(e) => setEditForm({ ...editForm, courier_company: e.target.value })}
              placeholder="如：顺丰速运"
            />
            <label style={styles.editLabel}>快递单号</label>
            <input
              style={styles.editInput}
              value={editForm.tracking_no}
              onChange={(e) => setEditForm({ ...editForm, tracking_no: e.target.value })}
            />
            <label style={styles.editLabel}>当前状态</label>
            <select
              style={styles.editSelect}
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            >
              <option value="pending">待发货</option>
              <option value="shipped">已发货</option>
              <option value="transit">运输中</option>
              <option value="delivered">已签收</option>
            </select>
            <label style={styles.editLabel}>当前位置</label>
            <input
              style={styles.editInput}
              value={editForm.current_location}
              onChange={(e) => setEditForm({ ...editForm, current_location: e.target.value })}
              placeholder="如：上海市浦东新区"
            />
          </div>
          <div style={styles.editActions}>
            <button style={styles.cancelButton} onClick={cancelEdit}>
              取消
            </button>
            <button style={styles.saveButton} onClick={saveEdit}>
              保存
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={item.id} style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.statusBadge}>
            {item.status_text}
          </div>
          <button
            style={styles.editButton}
            onClick={() => startEdit(item)}
          >
            ✏️ 编辑
          </button>
        </div>

        <div style={styles.productRow}>
          <div style={styles.productIcon}>📦</div>
          <div style={styles.productInfo}>
            <h4 style={styles.productName}>{item.product_name}</h4>
            <p style={styles.orderNo}>订单号: {item.order_no}</p>
          </div>
        </div>

        {item.courier_company && (
          <div style={styles.courierRow}>
            <span style={styles.courierText}>
              {item.courier_company} {item.tracking_no || ''}
            </span>
          </div>
        )}

        {latestTracking && (
          <div style={styles.trackingSection}>
            <p style={styles.trackingTime}>
              {dayjs(latestTracking.tracking_time).format('MM-DD HH:mm')}
            </p>
            <p style={styles.trackingDesc}>
              {latestTracking.description}
            </p>
          </div>
        )}

        {item.receiver_address && (
          <div style={styles.addressRow}>
            <span style={styles.addressIcon}>📍</span>
            <span style={styles.addressText}>
              {item.receiver_name} {item.receiver_phone}
              <br />
              {item.receiver_address}
            </span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>物流追踪</h1>
        </div>
        <div style={styles.content}>
          <Loading message="加载物流中..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>物流追踪</h1>
        </div>
        <div style={styles.content}>
          <div style={styles.errorContainer}>
            <p style={styles.errorText}>{error}</p>
            <button style={styles.retryButton} onClick={fetchData}>
              点击重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>物流追踪</h1>
      </div>

      <div style={styles.tabBar}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'incomplete' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('incomplete')}
        >
          进行中
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'completed' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('completed')}
        >
          已完成
        </button>
      </div>

      <div style={styles.content}>
        {logistics.length === 0 ? (
          <EmptyState
            icon="📦"
            title={activeTab === 'incomplete' ? '暂无进行中的物流' : '暂无已完成的物流'}
            description="您的物流信息将在这里显示"
          />
        ) : (
          <div style={styles.cardList}>
            {logistics.map(renderLogisticsCard)}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    paddingBottom: '70px'
  },
  header: {
    backgroundColor: '#fff',
    padding: '20px 20px 16px',
    borderBottom: '1px solid #eee'
  },
  headerTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333'
  },
  tabBar: {
    display: 'flex',
    backgroundColor: '#fff',
    borderBottom: '1px solid #eee'
  },
  tab: {
    flex: 1,
    padding: '14px 0',
    fontSize: '14px',
    color: '#666',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer'
  },
  activeTab: {
    color: '#ff4757',
    fontWeight: '600'
  },
  content: {
    padding: '16px'
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  statusBadge: {
    padding: '4px 12px',
    backgroundColor: '#fff1f0',
    color: '#ff4757',
    fontSize: '12px',
    borderRadius: '12px'
  },
  editButton: {
    fontSize: '13px',
    color: '#666',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer'
  },
  productRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '12px'
  },
  productIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    marginRight: '12px'
  },
  productInfo: {
    flex: 1
  },
  productName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px'
  },
  orderNo: {
    fontSize: '12px',
    color: '#999'
  },
  courierRow: {
    padding: '8px 12px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    marginBottom: '8px'
  },
  courierText: {
    fontSize: '13px',
    color: '#666'
  },
  trackingSection: {
    padding: '12px',
    backgroundColor: '#f0f7ff',
    borderRadius: '8px',
    marginBottom: '8px'
  },
  trackingTime: {
    fontSize: '12px',
    color: '#1890ff',
    marginBottom: '4px'
  },
  trackingDesc: {
    fontSize: '13px',
    color: '#333'
  },
  addressRow: {
    display: 'flex',
    alignItems: 'flex-start',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0'
  },
  addressIcon: {
    marginRight: '8px',
    fontSize: '16px'
  },
  addressText: {
    fontSize: '13px',
    color: '#666',
    lineHeight: '1.5'
  },
  editHeader: {
    marginBottom: '16px'
  },
  editTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  editLabel: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '-8px'
  },
  editInput: {
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    outline: 'none'
  },
  editSelect: {
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#fff'
  },
  editActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px'
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    color: '#666',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  saveButton: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    color: '#fff',
    backgroundColor: '#ff4757',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 20px'
  },
  errorText: {
    color: '#999',
    marginBottom: '16px'
  },
  retryButton: {
    padding: '10px 24px',
    backgroundColor: '#ff4757',
    color: '#fff',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer'
  }
};

export default Logistics;
