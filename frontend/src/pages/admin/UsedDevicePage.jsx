import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Row,
  Col,
  message,
  Modal,
  Form,
  InputNumber,
  Typography,
  Descriptions,
  Rate
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  SwapOutlined,
  MobileOutlined
} from '@ant-design/icons';
import { getUsedDevices, createUsedDevice, updateUsedDevice } from '../../services/adminService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const UsedDevicePage = () => {
  const [devices, setDevices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [valueModalVisible, setValueModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [valuingDevice, setValuingDevice] = useState(null);
  const [statusingDevice, setStatusingDevice] = useState(null);
  const [form] = Form.useForm();
  const [valueForm] = Form.useForm();
  const [statusForm] = Form.useForm();

  useEffect(() => {
    loadDevices();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await getUsedDevices();
      let data = res.data || [];
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        data = data.filter(d =>
          d.device_model.toLowerCase().includes(keyword) ||
          d.imei?.toLowerCase().includes(keyword)
        );
      }
      if (filters.status !== undefined && filters.status !== null) {
        data = data.filter(d => d.status === filters.status);
      }
      const start = (pagination.current - 1) * pagination.pageSize;
      const end = start + pagination.pageSize;
      setDevices(data.slice(start, end));
      setTotal(data.length);
    } catch (error) {
      message.error('加载二手机列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingDevice(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleValueAdjust = (device) => {
    setValuingDevice(device);
    valueForm.setFieldsValue({ estimated_value: device.estimated_value });
    setValueModalVisible(true);
  };

  const handleStatusChange = (device) => {
    setStatusingDevice(device);
    statusForm.setFieldsValue({ status: device.status });
    setStatusModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const ocrReport = values.ocr_report ? values.ocr_report.split('\n').filter(s => s.trim()) : [];
      const valuationParams = values.valuation_params ? values.valuation_params.split('\n').filter(s => s.trim()) : [];
      const refurbishmentLog = values.refurbishment_log ? values.refurbishment_log.split('\n').filter(s => s.trim()) : [];

      const data = {
        device_model: values.device_model,
        imei: values.imei,
        purchase_price: values.purchase_price || 0,
        appearance_rating: values.appearance_rating || 3,
        ocr_report: JSON.stringify(ocrReport),
        valuation_params: JSON.stringify(valuationParams),
        refurbishment_log: JSON.stringify(refurbishmentLog),
        estimated_value: values.estimated_value || 0,
        status: values.status || 0
      };

      await createUsedDevice(data);
      message.success('创建设备成功');
      setModalVisible(false);
      loadDevices();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleValueSubmit = async () => {
    try {
      const values = await valueForm.validateFields();
      await updateUsedDevice(valuingDevice.id, { estimated_value: values.estimated_value });
      message.success('估价调整成功');
      setValueModalVisible(false);
      loadDevices();
    } catch (error) {
      message.error('调整失败');
    }
  };

  const handleStatusSubmit = async () => {
    try {
      const values = await statusForm.validateFields();
      await updateUsedDevice(statusingDevice.id, { status: values.status });
      message.success('状态更新成功');
      setStatusModalVisible(false);
      loadDevices();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const parseJSON = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  const appearanceMap = {
    1: { text: '99新', color: 'success' },
    2: { text: '95新', color: 'blue' },
    3: { text: '9成新', color: 'default' },
    4: { text: '8成新', color: 'warning' },
    5: { text: '明显使用痕迹', color: 'error' }
  };

  const statusMap = {
    0: { text: '待质检', color: 'default' },
    1: { text: '质检中', color: 'processing' },
    2: { text: '待翻新', color: 'warning' },
    3: { text: '翻新中', color: 'processing' },
    4: { text: '可销售', color: 'success' },
    5: { text: '已售出', color: 'default' }
  };

  const columns = [
    {
      title: '设备型号',
      dataIndex: 'device_model',
      key: 'device_model',
      render: (text) => (
        <Space>
          <MobileOutlined />
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: 'IMEI',
      dataIndex: 'imei',
      key: 'imei',
      render: (text) => text || <Text type="secondary">未录入</Text>
    },
    {
      title: '成色',
      dataIndex: 'appearance_rating',
      key: 'appearance_rating',
      render: (rating) => {
        const a = appearanceMap[rating] || appearanceMap[3];
        return <Tag color={a.color}>{a.text}</Tag>;
      }
    },
    {
      title: '质检分数',
      dataIndex: 'appearance_rating',
      key: 'quality_score',
      render: (rating) => (
        <Space>
          <Rate disabled value={6 - rating} />
          <Text>{6 - rating}.0</Text>
        </Space>
      )
    },
    {
      title: '估价',
      dataIndex: 'estimated_value',
      key: 'estimated_value',
      render: (text) => <span style={{ color: '#faad14', fontWeight: 'bold' }}>¥{text || 0}</span>
    },
    {
      title: '翻新状态',
      key: 'refurbish_status',
      render: (_, record) => {
        const log = parseJSON(record.refurbishment_log);
        return log.length > 0 ? <Tag color="success">已翻新</Tag> : <Tag color="default">未翻新</Tag>;
      }
    },
    {
      title: '库存状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const s = statusMap[status] || statusMap[0];
        return <Tag color={s.color}>{s.text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleValueAdjust(record)}
          >
            估价调整
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SwapOutlined />}
            onClick={() => handleStatusChange(record)}
          >
            状态流转
          </Button>
        </Space>
      )
    }
  ];

  const expandedRowRender = (record) => {
    const ocrReport = parseJSON(record.ocr_report);
    const valuationParams = parseJSON(record.valuation_params);
    const refurbishmentLog = parseJSON(record.refurbishment_log);

    return (
      <Descriptions column={1} size="small">
        <Descriptions.Item label="质检报告OCR结果">
          {ocrReport.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {ocrReport.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          ) : (
            <Text type="secondary">暂无</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="估价模型参数">
          {valuationParams.length > 0 ? (
            <Space wrap>
              {valuationParams.map((param, i) => <Tag key={i}>{param}</Tag>)}
            </Space>
          ) : (
            <Text type="secondary">暂无</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="翻新工艺记录">
          {refurbishmentLog.length > 0 ? (
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              {refurbishmentLog.map((log, i) => <li key={i}>{log}</li>)}
            </ol>
          ) : (
            <Text type="secondary">暂无</Text>
          )}
        </Descriptions.Item>
      </Descriptions>
    );
  };

  const handleSearch = () => {
    setPagination(p => ({ ...p, current: 1 }));
  };

  return (
    <Card
      title="二手机库存管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增设备
        </Button>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card size="small">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8} md={6}>
              <Input
                placeholder="搜索型号/IMEI"
                prefix={<SearchOutlined />}
                onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
                onPressEnter={handleSearch}
              />
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Select
                placeholder="库存状态"
                style={{ width: '100%' }}
                allowClear
                onChange={(v) => setFilters(f => ({ ...f, status: v }))}
              >
                {Object.entries(statusMap).map(([key, val]) => (
                  <Option key={key} value={parseInt(key)}>{val.text}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={8} md={14}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  搜索
                </Button>
                <Button onClick={() => { setFilters({}); handleSearch(); }}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <Table
          columns={columns}
          dataSource={devices}
          rowKey="id"
          loading={loading}
          expandable={{ expandedRowRender }}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize })
          }}
        />
      </Space>

      <Modal
        title="新增设备"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText="确认创建"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="device_model"
                label="设备型号"
                rules={[{ required: true, message: '请输入设备型号' }]}
              >
                <Input placeholder="例如：iPhone 14 Pro" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="imei"
                label="IMEI"
              >
                <Input placeholder="请输入IMEI码" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="purchase_price"
                label="收购价格(元)"
                rules={[{ required: true, message: '请输入收购价格' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="estimated_value"
                label="预估价(元)"
                rules={[{ required: true, message: '请输入预估价' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="appearance_rating"
                label="成色评级"
                rules={[{ required: true, message: '请选择成色' }]}
              >
                <Select>
                  <Option value={1}>99新</Option>
                  <Option value={2}>95新</Option>
                  <Option value={3}>9成新</Option>
                  <Option value={4}>8成新</Option>
                  <Option value={5}>明显使用痕迹</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="ocr_report"
            label="质检报告OCR结果"
            help="每行一条记录"
          >
            <TextArea rows={3} placeholder="例如：&#10;屏幕无划痕&#10;电池健康度92%&#10;机身无弯曲" />
          </Form.Item>
          <Form.Item
            name="valuation_params"
            label="估价模型参数"
            help="每行一个参数"
          >
            <TextArea rows={3} placeholder="例如：&#10;内存:256GB&#10;颜色:远峰蓝&#10;保修期:剩余120天" />
          </Form.Item>
          <Form.Item
            name="refurbishment_log"
            label="翻新工艺记录"
            help="每行一条记录"
          >
            <TextArea rows={3} placeholder="例如：&#10;更换原装电池&#10;屏幕抛光处理&#10;深度清洁消毒" />
          </Form.Item>
          <Form.Item
            name="status"
            label="初始状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              {Object.entries(statusMap).map(([key, val]) => (
                <Option key={key} value={parseInt(key)}>{val.text}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="估价调整"
        open={valueModalVisible}
        onCancel={() => setValueModalVisible(false)}
        onOk={handleValueSubmit}
        okText="确认调整"
      >
        {valuingDevice && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space justify="space-between" style={{ width: '100%' }}>
                  <Text type="secondary">设备型号</Text>
                  <Text strong>{valuingDevice.device_model}</Text>
                </Space>
                <Space justify="space-between" style={{ width: '100%' }}>
                  <Text type="secondary">当前估价</Text>
                  <Text strong style={{ color: '#faad14' }}>¥{valuingDevice.estimated_value || 0}</Text>
                </Space>
                <Space justify="space-between" style={{ width: '100%' }}>
                  <Text type="secondary">收购价格</Text>
                  <Text>¥{valuingDevice.purchase_price || 0}</Text>
                </Space>
              </Space>
            </Card>
            <Form form={valueForm} layout="vertical">
              <Form.Item
                name="estimated_value"
                label="调整后估价(元)"
                rules={[{ required: true, message: '请输入估价' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>

      <Modal
        title="状态流转"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        onOk={handleStatusSubmit}
        okText="确认更新"
      >
        {statusingDevice && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space justify="space-between" style={{ width: '100%' }}>
                  <Text type="secondary">设备型号</Text>
                  <Text strong>{statusingDevice.device_model}</Text>
                </Space>
                <Space justify="space-between" style={{ width: '100%' }}>
                  <Text type="secondary">当前状态</Text>
                  <Tag color={statusMap[statusingDevice.status]?.color || 'default'}>
                    {statusMap[statusingDevice.status]?.text || '未知'}
                  </Tag>
                </Space>
                <Space justify="space-between" style={{ width: '100%' }}>
                  <Text type="secondary">IMEI</Text>
                  <Text>{statusingDevice.imei || '未录入'}</Text>
                </Space>
              </Space>
            </Card>
            <Form form={statusForm} layout="vertical">
              <Form.Item
                name="status"
                label="目标状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  {Object.entries(statusMap).map(([key, val]) => (
                    <Option key={key} value={parseInt(key)}>{val.text}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>
    </Card>
  );
};

export default UsedDevicePage;
