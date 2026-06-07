import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, List, Tag, Avatar, Badge, Spin, Empty, message } from 'antd'
import {
  FileTextOutlined,
  CameraOutlined,
  CarOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
  RobotOutlined,
  AuditOutlined,
  BarChartOutlined,
  BellOutlined,
  ClockCircleOutlined,
  IdcardOutlined,
  SafetyOutlined,
  CarOutlined as CarIcon,
} from '@ant-design/icons'
import ServiceCard from '@/components/ServiceCard'
import StatusCard from '@/components/StatusCard'
import { useAuth } from '@/store/auth'
import { getMyTasks, getPendingCount } from '@/api/modules/workflow'
import { getMyCertificates } from '@/api/modules/certificate'
import { getMyPermits } from '@/api/modules/permit'
import type { WorkflowTask, Certificate, PermitApplication } from '@/types'

const businessTypeMap: Record<string, { title: string; path: string; icon: string }> = {
  permit: { title: '进京证', path: '/permit', icon: '📄' },
  violation: { title: '违法举报', path: '/violation', icon: '📷' },
  accident: { title: '事故处理', path: '/accident', icon: '🚗' },
  ebike: { title: '电动车登记', path: '/ebike', icon: '⚡' },
}

const taskTypeColor: Record<string, string> = {
  pending: 'warning',
  rejected: 'error',
  info: 'info',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<WorkflowTask[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [permits, setPermits] = useState<PermitApplication[]>([])
  const [pendingCount, setPendingCount] = useState(0)

  const services = [
    { icon: '📄', title: '进京证', path: '/permit', color: '#0052D9' },
    { icon: '📷', title: '违法随手拍', path: '/violation', color: '#FF7D00' },
    { icon: '🚗', title: '事故处理', path: '/accident', color: '#F53F3F' },
    { icon: '⚡', title: '电动车登记', path: '/ebike', color: '#722ED1' },
    { icon: '📅', title: '预约服务', path: '/appointment', color: '#00B42A' },
    { icon: '🤖', title: '智能问答', path: '/chatbot', color: '#13C2C2' },
    { icon: '✅', title: '审核工作台', path: '/admin', color: '#EB2F96' },
    { icon: '📊', title: '统计看板', path: '/admin/stats', color: '#FA8C16' },
  ]

  const noticeItems = [
    { id: 1, title: '关于2024年第三季度机动车限行调整的通知', date: '2024-09-15', important: true },
    { id: 2, title: '交管服务平台系统升级维护公告', date: '2024-09-12', important: false },
    { id: 3, title: '电动车登记新规实施提醒', date: '2024-09-10', important: false },
  ]

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tasksRes, certsRes, permitsRes, countRes] = await Promise.all([
        getMyTasks({ pageSize: 10, status: 'pending' }),
        getMyCertificates({ pageSize: 10 }),
        getMyPermits({ pageSize: 5 }),
        getPendingCount(),
      ])
      setTasks(tasksRes.list || [])
      setCertificates(certsRes.list || [])
      setPermits(permitsRes.list || [])
      setPendingCount(countRes || 0)
    } catch (err: any) {
      console.error('Fetch dashboard data error:', err)
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleTaskClick = (task: WorkflowTask) => {
    const businessInfo = businessTypeMap[task.businessType]
    if (businessInfo) {
      navigate(`${businessInfo.path}/detail/${task.businessId}`)
    }
  }

  const getTaskType = (task: WorkflowTask): string => {
    if (task.status === 'rejected') return 'error'
    if (task.status === 'pending') return 'warning'
    return 'info'
  }

  const getTaskTagColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'orange',
      approved: 'green',
      rejected: 'red',
      processing: 'blue',
    }
    return map[status] || 'default'
  }

  const getTaskStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '待处理',
      approved: '已通过',
      rejected: '已驳回',
      processing: '处理中',
    }
    return map[status] || status
  }

  const getCertIcon = (certType: string) => {
    if (certType.includes('驾驶') || certType === 'driver_license') return <IdcardOutlined />
    if (certType.includes('行驶') || certType === 'vehicle_license') return <SafetyOutlined />
    if (certType.includes('进京') || certType === 'permit') return <CarIcon />
    return <IdcardOutlined />
  }

  return (
    <div>
      <div className="welcome-banner">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">您好，{user?.name || '用户'} 👋</h1>
          <p className="text-white/80">欢迎使用北京市交管服务平台</p>
          <p className="text-sm text-white/60 mt-2">身份证：{user?.idCard?.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2') || '---'}</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">快捷服务</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {services.map((service, index) => (
            <ServiceCard key={index} {...service} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card
            title={
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-[#0052D9]" />
                <span>我的待办</span>
                <Badge count={pendingCount} size="small" className="ml-2" />
              </div>
            }
            className="mb-6"
            extra={<a className="text-[#0052D9] text-sm cursor-pointer" onClick={() => navigate('/permit')}>查看全部</a>}
          >
            <Spin spinning={loading}>
              {tasks.length > 0 ? (
                <List
                  dataSource={tasks}
                  renderItem={(item) => {
                    const type = getTaskType(item)
                    const businessInfo = businessTypeMap[item.businessType]
                    return (
                      <List.Item
                        className="border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 -mx-4 px-4"
                        onClick={() => handleTaskClick(item)}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              style={{
                                backgroundColor: type === 'error' ? '#F53F3F15' : type === 'warning' ? '#FF7D0015' : '#0052D915',
                                color: type === 'error' ? '#F53F3F' : type === 'warning' ? '#FF7D00' : '#0052D9',
                              }}
                              icon={<ClockCircleOutlined />}
                            />
                          }
                          title={
                            <span className="text-gray-800">
                              {businessInfo?.icon} {item.title || `${businessInfo?.title}待处理`}
                            </span>
                          }
                          description={
                            <span className="text-xs text-gray-400">
                              {item.createdAt ? item.createdAt.split('T')[0] : '刚刚'}
                            </span>
                          }
                        />
                        <Tag color={getTaskTagColor(item.status)}>
                          {getTaskStatusText(item.status)}
                        </Tag>
                      </List.Item>
                    )
                  }}
                />
              ) : (
                <Empty description="暂无待办事项" />
              )}
            </Spin>
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                <BellOutlined className="text-[#0052D9]" />
                <span>通知公告</span>
              </div>
            }
            extra={<a className="text-[#0052D9] text-sm">更多</a>}
          >
            <List
              dataSource={noticeItems}
              renderItem={(item) => (
                <List.Item className="border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 -mx-4 px-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {item.important && <Tag color="red" className="text-xs px-1 py-0">重要</Tag>}
                      <span className="text-sm text-gray-800 truncate">{item.title}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 ml-4 flex-shrink-0">{item.date}</span>
                </List.Item>
              )}
            />
          </Card>
        </div>

        <div>
          <Card
            title={
              <div className="flex items-center gap-2">
                <IdcardOutlined className="text-[#0052D9]" />
                <span>我的证件</span>
              </div>
            }
            className="mb-6"
            extra={<a className="text-[#0052D9] text-sm cursor-pointer" onClick={() => navigate('/permit')}>管理</a>}
          >
            <Spin spinning={loading}>
              <div className="space-y-4">
                {certificates.length > 0 ? (
                  certificates.map((item, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Avatar
                        style={{ backgroundColor: '#0052D915', color: '#0052D9' }}
                        icon={getCertIcon(item.certType)}
                      />
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-gray-800">{item.certName}</div>
                        <div className="text-xs text-gray-400">
                          {item.expireDate ? `有效期至 ${item.expireDate.split('T')[0]}` : '长期有效'}
                        </div>
                      </div>
                      <Tag color={item.status === 'active' ? 'green' : 'default'}>
                        {item.status === 'active' ? '正常' : item.status}
                      </Tag>
                    </div>
                  ))
                ) : permits.length > 0 ? (
                  permits.filter(p => p.status === 'approved').slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Avatar
                        style={{ backgroundColor: '#0052D915', color: '#0052D9' }}
                        icon={<CarIcon />}
                      />
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-gray-800">进京证 - {item.plateNumber}</div>
                        <div className="text-xs text-gray-400">有效期至 {item.endDate}</div>
                      </div>
                      <Tag color="green">正常</Tag>
                    </div>
                  ))
                ) : (
                  <Empty description="暂无证件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </div>
            </Spin>
          </Card>

          <h3 className="text-sm font-semibold text-gray-700 mb-3">数据概览</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatusCard title="本月办理" value={permits.length} unit="件" trend="up" trendValue="15%" color="#0052D9" />
            <StatusCard title="待办事项" value={pendingCount} unit="项" color="#FF7D00" />
            <StatusCard title="有效证件" value={certificates.filter(c => c.status === 'active').length + permits.filter(p => p.status === 'approved').length} unit="个" color="#00B42A" />
            <StatusCard title="进京证" value={permits.filter(p => p.status === 'approved').length} unit="张" color="#722ED1" />
          </div>
        </div>
      </div>
    </div>
  )
}
