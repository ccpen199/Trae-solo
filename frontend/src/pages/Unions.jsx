import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Modal, Form, Input, Select, Space, message } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { api } from '../api.js';
import dayjs from 'dayjs';

export default function Unions() {
  const [data, setData] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [cForm] = Form.useForm();
  const [eForm] = Form.useForm();

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setData(await api.unions());
  }

  async function handleCreate() {
    try {
      const vals = await cForm.validateFields();
      await api.createUnion(vals);
      message.success('工会已创建');
      setCreateOpen(false);
      cForm.resetFields();
      loadAll();
    } catch (e) { message.error(e.message); }
  }

  async function handleEdit() {
    try {
      const vals = await eForm.validateFields();
      await api.updateUnion(editRecord.id, vals);
      message.success('已更新');
      setEditOpen(false);
      loadAll();
    } catch (e) { message.error(e.message); }
  }

  function openEdit(r) {
    setEditRecord(r);
    eForm.setFieldsValue({ name: r.name, contact: r.contact, phone: r.phone, status: r.status });
    setEditOpen(true);
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '工会名称', dataIndex: 'name' },
    { title: '联系人', dataIndex: 'contact', render: v => v || '-' },
    { title: '电话', dataIndex: 'phone', render: v => v || '-' },
    { title: '状态', dataIndex: 'status', render: v => <Tag color={v === 'active' ? 'green' : 'red'}>{v === 'active' ? '活跃' : '停用'}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', render: v => dayjs(v).format('MM-DD HH:mm') },
    { title: '操作', width: 80, render: (_, r) => <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button> },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新增工会</Button>
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" size="small" />

      <Modal title="新增工会" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={handleCreate}>
        <Form form={cForm} layout="vertical">
          <Form.Item name="name" label="工会名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="contact" label="联系人"><Input /></Form.Item>
          <Form.Item name="phone" label="电话"><Input /></Form.Item>
        </Form>
      </Modal>

      <Modal title="编辑工会" open={editOpen} onCancel={() => setEditOpen(false)} onOk={handleEdit}>
        <Form form={eForm} layout="vertical">
          <Form.Item name="name" label="工会名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="contact" label="联系人"><Input /></Form.Item>
          <Form.Item name="phone" label="电话"><Input /></Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[{ value: 'active', label: '活跃' }, { value: 'inactive', label: '停用' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
