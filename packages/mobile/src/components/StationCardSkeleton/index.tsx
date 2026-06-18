import { Skeleton } from 'antd-mobile'
import './index.css'

function StationCardSkeleton() {
  return (
    <div className="station-card-skeleton">
      <div className="skeleton-header">
        <Skeleton.Title animated style={{ width: '60%' }} />
      </div>
      <div className="skeleton-meta">
        <Skeleton.Text animated lines={1} style={{ width: '40%' }} />
      </div>
      <div className="skeleton-footer">
        <Skeleton.Text animated lines={1} style={{ width: '30%' }} />
        <Skeleton.Text animated lines={1} style={{ width: '25%' }} />
      </div>
    </div>
  )
}

export default StationCardSkeleton
