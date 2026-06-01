import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Tag, Tabs } from 'antd';
import { getBoms, getBom, createBom, getProducts, getMaterials, createMaterial, createProduct } from '../api';

const { Option } = Select;
const { TabPane } = Tabs;

function BOMManagement() {
  const [boms, setBoms] = useState([]);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedBom, setSelectedBom] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [materialModalVisible, setMaterialModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [materialForm] = Form.useForm();
  const [productForm] = Form.useForm();
  const [bomItems, setBomItems] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bomRes, prodRes, matRes] = await Promise.all([
        getBoms(), getProducts(), getMaterials()
      ]);
      setBoms(bomRes.data);
      setProducts(prodRes.data);
      setMaterials(matRes.data);
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  };

  const handleViewBom = async (bomId) => {
    try {
      const res = await getBom(bomId);
      setSelectedBom(res.data);
    } catch (error) {
      message.error('获取BOM详情失败');
    }
  };

  const handleAddItem = () => {
    setBomItems([...bomItems, { material_id: null, quantity: 1, process: '', remark: '' }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...bomItems];
    newItems.splice(index, 1);
    setBomItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...bomItems];
    newItems[index][field] = value;
    setBomItems(newItems);
  };

  const handleCreateBom = async (values) => {
    try {
      await createBom({
        ...values,
        items: bomItems,
        created_by: 'admin'
      });
      message.success('BOM创建成功');
      setModalVisible(false);
      form.resetFields();
      setBomItems([]);
      fetchData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleCreateMaterial = async (values) => {
    try {
      await createMaterial(values);
      message.success('物料创建成功');
      setMaterialModalVisible(false);
      materialForm.resetFields();
      fetchData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleCreateProduct = async (values) => {
    try {
      await createProduct(values);
      message.success('产品创建成功');
      setProductModalVisible(false);
      productForm.resetFields();
      fetchData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const bomColumns = [
    { title: 'BOM ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '产品编码', dataIndex: 'product_code', key: 'product_code', width: 120 },
    { title: '产品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '版本', dataIndex: 'version', key: 'version', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (text) => text === 'active' ? <Tag color="success">生效</Tag> : <Tag>失效</Tag>
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
    { title: '操作', key: 'action', width: 100,
      render: (_, record) => (
        <Button type="link" onClick={() => handleViewBom(record.id)}>查看</Button>
      )
    }
  ];

  return (
    <div>
      <h2 className="page-title">BOM管理</h2>

      <Tabs defaultActiveKey="bom">
        <TabPane tab="BOM列表" key="bom">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Space>
              <Button onClick={() => setProductModalVisible(true)}>新建产品</Button>
              <Button onClick={() => setMaterialModalVisible(true)}>新建物料</Button>
            </Space>
            <Button type="primary" onClick={() => setModalVisible(true)}>新建BOM</Button>
          </div>

          <Table
            columns={bomColumns}
            dataSource={boms}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            expandable={{
              expandedRowRender: (record) => {
                const bom = boms.find(b => b.id === record.id);
                return (
                  <div>
                    <p>BOM详情加载中...</p>
                  </div>
                );
              },
              onExpand: (expanded, record) => {
                if (expanded) handleViewBom(record.id);
              }
            }}
          />

          {selectedBom && (
            <Modal
              title="BOM详情"
              open={!!selectedBom}
              onCancel={() => setSelectedBom(null)}
              footer={null}
              width={900}
            >
              <div style={{ marginBottom: 16 }}>
                <p><strong>产品:</strong> {selectedBom.product_code} - {selectedBom.product_name}</p>
                <p><strong>版本:</strong> {selectedBom.version}</p>
              </div>
              <Table
                size="small"
                columns={[
                  { title: '物料编码', dataIndex: 'material_code', key: 'code', width: 120 },
                  { title: '物料名称', dataIndex: 'material_name', key: 'name' },
                  { title: '用量', dataIndex: 'quantity', key: 'qty', width: 80 },
                  { title: '单位', dataIndex: 'material_unit', key: 'unit', width: 60 },
                  { title: '工序', dataIndex: 'process', key: 'process', width: 100 },
                  { title: '备注', dataIndex: 'remark', key: 'remark' }
                ]}
                dataSource={selectedBom.items}
                rowKey="id"
                pagination={false}
              />
            </Modal>
          )}
        </TabPane>

        <TabPane tab="物料列表" key="materials">
          <Table
            columns={[
              { title: '编码', dataIndex: 'code', key: 'code', width: 120 },
              { title: '名称', dataIndex: 'name', key: 'name' },
              { title: '规格', dataIndex: 'spec', key: 'spec' },
              { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
              { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
              { title: '安全库存', dataIndex: 'safety_stock', key: 'safety', width: 100 },
              { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 }
            ]}
            dataSource={materials}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </TabPane>

        <TabPane tab="产品列表" key="products">
          <Table
            columns={[
              { title: '编码', dataIndex: 'code', key: 'code', width: 120 },
              { title: '名称', dataIndex: 'name', key: 'name' },
              { title: '规格', dataIndex: 'spec', key: 'spec' },
              { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 }
            ]}
            dataSource={products}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
      </Tabs>

      <Modal
        title="新建BOM"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateBom}>
          <Form.Item name="product_id" label="产品" rules={[{ required: true }]}>
            <Select placeholder="请选择产品">
              {products.map(p => (
                <Option key={p.id} value={p.id}>{p.code} - {p.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="version" label="版本" initialValue="V1.0">
            <Input />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>BOM明细</strong>
              <Button type="dashed" size="small" onClick={handleAddItem}>+ 添加物料</Button>
            </div>
            {bomItems.map((item, index) => (
              <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Select
                  style={{ width: 200 }}
                  placeholder="选择物料"
                  value={item.material_id || undefined}
                  onChange={(v) => handleItemChange(index, 'material_id', v)}
                >
                  {materials.map(m => (
                    <Option key={m.id} value={m.id}>{m.code} - {m.name}</Option>
                  ))}
                </Select>
                <Input
                  style={{ width: 100 }}
                  type="number"
                  placeholder="用量"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                />
                <Input
                  style={{ width: 100 }}
                  placeholder="工序"
                  value={item.process}
                  onChange={(e) => handleItemChange(index, 'process', e.target.value)}
                />
                <Button type="text" danger onClick={() => handleRemoveItem(index)}>删除</Button>
              </Space>
            ))}
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>创建BOM</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新建物料"
        open={materialModalVisible}
        onCancel={() => setMaterialModalVisible(false)}
        footer={null}
      >
        <Form form={materialForm} layout="vertical" onFinish={handleCreateMaterial}>
          <Form.Item name="code" label="物料编码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="物料名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="spec" label="规格型号">
            <Input />
          </Form.Item>
          <Form.Item name="unit" label="单位" initialValue="个">
            <Select>
              <Option value="个">个</Option>
              <Option value="件">件</Option>
              <Option value="kg">kg</Option>
              <Option value="米">米</Option>
              <Option value="套">套</Option>
            </Select>
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select>
              <Option value="电子">电子</Option>
              <Option value="机械">机械</Option>
              <Option value="包装">包装</Option>
              <Option value="辅料">辅料</Option>
            </Select>
          </Form.Item>
          <Form.Item name="safety_stock" label="安全库存">
            <Input type="number" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>创建</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新建产品"
        open={productModalVisible}
        onCancel={() => setProductModalVisible(false)}
        footer={null}
      >
        <Form form={productForm} layout="vertical" onFinish={handleCreateProduct}>
          <Form.Item name="code" label="产品编码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="产品名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="spec" label="规格型号">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>创建</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default BOMManagement;
