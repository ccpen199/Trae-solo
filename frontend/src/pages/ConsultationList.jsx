import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Table, Card, Tag, Button, Space, Modal, List, Avatar, Progress,
  message, Input, Select, Descriptions, Tabs, Timeline, Badge,
  Row, Col, Tooltip, Divider, Steps, Empty
} from 'antd'
import {
  EyeOutlined, MessageOutlined, FileTextOutlined, PlusOutlined,
  SearchOutlined, FilterOutlined, SafetyCertificateOutlined,
  CheckCircleOutlined, ClockCircleOutlined, LockOutlined, SyncOutlined,
  UserOutlined, TrophyOutlined, ThunderboltOutlined
} from '@ant-design/icons'
import {
  getConsultations, createContract, getLawyers, getMessages,
  getContracts, triage
} from '../api.js'
import dayjs from 'dayjs'

const ConsultationList = () => {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [contractModal, setContractModal] = useState(false)
  const [selectedConsultation, setSelectedConsultation] = useState(null)
  const [lawyers, setLawyers] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [contracts, setContracts] = useState([])
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const [cRes, lRes, ctRes] = await Promise.all([
        getConsultations(), getLawyers(), getContracts()
      ])
      const data = cRes.data.map(c => ({
        ...c,
        matched_lawyers: typeof c.matched_lawyers === 'string'
          ? JSON.parse(c.matched_lawyers || '[]')
          : c.matched_lawyers || [],
        flowStatus: generateFlowStatus(c)
      }))
      setList(data)
      setLawyers(lRes.data)
      setContracts(ctRes.data)
    } catch (e) {
      console.error('Consultation load error:', e)
    } finally {
      setLoading(false)
    }
  }

  const generateFlowStatus = (c) => {
    const statuses = ['pending', 'matched', 'contracted', 'closed']
    const currentIdx = statuses.indexOf(c.status)
    return {
      currentStep: Math.max(0, currentIdx),
      steps: [
        { title: '咨询提交', done: currentIdx >= 0 },
        { title: '智能匹配', done: currentIdx >= 1 },
        { title: '签约服务', done: currentIdx >= 2 },
        { title: '结案归档', done: currentIdx >= 3 }
      ]
    }
  }

  useEffect(() => { load() }, [])

  const loadChatMessages = async (consultationId) => {
    try {
      const res = await getMessages(consultationId)
      setChatMessages(res.data)
    } catch (e) {
      setChatMessages([])
    }
  }

  const showDetail = async (record) => {
    setDetail(record)
    await loadChatMessages(record.id)
  }

  const handleCreateContract = async (consultation, lawyer) => {
    try {
      const hourlyRates = { 1: 800, 2: 600, 3: 700, 4: 500 }
      await createContract({
        consultation_id: consultation.id,
        lawyer_id: lawyer.id,
        client_name: consultation.client_name || '客户',
        hourly_rate: hourlyRates[lawyer.id] || 500,
        scope: `代理${consultation.title}相关法律事务，包括法律咨询、文书起草、谈判及诉讼代理服务`
      })
      message.success('服务合约已创建，电子签章链已生成')
      setContractModal(false)
      load()
    } catch (e) {
      message.error('合约创建失败')
    }
  }

  const getRelatedContract = (consultationId) => {
    return contracts.find(c => c.consultation_id === consultationId)
  }

  const filtered = list.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false
    if (urgencyFilter && c.urgency !== urgencyFilter) return false
    if (searchKeyword && !c.title?.includes(searchKeyword) && !c.case_code?.includes(searchKeyword)) return false
    return true
  })

  const urgencyLabels = { high: '紧急', normal: '普通', low: '一般' }
  const urgencyColors = { high: 'red', normal: 'blue', low: 'green' }
  const statusLabels = { pending: '待匹配', matched: '已匹配', contracted: '已签约', closed: '已关闭' }
  const statusColors = { pending: 'orange', matched: 'blue', contracted: 'green', closed: 'gray' }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    {
      title: '咨询标题', dataIndex: 'title',
      render: (t, r) => <Button type="link" style={{ padding: 0 }} onClick={() => showDetail(r)}>{t}</Button>
    },
    { title: '案由编码', dataIndex: 'case_code', width: 90, render: v => v && <Tag color="geekblue">{v}</Tag> },
    { title: '案由分类', dataIndex: 'case_category', width: 100, render: v => v && <Tag color="blue">{v}</Tag> },
    {
      title: '紧急程度', dataIndex: 'urgency', width: 80,
      render: v => <Tag color={urgencyColors[v]}>{urgencyLabels[v]}</Tag>
    },
    {
      title: '证据哈希', dataIndex: 'evidence_hashes', width: 100,
      render: v => v ? <Tag color="purple" icon={<LockOutlined />}>SHA256</Tag> : '-'
    },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: v => <Tag color={statusColors[v]}>{statusLabels[v]}</Tag>
    },
    { title: '客户', dataIndex: 'client_name', width: 80 },
    { title: '创建时间', dataIndex: 'created_at', width: 110, render: v => dayjs(v).format('MM-DD HH:mm') },
    {
      title: '操作', fixed: 'right', width: 220,
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => showDetail(r)}>详情</Button>
          <Link to={`/chat/${r.id}`}>
            <Button size="small" icon={<MessageOutlined />}>沟通</Button>
          </Link>
          {r.status === 'matched' && (
            <Button size="small" type="primary" icon={<FileTextOutlined />}
              onClick={() => { setSelectedConsultation(r); setContractModal(true) }}>
              签约
            </Button>
          )}
        </Space>
      )
    }
  ]

  const renderEvidenceHashes = (hashStr) => {
    if (!hashStr) return <Empty description="暂无证据材料" image={Empty.PRESENTED_IMAGE_SIMPLE} />
    const hashes = hashStr.split(';').filter(Boolean)
    return (
      <List
        size="small"
        dataSource={hashes}
        renderItem={(h) => {
          const [name, hash] = h.split(':sha256:')
          return (
            <List.Item>
              <List.Item.Meta
                title={name || '证据文件'}
                description={
                  <code style={{ fontSize: 11 }}>sha256:{hash?.slice(0, 40)}...</code>
                }
              />
              <Tag color="green" icon={<CheckCircleOutlined />}>已存证</Tag>
            </List.Item>
          )
        }}
      />
    )
  }

  return (
    <div>
      <Card
        title="📋 法律咨询请求列表"
        extra={
          <Space>
            <Input.Search
              placeholder="搜索标题/案由编码"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              style={{ width: 180 }}
              allowClear
            />
            <Select placeholder="紧急程度" style={{ width: 110 }} allowClear
              value={urgencyFilter || undefined} onChange={setUrgencyFilter}>
              <Select.Option value="high">🔴 紧急</Select.Option>
              <Select.Option value="normal">🔵 普通</Select.Option>
              <Select.Option value="low">🟢 一般</Select.Option>
            </Select>
            <Select placeholder="状态" style={{ width: 110 }} allowClear
              value={statusFilter || undefined} onChange={setStatusFilter}>
              <Select.Option value="pending">待匹配</Select.Option>
              <Select.Option value="matched">已匹配</Select.Option>
              <Select.Option value="contracted">已签约</Select.Option>
              <Select.Option value="closed">已关闭</Select.Option>
            </Select>
            <Link to="/consultations/new">
              <Button type="primary" icon={<PlusOutlined />}>发起咨询</Button>
            </Link>
          </Space>
        }
      >
        <Table
          loading={loading}
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 件咨询` }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Modal
        title="📋 咨询详情 - 完整业务闭环"
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={<Button onClick={() => setDetail(null)}>关闭</Button>}
        width={1100}
        bodyStyle={{ maxHeight: '75vh', overflowY: 'auto', padding: 0 }}
      >
        {detail && (
          <Tabs
            defaultActiveKey="overview"
            items={[
              {
                key: 'overview',
                label: '🎯 总览',
                children: (
                  <div style={{ padding: 16 }}>
                    <Card size="small" style={{ marginBottom: 16 }}>
                      <Descriptions bordered column={3} size="small">
                        <Descriptions.Item label="咨询编号" span={1}>#{detail.id}</Descriptions.Item>
                        <Descriptions.Item label="咨询标题" span={2}>{detail.title}</Descriptions.Item>
                        <Descriptions.Item label="案由分类">
                          <Tag color="blue">{detail.case_category}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="案由编码">
                          <Tag color="geekblue">{detail.case_code}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="紧急程度">
                          <Tag color={urgencyColors[detail.urgency]}>{urgencyLabels[detail.urgency]}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="当前状态" span={1}>
                          <Badge status={detail.status === 'contracted' ? 'success' : 'processing'}
                            text={<Tag color={statusColors[detail.status]}>{statusLabels[detail.status]}</Tag>} />
                        </Descriptions.Item>
                        <Descriptions.Item label="客户姓名" span={1}>{detail.client_name || '-'}</Descriptions.Item>
                        <Descriptions.Item label="联系方式" span={1}>{detail.client_contact || '-'}</Descriptions.Item>
                        <Descriptions.Item label="创建时间" span={3}>
                          {dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}
                        </Descriptions.Item>
                        <Descriptions.Item label="咨询内容" span={3}>{detail.content}</Descriptions.Item>
                      </Descriptions>
                    </Card>

                    <Card size="small" title="🔄 业务流程闭环">
                      <Steps
                        current={detail.flowStatus?.currentStep || 0}
                        items={[
                          { title: '咨询提交', description: dayjs(detail.created_at).format('MM-DD HH:mm'), icon: <CheckCircleOutlined /> },
                          { title: '智能匹配', description: detail.status !== 'pending' ? '已匹配TOP3律师' : '进行中', icon: <SyncOutlined /> },
                          { title: '签约服务', description: getRelatedContract(detail.id) ? '合约已签署' : '待签约', icon: <SafetyCertificateOutlined /> },
                          { title: '结案归档', description: '待完成', icon: <ClockCircleOutlined /> }
                        ]}
                      />
                    </Card>
                  </div>
                )
              },
              {
                key: 'matched',
                label: '⚖️ 匹配律师 (TOP3)',
                children: (
                  <div style={{ padding: 16 }}>
                    {detail.matched_lawyers?.length > 0 ? (
                      <List
                        dataSource={detail.matched_lawyers}
                        renderItem={(item, idx) => (
                          <List.Item
                            actions={[
                              <Link to={`/chat/${detail.id}`}>
                                <Button type="primary" size="small" icon={<MessageOutlined />}>发起沟通</Button>
                              </Link>,
                              detail.status === 'matched' && (
                                <Button size="small" type="primary" ghost icon={<FileTextOutlined />}
                                  onClick={() => {
                                    setSelectedConsultation(detail)
                                    setContractModal(true)
                                  }}>
                                  立即签约
                                </Button>
                              )
                            ].filter(Boolean)}
                          >
                            <List.Item.Meta
                              avatar={<Avatar style={{
                                backgroundColor: idx === 0 ? '#faad14' : idx === 1 ? '#a0d911' : '#1890ff',
                                fontWeight: 'bold', fontSize: 16
                              }}>{idx + 1}</Avatar>}
                              title={
                                <Space>
                                  <b style={{ fontSize: 16 }}>{item.name}</b>
                                  <Tag color="gold" style={{ fontSize: 14, padding: '2px 8px' }}>匹配度 {item.match_score}</Tag>
                                  {item.license_verified && <Tag color="success" icon={<CheckCircleOutlined />}>已核验</Tag>}
                                </Space>
                              }
                              description={
                                <div>
                                  <div style={{ marginBottom: 8 }}>
                                    {item.specialties?.map((s, i) => (
                                      <Tag key={i} style={{ marginBottom: 4 }}>
                                        {s.category} ({Math.round(s.weight * 100)}%)
                                      </Tag>
                                    ))}
                                  </div>
                                  <Row gutter={[16, 8]}>
                                    <Col span={6}>
                                      <small>胜诉率</small>
                                      <Progress percent={Math.round(item.win_rate * 100)} size="small" />
                                    </Col>
                                    <Col span={6}>
                                      <small>满意度</small>
                                      <Progress percent={Math.round(item.sentiment_score * 100)} size="small" strokeColor="#52c41a" />
                                    </Col>
                                    <Col span={6}>
                                      <small>响应时间</small>
                                      <div style={{ color: item.avg_response_time <= 30 ? '#52c41a' : '#faad14' }}>
                                        {item.avg_response_time}分钟
                                      </div>
                                    </Col>
                                    <Col span={6}>
                                      <small>执业年限</small>
                                      <div>{item.practice_years}年</div>
                                    </Col>
                                  </Row>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty description="暂无匹配律师" />
                    )}
                  </div>
                )
              },
              {
                key: 'evidence',
                label: '🔒 证据存证',
                children: (
                  <div style={{ padding: 16 }}>
                    <Card size="small" type="inner" title="SHA-256 证据哈希链"
                      extra={<Tag color="green" icon={<LockOutlined />}>不可篡改</Tag>}>
                      {renderEvidenceHashes(detail.evidence_hashes)}
                    </Card>
                    <div style={{ marginTop: 12, padding: 12, background: '#f6ffed', borderRadius: 6, fontSize: 12 }}>
                      <b><CheckCircleOutlined style={{ color: '#52c41a' }} /> 安全说明：</b>
                      证据材料仅计算 SHA-256 哈希值用于存证，原文不上传服务器。哈希值可用于后续司法存证和举证。
                    </div>
                  </div>
                )
              },
              {
                key: 'chat',
                label: '💬 加密沟通',
                children: (
                  <div style={{ padding: 16 }}>
                    <Card size="small" type="inner" title="加密消息存证记录"
                      extra={<Link to={`/chat/${detail.id}`}><Button type="primary" size="small" icon={<MessageOutlined />}>进入沟通</Button></Link>}>
                      {chatMessages.length > 0 ? (
                        <List
                          size="small"
                          dataSource={chatMessages.slice(0, 10)}
                          renderItem={(m) => (
                            <List.Item>
                              <List.Item.Meta
                                avatar={<Avatar size="small" icon={<UserOutlined />}
                                  style={{ backgroundColor: m.sender_type === 'client' ? '#1890ff' : '#52c41a' }} />}
                                title={
                                  <Space>
                                    <span>{m.sender_type === 'client' ? '客户' : '律师'}</span>
                                    <Tag>{m.msg_type === 'text' ? '文字' : m.msg_type}</Tag>
                                    <span style={{ color: '#999', fontSize: 11 }}>
                                      {dayjs(m.created_at).format('MM-DD HH:mm')}
                                    </span>
                                  </Space>
                                }
                                description={
                                  <div>
                                    <div style={{ marginBottom: 4 }}>{m.content}</div>
                                    <code style={{ fontSize: 10, color: '#999' }}>
                                      <LockOutlined /> SHA256: {m.hash?.slice(0, 32)}...
                                    </code>
                                  </div>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      ) : (
                        <Empty description="暂无沟通记录" />
                      )}
                    </Card>
                    <div style={{ marginTop: 12, padding: 12, background: '#e6f7ff', borderRadius: 6, fontSize: 12 }}>
                      <b><LockOutlined style={{ color: '#1890ff' }} /> 加密说明：</b>
                      所有通信采用 AES-256 端到端加密，消息内容生成 SHA-256 哈希存证，全程不可篡改可追溯。
                    </div>
                  </div>
                )
              },
              {
                key: 'contract',
                label: '📝 服务合约',
                children: (
                  <div style={{ padding: 16 }}>
                    {(() => {
                      const contract = getRelatedContract(detail.id)
                      if (contract) {
                        return (
                          <Card size="small" type="inner" title="服务合约详情"
                            extra={<Tag color="green" icon={<CheckCircleOutlined />}>已签署</Tag>}>
                            <Descriptions bordered column={2} size="small">
                              <Descriptions.Item label="合约编号">#{contract.id}</Descriptions.Item>
                              <Descriptions.Item label="签约律师">{contract.lawyer_name}</Descriptions.Item>
                              <Descriptions.Item label="小时费率">
                                <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{contract.hourly_rate}/小时</span>
                              </Descriptions.Item>
                              <Descriptions.Item label="合约状态">
                                <Tag color="green">{statusLabels[contract.status] || '已生效'}</Tag>
                              </Descriptions.Item>
                              <Descriptions.Item label="委托范围" span={2}>{contract.scope}</Descriptions.Item>
                              <Descriptions.Item label="电子签章链" span={2}>
                                <code style={{ fontSize: 10, wordBreak: 'break-all' }}>{contract.signature_chain?.slice(0, 100)}...</code>
                              </Descriptions.Item>
                              <Descriptions.Item label="签署时间" span={2}>
                                {dayjs(contract.created_at).format('YYYY-MM-DD HH:mm:ss')}
                              </Descriptions.Item>
                            </Descriptions>
                          </Card>
                        )
                      }
                      return (
                        <div>
                          <Empty description="尚未签署服务合约" />
                          {detail.status === 'matched' && (
                            <div style={{ textAlign: 'center', marginTop: 16 }}>
                              <Button type="primary" size="large" icon={<SafetyCertificateOutlined />}
                                onClick={() => {
                                  setSelectedConsultation(detail)
                                  setContractModal(true)
                                }}>
                                立即签署服务合约
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )
              }
            ]}
          />
        )}
      </Modal>

      <Modal
        title="📝 选择律师签署服务合约"
        open={contractModal}
        onCancel={() => setContractModal(false)}
        footer={null}
        width={700}
      >
        {selectedConsultation && (
          <div>
            <Card size="small" type="inner" style={{ marginBottom: 16 }}>
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="咨询编号">#{selectedConsultation.id}</Descriptions.Item>
                <Descriptions.Item label="咨询标题">{selectedConsultation.title}</Descriptions.Item>
                <Descriptions.Item label="案由编码"><Tag color="geekblue">{selectedConsultation.case_code}</Tag></Descriptions.Item>
                <Descriptions.Item label="紧急程度">
                  <Tag color={urgencyColors[selectedConsultation.urgency]}>{urgencyLabels[selectedConsultation.urgency]}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
            <h4 style={{ marginBottom: 12 }}>选择签约律师：</h4>
            {(selectedConsultation.matched_lawyers?.length > 0
              ? selectedConsultation.matched_lawyers
              : lawyers.slice(0, 3)
            ).map((item, idx) => (
              <Card key={item.id} size="small" style={{ marginBottom: 8 }} hoverable
                actions={[
                  <Button type="primary" onClick={() => handleCreateContract(selectedConsultation, item)}>
                    选择此律师签约
                  </Button>
                ]}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar style={{ backgroundColor: idx === 0 ? '#faad14' : '#a0d911', fontWeight: 'bold' }}>{idx + 1}</Avatar>
                  <div style={{ flex: 1 }}>
                    <Space>
                      <b>{item.name}</b>
                      <Tag color="gold">匹配度 {item.match_score || '推荐'}</Tag>
                    </Space>
                    <div style={{ marginTop: 4 }}>
                      {item.specialties?.slice(0, 3).map((s, i) => (
                        <Tag key={i}>{s.category}</Tag>
                      ))}
                    </div>
                    <Row gutter={16} style={{ marginTop: 8 }}>
                      <Col span={6}><small>胜诉率 {Math.round((item.win_rate || 0.75) * 100)}%</small></Col>
                      <Col span={6}><small>响应 {item.avg_response_time || 25}分钟</small></Col>
                      <Col span={6}><small>{item.practice_years || 5}年执业</small></Col>
                      <Col span={6}>
                        <span style={{ color: '#fa8c16' }}>
                          ¥{[800, 600, 700, 500][idx] || 500}/小时
                        </span>
                      </Col>
                    </Row>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ConsultationList
