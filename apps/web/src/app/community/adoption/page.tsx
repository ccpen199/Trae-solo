'use client';

import { useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import Link from 'next/link';
import { AdoptionCard } from '@/components/community/adoption-card';
import type { AdoptionPost, PetType } from '@pet/shared/types';
import { PET_TYPE_LABELS } from '@pet/shared/constants';

const petTypeFilters: { value: PetType | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'cat', label: '猫咪' },
  { value: 'dog', label: '狗狗' },
  { value: 'bird', label: '鸟类' },
  { value: 'hamster', label: '仓鼠' },
  { value: 'rabbit', label: '兔子' },
];

const adoptionTypeFilters = [
  { value: 'all', label: '全部' },
  { value: 'free', label: '免费' },
  { value: 'fee', label: '有偿' },
];

const mockAdoptions: AdoptionPost[] = [
  { id: '1', postId: 'p1', userId: 'u1', petType: 'cat', petName: '小橘', petAge: 1, petGender: 'male', breed: '橘猫', vaccinated: true, neutered: false, healthCondition: '健康活泼，已驱虫', location: '北京朝阳', adoptionType: 'free', requirements: ['有养猫经验', '稳定住所'], contactInfo: '微信: xxx', status: 'open', applicantCount: 12, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', postId: 'p2', userId: 'u2', petType: 'dog', petName: '旺财', petAge: 2, petGender: 'male', breed: '金毛', vaccinated: true, neutered: true, healthCondition: '性格温顺，已绝育疫苗全', location: '上海浦东', adoptionType: 'free', requirements: ['有院子优先'], contactInfo: '微信: yyy', status: 'open', applicantCount: 8, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', postId: 'p3', userId: 'u3', petType: 'cat', petName: '花花', petAge: 0.5, petGender: 'female', breed: '英短', vaccinated: false, neutered: false, healthCondition: '幼猫，健康', location: '广州天河', adoptionType: 'fee', adoptionFee: 500, requirements: ['爱猫人士'], contactInfo: '电话: xxx', status: 'open', applicantCount: 5, createdAt: new Date(), updatedAt: new Date() },
];

export default function AdoptionListPage() {
  const [selectedPetType, setSelectedPetType] = useState<PetType | 'all'>('all');
  const [selectedAdoptionType, setSelectedAdoptionType] = useState('all');

  const filteredAdoptions = mockAdoptions.filter((a) => {
    if (selectedPetType !== 'all' && a.petType !== selectedPetType) return false;
    if (selectedAdoptionType !== 'all' && a.adoptionType !== selectedAdoptionType) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">领养中心</h1>
          <Link
            href="/community/post/create"
            className="flex items-center gap-1.5 rounded-full bg-pet-teal px-4 py-2 text-sm font-medium text-white hover:bg-pet-teal/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            发布领养
          </Link>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索品种、地区..."
            className="w-full rounded-full border bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pet-teal/50"
          />
        </div>

        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2">
          {petTypeFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedPetType(filter.value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors ${
                selectedPetType === filter.value
                  ? 'bg-pet-orange text-white'
                  : 'border text-muted-foreground hover:border-pet-orange hover:text-pet-orange'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-6">
          {adoptionTypeFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedAdoptionType(filter.value)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                selectedAdoptionType === filter.value
                  ? 'bg-pet-teal text-white'
                  : 'border text-muted-foreground hover:border-pet-teal hover:text-pet-teal'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredAdoptions.map((adoption) => (
            <AdoptionCard key={adoption.id} adoption={adoption} />
          ))}
          {filteredAdoptions.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              暂无符合条件的领养信息
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
