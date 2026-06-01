import React, { useState, useEffect } from 'react'
import {
  Table, Button, Space, Tag, Modal, Form, Input, Select, DatePicker, message, Popconfirm, Drawer, Descriptions, Row, Col, Slider, Badge, Statistic, Card, Timeline, Alert,
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, PauseCircleOutlined, EyeOutlined,
  UserOutlined, TeamOutlined, GlobalOutlined, ChromeOutlined, PercentageOutlined, ClockCircleOutlined,
  HistoryOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons'
import { strategiesApi, versionsApi } from '../api.js'
import dayjs from 'dayjs'

const STATUS_LABELS = {
  draft: { text: '草稿', color: 'default', icon: <HistoryOutlined /> },
  active: { text: '运行中', color: 'green', icon: <PlayCircleOutlined /> },
  paused: { text: '已暂停', color: 'orange', icon: <PauseCircleOutlined /> },
  closed: { text: '已关闭', color: 'red', icon: <ExclamationCircleOutlined /> },
  rolled_back: { text: '已回滚', color: 'purple', icon: <HistoryOutlined /> },
}

const OPERATOR = 'operator001'

export default function StrategiesPage() {
  const [data, setData] = useState([])
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [scopeOpen, setScopeOpen] = useState(false)
  const [scopeData, setScopeData] = useState(null)
  const [scopeLoading, setScopeLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailData, setDetailData] = useState(null)
  const [form] = Form.useForm()
  const rollbackType = Form.useWatch('rollback_type', form)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [res, vers] = await Promise.all([strategiesApi.list(), versionsApi.list()])
      setData(res)
      setVersions(vers)
    } catch (e) {
      message.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setEditing(record)
    form.setFieldsValue({
      ...record,
      start_time: record.start_time ? dayjs(record.start_time) : null,
      end_time: record.end_time ? dayjs(record.end_time) : null,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        start_time: values.start_time ? values.start_time.toISOString() : null,
        end_time: values.end_time ? values.end_time.toISOString() : null,
        created_by: OPERATOR,
        updated_by: OPERATOR,
      }
      if (editing) {
        await strategiesApi.update(editing.id, payload)
        message.success('策略更新成功，命中范围快照已保存')
      } else {
        await strategiesApi.create(payload)
        message.success('策略创建成功，命中范围快照已保存')
      }
      setModalOpen(false)
      fetchData()
    } catch (e) {
      message.error(e.message)
    }
  }

  const handleDelete = async (id) => {
    try {
      await strategiesApi.remove(id)
      message.success('删除成功')
      fetchData()
    } catch (e) {
      message.error(e.message)
    }
  }

  const handleActivate = async (id) => {
    try {
      await strategiesApi.activate(id, { operator: OPERATOR })
      message.success('策略已激活，发布记录已创建')
      fetchData()
    } catch (e) {
      message.error(e.message)
    }
  }

  const handlePause = async (id) => {
    try {
      await strategiesApi.pause(id, { operator: OPERATOR, reason: '运营手动暂停' })
      message.success('策略已暂停，发布记录已更新')
      fetchData()
    } catch (e) {
      message.error(e.message)
    }
  }

  const showScope = async (id) => {
    setScopeLoading(true)
    setScopeOpen(true)
    try {
      const res = await strategiesApi.hitScope(id)
      setScopeData(res)
    } catch (e) {
      message.error(e.message)
    } finally {
      setScopeLoading(false)
    }
  }

  const showDetail = async (id) => {
    setDetailOpen(true)
    try {
      const res = await strategiesApi.hitScope(id)
      setDetailData(res)
    } catch (e) {
      message.error(e.message)
    }
  }

  const renderStatusTag = (status) => {
    const conf = STATUS_LABELS[status] || STATUS_LABELS.draft
    return (
      <Tag color={conf.color} icon={conf.icon}>
        {conf.text}
      </Tag>
    )
  }

  const renderHitSummary = (record) => {
    const parts = []
    if (record.user_whitelist?.length > 0) {
      parts.push(
        <Tag key="user" icon={<UserOutlined />} color="blue">
          用户×{record.user_whitelist.length}
        </Tag>
      )
    }
    if (record.tenant_whitelist?.length > 0) {
      parts.push(
        <Tag key="tenant" icon={<TeamOutlined />} color="cyan">
          租户×{record.tenant_whitelist.length}
        </Tag>
      )
    }
    if (record.region_whitelist?.length > 0) {
      parts.push(
        <Tag key="region" icon={<GlobalOutlined />} color="geekblue">
          地区×{record.region_whitelist.length}
        </Tag>
      )
    }
    if (record.browser_whitelist?.length > 0) {
      parts.push(
        <Tag key="browser" icon={<ChromeOutlined />} color="purple">
          浏览器×{record.browser_whitelist.length}
        </Tag>
      )
    }
    return <Space size={4}>{parts.length > 0 ? parts : <Tag color="default">全量</Tag>}</Space>
  }

  const columns = [
    { title: '策略名称', dataIndex: 'name', key: 'name', width: 160, fixed: 'left' },
    { title: '版本构建号', dataIndex: 'build_number', key: 'build_number', width: 120 },
    { title: '环境', dataIndex: 'environment', key: 'environment', width: 80, render: (v) => <Tag color="blue">{v}</Tag> },
    {
      title: '命中范围', key: 'hit_scope', width: 280,
      render: (_, r) => renderHitSummary(r),
    },
    {
      title: '流量比例', dataIndex: 'traffic_percentage', key: 'traffic_percentage', width: 100,
      render: (v) => (
        <Tag icon={<PercentageOutlined />} color={v >= 50 ? 'red' : v > 0 ? 'orange' : 'default'}>
          {v}%
        </Tag>
      ),
    },
    {
      title: '时间窗', key: 'time_window', width: 200,
      render: (_, r) => (
        <Space size={4}>
          <ClockCircleOutlined />
          <span>
            {r.start_time ? dayjs(r.start_time).format('MM-DD HH:mm') : '无'}
            <span style={{ margin: '0 4px' }}>~</span>
            {r.end_time ? dayjs(r.end_time).format('MM-DD HH:mm') : '无'}
          </span>
        </Space>
      ),
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (v) => renderStatusTag(v) },
    {
      title: '创建人', dataIndex: 'created_by', key: 'created_by', width: 100,
    },
    {
      title: '操作', key: 'action', width: 260, fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showScope(r.id)}>命中范围</Button>
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => showDetail(r.id)}>复查</Button>
          {r.status === 'draft' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleActivate(r.id)}>激活</Button>
          )}
          {r.status === 'active' && (
            <Button type="link" size="small" icon={<PauseCircleOutlined />} onClick={() => handlePause(r.id)}>暂停</Button>
          )}
          {(r.status === 'draft' || r.status === 'paused') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          )}
          {r.status === 'draft' && (
            <Popconfirm title="确认删除?" onConfirm={() => handleDelete(r.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建策略</Button>
        <Button onClick={fetchData}>刷新</Button>
      </Space>
      <Table rowKey="id" loading={loading} dataSource={data} columns={columns} pagination={{ pageSize: 10 }} scroll={{ x: 1400 }} />

      <Modal
        title={editing ? '编辑策略' : '新建策略'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={750}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="策略名称"
                rules={[
                  { required: true, message: '请输入策略名称' },
                  { min: 2, max: 50, message: '长度 2-50 字符' },
                ]}
              >
                <Input placeholder="例如: 首页V2灰度发布" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="version_id"
                label="关联版本"
                rules={[{ required: true, message: '请选择关联版本' }]}
              >
                <Select
                  options={versions.map(v => ({ value: v.id, label: `${v.build_number} (${v.environment})` }))}
                  showSearch
                  optionFilterProp="label"
                  placeholder="请选择关联的应用版本"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="user_whitelist"
                label="用户白名单"
                initialValue={[]}
                rules={[
                  {
                    validator: (_, value) => {
                      if (value && Array.isArray(value)) {
                        for (const item of value) {
                          if (typeof item !== 'string' || !item.trim()) {
                            return Promise.reject(new Error('用户ID不能为空'))
                          }
                        }
                      }
                      return Promise.resolve()
                    }
                  }
                ]}
              >
                <Select mode="tags" placeholder="输入用户ID后回车，例如: user001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tenant_whitelist"
                label="租户白名单"
                initialValue={[]}
                rules={[
                  {
                    validator: (_, value) => {
                      if (value && Array.isArray(value)) {
                        for (const item of value) {
                          if (typeof item !== 'string' || !item.trim()) {
                            return Promise.reject(new Error('租户ID不能为空'))
                          }
                        }
                      }
                      return Promise.resolve()
                    }
                  }
                ]}
              >
                <Select mode="tags" placeholder="输入租户ID后回车，例如: tenant-001" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="region_whitelist"
                label="地区白名单"
                initialValue={[]}
              >
                <Select mode="tags" placeholder="输入地区代码后回车，例如: cn, us, eu" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="browser_whitelist"
                label="浏览器白名单"
                initialValue={[]}
              >
                <Select mode="tags" placeholder="输入浏览器类型后回车，例如: chrome, firefox" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="traffic_percentage"
            label="流量比例 (%)"
            initialValue={0}
            rules={[
              { required: true, message: '请设置流量比例' },
              { type: 'number', min: 0, max: 100, message: '必须在 0-100 之间' },
            ]}
          >
            <Slider min={0} max={100} marks={{ 0: '0%', 10: '10%', 30: '30%', 50: '50%', 80: '80%', 100: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_time" label="开始时间">
                <DatePicker showTime style={{ width: '100%' }} placeholder="选择生效开始时间" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_time"
                label="结束时间"
                dependencies={['start_time']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || !getFieldValue('start_time')) return Promise.resolve()
                      if (value.isBefore(getFieldValue('start_time'))) {
                        return Promise.reject(new Error('结束时间必须晚于开始时间'))
                      }
                      return Promise.resolve()
                    }
                  })
                ]}
              >
                <DatePicker showTime style={{ width: '100%' }} placeholder="选择生效结束时间" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态" initialValue="draft">
            <Select options={[
              { value: 'draft', label: '草稿' },
            ]} />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            message="保存策略时将自动生成命中范围快照，用于运营复查"
          />
        </Form>
      </Modal>

      <Drawer title="命中范围详情" open={scopeOpen} onClose={() => setScopeOpen(false)} width={700} loading={scopeLoading}>
        {scopeData && (
          <>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="策略状态" value={STATUS_LABELS[scopeData.status]?.text || scopeData.status} />
                </Col>
                <Col span={8}>
                  <Statistic title="关联版本" value={scopeData.version?.build_number || '-'} />
                </Col>
                <Col span={8}>
                  <Statistic title="流量比例" value={scopeData.traffic_percentage} suffix="%" />
                </Col>
              </Row>
            </Card>

            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="当前时间">{dayjs(scopeData.current_time).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="时间窗状态">
                <Badge status={scopeData.in_time_window ? 'success' : 'error'} />
                <span style={{ marginLeft: 8 }}>{scopeData.in_time_window ? '当前在时间窗内，可命中' : '当前不在时间窗内，未命中'}</span>
              </Descriptions.Item>
            </Descriptions>

            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title={<span><UserOutlined /> 用户白名单 ({scopeData.hit_counts.users}人)</span>}>
                  {scopeData.user_whitelist.length > 0 ? (
                    <>
                      <Space wrap>
                        {scopeData.hit_samples.users.map((u, i) => (
                          <Tag key={i} color="blue">{u}</Tag>
                        ))}
                        {scopeData.user_whitelist.length > 5 && (
                          <Tag>等 {scopeData.user_whitelist.length - 5} 个</Tag>
                        )}
                      </Space>
                    </>
                  ) : <Tag color="default">未设置</Tag>}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title={<span><TeamOutlined /> 租户白名单 ({scopeData.hit_counts.tenants}个)</span>}>
                  {scopeData.tenant_whitelist.length > 0 ? (
                    <Space wrap>
                      {scopeData.hit_samples.tenants.map((t, i) => (
                        <Tag key={i} color="cyan">{t}</Tag>
                      ))}
                      {scopeData.tenant_whitelist.length > 5 && (
                        <Tag>等 {scopeData.tenant_whitelist.length - 5} 个</Tag>
                      )}
                    </Space>
                  ) : <Tag color="default">未设置</Tag>}
                </Card>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card size="small" title={<span><GlobalOutlined /> 地区白名单 ({scopeData.hit_counts.regions}个)</span>}>
                  {scopeData.region_whitelist.length > 0 ? (
                    <Space wrap>
                      {scopeData.hit_samples.regions.map((r, i) => (
                        <Tag key={i} color="geekblue">{r}</Tag>
                      ))}
                      {scopeData.region_whitelist.length > 5 && (
                        <Tag>等 {scopeData.region_whitelist.length - 5} 个</Tag>
                      )}
                    </Space>
                  ) : <Tag color="default">未设置</Tag>}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title={<span><ChromeOutlined /> 浏览器白名单 ({scopeData.hit_counts.browsers}个)</span>}>
                  {scopeData.browser_whitelist.length > 0 ? (
                    <Space wrap>
                      {scopeData.hit_samples.browsers.map((b, i) => (
                        <Tag key={i} color="purple">{b}</Tag>
                      ))}
                      {scopeData.browser_whitelist.length > 5 && (
                        <Tag>等 {scopeData.browser_whitelist.length - 5} 个</Tag>
                      )}
                    </Space>
                  ) : <Tag color="default">未设置</Tag>}
                </Card>
              </Col>
            </Row>
            <p style={{ marginTop: 16, padding: 8, background: '#fff7e6', borderRadius: 4 }}>
              {scopeData.hit_condition}
            </p>
          </>
        )}
      </Drawer>

      <Drawer title="运营复查视图" open={detailOpen} onClose={() => setDetailOpen(false)} width={800}>
        {detailData && (
          <>
            <Alert
              type={detailData.status === 'active' ? 'success' : detailData.status === 'paused' ? 'warning' : 'info'}
              showIcon
              icon={detailData.status === 'active' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
              message={`策略状态：${STATUS_LABELS[detailData.status]?.text || detailData.status}`}
              description={detailData.hit_condition}
              style={{ marginBottom: 16 }}
            />

            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="策略名称">{detailData.strategy.name}</Descriptions.Item>
              <Descriptions.Item label="关联版本">{detailData.version?.build_number || '-'}</Descriptions.Item>
              <Descriptions.Item label="版本环境">{detailData.version?.environment || '-'}</Descriptions.Item>
              <Descriptions.Item label="Git提交">{detailData.version?.git_commit || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建人">{detailData.created_by || '-'}</Descriptions.Item>
              <Descriptions.Item label="最后编辑人">{detailData.updated_by || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(detailData.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="最后更新时间">{dayjs(detailData.updated_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">命中范围快照</Divider>
            {detailData.hit_scope_snapshot ? (
              <>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <Card size="small" className="stat-card">
                      <Statistic title="流量比例" value={detailData.hit_scope_snapshot.traffic_percentage} suffix="%" />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" className="stat-card">
                      <Statistic title="用户数量" value={detailData.hit_scope_snapshot.user_count} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" className="stat-card">
                      <Statistic title="租户数量" value={detailData.hit_scope_snapshot.tenant_count} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card size="small" className="stat-card">
                      <Statistic title="地区数量" value={detailData.hit_scope_snapshot.region_count} />
                    </Card>
                  </Col>
                </Row>

                <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="用户白名单">
                    {detailData.hit_scope_snapshot.user_whitelist.length > 0
                      ? detailData.hit_scope_snapshot.user_whitelist.join(', ')
                      : '无'}
                  </Descriptions.Item>
                  <Descriptions.Item label="租户白名单">
                    {detailData.hit_scope_snapshot.tenant_whitelist.length > 0
                      ? detailData.hit_scope_snapshot.tenant_whitelist.join(', ')
                      : '无'}
                  </Descriptions.Item>
                  <Descriptions.Item label="地区白名单">
                    {detailData.hit_scope_snapshot.region_whitelist.length > 0
                      ? detailData.hit_scope_snapshot.region_whitelist.join(', ')
                      : '无'}
                  </Descriptions.Item>
                  <Descriptions.Item label="浏览器白名单">
                    {detailData.hit_scope_snapshot.browser_whitelist.length > 0
                      ? detailData.hit_scope_snapshot.browser_whitelist.join(', ')
                      : '无'}
                  </Descriptions.Item>
                  <Descriptions.Item label="生效时间窗">
                    {detailData.hit_scope_snapshot.start_time
                      ? dayjs(detailData.hit_scope_snapshot.start_time).format('YYYY-MM-DD HH:mm')
                      : '无开始限制'}
                    {' ~ '}
                    {detailData.hit_scope_snapshot.end_time
                      ? dayjs(detailData.hit_scope_snapshot.end_time).format('YYYY-MM-DD HH:mm')
                      : '无结束限制'}
                  </Descriptions.Item>
                  <Descriptions.Item label="快照生成时间">
                    {dayjs(detailData.hit_scope_snapshot.generated_at).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                </Descriptions>
              </>
            ) : (
              <Alert type="warning" message="暂无命中范围快照" />
            )}

            <Divider orientation="left">状态流转</Divider>
            <Timeline>
              <Timeline.Item color="blue">
                <p><strong>创建草稿</strong></p>
                <p>创建人: {detailData.created_by}</p>
                <p>{dayjs(detailData.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
              </Timeline.Item>
              {detailData.status !== 'draft' && (
                <Timeline.Item color="green">
                  <p><strong>激活运行</strong></p>
                  <p>编辑人: {detailData.updated_by}</p>
                </Timeline.Item>
              )}
              {detailData.status === 'paused' && (
                <Timeline.Item color="orange">
                  <p><strong>暂停放量</strong></p>
                  <p>编辑人: {detailData.updated_by}</p>
                </Timeline.Item>
              )}
              {detailData.status === 'rolled_back' && (
                <Timeline.Item color="purple">
                  <p><strong>已回滚</strong></p>
                  <p>编辑人: {detailData.updated_by}</p>
                </Timeline.Item>
              )}
              {detailData.status === 'closed' && (
                <Timeline.Item color="red">
                  <p><strong>已关闭</strong></p>
                  <p>编辑人: {detailData.updated_by}</p>
                </Timeline.Item>
              )}
            </Timeline>
          </>
        )}
      </Drawer>
    </div>
  )
}