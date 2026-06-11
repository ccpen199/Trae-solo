import React, { useState } from 'react'
import {
  Card,
  Space,
  Typography,
  Input,
  Button,
  Tag,
  Avatar,
  Empty,
  Spin,
  message
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import MobilePage from '../../components/MobilePage'
import MatchScore from '../../components/MatchScore'

const { Text, Title } = Typography

const MobileCandidates = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [filterVisible, setFilterVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  const [candidates] = useState([
    {
      id: 1,
      name: '张三',
      avatar: '',
      education: '硕士',
      experience: '5年',
      expectedSalary: '30k-40k',
      city: '北京',
      position: '前端开发工程师',
      matchScore: 92,
      tags: ['React', 'Vue', 'TypeScript', 'Node.js'],
      updateTime: '1小时前'
    },
    {
      id: 2,
      name: '李四',
      avatar: '',
      education: '本科',
      experience: '3年',
      expectedSalary: '20k-30k',
      city: '上海',
      position: 'Java后端开发',
      matchScore: 78,
      tags: ['Java', 'Spring Boot', 'MySQL'],
      updateTime: '2小时前'
    },
    {
      id: 3,
      name: '王五',
      avatar: '',
      education: '本科',
      experience: '7年',
      expectedSalary: '35k-50k',
      city: '深圳',
      position: '高级产品经理',
      matchScore: 85,
      tags: ['B端产品', '数据分析', '用户研究'],
      updateTime: '3小时前'
    },
    {
      id: 4,
      name: '赵六',
      avatar: '',
      education: '博士',
      experience: '10年',
      expectedSalary: '50k-70k',
      city: '杭州',
      position: '技术架构师',
      matchScore: 96,
      tags: ['架构设计', '微服务', '分布式系统'],
      updateTime: '5小时前'
    }
  ])

  const handleCandidateClick = (candidate) => {
    navigate(`/candidates/${candidate.id}`)
  }

  const handleInterview = (candidate, e) => {
    e.stopPropagation()
    message.success(`已向 ${candidate.name} 发起面试邀请`)
  }

  const filteredCandidates = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchText.toLowerCase()) ||
      c.position.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <MobilePage
      title="求职者列表"
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
        <div style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="搜索姓名、职位"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            size="large"
            style={{ borderRadius: 8 }}
          />
        </div>

        {filterVisible && (
          <Card style={{ borderRadius: 8 }} styles={{ body: { padding: 12 } }}>
            <Space size={[8, 8]} wrap>
              <Tag.CheckableTag checked>全部</Tag.CheckableTag>
              <Tag.CheckableTag>已投递</Tag.CheckableTag>
              <Tag.CheckableTag>筛选中</Tag.CheckableTag>
              <Tag.CheckableTag>面试中</Tag.CheckableTag>
              <Tag.CheckableTag>Offer中</Tag.CheckableTag>
              <Tag.CheckableTag>匹配度高</Tag.CheckableTag>
            </Space>
          </Card>
        )}

        <Text type="secondary" style={{ fontSize: 12 }}>
          共 {filteredCandidates.length} 位求职者
        </Text>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : filteredCandidates.length === 0 ? (
          <Empty description="暂无求职者" style={{ padding: 40 }} />
        ) : (
          filteredCandidates.map((candidate) => (
            <Card
              key={candidate.id}
              hoverable
              onClick={() => handleCandidateClick(candidate)}
              style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              styles={{ body: { padding: 16 } }}
            >
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <Avatar
                  size={48}
                  src={candidate.avatar}
                  icon={!candidate.avatar && <UserOutlined />}
                  style={{ background: '#1677ff', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Space size={8} align="center">
                      <Text style={{ fontSize: 15, fontWeight: 600 }}>{candidate.name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{candidate.education}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{candidate.experience}</Text>
                    </Space>
                    <MatchScore score={candidate.matchScore} size={48} />
                  </div>
                  <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                    {candidate.position}
                  </Text>
                  <Space size={12} align="center" style={{ marginBottom: 6 }}>
                    <Space size={4} align="center">
                      <EnvironmentOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>{candidate.city}</Text>
                    </Space>
                    <Text style={{ color: '#ff4d4f', fontSize: 13, fontWeight: 500 }}>
                      {candidate.expectedSalary}
                    </Text>
                  </Space>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space size={[4, 4]} wrap>
                      {candidate.tags.slice(0, 3).map((tag, index) => (
                        <Tag key={index} style={{ margin: 0, background: '#f0f5ff', color: '#1677ff', border: 'none', borderRadius: 4, fontSize: 11 }}>
                          {tag}
                        </Tag>
                      ))}
                    </Space>
                    <Space size={4}>
                      <Button type="text" size="small" icon={<EyeOutlined />} onClick={(e) => { e.stopPropagation(); handleCandidateClick(candidate) }} />
                      <Button type="text" size="small" icon={<CalendarOutlined />} onClick={(e) => handleInterview(candidate, e)} />
                    </Space>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </Space>
    </MobilePage>
  )
}

export default MobileCandidates
