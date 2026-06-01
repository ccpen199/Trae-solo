import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Select,
  InputNumber,
  Input,
  Modal,
  Space,
  Typography,
  message,
  Tag,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { lossAPI } from '../services/api';
import { LossItem, Part } from '../types';
import { useParams } from 'react-router-dom';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PARTS_DATA: Part[] = [
  { code: 'front_bumper', name: '前保险杠' },
  { code: 'rear_bumper', name: '后保险杠' },
  { code: 'left_front_door', name: '左前门' },
  { code: 'right_front_door', name: '右前门' },
  { code: 'left_rear_door', name: '左后门' },
  { code: 'right_rear_door', name: '右后门' },
  { code: 'hood', name: '引擎盖' },
  { code: 'trunk', name: '后备箱盖' },
  { code: 'left_front_fender', name: '左前翼子板' },
  { code: 'right_front_fender', name: '右前翼子板' },
  { code: 'left_rear_fender', name: '左后翼子板' },
  { code: 'right_rear_fender', name: '右后翼子板' },
  { code: 'roof', name: '车顶' },
  { code: 'windshield', name: '前挡风玻璃' },
  { code: 'rear_windshield', name: '后挡风玻璃' },
  { code: 'left_headlight', name: '左前大灯' },
  { code: 'right_headlight', name: '右前大灯' },
  { code: 'left_taillight', name: '左后尾灯' },
  { code: 'right_taillight', name: '右后尾灯' },
  { code: 'grille', name: '中网' },
  { code: 'left_mirror', name: '左后视镜' },
  { code: 'right_mirror', name: '右后视镜' },
];

const PARTS_PRICES: Record<string, number> = {
  front_bumper: 1500, rear_bumper: 1200, left_front_door: 2000,
  right_front_door: 2000, left_rear_door: 1800, right_rear_door: 1800,
  hood: 2500, trunk: 2200, left_front_fender: 800, right_front_fender: 800,
  left_rear_fender: 700, right_rear_fender: 700, roof: 3000,
  windshield: 1800, rear_windshield: 1500, left_headlight: 2000,
  right_headlight: 2000, left_taillight: 1200, right_taillight: 1200,
  grille: 800, left_mirror: 600, right_mirror: 600,
};

const LossManagement: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const [lossItems, setLossItems] = useState<LossItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<LossItem | null>(null);
  const [form] = Form.useForm();
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [versions, setVersions] = useState<number[]>([]);

  useEffect(() => {
    if (taskId) {
      loadLossItems();
      loadVersions();
    }
  }, [taskId, selectedVersion]);

  const loadLossItems = async () => {
    setLoading(true);
    try {
      const response = await lossAPI.getLossItems(taskId!, selectedVersion || undefined);
      setLossItems(response.data);
    } catch (error) {
      message.error('加载损失项目失败');
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async () => {
    try {
      const response = await lossAPI.getVersions(taskId!);
      setVersions(response.data);
    } catch (error) {
      console.error('加载版本列表失败');
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item: LossItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      part: item.part,
      part_name: item.part_name,
      accessory: item.accessory,
      accessory_name: item.accessory_name,
      labor_fee: item.labor_fee,
      residual_value: item.residual_value,
      remarks: item.remarks,
      manual_adjust_reason: item.manual_adjust_reason,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (editingItem) {
        await lossAPI.updateLossItem(editingItem.id, values);
        message.success('更新成功');
      } else {
        await lossAPI.createLossItems(taskId!, [{
          ...values,
          price_source: 'system',
        }]);
        message.success('添加成功');
      }
      setModalVisible(false);
      loadLossItems();
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await lossAPI.deleteLossItem(itemId);
      message.success('删除成功');
      loadLossItems();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handlePartChange = (partCode: string) => {
    const part = PARTS_DATA.find(p => p.code === partCode);
    if (part) {
      form.setFieldValue('part_name', part.name);
    }
  };

  const totalAmount = lossItems.reduce((sum, item) => sum + item.total_amount, 0);
  const totalParts = lossItems.reduce((sum, item) => sum + (PARTS_PRICES[item.part] || 0), 0);
  const totalLabor = lossItems.reduce((sum, item) => sum + item.labor_fee, 0);
  const totalResidual = lossItems.reduce((sum, item) => sum + item.residual_value, 0);

  const columns = [
    {
      title: '部位',
      dataIndex: 'part_name',
      key: 'part_name',
      width: 150,
    },
    {
      title: '配件',
      dataIndex: 'accessory_name',
      key: 'accessory_name',
      width: 120,
      render: (name: string) => name || '-',
    },
    {
      title: '配件价格',
      key: 'part_price',
      width: 100,
      render: (_: any, record: LossItem) => `¥${PARTS_PRICES[record.part] || 0}`,
    },
    {
      title: '工时费',
      dataIndex: 'labor_fee',
      key: 'labor_fee',
      width: 100,
      render: (fee: number) => `¥${fee}`,
    },
    {
      title: '残值',
      dataIndex: 'residual_value',
      key: 'residual_value',
      width: 100,
      render: (value: number) => value > 0 ? `-¥${value}` : '-',
    },
    {
      title: '小计',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      render: (amount: number) => <strong>¥{amount}</strong>,
    },
    {
      title: '价格来源',
      dataIndex: 'price_source',
      key: 'price_source',
      width: 100,
      render: (source: string) => (
        <Tag color={source === 'manual' ? 'orange' : 'blue'}>
          {source === 'manual' ? '人工调整' : '系统定价'}
        </Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: any, record: LossItem) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>损失录入</Title>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="配件总价"
              value={totalParts}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="工时费总计"
              value={totalLabor}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="残值抵扣"
              value={totalResidual}
              prefix="-¥"
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="定损总计"
              value={totalAmount}
              prefix="¥"
              valueStyle={{ color: '#f5222d', fontWeight: 'bold' }}
            />
          </Col>
        </Row>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Select
              placeholder="选择版本"
              style={{ width: 150 }}
              allowClear
              value={selectedVersion}
              onChange={setSelectedVersion}
            >
              {versions.map((v) => (
                <Option key={v} value={v}>版本 {v}</Option>
              ))}
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加损失项目
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={lossItems}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑损失项目' : '添加损失项目'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="part"
            label="受损部位"
            rules={[{ required: true, message: '请选择受损部位' }]}
          >
            <Select placeholder="请选择" onChange={handlePartChange}>
              {PARTS_DATA.map((part) => (
                <Option key={part.code} value={part.code}>{part.name} (¥{PARTS_PRICES[part.code]})</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="part_name" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="accessory" label="配件编码">
            <Input placeholder="请输入配件编码（可选）" />
          </Form.Item>

          <Form.Item name="accessory_name" label="配件名称">
            <Input placeholder="请输入配件名称（可选）" />
          </Form.Item>

          <Form.Item
            name="labor_fee"
            label="工时费"
            rules={[{ required: true, message: '请输入工时费' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="请输入工时费"
              addonAfter="元"
            />
          </Form.Item>

          <Form.Item name="residual_value" label="残值">
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="请输入残值（如有）"
              addonAfter="元"
            />
          </Form.Item>

          <Form.Item name="manual_adjust_reason" label="人工调整原因">
            <TextArea rows={2} placeholder="如有人工调整价格，请填写原因" />
          </Form.Item>

          <Form.Item name="remarks" label="备注">
            <TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LossManagement;
