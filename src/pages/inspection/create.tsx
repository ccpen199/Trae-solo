import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Form, Input, Select, DatePicker, Button, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import PageContainer from '@/components/common/PageContainer';
import UploadPro from '@/components/common/UploadPro';
import CheckItemForm from './components/CheckItemForm';
import {
  createInspection,
  getInspectionDetail,
  type InspectionPriority,
  type InspectionType,
} from '@/services/api/inspection';
import { getPlaceList } from '@/services/api/place';

const priorityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
];

const typeOptions = [
  { label: '常规巡检', value: 'routine' },
  { label: '专项检查', value: 'special' },
  { label: '投诉核查', value: 'complaint' },
  { label: '告警联动', value: 'emergency' },
];

const InspectionCreate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const [form] = Form.useForm();
  const [checkItems, setCheckItems] = useState<{ name: string; category: string }[]>([]);

  const { data: placeData } = useRequest(() => getPlaceList({ page: 1, pageSize: 200 }));

  const { data: editData } = useRequest(() => getInspectionDetail(editId!), {
    ready: !!editId,
    onSuccess: (res) => {
      const task = res.data;
      form.setFieldsValue({
        title: task.title,
        type: task.type,
        priority: task.priority,
        placeId: task.placeId,
        inspectorId: task.inspectorId,
        description: task.description,
      });
      setCheckItems(task.checkItems.map((i) => ({ name: i.name, category: i.category })));
    },
  });

  const { run: runCreate, loading: creating } = useRequest(createInspection, {
    manual: true,
    onSuccess: () => {
      message.success(editId ? '更新成功' : '创建成功');
      navigate('/inspection/list');
    },
  });

  const handleSubmit = async () => {
    const values = await form.validateFields();
    runCreate({
      title: values.title,
      type: values.type as InspectionType,
      priority: values.priority as InspectionPriority,
      placeId: values.placeId,
      inspectorId: values.inspectorId,
      description: values.description || '',
      checkItems: checkItems.filter((i) => i.name.trim()),
      startTime: values.startTime?.format('YYYY-MM-DD HH:mm:ss') || new Date().toISOString().slice(0, 19).replace('T', ' '),
      deadline: values.deadline?.format('YYYY-MM-DD HH:mm:ss') || '',
    });
  };

  const placeOptions = (placeData?.data?.list || []).map((p) => ({
    label: p.name,
    value: p.id,
  }));

  const inspectorOptions = [
    { label: '张明', value: '1' },
    { label: '李华', value: '2' },
    { label: '王强', value: '3' },
    { label: '刘洋', value: '4' },
    { label: '赵鹏', value: '5' },
  ];

  return (
    <PageContainer
      title={editId ? '编辑巡检任务' : '创建巡检任务'}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inspection/list')}>
          返回列表
        </Button>
      }
    >
      <Card className="shadow-none border border-neutral-100 dark:border-neutral-700" bodyStyle={{ padding: '24px' }}>
        <Form form={form} layout="vertical" style={{ maxWidth: 800 }}>
          <Form.Item name="title" label="任务标题" rules={[{ required: true, message: '请输入任务标题' }]}>
            <Input placeholder="请输入任务标题" />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Form.Item name="type" label="任务类型" rules={[{ required: true, message: '请选择' }]}>
              <Select placeholder="请选择任务类型" options={typeOptions} />
            </Form.Item>
            <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请选择' }]}>
              <Select placeholder="请选择优先级" options={priorityOptions} />
            </Form.Item>
            <Form.Item name="placeId" label="关联场所" rules={[{ required: true, message: '请选择' }]}>
              <Select placeholder="请选择场所" showSearch optionFilterProp="label" options={placeOptions} />
            </Form.Item>
            <Form.Item name="inspectorId" label="指派巡检员" rules={[{ required: true, message: '请选择' }]}>
              <Select placeholder="请选择巡检员" options={inspectorOptions} />
            </Form.Item>
            <Form.Item name="startTime" label="开始时间">
              <DatePicker showTime style={{ width: '100%' }} placeholder="请选择开始时间" />
            </Form.Item>
            <Form.Item name="deadline" label="截止时间" rules={[{ required: true, message: '请选择截止时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} placeholder="请选择截止时间" />
            </Form.Item>
          </div>

          <Form.Item label="检查项配置">
            <CheckItemForm value={checkItems} onChange={setCheckItems} />
          </Form.Item>

          <Form.Item name="description" label="任务描述">
            <Input.TextArea rows={4} placeholder="请输入任务描述" />
          </Form.Item>

          <Form.Item label="附件">
            <UploadPro uploadType="file" maxCount={5} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" onClick={handleSubmit} loading={creating} className="mr-3">
              {editId ? '更新任务' : '创建任务'}
            </Button>
            <Button onClick={() => navigate('/inspection/list')}>取消</Button>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default InspectionCreate;
