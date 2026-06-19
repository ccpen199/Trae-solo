import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Tag, Space, Switch, Popconfirm, Typography, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

const deviceTypeMap: Record<string, { text: string; color: string }> = {
  BLUETOOTH: { text: '蓝牙', color: 'blue' },
  NFC: { text: 'NFC', color: 'purple' },
  QRCODE: { text: '二维码', color: 'green' },
  FACE: { text: '人脸识别', color: 'cyan' },
};

const mockData = Array.from({ length: 12 }, (_, i) => ({
  id: `DEV-${String(i + 1).padStart(3, '0')}`,
  name: ['东门门禁', '西门门禁', '南门门禁', '北门门禁', '1号楼单元门', '2号楼单元门', '3号楼单元门'][i % 7],
  type: ['BLUETOOTH', 'NFC', 'QRCODE', 'FACE'][i % 4],
  communityName: '阳光花园小区',
  buildingName: i < 4 ? null : `${Math.floor(i / 2) - 1}号楼`,
  location: ['东门入口', '西门入口', '南门入口', '北门入口', '1号楼', '2号楼', '3号楼'][i % 7],
  macAddress: `AC:${String(Math.floor(Math.random() * 100)).padStart(2, '0')}:${String(Math.floor(Math.random() * 100)).padStart(2, '0')}:${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
  isOnline: i !== 3,
  lastHeartbeat: i === 3 ? '2026-06-18 10:30:00' : '2026-06-19 15:45:00',
  createdAt: '2026-01-15 10:00:00',
}));

export default function AccessDevice() {
  const { message } = App.useApp();

  const columns = [
    { title: '设备编号', dataIndex: 'id', width: 120 },
    { title: '设备名称', dataIndex: 'name', width: 160 },
    {
      title: '设备类型',
      dataIndex: 'type',
      width: 100,
      render: (val: string) => {
        const cfg = deviceTypeMap[val];
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    { title: '所属小区', dataIndex: 'communityName', width: 140 },
    { title: '所属楼栋', dataIndex: 'buildingName', width: 100, render: (v: string) => v || '公共区域' },
    { title: '安装位置', dataIndex: 'location', width: 120 },
    { title: 'MAC地址', dataIndex: 'macAddress', width: 160, render: (v: string) => <Text code>{v}</Text> },
    {
      title: '在线状态',
      dataIndex: 'isOnline',
      width: 100,
      render: (val: boolean) => (
        <Tag color={val ? 'success' : 'default'}>
          {val ? '● 在线' : '○ 离线'}
        </Tag>
      ),
    },
    { title: '最后心跳', dataIndex: 'lastHeartbeat', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除该设备吗？"
            onConfirm={() => message.success('删除成功')}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ProTable
      headerTitle="门禁设备"
      columns={columns}
      dataSource={mockData}
      rowKey="id"
      search={{ labelWidth: 100 }}
      pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      toolBarRender={() => [
        <Button type="primary" icon={<PlusOutlined />}>新增设备</Button>,
      ]}
      scroll={{ x: 1400 }}
    />
  );
}
