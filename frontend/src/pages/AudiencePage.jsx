import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Select, InputNumber, Button, Space, Tag, Table, Statistic, message, Divider } from 'antd'
import { SearchOutlined, UserOutlined } from '@ant-design/icons'
import api from '../api.js'

export default function AudiencePage() {
  const [tags, setTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [excludeTags, setExcludeTags] = useState([])
  const [minLevel, setMinLevel] = useState(1)
  const [lastVisitDays, setLastVisitDays] = useState(0)
  const [result, setResult] = useState(null)
  const [users, setUsers] = useState([])
  const [userPage, setUserPage] = useState(1)
  const [userTotal, setUserTotal] = useState(0)

  useEffect(() => {
    api.get('/tags').then(res => setTags(res.list)).catch(() => {})
    api.get('/users', { params: { page: 1, pageSize: 20 } }).then(res => {
      setUsers(res.list)
      setUserTotal(res.total)
    }).catch(() => {})
  }, [])

  const handleCompute = async () => {
    const config = {
      tags: selectedTags,
      minLevel,
      lastVisitDays,
      exclude: { tags: excludeTags, behaviors: [] }
    }
    try {
      const res = await api.post('/audience/preview', config)
      setResult(res)
      message.success(`预估触达 ${res.estimatedCount} 人`)
    } catch (e) {
      message.error(e.message)
    }
  }

  const handleUserPage = async (page) => {
    setUserPage(page)
    try {
      const res = await api.get('/users', { params: { page, pageSize: 20 } })
      setUsers(res.list)
      setUserTotal(res.total)
    } catch (e) {}
  }

  const userColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '等级', dataIndex: 'level', width: 80, render: (v) => <Tag color="blue">Lv.{v}</Tag> },
    { title: '最近访问', dataIndex: 'last_visit', width: 160 },
    {
      title: '标签', dataIndex: 'tags', width: 300,
      render: (t) => {
        try {
          const arr = JSON.parse(t || '[]')
          return arr.map(tag => <Tag key={tag} color="geekblue">{tag}</Tag>)
        } catch { return '-' }
      }
    }
  ]

  return (
    <div>
      <Row gutter={16}>
        <Col span={10}>
          <Card title="人群圈选条件">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>包含标签</label>
                <Select mode="multiple" placeholder="选择用户标签" style={{ width: '100%' }}
                  value={selectedTags} onChange={setSelectedTags}
                  options={tags.map(t => ({ value: t.name, label: t.name }))} />
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <label style={{ display: 'block', marginBottom: 8 }}>最低会员等级</label>
                  <Select style={{ width: '100%' }} value={minLevel} onChange={setMinLevel}
                    options={[
                      { value: 1, label: '不限' },
                      { value: 2, label: 'Lv.2+' },
                      { value: 3, label: 'Lv.3+' },
                      { value: 4, label: 'Lv.4+' },
                      { value: 5, label: 'Lv.5' }
                    ]} />
                </Col>
                <Col span={12}>
                  <label style={{ display: 'block', marginBottom: 8 }}>最近访问（天）</label>
                  <Select style={{ width: '100%' }} value={lastVisitDays} onChange={setLastVisitDays}
                    options={[
                      { value: 0, label: '不限' },
                      { value: 1, label: '1天内' },
                      { value: 3, label: '3天内' },
                      { value: 7, label: '7天内' },
                      { value: 15, label: '15天内' },
                      { value: 30, label: '30天内' }
                    ]} />
                </Col>
              </Row>
              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>排除标签</label>
                <Select mode="multiple" placeholder="选择排除的标签" style={{ width: '100%' }}
                  value={excludeTags} onChange={setExcludeTags}
                  options={tags.map(t => ({ value: t.name, label: t.name }))} />
              </div>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleCompute}>
                计算预估人群
              </Button>
            </Space>
          </Card>
          {result && (
            <Card title="预估结果" style={{ marginTop: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic title="预计触达人数" value={result.estimatedCount}
                    valueStyle={{ color: '#1677ff', fontSize: 32 }} />
                </Col>
                <Col span={12}>
                  <Statistic title="样本用户数" value={result.sample?.length || 0} />
                </Col>
              </Row>
              {result.sample && result.sample.length > 0 && (
                <>
                  <Divider>样本用户预览</Divider>
                  <div style={{ maxHeight: 300, overflow: 'auto' }}>
                    {result.sample.map(u => (
                      <div key={u.id} style={{ padding: 8, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <UserOutlined />
                        <span style={{ fontWeight: 500 }}>{u.name}</span>
                        <Tag color="blue">Lv.{u.level}</Tag>
                        {u.tags.map(t => <Tag key={t} color="geekblue">{t}</Tag>)}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          )}
        </Col>
        <Col span={14}>
          <Card title={`全量用户列表（共 ${userTotal} 人）`}>
            <Table rowKey="id" columns={userColumns} dataSource={users} size="small"
              locale={{ emptyText: '暂无用户数据，系统将自动同步用户信息和标签' }}
              pagination={{ current: userPage, pageSize: 20, total: userTotal, onChange: handleUserPage }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}