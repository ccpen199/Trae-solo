import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ phone: '', name: '', plate_number: '', member_level: 'normal' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      setUsers(res.data.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.createUser(newUser);
      setShowForm(false);
      setNewUser({ phone: '', name: '', plate_number: '', member_level: 'normal' });
      loadUsers();
    } catch (err) {
      alert('创建失败：' + err.message);
    }
  };

  const getMemberLevelName = (level) => {
    const names = { normal: '普通', silver: '白银', gold: '黄金', platinum: '铂金' };
    return names[level] || level;
  };

  const getMemberLevelColor = (level) => {
    const colors = { normal: '#666', silver: '#c0c0c0', gold: '#faad14', platinum: '#722ed1' };
    return colors[level] || '#666';
  };

  return (
    <div>
      <div className="page-header">
        <h1>用户管理</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '添加用户'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-title">添加新用户</div>
          <div className="form-row">
            <div className="form-group">
              <label>手机号</label>
              <input type="text" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>姓名</label>
              <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>车牌号</label>
              <input type="text" value={newUser.plate_number} onChange={(e) => setNewUser({ ...newUser, plate_number: e.target.value })} />
            </div>
            <div className="form-group">
              <label>会员等级</label>
              <select value={newUser.member_level} onChange={(e) => setNewUser({ ...newUser, member_level: e.target.value })}>
                <option value="normal">普通</option>
                <option value="silver">白银</option>
                <option value="gold">黄金</option>
                <option value="platinum">铂金</option>
              </select>
            </div>
          </div>
          <button className="btn btn-success" onClick={handleCreate}>确认添加</button>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>姓名</th>
                  <th>手机号</th>
                  <th>车牌号</th>
                  <th>会员等级</th>
                  <th>余额</th>
                  <th>注册时间</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name || '-'}</td>
                    <td>{u.phone}</td>
                    <td>{u.plate_number || '-'}</td>
                    <td><span style={{ color: getMemberLevelColor(u.member_level) }}>
                      {getMemberLevelName(u.member_level)}
                    </span></td>
                    <td>¥{u.balance.toFixed(2)}</td>
                    <td>{u.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Users;