import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../utils/api';
import { validateUpdateProfile, GENDER_VALUES, genderLabels } from '../utils/validation';
import Layout from '../components/Layout';

const EditProfile = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    age: '',
    gender: ''
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    
    if (user) {
      fetchUserDetails();
    }
  }, [user, authLoading, navigate]);

  const fetchUserDetails = async () => {
    try {
      const response = await userApi.getById(user.id);
      const userData = response.data;
      setFormData(prev => ({
        ...prev,
        age: userData.age ?? '',
        gender: userData.gender ?? ''
      }));
    } catch (error) {
      console.error('获取用户详情失败:', error);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    setGeneralError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMessage('');

    const isPasswordUpdate = formData.password && formData.password !== '';
    const validation = validateUpdateProfile(formData, isPasswordUpdate);
    
    if (!validation.isValid) {
      setErrors(validation.fieldErrors || {});
      if (validation.errors.length > 0) {
        setGeneralError(validation.errors[0]);
      }
      return;
    }

    setLoading(true);

    try {
      const updateData = {};
      if (formData.password && formData.password !== '') {
        updateData.password = formData.password;
        updateData.confirmPassword = formData.confirmPassword;
      }
      if (formData.age !== undefined && formData.age !== '') {
        updateData.age = formData.age;
      }
      if (formData.gender !== undefined && formData.gender !== '') {
        updateData.gender = formData.gender;
      }

      await userApi.update(user.id, updateData);
      setSuccessMessage('资料更新成功！');
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setGeneralError(error.message || '更新失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || fetchLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="page-content">
        <div className="container">
          <div className="page-title">
            <h2>修改资料</h2>
            <p>更新您的个人信息和密码</p>
          </div>

          <div className="card" style={{ maxWidth: '600px' }}>
            {generalError && (
              <div className="alert alert-error">{generalError}</div>
            )}

            {successMessage && (
              <div className="alert alert-success">{successMessage}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>用户名</label>
                <input
                  type="text"
                  value={user?.username || ''}
                  className="form-control"
                  disabled
                  style={{ background: '#f5f5f5' }}
                />
                <div className="form-hint">用户名不可修改</div>
              </div>

              <div className="form-group">
                <label>新密码</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`form-control ${errors.password ? 'error' : ''}`}
                  placeholder="留空则不修改密码"
                  disabled={loading}
                />
                <div className="form-hint">如需修改密码请输入新密码（至少6位）</div>
                {errors.password && (
                  <div className="form-error">{errors.password}</div>
                )}
              </div>

              <div className="form-group">
                <label>确认新密码</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="请再次输入新密码"
                  disabled={loading}
                />
                {errors.confirmPassword && (
                  <div className="form-error">{errors.confirmPassword}</div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>年龄</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className={`form-control ${errors.age ? 'error' : ''}`}
                    placeholder="请输入年龄"
                    disabled={loading}
                  />
                  <div className="form-hint">年龄范围1-150</div>
                  {errors.age && (
                    <div className="form-error">{errors.age}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>性别</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`form-control ${errors.gender ? 'error' : ''}`}
                    disabled={loading}
                  >
                    <option value="">请选择</option>
                    {GENDER_VALUES.map(g => (
                      <option key={g} value={g}>{genderLabels[g]}</option>
                    ))}
                  </select>
                  {errors.gender && (
                    <div className="form-error">{errors.gender}</div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? '保存中...' : '保存修改'}
                </button>
                <Link to="/user" className="btn btn-default">
                  返回
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditProfile;
