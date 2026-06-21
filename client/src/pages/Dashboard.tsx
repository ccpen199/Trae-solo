import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Progress, List, Tag, Avatar, Empty, Spin } from 'antd';
import {
  VideoCameraOutlined, PlayCircleOutlined,
  WarningOutlined, ExclamationCircleOutlined,
  FileTextOutlined, GlobalOutlined, RiseOutlined,
  CheckCircleOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { observer } from 'mobx-react-lite';
import ReactECharts from 'echarts-for-react';
import appStore from '@/store';
import { streamApi, deviceApi } from '@/services/api';
import { formatRelativeTime, getEventLevelColor, getEventTypeText } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import { Statistics, Device, AIEvent } from '@/types';

const Dashboard: React.FC = observer(() => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<Device[]>([]);
  const [recentEvents, setRecentEvents] = useState<AIEvent[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stats, devRes, eventsRes] = await Promise.all([
        appStore.loadStatistics(),
        deviceApi.listDevices({ pageSize: 10 }),
        streamApi.listEvents({ pageSize: 8 })
      ]);
      if (devRes) setDevices(devRes.list || []);
      if (eventsRes) setRecentEvents(eventsRes.list || []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const stats = appStore.statistics;

  const eventTypeChart = stats?.eventTypeStats?.length ? {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      avoidLabelOverlap: false,
      label: { show: false },
      data: stats.eventTypeStats.map((e: any) => ({
        name: getEventTypeText(e.event_type),
        value: e.count
      }))
    }]
  } : null;

  const levelChart = stats?.alertLevelStats ? {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: ['低', '普通', '高', '严重'] },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      barWidth: 40,
      data: [
        { value: stats.alertLevelStats.low || 0, itemStyle: { color: '#52c41a' } },
        { value: stats.alertLevelStats.normal || 0, itemStyle: { color: '#1677ff' } },
        { value: stats.alertLevelStats.high || 0, itemStyle: { color: '#faad14' } },
        { value: stats.alertLevelStats.critical || 0, itemStyle: { color: '#ff4d4f' } },
      ],
      label: { show: true, position: 'top' }
    }]
  } : null;

  return (
    <Spin spinning={loading}>
      <div>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="!rounded-xl" style={{ borderLeft: '4px solid #1677ff' }}>
              <Statistic
                title={<span className="text-gray-500">设备总数</span>}
                value={stats?.deviceCount || 0}
                prefix={<VideoCameraOutlined />}
                valueStyle={{ color: '#1677ff' }}
              />
              <div className="mt-2 flex items-center gap-2 text-sm">
                <Tag color="success" icon={<CheckCircleOutlined />}>在线 {stats?.onlineCount || 0}</Tag>
                <Tag color="default" icon={<ExclamationCircleOutlined />}>离线 {stats?.offlineCount || 0}</Tag>
              </div>
              <Progress percent={stats?.onlineRate || 0} showInfo={false} className="!mt-2" strokeColor="#1677ff" />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="!rounded-xl" style={{ borderLeft: '4px solid #52c41a' }}>
              <Statistic
                title={<span className="text-gray-500">今日告警</span>}
                value={stats?.todayEventCount || 0}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <RiseOutlined /> AI智能事件
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="!rounded-xl" style={{ borderLeft: '4px solid #722ed1' }}>
              <Statistic
                title={<span className="text-gray-500">录像数量</span>}
                value={stats?.recordingCount?.count || 0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div className="mt-2 text-sm text-gray-500">
                <GlobalOutlined /> 占用空间 {stats?.recordingCount?.total_size ?
                  (stats.recordingCount.total_size / 1024 / 1024 / 1024).toFixed(2) + ' GB' : '0 B'}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="!rounded-xl" style={{ borderLeft: '4px solid #fa8c16' }}>
              <Statistic
                title={<span className="text-gray-500">未读告警</span>}
                value={appStore.unreadAlertCount}
                prefix={<InfoCircleOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
              <div className="mt-2">
                <a className="text-sm text-blue-600 cursor-pointer" onClick={() => navigate('/alerts')}>查看全部 →</a>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mt-4">
          <Col xs={24} lg={14}>
            <Card
              title={<span className="font-semibold"><PlayCircleOutlined /> 设备状态概览</span>}
              className="!rounded-xl"
              extra={<a className="text-sm" onClick={() => navigate('/devices')}>管理设备</a>}
            >
              {devices.length === 0 ? (
                <Empty description="暂无设备，请先添加IPC设备" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {devices.map((dev) => (
                    <div
                      key={dev.id}
                      className="p-3 border rounded-lg flex items-center gap-3 cursor-pointer hover:border-blue-500 hover:shadow-sm transition-all"
                      onClick={() => navigate(`/live?device=${dev.id}`)}
                    >
                      <Avatar
                        size={48}
                        style={{ backgroundColor: dev.online_status ? '#52c41a' : '#bfbfbf' }}
                        icon={<VideoCameraOutlined />}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{dev.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <Tag color={dev.online_status ? 'success' : 'default'} className="!m-0">
                            {dev.online_status ? '在线' : '离线'}
                          </Tag>
                          <span>{dev.group_name || '未分组'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title={<span className="font-semibold"><WarningOutlined /> 告警级别分布（近7天）</span>} className="!rounded-xl">
              {levelChart ? (
                <ReactECharts option={levelChart} style={{ height: 280 }} />
              ) : <Empty description="暂无告警数据" />}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mt-4">
          <Col xs={24} lg={14}>
            <Card
              title={<span className="font-semibold"><ExclamationCircleOutlined /> 最新告警事件</span>}
              className="!rounded-xl"
              extra={<a className="text-sm" onClick={() => navigate('/alerts')}>更多 →</a>}
            >
              {recentEvents.length === 0 ? (
                <Empty description="暂无告警事件" />
              ) : (
                <List
                  dataSource={recentEvents}
                  renderItem={(item) => (
                    <List.Item
                      key={item.id}
                      className="!px-0 !py-3 border-b last:border-0 cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate('/alerts')}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            style={{ backgroundColor: item.event_level === 'critical' || item.event_level === 'high' ? '#ff4d4f' : item.event_level === 'normal' ? '#1677ff' : '#52c41a' }}
                            icon={<WarningOutlined />}
                          />
                        }
                        title={
                          <div className="flex items-center gap-2">
                            <span>{getEventTypeText(item.event_type)}</span>
                            <Tag color={getEventLevelColor(item.event_level)}>
                              {item.event_level}
                            </Tag>
                            {item.confidence > 0 && (
                              <span className="text-xs text-gray-500">置信度 {Math.round(item.confidence * 100)}%</span>
                            )}
                          </div>
                        }
                        description={
                          <div className="text-sm text-gray-500">
                            <span>设备：{item.device_name}</span>
                            <span className="ml-3">{formatRelativeTime(item.created_at)}</span>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title={<span className="font-semibold">事件类型统计（近7天）</span>} className="!rounded-xl">
              {eventTypeChart ? (
                <ReactECharts option={eventTypeChart} style={{ height: 280 }} />
              ) : <Empty description="暂无统计数据" />}
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
});

export default Dashboard;
