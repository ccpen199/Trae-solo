import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { containerApi } from '../services/api';
import { CONTAINER_TYPES } from '../constants';

const ContainerList = () => {
  const navigate = useNavigate();
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    container_number: '',
    booking_number: '',
    bill_of_lading: '',
    container_type: '20GP',
    seal_number: '',
    shipper: '',
    origin_port: '',
    destination_port: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async (searchTerm = '') => {
    try {
      setLoading(true);
      const response = await containerApi.getAll({ search: searchTerm, limit: 50 });
      setContainers(response.data.data);
    } catch (err) {
      console.error('加载箱号失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadContainers(search);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await containerApi.create(formData);
      setShowModal(false);
      setFormData({
        container_number: '',
        booking_number: '',
        bill_of_lading: '',
        container_type: '20GP',
        seal_number: '',
        shipper: '',
        origin_port: '',
        destination_port: '',
      });
      loadContainers(search);
    } catch (err) {
      setError(err.response?.data?.error || '创建失败');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个箱号吗？')) {
      try {
        await containerApi.delete(id);
        loadContainers(search);
      } catch (err) {
        console.error('删除失败:', err);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.pageTitle}>箱号档案管理</h2>
        <button onClick={() => setShowModal(true)} style={styles.addButton}>
          + 新增箱号
        </button>
      </div>

      <form onSubmit={handleSearch} style={styles.searchForm}>
        <input
          type="text"
          placeholder="搜索箱号、订舱号或提单号..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <button type="submit" style={styles.searchButton}>搜索</button>
      </form>

      {loading ? (
        <div style={styles.loading}>加载中...</div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>箱号</th>
                <th style={styles.th}>订舱号</th>
                <th style={styles.th}>箱型</th>
                <th style={styles.th}>起运港</th>
                <th style={styles.th}>目的港</th>
                <th style={styles.th}>货主</th>
                <th style={styles.th}>创建时间</th>
                <th style={styles.th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {containers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={styles.emptyCell}>暂无数据</td>
                </tr>
              ) : (
                containers.map((c) => (
                  <tr key={c.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <span style={styles.containerNumber}>{c.container_number}</span>
                    </td>
                    <td style={styles.td}>{c.booking_number || '-'}</td>
                    <td style={styles.td}>{c.container_type}</td>
                    <td style={styles.td}>{c.origin_port || '-'}</td>
                    <td style={styles.td}>{c.destination_port || '-'}</td>
                    <td style={styles.td}>{c.shipper || '-'}</td>
                    <td style={styles.td}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => navigate(`/container/${c.id}`)}
                        style={styles.viewButton}
                      >
                        详情
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        style={styles.deleteButton}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3>新增箱号</h3>
              <button onClick={() => setShowModal(false)} style={styles.closeButton}>×</button>
            </div>
            {error && <div style={styles.error}>{error}</div>}
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>箱号 *</label>
                  <input
                    type="text"
                    value={formData.container_number}
                    onChange={(e) => setFormData({ ...formData, container_number: e.target.value.toUpperCase() })}
                    placeholder="例如: ABCU1234567"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>订舱号</label>
                  <input
                    type="text"
                    value={formData.booking_number}
                    onChange={(e) => setFormData({ ...formData, booking_number: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>提单号</label>
                  <input
                    type="text"
                    value={formData.bill_of_lading}
                    onChange={(e) => setFormData({ ...formData, bill_of_lading: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>箱型 *</label>
                  <select
                    value={formData.container_type}
                    onChange={(e) => setFormData({ ...formData, container_type: e.target.value })}
                    style={styles.select}
                    required
                  >
                    {CONTAINER_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>封号</label>
                  <input
                    type="text"
                    value={formData.seal_number}
                    onChange={(e) => setFormData({ ...formData, seal_number: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>货主</label>
                  <input
                    type="text"
                    value={formData.shipper}
                    onChange={(e) => setFormData({ ...formData, shipper: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>起运港</label>
                  <input
                    type="text"
                    value={formData.origin_port}
                    onChange={(e) => setFormData({ ...formData, origin_port: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>目的港</label>
                  <input
                    type="text"
                    value={formData.destination_port}
                    onChange={(e) => setFormData({ ...formData, destination_port: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.cancelButton}>
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  保存
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
  container: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#1a365d',
    margin: 0,
  },
  addButton: {
    backgroundColor: '#3182ce',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  searchForm: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  searchInput: {
    flex: 1,
    padding: '0.75rem 1rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '1rem',
  },
  searchButton: {
    backgroundColor: '#4a5568',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: '#718096',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f7fafc',
  },
  th: {
    padding: '1rem',
    textAlign: 'left',
    fontWeight: 600,
    color: '#2d3748',
    borderBottom: '2px solid #e2e8f0',
  },
  tableRow: {
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: '1rem',
    color: '#4a5568',
  },
  containerNumber: {
    fontWeight: 600,
    color: '#2b6cb0',
  },
  emptyCell: {
    textAlign: 'center',
    padding: '2rem',
    color: '#718096',
  },
  viewButton: {
    backgroundColor: '#3182ce',
    color: 'white',
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '4px',
    fontSize: '0.875rem',
    cursor: 'pointer',
    marginRight: '0.5rem',
  },
  deleteButton: {
    backgroundColor: '#e53e3e',
    color: 'white',
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '4px',
    fontSize: '0.875rem',
    cursor: 'pointer',
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
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#718096',
  },
  error: {
    backgroundColor: '#fed7d7',
    color: '#c53030',
    padding: '0.75rem 1rem',
    margin: '0 1.5rem',
    borderRadius: '4px',
  },
  form: {
    padding: '1.5rem',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  formGroup: {
    marginBottom: '0.5rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 500,
    color: '#2d3748',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '1rem',
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '1rem',
    backgroundColor: 'white',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3182ce',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

export default ContainerList;
