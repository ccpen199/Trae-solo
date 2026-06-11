import { useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, List, Row, Select, Space, Tag, Typography, message } from 'antd';
import { BankOutlined, SearchOutlined } from '@ant-design/icons';
import { applyItem, getCategories, searchItems, type GovCategory, type GovItem } from '@/services/government';

const { Title, Text, Paragraph } = Typography;

export default function Government() {
  const [categories, setCategories] = useState<GovCategory[]>([]);
  const [items, setItems] = useState<GovItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState<string>();
  const [loading, setLoading] = useState(false);

  const loadItems = async (nextKeyword = keyword, nextCategory = categoryId) => {
    setLoading(true);
    try {
      const [categoryData, itemData] = await Promise.all([
        categories.length ? Promise.resolve(categories) : getCategories(),
        searchItems(nextKeyword, nextCategory),
      ]);
      setCategories(categoryData);
      setItems(itemData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems('', undefined);
  }, []);

  const handleApply = async (id: string) => {
    await applyItem(id, { channel: 'web' });
    message.success('申请已提交');
  };

  return (
    <div style={{ padding: 32, background: '#f5f5f5', minHeight: '100%' }}>
      <Title level={2} style={{ color: '#1B5E20' }}>政务服务</Title>
      <Paragraph type="secondary">查询社保、医保、住房和企业登记事项，支持在线提交办理。</Paragraph>

      <Card style={{ marginBottom: 24 }}>
        <Form layout="inline" onFinish={() => loadItems(keyword, categoryId)}>
          <Form.Item>
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder="搜索服务事项"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              style={{ width: 260 }}
            />
          </Form.Item>
          <Form.Item>
            <Select
              allowClear
              placeholder="服务分类"
              value={categoryId}
              onChange={setCategoryId}
              style={{ width: 180 }}
              options={categories.map((item) => ({ label: item.name, value: item.id }))}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit">查询</Button>
        </Form>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {categories.map((item) => (
          <Col xs={24} sm={12} lg={6} key={item.id}>
            <Card hoverable onClick={() => { setCategoryId(item.id); loadItems('', item.id); }}>
              <Space>
                <BankOutlined style={{ color: '#1B5E20', fontSize: 24 }} />
                <div>
                  <Text strong>{item.name}</Text>
                  <div><Text type="secondary">{item.count} 项服务</Text></div>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="可办事项">
        <List
          loading={loading}
          dataSource={items}
          renderItem={(item) => (
            <List.Item
              actions={[<Button key="apply" type="primary" onClick={() => handleApply(item.id)}>在线办理</Button>]}
            >
              <List.Item.Meta
                title={<Space>{item.name}<Tag color={item.online ? 'green' : 'default'}>{item.online ? '全程网办' : '窗口办理'}</Tag></Space>}
                description={`${item.department} · ${item.category}`}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
