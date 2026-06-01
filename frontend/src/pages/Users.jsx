import { useState, useEffect } from 'react';
import { userAPI } from '../api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'student'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userAPI.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('加载用户失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await userAPI.createUser(formData);
      setShowModal(false);
      setFormData({ username: '', password: '', name: '', role: 'student' });
      loadUsers();
      alert('用户创建成功！');
    } catch (error) {
      alert('创建失败：' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (userId) => {
    if (confirm('确定要删除此用户吗？')) {
      try {
        await userAPI.deleteUser(userId);
        loadUsers();
        alert('删除成功！');
      } catch (error) {
        alert('删除失败');
      }
    }
  };

  const roleLabels = {
    admin: '管理员',
    invigilator: '监考老师',
    student: '考生'
  };

  const roleColors = {
    admin: '#667eea',
    invigilator: '#10b981',
    student: '#6b7280'
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>用户管理</h1>
        <button onClick={() => setShowModal(true)} style={styles.addButton}>
          + 添加用户
        </button>
      </div>

      <div style={styles.userGrid}>
        {users.map(user => (
          <div key={user.id} style={styles.userCard}>
            <div style={styles.userAvatar}>
              {user.name.charAt(0)}
            </div>
            <h3 style={styles.userName}>{user.name}</h3>
            <p style={styles.userUsername}>@{user.username}</p>
            <span style={{
              ...styles.roleBadge,
              background: roleColors[user.role]
            }}>
              {roleLabels[user.role]}
            </span>
            <p style={styles.userTime}>
              创建于: {new Date(user.created_at).toLocaleString()}
            </p>
            {user.username !== 'admin' && (
              <button
                onClick={() => handleDelete(user.id)}
                style={styles.deleteBtn}
              >
                删除
              </button>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>添加用户</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label>用户名</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label>密码</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label>姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label>角色</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  style={styles.input}
                >
                  <option value="student">考生</option>
                  <option value="invigilator">监考老师</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={styles.cancelBtn}
                >
                  取消
                </button>
                <button type="submit" style={styles.submitBtn}>
                  创建
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
    marginBottom: '30px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333'
  },
  addButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px'
  },
  userGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  userCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
  },
  userAvatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 auto 16px'
  },
  userName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px'
  },
  userUsername: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '12px'
  },
  roleBadge: {
    padding: '6px 16px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block',
    marginBottom: '12px'
  },
  userTime: {
    fontSize: '12px',
    color: '#aaa',
    marginBottom: '16px'
  },
  deleteBtn: {
    padding: '8px 16px',
    background: '#fee',
    color: '#dc2626',
    border: 'none',
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
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    background: 'white',
    padding: '30px',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '450px'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '24px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  input: {
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '10px'
  },
  cancelBtn: {
    padding: '10px 20px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  submitBtn: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  }
};

export default Users;
