import React from 'react';
import { Card, Table, Tag, Space, Button, Row, Col, Statistic, Switch, Divider, List, Descriptions, message, Alert } from 'antd';
import { SettingOutlined, UserOutlined, SafetyOutlined, DatabaseOutlined, CloudServerOutlined, BellOutlined, TeamOutlined, KeyOutlined } from '@ant-design/icons';

const SystemPage: React.FC = () => {
  const users = [
    { id: 'U1', name: '王审核', role: 'reviewer', phone: '137****1111', authLevel: 'L3', status: 'active', doneCount: 456 },
    { id: 'U2', name: '赵复审', role: 'reviewer', phone: '137****2222', authLevel: 'L3', status: 'active', doneCount: 398 },
    { id: 'U3', name: '孙受理', role: 'reviewer', phone: '137****3333', authLevel: 'L2', status: 'active', doneCount: 721 },
    { id: 'U4', name: '管理员', role: 'admin', phone: '137****0000', authLevel: 'L3', status: 'active', doneCount: 518 },
    { id: 'U5', name: '李发证', role: 'reviewer', phone: '137****4444', authLevel: 'L2', status: 'inactive', doneCount: 211 },
  ];

  return (
    <div>
      <Alert
        message="政务云安全提示"
        description="本后台系统部署于省级政务云内网，所有操作受审计系统全量记录。《密码法》第二十一条强制要求：密钥分等级保护，严禁在非涉密网络传输明文密钥。"
        type="warning" showIcon closable style={{ marginBottom: 16, borderRadius: 10 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}><Card style={{ borderRadius: 10 }}><Statistic prefix={<TeamOutlined />} title="系统用户" value={28} /></Card></Col>
        <Col xs={12} sm={6}><Card style={{ borderRadius: 10 }}><Statistic prefix={<KeyOutlined />} title="CA有效证书" value={28} suffix="本" valueStyle={{ color: '#13c2c2' }} /></Card></Col>
        <Col xs={12} sm={6}><Card style={{ borderRadius: 10 }}><Statistic prefix={<BellOutlined />} title="今日操作日志" value={1248} valueStyle={{ color: '#722ed1' }} /></Card></Col>
        <Col xs={12} sm={6}><Card style={{ borderRadius: 10 }}><Statistic prefix={<CloudServerOutlined />} title="政务云连接" value={99.98} suffix="%" valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title={<span><UserOutlined /> 用户与权限管理</span>} bordered={false} style={{ borderRadius: 10 }}
            extra={<Button type="primary" size="small" icon={<SettingOutlined />}>新增审核人员</Button>}>
            <Table
              size="small" rowKey="id" pagination={false} dataSource={users}
              columns={[
                { title: '姓名', dataIndex: 'name', width: 90 },
                { title: '角色', dataIndex: 'role', width: 100, render: v => v === 'admin' ? <Tag color="red">系统管理员</Tag> : <Tag color="blue">审核员</Tag> },
                { title: '手机号', dataIndex: 'phone', width: 110 },
                { title: '实名等级', dataIndex: 'authLevel', width: 80, render: v => <Tag color="purple">{v}</Tag> },
                { title: '累计审核', dataIndex: 'doneCount', width: 90, render: v => <b>{v}</b> },
                { title: '状态', dataIndex: 'status', width: 90, render: v => v === 'active' ? <Tag color="green">启用</Tag> : <Tag>停用</Tag> },
                { title: '操作', width: 150, render: () => (<Space size={4}><Button size="small">编辑</Button><Button size="small" danger>停用</Button></Space>) }
              ]}
            />
          </Card>

          <Card title={<span><DatabaseOutlined /> 集成对接配置</span>} bordered={false} style={{ borderRadius: 10, marginTop: 16 }}>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="省级统一身份认证">
                <Tag color="green">已对接</Tag> OAuth 2.0 / 三级实名
              </Descriptions.Item>
              <Descriptions.Item label="省级电子证照库">
                <Tag color="green">已对接</Tag> RESTful API v3
              </Descriptions.Item>
              <Descriptions.Item label="省级电子认证(CA)中心">
                <Tag color="green">已对接</Tag> SM2 国密
              </Descriptions.Item>
              <Descriptions.Item label="TSA可信时间戳">
                <Tag color="green">已对接</Tag> RFC3161
              </Descriptions.Item>
              <Descriptions.Item label="政务云对象存储">
                <Tag color="cyan">已对接</Tag> S3兼容
              </Descriptions.Item>
              <Descriptions.Item label="司法存证平台">
                <Tag color="orange">待对接</Tag> Q3完成
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title={<span><SafetyOutlined /> 系统安全策略</span>} bordered={false} style={{ borderRadius: 10 }}>
            <List
              size="small"
              dataSource={[
                { t: '国密算法', d: 'SM2签名 / SM3哈希 / SM4对称加密', ok: true },
                { t: '密码周期策略', d: '每90天强制更换，最小长度12位', ok: true },
                { t: '双因子认证', d: '账号密码 + UKey/生物特征', ok: true },
                { t: '登录失败锁定', d: '5次失败锁定30分钟', ok: true },
                { t: '会话超时', d: '30分钟无操作自动登出', ok: true },
                { t: '操作审计', d: '全量保留 ≥ 6年', ok: true },
                { t: 'IP白名单', d: '仅政务云内网可访问', ok: true },
                { t: '敏感字段加密', d: '身份证/手机号SM4存储', ok: true },
                { t: '跨域CORS', d: '仅允许已注册域名', ok: true },
                { t: '备份策略', d: '日增量 / 周全量 / 异地灾备', ok: true }
              ]}
              renderItem={(it) => (
                <List.Item
                  actions={[<Switch defaultChecked size="small" disabled />]}
                  style={{ padding: '10px 4px' }}
                >
                  <List.Item.Meta
                    avatar={it.ok ? <Tag color="green">✓</Tag> : <Tag>○</Tag>}
                    title={<span style={{ fontWeight: 500 }}>{it.t}</span>}
                    description={<span style={{ fontSize: 12, color: '#64748b' }}>{it.d}</span>}
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card title="⚙️ 服务启停与版本" bordered={false} style={{ borderRadius: 10, marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row justify="space-between" align="middle">
                <div><b>后端API服务</b><div style={{ fontSize: 11, color: '#64748b' }}>Express · Node.js 18</div></div>
                <Space><Tag color="green">运行中</Tag><Button size="small" danger onClick={() => message.warning('生产环境禁止从Web界面停止服务')}>重启</Button></Space>
              </Row>
              <Divider style={{ margin: '8px 0' }} />
              <Row justify="space-between" align="middle">
                <div><b>政务对接代理</b><div style={{ fontSize: 11, color: '#64748b' }}>API Gateway · mTLS</div></div>
                <Space><Tag color="green">运行中</Tag><Tag color="blue">延迟 18ms</Tag></Space>
              </Row>
              <Divider style={{ margin: '8px 0' }} />
              <Row justify="space-between" align="middle">
                <div><b>系统版本</b><div style={{ fontSize: 11, color: '#64748b' }}>构建号 20240515.1</div></div>
                <Space><Tag color="geekblue">v1.0.0</Tag><Button size="small" onClick={() => message.success('已是最新版本')}>检查更新</Button></Space>
              </Row>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SystemPage;
