import { useState, useEffect } from 'react';
import { Card, Form, InputNumber, Switch, Button, Tag, Space, Input, message, Row, Col, Modal } from 'antd';
import { SafetyOutlined, LockOutlined, KeyOutlined, CloudServerOutlined, PlusOutlined, UndoOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { PageContainer } from '@/components/common';
import { getSecurityConfig, updateSecurityConfig, type SecurityConfig } from '@/services/api/system';

const defaultConfig: SecurityConfig = {
  passwordMinLength: 8,
  passwordComplexity: true,
  passwordExpireDays: 90,
  passwordHistoryCount: 3,
  loginFailThreshold: 5,
  loginLockDuration: 30,
  sessionTimeout: 30,
  twoFactorEnabled: false,
  dataEncryptionEnabled: true,
  ipWhitelist: [],
};

const SecurityConfigPage = () => {
  const [form] = Form.useForm();
  const [ipWhitelist, setIpWhitelist] = useState<string[]>([]);
  const [newIp, setNewIp] = useState('');

  const { data: configData } = useRequest(getSecurityConfig);

  useEffect(() => {
    if (configData?.data) {
      const config = configData.data;
      form.setFieldsValue({
        passwordMinLength: config.passwordMinLength,
        passwordComplexity: config.passwordComplexity,
        passwordExpireDays: config.passwordExpireDays,
        passwordHistoryCount: config.passwordHistoryCount,
        loginFailThreshold: config.loginFailThreshold,
        loginLockDuration: config.loginLockDuration,
        sessionTimeout: config.sessionTimeout,
        twoFactorEnabled: config.twoFactorEnabled,
        dataEncryptionEnabled: config.dataEncryptionEnabled,
      });
      setIpWhitelist(config.ipWhitelist || []);
    }
  }, [configData, form]);

  const { run: doSave, loading: saving } = useRequest(updateSecurityConfig, {
    manual: true,
    onSuccess: () => message.success('安全配置保存成功'),
  });

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      doSave({ ...values, ipWhitelist });
    } catch { /* validation failed */ }
  };

  const handleReset = () => {
    Modal.confirm({
      title: '重置确认',
      content: '确定要恢复所有安全配置为默认值吗？',
      onOk: () => {
        form.setFieldsValue({
          passwordMinLength: defaultConfig.passwordMinLength,
          passwordComplexity: defaultConfig.passwordComplexity,
          passwordExpireDays: defaultConfig.passwordExpireDays,
          passwordHistoryCount: defaultConfig.passwordHistoryCount,
          loginFailThreshold: defaultConfig.loginFailThreshold,
          loginLockDuration: defaultConfig.loginLockDuration,
          sessionTimeout: defaultConfig.sessionTimeout,
          twoFactorEnabled: defaultConfig.twoFactorEnabled,
          dataEncryptionEnabled: defaultConfig.dataEncryptionEnabled,
        });
        setIpWhitelist([]);
        message.info('已恢复为默认配置，请点击保存以生效');
      },
    });
  };

  const handleAddIp = () => {
    if (!newIp) return;
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newIp)) {
      message.error('请输入正确的IP地址');
      return;
    }
    if (ipWhitelist.includes(newIp)) {
      message.warning('IP地址已存在');
      return;
    }
    setIpWhitelist([...ipWhitelist, newIp]);
    setNewIp('');
  };

  const handleRemoveIp = (ip: string) => {
    setIpWhitelist(ipWhitelist.filter((item) => item !== ip));
  };

  return (
    <PageContainer title="等保配置" subTitle="信息系统安全等级保护配置管理">
      <Form form={form} layout="vertical">
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <span><LockOutlined style={{ marginRight: 8 }} />密码策略</span>
              }
              style={{ marginBottom: 16 }}
            >
              <Form.Item name="passwordMinLength" label="最小密码长度" rules={[{ required: true }]}>
                <InputNumber min={6} max={32} addonAfter="位" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="passwordComplexity" label="密码复杂度要求" valuePropName="checked" extra="开启后密码需包含大小写字母、数字和特殊字符">
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
              <Form.Item name="passwordExpireDays" label="密码过期天数" rules={[{ required: true }]}>
                <InputNumber min={0} max={365} addonAfter="天" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="passwordHistoryCount" label="历史密码记录数" rules={[{ required: true }]} extra="不能重复使用最近N次使用过的密码">
                <InputNumber min={0} max={24} addonAfter="次" style={{ width: '100%' }} />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <span><SafetyOutlined style={{ marginRight: 8 }} />登录策略</span>
              }
              style={{ marginBottom: 16 }}
            >
              <Form.Item name="loginFailThreshold" label="失败锁定阈值" rules={[{ required: true }]} extra="连续登录失败N次后锁定账号">
                <InputNumber min={1} max={20} addonAfter="次" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="loginLockDuration" label="锁定时间" rules={[{ required: true }]}>
                <InputNumber min={1} max={1440} addonAfter="分钟" style={{ width: '100%' }} />
              </Form.Item>
            </Card>

            <Card
              title={
                <span><CloudServerOutlined style={{ marginRight: 8 }} />会话管理</span>
              }
              style={{ marginBottom: 16 }}
            >
              <Form.Item name="sessionTimeout" label="会话超时时间" rules={[{ required: true }]}>
                <InputNumber min={5} max={480} addonAfter="分钟" style={{ width: '100%' }} />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <span><KeyOutlined style={{ marginRight: 8 }} />安全开关</span>
              }
              style={{ marginBottom: 16 }}
            >
              <Form.Item name="twoFactorEnabled" label="双因素认证" valuePropName="checked">
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
              <Form.Item name="dataEncryptionEnabled" label="数据加密传输" valuePropName="checked">
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title="IP白名单"
              style={{ marginBottom: 16 }}
            >
              <Space style={{ marginBottom: 12, width: '100%' }}>
                <Input
                  placeholder="输入IP地址"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  onPressEnter={handleAddIp}
                  style={{ width: 200 }}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddIp}>
                  添加
                </Button>
              </Space>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ipWhitelist.map((ip) => (
                  <Tag
                    key={ip}
                    closable
                    onClose={() => handleRemoveIp(ip)}
                    style={{ padding: '2px 8px' }}
                  >
                    {ip}
                  </Tag>
                ))}
                {ipWhitelist.length === 0 && (
                  <span style={{ color: '#999', fontSize: 13 }}>暂无IP白名单</span>
                )}
              </div>
            </Card>
          </Col>
        </Row>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Space>
            <Button size="large" onClick={handleReset} icon={<UndoOutlined />}>
              恢复默认
            </Button>
            <Button type="primary" size="large" onClick={handleSave} loading={saving} style={{ minWidth: 160 }}>
              保存配置
            </Button>
          </Space>
        </div>
      </Form>
    </PageContainer>
  );
};

export default SecurityConfigPage;
