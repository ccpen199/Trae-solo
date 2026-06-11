'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Heart, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { PET_TYPE_LABELS } from '@pet/shared/constants';
import type { AdoptionPost, PetGender } from '@pet/shared/types';

const mockAdoption: AdoptionPost = {
  id: '1', postId: 'p1', userId: 'u1', petType: 'cat', petName: '小橘', petAge: 1, petGender: 'male', breed: '橘猫', vaccinated: true, neutered: false, healthCondition: '健康活泼，已驱虫，定期体检', location: '北京市朝阳区', adoptionType: 'free', requirements: ['有养猫经验', '稳定住所', '家中需安装纱窗'], contactInfo: '微信: catlover_2024', status: 'open', applicantCount: 12, createdAt: new Date(), updatedAt: new Date(),
};

const genderLabels: Record<PetGender, string> = {
  male: '公',
  female: '母',
  unknown: '未知',
};

export default function AdoptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const adoption = mockAdoption;
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    experience: '',
    livingCondition: '',
    familyMembers: 1,
    hasOtherPets: false,
    otherPetsInfo: '',
    monthlyBudget: 500,
    reason: '',
    contactInfo: '',
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-4">
        <Link href="/community/adoption" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          返回领养列表
        </Link>

        <div className="rounded-xl border bg-card p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">{adoption.petName}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="rounded bg-pet-cream px-2 py-0.5 text-pet-orange">
                  {PET_TYPE_LABELS[adoption.petType]}
                </span>
                <span>{adoption.breed}</span>
                <span>{genderLabels[adoption.petGender]}</span>
                {adoption.petAge && <span>{adoption.petAge}岁</span>}
              </div>
            </div>
            <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-sm font-medium">
              {adoption.status === 'open' ? '待领养' : adoption.status}
            </span>
          </div>

          <div className="grid gap-3 mb-4 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm">
              {adoption.vaccinated ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              <span className={adoption.vaccinated ? 'text-green-600' : 'text-amber-500'}>
                {adoption.vaccinated ? '已接种疫苗' : '未接种疫苗'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {adoption.neutered ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              <span className={adoption.neutered ? 'text-green-600' : 'text-amber-500'}>
                {adoption.neutered ? '已绝育' : '未绝育'}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">健康状况</h3>
            <p className="text-sm text-muted-foreground">{adoption.healthCondition}</p>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">领养要求</h3>
            <ul className="space-y-1">
              {adoption.requirements.map((req, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 text-pet-teal shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {adoption.location}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {adoption.applicantCount}人申请
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date(adoption.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="mt-4 pt-4 border-t">
            <span className={`text-lg font-bold ${adoption.adoptionType === 'free' ? 'text-pet-teal' : 'text-pet-orange'}`}>
              {adoption.adoptionType === 'free' ? '免费领养' : `领养费用 ¥${adoption.adoptionFee}`}
            </span>
          </div>
        </div>

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full rounded-full bg-pet-teal py-3 text-sm font-medium text-white hover:bg-pet-teal/90 transition-colors"
          >
            申请领养
          </button>
        ) : (
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-base font-semibold text-foreground mb-4">领养申请</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">养宠经验</label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="请描述你的养宠经验"
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pet-teal/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">居住条件</label>
                <textarea
                  value={formData.livingCondition}
                  onChange={(e) => setFormData({ ...formData, livingCondition: e.target.value })}
                  placeholder="请描述你的居住环境"
                  rows={2}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pet-teal/50"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">家庭人数</label>
                  <input
                    type="number"
                    value={formData.familyMembers}
                    onChange={(e) => setFormData({ ...formData, familyMembers: Number(e.target.value) })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pet-teal/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">月度预算（元）</label>
                  <input
                    type="number"
                    value={formData.monthlyBudget}
                    onChange={(e) => setFormData({ ...formData, monthlyBudget: Number(e.target.value) })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pet-teal/50"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasOtherPets"
                  checked={formData.hasOtherPets}
                  onChange={(e) => setFormData({ ...formData, hasOtherPets: e.target.checked })}
                  className="rounded border"
                />
                <label htmlFor="hasOtherPets" className="text-sm text-foreground">家中已有其他宠物</label>
              </div>
              {formData.hasOtherPets && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">其他宠物信息</label>
                  <input
                    type="text"
                    value={formData.otherPetsInfo}
                    onChange={(e) => setFormData({ ...formData, otherPetsInfo: e.target.value })}
                    placeholder="请描述家中其他宠物"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pet-teal/50"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">领养理由</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="请说明你为什么想领养这只宠物"
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pet-teal/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">联系方式</label>
                <input
                  type="text"
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  placeholder="微信号/手机号"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pet-teal/50"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-full border py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  取消
                </button>
                <button className="flex-1 rounded-full bg-pet-teal py-2.5 text-sm font-medium text-white hover:bg-pet-teal/90 transition-colors">
                  提交申请
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
