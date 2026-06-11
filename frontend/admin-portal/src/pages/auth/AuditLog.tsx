import { useState } from 'react';
import { Table, Card, Space, Input, Select, DatePicker, Tag, Button } from 'antd';
import { SearchOutlined, ReloadOutlined, ExportOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface AuditRecord {
  id: string;
  operator: string;
  action: string;
  module: string;
  target: string;
  ip: string;
  status: string;
  detail: string;
  createdAt: string;
}

const mockData: AuditRecord[] = Array.from({ length: 50 }, (_, i) => ({
  id: `LOG${String(i + 1).padStart(5, '0')}`,
  operator: ['张三', '李四', '王五', '赵六', '钱七'][i % 5],
  action: ['登录', '新增', '修改', '删除', '导出'][i % 5],
  module: ['认证管理', '数据共享', '证照管理', '补贴监管', '服务监控', '诉求管理'][i % 6],
  target: ['用户', 'API', '证照', '补贴政策', '告警规则', '工单'][i % 6],
  ip: `192.168.${i % 10}.${100 + i}`,
  status: i % 10 === 0 ? '失败' : '成功',
  detail: `操作了${['用户', 'API', '证照', '补贴政策', '告警规则', '工单'][i % 6]}相关数据`,
  createdAt: dayjs().subtract(i * 2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
}));

const AuditLog: React.FC = () => {
  const [data] = useState(mockData);
  const [searchText, setSearchText] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('');

  const filteredData = data.filter((item) => {
    const matchSearch = !searchText || item.operator.includes(searchText) || item.detail.includes(searchText);
    const matchAction = !actionFilter || item.action === actionFilter;
    const matchModule = !moduleFilter || item.module === moduleFilter;
    return matchSearch && matchAction && matchModule;
  });

  const columns = [
    { title: '日志ID', dataIndex: 'id', width: 110 },
    { title: '操作人', dataIndex: 'operator', width: 90 },
    { title: '操作类型', dataIndex: 'action', width: 90, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '功能模块', dataIndex: 'module', width: 110 },
    { title: '操作对象', dataIndex: 'target', width: 90 },
    { title: 'IP地址', dataIndex: 'ip', width: 140 },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v: string) => v === '成功' ? <Tag color="success">成功</Tag> : <Tag color="error">失败</Tag>,
    },
    { title: '详情', dataIndex: 'detail', width: 200, ellipsis: true },
    { title: '操作时间', dataIndex: 'createdAt', width: 180 },
  ];

  return (
    <div className="page-container">
      <Card bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <Space wrap>
            <Input
              placeholder="搜索操作人/详情"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 220 }}
              allowClear
            />
            <Select
              placeholder="操作类型"
              value={actionFilter || undefined}
              onChange={setActionFilter}
              allowClear
              style={{ width: 120 }}
              options={['登录', '新增', '修改', '删除', '导出'].map((v) => ({ label: v, value: v }))}
            />
            <Select
              placeholder="功能模块"
              value={moduleFilter || undefined}
              onChange={setModuleFilter}
              allowClear
              style={{ width: 120 }}
              options={['认证管理', '数据共享', '证照管理', '补贴监管', '服务监控', '诉求管理'].map((v) => ({ label: v, value: v }))}
            />
            <DatePicker.RangePicker />
            <Button icon={<ReloadOutlined />} onClick={() => { setSearchText(''); setActionFilter(''); setModuleFilter(''); }}>重置</Button>
          </Space>
          <Button icon={<ExportOutlined />}>导出</Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条`, showSizeChanger: true }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default AuditLog;
