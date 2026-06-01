import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, message, Tag, Tabs } from 'antd';
import { PlusOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons';
import { QualificationCertificate, PersonnelCertificate, getQualificationCertificates, getPersonnelCertificates, createQualificationCertificate, createPersonnelCertificate, getExpiringCertificates } from '../api/certificates';
import { getApplications } from '../api/applications';
import dayjs from 'dayjs';

const { Option } = Select;
const { TabPane } = Tabs;

const statusColors: Record<string, string> = {
  VALID: 'green',
  EXPIRING: 'orange',
  EXPIRED: 'red',
  REVOKED: 'red'
};

const statusLabels: Record<string, string> = {
  VALID: '有效',
  EXPIRING: '即将到期',
  EXPIRED: '已过期',
  REVOKED: '已吊销'
};

const Certificates: React.FC = () => {
  const [qualCerts, setQualCerts] = useState<QualificationCertificate[]>([]);
  const [personnelCerts, setPersonnelCerts] = useState<PersonnelCertificate[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [expiringData, setExpiringData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qualModalVisible, setQualModalVisible] = useState(false);
  const [personnelModalVisible, setPersonnelModalVisible] = useState(false);
  const [qualForm] = Form.useForm();
  const [personnelForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [qual, personnel, apps, expiring] = await Promise.all([
        getQualificationCertificates(),
        getPersonnelCertificates(),
        getApplications(),
        getExpiringCertificates(30)
      ]);
      setQualCerts(qual);
      setPersonnelCerts(personnel);
      setApplications(apps.filter(a => a.status !== 'COMPLETED' && !a.qualificationCert));
      setExpiringData(expiring);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQual = async (values: any) => {
    try {
      await createQualificationCertificate({
        ...values,
        issueDate: values.issueDate.toISOString(),
        expireDate: values.expireDate.toISOString(),
        status: 'VALID'
      });
      message.success('证书创建成功');
      setQualModalVisible(false);
      qualForm.resetFields();
      loadData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleCreatePersonnel = async (values: any) => {
    try {
      await createPersonnelCertificate({
        ...values,
        issueDate: values.issueDate.toISOString(),
        expireDate: values.expireDate.toISOString(),
        status: 'VALID',
        isOccupied: false
      });
      message.success('人员证书创建成功');
      setPersonnelModalVisible(false);
      personnelForm.resetFields();
      loadData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const qualColumns = [
    { title: '证书编号', dataIndex: 'certificateNo', key: 'certificateNo' },
    { title: '证书名称', dataIndex: 'certificateName', key: 'certificateName' },
    { title: '客户名称', key: 'customer', render: (_: any, record: QualificationCertificate) => record.customer?.name },
    { title: '发证日期', dataIndex: 'issueDate', key: 'issueDate' },
    { title: '有效期至', dataIndex: 'expireDate', key: 'expireDate' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status]}
        </Tag>
      )
    }
  ];

  const personnelColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '身份证号', dataIndex: 'idCard', key: 'idCard' },
    { title: '证书类型', dataIndex: 'certificateType', key: 'certificateType' },
    { title: '证书编号', dataIndex: 'certificateNo', key: 'certificateNo' },
    { title: '发证日期', dataIndex: 'issueDate', key: 'issueDate' },
    { title: '有效期至', dataIndex: 'expireDate', key: 'expireDate' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status]}
        </Tag>
      )
    },
    {
      title: '占用情况',
      dataIndex: 'isOccupied',
      key: 'isOccupied',
      render: (occupied: boolean) => (
        <Tag color={occupied ? 'orange' : 'green'}>
          {occupied ? '已占用' : '空闲'}
        </Tag>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>证书管理</h2>
        <Space>
          <Button icon={<UserOutlined />} onClick={() => setPersonnelModalVisible(true)}>
            添加人员证书
          </Button>
          <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={() => setQualModalVisible(true)}>
            颁发资质证书
          </Button>
        </Space>
      </div>

      {expiringData && expiringData.total > 0 && (
        <div style={{
          padding: 16,
          background: '#fffbe6',
          border: '1px solid #ffe58f',
          borderRadius: 8,
          marginBottom: 16
        }}>
          <span style={{ color: '#faad14', fontWeight: 'bold' }}>
            ⚠️ 有 {expiringData.total} 份证书将在30天内到期，请及时处理
          </span>
        </div>
      )}

      <Tabs defaultActiveKey="qualification">
        <TabPane tab="企业资质证书" key="qualification">
          <Table
            columns={qualColumns}
            dataSource={qualCerts}
            rowKey="id"
            loading={loading}
          />
        </TabPane>
        <TabPane tab="人员证书" key="personnel">
          <Table
            columns={personnelColumns}
            dataSource={personnelCerts}
            rowKey="id"
            loading={loading}
          />
        </TabPane>
      </Tabs>

      <Modal
        title="颁发资质证书"
        open={qualModalVisible}
        onCancel={() => setQualModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={qualForm} layout="vertical" onFinish={handleCreateQual}>
          <Form.Item name="applicationId" label="关联申请" rules={[{ required: true }]}>
            <Select placeholder="请选择关联的资质申请">
              {applications.map(app => (
                <Option key={app.id} value={app.id}>
                  {app.applicationNo} - {app.customer?.name} - {app.product?.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="certificateNo" label="证书编号" rules={[{ required: true }]}>
            <Input placeholder="请输入证书编号" />
          </Form.Item>
          <Form.Item name="certificateName" label="证书名称" rules={[{ required: true }]}>
            <Input placeholder="请输入证书名称" />
          </Form.Item>
          <Form.Item name="qualificationType" label="资质类型" rules={[{ required: true }]}>
            <Input placeholder="请输入资质类型" />
          </Form.Item>
          <Form.Item name="issueDate" label="发证日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expireDate" label="有效期至" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="issuingAuthority" label="发证机关">
            <Input placeholder="请输入发证机关" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setQualModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">颁发</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加人员证书"
        open={personnelModalVisible}
        onCancel={() => setPersonnelModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={personnelForm} layout="vertical" onFinish={handleCreatePersonnel}>
          <Form.Item name="customerId" label="所属企业" rules={[{ required: true }]}>
            <Select placeholder="请选择所属企业">
              {applications.map(app => app.customer).filter((c, i, arr) => 
                arr.findIndex(x => x.id === c.id) === i
              ).map(c => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入人员姓名" />
          </Form.Item>
          <Form.Item name="idCard" label="身份证号" rules={[{ required: true }]}>
            <Input placeholder="请输入身份证号" />
          </Form.Item>
          <Form.Item name="certificateType" label="证书类型" rules={[{ required: true }]}>
            <Select placeholder="请选择证书类型">
              <Option value="注册建造师">注册建造师</Option>
              <Option value="注册工程师">注册工程师</Option>
              <Option value="注册建筑师">注册建筑师</Option>
              <Option value="安全员">安全员</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="certificateNo" label="证书编号" rules={[{ required: true }]}>
            <Input placeholder="请输入证书编号" />
          </Form.Item>
          <Form.Item name="issueDate" label="发证日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="expireDate" label="有效期至" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setPersonnelModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Certificates;
