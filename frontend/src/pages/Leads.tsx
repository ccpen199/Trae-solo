import { useState, useEffect } from 'react';
import { Card, Table, Input, Button, Tag, Space, Modal, Form, Select, App, Typography, Popconfirm, Drawer, Descriptions } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../api';
import { useAppStore } from '../store';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const statusColorMap: Record<string, string> = {
  new: 'blue', contacted: 'cyan', qualified: 'green', converted: 'gold', lost: 'red'
};
const statusTextMap: Record<string, string> = {
  new: '新线索', contacted: '已联系', qualified: '已确认', converted: '已转化', lost: '已流失'
};

export default function Leads() {
  const { user } = useAppStore();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [industry, setIndustry] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [current, setCurrent] = useState<any>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetchData = () => {
    setLoading(true);
    api.get('/enterprise/leads', { params: { keyword, status, industry } }).then((d: any) => setList(d.leads || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [keyword, status, industry]);

  const openModal = (record?: any) => {
    setEditing(record || null);
    form.setFieldsValue(record || {});
    setModalOpen(true);
  };

  const onSubmit = async (values: any) => {
    try {
      if (editing) await api.put(`/enterprise/leads/${editing.id}`, values);
      else await api.post('/enterprise/leads', values);
      message.success(editing ? '更新成功' : '创建成功');
      setModalOpen(false);
      fetchData();
    } catch (e: any) { message.error(e.error || '操作失败'); }
  };

  const del = async (id: string) => {
    await api.delete(`/enterprise/leads/${id}`);
    message.success('已删除');
    fetchData();
  };

  const columns = [
    { title: '姓名', dataIndex: 'name', render: (t: string, r: any) => <a onClick={() => { setCurrent(r); setDetailOpen(true); }}>{t}</a> },
    { title: '公司', dataIndex: 'company' },
    { title: '职位', dataIndex: 'position' },
    { title: '联系方式', render: (_: any, r: any) => <Space direction="vertical" size="small"><span>📧 {r.email || '-'}</span><span>📱 {r.phone || '-'}</span></Space> },
    { title: '行业', dataIndex: 'industry' },
    { title: '地区', dataIndex: 'region' },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={statusColorMap[s]}>{statusTextMap[s] || s}</Tag> },
    { title: '标签', dataIndex: 'tags', render: (t: string[]) => <Space wrap>{(t || []).map(x => <Tag key={x}>{x}</Tag>)}</Space> },
    { title: '更新时间', dataIndex: 'updated_at', render: (t: string) => dayjs(t).fromNow() },
    {
      title: '操作', render: (_: any, r: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setCurrent(r); setDetailOpen(true); }}>详情</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openModal(r)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => del(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card
      title={<Title level={5} style={{ margin: 0 }}>客户线索池</Title>}
      extra={
        <Space>
          <Input prefix={<SearchOutlined />} placeholder="搜索姓名、公司、联系方式..." value={keyword} onChange={e => setKeyword(e.target.value)} style={{ width: 240 }} allowClear />
          <Select placeholder="状态" value={status} onChange={setStatus} allowClear style={{ width: 120 }}>
            {Object.entries(statusTextMap).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
          </Select>
          <Select placeholder="行业" value={industry} onChange={setIndustry} allowClear style={{ width: 120 }}>
            <Option value="科技">科技</Option><Option value="金融">金融</Option><Option value="教育">教育</Option><Option value="医疗">医疗</Option><Option value="制造">制造</Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>新建线索</Button>
        </Space>
      }
    >
      <Table rowKey="id" loading={loading} columns={columns} dataSource={list} pagination={{ pageSize: 15 }} scroll={{ x: 1200 }} />

      <Modal title={editing ? '编辑线索' : '新建线索'} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={640}>
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="name" label="姓名" rules={[{ required: true }]} style={{ flex: 1 }}><Input /></Form.Item>
            <Form.Item name="company" label="公司" style={{ flex: 1 }}><Input /></Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="position" label="职位" style={{ flex: 1 }}><Input /></Form.Item>
            <Form.Item name="phone" label="电话" style={{ flex: 1 }}><Input /></Form.Item>
            <Form.Item name="email" label="邮箱" style={{ flex: 1 }}><Input /></Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Form.Item name="industry" label="行业" style={{ flex: 1 }}>
              <Select><Option value="科技">科技</Option><Option value="金融">金融</Option><Option value="教育">教育</Option><Option value="医疗">医疗</Option><Option value="制造">制造</Option></Select>
            </Form.Item>
            <Form.Item name="region" label="地区" style={{ flex: 1 }}><Input placeholder="如：北京朝阳区" /></Form.Item>
            <Form.Item name="status" label="状态" initialValue="new" style={{ flex: 1 }}>
              <Select>{Object.entries(statusTextMap).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}</Select>
            </Form.Item>
          </div>
          <Form.Item name="source" label="线索来源">
            <Select allowClear><Option value="官网">官网</Option><Option value="推荐">推荐</Option><Option value="展会">展会</Option><Option value="广告">广告投放</Option><Option value="其他">其他</Option></Select>
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签，回车确认" />
          </Form.Item>
          <Form.Item name="notes" label="备注"><TextArea rows={3} /></Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="线索详情" open={detailOpen} onClose={() => setDetailOpen(false)} width={480}>
        {current && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="姓名">{current.name}</Descriptions.Item>
            <Descriptions.Item label="公司">{current.company}</Descriptions.Item>
            <Descriptions.Item label="职位">{current.position}</Descriptions.Item>
            <Descriptions.Item label="电话">{current.phone}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{current.email}</Descriptions.Item>
            <Descriptions.Item label="行业">{current.industry}</Descriptions.Item>
            <Descriptions.Item label="地区">{current.region}</Descriptions.Item>
            <Descriptions.Item label="来源">{current.source}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={statusColorMap[current.status]}>{statusTextMap[current.status]}</Tag></Descriptions.Item>
            <Descriptions.Item label="标签"><Space wrap>{(current.tags || []).map((t: string) => <Tag key={t}>{t}</Tag>)}</Space></Descriptions.Item>
            <Descriptions.Item label="备注">{current.notes}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{dayjs(current.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </Card>
  );
}
