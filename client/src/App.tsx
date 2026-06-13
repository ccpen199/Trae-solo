import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import TaskList from './pages/TaskList'
import TaskDetail from './pages/TaskDetail'
import CreateTask from './pages/CreateTask'
import MyTasks from './pages/MyTasks'
import MyBids from './pages/MyBids'
import Dashboard from './pages/Dashboard'
import Wallet from './pages/Wallet'
import AdminDashboard from './pages/AdminDashboard'
import AdminDisputes from './pages/AdminDisputes'
import AdminTrends from './pages/AdminTrends'
import Profile from './pages/Profile'
import { useAuthStore } from './store/authStore'

function App() {
  const { isAuthenticated, fetchCurrentUser } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentUser()
    }
  }, [isAuthenticated, fetchCurrentUser])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tasks" element={<TaskList />} />
        <Route path="/tasks/:id" element={<TaskDetail />} />
        <Route path="/tasks/create" element={<CreateTask />} />
        <Route path="/my-tasks" element={<MyTasks />} />
        <Route path="/my-bids" element={<MyBids />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/disputes" element={<AdminDisputes />} />
        <Route path="/admin/trends" element={<AdminTrends />} />
      </Routes>

      <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">创</span>
                </div>
                <span className="text-xl font-bold text-white">创意众包</span>
              </div>
              <p className="text-sm">专业的B2C+C2C创意服务众包平台，连接雇主与优质服务商</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">服务分类</h4>
              <ul className="space-y-2 text-sm">
                <li>UI设计</li>
                <li>网站开发</li>
                <li>文案撰写</li>
                <li>营销推广</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">帮助中心</h4>
              <ul className="space-y-2 text-sm">
                <li>新手指南</li>
                <li>发布任务</li>
                <li>成为服务商</li>
                <li>资金托管</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">联系我们</h4>
              <ul className="space-y-2 text-sm">
                <li>客服热线：400-888-8888</li>
                <li>邮箱：service@example.com</li>
                <li>工作时间：9:00 - 21:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            © 2024 创意众包平台. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
