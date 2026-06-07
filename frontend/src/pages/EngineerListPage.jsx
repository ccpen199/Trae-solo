import React, { useEffect, useState } from 'react';
import {
  Card,
  List,
  Avatar,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Progress,
  Statistic,
  Typography,
  message,
  Input,
  Select
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  ToolOutlined,
  StarOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { getEngineers } from '../services/engineerService';
import { getEngineerRadar } from '../services/adminService';
import ReactECharts from 'echarts-for-react';

const { Text, Title } = Typography;
const { Option } = Select;

const EngineerListPage = () => {
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [radarData, setRadarData] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  useEffect(() => {
    loadEngineers();
  }, [filterStatus]);

  const loadEngineers = async () => {
    setLoading(true);
    try {
      const res = await getEngineers(filterStatus !== null ? { status: filterStatus } : {});
      setEngineers(res.data || []);
    } catch (error) {
      message.error('加载工程师列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEngineer = async (engineer) => {
    setSelectedEngineer(engineer);
    try {
      const res = await getEngineerRadar(engineer.id);
      setRadarData(res.data);
    } catch (error) {
      console.error('Failed to load radar data:', error);
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
    title: {
      text: `${radarData.name} 能力雷达图`,
      left: 'center',
      textStyle: { fontSize: 14 }
    },
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

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Title level={3} style={{ margin: 0 }}>工程师管理</Title>
        <Space>
          <Select
            placeholder="状态筛选"
            style={{ width: 120 }}
            allowClear
            value={filterStatus}
            onChange={setFilterStatus}
          >
            <Option value={1}>空闲</Option>
            <Option value={2}>忙碌</Option>
            <Option value={0}>离线</Option>
          </Select>
          <Input
            placeholder="搜索工程师"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
          />
        </Space>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="工程师列表" loading={loading}>
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 2 }}
              dataSource={engineers}
              renderItem={(engineer) => {
                const status = statusMap[engineer.status] || statusMap[0];
                const isSelected = selectedEngineer?.id === engineer.id;
                
                return (
                  <List.Item>
                    <Card
                      size="small"
                      className={`engineer-card ${isSelected ? 'selected' : ''}`}
                      hoverable
                      onClick={() => handleSelectEngineer(engineer)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Space>
                            <Avatar size="large" icon={<UserOutlined />} src={engineer.avatar} />
                            <div>
                              <Space>
                                <Text strong>{engineer.name}</Text>
                                <Tag color="blue">{getLevelName(engineer.certificate_level)}</Tag>
                              </Space>
                              <Space size="small" style={{ fontSize: 12 }}>
                                <PhoneOutlined />
                                <Text type="secondary">{engineer.phone}</Text>
                              </Space>
                            </div>
                          </Space>
                          <Tag color={status.color}>{status.text}</Tag>
                        </Space>

                        <Row gutter={8}>
                          <Col span={8}>
                            <Statistic
                              title={<Text type="secondary" style={{ fontSize: 12 }}>完成订单</Text>}
                              value={engineer.total_orders || 0}
                              valueStyle={{ fontSize: 16 }}
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic
                              title={<Text type="secondary" style={{ fontSize: 12 }}>成功率</Text>}
                              value={engineer.success_rate || 0}
                              suffix="%"
                              valueStyle={{ fontSize: 16, color: '#52c41a' }}
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic
                              title={<Text type="secondary" style={{ fontSize: 12 }}>评分</Text>}
                              value={engineer.avg_rating || 0}
                              valueStyle={{ fontSize: 16, color: '#faad14' }}
                              prefix={<StarOutlined />}
                            />
                          </Col>
                        </Row>

                        <Space direction="vertical" size={0} style={{ width: '100%' }}>
                          <Space size="small">
                            <SafetyCertificateOutlined />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              证书: {engineer.certificate_no || '暂无'}
                            </Text>
                          </Space>
                          <Space size="small">
                            <ToolOutlined />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              装备: {engineer.equipment_id || '未绑定'}
                            </Text>
                          </Space>
                          <Space size="small">
                            <EnvironmentOutlined />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              服务半径: {engineer.service_radius || 10}km
                            </Text>
                          </Space>
                        </Space>

                        {engineer.EngineerSkills && engineer.EngineerSkills.length > 0 && (
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>技能标签：</Text>
                            <Space wrap style={{ marginTop: 4 }}>
                              {engineer.EngineerSkills.slice(0, 5).map(skill => (
                                <Tag key={skill.fault_code} size="small">
                                  {skill.fault_code}
                                </Tag>
                              ))}
                            </Space>
                          </div>
                        )}
                      </Space>
                    </Card>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="工程师详情">
            {selectedEngineer ? (
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

                {radarData && (
                  <div className="radar-chart-container">
                    <ReactECharts option={radarOption} style={{ height: '100%' }} />
                  </div>
                )}

                <Card size="small" title="详细信息">
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Space>
                      <PhoneOutlined />
                      <Text>{selectedEngineer.phone}</Text>
                    </Space>
                    <Space>
                      <SafetyCertificateOutlined />
                      <Text>证书编号: {selectedEngineer.certificate_no}</Text>
                    </Space>
                    <Space>
                      <ToolOutlined />
                      <Text>装备编号: {selectedEngineer.equipment_id}</Text>
                    </Space>
                    <Space>
                      <EnvironmentOutlined />
                      <Text>服务半径: {selectedEngineer.service_radius}km</Text>
                    </Space>
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>维修成功率</Text>
                      <Progress percent={parseFloat(selectedEngineer.success_rate)} />
                    </Space>
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>综合评分</Text>
                      <Progress percent={parseFloat(selectedEngineer.avg_rating) * 20} />
                    </Space>
                  </Space>
                </Card>
              </Space>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <UserOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <Text type="secondary">请选择一位工程师查看详情</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default EngineerListPage;
