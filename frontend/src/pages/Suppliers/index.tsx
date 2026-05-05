import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Card,
  message,
  Space,
  Popconfirm,
  Tag,
  Select,
  Switch,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { get, post, put, del } from '../../utils/request';

interface Supplier {
  id: string;
  code: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNo?: string;
  bankAccount?: string;
  bankName?: string;
  creditLimit: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export default function SuppliersPage() {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchActive, setSearchActive] = useState<boolean>();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [editingRecord, setEditingRecord] = useState<Supplier | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSuppliers();
  }, [page, pageSize]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      if (searchKeyword) params.append('keyword', searchKeyword);
      if (searchActive !== undefined) params.append('isActive', searchActive.toString());

      const data = await get<{ list: Supplier[]; total: number }>(`/suppliers?${params.toString()}`);
      setSuppliers(data.list || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchSuppliers();
  };

  const handleReset = () => {
    setSearchKeyword('');
    setSearchActive(undefined);
    setPage(1);
    setTimeout(fetchSuppliers, 0);
  };

  const handleAdd = () => {
    setModalTitle('新增供应商');
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, creditLimit: 0 });
    setModalVisible(true);
  };

  const handleEdit = (record: Supplier) => {
    setModalTitle('编辑供应商');
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await del(`/suppliers/${id}`);
      message.success('删除成功');
      fetchSuppliers();
    } catch (error) {
      console.error('Failed to delete supplier:', error);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingRecord) {
        await put(`/suppliers/${editingRecord.id}`, values);
        message.success('更新成功');
      } else {
        await post('/suppliers', values);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchSuppliers();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const columns = [
    {
      title: '供应商编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '供应商名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '联系人',
      dataIndex: 'contact',
      key: 'contact',
      render: (val: string) => val || '-',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (val: string) => val || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (val: string) => val || '-',
    },
    {
      title: '信用额度',
      dataIndex: 'creditLimit',
      key: 'creditLimit',
      render: (val: number) => `¥${val?.toFixed(2) || '0.00'}`,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>{active ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: Supplier) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该供应商？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>供应商管理</h2>
      </div>

      <Card>
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <Input
              placeholder="搜索编码/名称/联系人/电话"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="状态"
              allowClear
              value={searchActive}
              onChange={setSearchActive}
              style={{ width: 100 }}
              options={[
                { value: true, label: '启用' },
                { value: false, label: '禁用' },
              ]}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增供应商
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={suppliers}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <div className="form-row">
            <Form.Item name="code" label="供应商编码" rules={[{ required: true, message: '请输入编码' }]}>
              <Input placeholder="请输入供应商编码" />
            </Form.Item>
            <Form.Item name="name" label="供应商名称" rules={[{ required: true, message: '请输入名称' }]}>
              <Input placeholder="请输入供应商名称" />
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item name="contact" label="联系人">
              <Input placeholder="联系人" />
            </Form.Item>
            <Form.Item name="phone" label="联系电话">
              <Input placeholder="联系电话" />
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item name="email" label="邮箱">
              <Input placeholder="邮箱" />
            </Form.Item>
            <Form.Item name="creditLimit" label="信用额度">
              <InputNumber style={{ width: '100%' }} min={0} prefix="¥" placeholder="信用额度" />
            </Form.Item>
          </div>
          <Form.Item name="address" label="地址">
            <Input placeholder="地址" />
          </Form.Item>
          <div className="form-row">
            <Form.Item name="taxNo" label="税号">
              <Input placeholder="税号" />
            </Form.Item>
            <Form.Item name="bankName" label="开户行">
              <Input placeholder="开户行" />
            </Form.Item>
          </div>
          <Form.Item name="bankAccount" label="银行账号">
            <Input placeholder="银行账号" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="描述" />
          </Form.Item>
          <Form.Item name="isActive" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
