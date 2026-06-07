import React, { useState, useEffect } from 'react';
import { Card, List, Button, Tag, Select, Modal, Form, Input, message, Typography, Rate } from 'antd';
import { ShopOutlined, PlusOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { merchantAPI } from '../api';

const { Title, Text } = Typography;
const { Option } = Select;

const CATEGORIES = ['餐饮美食', '休闲娱乐', '生活服务', '教育培训', '医疗健康', '其他'];

interface MerchantProps {
  currentCity: { id: number; name: string } | null;
}

const MerchantPage: React.FC<MerchantProps> = ({ currentCity }) => {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [createModal, setCreateModal] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadMerchants();
  }, [currentCity, category]);

  const loadMerchants = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (currentCity) params.city_id = currentCity.id;
      if (category) params.category = category;

      const res = await merchantAPI.getMerchants(params);
      setMerchants(res.data.merchants);
    } catch (error) {
      message.error('加载商家列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await merchantAPI.createMerchant({
        ...values,
        city_id: currentCity?.id,
      });
      message.success('入驻申请提交成功');
      setCreateModal(false);
      form.resetFields();
      loadMerchants();
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交失败');
    }
  };

  return (
    <div>
      <Card className="filter-bar" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Select
            placeholder="选择分类"
            allowClear
            style={{ width: 200 }}
            value={category || undefined}
            onChange={setCategory}
          >
            {CATEGORIES.map((c) => (
              <Option key={c} value={c}>{c}</Option>
            ))}
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
            商家入驻
          </Button>
        </div>
      </Card>

      <List
        loading={loading}
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4 }}
        dataSource={merchants}
        renderItem={(merchant) => (
          <List.Item>
            <Card
              hoverable
              onClick={() => navigate(`/merchants/${merchant.id}`)}
              cover={<div style={{ height: 160, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShopOutlined style={{ fontSize: 64, color: 'white' }} />
              </div>}
              actions={[<Rate disabled defaultValue={merchant.rating} />]}
            >
              <Card.Meta
                title={
                  <span>
                    {merchant.name}
                    {merchant.is_verified ? <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 4 }} /> : null}
                  </span>
                }
                description={
                  <div>
                    <Tag color="blue">{merchant.category}</Tag>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">{merchant.address}</Text>
                    </div>
                  </div>
                }
              />
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title="商家入驻申请"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="商家名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="服务类目" rules={[{ required: true }]}>
            <Select>
              {CATEGORIES.map((c) => (
                <Option key={c} value={c}>{c}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="商家描述" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="license_number" label="营业执照号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="地址" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="联系电话" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>提交申请</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MerchantPage;
