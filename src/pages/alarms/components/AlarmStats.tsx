import React from 'react';
import { Card, Statistic } from 'antd';
import {
  AlertOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { getAlarmStatistics, type AlarmStatisticsData } from '@/services/api/alarm';

const statConfig = [
  {
    key: 'total',
    label: '总告警数',
    icon: <AlertOutlined />,
    color: '#1677ff',
    bgColor: '#e6f4ff',
  },
  {
    key: 'pending',
    label: '待处理',
    icon: <ClockCircleOutlined />,
    color: '#fa541c',
    bgColor: '#fff2e8',
  },
  {
    key: 'processing',
    label: '处理中',
    icon: <SyncOutlined />,
    color: '#faad14',
    bgColor: '#fffbe6',
  },
  {
    key: 'resolved',
    label: '已解决',
    icon: <CheckCircleOutlined />,
    color: '#52c41a',
    bgColor: '#f6ffed',
  },
];

const AlarmStats: React.FC = () => {
  const { data } = useRequest(getAlarmStatistics);

  const stats = data?.data;

  const todayCount = stats?.trend?.[stats.trend.length - 1]?.count ?? 0;
  const yesterdayCount = stats?.trend?.[stats.trend.length - 2]?.count ?? 0;
  const trendPercent =
    yesterdayCount === 0 ? 0 : Number((((todayCount - yesterdayCount) / yesterdayCount) * 100).toFixed(1));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
      {statConfig.map((item) => {
        const value = stats?.[item.key as keyof AlarmStatisticsData] ?? 0;
        return (
          <Card key={item.key} className="shadow-none border border-neutral-100 dark:border-neutral-700" bodyStyle={{ padding: '20px' }}>
            <Statistic
              title={<span className="text-neutral-500 text-sm">{item.label}</span>}
              value={value as number}
              prefix={<span style={{ color: item.color, marginRight: 4 }}>{item.icon}</span>}
              valueStyle={{ color: item.color, fontWeight: 600 }}
            />
          </Card>
        );
      })}
      <Card className="shadow-none border border-neutral-100 dark:border-neutral-700" bodyStyle={{ padding: '20px' }}>
        <Statistic
          title={<span className="text-neutral-500 text-sm">今日新增</span>}
          value={todayCount}
          prefix={<RiseOutlined />}
          suffix={
            trendPercent !== 0 ? (
              <span className={`text-xs ${trendPercent > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {trendPercent > 0 ? '+' : ''}{trendPercent}%
              </span>
            ) : null
          }
          valueStyle={{ color: '#722ed1', fontWeight: 600 }}
        />
      </Card>
    </div>
  );
};

export default AlarmStats;
