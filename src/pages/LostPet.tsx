import { useState } from 'react';
import { Plus, Search, MapPin, Filter, Search as SearchIcon } from 'lucide-react';
import LostPetCard from '@/components/LostPetCard';
import type { LostPetTask } from '@shared/types';
import { cn } from '@/lib/utils';

const mockTasks: LostPetTask[] = [
  {
    id: 't1',
    ownerId: 'u1',
    petName: '球球',
    species: '狗狗',
    description: '金毛幼犬，金色毛发，脖子上有蓝色项圈，项圈上有主人联系方式。于6月12日下午在朝阳公园附近走失，性格温顺不咬人。',
    lastSeenLocation: { lat: 39.9339, lng: 116.4728, address: '北京市朝阳区朝阳公园南门' },
    lastSeenTime: '2025-06-12T15:30:00Z',
    reward: 2000,
    status: 'searching',
    clues: [
      { id: 'c1', taskId: 't1', reporterId: 'u2', content: '昨天下午在蓝色港湾附近看到一只类似的狗狗', verified: false, createdAt: '2025-06-13T09:00:00Z' },
    ],
    adoptionIntents: [],
    createdAt: '2025-06-12T16:00:00Z',
  },
  {
    id: 't2',
    ownerId: 'u2',
    petName: '咪咪',
    species: '猫咪',
    description: '英短银渐层，母猫，约2岁，已绝育。左耳有轻微缺口。于6月10日晚上从家中走失，家住海淀区中关村附近。',
    lastSeenLocation: { lat: 39.9847, lng: 116.3046, address: '北京市海淀区中关村南大街' },
    lastSeenTime: '2025-06-10T22:00:00Z',
    reward: 1000,
    status: 'searching',
    clues: [],
    adoptionIntents: [
      { id: 'a1', taskId: 't2', applicantId: 'u3', message: '我家附近经常有流浪猫出没，我会帮您留意', level: 'interested', createdAt: '2025-06-11T08:00:00Z' },
    ],
    createdAt: '2025-06-10T23:00:00Z',
  },
  {
    id: 't3',
    ownerId: 'u3',
    petName: '豆豆',
    species: '狗狗',
    description: '柴犬，公，3岁，赤色毛发，性格活泼。已于6月8日被好心人在通州区找到并联系主人接回，感谢大家的帮助！',
    lastSeenLocation: { lat: 39.9087, lng: 116.6568, address: '北京市通州区梨园' },
    lastSeenTime: '2025-06-05T10:00:00Z',
    reward: 1500,
    status: 'found',
    clues: [],
    adoptionIntents: [],
    createdAt: '2025-06-05T12:00:00Z',
  },
  {
    id: 't4',
    ownerId: 'u4',
    petName: '小白',
    species: '兔子',
    description: '荷兰垂耳兔，白色毛发，耳朵下垂。于6月14日上午在小区花园走失，可能跑到隔壁小区了。',
    lastSeenLocation: { lat: 39.9139, lng: 116.3636, address: '北京市西城区金融街某小区' },
    lastSeenTime: '2025-06-14T09:00:00Z',
    reward: 500,
    status: 'searching',
    clues: [],
    adoptionIntents: [],
    createdAt: '2025-06-14T10:00:00Z',
  },
];

const statusTabs = [
  { value: 'all', label: '全部' },
  { value: 'searching', label: '寻找中' },
  { value: 'found', label: '已找到' },
];

export default function LostPet() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const filteredTasks = mockTasks.filter((task) => {
    const matchesStatus = status === 'all' || task.status === status;
    const matchesSearch =
      task.petName.includes(search) ||
      task.description.includes(search) ||
      task.species.includes(search);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title">寻宠公益</h1>
          <p className="section-subtitle">帮助走失的毛孩子回家</p>
        </div>
        <button className="btn-warm">
          <Plus className="w-5 h-5" />
          发布寻宠
        </button>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-warm-400 to-warm-500 p-6 text-white shadow-soft">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <SearchIcon className="w-6 h-6" />
              <h2 className="font-display font-bold text-xl">一起帮毛孩子回家</h2>
            </div>
            <p className="text-white/80 text-sm max-w-lg">
              您的每一次转发和留意，都可能帮助一只走失的宠物重新回到主人身边。让我们一起传递温暖。
            </p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{mockTasks.filter((t) => t.status === 'searching').length}</p>
              <p className="text-sm text-white/80">寻找中</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{mockTasks.filter((t) => t.status === 'found').length}</p>
              <p className="text-sm text-white/80">已团聚</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索宠物名称、品种或描述..."
              className="input-field pl-12"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-5 h-5 text-gray-400 flex-shrink-0 self-center" />
            {statusTabs.map((t) => (
              <button
                key={t.value}
                onClick={() => setStatus(t.value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  status === t.value
                    ? 'bg-forest-500 text-white'
                    : 'bg-forest-50 text-forest-700 hover:bg-forest-100'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-40 rounded-3xl bg-gradient-to-br from-warm-50 to-warm-100 flex items-center justify-center shadow-card">
        <div className="text-center">
          <MapPin className="w-10 h-10 text-warm-300 mx-auto mb-2" />
          <p className="text-sm text-warm-500 font-medium">地图视图 - 查看附近走失宠物</p>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="card text-center py-12">
          <SearchIcon className="w-16 h-16 text-warm-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-1">暂无寻宠信息</h3>
          <p className="text-sm text-gray-500">如果您的宠物走失，点击上方按钮发布寻宠启事</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <LostPetCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
