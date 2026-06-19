import { ProTable } from '@ant-design/pro-components';
import { Tag, DatePicker, Button, Space } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

const accessTypeMap: Record<string, { text: string; color: string }> = {
  QRCODE: { text: '二维码', color: 'green' },
  BLUETOOTH: { text: '蓝牙', color: 'blue' },
  NFC: { text: 'NFC', color: 'purple' },
  FACE: { text: '人脸识别', color: 'cyan' },
};

const mockData = Array.from({ length: 50 }, (_, i) => ({
  id: `LOG-${String(i + 1).padStart(5, '0')}`,
  deviceName: ['东门门禁', '西门门禁', '南门门禁', '1号楼单元门', '2号楼单元门'][i % 5],
  location: ['东门入口', '西门入口', '南门入口', '1号楼', '2号楼'][i % 5],
  userName: ['陈居民', '王业主', '李住户', '赵先生', '孙女士'][i % 5],
  userPhone: `138****${String(Math.floor(Math.random() * 9000 + 1000))}`,
  accessType: ['QRCODE', 'BLUETOOTH', 'NFC', 'FACE'][i % 4],
  accessResult: i % 8 !== 7,
  failReason: i % 8 === 7 ? '二维码已过期' : null,
  accessedAt: `2026-06-${String(19 - Math.floor(i / 8)).padStart(2, '0')} ${String(8 + (i % 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
}));

export default function AccessLog() {
  const columns = [
    { title: '日志编号', dataIndex: 'id', width: 120 },
    { title: '门禁设备', dataIndex: 'deviceName', width: 140 },
    { title: '设备位置', dataIndex: 'location', width: 120 },
    { title: '用户姓名', dataIndex: 'userName', width: 100 },
    { title: '手机号', dataIndex: 'userPhone', width: 130 },
    {
      title: '通行方式',
      dataIndex: 'accessType',
      width: 100,
      render: (val: string) => {
        const cfg = accessTypeMap[val];
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '通行结果',
      dataIndex: 'accessResult',
      width: 100,
      render: (val: boolean) => (
        <Tag color={val ? 'success' : 'error'}>
          {val ? '✓ 通过' : '✗ 拒绝'}
        </Tag>
      ),
    },
    { title: '失败原因', dataIndex: 'failReason', width: 140 },
    { title: '通行时间', dataIndex: 'accessedAt', width: 180 },
  ];

  return (
    <ProTable
      headerTitle="通行日志"
      columns={columns}
      dataSource={mockData}
      rowKey="id"
      search={{ labelWidth: 100 }}
      pagination={{ defaultPageSize: 20, showSizeChanger: true }}
      toolBarRender={() => [
        <Space key="1">
          <DatePicker.RangePicker />
          <Button icon={<DownloadOutlined />}>导出记录</Button>
        </Space>,
      ]}
      scroll={{ x: 1200 }}
    />
  );
}
