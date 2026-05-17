import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Select, Button, Typography, AutoComplete, message, Space } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { createRequest, getAddressHistory } from '../api/request';

const { Title } = Typography;
const { Option } = Select;

const SUBJECTS = [
  '语文', '数学', '英语', '物理', '化学', '生物',
  '政治', '历史', '地理', '科学', '编程', '音乐', '美术', '体育'
];

const GRADES = [
  '小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级',
  '初中一年级', '初中二年级', '初中三年级',
  '高中一年级', '高中二年级', '高中三年级'
];

const TIMES = [
  '周一至周五晚上', '周末上午', '周末下午', '周末晚上', '寒暑假', '可协商'
];

const CreateRequest = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [addressHistory, setAddressHistory] = useState([]);

  useEffect(() => {
    loadAddressHistory();
  }, []);

  const loadAddressHistory = async () => {
    try {
      const res = await getAddressHistory();
      if (res.data) {
        setAddressHistory(res.data);
      }
    } catch (error) {
      console.error('加载地址历史失败:', error);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setFieldsValue({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            location: `定位: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
          });
          message.success('定位成功');
        },
        (error) => {
          message.error('定位失败，请手动输入地址');
        }
      );
    } else {
      message.error('您的浏览器不支持定位功能');
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await createRequest(values);
      message.success('发布成功');
      navigate('/');
    } catch (error) {
      console.error('发布失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          />
          <div>
            <div className="page-title">发布辅导需求</div>
          </div>
        </div>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ student_count: 1 }}
        >
          <Form.Item
            name="name"
            label="学生姓名"
            rules={[{ required: true, message: '请输入学生姓名' }]}
          >
            <Input placeholder="请输入学生姓名" size="large" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="联系电话"
            rules={[
              { required: true, message: '请输入联系电话' },
              { pattern: /^1\d{10}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input placeholder="请输入联系电话" size="large" maxLength={11} />
          </Form.Item>

          <Form.Item
            name="grade"
            label="年级"
            rules={[{ required: true, message: '请选择年级' }]}
          >
            <Select placeholder="请选择年级" size="large">
              {GRADES.map(grade => (
                <Option key={grade} value={grade}>{grade}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="subject"
            label="辅导科目"
            rules={[{ required: true, message: '请选择辅导科目' }]}
          >
            <Select placeholder="请选择辅导科目" size="large">
              {SUBJECTS.map(subject => (
                <Option key={subject} value={subject}>{subject}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="location"
            label="上课地点"
            rules={[{ required: true, message: '请输入上课地点' }]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <AutoComplete
                placeholder="请输入上课地点"
                size="large"
                style={{ flex: 1 }}
                options={addressHistory.map(item => ({ value: item.address }))}
              >
                <Input />
              </AutoComplete>
              <Button
                size="large"
                icon={<EnvironmentOutlined />}
                onClick={handleGetLocation}
              >
                定位
              </Button>
            </Space.Compact>
          </Form.Item>

          <Form.Item name="latitude" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="longitude" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="time"
            label="上课时间"
            rules={[{ required: true, message: '请选择上课时间' }]}
          >
            <Select placeholder="请选择上课时间" size="large">
              {TIMES.map(time => (
                <Option key={time} value={time}>{time}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="student_count"
            label="学生人数"
            rules={[{ required: true, message: '请选择学生人数' }]}
          >
            <Select placeholder="请选择学生人数" size="large">
              {[1, 2, 3, 4, 5].map(num => (
                <Option key={num} value={num}>{num}人</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginTop: 32 }}>
            <Button
              type="primary"
              size="large"
              block
              htmlType="submit"
              loading={loading}
            >
              发布辅导需求
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateRequest;
