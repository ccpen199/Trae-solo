import { ProTable } from '@ant-design/pro-components';
import { Tag, Space, Button, Typography, Badge, App, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const typeMap: Record<string, { text: string; color: string }> = {
  REPAIR: { text: '报修', color: 'blue' },
  COMPLAINT: { text: '投诉', color: 'red' },
  SUGGESTION: { text: '建议', color: 'green' },
};

const statusMap: Record<string, { text: string; color: string }> = {
  PENDING: { text: '待处理', color: 'warning' },
  ASSIGNED: { text: '已分配', color: 'processing' },
  PROCESSING: { text: '处理中', color: 'processing' },
  COMPLETED: { text: '已完成', color: 'success' },
  CLOSED: { text: '已关闭', color: 'default' },
  CANCELLED: { text: '已取消', color: 'default' },
};

const priorityMap: Record<string, { text: string; color: string }> = {
  LOW: { text: '低', color: 'default' },
  MEDIUM: { text: '中', color: 'blue' },
  HIGH: { text: '高', color: 'orange' },
  URGENT: { text: '紧急', color: 'red' },
};

const mockData = Array.from({ length: 30 }, (_, i) => ({
  id: `TK-${String(i + 1).padStart(5, '0')}`,
  type: ['REPAIR', 'COMPLAINT', 'SUGGESTION'][i % 3],
  title: ['客厅灯不亮', '楼下噪音扰民', '建议增加健身器材', '电梯故障', '水管漏水', '绿化补种建议'][i % 6],
  status: ['PENDING', 'ASSIGNED', 'PROCESSING', 'COMPLETED', 'CLOSED'][i % 5],
  priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][i % 4],
  creatorName: ['陈居民', '王业主', '李住户'][i % 3],
  creatorPhone: `138****${1000 + i}`,
  handlerName: i % 5 === 0 ? null : ['李客服', '王师傅', '张工程'][i % 3],
  communityName: '阳光花园小区',
  houseInfo: `${Math.floor(i / 3) + 1}号楼 ${Math.floor(i / 5) + 1}单元 ${Math.floor(i / 7) + 1}01`,
  createdAt: `2026-06-${String(19 - Math.floor(i / 3)).padStart(2, '0')} ${String(8 + (i % 10)).padStart(2, '0')}:00:00`,
  completedAt: i >= 15 ? `2026-06-${String(19 - Math.floor(i / 3) + 1).padStart(2, '0')} ${String(10 + (i % 8)).padStart(2, '0')}:30:00` : null,
  rating: i >= 15 ? 4 + (i % 2) : null,
}));

export default function TicketList() {
  const navigate = useNavigate();
  const { message } = App.useApp();

  const columns: any[] = [
    { title: '工单编号', dataIndex: 'id', width: 110 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      render: (v: string) => <Tag color={typeMap[v].color}>{typeMap[v].text}</Tag>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      render: (v: string) => <Tag color={priorityMap[v].color}>{priorityMap[v].text}</Tag>,
    },
    { title: '标题', dataIndex: 'title', width: 200, ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => (
        <Badge status={statusMap[v].color as any} text={statusMap[v].text} />
      ),
    },
    { title: '提交人', dataIndex: 'creatorName', width: 90 },
    { title: '联系电话', dataIndex: 'creatorPhone', width: 120 },
    { title: '处理人', dataIndex: 'handlerName', width: 90, render: (v: string) => v || '-' },
    { title: '房产信息', dataIndex: 'houseInfo', width: 180 },
    { title: '提交时间', dataIndex: 'createdAt', width: 170 },
    { title: '评分', dataIndex: 'rating', width: 80, render: (v: number) => v ? `⭐ ${v}` : '-' },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/tickets/${record.id}`)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />}>处理</Button>
        </Space>
      ),
    },
  ];

  return (
    <ProTable
      headerTitle="工单列表"
      columns={columns}
      dataSource={mockData}
      rowKey="id"
      search={{ labelWidth: 100 }}
      pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      scroll={{ x: 1500 }}
    />
  );
}
