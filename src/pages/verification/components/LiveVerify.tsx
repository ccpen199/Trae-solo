import React, { useState } from 'react';
import {
  Modal, Steps, Form, Input, Select, Button, Result, Descriptions, Progress, Space, Card, Image, message, Switch, Tag,
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, PrinterOutlined, IdcardOutlined,
} from '@ant-design/icons';
import { UploadPro, StatusTag } from '@/components/common';
import { liveVerify, type LiveVerifyResult } from '@/services/api/verification';
import { getPlaceList } from '@/services/api/place';

interface LiveVerifyProps {
  open: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
  onMinorIntercept?: (verificationId: string) => void;
}

const LiveVerifyModal: React.FC<LiveVerifyProps> = ({ open, onCancel, onSuccess, onMinorIntercept }) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LiveVerifyResult | null>(null);
  const [placeOptions, setPlaceOptions] = useState<{ label: string; value: string }[]>([]);
  const [useCardReader, setUseCardReader] = useState(false);

  React.useEffect(() => {
    if (open) {
      getPlaceList({ page: 1, pageSize: 100, status: 'approved' }).then(res => {
        if (res.data?.list) setPlaceOptions(res.data.list.map(p => ({ label: p.name, value: p.id })));
      });
      setCurrentStep(0);
      setResult(null);
      form.resetFields();
    }
  }, [open, form]);

  const handleStep1Submit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setCurrentStep(1);
      const res = await liveVerify({
        placeId: values.placeId,
        name: values.name,
        idCard: values.idCard,
        phone: values.phone,
        cardReader: useCardReader,
      });
      if (res.data) {
        setResult(res.data);
        setCurrentStep(2);
        if (res.data.matchResult === 'matched' && !res.data.isMinor) {
          onSuccess?.();
        }
        if (res.data.isMinor) {
          onSuccess?.();
        }
      }
    } catch {
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    message.success('小票打印指令已发送');
  };

  const handleCancel = () => {
    setCurrentStep(0);
    setResult(null);
    form.resetFields();
    onCancel();
  };

  const isMatched = result?.matchResult === 'matched';
  const isMinor = result?.isMinor;

  return (
    <Modal
      title="现场核验"
      open={open}
      onCancel={handleCancel}
      width={680}
      footer={null}
      destroyOnClose
    >
      <Steps
        current={currentStep}
        className="mb-6"
        items={[
          { title: '输入信息' },
          { title: '比对核验', description: currentStep === 1 ? '正在核验中...' : '' },
          { title: '结果处置' },
        ]}
      />

      {currentStep === 0 && (
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="placeId" label="核验场所" rules={[{ required: true, message: '请选择场所' }]}>
            <Select
              placeholder="请选择场所"
              options={placeOptions}
              showSearch
              filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-neutral-500">使用读卡器刷证</span>
            <Switch
              checked={useCardReader}
              onChange={setUseCardReader}
              checkedChildren="读卡器"
              unCheckedChildren="手动输入"
            />
          </div>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" maxLength={20} prefix={<IdcardOutlined />} disabled={useCardReader} />
          </Form.Item>
          <Form.Item name="idCard" label="身份证号" rules={[
            { required: true, message: '请输入身份证号' },
            { pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/, message: '请输入正确的18位身份证号' },
          ]}>
            <Input placeholder="请输入18位身份证号" maxLength={18} disabled={useCardReader} />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入手机号（选填）" maxLength={11} />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={handleCancel}>取消</Button>
            <Button type="primary" onClick={handleStep1Submit} loading={loading}>
              开始核验
            </Button>
          </div>
        </Form>
      )}

      {currentStep === 1 && (
        <div className="flex flex-col items-center py-12">
          <div className="text-blue-500 text-4xl mb-4">🔍</div>
          <div className="text-lg font-medium mb-2">正在调用核验接口...</div>
          <div className="text-neutral-400 text-sm">比对公安人口库数据，请稍候</div>
        </div>
      )}

      {currentStep === 2 && result && (
        <div className="space-y-4">
          <Result
            icon={isMinor ? <WarningOutlined style={{ color: '#faad14' }} /> : isMatched ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            title={isMinor ? '核验通过 - 检测到未成年人！' : isMatched ? '核验通过' : '核验不匹配'}
            subTitle={isMinor ? '已自动触发拦截流程' : isMatched ? '身份信息比对一致' : '身份信息与公安人口库不匹配，需人工复核'}
          />

          <Card title="比对结果" size="small" className="shadow-none border border-neutral-100 dark:border-neutral-700">
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="公安人口库比对">
                {isMatched ? (
                  <Tag color="green">匹配</Tag>
                ) : (
                  <Tag color="red">不匹配</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="比对来源">
                {result.compareSource === 'police' ? '公安人口库' : '本地数据库'}
              </Descriptions.Item>
              <Descriptions.Item label="匹配置信度" span={2}>
                <Progress
                  percent={result.confidence}
                  strokeColor={result.confidence >= 80 ? '#52c41a' : result.confidence >= 60 ? '#faad14' : '#ff4d4f'}
                  status="active"
                />
              </Descriptions.Item>
              <Descriptions.Item label="比对时间" span={2}>{result.verifyTime}</Descriptions.Item>
            </Descriptions>
          </Card>

          {result.comparePhoto && (
            <Card title="比对照片" size="small" className="shadow-none border border-neutral-100 dark:border-neutral-700">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <Image src={result.comparePhoto} width={120} height={120} className="rounded-lg object-cover" />
                  <div className="text-xs text-neutral-400 mt-1">公安库照片</div>
                </div>
                <div className="text-2xl text-neutral-300">⟷</div>
                <div className="text-center">
                  <div className="w-[120px] h-[120px] bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center text-neutral-400">
                    现场照片
                  </div>
                  <div className="text-xs text-neutral-400 mt-1">现场采集</div>
                </div>
              </div>
            </Card>
          )}

          {isMinor && (
            <Card
              title={<span className="text-red-500"><WarningOutlined /> 未成年人拦截处置</span>}
              size="small"
              className="shadow-none border-2 border-red-200 dark:border-red-800"
              bodyStyle={{ background: '#fff2f0' }}
            >
              <div className="space-y-3">
                <div className="text-sm text-red-600 font-medium">
                  检测到未成年人进入文化娱乐场所，已自动执行以下操作：
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Tag color="red">1</Tag>
                    <span>已自动创建拦截记录</span>
                    <CheckCircleOutlined className="text-green-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag color="orange">2</Tag>
                    <span>已通知场所管理员</span>
                    <CheckCircleOutlined className="text-green-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag color="blue">3</Tag>
                    <span>已发送监护人通知（模拟）</span>
                    <CheckCircleOutlined className="text-green-500" />
                  </div>
                </div>
                <Button
                  type="primary"
                  danger
                  block
                  onClick={() => {
                    if (result.interceptRecordId) {
                      onMinorIntercept?.(result.interceptRecordId);
                    }
                    handleCancel();
                  }}
                >
                  前往处置未成年人拦截
                </Button>
              </div>
            </Card>
          )}

          {!isMinor && isMatched && (
            <Card title="放行操作" size="small" className="shadow-none border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-neutral-500">成年人 + 身份匹配</div>
                  <div className="text-green-600 font-medium">允许放行</div>
                </div>
                <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                  打印小票
                </Button>
              </div>
            </Card>
          )}

          {!isMinor && !isMatched && (
            <Card title="异常处理" size="small" className="shadow-none border border-orange-200 dark:border-orange-800">
              <div className="space-y-2">
                <div className="text-sm text-orange-600 font-medium">身份信息不匹配，需人工复核</div>
                <div className="text-sm text-neutral-500">已标记为异常记录，请要求当事人提供其他身份证明材料</div>
              </div>
            </Card>
          )}

          <div className="text-xs text-neutral-400 text-center">
            操作留痕：操作人=系统管理员 | 操作时间={result.verifyTime} | 操作结果={isMinor ? '未成年人拦截' : isMatched ? '放行' : '标记异常'}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCancel}>关闭</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default LiveVerifyModal;
