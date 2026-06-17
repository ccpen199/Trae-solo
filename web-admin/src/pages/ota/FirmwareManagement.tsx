import { useState, useEffect } from 'react';
import {
  Card,
  Tag,
  Button,
  Tabs,
  Modal,
  Form,
  Input,
  Upload,
  DatePicker,
  message,
  Row,
  Col,
} from 'antd';
import {
  Package,
  Upload as UploadIcon,
  Eye,
  Edit,
  Rocket,
  Calendar,
  HardDrive,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import type { UploadProps } from 'antd';
import { otaApi } from '@/services/api';
import type { FirmwareVersion } from '@/types';

const { TextArea } = Input;

const statusMap: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  testing: { label: '测试中', color: 'blue', icon: Clock },
  gray: { label: '灰度发布', color: 'orange', icon: AlertTriangle },
  full: { label: '全量发布', color: 'success', icon: CheckCircle },
  recalled: { label: '已召回', color: 'error', icon: XCircle },
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

const FirmwareManagement: React.FC = () => {
  const [firmwares, setFirmwares] = useState<FirmwareVersion[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeModel, setActiveModel] = useState<string>('all');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedFirmware, setSelectedFirmware] = useState<FirmwareVersion | null>(null);
  const [form] = Form.useForm();

  const fetchData = async (model?: string) => {
    setLoading(true);
    try {
      const [firmwareList, modelList] = await Promise.all([
        otaApi.getFirmwares(model && model !== 'all' ? { model } : {}),
        otaApi.getModels(),
      ]);
      setFirmwares(firmwareList);
      setModels(modelList);
    } catch (error) {
      console.error('获取固件列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleModelChange = (key: string) => {
    setActiveModel(key);
    fetchData(key);
  };

  const handleViewDetail = (firmware: FirmwareVersion) => {
    setSelectedFirmware(firmware);
    setDetailModalVisible(true);
  };

  const handlePublish = (firmware: FirmwareVersion) => {
    Modal.confirm({
      title: '确认发布',
      content: `确定要发布固件版本 ${firmware.version} 吗？`,
      okText: '确认发布',
      cancelText: '取消',
      onOk: () => {
        message.success('发布任务已创建');
      },
    });
  };

  const handleUploadSubmit = async () => {
    try {
      await form.validateFields();
      message.success('固件上传成功');
      setUploadModalVisible(false);
      form.resetFields();
      fetchData(activeModel);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/upload',
    headers: {
      authorization: 'authorization-text',
    },
    beforeUpload: (file) => {
      const isBin = file.name.endsWith('.bin') || file.name.endsWith('.img');
      if (!isBin) {
        message.error('只能上传 .bin 或 .img 格式的固件文件!');
        return false;
      }
      const isLt100M = file.size / 1024 / 1024 < 100;
      if (!isLt100M) {
        message.error('固件文件不能超过 100MB!');
        return false;
      }
      return false;
    },
  };

  const FirmwareCard = ({ firmware }: { firmware: FirmwareVersion }) => {
    const statusInfo = statusMap[firmware.status];
    const StatusIcon = statusInfo.icon;

    return (
      <Card
        className="shadow-sm hover:shadow-md transition-shadow h-full"
        bordered={false}
        bodyStyle={{ padding: 20 }}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                <Package size={24} className="text-primary-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{firmware.version}</h3>
                <p className="text-gray-500 text-sm">{firmware.model}</p>
              </div>
            </div>
            <Tag color={statusInfo.color} icon={<StatusIcon size={12} />}>
              {statusInfo.label}
            </Tag>
          </div>

          <div className="space-y-3 mb-4 flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={14} />
              <span>发布日期：</span>
              <span className="text-gray-700">{firmware.releaseDate}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <HardDrive size={14} />
              <span>文件大小：</span>
              <span className="text-gray-700">{formatFileSize(firmware.fileSize)}</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-500">
              <FileText size={14} className="mt-0.5 flex-shrink-0" />
              <span>更新说明：</span>
              <span className="text-gray-600 line-clamp-2">{firmware.releaseNotes}</span>
            </div>
            {firmware.status === 'gray' && (
              <div className="text-sm text-gray-500">
                <span>灰度比例：</span>
                <span className="text-warning-500 font-medium">{firmware.grayPercentage}%</span>
                <span className="ml-2">
                  ({firmware.grayRegions.join('、')})
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <Button size="small" icon={<Eye size={14} />} onClick={() => handleViewDetail(firmware)}>
              详情
            </Button>
            <Button size="small" icon={<Edit size={14} />}>
              编辑
            </Button>
            {firmware.status !== 'full' && firmware.status !== 'recalled' && (
              <Button
                size="small"
                type="primary"
                icon={<Rocket size={14} />}
                onClick={() => handlePublish(firmware)}
              >
                发布
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">固件管理</h1>
          <p className="text-gray-500 mt-1">管理各型号设备的固件版本和发布状态</p>
        </div>
        <Button
          type="primary"
          icon={<UploadIcon size={16} />}
          onClick={() => setUploadModalVisible(true)}
        >
          上传固件
        </Button>
      </div>

      <Card className="shadow-sm" bordered={false} bodyStyle={{ padding: '16px 24px 0' }}>
        <Tabs
          activeKey={activeModel}
          onChange={handleModelChange}
          items={[
            { key: 'all', label: '全部型号' },
            ...models.map((model) => ({ key: model, label: model })),
          ]}
        />
      </Card>

      <Row gutter={[16, 16]}>
        {firmwares.map((firmware) => (
          <Col key={firmware.id} xs={24} sm={12} lg={8} xl={6}>
            <FirmwareCard firmware={firmware} />
          </Col>
        ))}
      </Row>

      {firmwares.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-400">
          <Package size={60} className="mx-auto mb-4 opacity-30" />
          <p>暂无固件版本</p>
        </div>
      )}

      <Modal
        title={
          <span className="flex items-center gap-2">
            <UploadIcon size={18} className="text-primary-500" />
            上传固件
          </span>
        }
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        onOk={handleUploadSubmit}
        okText="上传"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="version"
            label="版本号"
            rules={[{ required: true, message: '请输入版本号' }]}
          >
            <Input placeholder="例如：v3.2.1" prefix={<Package size={14} className="text-gray-400" />} />
          </Form.Item>
          <Form.Item
            name="model"
            label="设备型号"
            rules={[{ required: true, message: '请选择设备型号' }]}
          >
            <Input placeholder="请输入或选择设备型号" />
          </Form.Item>
          <Form.Item name="releaseDate" label="发布日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="file"
            label="固件文件"
            rules={[{ required: true, message: '请上传固件文件' }]}
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadIcon size={14} />}>选择固件文件</Button>
            </Upload>
            <p className="text-gray-400 text-xs mt-2">
              支持 .bin / .img 格式，最大 100MB
            </p>
          </Form.Item>
          <Form.Item name="releaseNotes" label="更新说明">
            <TextArea rows={4} placeholder="请输入本次更新的内容说明..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <span className="flex items-center gap-2">
            <Package size={18} className="text-primary-500" />
            固件详情
          </span>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button key="publish" type="primary" icon={<Rocket size={14} />}>
            发布此版本
          </Button>,
        ]}
        width={600}
      >
        {selectedFirmware && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center">
                <Package size={28} className="text-primary-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{selectedFirmware.version}</h3>
                <p className="text-gray-500">{selectedFirmware.model}</p>
              </div>
              <Tag color={statusMap[selectedFirmware.status].color} className="ml-auto">
                {statusMap[selectedFirmware.status].label}
              </Tag>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm mb-1">发布日期</p>
                <p className="font-medium text-gray-800">{selectedFirmware.releaseDate}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm mb-1">文件大小</p>
                <p className="font-medium text-gray-800">
                  {formatFileSize(selectedFirmware.fileSize)}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm mb-1">MD5校验</p>
                <p className="font-mono text-sm text-gray-800">{selectedFirmware.md5}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm mb-1">固件ID</p>
                <p className="font-mono text-sm text-gray-800">{selectedFirmware.id}</p>
              </div>
            </div>

            <div>
              <p className="text-gray-500 text-sm mb-2">更新说明</p>
              <div className="p-4 bg-gray-50 rounded-lg text-gray-700">
                {selectedFirmware.releaseNotes}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FirmwareManagement;
