import React, { useEffect, useState } from 'react';
import { Table, Card, Button, Space, Tag, Modal, Form, Input, Select, message, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { studentApi, roomChangeApi, bedApi } from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface RoomChangeRecord {
  id: number;
  student_id: number;
  student_no: string;
  student_name: string;
  gender: string;
  major: string;
  class: string;
  old_bed_id: number;
  old_bed_code: string;
  old_room_id: number;
  old_room_number: string;
  old_dormitory_id: number;
  old_building_code: string;
  old_building_name: string;
  new_bed_id: number;
  new_bed_code: string;
  new_room_id: number;
  new_room_number: string;
  new_dormitory_id: number;
  new_building_code: string;
  new_building_name: string;
  request_date: string;
  approval_date: string;
  status: string;
  reason: string;
  notes: string;
  operator_id: number;
  operator_name: string;
}

const RoomChangeList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RoomChangeRecord[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [availableBeds, setAvailableBeds] = useState<any[]>([]);
  const [form] = Form.useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await roomChangeApi.getAll();
      setData(response.data.data);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentApi.getAll({ has_check_in: true });
      setStudents(response.data.data);
    } catch (error) {
      message.error('获取学生数据失败');
    }
  };

  const fetchAvailableBeds = async () => {
    try {
      const response = await bedApi.getAll({ status: 'available' });
      setAvailableBeds(response.data.data);
    } catch (error) {
      message.error('获取床位数据失败');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    fetchStudents();
    fetchAvailableBeds();
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await roomChangeApi.create(values);
      message.success('调房申请提交成功');
      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('提交失败');
    }
  };

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'blue',
      approved: 'green',
      rejected: 'red',
    };
    const textMap: Record<string, string> = {
      pending: '待审批',
      approved: '已审批',
      rejected: '已拒绝',
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
      title: '原房间',
      dataIndex: 'old_room_number',
      key: 'old_room_number',
      width: 150,
      render: (room: string, record: RoomChangeRecord) => (
        <span>{record.old_building_code} - {room} {record.old_bed_code}</span>
      ),
    },
    {
      title: '新房间',
      dataIndex: 'new_room_number',
      key: 'new_room_number',
      width: 150,
      render: (room: string, record: RoomChangeRecord) => (
        <span>{record.new_building_code} - {room} {record.new_bed_code}</span>
      ),
    },
    {
      title: '申请日期',
      dataIndex: 'request_date',
      key: 'request_date',
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
      title: '调房原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 150,
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: RoomChangeRecord) => (
        <Space size="small">
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="确定要批准此调房申请吗？"
                onConfirm={async () => {
                  try {
                    await roomChangeApi.approve(record.id);
                    message.success('调房申请已批准');
                    fetchData();
                  } catch (error) {
                    message.error('操作失败');
                  }
                }}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small">
                  批准
                </Button>
              </Popconfirm>
              <Button type="link" size="small" danger>
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="调房记录列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            申请调房
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="申请调房"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="student_id"
            label="选择学生"
            rules={[{ required: true, message: '请选择学生' }]}
          >
            <Select placeholder="请选择已入住的学生" showSearch optionFilterProp="children">
              {students.map((student) => (
                <Option key={student.id} value={student.id}>
                  {student.student_id} - {student.name} ({student.room_number} {student.bed_code})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="new_bed_id"
            label="选择新床位"
            rules={[{ required: true, message: '请选择新床位' }]}
          >
            <Select placeholder="请选择可用床位" showSearch optionFilterProp="children">
              {availableBeds.map((bed) => (
                <Option key={bed.id} value={bed.id}>
                  {bed.bed_code} ({bed.building_code} - {bed.room_number})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="reason"
            label="调房原因"
            rules={[{ required: true, message: '请输入调房原因' }]}
          >
            <TextArea rows={4} placeholder="请输入调房原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RoomChangeList;