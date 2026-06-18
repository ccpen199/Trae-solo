import HeroSection from '@/components/home/HeroSection'
import IdentitySelector from '@/components/home/IdentitySelector'
import BusinessDashboard from '@/components/home/BusinessDashboard'
import ServiceGrid from '@/components/home/ServiceGrid'
import TodoList from '@/components/home/TodoList'
import PolicyAnnouncements from '@/components/home/PolicyAnnouncements'
import AgencySection from '@/components/home/AgencySection'
import MedicalSection from '@/components/home/MedicalSection'
import QuickEntry from '@/components/home/QuickEntry'

export default function Home() {
  return (
    <div>
      <HeroSection />
      <IdentitySelector />
      <BusinessDashboard />
      <ServiceGrid />
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2">
          <TodoList />
          <PolicyAnnouncements />
        </div>
        <div>
          <AgencySection />
        </div>
      </div>
      <MedicalSection />
      <QuickEntry />
    </div>
  )
}
