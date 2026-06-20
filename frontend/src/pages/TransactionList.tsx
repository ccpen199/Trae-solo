import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Select, Space, Alert, Steps } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../utils/request';

const { Option } = Select;

interface Props {
  user: any;
}

export default function TransactionList({ user }: Props) {
  const navigate = useNavigate();
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [role, setRole] = useState('buyer');
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadList();
  }, [page, role, type, user]);

  const loadList = async () => {
    setLoading(true);
    try {
      const endpoint = user ? '/transactions/my' : '/transactions/public';
      const params: any = user ? { role, type, page, pageSize } : { type, page, pageSize };
      const res: any = await api.get(endpoint, { params });
      setList(res.list || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待处理' },
    processing: { color: 'blue', text: '进行中' },
    completed: { color: 'green', text: '已完成' },
    cancelled: { color: 'red', text: '已取消' },
  };

  const typeMap: Record<string, string> = {
    new: '新房',
    secondhand: '二手房',
    rental: '租赁',
    commercial: '商业物业',
  };

  const stepLabels: Record<string, string> = {
    sign_contract: '签约',
    fund_escrow: '资金监管',
    tax_payment: '税费',
    property_transfer: '过户',
    delivery: '交付',
  };

  const getCurrentStep = (progress: Record<string, string>) => {
    const order = ['sign_contract', 'fund_escrow', 'tax_payment', 'property_transfer', 'delivery'];
    for (let i = order.length - 1; i >= 0; i--) {
      if (progress[order[i]] === 'completed') return i;
    }
    for (let i = 0; i < order.length; i++) {
      if (progress[order[i]] === 'processing') return i;
    }
    return 0;
  };

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'order_no',
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: '房源信息',
      dataIndex: 'property_title',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.property_address || record.district}</div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (t: string) => typeMap[t] || t,
    },
    {
      title: '成交价格',
      dataIndex: 'price',
      render: (p: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          {p}万
        </span>
      ),
    },
    {
      title: '交易进度',
      key: 'progress',
      render: (_: any, record: any) => {
        if (!record.progress) return '-';
        const current = getCurrentStep(record.progress);
        return (
          <Steps
            size="small"
            current={current}
            direction="horizontal"
            style={{ width: 320 }}
            items={['sign_contract', 'fund_escrow', 'tax_payment', 'property_transfer', 'delivery'].map((s) => ({
              title: stepLabels[s],
              status: record.progress[s] === 'completed' ? 'finish' : 
                     record.progress[s] === 'processing' ? 'process' : 'wait',
            }))}
          />
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => {
        const info = statusMap[s] || { color: 'default', text: s };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="link" onClick={() => navigate(`/transaction/${record.id}`)}>
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card 
        title={user ? '我的交易' : '交易大厅（示例）'} 
        style={{ borderRadius: 8 }}
        extra={
          <Space>
            {user && (
              <Select value={role} onChange={setRole} style={{ width: 120 }}>
                <Option value="buyer">作为买家</Option>
                <Option value="seller">作为卖家</Option>
              </Select>
            )}
            <Select value={type} onChange={setType} style={{ width: 120 }}>
              <Option value="all">全部类型</Option>
              <Option value="new">新房</Option>
              <Option value="secondhand">二手房</Option>
              <Option value="rental">租赁</Option>
              <Option value="commercial">商业物业</Option>
            </Select>
          </Space>
        }
      >
        {!user && (
          <Alert
            message="当前显示平台交易示例数据"
            description="登录后可查看您的个人交易记录。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Table
          columns={columns}
          dataSource={list}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: setPage,
          }}
        />
      </Card>
    </div>
  );
}
