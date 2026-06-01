import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Modal, Form, Select, InputNumber, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { apiCallsAPI, catalogsAPI, departmentsAPI, applicationsAPI } from '../api';

const { Option } = Select;

const ApiCallList: React.FC = () => {
  const [apiCalls, setApiCalls] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [callsRes, catRes, deptRes, appRes] = await Promise.all([
        apiCallsAPI.getAll({ page: 1, pageSize: 20 }),
        catalogsAPI.getAll(),
        departmentsAPI.getAll(),
        applicationsAPI.getAll()
      ]);
      setApiCalls((callsRes.data as any).data);
      setTotal((callsRes.data as any).total);
      setCatalogs(catRes.data);
      setDepartments(deptRes.data);
      setApplications((appRes.data as any[]).filter(a => a.status === 'approved'));
    } catch (error) {
      message.error('加载数据失败');
    }
    setLoading(false);
  };

  const handleCreate = async (values: any) => {
    try {
      await apiCallsAPI.create({
        catalog_id: values.catalog_id,
        caller_department_id: values.caller_department_id,
        application_id: values.application_id || null,
        data_count: values.data_count || 0,
        status: values.status,
        error_message: values.status === 'failed' ? '模拟调用失败' : null
      });
      message.success('调用记录已保存');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '数据目录', dataIndex: 'catalog_title', key: 'catalog_title' },
    { title: '调用部门', dataIndex: 'caller_department_name', key: 'caller_department_name' },
    { title: '数据量', dataIndex: 'data_count', key: 'data_count' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>
          {status === 'success' ? '成功' : '失败'}
        </Tag>
      )
    },
    { title: '错误信息', dataIndex: 'error_message', key: 'error_message', render: (v: string) => v || '-' },
    {
      title: '告警',
      dataIndex: 'is_alert',
      key: 'is_alert',
      render: (alert: number) => alert ? <Tag color="red">是</Tag> : <Tag>否</Tag>
    },
    { title: '调用时间', dataIndex: 'call_time', key: 'call_time' }
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>接口交换日志</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          模拟调用
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={apiCalls}
        rowKey="id"
        loading={loading}
        pagination={{ total, pageSize: 20 }}
      />

      <Modal
        title="模拟接口调用"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="catalog_id" label="数据目录" rules={[{ required: true }]}>
            <Select placeholder="请选择数据目录">
              {catalogs.map(c => (
                <Option key={c.id} value={c.id}>{c.title}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="caller_department_id" label="调用部门" rules={[{ required: true }]}>
            <Select placeholder="请选择部门">
              {departments.map(d => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="application_id" label="关联授权申请">
            <Select placeholder="可选，选择已通过的申请">
              <Option value={null}>无（测试越权调用）</Option>
              {applications.map(a => (
                <Option key={a.id} value={a.id}>{a.catalog_title} - {a.applicant_department_name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="data_count" label="返回数据量">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="调用结果" rules={[{ required: true }]}>
            <Select>
              <Option value="success">成功</Option>
              <Option value="failed">失败</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>提交</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ApiCallList;
