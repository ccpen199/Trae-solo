import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { contentApi } from '../../lib/api';
import type { Content, ContentType } from '../../../shared/types';

const MobileContentPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ContentType | 'all'>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['h5-content-list', activeTab, page],
    queryFn: async () => {
      const res = await contentApi.getList({
        page,
        pageSize: 10,
        status: 'published',
        type: activeTab === 'all' ? undefined : activeTab,
      });
      return res.data;
    },
  });

  const tabs = [
    { key: 'all' as const, label: '全部' },
    { key: 'article' as const, label: '📄 图文' },
    { key: 'video' as const, label: '🎬 视频' },
    { key: 'vr' as const, label: '🎮 VR' },
    { key: 'infographic' as const, label: '📊 图解' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-white text-ink-600 hover:bg-ink-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-3 animate-pulse">
              <div className="flex gap-3">
                <div className="w-24 h-24 bg-ink-100 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-ink-100 rounded w-3/4"></div>
                  <div className="h-3 bg-ink-100 rounded w-full"></div>
                  <div className="h-3 bg-ink-100 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.items?.map((content: Content) => (
            <div
              key={content.id}
              onClick={() => navigate(`/h5/content/${content.id}`)}
              className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex gap-3">
                <img
                  src={content.coverImage || 'https://picsum.photos/100/100'}
                  alt={content.title}
                  className="w-24 h-24 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      content.type === 'article' ? 'bg-primary-50 text-primary-600' :
                      content.type === 'video' ? 'bg-landscape-50 text-landscape-600' :
                      content.type === 'vr' ? 'bg-porcelain-50 text-porcelain-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {content.type === 'article' ? '图文' : content.type === 'video' ? '视频' :
                       content.type === 'vr' ? 'VR' : '图解'}
                    </span>
                    {content.copyright?.watermarkEnabled && (
                      <span className="text-xs text-ink-400">© 版权</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-ink-800 text-sm line-clamp-2 mb-1">{content.title}</h3>
                  <p className="text-xs text-ink-500 line-clamp-2 mb-2">{content.summary}</p>
                  <div className="flex items-center gap-3 text-xs text-ink-400">
                    <span>{content.authorName}</span>
                    <span>👁 {content.views.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white rounded-lg text-sm disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-ink-500">{page} / {data.totalPages}</span>
          <button
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page === data.totalPages}
            className="px-4 py-2 bg-white rounded-lg text-sm disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default MobileContentPage;
