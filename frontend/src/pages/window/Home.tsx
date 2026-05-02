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
  Empty,
} from 'antd';
import {
  NumberOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RightOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { windowApi } from '../../api';

export const WindowHome: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    today_total: 0,
    today_completed: 0,
    today_pending: 0,
  });
  const [todayCases, setTodayCases] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      setStats({
        today_total: 0,
        today_completed: 0,
        today_pending: 0,
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
          <h2 style={{ marginBottom: 24, marginTop: 0 }}>窗口工作台</h2>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic
              title="今日总号"
              value={stats.today_total}
              prefix={<NumberOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.today_completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="待办理"
              value={stats.today_pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card
            title="今日办件"
            extra={
              <Button type="link" onClick={() => navigate('/window/queue')}>
                进入叫号系统 <RightOutlined />
              </Button>
            }
          >
            <Empty description="请前往叫号系统查看今日办件列表" />
          </Card>
        </Col>
      </Row>
    </Spin>
  );
};
