import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Input, Select, InputNumber, Button, message, 
  Switch, Space, List, Tag, Divider, Modal
} from 'antd';
import { 
  PlusOutlined, EnvironmentOutlined, CalculatorOutlined, 
  CarryOutOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import type { ServicePackage, PackageItem } from '../types';

const { Option } = Select;
const { TextArea } = Input;

function PublishMoving() {
  const [form] = Form.useForm();
  const [packageList, setPackageList] = useState<PackageItem[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<ServicePackage[]>([]);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);
  const [itemForm] = Form.useForm();
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchServicePackages();
  }, []);

  const fetchServicePackages = async () => {
    try {
      const data: any = await api.get('/moving-orders/service-packages/list');
      setServicePackages(data.packages);
    } catch (error) {
      console.error('Failed to fetch service packages:', error);
    }
  };

  const vehicleTypes = ['厢式货车', '平板货车', '金杯车', '依维柯', '其他'];

  const calculateTotal = () => {
    const values = form.getFieldsValue();
    let total = 0;
    
    selectedPackages.forEach(pkg => {
      total += pkg.base_price;
    });

    const floorPrice = calculateFloorPrice(values);
    const distance = values.distance || 0;
    total += distance * 5;

    return total + floorPrice;
  };

  const calculateFloorPrice = (values: any) => {
    let price = 0;
    if (!values.from_elevator && values.from_floor > 1) {
      price += (values.from_floor - 1) * 50;
    }
    if (!values.to_elevator && values.to_floor > 1) {
      price += (values.to_floor - 1) * 50;
    }
    return price;
  };

  const onFinish = async (values: any) => {
    try {
      const total_price = calculateTotal();
      const base_price = (values.distance || 0) * 5 + 200;
      const package_price = selectedPackages.reduce((sum, pkg) => sum + pkg.base_price, 0);
      const floor_price = calculateFloorPrice(values);

      await api.post('/moving-orders', {
        ...values,
        package_list: packageList,
        service_packages: selectedPackages,
        base_price,
        package_price,
        floor_price,
        total_price,
      });
      message.success('发布成功');
      navigate('/moving');
    } catch (error: any) {
      message.error(error.response?.data?.error || '发布失败');
    }
  };

  const handleAddItem = (values: any) => {
    setPackageList([...packageList, { ...values, id: Date.now() } as PackageItem]);
    setAddItemModalVisible(false);
    itemForm.resetFields();
  };

  const handleRemoveItem = (index: number) => {
    const newList = [...packageList];
    newList.splice(index, 1);
    setPackageList(newList);
  };

  const togglePackage = (pkg: ServicePackage) => {
    const exists = selectedPackages.find(p => p.id === pkg.id);
    if (exists) {
      setSelectedPackages(selectedPackages.filter(p => p.id !== pkg.id));
    } else {
      setSelectedPackages([...selectedPackages, pkg]);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <Card title="发布搬家需求" extra={<Button onClick={() => navigate(-1)}>返回</Button>}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            vehicle_type: '厢式货车',
            from_floor: 1,
            from_elevator: true,
            to_floor: 1,
            to_elevator: true,
            distance: 10,
            title: '搬家服务',
          }}
        >
          <Form.Item label="需求标题" name="title" rules={[{ required: true, message: '请输入需求标题' }]}>
            <Input placeholder="请简要描述您的搬家需求" size="large" />
          </Form.Item>

          <Divider orientation="left">起始地信息</Divider>
          
          <Form.Item label="起始地址" name="from_address" rules={[{ required: true, message: '请输入起始地址' }]}>
            <Input placeholder="请输入起始详细地址" prefix={<EnvironmentOutlined />} />
          </Form.Item>

          <Space.Compact style={{ width: '100%' }}>
            <Form.Item label="楼层" name="from_floor" style={{ flex: 1 }}>
              <InputNumber min={1} max={50} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="有电梯" name="from_elevator" valuePropName="checked" style={{ flex: 1 }}>
              <Switch />
            </Form.Item>
          </Space.Compact>

          <Divider orientation="left">目的地信息</Divider>

          <Form.Item label="目的地址" name="to_address" rules={[{ required: true, message: '请输入目的地址' }]}>
            <Input placeholder="请输入目的详细地址" prefix={<EnvironmentOutlined />} />
          </Form.Item>

          <Space.Compact style={{ width: '100%' }}>
            <Form.Item label="楼层" name="to_floor" style={{ flex: 1 }}>
              <InputNumber min={1} max={50} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="有电梯" name="to_elevator" valuePropName="checked" style={{ flex: 1 }}>
              <Switch />
            </Form.Item>
          </Space.Compact>

          <Form.Item label="预计距离 (公里)" name="distance">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>

          <Form.Item label="车型" name="vehicle_type">
            <Select placeholder="请选择车型">
              {vehicleTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Form.Item>

          <Divider orientation="left">服务包选择</Divider>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
            {servicePackages.map(pkg => {
              const selected = selectedPackages.some(p => p.id === pkg.id);
              return (
                <Card 
                  key={pkg.id}
                  size="small"
                  style={{ 
                    cursor: 'pointer',
                    border: selected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    background: selected ? '#e6f7ff' : 'white',
                  }}
                  onClick={() => togglePackage(pkg)}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{pkg.name}</div>
                  <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 8 }}>{pkg.description}</div>
                  <div style={{ color: '#fa8c16', fontWeight: 600 }}>¥{pkg.base_price}</div>
                </Card>
              );
            })}
          </div>

          <Divider orientation="left">
            <Space>
              物品清单
              <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setAddItemModalVisible(true)}>
                添加物品
              </Button>
            </Space>
          </Divider>

          {packageList.length > 0 ? (
            <List
              size="small"
              dataSource={packageList}
              renderItem={(item, index) => (
                <List.Item
                  actions={[
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveItem(index)} />
                  ]}
                >
                  <List.Item.Meta
                    title={item.name}
                    description={
                      <Space>
                        <span>数量: {item.quantity}</span>
                        {item.size && <Tag>{item.size}</Tag>}
                        {item.fragile && <Tag color="red">易碎</Tag>}
                      </Space>
                    }
                  />
                </List.Item>
              )}
              style={{ marginBottom: 24 }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 24, color: '#8c8c8c', background: '#fafafa', borderRadius: 8, marginBottom: 24 }}>
              <CarryOutOutlined style={{ fontSize: 32, marginBottom: 8 }} />
              <div>暂无物品清单</div>
              <Button type="dashed" size="small" style={{ marginTop: 8 }} onClick={() => setAddItemModalVisible(true)}>
                添加物品
              </Button>
            </div>
          )}

          <Form.Item label="备注说明" name="description">
            <TextArea rows={3} placeholder="请填写其他说明信息" />
          </Form.Item>

          <Card size="small" style={{ marginBottom: 24, background: '#f5f5f5', border: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalculatorOutlined /> 预估总价
              </span>
              <span style={{ fontSize: 28, fontWeight: 600, color: '#fa8c16' }}>
                ¥{calculateTotal()}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
              基础费用 + 服务包 + 楼层费 + 里程费
            </div>
          </Card>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" size="large" htmlType="submit" block>
              <PlusOutlined /> 发布搬家需求
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title="添加物品"
        open={addItemModalVisible}
        onCancel={() => setAddItemModalVisible(false)}
        footer={null}
      >
        <Form form={itemForm} onFinish={handleAddItem} layout="vertical">
          <Form.Item label="物品名称" name="name" rules={[{ required: true, message: '请输入物品名称' }]}>
            <Input placeholder="如：沙发、冰箱等" />
          </Form.Item>
          <Form.Item label="数量" name="quantity" rules={[{ required: true, message: '请输入数量' }]}>
            <InputNumber min={1} style={{ width: '100%' }} defaultValue={1} />
          </Form.Item>
          <Form.Item label="尺寸" name="size">
            <Select placeholder="请选择尺寸">
              <Option value="small">小件</Option>
              <Option value="medium">中件</Option>
              <Option value="large">大件</Option>
            </Select>
          </Form.Item>
          <Form.Item label="易碎品" name="fragile" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">添加</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default PublishMoving;
