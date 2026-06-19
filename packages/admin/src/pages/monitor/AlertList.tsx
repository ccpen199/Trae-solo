import { ProTable } from '@ant-design/pro-components';
import { Tag, Space, Button, App, Badge, Typography, Modal } from 'antd';
import { CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Text } = Typography;

const levelMap: Record<string, { text: string; color: string }> = {
  INFO: { text: '信息', color: 'blue' },
  WARNING: { text: '警告', color: 'warning' },
  ERROR: { text: '错误', color: 'error' },
  CRITICAL: { text: '严重', color: 'red' },
};

const typeMap: Record<string, { text: string; color: string }> = {
  DEVICE_OFFLINE: { text: '设备离线', color: 'warning' },
  HIGH_PRIORITY_TICKET: { text: '高优先级工单', color: 'processing' },
  SLA_EXCEEDED: { text: '响应超时', color: 'error' },
  LOW_DEVICE_BATTERY: { text: '低电量', color: 'warning' },
  ABNORMAL_ACCESS: { text: '异常通行', color: 'error' },
};

const mockData = Array.from({ length: 20 }, (_, i) => ({
  id: `ALT-${String(i + 1).padStart(6, '0')}`,
  type: ['DEVICE_OFFLINE', 'HIGH_PRIORITY_TICKET', 'SLA_EXCEEDED', 'ABNORMAL_ACCESS', 'LOW_DEVICE_BATTERY'][i % 5],
  level: ['WARNING', 'INFO', 'ERROR', 'CRITICAL', 'WARNING'][i % 5],
  title: [
    '北门门禁设备离线',
    '收到高优先级投诉工单',
    '工单响应超时（已超过30分钟）',
    '检测到异常通行尝试',
    '设备电量不足',
  ][i % 5],
  content: [
    '北门人脸识别门禁已超过24小时未上报心跳，请检查设备网络。',
    '收到一条高优先级投诉工单，请及时处理。',
    '工单TK-00042已超过30分钟未响应，违反SLA承诺。',
    '检测到5分钟内连续3次通行失败，请关注是否存在异常。',
    '1号楼单元门蓝牙设备电量不足10%，请及时更换电池。',
  ][i % 5],
  deviceName: i % 2 === 0 ? ['北门门禁', '1号楼单元门', '东门门禁'][i % 3] : null,
  isRead: i >= 5,
  createdAt: `2026-06-${String(19 - Math.floor(i / 8)).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
  readAt: i >= 5 ? `2026-06-${String(19 - Math.floor(i / 8)).padStart(2, '0')} ${String(9 + (i % 12)).padStart(2, '0')}:00:00` : null,
}));

export default function AlertList() {
  const { message } = App.useApp();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const handleMarkAllRead = () => {
    Modal.confirm({
      title: '确认全部标为已读',
      content: '确定要将所有未读告警标记为已读吗？',
      onOk: () => {
        message.success('已全部标记为已读');
      },
    });
  };

  const columns: any[] = [
    {
      title: '状态',
      dataIndex: 'isRead',
      width: 60,
      render: (v: boolean) => v ? null : <Badge status="processing" />,
    },
    {
      title: '告警级别',
      dataIndex: 'level',
      width: 90,
      render: (v: string) => <Tag color={levelMap[v].color}>{levelMap[v].text}</Tag>,
    },
    {
      title: '告警类型',
      dataIndex: 'type',
      width: 130,
      render: (v: string) => <Tag color={typeMap[v].color}>{typeMap[v].text}</Tag>,
    },
    { title: '标题', dataIndex: 'title', width: 200 },
    { title: '详情', dataIndex: 'content', width: 300, ellipsis: true },
    { title: '关联设备', dataIndex: 'deviceName', width: 140, render: (v: string) => v || '-' },
    { title: '告警时间', dataIndex: 'createdAt', width: 170 },
    { title: '读取时间', dataIndex: 'readAt', width: 170, render: (v: string) => v || '-' },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          {!record.isRead && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => message.success('已标记为已读')}
            >
              标记已读
            </Button>
          )}
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      ),
    },
  ];

  const unreadCount = mockData.filter(d => !d.isRead).length;

  return (
    <ProTable
      headerTitle={
        <Space>
          告警中心
          {unreadCount > 0 && <Badge count={unreadCount} color="#EF4444" />}
        </Space>
      }
      columns={columns}
      dataSource={mockData}
      rowKey="id"
      search={{ labelWidth: 100 }}
      rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
      pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      toolBarRender={() => [
        <Button onClick={handleMarkAllRead}>全部标为已读</Button>,
        selectedRowKeys.length > 0 && <Button danger>批量删除</Button>,
      ]}
      scroll={{ x: 1400 }}
    />
  );
}
