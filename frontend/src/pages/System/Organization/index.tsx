import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tree, Popconfirm, Card } from 'antd';
import { message } from '@/utils/message';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { organizationApi } from '@/services/api';
import { OrganizationType } from '@/utils/enums';

const { TextArea } = Input;
const { Option } = Select;

const Organization: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await organizationApi.getList();
      const treeRes: any = await organizationApi.getTree();
      setList(Array.isArray(res) ? res : (res.data || []));
      setTreeData(Array.isArray(treeRes) ? treeRes : (treeRes.data || []));
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
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await organizationApi.delete(id);
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
        await organizationApi.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await organizationApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const columns = [
    { title: '组织编码', dataIndex: 'code', key: 'code' },
    { title: '组织名称', dataIndex: 'name', key: 'name' },
    {
      title: '机构性质',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => OrganizationType[type as keyof typeof OrganizationType] || type,
    },
    { title: '联系电话', dataIndex: 'phone', key: 'phone' },
    { title: '地址', dataIndex: 'address', key: 'address' },
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder' },
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

  const buildTreeData = (data: any[]): any[] => {
    return data.map((item) => ({
      key: item.id,
      title: `${item.name} (${item.code})`,
      children: item.children?.length > 0 ? buildTreeData(item.children) : undefined,
    }));
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>组织管理</h2>
      </div>

      <Card>
        <div className="table-toolbar">
          <span>组织列表</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增组织
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

      {treeData.length > 0 && (
        <Card title="组织树" style={{ marginTop: 24 }}>
          <div className="tree-container">
            <Tree treeData={buildTreeData(treeData)} defaultExpandAll />
          </div>
        </Card>
      )}

      <Modal
        title={editingItem ? '编辑组织' : '新增组织'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="组织编码"
            rules={[{ required: true, message: '请输入组织编码' }]}
          >
            <Input placeholder="请输入组织编码" />
          </Form.Item>
          <Form.Item
            name="name"
            label="组织名称"
            rules={[{ required: true, message: '请输入组织名称' }]}
          >
            <Input placeholder="请输入组织名称" />
          </Form.Item>
          <Form.Item name="type" label="机构性质">
            <Select placeholder="请选择机构性质">
              <Option value="headquarters">总部</Option>
              <Option value="branch">分公司</Option>
              <Option value="department">部门</Option>
              <Option value="team">小组</Option>
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <Input type="number" placeholder="请输入排序号" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
          <Form.Item name="enabled" label="状态" initialValue={true} valuePropName="checked">
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

export default Organization;
