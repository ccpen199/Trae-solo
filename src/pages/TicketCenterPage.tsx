import { useState } from 'react';
import { Ticket, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import TicketCard from '../components/TicketCard';
import type { Ticket as TicketType } from '../types';

export default function TicketCenterPage() {
  const { tickets, setCurrentPage, isLoggedIn } = useAppStore();
  const [activeTab, setActiveTab] = useState<'all' | 'valid' | 'used' | 'expired'>('all');

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Ticket className="w-16 h-16 text-cinema-text-muted mx-auto mb-4" />
          <h2 className="text-xl font-bold text-cinema-text mb-2">请先登录</h2>
          <p className="text-cinema-text-secondary mb-6">登录后可查看您的电影票</p>
          <button
            onClick={() => setCurrentPage('login')}
            className="btn-primary"
          >
            立即登录
          </button>
        </div>
      </div>
    );
  }

  const filteredTickets = tickets.filter((ticket) => {
    switch (activeTab) {
      case 'valid':
        return ticket.status === 'valid';
      case 'used':
        return ticket.status === 'used';
      case 'expired':
        return ticket.status === 'expired';
      default:
        return true;
    }
  });

  const tabs = [
    { id: 'all', label: '全部', count: tickets.length },
    { id: 'valid', label: '待使用', count: tickets.filter(t => t.status === 'valid').length },
    { id: 'used', label: '已使用', count: tickets.filter(t => t.status === 'used').length },
    { id: 'expired', label: '已过期', count: tickets.filter(t => t.status === 'expired').length },
  ];

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-cinema-red/20 to-transparent py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setCurrentPage('home')}
              className="p-2 hover:bg-cinema-bg-light rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-cinema-text-secondary" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-cinema-text">我的电影票</h1>
              <p className="text-cinema-text-secondary mt-1">共 {tickets.length} 张电影票</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-4">
        <div className="bg-cinema-bg-light rounded-xl border border-cinema-border p-1 inline-flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-cinema-red text-white'
                  : 'text-cinema-text-secondary hover:text-cinema-text'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-white/20'
                    : 'bg-cinema-bg'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {filteredTickets.length > 0 ? (
            <div className="grid gap-6">
              {filteredTickets.map((ticket, index) => (
                <div
                  key={ticket.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <TicketCard ticket={ticket} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Ticket className="w-16 h-16 text-cinema-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-bold text-cinema-text mb-2">
                暂无电影票
              </h3>
              <p className="text-cinema-text-secondary mb-6">
                快去挑选喜欢的电影吧
              </p>
              <button
                onClick={() => setCurrentPage('home')}
                className="btn-primary"
              >
                去购票
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
