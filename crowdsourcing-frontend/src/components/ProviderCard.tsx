import React from 'react';
import { Card, Tag, Button, Avatar, Rate, Tooltip, Badge } from 'antd';
import {
  CheckCircleOutlined,
  StarOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UserOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { Provider, MatchResult } from '@/types';
import { useNavigate } from 'react-router-dom';

interface ProviderCardProps {
  provider: Provider | MatchResult;
  showMatch?: boolean;
  onInvite?: (id: string) => void;
  onView?: (id: string) => void;
}


const levelColors: Record<number, string> = {
  1: 'gray',
  2: 'green',
  3: 'blue',
  4: 'purple',
  5: 'gold'
};

const levelNames: Record<number, string> = {
  1: '初级',
  2: '中级',
  3: '高级',
  4: '专家',
  5: '大师'
};

const ProviderCard: React.FC<ProviderCardProps> = ({ provider, showMatch = false, onInvite, onView }) => {
  const navigate = useNavigate();
  const isMatchResult = 'matchScore' in provider;
  const providerData = isMatchResult ? provider.provider : provider;
  const matchScore = isMatchResult ? provider.matchScore : undefined;
  const matchReasons = isMatchResult ? provider.matchReasons : undefined;

  const handleView = () => {
    if (onView) {
      onView(providerData.id);
    } else {
      navigate(`/platform/talent/${providerData.id}`);
    }
  };

  const handleInvite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onInvite) {
      onInvite(providerData.id);
    }
  };

  return (
    <Card className="card-hover h-full" onClick={handleView}>
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Badge
            count={providerData.verified && <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />}
            offset={[-4, 4]}
          >
            <Avatar size={64} src={providerData.avatar} icon={<UserOutlined />}>
              {providerData.name?.charAt(0)}
            </Avatar>
          </Badge>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-gray-800 mb-0">
                {providerData.name}
              </h3>
              <Tag color={levelColors[providerData.level]} className="m-0">
                Lv.{providerData.level} {levelNames[providerData.level]}
              </Tag>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Rate 
                disabled 
                defaultValue={providerData.rating} 
                allowHalf 
                className="text-sm"
                style={{ fontSize: 14 }}
              />
              <span className="text-sm text-gray-500 ml-1">
                {providerData.rating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-400">
                ({providerData.reviewCount}条群众评价)
              </span>
            </div>
            {providerData.location && (
              <div className="text-sm text-gray-500 mt-1">
                {providerData.location}
              </div>
            )}
          </div>
        </div>

        {showMatch && matchScore !== undefined && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-primary-700">匹配度</span>
              <span className="text-lg font-bold text-primary-700">{matchScore}%</span>
            </div>
            {matchReasons && matchReasons.length > 0 && (
              <div className="text-xs text-gray-600">
                {matchReasons.slice(0, 2).map((reason, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <StarOutlined className="text-yellow-500" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {providerData.skills.slice(0, 5).map((skill, index) => (
            <Tag key={index} className="m-0 bg-gray-100 text-gray-600 border-none">
              {skill}
            </Tag>
          ))}
          {providerData.skills.length > 5 && (
            <Tag className="m-0 bg-gray-100 text-gray-600 border-none">
              +{providerData.skills.length - 5}
            </Tag>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-gray-100">
          <div>
            <div className="flex items-center justify-center gap-1 text-primary-600">
              <TrophyOutlined />
              <span className="font-semibold">{providerData.completedTasks}</span>
            </div>
            <div className="text-xs text-gray-500">办结事项</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-green-600">
              <ThunderboltOutlined />
              <span className="font-semibold">{providerData.responseRate}%</span>
            </div>
            <div className="text-xs text-gray-500">响应率</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-orange-600">
              <span className="font-semibold">{providerData.rating?.toFixed(1) || '4.5'}分</span>
            </div>
            <div className="text-xs text-gray-500">服务评分</div>
          </div>
        </div>

        {providerData.bio && (
          <p className="text-sm text-gray-500 line-clamp-2 pt-2 border-t border-gray-100">
            {providerData.bio}
          </p>
        )}

        {onInvite && (
          <div className="flex justify-end pt-2">
            <Tooltip title="邀请接办">
              <Button
                type="primary"
                onClick={handleInvite}
                icon={<PlusOutlined />}

              >
                邀请接办
              </Button>
            </Tooltip>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProviderCard;
