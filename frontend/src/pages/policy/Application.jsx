import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, message, Steps } from 'antd';
import { policyAPI } from '../../services/api';

function PolicyApplication() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    loadPolicy();
  }, [id]);

  const loadPolicy = async () => {
    try {
      const res = await policyAPI.getDetail(id);
      setPolicy(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await policyAPI.apply(id, { applicationData: values });
      message.success('申请提交成功');
      navigate('/policy/applications');
    } catch (err) {
      message.error(err.response?.data?.error || '申请失败');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: '政策确认', description: '确认申报政策信息' },
    { title: '填写信息', description: '填写企业申报信息' },
    { title: '提交审核', description: '提交等待审核' }
  ];

  if (!policy) return <div>加载中...</div>;

  return (
    <div>
      <Card title="政策申报">
        <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />

        {currentStep === 0 && (
          <div>
            <Card type="inner" title={policy.title} style={{ marginBottom: 16 }}>
              <p><strong>发布部门：</strong>{policy.department}</p>
              <p><strong>政策摘要：</strong>{policy.summary}</p>
              <p><strong>资助方式：</strong>
                {policy.benefit_type === 'subsidy' ? '补贴' : 
                 policy.benefit_type === 'tax_reduction' ? '税收减免' : '返还'}
              </p>
              {policy.benefit_amount && (
                <p><strong>资助金额：</strong>
                  <span style={{ color: '#f5222d', fontWeight: 'bold', fontSize: 18 }}>
                    最高 {policy.benefit_amount.toLocaleString()} 元
                  </span>
                </p>
              )}
              <p><strong>有效期：</strong>{policy.valid_from} 至 {policy.valid_to}</p>
            </Card>
            <div style={{ textAlign: 'center' }}>
              <Button type="primary" size="large" onClick={() => setCurrentStep(1)}>
                确认，下一步
              </Button>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              contactPerson: '',
              contactPhone: '',
              businessScope: '',
              annualRevenue: ''
            }}
          >
            <Form.Item name="contactPerson" label="联系人姓名" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="contactPhone" label="联系电话" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="businessScope" label="经营范围简述" rules={[{ required: true }]}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="annualRevenue" label="上年度营业收入（元）" rules={[{ required: true }]}>
              <Input type="number" />
            </Form.Item>
            <Form.Item name="employeeCount" label="员工人数" rules={[{ required: true }]}>
              <Input type="number" />
            </Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setCurrentStep(0)}>上一步</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                提交申请
              </Button>
            </div>
          </Form>
        )}
      </Card>
    </div>
  );
}

export default PolicyApplication;
