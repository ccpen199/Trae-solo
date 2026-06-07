import React, { useEffect, useState, useRef } from 'react'
import { Card, List, Tag, Row, Col, Statistic, Input, Space, Descriptions, Modal, Button } from 'antd'
import { BulbOutlined, FireOutlined, BookOutlined, EyeOutlined } from '@ant-design/icons'
import { getKnowledge } from '../api.js'
import * as echarts from 'echarts'

const KnowledgeGraph = () => {
  const [nodes, setNodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [detail, setDetail] = useState(null)
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getKnowledge()
      setNodes(res.data)
    } catch (e) {
      console.error('Knowledge load error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (nodes.length > 0 && chartRef.current) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current)
      }
      const categories = [...new Set(nodes.map(n => n.category))]
      const categoryColors = ['#1890ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2']
      const option = {
        tooltip: {
          formatter: (params) => {
            if (params.dataType === 'node') {
              const node = nodes[params.data.id]
              return `<b>${params.name}</b><br/>分类: ${node?.category || '-'}<br/>频次: ${node?.frequency || 0}`
            }
            return `${params.data.source} → ${params.data.target}`
          }
        },
        legend: [{ data: categories }],
        series: [{
          type: 'graph',
          layout: 'force',
          roam: true,
          label: { show: true, position: 'right', formatter: '{b}', fontSize: 12 },
          draggable: true,
          data: nodes.map((n, i) => ({
            id: i,
            name: n.title,
            symbolSize: Math.min(80, 20 + n.frequency / 2),
            category: categories.indexOf(n.category),
            value: n.frequency,
            itemStyle: { color: categoryColors[categories.indexOf(n.category) % categoryColors.length] }
          })),
          links: nodes.slice(0, -1).map((_, i) => ({ source: i, target: i + 1, lineStyle: { opacity: 0.3 } })),
          categories: categories.map(c => ({ name: c })),
          force: { repulsion: 300, edgeLength: 120, gravity: 0.1 }
        }]
      }
      chartInstance.current.setOption(option)
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [nodes])

  const filtered = nodes.filter(n => {
    if (keyword && !n.title.includes(keyword) && !n.content?.includes(keyword)) return false
    if (categoryFilter && n.category !== categoryFilter) return false
    return true
  })

  const totalQuestions = nodes.length
  const totalViews = nodes.reduce((s, n) => s + n.frequency, 0)
  const topCategory = nodes.reduce((acc, n) => {
    acc[n.category] = (acc[n.category] || 0) + 1
    return acc
  }, {})
  const hotCategory = Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
  const categories = [...new Set(nodes.map(n => n.category))]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={8}>
          <Card className="stat-card">
            <Statistic title={<><BookOutlined /> 知识节点总数</>} value={totalQuestions} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card className="stat-card">
            <Statistic title={<><FireOutlined /> 累计访问次数</>} value={totalViews} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card className="stat-card">
            <Statistic title={<><BulbOutlined /> 热门分类</>} value={hotCategory} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card title="🔗 高频法律问题知识图谱" style={{ marginBottom: 16 }} loading={loading}>
        <div ref={chartRef} style={{ height: 400 }} />
      </Card>

      <Card
        title="📚 法律知识库列表"
        loading={loading}
        extra={
          <Space>
            <Input.Search
              placeholder="搜索知识节点..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Input.Group compact>
              <select
                style={{ width: 140, height: 32, border: '1px solid #d9d9d9', borderRadius: 6, padding: '0 8px' }}
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="">全部分类</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Input.Group>
          </Space>
        }
      >
        <List
          dataSource={filtered}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              actions={[
                <Button size="small" icon={<EyeOutlined />} onClick={() => setDetail(item)}>详情</Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span>{item.title}</span>
                    <Tag color="orange" icon={<FireOutlined />}>{item.frequency}次</Tag>
                    <Tag color="blue">{item.category}</Tag>
                  </Space>
                }
                description={<span style={{ color: '#666' }}>{item.content}</span>}
              />
            </List.Item>
          )}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="知识节点详情"
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        width={600}
      >
        {detail && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="标题">{detail.title}</Descriptions.Item>
            <Descriptions.Item label="分类"><Tag color="blue">{detail.category}</Tag></Descriptions.Item>
            <Descriptions.Item label="访问频次"><Tag color="orange" icon={<FireOutlined />}>{detail.frequency}次</Tag></Descriptions.Item>
            <Descriptions.Item label="内容摘要">{detail.content}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default KnowledgeGraph
