import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Select, Steps, Tag, message, Input } from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { QualificationApplication, getApplications, createApplication, processNode } from '../api/applications';
import { getProducts } from '../api/products';
import { getCustomers } from '../api/customers';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const statusColors: Record<string, string> = {
  DRAFT: 'default',
  PENDING: 'orange',
  INITIAL_REVIEW: 'blue',
  SUPPLEMENT: 'orange',
  SUBMITTED: 'cyan',
  ACCEPTED: 'purple',
  PUBLICITY: 'geekblue',
  APPROVED: 'green',
  REJECTED: 'red',
  COMPLETED: 'green'
};

const statusLabels: Record<string, string> = {
  DRAFT: '草稿',
  PENDING: '待处理',
  INITIAL_REVIEW: '初审中',
  SUPPLEMENT: '待补件',
  SUBMITTED: '已提交',
  ACCEPTED: '已受理',
  PUBLICITY: '公示中',
  APPROVED: '已核准',
  REJECTED: '已驳回',
  COMPLETED: '已完成'
};

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<QualificationApplication[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState<QualificationApplication | null>(null);
  const [processNodeVisible, setProcessNodeVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [form] = Form.useForm();
  const [processForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [apps, prods, custs] = await Promise.all([
        getApplications(),
        getProducts(),
        getCustomers()
      ]);
      setApplications(apps);
      setProducts(prods);
      setCustomers(custs);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await createApplication(values);
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleProcessNode = async (values: any) => {
    try {
      if (selectedApp && selectedNode) {
        await processNode(selectedApp.id, selectedNode.id, values);
        message.success('处理成功');
        setProcessNodeVisible(false);
        processForm.resetFields();
        loadData();
      }
    } catch (error) {
      message.error('处理失败');
    }
  };

  const columns = [
    { title: '申请编号', dataIndex: 'applicationNo', key: 'applicationNo' },
    { title: '客户名称', key: 'customer', render: (_: any, record: QualificationApplication) => record.customer?.name },
    { title: '资质产品', key: 'product', render: (_: any, record: QualificationApplication) => record.product?.name },
    {
      title: '当前状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status]}
        </Tag>
      )
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: QualificationApplication) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => {
            setSelectedApp(record);
            setDetailVisible(true);
          }}>
            详情
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>办理进度</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建申请
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={applications}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="新建资质申请"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="customerId" label="选择客户" rules={[{ required: true }]}>
            <Select placeholder="请选择客户">
              {customers.map(c => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="productId" label="选择资质产品" rules={[{ required: true }]}>
            <Select placeholder="请选择资质产品">
              {products.filter(p => p.isActive).map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="申请详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedApp && (
          <div>
            <h4>基本信息</h4>
            <p><strong>申请编号：</strong>{selectedApp.applicationNo}</p>
            <p><strong>客户名称：</strong>{selectedApp.customer?.name}</p>
            <p><strong>资质产品：</strong>{selectedApp.product?.name}</p>
            <p><strong>当前状态：</strong><Tag color={statusColors[selectedApp.status]}>{statusLabels[selectedApp.status]}</Tag></p>

            <h4 style={{ marginTop: 24 }}>办理流程</h4>
            <Steps direction="vertical" size="small">
              {selectedApp.processNodes?.map((node: any) => (
                <Step
                  key={node.id}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{node.nodeName}</span>
                      <Space>
                        <Tag color={node.status === 'PENDING' ? 'orange' : node.status === 'COMPLETED' ? 'green' : 'red'}>
                          {node.status === 'PENDING' ? '待处理' : node.status === 'COMPLETED' ? '已完成' : node.status}
                        </Tag>
                        {node.status === 'PENDING' && (
                          <Button type="link" size="small" onClick={() => {
                            setSelectedNode(node);
                            setProcessNodeVisible(true);
                          }}>
                            处理
                          </Button>
                        )}
                      </Space>
                    </div>
                  }
                  description={
                    <div>
                      {node.operator && <p>处理人：{node.operator.name}</p>}
                      {node.handleDate && <p>处理时间：{node.handleDate}</p>}
                      {node.remark && <p>备注：{node.remark}</p>}
                      {node.rejectReason && <p style={{ color: 'red' }}>退回原因：{node.rejectReason}</p>}
                    </div>
                  }
                  status={node.status === 'COMPLETED' ? 'finish' : node.status === 'PENDING' ? 'process' : 'error'}
                />
              ))}
            </Steps>
          </div>
        )}
      </Modal>

      <Modal
        title="处理节点"
        open={processNodeVisible}
        onCancel={() => setProcessNodeVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={processForm} layout="vertical" onFinish={handleProcessNode}>
          <Form.Item name="status" label="处理结果" rules={[{ required: true }]}>
            <Select placeholder="请选择处理结果">
              <Option value="COMPLETED" label={<span><CheckOutlined style={{ color: 'green' }} /> 通过</span>}>通过</Option>
              <Option value="REJECTED" label={<span><CloseOutlined style={{ color: 'red' }} /> 退回</span>}>退回</Option>
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.status !== curr.status}>
            {({ getFieldValue }) =>
              getFieldValue('status') === 'REJECTED' && (
                <Form.Item name="rejectReason" label="退回原因" rules={[{ required: true }]}>
                  <TextArea rows={4} placeholder="请输入退回原因" />
                </Form.Item>
              )
            }
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setProcessNodeVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Applications;
