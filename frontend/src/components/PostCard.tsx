import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Post } from '../types';
import { Card, Avatar, Badge, Icon } from './ui';
import {
  formatTime,
  formatDistance,
  getPostTypeLabel,
  getPostTypeColor,
  getSourceLevelLabel,
  getSourceLevelColor,
  getSourceLevelDesc,
  getRiskLevelLabel,
  getRiskLevelColor,
} from '../utils/format';

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const navigate = useNavigate();

  const hasImages = post.images && post.images.length > 0;
  const gridCols = post.images!.length >= 3 ? 'grid-cols-3' : post.images!.length === 2 ? 'grid-cols-2' : 'grid-cols-1';

  const latestAudit = post.auditLogs?.[0];
  const riskLevel = latestAudit?.riskLevel;
  const hasAuditRecords = post.auditLogs && post.auditLogs.length > 1;
  const hasTrace = post.auditLogs && post.auditLogs.length > 0;

  const isRumor = post.auditLogs?.some(log => log.action === 'RUMOR');
  const isClarified = post.auditLogs?.some(log => log.action === 'CLARIFY');
  const isMetro = post.topics?.some(t => t.topic.name.includes('地铁') || t.topic.name.includes('出行'));
  const isOfficialVerified = post.sourceLevel === 'OFFICIAL' || post.sourceLevel === 'GOV' || hasAuditRecords;

  return (
    <Card
      className="p-5 hover:shadow-lg transition-all duration-300"
      onClick={() => navigate(`/posts/${post.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar src={post.user.avatar} name={post.user.nickname} />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">{post.user.nickname}</span>
              {post.user.isVerified && <Badge className="bg-blue-100 text-blue-700">✓ 已认证</Badge>}
              {post.sourceLevel !== 'ORDINARY' && (
                <Badge
                  className={`${getSourceLevelColor(post.sourceLevel)} text-white`}
                  title={getSourceLevelDesc(post.sourceLevel)}
                >
                  {getSourceLevelLabel(post.sourceLevel)}
                </Badge>
              )}
              {isOfficialVerified && !post.sourceLevel.includes('OFFICIAL') && !post.sourceLevel.includes('GOV') && (
                <Badge className="bg-blue-100 text-blue-700" title="已通过官方核验">
                  ✓ 官方核验
                </Badge>
              )}
              {isRumor && (
                <Badge className="bg-red-100 text-red-700">
                  ⚠️ 疑似谣言
                </Badge>
              )}
              {isClarified && (
                <Badge className="bg-green-100 text-green-700">
                  ✓ 已辟谣
                </Badge>
              )}
              {isMetro && (
                <Badge className="bg-cyan-100 text-cyan-700">
                  🚇 地铁出行
                </Badge>
              )}
              {riskLevel && riskLevel !== 'LOW' && (
                <Badge className={`${getRiskLevelColor(riskLevel)}`}>
                  {getRiskLevelLabel(riskLevel)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
              <span>{formatTime(post.createdAt)}</span>
              {post.locationName && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Icon name="location" />
                    {post.locationName}
                    {post.distance !== undefined && post.distance !== null && (
                      <span className="text-primary-500">({formatDistance(post.distance)})</span>
                    )}
                  </span>
                </>
              )}
              {hasAuditRecords && (
                <>
                  <span>·</span>
                  <span className="text-blue-500 flex items-center gap-1">
                    <Icon name="check" /> 已人工复审
                  </span>
                </>
              )}
              {hasTrace && (
                <>
                  <span>·</span>
                  <span className="text-purple-500 flex items-center gap-1">
                    🔍 可溯源
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <Badge className={`${getPostTypeColor(post.type)}`}>
          {getPostTypeLabel(post.type)}
        </Badge>
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug line-clamp-2">
        {post.isPitfall && <span className="text-red-500 mr-1">⚠️</span>}
        {post.title}
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4 whitespace-pre-line">
        {post.content}
      </p>

      {/* Images */}
      {hasImages && (
        <div className={`grid ${gridCols} gap-2 mb-4`}>
          {post.images!.slice(0, 9).map((img, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden flex items-center justify-center text-4xl"
            >
              {['🍜', '☕', '🏞️', '🎂', '🏙️', '🌆', '🍱', '🥘', '🍲'][i % 9]}
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {post.topics && post.topics.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.topics.map((t) => (
            <span
              key={t.topic.id}
              className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium"
            >
              {t.topic.name}
            </span>
          ))}
        </div>
      )}

      {/* Price & Meta */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex items-center gap-3 flex-wrap">
          {post.priceAnchor && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-lg">
              <span className="text-xs text-orange-600">人均</span>
              <span className="text-base font-bold text-orange-600">¥{post.priceAnchor}</span>
            </div>
          )}
          {post.hasProof && (
            <Badge className="bg-green-50 text-green-700">
              <Icon name="check" /> 真实消费
            </Badge>
          )}
          {post.isPitfall && (
            <Badge className="bg-red-50 text-red-600">
              ⚠️ 避坑置顶
            </Badge>
          )}
          {post.hotScore > 100 && (
            <Badge className="bg-red-50 text-red-600">
              <Icon name="fire" /> 热度 {Math.round(post.hotScore)}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Icon name="like" /> {post.likeCount}
          </span>
          <span className="flex items-center gap-1">
            <Icon name="comment" /> {post.commentCount}
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <Icon name="share" /> {post.shareCount}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default PostCard;
