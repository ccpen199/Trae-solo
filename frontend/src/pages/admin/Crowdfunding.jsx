import React, { useEffect, useState } from 'react'
import { crowdfundingApi } from '../../api'

const Crowdfunding = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const res = await crowdfundingApi.getList()
      if (res.success) {
        setProjects(res.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (project) => {
    const newStatus = project.status === 'active' ? 'ended' : 'active'
    try {
      await crowdfundingApi.update(project.id, { status: newStatus })
      loadProjects()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>🎯 众筹管理</h1>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>项目</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>目标金额</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>已筹金额</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>进度</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>状态</th>
              <th style={{ textAlign: 'right', padding: 16, fontSize: 13, color: '#666' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: 16 }}>
                  <div style={{ fontWeight: 500 }}>{project.title}</div>
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4, maxWidth: 300 }}>{project.description}</div>
                </td>
                <td style={{ padding: 16 }}>¥{project.target_amount.toLocaleString()}</td>
                <td style={{ padding: 16, fontWeight: 500, color: '#ff4d4f' }}>¥{project.raised_amount.toLocaleString()}</td>
                <td style={{ padding: 16, width: 200 }}>
                  <div style={{ height: 8, background: '#f5f5f5', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{ height: '100%', background: '#ff4d4f', width: `${Math.min(100, project.progress)}%` }}></div>
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>{Math.round(project.progress)}%</div>
                </td>
                <td style={{ padding: 16 }}>
                  <span style={{
                    padding: '2px 8px',
                    background: project.status === 'active' ? '#e6f7ff' : '#f5f5f5',
                    color: project.status === 'active' ? '#1890ff' : '#999',
                    borderRadius: 4,
                    fontSize: 12
                  }}>
                    {project.status === 'active' ? '进行中' : '已结束'}
                  </span>
                </td>
                <td style={{ padding: 16, textAlign: 'right' }}>
                  <button
                    className={`btn ${project.status === 'active' ? 'btn-outline' : 'btn-primary'}`}
                    style={{ fontSize: 12 }}
                    onClick={() => handleToggleStatus(project)}
                  >
                    {project.status === 'active' ? '结束' : '开启'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无众筹项目</div>
        )}
      </div>
    </div>
  )
}

export default Crowdfunding
