import { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Typography, Input, Select, Button, Space, Avatar, InputNumber, Empty } from 'antd';
import { SearchOutlined, PlusOutlined, GlobalOutlined, PayCircleOutlined, ClockCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAppStore } from '../store';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Jobs() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [salaryMin, setSalaryMin] = useState<number | null>(null);

  const fetchData = () => {
    setLoading(true);
    api.get('/jobs', { params: { keyword, location, industry, experienceLevel, salaryMin } })
      .then((d: any) => setList(d.jobs || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [keyword, location, industry, experienceLevel, salaryMin]);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <div className="flex-between">
        <Title level={4} style={{ margin: 0 }}>{user?.role === 'hr' ? '岗位管理' : '岗位广场'}</Title>
        {user?.role === 'hr' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/jobs/new')}>发布岗位</Button>
        )}
      </div>

      <Card>
        <Space wrap size="large">
          <Input prefix={<SearchOutlined />} placeholder="搜索岗位、部门、描述..." value={keyword} onChange={e => setKeyword(e.target.value)} style={{ width: 260 }} allowClear />
          <Input prefix={<GlobalOutlined />} placeholder="工作地点" value={location} onChange={e => setLocation(e.target.value)} style={{ width: 160 }} allowClear />
          <Select placeholder="行业" value={industry} onChange={setIndustry} allowClear style={{ width: 140 }}>
            <Option value="科技">科技</Option>
            <Option value="金融">金融</Option>
            <Option value="教育">教育</Option>
            <Option value="医疗">医疗</Option>
            <Option value="制造">制造</Option>
          </Select>
          <Select placeholder="经验要求" value={experienceLevel} onChange={setExperienceLevel} allowClear style={{ width: 140 }}>
            <Option value="不限">不限</Option>
            <Option value="应届">应届</Option>
            <Option value="1-3年">1-3年</Option>
            <Option value="3-5年">3-5年</Option>
            <Option value="5-10年">5-10年</Option>
            <Option value="10年以上">10年以上</Option>
          </Select>
          <InputNumber min={0} placeholder="最低薪资" prefix={<PayCircleOutlined />} value={salaryMin} onChange={setSalaryMin} addonAfter="K" />
          <Button onClick={() => { setKeyword(''); setLocation(''); setIndustry(''); setExperienceLevel(''); setSalaryMin(null); }}>重置</Button>
        </Space>
      </Card>

      {loading ? (
        <Card loading />
      ) : list.length === 0 ? (
        <Empty description="暂无岗位" />
      ) : (
        <Row gutter={[16, 16]}>
          {list.map((j: any) => (
            <Col xs={24} md={12} lg={8} key={j.id}>
              <Card className="card-hover" onClick={() => navigate(`/jobs/${j.id}`)}>
                <div className="flex-between" style={{ marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 16 }}>{j.title}</Text>
                  <Tag color={j.status === 'open' ? 'green' : 'default'}>{j.status === 'open' ? '招聘中' : '已关闭'}</Tag>
                </div>
                <Space size="middle" style={{ marginBottom: 12 }} wrap>
                  <Tag color="red"><PayCircleOutlined /> {j.salary_min || 0}-{j.salary_max || 0}K</Tag>
                  <Tag color="blue"><GlobalOutlined /> {j.location || '远程'}</Tag>
                  <Tag color="purple"><ClockCircleOutlined /> {j.experience_level || '经验不限'}</Tag>
                </Space>
                <Space wrap style={{ marginBottom: 12 }}>
                  {(j.skills || []).slice(0, 4).map((s: string) => <Tag key={s}>{s}</Tag>)}
                </Space>
                <div className="flex-between">
                  <Space>
                    <Avatar size={24}>{j.hr_name?.[0]}</Avatar>
                    <Text type="secondary" style={{ fontSize: 12 }}>{j.hr_name} · {j.department || '未分类'}</Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(j.created_at).fromNow()}</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Space>
  );
}
