import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Typography, Input, Select, Pagination, message } from 'antd'
import { EnvironmentOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { cinemaAPI } from '../utils/api'

const { Title, Paragraph, Text } = Typography
const { Option } = Select

function Cinemas() {
  const navigate = useNavigate()
  const [cinemas, setCinemas] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [city, setCity] = useState('北京')
  const [keyword, setKeyword] = useState('')

  const cities = ['北京', '上海', '广州', '深圳', '杭州']

  useEffect(() => {
    loadCinemas()
  }, [city, page, keyword])

  const loadCinemas = async () => {
    try {
      const params = { city, page, pageSize: 10, keyword }
      const data = await cinemaAPI.list(params)
      setCinemas(data.list || [])
      setTotal(data.total || 0)
    } catch (e) {
      message.error('加载失败')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>🎬 影院列表</Title>
        <div style={{ display: 'flex', gap: 12 }}>
          <Select value={city} onChange={setCity} style={{ width: 120 }} prefix={<EnvironmentOutlined />}>
            {cities.map(c => <Option key={c} value={c}>{c}</Option>)}
          </Select>
          <Input.Search
            placeholder="搜索影院..."
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onSearch={() => setPage(1)}
            style={{ width: 250 }}
          />
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {cinemas.map(cinema => (
          <Col xs={24} sm={12} md={8} key={cinema.id}>
            <Card hoverable onClick={() => navigate(`/cinemas/${cinema.id}`)}>
              <Card.Meta
                title={<div style={{ fontWeight: 'bold', fontSize: 16 }}>{cinema.name}</div>}
                description={
                  <div>
                    <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 12, color: '#666', minHeight: 44 }}>
                      <EnvironmentOutlined style={{ marginRight: 4 }} /> {cinema.address}
                    </Paragraph>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {cinema.equipment_types?.split(',').map(eq => (
                        <span key={eq} style={{ padding: '2px 8px', background: '#e6f7ff', color: '#1890ff', borderRadius: 4, fontSize: 12 }}>
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {cinemas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
          暂无影院数据
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Pagination
          current={page}
          total={total}
          pageSize={10}
          onChange={setPage}
          showSizeChanger={false}
        />
      </div>
    </div>
  )
}

export default Cinemas
