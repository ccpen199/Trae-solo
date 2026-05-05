import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Tag, Modal, Form, Select, DatePicker, message, Popconfirm } from 'antd';
import { PlusOutlined, ExportOutlined } from '@ant-design/icons';
import { studentApi, bedApi, roomApi } from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface CheckInRecord {
  id: number;
  student_id: number;
  student_no: string;
  student_name: string;
  gender: string;
  major: string;
  class: string;
  bed_id: number;
  bed_code: string;
  room_id: number;
  room_number: string;
  dormitory_id: number;
  building_code: string;
  building_name: string;
  check_in_date: string;
  expected_check_out_date: string;
  actual_check_out_date: string;
  status: string;
  notes: string;
}

const CheckInList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CheckInRecord[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [beds, setBeds] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await studentApi.getCheckInRecords({ status: 'active' });
      setData(response.data.data);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBeds = async () => {
    try {
      const response = await bedApi.getAll({ status: 'available' });
      setBeds(response.data.data);
    } catch (error) {
      message.error('获取床位数据失败');
    }
  };

  const fetchUncheckedStudents = async () => {
    try {
      const response = await studentApi.getAll({ has_check_in: false });
      setStudents(response.data.data);
    } catch (error) {
      message.error('获取学生数据失败');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    fetchAvailableBeds();
    fetchUncheckedStudents();
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        student_id: values.student_id,
        bed_id: values.bed_id,
        check_in_date: values.check_in_date?.format('YYYY-MM-DD'),
        expected_check_out_date: values.expected_check_out_date?.format('YYYY-MM-DD'),
        notes: values.notes,
      };
      await studentApi.checkIn(data);
      message.success('入住办理成功');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('入住办理失败');
    }
  };

  const handleCheckOut = async (record: CheckInRecord) => {
    try {
      await studentApi.checkOut(record.id);
      message.success('迁出办理成功');
      fetchData();
    } catch (error) {
      message.error('迁出办理失败');
    }
  };

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      active: 'blue',
      completed: 'green',
    };
    const textMap: Record<string, string> = {
      active: '在住',
      completed: '已迁出',
    };
    return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>;
  };

  const columns = [
    {
      title: '学号',
      dataIndex: 'student_no',
      key: 'student_no',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'student_name',
      key: 'student_name',
      width: 100,
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 120,
    },
    {
      title: '班级',
      dataIndex: 'class',
      key: 'class',
      width: 100,
    },
    {
      title: '房间号',
      dataIndex: 'room_number',
      key: 'room_number',
      width: 100,
    },
    {
      title: '床位号',
      dataIndex: 'bed_code',
      key: 'bed_code',
      width: 100,
    },
    {
      title: '楼栋',
      dataIndex: 'building_code',
      key: 'building_code',
      width: 80,
      render: (code: string, record: CheckInRecord) => (
        <span>{code} - {record.building_name}</span>
      ),
    },
    {
      title: '入住日期',
      dataIndex: 'check_in_date',
      key: 'check_in_date',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '预计迁出日期',
      dataIndex: 'expected_check_out_date',
      key: 'expected_check_out_date',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: CheckInRecord) => (
        <Space size="small">
          <Popconfirm
            title="确定要办理迁出吗？"
            onConfirm={() => handleCheckOut(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger>
              迁出
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="入住记录列表"
        extra={
          <Space>
            <Button icon={<ExportOutlined />}>
              导出
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              办理入住
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title="办理入住"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="student_id"
            label="选择学生"
            rules={[{ required: true, message: '请选择学生' }]}
          >
            <Select placeholder="请选择未入住的学生" showSearch optionFilterProp="children">
              {students.map((student) => (
                <Option key={student.id} value={student.id}>
                  {student.student_id} - {student.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="bed_id"
            label="选择床位"
            rules={[{ required: true, message: '请选择床位' }]}
          >
            <Select placeholder="请选择可用床位" showSearch optionFilterProp="children">
              {beds.map((bed) => (
                <Option key={bed.id} value={bed.id}>
                  {bed.bed_code} ({bed.building_code} - {bed.room_number})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="check_in_date"
            label="入住日期"
            rules={[{ required: true, message: '请选择入住日期' }]}
            initialValue={dayjs()}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="expected_check_out_date"
            label="预计迁出日期"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注"
          >
            <Select placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CheckInList;