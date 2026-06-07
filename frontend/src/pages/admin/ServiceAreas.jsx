import { useState, useEffect } from 'react';
import {
  Card, Row, Col, Tag, Button, Modal, Form, Input, InputNumber,
  Select, Switch, Typography, message, Descriptions,
} from 'antd';
import { EnvironmentOutlined, EditOutlined } from '@ant-design/icons';
import { adminAPI } from '../../api';

const { Text } = Typography;

const heatColors = ['#52c41a', '#73d13d', '#fadb14', '#fa8c16', '#f5222d'];
const heatLabels = ['低', '较低', '中', '较高', '高'];

const defaultAreas = [
  { id: 1, name: '朝阳区', active: true, heat: 4, orders: 35, couriers: 12 },
  { id: 2, name: '海淀区', active: true, heat: 3, orders: 28, couriers: 10 },
  { id: 3, name: '东城区', active: true, heat: 3, orders: 22, couriers: 8 },
  { id: 4, name: '西城区', active: true, heat: 2, orders: 18, couriers: 6 },
  { id: 5, name: '丰台区', active: true, heat: 2, orders: 15, couriers: 5 },
  { id: 6, name: '通州区', active: true, heat: 1, orders: 10, couriers: 4 },
  { id: 7, name: '大兴区', active: false, heat: 1, orders: 5, couriers: 2 },
  { id: 8, name: '顺义区', active: false, heat: 0, orders: 3, couriers: 1 },
  { id: 9, name: '昌平区', active: false, heat: 0, orders: 2, couriers: 1 },
];

export default function ServiceAreas() {
  const [areas, setAreas] = useState(defaultAreas);
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState({ visible: false, area: null });
  const [form] = Form.useForm();

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getServiceAreas();
      const data = res.data || res;
      if (data && (data.list || data.items)) {
        setAreas(data.list || data.items);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const handleEdit = (area) => {
    setEditModal({ visible: true, area });
    form.setFieldsValue(area);
  };

  const handleSave = async (values) => {
    try {
      if (editModal.area) {
        await adminAPI.updateServiceArea(editModal.area.id, values);
        message.success('区域设置已更新');
        setAreas((prev) =>
          prev.map((a) => (a.id === editModal.area.id ? { ...a, ...values } : a))
        );
      }
      setEditModal({ visible: false, area: null });
      form.resetFields();
    } catch {}
  };

  return (
    <div>
      <Card title="服务区域管理">
        <Row gutter={[16, 16]}>
          {areas.map((area) => (
            <Col xs={12} sm={8} md={6} key={area.id}>
              <Card
                size="small"
                hoverable
                style={{
                  borderColor: area.active ? heatColors[Math.min(area.heat, 4)] : '#d9d9d9',
                  borderWidth: 2,
                  opacity: area.active ? 1 : 0.6,
                }}
                actions={[
                  <EditOutlined key="edit" onClick={() => handleEdit(area)} />,
                ]}
              >
                <div style={{ textAlign: 'center' }}>
                  <EnvironmentOutlined style={{ fontSize: 24, color: area.active ? heatColors[Math.min(area.heat, 4)] : '#d9d9d9', marginBottom: 8 }} />
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>{area.name}</div>

                  <Tag color={area.active ? heatColors[Math.min(area.heat, 4)] : 'default'} style={{ marginBottom: 8 }}>
                    {area.active ? heatLabels[Math.min(area.heat, 4)] : '未开通'}
                  </Tag>

                  <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8 }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 11 }}>订单</Text>
                      <div style={{ fontWeight: 600 }}>{area.orders}</div>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 11 }}>跑腿员</Text>
                      <div style={{ fontWeight: 600 }}>{area.couriers}</div>
                    </div>
                  </div>

                  {!area.active && (
                    <Tag color="default" style={{ marginTop: 8 }}>未开通</Tag>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Modal
        title={`编辑区域 - ${editModal.area?.name || ''}`}
        open={editModal.visible}
        onCancel={() => { setEditModal({ visible: false, area: null }); form.resetFields(); }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="区域名称">
            <Input disabled />
          </Form.Item>
          <Form.Item name="active" label="是否开通" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="heat" label="热度等级 (0-4)">
            <InputNumber min={0} max={4} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="max_couriers" label="最大跑腿员数">
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="dispatch_radius" label="调度半径(km)">
            <InputNumber min={0.5} max={20} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
