'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, GraduationCap, Award, MessageCircle, Wifi, WifiOff } from 'lucide-react';
import type { DoctorProfile } from '@pet/shared/types';

const mockDoctor: DoctorProfile = {
  id: '1', userId: 'd1', realName: '张医生', title: '主任医师', department: '内科', hospital: '北京宠物医院', yearsOfExperience: 15, specialties: ['猫科疾病', '内科', '消化系统疾病'], education: [
    { school: '中国农业大学', degree: '博士', major: '兽医学', startYear: 2005, endYear: 2009 },
    { school: '南京农业大学', degree: '硕士', major: '临床兽医学', startYear: 2003, endYear: 2005 },
  ], certificates: ['执业兽医师资格证', '猫科专科认证'], licenseNumber: 'VET20100001', licenseImage: '', introduction: '擅长猫科常见病和内科疾病诊疗，拥有15年临床经验。曾在北京多家知名宠物医院任职，对猫科泌尿系统疾病、消化系统疾病有深入研究。', consultationFee: 50, consultationCount: 1234, rating: 4.9, reviewCount: 567, status: 'verified', isOnline: true, verifiedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
};

export default function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<'intro' | 'reviews'>('intro');
  const doctor = mockDoctor;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-4">
        <Link href="/community/doctor" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          返回医生列表
        </Link>

        <div className="rounded-xl border bg-card p-6 mb-4">
          <div className="flex gap-4">
            <div className="h-20 w-20 shrink-0 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-pet-navy">
              {doctor.avatar ? (
                <img src={doctor.avatar} alt={doctor.realName} className="h-20 w-20 rounded-full object-cover" />
              ) : (
                doctor.realName.charAt(0)
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-foreground">{doctor.realName}</h1>
                {doctor.isOnline ? (
                  <span className="flex items-center gap-0.5 text-xs text-green-600">
                    <Wifi className="h-3 w-3" /> 在线
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <WifiOff className="h-3 w-3" /> 离线
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {doctor.title} · {doctor.department} · {doctor.hospital}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {doctor.specialties.map((spec) => (
                  <span key={spec} className="rounded bg-pet-cream px-2 py-0.5 text-xs text-pet-orange">{spec}</span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {doctor.rating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {doctor.consultationCount}次问诊
                </span>
                <span className="text-pet-orange font-semibold">¥{doctor.consultationFee}/次</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-b mb-4">
          <button
            onClick={() => setActiveTab('intro')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'intro' ? 'border-pet-teal text-pet-teal' : 'border-transparent text-muted-foreground'
            }`}
          >
            医生简介
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'reviews' ? 'border-pet-teal text-pet-teal' : 'border-transparent text-muted-foreground'
            }`}
          >
            患者评价 ({doctor.reviewCount})
          </button>
        </div>

        {activeTab === 'intro' && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-2">个人简介</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{doctor.introduction}</p>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-pet-teal" />
                教育经历
              </h3>
              <div className="space-y-3">
                {doctor.education.map((edu, i) => (
                  <div key={i} className="border-l-2 border-pet-teal/30 pl-3">
                    <p className="text-sm font-medium text-foreground">{edu.school}</p>
                    <p className="text-xs text-muted-foreground">{edu.degree} · {edu.major} · {edu.startYear}-{edu.endYear}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-pet-gold" />
                资质证书
              </h3>
              <div className="flex flex-wrap gap-2">
                {doctor.certificates.map((cert) => (
                  <span key={cert} className="rounded bg-pet-gold/10 px-2.5 py-1 text-xs text-pet-navy">{cert}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            暂无评价
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4">
          <div className="container max-w-4xl">
            <button
              disabled={!doctor.isOnline}
              className="w-full rounded-full bg-pet-teal py-3 text-sm font-medium text-white hover:bg-pet-teal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {doctor.isOnline ? `立即问诊 ¥${doctor.consultationFee}` : '医生当前离线'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
