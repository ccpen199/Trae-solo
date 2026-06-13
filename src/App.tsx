import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import AdminLayout from '@/components/AdminLayout'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Jobs from '@/pages/Jobs'
import JobDetail from '@/pages/JobDetail'
import JobPost from '@/pages/JobPost'
import Resume from '@/pages/Resume'
import ResumePreview from '@/pages/ResumePreview'
import Matches from '@/pages/Matches'
import Applications from '@/pages/Applications'
import Messages from '@/pages/Messages'
import Community from '@/pages/Community'
import CommunityPost from '@/pages/CommunityPost'
import CommunityNew from '@/pages/CommunityNew'
import CommunityCreate from '@/pages/CommunityCreate'
import Dashboard from '@/pages/admin/Dashboard'
import Institutions from '@/pages/admin/Institutions'
import JobsReview from '@/pages/admin/JobsReview'
import DataMasking from '@/pages/admin/DataMasking'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/job/post" element={<JobPost />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/resume/preview" element={<ResumePreview />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Messages />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/new" element={<CommunityCreate />} />
          <Route path="/community/:id" element={<CommunityPost />} />
        </Route>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/institutions" element={<Institutions />} />
          <Route path="/admin/jobs-review" element={<JobsReview />} />
          <Route path="/admin/data-masking" element={<DataMasking />} />
        </Route>
      </Routes>
    </Router>
  )
}
