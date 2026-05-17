import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, List, Spin, Empty, Typography, Button, Tag,
  Space, DatePicker, Statistic, Modal, Descriptions
} from 'antd';
import {
  BarChartOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { sleepAPI } from '../services/api';
import { SleepRecord } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const Records: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<SleepRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await sleepAPI.getRecords({ limit: 50 });
      setRecords(data.records || []);
    } catch (err) {
      console.error('获取睡眠记录失败:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleViewDetail = async (record: SleepRecord) => {
    try {
      const data = await sleepAPI.getRecord(record.id);
      setSelectedRecord(data.record);
      setIsModalOpen(true);
    } catch (err) {
      console.error('获取详情失败:', err);
    }
  };

  const getQualityColor = (score?: number) => {
    if (!score) return 'default';
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getQualityText = (score?: number) => {
    if (!score) return '未评分';
    if (score >= 80) return '优秀';
    if (score >= 60) return '良好';
    return '需改善';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Empty description="加载失败" />
        <div style={{ marginTop: 16 }}>
          <Button icon={<ReloadOutlined />} onClick={fetchData} type="primary">
            重新加载
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, marginBottom: 8 }}>睡眠记录</Title>
          <Text type="secondary">查看您的历史睡眠数据和详细报告</Text>
        </div>
        <RangePicker
          placeholder={['开始日期', '结束日期']}
          disabledDate={(current) => current && current > dayjs().endOf('day')}
        />
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="总记录数"
              value={records.length}
              suffix="条"
              prefix={<BarChartOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="平均睡眠时长"
              value={records.length > 0
                ? (records.reduce((sum, r) => sum + (r.duration || 0), 0) / records.length / 60).toFixed(1)
                : 0}
              suffix="小时"
              prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="平均心率"
              value={records.length > 0
                ? Math.round(records.reduce((sum, r) => sum + (r.avg_heart_rate || 0), 0) / records.length)
                : 0}
              suffix="次/分"
              prefix={<HeartOutlined style={{ color: '#eb2f96' }} />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="平均睡眠评分"
              value={records.length > 0
                ? Math.round(records.reduce((sum, r) => sum + (r.sleep_quality_score || 0), 0) / records.length)
                : 0}
              suffix="分"
              prefix={<BarChartOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card>
            <List
              dataSource={records}
              locale={{ emptyText: <Empty description="暂无睡眠记录" /> }}
              renderItem={(record) => (
                <List.Item
                  actions={[
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewDetail(record)}
                    >
                      查看详情
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{dayjs(record.sleep_date).format('YYYY年MM月DD日')}</Text>
                        <Tag color={getQualityColor(record.sleep_quality_score)}>
                          {getQualityText(record.sleep_quality_score)}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space wrap size="large">
                        <span>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          睡眠时长: {record.duration ? (record.duration / 60).toFixed(1) : 0} 小时
                        </span>
                        <span>
                          深度睡眠: {record.deep_sleep_duration ? (record.deep_sleep_duration / 60).toFixed(1) : 0} 小时
                        </span>
                        <span>
                          <HeartOutlined style={{ marginRight: 4 }} />
                          平均心率: {record.avg_heart_rate || 0} 次/分
                        </span>
                        {record.avg_temperature && (
                          <span>体温: {record.avg_temperature}°C</span>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="睡眠详情报告"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedRecord && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="睡眠日期" span={2}>
              {dayjs(selectedRecord.sleep_date).format('YYYY年MM月DD日')}
            </Descriptions.Item>
            <Descriptions.Item label="入睡时间">
              {dayjs(selectedRecord.start_time).format('HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="醒来时间">
              {selectedRecord.end_time ? dayjs(selectedRecord.end_time).format('HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="总睡眠时长">
              {selectedRecord.duration ? (selectedRecord.duration / 60).toFixed(1) : 0} 小时
            </Descriptions.Item>
            <Descriptions.Item label="深度睡眠">
              {selectedRecord.deep_sleep_duration ? (selectedRecord.deep_sleep_duration / 60).toFixed(1) : 0} 小时
            </Descriptions.Item>
            <Descriptions.Item label="浅度睡眠">
              {selectedRecord.light_sleep_duration ? (selectedRecord.light_sleep_duration / 60).toFixed(1) : 0} 小时
            </Descriptions.Item>
            <Descriptions.Item label="REM睡眠">
              {selectedRecord.rem_sleep_duration ? (selectedRecord.rem_sleep_duration / 60).toFixed(1) : 0} 小时
            </Descriptions.Item>
            <Descriptions.Item label="平均心率">
              {selectedRecord.avg_heart_rate || 0} 次/分
            </Descriptions.Item>
            <Descriptions.Item label="平均体温">
              {selectedRecord.avg_temperature ? `${selectedRecord.avg_temperature}°C` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="夜间醒来">
              {selectedRecord.wake_up_count || 0} 次
            </Descriptions.Item>
            <Descriptions.Item label="翻身次数">
              {selectedRecord.movement_count || 0} 次
            </Descriptions.Item>
            <Descriptions.Item label="打鼾时长">
              {selectedRecord.snoring_duration ? (selectedRecord.snoring_duration / 60).toFixed(1) : 0} 分钟
            </Descriptions.Item>
            <Descriptions.Item label="梦话次数">
              {selectedRecord.sleep_talking_count || 0} 次
            </Descriptions.Item>
            <Descriptions.Item label="睡眠质量评分" span={2}>
              <Tag color={getQualityColor(selectedRecord.sleep_quality_score)}>
                {selectedRecord.sleep_quality_score || 0} 分 - {getQualityText(selectedRecord.sleep_quality_score)}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Records;
