import { useEffect, useState } from 'react';
import { Progress, List, Tag, Descriptions } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import PageHeader from '@/components/PageHeader';
import Loading from '@/components/Loading';
import { riderService } from '@/services/rider.service';
import type { CreditHistory } from '@shared/types';
import { formatTimeAgo } from '@/utils/format';

const CreditScore: React.FC = () => {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<CreditHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [historyResult, statsResult] = await Promise.all([
        riderService.getCreditHistory(1, 50),
        riderService.getStats(),
      ]);
      setHistory(historyResult.items);
      setStats(statsResult);
    } catch (error) {
      console.error('Load credit data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreLevel = (score: number) => {
    if (score >= 90) return { level: '优秀', color: '#52c41a' };
    if (score >= 80) return { level: '良好', color: '#1890ff' };
    if (score >= 70) return { level: '中等', color: '#faad14' };
    if (score >= 60) return { level: '及格', color: '#fa8c16' };
    return { level: '较差', color: '#ff4d4f' };
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <ArrowUpOutlined className="text-green-500" />;
    }
    if (change < 0) {
      return <ArrowDownOutlined className="text-red-500" />;
    }
    return <InfoCircleOutlined className="text-gray-500" />;
  };

  const getReasonTag = (reason: string) => {
    const reasonMap: Record<string, { color: string; icon: React.ReactNode }> = {
      timeout: { color: 'orange', icon: <WarningOutlined /> },
      cancel: { color: 'red', icon: <ExclamationCircleOutlined /> },
      complete: { color: 'green', icon: <TrophyOutlined /> },
      praise: { color: 'blue', icon: <TrophyOutlined /> },
      complaint: { color: 'red', icon: <ExclamationCircleOutlined /> },
      freeze: { color: 'red', icon: <WarningOutlined /> },
    };
    const info = reasonMap[reason] || { color: 'default', icon: <InfoCircleOutlined /> };
    return { info, reason };
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  const creditScore = user?.creditScore || 0;
  const scoreInfo = getScoreLevel(creditScore);

  return (
    <div className="page-container">
      <PageHeader title="信用分" showBack />

      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white text-center">
          <div className="text-blue-100 mb-2">我的信用分</div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-5xl font-bold">{creditScore}</span>
            <Tag color={scoreInfo.color} className="text-sm">
              {scoreInfo.level}
            </Tag>
          </div>
          <Progress
            percent={creditScore}
            showInfo={false}
            strokeColor={{
              '0%': '#52c41a',
              '100%': '#1890ff',
            }}
            trailColor="rgba(255,255,255,0.3)"
            className="mt-4"
          />
          <div className="flex justify-between text-xs text-blue-100 mt-2">
            <span>0</span>
            <span>60</span>
            <span>100</span>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">信用规则</h3>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="按时完成">
              <Tag color="green">+1分</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="用户好评">
              <Tag color="blue">+2分</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="配送超时">
              <Tag color="orange">-5分</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="骑手取消">
              <Tag color="red">-3分</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="用户投诉">
              <Tag color="red">-10分</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="低于60分">
              <Tag color="red">冻结7天</Tag>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {stats && (
          <div className="card">
            <h3 className="font-semibold mb-4">数据统计</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-500">{stats.totalOrders || 0}</p>
                <p className="text-xs text-gray-500">完成订单</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-500">{stats.timeoutOrders || 0}</p>
                <p className="text-xs text-gray-500">超时订单</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{stats.cancelledOrders || 0}</p>
                <p className="text-xs text-gray-500">取消订单</p>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <h3 className="font-semibold mb-4">信用记录</h3>
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无信用记录
            </div>
          ) : (
            <List
              dataSource={history}
              renderItem={(item) => {
                const { info, reason } = getReasonTag(item.reason);
                return (
                  <List.Item className="px-0">
                    <List.Item.Meta
                      avatar={
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${info.color}15`, color: info.color }}
                        >
                          {info.icon}
                        </div>
                      }
                      title={
                        <div className="flex justify-between items-center">
                          <span>{item.description}</span>
                          <span className="flex items-center gap-1">
                            {getChangeIcon(item.change)}
                            <span className={item.change > 0 ? 'text-green-500' : item.change < 0 ? 'text-red-500' : 'text-gray-500'}>
                              {item.change > 0 ? '+' : ''}{item.change}
                            </span>
                          </span>
                        </div>
                      }
                      description={
                        <div className="flex justify-between items-center">
                          <Tag color={info.color}>{reason}</Tag>
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(item.createdAt)}
                          </span>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditScore;
