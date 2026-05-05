import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  message, 
  Space, 
  Popconfirm,
  Card,
  Tag,
  Descriptions,
  Divider,
  Radio,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  EyeOutlined, 
  DeleteOutlined,
  ImportOutlined,
  ExportOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';

const { Option } = Select;
const { Search } = Input;
const { TextArea } = Input;

const STATUS_MAP = {
  active: { text: '正常', color: 'success' },
  inactive: { text: '停用', color: 'default' },
  moved: { text: '已迁出', color: 'warning' },
  deleted: { text: '已注销', color: 'error' }
};

const GENDER_MAP = {
  male: '男',
  female: '女'
};

const HouseholdList = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  const [searchForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const response = await api.getHouseholds({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...params
      });
      if (response.success) {
        setData(response.data.households);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total
        }));
      }
    } catch (error) {
      console.error('获取户籍列表失败:', error);
      message.error('获取户籍列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (values) => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchData(values);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchData();
  };

  const openModal = (type, record = null) => {
    setModalType(type);
    setSelectedRecord(record);
    
    if (type === 'edit' && record) {
      form.setFieldsValue(record);
    } else if (type === 'moveIn' || type === 'moveOut' || type === 'cancel') {
      form.resetFields();
    } else {
      form.resetFields();
    }
    
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (modalType === 'create') {
        const response = await api.createHousehold(values);
        if (response.success) {
          message.success('户籍创建成功');
          fetchData();
          setModalVisible(false);
        }
      } else if (modalType === 'edit') {
        const response = await api.updateHousehold(selectedRecord.id, values);
        if (response.success) {
          message.success('户籍更新成功');
          fetchData();
          setModalVisible(false);
        }
      } else if (modalType === 'moveIn') {
        const response = await api.moveInHousehold(selectedRecord.id, values);
        if (response.success) {
          message.success('迁入操作成功');
          fetchData();
          setModalVisible(false);
        }
      } else if (modalType === 'moveOut') {
        const response = await api.moveOutHousehold(selectedRecord.id, values);
        if (response.success) {
          message.success('迁出操作成功');
          fetchData();
          setModalVisible(false);
        }
      } else if (modalType === 'cancel') {
        const response = await api.cancelHousehold(selectedRecord.id, values);
        if (response.success) {
          message.success('注销操作成功');
          fetchData();
          setModalVisible(false);
        }
      }
    } catch (error) {
      console.error('操作失败:', error);
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'create': return '新增户籍';
      case 'edit': return '编辑户籍';
      case 'moveIn': return '户籍迁入';
      case 'moveOut': return '户籍迁出';
      case 'cancel': return '注销户籍';
      default: return '操作';
    }
  };

  const renderModalContent = () => {
    if (modalType === 'moveIn') {
      return (
        <Form form={form} layout="vertical">
          <Form.Item
            name="newAddress"
            label="新地址"
            rules={[{ required: true, message: '请输入新地址' }]}
          >
            <TextArea rows={2} placeholder="请输入新的现住址" />
          </Form.Item>
          <Form.Item name="reason" label="迁入原因">
            <TextArea rows={2} placeholder="请输入迁入原因" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      );
    }

    if (modalType === 'moveOut') {
      return (
        <Form form={form} layout="vertical">
          <Form.Item
            name="destination"
            label="迁往目的地"
            rules={[{ required: true, message: '请输入迁往目的地' }]}
          >
            <TextArea rows={2} placeholder="请输入迁往目的地" />
          </Form.Item>
          <Form.Item name="reason" label="迁出原因">
            <TextArea rows={2} placeholder="请输入迁出原因" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      );
    }

    if (modalType === 'cancel') {
      return (
        <Form form={form} layout="vertical">
          <Form.Item name="reason" label="注销原因">
            <TextArea rows={2} placeholder="请输入注销原因" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      );
    }

    return (
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="姓名"
              rules={[
                { required: true, message: '请输入姓名' },
                { min: 2, max: 50, message: '姓名长度应在2-50个字符之间' }
              ]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="idCard"
              label="身份证号"
              rules={[
                { required: true, message: '请输入身份证号' },
                { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '身份证号格式不正确' }
              ]}
            >
              <Input placeholder="请输入身份证号" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="gender"
              label="性别"
              rules={[{ required: true, message: '请选择性别' }]}
            >
              <Select placeholder="请选择性别">
                <Option value="male">男</Option>
                <Option value="female">女</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="age"
              label="年龄"
              rules={[
                { required: true, message: '请输入年龄' },
                { type: 'number', min: 0, max: 150, message: '年龄必须在0-150之间' }
              ]}
            >
              <InputNumber style={{ width: '100%' }} placeholder="请输入年龄" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="ethnicity" label="民族">
              <Input placeholder="请输入民族" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="education" label="学历">
              <Input placeholder="请输入学历" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="occupation" label="职业">
              <Input placeholder="请输入职业" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="maritalStatus" label="婚姻状况">
              <Input placeholder="请输入婚姻状况" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="phone" label="联系电话">
              <Input placeholder="请输入联系电话" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="householdType" label="户口类型">
              <Input placeholder="请输入户口类型" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="currentAddress"
          label="现住址"
          rules={[{ required: true, message: '请输入现住址' }]}
        >
          <TextArea rows={2} placeholder="请输入现住址" />
        </Form.Item>
        <Form.Item
          name="householdAddress"
          label="户籍地址"
          rules={[{ required: true, message: '请输入户籍地址' }]}
        >
          <TextArea rows={2} placeholder="请输入户籍地址" />
        </Form.Item>
        <Form.Item name="emergencyContact" label="紧急联系人">
          <Input placeholder="请输入紧急联系人" />
        </Form.Item>
        <Form.Item name="emergencyPhone" label="紧急联系电话">
          <Input placeholder="请输入紧急联系电话" />
        </Form.Item>
        {modalType === 'edit' && (
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态">
              <Option value="active">正常</Option>
              <Option value="inactive">停用</Option>
              <Option value="moved">已迁出</Option>
              <Option value="deleted">已注销</Option>
            </Select>
          </Form.Item>
        )}
        <Form.Item name="note" label="备注">
          <TextArea rows={3} placeholder="请输入备注信息" />
        </Form.Item>
      </Form>
    );
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      key: 'idCard',
      width: 180
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (val) => GENDER_MAP[val] || val
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 60
    },
    {
      title: '现住址',
      dataIndex: 'currentAddress',
      key: 'currentAddress',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val) => {
        const status = STATUS_MAP[val] || { text: val, color: 'default' };
        return <Tag color={status.color}>{status.text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedRecord(record);
              setDetailVisible(true);
            }}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openModal('edit', record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ImportOutlined />}
            onClick={() => openModal('moveIn', record)}
          >
            迁入
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ExportOutlined />}
            onClick={() => openModal('moveOut', record)}
          >
            迁出
          </Button>
          {isAdmin() && (
            <Popconfirm
              title="确定要注销该户籍吗？"
              onConfirm={() => openModal('cancel', record)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                注销
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card 
        title="户籍列表" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => openModal('create')}
          >
            新增户籍
          </Button>
        }
      >
        <Form
          form={searchForm}
          layout="inline"
          style={{ marginBottom: 24 }}
          onFinish={handleSearch}
        >
          <Form.Item name="name" label="姓名">
            <Input placeholder="请输入姓名" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="idCard" label="身份证号">
            <Input placeholder="请输入身份证号" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" style={{ width: 120 }} allowClear>
              <Option value="active">正常</Option>
              <Option value="inactive">停用</Option>
              <Option value="moved">已迁出</Option>
              <Option value="deleted">已注销</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={getModalTitle()}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={modalType === 'create' || modalType === 'edit' ? 700 : 500}
        maskClosable={false}
      >
        {renderModalContent()}
      </Modal>

      <Modal
        title="户籍详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {selectedRecord && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="姓名">{selectedRecord.name}</Descriptions.Item>
            <Descriptions.Item label="身份证号">{selectedRecord.idCard}</Descriptions.Item>
            <Descriptions.Item label="性别">{GENDER_MAP[selectedRecord.gender]}</Descriptions.Item>
            <Descriptions.Item label="年龄">{selectedRecord.age}</Descriptions.Item>
            <Descriptions.Item label="民族">{selectedRecord.ethnicity || '-'}</Descriptions.Item>
            <Descriptions.Item label="学历">{selectedRecord.education || '-'}</Descriptions.Item>
            <Descriptions.Item label="职业">{selectedRecord.occupation || '-'}</Descriptions.Item>
            <Descriptions.Item label="婚姻状况">{selectedRecord.maritalStatus || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{selectedRecord.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="户口类型">{selectedRecord.householdType || '-'}</Descriptions.Item>
            <Descriptions.Item label="现住址" span={2}>{selectedRecord.currentAddress}</Descriptions.Item>
            <Descriptions.Item label="户籍地址" span={2}>{selectedRecord.householdAddress}</Descriptions.Item>
            <Descriptions.Item label="紧急联系人">{selectedRecord.emergencyContact || '-'}</Descriptions.Item>
            <Descriptions.Item label="紧急联系电话">{selectedRecord.emergencyPhone || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={STATUS_MAP[selectedRecord.status]?.color || 'default'}>
                {STATUS_MAP[selectedRecord.status]?.text || selectedRecord.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{selectedRecord.createdAt}</Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{selectedRecord.note || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default HouseholdList;
