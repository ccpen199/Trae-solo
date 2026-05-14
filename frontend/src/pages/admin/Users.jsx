import React, { useEffect, useState } from 'react'
import { adminApi } from '../../api'

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const res = await adminApi.getUsers()
      if (res.success) {
        setUsers(res.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleVip = async (user) => {
    try {
      await adminApi.updateUser(user.id, { is_vip: user.is_vip ? 0 : 1 })
      loadUsers()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>👥 用户管理</h1>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>ID</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>昵称</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>手机号</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>邮箱</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>积分</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>VIP</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>注册时间</th>
              <th style={{ textAlign: 'right', padding: 16, fontSize: 13, color: '#666' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: 16 }}>{user.id}</td>
                <td style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{user.avatar || '👤'}</span>
                    <span>{user.nickname}</span>
                  </div>
                </td>
                <td style={{ padding: 16 }}>{user.phone || '-'}</td>
                <td style={{ padding: 16 }}>{user.email || '-'}</td>
                <td style={{ padding: 16 }}>{user.points}</td>
                <td style={{ padding: 16 }}>
                  <span style={{
                    padding: '2px 8px',
                    background: user.is_vip ? '#fffbe6' : '#f5f5f5',
                    color: user.is_vip ? '#faad14' : '#999',
                    borderRadius: 4,
                    fontSize: 12
                  }}>
                    {user.is_vip ? '是' : '否'}
                  </span>
                </td>
                <td style={{ padding: 16, color: '#999', fontSize: 13 }}>{user.created_at}</td>
                <td style={{ padding: 16, textAlign: 'right' }}>
                  <button
                    className={`btn ${user.is_vip ? 'btn-outline' : 'btn-primary'}`}
                    style={{ fontSize: 12 }}
                    onClick={() => handleToggleVip(user)}
                  >
                    {user.is_vip ? '取消VIP' : '设为VIP'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无用户</div>
        )}
      </div>
    </div>
  )
}

export default Users
