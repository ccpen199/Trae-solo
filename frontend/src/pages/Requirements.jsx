import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { requirementsAPI, clientsAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const Requirements = () => {
  const { currentUser, canAccess, roleNames } = useAuth();
  const [requirements, setRequirements] = useState([]);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    client_id: '',
    registration_region: '',
    company_type: 'limited',
    business_scope: '',
    registered_capital: 50,
    urgent_requirement: false
  });

  useEffect(() => {
    loadRequirements();
    loadClients();
  }, [currentUser]);

  const loadRequirements = async () => {
    try {
      const response = await requirementsAPI.getAll();
      let data = response.data;
      
      if (currentUser.role === 'sales') {
        data = data.filter(r => r.status === 'pending' || r.status === 'in_progress');
      } else if (currentUser.role === 'material') {
        data = data.filter(r => r.status !== 'completed');
      } else if (currentUser.role === 'officer') {
        data = data.filter(r => r.status === 'in_progress' || r.status === 'pending');
      }
      
      if (filterStatus !== 'all') {
        data = data.filter(r => r.status === filterStatus);
      }
      
      setRequirements(data);
    } catch (error) {
      console.error('加载需求列表失败:', error);
    }
  };

  const loadClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      setClients(response.data);
    } catch (error) {
      console.error('加载客户列表失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await requirementsAPI.create(formData);
      setShowModal(false);
      loadRequirements();
    } catch (error) {
      console.error('创建需求失败:', error);
      alert('创建需求失败，请重试');
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': '待处理',
      'in_progress': '进行中',
      'completed': '已完成'
    };
    return statusMap[status] || status;
  };

  const getCompanyTypeText = (type) => {
    const typeMap = {
      'limited': '有限责任公司',
      'sole': '一人有限公司',
      'partnership': '合伙企业',
      'individual': '个体工商户'
    };
    return typeMap[type] || type;
  };

  const getPageTitle = () => {
    const titles = {
      admin: '全部注册需求',
      sales: '我的客户需求',
      material: '待处理材料需求',
      officer: '待办理注册需求'
    };
    return titles[currentUser.role] || titles.admin;
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>{getPageTitle()}</h1>
          <p style={styles.pageSubtitle}>当前角色: {roleNames[currentUser.role]}</p>
        </div>
        {canAccess(['admin', 'sales']) && (
          <button style={styles.addButton} onClick={() => setShowModal(true)}>
            + 新增需求
          </button>
        )}
      </div>

      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <span style={styles.filterLabel}>状态筛选:</span>
          {['all', 'pending', 'in_progress', 'completed'].map(status => (
            <button
              key={status}
              style={{
                ...styles.filterButton,
                ...(filterStatus === status ? styles.filterButtonActive : {})
              }}
              onClick={() => {
                setFilterStatus(status);
                setTimeout(loadRequirements, 0);
              }}
            >
              {status === 'all' ? '全部' : getStatusText(status)}
            </button>
          ))}
        </div>
        <span style={styles.countBadge}>共 {requirements.length} 条记录</span>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.tableCell}>客户名称</th>
              <th style={styles.tableCell}>注册地区</th>
              <th style={styles.tableCell}>公司类型</th>
              <th style={styles.tableCell}>注册资本(万)</th>
              <th style={styles.tableCell}>加急</th>
              <th style={styles.tableCell}>状态</th>
              <th style={styles.tableCell}>创建时间</th>
              <th style={styles.tableCell}>操作</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((req) => (
              <tr key={req.id} style={styles.tableRow}>
                <td style={styles.tableCell}>
                  <div style={styles.clientName}>
                    <span style={styles.clientAvatar}>{req.client_name?.charAt(0)}</span>
                    {req.client_name}
                  </div>
                </td>
                <td style={styles.tableCell}>{req.registration_region}</td>
                <td style={styles.tableCell}>{getCompanyTypeText(req.company_type)}</td>
                <td style={styles.tableCell}>¥{req.registered_capital}</td>
                <td style={styles.tableCell}>
                  {req.urgent_requirement ? (
                    <span style={styles.urgentBadge}>加急</span>
                  ) : (
                    <span style={styles.normalBadge}>普通</span>
                  )}
                </td>
                <td style={styles.tableCell}>
                  <span style={{
                    ...styles.statusTag,
                    backgroundColor: req.status === 'completed' ? '#27ae60' : 
                                     req.status === 'in_progress' ? '#f39c12' : '#95a5a6'
                  }}>
                    {getStatusText(req.status)}
                  </span>
                </td>
                <td style={styles.tableCell}>{new Date(req.created_at).toLocaleString('zh-CN')}</td>
                <td style={styles.tableCell}>
                  <Link to={`/requirements/${req.id}`} style={styles.detailLink}>
                    查看详情
                  </Link>
                </td>
              </tr>
            ))}
            {requirements.length === 0 && (
              <tr>
                <td colSpan="8" style={{...styles.tableCell, textAlign: 'center', color: '#999', padding: '60px'}}>
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>📋</div>
                    <p>暂无符合条件的需求数据</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>新增注册需求</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>客户 *</label>
                <select
                  style={styles.select}
                  value={formData.client_id}
                  onChange={(e) => setFormData({...formData, client_id: e.target.value})}
                  required
                >
                  <option value="">请选择客户</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>注册地区 *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.registration_region}
                  onChange={(e) => setFormData({...formData, registration_region: e.target.value})}
                  placeholder="例如：北京市朝阳区"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>公司类型 *</label>
                <select
                  style={styles.select}
                  value={formData.company_type}
                  onChange={(e) => setFormData({...formData, company_type: e.target.value})}
                >
                  <option value="limited">有限责任公司</option>
                  <option value="sole">一人有限公司</option>
                  <option value="partnership">合伙企业</option>
                  <option value="individual">个体工商户</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>注册资本(万元)</label>
                <input
                  type="number"
                  style={styles.input}
                  value={formData.registered_capital}
                  onChange={(e) => setFormData({...formData, registered_capital: parseFloat(e.target.value)})}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>经营范围</label>
                <textarea
                  style={styles.textarea}
                  value={formData.business_scope}
                  onChange={(e) => setFormData({...formData, business_scope: e.target.value})}
                  rows={3}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={{...styles.label, display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <input
                    type="checkbox"
                    checked={formData.urgent_requirement}
                    onChange={(e) => setFormData({...formData, urgent_requirement: e.target.checked})}
                  />
                  加急办理
                </label>
              </div>
              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  确认创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#2c3e50',
    margin: '0 0 4px 0'
  },
  pageSubtitle: {
    fontSize: '13px',
    color: '#7f8c8d',
    margin: 0
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    padding: '12px 16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  filterLabel: {
    fontSize: '13px',
    color: '#7f8c8d',
    marginRight: '4px'
  },
  filterButton: {
    padding: '6px 14px',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    borderRadius: '16px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#34495e',
    transition: 'all 0.2s'
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
    color: 'white'
  },
  countBadge: {
    fontSize: '13px',
    color: '#7f8c8d'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    backgroundColor: '#f8f9fa'
  },
  tableCell: {
    padding: '14px 16px',
    textAlign: 'left',
    borderBottom: '1px solid #e9ecef',
    fontSize: '14px'
  },
  tableRow: {
    '&:hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  clientName: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  clientAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#3498db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: 'white',
    fontWeight: 600
  },
  urgentBadge: {
    padding: '3px 10px',
    backgroundColor: '#e74c3c',
    color: 'white',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 600
  },
  normalBadge: {
    padding: '3px 10px',
    backgroundColor: '#95a5a6',
    color: 'white',
    borderRadius: '10px',
    fontSize: '11px'
  },
  statusTag: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px'
  },
  detailLink: {
    color: '#3498db',
    textDecoration: 'none',
    fontSize: '14px'
  },
  emptyState: {
    textAlign: 'center'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    width: '500px',
    maxWidth: '90%',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '20px',
    color: '#2c3e50'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    color: '#34495e'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'white',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

export default Requirements;
