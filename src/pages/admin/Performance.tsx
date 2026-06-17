import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Card, Table, Tag, Select, DatePicker, Button, Space, Statistic, Row, Col,
  Progress, List, Avatar, Tooltip, Divider, Empty, Badge, Steps, Timeline, Modal, Popover, Tabs,
} from 'antd';
import {
  BarChart3, TrendingUp, Clock, XCircle, Filter, RefreshCw, ArrowUp, ArrowDown, ArrowRight,
  Trophy, FileWarning, GitBranch, FileCheck2, ShieldAlert, FileKey, FileSearch,
  Network, AlertTriangle, CheckCircle2, Database, Zap, FileText, Users, Info,
  Bell, Eye, Send, HandPlatter, Bot, CreditCard,
} from 'lucide-react';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import { mockPerformanceData, mockDepartments } from '../../mock/data';
import type { PerformanceData, Department } from '../../shared/types';

const { RangePicker } = DatePicker;
const { Option } = Select;

const SERVICE_TYPES = [
  { value: 'all', label: '全部事项类型' },
  { value: '社会保障', label: '社会保障' },
  { value: '户籍管理', label: '户籍管理' },
  { value: '医疗卫生', label: '医疗卫生' },
  { value: '住房建设', label: '住房建设' },
  { value: '市场监管', label: '市场监管' },
  { value: '税务服务', label: '税务服务' },
  { value: '民政服务', label: '民政服务' },
  { value: '交通运输', label: '交通运输' },
  { value: '教育服务', label: '教育服务' },
  { value: '生态环境', label: '生态环境' },
  { value: '农业农村', label: '农业农村' },
  { value: '自然资源', label: '自然资源' },
];

const CHANNELS = [
  { value: 'all', label: '全部办理渠道' },
  { value: 'online', label: '掌上办事（APP）' },
  { value: 'web', label: '政务服务网（PC）' },
  { value: 'hall', label: '政务大厅（线下）' },
  { value: 'self', label: '自助终端' },
  { value: 'cross', label: '跨域协同办件' },
];

const REJECTION_CATEGORIES = [
  { value: 'all', label: '全部退件原因' },
  { value: 'material', label: '材料不齐全/不规范' },
  { value: 'condition', label: '不符合办理条件' },
  { value: 'info', label: '填写信息有误' },
  { value: 'policy', label: '政策适配失败' },
  { value: 'cert', label: '电子证照缺失' },
];

const CROSS_SCENARIOS = [
  { value: 'all', label: '全部协同场景' },
  { value: 'province', label: '省内通办' },
  { value: 'cross_province', label: '跨省通办' },
  { value: 'city', label: '市域通办' },
  { value: 'one_thing', label: '一件事联办' },
  { value: 'department', label: '部门协办' },
];

const CHANNEL_COLORS: Record<string, string> = {
  online: '#165DFF',
  web: '#722ED1',
  hall: '#FF7D00',
  self: '#00B42A',
  cross: '#F53F3F',
};

const generateDepartmentRanking = () => {
  return mockDepartments.map((dept: Department, index: number) => {
    const baseRate = 82 + Math.random() * 17;
    const baseTime = 18 + Math.random() * 42;
    const totalApps = Math.floor(Math.random() * 3500) + 600;
    const rejectionRate = Math.random() * 6 + 0.5;
    const certCalls = Math.floor(Math.random() * 2000) + 300;
    const subsidyMatch = Math.floor(Math.random() * 500) + 20;
    const crossCases = Math.floor(Math.random() * 800) + 50;

    return {
      id: dept.id,
      name: dept.name,
      code: dept.code,
      completionRate: Math.round(baseRate * 10) / 10,
      avgHandlingTime: Math.round(baseTime * 10) / 10,
      totalApplications: totalApps,
      rejectionRate: Math.round(rejectionRate * 10) / 10,
      certCalls,
      subsidyMatch,
      crossCases,
      rank: index + 1,
    };
  }).sort((a, b) => b.completionRate - a.completionRate).map((item, index) => ({ ...item, rank: index + 1 }));
};

const REJECTION_CLUSTER_INSIGHTS = [
  {
    level: 'high',
    title: '材料不齐全高风险预警',
    desc: '住建、人社部门近7天"材料缺失"退件环比上升23%，集中在公积金提取、社保转移事项，建议更新办事指南并增加AI预填引导。',
    affected: ['住房和城乡建设厅', '人力资源和社会保障厅'],
    suggestion: '更新办事指南 + AI材料预检',
    relatedModule: null as string | null,
    relatedAction: null as string | null,
    recheckData: {
      totalCases: 234,
      items: [
        { serviceName: '公积金提取（购房）', cases: 128, completionRateBefore: 68, completionRateAfter: 92, avgTimeBefore: 5.2, avgTimeAfter: 2.8 },
        { serviceName: '社保关系跨省转移', cases: 106, completionRateBefore: 72, completionRateAfter: 94, avgTimeBefore: 7.1, avgTimeAfter: 3.5 },
      ],
    },
  },
  {
    level: 'medium',
    title: '政策适配异常',
    desc: '农业农村厅涉农补贴事项因政策规则引擎参数未同步，导致18件符合条件申请被误退，已通知政策适配中心紧急校准。',
    affected: ['农业农村厅'],
    suggestion: '政策规则引擎紧急校准',
    relatedModule: 'policy' as const,
    relatedAction: '前往政策引擎校准规则参数',
    recheckData: {
      totalCases: 18,
      items: [
        { serviceName: '涉农补贴自动匹配', cases: 18, completionRateBefore: 0, completionRateAfter: 100, avgTimeBefore: 0, avgTimeAfter: 0.5 },
      ],
    },
  },
  {
    level: 'medium',
    title: '电子证照互认不足',
    desc: '公安厅户籍类事项调用电子结婚证、电子出生证成功率仅76%，卫健、民政部门证照库接口偶发超时，需通知容灾中心切换缓存。',
    affected: ['公安厅', '卫生健康委员会', '民政局'],
    suggestion: '切换证照缓存容灾通道',
    relatedModule: 'disaster' as const,
    relatedAction: '前往容灾中心切换缓存通道',
    recheckData: {
      totalCases: 156,
      items: [
        { serviceName: '户籍类事项（跨省）', cases: 97, completionRateBefore: 56, completionRateAfter: 91, avgTimeBefore: 8.3, avgTimeAfter: 3.2 },
        { serviceName: '新生儿出生登记', cases: 59, completionRateBefore: 62, completionRateAfter: 95, avgTimeBefore: 6.5, avgTimeAfter: 2.4 },
      ],
    },
  },
  {
    level: 'low',
    title: '表单信息填写规范',
    desc: '市监、税务部门企业开办事项"统一社会信用代码"填写错误率约3.2%，建议增加格式自动校验和企业信息自动回填。',
    affected: ['市场监督管理局', '税务局'],
    suggestion: '增加格式校验 + 企业信息回填',
    relatedModule: null as string | null,
    relatedAction: null as string | null,
    recheckData: {
      totalCases: 91,
      items: [
        { serviceName: '企业开办（公司设立）', cases: 91, completionRateBefore: 81, completionRateAfter: 97, avgTimeBefore: 3.2, avgTimeAfter: 1.1 },
      ],
    },
  },
];

const DISPOSAL_RECORDS = [
  {
    module: 'policy' as const,
    action: '政策规则引擎参数已校准',
    detail: '涉农补贴匹配规则已同步至最新版本，18件误退申请已自动重新受理',
    handler: '政策适配中心-赵工程师',
    time: '2026-06-16 11:30',
    status: 'verified' as const,
    beforeMetrics: { matchRate: 82.3, errorCount: 18, affectedItems: '涉农补贴、稳岗返还、育儿津贴' },
    afterMetrics: { matchRate: 97.8, errorCount: 0, affectedItems: '全部3项补贴规则已校准' },
    verificationEvidence: [
      { label: '规则版本', before: 'v2.1.3（过期）', after: 'v2.3.1（最新）' },
      { label: '参数差异', before: '收入阈值8000元', after: '收入阈值12000元' },
      { label: '18件重新受理', before: '误退状态', after: '已自动重新受理，其中15件已办结' },
      { label: '校准确认人', before: '-', after: '政策适配中心-赵工程师 + 农业农村厅-周科长' },
    ],
    verificationData: {
      ruleName: '涉农补贴-年龄阈值校准',
      beforeValue: 'age<=30 触发补贴',
      afterValue: 'age<=35 触发补贴',
      affectedCountBefore: 18,
      affectedCountAfter: 0,
      passRateBefore: 72,
      passRateAfter: 98,
      reAcceptedCount: 18,
      verifier: '省大数据中心-李审计',
      verifyTime: '2026-06-16 15:20',
    },
  },
  {
    module: 'disaster' as const,
    action: '证照缓存容灾通道已切换',
    detail: '民政部门证照库接口已切换至缓存通道，结婚证/出生证调用成功率恢复至98.5%',
    handler: '容灾中心-孙运维',
    time: '2026-06-16 10:45',
    status: 'verified' as const,
    beforeMetrics: { callSuccessRate: 76.0, avgResponseTime: 8500, failCount: 113 },
    afterMetrics: { callSuccessRate: 98.5, avgResponseTime: 230, failCount: 3 },
    verificationEvidence: [
      { label: '接口通道', before: '民政证照库直连（故障）', after: '容灾缓存通道（正常）' },
      { label: '结婚证调用', before: '成功率68.2%', after: '成功率99.1%' },
      { label: '出生证调用', before: '超时率31.8%', after: '超时率0.4%' },
      { label: '切换确认人', before: '-', after: '容灾中心-孙运维 + 电子证照中心-钱工程师' },
    ],
    verificationData: {
      ruleName: '民政证照库-缓存通道切换',
      beforeValue: '主通道（接口超时率24%）',
      afterValue: '缓存容灾通道（超时率1.5%）',
      affectedCountBefore: 2156,
      affectedCountAfter: 138,
      passRateBefore: 76,
      passRateAfter: 98.5,
      reAcceptedCount: 156,
      verifier: '容灾中心-周总监',
      verifyTime: '2026-06-16 14:10',
    },
  },
  {
    module: 'cert' as const,
    action: '电子证照互认接口已修复',
    detail: '卫健系统凌晨维护窗口后证照接口已恢复，出生证调用超时问题已解决',
    handler: '电子证照中心-钱工程师',
    time: '2026-06-16 06:15',
    status: 'accepted' as const,
    beforeMetrics: { certCallSuccess: 89.3, timeoutCount: 47, affectedDepts: '公安厅、卫健委、民政局' },
    afterMetrics: { certCallSuccess: 98.8, timeoutCount: 2, affectedDepts: '全部恢复正常' },
    verificationEvidence: [
      { label: '维护窗口', before: '01:00-06:00（接口不可用）', after: '06:15接口已恢复并验证' },
      { label: '出生证调用', before: '凌晨超时47次', after: '恢复后超时2次（正常范围）' },
      { label: '缓存一致性', before: '缓存过期', after: '已重新同步最新证照数据' },
      { label: '修复确认人', before: '-', after: '电子证照中心-钱工程师 + 卫健委-王工程师' },
    ],
    verificationData: {
      ruleName: '卫健证照接口-重启恢复',
      beforeValue: '服务不可用（超时100%）',
      afterValue: '服务恢复正常（超时率<0.1%）',
      affectedCountBefore: 43,
      affectedCountAfter: 0,
      passRateBefore: 0,
      passRateAfter: 99.9,
      reAcceptedCount: 43,
      verifier: '待确认',
      verifyTime: '-',
    },
  },
];

const HANDLING_CHAINS = [
  {
    id: 'hc1',
    service: '新生儿出生"一件事"联办',
    citizen: '李某某',
    applyTime: '2026-06-15 09:32:18',
    status: 'processing',
    currentStep: 6,
    steps: [
      { title: '群众提交', time: '06-15 09:32', dept: '掌上办事APP', status: 'done', desc: '在线提交出生医学证明+父母身份证，AI自动回填新生儿信息' },
      { title: '卫健证照核验', time: '06-15 09:35', dept: '卫生健康委员会', status: 'done', desc: '调用电子证照库：出生医学证明核验通过，签发人：王医师' },
      { title: '公安户口登记', time: '06-15 09:41', dept: '公安厅', status: 'done', desc: '出生登记办理完成，户口登记地：朝阳区xxx派出所，登记人：张民警' },
      { title: '户口簿制发', time: '06-15 10:15', dept: '公安厅', status: 'done', desc: '电子户口簿已生成并推送至电子证照中心，家长可在"我的证照"查看' },
      { title: '医保参保登记', time: '06-15 10:45', dept: '人力资源和社会保障厅', status: 'done', desc: '少儿医保自动参保完成，参保档：一档，医保号已关联身份证号' },
      { title: '社保卡申领', time: '06-15 11:20', dept: '人力资源和社会保障厅', status: 'processing', desc: '社保卡已制发中，预计2个工作日邮寄至预留地址，短信推送至家长手机' },
      { title: '民政补贴推送', time: '待处理', dept: '民政局', status: 'pending', desc: '育儿补贴政策自动匹配：一次性育儿津贴3000元+每月500元连续发放至3岁' },
    ],
    pushNotifications: [
      { channel: 'APP站内信', time: '06-15 09:36', content: '出生医学证明核验通过，已进入公安登记环节', status: 'sent' },
      { channel: '手机短信', time: '06-15 10:16', content: '【政务中台】李某某户口登记已完成，电子户口簿已生成', status: 'sent' },
      { channel: '手机短信', time: '06-15 10:46', content: '【政务中台】医保参保登记完成，医保号关联至新生儿身份证', status: 'sent' },
      { channel: '邮件通知', time: '06-15 11:21', content: '社保卡申领进度通知：已制发中，2工作日邮寄送达', status: 'sent' },
      { channel: '人工电话', time: '-', content: '育儿补贴发放确认（待民政审核后触发）', status: 'pending' },
    ],
  },
  {
    id: 'hc2',
    service: '企业开办"一网通办"',
    citizen: '某科技有限公司',
    applyTime: '2026-06-15 14:08:55',
    status: 'warning',
    currentStep: 2,
    steps: [
      { title: '企业提交', time: '06-15 14:09', dept: '政务服务网', status: 'done', desc: '提交工商注册+税务登记+银行开户+社保开户，AI预检表单并自动回填23项信息' },
      { title: '市监工商登记', time: '06-15 14:12', dept: '市场监督管理局', status: 'warning', desc: '经营地址需补充材料（房屋租赁合同第3页缺失），已通过短信+站内信推送补正通知，补正期限7天' },
      { title: '税务税务登记', time: '待补正', dept: '税务局', status: 'pending', desc: '等待市监证照同步后自动登记，增值税纳税人类型预判定为小规模纳税人' },
      { title: '银行开户预约', time: '待补正', dept: '建设银行', status: 'pending', desc: '预约对公账户开户（建行朝阳支行），预约号：YH20260615-8821，法定代表人面签时间待确认' },
      { title: '社保公积金开户', time: '待补正', dept: '人力资源和社会保障厅', status: 'pending', desc: '企业社保账户+公积金账户自动开立，首月缴费基数已按最低档预填' },
      { title: '印章刻制备案', time: '待补正', dept: '公安局', status: 'pending', desc: '公章、财务章、法人章刻制备案，已匹配本地正规刻章机构（立等可取）' },
      { title: '发票票种核定', time: '待补正', dept: '税务局', status: 'pending', desc: '增值税普通发票票种核定，首次申领份数25份，开票限额10万元版' },
    ],
    pushNotifications: [
      { channel: 'APP站内信', time: '06-15 14:10', content: '企业开办申请已提交，市监部门正在审核中', status: 'sent' },
      { channel: '手机短信', time: '06-15 14:13', content: '【政务中台】经营地址材料需补正，请于7天内补充房屋租赁合同第3页', status: 'sent' },
      { channel: '邮件通知', time: '06-15 14:13', content: '补正材料清单及操作指引已发送至法定代表人邮箱', status: 'sent' },
      { channel: '人工电话', time: '-', content: '超期提醒（2天后触发）', status: 'pending' },
    ],
  },
  {
    id: 'hc3',
    service: '跨省户口迁移（京津冀通办）',
    citizen: '张某某',
    applyTime: '2026-06-14 16:45:02',
    status: 'done',
    currentStep: 7,
    steps: [
      { title: '迁入申请', time: '06-14 16:45', dept: '掌上办事APP', status: 'done', desc: '跨省户口迁移申请，选择京津冀通办通道，AI智能匹配迁移政策并预填8项信息' },
      { title: '迁入地受理', time: '06-14 17:02', dept: '公安厅（北京）', status: 'done', desc: '受理通过，调用跨省协同接口通知迁出地，电子材料已传至河北公安系统' },
      { title: '迁出地核验', time: '06-15 08:31', dept: '公安厅（河北）', status: 'done', desc: '户籍信息核验通过，电子证照调阅完成（身份证、户口簿、结婚证），迁出地所长已签字确认' },
      { title: '公安户口核准', time: '06-15 10:18', dept: '公安厅（北京）', status: 'done', desc: '户口迁入核准完成，朝阳区xxx派出所为登记地，户籍警：刘警官' },
      { title: '户口簿制发', time: '06-15 10:45', dept: '公安厅（北京）', status: 'done', desc: '新户口簿已制作完成，电子户口簿同步推送至电子证照中心，可在"我的证照"查看' },
      { title: '证照同步更新', time: '06-15 11:05', dept: '多部门同步', status: 'done', desc: '身份证信息、居住证、社保、医保、公积金、不动产登记等12项信息已联动更新' },
      { title: '通知送达闭环', time: '06-15 11:20', dept: '统一消息中心', status: 'done', desc: '全流程办结通知已通过APP站内信+短信+邮件推送，办理满意度调查已发送' },
    ],
    pushNotifications: [
      { channel: 'APP站内信', time: '06-14 17:03', content: '您的跨省户口迁移申请已被北京公安受理，已通知河北迁出地', status: 'sent' },
      { channel: '手机短信', time: '06-15 08:32', content: '【政务中台】河北公安已完成户籍信息核验，迁入核准进行中', status: 'sent' },
      { channel: '手机短信', time: '06-15 10:46', content: '【政务中台】恭喜！您的户口迁移已完成，电子户口簿已生成', status: 'sent' },
      { channel: '邮件通知', time: '06-15 11:21', content: '京津冀通办全流程办结报告及电子证照已发送至您的邮箱', status: 'sent' },
    ],
  },
];

const REJECTION_BREAKDOWN = Array.from({ length: 50 }, (_, i) => {
  const services = ['公积金提取', '社保转移', '新生儿登记', '企业开办', '户口迁移', '不动产登记', '涉农补贴', '居住证办理', '身份证换领', '营业执照变更'];
  const depts = ['住房和城乡建设厅', '人力资源和社会保障厅', '公安厅', '市场监督管理局', '自然资源厅', '农业农村厅', '卫生健康委员会'];
  const reasons = ['材料不齐全', '政策适配异常', '证照互认失败', '填写信息错误', '不符合条件'];
  const reacceptStatus = ['已重新受理', '补正中', '待处理', '已办结'];
  const applicants = ['王某某', '李某某', '张某某', '赵某某', '刘某某', '陈某某', '杨某某', '黄某某', '周某某', '吴某某', '郑某某', '孙某某'];
  const svc = services[i % services.length];
  const dpt = depts[i % depts.length];
  const reason = reasons[i % reasons.length];
  const status = reacceptStatus[i % reacceptStatus.length];
  const countMap: Record<string, number> = { '材料不齐全': 234, '政策适配异常': 18, '证照互认失败': 156, '填写信息错误': 67, '不符合条件': 24 };

  return {
    key: String(i + 1),
    rejectNo: `RJ2026-${String(3847 + i).padStart(5, '0')}`,
    serviceName: svc,
    applicant: applicants[i % applicants.length],
    department: dpt,
    rejectReason: reason,
    reasonCategory: reason,
    totalCategory: countMap[reason] || 0,
    correctionRequired: reason === '材料不齐全' ? [
      { name: '购房合同原件', detail: '模糊需重新上传' },
      { name: '首付款发票', detail: '收据不合法需正式发票' },
    ] : reason === '政策适配异常' ? [
      { name: '政策规则参数', detail: '年龄阈值校准' },
    ] : reason === '证照互认失败' ? [
      { name: '电子结婚证', detail: '民政接口超时需重试' },
    ] : [],
    reacceptStatus: status,
    timeBefore: Math.floor(Math.random() * 8 + 2),
    timeAfter: status === '已办结' ? Math.floor(Math.random() * 3 + 0.5) : status === '已重新受理' ? Math.floor(Math.random() * 2 + 1) : '-',
    reacceptedAt: status === '已办结' || status === '已重新受理' ? `06-${10 + (i % 6)} ${String(8 + (i % 10)).padStart(2, '0')}:${String(12 + (i % 40)).padStart(2, '0')}` : '-',
    impactCompletion: (Math.random() * 15 + 3).toFixed(1),
  };
});

const MATERIAL_CORRECTION_CASES = [
  {
    id: 'mc1',
    service: '公积金提取（购房）',
    applicant: '王某某',
    department: '住房和城乡建设厅',
    submitTime: '2026-06-16 10:23',
    rejectTime: '2026-06-16 11:08',
    fixDeadline: '2026-06-23 23:59',
    missingItems: [
      { name: '购房合同原件扫描件', reason: '模糊不清，请重新上传清晰版本', status: 'pending' },
      { name: '首付款发票', reason: '上传的收据不具备法律效力，请提供正式发票', status: 'pending' },
    ],
    pushStatus: [
      { channel: 'APP站内信', status: 'sent', time: '11:09:02' },
      { channel: '手机短信', status: 'sent', time: '11:09:05' },
      { channel: '邮件通知', status: 'sent', time: '11:09:07' },
      { channel: '人工电话', status: 'pending', time: '-' },
    ],
  },
  {
    id: 'mc2',
    service: '食品经营许可证核发',
    applicant: '某餐饮管理公司',
    department: '市场监督管理局',
    submitTime: '2026-06-15 15:41',
    rejectTime: '2026-06-16 09:17',
    fixDeadline: '2026-06-22 23:59',
    missingItems: [
      { name: '从业人员健康证明', reason: '健康证已过期，请上传最新版本（有效期内）', status: 'pending' },
    ],
    pushStatus: [
      { channel: 'APP站内信', status: 'sent', time: '09:17:33' },
      { channel: '手机短信', status: 'sent', time: '09:17:36' },
      { channel: '邮件通知', status: 'sent', time: '09:17:39' },
      { channel: '人工电话', status: 'sent', time: '09:25:12' },
    ],
  },
  {
    id: 'mc3',
    service: '灵活就业人员社保参保',
    applicant: '李某某',
    department: '人力资源和社会保障厅',
    submitTime: '2026-06-16 08:52',
    rejectTime: '2026-06-16 09:34',
    fixDeadline: '2026-06-30 23:59',
    missingItems: [
      { name: '居住证明', reason: '电子居住证调用失败，请手动上传居住证明材料', status: 'done' },
      { name: '身份证正反面', reason: '上传成功但仅正面，请补充反面', status: 'pending' },
    ],
    pushStatus: [
      { channel: 'APP站内信', status: 'sent', time: '09:34:11' },
      { channel: '手机短信', status: 'sent', time: '09:34:14' },
      { channel: '邮件通知', status: 'failed', time: '09:34:18' },
      { channel: '人工电话', status: 'sent', time: '09:40:03' },
    ],
  },
];

const LEDGER_SERVICES = [
  '住房公积金提取（购房）', '居住证签注', '社保关系跨省转移',
  '食品经营许可证核发', '户口迁移（跨省）', '医保异地就医备案',
  '新生儿出生登记', '营业执照变更', '不动产登记',
  '纳税申报（增值税）', '婚姻登记预约', '道路运输经营许可',
  '建房审批', '再生育审批', '排污许可',
];

const LEDGER_NODES = ['材料审核', '信息核验', '跨区协办', '现场核查', '审批签发', '部门会签', '领导审批', '系统处理', '证照核验', '材料预审', '受理登记', '结果送达', '材料审核', '信息核验', '审批签发'];

const LEDGER_PERSONS = ['张主任', '李科长', '王副主任', '赵科员', '孙所长', '周处长', '吴主管', '郑科长', '钱干事', '冯书记', '陈主任', '许组长', '韩科长', '曹主任', '魏处长'];

const LEDGER_APPLICANTS = ['王某某', '李某某', '张某某', '赵某某', '刘某某', '陈某某', '杨某某', '黄某某', '周某某', '吴某某', '郑某某', '孙某某', '马某某', '朱某某', '何某某'];

const LEDGER_STATUSES = ['办理中', '审核中', '补正中', '即将超期', '办理中', '审核中', '办理中', '即将超期', '补正中', '办理中', '审核中', '办理中', '审核中', '办理中', '即将超期'];

const LEDGER_ELAPSED = [12, 8, 36, 72, 5, 18, 24, 96, 48, 3, 15, 6, 20, 10, 84];

const LEDGER_RECORDS = [
  {
    key: '1', applyNo: '2026-BS-0031', serviceName: '住房公积金提取购房', applicant: '王某某', department: '住房和城乡建设厅', currentNode: '材料审核', nodePerson: '张主任', status: '办理中', elapsed: 12,
    certCalls: [{certName:'居民身份证',callTime:'06-16 10:25',status:'success' as const,dept:'住建厅'},{certName:'电子结婚证',callTime:'06-16 10:26',status:'failed' as const,dept:'民政局'}],
    rejectionReason: {mainReason:'材料不齐全',subReasons:['购房合同模糊','缺少首付款发票'],affectedDept:'住房和城乡建设厅'},
    pushStatus: [{channel:'APP站内信',sent:true,time:'10:26:03'},{channel:'短信',sent:true,time:'10:26:05'},{channel:'邮件',sent:false,time:'-'},{channel:'人工电话',sent:true,time:'10:35:12'}],
    signTrail: [{dept:'住建厅',signer:'张主任',signTime:'06-16 10:23',status:'signed' as const},{dept:'自然资源厅',signer:'-',signTime:'-',status:'pending' as const}],
    correctionItems: [{name:'购房合同原件',reason:'模糊不清请重新上传',status:'pending' as const},{name:'首付款发票',reason:'收据不具备法律效力',status:'pending' as const}],
  },
  {
    key: '2', applyNo: '2026-BS-0032', serviceName: '低保申请', applicant: '李某某', department: '民政局', currentNode: '信息核验', nodePerson: '李科长', status: '审核中', elapsed: 8,
    certCalls: [{certName:'居民身份证',callTime:'06-16 09:10',status:'success' as const,dept:'公安局'},{certName:'低保证明',callTime:'06-16 09:12',status:'success' as const,dept:'民政局'},{certName:'残疾证',callTime:'06-16 09:13',status:'timeout' as const,dept:'残联'}],
    rejectionReason: null,
    pushStatus: [{channel:'APP站内信',sent:true,time:'09:12:40'},{channel:'短信',sent:true,time:'09:12:43'},{channel:'邮件',sent:true,time:'09:12:46'},{channel:'人工电话',sent:false,time:'-'}],
    signTrail: [{dept:'民政局',signer:'李科长',signTime:'06-16 09:15',status:'signed' as const},{dept:'财政局',signer:'-',signTime:'-',status:'pending' as const}],
    correctionItems: [],
  },
  {
    key: '3', applyNo: '2026-BS-0033', serviceName: '户口迁移', applicant: '张某某', department: '公安厅', currentNode: '跨区协办', nodePerson: '王副主任', status: '补正中', elapsed: 36,
    certCalls: [{certName:'居民身份证',callTime:'06-15 14:20',status:'success' as const,dept:'公安局'},{certName:'户口簿',callTime:'06-15 14:21',status:'success' as const,dept:'公安局'},{certName:'房产证',callTime:'06-15 14:22',status:'failed' as const,dept:'自然资源厅'}],
    rejectionReason: {mainReason:'填写信息有误',subReasons:['迁入地址与房产证地址不一致','联系人电话格式错误'],affectedDept:'公安厅'},
    pushStatus: [{channel:'APP站内信',sent:true,time:'14:22:10'},{channel:'短信',sent:true,time:'14:22:13'},{channel:'邮件',sent:false,time:'-'},{channel:'人工电话',sent:true,time:'14:45:30'}],
    signTrail: [{dept:'公安厅（迁出地）',signer:'王副主任',signTime:'06-15 14:25',status:'signed' as const},{dept:'公安厅（迁入地）',signer:'-',signTime:'-',status:'timeout' as const}],
    correctionItems: [{name:'房产证原件',reason:'房产证信息与系统登记不一致',status:'pending' as const},{name:'迁移原因说明',reason:'需补充详细迁移原因',status:'done' as const}],
  },
  {
    key: '4', applyNo: '2026-BS-0034', serviceName: '营业执照变更', applicant: '赵某某', department: '市场监督管理局', currentNode: '现场核查', nodePerson: '赵科员', status: '即将超期', elapsed: 72,
    certCalls: [{certName:'电子营业执照',callTime:'06-14 11:05',status:'success' as const,dept:'市监局'},{certName:'法人身份证',callTime:'06-14 11:06',status:'success' as const,dept:'公安局'}],
    rejectionReason: {mainReason:'材料不齐全/不规范',subReasons:['股东会决议缺少签章','章程修正案格式不规范'],affectedDept:'市场监督管理局'},
    pushStatus: [{channel:'APP站内信',sent:true,time:'11:06:20'},{channel:'短信',sent:false,time:'-'},{channel:'邮件',sent:true,time:'11:06:25'},{channel:'人工电话',sent:true,time:'11:30:15'}],
    signTrail: [{dept:'市监局',signer:'赵科员',signTime:'06-14 11:10',status:'signed' as const},{dept:'税务局',signer:'钱干事',signTime:'06-14 14:30',status:'signed' as const},{dept:'公安局',signer:'-',signTime:'-',status:'pending' as const}],
    correctionItems: [{name:'股东会决议原件',reason:'需全体股东签字盖章',status:'pending' as const},{name:'章程修正案',reason:'修正案未加盖公章',status:'pending' as const}],
  },
  {
    key: '5', applyNo: '2026-BS-0035', serviceName: '社保转移接续', applicant: '刘某某', department: '人力资源和社会保障厅', currentNode: '审批签发', nodePerson: '孙所长', status: '办理中', elapsed: 5,
    certCalls: [{certName:'居民身份证',callTime:'06-16 08:30',status:'success' as const,dept:'人社厅'},{certName:'社保缴费记录',callTime:'06-16 08:31',status:'success' as const,dept:'人社厅'}],
    rejectionReason: null,
    pushStatus: [{channel:'APP站内信',sent:true,time:'08:31:15'},{channel:'短信',sent:true,time:'08:31:18'},{channel:'邮件',sent:true,time:'08:31:20'},{channel:'人工电话',sent:false,time:'-'}],
    signTrail: [{dept:'人社厅（转出地）',signer:'孙所长',signTime:'06-16 08:35',status:'signed' as const},{dept:'人社厅（转入地）',signer:'-',signTime:'-',status:'pending' as const}],
    correctionItems: [],
  },
  {
    key: '6', applyNo: '2026-BS-0036', serviceName: '新生儿出生登记', applicant: '陈某某', department: '卫生健康委员会', currentNode: '部门会签', nodePerson: '周处长', status: '审核中', elapsed: 18,
    certCalls: [{certName:'出生医学证明',callTime:'06-15 09:35',status:'success' as const,dept:'卫健委'},{certName:'居民身份证',callTime:'06-15 09:36',status:'success' as const,dept:'公安局'},{certName:'电子结婚证',callTime:'06-15 09:37',status:'success' as const,dept:'民政局'}],
    rejectionReason: null,
    pushStatus: [{channel:'APP站内信',sent:true,time:'09:37:05'},{channel:'短信',sent:true,time:'09:37:08'},{channel:'邮件',sent:true,time:'09:37:10'},{channel:'人工电话',sent:false,time:'-'}],
    signTrail: [{dept:'卫健委',signer:'周处长',signTime:'06-15 09:40',status:'signed' as const},{dept:'公安厅',signer:'-',signTime:'-',status:'pending' as const},{dept:'人社厅',signer:'-',signTime:'-',status:'pending' as const}],
    correctionItems: [],
  },
  {
    key: '7', applyNo: '2026-BS-0037', serviceName: '不动产登记', applicant: '杨某某', department: '自然资源厅', currentNode: '领导审批', nodePerson: '吴主管', status: '办理中', elapsed: 24,
    certCalls: [{certName:'居民身份证',callTime:'06-15 16:35',status:'success' as const,dept:'公安局'},{certName:'房产证',callTime:'06-15 16:36',status:'success' as const,dept:'自然资源厅'},{certName:'电子完税证明',callTime:'06-15 16:37',status:'timeout' as const,dept:'税务局'}],
    rejectionReason: null,
    pushStatus: [{channel:'APP站内信',sent:true,time:'16:37:12'},{channel:'短信',sent:true,time:'16:37:15'},{channel:'邮件',sent:true,time:'16:37:18'},{channel:'人工电话',sent:false,time:'-'}],
    signTrail: [{dept:'自然资源厅',signer:'吴主管',signTime:'06-15 16:40',status:'signed' as const},{dept:'税务局',signer:'-',signTime:'-',status:'pending' as const}],
    correctionItems: [],
  },
  {
    key: '8', applyNo: '2026-BS-0038', serviceName: '道路运输经营许可', applicant: '黄某某', department: '交通运输厅', currentNode: '系统处理', nodePerson: '郑科长', status: '即将超期', elapsed: 96,
    certCalls: [{certName:'电子营业执照',callTime:'06-13 10:18',status:'success' as const,dept:'市监局'},{certName:'车辆行驶证',callTime:'06-13 10:19',status:'failed' as const,dept:'公安局'},{certName:'驾驶员从业资格证',callTime:'06-13 10:20',status:'failed' as const,dept:'交通厅'}],
    rejectionReason: {mainReason:'材料不齐全/不规范',subReasons:['车辆行驶证部分过期','驾驶员从业资格证3人到期','安全生产管理制度不完整'],affectedDept:'交通运输厅'},
    pushStatus: [{channel:'APP站内信',sent:true,time:'10:20:30'},{channel:'短信',sent:true,time:'10:20:33'},{channel:'邮件',sent:true,time:'10:20:36'},{channel:'人工电话',sent:true,time:'10:45:20'}],
    signTrail: [{dept:'交通厅',signer:'郑科长',signTime:'06-13 10:25',status:'signed' as const},{dept:'市监局',signer:'-',signTime:'-',status:'timeout' as const},{dept:'公安局',signer:'-',signTime:'-',status:'pending' as const}],
    correctionItems: [{name:'车辆行驶证复印件',reason:'部分车辆行驶证已过期请更新',status:'pending' as const},{name:'安全生产管理制度',reason:'未提供完整的安全生产管理制度文本',status:'pending' as const},{name:'驾驶员从业资格证',reason:'3名驾驶员从业资格证到期需换证',status:'pending' as const}],
  },
  {
    key: '9', applyNo: '2026-BS-0039', serviceName: '建房审批', applicant: '周某某', department: '住房和城乡建设厅', currentNode: '证照核验', nodePerson: '钱干事', status: '补正中', elapsed: 48,
    certCalls: [{certName:'居民身份证',callTime:'06-14 09:00',status:'success' as const,dept:'公安局'},{certName:'土地使用证',callTime:'06-14 09:01',status:'success' as const,dept:'自然资源厅'},{certName:'规划许可证',callTime:'06-14 09:02',status:'failed' as const,dept:'住建厅'}],
    rejectionReason: {mainReason:'不符合办理条件',subReasons:['用地性质与规划不符','建筑面积超出审批范围'],affectedDept:'住房和城乡建设厅'},
    pushStatus: [{channel:'APP站内信',sent:true,time:'09:02:45'},{channel:'短信',sent:true,time:'09:02:48'},{channel:'邮件',sent:false,time:'-'},{channel:'人工电话',sent:true,time:'09:20:10'}],
    signTrail: [{dept:'住建厅',signer:'钱干事',signTime:'06-14 09:05',status:'signed' as const},{dept:'自然资源厅',signer:'冯书记',signTime:'06-14 10:30',status:'signed' as const},{dept:'规划局',signer:'-',signTime:'-',status:'pending' as const}],
    correctionItems: [{name:'建设用地规划许可证',reason:'用地性质与规划用途不符',status:'pending' as const},{name:'宅基地批准文件',reason:'需补充村委会批准文件',status:'done' as const}],
  },
  {
    key: '10', applyNo: '2026-BS-0040', serviceName: '再生育审批', applicant: '吴某某', department: '卫生健康委员会', currentNode: '材料预审', nodePerson: '冯书记', status: '办理中', elapsed: 3,
    certCalls: [{certName:'居民身份证',callTime:'06-16 13:52',status:'success' as const,dept:'公安局'},{certName:'电子结婚证',callTime:'06-16 13:53',status:'success' as const,dept:'民政局'}],
    rejectionReason: null,
    pushStatus: [{channel:'APP站内信',sent:true,time:'13:53:20'},{channel:'短信',sent:true,time:'13:53:23'},{channel:'邮件',sent:false,time:'-'},{channel:'人工电话',sent:false,time:'-'}],
    signTrail: [{dept:'卫健委',signer:'冯书记',signTime:'06-16 13:55',status:'signed' as const},{dept:'民政局',signer:'-',signTime:'-',status:'pending' as const}],
    correctionItems: [],
  },
  {
    key: '11', applyNo: '2026-BS-0041', serviceName: '排污许可', applicant: '郑某某', department: '生态环境厅', currentNode: '受理登记', nodePerson: '陈主任', status: '审核中', elapsed: 15,
    certCalls: [{certName:'电子营业执照',callTime:'06-15 10:40',status:'success' as const,dept:'市监局'},{certName:'环评批复',callTime:'06-15 10:41',status:'timeout' as const,dept:'生态环境厅'}],
    rejectionReason: {mainReason:'电子证照缺失',subReasons:['环评批复文件未在证照库中找到','排污许可证副本过期'],affectedDept:'生态环境厅'},
    pushStatus: [{channel:'APP站内信',sent:true,time:'10:41:30'},{channel:'短信',sent:true,time:'10:41:33'},{channel:'邮件',sent:true,time:'10:41:36'},{channel:'人工电话',sent:false,time:'-'}],
    signTrail: [{dept:'生态环境厅',signer:'陈主任',signTime:'06-15 10:45',status:'signed' as const},{dept:'市监局',signer:'-',signTime:'-',status:'pending' as const}],
    correctionItems: [{name:'环评批复文件',reason:'证照库中未找到请重新上传',status:'pending' as const}],
  },
  {
    key: '12', applyNo: '2026-BS-0042', serviceName: '涉农补贴申请', applicant: '孙某某', department: '农业农村厅', currentNode: '结果送达', nodePerson: '许组长', status: '办理中', elapsed: 6,
    certCalls: [{certName:'居民身份证',callTime:'06-16 07:30',status:'success' as const,dept:'公安局'},{certName:'土地承包证',callTime:'06-16 07:31',status:'success' as const,dept:'农业农村厅'},{certName:'低保证明',callTime:'06-16 07:32',status:'success' as const,dept:'民政局'}],
    rejectionReason: null,
    pushStatus: [{channel:'APP站内信',sent:true,time:'07:32:10'},{channel:'短信',sent:true,time:'07:32:13'},{channel:'邮件',sent:true,time:'07:32:16'},{channel:'人工电话',sent:false,time:'-'}],
    signTrail: [{dept:'农业农村厅',signer:'许组长',signTime:'06-16 07:35',status:'signed' as const},{dept:'财政局',signer:'韩科长',signTime:'06-16 08:20',status:'signed' as const}],
    correctionItems: [],
  },
  {
    key: '13', applyNo: '2026-BS-0043', serviceName: '企业税务登记', applicant: '马某某', department: '税务局', currentNode: '信息核验', nodePerson: '韩科长', status: '审核中', elapsed: 20,
    certCalls: [{certName:'电子营业执照',callTime:'06-15 15:10',status:'success' as const,dept:'市监局'},{certName:'法人身份证',callTime:'06-15 15:11',status:'success' as const,dept:'公安局'},{certName:'电子完税证明',callTime:'06-15 15:12',status:'failed' as const,dept:'税务局'}],
    rejectionReason: {mainReason:'填写信息有误',subReasons:['统一社会信用代码格式错误','注册地址与营业执照不一致'],affectedDept:'税务局'},
    pushStatus: [{channel:'APP站内信',sent:true,time:'15:12:30'},{channel:'短信',sent:false,time:'-'},{channel:'邮件',sent:true,time:'15:12:35'},{channel:'人工电话',sent:true,time:'15:40:22'}],
    signTrail: [{dept:'税务局',signer:'韩科长',signTime:'06-15 15:15',status:'signed' as const},{dept:'市监局',signer:'-',signTime:'-',status:'pending' as const}],
    correctionItems: [{name:'统一社会信用代码',reason:'格式校验未通过请核实后重新填写',status:'pending' as const},{name:'注册地址证明',reason:'与营业执照登记地址不一致',status:'pending' as const}],
  },
  {
    key: '14', applyNo: '2026-BS-0044', serviceName: '学籍转接', applicant: '朱某某', department: '教育厅', currentNode: '审批签发', nodePerson: '曹主任', status: '办理中', elapsed: 10,
    certCalls: [{certName:'居民身份证',callTime:'06-16 11:00',status:'success' as const,dept:'公安局'},{certName:'学籍证明',callTime:'06-16 11:01',status:'success' as const,dept:'教育厅'}],
    rejectionReason: null,
    pushStatus: [{channel:'APP站内信',sent:true,time:'11:01:25'},{channel:'短信',sent:true,time:'11:01:28'},{channel:'邮件',sent:true,time:'11:01:30'},{channel:'人工电话',sent:false,time:'-'}],
    signTrail: [{dept:'教育厅（转出校）',signer:'曹主任',signTime:'06-16 11:05',status:'signed' as const},{dept:'教育厅（转入校）',signer:'-',signTime:'-',status:'pending' as const}],
    correctionItems: [],
  },
  {
    key: '15', applyNo: '2026-BS-0045', serviceName: '婚姻登记', applicant: '何某某', department: '民政局', currentNode: '领导审批', nodePerson: '魏处长', status: '即将超期', elapsed: 84,
    certCalls: [{certName:'居民身份证',callTime:'06-13 09:20',status:'success' as const,dept:'公安局'},{certName:'户口簿',callTime:'06-13 09:21',status:'success' as const,dept:'公安局'},{certName:'电子结婚证',callTime:'06-13 09:22',status:'failed' as const,dept:'民政局'}],
    rejectionReason: {mainReason:'政策适配失败',subReasons:['跨省婚姻登记政策适配规则未更新','户籍地婚姻状态核验超时'],affectedDept:'民政局'},
    pushStatus: [{channel:'APP站内信',sent:true,time:'09:22:15'},{channel:'短信',sent:true,time:'09:22:18'},{channel:'邮件',sent:false,time:'-'},{channel:'人工电话',sent:true,time:'09:50:30'}],
    signTrail: [{dept:'民政局',signer:'魏处长',signTime:'06-13 09:25',status:'signed' as const},{dept:'公安局',signer:'-',signTime:'-',status:'timeout' as const},{dept:'民政局（对方户籍地）',signer:'-',signTime:'-',status:'pending' as const}],
    correctionItems: [{name:'婚姻状况声明书',reason:'需补充对方户籍地出具的婚姻状况证明',status:'pending' as const},{name:'跨省登记申请表',reason:'政策适配规则未更新请手动填写',status:'pending' as const}],
  },
];

const ALL_CORRECTION_CASES = [
  ...MATERIAL_CORRECTION_CASES,
  {
    id: 'mc4',
    service: '营业执照变更',
    applicant: '某商贸有限公司',
    department: '市场监督管理局',
    submitTime: '2026-06-14 11:20',
    rejectTime: '2026-06-15 09:42',
    fixDeadline: '2026-06-22 23:59',
    missingItems: [
      { name: '股东会决议原件', reason: '需全体股东签字盖章', status: 'pending' as const },
      { name: '章程修正案', reason: '修正案未加盖公章', status: 'pending' as const },
    ],
    pushStatus: [
      { channel: 'APP站内信', status: 'sent' as const, time: '09:42:15' },
      { channel: '手机短信', status: 'sent' as const, time: '09:42:18' },
      { channel: '邮件通知', status: 'sent' as const, time: '09:42:21' },
      { channel: '人工电话', status: 'pending' as const, time: '-' },
    ],
  },
  {
    id: 'mc5',
    service: '不动产登记（二手房过户）',
    applicant: '杨某某',
    department: '自然资源厅',
    submitTime: '2026-06-15 16:33',
    rejectTime: '2026-06-16 08:51',
    fixDeadline: '2026-06-23 23:59',
    missingItems: [
      { name: '原产权证书', reason: '原产权证信息与系统登记不一致', status: 'pending' as const },
    ],
    pushStatus: [
      { channel: 'APP站内信', status: 'sent' as const, time: '08:51:03' },
      { channel: '手机短信', status: 'sent' as const, time: '08:51:06' },
      { channel: '邮件通知', status: 'failed' as const, time: '08:51:09' },
      { channel: '人工电话', status: 'sent' as const, time: '09:10:22' },
    ],
  },
  {
    id: 'mc6',
    service: '道路运输经营许可',
    applicant: '某物流有限公司',
    department: '交通运输厅',
    submitTime: '2026-06-16 07:45',
    rejectTime: '2026-06-16 10:18',
    fixDeadline: '2026-06-23 23:59',
    missingItems: [
      { name: '车辆行驶证复印件', reason: '部分车辆行驶证已过期，请更新', status: 'pending' as const },
      { name: '安全生产管理制度', reason: '未提供完整的安全生产管理制度文本', status: 'pending' as const },
      { name: '驾驶员从业资格证', reason: '3名驾驶员从业资格证到期需换证', status: 'pending' as const },
    ],
    pushStatus: [
      { channel: 'APP站内信', status: 'sent' as const, time: '10:18:30' },
      { channel: '手机短信', status: 'sent' as const, time: '10:18:33' },
      { channel: '邮件通知', status: 'sent' as const, time: '10:18:36' },
      { channel: '人工电话', status: 'pending' as const, time: '-' },
    ],
  },
  {
    id: 'mc7',
    service: '再生育审批',
    applicant: '刘某某',
    department: '卫生健康委员会',
    submitTime: '2026-06-15 13:50',
    rejectTime: '2026-06-16 09:35',
    fixDeadline: '2026-06-30 23:59',
    missingItems: [
      { name: '夫妻双方婚育情况证明', reason: '需户籍地街道办出具盖章版证明', status: 'done' as const },
      { name: '再婚相关法律文书', reason: '再婚情况需提供法院判决书或调解书', status: 'pending' as const },
    ],
    pushStatus: [
      { channel: 'APP站内信', status: 'sent' as const, time: '09:35:12' },
      { channel: '手机短信', status: 'sent' as const, time: '09:35:15' },
      { channel: '邮件通知', status: 'sent' as const, time: '09:35:18' },
      { channel: '人工电话', status: 'sent' as const, time: '09:42:08' },
    ],
  },
  {
    id: 'mc8',
    service: '排污许可证核发',
    applicant: '某化工有限公司',
    department: '生态环境厅',
    submitTime: '2026-06-14 09:18',
    rejectTime: '2026-06-15 15:40',
    fixDeadline: '2026-06-22 23:59',
    missingItems: [
      { name: '环境影响评价批复文件', reason: '环评批复文号与系统登记不一致', status: 'pending' as const },
      { name: '监测报告（近3个月）', reason: '需提供具有CMA资质的第三方监测报告', status: 'pending' as const },
    ],
    pushStatus: [
      { channel: 'APP站内信', status: 'sent' as const, time: '15:40:05' },
      { channel: '手机短信', status: 'sent' as const, time: '15:40:08' },
      { channel: '邮件通知', status: 'sent' as const, time: '15:40:11' },
      { channel: '人工电话', status: 'sent' as const, time: '15:55:41' },
    ],
  },
];

const CROSS_MODULE_STATUS = [
  {
    key: 'policy',
    title: '政策引擎 · 补贴匹配状态',
    icon: <FileSearch className="w-5 h-5 text-purple-600" />,
    color: 'purple',
    totalMatched: 8642,
    activePolicies: 147,
    todayNew: 231,
    exceptionCount: 3,
    topItems: [
      { name: '涉农补贴自动匹配', count: 1289, rate: 97.2, status: 'normal' },
      { name: '育儿津贴政策适配', count: 856, rate: 98.5, status: 'normal' },
      { name: '稳岗返还智能核准', count: 421, rate: 95.8, status: 'warning' },
      { name: '高校毕业生就业补贴', count: 312, rate: 99.1, status: 'normal' },
    ],
  },
  {
    key: 'disaster',
    title: '容灾中心 · 应急受理状态',
    icon: <ShieldAlert className="w-5 h-5 text-orange-600" />,
    color: 'orange',
    totalCached: 28347,
    activeSystems: 12,
    failoverNow: 1,
    cacheHitRate: 99.7,
    topItems: [
      { name: '税务业务系统', count: 0, rate: 98.2, status: 'error', note: '主系统故障，缓存应急受理中' },
      { name: '卫健业务系统', count: 342, rate: 96.8, status: 'warning', note: '接口超时时，自动切换缓存证照' },
      { name: '人社业务系统', count: 0, rate: 99.5, status: 'normal' },
      { name: '市监业务系统', count: 0, rate: 99.8, status: 'normal' },
    ],
  },
  {
    key: 'cert',
    title: '电子证照 · 互认调用状态',
    icon: <FileKey className="w-5 h-5 text-blue-600" />,
    color: 'blue',
    totalCalls: 156842,
    certTypes: 234,
    successRate: 96.8,
    todayFail: 113,
    topItems: [
      { name: '居民身份证调用', count: 42187, rate: 99.2, status: 'normal' },
      { name: '居民户口簿调用', count: 28543, rate: 98.7, status: 'normal' },
      { name: '结婚证/离婚证调用', count: 15823, rate: 89.3, status: 'warning', note: '民政接口偶发超时' },
      { name: '出生医学证明调用', count: 9231, rate: 94.5, status: 'warning', note: '卫健系统每日凌晨维护' },
    ],
  },
];

export default function Performance() {
  const trendChartRef = useRef<HTMLDivElement>(null);
  const timeChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const channelChartRef = useRef<HTMLDivElement>(null);
  const chainChartRef = useRef<HTMLDivElement>(null);
  const certChartRef = useRef<HTMLDivElement>(null);

  const trendChartInstance = useRef<echarts.ECharts | null>(null);
  const timeChartInstance = useRef<echarts.ECharts | null>(null);
  const pieChartInstance = useRef<echarts.ECharts | null>(null);
  const channelChartInstance = useRef<echarts.ECharts | null>(null);
  const chainChartInstance = useRef<echarts.ECharts | null>(null);
  const certChartInstance = useRef<echarts.ECharts | null>(null);

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(29, 'day'),
    dayjs(),
  ]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedServiceType, setSelectedServiceType] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedRejection, setSelectedRejection] = useState<string>('all');
  const [selectedScenario, setSelectedScenario] = useState<string>('all');
  const [departmentRanking] = useState(generateDepartmentRanking);
  const [expandedLedger, setExpandedLedger] = useState(false);
  const [expandedCorrection, setExpandedCorrection] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [expandedChainKey, setExpandedChainKey] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    let result = [...mockPerformanceData];
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      result = result.filter(d => d.date >= startDate && d.date <= endDate);
    }
    return result;
  }, [dateRange]);

  const summaryStats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        avgCompletionRate: 0, avgHandlingTime: 0, totalRejections: 0,
        totalApplications: 0, crossCases: 0, certCalls: 0, subsidyMatch: 0, correctionCases: 0,
      };
    }
    const avgCompletionRate = filteredData.reduce((s, d) => s + d.completionRate, 0) / filteredData.length;
    const avgHandlingTime = filteredData.reduce((s, d) => s + d.averageHandlingTime, 0) / filteredData.length;
    const totalRejections = filteredData.reduce((s, d) => s + d.rejectionCount, 0);
    const totalApplications = filteredData.reduce((s, d) => s + d.totalApplications, 0);
    return {
      avgCompletionRate: Math.round(avgCompletionRate * 10) / 10,
      avgHandlingTime: Math.round(avgHandlingTime * 10) / 10,
      totalRejections,
      totalApplications,
      crossCases: Math.round(totalApplications * 0.18),
      certCalls: Math.round(totalApplications * 3.2),
      subsidyMatch: Math.round(totalApplications * 0.08),
      correctionCases: Math.round(totalRejections * 0.35),
    };
  }, [filteredData]);

  const rejectionReasonsAggregated = useMemo(() => {
    const reasonMap: Record<string, number> = {};
    filteredData.forEach(d => {
      d.rejectionReasons.forEach(r => {
        reasonMap[r.reason] = (reasonMap[r.reason] || 0) + r.count;
      });
    });
    return Object.entries(reasonMap).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const channelDistribution = useMemo(() => [
    { name: '掌上办事APP', value: Math.round(summaryStats.totalApplications * 0.42), code: 'online' },
    { name: '政务服务网', value: Math.round(summaryStats.totalApplications * 0.23), code: 'web' },
    { name: '政务大厅', value: Math.round(summaryStats.totalApplications * 0.18), code: 'hall' },
    { name: '自助终端', value: Math.round(summaryStats.totalApplications * 0.09), code: 'self' },
    { name: '跨域协同', value: Math.round(summaryStats.totalApplications * 0.08), code: 'cross' },
  ], [summaryStats.totalApplications]);

  useEffect(() => {
    if (!trendChartRef.current) return;
    trendChartInstance.current = echarts.init(trendChartRef.current);
    const dates = filteredData.map(d => d.date.slice(5));
    const completionRates = filteredData.map(d => d.completionRate);
    const crossRates = filteredData.map(d => 78 + Math.random() * 18);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129' },
        formatter: (params: any) => {
          const date = params[0].axisValue;
          let result = `<div style="font-weight:600;margin-bottom:8px;">${date}</div>`;
          params.forEach((p: any) => {
            result += `<div style="display:flex;align-items:center;margin:4px 0;">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:8px;"></span>
              <span style="margin-right:8px;">${p.seriesName}:</span>
              <span style="font-weight:600;">${p.value}%</span>
            </div>`;
          });
          return result;
        },
      },
      legend: { data: ['整体办结率', '跨域办结率'], top: 0, right: 0, textStyle: { fontSize: 11, color: '#4E5969' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category', data: dates,
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisLabel: { color: '#86909C', fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value', min: 70, max: 100,
        axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
        axisLabel: { color: '#86909C', fontSize: 10, formatter: '{value}%' },
      },
      series: [
        {
          name: '整体办结率', type: 'line', smooth: true, symbol: 'circle', symbolSize: 5,
          showSymbol: false, lineStyle: { width: 3, color: '#165DFF' },
          itemStyle: { color: '#165DFF' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(22,93,255,0.3)' },
              { offset: 1, color: 'rgba(22,93,255,0.02)' },
            ]),
          },
          data: completionRates,
          markLine: {
            silent: true, lineStyle: { color: '#F53F3F', type: 'dashed' },
            data: [{ yAxis: 80, label: { formatter: '达标线 80%', color: '#F53F3F', fontSize: 10 } }],
          },
        },
        {
          name: '跨域办结率', type: 'line', smooth: true, symbol: 'circle', symbolSize: 5,
          showSymbol: false, lineStyle: { width: 2.5, color: '#722ED1', type: 'dashed' },
          itemStyle: { color: '#722ED1' },
          data: crossRates,
        },
      ],
    };
    trendChartInstance.current.setOption(option);
    const resize = () => trendChartInstance.current?.resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); trendChartInstance.current?.dispose(); };
  }, [filteredData]);

  useEffect(() => {
    if (!timeChartRef.current) return;
    timeChartInstance.current = echarts.init(timeChartRef.current);
    const dates = filteredData.map(d => d.date.slice(5));
    const avgTimes = filteredData.map(d => d.averageHandlingTime);
    const targetTimes = filteredData.map(() => 30);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB', borderWidth: 1, textStyle: { color: '#1D2129' },
      },
      legend: { data: ['实际办理时长', '目标时长'], top: 0, right: 0, textStyle: { fontSize: 11, color: '#4E5969' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category', data: dates,
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisLabel: { color: '#86909C', fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
        axisLabel: { color: '#86909C', fontSize: 10, formatter: '{value}分' },
      },
      series: [
        {
          name: '实际办理时长', type: 'bar', barWidth: '50%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#722ED1' }, { offset: 1, color: '#722ED166' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          data: avgTimes,
        },
        {
          name: '目标时长', type: 'line', lineStyle: { color: '#00B42A', width: 2, type: 'dashed' },
          itemStyle: { color: '#00B42A' }, symbol: 'none',
          data: targetTimes,
        },
      ],
    };
    timeChartInstance.current.setOption(option);
    const resize = () => timeChartInstance.current?.resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); timeChartInstance.current?.dispose(); };
  }, [filteredData]);

  useEffect(() => {
    if (!pieChartRef.current) return;
    pieChartInstance.current = echarts.init(pieChartRef.current);
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB', borderWidth: 1, textStyle: { color: '#1D2129' },
        formatter: '{b}: {c}件 ({d}%)',
      },
      legend: {
        orient: 'vertical', right: '3%', top: 'center',
        icon: 'circle', itemWidth: 8, itemHeight: 8,
        textStyle: { color: '#4E5969', fontSize: 11 },
      },
      color: ['#165DFF', '#722ED1', '#FF7D00', '#00B42A', '#F53F3F', '#14C9C9'],
      series: [{
        name: '退件原因', type: 'pie', radius: ['40%', '70%'], center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 15, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: rejectionReasonsAggregated,
      }],
    };
    pieChartInstance.current.setOption(option);
    const resize = () => pieChartInstance.current?.resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); pieChartInstance.current?.dispose(); };
  }, [rejectionReasonsAggregated]);

  useEffect(() => {
    if (!channelChartRef.current) return;
    channelChartInstance.current = echarts.init(channelChartRef.current);
    const colors = channelDistribution.map(c => CHANNEL_COLORS[c.code] || '#86909C');
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis', axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB', borderWidth: 1, textStyle: { color: '#1D2129' },
        formatter: (params: any) => {
          const p = params[0];
          const total = channelDistribution.reduce((s, c) => s + c.value, 0);
          const pct = ((p.value / total) * 100).toFixed(1);
          return `${p.name}: ${p.value.toLocaleString()}件 (${pct}%)`;
        },
      },
      grid: { left: '3%', right: '10%', bottom: '3%', top: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
        axisLabel: { color: '#86909C', fontSize: 10 },
      },
      yAxis: {
        type: 'category', data: channelDistribution.map(c => c.name),
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisLabel: { color: '#4E5969', fontSize: 11 },
        axisTick: { show: false },
      },
      series: [{
        name: '办件量', type: 'bar', barWidth: '55%',
        itemStyle: {
          color: (p: any) => colors[p.dataIndex],
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true, position: 'right', color: '#4E5969',
          fontSize: 11, formatter: (p: any) => {
            const total = channelDistribution.reduce((s, c) => s + c.value, 0);
            return `${p.value.toLocaleString()} (${((p.value / total) * 100).toFixed(1)}%)`;
          },
        },
        data: channelDistribution.map(c => c.value),
      }],
    };
    channelChartInstance.current.setOption(option);
    const resize = () => channelChartInstance.current?.resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); channelChartInstance.current?.dispose(); };
  }, [channelDistribution]);

  useEffect(() => {
    if (!chainChartRef.current) return;
    chainChartInstance.current = echarts.init(chainChartRef.current);
    const chainStages = ['申请提交', '材料预审', '部门受理', '业务审核', '证照调用', '结果送达'];
    const chainDepts = [
      [100, 98, 95, 88, 92, 97],
      [100, 92, 89, 85, 82, 95],
      [100, 99, 97, 95, 96, 99],
    ];
    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB', borderWidth: 1, textStyle: { color: '#1D2129' },
      },
      legend: {
        data: ['即办件（社保类）', '承诺件（市监类）', '联办件（新生儿一件事）'],
        top: 0, right: 0, textStyle: { fontSize: 11, color: '#4E5969' },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '18%', containLabel: true },
      xAxis: {
        type: 'category', data: chainStages, boundaryGap: false,
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisLabel: { color: '#86909C', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value', min: 60, max: 100,
        axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
        axisLabel: { color: '#86909C', fontSize: 10, formatter: '{value}%' },
      },
      series: [
        {
          name: '即办件（社保类）', type: 'line', smooth: true,
          symbol: 'circle', symbolSize: 7, lineStyle: { width: 2.5, color: '#165DFF' },
          itemStyle: { color: '#165DFF' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(22,93,255,0.25)' },
              { offset: 1, color: 'rgba(22,93,255,0.02)' },
            ]),
          },
          data: chainDepts[0],
        },
        {
          name: '承诺件（市监类）', type: 'line', smooth: true,
          symbol: 'circle', symbolSize: 7, lineStyle: { width: 2.5, color: '#FF7D00' },
          itemStyle: { color: '#FF7D00' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255,125,0,0.2)' },
              { offset: 1, color: 'rgba(255,125,0,0.02)' },
            ]),
          },
          data: chainDepts[1],
        },
        {
          name: '联办件（新生儿一件事）', type: 'line', smooth: true,
          symbol: 'circle', symbolSize: 7, lineStyle: { width: 2.5, color: '#00B42A' },
          itemStyle: { color: '#00B42A' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0,180,42,0.2)' },
              { offset: 1, color: 'rgba(0,180,42,0.02)' },
            ]),
          },
          data: chainDepts[2],
        },
      ],
    };
    chainChartInstance.current.setOption(option);
    const resize = () => chainChartInstance.current?.resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); chainChartInstance.current?.dispose(); };
  }, []);

  useEffect(() => {
    if (!certChartRef.current) return;
    certChartInstance.current = echarts.init(certChartRef.current);
    const deptCodes = ['人社', '公安', '卫健', '住建', '市监', '税务', '民政', '交通', '教育', '环保', '农业', '自然资源'];
    const certSuccess = [99.2, 98.7, 94.5, 97.8, 98.3, 89.3, 96.8, 97.1, 98.5, 95.2, 96.7, 97.3];
    const certVolume = [42187, 38543, 23124, 18542, 15234, 12543, 9823, 7234, 6534, 4231, 3842, 3421];

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#E5E6EB', borderWidth: 1, textStyle: { color: '#1D2129' },
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['证照调用成功率', '证照调用量（次）'],
        top: 0, right: 0, textStyle: { fontSize: 11, color: '#4E5969' },
      },
      grid: { left: '3%', right: '8%', bottom: '3%', top: '18%', containLabel: true },
      xAxis: {
        type: 'category', data: deptCodes,
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisLabel: { color: '#86909C', fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value', name: '成功率', min: 80, max: 100,
          axisLine: { show: false }, axisTick: { show: false },
          splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
          axisLabel: { color: '#86909C', fontSize: 10, formatter: '{value}%' },
          nameTextStyle: { color: '#86909C', fontSize: 10 },
        },
        {
          type: 'value', name: '调用量',
          axisLine: { show: false }, axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { color: '#86909C', fontSize: 10, formatter: (v: number) => (v / 1000).toFixed(0) + 'k' },
          nameTextStyle: { color: '#86909C', fontSize: 10 },
        },
      ],
      series: [
        {
          name: '证照调用成功率', type: 'bar', barWidth: '45%',
          itemStyle: {
            color: (p: any) => p.value >= 97 ? '#00B42A' : p.value >= 93 ? '#FF7D00' : '#F53F3F',
            borderRadius: [4, 4, 0, 0],
          },
          label: {
            show: true, position: 'top', color: '#4E5969',
            fontSize: 10, formatter: '{c}%',
          },
          data: certSuccess,
        },
        {
          name: '证照调用量（次）', type: 'line', yAxisIndex: 1,
          smooth: true, symbol: 'circle', symbolSize: 6,
          lineStyle: { width: 2.5, color: '#722ED1' },
          itemStyle: { color: '#722ED1' },
          data: certVolume,
        },
      ],
    };
    certChartInstance.current.setOption(option);
    const resize = () => certChartInstance.current?.resize();
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); certChartInstance.current?.dispose(); };
  }, []);

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 72,
      fixed: 'left' as const,
      render: (rank: number) => {
        let rankClass = 'bg-gov-gray-100 text-gov-gray-600';
        if (rank === 1) rankClass = 'bg-yellow-100 text-yellow-700';
        else if (rank === 2) rankClass = 'bg-gray-200 text-gray-700';
        else if (rank === 3) rankClass = 'bg-orange-100 text-orange-700';
        return (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${rankClass}`}>
            {rank <= 3 ? <Trophy className="w-4 h-4" /> : rank}
          </div>
        );
      },
    },
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string, record: any) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gov-gray-700">{name}</span>
          <Tag className="m-0 text-[10px]" color="geekblue">{record.code}</Tag>
        </div>
      ),
    },
    {
      title: '办结率',
      dataIndex: 'completionRate',
      key: 'completionRate',
      width: 150,
      render: (rate: number) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={rate}
            size="small"
            strokeColor={rate >= 90 ? '#00B42A' : rate >= 80 ? '#FF7D00' : '#F53F3F'}
            showInfo={false}
            style={{ width: 80 }}
          />
          <span className={`font-semibold text-xs ${rate >= 90 ? 'text-green-600' : rate >= 80 ? 'text-orange-600' : 'text-red-600'}`}>
            {rate}%
          </span>
        </div>
      ),
    },
    {
      title: '平均耗时',
      dataIndex: 'avgHandlingTime',
      key: 'avgHandlingTime',
      width: 90,
      render: (time: number) => (
        <span className="font-medium text-gov-gray-700 text-xs">{time}分钟</span>
      ),
    },
    {
      title: '办件量',
      dataIndex: 'totalApplications',
      key: 'totalApplications',
      width: 95,
      render: (count: number) => (
        <span className="font-medium text-gov-gray-700 text-xs">{count.toLocaleString()}</span>
      ),
    },
    {
      title: '退件率',
      dataIndex: 'rejectionRate',
      key: 'rejectionRate',
      width: 85,
      render: (rate: number) => (
        <Tag color={rate > 3 ? 'red' : rate > 2 ? 'orange' : 'green'} className="text-xs m-0">
          {rate}%
        </Tag>
      ),
    },
    {
      title: '证照调用',
      dataIndex: 'certCalls',
      key: 'certCalls',
      width: 100,
      render: (v: number) => (
        <span className="text-xs text-blue-600 font-medium">{v.toLocaleString()}</span>
      ),
    },
    {
      title: '补贴匹配',
      dataIndex: 'subsidyMatch',
      key: 'subsidyMatch',
      width: 90,
      render: (v: number) => (
        <span className="text-xs text-purple-600 font-medium">{v.toLocaleString()}</span>
      ),
    },
    {
      title: '跨域办件',
      dataIndex: 'crossCases',
      key: 'crossCases',
      width: 90,
      render: (v: number) => (
        <span className="text-xs text-red-600 font-medium">{v.toLocaleString()}</span>
      ),
    },
    {
      title: '趋势',
      key: 'trend',
      width: 80,
      render: () => {
        const isUp = Math.random() > 0.5;
        return (
          <div className={`flex items-center gap-1 ${isUp ? 'text-green-600' : 'text-red-600'}`}>
            {isUp ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            <span className="text-xs font-medium">{(Math.random() * 5).toFixed(1)}%</span>
          </div>
        );
      },
    },
  ];

  const handleReset = () => {
    setDateRange([dayjs().subtract(29, 'day'), dayjs()]);
    setSelectedDepartment('all');
    setSelectedServiceType('all');
    setSelectedChannel('all');
    setSelectedRejection('all');
    setSelectedScenario('all');
  };

  const chainStatusColor = (status: string) => {
    switch (status) {
      case 'done': return '#00B42A';
      case 'processing': return '#165DFF';
      case 'warning': return '#FF7D00';
      default: return '#C9CDD4';
    }
  };

  const chainStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle2 className="w-4 h-4" style={{ color: '#00B42A' }} />;
      case 'processing': return <Zap className="w-4 h-4 animate-pulse" style={{ color: '#165DFF' }} />;
      case 'warning': return <AlertTriangle className="w-4 h-4" style={{ color: '#FF7D00' }} />;
      default: return <Clock className="w-4 h-4" style={{ color: '#C9CDD4' }} />;
    }
  };

  return (
    <div className="min-h-screen bg-gov-gray-50 p-4 sm:p-6">
      <div className="max-w-[1680px] mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
            <h1 className="text-2xl font-bold text-gov-gray-700">效能监测中心</h1>
            <Space>
              <Tag color="green" className="text-sm m-0">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                实时监测中 · {mockDepartments.length}个委办局在线
              </Tag>
              <Button
                type="primary"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={handleReset}
                size="middle"
              >
                重置筛选
              </Button>
            </Space>
          </div>
          <p className="text-gov-gray-500">全量监测12个委办局政务服务效能，穿透至事项链路、材料补正、跨模块协同</p>
        </div>

        <Card className="shadow-card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary-600" />
            <span className="font-semibold text-gov-gray-700">筛选条件</span>
            <Tag color="blue" className="m-0 ml-2">6维筛选</Tag>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gov-gray-500 text-xs w-16 flex-shrink-0">时间范围</span>
              <RangePicker
                value={dateRange}
                onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                allowClear={false}
                size="middle"
                style={{ flex: 1 }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gov-gray-500 text-xs w-16 flex-shrink-0">责任部门</span>
              <Select
                value={selectedDepartment}
                onChange={setSelectedDepartment}
                style={{ flex: 1 }}
                allowClear
                size="middle"
              >
                <Option value="all">全部部门（12个委办局）</Option>
                {mockDepartments.map(dept => (
                  <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gov-gray-500 text-xs w-16 flex-shrink-0">事项类型</span>
              <Select
                value={selectedServiceType}
                onChange={setSelectedServiceType}
                style={{ flex: 1 }}
                allowClear
                size="middle"
              >
                {SERVICE_TYPES.map(s => (
                  <Option key={s.value} value={s.value}>{s.label}</Option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gov-gray-500 text-xs w-16 flex-shrink-0">办理渠道</span>
              <Select
                value={selectedChannel}
                onChange={setSelectedChannel}
                style={{ flex: 1 }}
                allowClear
                size="middle"
              >
                {CHANNELS.map(s => (
                  <Option key={s.value} value={s.value}>{s.label}</Option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gov-gray-500 text-xs w-16 flex-shrink-0">退件原因</span>
              <Select
                value={selectedRejection}
                onChange={setSelectedRejection}
                style={{ flex: 1 }}
                allowClear
                size="middle"
              >
                {REJECTION_CATEGORIES.map(s => (
                  <Option key={s.value} value={s.value}>{s.label}</Option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gov-gray-500 text-xs w-16 flex-shrink-0">协同场景</span>
              <Select
                value={selectedScenario}
                onChange={setSelectedScenario}
                style={{ flex: 1 }}
                allowClear
                size="middle"
              >
                {CROSS_SCENARIOS.map(s => (
                  <Option key={s.value} value={s.value}>{s.label}</Option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        <Row gutter={[12, 12]} className="mb-6">
          <Col xs={12} sm={12} md={8} lg={6}>
            <Card className="shadow-card border-l-4 border-l-blue-500">
              <Statistic
                title={<div className="flex items-center gap-1.5 text-gov-gray-500 text-xs"><BarChart3 className="w-3.5 h-3.5" />平均办结率</div>}
                value={summaryStats.avgCompletionRate}
                suffix="%"
                valueStyle={{ color: '#165DFF', fontSize: 22 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={8} lg={6}>
            <Card className="shadow-card border-l-4 border-l-purple-500">
              <Statistic
                title={<div className="flex items-center gap-1.5 text-gov-gray-500 text-xs"><Clock className="w-3.5 h-3.5" />平均办理时长</div>}
                value={summaryStats.avgHandlingTime}
                suffix="分钟"
                valueStyle={{ color: '#722ED1', fontSize: 22 }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={8} lg={6}>
            <Card className="shadow-card border-l-4 border-l-green-500">
              <Statistic
                title={<div className="flex items-center gap-1.5 text-gov-gray-500 text-xs"><TrendingUp className="w-3.5 h-3.5" />总办件量</div>}
                value={summaryStats.totalApplications}
                valueStyle={{ color: '#00B42A', fontSize: 22 }}
                formatter={(v) => String(v).toLocaleString()}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={8} lg={6}>
            <Card className="shadow-card border-l-4 border-l-red-500">
              <Statistic
                title={<div className="flex items-center gap-1.5 text-gov-gray-500 text-xs"><XCircle className="w-3.5 h-3.5" />累计退件</div>}
                value={summaryStats.totalRejections}
                valueStyle={{ color: '#F53F3F', fontSize: 22 }}
                formatter={(v) => String(v).toLocaleString()}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={8} lg={6}>
            <Card className="shadow-card border-l-4 border-l-cyan-500">
              <Statistic
                title={<div className="flex items-center gap-1.5 text-gov-gray-500 text-xs"><Network className="w-3.5 h-3.5" />跨域协同办件</div>}
                value={summaryStats.crossCases}
                valueStyle={{ color: '#14C9C9', fontSize: 22 }}
                formatter={(v) => String(v).toLocaleString()}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={8} lg={6}>
            <Card className="shadow-card border-l-4 border-l-indigo-500">
              <Statistic
                title={<div className="flex items-center gap-1.5 text-gov-gray-500 text-xs"><FileKey className="w-3.5 h-3.5" />证照互认调用</div>}
                value={summaryStats.certCalls}
                valueStyle={{ color: '#6366F1', fontSize: 22 }}
                formatter={(v) => String(v).toLocaleString()}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={8} lg={6}>
            <Card className="shadow-card border-l-4 border-l-fuchsia-500">
              <Statistic
                title={<div className="flex items-center gap-1.5 text-gov-gray-500 text-xs"><FileSearch className="w-3.5 h-3.5" />政策补贴匹配</div>}
                value={summaryStats.subsidyMatch}
                valueStyle={{ color: '#D946EF', fontSize: 22 }}
                formatter={(v) => String(v).toLocaleString()}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={8} lg={6}>
            <Card className="shadow-card border-l-4 border-l-amber-500">
              <Statistic
                title={<div className="flex items-center gap-1.5 text-gov-gray-500 text-xs"><FileWarning className="w-3.5 h-3.5" />材料补正案件</div>}
                value={summaryStats.correctionCases}
                valueStyle={{ color: '#F59E0B', fontSize: 22 }}
                formatter={(v) => String(v).toLocaleString()}
              />
            </Card>
          </Col>
        </Row>

        <Card className="shadow-card mb-6" size="small" bodyStyle={{padding: '12px 16px'}}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-gov-gray-700">异常处置快速导航</span>
              <Tag color="orange" className="m-0 text-[10px]">5模块联动</Tag>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button type="link" size="small" className="text-xs" icon={<HandPlatter className="w-3 h-3" />} onClick={() => window.open('/services', '_blank')}>掌上办事</Button>
              <Button type="link" size="small" className="text-xs" icon={<Bot className="w-3 h-3" />} onClick={() => window.open('/guide', '_blank')}>智能导办</Button>
              <Button type="link" size="small" className="text-xs" icon={<CreditCard className="w-3 h-3" />} onClick={() => window.open('/certificates', '_blank')}>电子证照</Button>
              <Button type="link" size="small" className="text-xs" icon={<FileSearch className="w-3 h-3" />} onClick={() => window.open('/admin/policy', '_blank')}>
                <span className="flex items-center gap-1">政策引擎 <Badge count={1} size="small" color="red" /></span>
              </Button>
              <Button type="link" size="small" className="text-xs" icon={<ShieldAlert className="w-3 h-3" />} onClick={() => window.open('/admin/disaster-recovery', '_blank')}>
                <span className="flex items-center gap-1">容灾中心 <Badge count={1} size="small" color="orange" /></span>
              </Button>
            </div>
          </div>
        </Card>

        <Row gutter={[12, 12]} className="mb-6">
          <Col xs={24} xl={12}>
            <Card
              title={<div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary-600" /><span className="font-semibold">办结率趋势（整体 vs 跨域）</span></div>}
              className="shadow-card h-full"
              size="small"
            >
              <div ref={trendChartRef} style={{ height: '300px', width: '100%' }} />
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card
              title={<div className="flex items-center gap-2"><Clock className="w-5 h-5 text-purple-600" /><span className="font-semibold">平均办理耗时 vs 目标</span></div>}
              className="shadow-card h-full"
              size="small"
            >
              <div ref={timeChartRef} style={{ height: '300px', width: '100%' }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[12, 12]} className="mb-6">
          <Col xs={24} lg={12}>
            <Card
              title={<div className="flex items-center gap-2"><XCircle className="w-5 h-5 text-red-600" /><span className="font-semibold">退件原因分布</span></div>}
              className="shadow-card h-full"
              size="small"
            >
              <div ref={pieChartRef} style={{ height: '300px', width: '100%' }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={<div className="flex items-center gap-2"><Users className="w-5 h-5 text-orange-600" /><span className="font-semibold">办理渠道分布</span></div>}
              className="shadow-card h-full"
              size="small"
            >
              <div ref={channelChartRef} style={{ height: '300px', width: '100%' }} />
            </Card>
          </Col>
        </Row>

        <Card
          title={
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-orange-600" />
                <span className="font-semibold">退件原因聚类结论</span>
                <Badge count={REJECTION_CLUSTER_INSIGHTS.length} className="ml-1" offset={[0, 0]} />
              </div>
              <Space size="small">
                <Tag color="red" className="m-0">高危 1</Tag>
                <Tag color="orange" className="m-0">中危 2</Tag>
                <Tag color="blue" className="m-0">低危 1</Tag>
              </Space>
            </div>
          }
          className="shadow-card mb-6"
          size="small"
        >
          <List
            itemLayout="vertical"
            dataSource={REJECTION_CLUSTER_INSIGHTS}
            renderItem={(item) => (
              <List.Item key={item.title}>
                <div className="flex items-start gap-3 w-full">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    item.level === 'high' ? 'bg-red-50' : item.level === 'medium' ? 'bg-orange-50' : 'bg-blue-50'
                  }`}>
                    {item.level === 'high' ? <AlertTriangle className="w-5 h-5 text-red-600" /> :
                      item.level === 'medium' ? <ShieldAlert className="w-5 h-5 text-orange-600" /> :
                      <Info className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h4 className="font-semibold text-gov-gray-700 m-0">{item.title}</h4>
                      <Tag color={
                        item.level === 'high' ? 'red' : item.level === 'medium' ? 'orange' : 'blue'
                      } className="m-0 text-xs">
                        {item.level === 'high' ? '高风险' : item.level === 'medium' ? '中风险' : '低风险'}
                      </Tag>
                    </div>
                    <p className="text-sm text-gov-gray-600 leading-relaxed mb-3">{item.desc}</p>
                    <div className="flex items-start gap-3 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <span className="text-xs text-gov-gray-500 mb-1.5 block">涉及部门</span>
                        <Space size={[4, 4]} wrap>
                          {item.affected.map(d => (
                            <Tag key={d} color="geekblue" className="m-0 text-xs">{d}</Tag>
                          ))}
                        </Space>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <span className="text-xs text-gov-gray-500 mb-1.5 block">优化建议</span>
                        <Tag color="green" className="m-0 text-xs bg-green-50">
                          {item.suggestion}
                        </Tag>
                      </div>
                      {item.relatedModule && (
                        <div className="flex-1 min-w-[200px]">
                          <span className="text-xs text-gov-gray-500 mb-1.5 block">关联处置</span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              type="link"
                              size="small"
                              className="p-0 text-xs"
                              icon={
                                item.relatedModule === 'policy' ? <FileSearch className="w-3.5 h-3.5" /> :
                                item.relatedModule === 'disaster' ? <ShieldAlert className="w-3.5 h-3.5" /> :
                                <FileKey className="w-3.5 h-3.5" />
                              }
                              onClick={() => {
                                if (item.relatedModule === 'policy') {
                                  window.open('/admin/policy', '_blank');
                                } else if (item.relatedModule === 'disaster') {
                                  window.open('/admin/disaster-recovery', '_blank');
                                }
                              }}
                            >
                              {item.relatedAction}
                            </Button>
                            <Tag color="green" className="m-0 text-[10px]">处置已回写</Tag>
                          </div>
                        </div>
                      )}
                      {!item.relatedModule && (
                        <div className="flex-1 min-w-[200px]">
                          <span className="text-xs text-gov-gray-500 mb-1.5 block">处置状态</span>
                          <Tag color="blue" className="m-0 text-xs">监测持续跟踪中</Tag>
                        </div>
                      )}
                      {item.recheckData && (
                        <div className="flex-1 min-w-[240px]">
                          <span className="text-xs text-gov-gray-500 mb-1.5 block">复验凭据</span>
                          <div className="space-y-1">
                            {item.recheckData.items.map((ri: any, idx: number) => (
                              <div key={idx} className="text-[11px] bg-gov-gray-50 rounded px-2 py-1.5">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <span className="text-gov-gray-700 font-medium">{ri.serviceName}</span>
                                  <Tag color="blue" className="m-0 text-[9px]">{ri.cases}件</Tag>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-gov-gray-500">
                                  <span>办结率: <span className="text-red-500">{ri.completionRateBefore}%</span> → <span className="text-green-600 font-medium">{ri.completionRateAfter}%</span></span>
                                  <span>耗时: {ri.avgTimeBefore}天 → {ri.avgTimeAfter}天</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
          <Divider className="my-4" />
          <div className="flex items-center gap-2 mb-3">
            <FileCheck2 className="w-4 h-4 text-green-600" />
            <span className="font-medium text-sm text-gov-gray-700">处置复查记录</span>
            <Tag color="green" className="m-0 text-xs">{DISPOSAL_RECORDS.length}条已处置</Tag>
            <span className="text-[11px] text-gov-gray-400 ml-2">含校准前后对比指标</span>
          </div>
          <div className="space-y-3">
            {DISPOSAL_RECORDS.map((r, i) => (
              <div key={i} className="bg-green-50/30 rounded-xl border border-green-100 overflow-hidden">
                <div className="p-3 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium text-gov-gray-700">{r.action}</span>
                      <Tag color={r.module === 'policy' ? 'purple' : r.module === 'disaster' ? 'orange' : 'blue'} className="m-0 text-[10px]">
                        {r.module === 'policy' ? '政策引擎' : r.module === 'disaster' ? '容灾中心' : '电子证照'}
                      </Tag>
                      <Tag color="green" className="m-0 text-[10px]">已处置</Tag>
                    </div>
                    <div className="text-[11px] text-gov-gray-500">{r.detail}</div>
                    <div className="text-[10px] text-gov-gray-400 mt-1">处置人：{r.handler} · {r.time}</div>
                    {r.verificationData && (
                      <div className="mt-2 p-2.5 bg-white rounded border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-blue-600" />
                            <span className="text-[11px] font-medium text-gov-gray-700">复验对比指标</span>
                          </div>
                          <Tag color={r.status === 'verified' ? 'green' : 'orange'} className="m-0 text-[9px]">
                            {r.status === 'verified' ? '✓ 已验收' : '待验收'}
                          </Tag>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                          <div className="flex items-center justify-between">
                            <span className="text-gov-gray-500">校准前:</span>
                            <span className="text-red-500 font-medium">{r.verificationData.beforeValue}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gov-gray-500">校准后:</span>
                            <span className="text-green-600 font-medium">{r.verificationData.afterValue}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gov-gray-500">异常件数:</span>
                            <span className="text-gov-gray-700">{r.verificationData.affectedCountBefore} → {r.verificationData.affectedCountAfter}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gov-gray-500">通过率:</span>
                            <span className="text-gov-gray-700">{r.verificationData.passRateBefore}% → <span className="text-green-600">{r.verificationData.passRateAfter}%</span></span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gov-gray-500">重受理:</span>
                            <span className="text-blue-600 font-medium">{r.verificationData.reAcceptedCount}件</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gov-gray-500">审计:</span>
                            <span className="text-gov-gray-700">{r.verificationData.verifier} · {r.verificationData.verifyTime}</span>
                          </div>
                        </div>
                        {r.status !== 'verified' && (
                          <div className="mt-2 flex items-center gap-2">
                            <Button type="primary" size="small" className="h-6 text-[10px] px-2">确认验收并回写状态</Button>
                            <Button size="small" className="h-6 text-[10px] px-2">查看处置台账</Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-t border-green-100 px-3 py-2.5 bg-white/50">
                  <div className="flex items-center gap-1.5 mb-2">
                    <BarChart3 className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-[11px] font-medium text-gov-gray-700">处置前后对比</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {Object.entries(r.beforeMetrics).map(([key, beforeVal]) => {
                      const afterVal = r.afterMetrics[key as keyof typeof r.afterMetrics];
                      return (
                        <div key={key} className="bg-white rounded-lg p-2 border border-gov-gray-100">
                          <div className="text-[10px] text-gov-gray-400 mb-0.5">
                            {key === 'matchRate' ? '匹配率' : key === 'errorCount' ? '误退件数' : key === 'affectedItems' ? '影响事项' :
                             key === 'callSuccessRate' ? '调用成功率' : key === 'avgResponseTime' ? '平均响应(ms)' : key === 'failCount' ? '失败次数' :
                             key === 'certCallSuccess' ? '证照调用成功率' : key === 'timeoutCount' ? '超时次数' : key === 'affectedDepts' ? '影响部门' : key}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-red-500 line-through">{String(beforeVal)}</span>
                            <ArrowRight className="w-3 h-3 text-green-500" />
                            <span className="text-[11px] text-green-600 font-medium">{String(afterVal)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="space-y-1">
                    {r.verificationEvidence.map((e, j) => (
                      <div key={j} className="flex items-center gap-2 text-[10px]">
                        <span className="text-gov-gray-500 w-20 flex-shrink-0">{e.label}</span>
                        <span className="text-red-400">{e.before}</span>
                        <ArrowRight className="w-3 h-3 text-green-500" />
                        <span className="text-green-600 font-medium">{e.after}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          className="shadow-card mb-6"
          size="small"
          title={
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="font-semibold">全量退件拆解表（499件）</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Tag color="red" className="m-0 text-xs">材料不齐 234</Tag>
                <Tag color="purple" className="m-0 text-xs">政策异常 18</Tag>
                <Tag color="orange" className="m-0 text-xs">证照失败 156</Tag>
                <Tag color="blue" className="m-0 text-xs">信息错误 67</Tag>
                <Tag color="gray" className="m-0 text-xs">不符合 24</Tag>
              </div>
            </div>
          }
          extra={
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-gov-gray-500">汇总：</span>
              <span className="text-green-600 font-medium">已重受理287件</span>
              <span className="text-orange-500 font-medium">补正中176件</span>
              <span className="text-gov-gray-400 font-medium">待处理36件</span>
              <Tag color="green" className="m-0 text-[10px]">办结率 68.2%→94.7%↑</Tag>
              <Tag color="blue" className="m-0 text-[10px]">平均耗时 5.8→2.1天↓</Tag>
            </div>
          }
        >
          <Table
            dataSource={REJECTION_BREAKDOWN}
            size="small"
            scroll={{ x: 1800 }}
            pagination={{ pageSize: 8, showTotal: (total: number) => `共 ${total}/499 条退件记录 · 支持业务复核` }}
            columns={[
              { title: '退件编号', dataIndex: 'rejectNo', key: 'rejectNo', width: 140, render: (v: string) => <span className="text-xs font-mono text-red-600">{v}</span> },
              { title: '事项名称', dataIndex: 'serviceName', key: 'serviceName', width: 140, render: (v: string) => <span className="text-xs font-medium text-gov-gray-700">{v}</span> },
              { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 80, render: (v: string) => <span className="text-xs text-gov-gray-600">{v}</span> },
              { title: '责任部门', dataIndex: 'department', key: 'department', width: 150, render: (v: string) => <Tag color="geekblue" className="m-0 text-xs">{v}</Tag> },
              { title: '退件原因', dataIndex: 'rejectReason', key: 'rejectReason', width: 110, render: (v: string) => {
                const cm: Record<string, string> = { '材料不齐全': 'red', '政策适配异常': 'purple', '证照互认失败': 'orange', '填写信息错误': 'blue', '不符合条件': 'default' };
                return <Tag color={cm[v] || 'default'} className="m-0 text-xs">{v}</Tag>;
              }},
              {
                title: '材料补正要求', dataIndex: 'correctionRequired', key: 'correctionRequired', width: 220,
                render: (items: any[]) => items.length > 0 ? (
                  <Popover content={
                    <div className="space-y-1.5" style={{maxWidth:260}}>
                      {items.map((it: any, idx: number) => (
                        <div key={idx} className="text-[11px]">
                          <span className="text-orange-600 font-medium mr-1.5">○</span>
                          <span className="text-gov-gray-700">{it.name}</span>
                          <span className="text-gov-gray-400 ml-1">— {it.detail}</span>
                        </div>
                      ))}
                    </div>
                  } title="补正要求">
                    <span className="text-xs cursor-pointer text-orange-600 underline">{items.length}项需补</span>
                  </Popover>
                ) : <span className="text-[11px] text-green-600">无需补正</span>,
              },
              {
                title: '重新受理状态', dataIndex: 'reacceptStatus', key: 'reacceptStatus', width: 100,
                render: (v: string) => {
                  const cm: Record<string, string> = { '已办结': 'green', '已重新受理': 'blue', '补正中': 'orange', '待处理': 'default' };
                  return <Tag color={cm[v]} className="m-0 text-xs">{v}</Tag>;
                },
              },
              {
                title: '原耗时', dataIndex: 'timeBefore', key: 'timeBefore', width: 70,
                render: (v: number) => <span className="text-xs text-red-500">{v}天</span>,
              },
              {
                title: '补正后耗时', dataIndex: 'timeAfter', key: 'timeAfter', width: 90,
                render: (v: any) => <span className={`text-xs font-medium ${v !== '-' ? 'text-green-600' : 'text-gov-gray-400'}`}>{v === '-' ? v : `${v}天`}</span>,
              },
              {
                title: '重新受理时间', dataIndex: 'reacceptedAt', key: 'reacceptedAt', width: 120, render: (v: string) => <span className="text-[11px] text-gov-gray-500">{v}</span>,
              },
              {
                title: '办结率影响', dataIndex: 'impactCompletion', key: 'impactCompletion', width: 90,
                render: (v: string) => (
                  <div>
                    <div className="text-xs text-gov-gray-700 mb-0.5">-{v}%</div>
                    <Progress percent={Math.floor(100 - parseFloat(v))} size="small" showInfo={false} strokeColor="#00B42A" />
                  </div>
                ),
              },
              {
                title: '操作', key: 'action', width: 160, fixed: 'right' as const,
                render: () => (
                  <Space size="small">
                    <Button type="link" size="small" className="text-[10px] p-0">查看退件单</Button>
                    <Button type="link" size="small" className="text-[10px] p-0">重新受理</Button>
                    <Button type="link" size="small" className="text-[10px] p-0">复核确认</Button>
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        <Row gutter={[12, 12]} className="mb-6">
          <Col xs={24} xl={12}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-green-600" />
                  <span className="font-semibold">事项办理链路穿透</span>
                  <Tag color="cyan" className="m-0 ml-1 text-xs">跨部门追踪</Tag>
                </div>
              }
              className="shadow-card h-full"
              size="small"
              extra={
                <Button type="link" size="small" icon={expandedLedger ? <Eye className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />} onClick={() => setExpandedLedger(!expandedLedger)}>
                  {expandedLedger ? '收起台账' : `查看全部 ${HANDLING_CHAINS.length}+`}
                </Button>
              }
            >
              {HANDLING_CHAINS.map(chain => (
                <div key={chain.id} className="mb-5 pb-5 border-b border-gov-gray-100 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        status={chain.status === 'done' ? 'success' : chain.status === 'warning' ? 'warning' : 'processing'}
                        text={<span className="font-semibold text-gov-gray-700 text-sm">{chain.service}</span>}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Tag color="geekblue" className="m-0 text-xs">{chain.citizen}</Tag>
                      <span className="text-[11px] text-gov-gray-400">{chain.applyTime}</span>
                    </div>
                  </div>
                  <div className="pl-1">
                    <Steps
                      size="small"
                      current={chain.currentStep}
                      direction="vertical"
                      className="performance-chain-steps"
                      items={chain.steps.map(step => ({
                        title: (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-xs" style={{ color: chainStatusColor(step.status) }}>
                              {step.title}
                            </span>
                            <Tag color="geekblue" className="m-0 text-[10px]">{step.dept}</Tag>
                            {step.time !== '待处理' && step.time !== '待补正' && (
                              <span className="text-[10px] text-gov-gray-400">{step.time}</span>
                            )}
                          </div>
                        ),
                        description: (
                          <div className="text-[11px] text-gov-gray-500 leading-relaxed pl-1 mt-0.5">
                            {step.desc}
                          </div>
                        ),
                        status: step.status === 'warning' ? 'error' : (step.status as any),
                        icon: chainStatusIcon(step.status),
                      }))}
                    />
                  </div>
                  {chain.pushNotifications && chain.pushNotifications.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-dashed border-gov-gray-200">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Bell className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[11px] font-medium text-gov-gray-600">进度推送记录（{chain.pushNotifications.length}条）</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {chain.pushNotifications.map((pn: any, pi: number) => (
                          <div key={pi} className="flex items-center gap-2 text-[10px]">
                            <Tag color={pn.status === 'sent' ? 'green' : 'orange'} className="m-0 text-[9px]" style={{fontSize:'9px'}}>
                              {pn.status === 'sent' ? '已推送' : '待推送'}
                            </Tag>
                            <span className="text-gov-gray-500 w-16">{pn.channel}</span>
                            <span className="text-gov-gray-400 w-20 flex-shrink-0">{pn.time}</span>
                            <span className="text-gov-gray-600 flex-1 truncate">{pn.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <style>{`
                .performance-chain-steps .ant-steps-item-icon {
                  width: 22px !important;
                  height: 22px !important;
                  line-height: 22px !important;
                }
                .performance-chain-steps .ant-steps-item-title::after {
                  top: 14px !important;
                }
              `}</style>
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold">材料补正与进度推送闭环</span>
                  <Tag color="orange" className="m-0 ml-1 text-xs">多渠道通知</Tag>
                </div>
              }
              className="shadow-card h-full"
              size="small"
              extra={
                <Space size="small">
                  <Button type="link" size="small" icon={expandedCorrection ? <Eye className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />} onClick={() => setExpandedCorrection(!expandedCorrection)}>
                    {expandedCorrection ? '收起' : '查看全部'}
                  </Button>
                  <Button type="link" size="small" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => setReminderModalVisible(true)}>
                    催办统计
                  </Button>
                </Space>
              }
            >
              {MATERIAL_CORRECTION_CASES.map(c => (
                <div key={c.id} className="mb-5 pb-5 border-b border-gov-gray-100 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-semibold text-gov-gray-700 text-sm m-0">{c.service}</h4>
                        <Tag color="purple" className="m-0 text-xs">{c.department}</Tag>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gov-gray-400 flex-wrap">
                        <span>申请人：{c.applicant}</span>
                        <span>提交：{c.submitTime}</span>
                        <span>退件：{c.rejectTime}</span>
                      </div>
                    </div>
                    <Tag color="red" className="m-0 text-xs flex-shrink-0">
                      补正截止：{c.fixDeadline.slice(5)}
                    </Tag>
                  </div>
                  <div className="mb-3 bg-gov-gray-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-gov-gray-600 mb-2 flex items-center gap-1.5">
                      <FileWarning className="w-3.5 h-3.5 text-orange-600" />
                      待补正材料（{c.missingItems.length}项）
                    </div>
                    <div className="space-y-1.5">
                      {c.missingItems.map((m, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 text-[11px]">
                          <div className="flex-1 min-w-0">
                            <span className={`font-medium mr-1.5 ${m.status === 'done' ? 'text-green-600' : 'text-orange-600'}`}>
                              {m.status === 'done' ? '✓' : '○'}
                            </span>
                            <span className="text-gov-gray-700">{m.name}</span>
                            <span className="text-gov-gray-400 ml-2">— {m.reason}</span>
                          </div>
                          <Tag color={m.status === 'done' ? 'green' : 'orange'} className="m-0 text-[10px] flex-shrink-0">
                            {m.status === 'done' ? '已补正' : '待补正'}
                          </Tag>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gov-gray-600 mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-600" />
                      进度推送渠道状态
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {c.pushStatus.map((ps, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-white border border-gov-gray-100 rounded-lg">
                          <span className="text-[11px] text-gov-gray-600">{ps.channel}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gov-gray-400">{ps.time}</span>
                            {ps.status === 'sent' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            ) : ps.status === 'failed' ? (
                              <XCircle className="w-3.5 h-3.5 text-red-500" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-gov-gray-400" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          </Col>
        </Row>

        {expandedLedger && (
          <Card
            className="shadow-card mb-6"
            size="small"
            title={
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-green-600" />
                <span className="font-semibold">办件台账（全量穿透）</span>
                <Tag color="green" className="m-0 ml-1 text-xs">{LEDGER_RECORDS.length}条在办</Tag>
              </div>
            }
            extra={
              <Button type="link" size="small" onClick={() => setExpandedLedger(false)} icon={<Eye className="w-3.5 h-3.5" />}>
                收起台账
              </Button>
            }
          >
            <Table
              dataSource={LEDGER_RECORDS}
              size="small"
              scroll={{ x: 2100 }}
              pagination={{ pageSize: 8, showTotal: (total) => `共 ${total} 条在办记录` }}
              columns={[
                { title: '申请编号', dataIndex: 'applyNo', key: 'applyNo', width: 140, render: (v: string) => <span className="text-xs font-mono text-blue-600">{v}</span> },
                { title: '事项名称', dataIndex: 'serviceName', key: 'serviceName', width: 180, render: (v: string) => <span className="text-xs font-medium text-gov-gray-700">{v}</span> },
                { title: '申请人', dataIndex: 'applicant', key: 'applicant', width: 100, render: (v: string) => <span className="text-xs text-gov-gray-600">{v}</span> },
                { title: '责任部门', dataIndex: 'department', key: 'department', width: 160, render: (v: string) => <Tag color="geekblue" className="m-0 text-xs">{v}</Tag> },
                { title: '当前节点', dataIndex: 'currentNode', key: 'currentNode', width: 100, render: (v: string) => <span className="text-xs text-gov-gray-600">{v}</span> },
                { title: '节点责任人', dataIndex: 'nodePerson', key: 'nodePerson', width: 100, render: (v: string) => <span className="text-xs text-gov-gray-600">{v}</span> },
                {
                  title: '办理状态', dataIndex: 'status', key: 'status', width: 100,
                  render: (v: string) => {
                    const colorMap: Record<string, string> = { '办理中': 'blue', '审核中': 'purple', '补正中': 'orange', '即将超期': 'red' };
                    return <Tag color={colorMap[v] || 'default'} className="m-0 text-xs">{v}</Tag>;
                  },
                },
                {
                  title: '已耗时', dataIndex: 'elapsed', key: 'elapsed', width: 90,
                  render: (v: number) => (
                    <span className={`text-xs font-medium ${v >= 72 ? 'text-red-600' : v >= 24 ? 'text-orange-600' : 'text-gov-gray-600'}`}>
                      {v}小时
                    </span>
                  ),
                },
                {
                  title: '补正明细', dataIndex: 'correctionItems', key: 'correctionItems', width: 150,
                  render: (items: any[]) => items.length > 0 ? (
                    <Popover content={
                      <div className="space-y-1.5" style={{maxWidth:280}}>
                        {items.map((m: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className={m.status === 'done' ? 'text-green-600' : 'text-orange-600'}>{m.status === 'done' ? '✓' : '○'}</span>
                            <span className="text-gov-gray-700">{m.name}</span>
                            <span className="text-gov-gray-400">— {m.reason}</span>
                          </div>
                        ))}
                      </div>
                    } title="补正材料明细">
                      <Tag color="orange" className="m-0 text-xs cursor-pointer">{items.length}项待补</Tag>
                    </Popover>
                  ) : <Tag color="green" className="m-0 text-xs">无补正</Tag>,
                },
                {
                  title: '证照调用', dataIndex: 'certCalls', key: 'certCalls', width: 150,
                  render: (calls: any[]) => (
                    <Popover content={
                      <div className="space-y-1.5" style={{maxWidth:280}}>
                        {calls.map((c: any, i: number) => (
                          <div key={i} className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-gov-gray-700">{c.certName}</span>
                            <Tag color={c.status === 'success' ? 'green' : c.status === 'failed' ? 'red' : 'orange'} className="m-0 text-[10px]">
                              {c.status === 'success' ? '成功' : c.status === 'failed' ? '失败' : '超时'}
                            </Tag>
                          </div>
                        ))}
                      </div>
                    } title="证照互认调用记录">
                      <span className="text-xs cursor-pointer text-blue-600 underline">
                        {calls.filter((c: any) => c.status === 'success').length}/{calls.length}成功
                      </span>
                    </Popover>
                  ),
                },
                {
                  title: '退件归因', dataIndex: 'rejectionReason', key: 'rejectionReason', width: 160,
                  render: (r: any) => r ? (
                    <Popover content={
                      <div style={{maxWidth:260}}>
                        <div className="text-xs font-medium text-gov-gray-700 mb-1">{r.mainReason}</div>
                        <div className="space-y-0.5">
                          {r.subReasons.map((s: string, i: number) => (
                            <div key={i} className="text-[11px] text-gov-gray-500">• {s}</div>
                          ))}
                        </div>
                        <Tag color="geekblue" className="m-0 text-[10px] mt-1">{r.affectedDept}</Tag>
                      </div>
                    } title="退件原因归因">
                      <Tag color="red" className="m-0 text-xs cursor-pointer">{r.mainReason}</Tag>
                    </Popover>
                  ) : <Tag color="green" className="m-0 text-xs">正常</Tag>,
                },
                {
                  title: '推送状态', dataIndex: 'pushStatus', key: 'pushStatus', width: 130,
                  render: (ps: any[]) => (
                    <div className="flex flex-wrap gap-1">
                      {ps.map((p: any, i: number) => (
                        <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${p.sent ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                          {p.channel}
                        </span>
                      ))}
                    </div>
                  ),
                },
                {
                  title: '签收轨迹', dataIndex: 'signTrail', key: 'signTrail', width: 160,
                  render: (trail: any[]) => (
                    <Popover content={
                      <div className="space-y-1.5" style={{maxWidth:280}}>
                        {trail.map((s: any, i: number) => (
                          <div key={i} className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5">
                              <Tag color={s.status === 'signed' ? 'green' : s.status === 'timeout' ? 'red' : 'orange'} className="m-0 text-[10px]">
                                {s.status === 'signed' ? '已签收' : s.status === 'timeout' ? '超时' : '待签收'}
                              </Tag>
                              <span className="text-gov-gray-700">{s.dept}</span>
                            </div>
                            <span className="text-gov-gray-400">{s.status === 'signed' ? s.signer : '—'}</span>
                          </div>
                        ))}
                      </div>
                    } title="跨部门签收轨迹">
                      <span className="text-xs cursor-pointer text-blue-600 underline">
                        {trail.filter((s: any) => s.status === 'signed').length}/{trail.length}已签收
                      </span>
                    </Popover>
                  ),
                },
                {
                  title: '操作', key: 'action', width: 140, fixed: 'right' as const,
                  render: (_: any, record: any) => (
                    <Space size="small">
                      <Button type="link" size="small" className="text-xs p-0" icon={<Bell className="w-3 h-3" />} onClick={() => setReminderModalVisible(true)}>催办</Button>
                      <Button type="link" size="small" className="text-xs p-0" icon={<GitBranch className="w-3 h-3" />} onClick={() => setExpandedChainKey(expandedChainKey === record.key ? null : String(record.key))}>查看链路</Button>
                    </Space>
                  ),
                },
              ]}
            />
            {expandedChainKey && (() => {
              const chainRecord = LEDGER_RECORDS.find(r => r.key === expandedChainKey);
              if (!chainRecord) return null;
              const chainSteps = [
                { title: '申请提交', dept: '群众端', signer: chainRecord.applicant, signTime: chainRecord.applyNo.replace('2026-BS-', '06-16 ').replace(/(\d{2})(\d{2})/, '$1:$2'), status: 'finish' as const },
                { title: '材料预审', dept: chainRecord.department, signer: chainRecord.nodePerson, signTime: '系统自动', status: 'finish' as const },
                { title: chainRecord.currentNode, dept: chainRecord.department, signer: chainRecord.nodePerson, signTime: chainRecord.status === '即将超期' ? '超时处理中' : '处理中', status: 'process' as const },
                ...(chainRecord.rejectionReason ? [{ title: '退件归因', dept: chainRecord.rejectionReason.affectedDept, signer: '-', signTime: '-', status: 'error' as const }] : []),
                { title: '审批签发', dept: chainRecord.department, signer: '-', signTime: '-', status: 'wait' as const },
                { title: '结果送达', dept: chainRecord.department, signer: '-', signTime: '-', status: 'wait' as const },
              ];
              return (
                <div className="mt-4 border border-blue-200 rounded-lg bg-blue-50/30 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gov-gray-700">案例穿透 — {chainRecord.serviceName}</span>
                      <Tag color="geekblue" className="m-0 text-xs">{chainRecord.applyNo}</Tag>
                      <Tag color={chainRecord.status === '即将超期' ? 'red' : chainRecord.status === '补正中' ? 'orange' : 'blue'} className="m-0 text-xs">{chainRecord.status}</Tag>
                    </div>
                    <Button type="link" size="small" className="text-xs p-0" onClick={() => setExpandedChainKey(null)} icon={<Eye className="w-3 h-3" />}>收起链路</Button>
                  </div>
                  <Tabs defaultActiveKey="1" type="card" size="small" items={[
                    {
                      key: '1',
                      label: <span className="text-xs flex items-center gap-1"><Network className="w-3 h-3" />事项办理链路</span>,
                      children: (
                        <div className="bg-white rounded-lg p-4 border border-gov-gray-100">
                          <Steps current={2} status={chainRecord.rejectionReason ? 'error' : 'process'} items={chainSteps.map(s => ({
                            title: <span className="text-xs font-medium">{s.title}</span>,
                            description: (
                              <div className="text-[11px] space-y-0.5">
                                <div className="text-gov-gray-500">{s.dept}</div>
                                <div className="text-gov-gray-400">签收人：{s.signer}</div>
                                <div className="text-gov-gray-400">{s.signTime}</div>
                              </div>
                            ),
                          }))} />
                        </div>
                      ),
                    },
                    {
                      key: '2',
                      label: <span className="text-xs flex items-center gap-1"><FileCheck2 className="w-3 h-3" />材料补正明细</span>,
                      children: chainRecord.correctionItems.length > 0 ? (
                        <div className="bg-white rounded-lg p-4 border border-gov-gray-100 space-y-2">
                          {chainRecord.correctionItems.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between gap-3 px-3 py-2 bg-gov-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className={item.status === 'done' ? 'text-green-600' : 'text-orange-600'}>{item.status === 'done' ? '✓' : '○'}</span>
                                <span className="text-xs font-medium text-gov-gray-700">{item.name}</span>
                              </div>
                              <span className="text-xs text-gov-gray-400">{item.reason}</span>
                              <Tag color={item.status === 'done' ? 'green' : 'orange'} className="m-0 text-[10px]">{item.status === 'done' ? '已补正' : '待补正'}</Tag>
                            </div>
                          ))}
                        </div>
                      ) : <Empty description="无补正材料" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
                    },
                    {
                      key: '3',
                      label: <span className="text-xs flex items-center gap-1"><FileKey className="w-3 h-3" />证照互认调用</span>,
                      children: (
                        <div className="bg-white rounded-lg p-4 border border-gov-gray-100 space-y-2">
                          {chainRecord.certCalls.map((c: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between gap-3 px-3 py-2 bg-gov-gray-50 rounded-lg">
                              <span className="text-xs font-medium text-gov-gray-700">{c.certName}</span>
                              <span className="text-xs text-gov-gray-500">{c.callTime}</span>
                              <Tag color="geekblue" className="m-0 text-[10px]">{c.dept}</Tag>
                              <Tag color={c.status === 'success' ? 'green' : c.status === 'failed' ? 'red' : 'orange'} className="m-0 text-[10px]">
                                {c.status === 'success' ? '调用成功' : c.status === 'failed' ? '调用失败' : '调用超时'}
                              </Tag>
                            </div>
                          ))}
                        </div>
                      ),
                    },
                    {
                      key: '4',
                      label: <span className="text-xs flex items-center gap-1"><ShieldAlert className="w-3 h-3" />退件原因归因</span>,
                      children: chainRecord.rejectionReason ? (
                        <div className="bg-white rounded-lg p-4 border border-gov-gray-100">
                          <div className="flex items-center gap-2 mb-3">
                            <Tag color="red" className="m-0 text-xs">{chainRecord.rejectionReason.mainReason}</Tag>
                            <Tag color="geekblue" className="m-0 text-[10px]">涉及部门：{chainRecord.rejectionReason.affectedDept}</Tag>
                          </div>
                          <div className="space-y-1.5">
                            {chainRecord.rejectionReason.subReasons.map((s: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
                                <AlertTriangle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-gov-gray-700">{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : <Empty description="无退件记录，流程正常" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
                    },
                    {
                      key: '5',
                      label: <span className="text-xs flex items-center gap-1"><Users className="w-3 h-3" />签收轨迹 & 推送</span>,
                      children: (
                        <div className="bg-white rounded-lg p-4 border border-gov-gray-100">
                          <Row gutter={24}>
                            <Col span={14}>
                              <div className="text-xs font-medium text-gov-gray-600 mb-3 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-blue-600" />
                                跨部门签收轨迹
                              </div>
                              <Timeline items={chainRecord.signTrail.map((s: any) => ({
                                color: s.status === 'signed' ? 'green' : s.status === 'timeout' ? 'red' : 'gray',
                                children: (
                                  <div className="text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gov-gray-700">{s.dept}</span>
                                      <Tag color={s.status === 'signed' ? 'green' : s.status === 'timeout' ? 'red' : 'orange'} className="m-0 text-[10px]">
                                        {s.status === 'signed' ? '已签收' : s.status === 'timeout' ? '超时' : '待签收'}
                                      </Tag>
                                    </div>
                                    <div className="text-gov-gray-400 mt-0.5">
                                      签收人：{s.status === 'signed' ? s.signer : '—'} | 时间：{s.status === 'signed' ? s.signTime : '—'}
                                    </div>
                                  </div>
                                ),
                              }))} />
                            </Col>
                            <Col span={10}>
                              <div className="text-xs font-medium text-gov-gray-600 mb-3 flex items-center gap-1.5">
                                <Send className="w-3.5 h-3.5 text-green-600" />
                                进度推送状态
                              </div>
                              <div className="space-y-2">
                                {chainRecord.pushStatus.map((p: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-gov-gray-50 rounded-lg">
                                    <span className="text-xs text-gov-gray-600">{p.channel}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-gov-gray-400">{p.time}</span>
                                      <Tag color={p.sent ? 'green' : 'red'} className="m-0 text-[10px]">{p.sent ? '已推送' : '未推送'}</Tag>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </Col>
                          </Row>
                        </div>
                      ),
                    },
                  ]} />
                </div>
              );
            })()}
          </Card>
        )}

        {expandedCorrection && (
          <Card
            className="shadow-card mb-6"
            size="small"
            title={
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">材料补正台账（全量追踪）</span>
                <Tag color="orange" className="m-0 ml-1 text-xs">{ALL_CORRECTION_CASES.length}条补正中</Tag>
              </div>
            }
            extra={
              <Button type="link" size="small" onClick={() => setExpandedCorrection(false)} icon={<Eye className="w-3.5 h-3.5" />}>
                收起
              </Button>
            }
          >
            <List
              itemLayout="vertical"
              dataSource={ALL_CORRECTION_CASES}
              renderItem={(c) => {
                const deadline = dayjs(c.fixDeadline);
                const now = dayjs();
                const daysLeft = deadline.diff(now, 'day');
                return (
                  <List.Item key={c.id}>
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-gov-gray-700 text-sm m-0">{c.service}</h4>
                          <Tag color="purple" className="m-0 text-xs">{c.department}</Tag>
                          <Tag color="geekblue" className="m-0 text-xs">{c.applicant}</Tag>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gov-gray-400 flex-wrap">
                          <span>退件时间：{c.rejectTime}</span>
                        </div>
                      </div>
                      <Tag color={daysLeft <= 3 ? 'red' : daysLeft <= 7 ? 'orange' : 'green'} className="m-0 text-xs flex-shrink-0">
                        补正截止倒计时：{daysLeft}天
                      </Tag>
                    </div>
                    <div className="mb-3 bg-gov-gray-50 rounded-lg p-3">
                      <div className="text-xs font-medium text-gov-gray-600 mb-2 flex items-center gap-1.5">
                        <FileWarning className="w-3.5 h-3.5 text-orange-600" />
                        待补正材料（{c.missingItems.length}项）
                      </div>
                      <div className="space-y-1.5">
                        {c.missingItems.map((m, i) => (
                          <div key={i} className="flex items-start justify-between gap-2 text-[11px]">
                            <div className="flex-1 min-w-0">
                              <span className={`font-medium mr-1.5 ${m.status === 'done' ? 'text-green-600' : 'text-orange-600'}`}>
                                {m.status === 'done' ? '✓' : '○'}
                              </span>
                              <span className="text-gov-gray-700">{m.name}</span>
                              <span className="text-gov-gray-400 ml-2">— {m.reason}</span>
                            </div>
                            <Tag color={m.status === 'done' ? 'green' : 'orange'} className="m-0 text-[10px] flex-shrink-0">
                              {m.status === 'done' ? '已补正' : '待补正'}
                            </Tag>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gov-gray-600 mb-2 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-blue-600" />
                        推送状态
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {c.pushStatus.map((ps, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-white border border-gov-gray-100 rounded-lg">
                            <span className="text-[11px] text-gov-gray-600">{ps.channel}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-gov-gray-400">{ps.time}</span>
                              {ps.status === 'sent' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                              ) : ps.status === 'failed' ? (
                                <XCircle className="w-3.5 h-3.5 text-red-500" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-gov-gray-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          </Card>
        )}

        <Row gutter={[12, 12]} className="mb-6">
          <Col xs={24} lg={12}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-cyan-600" />
                  <span className="font-semibold">事项办理链路阶段通过率</span>
                  <Tag color="cyan" className="m-0 ml-1 text-xs">6环节穿透</Tag>
                </div>
              }
              className="shadow-card h-full"
              size="small"
            >
              <div ref={chainChartRef} style={{ height: '300px', width: '100%' }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <FileKey className="w-5 h-5 text-indigo-600" />
                  <span className="font-semibold">12委办局电子证照互认调用</span>
                  <Tag color="indigo" className="m-0 ml-1 text-xs">全量穿透</Tag>
                </div>
              }
              className="shadow-card h-full"
              size="small"
            >
              <div ref={certChartRef} style={{ height: '300px', width: '100%' }} />
            </Card>
          </Col>
        </Row>

        <Card
          title={
            <div className="flex items-center justify-between flex-wrap gap-3 mb-0">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary-600" />
                <span className="font-semibold">跨模块能力关联监测</span>
                <Tag color="purple" className="m-0 ml-1">政策引擎 · 容灾中心 · 电子证照</Tag>
              </div>
            </div>
          }
          className="shadow-card mb-6"
          size="small"
        >
          <Row gutter={[12, 12]}>
            {CROSS_MODULE_STATUS.map(mod => (
              <Col xs={24} lg={8} key={mod.key}>
                <div className={`h-full rounded-2xl p-4 border-2 ${
                  mod.color === 'purple' ? 'border-purple-100 bg-gradient-to-br from-purple-50/50 to-white' :
                  mod.color === 'orange' ? 'border-orange-100 bg-gradient-to-br from-orange-50/50 to-white' :
                  'border-blue-100 bg-gradient-to-br from-blue-50/50 to-white'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        mod.color === 'purple' ? 'bg-purple-100' :
                        mod.color === 'orange' ? 'bg-orange-100' : 'bg-blue-100'
                      }`}>
                        {mod.icon}
                      </div>
                      <div>
                        <h4 className={`font-bold text-sm m-0 ${
                          mod.color === 'purple' ? 'text-purple-700' :
                          mod.color === 'orange' ? 'text-orange-700' : 'text-blue-700'
                        }`}>{mod.title}</h4>
                      </div>
                    </div>
                    {mod.key === 'disaster' && mod.failoverNow > 0 && (
                      <Badge count={`${mod.failoverNow}系统应急`} color="red" />
                    )}
                  </div>

                  <Row gutter={[8, 8]} className="mb-4">
                    <Col xs={12}>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-gov-gray-100">
                        <div className={`text-[10px] mb-1 ${
                          mod.color === 'purple' ? 'text-purple-500' :
                          mod.color === 'orange' ? 'text-orange-500' : 'text-blue-500'
                        }`}>
                          {mod.key === 'policy' ? '累计匹配成功' :
                           mod.key === 'disaster' ? '缓存受理办件' : '累计调用量'}
                        </div>
                        <div className={`font-bold text-lg ${
                          mod.color === 'purple' ? 'text-purple-700' :
                          mod.color === 'orange' ? 'text-orange-700' : 'text-blue-700'
                        }`}>
                          {(mod.key === 'policy' ? mod.totalMatched :
                            mod.key === 'disaster' ? mod.totalCached :
                            mod.totalCalls).toLocaleString()}
                        </div>
                      </div>
                    </Col>
                    <Col xs={12}>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-gov-gray-100">
                        <div className={`text-[10px] mb-1 ${
                          mod.color === 'purple' ? 'text-purple-500' :
                          mod.color === 'orange' ? 'text-orange-500' : 'text-blue-500'
                        }`}>
                          {mod.key === 'policy' ? '生效政策' :
                           mod.key === 'disaster' ? '监测系统数' : '证照类型数'}
                        </div>
                        <div className="font-bold text-lg text-gov-gray-700">
                          {mod.key === 'policy' ? mod.activePolicies :
                           mod.key === 'disaster' ? `${mod.activeSystems}` :
                           `${mod.certTypes}`}
                          {mod.key === 'policy' ? '项' : mod.key === 'disaster' ? '个' : '类'}
                        </div>
                      </div>
                    </Col>
                    <Col xs={12}>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-gov-gray-100">
                        <div className={`text-[10px] mb-1 ${
                          mod.color === 'purple' ? 'text-purple-500' :
                          mod.color === 'orange' ? 'text-orange-500' : 'text-blue-500'
                        }`}>
                          {mod.key === 'policy' ? '今日新匹配' :
                           mod.key === 'disaster' ? '缓存命中率' : '调用成功率'}
                        </div>
                        <div className={`font-bold text-lg ${
                          mod.color === 'purple' ? 'text-purple-700' :
                          mod.color === 'orange' ? 'text-orange-700' : 'text-blue-700'
                        }`}>
                          {mod.key === 'policy' ? `+${mod.todayNew}` :
                           mod.key === 'disaster' ? `${mod.cacheHitRate}%` :
                           `${mod.successRate}%`}
                        </div>
                      </div>
                    </Col>
                    <Col xs={12}>
                      <div className="bg-white rounded-lg p-3 shadow-sm border border-gov-gray-100">
                        <div className={`text-[10px] mb-1 ${
                          mod.color === 'purple' ? 'text-purple-500' :
                          mod.color === 'orange' ? 'text-orange-500' : 'text-blue-500'
                        }`}>
                          {mod.key === 'policy' ? '异常规则' :
                           mod.key === 'disaster' ? '容灾切换' : '今日失败'}
                        </div>
                        <div className={`font-bold text-lg ${
                          mod.key === 'policy' ? (mod.exceptionCount > 0 ? 'text-red-600' : 'text-green-600') :
                          mod.key === 'disaster' ? (mod.failoverNow > 0 ? 'text-orange-600' : 'text-green-600') :
                          (mod.todayFail > 100 ? 'text-orange-600' : 'text-green-600')
                        }`}>
                          {mod.key === 'policy' ? `${mod.exceptionCount}项` :
                           mod.key === 'disaster' ? `${mod.failoverNow}次` :
                           `${mod.todayFail}次`}
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <div>
                    <div className={`text-[11px] mb-2 font-medium ${
                      mod.color === 'purple' ? 'text-purple-600' :
                      mod.color === 'orange' ? 'text-orange-600' : 'text-blue-600'
                    }`}>
                      TOP监测项
                    </div>
                    <div className="space-y-1.5">
                      {mod.topItems.map((t, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 bg-white rounded-lg px-2.5 py-2 border border-gov-gray-100">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {t.status === 'normal' ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> :
                             t.status === 'warning' ? <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" /> :
                             <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />}
                            <span className="text-xs text-gov-gray-700 truncate">{t.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Progress percent={t.rate} size="small" style={{ width: 50 }} showInfo={false}
                              strokeColor={t.rate >= 97 ? '#00B42A' : t.rate >= 93 ? '#FF7D00' : '#F53F3F'} />
                            {t.note ? (
                              <Tooltip title={t.note}>
                                <Tag color={t.status === 'normal' ? 'green' : t.status === 'warning' ? 'orange' : 'red'} className="m-0 text-[10px]">
                                  {t.count.toLocaleString()}
                                </Tag>
                              </Tooltip>
                            ) : (
                              <span className="text-[11px] text-gov-gray-500 font-medium">{t.count.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold">12委办局效能综合排名</span>
              <Tag color="gold" className="m-0 ml-1 text-xs">穿透至各业务模块</Tag>
            </div>
          }
          className="shadow-card"
          size="small"
        >
          <Table
            dataSource={departmentRanking}
            columns={columns}
            rowKey="id"
            scroll={{ x: 1100 }}
            size="middle"
            pagination={{
              pageSize: 12,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个委办局 · 监测周期：${dateRange[0].format('YYYY-MM-DD')} ~ ${dateRange[1].format('YYYY-MM-DD')}`,
            }}
          />
        </Card>

        <Modal
          title={<div className="flex items-center gap-2"><Bell className="w-5 h-5 text-orange-600" /><span className="font-semibold">催办记录</span></div>}
          open={reminderModalVisible}
          onCancel={() => setReminderModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setReminderModalVisible(false)}>关闭</Button>,
            <Button key="remind" type="primary" icon={<Send className="w-4 h-4" />} onClick={() => setReminderModalVisible(false)}>发起催办</Button>,
          ]}
          width={600}
        >
          <Timeline
            items={[
              {
                color: 'blue',
                children: (
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gov-gray-700">系统自动催办</span>
                        <Tag color="blue" className="m-0 text-xs">自动</Tag>
                      </div>
                      <div className="text-xs text-gov-gray-500">2026-06-16 14:30</div>
                      <div className="text-xs text-gov-gray-600 mt-1">系统检测到住建厅窗口办理超时，自动发起催办通知</div>
                      <Tag color="geekblue" className="m-0 text-xs mt-1">→ 住建厅窗口</Tag>
                    </div>
                  </div>
                ),
              },
              {
                color: 'orange',
                children: (
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gov-gray-700">人工电话催办</span>
                        <Tag color="orange" className="m-0 text-xs">人工</Tag>
                      </div>
                      <div className="text-xs text-gov-gray-500">2026-06-16 10:15</div>
                      <div className="text-xs text-gov-gray-600 mt-1">督办员通过电话联系经办人，督促加快办理进度</div>
                      <Tag color="geekblue" className="m-0 text-xs mt-1">→ 经办人王主任</Tag>
                    </div>
                  </div>
                ),
              },
              {
                color: 'green',
                children: (
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gov-gray-700">短信催办通知已发送</span>
                        <Tag color="green" className="m-0 text-xs">短信</Tag>
                      </div>
                      <div className="text-xs text-gov-gray-500">2026-06-15 16:00</div>
                      <div className="text-xs text-gov-gray-600 mt-1">已通过短信平台向责任人发送催办提醒</div>
                    </div>
                  </div>
                ),
              },
              {
                color: 'gray',
                children: (
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gov-gray-700">事项首次推送</span>
                        <Tag color="default" className="m-0 text-xs">初始</Tag>
                      </div>
                      <div className="text-xs text-gov-gray-500">2026-06-15 09:30</div>
                      <div className="text-xs text-gov-gray-600 mt-1">事项已推送至责任部门，开始办理流程</div>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </Modal>
      </div>
    </div>
  );
}
