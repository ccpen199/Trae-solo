import { ProTable } from '@ant-design/pro-components';
import { Tag, Space, Button, Avatar, App, Popconfirm, Descriptions, Drawer } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { useState } from 'react';

const statusMap: Record<string, { text: string; color: string }> = {
  PENDING_REVIEW: { text: '待审核', color: 'warning' },
  APPROVED: { text: '已通过', color: 'success' },
  REJECTED: { text: '已拒绝', color: 'error' },
  SUSPENDED: { text: '已暂停', color: 'default' },
  OFFLINE: { text: '已下线', color: 'default' },
};

const mockData = Array.from({ length: 15 }, (_, i) => ({
  id: `SP-${String(i + 1).padStart(4, '0')}`,
  name: ['好阿姨家政', '顺风快递代收', '邻里团购', '快修家电', '便民搬家'][i % 5],
  contactName: ['刘经理', '王师傅', '张主管', '陈阿姨', '李师傅'][i % 5],
  contactPhone: `138****${1000 + i}`,
  status: ['PENDING_REVIEW', 'APPROVED', 'APPROVED', 'APPROVED', 'SUSPENDED'][i % 5],
  commissionRate: i % 2 === 0 ? 10 : 12,
  serviceCount: Math.floor(Math.random() * 50) + 5,
  orderCount: Math.floor(Math.random() * 500) + 50,
  totalAmount: (Math.random() * 50000 + 5000).toFixed(2),
  createdAt: `2026-0${(i % 6) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
  description: '专业服务团队，持证上岗，安全可靠。',
}));

export default function ServiceProvider() {
  const { message } = App.useApp();
  const [viewItem, setViewItem] = useState<any>(null);

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 100 },
    {
      title: '服务商名称',
      dataIndex: 'name',
      width: 160,
      render: (v: string, record: any) => (
        <Space>
          <Avatar style={{ backgroundColor: '#10B981' }}>{v.charAt(0)}</Avatar>
          <span>{v}</span>
        </Space>
      ),
    },
    { title: '联系人', dataIndex: 'contactName', width: 100 },
    { title: '联系电话', dataIndex: 'contactPhone', width: 130 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => <Tag color={statusMap[v].color}>{statusMap[v].text}</Tag>,
    },
    { title: '佣金比例', dataIndex: 'commissionRate', width: 100, render: (v: number) => `${v}%` },
    { title: '服务商品数', dataIndex: 'serviceCount', width: 110 },
    { title: '订单数', dataIndex: 'orderCount', width: 90 },
    { title: '累计金额', dataIndex: 'totalAmount', width: 120, render: (v: string) => `¥${v}` },
    { title: '入驻时间', dataIndex: 'createdAt', width: 130 },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setViewItem(record)}>详情</Button>
          {record.status === 'PENDING_REVIEW' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => message.success('审核通过')}>
                通过
              </Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => message.success('已拒绝')}>
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable
        headerTitle="服务商管理"
        columns={columns}
        dataSource={mockData}
        rowKey="id"
        search={{ labelWidth: 100 }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        scroll={{ x: 1400 }}
      />

      <Drawer
        title="服务商详情"
        width={640}
        open={!!viewItem}
        onClose={() => setViewItem(null)}
      >
        {viewItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="服务商ID">{viewItem.id}</Descriptions.Item>
            <Descriptions.Item label="服务商名称">{viewItem.name}</Descriptions.Item>
            <Descriptions.Item label="联系人">{viewItem.contactName}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{viewItem.contactPhone}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[viewItem.status].color}>{statusMap[viewItem.status].text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="佣金比例">{viewItem.commissionRate}%</Descriptions.Item>
            <Descriptions.Item label="服务简介">{viewItem.description}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </>
  );
}
