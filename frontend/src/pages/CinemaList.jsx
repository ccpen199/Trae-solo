import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, Card, Tag, Spin, message, Input, Select } from 'antd'
import { PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { getCinemas } from '../services/api'

const { Search } = Input

function CinemaList() {
  const navigate = useNavigate()
  const [cinemas, setCinemas] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    loadCinemas()
  }, [])

  const loadCinemas = async () => {
    setLoading(true)
    try {
      const res = await getCinemas()
      setCinemas(res.data.list || [])
    } catch (err) {
      message.error('加载影院列表失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredCinemas = cinemas.filter(cinema =>
    cinema.name.toLowerCase().includes(searchText.toLowerCase()) ||
    cinema.address.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <Spin spinning={loading}>
      <div className="page-header">
        <div className="container">
          <h1 style={{ color: 'white', marginBottom: 0 }}>全部影院</h1>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '30px' }}>
        <Search
          placeholder="搜索影院名称或地址"
          allowClear
          enterButton="搜索"
          size="large"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          onSearch={value => setSearchText(value)}
          style={{ marginBottom: '30px' }}
        />

        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
          dataSource={filteredCinemas}
          renderItem={cinema => (
            <List.Item>
              <Card
                hoverable
                className="card-hover"
                onClick={() => navigate(`/cinema/${cinema.id}`)}
              >
                <Card.Meta
                  title={<h3 style={{ marginBottom: '10px' }}>{cinema.name}</h3>}
                  description={
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666' }}>
                        <EnvironmentOutlined style={{ marginRight: '8px' }} />
                        {cinema.address}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666' }}>
                        <PhoneOutlined style={{ marginRight: '8px' }} />
                        {cinema.phone}
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <Tag color="blue">{cinema.features}</Tag>
                      </div>
                      <div className="price-tag" style={{ fontSize: '20px' }}>¥{cinema.min_price}起</div>
                    </div>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      </div>
    </Spin>
  )
}

export default CinemaList
