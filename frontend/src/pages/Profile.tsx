import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '@/services/api';
import { User, UserAddress } from '@/types';
import { useAuthStore } from '@/stores/authStore';

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [addressForm, setAddressForm] = useState({
    recipient: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail_address: '',
    is_default: false
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const navigate = useNavigate();
  const { isAuthenticated, user: authUser, updateProfile: updateAuthProfile } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [isAuthenticated]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [profileResponse, addressesResponse] = await Promise.all([
        userApi.getProfile(),
        userApi.getAddresses()
      ]);
      
      if (profileResponse.data.success && profileResponse.data.data) {
        setUser(profileResponse.data.data);
      }
      if (addressesResponse.data.success && addressesResponse.data.data) {
        setAddresses(addressesResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setUpdatingProfile(true);
    try {
      const response = await userApi.updateProfile({
        username: user.username,
        phone: user.phone || ''
      });
      if (response.data.success && response.data.data) {
        updateAuthProfile(response.data.data);
        alert('资料更新成功');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || '更新失败');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await userApi.updateAddress(editingAddress.id, addressForm);
      } else {
        await userApi.addAddress(addressForm);
      }
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm({
        recipient: '',
        phone: '',
        province: '',
        city: '',
        district: '',
        detail_address: '',
        is_default: false
      });
      fetchProfile();
    } catch (error: any) {
      alert(error.response?.data?.message || '保存失败');
    }
  };

  const handleEditAddress = (address: UserAddress) => {
    setEditingAddress(address);
    setAddressForm({
      recipient: address.recipient,
      phone: address.phone,
      province: address.province || '',
      city: address.city || '',
      district: address.district || '',
      detail_address: address.detail_address,
      is_default: address.is_default
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm('确定要删除这个地址吗？')) return;
    try {
      await userApi.deleteAddress(addressId);
      fetchProfile();
    } catch (error: any) {
      alert(error.response?.data?.message || '删除失败');
    }
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      await userApi.setDefaultAddress(addressId);
      fetchProfile();
    } catch (error: any) {
      alert(error.response?.data?.message || '设置失败');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <p className="empty-state-text">请先登录</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/login')}
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 className="section-title">个人中心</h1>

      <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div className="card card-body">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              个人信息
            </h2>
            
            <div className="form-group">
              <label className="form-label">用户名</label>
              <input
                type="text"
                className="form-input"
                value={user.username}
                onChange={(e) => setUser({ ...user, username: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">邮箱</label>
              <input
                type="email"
                className="form-input"
                value={user.email}
                disabled
                style={{ background: '#f1f5f9' }}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">手机号</label>
              <input
                type="tel"
                className="form-input"
                value={user.phone || ''}
                onChange={(e) => setUser({ ...user, phone: e.target.value })}
                placeholder="请输入手机号"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">注册时间</label>
              <input
                type="text"
                className="form-input"
                value={new Date(user.created_at).toLocaleDateString('zh-CN')}
                disabled
                style={{ background: '#f1f5f9' }}
              />
            </div>

            <button 
              className="btn btn-primary w-full"
              onClick={handleUpdateProfile}
              disabled={updatingProfile}
            >
              {updatingProfile ? '更新中...' : '保存修改'}
            </button>
          </div>
        </div>

        <div style={{ flex: 2, minWidth: '300px' }}>
          <div className="card card-body">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
                收货地址 ({addresses.length})
              </h2>
              {!showAddressForm && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setShowAddressForm(true);
                    setEditingAddress(null);
                    setAddressForm({
                      recipient: '',
                      phone: '',
                      province: '',
                      city: '',
                      district: '',
                      detail_address: '',
                      is_default: false
                    });
                  }}
                >
                  + 添加地址
                </button>
              )}
            </div>

            {showAddressForm && (
              <form onSubmit={handleSaveAddress} style={{ 
                background: '#f8fafc', 
                padding: '1.5rem', 
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
                  {editingAddress ? '编辑地址' : '添加新地址'}
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">收货人 *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={addressForm.recipient}
                      onChange={(e) => setAddressForm({ ...addressForm, recipient: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">手机号 *</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">省</label>
                  <input
                    type="text"
                    className="form-input"
                    value={addressForm.province}
                    onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">市</label>
                    <input
                      type="text"
                      className="form-input"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">区</label>
                    <input
                      type="text"
                      className="form-input"
                      value={addressForm.district}
                      onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">详细地址 *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={addressForm.detail_address}
                    onChange={(e) => setAddressForm({ ...addressForm, detail_address: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={addressForm.is_default}
                      onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                    />
                    设为默认地址
                  </label>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary">
                    保存
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddress(null);
                    }}
                  >
                    取消
                  </button>
                </div>
              </form>
            )}

            {addresses.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 0' }}>
                <div className="empty-state-icon">📍</div>
                <p className="empty-state-text">暂无收货地址</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {addresses.map((addr) => (
                  <div 
                    key={addr.id}
                    style={{ 
                      padding: '1rem', 
                      border: addr.is_default ? '2px solid var(--primary-color)' : '2px solid var(--border-color)',
                      borderRadius: '8px',
                      background: addr.is_default ? '#f0f9ff' : 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div>
                        <strong>{addr.recipient}</strong>
                        <span style={{ marginLeft: '1rem', color: '#64748b' }}>{addr.phone}</span>
                        {addr.is_default && (
                          <span style={{ 
                            background: 'var(--primary-color)', 
                            color: 'white', 
                            padding: '0.125rem 0.5rem', 
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            marginLeft: '0.5rem'
                          }}>
                            默认
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleEditAddress(addr)}
                        >
                          编辑
                        </button>
                        {!addr.is_default && (
                          <>
                            <button 
                              className="btn btn-outline btn-sm"
                              style={{ color: 'var(--primary-color)' }}
                              onClick={() => handleSetDefault(addr.id)}
                            >
                              设为默认
                            </button>
                            <button 
                              className="btn btn-outline btn-sm"
                              style={{ color: 'var(--danger-color)' }}
                              onClick={() => handleDeleteAddress(addr.id)}
                            >
                              删除
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <p style={{ color: '#475569' }}>
                      {addr.province && `${addr.province} `}
                      {addr.city && `${addr.city} `}
                      {addr.district && `${addr.district} `}
                      {addr.detail_address}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
