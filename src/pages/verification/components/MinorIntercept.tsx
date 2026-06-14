import React, { useState } from 'react';
import {
  Modal, Descriptions, Steps, Form, Input, Select, Button, Timeline, Tag, message, Card,
} from 'antd';
import {
  WarningOutlined, CheckCircleOutlined, PhoneOutlined, UserOutlined,
} from '@ant-design/icons';
import { UploadPro, StatusTag } from '@/components/common';
import { getMinorInterceptList, handleMinorIntercept, type MinorInterceptRecord } from '@/services/api/verification';
import { formatDateTime } from '@/utils/format';

interface MinorInterceptProps {
  open: boolean;
  verificationId: string;
  onCancel: () => void;
  onSuccess?: () => void;
}

const MinorInterceptModal: React.FC<MinorInterceptProps> = ({ open, verificationId, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [record, setRecord] = useState<MinorInterceptRecord | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (open && verificationId) {
      getMinorInterceptList({ pageSize: 100 }).then(res => {
        const found = res.data?.list?.find((r: MinorInterceptRecord) => r.verificationId === verificationId);
        if (found) {
          setRecord(found);
          if (found.status === 'discovered' || found.status === 'notified') {
            setCurrentStep(1);
          } else if (found.status === 'picked_up' || found.status === 'police_involved') {
            setCurrentStep(2);
          } else {
            setCurrentStep(3);
          }
        }
      });
    }
  }, [open, verificationId]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!record) return;
      setLoading(true);
      const res = await handleMinorIntercept({
        id: record.id,
        handleResult: values.handleResult,
        handleRemark: values.handleRemark || '',
        handlePhotos: values.handlePhotos?.map((f: any) => f.url || f.response?.data?.url).filter(Boolean),
        guardianName: values.guardianName,
        guardianPhone: values.guardianPhone,
      });
      if (res.data) {
        setRecord(res.data);
        setCurrentStep(2);
        message.success('处置成功');
        onSuccess?.();
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const statusMap: Record<string, { type: 'danger' | 'warning' | 'success' | 'default'; text: string }> = {
    discovered: { type: 'danger', text: '已发现' },
    notified: { type: 'warning', text: '已通知' },
    picked_up: { type: 'success', text: '已接回' },
    police_involved: { type: 'warning', text: '公安介入' },
    closed: { type: 'default', text: '已关闭' },
  };

  return (
    <Modal
      title={<span className="text-red-500"><WarningOutlined /> 未成年人拦截处置</span>}
      open={open}
      onCancel={onCancel}
      width={700}
      footer={null}
      destroyOnClose
    >
      {record && (
        <div className="space-y-4">
          <Steps
            current={currentStep}
            className="mb-4"
            items={[
              { title: '发现', description: '检测到未成年人' },
              { title: '通知处置', description: '通知监护人' },
              { title: '处置完成', description: '记录关闭' },
            ]}
          />

          <Card title="拦截记录详情" size="small" className="shadow-none border border-neutral-100 dark:border-neutral-700">
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="场所名称">{record.placeName}</Descriptions.Item>
              <Descriptions.Item label="未成年人姓名">{record.minorName}</Descriptions.Item>
              <Descriptions.Item label="身份证号">{record.minorIdCard}</Descriptions.Item>
              <Descriptions.Item label="年龄">{record.minorAge}岁</Descriptions.Item>
              <Descriptions.Item label="发现时间" span={2}>{formatDateTime(record.discoverTime)}</Descriptions.Item>
              <Descriptions.Item label="发现人">{record.discoverer}</Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <StatusTag status={statusMap[record.status]?.type || 'default'} text={statusMap[record.status]?.text || record.statusName} />
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="处置流程" size="small" className="shadow-none border border-neutral-100 dark:border-neutral-700">
            <Timeline
              items={[
                {
                  color: 'red',
                  children: (
                    <div>
                      <div className="font-medium">发现未成年人</div>
                      <div className="text-xs text-neutral-400">{formatDateTime(record.discoverTime)} | {record.discoverer}</div>
                    </div>
                  ),
                },
                {
                  color: 'orange',
                  children: (
                    <div>
                      <div className="font-medium">通知场所管理员</div>
                      <div className="text-xs text-neutral-400">系统自动通知</div>
                    </div>
                  ),
                },
                {
                  color: 'blue',
                  children: (
                    <div>
                      <div className="font-medium">通知监护人</div>
                      <div className="text-xs text-neutral-400">
                        {record.guardianPhone ? `已通知 ${record.guardianName}（${record.guardianPhone}）` : '模拟通知已发送'}
                      </div>
                    </div>
                  ),
                },
                record.handleResult && {
                  color: record.handleResult === 'guardian_pickup' ? 'green' : record.handleResult === 'police_involved' ? 'red' : 'blue',
                  children: (
                    <div>
                      <div className="font-medium">
                        {record.handleResultName || (record.handleResult === 'guardian_pickup' ? '监护人带走' : record.handleResult === 'police_involved' ? '公安介入' : '其他')}
                      </div>
                      {record.handleRemark && <div className="text-xs text-neutral-500 mt-1">{record.handleRemark}</div>}
                      {record.closeTime && <div className="text-xs text-neutral-400 mt-1">{formatDateTime(record.closeTime)} | {record.closedBy}</div>}
                    </div>
                  ),
                },
              ].filter(Boolean) as any}
            />
          </Card>

          {currentStep < 2 && (
            <Card title="处置操作" size="small" className="shadow-none border border-red-200 dark:border-red-800">
              <Form form={form} layout="vertical">
                <Form.Item name="guardianName" label="监护人姓名">
                  <Input placeholder="请输入监护人姓名" prefix={<UserOutlined />} />
                </Form.Item>
                <Form.Item name="guardianPhone" label="监护人联系电话">
                  <Input placeholder="请输入监护人电话" prefix={<PhoneOutlined />} />
                </Form.Item>
                <Form.Item name="handleResult" label="处置结果" rules={[{ required: true, message: '请选择处置结果' }]}>
                  <Select
                    placeholder="请选择处置结果"
                    options={[
                      { label: '监护人带走', value: 'guardian_pickup' },
                      { label: '公安介入', value: 'police_involved' },
                      { label: '其他', value: 'other' },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="handleRemark" label="处置备注" rules={[{ required: true, message: '请填写处置备注' }]}>
                  <Input.TextArea rows={3} placeholder="请填写处置情况说明" />
                </Form.Item>
                <Form.Item name="handlePhotos" label="处置照片" valuePropName="value">
                  <UploadPro uploadType="image" maxCount={4} listType="picture-card" buttonText="上传照片" />
                </Form.Item>
                <div className="flex justify-end gap-2">
                  <Button onClick={onCancel}>取消</Button>
                  <Button type="primary" danger loading={loading} onClick={handleSubmit}>
                    提交处置结果
                  </Button>
                </div>
              </Form>
            </Card>
          )}

          {currentStep >= 2 && (
            <div className="flex justify-end">
              <Button onClick={onCancel}>关闭</Button>
            </div>
          )}
        </div>
      )}

      {!record && (
        <div className="py-12 text-center text-neutral-400">
          <WarningOutlined className="text-4xl mb-4" />
          <div>暂无拦截记录，可能尚未创建</div>
          <Button className="mt-4" onClick={onCancel}>关闭</Button>
        </div>
      )}
    </Modal>
  );
};

export default MinorInterceptModal;
