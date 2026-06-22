import HeroSection from '@/components/HeroSection'
import HotAdoptions from '@/components/HotAdoptions'
import FeaturedBreeding from '@/components/FeaturedBreeding'
import CommunityHighlights from '@/components/CommunityHighlights'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div>
      <HeroSection />
      <HotAdoptions />
      <FeaturedBreeding />
      <CommunityHighlights />
      <AnnouncementBanner />
      <Footer />
    </div>
  )
}
