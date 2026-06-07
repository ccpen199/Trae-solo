import { useNavigate } from 'react-router-dom'

interface ServiceCardProps {
  icon: string
  title: string
  path: string
  color?: string
}

export default function ServiceCard({ icon, title, path, color = '#0052D9' }: ServiceCardProps) {
  const navigate = useNavigate()

  return (
    <div className="service-card" onClick={() => navigate(path)}>
      <div className="service-icon" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <div className="text-sm font-medium text-gray-800">{title}</div>
    </div>
  )
}
