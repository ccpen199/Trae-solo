import { Link } from 'react-router-dom'
import { FileQuestion, Home } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-12 h-12 text-gray-300" />
        </div>
        <h1 className="text-7xl font-bold text-gray-200 mb-3">404</h1>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">页面不存在</h2>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto">
          您访问的页面可能已被移除或暂时不可用
        </p>
        <Link to="/">
          <Button icon={<Home className="w-4 h-4" />} size="lg">
            返回首页
          </Button>
        </Link>
      </div>
    </div>
  )
}
