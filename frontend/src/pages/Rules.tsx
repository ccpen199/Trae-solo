import React, { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Typography,
  Select,
  Button,
  Space,
  message,
  Spin,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Switch,
  Row,
  Col,
  Descriptions,
  Empty,
} from 'antd'
import {
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { useUserStore } from '../stores/userStore'
import { ruleApi } from '../services/api'
import dayjs from 'dayjs'
import type { TablePaginationConfig } from 'antd/es/table'

const { Title } = Typography
const { TextArea } = Input
const { RangePicker } = DatePicker

interface Rule {
  id: string
  ruleCode: string
  name: string
  type: string
  status: string
  description: string
  conditions: any[]
  actions: any[]
  constraints: any
  priority: number
  startDate: string
  endDate: string
  maxTriggers: number
  maxPoints: number
  triggerCount: number
  totalPointsAwarded: number
  operatorId: string
  approvedBy: string
  approvedAt: string
  createdAt: string
  updatedAt: string
}

const Rules: React.FC = () => {
  const { user } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Rule[]>([])
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    keyword: '',
  })
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchRules()
  }, [pagination.current, pagination.pageSize, filters])

  const fetchRules = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      }

      if (filters.type) {
        params.type = filters.type
      }
      if (filters.status) {
        params.status = filters.status
      }
      if (filters.keyword) {
        params.keyword = filters.keyword
      }

      const response = await ruleApi.getRules(params)
      const result = response.data.data
      setData(result?.items || [])
      setPagination((prev) => ({
        ...prev,
        total: result?.total || 0,
      }))
    } catch (error: any) {
      message.error(error.message || '获取规则列表失败')
    } finally {
      setLoading(false)
    }
  }

  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      consumption: '消费积分',
      check_in: '签到奖励',
      birthday: '生日奖励',
      registration: '注册奖励',
      referal: '推荐奖励',
      activity: '活动奖励',
    }
    return typeMap[type] || type
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: '草稿',
      active: '已激活',
      inactive: '已停用',
      expired: '已过期',
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      draft: 'default',
      active: 'success',
      inactive: 'warning',
      expired: 'error',
    }
    return colorMap[status] || 'default'
  }

  const handleActivate = async (rule: Rule) => {
    try {
      await ruleApi.activateRule(rule.id)
      message.success('规则已激活')
      fetchRules()
    } catch (error: any) {
      message.error(error.message || '激活失败')
    }
  }

  const handleDeactivate = async (rule: Rule) => {
    try {
      await ruleApi.deactivateRule(rule.id)
      message.success('规则已停用')
      fetchRules()
    } catch (error: any) {
      message.error(error.message || '停用失败')
    }
  }

  const handleDelete = async (rule: Rule) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除规则后无法恢复，是否继续？',
      onOk: async () => {
        try {
          await ruleApi.deleteRule(rule.id)
          message.success('规则已删除')
          fetchRules()
        } catch (error: any) {
          message.error(error.message || '删除失败')
        }
      },
    })
  }

  const handleCreate = async (values: any) => {
    try {
      const data: any = {
        ruleCode: values.ruleCode,
        name: values.name,
        type: values.type,
        description: values.description,
        priority: values.priority || 1,
        maxTriggers: values.maxTriggers,
        maxPoints: values.maxPoints,
        conditions: [],
        actions: [
          {
            type: 'award_points',
            points: values.points || 0,
          },
        ],
        constraints: {},
      }

      if (values.dateRange) {
        data.startDate = values.dateRange[0]?.toISOString()
        data.endDate = values.dateRange[1]?.toISOString()
      }

      await ruleApi.createRule(data)
      message.success('规则创建成功')
      setCreateModalVisible(false)
      form.resetFields()
      fetchRules()
    } catch (error: any) {
      message.error(error.message || '创建失败')
    }
  }

  const columns = [
    {
      title: '规则编码',
      dataIndex: 'ruleCode',
      key: 'ruleCode',
      width: 180,
    },
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => getTypeText(type),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
    },
    {
      title: '触发次数',
      dataIndex: 'triggerCount',
      key: 'triggerCount',
      width: 100,
    },
    {
      title: '总发放积分',
      dataIndex: 'totalPointsAwarded',
      key: 'totalPointsAwarded',
      width: 120,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      fixed: 'right',
      render: (_: any, record: Rule) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedRule(record)
              setDetailVisible(true)
            }}
          >
            详情
          </Button>

          {record.status === 'draft' && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleActivate(record)}
            >
              激活
            </Button>
          )}

          {record.status === 'active' && (
            <Button
              type="link"
              size="small"
              icon={<PauseCircleOutlined />}
              onClick={() => handleDeactivate(record)}
            >
              停用
            </Button>
          )}

          {['draft', 'inactive'].includes(record.status) && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const handleTableChange = (pag: TablePaginationConfig) => {
    setPagination((prev) => ({
      ...prev,
      current: pag.current,
      pageSize: pag.pageSize,
    }))
  }

  return (
    <Spin spinning={loading}>
      <Title level={4} style={{ marginBottom: 24 }}>
        规则配置
      </Title>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            style={{ width: 150 }}
            placeholder="规则类型"
            allowClear
            value={filters.type || undefined}
            onChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
          >
            <Select.Option value="consumption">消费积分</Select.Option>
            <Select.Option value="check_in">签到奖励</Select.Option>
            <Select.Option value="birthday">生日奖励</Select.Option>
            <Select.Option value="registration">注册奖励</Select.Option>
            <Select.Option value="referal">推荐奖励</Select.Option>
            <Select.Option value="activity">活动奖励</Select.Option>
          </Select>

          <Select
            style={{ width: 150 }}
            placeholder="状态"
            allowClear
            value={filters.status || undefined}
            onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
          >
            <Select.Option value="draft">草稿</Select.Option>
            <Select.Option value="active">已激活</Select.Option>
            <Select.Option value="inactive">已停用</Select.Option>
            <Select.Option value="expired">已过期</Select.Option>
          </Select>

          <Input.Search
            placeholder="搜索规则名称或编码"
            style={{ width: 200 }}
            value={filters.keyword || undefined}
            onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
            onSearch={() => fetchRules()}
          />

          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => setCreateModalVisible(true)}
          >
            新建规则
          </Button>

          <Button
            icon={<ReloadOutlined />}
            onClick={fetchRules}
          >
            刷新
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1600 }}
        />
      </Card>

      <Modal
        title="新建规则"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="ruleCode"
            label="规则编码"
            rules={[{ required: true, message: '请输入规则编码' }]}
          >
            <Input placeholder="如：CONSUMPTION_DEFAULT" />
          </Form.Item>

          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="如：消费积分规则" />
          </Form.Item>

          <Form.Item
            name="type"
            label="规则类型"
            rules={[{ required: true, message: '请选择规则类型' }]}
          >
            <Select placeholder="请选择">
              <Select.Option value="consumption">消费积分</Select.Option>
              <Select.Option value="check_in">签到奖励</Select.Option>
              <Select.Option value="birthday">生日奖励</Select.Option>
              <Select.Option value="registration">注册奖励</Select.Option>
              <Select.Option value="referal">推荐奖励</Select.Option>
              <Select.Option value="activity">活动奖励</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="规则描述"
            rules={[{ required: true, message: '请输入规则描述' }]}
          >
            <TextArea rows={3} placeholder="请描述规则内容" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="points"
                label="奖励积分"
                rules={[{ required: true, message: '请输入奖励积分' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="如：10" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                initialValue={1}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} placeholder="数值越大优先级越高" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="dateRange"
            label="有效日期范围"
          >
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="maxTriggers"
                label="最大触发次数"
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="不限制则留空" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxPoints"
                label="最大发放积分"
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="不限制则留空" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button
              onClick={() => setCreateModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              确认创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="规则详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {selectedRule && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="规则编码" span={2}>
              {selectedRule.ruleCode}
            </Descriptions.Item>
            <Descriptions.Item label="规则名称">
              {selectedRule.name}
            </Descriptions.Item>
            <Descriptions.Item label="类型">
              {getTypeText(selectedRule.type)}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getStatusColor(selectedRule.status)}>
                {getStatusText(selectedRule.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="优先级">
              {selectedRule.priority}
            </Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>
              {selectedRule.description}
            </Descriptions.Item>
            <Descriptions.Item label="触发次数">
              {selectedRule.triggerCount}
            </Descriptions.Item>
            <Descriptions.Item label="总发放积分">
              {selectedRule.totalPointsAwarded}
            </Descriptions.Item>
            <Descriptions.Item label="开始日期">
              {selectedRule.startDate ? dayjs(selectedRule.startDate).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="结束日期">
              {selectedRule.endDate ? dayjs(selectedRule.endDate).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {selectedRule.createdAt ? dayjs(selectedRule.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="最后更新">
              {selectedRule.updatedAt ? dayjs(selectedRule.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Spin>
  )
}

export default Rules
