import { useState, useEffect } from 'react';
import { Card, Select, Button, Form, Space, Typography, Table, Tag, App, Statistic, Row, Col, Empty } from 'antd';
import { RocketOutlined, SendOutlined, UserOutlined, AccountBookOutlined } from '@ant-design/icons';
import api from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

export default function PushEngine() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [pushing, setPushing] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    api.get('/jobs').then((d: any) => setJobs(d.jobs || []));
    api.get('/enterprise/push/records').then((d: any) => setRecords(d.records || []));
  }, []);

  const onPush = async (values: any) => {
    setPushing(true);
    try {
      const data = await api.post('/enterprise/push/job', values) as any;
      message.success(`已向 ${data.pushed} 位求职者推送`);
      api.get('/enterprise/push/records').then((d: any) => setRecords(d.records || []));
    } catch (e: any) {
      message.error(e.error || '推送失败');
    } finally { setPushing(false); }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title={<span><RocketOutlined style={{ color: '#1677ff' }} /> 精准推送引擎</span>}
            extra={<Tag color="blue">基于行业/地域/岗位画像智能匹配</Tag>}>
            <Form form={form} layout="vertical" onFinish={onPush}>
              <Form.Item name="jobId" label="选择岗位" rules={[{ required: true, message: '请选择要推送的岗位' }]}>
                <Select placeholder="选择岗位">
                  {jobs.map(j => <Option key={j.id} value={j.id}>{j.title} · {j.department}</Option>)}
                </Select>
              </Form.Item>
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item name="industry" label="行业筛选">
                    <Select allowClear placeholder="全行业">
                      <Option value="科技">科技</Option><Option value="金融">金融</Option><Option value="教育">教育</Option><Option value="医疗">医疗</Option><Option value="制造">制造</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="region" label="地域筛选">
                    <Select allowClear placeholder="全地域">
                      <Option value="北京">北京</Option><Option value="上海">上海</Option><Option value="深圳">深圳</Option><Option value="杭州">杭州</Option><Option value="广州">广州</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="experienceLevel" label="经验要求">
                    <Select allowClear placeholder="不限">
                      <Option value="应届">应届</Option><Option value="1-3年">1-3年</Option><Option value="3-5年">3-5年</Option><Option value="5-10年">5-10年</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={pushing} size="large">开始精准推送</Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="推送统计">
            <Row gutter={16}>
              <Col span={8}><Card className="stat-card"><Statistic title="推送总数" value={records.length} /></Card></Col>
              <Col span={8}><Card className="stat-card"><Statistic title="覆盖岗位" value={new Set(records.map(r => r.job_id)).size} /></Card></Col>
              <Col span={8}><Card className="stat-card"><Statistic title="目标用户" value={new Set(records.map(r => r.target_user_id)).size} /></Card></Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title="推送记录">
        {records.length === 0 ? <Empty /> : (
          <Table
            rowKey="id"
            size="small"
            dataSource={records}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: '岗位', dataIndex: 'job_title', render: (t: string, r: any) => <Space><AccountBookOutlined /> {t || r.job_id}</Space> },
              { title: '目标用户', dataIndex: 'target_name', render: (t: string, r: any) => <Space><UserOutlined /> {t || r.target_user_id}</Space> },
              { title: '渠道', dataIndex: 'channel', render: (c: string) => <Tag>{c}</Tag> },
              { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === 'sent' ? 'green' : 'orange'}>{s === 'sent' ? '已发送' : s}</Tag> },
              { title: '内容', dataIndex: 'content', ellipsis: true },
              { title: '时间', dataIndex: 'created_at', render: (t: string) => dayjs(t).fromNow() }
            ]}
          />
        )}
      </Card>
    </Space>
  );
}
