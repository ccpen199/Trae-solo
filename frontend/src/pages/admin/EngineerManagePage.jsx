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
  Avatar
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  RadarChartOutlined,
  ToolOutlined,
  UserOutlined,
  PhoneOutlined,
  StarOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { getEngineers, updateEngineer } from '../../services/engineerService';
import { getEngineerRadar, bindEquipment } from '../../services/adminService';
import ReactECharts from 'echarts-for-react';

const { Title, Text } = Typography;
const { Option } = Select;

const EngineerManagePage = () => {
  const [engineers, setEngineers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({});
  const [radarModalVisible, setRadarModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [radarData, setRadarData] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadEngineers();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadEngineers = async () => {
    setLoading(true);
    try {
      const res = await getEngineers(filters);
      const data = res.data || [];
      const start = (pagination.current - 1) * pagination.pageSize;
      const end = start + pagination.pageSize;
      setEngineers(data.slice(start, end));
      setTotal(data.length);
    } catch (error) {
      message.error('加载工程师列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (engineer) => {
    setSelectedEngineer(engineer);
    setDetailModalVisible(true);
  };

  const handleViewRadar = async (engineer) => {
    setSelectedEngineer(engineer);
    setRadarModalVisible(true);
    try {
      const res = await getEngineerRadar(engineer.id);
      setRadarData(res.data);
    } catch (error) {
      message.error('加载雷达图数据失败');
    }
  };

  const handleBindEquipment = (engineer) => {
    setSelectedEngineer(engineer);
    form.setFieldsValue({ equipmentId: engineer.equipment_id || '' });
    setEquipmentModalVisible(true);
  };

  const handleEquipmentSubmit = async () => {
    try {
      const values = await form.validateFields();
      await bindEquipment(selectedEngineer.id, values.equipmentId);
      message.success('装备绑定成功');
      setEquipmentModalVisible(false);
      loadEngineers();
    } catch (error) {
      message.error('绑定失败');
    }
  };

  const statusMap = {
    0: { text: '离线', color: 'default' },
    1: { text: '空闲', color: 'success' },
    2: { text: '忙碌', color: 'processing' }
  };

  const getLevelName = (level) => {
    const names = ['', '初级', '中级', '高级', '专家', '大师'];
    return names[level] || '未知';
  };

  const radarOption = radarData ? {
    tooltip: {},
    radar: {
      indicator: radarData.indicators.map(i => ({
        name: i.name,
        max: 100
      }))
    },
    series: [{
      type: 'radar',
      data: [{
        value: radarData.indicators.map(i => i.value),
        name: '能力值',
        areaStyle: { color: 'rgba(22, 119, 255, 0.3)' },
        lineStyle: { color: '#1677ff' },
        itemStyle: { color: '#1677ff' }
      }]
    }]
  } : {};

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} src={record.avatar} />
          <Text strong>{text}</Text>
          <Tag color="blue">{getLevelName(record.certificate_level)}</Tag>
        </Space>
      )
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (text) => (
        <Space size="small">
          <PhoneOutlined />
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: '技能',
      key: 'skills',
      render: (_, record) => (
        <Space wrap>
          {record.EngineerSkills && record.EngineerSkills.length > 0 ? (
            record.EngineerSkills.slice(0, 3).map(skill => (
              <Tag key={skill.fault_code} size="small">{skill.fault_code}</Tag>
            ))
          ) : (
            <Text type="secondary">暂无</Text>
          )}
          {record.EngineerSkills && record.EngineerSkills.length > 3 && (
            <Tag size="small">+{record.EngineerSkills.length - 3}</Tag>
          )}
        </Space>
      )
    },
    {
      title: '完成订单数',
      dataIndex: 'total_orders',
      key: 'total_orders',
      sorter: (a, b) => a.total_orders - b.total_orders
    },
    {
      title: '成功率',
      dataIndex: 'success_rate',
      key: 'success_rate',
      render: (text) => <span style={{ color: '#52c41a' }}>{text || 0}%</span>,
      sorter: (a, b) => parseFloat(a.success_rate) - parseFloat(b.success_rate)
    },
    {
      title: '评分',
      dataIndex: 'avg_rating',
      key: 'avg_rating',
      render: (text) => (
        <Space size="small">
          <StarOutlined style={{ color: '#faad14' }} />
          <span>{text || 0}</span>
        </Space>
      ),
      sorter: (a, b) => parseFloat(a.avg_rating) - parseFloat(b.avg_rating)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const s = statusMap[status] || statusMap[0];
        return <Tag color={s.color}>{s.text}</Tag>;
      }
    },
    {
      title: '装备编号',
      dataIndex: 'equipment_id',
      key: 'equipment_id',
      render: (text) => text || <Text type="secondary">未绑定</Text>
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<RadarChartOutlined />}
            onClick={() => handleViewRadar(record)}
          >
            雷达图
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ToolOutlined />}
            onClick={() => handleBindEquipment(record)}
          >
            绑定装备
          </Button>
        </Space>
      )
    }
  ];

  const handleSearch = () => {
    setPagination(p => ({ ...p, current: 1 }));
  };

  return (
    <Card title="工程师管理">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card size="small">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8} md={6}>
              <Input
                placeholder="搜索姓名/电话"
                prefix={<SearchOutlined />}
                onChange={(e) => setFilters(f => ({ ...f, keyword: e.target.value }))}
                onPressEnter={handleSearch}
              />
            </Col>
            <Col xs={24} sm={8} md={4}>
              <Select
                placeholder="状态筛选"
                style={{ width: '100%' }}
                allowClear
                onChange={(v) => setFilters(f => ({ ...f, status: v }))}
              >
                <Option value={1}>空闲</Option>
                <Option value={2}>忙碌</Option>
                <Option value={0}>离线</Option>
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
          dataSource={engineers}
          rowKey="id"
          loading={loading}
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
        title={`${selectedEngineer?.name} 能力雷达图`}
        open={radarModalVisible}
        onCancel={() => setRadarModalVisible(false)}
        footer={null}
        width={600}
      >
        {radarData && (
          <ReactECharts option={radarOption} style={{ height: 400 }} />
        )}
      </Modal>

      <Modal
        title="工程师详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedEngineer && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }} align="center">
                <Avatar size={80} icon={<UserOutlined />} src={selectedEngineer.avatar} />
                <Title level={4} style={{ margin: 0 }}>{selectedEngineer.name}</Title>
                <Space>
                  <Tag color="blue">{getLevelName(selectedEngineer.certificate_level)}</Tag>
                  <Tag color={statusMap[selectedEngineer.status].color}>
                    {statusMap[selectedEngineer.status].text}
                  </Tag>
                </Space>
              </Space>
            </Card>
            <Card size="small" title="详细信息">
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Space>
                  <PhoneOutlined />
                  <Text>{selectedEngineer.phone}</Text>
                </Space>
                <Space>
                  <SafetyOutlined />
                  <Text>证书编号: {selectedEngineer.certificate_no || '暂无'}</Text>
                </Space>
                <Space>
                  <ToolOutlined />
                  <Text>装备编号: {selectedEngineer.equipment_id || '未绑定'}</Text>
                </Space>
                <Space>
                  <StarOutlined style={{ color: '#faad14' }} />
                  <Text>综合评分: {selectedEngineer.avg_rating || 0}</Text>
                </Space>
                <div>
                  <Text type="secondary">技能标签：</Text>
                  <Space wrap style={{ marginTop: 8 }}>
                    {selectedEngineer.EngineerSkills && selectedEngineer.EngineerSkills.map(skill => (
                      <Tag key={skill.fault_code}>{skill.fault_code}</Tag>
                    ))}
                  </Space>
                </div>
              </Space>
            </Card>
          </Space>
        )}
      </Modal>

      <Modal
        title="绑定装备"
        open={equipmentModalVisible}
        onCancel={() => setEquipmentModalVisible(false)}
        onOk={handleEquipmentSubmit}
        okText="确认绑定"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="equipmentId"
            label="装备编号"
            rules={[{ required: true, message: '请输入装备编号' }]}
          >
            <Input placeholder="请输入装备编号" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default EngineerManagePage;
