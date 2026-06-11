import React from 'react';
import type { Content } from '../../../shared/types';
import StatusBadge from './StatusBadge';

interface ContentCardProps {
  content: Content;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const typeIcon: Record<string, { icon: string; color: string }> = {
  article: { icon: '📄', color: 'bg-primary-50 text-primary-600' },
  video: { icon: '🎬', color: 'bg-landscape-50 text-landscape-600' },
  vr: { icon: '🎮', color: 'bg-porcelain-50 text-porcelain-600' },
  infographic: { icon: '📊', color: 'bg-amber-50 text-amber-600' },
};

const typeLabel: Record<string, string> = {
  article: '图文',
  video: '视频',
  vr: 'VR导览',
  infographic: '信息图',
};

const ContentCard: React.FC<ContentCardProps> = ({ content, onView, onEdit }) => {
  const iconConfig = typeIcon[content.type] || typeIcon.article;

  return (
    <div className="card chinese-border hover:shadow-lg transition-all duration-300 group cursor-pointer" onClick={() => onView?.(content.id)}>
      <div className="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-lg">
        <img
          src={content.coverImage || 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&h=200&fit=crop'}
          alt={content.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <span className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium ${iconConfig.color}`}>
          {iconConfig.icon} {typeLabel[content.type]}
        </span>
        <StatusBadge status={content.status as any} className="absolute top-3 right-3" />
        <h3 className="absolute bottom-3 left-4 right-4 text-white font-semibold text-sm line-clamp-2">
          {content.title}
        </h3>
      </div>

      <p className="text-ink-500 text-sm line-clamp-2 mb-3">{content.summary}</p>

      <div className="flex items-center justify-between text-xs text-ink-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {content.views.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {content.likes}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {content.shares}
          </span>
        </div>
        <button
          className="text-primary-500 hover:text-primary-600 font-medium"
          onClick={(e) => { e.stopPropagation(); onEdit?.(content.id); }}
        >
          编辑
        </button>
      </div>
    </div>
  );
};

export default ContentCard;
