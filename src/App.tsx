import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { PageTransition } from '@/components/layout/PageTransition'
import { HRLayout } from '@/components/layout/HRLayout'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Onboarding from '@/pages/Onboarding'
import Diagnosis from '@/pages/Diagnosis'
import Jobs from '@/pages/Jobs'
import JobDetail from '@/pages/JobDetail'
import Encyclopedia from '@/pages/Encyclopedia'
import EncyclopediaDetail from '@/pages/EncyclopediaDetail'
import HRDashboard from '@/pages/HRDashboard'
import HRTalentPool from '@/pages/HRTalentPool'
import HRTalentDetail from '@/pages/HRTalentDetail'
import HRWarnings from '@/pages/HRWarnings'
import Profile from '@/pages/Profile'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'

interface PlaceholderPageProps {
  title: string
  description?: string
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  const navigate = useNavigate()
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="gradient-text text-3xl">{title}</CardTitle>
          <CardDescription>
            {description ?? `这是 ${title} 页面的占位内容，后续将补充完整功能实现。`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
              返回上一页
            </Button>
            <Button onClick={() => navigate('/')}>
              回到首页
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <PageTransition>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/diagnosis" element={<Diagnosis />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/encyclopedia" element={<Encyclopedia />} />
          <Route path="/encyclopedia/:jobId" element={<EncyclopediaDetail />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/hr" element={<HRLayout />}>
            <Route index element={<HRDashboard />} />
            <Route path="dashboard" element={<HRDashboard />} />
            <Route path="talent-pool" element={<HRTalentPool />} />
            <Route path="talent/:id" element={<HRTalentDetail />} />
            <Route path="warnings" element={<HRWarnings />} />
          </Route>

          <Route path="*" element={<PlaceholderPage title="页面未找到" description="你访问的页面不存在或已被移除" />} />
        </Routes>
      </PageTransition>
    </BrowserRouter>
  )
}
