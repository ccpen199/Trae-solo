import { ProTable } from '@ant-design/pro-components';
import { Tag, Button, Space, Descriptions, Drawer } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useState } from 'react';

const statusMap: Record<string, { text: string; color: string }> = {
  PENDING_PAYMENT: { text: '待支付', color: 'warning' },
  PAID: { text: '已支付', color: 'processing' },
  ACCEPTED: { text: '已接单', color: 'processing' },
  IN_PROGRESS: { text: '服务中', color: 'processing' },
  COMPLETED: { text: '已完成', color: 'success' },
  REFUNDED: { text: '已退款', color: 'default' },
  CANCELLED: { text: '已取消', color: 'default' },
};

const mockData = Array.from({ length: 30 }, (_, i) => ({
  id: `ORD-${String(i + 1).padStart(6, '0')}`,
  orderNo: `SO202606${String(i + 1).padStart(6, '0')}`,
  serviceName: ['日常保洁服务', '深度保洁服务', '钟点工服务', '空调清洗', '快递代收'][i % 5],
  providerName: ['好阿姨家政', '顺风快递代收', '邻里团购'][i % 3],
  userName: ['陈居民', '王业主', '李住户', '赵先生', '孙女士'][i % 5],
  userPhone: `138****${1000 + i}`,
  totalAmount: (Math.random() * 500 + 20).toFixed(2),
  payAmount: (Math.random() * 500 + 20).toFixed(2),
  commissionAmount: (Math.random() * 50 + 2).toFixed(2),
  status: ['COMPLETED', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED'][i % 5],
  createdAt: `2026-06-${String(19 - Math.floor(i / 5)).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
  address: ['1号楼1单元0101', '2号楼2单元1503', '3号楼1单元0802'][i % 3],
  contactName: ['陈先生', '王女士', '李先生'][i % 3],
  contactPhone: `138****${1000 + i}`,
  quantity: i % 3 + 1,
  unit: ['次', '小时', '份'][i % 3],
  unitPrice: (Math.random() * 100 + 20).toFixed(2),
}));

export default function ServiceOrder() {
  const [viewItem, setViewItem] = useState<any>(null);

  const columns: any[] = [
    { title: '订单号', dataIndex: 'orderNo', width: 180 },
    { title: '服务名称', dataIndex: 'serviceName', width: 160, ellipsis: true },
    { title: '服务商', dataIndex: 'providerName', width: 120 },
    { title: '用户', dataIndex: 'userName', width: 90 },
    { title: '联系方式', dataIndex: 'userPhone', width: 130 },
    { title: '实付金额', dataIndex: 'payAmount', width: 100, render: (v: string) => <b style={{ color: '#EF4444' }}>¥{v}</b> },
    { title: '佣金', dataIndex: 'commissionAmount', width: 90, render: (v: string) => `¥${v}` },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => <Tag color={statusMap[v].color}>{statusMap[v].text}</Tag>,
    },
    { title: '下单时间', dataIndex: 'createdAt', width: 170 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setViewItem(record)}>详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable
        headerTitle="服务订单"
        columns={columns}
        dataSource={mockData}
        rowKey="id"
        search={{ labelWidth: 100 }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        scroll={{ x: 1400 }}
      />

      <Drawer
        title="订单详情"
        width={560}
        open={!!viewItem}
        onClose={() => setViewItem(null)}
      >
        {viewItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="订单号">{viewItem.orderNo}</Descriptions.Item>
            <Descriptions.Item label="服务名称">{viewItem.serviceName}</Descriptions.Item>
            <Descriptions.Item label="服务商">{viewItem.providerName}</Descriptions.Item>
            <Descriptions.Item label="用户">{viewItem.userName} ({viewItem.userPhone})</Descriptions.Item>
            <Descriptions.Item label="服务地址">{viewItem.address}</Descriptions.Item>
            <Descriptions.Item label="联系人">{viewItem.contactName} ({viewItem.contactPhone})</Descriptions.Item>
            <Descriptions.Item label="订单详情">{viewItem.serviceName} x {viewItem.quantity} {viewItem.unit}</Descriptions.Item>
            <Descriptions.Item label="单价">¥{viewItem.unitPrice}/{viewItem.unit}</Descriptions.Item>
            <Descriptions.Item label="实付金额" labelStyle={{ color: '#EF4444' }}>¥{viewItem.payAmount}</Descriptions.Item>
            <Descriptions.Item label="平台佣金">¥{viewItem.commissionAmount}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={statusMap[viewItem.status].color}>{statusMap[viewItem.status].text}</Tag></Descriptions.Item>
            <Descriptions.Item label="下单时间">{viewItem.createdAt}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </>
  );
}
