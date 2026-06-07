import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin, Ruler, LayoutGrid, ArrowUpDown, Sun, Paintbrush, Phone, MessageCircle, Heart, Share2, Clock, Building, Award, CheckCircle, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { stableImageUrl } from '@/lib/media'
import VRViewer from '@/components/VRViewer'
import PropertyCard from '@/components/PropertyCard'
import { useUIStore } from '@/store'

const demoProperty = {
  id: 1,
  title: '朝阳区豪华三居室 南北通透 学区房',
  price: 8900000,
  pricePerSqm: 71200,
  area: 125,
  layout: '3室2厅2卫',
  floor: '中层/28层',
  orientation: '南北通透',
  decoration: '精装修',
  buildingType: '板楼',
  elevator: '有',
  propertyYear: 2018,
  address: '望京SOHO附近',
  city: '北京',
  district: '朝阳区',
  community: '保利中央公园',
  description: '核心地段，配套成熟，交通便利。小区绿化率高，物业管理完善。周边名校林立，教育资源丰富。购物、医疗、娱乐配套一应俱全。',
  images: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200&h=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200&h=800',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200&h=800',
    'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&q=80&w=1200&h=800',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=1200&h=800',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=1200&h=800',
  ],
  tags: ['学区房', '地铁房', '精装修', '满五唯一', '南北通透'],
  agent: {
    id: 1,
    name: '张顾问',
    title: '资深房产顾问',
    phone: '138****8888',
    avatar: '',
    rating: 4.9,
    experience: '8年',
  },
  amenities: [
    { icon: Building, label: '地铁15号线', distance: '500米' },
    { icon: Building, label: '人大附中', distance: '800米' },
    { icon: Building, label: '望京医院', distance: '1.2公里' },
    { icon: Building, label: '凯德MALL', distance: '1公里' },
    { icon: Building, label: '望京公园', distance: '1.5公里' },
    { icon: Building, label: '银行', distance: '300米' },
  ],
}

const relatedProperties = [
  { id: 2, title: '海淀区中关村精装两居室 近地铁', price: 6200000, area: 89, layout: '2室1厅1卫', address: '中关村大街', city: '北京', district: '海淀区', images: JSON.stringify(['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800&h=600']), propertyType: 'apartment', listingType: 'sale' },
  { id: 3, title: '国贸CBD高端公寓 精装修拎包入住', price: 12500000, area: 156, layout: '4室2厅3卫', address: '国贸三期旁', city: '北京', district: '朝阳区', images: JSON.stringify(['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800&h=600']), propertyType: 'apartment', listingType: 'new' },
  { id: 4, title: '通州副中心河景别墅 带花园车库', price: 15800000, area: 280, layout: '5室3厅4卫', address: '大运河森林公园旁', city: '北京', district: '通州区', images: JSON.stringify(['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800&h=600']), propertyType: 'villa', listingType: 'new' },
]

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'info' | 'vr' | 'furniture'>('info')
  const [isFavorite, setIsFavorite] = useState(false)
  const showLoginModal = useUIStore((state) => state.showLoginModal)

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % demoProperty.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + demoProperty.images.length) % demoProperty.images.length)
  }

  const propertyFeatures = [
    { icon: LayoutGrid, label: '户型', value: demoProperty.layout },
    { icon: Ruler, label: '面积', value: `${demoProperty.area}㎡` },
    { icon: ArrowUpDown, label: '楼层', value: demoProperty.floor },
    { icon: Sun, label: '朝向', value: demoProperty.orientation },
    { icon: Paintbrush, label: '装修', value: demoProperty.decoration },
    { icon: Building, label: '楼型', value: demoProperty.buildingType },
  ]

  return (
    <div className="min-h-screen bg-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/properties" className="text-teal-600 hover:text-teal-700 text-sm flex items-center gap-1">
            <ChevronLeft size={16} strokeWidth={1.5} />
            返回房源列表
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="relative aspect-[16/9] bg-slate-900">
                <img
                  src={stableImageUrl(demoProperty.images[currentImageIndex], demoProperty.title)}
                  alt={demoProperty.title}
                  className="w-full h-full object-cover"
                />

                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                >
                  <ChevronLeft size={24} strokeWidth={1.5} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                >
                  <ChevronRight size={24} strokeWidth={1.5} />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {demoProperty.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        'w-2 h-2 rounded-full transition-all',
                        currentImageIndex === index ? 'bg-white w-6' : 'bg-white/50'
                      )}
                    />
                  ))}
                </div>

                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
                  {currentImageIndex + 1} / {demoProperty.images.length}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100">
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {demoProperty.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        'shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all',
                        currentImageIndex === index ? 'border-teal-500' : 'border-transparent opacity-60 hover:opacity-100'
                      )}
                    >
                      <img src={stableImageUrl(img, `${demoProperty.title}-${index + 1}`)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {demoProperty.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2.5 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">{demoProperty.title}</h1>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <MapPin size={16} strokeWidth={1.5} />
                    {demoProperty.district} · {demoProperty.community} · {demoProperty.address}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-amber-500">¥{demoProperty.price.toLocaleString()}</p>
                  <p className="text-sm text-slate-500">单价 ¥{demoProperty.pricePerSqm.toLocaleString()}/㎡</p>
                </div>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-4 py-6 border-y border-slate-100">
                {propertyFeatures.map((feature, index) => (
                  <div key={index} className="text-center">
                    <feature.icon size={20} className="mx-auto mb-2 text-teal-600" strokeWidth={1.5} />
                    <p className="text-xs text-slate-500 mb-1">{feature.label}</p>
                    <p className="font-semibold text-slate-900">{feature.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors',
                    isFavorite
                      ? 'bg-rose-50 text-rose-600 border-2 border-rose-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <Heart size={20} className={isFavorite ? 'fill-rose-500' : ''} strokeWidth={1.5} />
                  {isFavorite ? '已收藏' : '收藏'}
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-xl font-medium hover:bg-slate-100 transition-colors">
                  <Share2 size={20} strokeWidth={1.5} />
                  分享
                </button>
                <button
                  onClick={showLoginModal}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
                >
                  <Phone size={20} strokeWidth={1.5} />
                  电话咨询
                </button>
                <button
                  onClick={showLoginModal}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
                >
                  <MessageCircle size={20} strokeWidth={1.5} />
                  在线咨询
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setActiveTab('info')}
                  className={cn(
                    'flex-1 py-4 font-medium transition-colors relative',
                    activeTab === 'info' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  房源信息
                  {activeTab === 'info' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />}
                </button>
                <button
                  onClick={() => setActiveTab('vr')}
                  className={cn(
                    'flex-1 py-4 font-medium transition-colors relative',
                    activeTab === 'vr' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  VR全景看房
                  {activeTab === 'vr' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />}
                </button>
                <button
                  onClick={() => setActiveTab('furniture')}
                  className={cn(
                    'flex-1 py-4 font-medium transition-colors relative',
                    activeTab === 'furniture' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  家具/材质
                  {activeTab === 'furniture' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600" />}
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'info' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">房源描述</h3>
                      <p className="text-slate-600 leading-relaxed">{demoProperty.description}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">配套信息</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {demoProperty.amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                              <amenity.icon size={18} className="text-teal-600" strokeWidth={1.5} />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">{amenity.label}</p>
                              <p className="text-xs text-slate-500">步行 {amenity.distance}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'vr' && (
                  <div>
                    <VRViewer panoramaImage={demoProperty.images[0]} />
                  </div>
                )}

                {activeTab === 'furniture' && (
                  <div>
                    <VRViewer panoramaImage={demoProperty.images[0]} />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">相关房源推荐</h2>
                <Link to="/properties" className="text-teal-600 hover:text-teal-700 text-sm">
                  查看更多 →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedProperties.map((property) => (
                  <PropertyCard key={property.id} {...property} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-24">
              <h3 className="font-semibold text-slate-900 mb-4">专属顾问</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-teal-600">{demoProperty.agent.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{demoProperty.agent.name}</p>
                  <p className="text-sm text-slate-500">{demoProperty.agent.title}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={14} className="text-amber-400 fill-amber-400" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-slate-700">{demoProperty.agent.rating}</span>
                    <span className="text-xs text-slate-400">· {demoProperty.agent.experience}经验</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle size={14} className="text-green-500" strokeWidth={1.5} />
                  持证上岗
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Award size={14} className="text-amber-500" strokeWidth={1.5} />
                  平台认证
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock size={14} className="text-teal-500" strokeWidth={1.5} />
                  3分钟内响应
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={showLoginModal}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
                >
                  <Phone size={18} strokeWidth={1.5} />
                  电话咨询
                </button>
                <button
                  onClick={showLoginModal}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
                >
                  <MessageCircle size={18} strokeWidth={1.5} />
                  在线咨询
                </button>
                <button
                  onClick={showLoginModal}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-teal-600 text-teal-600 rounded-xl font-medium hover:bg-teal-50 transition-colors"
                >
                  预约实地看房
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
