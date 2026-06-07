import React, { useState, useEffect } from 'react';
import { Card, Button, Space, message, Tag, Statistic, Row, Col, Descriptions } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, UserOutlined, CheckCircleOutlined, ClockCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { AttendanceRecord } from '../types';

const AttendanceCheck: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const LAT = 39.9042;
  const LNG = 116.4074;
  const FACE_VERIFIED = true;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayRecord = async () => {
    try {
      const today = new Date();
      const res = await api.attendance.getMy({
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        day: today.getDate()
      });
      const records = Array.isArray(res.data) ? res.data : [];
      if (records.length > 0) {
        setTodayRecord(records[0]);
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取今日考勤失败');
    }
  };

  useEffect(() => {
    fetchTodayRecord();
  }, []);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      await api.attendance.checkIn({
        lat: LAT,
        lng: LNG,
        faceVerified: FACE_VERIFIED
      });
      message.success('上班打卡成功');
      fetchTodayRecord();
    } catch (error: any) {
      message.error(error.response?.data?.error || '上班打卡失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      await api.attendance.checkOut({
        lat: LAT,
        lng: LNG,
        faceVerified: FACE_VERIFIED
      });
      message.success('下班打卡成功');
      fetchTodayRecord();
    } catch (error: any) {
      message.error(error.response?.data?.error || '下班打卡失败');
    } finally {
      setLoading(false);
    }
  };

  const hasCheckedIn = todayRecord?.checkInTime;
  const hasCheckedOut = todayRecord?.checkOutTime;

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/attendance')}
        style={{ marginBottom: '16px' }}
      >
        返回考勤列表
      </Button>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="考勤打卡">
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1890ff', marginBottom: '8px' }}>
                {currentTime.toLocaleTimeString('zh-CN')}
              </div>
              <div style={{ color: '#666', fontSize: '16px', marginBottom: '32px' }}>
                {currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </div>

              <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                <Col span={12}>
                  <Card size="small">
                    <Statistic
                      title={
                        <Space>
                          <UserOutlined />
                          人脸验证
                        </Space>
                      }
                      value={FACE_VERIFIED ? '已通过' : '未通过'}
                      valueStyle={{ color: FACE_VERIFIED ? '#52c41a' : '#f5222d', fontSize: '16px' }}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <Statistic
                      title={
                        <Space>
                          <EnvironmentOutlined />
                          位置信息
                        </Space>
                      }
                      value="已获取"
                      valueStyle={{ color: '#52c41a', fontSize: '16px' }}
                    />
                  </Card>
                </Col>
              </Row>

              <Descriptions column={1} size="small" style={{ marginBottom: '32px' }}>
                <Descriptions.Item label="模拟位置">
                  <Space>
                    <EnvironmentOutlined />
                    纬度: {LAT}, 经度: {LNG}
                  </Space>
                </Descriptions.Item>
              </Descriptions>

              <Space size="large">
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircleOutlined />}
                  onClick={handleCheckIn}
                  loading={loading && !hasCheckedOut}
                  disabled={!!hasCheckedIn}
                  style={{ width: '160px', height: '56px', fontSize: '18px' }}
                >
                  {hasCheckedIn ? '已打卡' : '上班打卡'}
                </Button>
                <Button
                  type="primary"
                  danger
                  size="large"
                  icon={<StopOutlined />}
                  onClick={handleCheckOut}
                  loading={loading && !!hasCheckedIn}
                  disabled={!hasCheckedIn || !!hasCheckedOut}
                  style={{ width: '160px', height: '56px', fontSize: '18px' }}
                >
                  {hasCheckedOut ? '已下班' : '下班打卡'}
                </Button>
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="今日打卡记录">
            {todayRecord ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Card size="small" type="inner">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <span style={{ fontWeight: 'bold' }}>上班打卡</span>
                    </Space>
                    {hasCheckedIn ? (
                      <Tag color="green">
                        {new Date(todayRecord.checkInTime!).toLocaleTimeString('zh-CN')}
                      </Tag>
                    ) : (
                      <Tag color="orange">未打卡</Tag>
                    )}
                  </div>
                  {hasCheckedIn && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#8c8c8c' }}>
                      <div>地点验证：{todayRecord.checkInGeofenceVerified ? '✓ 合规' : '✗ 异常'}</div>
                      <div>人脸验证：{todayRecord.checkInFaceVerified ? '✓ 通过' : '✗ 未验证'}</div>
                    </div>
                  )}
                </Card>

                <Card size="small" type="inner">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <ClockCircleOutlined style={{ color: '#1890ff' }} />
                      <span style={{ fontWeight: 'bold' }}>下班打卡</span>
                    </Space>
                    {hasCheckedOut ? (
                      <Tag color="blue">
                        {new Date(todayRecord.checkOutTime!).toLocaleTimeString('zh-CN')}
                      </Tag>
                    ) : (
                      <Tag color="orange">未打卡</Tag>
                    )}
                  </div>
                  {hasCheckedOut && todayRecord.workHours !== undefined && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#8c8c8c' }}>
                      工作时长：{todayRecord.workHours} 小时
                    </div>
                  )}
                </Card>

                {todayRecord.workHours !== undefined && (
                  <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
                    <Statistic
                      title="今日工作时长"
                      value={todayRecord.workHours}
                      suffix="小时"
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                )}
              </Space>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#8c8c8c' }}>
                <ClockCircleOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <p>今日暂无打卡记录</p>
                <p style={{ fontSize: '12px' }}>点击上方按钮开始打卡</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AttendanceCheck;
