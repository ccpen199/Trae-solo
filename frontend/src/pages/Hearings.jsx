import React, { useEffect, useState } from 'react';
import { Button, Table, Modal, Form, Input, Select, DatePicker, message, Card, Tag } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { hearingApi, caseApi } from '../api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const HEARING_TYPES = [
  { value: 'hearing', label: '开庭审理' },
  { value: 'mediation', label: '调解' }
];

const RESULT_MAP = {
  pending: { label: '未开庭', color: 'default' },
  success: { label: '胜诉', color: 'green' },
  partial: { label: '部分支持', color: 'blue' },
  failed: { label: '败诉', color: 'red' },
  mediation: { label: '调解成功', color: 'orange' }
};

function Hearings() {
  const [hearings, setHearings] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHearing, setEditingHearing] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadHearings();
    loadCases();
  }, []);

  const loadHearings = async () => {
    setLoading(true);
    try {
      const res = await hearingApi.list();
      setHearings(res.data);
    } catch (error) {
      message.error('加载庭审失败');
    }
    setLoading(false);
  };

  const loadCases = async () => {
    try {
      const res = await caseApi.list();
      setCases(res.data);
    } catch (error) {
      console.error('加载案件列表失败:', error);
    }
  };

  const handleEdit = (record) => {
    setEditingHearing(record);
    form.setFieldsValue({
      ...record,
      scheduled_date: record.scheduled_date ? dayjs(record.scheduled_date) : null
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        scheduled_date: values.scheduled_date ? values.scheduled_date.format('YYYY-MM-DD') : null
      };

      if (editingHearing) {
        await hearingApi.update(editingHearing.id, data);
        message.success('更新成功');
      } else {
        await hearingApi.create(data);
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingHearing(null);
      loadHearings();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const renderType = (_, r) => {
    const type = HEARING_TYPES.find(t => t.value === r.type);
    return type ? type.label : '';
  };

  const renderResult = (_, r) => {
    const result = RESULT_MAP[r.ruling_result];
    return result ? <Tag color={result.color}>{result.label}</Tag> : null;
  };

  const renderCaseNumber = (_, r) => {
    const caseItem = cases.find(c => c.id === r.case_id);
    return caseItem ? caseItem.case_number : '';
  };

  const renderClientName = (_, r) => {
    const caseItem = cases.find(c => c.id === r.case_id);
    return caseItem ? caseItem.client_name : '';
  };

  const columns = [
    { title: '案件编号', key: 'case_number', width: 160, render: renderCaseNumber },
    { title: '当事人', key: 'client_name', width: 120, render: renderClientName },
    { title: '类型', key: 'type', width: 120, render: renderType },
    { title: '开庭日期', dataIndex: 'scheduled_date', key: 'scheduled_date', width: 120 },
    { title: '地点', dataIndex: 'location', key: 'location', width: 150 },
    { title: '出庭人员', dataIndex: 'attendees', key: 'attendees', width: 150 },
    { title: '裁决结果', key: 'ruling_result', width: 120, render: renderResult },
    { title: '执行任务', dataIndex: 'execution_tasks', key: 'execution_tasks' },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, r) => (
        <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(r)}>编辑</Button>
      )
    }
  ];

  return (
    <Card
      title="庭审调解"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingHearing(null); form.resetFields(); setModalVisible(true); }}>
          排期
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={hearings}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1300 }}
      />

      <Modal
        title={editingHearing ? '编辑庭审' : '新增排期'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!editingHearing && (
            <Form.Item name="case_id" label="所属案件" rules={[{ required: true }]}>
              <Select>
                {cases.map(c => <Option key={c.id} value={c.id}>{c.case_number} - {c.client_name}</Option>)}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select>
              {HEARING_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="scheduled_date" label="开庭日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="地点">
            <Input />
          </Form.Item>
          <Form.Item name="attendees" label="出庭人员">
            <Input placeholder="多个人员用逗号分隔" />
          </Form.Item>
          <Form.Item name="mediation_plan" label="调解方案">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="ruling_result" label="裁决结果">
            <Select>
              <Option value="pending">未开庭</Option>
              <Option value="success">胜诉</Option>
              <Option value="partial">部分支持</Option>
              <Option value="failed">败诉</Option>
              <Option value="mediation">调解成功</Option>
            </Select>
          </Form.Item>
          <Form.Item name="ruling_date" label="裁决日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="execution_tasks" label="后续执行任务">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

export default Hearings;
