import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Modal, Form, Input, Select, Space, message } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { api } from '../api.js';
import dayjs from 'dayjs';

export default function Streamers() {
  const [data, setData] = useState([]);
  const [unions, setUnions] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [cForm] = Form.useForm();
  const [eForm] = Form.useForm();

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [s, u] = await Promise.all([api.streamers(), api.unions()]);
    setData(s);
    setUnions(u);
  }

  async function handleCreate() {
    try {
      const vals = await cForm.validateFields();
      await api.createStreamer(vals);
      message.success('主播已创建');
      setCreateOpen(false);
      cForm.resetFields();
      loadAll();
    } catch (e) { message.error(e.message); }
  }

  async function handleEdit() {
    try {
      const vals = await eForm.validateFields();
      await api.updateStreamer(editRecord.id, vals);
      message.success('已更新');
      setEditOpen(false);
      loadAll();
    } catch (e) { message.error(e.message); }
  }

  function openEdit(r) {
    setEditRecord(r);
    eForm.setFieldsValue({ name: r.name, union_id: r.union_id, phone: r.phone, status: r.status });
    setEditOpen(true);
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '姓名', dataIndex: 'name' },
    { title: '账号', dataIndex: 'account' },
    { title: '所属工会', dataIndex: 'union_name', render: v => v || <Tag>无</Tag> },
    { title: '电话', dataIndex: 'phone', render: v => v || '-' },
    { title: '状态', dataIndex: 'status', render: v => <Tag color={v === 'active' ? 'green' : 'red'}>{v === 'active' ? '活跃' : '停用'}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', render: v => dayjs(v).format('MM-DD HH:mm') },
    { title: '操作', width: 80, render: (_, r) => <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button> },
  ];

  const formItem = (name, label, opts = {}) => (
    <Form.Item name={name} label={label} rules={[{ required: opts.required }]}>
      {opts.type === 'select' ? (
        <Select allowClear options={unions.map(u => ({ value: u.id, label: u.name }))} />
      ) : opts.type === 'status' ? (
        <Select options={[{ value: 'active', label: '活跃' }, { value: 'inactive', label: '停用' }]} />
      ) : (
        <Input />
      )}
    </Form.Item>
  );

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>新增主播</Button>
      </Space>
      <Table columns={columns} dataSource={data} rowKey="id" size="small" />

      <Modal title="新增主播" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={handleCreate}>
        <Form form={cForm} layout="vertical">
          {formItem('name', '姓名', { required: true })}
          {formItem('account', '账号', { required: true })}
          {formItem('union_id', '所属工会', { type: 'select' })}
          {formItem('phone', '电话')}
        </Form>
      </Modal>

      <Modal title="编辑主播" open={editOpen} onCancel={() => setEditOpen(false)} onOk={handleEdit}>
        <Form form={eForm} layout="vertical">
          {formItem('name', '姓名', { required: true })}
          {formItem('union_id', '所属工会', { type: 'select' })}
          {formItem('phone', '电话')}
          {formItem('status', '状态', { type: 'status' })}
        </Form>
      </Modal>
    </div>
  );
}
