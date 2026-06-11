'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter } from 'lucide-react';
import { DoctorCard } from '@/components/community/doctor-card';
import type { DoctorProfile } from '@pet/shared/types';

const departments = ['全部', '内科', '外科', '皮肤科', '眼科', '牙科', '骨科', '产科'];

const mockDoctors: DoctorProfile[] = [
  { id: '1', userId: 'd1', realName: '张医生', title: '主任医师', department: '内科', hospital: '北京宠物医院', yearsOfExperience: 15, specialties: ['猫科疾病', '内科'], education: [], certificates: [], licenseNumber: '', licenseImage: '', introduction: '擅长猫科常见病和内科疾病诊疗，拥有15年临床经验', consultationFee: 50, consultationCount: 1234, rating: 4.9, reviewCount: 567, status: 'verified', isOnline: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', userId: 'd2', realName: '李医生', title: '副主任医师', department: '皮肤科', hospital: '上海宠物中心', yearsOfExperience: 10, specialties: ['皮肤病', '过敏'], education: [], certificates: [], licenseNumber: '', licenseImage: '', introduction: '专注宠物皮肤问题治疗，对过敏性皮炎有深入研究', consultationFee: 40, consultationCount: 890, rating: 4.8, reviewCount: 345, status: 'verified', isOnline: false, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', userId: 'd3', realName: '王医生', title: '主治医师', department: '外科', hospital: '广州动物医院', yearsOfExperience: 8, specialties: ['骨科', '微创手术'], education: [], certificates: [], licenseNumber: '', licenseImage: '', introduction: '擅长宠物骨折修复和微创手术', consultationFee: 60, consultationCount: 567, rating: 4.7, reviewCount: 234, status: 'verified', isOnline: true, createdAt: new Date(), updatedAt: new Date() },
];

export default function DoctorListPage() {
  const [selectedDept, setSelectedDept] = useState('全部');
  const [filterOnline, setFilterOnline] = useState(false);

  const filteredDoctors = mockDoctors.filter((d) => {
    if (selectedDept !== '全部' && d.department !== selectedDept) return false;
    if (filterOnline && !d.isOnline) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">在线医生</h1>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索医生姓名、科室、专长..."
            className="w-full rounded-full border bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-pet-teal/50"
          />
        </div>

        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors ${
                selectedDept === dept
                  ? 'bg-pet-teal text-white'
                  : 'border text-muted-foreground hover:border-pet-teal hover:text-pet-teal'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setFilterOnline(!filterOnline)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
              filterOnline
                ? 'bg-green-100 text-green-700'
                : 'border text-muted-foreground hover:border-green-500 hover:text-green-600'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            仅看在线
          </button>
        </div>

        <div className="space-y-3">
          {filteredDoctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
          {filteredDoctors.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              暂无符合条件的医生
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
