import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Statistic,
  List,
  Tag,
  Button,
  Spin,
  message,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { auditApi } from '../../api';

export const AuditorHome: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [pendingCases, setPendingCases] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await auditApi.getPending();
      const cases = response.data || [];
      setPendingCases(cases.slice(0, 5));
      setStats({
        pending: cases.length,
        approved: 0,
        rejected: 0,
      });
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <h2 style={{ marginBottom: 24, marginTop: 0 }}>审核工作台</h2>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic
              title="待审核"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已通过"
              value={stats.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已驳回"
              value={stats.rejected}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card
            title="待审核办件列表"
            extra={
              <Button type="link" onClick={() => navigate('/auditor/review')}>
                查看全部 <RightOutlined />
              </Button>
            }
          >
            {pendingCases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                暂无待审核办件
              </div>
            ) : (
              <List
                dataSource={pendingCases}
                renderItem={(item: any) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/auditor/review/${item.id}`)}
                      >
                        审核
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <span>
                          {item.service_item_name}
                          <Tag color="orange" style={{ marginLeft: 8 }}>
                            待审核
                          </Tag>
                        </span>
                      }
                      description={`办件编号: ${item.case_number} | 申请人: ${
                        item.applicant_name || '未知'
                      } | 提交时间: ${new Date(item.created_at).toLocaleString()}`}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </Spin>
  );
};
