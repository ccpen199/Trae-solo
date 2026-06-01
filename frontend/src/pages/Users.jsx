import { useState, useEffect } from 'react';
import axios from 'axios';

function Users() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '123456', name: '', role: 'student', phone: '' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const res = await axios.get('/api/users');
    setUsers(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('/api/users', formData);
    setShowModal(false);
    setFormData({ username: '', password: '123456', name: '', role: 'student', phone: '' });
    loadUsers();
  };

  const roleMap = {
    admin: { label: '管理员', class: 'badge-danger' },
    teacher: { label: '班主任', class: 'badge-info' },
    coach: { label: '教练', class: 'badge-primary' },
    student: { label: '学员', class: 'badge-success' }
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <h2 style={{ margin: 0 }}>用户管理</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 添加用户</button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>姓名</th>
              <th>角色</th>
              <th>手机号</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.name}</td>
                <td><span className={`badge ${roleMap[user.role].class}`}>{roleMap[user.role].label}</span></td>
                <td>{user.phone || '-'}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h2>添加用户</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group"><label>用户名</label><input required value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} /></div>
                <div className="form-group"><label>初始密码</label><input required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>姓名</label><input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div className="form-group"><label>角色</label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}><option value="student">学员</option><option value="teacher">班主任</option><option value="coach">教练</option><option value="admin">管理员</option></select></div>
              </div>
              <div className="form-group"><label>手机号</label><input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
              <div className="flex gap-2"><button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>取消</button><button type="submit" className="btn btn-primary" style={{ flex: 1 }}>添加</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
