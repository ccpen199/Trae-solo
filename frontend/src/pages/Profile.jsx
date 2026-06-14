import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

const Profile = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'info');
  const [properties, setProperties] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'my-properties' && user?.role === 'landlord') {
      fetchMyProperties();
    } else if (activeTab === 'favorites') {
      fetchFavorites();
    } else if (activeTab === 'contracts') {
      fetchContracts();
    }
  }, [activeTab]);

  const fetchMyProperties = async () => {
    setLoading(true);
    try {
      const response = await api.get('/properties/my/properties');
      setProperties(response.data.properties);
    } catch (error) {
      console.error('获取我的房源失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await api.get('/properties/my/favorites');
      setFavorites(response.data.properties);
    } catch (error) {
      console.error('获取收藏列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/contracts/my');
      setContracts(response.data.contracts);
    } catch (error) {
      console.error('获取合约列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'info', label: '个人信息' },
    { id: 'favorites', label: '我的收藏' },
    { id: 'contracts', label: '我的合约' },
    ...(user?.role === 'landlord' ? [{ id: 'my-properties', label: '我的房源' }] : [])
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'info':
        return <ProfileInfo user={user} updateUser={updateUser} />;
      case 'my-properties':
        return <MyProperties properties={properties} loading={loading} navigate={navigate} />;
      case 'favorites':
        return <FavoritesList favorites={favorites} loading={loading} navigate={navigate} />;
      case 'contracts':
        return <ContractsList contracts={contracts} loading={loading} navigate={navigate} />;
      default:
        return null;
    }
  };

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-8">个人中心</h1>

      <div className="tabs">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {renderContent()}
    </div>
  );
};

const ProfileInfo = ({ user, updateUser }) => {
  const [formData, setFormData] = useState({
    real_name: user?.real_name || '',
    id_card: user?.id_card || '',
    phone: user?.phone || ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await api.put('/auth/profile', formData);
      updateUser(response.data.user);
      setMessage('更新成功');
    } catch (error) {
      setMessage('更新失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '500px' }}>
      <div className="card-body">
        <div className="mb-8">
          <p><strong>用户名：</strong>{user?.username}</p>
          <p><strong>手机号：</strong>{user?.phone}</p>
          <p><strong>角色：</strong>{user?.role === 'landlord' ? '房东' : user?.role === 'admin' ? '管理员' : '租客'}</p>
          <p><strong>信用分：</strong>{user?.credit_score}</p>
          <p>
            <strong>认证状态：</strong>
            {user?.is_verified ? (
              <span className="badge badge-success">已实名认证</span>
            ) : (
              <span className="badge badge-warning">未认证</span>
            )}
          </p>
        </div>

        {message && (
          <div className={`alert ${message.includes('成功') ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">真实姓名</label>
            <input
              type="text"
              name="real_name"
              className="form-input"
              value={formData.real_name}
              onChange={handleChange}
              placeholder="请输入真实姓名"
            />
          </div>

          <div className="form-group">
            <label className="form-label">身份证号</label>
            <input
              type="text"
              name="id_card"
              className="form-input"
              value={formData.id_card}
              onChange={handleChange}
              placeholder="请输入身份证号（用于实名认证）"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </form>
      </div>
    </div>
  );
};

const MyProperties = ({ properties, loading, navigate }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <span className="badge badge-success">已验证</span>;
      case 'verifying':
        return <span className="badge badge-warning">验证中</span>;
      default:
        return <span className="badge badge-info">待审核</span>;
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="card text-center" style={{ padding: '3rem' }}>
        <p className="text-gray mb-4">暂无房源</p>
        <button className="btn btn-primary" onClick={() => navigate('/publish')}>
          发布房源
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-3">
      {properties.map((property) => (
        <div
          key={property.id}
          className="card property-card"
          onClick={() => navigate(`/property/${property.id}`)}
          style={{ cursor: 'pointer' }}
        >
          <div className="property-image"></div>
          <div className="card-body">
            <div className="flex-between mb-2">
              <h3 className="font-bold">{property.title}</h3>
              {getStatusBadge(property.status)}
            </div>
            <p className="text-gray text-sm mb-2">{property.address}</p>
            <div className="flex-between">
              <span className="property-price">¥{property.price}/月</span>
              <span className="text-gray text-sm">{property.rooms}室</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const FavoritesList = ({ favorites, loading, navigate }) => {
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="card text-center" style={{ padding: '3rem' }}>
        <p className="text-gray">暂无收藏</p>
      </div>
    );
  }

  return (
    <div className="grid grid-3">
      {favorites.map((property) => (
        <div
          key={property.id}
          className="card property-card"
          onClick={() => navigate(`/property/${property.id}`)}
          style={{ cursor: 'pointer' }}
        >
          <div className="property-image"></div>
          <div className="card-body">
            <h3 className="font-bold mb-2">{property.title}</h3>
            <p className="text-gray text-sm mb-2">{property.address}</p>
            <div className="flex-between">
              <span className="property-price">¥{property.price}/月</span>
              <span className="text-gray text-sm">{property.rooms}室</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ContractsList = ({ contracts, loading, navigate }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">已生效</span>;
      case 'pending':
        return <span className="badge badge-warning">待签署</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="card text-center" style={{ padding: '3rem' }}>
        <p className="text-gray">暂无合约</p>
      </div>
    );
  }

  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>房源</th>
            <th>我的角色</th>
            <th>租金</th>
            <th>租期</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((contract) => (
            <tr key={contract.id}>
              <td>{contract.property_title}</td>
              <td>{contract.user_role === 'landlord' ? '房东' : '租客'}</td>
              <td>¥{contract.monthly_rent}/月</td>
              <td>{contract.start_date} ~ {contract.end_date}</td>
              <td>{getStatusBadge(contract.status)}</td>
              <td>
                <button
                  className="btn btn-primary"
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                  onClick={() => navigate(`/contract/${contract.id}`)}
                >
                  查看
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Profile;
