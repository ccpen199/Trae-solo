import { Card, Tooltip, Row, Col, Statistic } from 'antd'
import { HeatmapData } from '@/types'

interface HeatmapChartProps {
  data: HeatmapData[]
  height?: number
  showStats?: boolean
}

const changzhouDistricts = [
  { id: 'tianning', name: '天宁区', path: 'M150,100 L250,80 L300,150 L250,220 L150,200 Z', cx: 200, cy: 150 },
  { id: 'zhonglou', name: '钟楼区', path: 'M50,120 L150,100 L150,200 L50,220 Z', cx: 100, cy: 160 },
  { id: 'xinbei', name: '新北区', path: 'M50,20 L250,10 L300,80 L250,100 L150,100 L50,120 Z', cx: 175, cy: 60 },
  { id: 'wujin', name: '武进区', path: 'M250,100 L400,80 L450,200 L400,320 L250,300 L250,220 L300,150 Z', cx: 350, cy: 200 },
  { id: 'jintan', name: '金坛区', path: 'M400,80 L550,50 L600,180 L550,300 L450,320 L400,320 L400,200 Z', cx: 500, cy: 190 },
  { id: 'lishui', name: '溧阳市', path: 'M450,320 L550,300 L600,420 L500,480 L400,450 L400,320 Z', cx: 500, cy: 400 }
]

const HeatmapChart = ({ data, height = 500, showStats = true }: HeatmapChartProps) => {
  const getValueByDistrict = (districtId: string) => {
    return data.find((d) => d.district === districtId) || { value: 0, serviceCount: 0, userCount: 0, avgProcessingTime: 0 }
  }

  const getColor = (value: number, maxValue: number) => {
    const ratio = value / maxValue
    if (ratio > 0.8) return '#7f2704'
    if (ratio > 0.6) return '#d4380d'
    if (ratio > 0.4) return '#fa8c16'
    if (ratio > 0.2) return '#ffc069'
    return '#fff1e0'
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const totalServices = data.reduce((sum, d) => sum + d.serviceCount, 0)
  const totalUsers = data.reduce((sum, d) => sum + d.userCount, 0)
  const avgTime = data.length > 0
    ? (data.reduce((sum, d) => sum + d.avgProcessingTime, 0) / data.length).toFixed(1)
    : '0'

  return (
    <Card className="card-shadow">
      {showStats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Statistic title="服务总量" value={totalServices} suffix="件" />
          </Col>
          <Col span={8}>
            <Statistic title="用户总数" value={totalUsers} suffix="人" />
          </Col>
          <Col span={8}>
            <Statistic title="平均办理时长" value={avgTime} suffix="工作日" />
          </Col>
        </Row>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <svg width="100%" height={height} viewBox="0 0 650 520">
          <defs>
            <linearGradient id="heatmapLegend" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fff1e0" />
              <stop offset="25%" stopColor="#ffc069" />
              <stop offset="50%" stopColor="#fa8c16" />
              <stop offset="75%" stopColor="#d4380d" />
              <stop offset="100%" stopColor="#7f2704" />
            </linearGradient>
          </defs>

          {changzhouDistricts.map((district) => {
            const districtData = getValueByDistrict(district.id)
            return (
              <Tooltip
                key={district.id}
                title={
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>{district.name}</div>
                    <div>热度值: {districtData.value}</div>
                    <div>服务数量: {districtData.serviceCount} 件</div>
                    <div>用户数量: {districtData.userCount} 人</div>
                    <div>平均办理时长: {districtData.avgProcessingTime} 工作日</div>
                  </div>
                }
              >
                <g style={{ cursor: 'pointer' }}>
                  <path
                    d={district.path}
                    fill={getColor(districtData.value, maxValue)}
                    stroke="#1890ff"
                    strokeWidth="2"
                    style={{
                      transition: 'all 0.3s ease',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.fill = '#40a9ff'
                      e.currentTarget.style.strokeWidth = '3'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.fill = getColor(districtData.value, maxValue)
                      e.currentTarget.style.strokeWidth = '2'
                    }}
                  />
                  <text
                    x={district.cx}
                    y={district.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#262626"
                    fontSize="14"
                    fontWeight="500"
                    style={{ pointerEvents: 'none' }}
                  >
                    {district.name}
                  </text>
                  <text
                    x={district.cx}
                    y={district.cy + 20}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#595959"
                    fontSize="12"
                    style={{ pointerEvents: 'none' }}
                  >
                    {districtData.value}
                  </text>
                </g>
              </Tooltip>
            )
          })}

          <g transform="translate(200, 500)">
            <rect x="0" y="0" width="250" height="20" fill="url(#heatmapLegend)" rx="4" />
            <text x="0" y="-5" fill="#8c8c8c" fontSize="12">低</text>
            <text x="235" y="-5" fill="#8c8c8c" fontSize="12">高</text>
            <text x="125" y="40" fill="#595959" fontSize="12" textAnchor="middle">区域热度分布</text>
          </g>
        </svg>
      </div>
    </Card>
  )
}

export default HeatmapChart
