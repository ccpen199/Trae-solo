import { useState } from 'react';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
import HospitalCard from '@/components/HospitalCard';
import type { Hospital } from '@shared/types';

const mockHospitals: Hospital[] = [
  {
    id: 'h1',
    userId: 'hu1',
    name: '爱宠动物医院（总院）',
    address: '北京市朝阳区建国路88号',
    latitude: 39.9087,
    longitude: 116.4978,
    phone: '010-12345678',
    businessHours: '08:00 - 22:00',
    rating: 4.8,
    reviewCount: 2356,
    verified: true,
    services: [
      { id: 's1', hospitalId: 'h1', name: '常规体检', description: '', price: 199, duration: 30 },
      { id: 's2', hospitalId: 'h1', name: '疫苗接种', description: '', price: 80, duration: 15 },
      { id: 's3', hospitalId: 'h1', name: '绝育手术', description: '', price: 880, duration: 120 },
    ],
  },
  {
    id: 'h2',
    userId: 'hu2',
    name: '宠物之家诊疗中心',
    address: '北京市海淀区中关村大街1号',
    latitude: 39.9847,
    longitude: 116.3046,
    phone: '010-87654321',
    businessHours: '24小时',
    rating: 4.6,
    reviewCount: 1089,
    verified: true,
    services: [
      { id: 's4', hospitalId: 'h2', name: '急诊服务', description: '', price: 299, duration: 60 },
      { id: 's5', hospitalId: 'h2', name: '影像检查', description: '', price: 350, duration: 30 },
    ],
  },
  {
    id: 'h3',
    userId: 'hu3',
    name: '瑞派宠物医院',
    address: '北京市西城区金融街15号',
    latitude: 39.9139,
    longitude: 116.3636,
    phone: '010-66668888',
    businessHours: '09:00 - 21:00',
    rating: 4.5,
    reviewCount: 756,
    verified: true,
    services: [],
  },
  {
    id: 'h4',
    userId: 'hu4',
    name: '伴侣动物医院',
    address: '北京市东城区东直门南大街9号',
    latitude: 39.9418,
    longitude: 116.4347,
    phone: '010-55556666',
    businessHours: '08:30 - 20:30',
    rating: 4.7,
    reviewCount: 1567,
    verified: true,
    services: [],
  },
];

export default function HospitalList() {
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  const filteredHospitals = mockHospitals.filter(
    (h) =>
      h.name.includes(search) ||
      h.address.includes(search) ||
      h.services.some((s) => s.name.includes(search))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">附近医院</h1>
        <p className="section-subtitle">专业靠谱的宠物诊疗机构</p>
      </div>

      <div className="card">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索医院名称、地址或服务..."
              className="input-field pl-12"
            />
          </div>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="p-3 rounded-2xl bg-forest-50 text-forest-600 hover:bg-forest-100 transition-colors flex-shrink-0"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {filterOpen && (
          <div className="mt-4 pt-4 border-t border-forest-50 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['24小时营业', '认证医院', '可急诊', '有停车场'].map((tag) => (
              <button
                key={tag}
                className="px-4 py-2 rounded-xl bg-cream-50 text-gray-700 text-sm hover:bg-cream-100 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-48 rounded-3xl bg-gradient-to-br from-forest-100 to-forest-50 flex items-center justify-center shadow-card">
        <div className="text-center">
          <MapPin className="w-10 h-10 text-forest-400 mx-auto mb-2" />
          <p className="text-sm text-forest-600 font-medium">地图视图</p>
        </div>
      </div>

      <div className="space-y-4">
        {filteredHospitals.map((hospital) => (
          <HospitalCard key={hospital.id} hospital={hospital} />
        ))}
      </div>
    </div>
  );
}
