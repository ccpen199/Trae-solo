import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Tag, Space, Modal, Form, Input, Select, InputNumber, Spin, message } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { departments as deptApi } from '../api';

const { Option } = Select;

export default function Departments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [form] = Form.useForm();
  const [allDepts, setAllDepts] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await deptApi.getDepartments();
      const d = res.data?.data || res.data || [];
      const list = Array.isArray(d) ? d : [];
      setData(list);
      setAllDepts(list);
    } catch {
      message.error('获取部门列表失败');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingDept(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingDept(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);
      if (editingDept) {
        await deptApi.createDepartment({ ...values, id: editingDept.id });
      } else {
        await deptApi.createDepartment(values);
      }
      message.success(editingDept ? '更新成功' : '创建成功');
      setModalOpen(false);
      form.resetFields();
      setEditingDept(null);
      fetchData();
    } catch (err) {
      if (err.response) {
        message.error(err.response?.data?.message || '操作失败');
      }
    } finally {
      setModalLoading(false);
    }
  };

  const columns = [
    { title: '部门编码', dataIndex: 'code', key: 'code', width: 120 },
    { title: '部门名称', dataIndex: 'name', key: 'name' },
    { title: '上级部门', dataIndex: 'parent_name', key: 'parent_name', width: 140, render: (v) => v || '-' },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (v) => {
        const map = { province: '省级', city: '市级', county: '县级' };
        return map[v] || v || '-';
      },
    },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 140 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (v) => (v === 'active' ? <Tag color="green">正常</Tag> : <Tag color="red">停用</Tag>),
    },
    { title: '事项数', dataIndex: 'item_count', key: 'item_count', width: 80 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} size="small" onClick={() => openEdit(record)}>
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="部门管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            添加部门
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      <Modal
        title={editingDept ? '编辑部门' : '添加部门'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditingDept(null); }}
        confirmLoading={modalLoading}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="部门编码" rules={[{ required: true, message: '请输入部门编码' }]}>
            <Input placeholder="请输入部门编码" />
          </Form.Item>
          <Form.Item name="name" label="部门名称" rules={[{ required: true, message: '请输入部门名称' }]}>
            <Input placeholder="请输入部门名称" />
          </Form.Item>
          <Form.Item name="parent_id" label="上级部门">
            <Select placeholder="请选择上级部门" allowClear>
              {allDepts
                .filter((d) => d.id !== editingDept?.id)
                .map((d) => (
                  <Option key={d.id} value={d.id}>{d.name}</Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item name="level" label="级别">
            <Select placeholder="请选择级别">
              <Option value="province">省级</Option>
              <Option value="city">市级</Option>
              <Option value="county">县级</Option>
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Option value="active">正常</Option>
              <Option value="inactive">停用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
