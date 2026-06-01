import React, { useState, useEffect } from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import axios from 'axios'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    axios.get('/api/reports/dashboard').then(res => {
      setData(res.data)
    })
  }, [])

  if (!data) return <div>加载中...</div>

  const lineData = {
    labels: data.visitByDate.map(d => d.date),
    datasets: [{
      label: '拜访次数',
      data: data.visitByDate.map(d => d.count),
      borderColor: '#1890ff',
      backgroundColor: 'rgba(24, 144, 255, 0.1)',
      fill: true,
      tension: 0.4
    }]
  }

  const barData = {
    labels: data.visitByRep.map(d => d.name),
    datasets: [{
      label: '拜访完成',
      data: data.visitByRep.map(d => d.count),
      backgroundColor: '#52c41a'
    }]
  }

  const riskTypeMap = {
    'over_frequency': '超频拜访',
    'location_abnormal': '定位异常',
    'sensitive_material': '敏感资料'
  }

  const doughnutData = {
    labels: data.riskByType.map(d => riskTypeMap[d.type] || d.type),
    datasets: [{
      data: data.riskByType.map(d => d.count),
      backgroundColor: ['#ff4d4f', '#faad14', '#1890ff']
    }]
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">数据看板</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">医生总数</div>
          <div className="stat-value">{data.totalDoctors}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">拜访计划</div>
          <div className="stat-value">{data.totalPlans}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">已完成拜访</div>
          <div className="stat-value">{data.totalRecords}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">待处理风险</div>
          <div className="stat-value danger">{data.pendingRisks}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-header">近30天拜访趋势</div>
          <div className="card-body">
            <div className="chart-container">
              <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">代表拜访统计</div>
          <div className="card-body">
            <div className="chart-container">
              <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">风险类型分布</div>
        <div className="card-body">
          <div style={{ height: '300px', width: '400px', margin: '0 auto' }}>
            <Doughnut data={doughnutData} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
