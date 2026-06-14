import { Timeline, Tag } from 'antd'
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

interface ProgressItem {
  status: string
  time: string
  description: string
  completed: boolean
}

interface StatusTimelineProps {
  progress: ProgressItem[]
  status?: 'pending' | 'reviewing' | 'processing' | 'completed' | 'rejected'
}

const StatusTimeline = ({ progress, status }: StatusTimelineProps) => {
  const getStatusColor = (item: ProgressItem, index: number) => {
    if (item.completed) return 'green'
    if (status === 'rejected' && index === progress.length - 1) return 'red'
    return 'blue'
  }

  const getStatusIcon = (item: ProgressItem) => {
    if (item.completed) return <CheckCircleOutlined style={{ color: '#52c41a' }} />
    return <ClockCircleOutlined style={{ color: '#1890ff' }} />
  }

  const getStatusTag = (s?: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'default', text: '待受理' },
      reviewing: { color: 'blue', text: '审核中' },
      processing: { color: 'orange', text: '办理中' },
      completed: { color: 'green', text: '已完成' },
      rejected: { color: 'red', text: '已驳回' }
    }
    if (!s) return null
    const info = statusMap[s]
    return info ? <Tag color={info.color}>{info.text}</Tag> : null
  }

  return (
    <div>
      {status && (
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 500 }}>当前状态：</span>
          {getStatusTag(status)}
          {status === 'rejected' && <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
        </div>
      )}
      <Timeline
        items={progress.map((item, index) => ({
          color: getStatusColor(item, index),
          dot: getStatusIcon(item),
          children: (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 500, color: '#262626' }}>{item.status}</span>
                <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                  {dayjs(item.time).format('YYYY-MM-DD HH:mm:ss')}
                </span>
              </div>
              <p style={{ marginTop: 4, color: '#595959', marginBottom: 0 }}>{item.description}</p>
            </div>
          )
        }))}
      />
    </div>
  )
}

export default StatusTimeline
