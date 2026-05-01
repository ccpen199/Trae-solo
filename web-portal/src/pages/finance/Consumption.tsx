import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Space, Button, Select, Input, DatePicker } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { financeApi } from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const FinanceConsumption: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [summary, setSummary] = useState({ count: 0, totalAmount: 0 });
  const [filters, setFilters] = useState<{ startTime?: string; endTime?: string }>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await financeApi.getConsumptions({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setData(result.data.list);
      setPagination((prev) => ({
        ...prev,
        total: result.data.total,
      }));
      setSummary(result.data.summary);
    } catch (error) {
      console.error('获取消费记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, filters]);

  const columns = [
    {
      title: '消费编号',
      dataIndex: 'recordCode',
      key: 'recordCode',
    },
    {
      title: '手机号',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: '模板名称',
      dataIndex: 'templateName',
      key: 'templateName',
    },
    {
      title: '通道',
      dataIndex: 'providerName',
      key: 'providerName',
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      render: (v: number) => `¥${v}`,
    },
    {
      title: '消费金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => <span style={{ color: '#ff4d4f' }}>-¥{v}</span>,
    },
    {
      title: '消费前余额',
      dataIndex: 'balanceBefore',
      key: 'balanceBefore',
      render: (v: number) => `¥${v}`,
    },
    {
      title: '消费后余额',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      render: (v: number) => `¥${v}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'success' : 'default'}>
          {status === 1 ? '已扣费' : status === 2 ? '已退款' : '未知'}
        </Tag>
      ),
    },
    {
      title: '消费时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            消费记录
            <Tag color="blue">
              共 {summary.count} 条，合计 ¥{summary.totalAmount}
            </Tag>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchData}
          >
            刷新
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <RangePicker
              showTime
              onChange={(dates) => {
                if (dates && dates.length === 2) {
                  setFilters({
                    startTime: dates[0].toISOString(),
                    endTime: dates[1].toISOString(),
                  });
                } else {
                  setFilters({});
                }
              }}
            />
            <Button type="primary" onClick={fetchData}>
              搜索
            </Button>
            <Button onClick={() => setFilters({})}>
              重置
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }));
            },
          }}
        />
      </Card>
    </div>
  );
};

export default FinanceConsumption;
