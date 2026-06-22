import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import PetList from '@/pages/PetList'
import PetDetail from '@/pages/PetDetail'
import PetNew from '@/pages/PetNew'
import AdoptionCenter from '@/pages/AdoptionCenter'
import AdoptionDetail from '@/pages/AdoptionDetail'
import AdoptionPublish from '@/pages/AdoptionPublish'
import BreedingSquare from '@/pages/BreedingSquare'
import BreedingDetail from '@/pages/BreedingDetail'
import BreedingPublish from '@/pages/BreedingPublish'
import QACommunity from '@/pages/QACommunity'
import QADetail from '@/pages/QADetail'
import QAAsk from '@/pages/QAAsk'
import Shop from '@/pages/Shop'
import ShopDetail from '@/pages/ShopDetail'
import ShopCart from '@/pages/ShopCart'
import Community from '@/pages/Community'
import Profile from '@/pages/Profile'
import ProfileVerify from '@/pages/ProfileVerify'
import Admin from '@/pages/Admin'
import AdminReview from '@/pages/AdminReview'
import AdminSupervision from '@/pages/AdminSupervision'
import AdminFiling from '@/pages/AdminFiling'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/pets" element={<PetList />} />
          <Route path="/pets/new" element={<PetNew />} />
          <Route path="/pets/:id" element={<PetDetail />} />
          <Route path="/adoptions" element={<AdoptionCenter />} />
          <Route path="/adoptions/publish" element={<AdoptionPublish />} />
          <Route path="/adoptions/:id" element={<AdoptionDetail />} />
          <Route path="/breedings" element={<BreedingSquare />} />
          <Route path="/breedings/publish" element={<BreedingPublish />} />
          <Route path="/breedings/:id" element={<BreedingDetail />} />
          <Route path="/qa" element={<QACommunity />} />
          <Route path="/qa/ask" element={<QAAsk />} />
          <Route path="/qa/:id" element={<QADetail />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:id" element={<ShopDetail />} />
          <Route path="/shop/cart" element={<ShopCart />} />
          <Route path="/community" element={<Community />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/verify" element={<ProfileVerify />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/review" element={<AdminReview />} />
          <Route path="/admin/supervision" element={<AdminSupervision />} />
          <Route path="/admin/filing" element={<AdminFiling />} />
        </Route>
      </Routes>
    </Router>
  )
}
