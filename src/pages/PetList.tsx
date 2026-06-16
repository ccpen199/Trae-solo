import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, PawPrint } from 'lucide-react';
import PetCard from '@/components/PetCard';
import type { Pet } from '@shared/types';
import { cn } from '@/lib/utils';

const mockPets: Pet[] = [
  {
    id: '1',
    ownerId: '1',
    name: '豆豆',
    species: 'dog',
    breed: '金毛寻回犬',
    gender: 'male',
    birthday: '2022-03-15',
    weight: 28.5,
    healthStatus: 'healthy',
    vaccineRecords: [
      { id: 'v1', petId: '1', vaccineName: '狂犬疫苗', date: '2025-01-15', nextDate: '2026-01-15' },
    ],
    dewormingRecords: [
      { id: 'd1', petId: '1', type: 'internal', productName: '拜宠清', date: '2025-03-01', nextDate: '2025-06-01' },
    ],
  },
  {
    id: '2',
    ownerId: '1',
    name: '咪咪',
    species: 'cat',
    breed: '英国短毛猫',
    gender: 'female',
    birthday: '2023-07-20',
    weight: 4.2,
    healthStatus: 'healthy',
    vaccineRecords: [],
    dewormingRecords: [],
  },
  {
    id: '3',
    ownerId: '1',
    name: '小白',
    species: 'rabbit',
    breed: '荷兰垂耳兔',
    gender: 'male',
    birthday: '2024-02-10',
    weight: 2.1,
    healthStatus: 'sick',
    vaccineRecords: [],
    dewormingRecords: [],
  },
];

const speciesFilters = [
  { value: 'all', label: '全部' },
  { value: 'dog', label: '狗狗' },
  { value: 'cat', label: '猫咪' },
  { value: 'rabbit', label: '兔子' },
  { value: 'other', label: '其他' },
];

export default function PetList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredPets = mockPets.filter((pet) => {
    const matchesSearch = pet.name.includes(search) || pet.breed.includes(search);
    const matchesFilter = filter === 'all' || pet.species === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title">宠物档案</h1>
          <p className="section-subtitle">管理你的毛孩子健康档案</p>
        </div>
        <button onClick={() => {}} className="btn-primary">
          <Plus className="w-5 h-5" />
          添加宠物
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索宠物名称或品种..."
              className="input-field pl-12"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
            {speciesFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  filter === f.value
                    ? 'bg-forest-500 text-white'
                    : 'bg-forest-50 text-forest-700 hover:bg-forest-100'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredPets.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-forest-50 flex items-center justify-center">
            <PawPrint className="w-10 h-10 text-forest-300" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">暂无宠物档案</h3>
          <p className="text-sm text-gray-500 mb-4">点击上方按钮添加你的第一只宠物</p>
          <button className="btn-primary">
            <Plus className="w-5 h-5" />
            添加宠物
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}
    </div>
  );
}
