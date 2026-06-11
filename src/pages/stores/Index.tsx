import { Store, MapPin, Star, Users, CalendarCheck, Navigation } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { stores } from '@/data/mockData'

export default function StoresIndex() {
  return (
    <div className="p-6 animate-fade-in-up">
      <PageHeader title="门店管理" subtitle="查看和管理所有生活馆门店信息" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {stores.map((store) => (
            <div key={store.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Store size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{store.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${store.status === 'open' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {store.status === 'open' ? '营业中' : '已关闭'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                      <MapPin size={14} />
                      <span>{store.address}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={16} className="text-amber-400 fill-amber-400" />
                  <span className="font-semibold text-gray-900">{store.rating}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">月访问</span>
                  <span className="text-sm font-semibold text-gray-900">{store.monthlyVisits}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarCheck size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">今日预约</span>
                  <span className="text-sm font-semibold text-gray-900">{store.todayAppointments}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">门店分布</h3>
            </div>
            <div className="h-72 bg-gradient-to-br from-emerald-50 to-emerald-100 flex flex-col items-center justify-center">
              <Navigation size={40} className="text-emerald-300 mb-2" />
              <p className="text-sm text-emerald-500">地图视图</p>
              <p className="text-xs text-emerald-400 mt-1">{stores.length} 家门店</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">门店概览</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">营业中</span>
                <span className="text-sm font-semibold text-emerald-600">{stores.filter(s => s.status === 'open').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">已关闭</span>
                <span className="text-sm font-semibold text-gray-500">{stores.filter(s => s.status === 'closed').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">平均评分</span>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="text-sm font-semibold text-gray-900">
                    {(stores.reduce((sum, s) => sum + s.rating, 0) / stores.length).toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">月总访问</span>
                <span className="text-sm font-semibold text-gray-900">{stores.reduce((sum, s) => sum + s.monthlyVisits, 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
