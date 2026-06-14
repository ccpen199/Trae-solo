import { useState } from 'react';
import {
  Award,
  FileText,
  Download,
  Building2,
  Briefcase,
  Clock,
  DollarSign,
  Star,
  Calendar,
  FileCheck,
} from 'lucide-react';
import type { Certificate, Application } from '../../../shared/types';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';

const mockCompletedApplications: Application[] = [
  {
    id: '1',
    studentId: '1',
    jobId: '1',
    status: 'completed',
    appliedAt: '2024-09-01',
    workHours: 240,
    salary: 6000,
    rating: 4.9,
    comment: '工作认真负责，学习能力强，团队协作优秀。',
    job: {
      id: '1',
      companyId: '1',
      title: '前端开发实习生',
      description: '',
      location: '北京',
      salaryPerHour: 25,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      majorRequired: ['计算机'],
      workDays: ['周一', '周二', '周三', '周四', '周五'],
      workStartTime: '09:00',
      workEndTime: '18:00',
      status: 'published',
      createdAt: '2024-08-01',
    },
    company: {
      id: '1',
      name: '字节跳动',
      email: '',
      licenseNo: '',
      contactName: '',
      contactPhone: '',
      address: '',
      verified: true,
      createdAt: '',
    },
  },
  {
    id: '2',
    studentId: '1',
    jobId: '2',
    status: 'completed',
    appliedAt: '2024-06-01',
    workHours: 160,
    salary: 4800,
    rating: 4.7,
    comment: '积极主动，能够按时完成任务。',
    job: {
      id: '2',
      companyId: '2',
      title: '数据分析师',
      description: '',
      location: '杭州',
      salaryPerHour: 30,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      majorRequired: ['统计学'],
      workDays: ['周一', '周二', '周三', '周四', '周五'],
      workStartTime: '09:00',
      workEndTime: '18:00',
      status: 'published',
      createdAt: '2024-05-01',
    },
    company: {
      id: '2',
      name: '阿里巴巴',
      email: '',
      licenseNo: '',
      contactName: '',
      contactPhone: '',
      address: '',
      verified: true,
      createdAt: '',
    },
  },
];

const mockCertificates: Certificate[] = [
  {
    id: '1',
    studentId: '1',
    applicationId: '1',
    jobTitle: '前端开发实习生',
    companyName: '字节跳动',
    startDate: '2024-09-01',
    endDate: '2024-12-31',
    workHours: 240,
    salary: 6000,
    rating: 4.9,
    certificateUrl: '',
    sealUrl: '',
    createdAt: '2024-12-31',
  },
];

export default function StudentCertificate() {
  const [certificates, setCertificates] = useState<Certificate[]>(mockCertificates);
  const [completedApps] = useState<Application[]>(mockCompletedApplications);

  const handleGenerateCertificate = async (applicationId: string) => {
    try {
      const response = await api.post<Certificate>('/certificates', {
        applicationId,
      });
      setCertificates([response, ...certificates]);
    } catch (error) {
      const app = completedApps.find((a) => a.id === applicationId);
      if (app) {
        const newCert: Certificate = {
          id: Date.now().toString(),
          studentId: '1',
          applicationId,
          jobTitle: app.job?.title || '',
          companyName: app.company?.name || '',
          startDate: app.appliedAt,
          endDate: new Date().toISOString().split('T')[0],
          workHours: app.workHours || 0,
          salary: app.salary || 0,
          rating: app.rating || 0,
          certificateUrl: '',
          sealUrl: '',
          createdAt: new Date().toISOString().split('T')[0],
        };
        setCertificates([newCert, ...certificates]);
      }
    }
  };

  const handleDownload = (certId: string) => {
    console.log('下载证明:', certId);
  };

  const hasCertificate = (applicationId: string) => {
    return certificates.some((c) => c.applicationId === applicationId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">实习证明</h1>
        <p className="text-gray-500 mt-1">生成和下载你的实习证明</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedApps.length}</p>
              <p className="text-sm text-gray-500">已完成实习</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center">
              <Award className="w-6 h-6 text-accent-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
              <p className="text-sm text-gray-500">已生成证明</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {certificates.length > 0
                  ? (
                      certificates.reduce((sum, c) => sum + c.rating, 0) /
                      certificates.length
                    ).toFixed(1)
                  : '-'}
              </p>
              <p className="text-sm text-gray-500">平均评分</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">已完成实习</h2>
            <span className="text-sm text-gray-400">可生成实习证明</span>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {completedApps.map((app) => (
            <div key={app.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {app.job?.title}
                    </h3>
                    {hasCertificate(app.id) && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-success-100 text-success-600 rounded-full text-xs font-medium">
                        <FileCheck className="w-3.5 h-3.5" />
                        已生成证明
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      {app.company?.name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {app.workHours}小时
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" />
                      ¥{app.salary}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-yellow-500" />
                      {app.rating}分
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {app.appliedAt}
                    </span>
                  </div>
                  {app.comment && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-700">企业评价：</span>
                        {app.comment}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleGenerateCertificate(app.id)}
                  disabled={hasCertificate(app.id)}
                  className={cn(
                    'px-5 py-2.5 rounded-xl font-medium transition-all shrink-0',
                    hasCertificate(app.id)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-600/20'
                  )}
                >
                  {hasCertificate(app.id) ? '已生成' : '生成证明'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {certificates.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-accent-500" />
              <h2 className="text-lg font-semibold text-gray-900">我的证明</h2>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="text-xs text-white/70">{cert.createdAt}</span>
                  </div>
                  <h3 className="text-lg font-bold mt-3">实习证明</h3>
                  <p className="text-sm text-white/70 mt-0.5">Internship Certificate</p>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">公司</span>
                    <span className="text-sm font-medium text-gray-900">
                      {cert.companyName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">岗位</span>
                    <span className="text-sm font-medium text-gray-900">
                      {cert.jobTitle}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">时长</span>
                    <span className="text-sm font-medium text-gray-900">
                      {cert.workHours}小时
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">薪资</span>
                    <span className="text-sm font-medium text-accent-500">
                      ¥{cert.salary}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">评分</span>
                    <span className="text-sm font-medium text-yellow-500">
                      ⭐ {cert.rating}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <FileCheck className="w-4 h-4" />
                      含电子签章
                    </div>
                    <button
                      onClick={() => handleDownload(cert.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      下载
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
