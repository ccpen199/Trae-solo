import { Link } from 'react-router-dom'
import { Package, ArrowLeft, Home, Search, Truck, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/store'

export default function NotFound() {
  const { cargoOrders } = useAppStore()

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="card-base p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-52 h-52 rounded-full bg-gradient-to-br from-primary-50 to-transparent -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-gradient-to-br from-accent-50 to-transparent translate-y-1/3 -translate-x-1/3" />

          <div className="relative">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center relative">
                <div className="text-[140px] md:text-[180px] font-black leading-none bg-gradient-to-br from-primary-500 via-violet-500 to-accent-500 bg-clip-text text-transparent tracking-tight">
                  404
                </div>
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center border-4 border-white shadow-lg animate-pulse">
                  <Package className="w-10 h-10 text-amber-500" />
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold text-slate2-800 mb-3">
              哦吼！货物迷路了
            </h1>
            <p className="text-sm text-slate2-500 max-w-md mx-auto mb-8 leading-relaxed">
              您要找的页面可能被司机师傅带走了，也许正在高速上飞驰。
              别担心，让我们帮您重新规划一条运输路线吧！
            </p>

            <div className="max-w-lg mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate2-300" />
                <input
                  placeholder="搜索货源/运单/运力/保单..."
                  className="w-full h-14 pl-14 pr-5 rounded-2xl bg-slate2-50 border-2 border-slate2-100 text-sm focus:outline-none focus:bg-white focus:border-primary-300 focus:ring-4 focus:ring-primary-50 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center mb-10 flex-wrap">
              <Link to="/dashboard" className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 via-violet-500 to-indigo-600 text-white font-bold hover:shadow-xl hover:shadow-primary-500/25 transition-all flex items-center gap-2">
                <Home className="w-4 h-4" />
                返回首页
              </Link>
              <Link to="/cargo" className="px-6 py-3 rounded-xl bg-white border-2 border-slate2-200 text-slate2-700 font-bold hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-600 transition-all flex items-center gap-2">
                <Truck className="w-4 h-4" />
                货源中心
              </Link>
              <button onClick={() => window.history.back()} className="px-6 py-3 rounded-xl bg-slate2-50 text-slate2-500 font-bold hover:bg-slate2-100 transition-colors flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                返回上一页
              </button>
            </div>

            <div className="pt-8 border-t border-slate2-100 text-left">
              <div className="text-xs font-bold text-slate2-400 uppercase tracking-widest mb-4 text-center">
                🔥 系统热门推荐
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {cargoOrders.slice(0, 3).map(o => (
                  <Link
                    key={o.id}
                    to={`/cargo/${o.id}`}
                    className="group p-4 rounded-xl bg-gradient-to-br from-slate2-50 to-white border border-slate2-100 hover:border-primary-200 hover:shadow-md hover:scale-[1.02] transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-[10px] font-bold text-slate2-500">{o.orderNo.slice(-6)}</span>
                      {o.temperatureControlled && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold">冷链</span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate2-800 mb-2 truncate">{o.cargoName}</div>
                    <div className="text-[10px] text-slate2-500 mb-1 flex items-center gap-0.5">
                      {o.origin.city} → {o.destination.city}
                    </div>
                    <div className="text-[10px] text-primary-600 font-bold flex items-center gap-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      查看详情 <ChevronRight className="w-3 h-3" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4 text-[10px] text-slate2-400">
              <span>紧急联系: 400-888-8888</span>
              <span className="w-1 h-1 rounded-full bg-slate2-200" />
              <span>平台运维 7x24 在线</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
