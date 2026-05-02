import React, { useState } from 'react';
import { Form, Input, InputNumber, Select, Button, Card, message, Steps, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { applicationApi } from '../../services/api.js';

const { Option } = Select;
const { Step } = Steps;

function BorrowerApplication() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [applicationResult, setApplicationResult] = useState(null);
  const navigate = useNavigate();

  const steps = [
    { title: '填写信息' },
    { title: '提交申请' },
    { title: '完成' }
  ];

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const createRes = await applicationApi.createApplication({
        loan_amount: values.loan_amount,
        loan_term: values.loan_term,
        purpose: values.purpose
      });

      setApplicationResult(createRes.data);
      setCurrentStep(1);

      setTimeout(async () => {
        try {
          await applicationApi.submitApplication(createRes.data.id);
          setCurrentStep(2);
        } catch (submitErr) {
          console.error('Submit error:', submitErr);
          message.error('提交失败，请稍后重试');
        }
      }, 1500);
    } catch (error) {
      message.error(error.response?.data?.error || '创建申请失败');
    } finally {
      setLoading(false);
    }
  };

  const loanPurposeOptions = [
    { value: '购房', label: '购房' },
    { value: '购车', label: '购车' },
    { value: '装修', label: '装修' },
    { value: '教育', label: '教育' },
    { value: '医疗', label: '医疗' },
    { value: '创业', label: '创业' },
    { value: '消费', label: '消费' },
    { value: '其他', label: '其他' }
  ];

  const loanTermOptions = [
    { value: 3, label: '3个月' },
    { value: 6, label: '6个月' },
    { value: 12, label: '12个月' },
    { value: 24, label: '24个月' },
    { value: 36, label: '36个月' }
  ];

  return (
    <div>
      <div className="page-title">申请贷款</div>

      <Card style={{ maxWidth: 700, margin: '0 auto' }}>
        <Steps current={currentStep} items={steps} style={{ marginBottom: 40 }} />

        {currentStep === 0 && (
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="create-application-form"
          >
            <Form.Item
              name="loan_amount"
              label="贷款金额（元）"
              rules={[
                { required: true, message: '请输入贷款金额' },
                { type: 'number', min: 1000, message: '贷款金额至少1000元' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入贷款金额"
                min={1000}
                max={500000}
                formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\¥\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="loan_term"
              label="贷款期限"
              rules={[{ required: true, message: '请选择贷款期限' }]}
            >
              <Select placeholder="请选择贷款期限">
                {loanTermOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="purpose"
              label="贷款用途"
              rules={[{ required: true, message: '请选择贷款用途' }]}
            >
              <Select placeholder="请选择贷款用途">
                {loanPurposeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item style={{ marginTop: 32 }}>
              <Button type="primary" size="large" htmlType="submit" loading={loading} block>
                提交申请
              </Button>
            </Form.Item>
          </Form>
        )}

        {currentStep === 1 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ marginBottom: 16 }}>
              <span className="ant-spin-dot ant-spin-dot-spin" style={{ display: 'inline-block', fontSize: 48 }}>
                <i className="ant-spin-dot-item"></i>
                <i className="ant-spin-dot-item"></i>
                <i className="ant-spin-dot-item"></i>
                <i className="ant-spin-dot-item"></i>
              </span>
            </div>
            <p style={{ fontSize: 16, color: '#666' }}>正在提交申请并进行欺诈检测...</p>
          </div>
        )}

        {currentStep === 2 && (
          <Result
            status="success"
            title="申请提交成功！"
            subTitle="您的贷款申请已提交，系统已完成欺诈检测，申请已进入待初审状态。"
            extra={[
              <Button key="view" type="primary" onClick={() => navigate(`/borrower/application/${applicationResult?.id}`)}>
                查看申请详情
              </Button>,
              <Button key="list" onClick={() => navigate('/borrower/loans')}>
                查看我的贷款
              </Button>
            ]}
          />
        )}
      </Card>
    </div>
  );
}

export default BorrowerApplication;
