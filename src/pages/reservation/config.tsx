import React, { useState, useEffect } from 'react';
import {
  Card, Form, Select, Input, InputNumber, Button, Switch, TimePicker,
  Table, message, Popconfirm, Empty, DatePicker, Divider,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, SaveOutlined, CalendarOutlined,
} from '@ant-design/icons';
import { PageContainer, StatusTag } from '@/components/common';
import {
  getReservationConfig,
  updateReservationConfig,
} from '@/services/api/reservation';
import type { ReservationConfig } from '@/services/api/reservation';
import { getPlaceList } from '@/services/api/place';
import dayjs from 'dayjs';

interface TimeSlotItem {
  key: string;
  startTime: string;
  endTime: string;
  capacity: number;
  enabled: boolean;
}

interface HolidayItem {
  key: string;
  date: string;
  name: string;
  maxDaily: number;
  maxPerSlot: number;
}

const ReservationConfigPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<string>('');
  const [placeOptions, setPlaceOptions] = useState<{ label: string; value: string }[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotItem[]>([]);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [configData, setConfigData] = useState<ReservationConfig | null>(null);

  const fetchPlaces = async () => {
    try {
      const res = await getPlaceList({ page: 1, pageSize: 200, status: 'approved' });
      if (res.data?.list) {
        setPlaceOptions(res.data.list.map(p => ({ label: p.name, value: p.id })));
      }
    } catch {}
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchConfig = async (placeId: string) => {
    setLoading(true);
    try {
      const res = await getReservationConfig(placeId);
      if (res.data) {
        setConfigData(res.data);
        form.setFieldsValue({
          maxDailyCapacity: res.data.maxDailyCapacity,
          maxPerReservation: res.data.maxPerReservation,
          minAdvanceDays: res.data.minAdvanceDays,
          maxAdvanceDays: res.data.maxAdvanceDays,
          enabled: res.data.enabled,
          overCapacityPolicy: res.data.overCapacityPolicy || 'auto_reject',
          lateCancelMinutes: res.data.lateCancelMinutes || 30,
          noShowHandling: res.data.noShowHandling || 'auto_cancel',
          maxDailyReservationsPerPhone: res.data.maxDailyReservationsPerPhone || 3,
        });
        if (res.data.timeSlots?.length) {
          const slots: TimeSlotItem[] = res.data.timeSlots.map((slot, idx) => ({
            key: `slot-${idx}`,
            startTime: slot,
            endTime: slot,
            capacity: res.data.maxPerReservation || 100,
            enabled: true,
          }));
          setTimeSlots(slots);
        }
      }
    } catch {
      message.info('暂无配置，请新建');
      form.resetFields();
      setTimeSlots([createDefaultSlot()]);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceChange = (placeId: string) => {
    setSelectedPlace(placeId);
    if (placeId) {
      fetchConfig(placeId);
    } else {
      setConfigData(null);
      form.resetFields();
      setTimeSlots([]);
      setHolidays([]);
    }
  };

  const createDefaultSlot = (): TimeSlotItem => ({
    key: `slot-${Date.now()}`,
    startTime: '09:00',
    endTime: '10:00',
    capacity: 100,
    enabled: true,
  });

  const handleAddSlot = () => {
    setTimeSlots([...timeSlots, createDefaultSlot()]);
  };

  const handleRemoveSlot = (key: string) => {
    setTimeSlots(timeSlots.filter(s => s.key !== key));
  };

  const handleSlotChange = (key: string, field: keyof TimeSlotItem, value: any) => {
    setTimeSlots(timeSlots.map(s => (s.key === key ? { ...s, [field]: value } : s)));
  };

  const handleAddHoliday = () => {
    setHolidays([
      ...holidays,
      { key: `holiday-${Date.now()}`, date: '', name: '', maxDaily: 500, maxPerSlot: 80 },
    ]);
  };

  const handleRemoveHoliday = (key: string) => {
    setHolidays(holidays.filter(h => h.key !== key));
  };

  const handleHolidayChange = (key: string, field: keyof HolidayItem, value: any) => {
    setHolidays(holidays.map(h => (h.key === key ? { ...h, [field]: value } : h)));
  };

  const handleSave = async () => {
    if (!selectedPlace) {
      message.warning('请先选择场所');
      return;
    }
    try {
      const values = await form.validateFields();
      setSaving(true);
      const timeSlotStrings = timeSlots
        .filter(s => s.enabled)
        .map(s => `${s.startTime}-${s.endTime}`);
      await updateReservationConfig(selectedPlace, {
        maxDailyCapacity: values.maxDailyCapacity,
        maxPerReservation: values.maxPerReservation,
        minAdvanceDays: values.minAdvanceDays,
        maxAdvanceDays: values.maxAdvanceDays,
        timeSlots: timeSlotStrings,
        enabled: values.enabled,
        overCapacityPolicy: values.overCapacityPolicy,
        lateCancelMinutes: values.lateCancelMinutes,
        noShowHandling: values.noShowHandling,
        maxDailyReservationsPerPhone: values.maxDailyReservationsPerPhone,
      });
      message.success('保存成功');
      fetchConfig(selectedPlace);
    } catch {
      message.error('保存失败，请检查表单');
    } finally {
      setSaving(false);
    }
  };

  const slotColumns = [
    {
      title: '开始时间',
      dataIndex: 'startTime',
      width: 140,
      render: (val: string, record: TimeSlotItem) => (
        <TimePicker value={val ? dayjs(val, 'HH:mm') : null} format="HH:mm" onChange={(_, str) => handleSlotChange(record.key, 'startTime', str)} className="w-full" size="small" />
      ),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      width: 140,
      render: (val: string, record: TimeSlotItem) => (
        <TimePicker value={val ? dayjs(val, 'HH:mm') : null} format="HH:mm" onChange={(_, str) => handleSlotChange(record.key, 'endTime', str)} className="w-full" size="small" />
      ),
    },
    {
      title: '最大人数',
      dataIndex: 'capacity',
      width: 110,
      render: (val: number, record: TimeSlotItem) => (
        <InputNumber min={1} max={9999} value={val} onChange={(v) => handleSlotChange(record.key, 'capacity', v || 100)} size="small" className="w-full" />
      ),
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 70,
      render: (val: boolean, record: TimeSlotItem) => (
        <Switch size="small" checked={val} onChange={(v) => handleSlotChange(record.key, 'enabled', v)} />
      ),
    },
    {
      title: '操作',
      width: 60,
      render: (_: any, record: TimeSlotItem) => (
        <Popconfirm title="确定删除此时段？" onConfirm={() => handleRemoveSlot(record.key)}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const holidayColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      width: 160,
      render: (val: string, record: HolidayItem) => (
        <DatePicker value={val ? dayjs(val) : null} onChange={(_, str) => handleHolidayChange(record.key, 'date', str)} className="w-full" size="small" />
      ),
    },
    {
      title: '节假日名称',
      dataIndex: 'name',
      width: 140,
      render: (val: string, record: HolidayItem) => (
        <Input placeholder="如: 国庆节" value={val} onChange={(e) => handleHolidayChange(record.key, 'name', e.target.value)} size="small" />
      ),
    },
    {
      title: '每日最大人数',
      dataIndex: 'maxDaily',
      width: 130,
      render: (val: number, record: HolidayItem) => (
        <InputNumber min={1} max={99999} value={val} onChange={(v) => handleHolidayChange(record.key, 'maxDaily', v || 500)} size="small" className="w-full" />
      ),
    },
    {
      title: '每时段最大人数',
      dataIndex: 'maxPerSlot',
      width: 140,
      render: (val: number, record: HolidayItem) => (
        <InputNumber min={1} max={9999} value={val} onChange={(v) => handleHolidayChange(record.key, 'maxPerSlot', v || 80)} size="small" className="w-full" />
      ),
    },
    {
      title: '操作',
      width: 60,
      render: (_: any, record: HolidayItem) => (
        <Popconfirm title="确定删除此节假日配置？" onConfirm={() => handleRemoveHoliday(record.key)}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <PageContainer
      title="预约配置"
      subTitle="配置场所预约时段、限流策略和节假日特殊规则"
      extra={
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
          保存配置
        </Button>
      }
    >
      <Card title="场所选择" className="mb-4" size="small">
        <Select
          placeholder="请选择需要配置的场所"
          options={placeOptions}
          value={selectedPlace || undefined}
          onChange={handlePlaceChange}
          showSearch
          filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
          className="w-full max-w-md"
          loading={loading}
        />
        {configData && (
          <div className="mt-2">
            <StatusTag status={configData.enabled ? 'success' : 'default'} text={configData.enabled ? '预约已启用' : '预约已停用'} />
          </div>
        )}
      </Card>

      {selectedPlace && (
        <>
          <Card title="限流策略" className="mb-4" size="small">
            <Form form={form} layout="inline" className="flex-wrap gap-y-4">
              <Form.Item name="maxDailyCapacity" label="每日最大人数" rules={[{ required: true, message: '请输入' }]}>
                <InputNumber min={1} max={99999} placeholder="如: 5000" />
              </Form.Item>
              <Form.Item name="maxPerReservation" label="每时段最大人数" rules={[{ required: true, message: '请输入' }]}>
                <InputNumber min={1} max={9999} placeholder="如: 500" />
              </Form.Item>
              <Form.Item name="minAdvanceDays" label="最少提前天数" rules={[{ required: true, message: '请输入' }]}>
                <InputNumber min={0} max={30} placeholder="如: 1" />
              </Form.Item>
              <Form.Item name="maxAdvanceDays" label="最多提前天数" rules={[{ required: true, message: '请输入' }]}>
                <InputNumber min={1} max={90} placeholder="如: 7" />
              </Form.Item>
              <Form.Item name="enabled" label="启用预约" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Form>
          </Card>

          <Card title="超员处理策略" className="mb-4" size="small">
            <Form form={form} layout="inline" className="flex-wrap gap-y-4">
              <Form.Item name="overCapacityPolicy" label="超员处理方式" rules={[{ required: true, message: '请选择' }]}>
                <Select
                  style={{ width: 180 }}
                  options={[
                    { label: '自动拒绝', value: 'auto_reject' },
                    { label: '排队等候', value: 'queue_wait' },
                  ]}
                />
              </Form.Item>
            </Form>
          </Card>

          <Card title="核销规则" className="mb-4" size="small">
            <Form form={form} layout="inline" className="flex-wrap gap-y-4">
              <Form.Item name="lateCancelMinutes" label="迟到自动取消(分钟)" rules={[{ required: true, message: '请输入' }]}>
                <InputNumber min={5} max={120} placeholder="如: 30" />
              </Form.Item>
              <Form.Item name="noShowHandling" label="爽约处理" rules={[{ required: true, message: '请选择' }]}>
                <Select
                  style={{ width: 180 }}
                  options={[
                    { label: '自动取消预约', value: 'auto_cancel' },
                    { label: '标记爽约', value: 'mark_no_show' },
                  ]}
                />
              </Form.Item>
            </Form>
          </Card>

          <Card title="异常规则" className="mb-4" size="small">
            <Form form={form} layout="inline" className="flex-wrap gap-y-4">
              <Form.Item name="maxDailyReservationsPerPhone" label="同一手机号每日最大预约次数" rules={[{ required: true, message: '请输入' }]}>
                <InputNumber min={1} max={20} placeholder="如: 3" />
              </Form.Item>
            </Form>
          </Card>

          <Card
            title="时段配置"
            className="mb-4"
            size="small"
            extra={
              <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddSlot} size="small">
                添加时段
              </Button>
            }
          >
            {timeSlots.length === 0 ? (
              <Empty description="暂无时段配置，请添加" />
            ) : (
              <Table dataSource={timeSlots} columns={slotColumns} rowKey="key" pagination={false} size="small" />
            )}
          </Card>

          <Card
            title="节假日特殊配置"
            className="mb-4"
            size="small"
            extra={
              <Button type="dashed" icon={<CalendarOutlined />} onClick={handleAddHoliday} size="small">
                添加节假日
              </Button>
            }
          >
            {holidays.length === 0 ? (
              <Empty description="暂无节假日特殊配置" />
            ) : (
              <Table dataSource={holidays} columns={holidayColumns} rowKey="key" pagination={false} size="small" />
            )}
          </Card>
        </>
      )}
    </PageContainer>
  );
};

export default ReservationConfigPage;
