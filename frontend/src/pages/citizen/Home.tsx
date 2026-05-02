import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Statistic, List, Tag, Button, Spin, message } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StarOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { caseApi, serviceItemApi } from '../../api';

export const CitizenHome: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    evaluated: 0,
  });
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [casesRes, servicesRes] = await Promise.all([
        caseApi.getMy(),
        serviceItemApi.getAll(),
      ]);

      const cases = casesRes.data || [];
      setRecentCases(cases.slice(0, 5));

      const pending = cases.filter(
        (c: any) =>
          !['COMPLETED', 'EVALUATED', 'CANCELLED'].includes(c.status)
      ).length;
      const completed = cases.filter((c: any) => c.status === 'COMPLETED')
        .length;
      const evaluated = cases.filter((c: any) => c.status === 'EVALUATED')
        .length;

      setStats({
        total: cases.length,
        pending,
        completed,
        evaluated,
      });

      setServices(servicesRes.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      DRAFT: { color: 'default', text: '草稿' },
      MATERIAL_SUBMITTED: { color: 'blue', text: '材料已提交' },
      OCR_PROCESSING: { color: 'processing', text: 'OCR处理中' },
      MATERIAL_PRE_REVIEW: { color: 'orange', text: '审核中' },
      MATERIAL_REJECTED: { color: 'red', text: '需补正' },
      MATERIAL_APPROVED: { color: 'green', text: '审核通过' },
      RESERVATION_AVAILABLE: { color: 'blue', text: '可预约' },
      RESERVED: { color: 'cyan', text: '已预约' },
      CHECKED_IN: { color: 'purple', text: '已取号' },
      PROCESSING: { color: 'processing', text: '办理中' },
      COMPLETED: { color: 'success', text: '已办结' },
      EVALUATED: { color: 'green', text: '已评价' },
      CANCELLED: { color: 'default', text: '已取消' },
    };

    const cfg = statusMap[status] || { color: 'default', text: status };
    return <Tag color={cfg.color}>{cfg.text}</Tag>;
  };

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <h2 style={{ marginBottom: 24, marginTop: 0 }}>欢迎使用政务办事预约系统</h2>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic
              title="总办件数"
              value={stats.total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待办理"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已办结"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已评价"
              value={stats.evaluated}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title="最近办件"
            extra={
              <Button type="link" onClick={() => navigate('/citizen/cases')}>
                查看全部 <RightOutlined />
              </Button>
            }
          >
            {recentCases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                暂无办件记录
              </div>
            ) : (
              <List
                dataSource={recentCases}
                renderItem={(item: any) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        onClick={() => navigate(`/citizen/cases/${item.id}`)}
                      >
                        查看详情
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <span>
                          {item.service_item_name}
                          <span style={{ marginLeft: 8 }}>
                            {getStatusTag(item.status)}
                          </span>
                        </span>
                      }
                      description={`办件编号: ${item.case_number} | ${new Date(
                        item.created_at
                      ).toLocaleString()}`}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title="快捷办事"
            extra={
              <Button type="link" onClick={() => navigate('/citizen/services')}>
                更多事项 <RightOutlined />
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              {services.slice(0, 4).map((service: any) => (
                <Col span={12} key={service.id}>
                  <Card
                    hoverable
                    size="small"
                    onClick={() => {
                      navigate('/citizen/services');
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{service.item_name}</div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      {service.department}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </Spin>
  );
};
