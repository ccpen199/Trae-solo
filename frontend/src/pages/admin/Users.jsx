import React, { useState, useEffect } from 'react'
import api from '../../api'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState('')

  useEffect(() => {
    loadUsers()
  }, [filter])

  const loadUsers = () => {
    const params = {}
    if (filter) params.role = filter
    api.get('/admin/users', { params }).then(res => setUsers(res.data))
  }

  const handleVerify = async (id) => {
    try {
      await api.put(`/admin/users/${id}/verify`)
      loadUsers()
    } catch (err) {
      alert('操作失败')
    }
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', margin: 0 }}>用户管理</h1>
        <select
          className="form-input"
          style={{ width: '200px' }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">全部用户</option>
          <option value="client">需求方</option>
          <option value="provider">服务者</option>
          <option value="admin">管理员</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>认证状态</th>
              <th>评分</th>
              <th>信用分</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: user.role === 'admin' ? '#fef3c7' : user.role === 'provider' ? '#dbeafe' : '#dcfce7',
                    color: user.role === 'admin' ? '#d97706' : user.role === 'provider' ? '#1d4ed8' : '#15803d'
                  }}>
                    {user.role === 'admin' ? '管理员' : user.role === 'provider' ? '服务者' : '需求方'}
                  </span>
                </td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: user.is_verified ? '#dcfce7' : '#fef3c7',
                    color: user.is_verified ? '#15803d' : '#d97706'
                  }}>
                    {user.is_verified ? '已认证' : '未认证'}
                  </span>
                </td>
                <td>{user.rating?.toFixed(1) || '5.0'}</td>
                <td>{user.credit_score || 100}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  {!user.is_verified && user.role !== 'admin' && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '4px 12px', fontSize: '12px' }}
                      onClick={() => handleVerify(user.id)}
                    >
                      认证
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
