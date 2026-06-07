import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space } from 'antd';
import { adminAPI } from '../../services/api';

function ServiceManage() {
  const [data, setData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await adminAPI.getServices();
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editItem) {
        await adminAPI.updateService(editItem.item_code, values);
        message.success('更新成功');
      } else {
        await adminAPI.createService(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失败');
    }
  };

  const openEdit = (record) => {
    setEditItem(record);
    form.setFieldsValue({
      itemCode: record.item_code,
      name: record.name,
      department: record.department,
      category: record.category,
      description: record.description,
      requiredMaterials: record.required_materials,
      handlingTime: record.handling_time,
      status: record.status
    });
    setModalVisible(true);
  };

  const openCreate = () => {
    setEditItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const columns = [
    { title: '事项编码', dataIndex: 'item_code', key: 'code' },
    { title: '事项名称', dataIndex: 'name', key: 'name' },
    { title: '所属部门', dataIndex: 'department', key: 'dept' },
    { title: '类别', dataIndex: 'category', key: 'category' },
    { title: '办理时长', dataIndex: 'handling_time', key: 'time' },
    { title: '版本', dataIndex: 'version', key: 'version' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <span style={{ color: status === 'active' ? '#52c41a' : '#ff4d4f' }}>
          {status === 'active' ? '启用' : '停用'}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" onClick={() => openEdit(record)}>编辑</Button>
      )
    }
  ];

  return (
    <div>
      <Card 
        title="服务事项管理"
        extra={<Button type="primary" onClick={openCreate}>新增事项</Button>}
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
        />
      </Card>

      <Modal
        title={editItem ? '编辑服务事项' : '新增服务事项'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="itemCode" label="事项编码" rules={[{ required: true }]}>
            <Input disabled={!!editItem} />
          </Form.Item>
          <Form.Item name="name" label="事项名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="department" label="所属部门" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="市场监管局">市场监管局</Select.Option>
              <Select.Option value="税务局">税务局</Select.Option>
              <Select.Option value="人社厅">人社厅</Select.Option>
              <Select.Option value="公安厅">公安厅</Select.Option>
              <Select.Option value="自然资源厅">自然资源厅</Select.Option>
              <Select.Option value="住房公积金管理中心">住房公积金管理中心</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="category" label="服务类别" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="企业登记">企业登记</Select.Option>
              <Select.Option value="税务服务">税务服务</Select.Option>
              <Select.Option value="社会保障">社会保障</Select.Option>
              <Select.Option value="住房公积金">住房公积金</Select.Option>
              <Select.Option value="不动产登记">不动产登记</Select.Option>
              <Select.Option value="印章管理">印章管理</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="事项描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="requiredMaterials" label="所需材料">
            <Input.TextArea rows={2} placeholder="多个材料用顿号分隔" />
          </Form.Item>
          <Form.Item name="handlingTime" label="办理时长">
            <Input placeholder="如：3个工作日" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Select.Option value="active">启用</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editItem ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ServiceManage;
