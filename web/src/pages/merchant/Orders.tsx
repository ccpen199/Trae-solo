import { useEffect, useState } from 'react';
import { Table, Card, Tag, Button, Descriptions, Drawer, message, Timeline } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import api from '../../api';
import dayjs from 'dayjs';

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待支付' },
  paid: { color: 'blue', text: '已支付，待履约' },
  fulfilled: { color: 'green', text: '已完成' },
};

export default function MerchantOrders() {
  const [list, setList] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);

  const loadData = () => {
    api.get('/orders').then((res) => setList(res.data));
  };

  useEffect(() => { loadData(); }, []);

  const handleFulfill = async (id: string) => {
    try {
      await api.post(`/orders/${id}/fulfill`);
      message.success('订单已完成履约');
      loadData();
      setDetail(null);
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    { title: '订单号', dataIndex: 'id', render: (v: string) => v.substring(0, 12) },
    { title: '商品', dataIndex: ['product', 'name'] },
    { title: '客户', dataIndex: ['user', 'name'] },
    { title: '联系电话', dataIndex: 'contactPhone' },
    { title: '数量', dataIndex: 'quantity' },
    { title: '金额', dataIndex: 'totalAmount', render: (v: number) => <span style={{ color: '#ff4d4f', fontWeight: 600 }}>¥{v}</span> },
    { title: '预约时间', dataIndex: 'scheduledTime', render: (v: string) => v || '-' },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag> },
    { title: '下单时间', dataIndex: 'createdAt', render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      render: (_: any, record: any) => (
        <Button type="link" onClick={() => setDetail(record)}>查看详情</Button>
      ),
    },
  ];

  return (
    <div>
      <Card title="订单管理" style={{ borderRadius: 12 }}>
        <Table columns={columns} dataSource={list} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Drawer title="订单详情" open={!!detail} onClose={() => setDetail(null)} width={560}>
        {detail && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="订单号">{detail.id}</Descriptions.Item>
              <Descriptions.Item label="商品">{detail.product?.name}</Descriptions.Item>
              <Descriptions.Item label="客户姓名">{detail.contactName || detail.user?.name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{detail.contactPhone}</Descriptions.Item>
              <Descriptions.Item label="配送地址">{detail.address}</Descriptions.Item>
              <Descriptions.Item label="预约时间">{detail.scheduledTime || '即时'}</Descriptions.Item>
              <Descriptions.Item label="数量">{detail.quantity}</Descriptions.Item>
              <Descriptions.Item label="总金额">¥{detail.totalAmount}</Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={statusMap[detail.status]?.color}>{statusMap[detail.status]?.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="备注">{detail.remark || '-'}</Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <h4>订单进度</h4>
              <Timeline
                items={[
                  { color: 'green', children: `下单：${dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm')}` },
                  ...(detail.paidAt ? [{ color: 'green', children: `支付完成：${dayjs(detail.paidAt).format('YYYY-MM-DD HH:mm')}` }] : []),
                  ...(detail.fulfilledAt ? [{ color: 'green', children: `履约完成：${dayjs(detail.fulfilledAt).format('YYYY-MM-DD HH:mm')}` }] : []),
                ]}
              />
            </div>

            {detail.status === 'paid' && (
              <Button type="primary" block icon={<CheckCircleOutlined />} style={{ marginTop: 24 }} onClick={() => handleFulfill(detail.id)}>
                确认完成履约
              </Button>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
