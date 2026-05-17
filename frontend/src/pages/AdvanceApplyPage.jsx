import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Form, InputNumber, Card, Spin, Alert, Checkbox, Modal, Steps, Divider, Typography } from 'antd';
import { ArrowLeftOutlined, SafetyCertificateOutlined, FileTextOutlined, EditOutlined } from '@ant-design/icons';
import { advanceApi, commissionApi } from '../services/api';

const { Step } = Steps;
const { Paragraph, Text } = Typography;

const AdvanceApplyPage = () => {
  const navigate = useNavigate();
  const { commissionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preCheckData, setPreCheckData] = useState(null);
  const [commissionInfo, setCommissionInfo] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [commissionId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [preCheckResult, commissionResult] = await Promise.all([
        advanceApi.getPreCheck(commissionId),
        commissionApi.getDetail(commissionId)
      ]);
      setPreCheckData(preCheckResult.data);
      setCommissionInfo(commissionResult.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      try {
        await form.validateFields(['applyAmount']);
        setCurrentStep(1);
      } catch {
        return;
      }
    } else if (currentStep === 1) {
      try {
        await form.validateFields(['faceVerified']);
        setCurrentStep(2);
      } catch {
        return;
      }
    } else if (currentStep === 2) {
      try {
        await form.validateFields(['contractRead']);
        setCurrentStep(3);
      } catch {
        return;
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
    } catch {
      return;
    }

    const values = form.getFieldsValue();
    if (!values.signatureAuth) {
      return;
    }

    setSubmitting(true);
    try {
      await advanceApi.submit({
        commissionId: parseInt(commissionId),
        ...values
      });

      Modal.success({
        title: '申请成功',
        content: '您的垫付申请已提交并审核通过，款项将在1-3个工作日内到账。',
        onOk: () => navigate('/home')
      });
    } catch (error) {
      console.error('提交申请失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFaceVerify = () => {
    Modal.info({
      title: '人脸识别',
      content: '正在调用人脸识别服务，请正对摄像头完成人脸识别验证。（演示：点击确认即表示验证通过）',
      okText: '确认',
      onOk: () => {
        form.setFieldsValue({ faceVerified: true });
      }
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>申请垫付</h1>
        </div>
        <div className="page-content">
          <div className="loading-container">
            <Spin size="large" />
          </div>
        </div>
      </div>
    );
  }

  if (!preCheckData?.canApply) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>申请垫付</h1>
        </div>
        <div className="page-content">
          <Button
            className="back-btn"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/home')}
          >
            返回首页
          </Button>

          <Alert
            message="无法申请垫付"
            description={
              <div>
                {preCheckData?.hasPendingApplication && <p>• 您有正在审核中的申请</p>}
                {preCheckData?.creditStatus !== 2 && <p>• 您尚未完成授信审核</p>}
                {!preCheckData?.hasBankCard && <p>• 您尚未绑定银行卡</p>}
                {preCheckData?.commissionInfo && !preCheckData.commissionInfo.has_invoice && <p>• 该佣金批次尚未开具发票</p>}
              </div>
            }
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Button type="primary" block onClick={() => navigate('/home')}>
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>申请垫付</h1>
      </div>
      <div className="page-content">
        <Button
          className="back-btn"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/home')}
        >
          返回首页
        </Button>

        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="填写金额" />
          <Step title="人脸识别" />
          <Step title="阅读合同" />
          <Step title="签字授权" />
        </Steps>

        <Alert
          message="额度信息"
          description={
            <div>
              <p>可用额度：<strong>¥{preCheckData.available_limit?.toLocaleString()}</strong></p>
              <p>可申请金额：<strong>¥{commissionInfo?.pending_amount?.toLocaleString()}</strong></p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form form={form} name="advanceApply">
          {currentStep === 0 && (
            <Card bordered={false} title="填写申请金额">
              <Form.Item
                name="applyAmount"
                label="申请垫付金额"
                rules={[
                  { required: true, message: '请输入申请金额' },
                  { type: 'number', min: 1000, message: '单笔申请最低1000元' },
                  {
                    validator: (_, value) => {
                      if (value > preCheckData.available_limit) {
                        return Promise.reject(new Error('超出可用额度'));
                      }
                      if (value > commissionInfo?.pending_amount) {
                        return Promise.reject(new Error('超出待结佣金金额'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入申请金额"
                  min={1000}
                  max={Math.min(preCheckData.available_limit, commissionInfo?.pending_amount || 0)}
                  step={100}
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value.replace(/\¥\s?|(,*)/g, '')}
                  size="large"
                />
              </Form.Item>

              <div style={{ background: '#fff7e6', padding: 16, borderRadius: 8, marginBottom: 16 }}>
                <p style={{ margin: 0 }}>项目名称：{commissionInfo?.project_name}</p>
                <p style={{ margin: '8px 0 0 0' }}>房屋地址：{commissionInfo?.house_address}</p>
              </div>

              <Button type="primary" block onClick={handleNext}>
                下一步
              </Button>
            </Card>
          )}

          {currentStep === 1 && (
            <Card bordered={false} title="人脸识别验证">
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <SafetyCertificateOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
                <h3>完成人脸识别</h3>
                <p style={{ color: '#8c8c8c' }}>请完成人脸识别验证，确保为法定代表人本人操作</p>
              </div>

              <Form.Item
                name="faceVerified"
                valuePropName="checked"
                initialValue={false}
                rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('请完成人脸识别')) }]}
              >
                <Checkbox>我已完成人脸识别验证</Checkbox>
              </Form.Item>

              <Button
                type="primary"
                block
                onClick={handleFaceVerify}
                style={{ marginBottom: 12 }}
              >
                开始人脸识别
              </Button>

              <div style={{ display: 'flex', gap: 12 }}>
                <Button block onClick={handlePrev}>上一步</Button>
                <Button type="primary" block onClick={handleNext}>下一步</Button>
              </div>
            </Card>
          )}

          {currentStep === 2 && (
            <Card bordered={false} title="阅读服务合同">
              <FileTextOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
              
              <div className="agreement-box" style={{ maxHeight: 300 }}>
                <Paragraph>
                  <Text strong>佣金垫付服务合同</Text>
                </Paragraph>
                <Paragraph>
                  <Text strong>第一条 服务内容</Text>
                </Paragraph>
                <Paragraph>
                  1.1 甲方（服务提供方）同意向乙方（申请人）提供佣金垫付服务，在乙方符合条件的情况下提前垫付房产交易佣金。
                </Paragraph>
                <Paragraph>
                  1.2 垫付金额以甲方最终审核通过的金额为准，且不超过乙方待结佣金金额和授信额度。
                </Paragraph>
                <Paragraph>
                  <Text strong>第二条 费用标准</Text>
                </Paragraph>
                <Paragraph>
                  2.1 乙方应向甲方支付一定比例的服务费用，具体费率以申请时展示的费率为准。
                </Paragraph>
                <Paragraph>
                  2.2 服务费用将在垫付金额中直接扣除或由乙方另行支付。
                </Paragraph>
                <Paragraph>
                  <Text strong>第三条 还款约定</Text>
                </Paragraph>
                <Paragraph>
                  3.1 乙方应在开发商/渠道支付佣金后及时向甲方偿还垫付款项。
                </Paragraph>
                <Paragraph>
                  3.2 乙方逾期还款的，应按逾期金额的每日万分之五支付违约金。
                </Paragraph>
                <Paragraph>
                  <Text strong>第四条 双方权利义务</Text>
                </Paragraph>
                <Paragraph>
                  4.1 乙方保证所提供的所有信息真实、准确、完整；
                </Paragraph>
                <Paragraph>
                  4.2 乙方同意甲方查询并使用乙方的企业信息、个人征信信息等；
                </Paragraph>
                <Paragraph>
                  4.3 甲方有权对乙方的申请进行审核，并决定是否提供垫付服务。
                </Paragraph>
              </div>

              <Form.Item
                name="contractRead"
                valuePropName="checked"
                initialValue={false}
                rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('请确认已阅读并理解合同内容')) }]}
              >
                <Checkbox>我已阅读并完全理解上述合同内容</Checkbox>
              </Form.Item>

              <div style={{ display: 'flex', gap: 12 }}>
                <Button block onClick={handlePrev}>上一步</Button>
                <Button type="primary" block onClick={handleNext}>下一步</Button>
              </div>
            </Card>
          )}

          {currentStep === 3 && (
            <Card bordered={false} title="个人签字授权">
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <EditOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                <h3>确认信息并签字授权</h3>
              </div>

              <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 24 }}>
                <h4 style={{ marginBottom: 12 }}>申请信息确认</h4>
                <p style={{ margin: '4px 0' }}>申请金额：<strong style={{ color: '#fa8c16', fontSize: 18 }}>¥{form.getFieldValue('applyAmount')?.toLocaleString()}</strong></p>
                <p style={{ margin: '4px 0' }}>项目名称：{commissionInfo?.project_name}</p>
                <p style={{ margin: '4px 0' }}>佣金批次：{commissionInfo?.batch_no}</p>
                <p style={{ margin: '4px 0' }}>人脸识别：<span style={{ color: '#52c41a' }}>已验证</span></p>
                <p style={{ margin: '4px 0' }}>合同阅读：<span style={{ color: '#52c41a' }}>已确认</span></p>
              </div>

              <Form.Item
                name="signatureAuth"
                valuePropName="checked"
                initialValue={false}
                rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('请确认签字授权')) }]}
              >
                <Checkbox>我确认以上信息无误，并以电子签名形式授权本服务</Checkbox>
              </Form.Item>

              <div style={{ display: 'flex', gap: 12 }}>
                <Button block onClick={handlePrev}>上一步</Button>
                <Button
                  type="primary"
                  block
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={submitting}
                >
                  提交申请
                </Button>
              </div>
            </Card>
          )}
        </Form>
      </div>
    </div>
  );
};

export default AdvanceApplyPage;
