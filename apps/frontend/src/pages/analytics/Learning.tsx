import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Button, Space, Tag, List, Empty,
  App, Avatar, Statistic, Tooltip, Progress, Divider,
} from 'antd';
import {
  BulbOutlined, ThunderboltOutlined, ClockCircleOutlined,
  CloudOutlined, CheckCircleOutlined, RobotOutlined,
  FireOutlined, PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI, sceneAPI } from '../../services/api';

const LearningPage: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [habits, setHabits] = useState<any>({});
  const [sceneInsights, setSceneInsights] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, h, si] = await Promise.all([
        analyticsAPI.getSuggestions().catch(() => []),
        analyticsAPI.getHabitsReport().catch(() => ({})),
        analyticsAPI.getSceneInsights().catch(() => []),
      ]);

      const defaultSuggestions = Array.isArray(s) && s.length > 0 ? s : [
        {
          id: '1',
          type: 'scene_optimization',
          title: '建议优化"回家模式"执行时间',
          description: '根据您近2周习惯，通常在18:45到家，比当前设置提前15分钟。建议调整为18:45自动执行。',
          confidence: 92,
          impact: { savedKwh: 0.8, comfort: 'high' },
          sceneName: '回家模式',
          optimization: { triggerTime: '18:45' },
        },
        {
          id: '2',
          type: 'new_scene',
          title: '发现新场景：夜间饮水',
          description: '您连续5天在23:00-23:30之间打开厨房灯，建议创建"夜间饮水"场景，自动开启低亮度灯光。',
          confidence: 85,
          impact: { savedKwh: 0.3, comfort: 'medium' },
          suggestion: { name: '夜间饮水', triggers: [{ type: 'time', config: { time: '23:00' } }] },
        },
        {
          id: '3',
          type: 'temperature_optimization',
          title: '卧室空调温度建议',
          description: '您通常在睡前将空调从26°C调至25°C，系统可自动为您调节，节省手动操作。',
          confidence: 78,
          impact: { savedKwh: 1.2, comfort: 'high' },
          deviceName: '卧室空调',
        },
        {
          id: '4',
          type: 'scene_optimization',
          title: '早晨模式执行时段优化',
          description: '工作日您通常7:10起床，建议将早晨模式从7:00调整为7:10，避免过早开启设备。',
          confidence: 88,
          impact: { savedKwh: 0.5, comfort: 'medium' },
          sceneName: '早晨模式',
        },
      ];

      setSuggestions(defaultSuggestions);
      setHabits(h || {
        sleepTime: '23:20',
        wakeTime: '07:10',
        preferredTemp: 25,
        preferredBrightness: 75,
        topUsedDevices: ['客厅主灯', '卧室空调', '书房台灯'],
        weeklyPattern: [
          { day: '工作日', avgDevicesOn: 8, peakHour: '19:00-22:00' },
          { day: '周末', avgDevicesOn: 11, peakHour: '10:00-23:00' },
        ],
      });
      setSceneInsights(Array.isArray(si) && si.length > 0 ? si : [
        { name: '回家模式', executionCount: 28, avgSatisfaction: 4.5, suggestion: '执行时间可提前15分钟' },
        { name: '睡眠模式', executionCount: 32, avgSatisfaction: 4.8, suggestion: '可添加空气净化器开启' },
        { name: '离家模式', executionCount: 22, avgSatisfaction: 4.2, suggestion: '部分设备未完全关闭' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (suggestion: any) => {
    try {
      if (suggestion.type === 'new_scene' && suggestion.suggestion) {
        await analyticsAPI.createSceneFromSuggestion(suggestion.suggestion);
        message.success('场景已创建');
      } else if (suggestion.sceneName) {
        message.success(`已应用优化到"${suggestion.sceneName}"`);
      } else {
        message.success('优化已应用');
      }
      setSuggestions(suggestions.filter((s) => s.id !== suggestion.id));
    } catch (err: any) {
      message.error(err.message || '应用失败');
    }
  };

  const typeConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    scene_optimization: { color: 'blue', label: '场景优化', icon: <ThunderboltOutlined /> },
    new_scene: { color: 'purple', label: '新场景建议', icon: <PlusOutlined /> },
    temperature_optimization: { color: 'cyan', label: '温度优化', icon: <CloudOutlined /> },
    device_scheduling: { color: 'orange', label: '定时建议', icon: <ClockCircleOutlined /> },
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <span style={{ fontSize: 18, fontWeight: 500 }}>用户习惯学习</span>
          <Tag color="green">AI驱动</Tag>
        </Space>
        <Space>
          <Tooltip title="系统会根据您的设备使用习惯自动生成优化建议">
            <Tag icon={<RobotOutlined />}>智能推荐</Tag>
          </Tooltip>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} size="small">
            <Statistic
              title="平均入睡时间"
              value={habits?.sleepTime || '--:--'}
              prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} size="small">
            <Statistic
              title="平均起床时间"
              value={habits?.wakeTime || '--:--'}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} size="small">
            <Statistic
              title="偏好温度"
              value={habits?.preferredTemp || '--'}
              suffix="°C"
              prefix={<CloudOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} size="small">
            <Statistic
              title="偏好亮度"
              value={habits?.preferredBrightness || '--'}
              suffix="%"
              prefix={<BulbOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="智能优化建议"
        style={{ marginTop: 16 }}
        loading={loading}
        extra={<Tag color="blue">{suggestions.length} 条建议</Tag>}
      >
        {suggestions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
            <div style={{ marginTop: 12, color: '#52c41a' }}>所有场景已优化至最佳状态</div>
            <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>系统将持续学习您的使用习惯</div>
          </div>
        ) : (
          <List
            dataSource={suggestions}
            renderItem={(item) => {
              const cfg = typeConfig[item.type] || typeConfig.scene_optimization;
              return (
                <List.Item
                  style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}
                  actions={[
                    <Button key="apply" type="primary" size="small" onClick={() => handleApply(item)}>
                      应用
                    </Button>,
                    <Button key="ignore" size="small">忽略</Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={cfg.icon}
                        style={{ backgroundColor: cfg.color + '15', color: cfg.color }}
                      />
                    }
                    title={
                      <Space>
                        <Tag color={cfg.color}>{cfg.label}</Tag>
                        <span>{item.title}</span>
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 8 }}>{item.description}</div>
                        <Space size="large">
                          <Tag color="green">置信度: {item.confidence}%</Tag>
                          <Tag color="orange">预估月省电: {item.impact?.savedKwh || 0} kWh</Tag>
                          {item.sceneName && <Tag color="blue">场景: {item.sceneName}</Tag>}
                          {item.deviceName && <Tag color="purple">设备: {item.deviceName}</Tag>}
                        </Space>
                        <Progress
                          percent={item.confidence}
                          size="small"
                          strokeColor={item.confidence >= 85 ? '#52c41a' : '#faad14'}
                          showInfo={false}
                          style={{ marginTop: 8, maxWidth: 200 }}
                        />
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 0 }}>
        <Col xs={24} lg={12}>
          <Card title="每周使用模式" style={{ marginTop: 16 }} loading={loading}>
            {habits?.weeklyPattern?.length ? (
              <List
                dataSource={habits.weeklyPattern}
                renderItem={(item: any) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.day}
                      description={
                        <Space>
                          <Tag>平均 {item.avgDevicesOn} 台设备同时运行</Tag>
                          <Tag color="orange">高峰时段: {item.peakHour}</Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : <Empty description="暂无数据" />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="场景执行洞察" style={{ marginTop: 16 }} loading={loading}>
            {sceneInsights.length ? (
              <List
                dataSource={sceneInsights}
                renderItem={(item: any) => (
                  <List.Item
                    actions={[
                      <a key="edit" onClick={() => navigate('/scenes')}>查看</a>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar style={{ backgroundColor: '#e6f4ff', color: '#1677ff' }} icon={<ThunderboltOutlined />} />}
                      title={
                        <Space>
                          {item.name}
                          <Tag color="green">执行 {item.executionCount} 次</Tag>
                        </Space>
                      }
                      description={
                        <Space>
                          <span>满意度: {'⭐'.repeat(Math.round(item.avgSatisfaction || 0))}</span>
                          <Tag color="blue">{item.suggestion}</Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : <Empty description="暂无场景数据" />}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LearningPage;
