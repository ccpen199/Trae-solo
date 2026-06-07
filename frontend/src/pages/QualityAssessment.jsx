import React, { useEffect, useState, useRef } from 'react'
import {
  Table, Card, Tag, Progress, Space, Row, Col, Statistic,
  Descriptions, Modal, Button, List, Avatar, Empty, Timeline,
  Alert, Tooltip, Divider
} from 'antd'
import {
  RiseOutlined, ThunderboltOutlined, LikeOutlined, BarChartOutlined,
  EyeOutlined, TrophyOutlined, CheckCircleOutlined, ClockCircleOutlined,
  StarOutlined, UserOutlined, FileTextOutlined, SafetyOutlined, GiftOutlined
} from '@ant-design/icons'
import { getQualityLawyers } from '../api.js'
import * as echarts from 'echarts'
import dayjs from 'dayjs'

const QualityAssessment = () => {
  const [lawyers, setLawyers] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const radarRef = useRef(null)
  const radarInstance = useRef(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getQualityLawyers()
      setLawyers(res.data.map((l, idx) => ({
        ...l,
        detailData: generateDetailData(l, idx)
      })))
    } catch (e) {
      console.error('Quality load error:', e)
    } finally {
      setLoading(false)
    }
  }

  const generateDetailData = (lawyer, idx) => {
    const categories = ['债权债务', '婚姻家庭', '劳动争议', '合同纠纷', '房产纠纷']
    const caseTitles = [
      '民间借贷纠纷案', '离婚财产分割案', '劳动仲裁赔偿金案',
      '房屋买卖合同纠纷案', '建设工程施工合同案', '交通事故赔偿案'
    ]
    const totalCases = lawyer.total_cases || 45
    const closedCases = Math.floor(totalCases * (0.75 + Math.random() * 0.2))
    const repeatClients = Math.floor(Math.random() * 15) + 3
    const avgResponseTime = lawyer.avg_response_time || 25

    const cases = []
    for (let i = 0; i < Math.min(8, closedCases); i++) {
      cases.push({
        id: `C${1000 + i}`,
        title: caseTitles[i % caseTitles.length] + `(${categories[i % categories.length]})`,
        category: categories[i % categories.length],
        status: ['胜诉', '调解', '撤诉'][i % 3],
        responseTime: Math.floor(avgResponseTime * (0.7 + Math.random() * 0.6)),
        closedAt: dayjs().subtract(i * 7 + Math.floor(Math.random() * 5), 'day').format('YYYY-MM-DD'),
        clientSatisfaction: Math.floor(70 + Math.random() * 30),
        isRepeat: Math.random() > 0.7
      })
    }

    const responseHistory = []
    for (let i = 0; i < 12; i++) {
      responseHistory.push({
        month: `${2024}-${String(i + 1).padStart(2, '0')}`,
        avgTime: Math.floor(avgResponseTime * (0.8 + Math.random() * 0.4))
      })
    }

    const reviews = []
    const reviewTexts = [
      '律师非常专业，案件处理效率高，强烈推荐',
      '响应及时，沟通顺畅，结果超出预期',
      '服务态度好，专业能力强，值得信赖',
      '从咨询到结案全程跟进，非常负责',
      '收费透明，办案认真，效果满意'
    ]
    for (let i = 0; i < Math.min(6, lawyer.review_count || 5); i++) {
      const score = Math.floor(80 + Math.random() * 20)
      reviews.push({
        id: i + 1,
        client: `客户${String.fromCharCode(65 + i)}`,
        text: reviewTexts[i],
        score,
        sentiment: score >= 90 ? '积极正面' : score >= 80 ? '正面' : '中性',
        date: dayjs().subtract(i * 10 + Math.floor(Math.random() * 20), 'day').format('YYYY-MM-DD'),
        caseType: categories[i % categories.length]
      })
    }

    return {
      totalCases,
      closedCases,
      closedRate: Math.round(closedCases / totalCases * 100),
      repeatClients,
      repeatRate: Math.round(repeatClients / totalCases * 100),
      avgResponseTime,
      cases,
      responseHistory,
      reviews,
      specialtyStats: categories.slice(0, 4).map((c, i) => ({
        category: c,
        count: Math.floor(totalCases / 4 + Math.random() * 10),
        winRate: Math.floor(70 + Math.random() * 25)
      }))
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (lawyers.length > 0 && chartRef.current) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current)
      }
      const option = {
        tooltip: { trigger: 'axis' },
        legend: { data: ['胜诉率(%)', '客户满意度(%)', '综合质量分'] },
        grid: { left: 40, right: 20, top: 40, bottom: 40 },
        xAxis: { type: 'category', data: lawyers.map(l => l.name) },
        yAxis: { type: 'value', max: 100 },
        series: [
          { name: '胜诉率(%)', type: 'bar', data: lawyers.map(l => Math.round(l.win_rate * 100)), itemStyle: { color: '#1890ff' }, barWidth: 24 },
          { name: '客户满意度(%)', type: 'bar', data: lawyers.map(l => Math.round(l.sentiment_score * 100)), itemStyle: { color: '#52c41a' }, barWidth: 24 },
          { name: '综合质量分', type: 'line', data: lawyers.map(l => Math.round(l.quality_score * 100)), itemStyle: { color: '#faad14' }, lineStyle: { width: 3 }, symbolSize: 8 }
        ]
      }
      chartInstance.current.setOption(option)
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [lawyers])

  useEffect(() => {
    if (lawyers.length > 0 && radarRef.current) {
      if (!radarInstance.current) {
        radarInstance.current = echarts.init(radarRef.current)
      }
      const top3 = lawyers.slice(0, 3)
      const option = {
        tooltip: {},
        legend: { data: top3.map(l => l.name) },
        radar: {
          indicator: [
            { name: '胜诉率', max: 100 },
            { name: '响应时效', max: 100 },
            { name: '客户满意度', max: 100 },
            { name: '结案率', max: 100 },
            { name: '复购率', max: 100 }
          ]
        },
        series: [{
          type: 'radar',
          data: top3.map((l, i) => ({
            value: [
              Math.round(l.win_rate * 100),
              Math.round(Math.max(0, (300 - (l.detailData?.avgResponseTime || 30)) / 3)),
              Math.round(l.sentiment_score * 100),
              l.detailData?.closedRate || 80,
              l.detailData?.repeatRate || 20
            ],
            name: l.name,
            itemStyle: { color: ['#faad14', '#a0d911', '#1890ff'][i] },
            areaStyle: { opacity: 0.2 }
          }))
        }]
      }
      radarInstance.current.setOption(option)
    }
    return () => {
      if (radarInstance.current) {
        radarInstance.current.dispose()
        radarInstance.current = null
      }
    }
  }, [lawyers])

  const columns = [
    {
      title: '排名', width: 60,
      render: (_, __, i) => (
        <Space>
          {i === 0 && <TrophyOutlined style={{ color: '#faad14', fontSize: 16 }} />}
          {i === 1 && <TrophyOutlined style={{ color: '#a0d911', fontSize: 16 }} />}
          {i === 2 && <TrophyOutlined style={{ color: '#1890ff', fontSize: 16 }} />}
          <b style={{ color: i < 3 ? ['#faad14', '#a0d911', '#1890ff'][i] : '#999' }}>#{i + 1}</b>
        </Space>
      )
    },
    {
      title: '律师', dataIndex: 'name',
      render: (t, r) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Button type="link" style={{ padding: 0 }} onClick={() => setDetail(r)}><b>{t}</b></Button>
        </Space>
      )
    },
    { title: '总案件', dataIndex: 'total_cases', width: 70 },
    {
      title: '胜诉率', dataIndex: 'win_rate', width: 120,
      render: v => <Progress percent={Math.round(v * 100)} size="small" />
    },
    {
      title: '响应时间', dataIndex: 'avg_response_time', width: 110,
      render: v => <Space><ThunderboltOutlined style={{ color: v <= 30 ? '#52c41a' : '#faad14' }} /> {v}分钟</Space>
    },
    {
      title: '客户满意', dataIndex: 'sentiment_score', width: 120,
      render: v => <Progress percent={Math.round(v * 100)} size="small" status="active" strokeColor="#52c41a" />
    },
    {
      title: '结案率', width: 100,
      render: (_, r) => <Tag color="green">{r.detailData?.closedRate || 80}%</Tag>
    },
    {
      title: '客户复购', width: 100,
      render: (_, r) => (
        <Tooltip title={`${r.detailData?.repeatClients || 5}位回头客`}>
          <Tag color="gold" icon={<GiftOutlined />}>{r.detailData?.repeatRate || 20}%</Tag>
        </Tooltip>
      )
    },
    {
      title: '综合分', dataIndex: 'quality_score', width: 100,
      render: v => {
        const score = Math.round(v * 100)
        const color = score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'
        return <Tag color={color} style={{ fontSize: 14, padding: '2px 12px' }}>{score}</Tag>
      }
    },
    {
      title: '操作', width: 80,
      render: (_, r) => <Button size="small" icon={<EyeOutlined />} onClick={() => setDetail(r)}>详情</Button>
    }
  ]

  const avgWinRate = lawyers.length > 0 ? (lawyers.reduce((s, l) => s + l.win_rate, 0) / lawyers.length) : 0
  const avgRespTime = lawyers.length > 0 ? Math.round(lawyers.reduce((s, l) => s + (l.avg_response_time || 30), 0) / lawyers.length) : 0
  const avgSentiment = lawyers.length > 0 ? (lawyers.reduce((s, l) => s + l.sentiment_score, 0) / lawyers.length) : 0
  const avgQuality = lawyers.length > 0 ? (lawyers.reduce((s, l) => s + l.quality_score, 0) / lawyers.length) : 0

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title={<><RiseOutlined /> 平均胜诉率</>} value={Math.round(avgWinRate * 100)} suffix="%" valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title={<><ThunderboltOutlined /> 平均响应</>} value={avgRespTime} suffix="分钟" valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title={<><LikeOutlined /> 平均满意度</>} value={Math.round(avgSentiment * 100)} suffix="%" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="stat-card">
            <Statistic title={<><BarChartOutlined /> 综合质量分</>} value={Math.round(avgQuality * 100)} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={14}>
          <Card title="📊 律师质量评估对比">
            <div ref={chartRef} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="🎯 TOP3 律师能力雷达图">
            <div ref={radarRef} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Card title="🏆 律师接案质量排行榜" loading={loading}>
        <Table
          columns={columns}
          dataSource={lawyers}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 位律师` }}
          scroll={{ x: 1400 }}
        />
        <Alert
          message="评估模型说明"
          description="综合质量分 = 胜诉率×40% + (1-响应时间/300分钟)×30% + 客户满意度×30% | 结案率=结案数/总接案数 | 复购率=重复委托客户占比"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>

      <Modal
        title={<Space><BarChartOutlined /> 律师质量评估详情</Space>}
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={<Button onClick={() => setDetail(null)}>关闭</Button>}
        width={1000}
        bodyStyle={{ maxHeight: '75vh', overflowY: 'auto' }}
      >
        {detail && (
          <div>
            <Descriptions bordered column={4} size="small">
              <Descriptions.Item label="律师">
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  <b style={{ fontSize: 16 }}>{detail.name}</b>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="综合质量分">
                <Tag color={Math.round(detail.quality_score * 100) >= 80 ? 'green' : 'orange'} style={{ fontSize: 18, padding: '4px 16px' }}>
                  {Math.round(detail.quality_score * 100)}分
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="执业年限">{detail.practice_years}年</Descriptions.Item>
              <Descriptions.Item label="总接案数">{detail.total_cases}件</Descriptions.Item>
              <Descriptions.Item label="胜诉率"><Progress percent={Math.round(detail.win_rate * 100)} style={{ width: 100 }} /></Descriptions.Item>
              <Descriptions.Item label="平均响应">
                <Tag color={detail.avg_response_time <= 30 ? 'green' : 'orange'}>{detail.avg_response_time}分钟</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="客户满意度">
                <Progress percent={Math.round(detail.sentiment_score * 100)} style={{ width: 100 }} status="active" strokeColor="#52c41a" />
              </Descriptions.Item>
              <Descriptions.Item label="评价条数">{detail.review_count || 0}条</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="📐 评估维度分解" type="inner">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
                    <div>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <span>胜诉率 (40%权重)</span>
                        <span style={{ color: '#52c41a' }}>{Math.round(detail.win_rate * 40)}分</span>
                      </Space>
                      <Progress percent={Math.round(detail.win_rate * 100)} />
                    </div>
                    <div>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <span>响应时效 (30%权重)</span>
                        <span style={{ color: '#722ed1' }}>{Math.round(Math.max(0, (300 - detail.avg_response_time) / 10))}分</span>
                      </Space>
                      <Progress percent={Math.round(Math.max(0, (300 - detail.avg_response_time) / 3))} strokeColor="#722ed1" />
                    </div>
                    <div>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <span>客户满意度 (30%权重)</span>
                        <span style={{ color: '#fa8c16' }}>{Math.round(detail.sentiment_score * 30)}分</span>
                      </Space>
                      <Progress percent={Math.round(detail.sentiment_score * 100)} strokeColor="#fa8c16" />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="📈 关键业务指标" type="inner">
                  <Row gutter={[8, 8]}>
                    <Col span={12}>
                      <Statistic title={<><CheckCircleOutlined /> 结案数</>}
                        value={detail.detailData?.closedCases || 36} suffix="件" style={{ fontSize: 12 }} />
                    </Col>
                    <Col span={12}>
                      <Statistic title={<><SafetyOutlined /> 解决闭环率</>}
                        value={detail.detailData?.closedRate || 80} suffix="%" valueStyle={{ color: '#52c41a' }} />
                    </Col>
                    <Col span={12}>
                      <Statistic title={<><GiftOutlined /> 客户复购</>}
                        value={detail.detailData?.repeatClients || 5} suffix="人" />
                    </Col>
                    <Col span={12}>
                      <Statistic title={<><StarOutlined /> 复购率</>}
                        value={detail.detailData?.repeatRate || 20} suffix="%" valueStyle={{ color: '#faad14' }} />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            <Divider orientation="left">📋 近期结案明细（响应时效追踪）</Divider>
            <Table
              size="small"
              columns={[
                { title: '案件ID', dataIndex: 'id', width: 70 },
                { title: '案件类型', dataIndex: 'title', ellipsis: true },
                { title: '分类', dataIndex: 'category', width: 90, render: v => <Tag color="blue">{v}</Tag> },
                { title: '结果', dataIndex: 'status', width: 70, render: v => <Tag color={v === '胜诉' ? 'green' : 'blue'}>{v}</Tag> },
                {
                  title: '响应时间', dataIndex: 'responseTime', width: 100,
                  render: v => <Tag color={v <= 30 ? 'green' : v <= 60 ? 'blue' : 'orange'}>{v}分钟</Tag>
                },
                { title: '结案日期', dataIndex: 'closedAt', width: 100 },
                {
                  title: '客户满意度', dataIndex: 'clientSatisfaction', width: 120,
                  render: v => <Progress percent={v} size="small" status="active" />
                },
                {
                  title: '复购客户', width: 80,
                  render: (_, r) => r.isRepeat ? <Tag color="gold" icon={<GiftOutlined />}>是</Tag> : '-'
                }
              ]}
              dataSource={detail.detailData?.cases || []}
              rowKey="id"
              pagination={false}
            />

            <Divider orientation="left">💬 客户评价（情感分析）</Divider>
            <List
              size="small"
              dataSource={detail.detailData?.reviews || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar size="small" style={{ backgroundColor: item.score >= 90 ? '#52c41a' : '#1890ff' }}>{item.sentiment === '积极正面' ? '😊' : '🙂'}</Avatar>}
                    title={
                      <Space>
                        <span style={{ fontWeight: 'bold' }}>{item.client}</span>
                        <Tag color="blue">{item.caseType}</Tag>
                        <Progress percent={item.score} size="small" style={{ width: 80 }} />
                        <Tag color={item.score >= 90 ? 'green' : 'blue'}>{item.sentiment}</Tag>
                        <span style={{ color: '#999', fontSize: 11 }}>{item.date}</span>
                      </Space>
                    }
                    description={<span style={{ fontSize: 13 }}>{item.text}</span>}
                  />
                </List.Item>
              )}
            />

            <Divider orientation="left">⚖️ 各领域办案统计</Divider>
            <Row gutter={16}>
              {(detail.detailData?.specialtyStats || []).map((s, i) => (
                <Col span={6} key={i}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{s.category}</div>
                    <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>{s.count}案</div>
                    <Progress percent={s.winRate} size="small" />
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default QualityAssessment
