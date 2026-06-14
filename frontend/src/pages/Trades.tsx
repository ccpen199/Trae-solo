import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  Button,
  Select,
  Input,
  Modal,
  Form,
  message,
  Spin,
  Alert,
  Row,
  Col,
  Layout,
  Tree,
  Drawer,
  Descriptions,
  Tag,
  Rate,
  Tabs,
  Typography,
  Progress,
  Space,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  TeamOutlined,
  FileTextOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import type { TreeDataNode } from 'antd'
import ReactECharts from 'echarts-for-react'
import { api } from '@/api'
import type {
  TradeStat,
  TradeDetail,
  WorkerListItem,
  JobRequirementListItem,
} from '@/types'

const { Header, Sider, Content } = Layout
const { Option } = Select
const { TextArea } = Input
const { Title, Text } = Typography

export default function Trades() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trades, setTrades] = useState<TradeStat[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTreeKeys, setSelectedTreeKeys] = useState<string[]>([])
  const [keyword, setKeyword] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTrade, setEditingTrade] = useState<TradeStat | null>(null)
  const [form] = Form.useForm()

  const [drawerVisible, setDrawerVisible] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [tradeDetail, setTradeDetail] = useState<TradeDetail | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchTrades()
  }, [page, selectedCategory, keyword])

  const fetchCategories = async () => {
    try {
      const res = await api.getTradeCategories()
      if (res.code === 0) {
        setCategories(res.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const fetchTrades = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, listRes] = await Promise.all([
        api.getTradeStats(),
        api.getTrades({ page, pageSize, category: selectedCategory || undefined }),
      ])

      if (statsRes.code === 0 && listRes.code === 0) {
        const stats = (statsRes.data as TradeStat[]) || []
        const list = (listRes.data as { list: any[]; total: number }).list || []

        const merged = list.map((item) => {
          const stat = stats.find((s) => s.id === item.id)
          return {
            ...item,
            skill_level: item.skill_level ?? item.skillLevel,
            worker_count: stat?.worker_count || 0,
            job_count: stat?.job_count || 0,
            avg_wage: stat?.avg_wage || 0,
          }
        })

        let filtered = merged
        if (keyword) {
          const kw = keyword.toLowerCase()
          filtered = merged.filter(
            (t) =>
              t.name.toLowerCase().includes(kw) ||
              t.category.toLowerCase().includes(kw) ||
              t.description?.toLowerCase().includes(kw)
          )
        }

        setTrades(filtered)
        setTotal((listRes.data as { total: number }).total || 0)
      } else {
        setError('获取工种列表失败')
      }
    } catch (err: any) {
      setError(err.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  const fetchTradeDetail = async (id: number) => {
    setDetailLoading(true)
    try {
      const res = await api.getTrade(id)
      if (res.code === 0) {
        setTradeDetail(res.data as TradeDetail)
      } else {
        message.error(res.message || '获取详情失败')
      }
    } catch (err: any) {
      message.error(err.message || '网络错误')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setKeyword(value)
    setPage(1)
  }

  const handleCategoryChange = (value: string | null) => {
    setSelectedCategory(value)
    setSelectedTreeKeys(value ? [value] : [])
    setPage(1)
  }

  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    const keys = selectedKeys.map((k) => String(k))
    setSelectedTreeKeys(keys)
    const category = keys[0] || null
    setSelectedCategory(category)
    setPage(1)
  }

  const handleAdd = () => {
    setEditingTrade(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (trade: TradeStat) => {
    setEditingTrade(trade)
    form.setFieldsValue({
      name: trade.name,
      category: trade.category,
      skill_level: trade.skill_level,
      description: trade.description,
    })
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        ...values,
        skillLevel: values.skill_level,
      }

      let res
      if (editingTrade) {
        res = await api.updateTrade(editingTrade.id, submitData)
      } else {
        res = await api.createTrade(submitData)
      }

      if (res.code === 0) {
        message.success(editingTrade ? '编辑工种成功' : '新增工种成功')
        setModalVisible(false)
        fetchCategories()
        fetchTrades()
      } else {
        message.error(res.message || '操作失败')
      }
    } catch (err: any) {
      if (err.errorFields) return
      message.error(err.message || '提交失败')
    }
  }

  const handleViewDetail = (trade: TradeStat) => {
    setTradeDetail(null)
    setDrawerVisible(true)
    fetchTradeDetail(trade.id)
  }

  const handleRowClick = (record: TradeStat) => {
    handleViewDetail(record)
  }

  const handleWorkerCountClick = (e: React.MouseEvent, tradeId: number) => {
    e.stopPropagation()
    navigate(`/workers?tradeId=${tradeId}`)
  }

  const handleJobCountClick = (e: React.MouseEvent, tradeId: number) => {
    e.stopPropagation()
    navigate(`/jobs?tradeId=${tradeId}`)
  }

  const handleViewWorker = (workerId: number) => {
    navigate(`/workers/${workerId}`)
  }

  const handleViewJob = (jobId: number) => {
    navigate(`/jobs/${jobId}`)
  }

  const treeData: TreeDataNode[] = [
    {
      title: '全部分类',
      key: '',
      children: categories.map((cat) => ({
        title: cat,
        key: cat,
      })),
    },
  ]

  const skillLevelMap: Record<number, string> = {
    1: '初级',
    2: '中级',
    3: '高级',
    4: '技师',
    5: '高级技师',
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    draft: { color: 'default', text: '草稿' },
    pending_review: { color: 'processing', text: '待审核' },
    ai_reviewed: { color: 'processing', text: 'AI审核' },
    manual_reviewed: { color: 'processing', text: '人工审核' },
    verified: { color: 'success', text: '已验证' },
    published: { color: 'blue', text: '已发布' },
    filled: { color: 'cyan', text: '已招满' },
    closed: { color: 'default', text: '已关闭' },
  }

  const healthStatusMap: Record<string, { color: string; text: string }> = {
    green: { color: 'success', text: '绿色' },
    yellow: { color: 'warning', text: '黄色' },
    red: { color: 'error', text: '红色' },
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '工种名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '所属分类', dataIndex: 'category', key: 'category', width: 120 },
    {
      title: '技能等级',
      dataIndex: 'skill_level',
      key: 'skill_level',
      width: 150,
      render: (val: number) => (
        <Space>
          <Rate disabled value={val} count={5} style={{ fontSize: 14 }} />
          <Text type="secondary">{skillLevelMap[val] || val}</Text>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '工人数量',
      dataIndex: 'worker_count',
      key: 'worker_count',
      width: 100,
      render: (count: number, record: TradeStat) => (
        <Button
          type="link"
          size="small"
          onClick={(e) => handleWorkerCountClick(e, record.id)}
        >
          <TeamOutlined /> {count || 0}
        </Button>
      ),
    },
    {
      title: '需求数量',
      dataIndex: 'job_count',
      key: 'job_count',
      width: 100,
      render: (count: number, record: TradeStat) => (
        <Button
          type="link"
          size="small"
          onClick={(e) => handleJobCountClick(e, record.id)}
        >
          <FileTextOutlined /> {count || 0}
        </Button>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: TradeStat) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              handleViewDetail(record)
            }}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(record)
            }}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  const workerColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130 },
    {
      title: '证书数',
      dataIndex: 'certificate_count',
      key: 'certificate_count',
      width: 80,
    },
    {
      title: '履约评分',
      dataIndex: 'performance_score',
      key: 'performance_score',
      width: 150,
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          strokeColor={
            score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'
          }
        />
      ),
    },
    {
      title: '健康状态',
      dataIndex: 'health_status',
      key: 'health_status',
      width: 100,
      render: (status: string) => {
        const info = healthStatusMap[status] || healthStatusMap.green
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: WorkerListItem) => (
        <Button type="link" size="small" onClick={() => handleViewWorker(record.id)}>
          查看详情
        </Button>
      ),
    },
  ]

  const jobColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '项目名称', dataIndex: 'project_name', key: 'project_name' },
    {
      title: '招聘人数',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
    },
    {
      title: '日薪',
      dataIndex: 'daily_wage',
      key: 'daily_wage',
      width: 100,
      render: (val: number) => `¥${val}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = statusMap[status] || statusMap.draft
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    { title: '开始日期', dataIndex: 'start_date', key: 'start_date', width: 110 },
    { title: '结束日期', dataIndex: 'end_date', key: 'end_date', width: 110 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: JobRequirementListItem) => (
        <Button type="link" size="small" onClick={() => handleViewJob(record.id)}>
          查看详情
        </Button>
      ),
    },
  ]

  const getWageChartOption = () => {
    if (!tradeDetail?.wage_trend?.length) {
      return {}
    }
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0]
          return `${data.name}<br/>平均日薪: ¥${data.value}`
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: tradeDetail.wage_trend.map((item) => item.month),
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '¥{value}',
        },
      },
      series: [
        {
          name: '平均日薪',
          type: 'line',
          smooth: true,
          data: tradeDetail.wage_trend.map((item) => item.avg_wage),
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
              ],
            },
          },
          lineStyle: {
            color: '#1890ff',
            width: 2,
          },
          itemStyle: {
            color: '#1890ff',
          },
        },
      ],
    }
  }

  const detailTabs = [
    {
      key: 'workers',
      label: (
        <span>
          <TeamOutlined /> 持证工人 ({tradeDetail?.workers?.length || 0})
        </span>
      ),
      children: (
        <Table
          columns={workerColumns}
          dataSource={tradeDetail?.workers || []}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (t) => `共 ${t} 人`,
          }}
          scroll={{ x: 700 }}
        />
      ),
    },
    {
      key: 'jobs',
      label: (
        <span>
          <FileTextOutlined /> 招工需求 ({tradeDetail?.job_requirements?.length || 0})
        </span>
      ),
      children: (
        <Table
          columns={jobColumns}
          dataSource={tradeDetail?.job_requirements || []}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (t) => `共 ${t} 条`,
          }}
          scroll={{ x: 800 }}
        />
      ),
    },
    {
      key: 'wage',
      label: (
        <span>
          <RiseOutlined /> 薪资趋势
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">近12个月平均日薪趋势</Text>
          </div>
          {tradeDetail?.wage_trend?.some((t) => t.avg_wage > 0) ? (
            <ReactECharts
              option={getWageChartOption()}
              style={{ height: 350 }}
              notMerge={true}
              lazyUpdate={true}
            />
          ) : (
            <div
              style={{
                height: 350,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
              }}
            >
              暂无薪资数据
            </div>
          )}
        </div>
      ),
    },
  ]

  return (
    <div style={{ height: '100%' }}>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0 }}>工种管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增工种
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Select
            placeholder="选择分类"
            allowClear
            style={{ width: '100%' }}
            value={selectedCategory}
            onChange={handleCategoryChange}
          >
            {categories.map((cat) => (
              <Option key={cat} value={cat}>
                {cat}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={16}>
          <Input.Search
            placeholder="搜索工种名称、分类、描述"
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
          />
        </Col>
      </Row>

      <Layout style={{ background: 'transparent', minHeight: 600 }}>
        <Sider
          width={220}
          style={{ background: '#fff', borderRadius: 8, marginRight: 16 }}
          theme="light"
        >
          <div style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}>
            <Text strong>工种分类</Text>
          </div>
          <div style={{ padding: 12 }}>
            <Tree
              treeData={treeData}
              selectedKeys={selectedTreeKeys}
              onSelect={handleTreeSelect}
              defaultExpandAll
              blockNode
            />
          </div>
        </Sider>
        <Content style={{ background: '#fff', borderRadius: 8, padding: 16 }}>
          {error && (
            <Alert
              message="错误"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              closable
              onClose={() => setError(null)}
            />
          )}

          <Spin spinning={loading}>
            <Table
              columns={columns}
              dataSource={trades}
              rowKey="id"
              scroll={{ x: 1000 }}
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                style: { cursor: 'pointer' },
              })}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
                onChange: (p) => setPage(p),
              }}
            />
          </Spin>
        </Content>
      </Layout>

      <Modal
        title={editingTrade ? '编辑工种' : '新增工种'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="提交"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="工种名称"
                rules={[{ required: true, message: '请输入工种名称' }]}
              >
                <Input placeholder="请输入工种名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="所属分类"
                rules={[{ required: true, message: '请选择或输入分类' }]}
              >
                <Select
                  placeholder="请选择分类"
                  mode="tags"
                  maxTagCount={1}
                  style={{ width: '100%' }}
                >
                  {categories.map((cat) => (
                    <Option key={cat} value={cat}>
                      {cat}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="skill_level"
                label="技能等级"
                initialValue={1}
                rules={[{ required: true, message: '请选择技能等级' }]}
              >
                <Select placeholder="请选择技能等级" style={{ width: '100%' }}>
                  <Option value={1}>初级 ⭐</Option>
                  <Option value={2}>中级 ⭐⭐</Option>
                  <Option value={3}>高级 ⭐⭐⭐</Option>
                  <Option value={4}>技师 ⭐⭐⭐⭐</Option>
                  <Option value={5}>高级技师 ⭐⭐⭐⭐⭐</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述">
            <TextArea placeholder="请输入工种描述" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Title level={4} style={{ margin: 0 }}>
              {tradeDetail?.name || '工种详情'}
            </Title>
            {tradeDetail && (
              <Tag color="blue">{tradeDetail.category}</Tag>
            )}
          </div>
        }
        width={900}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        destroyOnClose
        loading={detailLoading}
      >
        {tradeDetail && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="工种ID">{tradeDetail.id}</Descriptions.Item>
              <Descriptions.Item label="所属分类">{tradeDetail.category}</Descriptions.Item>
              <Descriptions.Item label="技能等级">
                <Space>
                  <Rate disabled value={tradeDetail.skill_level} count={5} style={{ fontSize: 14 }} />
                  <Text type="secondary">{skillLevelMap[tradeDetail.skill_level]}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="工人数量">{tradeDetail.worker_count} 人</Descriptions.Item>
              <Descriptions.Item label="需求数量">{tradeDetail.job_count} 条</Descriptions.Item>
              <Descriptions.Item label="创建时间">{tradeDetail.created_at}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {tradeDetail.description || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Tabs items={detailTabs} />
          </div>
        )}
      </Drawer>
    </div>
  )
}
