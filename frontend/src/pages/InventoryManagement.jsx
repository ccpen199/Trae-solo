import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Tabs, DatePicker, Tag, Popconfirm, Radio } from 'antd';
import { getInventory, stockIn, stockOut, adjustInventory, getInventoryTransactions, getMaterials, getWarehouses, getInTransit, createInTransit, receiveInTransit } from '../api';

const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const transTypeMap = {
  stock_in: { color: 'green', text: '入库' },
  stock_out: { color: 'red', text: '出库' },
  receive: { color: 'blue', text: '到货' },
  stock_plus: { color: 'cyan', text: '盘盈' },
  stock_minus: { color: 'orange', text: '盘亏' },
  issue: { color: 'purple', text: '领料' },
  return: { color: 'geekblue', text: '退料' }
};

function InventoryManagement() {
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [inTransit, setInTransit] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stockInModalVisible, setStockInModalVisible] = useState(false);
  const [stockOutModalVisible, setStockOutModalVisible] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [transitModalVisible, setTransitModalVisible] = useState(false);
  const [selectedInTransit, setSelectedInTransit] = useState(null);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [stockInForm] = Form.useForm();
  const [stockOutForm] = Form.useForm();
  const [adjustForm] = Form.useForm();
  const [receiveForm] = Form.useForm();
  const [transitForm] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, transRes, matRes, whRes, transitsRes] = await Promise.all([
        getInventory(),
        getInventoryTransactions(),
        getMaterials(),
        getWarehouses(),
        getInTransit()
      ]);
      setInventory(invRes.data);
      setTransactions(transRes.data);
      setMaterials(matRes.data);
      setWarehouses(whRes.data);
      setInTransit(transitsRes.data);
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  };

  const handleStockIn = async (values) => {
    try {
      await stockIn({ ...values, operator: 'admin' });
      message.success('入库成功');
      setStockInModalVisible(false);
      stockInForm.resetFields();
      fetchData();
    } catch (error) {
      message.error('入库失败: ' + (error.response?.data?.error || ''));
    }
  };

  const handleStockOut = async (values) => {
    try {
      await stockOut({ ...values, operator: 'admin' });
      message.success('出库成功');
      setStockOutModalVisible(false);
      stockOutForm.resetFields();
      fetchData();
    } catch (error) {
      message.error('出库失败: ' + (error.response?.data?.error || ''));
    }
  };

  const handleAdjust = async (values) => {
    try {
      await adjustInventory({ ...values, operator: 'admin' });
      message.success('调整成功');
      setAdjustModalVisible(false);
      adjustForm.resetFields();
      fetchData();
    } catch (error) {
      message.error('调整失败: ' + (error.response?.data?.error || ''));
    }
  };

  const handleReceive = async (values) => {
    try {
      await receiveInTransit(selectedInTransit.id, { ...values, operator: 'admin' });
      message.success('到货入库成功');
      setReceiveModalVisible(false);
      receiveForm.resetFields();
      setSelectedInTransit(null);
      fetchData();
    } catch (error) {
      message.error('操作失败: ' + (error.response?.data?.error || ''));
    }
  };

  const handleCreateInTransit = async (values) => {
    try {
      await createInTransit({
        ...values,
        expected_arrival: values.expected_arrival?.format('YYYY-MM-DD')
      });
      message.success('添加成功');
      setTransitModalVisible(false);
      transitForm.resetFields();
      fetchData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const openStockInModal = (record) => {
    setSelectedInventory(record);
    stockInForm.setFieldsValue({
      material_id: record.material_id,
      warehouse_id: record.warehouse_id,
      location: record.location,
      batch_no: record.batch_no,
      quantity: undefined,
      remark: ''
    });
    setStockInModalVisible(true);
  };

  const openStockOutModal = (record) => {
    setSelectedInventory(record);
    stockOutForm.setFieldsValue({
      material_id: record.material_id,
      warehouse_id: record.warehouse_id,
      location: record.location,
      batch_no: record.batch_no,
      quantity: undefined,
      remark: ''
    });
    setStockOutModalVisible(true);
  };

  const openAdjustModal = (record) => {
    setSelectedInventory(record);
    adjustForm.setFieldsValue({
      material_id: record.material_id,
      warehouse_id: record.warehouse_id,
      location: record.location,
      batch_no: record.batch_no,
      quantity: record.quantity
    });
    setAdjustModalVisible(true);
  };

  return (
    <div>
      <h2 className="page-title">库存管理</h2>

      <Tabs defaultActiveKey="stock">
        <TabPane tab="仓库库存" key="stock">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span></span>
            <Button type="primary" onClick={() => {
              setSelectedInventory(null);
              stockInForm.resetFields();
              setStockInModalVisible(true);
            }}>新物料入库</Button>
          </div>

          <Table
            columns={[
              { title: '物料编码', dataIndex: 'material_code', key: 'code', width: 120 },
              { title: '物料名称', dataIndex: 'material_name', key: 'name' },
              { title: '仓库', dataIndex: 'warehouse_name', key: 'warehouse', width: 100 },
              { title: '库位', dataIndex: 'location', key: 'location', width: 100 },
              { title: '批次', dataIndex: 'batch_no', key: 'batch', width: 120 },
              { title: '库存数量', dataIndex: 'quantity', key: 'qty', width: 100,
                render: (v) => <strong>{v?.toFixed(2)}</strong>
              },
              { title: '单位', dataIndex: 'material_unit', key: 'unit', width: 60 },
              { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 180 },
              { title: '操作', key: 'action', width: 200,
                render: (_, record) => (
                  <Space>
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={() => openStockInModal(record)}
                    >
                      入库
                    </Button>
                    <Button 
                      type="link" 
                      size="small" 
                      danger
                      onClick={() => openStockOutModal(record)}
                    >
                      出库
                    </Button>
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={() => openAdjustModal(record)}
                    >
                      调整
                    </Button>
                  </Space>
                )
              }
            ]}
            dataSource={inventory}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </TabPane>

        <TabPane tab="库存流水" key="transactions">
          <Table
            columns={[
              { title: '时间', dataIndex: 'created_at', key: 'time', width: 180 },
              { title: '类型', dataIndex: 'trans_type', key: 'type', width: 80,
                render: (v) => {
                  const t = transTypeMap[v] || { color: 'default', text: v };
                  return <Tag color={t.color}>{t.text}</Tag>;
                }
              },
              { title: '物料编码', dataIndex: 'material_code', key: 'code', width: 120 },
              { title: '物料名称', dataIndex: 'material_name', key: 'name' },
              { title: '仓库', dataIndex: 'warehouse_name', key: 'warehouse', width: 100 },
              { title: '库位', dataIndex: 'location', key: 'location', width: 80 },
              { title: '批次', dataIndex: 'batch_no', key: 'batch', width: 100 },
              { title: '变动数量', dataIndex: 'quantity', key: 'qty', width: 100,
                render: (v, record) => {
                  const isPlus = ['stock_in', 'receive', 'stock_plus', 'return'].includes(record.trans_type);
                  return <span style={{ color: isPlus ? '#52c41a' : '#ff4d4f' }}>
                    {isPlus ? '+' : '-'}{v?.toFixed(2)}
                  </span>;
                }
              },
              { title: '结存数量', dataIndex: 'balance', key: 'balance', width: 100 },
              { title: '单位', dataIndex: 'material_unit', key: 'unit', width: 60 },
              { title: '参考号', dataIndex: 'ref_no', key: 'ref', width: 100 },
              { title: '操作人', dataIndex: 'operator', key: 'op', width: 80 },
              { title: '备注', dataIndex: 'remark', key: 'remark' }
            ]}
            dataSource={transactions}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </TabPane>

        <TabPane tab="在途物料" key="transit">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span></span>
            <Button type="primary" onClick={() => setTransitModalVisible(true)}>添加在途</Button>
          </div>

          <Table
            columns={[
              { title: '物料编码', dataIndex: 'material_code', key: 'code', width: 120 },
              { title: '物料名称', dataIndex: 'material_name', key: 'name' },
              { title: '数量', dataIndex: 'quantity', key: 'qty', width: 100 },
              { title: '采购单号', dataIndex: 'po_no', key: 'po', width: 120 },
              { title: '供应商', dataIndex: 'supplier', key: 'supplier' },
              { title: '预计到货', dataIndex: 'expected_arrival', key: 'arrival', width: 120 },
              { title: '状态', dataIndex: 'status', key: 'status', width: 100,
                render: (v) => v === 'shipping' ? <Tag color="blue">运输中</Tag> : <Tag color="green">已入库</Tag>
              },
              { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
              { title: '操作', key: 'action', width: 100,
                render: (_, record) => record.status === 'shipping' && (
                  <Button 
                    type="link" 
                    onClick={() => {
                      setSelectedInTransit(record);
                      setReceiveModalVisible(true);
                    }}
                  >
                    到货入库
                  </Button>
                )
              }
            ]}
            dataSource={inTransit}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
      </Tabs>

      <Modal
        title={selectedInventory ? '库存入库 - 追加' : '库存入库 - 新物料'}
        open={stockInModalVisible}
        onCancel={() => setStockInModalVisible(false)}
        footer={null}
      >
        {selectedInventory && (
          <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 4, border: '1px solid #91d5ff' }}>
            <p style={{ margin: '4px 0' }}><strong>物料:</strong> {selectedInventory.material_code} - {selectedInventory.material_name}</p>
            <p style={{ margin: '4px 0' }}><strong>仓库:</strong> {selectedInventory.warehouse_name}</p>
            <p style={{ margin: '4px 0' }}><strong>库位:</strong> {selectedInventory.location || '-'}</p>
            <p style={{ margin: '4px 0' }}><strong>批次:</strong> {selectedInventory.batch_no || '-'}</p>
            <p style={{ margin: '4px 0' }}><strong>当前库存:</strong> {selectedInventory.quantity} {selectedInventory.material_unit}</p>
          </div>
        )}
        <Form form={stockInForm} layout="vertical" onFinish={handleStockIn}>
          <Form.Item name="material_id" label="物料" rules={[{ required: true }]}>
            <Select 
              placeholder="请选择物料" 
              showSearch 
              optionFilterProp="children"
              disabled={!!selectedInventory}
            >
              {materials.map(m => (
                <Option key={m.id} value={m.id}>{m.code} - {m.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="warehouse_id" label="仓库" rules={[{ required: true }]}>
            <Select placeholder="请选择仓库" disabled={!!selectedInventory}>
              {warehouses.map(w => (
                <Option key={w.id} value={w.id}>{w.code} - {w.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="location" label="库位">
            <Input placeholder="例如: A-01-01" disabled={!!selectedInventory} />
          </Form.Item>
          <Form.Item name="batch_no" label="批次号">
            <Input disabled={!!selectedInventory} />
          </Form.Item>
          <Form.Item name="quantity" label="入库数量" rules={[{ required: true }]}>
            <Input type="number" min={0} step={0.01} autoFocus />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
              {selectedInventory ? '确认追加入库' : '确认入库'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="库存出库"
        open={stockOutModalVisible}
        onCancel={() => setStockOutModalVisible(false)}
        footer={null}
      >
        {selectedInventory && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fff1f0', borderRadius: 4, border: '1px solid #ffa39e' }}>
            <p style={{ margin: '4px 0' }}><strong>物料:</strong> {selectedInventory.material_code} - {selectedInventory.material_name}</p>
            <p style={{ margin: '4px 0' }}><strong>仓库:</strong> {selectedInventory.warehouse_name}</p>
            <p style={{ margin: '4px 0' }}><strong>库位:</strong> {selectedInventory.location || '-'}</p>
            <p style={{ margin: '4px 0' }}><strong>批次:</strong> {selectedInventory.batch_no || '-'}</p>
            <p style={{ margin: '4px 0' }}><strong>可出数量:</strong> <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{selectedInventory.quantity}</span> {selectedInventory.material_unit}</p>
          </div>
        )}
        <Form form={stockOutForm} layout="vertical" onFinish={handleStockOut}>
          <Form.Item name="material_id" label="物料" rules={[{ required: true }]}>
            <Select 
              placeholder="请选择物料" 
              showSearch 
              optionFilterProp="children"
              disabled={!!selectedInventory}
            >
              {materials.map(m => (
                <Option key={m.id} value={m.id}>{m.code} - {m.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="warehouse_id" label="仓库" rules={[{ required: true }]}>
            <Select placeholder="请选择仓库" disabled={!!selectedInventory}>
              {warehouses.map(w => (
                <Option key={w.id} value={w.id}>{w.code} - {w.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="location" label="库位">
            <Input placeholder="例如: A-01-01" disabled={!!selectedInventory} />
          </Form.Item>
          <Form.Item name="batch_no" label="批次号">
            <Input disabled={!!selectedInventory} />
          </Form.Item>
          <Form.Item name="quantity" label="出库数量" rules={[{ required: true }]}>
            <Input type="number" min={0} step={0.01} autoFocus />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" danger htmlType="submit" style={{ width: '100%' }}>确认出库</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="库存调整"
        open={adjustModalVisible}
        onCancel={() => setAdjustModalVisible(false)}
        footer={null}
      >
        <Form form={adjustForm} layout="vertical" onFinish={handleAdjust}>
          <Form.Item name="material_id" label="物料">
            <Select disabled showSearch optionFilterProp="children">
              {materials.map(m => (
                <Option key={m.id} value={m.id}>{m.code} - {m.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="warehouse_id" label="仓库">
            <Select disabled>
              {warehouses.map(w => (
                <Option key={w.id} value={w.id}>{w.code} - {w.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="location" label="库位">
            <Input disabled />
          </Form.Item>
          <Form.Item name="batch_no" label="批次号">
            <Input disabled />
          </Form.Item>
          <Form.Item name="quantity" label="调整后数量" rules={[{ required: true }]}>
            <Input type="number" min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="reason" label="调整原因" rules={[{ required: true }]}>
            <Select>
              <Option value="盘点盈亏">盘点盈亏</Option>
              <Option value="报损">报损</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>确认调整</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="在途物料到货入库"
        open={receiveModalVisible}
        onCancel={() => setReceiveModalVisible(false)}
        footer={null}
      >
        {selectedInTransit && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            <p><strong>物料:</strong> {selectedInTransit.material_code} - {selectedInTransit.material_name}</p>
            <p><strong>数量:</strong> {selectedInTransit.quantity}</p>
            <p><strong>采购单:</strong> {selectedInTransit.po_no}</p>
          </div>
        )}
        <Form form={receiveForm} layout="vertical" onFinish={handleReceive}>
          <Form.Item name="warehouse_id" label="入库仓库" rules={[{ required: true }]}>
            <Select placeholder="请选择仓库">
              {warehouses.map(w => (
                <Option key={w.id} value={w.id}>{w.code} - {w.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="location" label="库位">
            <Input placeholder="例如: A-01-01" />
          </Form.Item>
          <Form.Item name="batch_no" label="批次号">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>确认入库</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加在途物料"
        open={transitModalVisible}
        onCancel={() => setTransitModalVisible(false)}
        footer={null}
      >
        <Form form={transitForm} layout="vertical" onFinish={handleCreateInTransit}>
          <Form.Item name="material_id" label="物料" rules={[{ required: true }]}>
            <Select placeholder="请选择物料" showSearch optionFilterProp="children">
              {materials.map(m => (
                <Option key={m.id} value={m.id}>{m.code} - {m.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="po_no" label="采购单号">
            <Input />
          </Form.Item>
          <Form.Item name="supplier" label="供应商">
            <Input />
          </Form.Item>
          <Form.Item name="expected_arrival" label="预计到货日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>添加</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default InventoryManagement;
