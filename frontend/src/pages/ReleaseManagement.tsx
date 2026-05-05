import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Statistic,
  message,
  Popconfirm,
  Checkbox,
} from 'antd';
import { ReloadOutlined, StopOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { scheduleApi, reportApi } from '../services/api';

const ReleaseManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [stats, setStats] = useState<any>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [page, pageSize]);

  const fetchStats = async () => {
    try {
      const response = await reportApi.getStatistics();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch statistics');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await scheduleApi.getPendingRelease({
        page,
        pageSize,
      });
      const { schedules, total: totalCount } = response.data.data;
      setData(schedules);
      setTotal(totalCount);
    } catch (error: any) {
      message.error('获取待释放列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchRelease = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要释放的订单');
      return;
    }

    setReleasing(true);
    try {
      const response = await scheduleApi.batchRelease(selectedRowKeys as string[]);
      const { released, total } = response.data.data;
      message.success(`成功释放 ${released} 条订单`);
      setSelectedRowKeys([]);
      fetchData();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '批量释放失败');
    } finally {
      setReleasing(false);
    }
  };

  const handleRelease = async (scheduleId: string) => {
    try {
      await scheduleApi.releaseSchedule(scheduleId);
      message.success('订单已释放');
      fetchData();
      fetchStats();
    } catch (error: any) {
      message.error('释放失败');
    }
  };

  const scheduleStatusMap: Record<string, string> = {
    PENDING: '待处理',
    PROCESSING: '处理中',
    COMPLETED: '已完成',
    EXPIRED: '已过期',
    RELEASED: '已释放',
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: ['order', 'orderNo'],
      key: 'orderNo',
    },
    {
      title: '收货人',
      dataIndex: ['order', 'receiverName'],
      key: 'receiverName',
    },
    {
      title: '手机号',
      dataIndex: ['order', 'receiverPhone'],
      key: 'receiverPhone',
    },
    {
      title: '调度人员',
      key: 'user',
      render: (_: any, record: any) => record.user?.name || '-',
    },
    {
      title: '领取时间',
      dataIndex: 'claimedAt',
      key: 'claimedAt',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (val: string) => (
        <Tag color="red">{dayjs(val).format('YYYY-MM-DD HH:mm:ss')}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          PENDING: 'default',
          PROCESSING: 'processing',
          COMPLETED: 'success',
          EXPIRED: 'red',
          RELEASED: 'default',
        };
        return <Tag color={colorMap[val] || 'default'}>{scheduleStatusMap[val] || val}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Popconfirm title="确定要释放该订单吗？" onConfirm={() => handleRelease(record.id)}>
            <Button type="link" size="small" danger icon={<StopOutlined />}>
              释放
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const pagination = {
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number) => `共 ${total} 条`,
    onChange: (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
    },
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      setSelectedRowKeys(keys);
    },
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">待释放管理</h2>
      </div>

      <Row gutter={16} className="stats-row">
        <Col span={6}>
          <Card>
            <Statistic
              title="待调度订单"
              value={stats.waitingOrders || 0}
              prefix={<StopOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="处理中"
              value={stats.activeSchedules || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.scheduledOrders || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<StopOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待释放"
              value={total}
              valueStyle={{ color: '#faad14' }}
              prefix={<StopOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              danger
              icon={<StopOutlined />}
              onClick={handleBatchRelease}
              loading={releasing}
              disabled={selectedRowKeys.length === 0}
            >
              批量释放 ({selectedRowKeys.length})
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              刷新
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          rowSelection={rowSelection}
        />
      </Card>
    </div>
  );
};

export default ReleaseManagement;
