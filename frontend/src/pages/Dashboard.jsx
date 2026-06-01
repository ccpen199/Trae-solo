import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Dashboard() {
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setError(null)
      const res = await axios.get('/api/stats', { timeout: 5000 })
      setStats(res.data || {})
    } catch (err) {
      console.error('Failed to load stats:', err)
      setError('无法加载统计数据，请检查后端服务是否正常')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{padding: 40, fontSize: 16}}>📊 加载中...</div>

  return (
    <div>
      <div className="header">
        <h1>📊 数据概览</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>酒店数量</h3>
          <div className="value">{stats.hotels || 0}</div>
        </div>
        <div className="stat-card">
          <h3>房型数量</h3>
          <div className="value">{stats.rooms || 0}</div>
        </div>
        <div className="stat-card">
          <h3>采集记录</h3>
          <div className="value">{stats.collections || 0}</div>
        </div>
        <div className="stat-card">
          <h3>比价结果</h3>
          <div className="value">{stats.comparisons || 0}</div>
        </div>
        <div className="stat-card">
          <h3>待确认映射</h3>
          <div className="value" style={{ color: '#ffc107' }}>{stats.pending_mappings || 0}</div>
        </div>
        <div className="stat-card">
          <h3>采集失败</h3>
          <div className="value" style={{ color: '#dc3545' }}>{stats.failed_collections || 0}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>系统说明</h2>
        </div>
        <div className="card-body">
          <p>欢迎使用酒店价格比价系统，请按照以下流程操作：</p>
          <ol style={{ marginTop: '12px', paddingLeft: '20px', lineHeight: '2' }}>
            <li>在「酒店房型」中维护酒店和房型基础信息</li>
            <li>在「映射管理」中配置渠道与内部酒店/房型的对应关系</li>
            <li>在「价格采集」中录入各渠道价格数据或查看采集记录</li>
            <li>在「比价分析」中运行比价并查看价差、价格倒挂等异常</li>
            <li>在「价格策略」中配置告警阈值和生成调价任务</li>
            <li>在「报表中心」中导出报表或生成测试数据验证功能</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
