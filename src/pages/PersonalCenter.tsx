import { Outlet } from 'react-router-dom'
import PersonalSidebar from '@/components/personal/PersonalSidebar'

export default function PersonalCenter() {
  return (
    <div className="flex gap-6">
      <PersonalSidebar />
      <Outlet />
    </div>
  )
}
