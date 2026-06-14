import React, { useState, useEffect } from 'react';
import { Table, Card, Select, Button, Space, Tag, Modal, Form, Input, InputNumber, Switch, List, message, Spin, Popconfirm, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, EnvironmentOutlined, DeleteOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { getAdminRoutes, createRoute, updateRoute } from '../../api/admin';

const { Option } = Select;

const Routes = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [stationModalVisible, setStationModalVisible] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [form] = Form.useForm();
  const [stationForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getAdminRoutes();
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRoute(null);
    form.resetFields();
    form.setFieldsValue({
      transport_type: 'metro',
      status: 'active',
      stations: []
    });
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRoute(record);
    form.setFieldsValue({
      ...record,
      stations: record.stations || []
    });
    setModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      if (editingRoute) {
        await updateRoute(editingRoute.id, values);
        message.success('线路更新成功');
      } else {
        await createRoute(values);
        message.success('线路创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (err) {
      console.error(err);
      message.error('保存失败');
    }
  };

  const handleManageStations = (record) => {
    setSelectedRoute(record);
    stationForm.setFieldsValue({
      stations: record.stations || []
    });
    setStationModalVisible(true);
  };

  const handleSaveStations = (values) => {
    const updatedData = data.map(route => 
      route.id === selectedRoute.id 
        ? { ...route, stations: values.stations } 
        : route
    );
    setData(updatedData);
    message.success('站点更新成功');
    setStationModalVisible(false);
  };

  const getTypeTag = (type) => {
    const typeMap = {
      metro: { color: 'blue', text: '地铁' },
      bus: { color: 'green', text: '公交' },
      tram: { color: 'orange', text: '有轨电车' }
    };
    const config = typeMap[type] || { color: 'default', text: type };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getStatusTag = (status) => {
    const statusMap = {
      active: { color: 'green', text: '运营中' },
      inactive: { color: 'default', text: '停运' },
      construction: { color: 'orange', text: '建设中' }
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '线路编号',
      dataIndex: 'route_code',
      key: 'route_code',
      width: 120
    },
    {
      title: '线路名称',
      dataIndex: 'route_name',
      key: 'route_name',
      width: 150
    },
    {
      title: '交通类型',
      dataIndex: 'transport_type',
      key: 'transport_type',
      width: 100,
      render: (type) => getTypeTag(type)
    },
    {
      title: '起始站',
      dataIndex: 'start_station',
      key: 'start_station',
      width: 130
    },
    {
      title: '终点站',
      dataIndex: 'end_station',
      key: 'end_station',
      width: 130
    },
    {
      title: '站点数',
      dataIndex: 'station_count',
      key: 'station_count',
      width: 90,
      render: (_, record) => record.stations?.length || 0
    },
    {
      title: '首班车',
      dataIndex: 'first_departure',
      key: 'first_departure',
      width: 100
    },
    {
      title: '末班车',
      dataIndex: 'last_departure',
      key: 'last_departure',
      width: 100
    },
    {
      title: '票价（元）',
      dataIndex: 'base_price',
      key: 'base_price',
      width: 100,
      render: (price) => `¥ ${price || '0.00'}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status)
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            icon={<EnvironmentOutlined />}
            onClick={() => handleManageStations(record)}
          >
            站点
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="admin-routes">
      <Card bordered={false}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 500, fontSize: 16 }}>交通线路列表</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增线路
          </Button>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1300 }}
          />
        </Spin>
      </Card>

      <Modal
        title={editingRoute ? '编辑线路' : '新增线路'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{ transport_type: 'metro', status: 'active' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="route_code"
                label="线路编号"
                rules={[{ required: true, message: '请输入线路编号' }]}
              >
                <Input placeholder="如：1号线" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="route_name"
                label="线路名称"
                rules={[{ required: true, message: '请输入线路名称' }]}
              >
                <Input placeholder="如：地铁1号线" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="transport_type"
                label="交通类型"
                rules={[{ required: true, message: '请选择交通类型' }]}
              >
                <Select>
                  <Option value="metro">地铁</Option>
                  <Option value="bus">公交</Option>
                  <Option value="tram">有轨电车</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="base_price"
                label="基础票价（元）"
                rules={[{ required: true, message: '请输入基础票价' }]}
              >
                <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start_station"
                label="起始站"
                rules={[{ required: true, message: '请输入起始站' }]}
              >
                <Input placeholder="如：韦家碾" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_station"
                label="终点站"
                rules={[{ required: true, message: '请输入终点站' }]}
              >
                <Input placeholder="如：科学城" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="first_departure"
                label="首班车时间"
                rules={[{ required: true, message: '请输入首班车时间' }]}
              >
                <Input placeholder="如：06:00" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="last_departure"
                label="末班车时间"
                rules={[{ required: true, message: '请输入末班车时间' }]}
              >
                <Input placeholder="如：23:00" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="status"
            label="状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="运营中" unCheckedChildren="停运" />
          </Form.Item>
          <Form.Item
            name="description"
            label="线路描述"
          >
            <Input.TextArea rows={3} placeholder="请输入线路描述" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="站点管理"
        open={stationModalVisible}
        onCancel={() => setStationModalVisible(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={stationForm}
          layout="vertical"
          onFinish={handleSaveStations}
        >
          <Form.List name="stations">
            {(fields, { add, remove }) => (
              <>
                <List
                  dataSource={fields}
                  renderItem={(field, index) => (
                    <List.Item
                      key={field.key}
                      actions={[
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                          disabled={index === 0}
                        />
                      ]}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                        <Tag color="blue">{index + 1}</Tag>
                        {index > 0 && <ArrowRightOutlined style={{ color: '#ccc' }} />}
                        <Form.Item
                          name={[field.name, 'name']}
                          rules={[{ required: true, message: '请输入站点名称' }]}
                          style={{ flex: 1, marginBottom: 0 }}
                        >
                          <Input placeholder="站点名称" />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, 'transfer']}
                          valuePropName="checked"
                          style={{ marginBottom: 0 }}
                        >
                          <Switch size="small" checkedChildren="换乘" unCheckedChildren="普通" />
                        </Form.Item>
                      </div>
                    </List.Item>
                  )}
                />
                <Form.Item style={{ marginTop: 16 }}>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加站点
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setStationModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存站点</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Routes;
