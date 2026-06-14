import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

const statusMap = {
  pending: { label: '待提交', color: '#8c8c8c' },
  examination: { label: '审查中', color: '#1890ff' },
  registered: { label: '已注册', color: '#52c41a' },
  rejected: { label: '已驳回', color: '#f5222d' },
  expired: { label: '已过期', color: '#bfbfbf' }
};

const riskLevelMap = {
  low: { label: '低风险', color: '#52c41a' },
  medium: { label: '中风险', color: '#faad14' },
  high: { label: '高风险', color: '#f5222d' }
};

export default function TrademarkList() {
  const [trademarks, setTrademarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', risk_level: '', keyword: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTrademark, setSelectedTrademark] = useState(null);
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    fetchTrademarks();
  }, [filters, pagination.page]);

  const fetchTrademarks = async () => {
    try {
      const params = {
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize
      };
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await api.get('/trademarks', { params });
      setTrademarks(response.data.data);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (err) {
      console.error('Failed to fetch trademarks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (id) => {
    if (!confirm('确定要提交该商标的注册申请吗？')) return;
    try {
      await api.post(`/trademarks/${id}/apply`);
      alert('注册申请已提交！');
      fetchTrademarks();
    } catch (err) {
      alert('提交失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleViewDetail = async (tm) => {
    setSelectedTrademark(tm);
    const mockTimeline = [
      { status: 'created', title: '申请创建', date: tm.application_date || tm.created_at?.split('T')[0], description: '商标申请信息已录入系统' },
      { status: 'pending', title: '待提交', date: tm.application_date || tm.created_at?.split('T')[0], description: '申请材料准备中，待提交至知识产权局' }
    ];
    if (tm.status === 'examination' || tm.status === 'registered' || tm.status === 'rejected') {
      mockTimeline.push({ status: 'submitted', title: '已提交', date: tm.application_date, description: '申请已提交至国家知识产权局' });
      mockTimeline.push({ status: 'formal_review', title: '形式审查', date: tm.application_date, description: '形式审查通过，下发受理通知书' });
      mockTimeline.push({ status: 'substantive', title: '实质审查', date: tm.application_date, description: '进入实质审查阶段' });
    }
    if (tm.status === 'registered') {
      mockTimeline.push({ status: 'preliminary', title: '初审公告', date: tm.registration_date, description: '初审公告期三个月' });
      mockTimeline.push({ status: 'registered', title: '核准注册', date: tm.registration_date, description: '无人异议，核准注册，下发商标注册证' });
    }
    if (tm.status === 'rejected') {
      mockTimeline.push({ status: 'rejected', title: '申请驳回', date: tm.application_date, description: '实质审查不通过，申请被驳回' });
    }
    setTimeline(mockTimeline);
    setShowDetail(true);
  };

  return (
    <div style={styles.container}>
      <div style={styles.filterBar}>
        <input
          style={styles.searchInput}
          placeholder="搜索商标名称或注册号..."
          value={filters.keyword}
          onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
        />
        <select
          style={styles.filterSelect}
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
        >
          <option value="">全部状态</option>
          <option value="pending">待提交</option>
          <option value="examination">审查中</option>
          <option value="registered">已注册</option>
          <option value="rejected">已驳回</option>
        </select>
        <select
          style={styles.filterSelect}
          value={filters.risk_level}
          onChange={(e) => setFilters(prev => ({ ...prev, risk_level: e.target.value }))}
        >
          <option value="">全部风险等级</option>
          <option value="low">低风险</option>
          <option value="medium">中风险</option>
          <option value="high">高风险</option>
        </select>
        <Link to="/trademarks/search" style={styles.primaryButton}>
          🔍 商标检索
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>加载中...</div>
      ) : (
        <>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th>商标名称</th>
                  <th>注册号/申请号</th>
                  <th>类别</th>
                  <th>状态</th>
                  <th>风险等级</th>
                  <th>申请日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {trademarks.map((tm) => (
                  <tr key={tm.id} style={styles.tableRow}>
                    <td style={{ fontWeight: '500' }}>{tm.trademark_name}</td>
                    <td>{tm.registration_number || tm.application_number || '-'}</td>
                    <td>{tm.category || '-'}</td>
                    <td>
                      <span style={{ ...styles.statusBadge, background: statusMap[tm.status]?.color + '20', color: statusMap[tm.status]?.color }}>
                        {statusMap[tm.status]?.label || tm.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ ...styles.statusBadge, background: riskLevelMap[tm.risk_level]?.color + '20', color: riskLevelMap[tm.risk_level]?.color }}>
                        {riskLevelMap[tm.risk_level]?.label || tm.risk_level}
                      </span>
                    </td>
                    <td>{tm.application_date || '-'}</td>
                    <td>
                      {tm.status === 'pending' && (
                        <button style={styles.actionButton} onClick={() => handleApply(tm.id)}>
                          提交申请
                        </button>
                      )}
                      <button style={{ ...styles.actionButton, background: '#722ed1', marginLeft: '6px' }} onClick={() => handleViewDetail(tm)}>
                        详情
                      </button>
                    </td>
                  </tr>
                ))}
                {trademarks.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
                      暂无商标数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <span style={{ color: '#8c8c8c' }}>共 {pagination.total} 条</span>
            <div style={styles.pageButtons}>
              <button
                style={styles.pageButton}
                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page === 1}
              >
                上一页
              </button>
              <span style={{ padding: '0 12px' }}>第 {pagination.page} / {pagination.totalPages} 页</span>
              <button
                style={styles.pageButton}
                onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
              >
                下一页
              </button>
            </div>
          </div>
        </>
      )}

      {showDetail && selectedTrademark && (
        <div style={styles.modalOverlay} onClick={() => setShowDetail(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>📋 商标详情</h3>
              <button style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }} onClick={() => setShowDetail(false)}>×</button>
            </div>

            <div style={{ background: '#f5f5f5', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                <div><span style={{ color: '#8c8c8c' }}>商标名称：</span><strong>{selectedTrademark.trademark_name}</strong></div>
                <div><span style={{ color: '#8c8c8c' }}>类别：</span>{selectedTrademark.category || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>申请号：</span>{selectedTrademark.application_number || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>注册号：</span>{selectedTrademark.registration_number || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>当前状态：</span>
                  <span style={{ ...styles.statusBadge, background: statusMap[selectedTrademark.status]?.color + '20', color: statusMap[selectedTrademark.status]?.color }}>
                    {statusMap[selectedTrademark.status]?.label || selectedTrademark.status}
                  </span>
                </div>
                <div><span style={{ color: '#8c8c8c' }}>风险等级：</span>
                  <span style={{ ...styles.statusBadge, background: riskLevelMap[selectedTrademark.risk_level]?.color + '20', color: riskLevelMap[selectedTrademark.risk_level]?.color }}>
                    {riskLevelMap[selectedTrademark.risk_level]?.label || selectedTrademark.risk_level}
                  </span>
                </div>
                <div><span style={{ color: '#8c8c8c' }}>申请人：</span>{selectedTrademark.owner || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>代理人：</span>{selectedTrademark.attorney || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>申请日期：</span>{selectedTrademark.application_date || '-'}</div>
                <div><span style={{ color: '#8c8c8c' }}>注册日期：</span>{selectedTrademark.registration_date || '-'}</div>
              </div>
            </div>

            <h4 style={{ margin: '0 0 16px 0' }}>📅 申请流程时间轴</h4>
            <div style={{ position: 'relative', paddingLeft: '24px' }}>
              {timeline.map((item, index) => (
                <div key={index} style={{ position: 'relative', paddingBottom: index < timeline.length - 1 ? '20px' : 0 }}>
                  {index < timeline.length - 1 && (
                    <div style={{ position: 'absolute', left: '-18px', top: '12px', bottom: '-8px', width: '2px', background: '#d9d9d9' }}></div>
                  )}
                  <div style={{
                    position: 'absolute',
                    left: '-24px',
                    top: '4px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: index === timeline.length - 1 ? '#1890ff' : '#52c41a',
                    border: '2px solid #fff',
                    boxShadow: '0 0 0 2px ' + (index === timeline.length - 1 ? '#1890ff' : '#52c41a')
                  }}></div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600' }}>{item.title}</span>
                      <span style={{ fontSize: '12px', color: '#8c8c8c' }}>{item.date}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#595959' }}>{item.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <h4 style={{ margin: '24px 0 16px 0' }}>📎 材料记录</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f5f5f5', borderRadius: '6px' }}>
                <div>
                  <span>📄 商标代理委托书.pdf</span>
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#8c8c8c' }}>245 KB</span>
                </div>
                <span style={{ fontSize: '12px', color: '#52c41a' }}>已上传</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f5f5f5', borderRadius: '6px' }}>
                <div>
                  <span>🖼️ 商标图样.jpg</span>
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#8c8c8c' }}>1.2 MB</span>
                </div>
                <span style={{ fontSize: '12px', color: '#52c41a' }}>已上传</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f5f5f5', borderRadius: '6px' }}>
                <div>
                  <span>📄 主体资格证明.pdf</span>
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#8c8c8c' }}>890 KB</span>
                </div>
                <span style={{ fontSize: '12px', color: '#52c41a' }}>已上传</span>
              </div>
              {selectedTrademark.status === 'registered' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f6ffed', borderRadius: '6px', border: '1px solid #b7eb8f' }}>
                  <div>
                    <span>🏆 商标注册证.pdf</span>
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: '#8c8c8c' }}>3.5 MB</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#52c41a' }}>已核发</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', gap: '12px' }}>
              <button style={styles.cancelButton} onClick={() => setShowDetail(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  filterBar: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  searchInput: {
    flex: 1,
    minWidth: '200px',
    padding: '10px 14px',
    border: '1px solid #d9d9d9',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none'
  },
  filterSelect: {
    padding: '10px 14px',
    border: '1px solid #d9d9d9',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#fff',
    outline: 'none'
  },
  primaryButton: {
    padding: '10px 20px',
    background: '#1890ff',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    textDecoration: 'none'
  },
  tableContainer: {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    background: '#fafafa',
    borderBottom: '1px solid #f0f0f0'
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500'
  },
  actionButton: {
    padding: '6px 14px',
    background: '#1890ff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0'
  },
  pageButtons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  pageButton: {
    padding: '6px 14px',
    border: '1px solid #d9d9d9',
    background: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    background: '#fff',
    borderRadius: '12px',
    padding: '28px',
    width: '100%',
    maxWidth: '650px',
    maxHeight: '85vh',
    overflowY: 'auto'
  },
  cancelButton: {
    padding: '10px 24px',
    border: '1px solid #d9d9d9',
    background: '#fff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};
