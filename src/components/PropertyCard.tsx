import { Link } from 'react-router-dom'
import { MapPin, Home as HomeIcon, Tag } from 'lucide-react'
import SmartImage from './SmartImage'

export interface PropertyCardProps {
  id: number
  title: string
  price: number
  area: number
  layout: string
  address: string
  city: string
  district: string
  images: string
  propertyType: string
  listingType: string
}

const propertyTypeLabels: Record<string, string> = {
  apartment: '公寓',
  house: '别墅',
  villa: '联排',
  commercial: '商铺',
  office: '写字楼',
}

const listingTypeLabels: Record<string, string> = {
  sale: '出售',
  rent: '出租',
  new: '新房',
}

const listingTypeColors: Record<string, string> = {
  sale: 'bg-red-500',
  rent: 'bg-blue-500',
  new: 'bg-teal-500',
}

export default function PropertyCard({
  id,
  title,
  price,
  area,
  layout,
  address,
  district,
  images,
  propertyType,
  listingType,
}: PropertyCardProps) {
  const imageList = images ? JSON.parse(images) : []
  const firstImage = imageList[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800&h=600'

  return (
    <Link to={`/properties/${id}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 card-hover">
        <div className="relative overflow-hidden aspect-[4/3]">
          <SmartImage
            src={firstImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            fallbackText="房源图片"
            aspectRatio="4/3"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`px-2.5 py-1 text-white text-xs font-medium rounded-md ${listingTypeColors[listingType] || 'bg-slate-500'}`}>
              {listingTypeLabels[listingType] || listingType}
            </span>
            <span className="px-2.5 py-1 bg-white/90 text-slate-700 text-xs font-medium rounded-md">
              {propertyTypeLabels[propertyType] || propertyType}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-amber-500">¥{price.toLocaleString()}</span>
              {listingType === 'rent' && <span className="text-white text-sm">/月</span>}
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-slate-900 mb-2 line-clamp-1 group-hover:text-teal-600 transition-colors">
            {title}
          </h3>

          <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
            <span className="flex items-center gap-1">
              <HomeIcon size={14} strokeWidth={1.5} />
              {layout}
            </span>
            <span className="flex items-center gap-1">
              <Tag size={14} strokeWidth={1.5} />
              {area}㎡
            </span>
          </div>

          <div className="flex items-center gap-1 text-sm text-slate-500">
            <MapPin size={14} strokeWidth={1.5} />
            <span className="truncate">{district} · {address}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
