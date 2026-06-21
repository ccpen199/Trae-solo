import { useEffect, useState } from 'react';
import { Bell, X, Calendar } from 'lucide-react';
import { useStore } from '@/store';
import { mockJobs, mockResumes, mockApplications, mockInterviews, mockAnalyticsData, mockCompanies, mockVerificationRecords } from '@/mock/data';
import InterviewCard from '@/components/business/InterviewCard';
import type { Interview, InterviewStatus } from '@/../shared/types';

const tabs = [
  { id: 'pending', name: '待响应', statuses: ['pending'] },
  { id: 'accepted', name: '已接受', statuses: ['accepted'] },
  { id: 'completed', name: '已完成', statuses: ['completed'] },
  { id: 'rejected', name: '已拒绝/过期', statuses: ['rejected', 'expired', 'cancelled'] },
];

export default function InterviewManagement() {
  const { setEmployerInterviews, employerInterviews, setCompany, setVerificationRecord, updateJob } = useStore();
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    setEmployerInterviews(mockInterviews);
    setCompany(mockCompanies[0]);
    setVerificationRecord(mockVerificationRecords[0]);
  }, [setEmployerInterviews, setCompany, setVerificationRecord]);

  const getFilteredInterviews = () => {
    const tab = tabs.find(t => t.id === activeTab);
    if (!tab) return employerInterviews;
    return employerInterviews.filter(
      interview => tab.statuses.includes(interview.status)
    );
  };

  const handleSendReminder = (interview: Interview) => {
    alert(`已向 ${interview.userName} 发送面试提醒`);
  };

  const handleCancelInterview = (interviewId: string) => {
    if (window.confirm('确定要取消这个面试邀约吗？')) {
      const updatedInterviews = employerInterviews.map(interview =>
        interview.id === interviewId
          ? { ...interview, status: 'cancelled' as InterviewStatus }
          : interview
      );
      useStore.getState().setEmployerInterviews(updatedInterviews);
    }
  };

  const getTabCount = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return 0;
    return mockInterviews.filter(
      interview => tab.statuses.includes(interview.status)
    ).length;
  };

  const filteredInterviews = getFilteredInterviews();

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">面试管理</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>共 {mockInterviews.length} 场面试</span>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-2 mb-6">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.name}
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {getTabCount(tab.id)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'pending' && (
        <div className="glass rounded-2xl p-4 mb-6 bg-accent/5 border border-accent/20">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">待处理提醒</p>
              <p className="text-xs text-gray-500 mt-0.5">
                您有 {getTabCount('pending')} 场面试等待候选人响应，请及时跟进。对于长时间未响应的候选人，可发送提醒或取消邀约。
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInterviews.map((interview: Interview) => (
          <div key={interview.id} className="relative">
            <InterviewCard
              interview={interview}
              role="employer"
            />
            {interview.status === 'pending' && (
              <div className="flex gap-2 mt-3 px-1">
                <button
                  onClick={() => handleSendReminder(interview)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors text-sm font-medium"
                >
                  <Bell className="h-4 w-4" />
                  发送提醒
                </button>
                <button
                  onClick={() => handleCancelInterview(interview.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <X className="h-4 w-4" />
                  取消邀约
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredInterviews.length === 0 && (
        <div className="text-center py-16 glass rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500">
            {activeTab === 'pending'
              ? '暂无待响应的面试'
              : activeTab === 'accepted'
              ? '暂无已接受的面试'
              : activeTab === 'completed'
              ? '暂无已完成的面试'
              : '暂无已拒绝或过期的面试'}
          </p>
        </div>
      )}
    </div>
  );
}
