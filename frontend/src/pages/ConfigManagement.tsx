import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Switch,
  Tag,
  Space,
  message,
  Popconfirm,
  Row,
  Col
} from 'antd';
import { PlusOutlined, SyncOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { configApi } from '@/api';

const { Option } = Select;

const ConfigManagement: React.FC = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [distributionCenters, setDistributionCenters] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configsRes, dcRes] = await Promise.all([
        configApi.getSchedulingConfigs(),
        configApi.getDistributionCenters()
      ]);
      setConfigs(configsRes.data.configs || []);
      setDistributionCenters(dcRes.data.distributionCenters || []);
    } catch (error: any) {
      message.error(error.response?.data?.error || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDCChange = async (dcId: number) => {
    form.setFieldValue('warehouseId', undefined);
    if (dcId) {
      try {
        const res = await configApi.getWarehouses(dcId);
        setWarehouses(res.data.warehouses || []);
      } catch {
        setWarehouses([]);
      }
    } else {
      setWarehouses([]);
    }
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await configApi.createConfig({
        distributionCenterId: values.distributionCenterId,
        warehouseId: values.warehouseId,
        orderType: values.orderType,
        minItems: values.minItems,
        maxItems: values.maxItems,
        minVolume: values.minVolume,
        maxVolume: values.maxVolume,
        minWeight: values.minWeight,
        maxWeight: values.maxWeight
      });
      message.success('配置创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建配置失败');
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: number) => {
    try {
      await configApi.updateConfig(id, { status: currentStatus === 1 ? 0 : 1 });
      message.success('状态更新成功');
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '更新状态失败');
    }
  };

  const handleBatchToggle = async (status: number) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的配置');
      return;
    }
    try {
      await configApi.batchToggle(selectedRowKeys.map(Number), status);
      message.success(`批量${status === 1 ? '开启' : '关闭'}成功`);
      setSelectedRowKeys([]);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '批量操作失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '配送中心',
      key: 'dc',
      render: (_: any, record: any) => (
        <div>
          <div>{record.dc_name}</div>
          <div style={{ color: '#999', fontSize: '12px' }}>{record.dc_code}</div>
        </div>
      ),
    },
    {
      title: '库房',
      key: 'wh',
      render: (_: any, record: any) => (
        <div>
          <div>{record.warehouse_name}</div>
          <div style={{ color: '#999', fontSize: '12px' }}>{record.warehouse_code}</div>
        </div>
      ),
    },
    {
      title: '订单类型',
      dataIndex: 'order_type',
      key: 'order_type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '件数范围',
      key: 'items',
      render: (_: any, record: any) => (
        <span>{record.min_items || '-'}{record.max_items ? ` ~ ${record.max_items}` : ''} 件</span>
      ),
    },
    {
      title: '体积范围',
      key: 'volume',
      render: (_: any, record: any) => (
        <span>{record.min_volume || '-'}{record.max_volume ? ` ~ ${record.max_volume}` : ''} m³</span>
      ),
    },
    {
      title: '重量范围',
      key: 'weight',
      render: (_: any, record: any) => (
        <span>{record.min_weight || '-'}{record.max_weight ? ` ~ ${record.max_weight}` : ''} kg</span>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: any) => (
        <Tag color={record.status === 1 ? 'green' : 'default'}>
          {record.status === 1 ? '已开启' : '已关闭'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Switch
          checkedChildren={<CheckOutlined />}
          unCheckedChildren={<CloseOutlined />}
          checked={record.status === 1}
          onChange={() => handleToggleStatus(record.id, record.status)}
        />
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <div>
      <Card
        title="调度配置管理"
        extra={
          <Space>
            <Button icon={<SyncOutlined />} onClick={fetchData} loading={loading}>
              刷新
            </Button>
            {selectedRowKeys.length > 0 && (
              <>
                <Button
                  type="primary"
                  onClick={() => handleBatchToggle(1)}
                >
                  批量开启 ({selectedRowKeys.length})
                </Button>
                <Button danger onClick={() => handleBatchToggle(0)}>
                  批量关闭
                </Button>
              </>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              新增配置
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={configs}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="新增调度配置"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="配送中心"
                name="distributionCenterId"
                rules={[{ required: true, message: '请选择配送中心' }]}
              >
                <Select
                  placeholder="请选择配送中心"
                  onChange={handleDCChange}
                  showSearch
                  optionFilterProp="children"
                >
                  {distributionCenters.map((dc) => (
                    <Option key={dc.id} value={dc.id}>
                      {dc.name} ({dc.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="库房"
                name="warehouseId"
                rules={[{ required: true, message: '请选择库房' }]}
              >
                <Select placeholder="请先选择配送中心" showSearch optionFilterProp="children">
                  {warehouses.map((wh) => (
                    <Option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="订单类型"
            name="orderType"
            rules={[{ required: true, message: '请选择订单类型' }]}
          >
            <Select placeholder="请选择订单类型">
              <Option value="standard">标准订单</Option>
              <Option value="express">快递订单</Option>
              <Option value="special">特殊订单</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="最小件数" name="minItems">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="不限请留空" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="最大件数" name="maxItems">
                <InputNumber min={1} style={{ width: '100%' }} placeholder="不限请留空" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="最小体积 (m³)" name="minVolume">
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="不限请留空" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="最大体积 (m³)" name="maxVolume">
                <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} placeholder="不限请留空" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="最小重量 (kg)" name="minWeight">
                <InputNumber min={0} step={0.5} style={{ width: '100%' }} placeholder="不限请留空" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="最大重量 (kg)" name="maxWeight">
                <InputNumber min={0.5} step={0.5} style={{ width: '100%' }} placeholder="不限请留空" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default ConfigManagement;
