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
  Descriptions
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { getFaults, createFault, updateFault } from '../../services/faultService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const FaultLibraryPage = () => {
  const [faults, setFaults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFault, setEditingFault] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadFaults();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadFaults = async () => {
    setLoading(true);
    try {
      const res = await getFaults(filters);
      let data = res.data || [];
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        data = data.filter(f =>
          f.name.toLowerCase().includes(keyword) ||
          f.code.toLowerCase().includes(keyword) ||
          f.description?.toLowerCase().includes(keyword)
        );
      }
      if (filters.deviceType) {
        data = data.filter(f => f.device_type === filters.deviceType);
      }
      const start = (pagination.current - 1) * pagination.pageSize;
      const end = start + pagination.pageSize;
      setFaults(data.slice(start, end));
      setTotal(data.length);
    } catch (error) {
      message.error('加载故障列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingFault(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (fault) => {
    setEditingFault(fault);
    const symptoms = fault.symptoms ? JSON.parse(fault.symptoms) : [];
    const diagnosisSteps = fault.diagnosis_steps ? JSON.parse(fault.diagnosis_steps) : [];
    const solution = fault.solution ? JSON.parse(fault.solution) : { steps: [] };
    form.setFieldsValue({
      ...fault,
      symptoms: symptoms.join('\n'),
      diagnosis_steps: diagnosisSteps.join('\n'),
      solution_steps: solution.steps?.join('\n') || ''
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const symptoms = values.symptoms ? values.symptoms.split('\n').filter(s => s.trim()) : [];
      const diagnosisSteps = values.diagnosis_steps ? values.diagnosis_steps.split('\n').filter(s => s.trim()) : [];
      const solutionSteps = values.solution_steps ? values.solution_steps.split('\n').filter(s => s.trim()) : [];
      
      const data = {
        code: values.code,
        name: values.name,
        device_type: values.device_type,
        description: values.description,
        symptoms: JSON.stringify(symptoms),
        estimated_hours: values.estimated_hours,
        estimated_cost: values.estimated_cost,
        solution: JSON.stringify({ steps: solutionSteps }),
        difficulty: values.difficulty
      };

      if (editingFault) {
        await updateFault(editingFault.id, data);
        message.success('更新成功');
      } else {
        await createFault(data);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadFaults();
    } catch (error) {
      message.error(editingFault ? '更新失败' : '创建失败');
    }
  };

  const parseJSON = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  const parseSolution = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return { steps: [] };
    }
  };

  const deviceTypes = ['手机', '平板', '笔记本', '智能手表', '耳机', '其他'];

  const columns = [
    {
      title: '症状代码',
      dataIndex: 'code',
      key: 'code',
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '设备类型',
      dataIndex: 'device_type',
      key: 'device_type',
      render: (text) => <Tag>{text}</Tag>
    },
    {
      title: '故障名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '置信度权重',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (text) => {
        const level = parseInt(text) || 2;
        const colors = ['#52c41a', '#1677ff', '#faad14', '#f5222d', '#722ed1'];
        const names = ['极低', '低', '中', '高', '极高'];
        return <Tag color={colors[level - 1] || 'default'}>{names[level - 1] || '中'}</Tag>;
      }
    },
    {
      title: '平均维修费用',
      dataIndex: 'estimated_cost',
      key: 'estimated_cost',
      render: (text) => <span style={{ color: '#faad14' }}>¥{text || 0}</span>
    },
    {
      title: '平均工时',
      dataIndex: 'estimated_hours',
      key: 'estimated_hours',
      render: (text) => <span>{text || 0}小时</span>
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
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        </Space>
      )
    }
  ];

  const expandedRowRender = (record) => {
    const symptoms = parseJSON(record.symptoms);
    const diagnosisSteps = parseJSON(record.diagnosis_steps);
    const solution = parseSolution(record.solution);

    return (
      <Descriptions column={1} size="small">
        <Descriptions.Item label="症状关键词">
          <Space wrap>
            {symptoms.length > 0 ? (
              symptoms.map((s, i) => <Tag key={i}>{s}</Tag>)
            ) : (
              <Text type="secondary">暂无</Text>
            )}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="诊断树步骤">
          {diagnosisSteps.length > 0 ? (
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              {diagnosisSteps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          ) : (
            <Text type="secondary">暂无</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="维修方案">
          {solution.steps && solution.steps.length > 0 ? (
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              {solution.steps.map((step, i) => <li key={i}>{step}</li>)}
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
      title="故障库管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增故障
        </Button>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card size="small">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8} md={6}>
              <Input
                placeholder="搜索代码/名称"
                prefix={<SearchOutlined />}
                onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
                onPressEnter={handleSearch}
              />
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Select
                placeholder="设备类型"
                style={{ width: '100%' }}
                allowClear
                onChange={(v) => setFilters(f => ({ ...f, deviceType: v }))}
              >
                {deviceTypes.map(type => (
                  <Option key={type} value={type}>{type}</Option>
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
          dataSource={faults}
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
        title={editingFault ? '编辑故障' : '新增故障'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText={editingFault ? '确认更新' : '确认创建'}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="症状代码"
                rules={[{ required: true, message: '请输入症状代码' }]}
              >
                <Input placeholder="例如：BAT001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="device_type"
                label="设备类型"
                rules={[{ required: true, message: '请选择设备类型' }]}
              >
                <Select placeholder="请选择">
                  {deviceTypes.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="name"
            label="故障名称"
            rules={[{ required: true, message: '请输入故障名称' }]}
          >
            <Input placeholder="请输入故障名称" />
          </Form.Item>
          <Form.Item
            name="description"
            label="故障描述"
          >
            <TextArea rows={2} placeholder="请输入故障描述" />
          </Form.Item>
          <Form.Item
            name="symptoms"
            label="症状关键词"
            help="每行一个关键词"
          >
            <TextArea rows={3} placeholder="例如：&#10;电池耗电快&#10;充电发热&#10;无法开机" />
          </Form.Item>
          <Form.Item
            name="diagnosis_steps"
            label="诊断树步骤"
            help="每行一个步骤"
          >
            <TextArea rows={3} placeholder="例如：&#10;检查电池健康度&#10;测试充电接口&#10;检测主板漏电" />
          </Form.Item>
          <Form.Item
            name="solution_steps"
            label="维修方案步骤"
            help="每行一个步骤"
          >
            <TextArea rows={3} placeholder="例如：&#10;更换电池&#10;清理充电接口&#10;主板维修" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="estimated_hours"
                label="平均工时(小时)"
                rules={[{ required: true, message: '请输入平均工时' }]}
              >
                <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="estimated_cost"
                label="平均维修费用(元)"
                rules={[{ required: true, message: '请输入平均费用' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="difficulty"
                label="置信度权重"
                rules={[{ required: true, message: '请选择权重' }]}
              >
                <Select>
                  <Option value={1}>极低</Option>
                  <Option value={2}>低</Option>
                  <Option value={3}>中</Option>
                  <Option value={4}>高</Option>
                  <Option value={5}>极高</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  );
};

export default FaultLibraryPage;
