import { Card, Tag, Space, Avatar } from 'antd'
import { ClockCircleOutlined, TeamOutlined, FireOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { Service } from '@/types'

interface ServiceCardProps {
  service: Service
  onClick?: () => void
}

const ServiceCard = ({ service, onClick }: ServiceCardProps) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      navigate(`/services/${service.id}`)
    }
  }

  return (
    <Card
      className="hover-card card-shadow"
      onClick={handleClick}
      hoverable
      style={{ height: '100%' }}
      bodyStyle={{ padding: 20 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
        <Avatar size={48} style={{ backgroundColor: '#1890ff', fontSize: 24 }}>
          {service.icon || service.name.charAt(0)}
        </Avatar>
        <div style={{ flex: 1 }}>
          <h3
            className="text-ellipsis"
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: '#262626',
              marginBottom: 4
            }}
          >
            {service.name}
          </h3>
          <Space size={8}>
            <Tag color={service.online ? 'green' : 'default'} style={{ margin: 0 }}>
              {service.online ? '可在线办理' : '仅线下办理'}
            </Tag>
            <Tag color="blue" style={{ margin: 0 }}>
              {service.department}
            </Tag>
          </Space>
        </div>
      </div>

      <p
        className="text-ellipsis-2"
        style={{
          color: '#595959',
          marginBottom: 12,
          fontSize: 13,
          lineHeight: 1.6
        }}
      >
        {service.description}
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 12,
          borderTop: '1px solid #f0f0f0'
        }}
      >
        <Space size={16}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8c8c8c', fontSize: 12 }}>
            <ClockCircleOutlined />
            {service.processingTime}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#8c8c8c', fontSize: 12 }}>
            <TeamOutlined />
            {service.handler}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fa8c16', fontSize: 12 }}>
            <FireOutlined />
            {service.heat}
          </span>
        </Space>
        <span style={{ color: '#fa8c16', fontWeight: 500, fontSize: 13 }}>
          {service.fee === '免费' ? '免费' : service.fee}
        </span>
      </div>
    </Card>
  )
}

export default ServiceCard
