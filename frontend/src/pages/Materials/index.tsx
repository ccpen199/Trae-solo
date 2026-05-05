import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Card,
  message,
  Space,
  Popconfirm,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { get, post, put, del } from '../../utils/request';

interface Material {
  id: string;
  code: string;
  name: string;
  spec?: string;
  unit: string;
  type: string;
  categoryId?: string;
  category?: { name: string };
  safetyStock: number;
  maxStock: number;
  avgCost: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

interface MaterialCategory {
  id: string;
  name: string;
  code: string;
  parentId?: string;
}

const materialTypeMap: Record<string, string> = {
  RAW_MATERIAL: '原材料',
  SEMI_FINISHED: '半成品',
  FINISHED: '成品',
  SERVICE: '服务',
};

const materialTypeOptions = Object.entries(materialTypeMap).map(([value, label]) => ({
  value,
  label,
}));

export default function MaterialsPage() {
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState<string>();
  const [searchActive, setSearchActive] = useState<boolean>();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [editingRecord, setEditingRecord] = useState<Material | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [page, pageSize]);

  const fetchCategories = async () => {
    try {
      const data = await get<MaterialCategory[]>('/materials/categories');
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      if (searchKeyword) params.append('keyword', searchKeyword);
      if (searchType) params.append('type', searchType);
      if (searchActive !== undefined) params.append('isActive', searchActive.toString());

      const data = await get<{ list: Material[]; total: number }>(`/materials?${params.toString()}`);
      setMaterials(data.list || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchMaterials();
  };

  const handleReset = () => {
    setSearchKeyword('');
    setSearchType(undefined);
    setSearchActive(undefined);
    setPage(1);
    setTimeout(fetchMaterials, 0);
  };

  const handleAdd = () => {
    setModalTitle('新增物料');
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, type: 'RAW_MATERIAL' });
    setModalVisible(true);
  };

  const handleEdit = (record: Material) => {
    setModalTitle('编辑物料');
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await del(`/materials/${id}`);
      message.success('删除成功');
      fetchMaterials();
    } catch (error) {
      console.error('Failed to delete material:', error);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingRecord) {
        await put(`/materials/${editingRecord.id}`, values);
        message.success('更新成功');
      } else {
        await post('/materials', values);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchMaterials();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const columns = [
    {
      title: '物料编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '物料名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '规格',
      dataIndex: 'spec',
      key: 'spec',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => materialTypeMap[type] || type,
    },
    {
      title: '分类',
      dataIndex: ['category', 'name'],
      key: 'category',
      render: (name: string) => name || '-',
    },
    {
      title: '平均成本',
      dataIndex: 'avgCost',
      key: 'avgCost',
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
      render: (_: unknown, record: Material) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该物料？" onConfirm={() => handleDelete(record.id)}>
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
        <h2>物料管理</h2>
      </div>

      <Card>
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <Input
              placeholder="搜索编码/名称/规格"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="物料类型"
              allowClear
              value={searchType}
              onChange={setSearchType}
              style={{ width: 120 }}
              options={materialTypeOptions}
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
            新增物料
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={materials}
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
        width={600}
      >
        <Form form={form} layout="vertical">
          <div className="form-row">
            <Form.Item name="code" label="物料编码" rules={[{ required: true, message: '请输入物料编码' }]}>
              <Input placeholder="请输入物料编码" />
            </Form.Item>
            <Form.Item name="name" label="物料名称" rules={[{ required: true, message: '请输入物料名称' }]}>
              <Input placeholder="请输入物料名称" />
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item name="spec" label="规格">
              <Input placeholder="请输入规格" />
            </Form.Item>
            <Form.Item name="unit" label="单位" rules={[{ required: true, message: '请输入单位' }]}>
              <Input placeholder="如：个、件、kg、米" />
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item name="type" label="物料类型" rules={[{ required: true }]}>
              <Select options={materialTypeOptions} />
            </Form.Item>
            <Form.Item name="categoryId" label="物料分类">
              <Select
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="请选择分类"
                allowClear
              />
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item name="safetyStock" label="安全库存">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="安全库存" />
            </Form.Item>
            <Form.Item name="maxStock" label="最大库存">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="最大库存" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="isActive" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
