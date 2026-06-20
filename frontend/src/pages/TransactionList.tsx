import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Select, Space } from 'antd';
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
  }, [page, role, type]);

  const loadList = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/transactions/my', {
        params: { role, type, page, pageSize },
      });
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
          <div>{text}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.property_address}</div>
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
      render: (p: number, record: any) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          {p}{record.price_unit === 'yuan/month' ? '元/月' : '万'}
        </span>
      ),
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
        title="我的交易" 
        style={{ borderRadius: 8 }}
        extra={
          <Space>
            <Select value={role} onChange={setRole} style={{ width: 120 }}>
              <Option value="buyer">作为买家</Option>
              <Option value="seller">作为卖家</Option>
            </Select>
            <Select value={type} onChange={setType} style={{ width: 120 }}>
              <Option value="all">全部类型</Option>
              <Option value="new">新房</Option>
              <Option value="secondhand">二手房</Option>
              <Option value="rental">租赁</Option>
            </Select>
          </Space>
        }
      >
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
