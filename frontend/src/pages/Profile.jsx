import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import useUserStore from '../store/userStore';
import { authAPI } from '../utils/api';

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
    paddingBottom: '12px',
    borderBottom: '1px solid #f0f0f0'
  },
  profileHeader: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
    marginBottom: '20px'
  },
  avatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '36px',
    fontWeight: 'bold',
    flexShrink: 0
  },
  userInfo: {
    flex: 1
  },
  username: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px'
  },
  role: {
    display: 'inline-block',
    padding: '4px 12px',
    background: '#e6f7ff',
    color: '#1890ff',
    borderRadius: '4px',
    fontSize: '13px',
    marginRight: '8px'
  },
  status: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '13px'
  },
  statusActive: {
    background: '#f6ffed',
    color: '#52c41a'
  },
  statusBanned: {
    background: '#fff0f0',
    color: '#ff4d4f'
  },
  stats: {
    display: 'flex',
    gap: '40px',
    marginTop: '16px'
  },
  statItem: {
    textAlign: 'center'
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea'
  },
  statLabel: {
    fontSize: '13px',
    color: '#999'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#555',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  },
  textarea: {
    width: '100%',
    minHeight: '100px',
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none'
  },
  btnGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end'
  },
  btn: {
    padding: '12px 32px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  },
  btnCancel: {
    background: '#f5f5f5',
    color: '#666'
  },
  btnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed'
  },
  infoRow: {
    display: 'flex',
    marginBottom: '12px',
    fontSize: '14px'
  },
  infoLabel: {
    width: '100px',
    color: '#999',
    flexShrink: 0
  },
  infoValue: {
    color: '#333'
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #f0f0f0',
    marginBottom: '20px'
  },
  tab: {
    padding: '12px 24px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666',
    borderBottom: '2px solid transparent',
    marginBottom: '-1px'
  },
  tabActive: {
    color: '#667eea',
    borderBottomColor: '#667eea'
  },
  error: {
    background: '#fff0f0',
    color: '#d93025',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  success: {
    background: '#f6ffed',
    color: '#52c41a',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px'
  }
};

function Profile() {
  const { user, updateUser } = useUserStore();
  const [activeTab, setActiveTab] = useState('info');
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    nickname: '',
    email: '',
    signature: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      const data = response.data.data;
      setProfile(data);
      setForm({
        nickname: data.nickname || '',
        email: data.email || '',
        signature: data.signature || ''
      });
    } catch (err) {
      console.error('加载用户信息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setSubmitting(true);
    try {
      const response = await authAPI.updateProfile(form);
      updateUser(response.data.data);
      setSuccess('个人信息更新成功');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || '更新失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    setPasswordSubmitting(true);
    try {
      await authAPI.updatePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      setSuccess('密码修改成功');
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || '密码修改失败');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  }

  const getRoleDisplay = () => {
    const roleMap = {
      admin: '管理员',
      moderator: '版主',
      user: '普通用户',
      guest: '游客'
    };
    return roleMap[profile?.role] || profile?.role || '用户';
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.profileHeader}>
          <div style={styles.avatar}>
            {profile?.nickname?.charAt(0)?.toUpperCase() || user?.nickname?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={styles.userInfo}>
            <div style={styles.username}>{profile?.nickname || profile?.username}</div>
            <div>
              <span style={styles.role}>{getRoleDisplay()}</span>
              <span style={{
                ...styles.status,
                ...(profile?.status === 'banned' ? styles.statusBanned : styles.statusActive)
              }}>
                {profile?.status === 'banned' ? '已封禁' : '正常'}
              </span>
            </div>
            <div style={styles.stats}>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>0</div>
                <div style={styles.statLabel}>主题</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statNumber}>0</div>
                <div style={styles.statLabel}>回复</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>用户名：</span>
            <span style={styles.infoValue}>{profile?.username}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>注册时间：</span>
            <span style={styles.infoValue}>{dayjs(profile?.createdAt).format('YYYY-MM-DD HH:mm')}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>最后登录：</span>
            <span style={styles.infoValue}>{profile?.lastLoginAt ? dayjs(profile?.lastLoginAt).format('YYYY-MM-DD HH:mm') : '-'}</span>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.tabs}>
          <div
            style={{
              ...styles.tab,
              ...(activeTab === 'info' ? styles.tabActive : {})
            }}
            onClick={() => {
              setActiveTab('info');
              setError('');
              setSuccess('');
            }}
          >
            编辑资料
          </div>
          <div
            style={{
              ...styles.tab,
              ...(activeTab === 'password' ? styles.tabActive : {})
            }}
            onClick={() => {
              setActiveTab('password');
              setError('');
              setSuccess('');
            }}
          >
            修改密码
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        {activeTab === 'info' && (
          <form onSubmit={handleUpdateProfile}>
            <div style={styles.formGroup}>
              <label style={styles.label}>昵称</label>
              <input
                type="text"
                style={styles.input}
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                placeholder="请输入昵称"
                maxLength={50}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>邮箱</label>
              <input
                type="email"
                style={styles.input}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="请输入邮箱地址"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>个人签名</label>
              <textarea
                style={styles.textarea}
                value={form.signature}
                onChange={(e) => setForm({ ...form, signature: e.target.value })}
                placeholder="请输入个人签名（最多200字符）"
                maxLength={200}
              />
            </div>

            <div style={styles.btnGroup}>
              <button
                type="submit"
                style={{
                  ...styles.btn,
                  ...styles.btnPrimary,
                  ...(submitting ? styles.btnDisabled : {})
                }}
                disabled={submitting}
              >
                {submitting ? '保存中...' : '保存修改'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={handleUpdatePassword}>
            <div style={styles.formGroup}>
              <label style={styles.label}>原密码</label>
              <input
                type="password"
                style={styles.input}
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                placeholder="请输入原密码"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>新密码</label>
              <input
                type="password"
                style={styles.input}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="请输入新密码（至少6个字符）"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>确认新密码</label>
              <input
                type="password"
                style={styles.input}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="请再次输入新密码"
                required
              />
            </div>

            <div style={styles.btnGroup}>
              <button
                type="submit"
                style={{
                  ...styles.btn,
                  ...styles.btnPrimary,
                  ...(passwordSubmitting ? styles.btnDisabled : {})
                }}
                disabled={passwordSubmitting}
              >
                {passwordSubmitting ? '修改中...' : '修改密码'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Profile;
