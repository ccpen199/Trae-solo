import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Users, ShoppingCart, FileText, Settings, Database, RefreshCw } from 'lucide-react'
import api from '../utils/api'
import { showToast } from '../utils/toast'

function Admin() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchStats()
  }, [])
  
  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/dashboard')
      setStats(response.stats)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const seedData = async () => {
    try {
      await api.post('/admin/seed-data')
      showToast('数据初始化成功')
      fetchStats()
    } catch (error) {
      showToast(error.response?.data?.error || '操作失败')
    }
  }
  
  const menuItems = [
    { icon: Package, label: '订单管理', onClick: () => showToast('功能开发中') },
    { icon: Users, label: '用户管理', onClick: () => showToast('功能开发中') },
    { icon: ShoppingCart, label: '商品管理', onClick: () => showToast('功能开发中') },
    { icon: FileText, label: '内容管理', onClick: () => showToast('功能开发中') },
    { icon: Database, label: '初始化数据', onClick: seedData },
    { icon: Settings, label: '系统设置', onClick: () => showToast('功能开发中') }
  ]
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div className="header">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </div>
        <div className="header-title">管理后台</div>
        <div className="back-btn" onClick={fetchStats}>
          <RefreshCw size={20} />
        </div>
      </div>
      
      <div className="admin-dashboard">
        {!loading && stats && (
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-value">{stats.total_users}</div>
              <div className="admin-stat-label">总用户数</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value">{stats.total_orders}</div>
              <div className="admin-stat-label">总订单数</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value">{stats.total_products}</div>
              <div className="admin-stat-label">商品总数</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value">{stats.total_posts}</div>
              <div className="admin-stat-label">帖子总数</div>
            </div>
            <div className="admin-stat-card" style={{ gridColumn: 'span 2' }}>
              <div className="admin-stat-value">{stats.today_orders}</div>
              <div className="admin-stat-label">今日订单</div>
            </div>
            <div className="admin-stat-card" style={{ gridColumn: 'span 2' }}>
              <div className="admin-stat-value">¥{stats.today_revenue?.toFixed(2)}</div>
              <div className="admin-stat-label">今日营收</div>
            </div>
          </div>
        )}
        
        <div className="admin-menu-grid" style={{ marginTop: 20 }}>
          {menuItems.map((item, idx) => (
            <div
              key={idx}
              className="admin-menu-item"
              onClick={item.onClick}
            >
              <item.icon size={28} color="#ff4d4f" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Admin
