import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { useApp } from '../contexts/AppContext';

const MENU_ITEMS = [
  { key: 'overview', label: '数据概览', icon: '📊' },
  { key: 'pending', label: '待审核职位', icon: '⏳' },
  { key: 'recordings', label: '就业局备案管理', icon: '📋' },
  { key: 'dataAudit', label: '招聘数据复查', icon: '🔍' },
  { key: 'subsidyAudit', label: '专项补贴标注审核', icon: '💰' },
  { key: 'postingGuide', label: '发布向导', icon: '📝' },
  { key: 'policies', label: '政策管理', icon: '📜' },
  { key: 'users', label: '用户管理', icon: '👥' }
];

const MOCK_FILING_DATA = [
  { id: 1, jobId: 'JOB202606001', positionNo: 'POS2026060001', titleCn: '跨境电商运营经理', titleEn: 'Cross-border E-commerce Operations Manager', company: '海南自贸港跨境电商有限公司', status: 'recorded', bureauRefNo: 'BA202606001', recordedAt: '2026-06-05 10:30:00', receivedAt: '2026-06-05 10:35:00', pendingReason: '', auditRecords: [{ time: '2026-06-05 10:30:00', operator: '系统自动', action: '提交备案', remark: '职位信息完整，自动提交' }, { time: '2026-06-05 10:35:00', operator: '就业局系统', action: '备案通过', remark: '回传编号：BA202606001' }] },
  { id: 2, jobId: 'JOB202606002', positionNo: 'POS2026060002', titleCn: '游艇维修工程师', titleEn: 'Yacht Maintenance Engineer', company: '三亚国际游艇俱乐部', status: 'pending', bureauRefNo: '', recordedAt: '', receivedAt: '2026-06-05 09:20:00', pendingReason: '缺少岗位资质要求说明', auditRecords: [{ time: '2026-06-05 09:15:00', operator: '系统自动', action: '提交备案', remark: '职位信息提交' }, { time: '2026-06-05 09:20:00', operator: '就业局审核员', action: '待补充材料', remark: '请补充岗位资质要求详细说明' }] },
  { id: 3, jobId: 'JOB202606003', positionNo: 'POS2026060003', titleCn: '离岸数据中心运维', titleEn: 'Offshore Data Center Operations', company: '海南生态软件园集团', status: 'failed', bureauRefNo: '', recordedAt: '', receivedAt: '2026-06-04 15:30:00', pendingReason: '企业资质未通过年审', auditRecords: [{ time: '2026-06-04 15:00:00', operator: '系统自动', action: '提交备案', remark: '职位信息提交' }, { time: '2026-06-04 15:30:00', operator: '就业局审核员', action: '备案失败', remark: '企业资质未通过年度审核，请更新企业信息后重新提交' }] },
  { id: 4, jobId: 'JOB202606004', positionNo: 'POS2026060004', titleCn: '国际航运调度员', titleEn: 'International Shipping Coordinator', company: '海南港航控股有限公司', status: 'recorded', bureauRefNo: 'BA202606002', recordedAt: '2026-06-04 14:20:00', receivedAt: '2026-06-04 14:25:00', pendingReason: '', auditRecords: [{ time: '2026-06-04 14:15:00', operator: '系统自动', action: '提交备案', remark: '职位信息完整，自动提交' }, { time: '2026-06-04 14:25:00', operator: '就业局系统', action: '备案通过', remark: '回传编号：BA202606002' }] },
  { id: 5, jobId: 'JOB202606005', positionNo: 'POS2026060005', titleCn: '旅游文化策划总监', titleEn: 'Tourism & Culture Planning Director', company: '海南旅游投资集团', status: 'recorded', bureauRefNo: 'BA202606003', recordedAt: '2026-06-03 09:15:00', receivedAt: '2026-06-03 09:20:00', pendingReason: '', auditRecords: [{ time: '2026-06-03 09:10:00', operator: '系统自动', action: '提交备案', remark: '职位信息完整，自动提交' }, { time: '2026-06-03 09:20:00', operator: '就业局系统', action: '备案通过', remark: '回传编号：BA202606003' }] },
  { id: 6, jobId: 'JOB202606006', positionNo: 'POS2026060006', titleCn: '医疗健康研究员', titleEn: 'Healthcare Researcher', company: '博鳌乐城国际医疗旅游先行区', status: 'pending', bureauRefNo: '', recordedAt: '', receivedAt: '2026-06-05 11:10:00', pendingReason: '需补充医疗从业资质证明', auditRecords: [{ time: '2026-06-05 11:00:00', operator: '系统自动', action: '提交备案', remark: '职位信息提交' }, { time: '2026-06-05 11:10:00', operator: '就业局审核员', action: '待补充材料', remark: '医疗健康岗位需补充相关从业资质要求' }] },
  { id: 7, jobId: 'JOB202606007', positionNo: 'POS2026060007', titleCn: '金融风控分析师', titleEn: 'Financial Risk Analyst', company: '海南自贸港金融发展局', status: 'recorded', bureauRefNo: 'BA202606004', recordedAt: '2026-06-02 16:45:00', receivedAt: '2026-06-02 16:50:00', pendingReason: '', auditRecords: [{ time: '2026-06-02 16:40:00', operator: '系统自动', action: '提交备案', remark: '职位信息完整，自动提交' }, { time: '2026-06-02 16:50:00', operator: '就业局系统', action: '备案通过', remark: '回传编号：BA202606004' }] },
  { id: 8, jobId: 'JOB202606008', positionNo: 'POS2026060008', titleCn: '国际教育顾问', titleEn: 'International Education Consultant', company: '海南哈罗公学', status: 'pending', bureauRefNo: '', recordedAt: '', receivedAt: '2026-06-05 14:00:00', pendingReason: '薪资范围表述不明确', auditRecords: [{ time: '2026-06-05 13:50:00', operator: '系统自动', action: '提交备案', remark: '职位信息提交' }, { time: '2026-06-05 14:00:00', operator: '就业局审核员', action: '待补充材料', remark: '请明确薪资范围的具体数值' }] },
  { id: 9, jobId: 'JOB202606009', positionNo: 'POS2026060009', titleCn: '跨境支付产品经理', titleEn: 'Cross-border Payment Product Manager', company: '海南数字支付科技有限公司', status: 'pending', bureauRefNo: '', recordedAt: '', receivedAt: '2026-06-05 15:30:00', pendingReason: '岗位职责描述过于简略', auditRecords: [{ time: '2026-06-05 15:20:00', operator: '系统自动', action: '提交备案', remark: '职位信息提交' }, { time: '2026-06-05 15:30:00', operator: '就业局审核员', action: '待补充材料', remark: '请详细描述岗位职责和任职要求' }] },
  { id: 10, jobId: 'JOB202606010', positionNo: 'POS2026060010', titleCn: '国际会展策划师', titleEn: 'International Exhibition Planner', company: '海南国际会展中心', status: 'failed', bureauRefNo: '', recordedAt: '', receivedAt: '2026-06-04 10:00:00', pendingReason: '岗位名称不符合行业规范', auditRecords: [{ time: '2026-06-04 09:45:00', operator: '系统自动', action: '提交备案', remark: '职位信息提交' }, { time: '2026-06-04 10:00:00', operator: '就业局审核员', action: '备案失败', remark: '岗位名称需按照《职业分类大典》规范命名' }] },
  { id: 11, jobId: 'JOB202606011', positionNo: 'POS2026060011', titleCn: '冷链物流主管', titleEn: 'Cold Chain Logistics Supervisor', company: '海南港航物流集团', status: 'pending', bureauRefNo: '', recordedAt: '', receivedAt: '2026-06-05 16:00:00', pendingReason: '需补充特殊作业资质要求', auditRecords: [{ time: '2026-06-05 15:50:00', operator: '系统自动', action: '提交备案', remark: '职位信息提交' }, { time: '2026-06-05 16:00:00', operator: '就业局审核员', action: '待补充材料', remark: '冷链岗位需补充低温作业相关资质要求' }] },
  { id: 12, jobId: 'JOB202606012', positionNo: 'POS2026060012', titleCn: '免税品销售经理', titleEn: 'Duty-free Sales Manager', company: '海南免税品集团', status: 'pending', bureauRefNo: '', recordedAt: '', receivedAt: '2026-06-05 16:45:00', pendingReason: '工作时间安排说明缺失', auditRecords: [{ time: '2026-06-05 16:30:00', operator: '系统自动', action: '提交备案', remark: '职位信息提交' }, { time: '2026-06-05 16:45:00', operator: '就业局审核员', action: '待补充材料', remark: '请明确说明工作时间和轮班安排' }] }
];

const MOCK_AUDIT_DATA = [
  { id: 1, positionNo: 'POS2026060001', auditLevel: '一级', titleCn: '跨境电商运营经理', titleEn: 'Cross-border E-commerce Operations Manager', company: '海南自贸港跨境电商有限公司', submittedAt: '2026-06-05 08:30:00', status: 'approved', auditor: '张管理员', auditedAt: '2026-06-05 10:30:00', rejectionReason: '', reviewRecords: [{ time: '2026-06-05 08:30:00', operator: '企业用户', action: '提交审核', remark: '职位信息完整提交' }, { time: '2026-06-05 10:30:00', operator: '张管理员', action: '审核通过', remark: '信息真实有效，符合发布要求' }] },
  { id: 2, positionNo: 'POS2026060002', auditLevel: '二级', titleCn: '游艇维修工程师', titleEn: 'Yacht Maintenance Engineer', company: '三亚国际游艇俱乐部', submittedAt: '2026-06-05 09:00:00', status: 'pending', auditor: '', auditedAt: '', rejectionReason: '', reviewRecords: [{ time: '2026-06-05 09:00:00', operator: '企业用户', action: '提交审核', remark: '职位信息提交' }] },
  { id: 3, positionNo: 'POS2026060003', auditLevel: '三级', titleCn: '离岸数据中心运维', titleEn: 'Offshore Data Center Operations', company: '海南生态软件园集团', submittedAt: '2026-06-04 14:00:00', status: 'rejected', auditor: '李管理员', auditedAt: '2026-06-04 16:00:00', rejectionReason: '岗位职责描述与实际岗位要求不符，需重新梳理', reviewRecords: [{ time: '2026-06-04 14:00:00', operator: '企业用户', action: '提交审核', remark: '职位信息提交' }, { time: '2026-06-04 16:00:00', operator: '李管理员', action: '审核驳回', remark: '岗位职责描述与离岸数据中心运维岗位实际要求不符' }] },
  { id: 4, positionNo: 'POS2026060004', auditLevel: '一级', titleCn: '国际航运调度员', titleEn: 'International Shipping Coordinator', company: '海南港航控股有限公司', submittedAt: '2026-06-04 10:00:00', status: 'approved', auditor: '张管理员', auditedAt: '2026-06-04 14:20:00', rejectionReason: '', reviewRecords: [{ time: '2026-06-04 10:00:00', operator: '企业用户', action: '提交审核', remark: '职位信息完整提交' }, { time: '2026-06-04 14:20:00', operator: '张管理员', action: '审核通过', remark: '符合国际航运岗位要求' }] },
  { id: 5, positionNo: 'POS2026060005', auditLevel: '一级', titleCn: '旅游文化策划总监', titleEn: 'Tourism & Culture Planning Director', company: '海南旅游投资集团', submittedAt: '2026-06-03 15:00:00', status: 'approved', auditor: '王管理员', auditedAt: '2026-06-03 09:15:00', rejectionReason: '', reviewRecords: [{ time: '2026-06-03 15:00:00', operator: '企业用户', action: '提交审核', remark: '职位信息完整提交' }, { time: '2026-06-03 09:15:00', operator: '王管理员', action: '审核通过', remark: '符合旅游文化策划岗位要求' }] },
  { id: 6, positionNo: 'POS2026060006', auditLevel: '三级', titleCn: '医疗健康研究员', titleEn: 'Healthcare Researcher', company: '博鳌乐城国际医疗旅游先行区', submittedAt: '2026-06-05 11:00:00', status: 'pending', auditor: '', auditedAt: '', rejectionReason: '', reviewRecords: [{ time: '2026-06-05 11:00:00', operator: '企业用户', action: '提交审核', remark: '职位信息提交' }] },
  { id: 7, positionNo: 'POS2026060007', auditLevel: '二级', titleCn: '金融风控分析师', titleEn: 'Financial Risk Analyst', company: '海南自贸港金融发展局', submittedAt: '2026-06-05 13:00:00', status: 'pending', auditor: '', auditedAt: '', rejectionReason: '', reviewRecords: [{ time: '2026-06-05 13:00:00', operator: '企业用户', action: '提交审核', remark: '职位信息提交' }] },
  { id: 8, positionNo: 'POS2026060008', auditLevel: '一级', titleCn: '国际教育顾问', titleEn: 'International Education Consultant', company: '海南哈罗公学', submittedAt: '2026-06-05 14:30:00', status: 'rejected', auditor: '赵管理员', auditedAt: '2026-06-05 16:00:00', rejectionReason: '薪资范围与教育行业市场水平偏差较大，需核实后重新提交', reviewRecords: [{ time: '2026-06-05 14:30:00', operator: '企业用户', action: '提交审核', remark: '职位信息提交' }, { time: '2026-06-05 16:00:00', operator: '赵管理员', action: '审核驳回', remark: '薪资范围明显高于教育行业平均水平' }] },
  { id: 9, positionNo: 'POS2026060009', auditLevel: '二级', titleCn: '跨境支付产品经理', titleEn: 'Cross-border Payment Product Manager', company: '海南数字支付科技有限公司', submittedAt: '2026-06-05 10:00:00', status: 'pending', auditor: '', auditedAt: '', rejectionReason: '', reviewRecords: [{ time: '2026-06-05 10:00:00', operator: '企业用户', action: '提交审核', remark: '职位信息提交' }] },
  { id: 10, positionNo: 'POS2026060010', auditLevel: '一级', titleCn: '国际会展策划师', titleEn: 'International Exhibition Planner', company: '海南国际会展中心', submittedAt: '2026-06-04 15:00:00', status: 'approved', auditor: '王管理员', auditedAt: '2026-06-05 09:00:00', rejectionReason: '', reviewRecords: [{ time: '2026-06-04 15:00:00', operator: '企业用户', action: '提交审核', remark: '职位信息完整提交' }, { time: '2026-06-05 09:00:00', operator: '王管理员', action: '审核通过', remark: '符合国际会展策划岗位要求' }] },
  { id: 11, positionNo: 'POS2026060011', auditLevel: '三级', titleCn: '冷链物流主管', titleEn: 'Cold Chain Logistics Supervisor', company: '海南港航物流集团', submittedAt: '2026-06-05 12:00:00', status: 'pending', auditor: '', auditedAt: '', rejectionReason: '', reviewRecords: [{ time: '2026-06-05 12:00:00', operator: '企业用户', action: '提交审核', remark: '职位信息提交' }] },
  { id: 12, positionNo: 'POS2026060012', auditLevel: '二级', titleCn: '免税品销售经理', titleEn: 'Duty-free Sales Manager', company: '海南免税品集团', submittedAt: '2026-06-05 08:00:00', status: 'rejected', auditor: '张管理员', auditedAt: '2026-06-05 10:00:00', rejectionReason: '岗位名称不规范，应使用《职业分类大典》中的标准名称', reviewRecords: [{ time: '2026-06-05 08:00:00', operator: '企业用户', action: '提交审核', remark: '职位信息提交' }, { time: '2026-06-05 10:00:00', operator: '张管理员', action: '审核驳回', remark: '岗位名称需按照国家标准规范命名' }] }
];

const MOCK_SUBSIDY_DATA = [
  { id: 1, titleCn: '跨境电商运营经理', titleEn: 'Cross-border E-commerce Operations Manager', subsidyType: '个税优惠', subsidyTypeEn: 'Individual Income Tax', policyBasis: '财税〔2020〕32号', company: '海南自贸港跨境电商有限公司', amount: '36000/年', status: 'pending' },
  { id: 2, titleCn: '游艇维修工程师', titleEn: 'Yacht Maintenance Engineer', subsidyType: '住房补贴', subsidyTypeEn: 'Housing Subsidy', policyBasis: '琼办发〔2019〕41号', company: '三亚国际游艇俱乐部', amount: '24000/年', status: 'approved' },
  { id: 3, titleCn: '离岸数据中心运维', titleEn: 'Offshore Data Center Operations', subsidyType: '企业所得税', subsidyTypeEn: 'Corporate Income Tax', policyBasis: '财税〔2020〕31号', company: '海南生态软件园集团', amount: '15%税率优惠', status: 'pending' },
  { id: 4, titleCn: '国际航运调度员', titleEn: 'International Shipping Coordinator', subsidyType: '社保补贴', subsidyTypeEn: 'Social Security Subsidy', policyBasis: '琼人社发〔2021〕100号', company: '海南港航控股有限公司', amount: '12000/年', status: 'rejected' },
  { id: 5, titleCn: '医疗健康研究员', titleEn: 'Healthcare Researcher', subsidyType: '个税优惠', subsidyTypeEn: 'Individual Income Tax', policyBasis: '财税〔2020〕32号', company: '博鳌乐城国际医疗旅游先行区', amount: '48000/年', status: 'approved' },
  { id: 6, titleCn: '金融风控分析师', titleEn: 'Financial Risk Analyst', subsidyType: '住房补贴', subsidyTypeEn: 'Housing Subsidy', policyBasis: '琼办发〔2019〕41号', company: '海南自贸港金融发展局', amount: '36000/年', status: 'pending' }
];

const RCEP_SKILL_TAGS = [
  { code: 'R01', name: '跨境电商', nameEn: 'Cross-border E-commerce' },
  { code: 'R02', name: '国际贸易', nameEn: 'International Trade' },
  { code: 'R03', name: '离岸金融', nameEn: 'Offshore Finance' },
  { code: 'R04', name: '国际物流', nameEn: 'International Logistics' },
  { code: 'R05', name: '跨境结算', nameEn: 'Cross-border Settlement' },
  { code: 'R06', name: '数字贸易', nameEn: 'Digital Trade' },
  { code: 'R07', name: '知识产权', nameEn: 'Intellectual Property' },
  { code: 'R08', name: '跨境法律服务', nameEn: 'Cross-border Legal Services' }
];

export default function AdminDashboard() {
  const { language, t } = useApp();
  const location = useLocation();
  const isEnglish = language === 'en';
  
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && MENU_ITEMS.some(item => item.key === tabParam)) {
      return tabParam;
    }
    return 'overview';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [stats, setStats] = useState(null);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filingData, setFilingData] = useState(MOCK_FILING_DATA);
  const [selectedFilingItems, setSelectedFilingItems] = useState([]);
  const [auditData, setAuditData] = useState(MOCK_AUDIT_DATA);
  const [subsidyData, setSubsidyData] = useState(MOCK_SUBSIDY_DATA);
  const [selectedSubsidyItems, setSelectedSubsidyItems] = useState([]);
  
  const [showAuditTrailModal, setShowAuditTrailModal] = useState(false);
  const [selectedAuditRecord, setSelectedAuditRecord] = useState(null);
  const [showSubsidyDetailModal, setShowSubsidyDetailModal] = useState(false);
  const [selectedSubsidyRecord, setSelectedSubsidyRecord] = useState(null);
  const [showFilingAuditRecordsModal, setShowFilingAuditRecordsModal] = useState(false);
  const [selectedFilingAuditRecord, setSelectedFilingAuditRecord] = useState(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [selectedChecklistRecord, setSelectedChecklistRecord] = useState(null);
  
  const [postingStep, setPostingStep] = useState(1);
  const [postingForm, setPostingForm] = useState({
    titleCn: '', titleEn: '',
    descCn: '', descEn: '',
    selectedSkills: [],
    policyRef: '',
    subsidyCheckResult: null
  });

  useEffect(() => {
    fetchStats();
    fetchPendingJobs();
    fetchRecordings();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && MENU_ITEMS.some(item => item.key === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const fetchPendingJobs = async () => {
    try {
      const response = await api.get('/admin/jobs/pending');
      setPendingJobs(response.data);
    } catch (error) {
      console.error('获取待审核职位失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordings = async () => {
    try {
      const response = await api.get('/admin/recordings');
      setRecordings(response.data);
    } catch (error) {
      console.error('获取备案记录失败:', error);
    }
  };

  const handleApprove = async (jobId) => {
    if (confirm('确认审核通过此职位？审核通过后将自动同步至海南省就业局岗位备案系统。')) {
      try {
        await api.post('/admin/jobs/' + jobId + '/approve');
        alert('审核通过！已同步至就业局备案系统');
        fetchPendingJobs();
        fetchStats();
      } catch (error) {
        alert(error.response?.data?.error || '操作失败');
      }
    }
  };

  const handleReject = async (jobId) => {
    const reason = prompt('请输入驳回原因：');
    if (reason !== null) {
      try {
        await api.post('/admin/jobs/' + jobId + '/reject', { reason });
        alert('已驳回');
        fetchPendingJobs();
        fetchStats();
      } catch (error) {
        alert(error.response?.data?.error || '操作失败');
      }
    }
  };

  const handleFiling = (item) => {
    if (confirm(`确认对职位 "${item.titleCn}" 进行备案？`)) {
      setFilingData(prev => prev.map(f => 
        f.id === item.id 
          ? { ...f, status: 'recorded', bureauRefNo: 'BA' + Date.now().toString().slice(-8), recordedAt: new Date().toLocaleString('zh-CN') }
          : f
      ));
      alert('备案成功！');
    }
  };

  const handleResync = (item) => {
    if (confirm(`确认重新同步职位 "${item.titleCn}" 的备案数据？`)) {
      setFilingData(prev => prev.map(f => 
        f.id === item.id 
          ? { ...f, status: 'recorded', bureauRefNo: 'BA' + Date.now().toString().slice(-8), recordedAt: new Date().toLocaleString('zh-CN') }
          : f
      ));
      alert('重新同步成功！');
    }
  };

  const handleBatchFiling = () => {
    if (selectedFilingItems.length === 0) {
      alert('请先选择要备案的职位');
      return;
    }
    if (confirm(`确认对选中的 ${selectedFilingItems.length} 个职位进行批量备案？`)) {
      setFilingData(prev => prev.map(f => 
        selectedFilingItems.includes(f.id)
          ? { ...f, status: 'recorded', bureauRefNo: 'BA' + Date.now().toString().slice(-8) + f.id, recordedAt: new Date().toLocaleString('zh-CN') }
          : f
      ));
      setSelectedFilingItems([]);
      alert('批量备案成功！');
    }
  };

  const handleExportFiling = () => {
    alert('备案清单导出功能已触发，正在生成 Excel 文件...');
  };

  const handleToggleFilingItem = (id) => {
    setSelectedFilingItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiling = () => {
    if (selectedFilingItems.length === filingData.length) {
      setSelectedFilingItems([]);
    } else {
      setSelectedFilingItems(filingData.map(f => f.id));
    }
  };

  const handleViewAuditTrail = (record) => {
    setSelectedAuditRecord(record);
    setShowAuditTrailModal(true);
  };

  const handleApproveAudit = (record) => {
    if (confirm(`确认通过职位 "${record.titleCn}" 的审核？`)) {
      setAuditData(prev => prev.map(a => 
        a.id === record.id 
          ? { ...a, status: 'approved', auditor: '当前管理员', auditedAt: new Date().toLocaleString('zh-CN') }
          : a
      ));
      alert('审核通过！');
    }
  };

  const handleRejectAudit = (record) => {
    const reason = prompt('请输入驳回原因：');
    if (reason !== null) {
      setAuditData(prev => prev.map(a => 
        a.id === record.id 
          ? { ...a, status: 'rejected', auditor: '当前管理员', auditedAt: new Date().toLocaleString('zh-CN') }
          : a
      ));
      alert('已驳回');
    }
  };

  const handleViewFilingAuditRecords = (record) => {
    setSelectedFilingAuditRecord(record);
    setShowFilingAuditRecordsModal(true);
  };

  const handleViewChecklist = (record) => {
    setSelectedChecklistRecord(record);
    setShowChecklistModal(true);
  };

  const handleResubmit = (record) => {
    if (confirm(`确认重新提交职位 "${record.titleCn}" 的审核？`)) {
      setAuditData(prev => prev.map(a => 
        a.id === record.id 
          ? { 
              ...a, 
              status: 'pending', 
              auditor: '', 
              auditedAt: '',
              rejectionReason: '',
              submittedAt: new Date().toLocaleString('zh-CN'),
              reviewRecords: [
                ...a.reviewRecords,
                { time: new Date().toLocaleString('zh-CN'), operator: '企业用户', action: '重新提交', remark: '根据审核意见修改后重新提交' }
              ]
            }
          : a
      ));
      alert('已重新提交审核');
    }
  };

  const handleViewAuditDetails = (record) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set('tab', 'dataAudit');
    window.history.replaceState({}, '', `${location.pathname}?${newParams.toString()}`);
    setActiveTab('dataAudit');
    setSelectedAuditRecord(record);
    setShowAuditTrailModal(true);
  };

  const handleTabChange = (tabKey) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set('tab', tabKey);
    window.history.replaceState({}, '', `${location.pathname}?${newParams.toString()}`);
    setActiveTab(tabKey);
  };

  const getAuditLevelBadge = (level) => {
    const levelMap = {
      '一级': { class: 'badge-info', text: isEnglish ? 'Level 1' : '一级' },
      '二级': { class: 'badge-warning', text: isEnglish ? 'Level 2' : '二级' },
      '三级': { class: 'badge-danger', text: isEnglish ? 'Level 3' : '三级' },
    };
    return levelMap[level] || levelMap['一级'];
  };

  const generateChecklist = (record) => {
    return [
      { item: isEnglish ? 'Job title standardization' : '岗位名称规范性', checked: true, remark: isEnglish ? 'Compliant with national occupation classification' : '符合国家职业分类大典' },
      { item: isEnglish ? 'Job description completeness' : '岗位职责完整性', checked: true, remark: isEnglish ? 'Complete and detailed' : '内容完整详细' },
      { item: isEnglish ? 'Qualification requirements' : '任职资格要求', checked: record.status !== 'rejected', remark: record.rejectionReason || (isEnglish ? 'Qualified' : '符合要求') },
      { item: isEnglish ? 'Salary range reasonableness' : '薪资范围合理性', checked: !record.rejectionReason?.includes('薪资'), remark: isEnglish ? 'Market aligned' : '符合市场水平' },
      { item: isEnglish ? 'Company qualification' : '企业资质有效性', checked: true, remark: isEnglish ? 'Valid and up-to-date' : '资质有效' },
      { item: isEnglish ? 'FTZ policy compliance' : '自贸港政策合规', checked: true, remark: isEnglish ? 'FTP policy applicable' : '适用自贸港政策' },
      { item: isEnglish ? 'Bilingual content' : '双语内容完整性', checked: !!record.titleEn, remark: record.titleEn ? (isEnglish ? 'Complete' : '完整') : (isEnglish ? 'Missing English version' : '缺少英文版本') },
      { item: isEnglish ? 'RCEP skill tags' : 'RCEP技能标签', checked: true, remark: isEnglish ? 'Properly tagged' : '标签正确' },
    ];
  };

  const handleViewSubsidyDetail = (record) => {
    setSelectedSubsidyRecord(record);
    setShowSubsidyDetailModal(true);
  };

  const handleApproveSubsidy = (record) => {
    if (confirm(`确认通过 "${record.titleCn}" 的补贴申请？`)) {
      setSubsidyData(prev => prev.map(s => 
        s.id === record.id ? { ...s, status: 'approved' } : s
      ));
      alert('补贴申请已通过！');
    }
  };

  const handleRejectSubsidy = (record) => {
    const reason = prompt('请输入驳回原因：');
    if (reason !== null) {
      setSubsidyData(prev => prev.map(s => 
        s.id === record.id ? { ...s, status: 'rejected' } : s
      ));
      alert('已驳回');
    }
  };

  const handleToggleSubsidyItem = (id) => {
    setSelectedSubsidyItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchSubsidyAudit = () => {
    if (selectedSubsidyItems.length === 0) {
      alert('请先选择要审核的补贴申请');
      return;
    }
    const action = confirm('点击"确定"批量通过，点击"取消"批量驳回');
    const newStatus = action ? 'approved' : 'rejected';
    setSubsidyData(prev => prev.map(s => 
      selectedSubsidyItems.includes(s.id) ? { ...s, status: newStatus } : s
    ));
    setSelectedSubsidyItems([]);
    alert(`批量${action ? '通过' : '驳回'}成功！`);
  };

  const handlePostingSkillToggle = (code) => {
    setPostingForm(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(code)
        ? prev.selectedSkills.filter(s => s !== code)
        : [...prev.selectedSkills, code]
    }));
  };

  const handleSubsidyCheck = () => {
    if (!postingForm.policyRef) {
      alert('请先填写政策依据文号');
      return;
    }
    setPostingForm(prev => ({
      ...prev,
      subsidyCheckResult: {
        eligible: true,
        subsidyType: '个税优惠',
        amount: '36000/年',
        policyMatch: '财税〔2020〕32号 - 高端人才个税15%优惠',
        notes: '符合海南自贸港高端紧缺人才个人所得税优惠政策'
      }
    }));
  };

  const handlePostingSubmit = () => {
    alert('双语职位已提交审核！请等待管理员审核后发布。');
    setPostingStep(1);
    setPostingForm({
      titleCn: '', titleEn: '',
      descCn: '', descEn: '',
      selectedSkills: [],
      policyRef: '',
      subsidyCheckResult: null
    });
  };

  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="loading"></div>
      </div>
    );
  }

  const getFilingStatusBadge = (item) => {
    const status = item.status;
    const statusMap = {
      recorded: { class: 'badge-success', text: isEnglish ? 'Recorded' : '已备案' },
      pending: { class: 'badge-warning', text: isEnglish ? 'Pending' : '待备案' },
      failed: { class: 'badge-danger', text: isEnglish ? 'Failed' : '备案失败' }
    };
    const base = statusMap[status] || statusMap.pending;
    if (status === 'pending' && item.pendingReason) {
      return { ...base, text: `⏳ ${base.text} - ${item.pendingReason}` };
    }
    if (status === 'failed' && item.pendingReason) {
      return { ...base, text: `❌ ${base.text} - ${item.pendingReason}` };
    }
    return base;
  };

  const getAuditStatusBadge = (item) => {
    const status = item.status;
    const statusMap = {
      approved: { class: 'badge-success', text: isEnglish ? 'Approved' : '已审核' },
      pending: { class: 'badge-warning', text: isEnglish ? 'Pending' : '待审核' },
      rejected: { class: 'badge-danger', text: isEnglish ? 'Rejected' : '已驳回' }
    };
    const base = statusMap[status] || statusMap.pending;
    if (status === 'rejected' && item.rejectionReason) {
      return { ...base, text: `❌ ${base.text} - ${item.rejectionReason}` };
    }
    return base;
  };

  const getSubsidyStatusBadge = (status) => {
    const statusMap = {
      approved: { class: 'badge-success', text: isEnglish ? 'Approved' : '已通过' },
      pending: { class: 'badge-warning', text: isEnglish ? 'Pending' : '待审核' },
      rejected: { class: 'badge-danger', text: isEnglish ? 'Rejected' : '已驳回' }
    };
    return statusMap[status] || statusMap.pending;
  };

  const getAuditStats = () => {
    const total = auditData.length;
    const approved = auditData.filter(a => a.status === 'approved').length;
    const pending = auditData.filter(a => a.status === 'pending').length;
    const rejected = auditData.filter(a => a.status === 'rejected').length;
    return { total, approved, pending, rejected };
  };

  const auditStats = getAuditStats();

  const renderOverviewTab = () => (
    <div className="card">
      <h2 style={{ marginBottom: '24px' }}>{t('admin.overview')}</h2>
      
      <h3 className="mb-md">{t('admin.industryDistribution')}</h3>
      <div className="grid grid-2 mb-lg">
        {stats.jobsByCategory.map(cat => (
          <div key={cat.code} className="flex justify-between items-center p-sm" style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
            <span>{isEnglish ? cat.name_en : cat.name_cn}</span>
            <div className="flex items-center gap-sm">
              <div style={{ width: '200px', height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: ((cat.count / (stats.overview.totalJobs || 1)) * 100) + '%', height: '100%', background: '#00897b' }}>
                </div>
              </div>
              <span className="text-sm font-medium">{cat.count}</span>
            </div>
          </div>
        ))}
      </div>

      <h3 className="mb-md">{t('admin.recentActivities')}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {stats.recentActivities.map((activity, index) => {
          const typeText = activity.type === 'job' 
            ? (isEnglish ? 'New Job Posted' : '新职位发布') 
            : activity.type === 'application' 
              ? (isEnglish ? 'New Application' : '新职位申请') 
              : (isEnglish ? 'New User Registered' : '新用户注册');
          return (
            <div key={index} className="flex justify-between items-center p-sm" style={{
              padding: '12px', background: '#fafafa', borderRadius: '8px' }}>
              <div>
                <div className="font-medium">{activity.title}</div>
                <div className="text-xs text-secondary">{typeText}</div>
              </div>
              <div className="text-xs text-secondary">{activity.created_at}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPendingTab = () => (
    <div className="card">
      <h2 style={{ marginBottom: '24px' }}>{t('admin.pendingJobs')}</h2>
      {pendingJobs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pendingJobs.map(job => (
            <div key={job.id} className="card" style={{ padding: '20px', margin: 0 }}>
              <div className="flex justify-between items-start">
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '600' }}>{job.title_cn}</div>
                  {job.title_en && (
                    <div className="text-xs text-secondary">{job.title_en}</div>
                  )}
                  <div className="text-sm text-secondary mt-sm">
                    {job.company_name} · {job.category_name} · {job.salary_min/10000}万-{job.salary_max/10000}万/月
                  </div>
                  {job.has_ftz_subsidy && (
                    <div className="mt-sm">
                      <span className="subsidy-tag">{isEnglish ? 'FTP Subsidy' : '自贸港补贴'}</span>
                      {job.subsidy_policy_ref && (
                        <span className="text-xs text-secondary ml-sm">{isEnglish ? 'Policy: ' : '政策依据：'}{job.subsidy_policy_ref}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-sm">
                  <button onClick={() => handleApprove(job.id)} className="btn btn-success btn-sm">{t('admin.approve')}</button>
                  <button onClick={() => handleReject(job.id)} className="btn btn-danger btn-sm">{t('admin.reject')}</button>
                  <Link to={'/jobs/' + job.id} className="btn btn-secondary btn-sm">{t('common.view')}</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <h3>{t('admin.noPendingJobs')}</h3>
          <p className="text-secondary">{t('admin.noPendingJobsDesc')}</p>
        </div>
      )}
    </div>
  );

  const renderRecordingsTab = () => (
    <div className="card">
      <div className="flex justify-between items-center mb-md">
        <h2 style={{ margin: 0 }}>{isEnglish ? 'Bureau Filing Management' : '就业局备案管理'}</h2>
        <div className="flex gap-sm">
          <button onClick={handleBatchFiling} className="btn btn-primary btn-sm">
            {isEnglish ? 'Batch Filing' : '批量备案'} ({selectedFilingItems.length})
          </button>
          <button onClick={handleExportFiling} className="btn btn-secondary btn-sm">
            {isEnglish ? 'Export Filing List' : '导出备案清单'}
          </button>
        </div>
      </div>
      
      <div className="alert alert-info mb-md">
        <strong>📋 {isEnglish 
          ? 'System integrated with Hainan Employment Bureau filing system for real-time data sync' 
          : '系统已对接海南省就业局岗位备案系统，实现招聘数据实时回传'}
        </strong>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1400px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th className="text-left p-sm" style={{ width: '40px' }}>
                <input 
                  type="checkbox" 
                  checked={selectedFilingItems.length === filingData.length && filingData.length > 0}
                  onChange={handleSelectAllFiling}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th className="text-left p-sm">{isEnglish ? 'Job ID' : '职位ID'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Position No.' : '岗位备案编号'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Job Title' : '职位名称'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Company' : '企业名称'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Status' : '备案状态'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Reason' : '待处理原因'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Bureau Ref No.' : '回传编号'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Received At' : '回传时间'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Actions' : '操作'}</th>
            </tr>
          </thead>
          <tbody>
            {filingData.map(item => {
              const statusBadge = getFilingStatusBadge(item);
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td className="p-sm">
                    <input 
                      type="checkbox" 
                      checked={selectedFilingItems.includes(item.id)}
                      onChange={() => handleToggleFilingItem(item.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td className="p-sm text-sm">{item.jobId}</td>
                  <td className="p-sm text-sm font-mono">{item.positionNo || '-'}</td>
                  <td className="p-sm">
                    <div className="font-medium">{item.titleCn}</div>
                    <div className="text-xs text-secondary">{item.titleEn}</div>
                  </td>
                  <td className="p-sm text-sm">{item.company}</td>
                  <td className="p-sm">
                    <span className={'badge ' + statusBadge.class}>
                      {statusBadge.text}
                    </span>
                  </td>
                  <td className="p-sm text-sm text-secondary">
                    {item.pendingReason || '-'}
                  </td>
                  <td className="p-sm text-sm">{item.bureauRefNo || '-'}</td>
                  <td className="p-sm text-sm text-secondary">{item.receivedAt || '-'}</td>
                  <td className="p-sm">
                    <div className="flex gap-sm flex-wrap">
                      {item.status === 'pending' && (
                        <button onClick={() => handleFiling(item)} className="btn btn-primary btn-sm">
                          {isEnglish ? 'File' : '备案'}
                        </button>
                      )}
                      {item.status === 'failed' && (
                        <button onClick={() => handleResync(item)} className="btn btn-primary btn-sm">
                          {isEnglish ? 'Resync' : '重新同步'}
                        </button>
                      )}
                      <button onClick={() => handleViewFilingAuditRecords(item)} className="btn btn-secondary btn-sm">
                        {isEnglish ? 'Audit Records' : '查看复核记录'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDataAuditTab = () => (
    <div className="card">
      <h2 style={{ marginBottom: '24px' }}>{isEnglish ? 'Data Audit' : '招聘数据复查'}</h2>
      
      <div className="grid grid-4 mb-lg">
        <div className="card" style={{ background: 'linear-gradient(135deg, #2196f3, #1565c0)', color: 'white', padding: '20px', margin: 0 }}>
          <div className="text-2xl font-bold">{auditStats.total}</div>
          <div style={{ opacity: 0.9, fontSize: '14px' }}>{isEnglish ? 'Total Jobs' : '总职位数'}</div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #4caf50, #2e7d32)', color: 'white', padding: '20px', margin: 0 }}>
          <div className="text-2xl font-bold">{auditStats.approved}</div>
          <div style={{ opacity: 0.9, fontSize: '14px' }}>{isEnglish ? 'Approved' : '已审核'}</div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #ff9800, #f57c00)', color: 'white', padding: '20px', margin: 0 }}>
          <div className="text-2xl font-bold">{auditStats.pending}</div>
          <div style={{ opacity: 0.9, fontSize: '14px' }}>{isEnglish ? 'Pending' : '待审核'}</div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #f44336, #c62828)', color: 'white', padding: '20px', margin: 0 }}>
          <div className="text-2xl font-bold">{auditStats.rejected}</div>
          <div style={{ opacity: 0.9, fontSize: '14px' }}>{isEnglish ? 'Rejected' : '已驳回'}</div>
        </div>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1500px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th className="text-left p-sm">{isEnglish ? 'Position No.' : '岗位编号'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Job Title' : '职位名称'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Company' : '企业'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Audit Level' : '审核级别'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Submitted At' : '提交时间'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Status' : '审核状态'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Rejection Reason' : '驳回原因'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Auditor' : '审核人'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Audited At' : '审核时间'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Actions' : '操作'}</th>
            </tr>
          </thead>
          <tbody>
            {auditData.map(item => {
              const statusBadge = getAuditStatusBadge(item);
              const auditLevelBadge = getAuditLevelBadge(item.auditLevel);
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td className="p-sm text-sm font-mono">{item.positionNo || '-'}</td>
                  <td className="p-sm">
                    <div className="font-medium">{item.titleCn}</div>
                    <div className="text-xs text-secondary">{item.titleEn}</div>
                  </td>
                  <td className="p-sm text-sm">{item.company}</td>
                  <td className="p-sm">
                    <span className={'badge ' + auditLevelBadge.class}>
                      {auditLevelBadge.text}
                    </span>
                  </td>
                  <td className="p-sm text-sm text-secondary">{item.submittedAt}</td>
                  <td className="p-sm">
                    <span className={'badge ' + statusBadge.class}>
                      {statusBadge.text}
                    </span>
                  </td>
                  <td className="p-sm text-sm text-secondary">
                    {item.rejectionReason || '-'}
                  </td>
                  <td className="p-sm text-sm">{item.auditor || '-'}</td>
                  <td className="p-sm text-sm text-secondary">{item.auditedAt || '-'}</td>
                  <td className="p-sm">
                    <div className="flex gap-sm flex-wrap">
                      <button onClick={() => handleViewAuditTrail(item)} className="btn btn-secondary btn-sm">
                        {isEnglish ? 'View' : '查看'}
                      </button>
                      <button onClick={() => handleViewChecklist(item)} className="btn btn-secondary btn-sm">
                        {isEnglish ? 'Checklist' : '岗位级复查清单'}
                      </button>
                      {item.status === 'pending' && (
                        <>
                          <button onClick={() => handleApproveAudit(item)} className="btn btn-success btn-sm">
                            {isEnglish ? 'Approve' : '通过'}
                          </button>
                          <button onClick={() => handleRejectAudit(item)} className="btn btn-danger btn-sm">
                            {isEnglish ? 'Reject' : '驳回'}
                          </button>
                        </>
                      )}
                      {item.status === 'rejected' && (
                        <button onClick={() => handleResubmit(item)} className="btn btn-primary btn-sm">
                          {isEnglish ? 'Resubmit' : '重新提交'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSubsidyAuditTab = () => (
    <div className="card">
      <div className="flex justify-between items-center mb-md">
        <h2 style={{ margin: 0 }}>{isEnglish ? 'Subsidy Review' : '专项补贴标注审核'}</h2>
        <button onClick={handleBatchSubsidyAudit} className="btn btn-primary btn-sm">
          {isEnglish ? 'Batch Audit' : '批量审核'} ({selectedSubsidyItems.length})
        </button>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th className="text-left p-sm" style={{ width: '40px' }}>
                <input 
                  type="checkbox" 
                  checked={selectedSubsidyItems.length === subsidyData.length && subsidyData.length > 0}
                  onChange={() => {
                    if (selectedSubsidyItems.length === subsidyData.length) {
                      setSelectedSubsidyItems([]);
                    } else {
                      setSelectedSubsidyItems(subsidyData.map(s => s.id));
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th className="text-left p-sm">{isEnglish ? 'Job Title' : '职位名称'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Subsidy Type' : '补贴类型'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Policy Basis' : '政策依据'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Company' : '申请企业'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Amount' : '申请金额'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Status' : '审核状态'}</th>
              <th className="text-left p-sm">{isEnglish ? 'Actions' : '操作'}</th>
            </tr>
          </thead>
          <tbody>
            {subsidyData.map(item => {
              const statusBadge = getSubsidyStatusBadge(item.status);
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td className="p-sm">
                    <input 
                      type="checkbox" 
                      checked={selectedSubsidyItems.includes(item.id)}
                      onChange={() => handleToggleSubsidyItem(item.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td className="p-sm">
                    <div className="font-medium">{item.titleCn}</div>
                    <div className="text-xs text-secondary">{item.titleEn}</div>
                  </td>
                  <td className="p-sm">
                    <span className="badge badge-info">
                      {isEnglish ? item.subsidyTypeEn : item.subsidyType}
                    </span>
                  </td>
                  <td className="p-sm text-sm">{item.policyBasis}</td>
                  <td className="p-sm text-sm">{item.company}</td>
                  <td className="p-sm text-sm font-medium">{item.amount}</td>
                  <td className="p-sm">
                    <span className={'badge ' + statusBadge.class}>
                      {statusBadge.text}
                    </span>
                  </td>
                  <td className="p-sm">
                    <div className="flex gap-sm">
                      <button onClick={() => handleViewSubsidyDetail(item)} className="btn btn-secondary btn-sm">
                        {isEnglish ? 'Details' : '查看详情'}
                      </button>
                      {item.status === 'pending' && (
                        <>
                          <button onClick={() => handleApproveSubsidy(item)} className="btn btn-success btn-sm">
                            {isEnglish ? 'Approve' : '通过'}
                          </button>
                          <button onClick={() => handleRejectSubsidy(item)} className="btn btn-danger btn-sm">
                            {isEnglish ? 'Reject' : '驳回'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPostingGuideTab = () => (
    <div className="card">
      <h2 style={{ marginBottom: '24px' }}>{isEnglish ? 'Bilingual Job Posting Guide' : '双语职位发布向导'}</h2>
      
      <div className="flex justify-between items-center mb-lg" style={{ padding: '20px', background: '#f5f7fa', borderRadius: '8px' }}>
        {[1, 2, 3, 4, 5].map(step => {
          const stepTitles = isEnglish 
            ? ['Basic Info (Bilingual)', 'RCEP Skill Tags', 'Policy Association', 'Auto-subsidy Check', 'Submit for Review']
            : ['填写基本信息（中英双语）', '选择RCEP技能标签', '关联政策依据', '补贴资格自动核验', '提交审核'];
          const isActive = postingStep === step;
          const isCompleted = postingStep > step;
          return (
            <div key={step} className="flex items-center" style={{ flex: 1 }}>
              <div className="flex items-center">
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: isActive ? '#00897b' : isCompleted ? '#4caf50' : '#e0e0e0',
                  color: isActive || isCompleted ? 'white' : '#757575',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  marginRight: '8px'
                }}>
                  {isCompleted ? '✓' : step}
                </div>
                <div style={{ fontSize: '12px', color: isActive ? '#00897b' : '#757575', fontWeight: isActive ? '600' : '400' }}>
                  {stepTitles[step - 1]}
                </div>
              </div>
              {step < 5 && (
                <div style={{
                  flex: 1,
                  height: '2px',
                  background: isCompleted ? '#4caf50' : '#e0e0e0',
                  margin: '0 12px'
                }} />
              )}
            </div>
          );
        })}
      </div>
      
      {postingStep === 1 && (
        <div>
          <h3 className="mb-md">{isEnglish ? 'Step 1: Basic Information (Bilingual)' : 'Step 1: 填写基本信息（中英双语）'}</h3>
          <div className="grid grid-2 gap-lg">
            <div>
              <label className="form-label">{isEnglish ? 'Job Title (Chinese)' : '职位名称（中文）'} <span className="required">*</span></label>
              <input 
                type="text" 
                className="form-input" 
                placeholder={isEnglish ? 'Enter Chinese job title' : '请输入中文职位名称'}
                value={postingForm.titleCn}
                onChange={(e) => setPostingForm(prev => ({ ...prev, titleCn: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">{isEnglish ? 'Job Title (English)' : '职位名称（英文）'} <span className="required">*</span></label>
              <input 
                type="text" 
                className="form-input" 
                placeholder={isEnglish ? 'Enter English job title' : '请输入英文职位名称'}
                value={postingForm.titleEn}
                onChange={(e) => setPostingForm(prev => ({ ...prev, titleEn: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">{isEnglish ? 'Job Description (Chinese)' : '职位描述（中文）'} <span className="required">*</span></label>
              <textarea 
                className="form-textarea" 
                placeholder={isEnglish ? 'Enter Chinese job description' : '请输入中文职位描述'}
                value={postingForm.descCn}
                onChange={(e) => setPostingForm(prev => ({ ...prev, descCn: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">{isEnglish ? 'Job Description (English)' : '职位描述（英文）'} <span className="required">*</span></label>
              <textarea 
                className="form-textarea" 
                placeholder={isEnglish ? 'Enter English job description' : '请输入英文职位描述'}
                value={postingForm.descEn}
                onChange={(e) => setPostingForm(prev => ({ ...prev, descEn: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end mt-lg">
            <button 
              onClick={() => setPostingStep(2)} 
              className="btn btn-primary"
              disabled={!postingForm.titleCn || !postingForm.titleEn}
            >
              {isEnglish ? 'Next' : '下一步'} →
            </button>
          </div>
        </div>
      )}
      
      {postingStep === 2 && (
        <div>
          <h3 className="mb-md">{isEnglish ? 'Step 2: Select RCEP Skill Tags' : 'Step 2: 选择RCEP技能标签'}</h3>
          <p className="text-secondary mb-md">
            {isEnglish 
              ? 'Select RCEP-related skills required for this position' 
              : '请选择该职位需要的RCEP相关技能标签'}
          </p>
          <div className="grid grid-4 gap-md">
            {RCEP_SKILL_TAGS.map(skill => {
              const isSelected = postingForm.selectedSkills.includes(skill.code);
              return (
                <div 
                  key={skill.code}
                  onClick={() => handlePostingSkillToggle(skill.code)}
                  className="card"
                  style={{ 
                    margin: 0, 
                    padding: '16px', 
                    cursor: 'pointer',
                    border: isSelected ? '2px solid #00897b' : '2px solid transparent',
                    background: isSelected ? '#e0f2f1' : 'white'
                  }}
                >
                  <div className="font-medium" style={{ color: isSelected ? '#00695c' : 'inherit' }}>
                    {isEnglish ? skill.nameEn : skill.name}
                  </div>
                  <div className="text-xs text-secondary">{skill.code}</div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-lg">
            <button onClick={() => setPostingStep(1)} className="btn btn-secondary">
              ← {isEnglish ? 'Previous' : '上一步'}
            </button>
            <button 
              onClick={() => setPostingStep(3)} 
              className="btn btn-primary"
              disabled={postingForm.selectedSkills.length === 0}
            >
              {isEnglish ? 'Next' : '下一步'} →
            </button>
          </div>
        </div>
      )}
      
      {postingStep === 3 && (
        <div>
          <h3 className="mb-md">{isEnglish ? 'Step 3: Policy Association' : 'Step 3: 关联政策依据'}</h3>
          <p className="text-secondary mb-md">
            {isEnglish 
              ? 'Select the applicable FTP policy for this position' 
              : '请选择该职位适用的自贸港政策依据'}
          </p>
          <div className="mb-md">
            <label className="form-label">{isEnglish ? 'Policy Basis Document No.' : '政策依据文号'}</label>
            <select 
              className="form-select"
              value={postingForm.policyRef}
              onChange={(e) => setPostingForm(prev => ({ ...prev, policyRef: e.target.value }))}
            >
              <option value="">{isEnglish ? 'Please select' : '请选择'}</option>
              <option value="财税〔2020〕31号">财税〔2020〕31号 - {isEnglish ? '15% Corporate Income Tax' : '企业所得税减按15%征收'}</option>
              <option value="财税〔2020〕32号">财税〔2020〕32号 - {isEnglish ? '15% Talent Income Tax Cap' : '高端人才个税15%优惠'}</option>
              <option value="琼办发〔2019〕41号">琼办发〔2019〕41号 - {isEnglish ? 'Talent Settlement Subsidy' : '人才落户补贴'}</option>
              <option value="琼府〔2020〕30号">琼府〔2020〕30号 - {isEnglish ? 'Foreign Work Permit Support' : '外籍人员工作便利'}</option>
            </select>
          </div>
          {postingForm.policyRef && (
            <div className="policy-box">
              <div className="policy-number">{postingForm.policyRef}</div>
              <div className="policy-title">
                {postingForm.policyRef === '财税〔2020〕31号' && (isEnglish ? '15% Corporate Income Tax' : '企业所得税减按15%征收')}
                {postingForm.policyRef === '财税〔2020〕32号' && (isEnglish ? '15% Talent Income Tax Cap' : '高端人才个税15%优惠')}
                {postingForm.policyRef === '琼办发〔2019〕41号' && (isEnglish ? 'Talent Settlement Subsidy' : '人才落户补贴')}
                {postingForm.policyRef === '琼府〔2020〕30号' && (isEnglish ? 'Foreign Work Permit Support' : '外籍人员工作便利')}
              </div>
              <div className="policy-content">
                {postingForm.policyRef === '财税〔2020〕31号' && (isEnglish 
                  ? 'Tax incentive for encouraged industry enterprises' 
                  : '鼓励类产业企业享受税收优惠，减按15%税率征收企业所得税')}
                {postingForm.policyRef === '财税〔2020〕32号' && (isEnglish 
                  ? 'Exemption for tax burden above 15% for qualified talents' 
                  : '紧缺人才个人所得税实际税负超15%部分免征')}
                {postingForm.policyRef === '琼办发〔2019〕41号' && (isEnglish 
                  ? 'Housing rental and purchase subsidies' 
                  : '住房租赁补贴/购房补贴，按人才类别给予不同标准')}
                {postingForm.policyRef === '琼府〔2020〕30号' && (isEnglish 
                  ? 'Facilitated work permits for foreign professionals' 
                  : '放宽外籍人员来琼工作许可条件，简化办理流程')}
              </div>
            </div>
          )}
          <div className="flex justify-between mt-lg">
            <button onClick={() => setPostingStep(2)} className="btn btn-secondary">
              ← {isEnglish ? 'Previous' : '上一步'}
            </button>
            <button 
              onClick={() => setPostingStep(4)} 
              className="btn btn-primary"
              disabled={!postingForm.policyRef}
            >
              {isEnglish ? 'Next' : '下一步'} →
            </button>
          </div>
        </div>
      )}
      
      {postingStep === 4 && (
        <div>
          <h3 className="mb-md">{isEnglish ? 'Step 4: Auto-subsidy Check' : 'Step 4: 补贴资格自动核验'}</h3>
          <p className="text-secondary mb-md">
            {isEnglish 
              ? 'System will automatically verify subsidy eligibility based on selected policy' 
              : '系统将根据所选政策自动核验该职位的补贴资格'}
          </p>
          
          {!postingForm.subsidyCheckResult ? (
            <div style={{ textAlign: 'center', padding: '60px', background: '#fafafa', borderRadius: '8px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <h4 className="mb-md">{isEnglish ? 'Ready for Subsidy Check' : '准备进行补贴资格核验'}</h4>
              <p className="text-secondary mb-md">
                {isEnglish 
                  ? 'Click button below to start auto-verification' 
                  : '点击下方按钮开始自动核验补贴资格'}
              </p>
              <button onClick={handleSubsidyCheck} className="btn btn-primary">
                {isEnglish ? 'Start Auto-check' : '开始自动核验'}
              </button>
            </div>
          ) : (
            <div className="card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', margin: 0 }}>
              <div className="flex items-center mb-md">
                <span style={{ fontSize: '32px', marginRight: '12px' }}>✅</span>
                <div>
                  <h4 style={{ color: '#166534', margin: 0 }}>
                    {isEnglish ? 'Subsidy Eligibility Verified' : '补贴资格核验通过'}
                  </h4>
                  <p className="text-sm text-secondary" style={{ margin: 0 }}>
                    {postingForm.subsidyCheckResult.notes}
                  </p>
                </div>
              </div>
              <div className="grid grid-2 gap-md">
                <div className="card" style={{ margin: 0, background: 'white' }}>
                  <div className="text-sm text-secondary">{isEnglish ? 'Subsidy Type' : '补贴类型'}</div>
                  <div className="font-medium mt-sm">{postingForm.subsidyCheckResult.subsidyType}</div>
                </div>
                <div className="card" style={{ margin: 0, background: 'white' }}>
                  <div className="text-sm text-secondary">{isEnglish ? 'Estimated Amount' : '预估金额'}</div>
                  <div className="font-medium mt-sm" style={{ color: '#00897b' }}>{postingForm.subsidyCheckResult.amount}</div>
                </div>
                <div className="card" style={{ margin: 0, background: 'white', gridColumn: 'span 2' }}>
                  <div className="text-sm text-secondary">{isEnglish ? 'Policy Match' : '匹配政策'}</div>
                  <div className="font-medium mt-sm">{postingForm.subsidyCheckResult.policyMatch}</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between mt-lg">
            <button onClick={() => setPostingStep(3)} className="btn btn-secondary">
              ← {isEnglish ? 'Previous' : '上一步'}
            </button>
            <button 
              onClick={() => setPostingStep(5)} 
              className="btn btn-primary"
              disabled={!postingForm.subsidyCheckResult?.eligible}
            >
              {isEnglish ? 'Next' : '下一步'} →
            </button>
          </div>
        </div>
      )}
      
      {postingStep === 5 && (
        <div>
          <h3 className="mb-md">{isEnglish ? 'Step 5: Submit for Review' : 'Step 5: 提交审核'}</h3>
          <p className="text-secondary mb-md">
            {isEnglish 
              ? 'Please review the information below before submitting' 
              : '请在提交前确认以下信息'}
          </p>
          
          <div className="card" style={{ background: '#fafafa', margin: 0 }}>
            <h4 className="mb-md">{isEnglish ? 'Posting Summary' : '发布摘要'}</h4>
            
            <div className="mb-md">
              <div className="text-sm text-secondary mb-sm">{isEnglish ? 'Basic Information' : '基本信息'}</div>
              <div className="grid grid-2 gap-sm">
                <div><span className="font-medium">{isEnglish ? 'Chinese Title:' : '中文职位：'}</span>{postingForm.titleCn}</div>
                <div><span className="font-medium">{isEnglish ? 'English Title:' : '英文职位：'}</span>{postingForm.titleEn}</div>
              </div>
            </div>
            
            <div className="mb-md">
              <div className="text-sm text-secondary mb-sm">{isEnglish ? 'RCEP Skills' : 'RCEP技能标签'}</div>
              <div>
                {postingForm.selectedSkills.map(code => {
                  const skill = RCEP_SKILL_TAGS.find(s => s.code === code);
                  return skill ? (
                    <span key={code} className="tag tag-primary">
                      {isEnglish ? skill.nameEn : skill.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
            
            <div className="mb-md">
              <div className="text-sm text-secondary mb-sm">{isEnglish ? 'Policy Basis' : '政策依据'}</div>
              <div className="badge badge-info">{postingForm.policyRef}</div>
            </div>
            
            <div>
              <div className="text-sm text-secondary mb-sm">{isEnglish ? 'Subsidy Eligibility' : '补贴资格'}</div>
              <div className="flex items-center">
                <span className="badge badge-success">{isEnglish ? 'Eligible' : '符合条件'}</span>
                <span className="ml-sm text-sm">
                  {postingForm.subsidyCheckResult?.subsidyType} - {postingForm.subsidyCheckResult?.amount}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between mt-lg">
            <button onClick={() => setPostingStep(4)} className="btn btn-secondary">
              ← {isEnglish ? 'Previous' : '上一步'}
            </button>
            <button onClick={handlePostingSubmit} className="btn btn-primary">
              {isEnglish ? 'Submit for Review' : '提交审核'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderPoliciesTab = () => (
    <div className="card">
      <h2 style={{ marginBottom: '24px' }}>{t('admin.policies')}</h2>
      <p className="text-secondary">{t('jobseeker.inDevelopment')}</p>
    </div>
  );

  const renderUsersTab = () => (
    <div className="card">
      <h2 style={{ marginBottom: '24px' }}>{t('admin.users')}</h2>
      <p className="text-secondary">{t('jobseeker.inDevelopment')}</p>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'pending': return renderPendingTab();
      case 'recordings': return renderRecordingsTab();
      case 'dataAudit': return renderDataAuditTab();
      case 'subsidyAudit': return renderSubsidyAuditTab();
      case 'postingGuide': return renderPostingGuideTab();
      case 'policies': return renderPoliciesTab();
      case 'users': return renderUsersTab();
      default: return renderOverviewTab();
    }
  };

  const getMenuItemLabel = (item) => {
    if (item.key === 'pending') {
      return item.label + ' (' + pendingJobs.length + ')';
    }
    if (item.key === 'dataAudit') {
      return item.label + ' (' + auditStats.pending + ')';
    }
    if (item.key === 'subsidyAudit') {
      const pendingSubsidy = subsidyData.filter(s => s.status === 'pending').length;
      return item.label + ' (' + pendingSubsidy + ')';
    }
    if (isEnglish) {
      const enLabels = {
        overview: 'Overview',
        pending: 'Pending Jobs',
        recordings: 'Bureau Filing',
        dataAudit: 'Data Audit',
        subsidyAudit: 'Subsidy Review',
        postingGuide: 'Posting Guide',
        policies: 'Policy Mgmt',
        users: 'User Mgmt'
      };
      let label = enLabels[item.key] || item.label;
      if (item.key === 'pending') label += ' (' + pendingJobs.length + ')';
      if (item.key === 'dataAudit') label += ' (' + auditStats.pending + ')';
      if (item.key === 'subsidyAudit') {
        const pendingSubsidy = subsidyData.filter(s => s.status === 'pending').length;
        label += ' (' + pendingSubsidy + ')';
      }
      return label;
    }
    return item.label;
  };

  return (
    <div style={{ backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
            {t('admin.title')}
          </h1>
          <p className="text-secondary">{t('admin.subtitle')}</p>
        </div>

        <div className="grid grid-4 mb-lg">
          <div className="card" style={{ background: 'linear-gradient(135deg, #00897b, #00695c)', color: 'white', padding: '24px' }}>
            <div className="text-3xl font-bold">{stats.overview.totalUsers}</div>
            <div style={{ opacity: 0.9 }}>{t('admin.totalUsers')}</div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, #ff9800, #f57c00)', color: 'white', padding: '24px' }}>
            <div className="text-3xl font-bold">{stats.overview.totalJobs}</div>
            <div style={{ opacity: 0.9 }}>{t('admin.totalJobs')}</div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, #2196f3, #1565c0)', color: 'white', padding: '24px' }}>
            <div className="text-3xl font-bold">{stats.overview.ftzSubsidyJobs}</div>
            <div style={{ opacity: 0.9 }}>{t('admin.ftzSubsidyJobs')}</div>
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg, #4caf50, #2e7d32)', color: 'white', padding: '24px' }}>
            <div className="text-3xl font-bold">{stats.overview.recordedJobs}</div>
            <div style={{ opacity: 0.9 }}>{t('admin.recordedJobs')}</div>
          </div>
        </div>

        <div className="grid grid-4">
          <div style={{ gridColumn: 'span 1' }}>
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
                <div className="font-medium">{isEnglish ? 'Menu' : '功能菜单'}</div>
              </div>
              <div style={{ padding: '16px' }}>
                {MENU_ITEMS.map(item => (
                  <div
                    key={item.key}
                    onClick={() => handleTabChange(item.key)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      marginBottom: '4px',
                      background: activeTab === item.key ? '#e0f2f1' : 'transparent',
                      color: activeTab === item.key ? '#00695c' : '#424242',
                      fontWeight: activeTab === item.key ? '600' : '400',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{ marginRight: '8px' }}>{item.icon}</span>
                    {getMenuItemLabel(item)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ gridColumn: 'span 3' }}>
            {renderTabContent()}
          </div>
        </div>
      </div>
      
      {showAuditTrailModal && selectedAuditRecord && (
        <div className="modal-overlay" onClick={() => setShowAuditTrailModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-md">
              <h3>{isEnglish ? 'Audit Trail' : '审核记录明细'}</h3>
              <button onClick={() => setShowAuditTrailModal(false)} className="btn-text">✕</button>
            </div>
            <div className="mb-md">
              <div className="font-medium">{selectedAuditRecord.titleCn}</div>
              <div className="text-xs text-secondary">{selectedAuditRecord.titleEn}</div>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="flex gap-sm">
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#2196f3', marginTop: '6px' }} />
                <div>
                  <div className="font-medium">{isEnglish ? 'Application Submitted' : '提交审核申请'}</div>
                  <div className="text-xs text-secondary">{selectedAuditRecord.submittedAt}</div>
                </div>
              </div>
              {selectedAuditRecord.auditor && (
                <div className="flex gap-sm">
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: selectedAuditRecord.status === 'approved' ? '#4caf50' : '#f44336', marginTop: '6px' }} />
                  <div>
                    <div className="font-medium">
                      {selectedAuditRecord.status === 'approved' 
                        ? (isEnglish ? 'Approved' : '审核通过') 
                        : (isEnglish ? 'Rejected' : '审核驳回')}
                    </div>
                    <div className="text-xs text-secondary">
                      {isEnglish ? 'Auditor: ' : '审核人：'}{selectedAuditRecord.auditor} · {selectedAuditRecord.auditedAt}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {showSubsidyDetailModal && selectedSubsidyRecord && (
        <div className="modal-overlay" onClick={() => setShowSubsidyDetailModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-md">
              <h3>{isEnglish ? 'Subsidy Application Details' : '补贴申请详情'}</h3>
              <button onClick={() => setShowSubsidyDetailModal(false)} className="btn-text">✕</button>
            </div>
            
            <div className="mb-md">
              <div className="font-medium text-lg">{selectedSubsidyRecord.titleCn}</div>
              <div className="text-xs text-secondary">{selectedSubsidyRecord.titleEn}</div>
            </div>
            
            <div className="divider" />
            
            <div className="grid grid-2 gap-md mb-md">
              <div>
                <div className="text-sm text-secondary">{isEnglish ? 'Subsidy Type' : '补贴类型'}</div>
                <div className="font-medium mt-sm">
                  <span className="badge badge-info">
                    {isEnglish ? selectedSubsidyRecord.subsidyTypeEn : selectedSubsidyRecord.subsidyType}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-secondary">{isEnglish ? 'Application Amount' : '申请金额'}</div>
                <div className="font-medium mt-sm text-primary">{selectedSubsidyRecord.amount}</div>
              </div>
              <div>
                <div className="text-sm text-secondary">{isEnglish ? 'Applicant Company' : '申请企业'}</div>
                <div className="font-medium mt-sm">{selectedSubsidyRecord.company}</div>
              </div>
              <div>
                <div className="text-sm text-secondary">{isEnglish ? 'Status' : '审核状态'}</div>
                <div className="font-medium mt-sm">
                  <span className={'badge ' + getSubsidyStatusBadge(selectedSubsidyRecord.status).class}>
                    {getSubsidyStatusBadge(selectedSubsidyRecord.status).text}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mb-md">
              <div className="text-sm text-secondary mb-sm">{isEnglish ? 'Policy Basis' : '政策依据'}</div>
              <div className="policy-box">
                <div className="policy-number">{selectedSubsidyRecord.policyBasis}</div>
                <div className="policy-title">
                  {selectedSubsidyRecord.policyBasis === '财税〔2020〕31号' && (isEnglish ? '15% Corporate Income Tax' : '企业所得税减按15%征收')}
                  {selectedSubsidyRecord.policyBasis === '财税〔2020〕32号' && (isEnglish ? '15% Talent Income Tax Cap' : '高端人才个税15%优惠')}
                  {selectedSubsidyRecord.policyBasis === '琼办发〔2019〕41号' && (isEnglish ? 'Talent Settlement Subsidy' : '人才落户补贴')}
                  {selectedSubsidyRecord.policyBasis === '琼人社发〔2021〕100号' && (isEnglish ? 'Social Security Subsidy' : '社保补贴')}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-sm">
              <button onClick={() => setShowSubsidyDetailModal(false)} className="btn btn-secondary">
                {t('common.close')}
              </button>
              {selectedSubsidyRecord.status === 'pending' && (
                <>
                  <button onClick={() => {
                    handleApproveSubsidy(selectedSubsidyRecord);
                    setShowSubsidyDetailModal(false);
                  }} className="btn btn-success">
                    {isEnglish ? 'Approve' : '通过'}
                  </button>
                  <button onClick={() => {
                    handleRejectSubsidy(selectedSubsidyRecord);
                    setShowSubsidyDetailModal(false);
                  }} className="btn btn-danger">
                    {isEnglish ? 'Reject' : '驳回'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {showFilingAuditRecordsModal && selectedFilingAuditRecord && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowFilingAuditRecordsModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div 
            className="modal-content card" 
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <div className="flex justify-between items-center mb-md">
              <h3>{isEnglish ? 'Filing Audit Records' : '备案复核记录'}</h3>
              <button onClick={() => setShowFilingAuditRecordsModal(false)} className="btn-text" style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9e9e9e' }}>✕</button>
            </div>
            <div className="mb-md">
              <div className="font-medium">{selectedFilingAuditRecord.titleCn}</div>
              <div className="text-xs text-secondary">{selectedFilingAuditRecord.titleEn}</div>
              <div className="text-sm text-secondary mt-sm">
                {isEnglish ? 'Position No.: ' : '岗位备案编号：'}{selectedFilingAuditRecord.positionNo}
              </div>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedFilingAuditRecord.auditRecords?.map((record, idx) => (
                <div key={idx} className="flex gap-sm">
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: idx === 0 ? '#2196f3' : idx === selectedFilingAuditRecord.auditRecords.length - 1 ? '#4caf50' : '#ff9800', marginTop: '6px' }} />
                  <div>
                    <div className="font-medium">{record.action}</div>
                    <div className="text-xs text-secondary">
                      {isEnglish ? 'Operator: ' : '操作人：'}{record.operator} · {record.time}
                    </div>
                    {record.remark && (
                      <div className="text-sm text-secondary mt-sm">{record.remark}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="flex justify-end mt-md">
              <button onClick={() => setShowFilingAuditRecordsModal(false)} className="btn btn-secondary">
                {isEnglish ? 'Close' : '关闭'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showChecklistModal && selectedChecklistRecord && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowChecklistModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div 
            className="modal-content card" 
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '700px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <div className="flex justify-between items-center mb-md">
              <h3>{isEnglish ? 'Position Level Audit Checklist' : '岗位级复查清单'}</h3>
              <button onClick={() => setShowChecklistModal(false)} className="btn-text" style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#9e9e9e' }}>✕</button>
            </div>
            <div className="mb-md">
              <div className="font-medium text-lg">{selectedChecklistRecord.titleCn}</div>
              <div className="text-xs text-secondary">{selectedChecklistRecord.titleEn}</div>
              <div className="flex gap-sm mt-sm flex-wrap">
                <span className="text-sm text-secondary">
                  {isEnglish ? 'Position No.: ' : '岗位编号：'}{selectedChecklistRecord.positionNo}
                </span>
                <span className="text-sm text-secondary">
                  {isEnglish ? 'Audit Level: ' : '审核级别：'}{getAuditLevelBadge(selectedChecklistRecord.auditLevel).text}
                </span>
              </div>
            </div>
            <div className="divider" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {generateChecklist(selectedChecklistRecord).map((item, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid ' + (item.checked ? '#a5d6a7' : '#ef9a9a'),
                    background: item.checked ? '#f1f8e9' : '#ffebee',
                  }}
                >
                  <div className="flex justify-between items-start gap-sm">
                    <div className="flex items-center gap-sm">
                      <span style={{ fontSize: '18px' }}>{item.checked ? '✅' : '❌'}</span>
                      <span className="font-medium">{item.item}</span>
                    </div>
                    <span className={'badge ' + (item.checked ? 'badge-success' : 'badge-danger')}>
                      {item.checked ? (isEnglish ? 'PASS' : '通过') : (isEnglish ? 'FAIL' : '不通过')}
                    </span>
                  </div>
                  {item.remark && (
                    <div className="text-sm text-secondary mt-sm ml-lg">
                      {item.remark}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="flex justify-between mt-md">
              <div className="text-sm text-secondary">
                {isEnglish ? 'Total: ' : '总计：'}
                {generateChecklist(selectedChecklistRecord).filter(i => i.checked).length}/{generateChecklist(selectedChecklistRecord).length} {isEnglish ? 'items passed' : '项通过'}
              </div>
              <button onClick={() => setShowChecklistModal(false)} className="btn btn-primary">
                {isEnglish ? 'Close' : '关闭'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}