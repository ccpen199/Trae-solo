import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bus, Train, Hospital, Building2, ChevronRight, MapPin } from 'lucide-react';
import Card from '../../components/Card';

const tabs = [
  { path: 'transit', icon: Bus, label: '公交地铁', desc: '实时到站查询、线路规划' },
  { path: 'hospitals', icon: Hospital, label: '预约挂号', desc: '医院号源池、在线预约' },
  { path: 'venues', icon: Building2, label: '文体场馆', desc: '场馆余量、活动预订' },
];

export default function CityLife() {
  const location = useLocation();
  const isRoot = location.pathname === '/city';

  if (!isRoot) {
    return <Outlet />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <Card.Body>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">城市生活圈</h2>
              <p className="text-sm text-gray-500">便捷查询城市服务，畅享智慧生活</p>
            </div>
          </div>
        </Card.Body>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tabs.map((tab) => (
          <Link key={tab.path} to={tab.path}>
            <Card hover className="h-full">
              <Card.Body className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      tab.path === 'transit' ? 'bg-blue-100 text-blue-600' :
                      tab.path === 'hospitals' ? 'bg-red-100 text-red-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      <tab.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tab.label}</h3>
                      <p className="text-sm text-gray-500">{tab.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Card.Body>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900">热门公交站点</h3>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="divide-y divide-gray-100">
              {[
                { name: '莲坂站', lines: ['1路', '21路', '45路', '96路'], buses: 5 },
                { name: '火车站', lines: ['1路', '3路', '19路', '42路', '96路'], buses: 8 },
                { name: '会展中心站', lines: ['19路', '29路', '30路', '98路'], buses: 3 },
                { name: '第一码头站', lines: ['2路', '3路', '8路', '32路'], buses: 4 },
                { name: 'SM城市广场站', lines: ['27路', '33路', '40路', '109路'], buses: 6 },
              ].map((station, idx) => (
                <div key={idx} className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">{station.name}</h4>
                    <div className="flex flex-wrap gap-1">
                      {station.lines.map((line, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          {line}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">{station.buses}</p>
                    <p className="text-xs text-gray-500">辆即将到站</p>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900">今日推荐活动</h3>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="divide-y divide-gray-100">
              {[
                { name: '古琴艺术展', venue: '厦门市博物馆', time: '10:00-17:00', available: 156, capacity: 200 },
                { name: '芭蕾舞剧《天鹅湖》', venue: '闽南大戏院', time: '19:30-21:30', available: 214, capacity: 1200 },
                { name: '羽毛球场地预订', venue: '厦门市体育中心', time: '09:00-22:00', available: 5, capacity: 8 },
                { name: '少儿钢琴培训', venue: '厦门市文化馆', time: '周末班', available: 5, capacity: 20 },
                { name: '图书借阅', venue: '厦门市图书馆', time: '09:00-21:00', available: 344, capacity: 500 },
              ].map((activity, idx) => (
                <div key={idx} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{activity.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      activity.available > activity.capacity * 0.5 ? 'bg-green-100 text-green-700' :
                      activity.available > activity.capacity * 0.2 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      余票 {activity.available}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{activity.venue}</span>
                    <span>·</span>
                    <span>{activity.time}</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        activity.available > activity.capacity * 0.5 ? 'bg-green-500' :
                        activity.available > activity.capacity * 0.2 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${(activity.available / activity.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>
    </motion.div>
  );
}
