import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  Button,
  Radio,
  Slider,
  DatePicker,
  Input,
  Tag,
  message,
  Steps,
  Divider,
  Alert,
} from 'antd';
import {
  ArrowLeft,
  Package,
  Target,
  MapPin,
  Monitor,
  Percent,
  Calendar,
  Rocket,
  CheckCircle,
  Info,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { otaApi } from '@/services/api';
import type { FirmwareVersion, OTATask } from '@/types';

const { Option } = Select;

const strategyOptions = [
  { value: 'all', label: '全量发布', desc: '推送到所有符合条件的设备' },
  { value: 'region', label: '按地域发布', desc: '按地域选择设备进行推送' },
  { value: 'model', label: '按型号发布', desc: '按设备型号选择进行推送' },
  { value: 'manual', label: '手动选择', desc: '手动选择指定设备进行推送' },
];

const regionList = ['华北', '华东', '华南', '华中', '西南', '西北', '东北'];

const CreateOTATask: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [firmwares, setFirmwares] = useState<FirmwareVersion[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [regions] = useState<string[]>(regionList);
  const [selectedFirmware, setSelectedFirmware] = useState<FirmwareVersion | null>(null);
  const [strategy, setStrategy] = useState<OTATask['strategy']>('all');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [grayPercentage, setGrayPercentage] = useState(100);
  const [scheduleType, setScheduleType] = useState<'now' | 'schedule'>('now');
  const [estimatedDevices, setEstimatedDevices] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [firmwareList, modelList] = await Promise.all([
          otaApi.getFirmwares(),
          otaApi.getModels(),
        ]);
        setFirmwares(firmwareList);
        setModels(modelList);
      } catch (error) {
        console.error('获取数据失败:', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let count = 0;
    if (strategy === 'all') {
      count = 5000;
    } else if (strategy === 'region') {
      count = selectedRegions.length * 800;
    } else if (strategy === 'model') {
      count = selectedModels.length * 1500;
    } else {
      count = 0;
    }
    setEstimatedDevices(Math.round(count * (grayPercentage / 100)));
  }, [strategy, selectedRegions, selectedModels, grayPercentage]);

  const handleFirmwareChange = (value: string) => {
    const firmware = firmwares.find((f) => f.id === value);
    setSelectedFirmware(firmware || null);
  };

  const handleNext = () => {
    if (currentStep === 0 && !selectedFirmware) {
      message.warning('请选择固件版本');
      return;
    }
    if (currentStep === 1) {
      if (strategy === 'region' && selectedRegions.length === 0) {
        message.warning('请选择至少一个地域');
        return;
      }
      if (strategy === 'model' && selectedModels.length === 0) {
        message.warning('请选择至少一个型号');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      await otaApi.createTask({
        firmwareId: selectedFirmware?.id || '',
        strategy,
        regions: selectedRegions,
        models: selectedModels,
        grayPercentage,
        scheduleTime: scheduleType === 'schedule' ? values.scheduleTime?.toISOString() : undefined,
        name: values.taskName,
      });
      message.success('任务创建成功');
      setTimeout(() => {
        navigate('/ota/tasks');
      }, 1000);
    } catch (error) {
      message.error('创建任务失败');
    } finally {
      setSubmitting(false);
    }
  };

  const stepItems = [
    { title: '选择固件', icon: <Package size={16} /> },
    { title: '设置策略', icon: <Target size={16} /> },
    { title: '确认提交', icon: <CheckCircle size={16} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          type="text"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/ota/tasks')}
          className="px-2"
        >
          返回
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">创建发布任务</h1>
          <p className="text-gray-500 mt-1">配置 OTA 固件升级发布任务</p>
        </div>
      </div>

      <Card className="shadow-sm" bordered={false}>
        <Steps current={currentStep} items={stepItems} className="max-w-2xl mx-auto" />
      </Card>

      <Form form={form} layout="vertical">
        {currentStep === 0 && (
          <Card
            title={
              <span className="flex items-center gap-2">
                <Package size={18} className="text-primary-500" />
                选择固件版本
              </span>
            }
            className="shadow-sm"
            bordered={false}
          >
            <Form.Item
              name="firmwareId"
              label="固件版本"
              rules={[{ required: true, message: '请选择固件版本' }]}
            >
              <Select
                placeholder="请选择要发布的固件版本"
                size="large"
                style={{ width: '100%', maxWidth: 400 }}
                onChange={handleFirmwareChange}
                showSearch
                optionFilterProp="children"
              >
                {firmwares.map((fw) => (
                  <Option key={fw.id} value={fw.id}>
                    <div className="flex justify-between items-center">
                      <span>
                        {fw.version} <span className="text-gray-400">({fw.model})</span>
                      </span>
                      <Tag
                        color={
                          fw.status === 'full'
                            ? 'success'
                            : fw.status === 'gray'
                            ? 'orange'
                            : fw.status === 'testing'
                            ? 'blue'
                            : 'error'
                        }
                      >
                        {fw.status === 'full'
                          ? '全量'
                          : fw.status === 'gray'
                          ? '灰度'
                          : fw.status === 'testing'
                          ? '测试'
                          : '已召回'}
                      </Tag>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {selectedFirmware && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Package size={28} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {selectedFirmware.version}
                    </h3>
                    <p className="text-gray-500">{selectedFirmware.model}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">发布日期</p>
                    <p className="font-medium text-gray-800">{selectedFirmware.releaseDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">文件大小</p>
                    <p className="font-medium text-gray-800">
                      {(selectedFirmware.fileSize / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">MD5</p>
                    <p className="font-mono text-gray-800 text-sm">{selectedFirmware.md5}</p>
                  </div>
                </div>
                <Divider className="my-3" />
                <div>
                  <p className="text-gray-500 text-sm mb-2">更新说明</p>
                  <p className="text-gray-700">{selectedFirmware.releaseNotes}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button type="primary" size="large" onClick={handleNext}>
                下一步
              </Button>
            </div>
          </Card>
        )}

        {currentStep === 1 && (
          <Card
            title={
              <span className="flex items-center gap-2">
                <Target size={18} className="text-primary-500" />
                配置发布策略
              </span>
            }
            className="shadow-sm"
            bordered={false}
          >
            <div className="space-y-6">
              <div>
                <Form.Item
                  name="taskName"
                  label="任务名称"
                  rules={[{ required: true, message: '请输入任务名称' }]}
                >
                  <Input
                    placeholder="请输入任务名称"
                    size="large"
                    style={{ maxWidth: 400 }}
                    prefix={<Rocket size={16} className="text-gray-400" />}
                  />
                </Form.Item>
              </div>

              <div>
                <p className="text-gray-700 font-medium mb-3 flex items-center gap-2">
                  <Target size={16} className="text-primary-500" />
                  推送策略
                </p>
                <Radio.Group
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {strategyOptions.map((option) => (
                      <Radio.Button
                        key={option.value}
                        value={option.value}
                        className="h-auto py-3 px-4 rounded-lg"
                        style={{ height: 'auto', padding: '12px 16px', borderRadius: '8px' }}
                      >
                        <div className="text-left">
                          <div className="font-medium text-gray-800">{option.label}</div>
                          <div className="text-xs text-gray-400 mt-1">{option.desc}</div>
                        </div>
                      </Radio.Button>
                    ))}
                  </div>
                </Radio.Group>
              </div>

              {strategy === 'region' && (
                <div>
                  <p className="text-gray-700 font-medium mb-3 flex items-center gap-2">
                    <MapPin size={16} className="text-primary-500" />
                    选择地域
                  </p>
                  <Select
                    mode="multiple"
                    placeholder="请选择推送地域"
                    style={{ width: '100%' }}
                    value={selectedRegions}
                    onChange={setSelectedRegions}
                    size="large"
                  >
                    {regions.map((region) => (
                      <Option key={region} value={region}>
                        {region}
                      </Option>
                    ))}
                  </Select>
                  <p className="text-gray-400 text-sm mt-2">
                    已选择 {selectedRegions.length} 个地域
                  </p>
                </div>
              )}

              {strategy === 'model' && (
                <div>
                  <p className="text-gray-700 font-medium mb-3 flex items-center gap-2">
                    <Monitor size={16} className="text-primary-500" />
                    选择型号
                  </p>
                  <Select
                    mode="multiple"
                    placeholder="请选择设备型号"
                    style={{ width: '100%' }}
                    value={selectedModels}
                    onChange={setSelectedModels}
                    size="large"
                  >
                    {models.map((model) => (
                      <Option key={model} value={model}>
                        {model}
                      </Option>
                    ))}
                  </Select>
                  <p className="text-gray-400 text-sm mt-2">
                    已选择 {selectedModels.length} 个型号
                  </p>
                </div>
              )}

              <div>
                <p className="text-gray-700 font-medium mb-3 flex items-center gap-2">
                  <Percent size={16} className="text-primary-500" />
                  灰度比例
                </p>
                <div className="max-w-xl">
                  <Slider
                    min={10}
                    max={100}
                    step={10}
                    value={grayPercentage}
                    onChange={setGrayPercentage}
                    marks={{
                      10: '10%',
                      30: '30%',
                      50: '50%',
                      70: '70%',
                      100: '100%',
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-2">
                    <span>灰度发布</span>
                    <span className="font-medium text-primary-600">{grayPercentage}%</span>
                    <span>全量发布</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-gray-700 font-medium mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-primary-500" />
                  发布时间
                </p>
                <Radio.Group
                  value={scheduleType}
                  onChange={(e) => setScheduleType(e.target.value)}
                >
                  <Radio value="now">立即发布</Radio>
                  <Radio value="schedule">定时发布</Radio>
                </Radio.Group>
                {scheduleType === 'schedule' && (
                  <Form.Item
                    name="scheduleTime"
                    className="mt-3"
                    rules={[{ required: true, message: '请选择发布时间' }]}
                  >
                    <DatePicker
                      showTime
                      placeholder="选择发布时间"
                      size="large"
                      style={{ width: 300 }}
                    />
                  </Form.Item>
                )}
              </div>

              <Alert
                message={
                  <span className="flex items-center gap-2">
                    <Info size={16} />
                    预计影响设备数：
                    <span className="font-bold text-primary-600">{estimatedDevices}</span> 台
                  </span>
                }
                type="info"
                showIcon
              />
            </div>

            <div className="flex justify-between mt-6">
              <Button size="large" onClick={handlePrev}>
                上一步
              </Button>
              <Button type="primary" size="large" onClick={handleNext}>
                下一步
              </Button>
            </div>
          </Card>
        )}

        {currentStep === 2 && (
          <Card
            title={
              <span className="flex items-center gap-2">
                <CheckCircle size={18} className="text-primary-500" />
                确认信息
              </span>
            }
            className="shadow-sm"
            bordered={false}
          >
            <div className="max-w-2xl mx-auto space-y-4">
              <Alert
                message="请确认以下任务信息无误后提交"
                type="warning"
                showIcon
                className="mb-6"
              />

              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">固件版本</span>
                  <span className="font-medium text-gray-800">
                    {selectedFirmware?.version || '-'}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">设备型号</span>
                  <span className="font-medium text-gray-800">
                    {selectedFirmware?.model || '-'}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">推送策略</span>
                  <span className="font-medium text-gray-800">
                    {strategyOptions.find((s) => s.value === strategy)?.label}
                  </span>
                </div>
                {strategy === 'region' && (
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-500">覆盖地域</span>
                    <span className="font-medium text-gray-800">
                      {selectedRegions.join('、')}
                    </span>
                  </div>
                )}
                {strategy === 'model' && (
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-500">覆盖型号</span>
                    <span className="font-medium text-gray-800">
                      {selectedModels.join('、')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">灰度比例</span>
                  <span className="font-medium text-gray-800">{grayPercentage}%</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">发布时间</span>
                  <span className="font-medium text-gray-800">
                    {scheduleType === 'now' ? '立即发布' : '定时发布'}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">预计影响设备</span>
                  <span className="font-bold text-primary-600 text-lg">
                    {estimatedDevices} 台
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button size="large" onClick={handlePrev}>
                上一步
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<Rocket size={16} />}
                onClick={handleSubmit}
                loading={submitting}
              >
                提交任务
              </Button>
            </div>
          </Card>
        )}
      </Form>
    </div>
  );
};

export default CreateOTATask;
