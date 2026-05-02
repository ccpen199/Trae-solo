import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Button,
  Input,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  Spin,
  message,
  Popconfirm,
  Descriptions,
  Tabs,
  Space,
} from 'antd';
import {
  SearchOutlined,
  UserAddOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/utils/api';

interface Patient {
  id: string;
  patientNumber: string;
  name: string;
  idCardNumber?: string;
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  birthDate?: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  allergies?: string[];
  pastMedicalHistory?: string;
  familyHistory?: string;
  bloodType?: 'A' | 'B' | 'AB' | 'O' | 'UNKNOWN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Visit {
  id: string;
  visitNumber: string;
  patientId: string;
  departmentName?: string;
  doctorName?: string;
  currentStatus: string;
  visitType: string;
  checkinTime: string;
  startTime?: string;
  endTime?: string;
  chiefComplaint?: string;
  diagnosis?: string;
}

const PatientsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [searchForm] = Form.useForm();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [patientVisits, setPatientVisits] = useState<Visit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(false);

  const fetchPatients = async (searchParams?: any) => {
    setLoading(true);
    try {
      const params: any = {
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
        ...searchParams,
      };

      const queryString = Object.keys(params)
        .filter((k) => params[k] !== undefined && params[k] !== '' && params[k] !== null)
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join('&');

      const response = await api.get(`/patients?${queryString}`);
      if (response.success && response.data) {
        setPatients(response.data.patients || []);
        setTotal(response.data.total || 0);
      }
    } catch (error: any) {
      message.error('获取患者列表失败');
      console.error('Fetch patients error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [pagination]);

  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    setPagination({ ...pagination, current: 1 });
    fetchPatients(values);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setPagination({ ...pagination, current: 1 });
    fetchPatients();
  };

  const handleAdd = () => {
    setSelectedPatient(null);
    setIsEditing(false);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditing(true);
    form.setFieldsValue({
      ...patient,
      birthDate: patient.birthDate ? dayjs(patient.birthDate) : undefined,
      allergies: patient.allergies || [],
    });
    setModalVisible(true);
  };

  const handleDetail = async (patient: Patient) => {
    setSelectedPatient(patient);
    setDetailModalVisible(true);
    setVisitsLoading(true);
    try {
      const response = await api.get(`/patients/${patient.id}/visits?limit=50`);
      if (response.success && response.data) {
        setPatientVisits(response.data.visits || []);
      }
    } catch (error: any) {
      console.error('Fetch patient visits error:', error);
    } finally {
      setVisitsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    message.warning('删除功能需要进一步实现');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        birthDate: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : undefined,
      };

      let response;
      if (isEditing && selectedPatient) {
        response = await api.put(`/patients/${selectedPatient.id}`, formattedValues);
      } else {
        response = await api.post('/patients', formattedValues);
      }

      if (response.success) {
        message.success(isEditing ? '患者信息更新成功' : '患者创建成功');
        setModalVisible(false);
        fetchPatients();
      }
    } catch (error: any) {
      message.error(error.message || '操作失败');
      console.error('Submit error:', error);
    }
  };

  const getGenderTag = (gender: string) => {
    const colorMap: Record<string, string> = {
      MALE: 'blue',
      FEMALE: 'pink',
      UNKNOWN: 'default',
    };
    const labelMap: Record<string, string> = {
      MALE: '男',
      FEMALE: '女',
      UNKNOWN: '未知',
    };
    return <Tag color={colorMap[gender] || 'default'}>{labelMap[gender] || gender}</Tag>;
  };

  const getBloodTypeTag = (bloodType: string) => {
    if (!bloodType || bloodType === 'UNKNOWN') {
      return <Tag color="default">未录入</Tag>;
    }
    return <Tag color="purple">{bloodType}型</Tag>;
  };

  const visitColumns = [
    {
      title: '就诊编号',
      dataIndex: 'visitNumber',
      key: 'visitNumber',
    },
    {
      title: '就诊类型',
      dataIndex: 'visitType',
      key: 'visitType',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          OUTPATIENT: '门诊',
          INPATIENT: '住院',
          EMERGENCY: '急诊',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '科室',
      dataIndex: 'departmentName',
      key: 'departmentName',
    },
    {
      title: '医生',
      dataIndex: 'doctorName',
      key: 'doctorName',
    },
    {
      title: '状态',
      dataIndex: 'currentStatus',
      key: 'currentStatus',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          PENDING: 'orange',
          IN_CONSULTATION: 'processing',
          ORDER_ISSUED: 'blue',
          SIGNED: 'purple',
          ARCHIVED: 'success',
          CANCELLED: 'default',
        };
        const labelMap: Record<string, string> = {
          PENDING: '待诊',
          IN_CONSULTATION: '问诊中',
          ORDER_ISSUED: '医嘱下达',
          SIGNED: '已签名',
          ARCHIVED: '已归档',
          CANCELLED: '已取消',
        };
        return <Tag color={colorMap[status] || 'default'}>{labelMap[status] || status}</Tag>;
      },
    },
    {
      title: '就诊时间',
      dataIndex: 'checkinTime',
      key: 'checkinTime',
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '主诉',
      dataIndex: 'chiefComplaint',
      key: 'chiefComplaint',
      ellipsis: true,
    },
  ];

  const columns = [
    {
      title: '患者编号',
      dataIndex: 'patientNumber',
      key: 'patientNumber',
      render: (text: string) => <a>{text}</a>,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: getGenderTag,
    },
    {
      title: '出生日期',
      dataIndex: 'birthDate',
      key: 'birthDate',
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '血型',
      dataIndex: 'bloodType',
      key: 'bloodType',
      render: getBloodTypeTag,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: '过敏史',
      dataIndex: 'allergies',
      key: 'allergies',
      render: (allergies: string[]) => {
        if (!allergies || allergies.length === 0) {
          return <span style={{ color: '#999' }}>无</span>;
        }
        return (
          <Space size={[0, 4]} wrap>
            {allergies.map((a, i) => (
              <Tag key={i} color="red">
                {a}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Patient) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定要删除该患者吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'basic',
      label: (
        <span>
          <UserAddOutlined style={{ marginRight: 4 }} />
          基本信息
        </span>
      ),
      children: selectedPatient ? (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="患者编号">{selectedPatient.patientNumber}</Descriptions.Item>
          <Descriptions.Item label="姓名">{selectedPatient.name}</Descriptions.Item>
          <Descriptions.Item label="性别">{getGenderTag(selectedPatient.gender)}</Descriptions.Item>
          <Descriptions.Item label="血型">{getBloodTypeTag(selectedPatient.bloodType || 'UNKNOWN')}</Descriptions.Item>
          <Descriptions.Item label="出生日期">
            {selectedPatient.birthDate ? dayjs(selectedPatient.birthDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="联系电话">{selectedPatient.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="身份证号">{selectedPatient.idCardNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="紧急联系人">
            {selectedPatient.emergencyContact || '-'}{' '}
            {selectedPatient.emergencyPhone ? `(${selectedPatient.emergencyPhone})` : ''}
          </Descriptions.Item>
          <Descriptions.Item label="地址" span={2}>
            {selectedPatient.address || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="过敏史" span={2}>
            {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? (
              <Space size={[0, 4]} wrap>
                {selectedPatient.allergies.map((a, i) => (
                  <Tag key={i} color="red">
                    {a}
                  </Tag>
                ))}
              </Space>
            ) : (
              '无'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="既往病史" span={2}>
            {selectedPatient.pastMedicalHistory || '无'}
          </Descriptions.Item>
          <Descriptions.Item label="家族病史" span={2}>
            {selectedPatient.familyHistory || '无'}
          </Descriptions.Item>
        </Descriptions>
      ) : null,
    },
    {
      key: 'visits',
      label: (
        <span>
          <FileTextOutlined style={{ marginRight: 4 }} />
          就诊记录
        </span>
      ),
      children: (
        <Table
          dataSource={patientVisits}
          columns={visitColumns}
          rowKey="id"
          loading={visitsLoading}
          pagination={false}
          size="small"
        />
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Form form={searchForm} layout="inline">
          <Form.Item name="name" label="姓名">
            <Input placeholder="请输入姓名" prefix={<SearchOutlined />} style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="patientNumber" label="患者编号">
            <Input placeholder="请输入患者编号" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="idCardNumber" label="身份证号">
            <Input placeholder="请输入身份证号" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
              <Button type="primary" icon={<UserAddOutlined />} onClick={handleAdd}>
                新增患者
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={patients}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
          }}
        />
      </Card>

      <Modal
        title={isEditing ? '编辑患者信息' : '新增患者'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="gender"
            label="性别"
            rules={[{ required: true, message: '请选择性别' }]}
          >
            <Select placeholder="请选择性别">
              <Select.Option value="MALE">男</Select.Option>
              <Select.Option value="FEMALE">女</Select.Option>
              <Select.Option value="UNKNOWN">未知</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="birthDate" label="出生日期">
            <DatePicker style={{ width: '100%' }} placeholder="请选择出生日期" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="idCardNumber" label="身份证号">
            <Input placeholder="请输入身份证号" />
          </Form.Item>
          <Form.Item name="bloodType" label="血型">
            <Select placeholder="请选择血型">
              <Select.Option value="A">A型</Select.Option>
              <Select.Option value="B">B型</Select.Option>
              <Select.Option value="AB">AB型</Select.Option>
              <Select.Option value="O">O型</Select.Option>
              <Select.Option value="UNKNOWN">未知</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="emergencyContact" label="紧急联系人">
            <Input placeholder="请输入紧急联系人" />
          </Form.Item>
          <Form.Item name="emergencyPhone" label="紧急联系电话">
            <Input placeholder="请输入紧急联系电话" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input.TextArea placeholder="请输入地址" rows={2} />
          </Form.Item>
          <Form.Item name="allergies" label="过敏史">
            <Select mode="tags" placeholder="请输入或选择过敏史（可多选）" style={{ width: '100%' }}>
              <Select.Option value="青霉素">青霉素</Select.Option>
              <Select.Option value="头孢类抗生素">头孢类抗生素</Select.Option>
              <Select.Option value="阿司匹林">阿司匹林</Select.Option>
              <Select.Option value="海鲜">海鲜</Select.Option>
              <Select.Option value="牛奶">牛奶</Select.Option>
              <Select.Option value="花生">花生</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="pastMedicalHistory" label="既往病史">
            <Input.TextArea placeholder="请输入既往病史" rows={2} />
          </Form.Item>
          <Form.Item name="familyHistory" label="家族病史">
            <Input.TextArea placeholder="请输入家族病史" rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="患者详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        <Tabs defaultActiveKey="basic" items={tabItems} />
      </Modal>
    </div>
  );
};

export default PatientsPage;
