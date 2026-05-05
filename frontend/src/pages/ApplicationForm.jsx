import { Form, Input, InputNumber, Select, Button, Card, message, Space, Upload, Divider, Typography } from 'antd';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { isEditable, isRejected } from '../utils/status';

const { TextArea } = Input;
const { Title } = Typography;

const ApplicationForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [projects, setProjects] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const [ccUsers, setCcUsers] = useState([]);
  const [applicationData, setApplicationData] = useState(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [projectsRes, typesRes, approversRes, usersRes] = await Promise.all([
          api.get('/common/projects'),
          api.get('/common/expense-types'),
          api.get('/common/users?role=approver,admin'),
          api.get('/common/users'),
        ]);
        setProjects(projectsRes.data);
        setExpenseTypes(typesRes.data);
        setApprovers(approversRes.data);
        setCcUsers(usersRes.data);
      } catch (error) {
        message.error('加载选项数据失败');
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (id) {
      const loadApplication = async () => {
        try {
          const response = await api.get(`/applications/${id}`);
          const data = response.data;
          setApplicationData(data);
          
          if (!isEditable(data.status)) {
            message.error('该申请不可编辑');
            navigate(`/applications/${id}`);
            return;
          }

          form.setFieldsValue({
            project_id: data.project_id,
            expense_type_id: data.expense_type_id,
            amount: data.amount,
            description: data.description,
            approver_id: data.approver_id,
            cc_user_ids: data.cc_records?.map(cc => cc.user_id) || [],
          });
        } catch (error) {
          message.error('加载申请数据失败');
        } finally {
          setInitialLoading(false);
        }
      };
      loadApplication();
    }
  }, [id, form, navigate]);

  const handleSave = async (values, submitType) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        status: submitType === 'submit' ? 'submitted' : 'draft',
      };

      if (id) {
        await api.put(`/applications/${id}`, data);
        message.success(submitType === 'submit' ? '提交成功' : '保存草稿成功');
      } else {
        await api.post('/applications', data);
        message.success(submitType === 'submit' ? '提交成功' : '保存草稿成功');
      }
      
      navigate('/applications');
    } catch (error) {
      message.error(error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    await handleSave(values, 'submit');
  };

  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields(['project_id', 'expense_type_id', 'amount', 'description'], { force: true });
      await handleSave(values, 'draft');
    } catch (error) {
      if (error.errorFields) {
        await handleSave(form.getFieldsValue(), 'draft');
      } else {
        message.error('保存失败');
      }
    }
  };

  if (initialLoading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <Title level={4}>{id ? (isRejected(applicationData?.status) ? '修改报销申请（重新提交）' : '编辑报销申请') : '发起报销申请'}</Title>
      
      {applicationData && isRejected(applicationData.status) && (
        <Card style={{ marginBottom: 16, background: '#fff2f0', borderColor: '#ffccc7' }}>
          <p style={{ margin: 0, color: '#ff4d4f' }}>
            <strong>提示：</strong>此申请已被驳回，请修改后重新提交
          </p>
        </Card>
      )}

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            amount: 0,
          }}
        >
          <Form.Item
            name="project_id"
            label="所属项目"
            rules={[{ required: true, message: '请选择所属项目' }]}
          >
            <Select placeholder="请选择所属项目" showSearch optionFilterProp="children">
              {projects.map(p => (
                <Select.Option key={p.id} value={p.id}>
                  {p.code ? `[${p.code}] ` : ''}{p.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="expense_type_id"
            label="报销类型"
            rules={[{ required: true, message: '请选择报销类型' }]}
          >
            <Select placeholder="请选择报销类型">
              {expenseTypes.map(t => (
                <Select.Option key={t.id} value={t.id}>
                  {t.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="amount"
            label="报销金额 (元)"
            rules={[
              { required: true, message: '请输入报销金额' },
              { type: 'number', min: 0.01, message: '金额必须大于0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入报销金额"
              min={0}
              precision={2}
              addonAfter="元"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="内容描述"
            rules={[{ required: true, message: '请输入内容描述' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细描述报销内容"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Divider />

          <Form.Item
            name="approver_id"
            label="审批人"
            rules={[{ required: true, message: '请指定审批人' }]}
          >
            <Select placeholder="请选择审批人" showSearch optionFilterProp="children">
              {approvers.map(u => (
                <Select.Option key={u.id} value={u.id}>
                  {u.name} ({u.department || u.role_name})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="cc_user_ids"
            label="抄送人 (可选)"
          >
            <Select
              mode="multiple"
              placeholder="请选择抄送人"
              showSearch
              optionFilterProp="children"
              maxTagCount={3}
            >
              {ccUsers.map(u => (
                <Select.Option key={u.id} value={u.id}>
                  {u.name} ({u.department || u.role_name})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Divider />

          <Form.Item label="附件上传">
            <Upload>
              <Button>上传发票/附件</Button>
            </Upload>
            <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
              支持上传纸质发票图片和电子票据附件
            </div>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {id ? '重新提交' : '提交申请'}
              </Button>
              <Button onClick={handleSaveDraft} loading={loading}>
                保存草稿
              </Button>
              <Button onClick={() => navigate('/applications')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ApplicationForm;
