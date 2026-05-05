import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Switch, Popconfirm, Card } from 'antd';
import { message } from '@/utils/message';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { storeApi, organizationApi } from '@/services/api';

const { Option } = Select;

const Store: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [storeRes, orgRes] = await Promise.all([
        storeApi.getList(),
        organizationApi.getList(),
      ]);
      setList(Array.isArray(storeRes) ? storeRes : (storeRes.data || []));
      setOrganizations(Array.isArray(orgRes) ? orgRes : (orgRes.data || []));
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      isFillingStation: false,
      isBarcodeStore: false,
      isGasStation: true,
      isMaintenanceDepartment: false,
      enabled: true,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await storeApi.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await storeApi.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await storeApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const columns = [
    { title: '门店编码', dataIndex: 'code', key: 'code' },
    { title: '门店名称', dataIndex: 'name', key: 'name' },
    {
      title: '门店性质',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          gas_station: '气站',
          service_center: '服务中心',
          retail_store: '零售门店',
          warehouse: '仓库',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '所属组织',
      dataIndex: ['organization', 'name'],
      key: 'organizationName',
    },
    { title: '联系电话', dataIndex: 'phone', key: 'phone' },
    {
      title: '是否气站',
      dataIndex: 'isGasStation',
      key: 'isGasStation',
      render: (v: boolean) => (v ? '是' : '否'),
    },
    {
      title: '是否零灌站',
      dataIndex: 'isFillingStation',
      key: 'isFillingStation',
      render: (v: boolean) => (v ? '是' : '否'),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (enabled ? '启用' : '禁用'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>门店管理</h2>
      </div>

      <Card>
        <div className="table-toolbar">
          <span>门店列表</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增门店
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={list}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑门店' : '新增门店'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="门店编码"
            rules={[{ required: true, message: '请输入门店编码' }]}
          >
            <Input placeholder="请输入门店编码" />
          </Form.Item>
          <Form.Item
            name="name"
            label="门店名称"
            rules={[{ required: true, message: '请输入门店名称' }]}
          >
            <Input placeholder="请输入门店名称" />
          </Form.Item>
          <Form.Item name="type" label="门店性质">
            <Select placeholder="请选择门店性质">
              <Option value="gas_station">气站</Option>
              <Option value="service_center">服务中心</Option>
              <Option value="retail_store">零售门店</Option>
              <Option value="warehouse">仓库</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="organizationId"
            label="所属组织"
            rules={[{ required: true, message: '请选择所属组织' }]}
          >
            <Select placeholder="请选择所属组织">
              {organizations.map((org) => (
                <Option key={org.id} value={org.id}>
                  {org.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Form.Item label="门店属性">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Form.Item
                name="isGasStation"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
                <span style={{ marginLeft: 8 }}>是否气站</span>
              </Form.Item>
              <Form.Item
                name="isFillingStation"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
                <span style={{ marginLeft: 8 }}>是否零灌站</span>
              </Form.Item>
              <Form.Item
                name="isBarcodeStore"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
                <span style={{ marginLeft: 8 }}>是否条码门店</span>
              </Form.Item>
              <Form.Item
                name="isMaintenanceDepartment"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
                <span style={{ marginLeft: 8 }}>是否维修部门</span>
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <Input type="number" placeholder="请输入排序号" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
          <Form.Item name="enabled" label="状态">
            <Select>
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Store;
