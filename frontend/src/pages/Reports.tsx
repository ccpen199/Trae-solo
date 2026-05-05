import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  DatePicker,
  Select,
  Button,
  Row,
  Col,
  Statistic,
  Tag,
  Space,
  message,
  Divider
} from 'antd';
import { SyncOutlined, CheckCircleOutlined, CloseCircleOutlined, UserOutlined } from '@ant-design/icons';
import { orderApi, permissionApi } from '@/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<any[]>([
    dayjs().subtract(7, 'days'),
    dayjs()
  ]);
  const [selectedBranch, setSelectedBranch] = useState<number | undefined>();

  const fetchBranches = async () => {
    try {
      const res = await permissionApi.getBranches();
      setBranches(res.data.branches || []);
    } catch {}
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      if (selectedBranch) {
        params.branchId = selectedBranch;
      }

      const res = await orderApi.getStats(params);
      setStats(res.data);
    } catch (error: any) {
      message.error(error.response?.data?.error || '加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchStats();
  }, []);

  const schedulerColumns = [
    {
      title: '调度员',
      key: 'scheduler',
      render: (_: any, record: any) => (
        <div>
          <div><UserOutlined /> {record.name}</div>
          <div style={{ color: '#999', fontSize: '12px' }}>ERP: {record.erp_id}</div>
        </div>
      ),
    },
    {
      title: '确认完成',
      dataIndex: 'confirmed_count',
      key: 'confirmed_count',
      render: (count: number) => (
        <Tag icon={<CheckCircleOutlined />} color="green">
          {count} 单
        </Tag>
      ),
    },
    {
      title: '取消订单',
      dataIndex: 'cancelled_count',
      key: 'cancelled_count',
      render: (count: number) => (
        <Tag icon={<CloseCircleOutlined />} color="red">
          {count} 单
        </Tag>
      ),
    },
    {
      title: '总计',
      dataIndex: 'total_count',
      key: 'total_count',
      render: (count: number) => <strong>{count} 单</strong>,
    },
    {
      title: '完成率',
      key: 'rate',
      render: (_: any, record: any) => {
        const rate = record.total_count > 0
          ? ((record.confirmed_count / record.total_count) * 100).toFixed(1)
          : 0;
        return (
          <Tag color={parseFloat(rate) >= 80 ? 'green' : parseFloat(rate) >= 50 ? 'orange' : 'red'}>
            {rate}%
          </Tag>
        );
      },
    },
  ];

  const rejectColumns = [
    {
      title: '手机号',
      dataIndex: 'receiver_phone',
      key: 'receiver_phone',
      render: (phone: string) => <strong>{phone}</strong>,
    },
    {
      title: '拒收次数',
      dataIndex: 'reject_count',
      key: 'reject_count',
      render: (count: number) => (
        <Tag color={count >= 3 ? 'red' : count >= 2 ? 'orange' : 'default'}>
          {count} 次
        </Tag>
      ),
    },
    {
      title: '最近拒收时间',
      dataIndex: 'last_reject_at',
      key: 'last_reject_at',
    },
    {
      title: '标记',
      key: 'flag',
      render: (_: any, record: any) => {
        if (record.reject_count >= 3) {
          return <Tag color="red">高风险</Tag>;
        }
        if (record.reject_count >= 2) {
          return <Tag color="orange">中风险</Tag>;
        }
        return <Tag color="default">低风险</Tag>;
      },
    },
  ];

  return (
    <div>
      <Card
        title="调度报表"
        extra={
          <Button icon={<SyncOutlined />} onClick={fetchStats} loading={loading}>
            刷新
          </Button>
        }
      >
        <Space style={{ marginBottom: 24 }}>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates || [])}
          />
          <Select
            placeholder="选择分公司"
            style={{ width: 180 }}
            value={selectedBranch}
            onChange={setSelectedBranch}
            allowClear
          >
            {branches.map((b) => (
              <Option key={b.id} value={b.id}>
                {b.name}
              </Option>
            ))}
          </Select>
          <Button type="primary" onClick={fetchStats}>
            查询
          </Button>
        </Space>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="总调度订单"
                value={stats?.summary?.totalScheduled || 0}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="取消订单"
                value={stats?.summary?.totalCancelled || 0}
                prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="完成率"
                value={
                  stats?.summary && (stats.summary.totalScheduled + stats.summary.totalCancelled) > 0
                    ? ((stats.summary.totalScheduled / (stats.summary.totalScheduled + stats.summary.totalCancelled)) * 100).toFixed(1)
                    : 0
                }
                suffix="%"
                precision={1}
              />
            </Card>
          </Col>
        </Row>

        <Divider orientation="left">调度员时效统计</Divider>

        <Table
          columns={schedulerColumns}
          dataSource={stats?.schedulerStats || []}
          rowKey="id"
          loading={loading}
          pagination={false}
        />

        <Divider orientation="left">恶意拒收客户线索</Divider>

        <Table
          columns={rejectColumns}
          dataSource={stats?.maliciousRejects || []}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default Reports;
