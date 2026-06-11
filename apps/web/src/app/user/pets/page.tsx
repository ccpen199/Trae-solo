'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, Syringe, Heart } from 'lucide-react';
import { PetCard } from '@/components/user/pet-card';
import type { PetProfile, PetType } from '@pet/shared/types';
import { PET_TYPE_LABELS } from '@pet/shared/constants';

const mockPets: PetProfile[] = [
  { id: 'p1', userId: 'u1', name: '小橘', type: 'cat', breed: '橘猫', gender: 'male', avatar: undefined, bio: '贪吃的小橘猫', isNeutered: true, weight: 5.2, birthday: new Date('2022-03-15'), vaccineRecords: [{ id: 'v1', petId: 'p1', vaccineName: '猫三联', vaccineDate: new Date('2022-06-15'), nextVaccineDate: new Date('2023-06-15'), hospitalName: '北京宠物医院' }], tags: ['贪吃', '亲人', '橘座'], createdAt: new Date(), updatedAt: new Date() },
  { id: 'p2', userId: 'u1', name: '旺财', type: 'dog', breed: '柯基', gender: 'male', avatar: undefined, bio: '短腿小柯基', isNeutered: false, weight: 12, birthday: new Date('2021-08-20'), tags: ['活泼', '短腿'], createdAt: new Date(), updatedAt: new Date() },
];

export default function MyPetsPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'cat' as PetType,
    breed: '',
    gender: 'male' as 'male' | 'female' | 'unknown',
    birthday: '',
    weight: '',
    bio: '',
    isNeutered: false,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-4">
        <div className="flex items-center justify-between mb-6">
          <Link href="/user" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            返回个人主页
          </Link>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 rounded-full bg-pet-orange px-4 py-2 text-sm font-medium text-white hover:bg-pet-coral transition-colors"
          >
            <Plus className="h-4 w-4" />
            添加宠物
          </button>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-6">我的宠物</h1>

        {showAddForm && (
          <div className="rounded-xl border bg-card p-6 mb-6">
            <h2 className="text-base font-semibold text-foreground mb-4">添加新宠物</h2>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">宠物名字</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="给宠物取个名字"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pet-orange/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">宠物类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PetType })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pet-orange/50"
                  >
                    {Object.entries(PET_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">品种</label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder="请输入品种"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pet-orange/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">性别</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'unknown' })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pet-orange/50"
                  >
                    <option value="male">公</option>
                    <option value="female">母</option>
                    <option value="unknown">未知</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">生日</label>
                  <input
                    type="date"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pet-orange/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">体重(kg)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="0.0"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pet-orange/50"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isNeutered"
                  checked={formData.isNeutered}
                  onChange={(e) => setFormData({ ...formData, isNeutered: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isNeutered" className="text-sm text-foreground">已绝育</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">简介</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="介绍一下你的宠物"
                  rows={2}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pet-orange/50"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 rounded-full border py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  取消
                </button>
                <button className="flex-1 rounded-full bg-pet-orange py-2.5 text-sm font-medium text-white hover:bg-pet-coral transition-colors">
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {mockPets.map((pet) => (
            <PetCard key={pet.id} pet={pet} showActions />
          ))}
        </div>
      </div>
    </div>
  );
}
