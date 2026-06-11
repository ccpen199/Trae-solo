import React from 'react'
import { Link } from 'react-router-dom'

export default function Social() {
  const features = [
    {
      path: '/clubs',
      icon: '🏆',
      title: '俱乐部',
      desc: '加入骑行俱乐部，认识志同道合的骑友',
      count: '3+'
    },
    {
      path: '/events',
      icon: '🎯',
      title: '赛事活动',
      desc: '参与赛事挑战，赢取奖牌和积分奖励',
      count: '5+'
    },
    {
      path: '/topics',
      icon: '💬',
      title: '话题广场',
      desc: '分享骑行心得，参与热门话题讨论',
      count: '100+'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold">社区广场</h2>
        <p className="text-purple-100 mt-2">发现有趣的人和事，分享你的骑行生活</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center text-3xl">
              {item.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mt-4">{item.title}</h3>
            <p className="text-sm text-gray-500 mt-2">{item.desc}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-gray-400">{item.count} 个内容</span>
              <span className="text-primary-600 text-sm">去看看 →</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🔥 热门话题</h3>
        <div className="flex flex-wrap gap-3">
          {['#周末骑行', '#城市通勤', '#改装分享', '#新手入门', '#长途挑战', '#夜骑', '#折叠车', '#电动滑板', '#通勤神器', '#骑行装备'].map((tag, idx) => (
            <span
              key={idx}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-primary-100 hover:text-primary-700 cursor-pointer transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🏆 本周排行榜</h3>
          <div className="space-y-3">
            {[
              { rank: 1, name: '骑行达人小王', distance: 256.8, avatar: '🥇' },
              { rank: 2, name: '风一样的女子', distance: 198.5, avatar: '🥈' },
              { rank: 3, name: '闪电骑士', distance: 175.2, avatar: '🥉' },
              { rank: 4, name: '慢骑爱好者', distance: 142.1, avatar: '4' },
              { rank: 5, name: '通勤小能手', distance: 128.6, avatar: '5' }
            ].map(user => (
              <div key={user.rank} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-8 text-center font-bold text-gray-500">{user.avatar}</div>
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center ml-3">
                  {user.name[0]}
                </div>
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-800">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.distance} km</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📢 最新活动</h3>
          <div className="space-y-3">
            {[
              { title: '周末环西湖骑行活动', date: '本周六 08:00', members: 24, status: '报名中' },
              { title: '100公里挑战月', date: '本月持续进行', members: 156, status: '进行中' },
              { title: '春季摄影大赛', date: '3月1日-31日', members: 89, status: '进行中' },
              { title: '新手入门骑行课堂', date: '下周日 14:00', members: 12, status: '报名中' }
            ].map((event, idx) => (
              <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-xl">
                  🎯
                </div>
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-800">{event.title}</div>
                  <div className="text-xs text-gray-500">{event.date} · {event.members}人参与</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  event.status === '报名中' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
