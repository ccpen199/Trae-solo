import React, { useEffect, useState } from 'react';
import { Table, Tag, Select, Space, Card, Button, Modal, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

export default function CasesList() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [filteredCases, setFilteredCases] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [createModal, setCreateModal] = useState(false);
  const [form] = Form.useForm();

  const loadCases = () => {
    fetch('/api/cases')
      .then(res => res.json())
      .then(data => {
        setCases(data);
        setFilteredCases(data);
      });
  };

  useEffect(() => {
    loadCases();

    fetch('/api/patients/departments')
      .then(res => res.json())
      .then(data => setDepartments(data));

    fetch('/api/patients')
      .then(res => res.json())
      .then(data => setPatients(data));
  }, []);

  const handleCreate = (values) => {
    fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          message.success('病例创建成功');
          setCreateModal(false);
          form.resetFields();
          loadCases();
        }
      });
  };

  useEffect(() => {
    let filtered = cases;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    if (deptFilter !== 'all') {
      filtered = filtered.filter(c => c.department_id === parseInt(deptFilter));
    }
    setFilteredCases(filtered);
  }, [statusFilter, deptFilter, cases]);

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

  const columns = [
    {
      title: '患者姓名',
      dataIndex: 'patient_name',
      key: 'patient_name',
    },
    {
      title: '病历号',
      dataIndex: 'mrn',
      key: 'mrn',
    },
    {
      title: '科室',
      dataIndex: 'department_name',
      key: 'department_name',
    },
    {
      title: '床位',
      dataIndex: 'bed_no',
      key: 'bed_no',
    },
    {
      title: '感染部位',
      dataIndex: 'infection_site',
      key: 'infection_site',
      render: (text) => text || '-',
    },
    {
      title: '病原体',
      dataIndex: 'pathogen',
      key: 'pathogen',
      render: (text) => text || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status]}>{statusText[status]}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>感染病例管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
          新增病例
        </Button>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <span>状态筛选：</span>
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}>
            <Option value="all">全部</Option>
            <Option value="pending">待确认</Option>
            <Option value="confirmed">已确认</Option>
            <Option value="rejected">已排除</Option>
          </Select>
          <span>科室筛选：</span>
          <Select value={deptFilter} onChange={setDeptFilter} style={{ width: 150 }}>
            <Option value="all">全部科室</Option>
            {departments.map(d => (
              <Option key={d.id} value={d.id}>{d.name}</Option>
            ))}
          </Select>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={filteredCases}
        rowKey="id"
        onRow={(record) => ({
          onClick: () => navigate(`/cases/${record.id}`),
          style: { cursor: 'pointer' },
        })}
      />

      <Modal
        title="新增感染病例"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        footer={null}
        width={500}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="patient_id" label="选择患者" rules={[{ required: true, message: '请选择患者' }]}>
            <Select placeholder="请选择患者" showSearch optionFilterProp="children">
              {patients.map(p => (
                <Option key={p.id} value={p.id}>
                  {p.name} ({p.mrn}) - {p.department_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="department_id" label="科室" rules={[{ required: true, message: '请选择科室' }]}>
            <Select placeholder="请选择科室">
              {departments.map(d => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="infection_site" label="感染部位">
            <Select placeholder="请选择感染部位">
              <Option value="血流感染">血流感染</Option>
              <Option value="下呼吸道">下呼吸道</Option>
              <Option value="手术部位">手术部位</Option>
              <Option value="腹腔感染">腹腔感染</Option>
              <Option value="尿路感染">尿路感染</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="pathogen" label="病原体">
            <Input placeholder="请输入病原体（可选）" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">创建</Button>
              <Button onClick={() => setCreateModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
