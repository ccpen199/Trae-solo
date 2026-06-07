import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Select, DatePicker, Tabs } from 'antd'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line, Pie } from 'react-chartjs-2'
import { analyticsAPI } from '../../utils/api.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

function AdminAnalytics() {
  const [dailyData, setDailyData] = useState([])
  const [hourlyData, setHourlyData] = useState([])
  const [buildingData, setBuildingData] = useState([])
  const [seasonalData, setSeasonalData] = useState([])
  const [overview, setOverview] = useState(null)
  const [days, setDays] = useState(7)

  useEffect(() => {
    loadData()
  }, [days])

  const loadData = async () => {
    try {
      const [overviewRes, dailyRes, hourlyRes, buildingRes, seasonalRes] = await Promise.all([
        analyticsAPI.getEnergyOverview(),
        analyticsAPI.getEnergyDaily({ days }),
        analyticsAPI.getEnergyByHour(),
        analyticsAPI.getEnergyByBuilding(),
        analyticsAPI.getEnergySeasonal(),
      ])
      setOverview(overviewRes.data)
      setDailyData(dailyRes.data)
      setHourlyData(hourlyRes.data)
      setBuildingData(buildingRes.data)
      setSeasonalData(seasonalRes.data)
    } catch (error) {
      console.error('加载分析数据失败', error)
    }
  }

  const dailyChartData = {
    labels: dailyData.map(d => d.date),
    datasets: [
      {
        label: '用水量(L)',
        data: dailyData.map(d => d.total_water),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: '金额(¥)',
        data: dailyData.map(d => d.total_amount),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  }

  const hourlyChartData = {
    labels: hourlyData.map(d => `${d.hour}时`),
    datasets: [
      {
        label: '用水量(L)',
        data: hourlyData.map(d => d.total_water),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const buildingChartData = {
    labels: buildingData.map(d => d.building),
    datasets: [
      {
        label: '用水量(L)',
        data: buildingData.map(d => d.total_water),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const seasonalChartData = {
    labels: seasonalData.map(d => d.season),
    datasets: [
      {
        label: '用水量(L)',
        data: seasonalData.map(d => d.total_water),
        backgroundColor: [
          'rgba(255, 159, 64, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(54, 162, 235, 0.7)',
        ],
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  }

  const dualAxisOptions = {
    ...chartOptions,
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: '用水量(L)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: '金额(¥)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>能耗分析</h2>
        <Select value={days} onChange={setDays} style={{ width: 120 }}>
          <Select.Option value={7}>最近7天</Select.Option>
          <Select.Option value={30}>最近30天</Select.Option>
          <Select.Option value={90}>最近90天</Select.Option>
        </Select>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <div style={{ color: 'white' }}>
              <div className="stat-label">总用水量</div>
              <div className="stat-value">{overview?.totalWater?.toFixed(0) || 0} L</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card green">
            <div style={{ color: 'white' }}>
              <div className="stat-label">总营收</div>
              <div className="stat-value">¥{overview?.totalAmount?.toFixed(2) || 0}</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card orange">
            <div style={{ color: 'white' }}>
              <div className="stat-label">使用次数</div>
              <div className="stat-value">{overview?.totalUsage || 0}</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card blue">
            <div style={{ color: 'white' }}>
              <div className="stat-label">单次平均</div>
              <div className="stat-value">{overview?.avgPerUse || 0} L</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="daily">
        <Tabs.TabPane tab="日用水趋势" key="daily">
          <div className="chart-container" style={{ height: 400 }}>
            <Bar data={dailyChartData} options={dualAxisOptions} />
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="时段分布" key="hourly">
          <div className="chart-container" style={{ height: 400 }}>
            <Line data={hourlyChartData} options={chartOptions} />
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="楼宇对比" key="building">
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <div className="chart-container" style={{ height: 400 }}>
                <Pie data={buildingChartData} options={chartOptions} />
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="楼宇明细">
                {buildingData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <span>{d.building}</span>
                    <span style={{ fontWeight: 'bold' }}>{d.total_water?.toFixed(0)} L</span>
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>
        <Tabs.TabPane tab="季节分析" key="seasonal">
          <div className="chart-container" style={{ height: 400 }}>
            <Bar data={seasonalChartData} options={chartOptions} />
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  )
}

export default AdminAnalytics
