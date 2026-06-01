import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  Form,
  Select,
  Input,
  InputNumber,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Row,
  Col,
  Typography,
  Card,
  Popover,
} from 'antd'

const { Text } = Typography
import type { TablePaginationConfig, TableProps } from 'antd/es/table'
import {
  EyeOutlined,
  MergeOutlined,
  LinkOutlined,
  SearchOutlined,
  ReloadOutlined,
  BugOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type {
  FeedbackItem,
  FeedbackStatus,
  ProblemType,
  Severity,
  SourceChannel,
  ListParams,
} from '@/types'
import { getFeedbacks, mergeFeedbacks, linkDefect, getDefects } from '@/api'
import type { DefectItem } from '@/types'

const { Title } = Typography
const { Option } = Select

const statusMap: Record<FeedbackStatus, { text: string; color: string }> = {
  pending: { text: '待处理', color: 'default' },
  accepted: { text: '已受理', color: 'blue' },
  supplementing: { text: '补充信息', color: 'orange' },
  processing: { text: '处理中', color: 'processing' },
  fixed: { text: '已修复', color: 'success' },
  verifying: { text: '待验证', color: 'cyan' },
  closed: { text: '已关闭', color: 'gray' },
}

const typeMap: Record<ProblemType, { text: string; color: string }> = {
  bug: { text: '功能缺陷', color: 'red' },
  feature: { text: '功能建议', color: 'blue' },
  performance: { text: '性能问题', color: 'orange' },
  ui: { text: '界面问题', color: 'purple' },
  other: { text: '其他', color: 'default' },
}

const severityMap: Record<Severity, { text: string; color: string }> = {
  critical: { text: '致命', color: 'red' },
  major: { text: '严重', color: 'orange' },
  minor: { text: '一般', color: 'blue' },
  trivial: { text: '轻微', color: 'default' },
}

const sourceMap: Record<SourceChannel, string> = {
  web: '网页',
  app: 'APP',
  wechat: '微信',
  email: '邮件',
  phone: '电话',
  other: '其他',
}

const moduleOptions = [
  '用户认证',
  '用户模块',
  '订单模块',
  '支付模块',
  '商品模块',
  '搜索模块',
  '后台管理',
  '其他',
]

const ListPage = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<FeedbackItem[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (t) => `共 ${t} 条`,
  })
  const [sortField, setSortField] = useState<string | undefined>()
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [mergeModalVisible, setMergeModalVisible] = useState(false)
  const [parentId, setParentId] = useState<string | null>(null)
  const [linkModalVisible, setLinkModalVisible] = useState(false)
  const [linkingId, setLinkingId] = useState<string | null>(null)
  const [defectId, setDefectId] = useState('')
  const [defectList, setDefectList] = useState<DefectItem[]>([])
  const [filteredDefectList, setFilteredDefectList] = useState<DefectItem[]>([])
  const [defectLoading, setDefectLoading] = useState(false)

  const fetchData = async (params: ListParams = {}) => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const result = await getFeedbacks({
        page: pagination.current,
        pageSize: pagination.pageSize,
        sortBy: sortField,
        sortOrder: sortOrder,
        ...values,
        ...params,
      })
      setData(result.list)
      setTotal(result.pagination.total)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [pagination.current, pagination.pageSize, sortField, sortOrder])

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }))
    setTimeout(() => fetchData({ page: 1 }), 0)
  }

  const handleReset = () => {
    form.resetFields()
    setPagination((prev) => ({ ...prev, current: 1 }))
    setSortField(undefined)
    setSortOrder(undefined)
    setTimeout(() => fetchData({ page: 1 }), 0)
  }

  const handleTableChange: TableProps<FeedbackItem>['onChange'] = (
    pager,
    _filters,
    sorter
  ) => {
    setPagination(pager)
    if (sorter && !Array.isArray(sorter)) {
      setSortField(sorter.field as string)
      setSortOrder(
        sorter.order === 'ascend' ? 'asc' : sorter.order === 'descend' ? 'desc' : undefined
      )
    } else {
      setSortField(undefined)
      setSortOrder(undefined)
    }
  }

  const handleMerge = async () => {
    if (!parentId || selectedRowKeys.length < 2) {
      message.warning('请选择主反馈和至少一条子反馈')
      return
    }
    const childIds = selectedRowKeys
      .filter((k) => k !== parentId)
      .map((k) => String(k))
    try {
      await mergeFeedbacks(parentId, childIds)
      message.success('合并成功')
      setMergeModalVisible(false)
      setSelectedRowKeys([])
      setParentId(null)
      fetchData()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '合并失败')
    }
  }

  const loadDefects = async () => {
    setDefectLoading(true)
    try {
      const list = await getDefects()
      setDefectList(list)
      setFilteredDefectList(list)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载缺陷列表失败')
    } finally {
      setDefectLoading(false)
    }
  }

  const openLinkDefectModal = (id: string) => {
    setLinkingId(id)
    setDefectId('')
    setLinkModalVisible(true)
    loadDefects()
  }

  const handleLinkDefect = async () => {
    if (!linkingId || !defectId) {
      message.warning('请选择缺陷')
      return
    }
    try {
      await linkDefect(linkingId, defectId)
      const defect = defectList.find(d => d.id === defectId)
      message.success(`成功关联缺陷：${defect?.title || defectId.slice(0, 8)}`)
      setLinkModalVisible(false)
      setLinkingId(null)
      setDefectId('')
      fetchData()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '关联失败')
    }
  }

  const columns: TableProps<FeedbackItem>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => id.slice(0, 8),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'problem_type',
      key: 'problem_type',
      width: 100,
      render: (t: ProblemType) => {
        const info = typeMap[t] || typeMap.other
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '严重级别',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (s: Severity) => {
        const info = severityMap[s] || severityMap.trivial
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: FeedbackStatus) => {
        const info = statusMap[s] || statusMap.pending
        return <Tag color={info.color as any}>{info.text}</Tag>
      },
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 100,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 100,
    },
    {
      title: '影响人数',
      dataIndex: 'affected_users_count',
      key: 'affected_users_count',
      width: 100,
      sorter: true,
      render: (count: number, record: FeedbackItem) => {
        const mergedCount = record.merged_affected_users_count || count
        if (record.merge_parent_id) {
          return (
            <Popover content={`已合并到主反馈，合并后影响人数：${mergedCount}`}>
              <span style={{ color: '#faad14', cursor: 'help' }}>
                <MergeOutlined /> {mergedCount}
              </span>
            </Popover>
          )
        }
        return count
      },
    },
    {
      title: '关联缺陷',
      dataIndex: 'defect_id',
      key: 'defect_id',
      width: 150,
      render: (defectId: string | null) => {
        if (!defectId) {
          return <Text type="secondary" style={{ fontSize: 12 }}>未关联</Text>
        }
        return (
          <Tag color="purple" icon={<BugOutlined />} style={{ margin: 0 }}>
            #{defectId.slice(0, 8)}
          </Tag>
        )
      },
    },
    {
      title: '合并标记',
      key: 'merge_status',
      width: 100,
      render: (_, record: FeedbackItem) => {
        if (record.merge_parent_id) {
          return <Tag color="orange" icon={<MergeOutlined />}>已合并</Tag>
        }
        if (record.merged_children_ids && record.merged_children_ids.length > 0) {
          return (
            <Tag color="green" icon={<MergeOutlined />}>
              主反馈({record.merged_children_ids.length})
            </Tag>
          )
        }
        return <Text type="secondary" style={{ fontSize: 12 }}>独立</Text>
      },
    },
    {
      title: '来源',
      dataIndex: 'source_channel',
      key: 'source_channel',
      width: 80,
      render: (s: SourceChannel) => sourceMap[s] || s,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      sorter: true,
      render: (ts: number) => dayjs(ts).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/detail/${record.id}`)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<LinkOutlined />}
            onClick={() => openLinkDefectModal(record.id)}
          >
            关联缺陷
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>反馈列表</Title>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline">
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col>
              <Form.Item name="module" label="模块">
                <Select placeholder="全部" allowClear style={{ width: 140 }}>
                  {moduleOptions.map((m) => (
                    <Option key={m} value={m}>
                      {m}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="status" label="状态">
                <Select placeholder="全部" allowClear style={{ width: 140 }}>
                  {(Object.keys(statusMap) as FeedbackStatus[]).map((s) => (
                    <Option key={s} value={s}>
                      {statusMap[s].text}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="version" label="版本">
                <Input placeholder="版本号" style={{ width: 140 }} />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="source_channel" label="来源">
                <Select placeholder="全部" allowClear style={{ width: 140 }}>
                  {(Object.keys(sourceMap) as SourceChannel[]).map((s) => (
                    <Option key={s} value={s}>
                      {sourceMap[s]}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item label="影响人数">
                <Space>
                  <Form.Item name="min_affected" noStyle>
                    <InputNumber placeholder="最少" min={0} style={{ width: 90 }} />
                  </Form.Item>
                  <span>-</span>
                  <Form.Item name="max_affected" noStyle>
                    <InputNumber placeholder="最多" min={0} style={{ width: 90 }} />
                  </Form.Item>
                </Space>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="搜索标题" style={{ width: 180 }} />
              </Form.Item>
            </Col>
            <Col>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  搜索
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<MergeOutlined />}
              disabled={selectedRowKeys.length < 2}
              onClick={() => setMergeModalVisible(true)}
            >
              合并选中 ({selectedRowKeys.length})
            </Button>
            {selectedRowKeys.length > 0 && (
              <span style={{ color: '#666' }}>
                已选择 {selectedRowKeys.length} 条
              </span>
            )}
          </Space>
        </div>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          pagination={{ ...pagination, total }}
          onChange={handleTableChange}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          scroll={{ x: 1400 }}
        />
      </Card>
      <Modal
        title="合并反馈"
        open={mergeModalVisible}
        onOk={handleMerge}
        onCancel={() => {
          setMergeModalVisible(false)
          setParentId(null)
        }}
        okText="确认合并"
      >
        <p>已选择 {selectedRowKeys.length} 条反馈，请选择主反馈（其他将合并到此反馈下）：</p>
        <Select
          style={{ width: '100%' }}
          placeholder="请选择主反馈"
          value={parentId}
          onChange={(v) => setParentId(v)}
          options={selectedRowKeys.map((k) => {
            const item = data.find((d) => d.id === k)
            return {
              label: item ? `#${item.id.slice(0, 8)} ${item.title}` : String(k),
              value: String(k),
            }
          })}
        />
      </Modal>
      <Modal
        title="关联缺陷"
        open={linkModalVisible}
        onOk={handleLinkDefect}
        onCancel={() => {
          setLinkModalVisible(false)
          setLinkingId(null)
          setDefectId('')
        }}
        okText="确认关联"
        cancelText="取消"
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">请从下方列表选择要关联的缺陷（仅显示进行中的缺陷），点击行选择</Text>
        </div>
        <Input
          placeholder="搜索缺陷标题..."
          allowClear
          style={{ marginBottom: 12 }}
          onChange={(e) => {
            const keyword = e.target.value.toLowerCase()
            const filtered = defectList.filter(d =>
              d.title.toLowerCase().includes(keyword) ||
              d.id.toLowerCase().includes(keyword)
            )
            setFilteredDefectList(keyword ? filtered : defectList)
          }}
        />
        <Table
          rowKey="id"
          dataSource={filteredDefectList}
          loading={defectLoading}
          pagination={false}
          size="small"
          rowSelection={{
            type: 'radio',
            selectedRowKeys: defectId ? [defectId] : [],
            onChange: (keys) => setDefectId(keys[0] as string),
          }}
          onRow={(record) => ({
            onClick: () => setDefectId(record.id),
            style: { cursor: 'pointer' },
          })}
          scroll={{ y: 300 }}
        >
          <Table.Column
            title="缺陷编号"
            dataIndex="id"
            key="id"
            width={110}
            render={(id: string) => (
              <Text code># {id.slice(0, 8)}</Text>
            )}
          />
          <Table.Column
            title="优先级"
            dataIndex="priority"
            key="priority"
            width={90}
            render={(p: string) => (
              <Tag color={p === 'critical' ? 'red' : p === 'high' ? 'orange' : 'blue'}>
                {p === 'critical' ? '致命' : p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
              </Tag>
            )}
          />
          <Table.Column
            title="状态"
            dataIndex="status"
            key="status"
            width={90}
            render={(s: string) => (
              <Tag color={s === 'open' ? 'default' : 'processing'}>
                {s === 'open' ? '待处理' : '处理中'}
              </Tag>
            )}
          />
          <Table.Column
            title="缺陷标题"
            dataIndex="title"
            key="title"
            ellipsis
          />
          <Table.Column
            title="负责人"
            dataIndex="assignee"
            key="assignee"
            width={100}
            render={(a: string) => a || '-'}
          />
        </Table>
      </Modal>
    </div>
  )
}

export default ListPage
