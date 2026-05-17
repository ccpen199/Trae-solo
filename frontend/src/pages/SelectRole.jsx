import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Input, message, Typography, Row, Col } from 'antd';
import { UserOutlined, SolutionOutlined } from '@ant-design/icons';
import { selectRole, setToken, setUser } from '../api/user';

const { Title, Text } = Typography;

const SelectRole = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRole) {
      message.warning('请选择您的身份');
      return;
    }
    if (!phone || phone.length !== 11) {
      message.warning('请输入正确的手机号');
      return;
    }

    setLoading(true);
    try {
      const res = await selectRole(selectedRole, phone);
      setToken(res.data.token);
      setUser(res.data.user);
      
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
      message.success('登录成功');
    } catch (error) {
      console.error('登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container flex-center" style={{ flexDirection: 'column', minHeight: '100vh' }}>
      <div className="page-header" style={{ textAlign: 'center', borderBottom: 'none' }}>
        <Title level={2}>欢迎使用随身老师</Title>
        <Text type="secondary">请选择您的身份开始使用</Text>
      </div>

      <Row gutter={[24, 24]} style={{ width: '100%', marginBottom: 32 }}>
        <Col xs={24} sm={12}>
          <Card
            className={`role-card ${selectedRole === 'student' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('student')}
            hoverable={false}
          >
            <div className="role-icon" style={{ color: selectedRole === 'student' ? '#1890ff' : '#999' }}>
              <UserOutlined style={{ fontSize: 64 }} />
            </div>
            <div className="role-title">我是学生</div>
            <div className="role-desc">发布辅导需求，寻找合适的老师</div>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card
            className={`role-card ${selectedRole === 'teacher' ? 'selected' : ''}`}
            onClick={() => setSelectedRole('teacher')}
            hoverable={false}
          >
            <div className="role-icon" style={{ color: selectedRole === 'teacher' ? '#1890ff' : '#999' }}>
              <SolutionOutlined style={{ fontSize: 64 }} />
            </div>
            <div className="role-title">我是老师</div>
            <div className="role-desc">在线接单，提供一对一家教服务</div>
          </Card>
        </Col>
      </Row>

      <div style={{ width: '100%', maxWidth: 400 }}>
        <Input
          size="large"
          placeholder="请输入手机号"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
          style={{ marginBottom: 16 }}
          maxLength={11}
        />
        <Button
          type="primary"
          size="large"
          block
          loading={loading}
          onClick={handleSubmit}
        >
          确认进入
        </Button>
      </div>
    </div>
  );
};

export default SelectRole;
