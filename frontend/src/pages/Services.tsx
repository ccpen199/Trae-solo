import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../stores/app.store';
import { serviceApi } from '../services/api';
import type { Service, ServiceStatus } from '../types';

const getStatusLabel = (status: ServiceStatus) => {
  switch (status) {
    case 'RUNNING':
      return '运行中';
    case 'OFFLINE':
      return '离线';
    case 'MAINTENANCE':
      return '维护中';
    case 'DEGRADED':
      return '降级';
    default:
      return status;
  }
};

export function Services() {
  const { services, setServices, addService } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_url: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await serviceApi.getAll();
      setServices(data);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const result = await serviceApi.create({
        name: formData.name,
        description: formData.description || undefined,
        base_url: formData.base_url,
      });
      addService(result.service);
      setShowModal(false);
      setFormData({ name: '', description: '', base_url: '' });
      
      alert(`服务创建成功！\n\nAPI 密钥：${result.apiKey}\n\n请保存此密钥 - 后续将不再显示。`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'RUNNING':
        return '#10b981';
      case 'OFFLINE':
        return '#6b7280';
      case 'MAINTENANCE':
        return '#f59e0b';
      case 'DEGRADED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusBadgeStyle = (status: ServiceStatus) => ({
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: getStatusColor(status) + '20',
    color: getStatusColor(status),
  });

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>正在加载服务列表...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>服务管理</h1>
          <p style={styles.subtitle}>管理您的 API 服务和配置</p>
        </div>
        <button style={styles.addButton} onClick={() => setShowModal(true)}>
          <span style={{ marginRight: '8px' }}>+</span>
          添加服务
        </button>
      </div>

      {services.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🔧</div>
          <h3 style={styles.emptyTitle}>暂无服务</h3>
          <p style={styles.emptyText}>点击下方按钮添加您的第一个 API 服务</p>
          <button style={styles.emptyButton} onClick={() => setShowModal(true)}>
            添加第一个服务
          </button>
        </div>
      ) : (
        <div style={styles.servicesGrid}>
          {services.map((service) => (
            <Link
              key={service.id}
              to={`/services/${service.id}`}
              style={styles.serviceCard}
            >
              <div style={styles.serviceHeader}>
                <div style={styles.serviceIcon}>🔌</div>
                <div style={getStatusBadgeStyle(service.status)}>
                  {getStatusLabel(service.status)}
                </div>
              </div>
              <h3 style={styles.serviceName}>{service.name}</h3>
              <p style={styles.serviceDescription}>
                {service.description || '暂无描述'}
              </p>
              <div style={styles.serviceMeta}>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>基础 URL：</span>
                  <span style={styles.metaValue}>{service.base_url}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>创建时间：</span>
                  <span style={styles.metaValue}>
                    {new Date(service.created_at * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>添加新服务</h2>
              <button
                style={styles.modalClose}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div style={styles.errorMessage}>
                  {error}
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>服务名称 *</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：支付服务"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>服务描述</label>
                <textarea
                  style={styles.textarea}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="服务的简要描述"
                  rows={3}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>基础 URL *</label>
                <input
                  type="url"
                  style={styles.input}
                  value={formData.base_url}
                  onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                  placeholder="https://api.example.com/v1"
                  required
                />
                <p style={styles.hint}>
                  此 URL 将作为所有 API 请求的基础地址。系统将对此 URL 执行可用性探测。
                </p>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowModal(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={styles.submitButton}
                  disabled={submitting}
                >
                  {submitting ? '创建中...' : '创建服务'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    fontSize: '18px',
    color: '#6b7280',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: '#1f2937',
  },
  subtitle: {
    margin: '8px 0 0 0',
    fontSize: '14px',
    color: '#6b7280',
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: '#1f2937',
  },
  emptyText: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: '#6b7280',
  },
  emptyButton: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px',
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'box-shadow 0.2s, transform 0.2s',
  },
  serviceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  serviceIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#dbeafe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },
  serviceName: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: '#1f2937',
  },
  serviceDescription: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: 1.5,
  },
  serviceMeta: {
    paddingTop: '16px',
    borderTop: '1px solid #f3f4f6',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  metaItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  metaValue: {
    fontSize: '12px',
    color: '#1f2937',
    fontWeight: 500,
    fontFamily: 'monospace',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid #f3f4f6',
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#1f2937',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '4px',
  },
  formGroup: {
    padding: '0 24px',
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'vertical',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  hint: {
    margin: '8px 0 0 0',
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: 1.5,
  },
  errorMessage: {
    margin: '0 24px 20px 24px',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '8px',
    fontSize: '14px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '20px 24px',
    borderTop: '1px solid #f3f4f6',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
};
