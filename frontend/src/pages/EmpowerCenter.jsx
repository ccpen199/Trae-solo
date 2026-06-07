import { useState, useEffect } from 'react'
import { Card, Tabs, List, Tag, Input, Collapse, Row, Col, Avatar, Empty, Statistic, message } from 'antd'
import { SearchOutlined, PlayCircleOutlined, BookOutlined, TrophyOutlined, UserOutlined, StarOutlined, CrownOutlined } from '@ant-design/icons'
import { tutorialApi, leaderboardApi } from '../api'

const { TabPane } = Tabs
const { Search } = Input
const { Panel } = Collapse

export default function EmpowerCenter() {
  const [videos, setVideos] = useState([])
  const [faqs, setFaqs] = useState([])
  const [faqData, setFaqData] = useState({})
  const [videoData, setVideoData] = useState({})
  const [leaderboardData, setLeaderboardData] = useState({})
  const [videoCategory, setVideoCategory] = useState('')
  const [faqCategory, setFaqCategory] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => {
    loadVideos()
    loadFaqs()
    loadLeaderboard()
  }, [videoCategory, faqCategory])

  const loadVideos = async () => {
    try {
      const response = await tutorialApi.getVideos({ category: videoCategory })
      const data = response.data || {}
      setVideoData(data)
      setVideos(data.list || [])
    } catch (error) {
      message.error('加载视频列表失败')
    }
  }

  const loadFaqs = async () => {
    try {
      const response = await tutorialApi.getFaq({ category: faqCategory, keyword: searchKeyword })
      const data = response.data || {}
      setFaqData(data)
      setFaqs(data.list || [])
    } catch (error) {
      message.error('加载FAQ失败')
    }
  }

  const loadLeaderboard = async () => {
    try {
      const response = await leaderboardApi.getList({ limit: 10 })
      setLeaderboardData(response.data || {})
    } catch (error) {
      message.error('加载排行榜失败')
    }
  }

  const handleSearch = (value) => {
    setSearchKeyword(value)
    loadFaqs()
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const videoCategories = [
    { key: '', label: '全部' },
    ...(videoData.categories || []).map(cat => ({ key: cat, label: cat }))
  ]

  const faqCategories = [
    { key: '', label: '全部' },
    ...(faqData.categories || []).map(cat => ({ key: cat, label: cat }))
  ]

  const knowledgeGraph = faqData.knowledgeGraph || []
  const maxCount = knowledgeGraph.length > 0 ? Math.max(...knowledgeGraph.map(k => k.count)) : 1
  const minCount = knowledgeGraph.length > 0 ? Math.min(...knowledgeGraph.map(k => k.count)) : 0

  const getTagSize = (count) => {
    if (maxCount === minCount) return 14
    const ratio = (count - minCount) / (maxCount - minCount)
    return Math.round(12 + ratio * 16)
  }

  const getTagColor = (count) => {
    if (maxCount === minCount) return '#1890ff'
    const ratio = (count - minCount) / (maxCount - minCount)
    if (ratio > 0.7) return '#f5222d'
    if (ratio > 0.4) return '#fa8c16'
    return '#1890ff'
  }

  const leaderboardList = leaderboardData.list || []
  const stats = leaderboardData.stats || {}

  return (
    <div>
      <Tabs defaultActiveKey="videos" size="large">
        <TabPane tab={<span><PlayCircleOutlined /> 视频教程</span>} key="videos">
          <Card>
            <div style={{ marginBottom: 16 }}>
              {videoCategories.map(cat => (
                <Tag.CheckableTag
                  key={cat.key}
                  checked={videoCategory === cat.key}
                  onChange={() => setVideoCategory(cat.key)}
                  style={{ marginBottom: 8 }}
                >
                  {cat.label}
                </Tag.CheckableTag>
              ))}
            </div>
            {videos.length > 0 ? (
              <Row gutter={[16, 16]}>
                {videos.map(video => (
                  <Col xs={24} sm={12} lg={8} key={video.id}>
                    <Card
                      hoverable
                      cover={
                        <div style={{
                          height: 160,
                          background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 48
                        }}>
                          <PlayCircleOutlined />
                        </div>
                      }
                    >
                      <Card.Meta
                        title={video.title}
                        description={
                          <div>
                            <div style={{ marginBottom: 8 }}>{video.description}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#999', fontSize: 12 }}>
                              <span>{formatDuration(video.duration)}</span>
                              <span>{video.view_count} 次观看</span>
                            </div>
                          </div>
                        }
                      />
                      {video.category && <Tag color="blue" style={{ marginTop: 12 }}>{video.category}</Tag>}
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty description="暂无视频教程" />
            )}
          </Card>
        </TabPane>

        <TabPane tab={<span><BookOutlined /> 常见问题</span>} key="faq">
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Search
                placeholder="搜索问题"
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                style={{ maxWidth: 500, marginBottom: 16 }}
              />
              <div>
                {faqCategories.map(cat => (
                  <Tag.CheckableTag
                    key={cat.key}
                    checked={faqCategory === cat.key}
                    onChange={() => setFaqCategory(cat.key)}
                    style={{ marginBottom: 8 }}
                  >
                    {cat.label}
                  </Tag.CheckableTag>
                ))}
              </div>
            </div>
            {knowledgeGraph.length > 0 && (
              <Card size="small" title="知识图谱" type="inner" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  {knowledgeGraph.map(item => (
                    <Tag
                      key={item.tag}
                      color={getTagColor(item.count)}
                      style={{ fontSize: getTagSize(item.count), lineHeight: 1.8, cursor: 'default' }}
                    >
                      {item.tag} ({item.count})
                    </Tag>
                  ))}
                </div>
              </Card>
            )}
            {faqs.length > 0 ? (
              <Collapse accordion>
                {faqs.map(faq => (
                  <Panel header={faq.question} key={faq.id}>
                    <p style={{ color: '#666', margin: 0 }}>{faq.answer}</p>
                    {faq.category && <Tag color="blue" style={{ marginTop: 12 }}>{faq.category}</Tag>}
                  </Panel>
                ))}
              </Collapse>
            ) : (
              <Empty description="暂无常见问题" />
            )}
          </Card>
        </TabPane>

        <TabPane tab={<span><TrophyOutlined /> 金牌骑手排行榜</span>} key="leaderboard">
          <Card>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={8}>
                <Statistic
                  title="参赛骑手"
                  value={stats.totalCouriers ?? 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={8}>
                <Statistic
                  title="平均积分"
                  value={stats.avgPoints ?? 0}
                  prefix={<StarOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col xs={8}>
                <Statistic
                  title="最高积分"
                  value={stats.topPoints ?? 0}
                  prefix={<CrownOutlined />}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="本月排行榜" type="inner">
                  {leaderboardList.length > 0 ? (
                    <List
                      dataSource={leaderboardList}
                      renderItem={(item, index) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={
                              <Avatar
                                style={{
                                  backgroundColor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#1890ff',
                                  fontWeight: 'bold'
                                }}
                              >
                                {index + 1}
                              </Avatar>
                            }
                            title={item.courier_name}
                            description={
                              <div>
                                <span>派件: {item.deliveries_count || 0} 单</span>
                                <span style={{ marginLeft: 16 }}>积分: {item.points || 0}</span>
                              </div>
                            }
                          />
                          {index < 3 && <Tag color={index === 0 ? 'gold' : index === 1 ? 'silver' : 'orange'}>TOP {index + 1}</Tag>}
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="暂无排行数据" />
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="上榜规则" type="inner">
                  <div style={{ color: '#666', lineHeight: 2 }}>
                    <p><strong>1. 积分计算规则</strong></p>
                    <ul style={{ paddingLeft: 20 }}>
                      <li>每完成1单派送：+10积分</li>
                      <li>用户好评：+5积分</li>
                      <li>超时取件：-2积分</li>
                      <li>投诉成立：-50积分</li>
                    </ul>
                    <p><strong>2. 排名规则</strong></p>
                    <ul style={{ paddingLeft: 20 }}>
                      <li>按月积分总量排名</li>
                      <li>积分相同按派件数排序</li>
                      <li>每月1日重置排名</li>
                    </ul>
                    <p><strong>3. 奖励机制</strong></p>
                    <ul style={{ paddingLeft: 20 }}>
                      <li>第1名：奖励500元 + 专属徽章</li>
                      <li>第2-3名：奖励300元</li>
                      <li>第4-10名：奖励100元</li>
                    </ul>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  )
}
