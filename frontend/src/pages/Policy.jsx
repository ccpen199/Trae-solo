import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Tabs, Button, Modal, Descriptions, Input, Form, message } from 'antd';
import api from '../utils/api';

const { TextArea } = Input;

function Policy() {
  const [news, setNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('news');
  const [form] = Form.useForm();

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
      try {
        const data = await api.get('/policy/news?limit=20');
        setNews(data);
      } catch (err) {
        console.error(err);
      }
    };

  const viewDetail = async (item) => {
      setSelectedNews(item);
      setDetailVisible(true);
    };

  const calculateSubsidy = async (values) => {
      try {
        const result = await api.post('/policy/calculator/social-subsidy', values);
        Modal.info({
          title: '社保补贴试算结果',
          content: (
            <div>
              <p>月度补贴：<strong>{result.monthlySubsidy}</strong> 元</p>
              <p>总补贴（{values.months}个月）：<strong>{result.totalSubsidy}</strong> 元</p>
              <p>是否符合条件：{result.eligibility ? '是' : '否'}</p>
              <p style={{ color: '#666', marginTop: 8 }}>{result.advice}</p>
            </div>
          )
        });
      } catch (err) {
        message.error('计算失败');
      }
    };

  const calculateTax = async (values) => {
      try {
        const result = await api.post('/policy/calculator/tax', values);
        Modal.info({
          title: '个税计算结果',
          content: (
            <div>
              <p>税前收入：<strong>{result.income}</strong> 元</p>
              <p>应纳税所得额：<strong>{result.taxableIncome}</strong> 元</p>
              <p>应缴个税：<strong style={{ color: '#f5222d' }}>{result.tax}</strong> 元</p>
              <p>税后收入：<strong style={{ color: '#52c41a' }}>{result.netIncome}</strong> 元</p>
            </div>
          )
        });
      } catch (err) {
        message.error('计算失败');
      }
    };

  return (
    <div>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'news', label: '政策速递' },
            { key: 'calculator', label: '政策计算器' }
          ]}
        />

        {activeTab === 'news' && (
          <List
            dataSource={news}
            renderItem={(item) => (
              <List.Item
                style={{ padding: '16px 0' }}
                onClick={() => viewDetail(item)}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {item.is_top ? <Tag color="red">置顶</Tag> : null}
                      <Tag color="blue">{item.category}</Tag>
                      <span style={{ fontSize: 16, cursor: 'pointer' }}>{item.title}</span>
                    </div>
                  }
                  description={
                    <div style={{ display: 'flex', gap: 16, color: '#999' }}>
                      <span>{item.department}</span>
                      <span>{item.publish_date}</span>
                      <span>阅读 {item.views}</span>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}

        {activeTab === 'calculator' && (
          <Tabs>
            <Tabs.TabPane tab="社保补贴试算" key="subsidy">
              <Form
                form={form}
                layout="vertical"
                onFinish={calculateSubsidy}
                style={{ maxWidth: 500 }}
              >
                <Form.Item name="salary" label="月收入（元）" rules={[{ required: true }]}>
                  <Input type="number" placeholder="请输入月收入" />
                </Form.Item>
                <Form.Item name="months" label="补贴月数" initialValue={12}>
                  <Input type="number" />
                </Form.Item>
                <Form.Item name="familyMembers" label="家庭成员数" initialValue={3}>
                  <Input type="number" />
                </Form.Item>
                <Form.Item name="isLowIncome" label="是否低保户" valuePropName="checked">
                  <Input type="checkbox" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    开始计算
                  </Button>
                </Form.Item>
              </Form>
            </Tabs.TabPane>
            <Tabs.TabPane tab="个税计算器" key="tax">
              <Form
                layout="vertical"
                onFinish={calculateTax}
                style={{ maxWidth: 500 }}
              >
                <Form.Item name="income" label="月收入（元）" rules={[{ required: true }]}>
                  <Input type="number" placeholder="请输入月收入" />
                </Form.Item>
                <Form.Item name="deductions" label="专项附加扣除" initialValue={0}>
                  <Input type="number" />
                </Form.Item>
                <Form.Item name="socialInsurance" label="社保公积金" initialValue={0}>
                  <Input type="number" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    开始计算
                  </Button>
                </Form.Item>
              </Form>
            </Tabs.TabPane>
          </Tabs>
        )}
      </Card>

      <Modal
        title={selectedNews?.title}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="发布部门">{selectedNews?.department}</Descriptions.Item>
          <Descriptions.Item label="发布日期">{selectedNews?.publish_date}</Descriptions.Item>
          <Descriptions.Item label="阅读量">{selectedNews?.views}</Descriptions.Item>
          <Descriptions.Item label="分类">{selectedNews?.category}</Descriptions.Item>
        </Descriptions>
        <div style={{ lineHeight: 1.8 }}>
          {selectedNews?.content}
        </div>
      </Modal>
    </div>
  );
}

export default Policy;
