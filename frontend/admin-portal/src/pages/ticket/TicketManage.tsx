import { useState } from 'react';
import {
  Table, Button, Space, Input, Tag, Modal, Form, Select, message, Card, Descriptions,
} from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface TicketRecord {
  id: string;
  title: string;
  category: string;
  priority: string;
  source: string;
  applicantName: string;
  assignee: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  content: string;
}

const mockData: TicketRecord[] = [
  { id: 'TK001', title: '社保查询接口超时', category: '技术故障', priority: '高', source: '线上反馈', applicantName: '张先生', assignee: '技术组-李工', status: '处理中', createdAt: '2025-06-09 08:30:00', updatedAt: '2025-06-09 09:00:00', content: '社保查询服务在高峰期频繁超时，影响用户体验' },
  { id: 'TK002', title: '补贴金额计算错误', category: '业务异常', priority: '高', source: '电话投诉', applicantName: '王女士', assignee: '业务组-赵工', status: '待处理', createdAt: '2025-06-08 15:20:00', updatedAt: '2025-06-08 15:20:00', content: '低保补助金额与政策标准不一致，差额约200元' },
  { id: 'TK003', title: '证照核验结果不准确', category: '数据异常', priority: '中', source: '系统监控', applicantName: '系统', assignee: '数据组-周工', status: '处理中', createdAt: '2025-06-08 11:00:00', updatedAt: '2025-06-08 14:00:00', content: '部分身份证核验结果与公安系统数据不一致' },
  { id: 'TK004', title: '页面加载缓慢', category: '性能问题', priority: '低', source: '线上反馈', applicantName: '陈先生', assignee: '技术组-孙工', status: '已解决', createdAt: '2025-06-07 09:30:00', updatedAt: '2025-06-07 11:00:00', content: '数据大屏页面首次加载时间超过5秒' },
  { id: 'TK005', title: '公积金数据更新延迟', category: '数据异常', priority: '中', source: '系统监控', applicantName: '系统', assignee: '数据组-吴工', status: '已关闭', createdAt: '2025-06-06 16:00:00', updatedAt: '2025-06-06 18:30:00', content: '公积金数据同步延迟超过2小时' },
  { id: 'TK006', title: '用户权限配置错误', category: '业务异常', priority: '中', source: '内部反馈', applicantName: '运维组', assignee: '安全组-郑工', status: '待处理', createdAt: '2025-06-09 10:00:00', updatedAt: '2025-06-09 10:00:00', content: '部分用户角色权限配置与实际职责不符' },
];

const priorityColor: Record<string, string> = { '高': 'error', '中': 'warning', '低': 'success' };
const statusColor: Record<string, string> = { '待处理': 'default', '处理中': 'processing', '已解决': 'success', '已关闭': 'default' };

const TicketManage: React.FC = () => {
  const [data, setData] = useState(mockData);
  const [detailVisible, setDetailVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<TicketRecord | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const filteredData = data.filter((item) =>
    item.title.includes(searchText) || item.applicantName.includes(searchText) || item.category.includes(searchText),
  );

  const handleView = (record: TicketRecord) => {
    setViewingRecord(record);
    setDetailVisible(true);
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const newRecord: TicketRecord = {
        ...values,
        id: `TK${String(data.length + 1).padStart(3, '0')}`,
        status: '待处理',
        assignee: '待分派',
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      };
      setData([newRecord, ...data]);
      message.success('工单创建成功');
      setCreateVisible(false);
    } catch { /* validation error */ }
  };

  const columns = [
    { title: '工单ID', dataIndex: 'id', width: 80 },
    { title: '标题', dataIndex: 'title', width: 180, ellipsis: true },
    { title: '分类', dataIndex: 'category', width: 100, render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '优先级', dataIndex: 'priority', width: 80, render: (v: string) => <Tag color={priorityColor[v]}>{v}</Tag> },
    { title: '来源', dataIndex: 'source', width: 90 },
    { title: '提交人', dataIndex: 'applicantName', width: 90 },
    { title: '处理人', dataIndex: 'assignee', width: 110 },
    { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => <Tag color={statusColor[v]}>{v}</Tag> },
    { title: '创建时间', dataIndex: 'createdAt', width: 170 },
    {
      title: '操作', width: 120, fixed: 'right' as const,
      render: (_: unknown, record: TicketRecord) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card bordered={false}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Input
            placeholder="搜索标题/提交人/分类"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setCreateVisible(true); }}>创建工单</Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          scroll={{ x: 1200 }}
        />
      </Card>
      <Modal title="工单详情" open={detailVisible} onCancel={() => setDetailVisible(false)} footer={null} width={600}>
        {viewingRecord && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="工单ID">{viewingRecord.id}</Descriptions.Item>
            <Descriptions.Item label="标题" span={2}>{viewingRecord.title}</Descriptions.Item>
            <Descriptions.Item label="分类">{viewingRecord.category}</Descriptions.Item>
            <Descriptions.Item label="优先级">{viewingRecord.priority}</Descriptions.Item>
            <Descriptions.Item label="来源">{viewingRecord.source}</Descriptions.Item>
            <Descriptions.Item label="提交人">{viewingRecord.applicantName}</Descriptions.Item>
            <Descriptions.Item label="处理人">{viewingRecord.assignee}</Descriptions.Item>
            <Descriptions.Item label="状态">{viewingRecord.status}</Descriptions.Item>
            <Descriptions.Item label="内容" span={2}>{viewingRecord.content}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{viewingRecord.createdAt}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{viewingRecord.updatedAt}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
      <Modal title="创建工单" open={createVisible} onOk={handleCreate} onCancel={() => setCreateVisible(false)} width={560} destroyOnClose>
        <Form form={form} labelCol={{ span: 5 }} wrapperCol={{ span: 18 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择' }]}>
            <Select options={['技术故障', '业务异常', '数据异常', '性能问题', '安全事件'].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请选择' }]}>
            <Select options={['高', '中', '低'].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="source" label="来源" rules={[{ required: true, message: '请选择' }]}>
            <Select options={['线上反馈', '电话投诉', '系统监控', '内部反馈'].map((v) => ({ label: v, value: v }))} />
          </Form.Item>
          <Form.Item name="content" label="描述" rules={[{ required: true, message: '请输入' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TicketManage;
