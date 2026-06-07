import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, message } from 'antd';
import { CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../api/client';
import dayjs from 'dayjs';

interface Settlement {
  id: number;
  settlementNo: string;
  orderAmount: number;
  platformFee: number;
  settlementAmount: number;
  status: string;
  scheduledDate: string;
  settledDate: string;
  createdAt: string;
  provider: { name: string; phone: string };
  order: { orderNo: string };
}

const statusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待结算', color: 'orange' },
  processing: { text: '处理中', color: 'processing' },
  completed: { text: '已结算', color: 'success' },
  failed: { text: '失败', color: 'error' },
  held: { text: '冻结', color: 'default' },
};

const Settlements: React.FC = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettlements();
  }, []);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settlements');
      setSettlements(response.data.settlements);
    } catch (error) {
      console.error('Load settlements error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSettlements = async () => {
    try {
      await api.post('/admin/settlements/generate');
      message.success('结算记录生成成功');
      loadSettlements();
    } catch (error: any) {
      message.error(error.response?.data?.error || '生成失败');
    }
  };

  const processSettlement = async (id: number) => {
    try {
      await api.put(`/admin/settlements/${id}/process`);
      message.success('结算完成');
      loadSettlements();
    } catch (error: any) {
      message.error(error.response?.data?.error || '处理失败');
    }
  };

  const columns = [
    {
      title: '结算单号',
      dataIndex: 'settlementNo',
      key: 'settlementNo',
      width: 180,
    },
    {
      title: '服务商',
      dataIndex: ['provider', 'name'],
      key: 'provider',
    },
    {
      title: '关联订单',
      dataIndex: ['order', 'orderNo'],
      key: 'orderNo',
    },
    {
      title: '订单金额',
      dataIndex: 'orderAmount',
      key: 'orderAmount',
      render: (amount: number) => `¥${amount}`,
    },
    {
      title: '平台抽成',
      dataIndex: 'platformFee',
      key: 'platformFee',
      render: (amount: number) => `¥${amount}`,
    },
    {
      title: '结算金额',
      dataIndex: 'settlementAmount',
      key: 'settlementAmount',
      render: (amount: number) => <strong style={{ color: '#52c41a' }}>¥{amount}</strong>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '预计结算日',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Settlement) => (
        record.status === 'pending' && (
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => processSettlement(record.id)}
          >
            确认结算
          </Button>
        )
      ),
    },
  ];

  return (
    <div>
      <Card
        title="结算管理"
        extra={
          <Button icon={<ReloadOutlined />} onClick={generateSettlements}>
            生成待结算记录
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={settlements}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default Settlements;
