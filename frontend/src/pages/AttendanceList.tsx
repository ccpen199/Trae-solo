import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Spin, message, Tag, DatePicker, Statistic, Row, Col } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { AttendanceRecord } from '../types';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';

const { MonthPicker } = DatePicker;

const AttendanceList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [month, setMonth] = useState<Dayjs>(dayjs());

  const fetchAttendance = async (selectedMonth: Dayjs) => {
    setLoading(true);
    try {
      const res = await api.attendance.getMy({
        year: selectedMonth.year(),
        month: selectedMonth.month() + 1
      });
      setRecords(res.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取考勤记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(month);
  }, [month]);

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      normal: '正常',
      late: '迟到',
      early_leave: '早退',
      absent: '旷工',
      overtime: '加班'
    };
    return map[status] || status;
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      normal: 'green',
      late: 'orange',
      early_leave: 'orange',
      absent: 'red',
      overtime: 'blue'
    };
    return map[status] || 'default';
  };

  const statistics = {
    totalDays: records.length,
    normalDays: records.filter(r => r.status === 'normal').length,
    totalHours: records.reduce((sum, r) => sum + (r.workHours || 0), 0).toFixed(1)
  };

  const columns: ColumnsType<AttendanceRecord> = [
    {
      title: '日期',
      dataIndex: 'checkInTime',
      key: 'date',
      width: 180,
      render: (time) => time ? new Date(time).toLocaleDateString('zh-CN') : '-'
    },
    {
      title: '所属项目',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 200,
      render: (text) => text || '-'
    },
    {
      title: '上班打卡',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      width: 180,
      render: (time) => time ? new Date(time).toLocaleTimeString('zh-CN') : '未打卡'
    },
    {
      title: '下班打卡',
      dataIndex: 'checkOutTime',
      key: 'checkOutTime',
      width: 180,
      render: (time) => time ? new Date(time).toLocaleTimeString('zh-CN') : '未打卡'
    },
    {
      title: '工作时长',
      dataIndex: 'workHours',
      key: 'workHours',
      width: 120,
      render: (hours) => hours !== undefined ? `${hours}小时` : '-'
    },
    {
      title: '考勤状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '地点验证',
      key: 'location',
      width: 120,
      render: (_, record) => (
        <Space>
          {record.checkInGeofenceVerified ? (
            <Tag color="green">✓ 地点合规</Tag>
          ) : record.checkInTime ? (
            <Tag color="red">✗ 地点异常</Tag>
          ) : '-'}
        </Space>
      )
    },
    {
      title: '人脸验证',
      key: 'face',
      width: 120,
      render: (_, record) => (
        <Space>
          {record.checkInFaceVerified ? (
            <Tag color="green">✓ 人脸通过</Tag>
          ) : record.checkInTime ? (
            <Tag color="red">✗ 未验证</Tag>
          ) : '-'}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={12} md={8}>
          <Card>
            <Statistic
              title="本月出勤天数"
              value={statistics.totalDays}
              suffix="天"
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card>
            <Statistic
              title="全勤天数"
              value={statistics.normalDays}
              suffix="天"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card>
            <Statistic
              title="累计工时"
              value={statistics.totalHours}
              suffix="小时"
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="考勤记录"
        extra={
          <Space>
            <MonthPicker
              value={month}
              onChange={(value) => value && setMonth(value)}
              format="YYYY年MM月"
            />
            <Button
              type="primary"
              icon={<ClockCircleOutlined />}
              onClick={() => navigate('/attendance/check')}
            >
              去打卡
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={records}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default AttendanceList;
