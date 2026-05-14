import { useState, useEffect } from 'react'
import { adminAPI, userAPI, topicAPI } from '../api/endpoints'
import { useAuth } from '../store/auth'
import { Card, Button, LoadingSpinner, AsyncStatus, Tag } from '../components/Common'
import { showToast } from '../api'
import dayjs from 'dayjs'

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [contentFilter, setContentFilter] = useState('all')
  const { user } = useAuth()

  const loadDashboard = async () => {
    try {
      const res = await adminAPI.getStats()
      if (res.data?.success) setStats(res.data.data)
    } catch (err) {}
  }

  const loadUsers = async () => {
    try {
      const res = await adminAPI.getUsers({ limit: 50 })
      if (res.data?.success) setUsers(res.data.data.list || [])
    } catch (err) {}
  }

  const loadContent = async () => {
    try {
      const res = await adminAPI.getContent({ type: contentFilter, limit: 50 })
      if (res.data?.success) setContent(res.data.data.list || [])
    } catch (err) {}
  }

  useEffect(() => {
    setLoading(true)
    const load = async () => {
      if (activeTab === 'dashboard') await loadDashboard()
      else if (activeTab === 'users') await loadUsers()
      else if (activeTab === 'content') await loadContent()
      setLoading(false)
    }
    load()
  }, [activeTab, contentFilter])

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, { role: newRole })
      showToast('角色更新成功', 'success')
      loadUsers()
    } catch (err) {}
  }

  const handleToggleStatus = async (userId) => {
    try {
      await adminAPI.toggleUserStatus(userId)
      showToast('状态更新成功', 'success')
      loadUsers()
    } catch (err) {}
  }

  const handleDeleteContent = async (type, id) => {
    if (!window.confirm('确定要删除吗？')) return
    try {
      await adminAPI.deleteContent(type, id)
      showToast('删除成功', 'success')
      loadContent()
    } catch (err) {}
  }

  const tabs = [
    { key: 'dashboard', label: '数据概览', roles: ['admin', 'moderator', 'editor'] },
    { key: 'users', label: '用户管理', roles: ['admin'] },
    { key: 'content', label: '内容管理', roles: ['admin', 'moderator', 'editor'] }
  ].filter(t => t.roles.includes(user?.role))

  const statCards = stats ? [
    { label: '用户总数', value: stats.user_count, color: '#3b82f6' },
    { label: '问题总数', value: stats.question_count, color: '#10b981' },
    { label: '文章总数', value: stats.article_count, color: '#8b5cf6' },
    { label: '回答总数', value: stats.answer_count, color: '#f59e0b' },
    { label: '评论总数', value: stats.comment_count, color: '#ef4444' }
  ] : []

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: activeTab === tab.key ? '#3b82f6' : '#fff',
              color: activeTab === tab.key ? '#fff' : '#4b5563',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <AsyncStatus loading={loading} empty={!stats} onRetry={loadDashboard}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {statCards.map((stat, i) => (
              <Card key={i} style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>{stat.label}</p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: stat.color }}>{stat.value}</p>
              </Card>
            ))}
          </div>
        </AsyncStatus>
      )}

      {activeTab === 'users' && (
        <AsyncStatus loading={loading} empty={users.length === 0} onRetry={loadUsers}>
          <Card style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>用户</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>邮箱</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>角色</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>状态</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>注册时间</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '500' }}>{u.nickname || u.username}</span>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>@{u.username}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        style={{ padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '13px' }}
                      >
                        <option value="user">普通用户</option>
                        <option value="editor">编辑</option>
                        <option value="moderator">审核</option>
                        <option value="admin">管理员</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Tag color={u.status === 'active' ? '#22c55e' : '#ef4444'}>
                        {u.status === 'active' ? '正常' : '禁用'}
                      </Tag>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                      {dayjs(u.created_at).format('YYYY-MM-DD')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {u.username !== 'admin' && (
                        <Button
                          size="small"
                          variant={u.status === 'active' ? 'danger' : 'primary'}
                          onClick={() => handleToggleStatus(u.id)}
                        >
                          {u.status === 'active' ? '禁用' : '启用'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </AsyncStatus>
      )}

      {activeTab === 'content' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: '全部' },
              { key: 'questions', label: '问题' },
              { key: 'articles', label: '文章' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setContentFilter(tab.key)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: contentFilter === tab.key ? '#3b82f6' : '#fff',
                  color: contentFilter === tab.key ? '#fff' : '#4b5563',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AsyncStatus loading={loading} empty={content.length === 0} onRetry={loadContent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {content.map(item => (
                <Card key={`${item.content_type}-${item.id}`} style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <Tag color={item.content_type === 'question' ? '#3b82f6' : '#10b981'}>
                          {item.content_type === 'question' ? '问题' : '文章'}
                        </Tag>
                        <Tag color={item.status === 'published' ? '#22c55e' : '#ef4444'}>
                          {item.status === 'published' ? '已发布' : item.status === 'hidden' ? '已隐藏' : '已删除'}
                        </Tag>
                      </div>
                      <h4 style={{ fontWeight: '500', marginBottom: '8px' }}>{item.title}</h4>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#9ca3af', flexWrap: 'wrap' }}>
                        <span>作者: {item.nickname}</span>
                        <span>{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</span>
                        <span>👁 {item.view_count}</span>
                        <span>❤️ {item.like_count}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      {item.status === 'published' && (
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => handleDeleteContent(item.content_type, item.id)}
                        >
                          删除
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </AsyncStatus>
        </div>
      )}
    </div>
  )
}
