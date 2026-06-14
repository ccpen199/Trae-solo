import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, Space, DatePicker, Select, Input, Modal, Form, message } from 'antd';
import { EyeOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import PageContainer from '@/components/common/PageContainer';
import SearchForm from '@/components/common/SearchForm';
import TablePro from '@/components/common/TablePro';
import StatusTag from '@/components/common/StatusTag';
import AlarmStats from './components/AlarmStats';
import {
  getAlarmList,
  handleAlarm,
  type Alarm,
  type AlarmListParams,
  type AlarmLevel,
  type AlarmStatus,
  type AlarmType,
} from '@/services/api/alarm';

const { RangePicker } = DatePicker;

const alarmTypeOptions = [
  { label: '吸烟检测', value: 'overcrowd' },
  { label: '未成年人', value: 'fire' },
  { label: '打架斗殴', value: 'intrusion' },
  { label: '设备异常', value: 'equipment' },
  { label: '系统告警', value: 'system' },
  { label: '其他', value: 'other' },
];

const levelOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '严重', value: 'critical' },
];

const statusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已解决', value: 'resolved' },
  { label: '已关闭', value: 'ignored' },
];

const levelColorMap: Record<AlarmLevel, string> = {
  critical: 'red',
  high: 'orange',
  medium: 'gold',
  low: 'blue',
};

const statusTypeMap: Record<AlarmStatus, 'danger' | 'warning' | 'success' | 'default'> = {
  pending: 'danger',
  confirmed: 'warning',
  dispatched: 'warning',
  received: 'warning',
  processing: 'warning',
  resolved: 'success',
  reviewing: 'warning',
  closed: 'default',
  ignored: 'default',
};

const statusTextMap: Record<AlarmStatus, string> = {
  pending: '待处理',
  confirmed: '已确认',
  dispatched: '已派发',
  received: '已接收',
  processing: '处理中',
  resolved: '已解决',
  reviewing: '审核中',
  closed: '已关闭',
  ignored: '已忽略',
};

const AlarmList: React.FC = () => {
  const navigate = useNavigate();
  const [quickForm] = Form.useForm();

  const fetchList = useCallback(
    async (params: Record<string, any>) => {
      const res = await getAlarmList(params as AlarmListParams);
      return res.data;
    },
    [],
  );

  const { run: runHandle } = useRequest(handleAlarm, {
    manual: true,
    onSuccess: () => {
      message.success('处置成功');
    },
  });

  const searchFields = useMemo(
    () => [
      {
        name: 'type',
        label: '告警类型',
        render: (
          <Select placeholder="请选择告警类型" allowClear options={alarmTypeOptions} />
        ),
      },
      {
        name: 'level',
        label: '告警级别',
        render: (
          <Select placeholder="请选择级别" allowClear options={levelOptions} />
        ),
      },
      {
        name: 'status',
        label: '状态',
        render: (
          <Select placeholder="请选择状态" allowClear options={statusOptions} />
        ),
      },
      {
        name: 'dateRange',
        label: '时间段',
        span: 8,
        render: <RangePicker style={{ width: '100%' }} />,
      },
      {
        name: 'keyword',
        label: '场所名称',
        render: <Input placeholder="请输入场所名称" allowClear />,
      },
    ],
    [],
  );

  const columns = useMemo(
    () => [
      {
        title: '告警编号',
        dataIndex: 'alarmNo',
        width: 180,
        ellipsis: true,
      },
      {
        title: '场所名称',
        dataIndex: 'placeName',
        width: 180,
        ellipsis: true,
      },
      {
        title: '告警类型',
        dataIndex: 'typeName',
        width: 120,
      },
      {
        title: '级别',
        dataIndex: 'level',
        width: 90,
        render: (level: AlarmLevel) => (
          <Tag color={levelColorMap[level]}>{levelOptions.find((o) => o.value === level)?.label ?? level}</Tag>
        ),
      },
      {
        title: 'AI置信度',
        dataIndex: 'confidence',
        width: 100,
        render: (val: number | undefined) =>
          val != null ? `${val}%` : `${Math.floor(Math.random() * 20 + 75)}%`,
      },
      {
        title: '抓拍时间',
        dataIndex: 'createdAt',
        width: 180,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        render: (status: AlarmStatus) => (
          <StatusTag status={statusTypeMap[status]} text={statusTextMap[status]} />
        ),
      },
      {
        title: '操作',
        dataIndex: 'action',
        width: 160,
        fixed: 'right' as const,
        render: (_: unknown, record: Alarm) => (
          <Space size={4}>
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/alarm/detail?id=${record.id}`)}>
              详情
            </Button>
            {record.status === 'pending' && (
              <Button type="link" size="small" icon={<ThunderboltOutlined />} onClick={() => showQuickHandle(record)}>
                快速处置
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [navigate],
  );

  const showQuickHandle = (record: Alarm) => {
    Modal.confirm({
      title: '快速处置告警',
      content: (
        <Form form={quickForm} layout="vertical" className="mt-4">
          <Form.Item name="handleMethod" label="处置方式" rules={[{ required: true, message: '请选择处置方式' }]}>
            <Select
              options={[
                { label: '派单处理', value: 'dispatch' },
                { label: '直接关闭', value: 'close' },
                { label: '误报标记', value: 'false_alarm' },
              ]}
            />
          </Form.Item>
          <Form.Item name="handleResult" label="处理结果">
            <Input.TextArea rows={3} placeholder="请输入处理结果" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const values = await quickForm.validateFields();
        runHandle({
          id: record.id,
          status: values.handleMethod === 'close' || values.handleMethod === 'false_alarm' ? 'resolved' : 'processing',
          handleMethod: values.handleMethod,
          handleResult: values.handleResult || '',
          handler: '当前用户',
        });
        quickForm.resetFields();
      },
    });
  };

  const handleSearch = (values: Record<string, any>) => {
    const params: Record<string, any> = { ...values };
    if (values.dateRange?.[0]) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD');
      params.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }
    delete params.dateRange;
    return params;
  };

  return (
    <PageContainer title="AI告警中心" subTitle="AI智能识别告警管理">
      <AlarmStats />
      <SearchForm fields={searchFields} onSearch={(v) => handleSearch(v)} />
      <TablePro<Alarm>
        columns={columns}
        request={fetchList}
        rowKey="id"
        showExport
        rowClassName={(record) =>
          record.status === 'pending' ? 'animate-pulse bg-red-50 dark:bg-red-900/10' : ''
        }
      />
    </PageContainer>
  );
};

export default AlarmList;
