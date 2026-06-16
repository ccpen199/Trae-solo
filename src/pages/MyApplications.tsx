import { useState, useMemo } from 'react';
import {
  Tabs,
  Modal,
  Timeline,
  Input,
  DatePicker,
  Pagination,
  Space,
  Tag,
  Descriptions,
  List,
  Button,
} from 'antd';
import { Search, FileText, Clock, CheckCircle, XCircle, AlertCircle, Edit3, Eye } from 'lucide-react';
import type { TabsProps } from 'antd';
import type { Dayjs } from 'dayjs';
import { ApplicationCard } from '../components/common';
import { mockApplications } from '../mock/data';
import type { Application, ApplicationLog } from '../shared/types';

const { RangePicker } = DatePicker;

const statusConfig = {
  all: { label: '全部', icon: FileText, color: 'default' },
  draft: { label: '草稿', icon: Edit3, color: 'default' },
  reviewing: { label: '审核中', icon: Clock, color: 'processing' },
  supplement: { label: '待补正', icon: AlertCircle, color: 'warning' },
  approved: { label: '已完成', icon: CheckCircle, color: 'success' },
  rejected: { label: '已驳回', icon: XCircle, color: 'error' },
};

const extendedMockApplications: Application[] = [
  ...mockApplications,
  {
    id: 'app4',
    serviceId: '2',
    serviceName: '户口迁移',
    applicantId: '1',
    status: 'draft',
    formData: { name: '张三', idCard: '110101199001011234', migrateType: 'house' },
    materials: [
      { id: 'um4', materialId: 'm3', name: '居民户口簿', type: 'electronic', url: '', verified: true },
    ],
    currentStep: 1,
    totalSteps: 3,
    createdAt: new Date('2024-06-14'),
    updatedAt: new Date('2024-06-14'),
    estimatedTime: '3个工作日',
  },
  {
    id: 'app5',
    serviceId: '3',
    serviceName: '出生医学证明办理',
    applicantId: '1',
    status: 'rejected',
    formData: { babyName: '张小明', babyGender: 'male', birthDate: '2024-01-15' },
    materials: [
      { id: 'um5', materialId: 'm5', name: '父母双方身份证', type: 'electronic', url: '', verified: true },
    ],
    currentStep: 2,
    totalSteps: 3,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-05'),
    estimatedTime: '1个工作日',
  },
  {
    id: 'app6',
    serviceId: '4',
    serviceName: '不动产登记',
    applicantId: '1',
    status: 'approved',
    formData: { name: '张三', idCard: '110101199001011234', propertyAddress: '北京市朝阳区xxx街道xxx号' },
    materials: [
      { id: 'um6', materialId: 'm7', name: '申请人身份证', type: 'electronic', url: '', verified: true },
      { id: 'um7', materialId: 'm8', name: '购房合同', type: 'upload', url: '/contract.pdf', verified: true },
      { id: 'um8', materialId: 'm9', name: '完税证明', type: 'electronic', url: '', verified: true },
    ],
    currentStep: 4,
    totalSteps: 4,
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date('2024-05-28'),
    estimatedTime: '7个工作日',
  },
  {
    id: 'app7',
    serviceId: '5',
    serviceName: '企业开办',
    applicantId: '1',
    status: 'reviewing',
    formData: { companyName: '北京科技创新有限公司', legalPerson: '张三', registeredCapital: 100 },
    materials: [
      { id: 'um9', materialId: 'm10', name: '法定代表人身份证', type: 'electronic', url: '', verified: true },
      { id: 'um10', materialId: 'm11', name: '公司章程', type: 'upload', url: '/articles.pdf', verified: true },
    ],
    currentStep: 2,
    totalSteps: 5,
    createdAt: new Date('2024-06-12'),
    updatedAt: new Date('2024-06-13'),
    estimatedTime: '1个工作日',
  },
  {
    id: 'app8',
    serviceId: '8',
    serviceName: '结婚证办理',
    applicantId: '1',
    status: 'supplement',
    formData: { manName: '张三', womanName: '李四', appointmentDate: '2024-06-20' },
    materials: [
      { id: 'um11', materialId: 'm14', name: '双方身份证', type: 'electronic', url: '', verified: true },
    ],
    currentStep: 1,
    totalSteps: 2,
    createdAt: new Date('2024-06-10'),
    updatedAt: new Date('2024-06-11'),
    estimatedTime: '即时办理',
  },
];

const mockApplicationLogs: Record<string, ApplicationLog[]> = {
  app1: [
    { id: 'log1', applicationId: 'app1', action: '提交申请', remark: '用户在线提交社保卡申领申请', operatorId: 'user1', createdAt: new Date('2024-06-10 09:30:00') },
    { id: 'log2', applicationId: 'app1', action: '材料审核', remark: '已核验居民身份证电子证照', operatorId: 'staff1', createdAt: new Date('2024-06-10 14:20:00') },
    { id: 'log3', applicationId: 'app1', action: '照片审核通过', remark: '上传的免冠照片符合要求', operatorId: 'staff2', createdAt: new Date('2024-06-12 10:15:00') },
  ],
  app2: [
    { id: 'log4', applicationId: 'app2', action: '提交查询', remark: '用户发起社保缴费查询', operatorId: 'user1', createdAt: new Date('2024-06-08 11:00:00') },
    { id: 'log5', applicationId: 'app2', action: '查询完成', remark: '已生成社保缴费记录证明', operatorId: 'system', createdAt: new Date('2024-06-08 11:00:05') },
  ],
  app3: [
    { id: 'log6', applicationId: 'app3', action: '提交申请', remark: '用户提交公积金提取申请', operatorId: 'user1', createdAt: new Date('2024-06-11 15:45:00') },
    { id: 'log7', applicationId: 'app3', action: '材料补正通知', remark: '请补充购房合同材料', operatorId: 'staff1', createdAt: new Date('2024-06-13 09:30:00') },
  ],
  app4: [
    { id: 'log8', applicationId: 'app4', action: '创建草稿', remark: '用户保存户口迁移申请草稿', operatorId: 'user1', createdAt: new Date('2024-06-14 16:20:00') },
  ],
  app5: [
    { id: 'log9', applicationId: 'app5', action: '提交申请', remark: '用户提交出生医学证明办理申请', operatorId: 'user1', createdAt: new Date('2024-06-01 10:00:00') },
    { id: 'log10', applicationId: 'app5', action: '材料审核', remark: '已核验父母双方身份证', operatorId: 'staff1', createdAt: new Date('2024-06-02 14:00:00') },
    { id: 'log11', applicationId: 'app5', action: '申请驳回', remark: '缺少结婚证材料，请补充后重新提交', operatorId: 'staff2', createdAt: new Date('2024-06-05 11:30:00') },
  ],
  app6: [
    { id: 'log12', applicationId: 'app6', action: '提交申请', remark: '用户提交不动产登记申请', operatorId: 'user1', createdAt: new Date('2024-05-20 09:00:00') },
    { id: 'log13', applicationId: 'app6', action: '材料审核通过', remark: '所有材料核验通过', operatorId: 'staff1', createdAt: new Date('2024-05-21 16:00:00') },
    { id: 'log14', applicationId: 'app6', action: '权籍调查', remark: '完成不动产权籍调查', operatorId: 'staff2', createdAt: new Date('2024-05-23 10:00:00') },
    { id: 'log15', applicationId: 'app6', action: '登簿完成', remark: '已完成不动产登记簿记载', operatorId: 'staff3', createdAt: new Date('2024-05-27 14:00:00') },
    { id: 'log16', applicationId: 'app6', action: '制证完成', remark: '不动产权证书已制作完成，可领取', operatorId: 'system', createdAt: new Date('2024-05-28 09:00:00') },
  ],
  app7: [
    { id: 'log17', applicationId: 'app7', action: '提交申请', remark: '用户提交企业开办申请', operatorId: 'user1', createdAt: new Date('2024-06-12 08:30:00') },
    { id: 'log18', applicationId: 'app7', action: '名称预审', remark: '企业名称预审通过', operatorId: 'staff1', createdAt: new Date('2024-06-12 11:00:00') },
    { id: 'log19', applicationId: 'app7', action: '章程审核', remark: '正在审核公司章程', operatorId: 'staff2', createdAt: new Date('2024-06-13 15:00:00') },
  ],
  app8: [
    { id: 'log20', applicationId: 'app8', action: '提交申请', remark: '用户提交结婚证办理预约申请', operatorId: 'user1', createdAt: new Date('2024-06-10 14:00:00') },
    { id: 'log21', applicationId: 'app8', action: '材料补正通知', remark: '请补充双方户口簿材料', operatorId: 'staff1', createdAt: new Date('2024-06-11 10:30:00') },
  ],
};

const MyApplications = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const handleCardClick = (application: Application) => {
    setSelectedApplication(application);
    setModalVisible(true);
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setCurrentPage(1);
  };

  const filteredApplications = useMemo(() => {
    return extendedMockApplications.filter((app) => {
      if (activeTab !== 'all' && app.status !== activeTab) {
        return false;
      }
      if (searchText && !app.serviceName.toLowerCase().includes(searchText.toLowerCase()) && !app.id.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        const appDate = new Date(app.createdAt);
        const startDate = dateRange[0].toDate();
        const endDate = dateRange[1].toDate();
        endDate.setHours(23, 59, 59, 999);
        if (appDate < startDate || appDate > endDate) {
          return false;
        }
      }
      return true;
    });
  }, [activeTab, searchText, dateRange]);

  const paginatedApplications = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredApplications.slice(startIndex, startIndex + pageSize);
  }, [filteredApplications, currentPage, pageSize]);

  const tabItems: TabsProps['items'] = Object.entries(statusConfig).map(([key, config]) => {
    const Icon = config.icon;
    const count = key === 'all'
      ? extendedMockApplications.length
      : extendedMockApplications.filter((app) => app.status === key).length;
    return {
      key,
      label: (
        <span className="flex items-center gap-1">
          <Icon className="w-4 h-4" />
          {config.label}
          <Tag color={config.color} className="ml-1">{count}</Tag>
        </span>
      ),
    };
  });

  const getStatusTag = (status: Application['status']) => {
    const config = {
      draft: { label: '草稿', color: 'default' },
      submitted: { label: '已提交', color: 'default' },
      reviewing: { label: '审核中', color: 'processing' },
      supplement: { label: '待补正', color: 'warning' },
      approved: { label: '已完成', color: 'success' },
      rejected: { label: '已驳回', color: 'error' },
    };
    return <Tag color={config[status].color}>{config[status].label}</Tag>;
  };

  const renderTimeline = (logs: ApplicationLog[]) => {
    return (
      <Timeline
        items={logs.map((log) => ({
          color: log.action.includes('驳回') || log.action.includes('失败') ? 'red' :
                 log.action.includes('通过') || log.action.includes('完成') ? 'green' : 'blue',
          children: (
            <div>
              <div className="font-medium text-gov-gray-700">{log.action}</div>
              <div className="text-sm text-gov-gray-500 mt-1">{log.remark}</div>
              <div className="text-xs text-gov-gray-400 mt-1">
                {new Date(log.createdAt).toLocaleString('zh-CN')}
              </div>
            </div>
          ),
        }))}
      />
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gov-gray-700 mb-2">我的办件</h1>
        <p className="text-gov-gray-400">查看和管理您的所有办事申请</p>
      </div>

      <div className="gov-card p-5 mb-6">
        <Space direction="vertical" size="large" className="w-full">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <Input
                placeholder="搜索办件名称或申请编号"
                prefix={<Search className="w-4 h-4 text-gov-gray-400" />}
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-72"
                allowClear
              />
              <RangePicker
                placeholder={['开始日期', '结束日期']}
                value={dateRange}
                onChange={(dates) => {
                  setDateRange(dates as [Dayjs | null, Dayjs | null] | null);
                  setCurrentPage(1);
                }}
                className="w-72"
              />
              <Button
                onClick={() => {
                  setSearchText('');
                  setDateRange(null);
                  setCurrentPage(1);
                }}
              >
                重置
              </Button>
            </div>
            <div className="text-sm text-gov-gray-400">
              共 <span className="font-semibold text-primary-500">{filteredApplications.length}</span> 条记录
            </div>
          </div>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        className="mb-6"
      />

      {paginatedApplications.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {paginatedApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onClick={() => handleCardClick(application)}
              />
            ))}
          </div>
          <div className="flex justify-center">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredApplications.length}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total) => `共 ${total} 条记录`}
            />
          </div>
        </>
      ) : (
        <div className="gov-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gov-gray-100 flex items-center justify-center">
            <FileText className="w-8 h-8 text-gov-gray-300" />
          </div>
          <h3 className="text-gov-gray-600 font-medium mb-1">暂无办件记录</h3>
          <p className="text-sm text-gov-gray-400">
            {activeTab === 'all' ? '您还没有任何办件申请' : `当前筛选条件下没有${statusConfig[activeTab as keyof typeof statusConfig].label}的办件`}
          </p>
        </div>
      )}

      <Modal
        title={
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary-500" />
              办件详情
            </span>
            {selectedApplication && getStatusTag(selectedApplication.status)}
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            关闭
          </Button>,
          <Button key="action" type="primary" disabled={!selectedApplication || selectedApplication.status === 'approved' || selectedApplication.status === 'rejected'}>
            {selectedApplication?.status === 'draft' ? '继续办理' :
             selectedApplication?.status === 'supplement' ? '补充材料' :
             selectedApplication?.status === 'reviewing' ? '查看进度' : '重新申请'}
          </Button>,
        ]}
        width={800}
        destroyOnClose
      >
        {selectedApplication && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gov-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                办件基本信息
              </h4>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="申请编号">{selectedApplication.id.toUpperCase()}</Descriptions.Item>
                <Descriptions.Item label="服务事项">{selectedApplication.serviceName}</Descriptions.Item>
                <Descriptions.Item label="提交时间">
                  {new Date(selectedApplication.createdAt).toLocaleString('zh-CN')}
                </Descriptions.Item>
                <Descriptions.Item label="更新时间">
                  {new Date(selectedApplication.updatedAt).toLocaleString('zh-CN')}
                </Descriptions.Item>
                <Descriptions.Item label="办理进度">
                  {selectedApplication.currentStep}/{selectedApplication.totalSteps}步
                </Descriptions.Item>
                <Descriptions.Item label="预计办理">{selectedApplication.estimatedTime}</Descriptions.Item>
              </Descriptions>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gov-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                申请材料
              </h4>
              {selectedApplication.materials.length > 0 ? (
                <List
                  size="small"
                  bordered
                  dataSource={selectedApplication.materials}
                  renderItem={(material) => (
                    <List.Item className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gov-gray-400" />
                        {material.name}
                      </span>
                      <span className="flex items-center gap-2">
                        <Tag color={material.type === 'electronic' ? 'blue' : 'green'}>
                          {material.type === 'electronic' ? '电子证照' : '已上传'}
                        </Tag>
                        <Tag color={material.verified ? 'success' : 'warning'}>
                          {material.verified ? '已核验' : '待核验'}
                        </Tag>
                      </span>
                    </List.Item>
                  )}
                />
              ) : (
                <div className="text-sm text-gov-gray-400 p-4 bg-gov-gray-50 rounded text-center">
                  无需提交材料
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gov-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                办理日志
              </h4>
              <div className="bg-gov-gray-50 rounded-lg p-4">
                {renderTimeline(mockApplicationLogs[selectedApplication.id] || [])}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyApplications;
