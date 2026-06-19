import { ProTable } from '@ant-design/pro-components';
import { Tag, Space, Button, Switch, App, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';

const roleMap: Record<string, { text: string; color: string }> = {
  SUPER_ADMIN: { text: '超级管理员', color: 'red' },
  PROPERTY_ADMIN: { text: '物业管理员', color: 'blue' },
  PROPERTY_STAFF: { text: '物业员工', color: 'cyan' },
  COMMITTEE_CHAIR: { text: '业委会主任', color: 'purple' },
  COMMITTEE_MEMBER: { text: '业委会成员', color: 'purple' },
  RESIDENT: { text: '居民', color: 'default' },
  SERVICE_PROVIDER: { text: '服务商', color: 'orange' },
};

const mockData = Array.from({ length: 30 }, (_, i) => ({
  id: `U${String(i + 1).padStart(5, '0')}`,
  phone: `138****${String(1000 + i)}`,
  nickname: ['陈居民', '王业主', '李住户', '赵先生', '孙女士', '周阿姨', '吴师傅'][i % 7],
  realName: ['陈XX', '王XX', '李XX', '赵XX', '孙XX'][i % 5],
  role: ['RESIDENT', 'RESIDENT', 'RESIDENT', 'PROPERTY_STAFF', 'RESIDENT', 'PROPERTY_ADMIN', 'COMMITTEE_MEMBER', 'SERVICE_PROVIDER'][i % 8],
  status: i % 10 !== 9,
  houseCount: i % 3 + 1,
  communityName: '阳光花园小区',
  houseInfo: `${Math.floor(i / 3) + 1}号楼 ${Math.floor(i / 5) + 1}单元`,
  createdAt: `2026-0${(i % 6) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
  lastLoginAt: `2026-06-${String(19 - Math.floor(i / 3)).padStart(2, '0')}`,
}));

export default function UserList() {
  const { message } = App.useApp();

  const columns: any[] = [
    { title: '用户ID', dataIndex: 'id', width: 100 },
    { title: '手机号', dataIndex: 'phone', width: 130 },
    { title: '昵称', dataIndex: 'nickname', width: 100 },
    { title: '姓名', dataIndex: 'realName', width: 100 },
    {
      title: '角色',
      dataIndex: 'role',
      width: 120,
      render: (v: string) => <Tag color={roleMap[v].color}>{roleMap[v].text}</Tag>,
    },
    { title: '所属小区', dataIndex: 'communityName', width: 140 },
    { title: '房产', dataIndex: 'houseInfo', width: 160 },
    { title: '房产数', dataIndex: 'houseCount', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (val: boolean, record: any) => (
        <Switch
          checked={val}
          onChange={(checked) => message.success(checked ? '已启用' : '已禁用')}
        />
      ),
    },
    { title: '注册时间', dataIndex: 'createdAt', width: 120 },
    { title: '最后登录', dataIndex: 'lastLoginAt', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<KeyOutlined />}>门禁授权</Button>
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
          <Popconfirm title="确认删除" onConfirm={() => message.success('删除成功')}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ProTable
      headerTitle="用户管理"
      columns={columns}
      dataSource={mockData}
      rowKey="id"
      search={{ labelWidth: 100 }}
      pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      scroll={{ x: 1500 }}
    />
  );
}
