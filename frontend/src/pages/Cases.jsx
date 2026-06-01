import React, { useState, useEffect } from 'react';
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Tag,
  Space,
  message,
  Drawer,
  Descriptions,
  Timeline,
  Divider,
} from 'antd';
import { PlusOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { casesApi, judgesApi, clerksApi } from '../api';

const { TextArea } = Input;
const { Option } = Select;

const Cases = () => {
  const [cases, setCases] = useState([]);
  const [judges, setJudges] = useState([]);
  const [clerks, setClerks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCases();
    loadJudges();
    loadClerks();
  }, []);

  const loadCases = async () => {
    try {
      const res = await casesApi.getAll();
      setCases(res.data);
    } catch (error) {
      message.error('加载案件失败');
    }
  };

  const loadJudges = async () => {
    try {
      const res = await judgesApi.getAll();
      setJudges(res.data);
    } catch (error) {
      message.error('加载法官失败');
    }
  };

  const loadClerks = async () => {
    try {
      const res = await clerksApi.getAll();
      setClerks(res.data);
    } catch (error) {
      message.error('加载书记员失败');
    }
  };

  const handleCreateCase = async (values) => {
    try {
      await casesApi.create({
        ...values,
        materials: [{ name: '起诉状', is_submitted: true }],
      });
      message.success('案件创建成功');
      setIsModalOpen(false);
      form.resetFields();
      loadCases();
    } catch (error) {
      message.error('案件创建失败');
    }
  };

  const handleViewCase = async (caseId) => {
    try {
      const res = await casesApi.getById(caseId);
      setSelectedCase(res.data);
      setIsDrawerOpen(true);
    } catch (error) {
      message.error('加载案件详情失败');
    }
  };

  const handleCheckMaterials = async (caseId) => {
    try {
      const res = await casesApi.checkMaterials(caseId);
      if (res.data.materials_complete) {
        message.success('材料审核通过，已进入排期队列');
      } else {
        message.warning('材料不完整，请补充材料');
      }
      loadCases();
      if (selectedCase && selectedCase.id === caseId) {
        const updatedCase = await casesApi.getById(caseId);
        setSelectedCase(updatedCase.data);
      }
    } catch (error) {
      message.error('材料检查失败');
    }
  };

  const columns = [
    { title: '案号', dataIndex: 'case_number', key: 'case_number' },
    {
      title: '案件类型',
      dataIndex: 'case_type',
      key: 'case_type',
      render: (type) => {
        const typeMap = {
          civil: '民事',
          criminal: '刑事',
          administrative: '行政',
          commercial: '商事',
          family: '家事',
        };
        return typeMap[type] || type;
      },
    },
    { title: '案由', dataIndex: 'case_reason', key: 'case_reason' },
    { title: '承办法官', dataIndex: 'judge_name', key: 'judge_name' },
    { title: '当事人', dataIndex: 'parties', key: 'parties' },
    {
      title: '预计时长',
      dataIndex: 'estimated_duration',
      key: 'estimated_duration',
      render: (val) => `${val}分钟`,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (p) => {
        const priorityMap = { 1: '高', 2: '中', 3: '低' };
        return priorityMap[p] || p;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          draft: { color: 'default', text: '草稿' },
          pending_scheduling: { color: 'orange', text: '待排期' },
          scheduled: { color: 'green', text: '已排期' },
          hearing: { color: 'blue', text: '审理中' },
          closed: { color: 'gray', text: '已结案' },
          postponed: { color: 'red', text: '已改期' },
        };
        const s = statusMap[status] || { color: 'default', text: status };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '材料完整',
      dataIndex: 'materials_complete',
      key: 'materials_complete',
      render: (val) => (val ? <Tag color="green">是</Tag> : <Tag color="red">否</Tag>),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewCase(record.id)}>
            查看
          </Button>
          {!record.materials_complete && (
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => handleCheckMaterials(record.id)}
            >
              材料审核
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>案件管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          新建案件
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={cases.map((c) => ({ ...c, key: c.id }))}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新建案件"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateCase}>
          <Form.Item name="case_number" label="案号" rules={[{ required: true }]}>
            <Input placeholder="请输入案号" />
          </Form.Item>
          <Form.Item name="case_type" label="案件类型" rules={[{ required: true }]}>
            <Select placeholder="请选择案件类型">
              <Option value="civil">民事</Option>
              <Option value="criminal">刑事</Option>
              <Option value="administrative">行政</Option>
              <Option value="commercial">商事</Option>
              <Option value="family">家事</Option>
            </Select>
          </Form.Item>
          <Form.Item name="case_reason" label="案由" rules={[{ required: true }]}>
            <Input placeholder="请输入案由" />
          </Form.Item>
          <Form.Item name="judge_id" label="承办法官">
            <Select placeholder="请选择法官" showSearch>
              {judges.map((j) => (
                <Option key={j.id} value={j.id}>{j.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="clerk_id" label="书记员">
            <Select placeholder="请选择书记员" showSearch>
              {clerks.map((c) => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="parties" label="当事人" rules={[{ required: true }]}>
            <TextArea placeholder="请输入当事人，多个用逗号分隔" rows={2} />
          </Form.Item>
          <Form.Item name="agents" label="代理人">
            <TextArea placeholder="请输入代理人，多个用逗号分隔" rows={2} />
          </Form.Item>
          <Form.Item name="estimated_duration" label="预计时长(分钟)" rules={[{ required: true }]}>
            <InputNumber min={15} max={480} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="priority" label="优先级" rules={[{ required: true }]} initialValue={2}>
            <Select>
              <Option value={1}>高</Option>
              <Option value={2}>中</Option>
              <Option value={3}>低</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="draft">
            <Select>
              <Option value="draft">草稿</Option>
              <Option value="pending_scheduling">待排期</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="案件详情"
        width={600}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      >
        {selectedCase && (
          <>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="案号">{selectedCase.case_number}</Descriptions.Item>
              <Descriptions.Item label="案件类型">
                {{ civil: '民事', criminal: '刑事', administrative: '行政', commercial: '商事', family: '家事' }[selectedCase.case_type] || selectedCase.case_type}
              </Descriptions.Item>
              <Descriptions.Item label="案由">{selectedCase.case_reason}</Descriptions.Item>
              <Descriptions.Item label="承办法官">{selectedCase.judge_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="书记员">{selectedCase.clerk_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="当事人">{selectedCase.parties}</Descriptions.Item>
              <Descriptions.Item label="代理人">{selectedCase.agents || '-'}</Descriptions.Item>
              <Descriptions.Item label="预计时长">{selectedCase.estimated_duration}分钟</Descriptions.Item>
              <Descriptions.Item label="优先级">
                {{ 1: '高', 2: '中', 3: '低' }[selectedCase.priority]}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedCase.materials_complete ? 'green' : 'red'}>
                  {selectedCase.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="材料完整">
                <Tag color={selectedCase.materials_complete ? 'green' : 'red'}>
                  {selectedCase.materials_complete ? '是' : '否'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {selectedCase.materials && selectedCase.materials.length > 0 && (
              <>
                <Divider>材料清单</Divider>
                <Table
                  columns={[
                    { title: '材料名称', dataIndex: 'material_name', key: 'material_name' },
                    {
                      title: '是否提交',
                      dataIndex: 'is_submitted',
                      key: 'is_submitted',
                      render: (val) => (val ? <Tag color="green">已提交</Tag> : <Tag color="red">未提交</Tag>),
                    },
                    { title: '提交时间', dataIndex: 'submitted_at', key: 'submitted_at' },
                  ]}
                  dataSource={selectedCase.materials.map((m, i) => ({ ...m, key: i }))}
                  pagination={false}
                  size="small"
                />
              </>
            )}

            <Divider>案件时间线</Divider>
            <Timeline
              items={(selectedCase.timeline || []).map((item, index) => ({
                key: index,
                children: (
                  <div>
                    <div>{item.event_content}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{item.created_at}</div>
                  </div>
                ),
              }))}
            />
          </>
        )}
      </Drawer>
    </div>
  );
};

export default Cases;
