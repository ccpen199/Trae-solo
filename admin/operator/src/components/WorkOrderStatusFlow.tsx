import { useState } from 'react'
import {
  Steps,
  Button,
  Space,
  Select,
  Modal,
  Typography,
  theme,
  Dropdown,
  Avatar,
  Popconfirm,
  Tooltip,
  UserOutlined
} from 'antd'
import {
  ClockCircleOutlined,
  UserOutlined as UserIcon,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'

const { Text } = Typography
const { useToken } = theme

type WorkOrderStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'

const statusMeta: Record<WorkOrderStatus, {
  label: string
  title: string
  description: string
  icon: React.ReactNode
}> = {
  pending: {
    label: '待分配',
    title: '创建工单',
    description: '工单已创建，等待分配处理人',
    icon: <ClockCircleOutlined />
  },
  assigned: {
    label: '已分配',
    title: '分配处理人',
    description: '处理人已确认接收工单',
    icon: <UserIcon />
  },
  in_progress: {
    label: '进行中',
    title: '处理中',
    description: '正在现场处理问题',
    icon: <PlayCircleOutlined />
  },
  completed: {
    label: '已完成',
    title: '完成',
    description: '工单处理完成并验收',
    icon: <CheckCircleOutlined />
  },
  cancelled: {
    label: '已取消',
    title: '已取消',
    description: '工单已取消',
    icon: <CloseCircleOutlined />
  }
}

const handlerOptions = [
  { label: '张运维', value: '张运维' },
  { label: '李工程师', value: '李工程师' },
  { label: '王技术员', value: '王技术员' },
  { label: '赵师傅', value: '赵师傅' },
  { label: '刘工', value: '刘工' }
]

interface WorkOrderStatusFlowProps {
  status: WorkOrderStatus
  handler?: string
  onStatusChange: (status: WorkOrderStatus, handler?: string) => void
  disabled?: boolean
  size?: 'small' | 'default'
  showSteps?: boolean
}

function WorkOrderStatusFlow({
  status,
  handler,
  onStatusChange,
  disabled = false,
  size = 'default',
  showSteps = true
}: WorkOrderStatusFlowProps) {
  const { token } = useToken()
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedHandler, setSelectedHandler] = useState<string | undefined>(handler)

  const mainStatuses: WorkOrderStatus[] = ['pending', 'assigned', 'in_progress', 'completed']

  const currentIndex = mainStatuses.indexOf(status)
  const isCancelled = status === 'cancelled'

  const getNextStatus = (): WorkOrderStatus | null => {
    if (isCancelled) return null
    if (currentIndex >= 0 && currentIndex < mainStatuses.length - 1) {
      return mainStatuses[currentIndex + 1]
    }
    return null
  }

  const nextStatus = getNextStatus()

  const handleAssign = () => {
    if (!selectedHandler) return
    onStatusChange('assigned', selectedHandler)
    setAssignModalOpen(false)
  }

  const handleNextStatus = () => {
    if (!nextStatus) return
    if (nextStatus === 'assigned') {
      setAssignModalOpen(true)
      return
    }
    if (nextStatus === 'completed') {
      Modal.confirm({
        title: '确认完成工单？',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        content: '完成后将无法修改状态，请确认所有处理工作已完成并验收通过。',
        okText: '确认完成',
        okButtonProps: { style: { background: '#52c41a' } },
        cancelText: '取消',
        onOk: () => onStatusChange('completed')
      })
      return
    }
    onStatusChange(nextStatus)
  }

  const quickAssignItems: MenuProps['items'] = handlerOptions
    .filter(h => h.value !== handler)
    .map(h => ({
      key: h.value,
      label: (
        <Space size={6}>
          <Avatar size={18} style={{ width: 18, height: 18, fontSize: 9, background: token.colorPrimary }} icon={<UserOutlined />} />
          {h.label}
        </Space>
      )
    }))

  const statusBtnText = (s: WorkOrderStatus) => {
    switch (s) {
      case 'assigned': return '分配处理人'
      case 'in_progress': return '开始处理'
      case 'completed': return '完成工单'
      default: return statusMeta[s].label
    }
  }

  return (
    <div>
      {showSteps && !isCancelled && (
        <Steps
          size={size === 'small' ? 'small' : undefined}
          current={currentIndex}
          items={mainStatuses.map(s => ({
            title: statusMeta[s].label,
            icon: statusMeta[s].icon,
            description: size === 'small' ? undefined : (
              s === status ? (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {statusMeta[s].description}
                </Text>
              ) : undefined
            )
          }))}
          style={{
            marginBottom: 12,
            minWidth: 320,
            maxWidth: 600
          }}
          status={isCancelled ? 'error' : undefined}
        />
      )}

      {showSteps && isCancelled && (
        <Steps
          size={size === 'small' ? 'small' : undefined}
          current={0}
          status="error"
          items={[
            { title: '已取消', icon: <CloseCircleOutlined />, description: '此工单已被取消' }
          ]}
          style={{ marginBottom: 12, minWidth: 200 }}
        />
      )}

      {!disabled && !isCancelled && (
        <Space wrap size={[8, 8]}>
          {status === 'pending' && (
            <>
              <Button
                type="primary"
                icon={<UserIcon />}
                onClick={() => setAssignModalOpen(true)}
                size={size}
              >
                分配处理人
              </Button>
              {handlerOptions.length > 0 && (
                <Dropdown
                  menu={{
                    items: quickAssignItems,
                    onClick: ({ key }) => onStatusChange('assigned', key)
                  }}
                  placement="bottomRight"
                >
                  <Button size={size}>
                    快速分配 <DownOutlined />
                  </Button>
                </Dropdown>
              )}
            </>
          )}

          {handler && status === 'pending' && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              当前处理人：<Text strong>{handler}</Text>
            </Text>
          )}

          {(status === 'assigned' || status === 'pending') && nextStatus === 'in_progress' && (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleNextStatus}
              size={size}
            >
              {statusBtnText(nextStatus)}
            </Button>
          )}

          {status === 'assigned' && (
            <Dropdown
              menu={{
                items: quickAssignItems,
                onClick: ({ key }) => onStatusChange('assigned', key)
              }}
              placement="bottomRight"
            >
              <Button size={size}>
                转交 <DownOutlined />
              </Button>
            </Dropdown>
          )}

          {status === 'in_progress' && nextStatus === 'completed' && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleNextStatus}
              style={{ background: '#52c41a' }}
              size={size}
            >
              {statusBtnText(nextStatus)}
            </Button>
          )}

          {status !== 'completed' && status !== 'cancelled' && (
            <Popconfirm
              title="确认取消工单？"
              description="取消后将无法恢复，只有在确认无需处理时才取消。"
              okText="确认取消"
              okButtonProps={{ danger: true }}
              cancelText="返回"
              onConfirm={() => onStatusChange('cancelled')}
            >
              <Button danger size={size} type="text">
                取消工单
              </Button>
            </Popconfirm>
          )}
        </Space>
      )}

      {isCancelled && !disabled && (
        <Text type="danger" style={{ fontSize: 12 }}>
          <CloseCircleOutlined /> 工单已取消，无法变更状态
        </Text>
      )}

      {disabled && status !== 'completed' && status !== 'cancelled' && (
        <Tooltip title="当前状态不可变更">
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined /> 当前状态：{statusMeta[status].label}
            {handler && ` · 处理人：${handler}`}
          </Text>
        </Tooltip>
      )}

      <Modal
        title={
          <Space>
            <UserIcon style={{ color: '#1890ff' }} />
            {status === 'assigned' ? '转交处理人' : '分配处理人'}
          </Space>
        }
        open={assignModalOpen}
        onCancel={() => setAssignModalOpen(false)}
        onOk={handleAssign}
        okText={status === 'assigned' ? '确认转交' : '确认分配'}
        okButtonProps={{ disabled: !selectedHandler }}
        cancelText="取消"
        destroyOnClose
      >
        <div style={{ padding: '12px 0' }}>
          <Text strong>选择处理人：</Text>
          <Select
            style={{ width: '100%', marginTop: 12 }}
            placeholder="请选择处理人员"
            value={selectedHandler}
            onChange={setSelectedHandler}
            options={handlerOptions}
            size="large"
          />
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 8,
              background: '#f6ffed',
              border: '1px solid #52c41a30',
              fontSize: 12,
              color: '#389e0d'
            }}
          >
            <Text strong>温馨提示：</Text>
            <br />
            分配后将通过系统消息和短信通知处理人，请注意及时跟进工单进度。
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default WorkOrderStatusFlow
