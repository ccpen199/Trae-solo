import React, { useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import { dashboardApi } from '../services/api.js'

function Dashboard() {
  const [stats, setStats] = useState({
    insured_count: 0,
    credential_count: 0,
    prescription_count: 0,
    settlement_count: 0,
    total_settlement_amount: 0,
    pending_alerts: 0
  })
  const [trendData, setTrendData] = useState([])
  const [insuranceTypes, setInsuranceTypes] = useState([])
  const [settlementTypes, setSettlementTypes] = useState([])
  const [activities, setActivities] = useState({ prescriptions: [], settlements: [], offsite_records: [] })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsData, trend, types, setTypes, acts] = await Promise.all([
        dashboardApi.getStatistics(),
        dashboardApi.getSettlementTrend(),
        dashboardApi.getInsuranceTypes(),
        dashboardApi.getSettlementTypes(),
        dashboardApi.getRecentActivities()
      ])
      setStats(statsData)
      setTrendData(trend)
      setInsuranceTypes(types)
      setSettlementTypes(setTypes)
      setActivities(acts)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  const trendChartOption = {
    title: { text: '结算趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: trendData.map(item => item.date) },
    yAxis: [
      { type: 'value', name: '金额(元)' },
      { type: 'value', name: '笔数' }
    ],
    series: [
      {
        name: '结算金额',
        type: 'bar',
        data: trendData.map(item => item.amount),
        itemStyle: { color: '#1890ff' }
      },
      {
        name: '结算笔数',
        type: 'line',
        yAxisIndex: 1,
        data: trendData.map(item => item.count),
        itemStyle: { color: '#52c41a' }
      }
    ]
  }

  const insuranceChartOption = {
    title: { text: '参保类型分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: insuranceTypes,
      itemStyle: {
        colors: ['#1890ff', '#52c41a', '#faad14', '#f5222d']
      }
    }]
  }

  const settlementChartOption = {
    title: { text: '结算类型分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: settlementTypes,
      itemStyle: {
        colors: ['#1890ff', '#722ed1', '#fa8c16', '#13c2c2']
      }
    }]
  }

  return (
    <div>
      <div className="header">
        <h1>🏠 运营总览</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>正常参保人数</h3>
          <div className="value">{stats.insured_count.toLocaleString()}</div>
          <div className="trend up">↑ 较上月增长 5.2%</div>
        </div>
        <div className="stat-card">
          <h3>有效电子凭证</h3>
          <div className="value">{stats.credential_count.toLocaleString()}</div>
          <div className="trend up">↑ 激活率 85.3%</div>
        </div>
        <div className="stat-card">
          <h3>处方流转量</h3>
          <div className="value">{stats.prescription_count.toLocaleString()}</div>
          <div className="trend up">↑ 本月新增 128</div>
        </div>
        <div className="stat-card">
          <h3>结算总笔数</h3>
          <div className="value">{stats.settlement_count.toLocaleString()}</div>
          <div className="trend up">↑ 日均结算 45 笔</div>
        </div>
        <div className="stat-card">
          <h3>结算总金额</h3>
          <div className="value">¥{(stats.total_settlement_amount || 0).toLocaleString()}</div>
          <div className="trend up">↑ 医保支付占比 70%</div>
        </div>
        <div className="stat-card">
          <h3>待处理预警</h3>
          <div className="value" style={{ color: '#faad14' }}>{stats.pending_alerts}</div>
          <div className="trend down">↓ 较昨日减少 3</div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-container" style={{ minHeight: '350px' }}>
          <ReactECharts option={trendChartOption} style={{ height: '300px' }} />
        </div>
        <div className="chart-container" style={{ minHeight: '350px' }}>
          <ReactECharts option={insuranceChartOption} style={{ height: '300px' }} />
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-container" style={{ minHeight: '350px' }}>
          <ReactECharts option={settlementChartOption} style={{ height: '300px' }} />
        </div>
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <h2>📋 最近活动</h2>
          </div>
          <div className="card-body">
            <div className="tabs">
              <div className="tab active">处方</div>
              <div className="tab">结算</div>
              <div className="tab">备案</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>类型</th>
                  <th>参保人</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {activities.prescriptions.slice(0, 5).map(item => (
                  <tr key={item.id}>
                    <td>{item.prescription_date?.slice(0, 10)}</td>
                    <td>{item.type}</td>
                    <td>{item.name}</td>
                    <td>
                      <span className={`badge ${item.status === '已审核' ? 'badge-success' : 'badge-warning'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
