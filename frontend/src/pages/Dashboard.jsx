import { Card, Row, Col, Statistic, message } from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthContext();

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        const response = await api.get('/common/statistics');
        setStatistics(response.data);
      } catch (error) {
        message.error('加载统计数据失败');
      } finally {
        setLoading(false);
      }
    };
    loadStatistics();
  }, []);

  const myCards = [
    {
      title: '待处理',
      value: statistics.my_pending,
      icon: <ClockCircleOutlined style={{ color: '#1890ff' }} />,
      onClick: () => navigate('/applications'),
    },
    {
      title: '已通过',
      value: statistics.my_approved,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      onClick: () => navigate('/applications?status=approved'),
    },
    {
      title: '已驳回',
      value: statistics.my_rejected,
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      onClick: () => navigate('/applications?status=rejected'),
    },
  ];

  const approverCards = [
    {
      title: '待我审批',
      value: statistics.to_approve,
      icon: <FileTextOutlined style={{ color: '#1890ff' }} />,
      onClick: () => navigate('/approval'),
    },
  ];

  const financeCards = [
    {
      title: '待我复核',
      value: statistics.to_review,
      icon: <FileTextOutlined style={{ color: '#1890ff' }} />,
      onClick: () => navigate('/finance'),
    },
  ];

  const ccCard = {
    title: '抄送给我',
    value: statistics.cc_count,
    icon: <CopyOutlined style={{ color: '#fa8c16' }} />,
    onClick: () => navigate('/cc'),
  };

  return (
    <div>
      <h2>欢迎回来，{user?.name}</h2>
      <p style={{ color: '#666' }}>您当前的角色是: {user?.role}</p>
      
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {myCards.map((card, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <Card hoverable onClick={card.onClick} style={{ cursor: 'pointer' }}>
              <Statistic
                title={card.title}
                value={card.value}
                prefix={card.icon}
              />
            </Card>
          </Col>
        ))}

        {(user?.role === 'approver' || user?.role === 'admin') && 
          approverCards.map((card, index) => (
            <Col xs={24} sm={12} md={8} key={`approver-${index}`}>
              <Card hoverable onClick={card.onClick} style={{ cursor: 'pointer' }}>
                <Statistic
                  title={card.title}
                  value={card.value}
                  prefix={card.icon}
                />
              </Card>
            </Col>
          ))
        }

        {(user?.role === 'finance' || user?.role === 'admin') && 
          financeCards.map((card, index) => (
            <Col xs={24} sm={12} md={8} key={`finance-${index}`}>
              <Card hoverable onClick={card.onClick} style={{ cursor: 'pointer' }}>
                <Statistic
                  title={card.title}
                  value={card.value}
                  prefix={card.icon}
                />
              </Card>
            </Col>
          ))
        }

        <Col xs={24} sm={12} md={8}>
          <Card hoverable onClick={ccCard.onClick} style={{ cursor: 'pointer' }}>
            <Statistic
              title={ccCard.title}
              value={ccCard.value}
              prefix={ccCard.icon}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title="快速操作">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a onClick={() => navigate('/application/create')} style={{ fontSize: 16, color: '#1890ff' }}>
                发起报销申请
              </a>
              <a onClick={() => navigate('/applications')} style={{ fontSize: 16, color: '#1890ff' }}>
                查看我的申请
              </a>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="审批流程说明">
            <div style={{ color: '#666' }}>
              <p>1. 员工提交报销申请，指定审批人和抄送人</p>
              <p>2. 业务员进行审批，可通过或驳回</p>
              <p>3. 审批通过后进入财务复核</p>
              <p>4. 财务复核通过后可归档</p>
              <p>5. 被驳回的申请可修改后重新提交</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
