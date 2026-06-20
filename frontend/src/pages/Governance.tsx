import { useState } from 'react';
import { Card, Row, Col, Steps, Tag, Button, Modal, Form, Input, message, Tabs, Descriptions, Alert } from 'antd';
import { SafetyCertificateOutlined, UserSwitchOutlined, FileSearchOutlined, PhoneOutlined } from '@ant-design/icons';
import api from '../utils/request';

interface Props {
  user: any;
}

export default function Governance({ user }: Props) {
  const [verifyModal, setVerifyModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [form] = Form.useForm();
  const [confirmForm] = Form.useForm();
  const [verifyCode, setVerifyCode] = useState('');

  const handleAgentVerify = async () => {
    try {
      const values = await form.validateFields();
      await api.post('/governance/agent/verify', values);
      message.success('认证信息已提交，等待审核');
      setVerifyModal(false);
    } catch (e: any) {
      message.error(e.message || '提交失败');
    }
  };

  const handleOwnerConfirmRequest = async () => {
    try {
      const values = await confirmForm.validateFields();
      const res: any = await api.post('/governance/owner-confirm', values);
      setVerifyCode(res.code);
      message.success(`验证码已发送（模拟）: ${res.code}`);
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleOwnerConfirmVerify = async () => {
    try {
      const values = await confirmForm.validateFields();
      await api.post('/governance/owner-confirm/verify', values);
      message.success('业主确认成功');
      setConfirmModal(false);
    } catch (e: any) {
      message.error(e.message || '验证失败');
    }
  };

  const steps = [
    {
      title: '经纪人实名绑定',
      description: '身份证+从业资格证双重验证',
      icon: <UserSwitchOutlined />,
    },
    {
      title: '房源图片AI去重',
      description: '智能识别重复图片，防止一房多发',
      icon: <FileSearchOutlined />,
    },
    {
      title: '挂牌价偏离度预警',
      description: '对比区域均价，异常价格自动预警',
      icon: <SafetyCertificateOutlined />,
    },
    {
      title: '业主直连确认机制',
      description: '验证码验证业主身份，确保房源真实',
      icon: <PhoneOutlined />,
    },
  ];

  const tabItems = [
    {
      key: 'system',
      label: '治理体系介绍',
      children: (
        <div>
          <Alert
            message="真房源保障体系"
            description="平台建立四重真房源治理机制，确保每一套房源真实可靠，让您放心交易。"
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Steps
            direction="vertical"
            current={3}
            items={steps.map((s, i) => ({
              title: s.title,
              description: s.description,
              status: 'finish',
            }))}
          />

          <Row gutter={16} style={{ marginTop: 24 }}>
            <Col span={8}>
              <Card style={{ textAlign: 'center', borderRadius: 8 }}>
                <UserSwitchOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                <h3 style={{ marginTop: 12 }}>经纪人实名绑定</h3>
                <p style={{ color: '#666', fontSize: 13, lineHeight: 1.8 }}>
                  所有经纪人必须完成实名认证，提交身份证和经纪资格证书，
                  审核通过后方可发布房源，确保服务专业性。
                </p>
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{ textAlign: 'center', borderRadius: 8 }}>
                <FileSearchOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                <h3 style={{ marginTop: 12 }}>房源图片AI去重</h3>
                <p style={{ color: '#666', fontSize: 13, lineHeight: 1.8 }}>
                  利用AI图像识别技术，自动检测重复房源图片，
                  有效防止一房多发、虚假房源等问题。
                </p>
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{ textAlign: 'center', borderRadius: 8 }}>
                <SafetyCertificateOutlined style={{ fontSize: 48, color: '#faad14' }} />
                <h3 style={{ marginTop: 12 }}>挂牌价偏离度预警</h3>
                <p style={{ color: '#666', fontSize: 13, lineHeight: 1.8 }}>
                  基于区域市场均价，自动计算挂牌价偏离度，
                  超过±15%自动预警，保护买卖双方利益。
                </p>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'agent',
      label: '经纪人实名认证',
      children: (
        <div>
          <Card style={{ borderRadius: 8 }}>
            <Descriptions title="认证要求" column={1} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="真实姓名">与身份证一致的真实姓名</Descriptions.Item>
              <Descriptions.Item label="身份证号">18位有效身份证号码</Descriptions.Item>
              <Descriptions.Item label="经纪资格证">房地产经纪人从业资格证书编号</Descriptions.Item>
              <Descriptions.Item label="所属机构">执业的房产经纪机构名称</Descriptions.Item>
              <Descriptions.Item label="联系电话">常用手机号，用于接收验证码</Descriptions.Item>
            </Descriptions>
            
            {user?.role === 'agent' ? (
              <Button type="primary" size="large" onClick={() => setVerifyModal(true)}>
                提交认证申请
              </Button>
            ) : (
              <Alert
                message="请以经纪人身份登录"
                description="经纪人实名认证仅限经纪人账号使用，请先注册或切换至经纪人账号。"
                type="warning"
                showIcon
              />
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'owner',
      label: '业主直连确认',
      children: (
        <div>
          <Card style={{ borderRadius: 8 }}>
            <Alert
              message="业主直连确认机制"
              description="为确保房源真实有效，业主需通过手机验证码确认房源信息，验证通过后将获得「真房源」认证标识。"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            {user ? (
              <div>
                <Form form={confirmForm} layout="vertical" style={{ maxWidth: 400 }}>
                  <Form.Item name="propertyId" label="房源ID" rules={[{ required: true, message: '请输入房源ID' }]}>
                    <Input placeholder="请输入需要确认的房源ID" />
                  </Form.Item>
                  <Form.Item label="验证码">
                    <Input.Group compact>
                      <Form.Item name="code" noStyle rules={[{ required: true, message: '请输入验证码' }]}>
                        <Input style={{ width: '60%' }} placeholder="请输入验证码" />
                      </Form.Item>
                      <Button type="primary" onClick={handleOwnerConfirmRequest}>
                        获取验证码
                      </Button>
                    </Input.Group>
                  </Form.Item>
                  <Button type="primary" onClick={handleOwnerConfirmVerify}>
                    确认房源
                  </Button>
                </Form>
                {verifyCode && (
                  <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', borderRadius: 4 }}>
                    <Tag color="green">模拟验证码: {verifyCode}</Tag>
                    <span style={{ color: '#52c41a', fontSize: 13 }}>（实际项目中会发送短信到业主手机）</span>
                  </div>
                )}
              </div>
            ) : (
              <Alert
                message="请先登录"
                description="业主确认需要登录账号，请先登录后再进行操作。"
                type="warning"
                showIcon
              />
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'compliance',
      label: '合规监管',
      children: (
        <div>
          <Card style={{ borderRadius: 8 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <SafetyCertificateOutlined style={{ fontSize: 64, color: '#52c41a' }} />
              <h2 style={{ marginTop: 16 }}>地方住建监管平台对接</h2>
              <p style={{ color: '#666' }}>所有交易数据实时同步至地方住建部门，确保网签备案合规</p>
            </div>

            <Row gutter={[16, 16]}>
              {[
                { title: '网签备案', desc: '交易合同实时网签备案，自动生成备案号' },
                { title: '资金监管', desc: '交易资金全程监管，保障资金安全' },
                { title: '税费缴纳', desc: '税费自动测算，线上缴纳方便快捷' },
                { title: '产权过户', desc: '过户进度全程可追踪，透明公开' },
                { title: '数据上报', desc: '交易数据实时上报监管部门' },
                { title: '信用体系', desc: '建立经纪人信用评价体系' },
              ].map((item, idx) => (
                <Col span={8} key={idx}>
                  <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 6, textAlign: 'center' }}>
                    <h4 style={{ marginBottom: 8 }}>{item.title}</h4>
                    <p style={{ color: '#666', fontSize: 13, marginBottom: 0 }}>{item.desc}</p>
                  </div>
                </Col>
              ))}
            </Row>

            <div style={{ marginTop: 24, padding: 16, background: '#e6f7ff', borderRadius: 6 }}>
              <h4 style={{ color: '#1890ff', marginTop: 0 }}>监管合规承诺</h4>
              <ul style={{ color: '#0050b3', lineHeight: 2 }}>
                <li>严格遵守《城市房地产管理法》等法律法规</li>
                <li>所有房源信息真实有效，接受社会监督</li>
                <li>交易资金纳入监管账户，专款专用</li>
                <li>交易合同网签备案，保障双方权益</li>
                <li>定期向住建部门报送交易统计数据</li>
              </ul>
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card 
        title={
          <span>
            <SafetyCertificateOutlined style={{ color: '#52c41a' }} /> 真房源治理体系
          </span>
        }
        style={{ borderRadius: 8 }}
        extra={<Tag color="green">已通过住建部门备案</Tag>}
      >
        <Tabs items={tabItems} />
      </Card>

      <Modal
        title="经纪人实名认证"
        open={verifyModal}
        onOk={handleAgentVerify}
        onCancel={() => setVerifyModal(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="realName" label="真实姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item name="idCard" label="身份证号" rules={[{ required: true }]}>
            <Input placeholder="请输入18位身份证号" />
          </Form.Item>
          <Form.Item name="licenseNo" label="经纪资格证编号" rules={[{ required: true }]}>
            <Input placeholder="请输入经纪人资格证书编号" />
          </Form.Item>
          <Form.Item name="agency" label="所属经纪机构" rules={[{ required: true }]}>
            <Input placeholder="请输入所属房产经纪机构名称" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话" rules={[{ required: true }]}>
            <Input placeholder="请输入手机号" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
