import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Map as MapIcon,
  ChevronRight,
  MapPin,
  Phone,
  Clock,
  Search,
  Filter,
  Navigation,
} from 'lucide-react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    L: any;
  }
}

interface ServiceLocation {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
  distance?: string;
  services: string[];
}

const categories = ['全部', '政务服务', '医疗机构', '社区服务', '便民网点', '养老服务'];

const mockLocations: ServiceLocation[] = [
  { id: 'l1', name: '盐城市政务服务中心', category: '政务服务', address: '盐城市府西路1号', phone: '0515-12345', hours: '周一至周五 9:00-17:30', lat: 33.3575, lng: 120.1615, distance: '2.3km', services: ['社保办理', '不动产登记', '证照办理'] },
  { id: 'l2', name: '亭湖区政务服务中心', category: '政务服务', address: '亭湖区青年中路28号', phone: '0515-66668888', hours: '周一至周五 9:00-17:30', lat: 33.3752, lng: 120.1536, distance: '1.2km', services: ['社保办理', '户籍业务', '营业执照'] },
  { id: 'l3', name: '盐都区行政审批局', category: '政务服务', address: '盐都区新都路618号', phone: '0515-88885555', hours: '周一至周五 9:00-17:00', lat: 33.3302, lng: 120.1268, distance: '3.5km', services: ['项目审批', '税务服务'] },
  { id: 'l4', name: '盐城市第一人民医院', category: '医疗机构', address: '盐城市人民南路66号', phone: '0515-88889999', hours: '24小时急诊', lat: 33.3668, lng: 120.1789, distance: '2.8km', services: ['综合医疗', '急诊急救', '体检中心'] },
  { id: 'l5', name: '亭湖区文峰街道社区服务中心', category: '社区服务', address: '亭湖区文峰街道办事处', phone: '0515-88123456', hours: '周一至周五 8:30-18:00', lat: 33.3812, lng: 120.1423, distance: '0.8km', services: ['社区服务', '养老服务', '志愿者服务'] },
  { id: 'l6', name: '城南新区便民服务中心', category: '便民网点', address: '城南新区人民南路38号', phone: '0515-88223344', hours: '周一至周日 8:30-20:00', lat: 33.3421, lng: 120.1722, distance: '4.8km', services: ['水电费缴纳', '快递收发', '证件复印'] },
  { id: 'l7', name: '盐城市社会福利中心', category: '养老服务', address: '盐城市开放大道128号', phone: '0515-88334455', hours: '周一至周五 8:30-17:30', lat: 33.3928, lng: 120.1689, distance: '3.2km', services: ['机构养老', '日间照料', '康复护理'] },
];

export default function ServiceMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [locations, setLocations] = useState<ServiceLocation[]>(mockLocations);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

  const filtered = locations.filter((loc) => {
    if (activeCategory !== '全部' && loc.category !== activeCategory) return false;
    if (keyword && !loc.name.includes(keyword) && !loc.address.includes(keyword)) return false;
    return true;
  });

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined' || !window.L) return;
    if (mapInstance.current) return;

    const L = window.L;
    mapInstance.current = L.map(mapRef.current, {
      center: [33.3575, 120.1615],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance.current);
  }, []);

  useEffect(() => {
    if (!mapInstance.current || typeof window === 'undefined' || !window.L) return;
    const L = window.L;

    markersRef.current.forEach((m) => mapInstance.current.removeLayer(m));
    markersRef.current = [];

    const customIcon = (color: string) =>
      L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${color};width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.25);border:3px solid white;"><svg style="transform:rotate(45deg);color:white;width:18px;height:18px;" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

    const categoryColors: Record<string, string> = {
      政务服务: '#1E5EAA',
      医疗机构: '#E53935',
      社区服务: '#FF7A1A',
      便民网点: '#10B981',
      养老服务: '#8B5CF6',
    };

    filtered.forEach((loc) => {
      const marker = L.marker([loc.lat, loc.lng], {
        icon: customIcon(categoryColors[loc.category] || '#1E5EAA'),
      })
        .addTo(mapInstance.current)
        .on('click', () => {
          setSelectedId(loc.id);
        });
      markersRef.current.push(marker);
    });

    if (filtered.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapInstance.current.fitBounds(group.getBounds().pad(0.3));
    }
  }, [filtered]);

  const selected = locations.find((l) => l.id === selectedId) || filtered[0];

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col">
      <div className="container mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-gov-600 transition-colors">首页</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-800 font-medium">服务地图</span>
        </nav>

        <div className="mb-6">
          <h1 className="section-title flex items-center gap-3">
            <MapIcon className="w-8 h-8 text-gov-600" />
            服务地图
          </h1>
          <p className="section-subtitle">就近查找全市政务服务、医疗、社区等便民服务网点</p>
        </div>

        <div className="card p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索网点名称或地址..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-gov-400 focus:ring-2 focus:ring-gov-100 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-5 h-5 text-gray-400" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={
                    activeCategory === cat
                      ? 'px-3.5 py-1.5 rounded-lg bg-gov-500 text-white text-sm font-medium transition-all'
                      : 'px-3.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm hover:bg-gray-200 transition-all'
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-[1fr_360px] gap-6 h-[600px] md:h-[calc(100vh-320px)]">
          <div className="card overflow-hidden relative">
            <div ref={mapRef} className="w-full h-full" />
            <button className="absolute bottom-5 right-5 z-10 w-12 h-12 rounded-full bg-gov-500 text-white shadow-xl flex items-center justify-center hover:bg-gov-600 transition-colors">
              <Navigation className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-4 overflow-hidden">
            {selected && (
              <div className="card p-5 flex-shrink-0 animate-fade-in-up">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="chip bg-gov-100 text-gov-700 mb-2">{selected.category}</span>
                    <h3 className="font-semibold text-lg text-gray-900">{selected.name}</h3>
                  </div>
                  {selected.distance && (
                    <span className="text-sm font-bold text-warm-600">{selected.distance}</span>
                  )}
                </div>
                <div className="space-y-2.5 text-sm">
                  <p className="flex items-start gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    {selected.address}
                  </p>
                  <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-gov-600 hover:text-gov-700 font-medium">
                    <Phone className="w-4 h-4 text-gov-500" />
                    {selected.phone}
                  </a>
                  <p className="flex items-start gap-2 text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    {selected.hours}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {selected.services.map((s) => (
                    <span key={s} className="chip bg-gray-100 text-gray-600 text-xs">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="card p-2 flex-1 overflow-y-auto">
              {filtered.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => {
                    setSelectedId(loc.id);
                    if (mapInstance.current) {
                      mapInstance.current.panTo([loc.lat, loc.lng]);
                      mapInstance.current.setZoom(15);
                    }
                  }}
                  className={cn(
                    'w-full text-left p-3 rounded-xl mb-1 last:mb-0 transition-all',
                    selectedId === loc.id ? 'bg-gov-50' : 'hover:bg-gray-50',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{loc.name}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{loc.address}</p>
                    </div>
                    {loc.distance && (
                      <span className="text-xs text-warm-600 font-medium flex-shrink-0">{loc.distance}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
