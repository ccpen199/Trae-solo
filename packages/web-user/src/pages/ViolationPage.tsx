import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Table, Tag, Space, Checkbox, Modal, message, Tabs, Descriptions, Spin } from 'antd';
import { ArrowLeftOutlined, SearchOutlined, CheckCircleOutlined, AlertOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { GD_CITIES } from '@platform/shared';
import api from '@/api';
import dayjs from 'dayjs';

const ViolationPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [scope, setScope] = useState('NATIONWIDE');

  const doQuery = async (values: any) => {
    setLoading(true);
    try {
      const res: any = await api.post('/vehicle/violation/query', { ...values, queryScope: scope });
      setResult(res.data);
      message.success(`查询完成：共发现${res.data?.stats?.count || 0}条违章`);
    } finally { setLoading(false); }
  };

  const doPay = async () => {
    const vals = form.getFieldsValue();
    if (!vals.applicantCity) { message.warning('请选择办理城市'); return; }
    if (selectedIds.length === 0) { message.warning('请选择要处理的违章记录'); return; }
    Modal.confirm({
      title: `确认处理 ${selectedIds.length} 条违章`,
      content: (
        <div>
          <div>平台将协助您通过交管12123/公安部违章库完成缴费，信息同步至官方系统。</div>
          <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
            · 缴费完成后3-7个工作日官方系统完成销账<br/>
            · 扣分将同步至驾驶证记分周期
          </div>
        </div>
      ),
      onOk: async () => {
        setSubmitting(true);
        try {
          const res: any = await api.post('/vehicle/violation/pay', {
            ...vals,
            violationIds: selectedIds,
            ownerName: '张三',
          });
          message.success('订单已创建，请完成支付');
          navigate(`/order/${res.data.orderId}`);
        } finally { setSubmitting(false); }
      },
    });
  };

  return (
    <div>
      <div className="page-header" style={{ padding: 16 }}>
        <div onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', marginBottom: 12, cursor: 'pointer' }}>
          <ArrowLeftOutlined style={{ marginRight: 8 }} />返回
        </div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>全国违章查询与缴费</div>
        <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>400+城市接口聚合 · 实时同步交管12123</div>
      </div>

      <div className="form-section">
        <Card style={{ borderRadius: 12 }} size="small" title="🚗 车辆信息查询">
          <Form form={form} layout="vertical" onFinish={doQuery} initialValues={{ vehicleType: 'C1', queryScope: 'NATIONWIDE' }}>
            <Form.Item label="车牌号" name="plateNumber" rules={[{ required: true, message: '请输入车牌号' }]}>
              <Input placeholder="如：粤A12345" size="large" style={{ textTransform: 'uppercase' }} />
            </Form.Item>
            <div style={{ display: 'flex', gap: 12 }}>
              <Form.Item label="车辆类型" name="vehicleType" rules={[{ required: true }]} style={{ flex: 1 }}>
                <Select options={[
                  { value: 'C1', label: '小型汽车 C1/C2' },
                  { value: 'B1', label: '中型客车 B1' },
                  { value: 'B2', label: '大型货车 B2' },
                  { value: 'A1', label: '大型客车 A1' },
                  { value: 'A2', label: '牵引车 A2' },
                  { value: 'E', label: '普通摩托车 E' },
                ]} />
              </Form.Item>
            </div>
            <Form.Item label="发动机号（后6位）" name="engineNo" tooltip="部分城市查询需要">
              <Input placeholder="选填" maxLength={6} />
            </Form.Item>
            <Form.Item label="车架号（后6位）" name="vinNo" tooltip="部分城市查询需要">
              <Input placeholder="选填" maxLength={6} />
            </Form.Item>
            <Form.Item label="查询范围" name="queryScope">
              <Radio.Group value={scope} onChange={(e) => setScope(e.target.value)}>
                <Radio value="NATIONWIDE">全国（推荐）</Radio>
                <Radio value="GUANGDONG">仅广东省</Radio>
              </Radio.Group>
            </Form.Item>
            <Button type="primary" block size="large" icon={<SearchOutlined />} htmlType="submit" loading={loading}>查询违章</Button>
          </Form>
        </Card>

        {loading && <div style={{ padding: 60, textAlign: 'center' }}><Spin size="large" tip="正在连接全国400+城市接口..." /></div>}

        {result && !loading && (
          <>
            <Card style={{ margin: '16px 0', borderRadius: 12 }} size="small" title="📊 查询统计">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div style={{ padding: 12, background: '#FFF2EC', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#F53F3F' }}>{result.stats?.count || 0}</div>
                  <div style={{ fontSize: 12, color: '#996' }}>违章条数</div>
                </div>
                <div style={{ padding: 12, background: '#FFF7E8', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#FF7D00' }}>¥{result.stats?.totalFine || 0}</div>
                  <div style={{ fontSize: 12, color: '#996' }}>罚款合计</div>
                </div>
                <div style={{ padding: 12, background: '#FFF1F0', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#CB2634' }}>¥{result.stats?.totalLate || 0}</div>
                  <div style={{ fontSize: 12, color: '#996' }}>滞纳金</div>
                </div>
                <div style={{ padding: 12, background: '#E8FFEA', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#00B42A' }}>{result.stats?.totalPoints || 0}分</div>
                  <div style={{ fontSize: 12, color: '#458' }}>记分合计</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 10 }}>
                查询城市：{result.citiesQueried}个 · 查询范围：{result.queryScope === 'NATIONWIDE' ? '全国' : '广东省'}
              </div>
            </Card>

            {result.violations?.length > 0 && (
              <>
                <Card style={{ borderRadius: 12 }} size="small" title={`⚠️ 违章记录（${result.violations.length}条）`}
                  extra={
                    <Space>
                      <Checkbox
                        checked={selectedIds.length === result.violations.length && result.violations.length > 0}
                        onChange={(e) => setSelectedIds(e.target.checked ? result.violations.map((v: any) => v.id) : [])}
                      >全选</Checkbox>
                    </Space>
                  }
                >
                  {result.violations.map((v: any) => (
                    <div key={v.id} style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Checkbox
                          checked={selectedIds.includes(v.id)}
                          onChange={(e) => {
                            setSelectedIds(prev => e.target.checked ? [...prev, v.id] : prev.filter(i => i !== v.id));
                          }}
                          style={{ marginTop: 4, marginRight: 10 }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              <Tag color="red" style={{ marginRight: 6 }}>扣{v.deductPoints}分</Tag>
                              <Tag color="orange">¥{v.fineAmount}</Tag>
                              {v.lateFee > 0 && <Tag color="magenta">滞纳金¥{v.lateFee}</Tag>}
                            </div>
                            <span style={{ fontSize: 11, color: '#999' }}>{dayjs(v.violationTime).format('MM-DD HH:mm')}</span>
                          </div>
                          <div style={{ marginTop: 6, fontSize: 14, color: '#333' }}>
                            <b>[{v.violationCode}]</b> {v.violationDesc}
                          </div>
                          <div style={{ marginTop: 2, fontSize: 12, color: '#666' }}>{v.violationLocation}</div>
                          <div style={{ marginTop: 2, fontSize: 11, color: '#999' }}>
                            数据来源：{v.source === 'TRAFFIC_12123' ? '交管12123' : '公安部违章库'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </Card>

                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                  <Card style={{ borderRadius: 12 }} size="small" title="📍 办理城市（生成订单）">
                    <Form.Item name="applicantCity" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                      <Select placeholder="选择办理城市">
                        {GD_CITIES.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
                      </Select>
                    </Form.Item>
                  </Card>
                  <Button
                    type="primary"
                    block
                    size="large"
                    style={{ marginTop: 16 }}
                    onClick={doPay}
                    loading={submitting}
                    disabled={selectedIds.length === 0}
                  >
                    在线缴费处理（{selectedIds.length}条）
                  </Button>
                  <div style={{ marginTop: 10, padding: 10, background: '#f5f7fa', borderRadius: 8, fontSize: 12, color: '#666' }}>
                    <AlertOutlined style={{ marginRight: 6, color: '#FF7D00' }} />
                    <b>缴费说明</b>：支持银联/微信/支付宝，款项进入监管账户，T+3工作日划转至财政专户，电子回单可在订单详情查看。
                  </div>
                </Form>
              </>
            )}

            {result.violations?.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <CheckCircleOutlined style={{ fontSize: 48, color: '#00B42A' }} />
                <div style={{ marginTop: 16, fontSize: 16, fontWeight: 500 }}>恭喜，暂无违章记录！</div>
                <div style={{ marginTop: 6, fontSize: 13, color: '#999' }}>继续保持良好的驾驶习惯 🚗💨</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

import { Radio } from 'antd';
export default ViolationPage;
