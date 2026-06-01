import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, Modal, Form, Input, Select, Tabs, Table, message } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [form] = Form.useForm();
  const [rejectForm] = Form.useForm();

  useEffect(() => {
    fetch(`/api/cases/${id}`)
      .then(res => res.json())
      .then(data => setCaseData(data));
  }, [id]);

  const handleConfirm = (values) => {
    fetch(`/api/cases/${id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          message.success('病例已确认');
          setConfirmModal(false);
          fetch(`/api/cases/${id}`)
            .then(res => res.json())
            .then(data => setCaseData(data));
        }
      });
  };

  const handleReject = (values) => {
    fetch(`/api/cases/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          message.success('病例已排除');
          setRejectModal(false);
          fetch(`/api/cases/${id}`)
            .then(res => res.json())
            .then(data => setCaseData(data));
        }
      });
  };

  const statusColors = {
    pending: 'orange',
    confirmed: 'green',
    rejected: 'red',
  };

  const statusText = {
    pending: '待确认',
    confirmed: '已确认',
    rejected: '已排除',
  };

  const tempColumns = [
    { title: '测量时间', dataIndex: 'record_time', key: 'record_time' },
    { title: '体温(℃)', dataIndex: 'temperature', key: 'temperature' },
  ];

  const labColumns = [
    { title: '检验项目', dataIndex: 'test_name', key: 'test_name' },
    { title: '标本类型', dataIndex: 'specimen_type', key: 'specimen_type' },
    { title: '病原体', dataIndex: 'pathogen', key: 'pathogen', render: t => t || '-' },
    { title: '结果', dataIndex: 'test_value', key: 'test_value' },
    { title: '日期', dataIndex: 'result_date', key: 'result_date' },
  ];

  const abxColumns = [
    { title: '药物名称', dataIndex: 'drug_name', key: 'drug_name' },
    { title: '剂量', dataIndex: 'dosage', key: 'dosage' },
    { title: '开始日期', dataIndex: 'start_date', key: 'start_date' },
    { title: '结束日期', dataIndex: 'end_date', key: 'end_date', render: d => d || '进行中' },
    { title: '用药原因', dataIndex: 'reason', key: 'reason' },
  ];

  const surgeryColumns = [
    { title: '手术名称', dataIndex: 'surgery_name', key: 'surgery_name' },
    { title: '手术日期', dataIndex: 'surgery_date', key: 'surgery_date' },
    { title: '切口类型', dataIndex: 'wound_class', key: 'wound_class' },
    { title: '时长(分钟)', dataIndex: 'duration_minutes', key: 'duration_minutes' },
  ];

  const diagColumns = [
    { title: '诊断名称', dataIndex: 'diagnosis_name', key: 'diagnosis_name' },
    { title: '诊断编码', dataIndex: 'diagnosis_code', key: 'diagnosis_code' },
    { title: '诊断日期', dataIndex: 'diagnosis_date', key: 'diagnosis_date' },
    { title: '感染相关', dataIndex: 'is_infection_related', key: 'is_infection_related', render: v => v ? '是' : '否' },
  ];

  if (!caseData) return <div>加载中...</div>;

  const tabItems = [
    {
      key: 'temp',
      label: '体温记录',
      children: <Table columns={tempColumns} dataSource={caseData.temperatures} rowKey="id" size="small" />,
    },
    {
      key: 'lab',
      label: '检验结果',
      children: <Table columns={labColumns} dataSource={caseData.labResults} rowKey="id" size="small" />,
    },
    {
      key: 'abx',
      label: '抗菌药物',
      children: <Table columns={abxColumns} dataSource={caseData.antibiotics} rowKey="id" size="small" />,
    },
    {
      key: 'surgery',
      label: '手术信息',
      children: <Table columns={surgeryColumns} dataSource={caseData.surgeries} rowKey="id" size="small" />,
    },
    {
      key: 'diag',
      label: '诊断信息',
      children: <Table columns={diagColumns} dataSource={caseData.diagnoses} rowKey="id" size="small" />,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cases')}>
          返回列表
        </Button>
        <Tag color={statusColors[caseData.status]}>{statusText[caseData.status]}</Tag>
      </Space>

      <Card title="病例详情" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="患者姓名">{caseData.patient_name}</Descriptions.Item>
          <Descriptions.Item label="病历号">{caseData.mrn}</Descriptions.Item>
          <Descriptions.Item label="性别">{caseData.gender}</Descriptions.Item>
          <Descriptions.Item label="年龄">{caseData.age}岁</Descriptions.Item>
          <Descriptions.Item label="科室">{caseData.department_name}</Descriptions.Item>
          <Descriptions.Item label="床位">{caseData.bed_no}</Descriptions.Item>
          <Descriptions.Item label="入院日期">{caseData.admission_date}</Descriptions.Item>
          <Descriptions.Item label="感染部位">{caseData.infection_site || '-'}</Descriptions.Item>
          <Descriptions.Item label="病原体">{caseData.pathogen || '-'}</Descriptions.Item>
          <Descriptions.Item label="确认人">{caseData.confirmed_by_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="确认日期">{caseData.confirm_date || '-'}</Descriptions.Item>
          <Descriptions.Item label="确认理由">{caseData.confirm_reason || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {caseData.status === 'pending' && (
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<CheckOutlined />} onClick={() => setConfirmModal(true)}>
            确认感染
          </Button>
          <Button danger icon={<CloseOutlined />} onClick={() => setRejectModal(true)}>
            排除感染
          </Button>
        </Space>
      )}

      <Card title="监测数据">
        <Tabs items={tabItems} />
      </Card>

      <Modal
        title="确认感染病例"
        open={confirmModal}
        onCancel={() => setConfirmModal(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleConfirm} layout="vertical">
          <Form.Item name="infection_site" label="感染部位" rules={[{ required: true }]}>
            <Select>
              <Option value="血流感染">血流感染</Option>
              <Option value="下呼吸道">下呼吸道</Option>
              <Option value="手术部位">手术部位</Option>
              <Option value="腹腔感染">腹腔感染</Option>
              <Option value="尿路感染">尿路感染</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="pathogen" label="病原体">
            <Input />
          </Form.Item>
          <Form.Item name="confirm_reason" label="确认理由" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认</Button>
              <Button onClick={() => setConfirmModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="排除感染病例"
        open={rejectModal}
        onCancel={() => setRejectModal(false)}
        footer={null}
      >
        <Form form={rejectForm} onFinish={handleReject} layout="vertical">
          <Form.Item name="confirm_reason" label="排除理由" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请说明排除理由" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认排除</Button>
              <Button onClick={() => setRejectModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
