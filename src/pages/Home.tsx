import HeroSection from '@/components/home/HeroSection'
import ServiceGrid from '@/components/home/ServiceGrid'
import PolicyAnnouncements from '@/components/home/PolicyAnnouncements'
import QuickEntry from '@/components/home/QuickEntry'

export default function Home() {
  return (
    <div>
      <HeroSection />
      <ServiceGrid />
      <PolicyAnnouncements />
      <QuickEntry />
    </div>
  )
}
