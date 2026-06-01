import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-6">✅ 旅行僧 - 发现世界的美好</h1>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">应用已成功启动！</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span className="text-gray-700">React 运行正常</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span className="text-gray-700">Tailwind CSS 运行正常</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
              <span className="text-gray-700">Vite 开发服务器运行正常</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
