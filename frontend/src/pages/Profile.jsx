import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, Form, Input, Select, Button, Typography, Space, Avatar, 
  message, Menu, Tag, Modal
} from 'antd';
import { 
  BookOutlined, UserOutlined, UnorderedListOutlined, 
  LogoutOutlined, IdcardOutlined
} from '@ant-design/icons';
import { getProfile, updateProfile } from '../api/user';
import { getUser, removeToken, removeUser } from '../api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SUBJECTS = [
  '语文', '数学', '英语', '物理', '化学', '生物',
  '政治', '历史', '地理', '科学', '编程', '音乐', '美术', '体育'
];

const GRADES = [
  '小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级',
  '初中一年级', '初中二年级', '初中三年级',
  '高中一年级', '高中二年级', '高中三年级'
];

const Profile = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await getProfile();
      setProfile(res.data);
      form.setFieldsValue({
        name: res.data.user.name,
        grade: res.data.profile?.grade,
        address: res.data.profile?.address,
        subjects: res.data.profile?.subjects,
        experience: res.data.profile?.experience,
        introduction: res.data.profile?.introduction,
        hourly_rate: res.data.profile?.hourly_rate
      });
    } catch (error) {
      console.error('加载用户信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      await updateProfile(values);
      message.success('保存成功');
      if (values.name && user) {
        user.name = values.name;
        localStorage.setItem('tutor_user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Modal.confirm({
      title: '退出登录',
      content: '确认要退出登录吗？',
      onOk: () => {
        removeToken();
        removeUser();
        navigate('/select-role', { replace: true });
      }
    });
  };

  return (
    <div className="page-container page-content">
      <div className="page-header">
        <div className="page-title">个人信息</div>
        <Tag color={user.role === 'student' ? 'blue' : 'green'}>
          {user.role === 'student' ? '学生' : '老师'}
        </Tag>
      </div>

      <Card className="card-item">
        <Space direction="vertical" style={{ width: '100%' }} align="center">
          <Avatar size={80} icon={<UserOutlined />}>
            {profile?.user?.name?.[0]}
          </Avatar>
          <Title level={4} style={{ margin: 0 }}>
            {profile?.user?.name || '未填写姓名'}
          </Title>
          <Text type="secondary">{profile?.user?.phone}</Text>
          
          <div style={{ marginTop: 8 }}>
            <Space wrap size="small">
              {profile?.user?.id_card && (
                <Tag color={profile?.user?.id_card_verified ? 'green' : 'orange'}>
                  <IdcardOutlined /> 
                  身份证{profile?.user?.id_card_verified ? '已认证' : '待审核'}
                </Tag>
              )}
              {user.role === 'teacher' && profile?.user?.teacher_cert && (
                <Tag color={profile?.user?.teacher_cert_verified ? 'green' : 'orange'}>
                  教师资格证{profile?.user?.teacher_cert_verified ? '已认证' : '待审核'}
                </Tag>
              )}
            </Space>
          </div>
        </Space>
      </Card>

      <Card className="card-item" title="基本信息">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          {user.role === 'student' && (
            <>
              <Form.Item name="grade" label="年级">
                <Select placeholder="请选择年级">
                  {GRADES.map(grade => (
                    <Option key={grade} value={grade}>{grade}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="address" label="地址">
                <Input placeholder="请输入常用地址" />
              </Form.Item>
            </>
          )}

          {user.role === 'teacher' && (
            <>
              <Form.Item name="subjects" label="教授科目">
                <Select placeholder="请选择教授科目" mode="multiple">
                  {SUBJECTS.map(subject => (
                    <Option key={subject} value={subject}>{subject}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="experience" label="教学经验">
                <Input placeholder="请输入教学经验（年）" type="number" />
              </Form.Item>

              <Form.Item name="hourly_rate" label="时薪（元）">
                <Input placeholder="请输入每小时收费" type="number" />
              </Form.Item>

              <Form.Item name="introduction" label="个人简介">
                <TextArea rows={4} placeholder="请输入个人简介，介绍您的教学经验和专长" />
              </Form.Item>
            </>
          )}

          {!profile?.user?.id_card && (
            <div style={{ padding: '16px', background: '#fffbe6', borderRadius: 8, marginBottom: 16 }}>
              <Text type="warning">
                <IdcardOutlined /> 请上传身份证以完成实名认证，审核通过后可正常使用全部功能
              </Text>
            </div>
          )}

          {user.role === 'teacher' && !profile?.user?.teacher_cert && (
            <div style={{ padding: '16px', background: '#fffbe6', borderRadius: 8, marginBottom: 16 }}>
              <Text type="warning">
                请上传教师资格证以完成认证，审核通过后可正常接单
              </Text>
            </div>
          )}

          <Form.Item>
            <Button
              type="primary"
              block
              htmlType="submit"
              loading={saving}
            >
              保存信息
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card className="card-item">
        <Button
          danger
          block
          icon={<LogoutOutlined />}
          onClick={handleLogout}
        >
          退出登录
        </Button>
      </Card>

      <div className="bottom-nav">
        <Menu
          mode="horizontal"
          selectedKeys={['profile']}
          onClick={({ key }) => navigate(key === 'home' ? '/' : `/${key}`)}
        >
          <Menu.Item key="home" icon={<BookOutlined />}>首页</Menu.Item>
          <Menu.Item key="orders" icon={<UnorderedListOutlined />}>订单</Menu.Item>
          <Menu.Item key="profile" icon={<UserOutlined />}>我的</Menu.Item>
        </Menu>
      </div>
    </div>
  );
};

export default Profile;
