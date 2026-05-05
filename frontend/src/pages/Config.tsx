import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  Row,
  Col,
  Tabs,
  message,
  Upload,
  InputNumber,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { configApi } from '../services/api';

const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const Config: React.FC = () => {
  const [activeTab, setActiveTab] = useState('scheduleConfigs');
  const [loading, setLoading] = useState(false);
  const [dcList, setDcList] = useState<any[]>([]);
  const [warehouseList, setWarehouseList] = useState<any[]>([]);
  const [configList, setConfigList] = useState<any[]>([]);
  const [configTotal, setConfigTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [createDcModalVisible, setCreateDcModalVisible] = useState(false);
  const [createWhModalVisible, setCreateWhModalVisible] = useState(false);
  const [createConfigModalVisible, setCreateConfigModalVisible] = useState(false);
  const [selectedDcId, setSelectedDcId] = useState<string>('');
  const [form] = Form.useForm();
  const [dcForm] = Form.useForm();
  const [whForm] = Form.useForm();
  const [configForm] = Form.useForm();

  useEffect(() => {
    fetchDistributionCenters();
  }, []);

  useEffect(() => {
    if (activeTab === 'scheduleConfigs') {
      fetchScheduleConfigs();
    }
  }, [activeTab, page, pageSize]);

  const fetchDistributionCenters = async () => {
    try {
      const response = await configApi.getDistributionCenters();
      setDcList(response.data.data);
    } catch (error) {
      console.error('Failed to fetch distribution centers');
    }
  };

  const fetchWarehouses = async (dcId: string) => {
    if (!dcId) {
      setWarehouseList([]);
      return;
    }
    try {
      const response = await configApi.getWarehouses(dcId);
      setWarehouseList(response.data.data);
    } catch (error) {
      console.error('Failed to fetch warehouses');
    }
  };

  const fetchScheduleConfigs = async () => {
    setLoading(true);
    try {
      const response = await configApi.getScheduleConfigs({
        page,
        pageSize,
      });
      const { configs, total } = response.data.data;
      setConfigList(configs);
      setConfigTotal(total);
    } catch (error: any) {
      message.error('获取调度配置列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDc = async () => {
    try {
      const values = await dcForm.validateFields();
      await configApi.createDistributionCenter(values);
      message.success('配送中心创建成功');
      setCreateDcModalVisible(false);
      dcForm.resetFields();
      fetchDistributionCenters();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '创建失败');
    }
  };

  const handleCreateWh = async () => {
    if (!selectedDcId) {
      message.warning('请先选择配送中心');
      return;
    }
    try {
      const values = await whForm.validateFields();
      await configApi.createWarehouse(selectedDcId, values);
      message.success('库房创建成功');
      setCreateWhModalVisible(false);
      whForm.resetFields();
      fetchWarehouses(selectedDcId);
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '创建失败');
    }
  };

  const handleCreateConfig = async () => {
    try {
      const values = await configForm.validateFields();
      await configApi.createScheduleConfig(values);
      message.success('调度配置创建成功');
      setCreateConfigModalVisible(false);
      configForm.resetFields();
      fetchScheduleConfigs();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '创建失败');
    }
  };

  const handleImportConfig = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      const response = await configApi.importConfigs(file);
      const { imported } = response.data.data;
      message.success(`成功导入 ${imported} 条配置`);
      fetchScheduleConfigs();
      onSuccess?.();
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '导入失败');
      onError?.(error);
    }
  };

  const orderTypeMap: Record<string, string> = {
    SMALL_MEDIUM: '中小件',
    BULK: '大宗',
    SELF_PICKUP: '自提',
  };

  const dcColumns = [
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (val: boolean) => (
        <Tag color={val ? 'green' : 'red'}>{val ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  const whColumns = [
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (val: boolean) => (
        <Tag color={val ? 'green' : 'red'}>{val ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  const configColumns = [
    {
      title: '配置名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '配送中心',
      dataIndex: ['distributionCenter', 'name'],
      key: 'distributionCenter',
      render: (val: string) => val || '全部',
    },
    {
      title: '库房',
      dataIndex: ['warehouse', 'name'],
      key: 'warehouse',
      render: (val: string) => val || '全部',
    },
    {
      title: '订单类型',
      dataIndex: 'orderType',
      key: 'orderType',
      render: (val: string) => (val ? orderTypeMap[val] || val : '全部'),
    },
    {
      title: '件数范围',
      key: 'pieceCount',
      render: (_: any, record: any) =>
        record.minPieceCount !== null || record.maxPieceCount !== null
          ? `${record.minPieceCount || '不限'} - ${record.maxPieceCount || '不限'}`
          : '不限',
    },
    {
      title: '体积范围',
      key: 'volume',
      render: (_: any, record: any) =>
        record.minVolume !== null || record.maxVolume !== null
          ? `${record.minVolume || '不限'} - ${record.maxVolume || '不限'} m³`
          : '不限',
    },
    {
      title: '重量范围',
      key: 'weight',
      render: (_: any, record: any) =>
        record.minWeight !== null || record.maxWeight !== null
          ? `${record.minWeight || '不限'} - ${record.maxWeight || '不限'} kg`
          : '不限',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (val: boolean) => (
        <Tag color={val ? 'green' : 'red'}>{val ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  const pagination = {
    current: page,
    pageSize,
    total: configTotal,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number) => `共 ${total} 条`,
    onChange: (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
    },
  };

  const uploadProps = {
    beforeUpload: () => false,
    customRequest: handleImportConfig,
    accept: '.json',
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">调度配置</h2>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="调度范围配置" key="scheduleConfigs">
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateConfigModalVisible(true)}
                >
                  新建配置
                </Button>
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />}>导入配置</Button>
                </Upload>
                <Button icon={<ReloadOutlined />} onClick={fetchScheduleConfigs}>
                  刷新
                </Button>
              </Space>
            </div>

            <Table
              columns={configColumns}
              dataSource={configList}
              rowKey="id"
              loading={loading}
              pagination={pagination}
            />
          </Card>
        </TabPane>

        <TabPane tab="配送中心管理" key="distributionCenters">
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateDcModalVisible(true)}
              >
                新建配送中心
              </Button>
            </div>

            <Table
              columns={dcColumns}
              dataSource={dcList}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane tab="库房管理" key="warehouses">
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Select
                  placeholder="选择配送中心"
                  style={{ width: 200 }}
                  value={selectedDcId || undefined}
                  onChange={(val) => {
                    setSelectedDcId(val);
                    fetchWarehouses(val);
                  }}
                  allowClear
                >
                  {dcList.map((dc) => (
                    <Option key={dc.id} value={dc.id}>
                      {dc.name}
                    </Option>
                  ))}
                </Select>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateWhModalVisible(true)}
                  disabled={!selectedDcId}
                >
                  新建库房
                </Button>
              </Space>
            </div>

            <Table
              columns={whColumns}
              dataSource={warehouseList}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title="新建配送中心"
        open={createDcModalVisible}
        onOk={handleCreateDc}
        onCancel={() => {
          setCreateDcModalVisible(false);
          dcForm.resetFields();
        }}
      >
        <Form form={dcForm} layout="vertical">
          <Form.Item
            name="code"
            label="编码"
            rules={[{ required: true, message: '请输入编码' }]}
          >
            <Input placeholder="请输入编码，如：DC-BJ" />
          </Form.Item>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入名称，如：北京配送中心" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新建库房"
        open={createWhModalVisible}
        onOk={handleCreateWh}
        onCancel={() => {
          setCreateWhModalVisible(false);
          whForm.resetFields();
        }}
      >
        <Form form={whForm} layout="vertical">
          <Form.Item
            name="code"
            label="编码"
            rules={[{ required: true, message: '请输入编码' }]}
          >
            <Input placeholder="请输入编码，如：WH-BJ-01" />
          </Form.Item>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入名称，如：北京朝阳库房" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新建调度配置"
        open={createConfigModalVisible}
        onOk={handleCreateConfig}
        onCancel={() => {
          setCreateConfigModalVisible(false);
          configForm.resetFields();
        }}
        width={700}
      >
        <Form form={configForm} layout="vertical">
          <Form.Item
            name="name"
            label="配置名称"
            rules={[{ required: true, message: '请输入配置名称' }]}
          >
            <Input placeholder="请输入配置名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="distributionCenterId"
                label="配送中心"
              >
                <Select
                  placeholder="请选择（不选则全部）"
                  allowClear
                  onChange={(val) => {
                    configForm.setFieldValue('warehouseId', undefined);
                    fetchWarehouses(val);
                  }}
                >
                  {dcList.map((dc) => (
                    <Option key={dc.id} value={dc.id}>
                      {dc.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="warehouseId" label="库房">
                <Select
                  placeholder="请选择（不选则全部）"
                  allowClear
                  disabled={!warehouseList.length}
                >
                  {warehouseList.map((wh) => (
                    <Option key={wh.id} value={wh.id}>
                      {wh.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="orderType" label="订单类型">
            <Select placeholder="请选择（不选则全部）" allowClear>
              <Option value="SMALL_MEDIUM">中小件</Option>
              <Option value="BULK">大宗</Option>
              <Option value="SELF_PICKUP">自提</Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="minPieceCount" label="最小件数">
                <InputNumber style={{ width: '100%' }} placeholder="不限" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxPieceCount" label="最大件数">
                <InputNumber style={{ width: '100%' }} placeholder="不限" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="minVolume" label="最小体积(m³)">
                <InputNumber style={{ width: '100%' }} step={0.1} placeholder="不限" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxVolume" label="最大体积(m³)">
                <InputNumber style={{ width: '100%' }} step={0.1} placeholder="不限" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="minWeight" label="最小重量(kg)">
                <InputNumber style={{ width: '100%' }} step={0.1} placeholder="不限" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="maxWeight" label="最大重量(kg)">
                <InputNumber style={{ width: '100%' }} step={0.1} placeholder="不限" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isActive" label="状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Config;
