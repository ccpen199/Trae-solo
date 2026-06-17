import HeroSection from '@/components/home/HeroSection'
import HeatmapSection from '@/components/home/HeatmapSection'
import CategoryNav from '@/components/home/CategoryNav'
import CampaignSection from '@/components/home/CampaignSection'
import NearbyMerchants from '@/components/home/NearbyMerchants'
import OperationsOverview from '@/components/home/OperationsOverview'
import { useSearchParams } from 'react-router-dom'

export default function Home() {
  const [searchParams] = useSearchParams()
  const keyword = (searchParams.get('q') || '').trim()

  return (
    <div className="animate-fade-in">
      <HeroSection />
      {keyword && (
        <section className="max-w-7xl mx-auto px-4 pt-4">
          <div className="card p-4 border-primary/20 bg-primary-50">
            <h2 className="text-base font-semibold text-primary">搜索结果</h2>
            <p className="text-sm text-gray-600 mt-1">
              查询结果已按 "{keyword}" 筛选，下面展示匹配的商户、套餐和附近推荐。
            </p>
          </div>
        </section>
      )}
      <CategoryNav />
      <HeatmapSection />
      <CampaignSection />
      <NearbyMerchants />
      <OperationsOverview />
    </div>
  )
}
