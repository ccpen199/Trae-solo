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

const getSourceType = (content: Content): { label: 'PGC' | 'UGC'; tip: string; color: string } => {
  const professionalRoles = ['super_admin', 'government', 'scenic_admin', 'enterprise', 'editor'];
  const lower = content.authorName?.toLowerCase() || '';
  const isPgcAuthor =
    content.authorName?.includes('文旅') ||
    content.authorName?.includes('编辑') ||
    content.authorName?.includes('管理员') ||
    content.authorName?.includes('景区') ||
    content.authorName?.includes('运营') ||
    content.authorName?.includes('官方') ||
    lower.includes('admin') ||
    lower.includes('editor') ||
    lower.includes('gov') ||
    lower.includes('scenic') ||
    lower.includes('enterprise') ||
    lower.includes('zhang') ||
    lower.includes('wang') ||
    content.category?.includes('政策') ||
    content.category?.includes('官方') ||
    (content as any).sourceType === 'PGC';
  void professionalRoles;
  return isPgcAuthor
    ? { label: 'PGC', tip: '专业生产内容（官方/编辑/机构）', color: 'bg-primary-100 text-primary-700 border-primary-200' }
    : { label: 'UGC', tip: '用户生产内容（读者/游客投稿）', color: 'bg-blue-100 text-blue-700 border-blue-200' };
};

const ContentCard: React.FC<ContentCardProps> = ({ content, onView, onEdit }) => {
  const iconConfig = typeIcon[content.type] || typeIcon.article;
  const source = getSourceType(content);

  return (
    <div className="card chinese-border hover:shadow-lg transition-all duration-300 group cursor-pointer flex flex-col" onClick={() => onView?.(content.id)}>
      <div className="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-lg">
        <img
          src={content.coverImage || 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&h=200&fit=crop'}
          alt={content.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute top-3 left-3 flex gap-2 items-start">
          <span className={`px-2 py-1 rounded text-xs font-medium ${iconConfig.color}`}>
            {iconConfig.icon} {typeLabel[content.type]}
          </span>
          <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${source.color}`} title={source.tip}>
            {source.label}
          </span>
        </div>
        <StatusBadge status={content.status as any} className="absolute top-3 right-3" />
        <h3 className="absolute bottom-3 left-4 right-4 text-white font-semibold text-sm line-clamp-2">
          {content.title}
        </h3>
      </div>

      <p className="text-ink-500 text-sm line-clamp-2 mb-3 flex-1">{content.summary}</p>

      <div className="flex items-center gap-2 mb-3 text-xs flex-wrap">
        {content.authorName && (
          <span className="inline-flex items-center gap-1 text-ink-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            {content.authorName}
          </span>
        )}
        {content.region && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-landscape-50 text-landscape-600 rounded">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {content.region}
          </span>
        )}
        {content.category && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-porcelain-50 text-porcelain-600 rounded">
            {content.category}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-ink-400 pt-3 border-t border-ink-100">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1" title="浏览量">
            👁 {content.views.toLocaleString()}
          </span>
          <span className="flex items-center gap-1" title="点赞">
            ❤️ {content.likes}
          </span>
          <span className="flex items-center gap-1" title="分享">
            🔄 {content.shares}
          </span>
          <span className="flex items-center gap-1" title="评论">
            💬 {content.comments || 0}
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
