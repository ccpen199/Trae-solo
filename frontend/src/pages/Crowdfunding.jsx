import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { crowdfundingApi } from '../api'

const Crowdfunding = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const res = await crowdfundingApi.getList({ status: 'active' })
      if (res.success) {
        setProjects(res.data)
      }
    } catch (e) {
      console.error('加载众筹项目失败', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading" style={{ padding: '100px' }}>加载中...</div>
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>🎯 众筹专区</h1>
      
      {projects.length === 0 ? (
        <div className="empty">暂无众筹项目</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {projects.map(project => (
            <Link
              key={project.id}
              to={`/crowdfunding/${project.id}`}
              className="card"
              style={{ overflow: 'hidden', cursor: 'pointer' }}
            >
              <div style={{ height: 180, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
                🎯
              </div>
              <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{project.title}</h3>
                <p style={{ color: '#666', fontSize: 13, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {project.description}
                </p>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ height: 8, background: '#f5f5f5', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ height: '100%', background: '#ff4d4f', width: `${Math.min(100, project.progress)}%` }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>已筹：¥{project.raised_amount.toLocaleString()}</span>
                    <span style={{ color: '#ff4d4f' }}>{Math.round(project.progress)}%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999' }}>
                  <span>目标：¥{project.target_amount.toLocaleString()}</span>
                  <span>{project.status === 'active' ? '进行中' : project.status}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Crowdfunding
