import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Modal,
  Spin,
  message,
  Descriptions,
  Divider,
  List,
} from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { serviceItemApi, caseApi } from '../../api';

export const ServiceItemsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const response = await serviceItemApi.getAll();
      setServices(response.data || []);
    } catch (error) {
      message.error('加载服务事项失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async (service: any) => {
    setCreateLoading(true);
    try {
      const response = await caseApi.create({ service_item_id: service.id });
      message.success('办件创建成功');
      navigate(`/citizen/cases/${response.data.id}`);
    } catch (error: any) {
      message.error(error.response?.data?.detail || '创建办件失败');
    } finally {
      setCreateLoading(false);
      setDetailVisible(false);
    }
  };

  const handleViewDetail = (service: any) => {
    setSelectedService(service);
    setDetailVisible(true);
  };

  const getLevelTag = (level: string) => {
    const colorMap: Record<string, string> = {
      IMMEDIATE: 'green',
      PROMISE: 'blue',
      COMPLEX: 'orange',
    };
    const textMap: Record<string, string> = {
      IMMEDIATE: '即办件',
      PROMISE: '承诺件',
      COMPLEX: '复杂件',
    };
    return (
      <Tag color={colorMap[level] || 'default'}>
        {textMap[level] || level}
      </Tag>
    );
  };

  return (
    <Spin spinning={loading}>
      <h2 style={{ marginBottom: 24, marginTop: 0 }}>办事大厅</h2>

      <Row gutter={[16, 16]}>
        {services.map((service) => (
          <Col span={12} key={service.id}>
            <Card
              hoverable
              actions={[
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewDetail(service)}
                >
                  查看详情
                </Button>,
                <Button
                  type="link"
                  icon={<PlusOutlined />}
                  onClick={() => handleCreateCase(service)}
                  loading={createLoading}
                >
                  立即办理
                </Button>,
              ]}
            >
              <Card.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{service.item_name}</span>
                    {getLevelTag(service.service_level)}
                  </div>
                }
                description={
                  <div style={{ marginTop: 8 }}>
                    <div>
                      <span style={{ color: '#666' }}>主办部门：</span>
                      {service.department}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <span style={{ color: '#666' }}>办理时限：</span>
                      {service.processing_days}个工作日
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <span style={{ color: '#666' }}>事项类型：</span>
                      {service.item_type}
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title="服务事项详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
          <Button
            key="create"
            type="primary"
            loading={createLoading}
            onClick={() => selectedService && handleCreateCase(selectedService)}
          >
            立即办理
          </Button>,
        ]}
        width={700}
      >
        {selectedService && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="事项名称" span={2}>
                {selectedService.item_name}
              </Descriptions.Item>
              <Descriptions.Item label="事项编码">
                {selectedService.item_code}
              </Descriptions.Item>
              <Descriptions.Item label="事项类型">
                {selectedService.item_type}
              </Descriptions.Item>
              <Descriptions.Item label="主办部门">
                {selectedService.department}
              </Descriptions.Item>
              <Descriptions.Item label="服务层级">
                {getLevelTag(selectedService.service_level)}
              </Descriptions.Item>
              <Descriptions.Item label="办理时限">
                {selectedService.processing_days}个工作日
              </Descriptions.Item>
              <Descriptions.Item label="窗口数量">
                {selectedService.window_count}个
              </Descriptions.Item>
              <Descriptions.Item label="每日预约配额">
                {selectedService.daily_quota}个
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div>
              <h4>办理依据</h4>
              <p style={{ color: '#666' }}>{selectedService.legal_basis}</p>
            </div>

            <Divider />

            <div>
              <h4>申请条件</h4>
              <p style={{ color: '#666' }}>{selectedService.application_conditions}</p>
            </div>

            <Divider />

            <div>
              <h4>所需材料</h4>
              <List
                size="small"
                bordered
                dataSource={selectedService.material_requirements}
                renderItem={(item: any, index: number) => (
                  <List.Item>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>
                        {index + 1}. {item.material_name}
                      </div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        {item.description} | 必要性: {item.required ? '必需' : '非必需'} |
                        份数: {item.copies}
                      </div>
                      {item.sample_template_url && (
                        <Tag color="blue" style={{ marginTop: 4 }}>
                          有样表模板
                        </Tag>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </div>
        )}
      </Modal>
    </Spin>
  );
};
