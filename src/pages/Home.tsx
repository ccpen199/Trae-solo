import HeroSection from '@/components/home/HeroSection'
import VerificationCard from '@/components/home/VerificationCard'
import QuickDispatch from '@/components/home/QuickDispatch'
import RecommendedSuppliers from '@/components/home/RecommendedSuppliers'
import BusinessPreview from '@/components/home/BusinessPreview'

export default function Home() {
  return (
    <div className="animate-fade-in">
      <HeroSection />
      <div className="grid grid-cols-3 gap-6 mt-6">
        <div className="col-span-1">
          <VerificationCard />
        </div>
        <div className="col-span-2">
          <QuickDispatch />
        </div>
      </div>
      <div className="mt-6">
        <RecommendedSuppliers />
      </div>
      <div className="mt-6">
        <BusinessPreview />
      </div>
    </div>
  )
}
