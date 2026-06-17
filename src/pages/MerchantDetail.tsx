import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Star, MapPin, Clock, Phone, ChevronLeft, ShieldCheck, CheckCircle2, AlertCircle, XCircle, QrCode, FileCheck, User, CalendarCheck, Hash, X } from 'lucide-react'
import { getMerchant, getPackages } from '@/utils/api'

const catMap: Record<string, string> = { food: '餐饮', entertainment: '娱乐', leisure: '休闲', shopping: '商超' }
const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export default function MerchantDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [merchant, setMerchant] = useState<any>(null)
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [previewImg, setPreviewImg] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      getMerchant(id),
      getPackages({ merchantId: id, pageSize: 20 }),
    ]).then(([m, pRes]) => {
      setMerchant(m)
      setPackages((pRes as any).items || (pRes as any).list || [])
    }).catch(() => {
      setMerchant(null)
      setPackages([])
    }).finally(() => setLoading(false))
  }, [id])

  const hours = (merchant?.business_hours || []) as Array<Record<string, any>>
  const hoursText = hours.length > 0
    ? hours.map((h: any) => `${dayNames[h.day_of_week] || ''} ${h.open_time}-${h.close_time}`).join(' / ')
    : '暂无营业时间信息'
  const status = merchant?.status || 'pending'
  const StatusIcon = status === 'approved' ? CheckCircle2 : status === 'pending' ? AlertCircle : XCircle
  const statusText = status === 'approved' ? '资质核验通过' : status === 'pending' ? '资质审核中' : '资质核验未通过'
  const statusCls = status === 'approved' ? 'text-secondary' : status === 'pending' ? 'text-yellow-600' : 'text-danger'
  const statusBg = status === 'approved' ? 'bg-secondary-50' : status === 'pending' ? 'bg-yellow-50' : 'bg-danger-50'
  const statusDot = status === 'approved' ? 'bg-secondary' : status === 'pending' ? 'bg-yellow-500' : 'bg-danger'

  const openPreview = (src: string, title: string) => {
    setPreviewImg(src)
    setPreviewTitle(title)
  }

  if (loading) {
    return (
      <div className="pb-20 animate-fade-in">
        <div className="bg-gradient-to-br from-primary to-primary-dark h-56" />
        <div className="max-w-3xl mx-auto px-4 -mt-10 relative z-10">
          <div className="card p-5 animate-pulse space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  if (!merchant) {
    return (
      <div className="pb-20 animate-fade-in">
        <div className="bg-gradient-to-br from-primary to-primary-dark h-56 relative">
          <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="max-w-3xl mx-auto px-4 -mt-10 relative z-10">
          <div className="card p-8 text-center text-gray-400">商户不存在</div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20 animate-fade-in">
      <div className="bg-gradient-to-br from-primary to-primary-dark h-56 relative">
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white z-20 backdrop-blur-sm">
          <ChevronLeft className="w-5 h-5" />
        </button>
        {merchant.cover_image ? (
          <img
            src={merchant.cover_image}
            alt={merchant.name}
            className="w-full h-full object-cover cursor-pointer opacity-90 hover:opacity-100 transition-opacity"
            onClick={() => openPreview(merchant.cover_image, '门头照')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">暂无门头照</div>
        )}
        {merchant.cover_image && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/50 backdrop-blur-sm text-white text-[10px] inline-flex items-center gap-1">
            <FileCheck className="w-3 h-3" /> 门头照 · 点击放大核验
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-10 relative z-10 space-y-4">
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="font-serif-title text-xl font-bold">{merchant.name}</h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {merchant.rating || 0}
                </span>
                <span>热度 {merchant.popularity || 0}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  merchant.category === 'food' ? 'bg-red-50 text-red-500' :
                  merchant.category === 'entertainment' ? 'bg-purple-50 text-purple-500' :
                  merchant.category === 'leisure' ? 'bg-green-50 text-green-500' :
                  'bg-amber-50 text-amber-500'
                }`}>
                  {catMap[merchant.category] || merchant.category}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${statusBg} ${statusCls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                  <StatusIcon className="w-3 h-3" />
                  {statusText}
                </span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
            <div className="flex items-start gap-1.5 text-gray-500">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <span>{hoursText}</span>
            </div>
            <div className="flex items-start gap-1.5 text-gray-500">
              <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <span>{merchant.phone || '暂无'}</span>
            </div>
            <div className="flex items-start gap-1.5 text-gray-500 sm:col-span-2">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <span>{merchant.street} · {merchant.address}</span>
            </div>
          </div>

          <div className="flex gap-1.5 mt-3 flex-wrap">
            {(merchant.tags || []).map((t: string) => <span key={t} className="badge-discount">{t}</span>)}
          </div>
          {merchant.description && (
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">{merchant.description}</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold flex items-center gap-1.5 mb-4">
            <ShieldCheck className="w-4.5 h-4.5 text-primary" />
            入驻资质核验资料
          </h2>

          <div className={`p-3 rounded-lg ${statusBg} mb-4`}>
            <div className="flex items-start gap-2">
              <StatusIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${statusCls}`} />
              <div className="flex-1 text-sm">
                <p className={`font-medium ${statusCls}`}>
                  {statusText}
                  {status === 'approved' && ' · 营业执照+经营许可证+门头照已核验'}
                  {status === 'pending' && ' · 正在核验营业执照/经营许可证/门头照'}
                </p>
                <div className="text-gray-600 mt-2 grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {merchant.audited_at && (
                    <div className="flex items-center gap-1">
                      <CalendarCheck className="w-3 h-3 opacity-60" /> 审核时间：{String(merchant.audited_at).replace('T', ' ').slice(0, 19)}
                    </div>
                  )}
                  {merchant.audited_by && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 opacity-60" /> 审核人：{merchant.audited_by}
                    </div>
                  )}
                  {merchant.license_no && (
                    <div className="flex items-center gap-1">
                      <Hash className="w-3 h-3 opacity-60" /> 证照编号：{merchant.license_no}
                    </div>
                  )}
                  {merchant.license_expire && (
                    <div className="flex items-center gap-1">
                      <CalendarCheck className="w-3 h-3 opacity-60" /> 有效期：至 {String(merchant.license_expire).split('T')[0] || String(merchant.license_expire).slice(0, 10)}
                    </div>
                  )}
                </div>
                {merchant.reject_reason && (
                  <div className="mt-2 p-2 rounded bg-white/60 text-danger text-xs flex items-start gap-1">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">驳回原因：</span>{merchant.reject_reason}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs font-medium text-gray-500 mb-2">证照原件核验（点击图片可放大）</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={() => merchant.cover_image && openPreview(merchant.cover_image, '门头照')}
              className="text-left rounded-lg overflow-hidden border border-gray-100 hover:border-primary/30 transition-colors bg-gray-50"
            >
              <div className="aspect-[16/10] bg-gray-100 overflow-hidden relative">
                {merchant.cover_image ? (
                  <>
                    <img src={merchant.cover_image} alt="门头照" className="w-full h-full object-cover" />
                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white">门头照</div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-xs">
                    <FileCheck className="w-7 h-7 mb-1 opacity-50" /> 未上传门头照
                  </div>
                )}
              </div>
            </button>
            <div className="grid grid-rows-2 gap-3">
              <button
                onClick={() => merchant.business_license && openPreview(merchant.business_license, '营业执照')}
                className="text-left rounded-lg overflow-hidden border border-gray-100 hover:border-primary/30 transition-colors bg-gray-50"
              >
                <div className="aspect-[16/10] sm:aspect-auto sm:h-full bg-gray-100 overflow-hidden relative">
                  {merchant.business_license ? (
                    <>
                      <img src={merchant.business_license} alt="营业执照" className="w-full h-full object-cover" />
                      <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white flex items-center gap-0.5">
                        <QrCode className="w-2.5 h-2.5" /> 营业执照
                      </div>
                      <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] text-white ${status === 'approved' ? 'bg-secondary' : status === 'pending' ? 'bg-yellow-500' : 'bg-danger'}`}>
                        {status === 'approved' ? '已核验' : status === 'pending' ? '待核验' : '核验失败'}
                      </span>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-[10px]">
                      <ShieldCheck className="w-6 h-6 mb-0.5 opacity-50" /> 未上传营业执照
                    </div>
                  )}
                </div>
              </button>
              <button
                onClick={() => merchant.operation_license && openPreview(merchant.operation_license, '经营许可证')}
                className="text-left rounded-lg overflow-hidden border border-gray-100 hover:border-primary/30 transition-colors bg-gray-50"
              >
                <div className="aspect-[16/10] sm:aspect-auto sm:h-full bg-gray-100 overflow-hidden relative">
                  {merchant.operation_license ? (
                    <>
                      <img src={merchant.operation_license} alt="经营许可证" className="w-full h-full object-cover" />
                      <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white flex items-center gap-0.5">
                        <QrCode className="w-2.5 h-2.5" /> 经营许可证
                      </div>
                      <span className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] text-white ${status === 'approved' ? 'bg-secondary' : status === 'pending' ? 'bg-yellow-500' : 'bg-danger'}`}>
                        {status === 'approved' ? '已核验' : status === 'pending' ? '待核验' : '核验失败'}
                      </span>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-[10px]">
                      <ShieldCheck className="w-6 h-6 mb-0.5 opacity-50" /> 未上传经营许可证
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        <div>
          <h2 className="section-title mb-4">优惠套餐</h2>
          {packages.length === 0 ? (
            <div className="card p-8 text-center text-gray-400 text-sm">该商户暂无优惠套餐</div>
          ) : (
            <div className="space-y-3">
              {packages.map((pkg: any) => {
                const originalPrice = pkg.original_price || 0
                const currentPrice = pkg.price || originalPrice
                const discount = originalPrice > 0 ? Math.round((1 - currentPrice / originalPrice) * 100) : 0
                const typeMap: Record<string, string> = { discount: '限时折扣', groupbuy: '团购券', timeslot: '时段特惠' }
                const remaining = Math.max(0, (pkg.stock ?? 0) - (pkg.sold ?? 0))
                const stockPct = pkg.stock > 0 ? Math.round((remaining / pkg.stock) * 100) : 0
                return (
                  <Link key={pkg.id} to={`/package/${pkg.id}`} className="card flex gap-3 p-3 hover:border-primary/30">
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-gradient-to-br from-primary-50 to-primary/10 flex items-center justify-center relative overflow-hidden">
                      <span className="text-xs text-gray-400">套餐</span>
                      {discount > 0 && (
                        <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1 py-0.5 rounded font-medium">
                          {discount}%
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium truncate">{pkg.name}</h3>
                        {pkg.type && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 text-primary flex-shrink-0">
                            {typeMap[pkg.type] || pkg.type}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{pkg.description || ''}</p>
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="text-lg font-bold text-accent">¥{currentPrice}</span>
                        <span className="text-xs text-gray-400 line-through">¥{originalPrice}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
                        <span>已售{pkg.sold ?? 0}</span>
                        <span className={remaining < 10 ? 'text-danger font-medium' : ''}>库存{remaining}</span>
                        {pkg.end_time && <span>截止{String(pkg.end_time).slice(0, 10)}</span>}
                      </div>
                      {pkg.stock > 0 && (
                        <div className="h-1 mt-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${stockPct < 20 ? 'bg-danger' : stockPct < 50 ? 'bg-yellow-500' : 'bg-secondary'}`}
                            style={{ width: `${stockPct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {previewImg && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setPreviewImg(null)}
        >
          <button
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            onClick={() => setPreviewImg(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-5xl w-full max-h-full overflow-auto">
            <p className="text-white/80 text-sm mb-3 text-center">{previewTitle} · 点击任意位置关闭</p>
            <img
              src={previewImg}
              alt={previewTitle}
              className="w-full h-auto object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
