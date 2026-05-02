import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../services/api';
import { Building2, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { PropertyStatus, type Property } from '../types';

const PropertyList: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const response = await api.get('/properties');
      const props = response.data?.properties || response?.data?.properties || [];
      setProperties(props);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: PropertyStatus | string | undefined) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      [PropertyStatus.ACTIVE]: { label: '上架中', className: 'badge-success' },
      [PropertyStatus.INACTIVE]: { label: '已下架', className: 'badge-secondary' },
      [PropertyStatus.BLOCKED]: { label: '已封锁', className: 'badge-danger' },
      DRAFT: { label: '草稿', className: 'badge-info' },
      PENDING: { label: '待审核', className: 'badge-warning' },
    };
    const config = status ? statusMap[status.toString()] : statusMap[PropertyStatus.INACTIVE];
    return <span className={`badge ${config?.className || 'badge-secondary'}`}>{config?.label || status}</span>;
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await api.delete(`/properties/${id}`);
      setProperties((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete property:', error);
      alert('删除失败，请重试');
    } finally {
      setDeleting(false);
    }
  };

  const getPrice = (property: Property) => {
    return property.pricePerNight || property.basePrice || 0;
  };

  const getStatus = (property: Property) => {
    if (property.status) return property.status;
    return property.isActive ? PropertyStatus.ACTIVE : PropertyStatus.INACTIVE;
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <p style={{ color: 'var(--gray-500)' }}>加载中...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                marginBottom: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Building2 size={28} style={{ color: 'var(--primary-color)' }} />
              房源管理
            </h1>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
              管理您的所有房源 ({properties.length})
            </p>
          </div>
          <button
            onClick={() => navigate('/properties/create')}
            className="btn btn-primary"
          >
            <Plus size={18} style={{ marginRight: '0.5rem' }} />
            新增房源
          </button>
        </div>

        {properties.length === 0 ? (
          <div
            className="card"
            style={{ textAlign: 'center', padding: '3rem' }}
          >
            <Building2 size={48} style={{ color: 'var(--gray-300)', margin: '0 auto 1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>暂无房源</h3>
            <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>
              点击上方"新增房源"按钮来添加您的第一个房源
            </p>
            <button
              onClick={() => navigate('/properties/create')}
              className="btn btn-primary"
            >
              <Plus size={18} style={{ marginRight: '0.5rem' }} />
              新增房源
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 grid-cols-3" style={{ gap: '1.5rem' }}>
            {properties.map((property) => (
              <div key={property.id} className="card">
                <div
                  style={{
                    height: '180px',
                    backgroundColor: 'var(--gray-100)',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <Building2 size={48} style={{ color: 'var(--gray-400)' }} />
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginRight: '0.5rem' }}>
                      {property.name}
                    </h3>
                    {getStatusBadge(getStatus(property))}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '0.75rem' }}>
                    {property.address}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span className="badge badge-secondary">{property.roomCount}室</span>
                    <span className="badge badge-secondary">{property.bedCount}床</span>
                    <span className="badge badge-secondary">{property.maxGuests}人</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-color)' }}>
                        ¥{getPrice(property).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginLeft: '0.25rem' }}>
                        /晚
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.375rem 0.5rem' }}
                        onClick={() => navigate(`/properties/edit/${property.id}`)}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.375rem 0.5rem', color: 'var(--danger-color)' }}
                        onClick={() => setDeleteConfirm(property.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {deleteConfirm && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
          >
            <div
              className="card"
              style={{ maxWidth: '400px', width: '100%', margin: '1rem' }}
            >
              <h3 style={{ marginBottom: '1rem' }}>确认删除</h3>
              <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
                确定要删除这个房源吗？此操作无法撤销。
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                >
                  取消
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleting}
                  style={{
                    backgroundColor: 'var(--danger-color)',
                    color: 'white',
                  }}
                >
                  {deleting ? '删除中...' : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PropertyList;
