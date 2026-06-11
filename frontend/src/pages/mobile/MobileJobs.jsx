import React, { useState, useCallback } from 'react'
import {
  Card,
  Space,
  Typography,
  Input,
  Button,
  Tag,
  Empty,
  Spin,
  List
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  LoadingOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import MobilePage from '../../components/MobilePage'
import StatusBadge from '../../components/StatusBadge'

const { Text, Title } = Typography

const MobileJobs = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [filterVisible, setFilterVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: '高级前端开发工程师',
      salary: '25k-40k',
      city: '北京',
      company: '某互联网科技公司',
      applications: 128,
      status: 'published',
      tags: ['React', 'TypeScript', '5年以上'],
      updateTime: '2小时前'
    },
    {
      id: 2,
      title: 'Java后端开发工程师',
      salary: '30k-50k',
      city: '上海',
      company: '某金融科技公司',
      applications: 96,
      status: 'published',
      tags: ['Java', 'Spring Boot', '微服务'],
      updateTime: '3小时前'
    },
    {
      id: 3,
      title: '产品经理',
      salary: '20k-35k',
      city: '深圳',
      company: '某电商平台',
      applications: 75,
      status: 'published',
      tags: ['B端产品', '数据分析', '3年以上'],
      updateTime: '5小时前'
    },
    {
      id: 4,
      title: 'UI/UX设计师',
      salary: '18k-30k',
      city: '杭州',
      company: '某设计工作室',
      applications: 45,
      status: 'draft',
      tags: ['Figma', '用户研究', '交互设计'],
      updateTime: '1天前'
    },
    {
      id: 5,
      title: '数据分析师',
      salary: '22k-38k',
      city: '广州',
      company: '某数据科技公司',
      applications: 62,
      status: 'published',
      tags: ['Python', 'SQL', '机器学习'],
      updateTime: '1天前'
    }
  ])

  const fetchData = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }, [])

  const loadMore = () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    setTimeout(() => {
      setLoadingMore(false)
      setHasMore(false)
    }, 1000)
  }

  const handleJobClick = (job) => {
    navigate(`/jobs/${job.id}`)
  }

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchText.toLowerCase()) ||
      job.company.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <MobilePage
      title="岗位列表"
      showBack={false}
      rightExtra={
        <Button
          type="text"
          icon={<FilterOutlined />}
          onClick={() => setFilterVisible(!filterVisible)}
        />
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 10, paddingTop: 0 }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="搜索岗位名称、公司"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            size="large"
            style={{ borderRadius: 8 }}
          />
        </div>

        {filterVisible && (
          <Card
            style={{ borderRadius: 8 }}
            styles={{ body: {  padding: 12 } }}
          >
            <Space size={[8, 8]} wrap>
              <Tag.CheckableTag checked>全部</Tag.CheckableTag>
              <Tag.CheckableTag>已发布</Tag.CheckableTag>
              <Tag.CheckableTag>草稿</Tag.CheckableTag>
              <Tag.CheckableTag>已关闭</Tag.CheckableTag>
              <Tag.CheckableTag>已下线</Tag.CheckableTag>
            </Space>
          </Card>
        )}

        <div style={{ minHeight: 300 }}>
          {loading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: 40
              }}
            >
              <Spin />
            </div>
          ) : filteredJobs.length === 0 ? (
            <Empty
              description="暂无岗位"
              style={{ padding: 40 }}
            />
          ) : (
            <List
              dataSource={filteredJobs}
              renderItem={(job) => (
                <Card
                  key={job.id}
                  hoverable
                  onClick={() => handleJobClick(job)}
                  style={{
                    borderRadius: 12,
                    marginBottom: 12,
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}
                  styles={{ body: {  padding: 16 } }}
                >
                  <Space direction="vertical" size={10} style={{ width: '100%' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}
                    >
                      <Title
                        level={5}
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 600,
                          flex: 1,
                          marginRight: 12
                        }}
                        className="text-ellipsis"
                      >
                        {job.title}
                      </Title>
                      <StatusBadge
                        type="job_status"
                        status={job.status}
                      />
                    </div>

                    <Space size={16} align="center">
                      <Text
                        style={{
                          color: '#ff4d4f',
                          fontSize: 16,
                          fontWeight: 600
                        }}
                      >
                        {job.salary}
                      </Text>
                      <Space size={4} align="center">
                        <EnvironmentOutlined
                          style={{ color: '#8c8c8c', fontSize: 12 }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {job.city}
                        </Text>
                      </Space>
                    </Space>

                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {job.company}
                    </Text>

                    <Space size={[6, 6]} wrap>
                      {job.tags.map((tag, index) => (
                        <Tag
                          key={index}
                          style={{
                            margin: 0,
                            background: '#f0f5ff',
                            color: '#1677ff',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: 11
                          }}
                        >
                          {tag}
                        </Tag>
                      ))}
                    </Space>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: 8,
                        borderTop: '1px solid #f0f0f0'
                      }}
                    >
                      <Space size={4} align="center">
                        <TeamOutlined
                          style={{ color: '#8c8c8c', fontSize: 12 }}
                        />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {job.applications} 人投递
                        </Text>
                      </Space>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {job.updateTime}
                      </Text>
                    </div>
                  </Space>
                </Card>
              )}
            />
          )}

          {hasMore && (
            <div
              style={{
                textAlign: 'center',
                padding: 16,
                color: '#8c8c8c'
              }}
              onClick={loadMore}
            >
              {loadingMore ? (
                <Space size={8}>
                  <LoadingOutlined />
                  <Text>加载中...</Text>
                </Space>
              ) : (
                <Text style={{ fontSize: 12, cursor: 'pointer' }}>
                  上拉加载更多
                </Text>
              )}
            </div>
          )}
        </div>
      </Space>
    </MobilePage>
  )
}

export default MobileJobs
