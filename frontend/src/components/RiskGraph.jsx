import { useState, useEffect, useRef } from 'react'

function RiskGraph({ applicationId }) {
  const [graphData, setGraphData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGraphData()
  }, [applicationId])

  const fetchGraphData = async () => {
    try {
      const response = await fetch(`/api/graph/application/${applicationId}`)
      const data = await response.json()
      setGraphData(data)
    } catch (error) {
      console.error('Failed to fetch graph data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !graphData) {
    return <div className="card">加载中...</div>
  }

  const { nodes, edges } = graphData

  const nodePositions = calculatePositions(nodes, edges)

  return (
    <div className="card">
      <div className="card-header">
        <h2>关联风险图谱</h2>
        <div style={{ display: 'flex', gap: '20px', fontSize: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', background: '#1890ff', borderRadius: '50%' }}></span>
            申请
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', background: '#52c41a', borderRadius: '50%' }}></span>
            设备
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', background: '#faad14', borderRadius: '50%' }}></span>
            联系人
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', background: '#ff4d4f', borderRadius: '50%' }}></span>
            黑名单
          </span>
        </div>
      </div>

      <div className="graph-container">
        <svg viewBox="0 0 800 500" className="graph-svg" preserveAspectRatio="xMidYMid meet">
          {edges.map((edge, index) => (
            <line
              key={index}
              x1={nodePositions[edge.source]?.x || 400}
              y1={nodePositions[edge.source]?.y || 250}
              x2={nodePositions[edge.target]?.x || 400}
              y2={nodePositions[edge.target]?.y || 250}
              stroke={edge.style === 'danger' ? '#ff4d4f' : '#999'}
              strokeWidth={edge.style === 'danger' ? 2 : 1.5}
              strokeDasharray={edge.style === 'danger' ? '5,5' : 'none'}
            />
          ))}

          {nodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={nodePositions[node.id]?.x || 400}
                cy={nodePositions[node.id]?.y || 250}
                r={node.type === 'application' ? 25 : 20}
                fill={
                  node.type === 'application' ? '#1890ff' :
                  node.type === 'device' ? '#52c41a' :
                  node.type === 'contact' ? '#faad14' : '#ff4d4f'
                }
                stroke={node.type === 'blacklist' ? '#ff4d4f' : 'white'}
                strokeWidth={2}
              />
              <text
                x={nodePositions[node.id]?.x || 400}
                y={(nodePositions[node.id]?.y || 250) + 5}
                textAnchor="middle"
                fill="white"
                fontSize="10"
                fontWeight="bold"
              >
                {node.type === 'application' ? '申请' :
                 node.type === 'device' ? '设备' :
                 node.type === 'contact' ? '联系人' : '黑'}
              </text>
              <text
                x={nodePositions[node.id]?.x || 400}
                y={(nodePositions[node.id]?.y || 250) + 40}
                textAnchor="middle"
                fill="#333"
                fontSize="10"
              >
                {node.label && node.label.length > 8 ? node.label.substring(0, 8) + '...' : (node.label || node.id)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>节点说明</h3>
        <table className="table" style={{ fontSize: '12px' }}>
          <thead>
            <tr>
              <th>节点ID</th>
              <th>类型</th>
              <th>标签/值</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <tr key={node.id}>
                <td style={{ fontFamily: 'monospace' }}>{node.id}</td>
                <td>
                  <span className={`status-badge ${
                    node.type === 'application' ? 'status-review' :
                    node.type === 'device' ? 'status-approved' :
                    node.type === 'contact' ? 'status-pending' : 'status-rejected'
                  }`}>
                    {node.type === 'application' ? '申请' :
                     node.type === 'device' ? '设备' :
                     node.type === 'contact' ? '联系人' : '黑名单'}
                  </span>
                </td>
                <td>{node.label}</td>
                <td>
                  {node.status && `状态: ${node.status}`}
                  {node.score && ` | 评分: ${node.score}`}
                  {node.confirmed !== undefined && ` | ${node.confirmed ? '已确认' : '待确认'}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function calculatePositions(nodes, edges) {
  const positions = {}
  const centerX = 400
  const centerY = 250

  const mainApp = nodes.find(n => n.type === 'application')
  if (mainApp) {
    positions[mainApp.id] = { x: centerX, y: centerY }
  }

  const otherApplications = nodes.filter(n => n.type === 'application' && n.id !== mainApp?.id)
  const devices = nodes.filter(n => n.type === 'device')
  const contacts = nodes.filter(n => n.type === 'contact')
  const blacklists = nodes.filter(n => n.type === 'blacklist')

  let angle = 0
  const radius = 150
  const smallRadius = 120

  otherApplications.forEach((node, i) => {
    const a = (i / otherApplications.length) * Math.PI - Math.PI / 2
    positions[node.id] = {
      x: centerX + Math.cos(a) * radius,
      y: centerY + Math.sin(a) * radius - 50
    }
  })

  devices.forEach((node, i) => {
    const a = (i / devices.length) * Math.PI * 0.5 + Math.PI * 0.25
    positions[node.id] = {
      x: centerX + Math.cos(a) * smallRadius,
      y: centerY - Math.sin(a) * smallRadius - 80
    }
  })

  contacts.forEach((node, i) => {
    const a = (i / contacts.length) * Math.PI * 0.5 + Math.PI
    positions[node.id] = {
      x: centerX + Math.cos(a) * smallRadius,
      y: centerY + Math.sin(a) * smallRadius + 50
    }
  })

  blacklists.forEach((node, i) => {
    const a = (i / blacklists.length) * Math.PI * 0.5 + Math.PI * 1.75
    positions[node.id] = {
      x: centerX + Math.cos(a) * radius,
      y: centerY + Math.sin(a) * radius
    }
  })

  nodes.forEach(node => {
    if (!positions[node.id]) {
      positions[node.id] = {
        x: centerX + Math.random() * 100 - 50,
        y: centerY + Math.random() * 100 - 50
      }
    }
  })

  return positions
}

export default RiskGraph
