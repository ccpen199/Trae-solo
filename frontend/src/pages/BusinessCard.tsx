import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Avatar, Space, Row, Col, Statistic, Table, QRCode, App, Divider, Tag, message as AntMsg } from 'antd';
import { IdcardOutlined, ShareAltOutlined, EyeOutlined, UserOutlined, RocketOutlined, CopyOutlined } from '@ant-design/icons';
import api from '../api';
import { useAppStore } from '../store';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function BusinessCard() {
  const { user } = useAppStore();
  const [card, setCard] = useState<any>(null);
  const [traces, setTraces] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    api.get('/enterprise/business-card/my').then((d: any) => {
      setCard(d.card);
      setTraces(d.traces || []);
      form.setFieldsValue(d.card || {});
    });
  }, []);

  const onSave = async (values: any) => {
    setSaving(true);
    try {
      await api.post('/enterprise/business-card', values);
      message.success('名片已保存');
      const d: any = await api.get('/enterprise/business-card/my');
      setCard(d.card);
      setTraces(d.traces || []);
    } catch (e: any) {
      message.error(e.error || '保存失败');
    } finally { setSaving(false); }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/card/${card?.share_code}`;
    navigator.clipboard.writeText(link);
    message.success('分享链接已复制');
  };

  return (
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <Card title={<span><IdcardOutlined style={{ color: '#1677ff' }} /> 我的电子名片</span>}>
          {card && (
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 32, borderRadius: 12, color: 'white', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <Avatar size={64} icon={<UserOutlined />} src={card.avatar} style={{ border: '2px solid white' }} />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 'bold' }}>{card.name || user?.name}</div>
                  <div style={{ opacity: 0.9 }}>{card.title || '职位未设置'}</div>
                  <div style={{ opacity: 0.8, fontSize: 13 }}>{card.company || '公司未设置'}</div>
                </div>
              </div>
              <Divider style={{ borderColor: 'rgba(255,255,255,0.3)', margin: '12px 0' }} />
              <Space direction="vertical" size="small">
                {card.phone && <div>📱 {card.phone}</div>}
                {card.email && <div>📧 {card.email}</div>}
                {card.wechat && <div>💬 微信：{card.wechat}</div>}
              </Space>
            </div>
          )}

          <Form form={form} layout="vertical" onFinish={onSave}>
            <Row gutter={12}>
              <Col xs={24} md={12}><Form.Item name="name" label="姓名"><Input /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="title" label="职位"><Input /></Form.Item></Col>
            </Row>
            <Form.Item name="company" label="公司"><Input /></Form.Item>
            <Row gutter={12}>
              <Col xs={24} md={8}><Form.Item name="phone" label="电话"><Input /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="email" label="邮箱"><Input /></Form.Item></Col>
              <Col xs={24} md={8}><Form.Item name="wechat" label="微信"><Input /></Form.Item></Col>
            </Row>
            <Form.Item name="avatar" label="头像URL"><Input placeholder="头像图片地址" /></Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<RocketOutlined />} loading={saving}>保存名片</Button>
                {card?.share_code && (
                  <Button icon={<CopyOutlined />} onClick={copyLink}>复制分享链接</Button>
                )}
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Col>

      <Col xs={24} md={12}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Card className="stat-card"><Statistic title="浏览量" value={card?.views || 0} prefix={<EyeOutlined />} /></Card>
          </Col>
          <Col span={8}>
            <Card className="stat-card"><Statistic title="转化数" value={card?.conversions || 0} valueStyle={{ color: '#52c41a' }} /></Card>
          </Col>
          <Col span={8}>
            <Card className="stat-card"><Statistic title="分享码" value={card?.share_code || '-'} valueStyle={{ fontSize: 14 }} /></Card>
          </Col>
        </Row>

        <Card title={<span><ShareAltOutlined /> 裂变追踪</span>} style={{ marginTop: 16 }}>
          {card?.share_code && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <QRCode value={`${window.location.origin}/card/${card.share_code}`} size={140} />
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>扫码查看电子名片</div>
            </div>
          )}
          <Table
            size="small"
            dataSource={traces}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            columns={[
              { title: '访问IP', dataIndex: 'ip', render: (i: string) => i || '匿名' },
              { title: '是否转化', dataIndex: 'is_conversion', render: (v: number) => v ? <Tag color="green">是</Tag> : <Tag>否</Tag> },
              { title: '时间', dataIndex: 'created_at', render: (t: string) => dayjs(t).fromNow() }
            ]}
          />
        </Card>
      </Col>
    </Row>
  );
}
