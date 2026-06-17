import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Drawer, Form, Input, Switch, InputNumber, message, Space, Tooltip, Divider, Descriptions, Row, Col, Statistic } from 'antd';
import { EditOutlined, SettingOutlined, CheckCircleOutlined, CloseCircleOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/api';

const gdCities = ['广州市', '深圳市', '珠海市', '汕头市', '佛山市', '韶关市', '湛江市', '肇庆市', '江门市', '茂名市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市'];
const cityCodes: Record<string, string> = { '广州市': '440100', '深圳市': '440300', '珠海市': '440400', '汕头市': '440500', '佛山市': '440600', '韶关市': '440200', '湛江市': '440800', '肇庆市': '441200', '江门市': '440700', '茂名市': '440900', '惠州市': '441300', '梅州市': '441400', '汕尾市': '441500', '河源市': '441600', '阳江市': '441700', '清远市': '441800', '东莞市': '441900', '中山市': '442000', '潮州市': '445100', '揭阳市': '445200', '云浮市': '445300' };

const mockCfgs = gdCities.map((c, i) => ({
  key: i, city: c, cityCode: cityCodes[c],
  isVisaEnabled: true, isIdCardEnabled: i !== 17, isViolationEnabled: true, isInspectionEnabled: i < 18,
  visaServiceFee: 25, idCardServiceFee: 20 + i, violationServiceFee: 5, inspectionServiceFee: 30,
  courierFeeStandard: 15 + (i % 5) * 2,
  slaPickupMinutes: 120, slaProcessHours: 72,
  hotlinePhone: '11185',
  operatorNotice: i === 0 ? '广州市高峰时段可适当延长SLA 10%' : '',
  updatedAt: dayjs().subtract(i, 'day').toISOString(),
}));

const CityConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [current, setCurrent] = useState<any>(null);
  const [form] = Form.useForm();
  const [list, setList] = useState(mockCfgs);

  useEffect(() => { (async () => { try { setLoading(true); await api.get('/admin/city-configs'); } finally { setLoading(false); } })(); }, []);

  const editCfg = (r: any) => { setCurrent(r); form.setFieldsValue({ ...r }); setDrawerOpen(true); };

  const saveCfg = async () => {
    const v = await form.validateFields();
    try {
      await api.put(`/admin/city-configs/${v.city}`, v);
      message.success(`${v.city}配置已保存`);
      setList(list.map((c: any) => c.city === v.city ? { ...c, ...v, updatedAt: new Date().toISOString() } : c));
      setDrawerOpen(false);
    } catch {}
  };

  const toggleService = (city: string, key: string, val: boolean) => {
    setList(list.map((c: any) => c.city === city ? { ...c, [key]: val } : c));
    message.success(`${city} ${key.replace('is', '').replace('Enabled', '')}服务已${val ? '启用' : '停用'}`);
  };

  const columns: any[] = [
    { title: '地市', dataIndex: 'city', width: 100, fixed: 'left', render: (v, r) => <div><div style={{ fontWeight: 600 }}>{v}</div><div style={{ fontSize: 11, color: '#999' }}>{r.cityCode}</div></div> },
    { title: '港澳/赴台签注', dataIndex: 'isVisaEnabled', width: 110, align: 'center', render: (v, r) => <Switch checked={v} onChange={(c) => toggleService(r.city, 'isVisaEnabled', c)} checkedChildren={<CheckCircleOutlined />} unCheckedChildren={<CloseCircleOutlined />} /> },
    { title: '身份证补换领', dataIndex: 'isIdCardEnabled', width: 110, align: 'center', render: (v, r) => <Switch checked={v} onChange={(c) => toggleService(r.city, 'isIdCardEnabled', c)} checkedChildren={<CheckCircleOutlined />} unCheckedChildren={<CloseCircleOutlined />} /> },
    { title: '违章查询缴费', dataIndex: 'isViolationEnabled', width: 110, align: 'center', render: (v, r) => <Switch checked={v} onChange={(c) => toggleService(r.city, 'isViolationEnabled', c)} checkedChildren={<CheckCircleOutlined />} unCheckedChildren={<CloseCircleOutlined />} /> },
    { title: '六年免检', dataIndex: 'isInspectionEnabled', width: 100, align: 'center', render: (v, r) => <Switch checked={v} onChange={(c) => toggleService(r.city, 'isInspectionEnabled', c)} checkedChildren={<CheckCircleOutlined />} unCheckedChildren={<CloseCircleOutlined />} /> },
    { title: '签注服务费(¥)', dataIndex: 'visaServiceFee', width: 110, align: 'right', sorter: (a: any, b: any) => a.visaServiceFee - b.visaServiceFee },
    { title: 'EMS标准(¥)', dataIndex: 'courierFeeStandard', width: 100, align: 'right', sorter: (a: any, b: any) => a.courierFeeStandard - b.courierFeeStandard },
    { title: '揽收SLA', dataIndex: 'slaPickupMinutes', width: 100, align: 'center', render: v => `${v}分钟` },
    { title: '出证SLA', dataIndex: 'slaProcessHours', width: 100, align: 'center', render: v => `${v}小时` },
    { title: '服务热线', dataIndex: 'hotlinePhone', width: 100 },
    { title: '最近更新', dataIndex: 'updatedAt', width: 150, render: v => dayjs(v).format('MM-DD HH:mm') },
    { title: '操作', width: 100, fixed: 'right', render: (_, r) => <Button size="small" icon={<EditOutlined />} type="link" onClick={() => editCfg(r)}>编辑</Button> },
  ];

  const stats = {
    openCities: list.filter((c: any) => c.isVisaEnabled).length,
    allCities: gdCities.length,
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card style={{ borderRadius: 10 }} size="small"><Statistic title="已开通签注服务地市" value={stats.openCities} suffix={`/ ${stats.allCities}`} valueStyle={{ color: '#00B42A' }} /></Card></Col>
        <Col span={6}><Card style={{ borderRadius: 10 }} size="small"><Statistic title="已开通身份证服务" value={list.filter((c: any) => c.isIdCardEnabled).length} suffix="个" /></Card></Col>
        <Col span={6}><Card style={{ borderRadius: 10 }} size="small"><Statistic title="已开通违章缴费" value={list.filter((c: any) => c.isViolationEnabled).length} suffix="个" /></Card></Col>
        <Col span={6}><Card style={{ borderRadius: 10 }} size="small"><Statistic title="已开通六年免检" value={list.filter((c: any) => c.isInspectionEnabled).length} suffix="个" /></Card></Col>
      </Row>

      <Card style={{ borderRadius: 10 }} size="small" title="🏙️ 广东21地市服务配置" extra={<Space>
        <Tooltip title="批量启用所有服务"><Button icon={<CheckCircleOutlined />} onClick={() => { setList(list.map((c: any) => ({ ...c, isVisaEnabled: true, isIdCardEnabled: true, isViolationEnabled: true, isInspectionEnabled: true }))); }}>全量开通</Button></Tooltip>
        <Button icon={<SaveOutlined />} type="primary">保存全部</Button>
      </Space>}>
        <Table loading={loading} columns={columns} dataSource={list} rowKey="city" scroll={{ x: 1500 }} pagination={false} size="middle"
          rowClassName={(r: any) => !(r.isVisaEnabled && r.isIdCardEnabled) ? 'bg-gray-50' : ''} />
      </Card>

      <Drawer title={`地市服务配置 - ${current?.city || ''}`} width={560} open={drawerOpen} onClose={() => setDrawerOpen(false)}
        extra={<Button type="primary" icon={<SaveOutlined />} onClick={saveCfg}>保存</Button>}>
        {current && (
          <Form form={form} layout="vertical">
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="地市">{current.city}</Descriptions.Item>
              <Descriptions.Item label="行政区划代码">{current.cityCode}</Descriptions.Item>
            </Descriptions>

            <Card title="🔌 服务开关" size="small" style={{ marginBottom: 16 }}>
              <Form.Item name="isVisaEnabled" label="港澳/赴台签注" valuePropName="checked"><Switch /></Form.Item>
              <Form.Item name="isIdCardEnabled" label="身份证补换领" valuePropName="checked"><Switch /></Form.Item>
              <Form.Item name="isViolationEnabled" label="违章查询缴费（交管12123）" valuePropName="checked"><Switch /></Form.Item>
              <Form.Item name="isInspectionEnabled" label="六年免检上门服务" valuePropName="checked"><Switch /></Form.Item>
            </Card>

            <Card title="💰 费用配置（元）" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={12}>
                <Col span={12}><Form.Item name="visaServiceFee" label="签注服务费" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} step={1} /></Form.Item></Col>
                <Col span={12}><Form.Item name="idCardServiceFee" label="身份证服务费" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} step={1} /></Form.Item></Col>
                <Col span={12}><Form.Item name="violationServiceFee" label="违章缴费服务费（每笔）" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} step={0.5} /></Form.Item></Col>
                <Col span={12}><Form.Item name="inspectionServiceFee" label="六年免检服务费" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} step={1} /></Form.Item></Col>
                <Col span={12}><Form.Item name="courierFeeStandard" label="EMS快递费（单程）" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} step={1} /></Form.Item></Col>
              </Row>
            </Card>

            <Card title="⏱️ SLA时效配置" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={12}>
                <Col span={12}><Form.Item name="slaPickupMinutes" label="揽收时限（分钟）" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={30} step={30} /></Form.Item></Col>
                <Col span={12}><Form.Item name="slaProcessHours" label="办理时限（小时）" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={12} step={12} /></Form.Item></Col>
              </Row>
            </Card>

            <Card title="☎️ 联系与通知" size="small" style={{ marginBottom: 16 }}>
              <Form.Item name="hotlinePhone" label="本地服务热线"><Input /></Form.Item>
              <Form.Item name="operatorNotice" label="运营提示（展示在用户端）"><Input.TextArea rows={2} /></Form.Item>
              <Form.Item name="gatewayEndpoint" label="省级政务网关地址" tooltip="每个地市可独立配置对接网关"><Input /></Form.Item>
            </Card>
          </Form>
        )}
      </Drawer>
    </div>
  );
};
export default CityConfigPage;
