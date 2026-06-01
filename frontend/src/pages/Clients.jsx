import React, { useState, useEffect } from 'react';
import { clientsAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const Clients = () => {
  const { currentUser, canAccess, roleNames } = useAuth();
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    loadClients();
  }, [currentUser]);

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
      await clientsAPI.create(formData);
      setShowModal(false);
      setFormData({ name: '', phone: '', email: '' });
      loadClients();
    } catch (error) {
      console.error('创建客户失败:', error);
      alert('创建客户失败，请重试');
    }
  };

  const getPageTitle = () => {
    const titles = {
      admin: '全部客户管理',
      sales: '我的客户',
      material: '客户列表',
      officer: '客户列表'
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
            + 新增客户
          </button>
        )}
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statItem}>
          <div style={styles.statIcon}>👥</div>
          <div>
            <div style={styles.statValue}>{clients.length}</div>
            <div style={styles.statLabel}>客户总数</div>
          </div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statIcon}>📞</div>
          <div>
            <div style={styles.statValue}>{clients.filter(c => c.phone).length}</div>
            <div style={styles.statLabel}>有联系方式</div>
          </div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statIcon}>📧</div>
          <div>
            <div style={styles.statValue}>{clients.filter(c => c.email).length}</div>
            <div style={styles.statLabel}>有邮箱</div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.tableCell}>客户名称</th>
              <th style={styles.tableCell}>联系电话</th>
              <th style={styles.tableCell}>邮箱</th>
              <th style={styles.tableCell}>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} style={styles.tableRow}>
                <td style={styles.tableCell}>
                  <div style={styles.clientName}>
                    <span style={styles.clientAvatar}>{client.name.charAt(0)}</span>
                    <span>{client.name}</span>
                  </div>
                </td>
                <td style={styles.tableCell}>
                  <a href={`tel:${client.phone}`} style={styles.phoneLink}>{client.phone}</a>
                </td>
                <td style={styles.tableCell}>
                  {client.email ? (
                    <a href={`mailto:${client.email}`} style={styles.emailLink}>{client.email}</a>
                  ) : '-'}
                </td>
                <td style={styles.tableCell}>{new Date(client.created_at).toLocaleString('zh-CN')}</td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td colSpan="4" style={{...styles.tableCell, textAlign: 'center', color: '#999', padding: '60px'}}>
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>👥</div>
                    <p>暂无客户数据</p>
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
            <h2 style={styles.modalTitle}>新增客户</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>客户名称 *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="请输入客户名称"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>联系电话 *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="请输入联系电话"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>邮箱</label>
                <input
                  type="email"
                  style={styles.input}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="请输入邮箱地址"
                />
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
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '20px'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  statIcon: {
    fontSize: '32px'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#2c3e50'
  },
  statLabel: {
    fontSize: '12px',
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
    gap: '10px',
    fontWeight: 500
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
  phoneLink: {
    color: '#3498db',
    textDecoration: 'none'
  },
  emailLink: {
    color: '#3498db',
    textDecoration: 'none'
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
    width: '400px',
    maxWidth: '90%'
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

export default Clients;
