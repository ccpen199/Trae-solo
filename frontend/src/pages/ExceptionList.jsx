import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Space, Descriptions, message } from 'antd';
import { api } from '../api';
import dayjs from 'dayjs';

const { TextArea } = Input;

const typeMap = {
  no_contact: { color: 'orange', text: '无法联系' },
  wrong_address: { color: 'red', text: '地址错误' },
  out_of_stock: { color: 'purple', text: '备件缺货' },
  user_refuse: { color: 'volcano', text: '用户拒付' },
  second_visit: { color: 'blue', text: '二次上门' },
  other: { color: 'default', text: '其他' },
};

const statusMap = {
  open: { color: 'red', text: '未处理' },
  resolved: { color: 'green', text: '已处理' },
};

export default function ExceptionList() {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [handleModal, setHandleModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [createForm] = Form.useForm();
  const [handleForm] = Form.useForm();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadExceptions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      const data = await api.exceptions.list(params);
      setExceptions(data);
    } catch (err) { message.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadExceptions(); }, [filterStatus, filterType]);

  const handleException = async () => {
    try {
      const values = await handleForm.validateFields();
      await api.exceptions.handle(selected.id, values);
      message.success('异常处理成功');
      setHandleModal(false);
      handleForm.resetFields();
      loadExceptions();
    } catch (err) { message.error(err.message); }
  };

  const columns = [
    { title: '工单号', dataIndex: 'order_no', key: 'order_no' },
    { title: '工程师', dataIndex: 'engineer_name', key: 'engineer_name' },
    { title: '异常类型', dataIndex: 'type', key: 'type', render: v => <Tag color={typeMap[v]?.color}>{typeMap[v]?.text}</Tag> },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '状态', dataIndex: 'status', key: 'status', render: v => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text}</Tag> },
    { title: '处理结果', dataIndex: 'handling_result', key: 'handling_result', ellipsis: true, render: v => v || '-' },
    { title: '上报时间', dataIndex: 'created_at', key: 'created_at', render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '操作', key: 'action', render: (_, r) => (
      r.status === 'open' && ['dispatcher', 'service_agent'].includes(user.role) ? (
        <Button type="primary" size="small" onClick={() => { setSelected(r); setHandleModal(true); }}>处理</Button>
      ) : null
    )},
  ];

  return (
    <div>
      <Card title="异常记录" extra={
        <Space>
          <Select placeholder="状态" allowClear style={{ width: 120 }} onChange={setFilterStatus} value={filterStatus || undefined}>
            <Select.Option value="open">未处理</Select.Option>
            <Select.Option value="resolved">已处理</Select.Option>
          </Select>
          <Select placeholder="类型" allowClear style={{ width: 120 }} onChange={setFilterType} value={filterType || undefined}>
            <Select.Option value="no_contact">无法联系</Select.Option>
            <Select.Option value="wrong_address">地址错误</Select.Option>
            <Select.Option value="out_of_stock">备件缺货</Select.Option>
            <Select.Option value="user_refuse">用户拒付</Select.Option>
            <Select.Option value="second_visit">二次上门</Select.Option>
            <Select.Option value="other">其他</Select.Option>
          </Select>
          <Button onClick={loadExceptions}>刷新</Button>
        </Space>
      }>
        <Table columns={columns} dataSource={exceptions} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="处理异常" open={handleModal} onCancel={() => setHandleModal(false)} onOk={handleException}>
        {selected && (
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="工单号">{selected.order_no}</Descriptions.Item>
            <Descriptions.Item label="异常类型"><Tag color={typeMap[selected.type]?.color}>{typeMap[selected.type]?.text}</Tag></Descriptions.Item>
            <Descriptions.Item label="描述">{selected.description || '-'}</Descriptions.Item>
          </Descriptions>
        )}
        <Form form={handleForm} layout="vertical">
          <Form.Item name="handling_result" label="处理结果" rules={[{ required: true, message: '请输入处理结果' }]}>
            <TextArea rows={3} placeholder="请描述处理结果" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
