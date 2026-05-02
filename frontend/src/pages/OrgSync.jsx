import React from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  DatePicker,
  Space,
  message,
  Row,
  Col,
  Transfer,
  Tag,
  Divider,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { orderApi, employeeApi, departmentApi } from '../api';
import { useUserStore } from '../store';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const OrgSync = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);
  const [employees, setEmployees] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [selectedContacts, setSelectedContacts] = React.useState([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, deptRes] = await Promise.all([
          employeeApi.getList({ limit: 100 }),
          departmentApi.getList(),
        ]);
        setEmployees(empRes.data || []);
        setDepartments(deptRes.data || []);
      } catch (error) {
        console.error('获取数据失败:', error);
      }
    };
    fetchData();
  }, []);

  const contactOptions = employees.map((emp) => ({
    key: emp.id,
    title: emp.name,
    description: `${emp.department_name || ''} ${emp.phone || ''}`,
  }));

  const approverCandidates = employees.filter((emp) => {
    return emp.role_code === 'admin' || emp.role_code === 'dept_leader';
  });

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const orderRes = await orderApi.create({
        type: 'org_sync',
        title: values.title,
        description: values.description,
        priority: values.priority || 'normal',
        expectedTime: values.expectedTime ? values.expectedTime.toISOString() : null,
        dataContent: {
          contacts: selectedContacts,
          responsiblePersonId: values.responsiblePersonId,
          approverId: values.approverId,
          departmentId: values.departmentId,
        },
      });

      if (orderRes.success !== false) {
        message.success('创建成功');
        navigate(`/orders/${orderRes.data.id}`);
      }
    } catch (error) {
      console.error('创建工单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-title">组织同步</div>

      <Card className="page-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            priority: 'normal',
          }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="工单标题"
                rules={[{ required: true, message: '请输入工单标题' }]}
              >
                <Input placeholder="请输入工单标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级">
                <Select>
                  <Select.Option value="high">高</Select.Option>
                  <Select.Option value="normal">中</Select.Option>
                  <Select.Option value="low">低</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="departmentId" label="所属部门">
                <Select placeholder="请选择部门" allowClear>
                  {departments.map((dept) => (
                    <Select.Option key={dept.id} value={dept.id}>
                      {dept.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="responsiblePersonId"
                label="责任人"
                rules={[{ required: true, message: '请选择责任人' }]}
              >
                <Select placeholder="请选择责任人">
                  {employees.map((emp) => (
                    <Select.Option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department_name || '-'})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="approverId"
                label="审批人"
                tooltip="审批人负责最终审批，如不选择将自动分配"
              >
                <Select placeholder="请选择审批人（不选则自动分配）" allowClear>
                  {approverCandidates.map((emp) => (
                    <Select.Option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role_name || emp.role_code || '-'})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expectedTime" label="期望完成时间">
                <DatePicker
                  style={{ width: '100%' }}
                  showTime
                  placeholder="请选择期望完成时间"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="描述">
            <TextArea rows={4} placeholder="请输入描述信息" />
          </Form.Item>

          <Divider />

          <Form.Item label="通讯录联系人">
            <Transfer
              dataSource={contactOptions}
              titles={['可选联系人', '已选联系人']}
              targetKeys={selectedContacts}
              onChange={setSelectedContacts}
              render={(item) => (
                <Space>
                  <span>{item.title}</span>
                  <Tag color="blue">{item.description}</Tag>
                </Space>
              )}
              listStyle={{ width: '100%', height: 300 }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                创建工单
              </Button>
              <Button onClick={() => navigate('/orders')}>返回列表</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default OrgSync;
