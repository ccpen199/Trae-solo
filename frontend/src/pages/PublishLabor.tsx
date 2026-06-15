import React, { useState } from 'react';
import { Card, Form, Input, Select, InputNumber, Radio, DatePicker, Switch, Button, message, Tag, Space } from 'antd';
import { PlusOutlined, EnvironmentOutlined, CalculatorOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const { Option } = Select;
const { TextArea } = Input;

function PublishLabor() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pricingType, setPricingType] = useState('hourly');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const categories = [
    '水电工', '木工', '瓦工', '油漆工', '搬运工', '家政保洁', '家电维修', '其他'
  ];

  const skillOptions: Record<string, string[]> = {
    '水电工': ['水电安装', '水电维修', '水管改造', '电路布线', '灯具安装'],
    '木工': ['家具制作', '吊顶安装', '木地板铺设', '木门安装', '橱柜定制'],
    '瓦工': ['砌墙', '贴瓷砖', '地面找平', '防水处理', '大理石铺设'],
    '油漆工': ['墙面刷漆', '家具喷漆', '防锈处理', '壁纸铺贴', '艺术涂料'],
    '搬运工': ['搬家搬运', '装卸货物', '重物搬运', '家具拆装', '仓库整理'],
    '家政保洁': ['日常保洁', '深度清洁', '开荒保洁', '玻璃清洗', '地毯清洁'],
    '家电维修': ['空调维修', '洗衣机维修', '冰箱维修', '热水器维修', '油烟机清洗'],
    '其他': ['杂工', '临时工', '力工'],
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const total_price = pricingType === 'hourly' 
        ? values.price_per_hour * values.estimated_hours * values.worker_count
        : values.task_price;

      await api.post('/labor-orders', {
        ...values,
        skills_required: selectedSkills,
        total_price,
      });
      message.success('发布成功');
      navigate('/labor');
    } catch (error: any) {
      message.error(error.response?.data?.error || '发布失败');
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    const values = form.getFieldsValue();
    if (pricingType === 'hourly' && values.price_per_hour && values.estimated_hours) {
      return values.price_per_hour * values.estimated_hours * (values.worker_count || 1);
    }
    return values.task_price || 0;
  };

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Card title="发布用工需求" extra={<Button onClick={() => navigate(-1)}>返回</Button>}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            worker_count: 1,
            split_enabled: false,
            pricing_type: 'hourly',
            city: user?.city || '北京市',
          }}
        >
          <Form.Item
            label="需求标题"
            name="title"
            rules={[{ required: true, message: '请输入需求标题' }]}
          >
            <Input placeholder="请简要描述您的用工需求" size="large" />
          </Form.Item>

          <Form.Item label="工种分类" name="category" rules={[{ required: true, message: '请选择工种' }]}>
            <Select placeholder="请选择工种" onChange={(val) => setSelectedSkills([])}>
              {categories.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="技能要求">
            <Space wrap>
              {(skillOptions[form.getFieldValue('category')] || []).map(skill => (
                <Tag.CheckableTag
                  key={skill}
                  checked={selectedSkills.includes(skill)}
                  onChange={(checked) => {
                    if (checked) {
                      setSelectedSkills([...selectedSkills, skill]);
                    } else {
                      setSelectedSkills(selectedSkills.filter(s => s !== skill));
                    }
                  }}
                >
                  {skill}
                </Tag.CheckableTag>
              ))}
            </Space>
            <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 8 }}>
              已选择 {selectedSkills.length} 项技能
            </div>
          </Form.Item>

          <Form.Item label="计价方式" name="pricing_type">
            <Radio.Group onChange={(e) => setPricingType(e.target.value)}>
              <Radio.Button value="hourly">按小时计价</Radio.Button>
              <Radio.Button value="task">按任务计价</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {pricingType === 'hourly' ? (
            <>
              <Form.Item
                label="每小时价格 (元)"
                name="price_per_hour"
                rules={[{ required: true, message: '请输入每小时价格' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} placeholder="请输入每小时价格" />
              </Form.Item>
              <Form.Item
                label="预估工时 (小时)"
                name="estimated_hours"
                rules={[{ required: true, message: '请输入预估工时' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0.5} step={0.5} placeholder="请输入预估工时" />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              label="任务总价 (元)"
              name="task_price"
              rules={[{ required: true, message: '请输入任务总价' }]}
            >
              <InputNumber style={{ width: '100%' }} min={1} placeholder="请输入任务总价" />
            </Form.Item>
          )}

          <Form.Item label="需求人数" name="worker_count">
            <InputNumber min={1} max={50} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="支持拆单" name="split_enabled" valuePropName="checked">
            <Switch />
            <span style={{ marginLeft: 12, color: '#8c8c8c', fontSize: 13 }}>
              开启后可将订单拆分为多个子订单，由不同工人分别完成
            </span>
          </Form.Item>

          <Form.Item label="服务地址">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="city" noStyle rules={[{ required: true, message: '请输入城市' }]}>
                <Input style={{ width: '30%' }} placeholder="城市" prefix={<EnvironmentOutlined />} />
              </Form.Item>
              <Form.Item name="address" noStyle rules={[{ required: true, message: '请输入详细地址' }]}>
                <Input style={{ width: '70%' }} placeholder="详细地址" />
              </Form.Item>
            </Space.Compact>
          </Form.Item>

          <Form.Item label="开始时间" name="start_time">
            <DatePicker showTime style={{ width: '100%' }} placeholder="选择开始时间" />
          </Form.Item>

          <Form.Item label="详细描述" name="description">
            <TextArea rows={4} placeholder="请详细描述您的用工需求，包括工作内容、注意事项等" />
          </Form.Item>

          <Card size="small" style={{ marginBottom: 24, background: '#f5f5f5', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalculatorOutlined /> 预估总价
              </span>
              <span style={{ fontSize: 24, fontWeight: 600, color: '#fa8c16' }}>
                ¥{calculatePrice()}
              </span>
            </div>
          </Card>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" size="large" htmlType="submit" loading={loading} block>
              <PlusOutlined /> 发布用工需求
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default PublishLabor;
