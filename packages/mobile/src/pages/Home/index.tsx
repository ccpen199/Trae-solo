import { NavBar, SearchBar, Card, Space, Tag, Grid } from 'antd-mobile'
import { SetOutline, LocationOutline, StarOutline } from 'antd-mobile-icons'
import './index.css'

const mockStations = [
  { id: 1, name: '国家电网充电站(朝阳公园)', distance: '0.5km', price: '1.25元/度', available: 8, total: 12, rating: 4.8 },
  { id: 2, name: '特来电充电站(三里屯)', distance: '1.2km', price: '1.35元/度', available: 3, total: 10, rating: 4.6 },
  { id: 3, name: '星星充电(望京SOHO)', distance: '1.8km', price: '1.18元/度', available: 15, total: 20, rating: 4.9 },
  { id: 4, name: '小桔充电站(国贸)', distance: '2.3km', price: '1.42元/度', available: 5, total: 8, rating: 4.5 }
]

function Home() {
  return (
    <div className="home-page">
      <NavBar back={null}>
        <div className="nav-title">
          <LocationOutline />
          <span>北京市朝阳区</span>
        </div>
      </NavBar>

      <div className="search-section">
        <SearchBar placeholder="搜索充电站/地址" />
      </div>

      <div className="map-placeholder">
        <div className="map-content">
          <SetOutline className="map-icon" />
          <span>地图找桩区域</span>
        </div>
      </div>

      <div className="stations-section">
        <div className="section-header">
          <h3>附近充电站</h3>
          <span className="section-more">查看全部</span>
        </div>

        <Space direction="vertical" block>
          {mockStations.map((station) => (
            <Card key={station.id} className="station-card">
              <div className="station-info">
                <div className="station-name">{station.name}</div>
                <div className="station-meta">
                  <span className="station-distance">
                    <LocationOutline /> {station.distance}
                  </span>
                  <span className="station-rating">
                    <StarOutline /> {station.rating}
                  </span>
                </div>
                <div className="station-bottom">
                  <Tag color="primary" className="price-tag">
                    {station.price}
                  </Tag>
                  <span className="available-count">
                    空闲 <strong>{station.available}</strong>/{station.total}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </Space>
      </div>

      <Grid columns={4} className="quick-actions">
        <Grid.Item>
          <div className="quick-item">
            <div className="quick-icon">⚡</div>
            <span>快速充电</span>
          </div>
        </Grid.Item>
        <Grid.Item>
          <div className="quick-item">
            <div className="quick-icon">🗺️</div>
            <span>导航找桩</span>
          </div>
        </Grid.Item>
        <Grid.Item>
          <div className="quick-item">
            <div className="quick-icon">📊</div>
            <span>充电记录</span>
          </div>
        </Grid.Item>
        <Grid.Item>
          <div className="quick-item">
            <div className="quick-icon">💬</div>
            <span>车友社区</span>
          </div>
        </Grid.Item>
      </Grid>
    </div>
  )
}

export default Home
