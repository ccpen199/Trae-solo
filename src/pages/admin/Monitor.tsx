import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Select,
  message,
  Modal
} from 'antd'
import {
  AlertOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  BellOutlined,
  CheckCircleOutlined,
  CloseOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { AbnormalAlert } from '../../types'
import dayjs from 'dayjs'

const levelMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  critical: { label: '严重', color: 'red', icon: <ExclamationCircleOutlined /> },
  high: { label: '一般', color: 'orange', icon: <WarningOutlined /> },
  medium: { label: '提醒', color: 'gold', icon: <BellOutlined /> },
  low: { label: '低', color: 'blue', icon: <AlertOutlined /> }
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'orange' },
  processing: { label: '处理中', color: 'blue' },
  ignored: { label: '已忽略', color: 'default' }
}

const alertTypeMap: Record<string, string> = {
  timeout: '超时预警',
  duplicate: '重复申请',
  risk: '风险用户',
  anomaly: '异常操作',
  data: '数据异常'
}

export default function Monitor() {
  const [alerts, setAlerts] = useState<AbnormalAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [levelFilter, setLevelFilter] = useState<string>('')
  const [stats, setStats] = useState({ today: 0, pending: 0, processed: 0 })

  useEffect(() => {
    loadAlerts()
    loadStats()
  }, [pagination.current, pagination.pageSize, levelFilter])

  const loadStats = () => {
    setStats({
      today: 12,
      pending: 8,
      processed: 4
    })
  }

  const loadAlerts = async () => {
    setLoading(true)
    setTimeout(() => {
      const mockAlerts: AbnormalAlert[] = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        taskId: 1000 + i,
        alertType: ['timeout', 'duplicate', 'risk', 'anomaly', 'data'][i % 5] as any,
        level: ['critical', 'high', 'medium', 'low'][i % 4] as any,
        description: `检测到异常情况：${['办理超时', '重复申请', '高风险用户', '异常操作行为', '数据不一致'][i % 5]}，请及时处理。`,
        status: i < 3 ? 'pending' : i < 6 ? 'processing' : 'ignored',
        createdAt: dayjs().subtract(i * 2, 'hour').toISOString()
      }))
      setAlerts(mockAlerts)
      setPagination(prev => ({ ...prev, total: 35 }))
      setLoading(false)
    }, 500)
  }

  const handleMarkProcessed = (record: AbnormalAlert) => {
    Modal.confirm({
      title: '标记处理',
      content: '确定将此预警标记为已处理吗？',
      onOk: () => {
        message.success('已标记为处理')
        loadAlerts()
      }
    })
  }

  const handleIgnore = (record: AbnormalAlert) => {
    Modal.confirm({
      title: '忽略预警',
      content: '确定忽略此预警吗？',
      onOk: () => {
        message.success('已忽略')
        loadAlerts()
      }
    })
  }

  const columns = [
    {
      title: '预警级别',
      dataIndex: 'level',
      width: 100,
      render: (level: string) => {
        const config = levelMap[level] || levelMap.low
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        )
      }
    },
    {
      title: '预警类型',
      dataIndex: 'alertType',
      width: 120,
      render: (type: string) => alertTypeMap[type] || type
    },
    {
      title: '预警描述',
      dataIndex: 'description',
      ellipsis: true
    },
    {
      title: '关联任务',
      dataIndex: 'taskId',
      width: 100,
      render: (id: number) => id ? `NO.${id}` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusMap[status] || { label: status, color: 'default' }
        return <Tag color={config.color}>{config.label}</Tag>
      }
    },
    {
      title: '预警时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: AbnormalAlert) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleMarkProcessed(record)}
              >
                处理
              </Button>
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleIgnore(record)}
              >
                忽略
              </Button>
            </>
          )}
        </Space>
      )
    }
  ]

  const trendChartOption = {
    title: {
      text: '预警趋势',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['严重', '一般', '提醒'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '严重',
        type: 'line',
        data: [2, 1, 3, 2, 4, 3, 2],
        lineStyle: { color: '#ff4d4f' },
        itemStyle: { color: '#ff4d4f' }
      },
      {
        name: '一般',
        type: 'line',
        data: [5, 3, 8, 6, 7, 5, 4],
        lineStyle: { color: '#faad14' },
        itemStyle: { color: '#faad14' }
      },
      {
        name: '提醒',
        type: 'line',
        data: [10, 8, 15, 12, 18, 14, 10],
        lineStyle: { color: '#1890ff' },
        itemStyle: { color: '#1890ff' }
      }
    ]
  }

  const levelChartOption = {
    title: {
      text: '预警级别分布',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '预警级别',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 10, name: '严重', itemStyle: { color: '#ff4d4f' } },
          { value: 35, name: '一般', itemStyle: { color: '#faad14' } },
          { value: 55, name: '提醒', itemStyle: { color: '#1890ff' } }
        ]
      }
    ]
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card size="small">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertOutlined className="text-2xl text-red-500" />
            </div>
            <div>
              <div className="text-sm text-gray-500">今日预警</div>
              <div className="text-2xl font-bold text-red-500">{stats.today}</div>
            </div>
          </div>
        </Card>
        <Card size="small">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <WarningOutlined className="text-2xl text-orange-500" />
            </div>
            <div>
              <div className="text-sm text-gray-500">待处理</div>
              <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
            </div>
          </div>
        </Card>
        <Card size="small">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircleOutlined className="text-2xl text-green-500" />
            </div>
            <div>
              <div className="text-sm text-gray-500">已处理</div>
              <div className="text-2xl font-bold text-green-500">{stats.processed}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card>
          <ReactECharts option={trendChartOption} style={{ height: 280 }} />
        </Card>
        <Card>
          <ReactECharts option={levelChartOption} style={{ height: 280 }} />
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">异常订单列表</h3>
          <Select
            placeholder="预警级别"
            allowClear
            style={{ width: 120 }}
            value={levelFilter || undefined}
            onChange={(v) => setLevelFilter(v || '')}
          >
            {Object.entries(levelMap).map(([key, value]) => (
              <Select.Option key={key} value={key}>{value.label}</Select.Option>
            ))}
          </Select>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={alerts}
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
          }}
        />
      </Card>
    </div>
  )
}
