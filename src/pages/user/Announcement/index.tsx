import React, { useEffect, useState, useMemo } from 'react';
import { Card, Select, Input, Pagination, Empty, Spin, Tag, Alert, Button, Badge, Row, Col, Statistic, Modal } from 'antd';
import { SearchOutlined, PushpinOutlined, ClockCircleOutlined, EnvironmentOutlined, AuditOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { announcementApi } from '@/services/announcement';
import { formatDateTime, serviceTypeMap } from '@/utils/format';
import StatusTag from '@/components/StatusTag';
import type { Announcement } from '@/types';

const { Option } = Select;
const { Search } = Input;

const typeColorMap: Record<string, string> = {
  outage: '#FF7D00',
  repair: '#F53F3F',
  notice: '#165DFF',
};

const typeNameMap: Record<string, string> = {
  outage: '停供',
  repair: '抢修',
  notice: '通知',
};

const pushStatusMap: Record<number, { text: string; color: string; icon: React.ReactNode }> = {
  0: { text: '未推送', color: 'default', icon: <ClockCircleOutlined /> },
  1: { text: '已推送', color: 'green', icon: <CheckCircleOutlined /> },
  2: { text: '紧急推送', color: 'red', icon: <PushpinOutlined /> },
};

const auditStatusMap: Record<number, { text: string; color: string; icon: React.ReactNode }> = {
  0: { text: '草稿', color: 'default', icon: <FileTextOutlined /> },
  1: { text: '待审核', color: 'gold', icon: <ClockCircleOutlined /> },
  2: { text: '已发布', color: 'green', icon: <CheckCircleOutlined /> },
  3: { text: '已驳回', color: 'red', icon: <CloseCircleOutlined /> },
  4: { text: '已下架', color: 'default', icon: <CloseCircleOutlined /> },
};

const DEMO_ANNOUNCEMENTS: any[] = [
  {
    id: 1, type: 'outage', serviceType: 'water',
    title: '停水通知 - 锦江区春熙路片区供水管道改造施工',
    summary: '因锦江区春熙路段供水管道老化改造施工需要，2025年1月15日8:00至1月16日6:00期间暂停供水',
    affectAreas: ['510104'], affectAreaNames: ['锦江区'],
    pushStatus: 1, pushTime: '2025-01-14 18:00:00',
    status: 2, creatorName: '李明',
    publishTime: '2025-01-14 10:00:00', createTime: '2025-01-13 14:00:00',
    auditRecords: [
      { time: '2025-01-13 14:00', action: '创建公告', operator: '李明', remark: '初稿完成' },
      { time: '2025-01-13 16:30', action: '提交审核', operator: '李明', remark: '提交至运营主管审核' },
      { time: '2025-01-14 09:00', action: '审核通过', operator: '王芳', remark: '内容合规，准予发布' },
      { time: '2025-01-14 10:00', action: '正式发布', operator: '系统', remark: '官网&APP同步上线' },
      { time: '2025-01-14 18:00', action: '推送通知', operator: '系统', remark: '短信+APP+微信多渠道推送' },
    ],
  },
  {
    id: 2, type: 'outage', serviceType: 'electricity',
    title: '停电通知 - 武侯区科华北路配电站检修',
    summary: '因武侯区科华北路10kV配电站设备检修，2025年1月18日7:00至20:00期间计划停电',
    affectAreas: ['510107'], affectAreaNames: ['武侯区'],
    pushStatus: 1, pushTime: '2025-01-17 09:00:00',
    status: 2, creatorName: '王芳',
    publishTime: '2025-01-16 14:00:00', createTime: '2025-01-15 10:00:00',
    auditRecords: [
      { time: '2025-01-15 10:00', action: '创建公告', operator: '王芳', remark: '检修计划公告' },
      { time: '2025-01-15 15:00', action: '提交审核', operator: '王芳', remark: '' },
      { time: '2025-01-16 11:00', action: '审核通过', operator: '张华', remark: '同意发布' },
      { time: '2025-01-16 14:00', action: '正式发布', operator: '系统', remark: '' },
      { time: '2025-01-17 09:00', action: '推送通知', operator: '系统', remark: 'APP消息推送' },
    ],
  },
  {
    id: 3, type: 'repair', serviceType: 'water',
    title: '供水抢修公告 - 成华区建设路主管道爆裂紧急抢修',
    summary: '成华区建设路与二环路交汇处DN400供水主管道爆裂，抢修队已到场，预计48小时内恢复',
    affectAreas: ['510108'], affectAreaNames: ['成华区'],
    pushStatus: 2, pushTime: '2025-01-12 15:00:00',
    status: 2, creatorName: '刘洋',
    publishTime: '2025-01-12 14:45:00', createTime: '2025-01-12 14:35:00',
    repairProgress: [
      { stage: '接报', time: '2025-01-12 14:32', desc: '客服中心接到市民报警', operator: '962960坐席-李娟', color: 'blue' },
      { stage: '派单', time: '2025-01-12 14:35', desc: '调度中心派发工单', operator: '调度员-王建国', color: 'blue' },
      { stage: '到场', time: '2025-01-12 15:00', desc: '抢修队抵达现场处置', operator: '抢修队长-张师傅', color: 'cyan' },
      { stage: '关阀排水', time: '2025-01-12 15:25', desc: '完成阀门关闭及排水', operator: '抢修班组', color: 'cyan' },
      { stage: '管道修复', time: '2025-01-13 09:15', desc: '吊装新管完成焊接', operator: '管工班-刘师傅', color: 'gold' },
      { stage: '打压试验', time: '2025-01-13 14:30', desc: '水压试验合格', operator: '质检-陈工', color: 'green' },
      { stage: '恢复供水', time: '2025-01-13 20:15', desc: '逐步恢复供水', operator: '供水调度', color: 'green' },
    ],
    auditRecords: [
      { time: '2025-01-12 14:35', action: '创建公告', operator: '刘洋', remark: '紧急抢修公告' },
      { time: '2025-01-12 14:40', action: '紧急审核', operator: '张华', remark: '紧急情况，快速审批' },
      { time: '2025-01-12 14:45', action: '正式发布', operator: '系统', remark: '紧急发布' },
      { time: '2025-01-12 15:00', action: '紧急推送', operator: '系统', remark: '多渠道紧急推送' },
    ],
  },
  {
    id: 4, type: 'repair', serviceType: 'electricity',
    title: '供电抢修公告 - 金牛区营门口电缆故障紧急抢修',
    summary: '金牛区营门口路10kV电缆故障导致片区停电，已派出2支抢修队紧急抢修中',
    affectAreas: ['510106'], affectAreaNames: ['金牛区'],
    pushStatus: 2, pushTime: '2025-01-13 09:30:00',
    status: 2, creatorName: '陈静',
    publishTime: '2025-01-13 09:20:00', createTime: '2025-01-13 09:18:00',
    auditRecords: [
      { time: '2025-01-13 09:18', action: '创建公告', operator: '陈静', remark: '电缆故障抢修' },
      { time: '2025-01-13 09:20', action: '紧急审核通过', operator: '赵强', remark: '立即发布' },
      { time: '2025-01-13 09:30', action: '紧急推送', operator: '系统', remark: '' },
    ],
  },
  {
    id: 5, type: 'notice', serviceType: 'water',
    title: '水费价格调整通知 - 2025年成都市城镇供水价格调整',
    summary: '根据川发改价格〔2024〕218号文件，自2025年2月1日起调整城镇供水价格',
    affectAreas: ['510104', '510105', '510107'], affectAreaNames: ['锦江区', '青羊区', '武侯区'],
    pushStatus: 1, pushTime: '2025-01-10 10:00:00',
    status: 2, creatorName: '周敏',
    publishTime: '2025-01-10 09:00:00', createTime: '2025-01-08 14:00:00',
    auditRecords: [
      { time: '2025-01-08 14:00', action: '创建公告', operator: '周敏', remark: '价格调整通知' },
      { time: '2025-01-09 10:00', action: '提交审核', operator: '周敏', remark: '' },
      { time: '2025-01-09 16:00', action: '审核通过', operator: '张华', remark: '文件依据充分' },
      { time: '2025-01-10 09:00', action: '正式发布', operator: '系统', remark: '' },
    ],
  },
  {
    id: 6, type: 'outage', serviceType: 'gas',
    title: '停气通知 - 青羊区光华大道天然气管网安全检测',
    summary: '因青羊区光华大道天然气管网安全检测及维护，2025年1月20日9:00至17:00暂停供气',
    affectAreas: ['510105'], affectAreaNames: ['青羊区'],
    pushStatus: 0, pushTime: '',
    status: 1, creatorName: '吴刚',
    publishTime: '', createTime: '2025-01-15 11:00:00',
    auditRecords: [
      { time: '2025-01-15 11:00', action: '创建公告', operator: '吴刚', remark: '管网检测停气' },
      { time: '2025-01-15 14:00', action: '提交审核', operator: '吴刚', remark: '待主管审批' },
    ],
  },
];

const AnnouncementList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Announcement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [type, setType] = useState<string>('');
  const [serviceType, setServiceType] = useState<string>('');
  const [areaCode, setAreaCode] = useState<string>('');
  const [auditStatus, setAuditStatus] = useState<string>('');
  const [pushStatusFilter, setPushStatusFilter] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [currentAuditRecords, setCurrentAuditRecords] = useState<any[]>([]);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<any>(null);
  const [displayMode, setDisplayMode] = useState(true);

  const filteredDemoList = useMemo(() => {
    let data = [...DEMO_ANNOUNCEMENTS];
    if (type) data = data.filter((a) => a.type === type);
    if (serviceType) data = data.filter((a) => a.serviceType === serviceType || a.serviceType === 'all');
    if (areaCode) data = data.filter((a) => (a.affectAreas || []).includes(areaCode));
    if (auditStatus !== '') data = data.filter((a) => String(a.status) === auditStatus);
    if (pushStatusFilter !== '') data = data.filter((a) => String(a.pushStatus) === pushStatusFilter);
    if (keyword) data = data.filter((a) => a.title.includes(keyword) || a.summary.includes(keyword));
    return data;
  }, [type, serviceType, areaCode, auditStatus, pushStatusFilter, keyword]);

  const displayList = useMemo(() => {
    if (displayMode) {
      const start = (page - 1) * pageSize;
      return filteredDemoList.slice(start, start + pageSize);
    }
    return list;
  }, [list, filteredDemoList, page, pageSize, displayMode]);

  const displayTotal = displayMode ? filteredDemoList.length : total;

  useEffect(() => {
    if (!displayMode) {
      loadData();
    }
  }, [page, type, serviceType, areaCode, keyword, auditStatus, pushStatusFilter, displayMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res: any = await announcementApi.getAnnouncementList({
        type: type || undefined,
        serviceType: serviceType || undefined,
        areaCode: areaCode || undefined,
        keyword: keyword || undefined,
        status: auditStatus !== '' ? Number(auditStatus) : undefined,
        pushStatus: pushStatusFilter !== '' ? Number(pushStatusFilter) : undefined,
        page,
        pageSize,
      } as any);
      setList(res.list || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error('加载公告列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPage(1);
  };

  const handleReset = () => {
    setType('');
    setServiceType('');
    setAreaCode('');
    setAuditStatus('');
    setPushStatusFilter('');
    setKeyword('');
    setPage(1);
  };

  const handleShowAuditRecords = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentAnnouncement(item);
    setCurrentAuditRecords(item.auditRecords || []);
    setAuditModalVisible(true);
  };

  const hasFilters = type || serviceType || areaCode || auditStatus || pushStatusFilter || keyword;

  const stats = useMemo(() => {
    const data = displayMode ? DEMO_ANNOUNCEMENTS : list;
    return {
      total: data.length,
      published: data.filter((a: any) => a.status === 2).length,
      pending: data.filter((a: any) => a.status === 1).length,
      emergency: data.filter((a: any) => a.pushStatus === 2).length,
    };
  }, [list, displayMode]);

  return (
    <div className="space-y-6">
      {displayMode && (
        <Alert
          type="info"
          showIcon
          message="演示模式"
          description="当前展示模拟公告数据，登录后可查看真实公告及审核流程"
          action={<Button size="small" type="primary" onClick={() => navigate('/login')}>立即登录</Button>}
        />
      )}

      <Card className="shadow-md">
        <Row gutter={[16, 12]}>
          <Col xs={12} sm={6}>
            <Statistic
              title={<span className="text-gray-500 text-sm"><FileTextOutlined /> 公告总数</span>}
              value={stats.total}
              suffix="条"
              valueStyle={{ color: '#165DFF', fontSize: 20 }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title={<span className="text-gray-500 text-sm"><CheckCircleOutlined /> 已发布</span>}
              value={stats.published}
              suffix="条"
              valueStyle={{ color: '#00B42A', fontSize: 20 }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title={<span className="text-gray-500 text-sm"><ClockCircleOutlined /> 待审核</span>}
              value={stats.pending}
              suffix="条"
              valueStyle={{ color: '#FF7D00', fontSize: 20 }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title={<span className="text-gray-500 text-sm"><PushpinOutlined /> 紧急推送</span>}
              value={stats.emergency}
              suffix="条"
              valueStyle={{ color: '#F53F3F', fontSize: 20 }}
            />
          </Col>
        </Row>
      </Card>

      <Card className="shadow-md">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <span className="text-gray-600 text-sm whitespace-nowrap">公告类型</span>
            <Select
              value={type || undefined}
              onChange={(v) => { setType(v || ''); setPage(1); }}
              style={{ width: 130 }}
              allowClear
              placeholder="全部类型"
            >
              <Option value="outage">停供公告</Option>
              <Option value="repair">抢修公告</Option>
              <Option value="notice">通知公告</Option>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-gray-600 text-sm whitespace-nowrap">服务类型</span>
            <Select
              value={serviceType || undefined}
              onChange={(v) => { setServiceType(v || ''); setPage(1); }}
              style={{ width: 110 }}
              allowClear
              placeholder="全部"
            >
              <Option value="water">水</Option>
              <Option value="electricity">电</Option>
              <Option value="gas">气</Option>
              <Option value="all">综合</Option>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-gray-600 text-sm whitespace-nowrap">影响区域</span>
            <Select
              value={areaCode || undefined}
              onChange={(v) => { setAreaCode(v || ''); setPage(1); }}
              style={{ width: 120 }}
              allowClear
              placeholder="全部区域"
            >
              <Option value="510104">锦江区</Option>
              <Option value="510105">青羊区</Option>
              <Option value="510107">武侯区</Option>
              <Option value="510106">金牛区</Option>
              <Option value="510108">成华区</Option>
              <Option value="510109">高新区</Option>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-gray-600 text-sm whitespace-nowrap">审核状态</span>
            <Select
              value={auditStatus || undefined}
              onChange={(v) => { setAuditStatus(v || ''); setPage(1); }}
              style={{ width: 120 }}
              allowClear
              placeholder="全部"
            >
              <Option value="0">草稿</Option>
              <Option value="1">待审核</Option>
              <Option value="2">已发布</Option>
              <Option value="3">已驳回</Option>
              <Option value="4">已下架</Option>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-gray-600 text-sm whitespace-nowrap">推送状态</span>
            <Select
              value={pushStatusFilter || undefined}
              onChange={(v) => { setPushStatusFilter(v || ''); setPage(1); }}
              style={{ width: 120 }}
              allowClear
              placeholder="全部"
            >
              <Option value="0">未推送</Option>
              <Option value="1">已推送</Option>
              <Option value="2">紧急推送</Option>
            </Select>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <span className="text-gray-600 text-sm whitespace-nowrap">关键词搜索</span>
            <Search
              placeholder="搜索公告标题、内容"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              onSearch={handleSearch}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleReset}>重置</Button>
            <Button type="primary" icon={<AuditOutlined />} onClick={() => navigate('/admin/login')}>
              后台审核
            </Button>
          </div>
        </div>

        {hasFilters && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">筛选结果：</span>
              <Badge count={displayTotal} showZero style={{ backgroundColor: '#165DFF' }} />
              <span className="text-sm text-gray-500">条公告</span>
              {type && <Tag color="orange">类型：{typeNameMap[type]}</Tag>}
              {serviceType && <Tag color="cyan">服务：{serviceTypeMap[serviceType]?.name}</Tag>}
              {areaCode && <Tag color="blue">区域：{areaCode === '510104' ? '锦江区' : areaCode === '510105' ? '青羊区' : areaCode === '510107' ? '武侯区' : areaCode === '510106' ? '金牛区' : areaCode === '510108' ? '成华区' : '高新区'}</Tag>}
              {auditStatus !== '' && <Tag color="purple">审核：{auditStatusMap[Number(auditStatus)]?.text}</Tag>}
              {pushStatusFilter !== '' && <Tag color="red">推送：{pushStatusMap[Number(pushStatusFilter)]?.text}</Tag>}
            </div>
            <Button size="small" type="link" onClick={handleReset}>清除筛选</Button>
          </div>
        )}
      </Card>

      <Spin spinning={loading}>
        {displayList.length > 0 ? (
          <div className="space-y-4">
            {displayList.map((item: any) => (
              <Card
                key={item.id}
                className={`shadow-md card-hover cursor-pointer border-l-4`}
                style={{ borderLeftColor: typeColorMap[item.type] || '#165DFF' }}
                onClick={() => navigate(`/announcements/${item.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 min-w-[56px]">
                    <div
                      className="w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white"
                      style={{ backgroundColor: typeColorMap[item.type] || '#165DFF' }}
                    >
                      <span className="text-xs opacity-80">{typeNameMap[item.type]}</span>
                      <span className="text-sm font-bold">{item.serviceType === 'all' ? '综' : serviceTypeMap[item.serviceType]?.name?.charAt(0)}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-base font-medium text-gray-800 hover:text-primary-600 transition-colors">
                        {item.title}
                      </h3>
                      {item.type === 'repair' && <Tag color="red" icon={<PushpinOutlined />} className="animate-pulse">紧急抢修</Tag>}
                      {item.pushStatus !== undefined && (
                        <Tag color={pushStatusMap[item.pushStatus]?.color} icon={pushStatusMap[item.pushStatus]?.icon}>
                          {pushStatusMap[item.pushStatus]?.text}
                        </Tag>
                      )}
                      {item.status !== undefined && (
                        <Tag color={auditStatusMap[item.status]?.color} icon={auditStatusMap[item.status]?.icon}>
                          {auditStatusMap[item.status]?.text}
                        </Tag>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.summary}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <span><ClockCircleOutlined /> {formatDateTime(item.publishTime || item.createTime, 'YYYY-MM-DD HH:mm')}</span>
                      <span><EnvironmentOutlined /> {(item.affectAreaNames || []).join('、') || '全市'}</span>
                      {item.serviceType && item.serviceType !== 'all' && (
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: serviceTypeMap[item.serviceType]?.color }}
                        >
                          {serviceTypeMap[item.serviceType]?.name}
                        </span>
                      )}
                      {item.auditRecords && item.auditRecords.length > 0 && (
                        <Button
                          type="link"
                          size="small"
                          icon={<AuditOutlined />}
                          onClick={(e) => handleShowAuditRecords(item, e)}
                          className="!p-0 !h-auto"
                        >
                          复查记录({item.auditRecords.length}条)
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            <div className="flex justify-center pt-4">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={displayTotal}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(t) => `共 ${t} 条公告`}
                onChange={(p) => setPage(p)}
              />
            </div>
          </div>
        ) : (
          <Card className="shadow-md">
            <Empty description={hasFilters ? '当前筛选条件下暂无公告' : '暂无公告'} className="py-12" />
          </Card>
        )}
      </Spin>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <AuditOutlined style={{ color: '#165DFF' }} />
            <span>公告审核复查记录</span>
          </div>
        }
        open={auditModalVisible}
        onCancel={() => setAuditModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setAuditModalVisible(false)}>关闭</Button>,
          <Button key="detail" type="primary" onClick={() => { setAuditModalVisible(false); navigate(`/announcements/${currentAnnouncement?.id}`); }}>
            查看详情
          </Button>,
        ]}
        width={600}
      >
        {currentAnnouncement && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-800">{currentAnnouncement.title}</p>
            <p className="text-sm text-gray-500 mt-1">
              发布人：{currentAnnouncement.creatorName} · 创建时间：{formatDateTime(currentAnnouncement.createTime, 'YYYY-MM-DD HH:mm')}
            </p>
          </div>
        )}
        <div className="pl-2">
          {currentAuditRecords.length > 0 ? (
            <div className="space-y-3">
              {currentAuditRecords.map((record: any, index: number) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                        record.action.includes('通过') || record.action.includes('发布') || record.action.includes('推送')
                          ? 'bg-green-500'
                          : record.action.includes('驳回') || record.action.includes('下架')
                          ? 'bg-red-500'
                          : record.action.includes('审核')
                          ? 'bg-gold-500'
                          : 'bg-blue-500'
                      }`}
                      style={{
                        backgroundColor:
                          record.action.includes('通过') || record.action.includes('发布') || record.action.includes('推送')
                            ? '#00B42A'
                            : record.action.includes('驳回') || record.action.includes('下架')
                            ? '#F53F3F'
                            : record.action.includes('审核') || record.action.includes('提交')
                            ? '#FF7D00'
                            : '#165DFF',
                      }}
                    >
                      {index + 1}
                    </div>
                    {index < currentAuditRecords.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{record.action}</span>
                      <span className="text-xs text-gray-400">{record.time}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">操作人：{record.operator}</p>
                    {record.remark && <p className="text-sm text-gray-400 mt-1">备注：{record.remark}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="暂无审核记录" className="py-8" />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AnnouncementList;
