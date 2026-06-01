import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Tabs, Radio } from 'antd';
import { getWorkOrders, getMaterials, getWarehouses, createMaterialIssue, createMaterialReturn, checkWorkOrderKitting } from '../api';

const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

function MaterialIssueReturn() {
  const [workOrders, setWorkOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWO, setSelectedWO] = useState(null);
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [issueForm] = Form.useForm();
  const [returnForm] = Form.useForm();
  const [tabKey, setTabKey] = useState('issue');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [woRes, matRes, whRes] = await Promise.all([
        getWorkOrders(), getMaterials(), getWarehouses()
      ]);
      setWorkOrders(woRes.data);
      setMaterials(matRes.data);
      setWarehouses(whRes.data);
    } catch (error) {
      console.error('获取数据失败:', error);
    }
  };

  const handleIssue = async (values) => {
    try {
      await createMaterialIssue({
        ...values,
        work_order_id: selectedWO?.id,
        operator: 'admin'
      });
      message.success('领料成功');
      setIssueModalVisible(false);
      issueForm.resetFields();
      if (selectedWO) {
        await checkWorkOrderKitting(selectedWO.id);
      }
    } catch (error) {
      message.error('领料失败');
    }
  };

  const handleReturn = async (values) => {
    try {
      await createMaterialReturn({
        ...values,
        work_order_id: selectedWO?.id,
        operator: 'admin'
      });
      message.success('退料成功');
      setReturnModalVisible(false);
      returnForm.resetFields();
      if (selectedWO) {
        await checkWorkOrderKitting(selectedWO.id);
      }
    } catch (error) {
      message.error('退料失败');
    }
  };

  return (
    <div>
      <h2 className="page-title">领料退料管理</h2>

      <div style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <span style={{ marginRight: 8 }}>选择工单:</span>
        <Select
          style={{ width: 350 }}
          placeholder="请选择要操作的工单"
          value={selectedWO?.id}
          onChange={(id) => setSelectedWO(workOrders.find(w => w.id === id))}
          showSearch
          optionFilterProp="children"
        >
          {workOrders.map(wo => (
            <Option key={wo.id} value={wo.id}>
              {wo.wo_no} - {wo.product_name} ({wo.quantity}台)
            </Option>
          ))}
        </Select>
        {selectedWO && (
          <span style={{ marginLeft: 16 }}>
            当前齐套状态: {selectedWO.kitting_status === 'ready' ? '✅ 已齐套' : selectedWO.kitting_status === 'shortage' ? '❌ 缺料' : '⏳ 待检查'}
          </span>
        )}
      </div>

      <Tabs activeKey={tabKey} onChange={setTabKey}>
        <TabPane tab="领料" key="issue">
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              onClick={() => setIssueModalVisible(true)}
              disabled={!selectedWO}
            >
              新增领料
            </Button>
          </div>

          <Table
            columns={[
              { title: '领料单号', dataIndex: 'issue_no', key: 'no', width: 160 },
              { title: '物料编码', dataIndex: 'material_code', key: 'code', width: 120 },
              { title: '物料名称', dataIndex: 'material_name', key: 'name' },
              { title: '数量', dataIndex: 'quantity', key: 'qty', width: 100 },
              { title: '仓库', dataIndex: 'warehouse_name', key: 'warehouse', width: 100 },
              { title: '批次', dataIndex: 'batch_no', key: 'batch', width: 120 },
              { title: '类型', dataIndex: 'issue_type', key: 'type', width: 100 },
              { title: '操作人', dataIndex: 'operator', key: 'op', width: 100 },
              { title: '时间', dataIndex: 'created_at', key: 'time', width: 180 }
            ]}
            dataSource={[]}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: '暂无领料记录，请点击"新增领料"添加' }}
          />
        </TabPane>

        <TabPane tab="退料" key="return">
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              danger
              onClick={() => setReturnModalVisible(true)}
              disabled={!selectedWO}
            >
              新增退料
            </Button>
          </div>

          <Table
            columns={[
              { title: '退料单号', dataIndex: 'return_no', key: 'no', width: 160 },
              { title: '物料编码', dataIndex: 'material_code', key: 'code', width: 120 },
              { title: '物料名称', dataIndex: 'material_name', key: 'name' },
              { title: '数量', dataIndex: 'quantity', key: 'qty', width: 100 },
              { title: '仓库', dataIndex: 'warehouse_name', key: 'warehouse', width: 100 },
              { title: '批次', dataIndex: 'batch_no', key: 'batch', width: 120 },
              { title: '退料原因', dataIndex: 'reason', key: 'reason' },
              { title: '操作人', dataIndex: 'operator', key: 'op', width: 100 },
              { title: '时间', dataIndex: 'created_at', key: 'time', width: 180 }
            ]}
            dataSource={[]}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: '暂无退料记录' }}
          />
        </TabPane>
      </Tabs>

      <Modal
        title="新增领料"
        open={issueModalVisible}
        onCancel={() => setIssueModalVisible(false)}
        footer={null}
      >
        <Form form={issueForm} layout="vertical" onFinish={handleIssue}>
          <Form.Item name="material_id" label="物料" rules={[{ required: true }]}>
            <Select placeholder="请选择物料">
              {materials.map(m => (
                <Option key={m.id} value={m.id}>{m.code} - {m.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="warehouse_id" label="仓库" rules={[{ required: true }]}>
            <Select placeholder="请选择仓库">
              {warehouses.map(w => (
                <Option key={w.id} value={w.id}>{w.code} - {w.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="quantity" label="领料数量" rules={[{ required: true }]}>
            <Input type="number" min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="batch_no" label="批次号">
            <Input />
          </Form.Item>
          <Form.Item name="location" label="库位">
            <Input />
          </Form.Item>
          <Form.Item name="issue_type" label="领料类型" initialValue="normal">
            <Radio.Group>
              <Radio value="normal">正常领料</Radio>
              <Radio value="supplement">补料</Radio>
              <Radio value="extra">超额领料</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>确认领料</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增退料"
        open={returnModalVisible}
        onCancel={() => setReturnModalVisible(false)}
        footer={null}
      >
        <Form form={returnForm} layout="vertical" onFinish={handleReturn}>
          <Form.Item name="material_id" label="物料" rules={[{ required: true }]}>
            <Select placeholder="请选择物料">
              {materials.map(m => (
                <Option key={m.id} value={m.id}>{m.code} - {m.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="warehouse_id" label="仓库" rules={[{ required: true }]}>
            <Select placeholder="请选择仓库">
              {warehouses.map(w => (
                <Option key={w.id} value={w.id}>{w.code} - {w.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="quantity" label="退料数量" rules={[{ required: true }]}>
            <Input type="number" min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="batch_no" label="批次号">
            <Input />
          </Form.Item>
          <Form.Item name="location" label="库位">
            <Input />
          </Form.Item>
          <Form.Item name="return_type" label="退料类型" initialValue="normal">
            <Radio.Group>
              <Radio value="normal">正常退料</Radio>
              <Radio value="abnormal">异常退料</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="reason" label="退料原因">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" danger htmlType="submit" style={{ width: '100%' }}>确认退料</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default MaterialIssueReturn;
