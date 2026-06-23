import { useState } from 'react';
import {
  Card,
  List,
  Button,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Typography,
  Space,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  StarOutlined,
  StarFilled,
} from '@ant-design/icons';
import { useAppStore } from '@/store/appStore';
import { Address, Customer } from '@/types';

const { Title } = Typography;
const { Option } = Select;

const AddressesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressType, setAddressType] = useState<'sender' | 'receiver'>('sender');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [form] = Form.useForm();

  const customers = useAppStore((state) => state.customers);

  const currentCustomer: Customer | undefined = customers.find((c) => c.id === selectedCustomer);
  const addresses = currentCustomer?.address || [];

  const handleAdd = () => {
    setEditingAddress(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    form.setFieldsValue({
      name: address.name,
      phone: address.phone,
      company: address.company,
      province: address.province,
      city: address.city,
      district: address.district,
      address: address.address,
      isDefault: address.isDefault,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    message.success(editingAddress ? '地址修改成功' : '地址添加成功');
    setIsModalOpen(false);
  };

  const handleSetDefault = () => {
    message.success('已设为默认地址');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          常用地址管理
        </Title>
        <Space>
          <Select
            placeholder="选择客户"
            style={{ width: 200 }}
            value={selectedCustomer || undefined}
            onChange={setSelectedCustomer}
          >
            {customers.map((c) => (
              <Option key={c.id} value={c.id}>
                {c.name}
              </Option>
            ))}
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} disabled={!selectedCustomer}>
            添加地址
          </Button>
        </Space>
      </div>

      <Card>
        {selectedCustomer ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Tag
                  color={addressType === 'sender' ? 'blue' : 'default'}
                  style={{ cursor: 'pointer', padding: '4px 12px' }}
                  onClick={() => setAddressType('sender')}
                >
                  发货地址
                </Tag>
                <Tag
                  color={addressType === 'receiver' ? 'blue' : 'default'}
                  style={{ cursor: 'pointer', padding: '4px 12px' }}
                  onClick={() => setAddressType('receiver')}
                >
                  收货地址
                </Tag>
              </Space>
            </div>

            <List
              grid={{ gutter: 16, column: 2 }}
              dataSource={addresses}
              renderItem={(item) => (
                <List.Item>
                  <Card
                    size="small"
                    style={{
                      borderColor: item.isDefault ? '#1890ff' : '#f0f0f0',
                      borderWidth: item.isDefault ? 2 : 1,
                    }}
                    actions={[
                      <Button
                        type="link"
                        size="small"
                        icon={item.isDefault ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                        onClick={handleSetDefault}
                      >
                        {item.isDefault ? '默认' : '设为默认'}
                      </Button>,
                      <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(item)}>
                        编辑
                      </Button>,
                      <Popconfirm title="确定删除此地址？" onConfirm={() => {}}>
                        <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>,
                    ]}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <EnvironmentOutlined style={{ color: '#1890ff', marginTop: 4 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 500 }}>{item.name}</span>
                          <span style={{ color: '#999', fontSize: 12 }}>{item.phone}</span>
                          {item.isDefault && <Tag color="blue" style={{ fontSize: 10 }}>默认</Tag>}
                        </div>
                        {item.company && (
                          <div style={{ fontSize: 12, color: '#666', margin: '4px 0' }}>
                            {item.company}
                          </div>
                        )}
                        <div style={{ fontSize: 13, color: '#666' }}>
                          {item.province} {item.city} {item.district} {item.address}
                        </div>
                      </div>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
            <EnvironmentOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>请先选择客户查看地址</div>
          </div>
        )}
      </Card>

      <Modal
        title={editingAddress ? '编辑地址' : '添加地址'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText={editingAddress ? '保存' : '添加'}
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="联系人姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>

          <Form.Item
            label="联系电话"
            name="phone"
            rules={[{ required: true, message: '请输入电话号码' }]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Form.Item label="公司名称" name="company">
            <Input placeholder="请输入公司名称（选填）" />
          </Form.Item>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Form.Item
              label="省份"
              name="province"
              style={{ flex: 1, marginBottom: 0 }}
              rules={[{ required: true, message: '请选择省份' }]}
            >
              <Select placeholder="请选择">
                <Option value="广东省">广东省</Option>
                <Option value="北京市">北京市</Option>
                <Option value="上海市">上海市</Option>
                <Option value="浙江省">浙江省</Option>
                <Option value="江苏省">江苏省</Option>
                <Option value="四川省">四川省</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="城市"
              name="city"
              style={{ flex: 1, marginBottom: 0 }}
              rules={[{ required: true, message: '请选择城市' }]}
            >
              <Select placeholder="请选择">
                <Option value="深圳市">深圳市</Option>
                <Option value="广州市">广州市</Option>
                <Option value="北京市">北京市</Option>
                <Option value="上海市">上海市</Option>
                <Option value="杭州市">杭州市</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label="区县"
            name="district"
            rules={[{ required: true, message: '请输入区县' }]}
          >
            <Input placeholder="请输入区/县" />
          </Form.Item>

          <Form.Item
            label="详细地址"
            name="address"
            rules={[{ required: true, message: '请输入详细地址' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入详细地址" />
          </Form.Item>

          <Form.Item label="设为默认地址" name="isDefault" valuePropName="checked">
            <Tag>默认地址</Tag>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddressesPage;
