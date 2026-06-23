import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Search,
  Filter,
  Clock,
  User,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  FileText,
  Building,
  Star,
  Clock3,
  Gauge,
  ArrowRightLeft,
  PieChart,
  BarChart3,
  TrendingUp,
  ChevronRight,
  CalendarRange,
  Zap,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { appealStatusLabels, appealCategories, districts, urgencyLabels } from '@shared/types';
import type { Appeal, AppealStatus, TransferRecord, EmergencyUrgency } from '@shared/types';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  transferred: 'bg-purple-100 text-purple-700 border-purple-200',
  feedback: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
  overdue: 'bg-red-100 text-red-700 border-red-200',
};

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  processing: RefreshCw,
  transferred: ArrowRightLeft,
  feedback: MessageSquare,
  resolved: CheckCircle,
  closed: XCircle,
  overdue: AlertTriangle,
};

const urgencyColors: Record<EmergencyUrgency, string> = {
  normal: 'bg-slate-100 text-slate-600',
  urgent: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const timelineNodes = [
  { key: 'submit', label: '诉求提交' },
  { key: 'accept', label: '平台受理' },
  { key: 'assign', label: '分类派单' },
  { key: 'process', label: '部门处理' },
  { key: 'transfer', label: '转办12345' },
  { key: 'joint', label: '联合处置' },
  { key: 'feedback', label: '结果反馈' },
  { key: 'evaluate', label: '市民评价' },
];

const mockTransferRecords: TransferRecord[] = [
  {
    id: 'tr_1',
    appealId: 'appeal_3',
    transferTime: '2024-06-18 10:30:00',
    platform12345Id: 'XZ12345000001',
    status12345: 'processing',
    handler: '王专员',
  },
  {
    id: 'tr_2',
    appealId: 'appeal_4',
    transferTime: '2024-06-15 11:00:00',
    platform12345Id: 'XZ12345000002',
    status12345: 'resolved',
    feedbackResult: '已电话回复市民详细解答社保缴费问题，市民表示理解和满意。',
    satisfaction: 5,
    feedbackTime: '2024-06-16 15:00:00',
    handler: '李专员',
  },
  {
    id: 'tr_3',
    appealId: 'appeal_7',
    transferTime: '2024-06-17 09:20:00',
    platform12345Id: 'XZ12345000003',
    status12345: 'processing',
    handler: '张专员',
  },
  {
    id: 'tr_4',
    appealId: 'appeal_8',
    transferTime: '2024-06-14 14:50:00',
    platform12345Id: 'XZ12345000004',
    status12345: 'closed',
    feedbackResult: '已协调环卫部门增加清运频次，问题已解决。',
    satisfaction: 4,
    feedbackTime: '2024-06-15 10:00:00',
    handler: '赵专员',
  },
  {
    id: 'tr_5',
    appealId: 'appeal_9',
    transferTime: '2024-06-19 16:30:00',
    platform12345Id: 'XZ12345000005',
    status12345: 'processing',
    handler: '孙专员',
  },
];

export default function AppealManagement() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [filterStatus, setFilterStatus] = useState<AppealStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState<EmergencyUrgency | 'all'>('all');
  const [filterDuration, setFilterDuration] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'detail' | 'transfer'>('detail');

  useEffect(() => {
    loadAppeals();
  }, [filterStatus, filterCategory, filterDistrict, filterUrgency, filterDuration]);

  const loadAppeals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterDistrict !== 'all') params.append('district', filterDistrict);

      const res = await fetch(`http://localhost:3001/api/appeals?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAppeals(data.data.list);
        if (!selectedAppeal && data.data.list.length > 0) {
          setSelectedAppeal(data.data.list[0]);
        }
      }
    } catch (e) {
      const mockData: Appeal[] = [
        {
          id: 'appeal_1',
          title: '反映小区下水道堵塞问题',
          content: '市民反映：小区下水道堵塞问题，希望相关部门能够尽快处理解决，谢谢！详细情况：该问题已经存在一段时间了，对日常生活造成了一定影响。诉求：希望相关部门能够重视并尽快处理。',
          category: '市政设施',
          status: 'pending',
          urgency: 'urgent',
          citizenName: '王先生',
          citizenPhone: '13812345678',
          address: '彭城路123号',
          district: '鼓楼区',
          createTime: '2024-06-20 09:30:00',
          processingDurationHours: 4,
          handler: '李受理员',
          logs: [
            { id: '1', action: '诉求提交', operator: '王先生', remark: '市民通过平台提交诉求', time: '2024-06-20 09:30:00' },
          ],
        },
        {
          id: 'appeal_2',
          title: '建议增设公共自行车站点',
          content: '市民建议在XX路附近增设公共自行车站点，方便居民出行。该区域人流量较大，但公共交通不够便利，希望能增加公共自行车覆盖。',
          category: '交通出行',
          status: 'processing',
          urgency: 'normal',
          citizenName: '李女士',
          citizenPhone: '13987654321',
          address: '淮海东路456号',
          district: '云龙区',
          createTime: '2024-06-19 14:20:00',
          processingDurationHours: 28,
          handler: '张受理员',
          logs: [
            { id: '1', action: '诉求提交', operator: '李女士', remark: '市民通过平台提交诉求', time: '2024-06-19 14:20:00' },
            { id: '2', action: '平台受理', operator: '张受理员', remark: '诉求已受理，正在分类', time: '2024-06-19 14:35:00' },
            { id: '3', action: '分类派单', operator: '张受理员', remark: '已分派至交通运输局处理', time: '2024-06-19 15:00:00' },
            { id: '4', action: '部门处理', operator: '交通运输局', remark: '正在研究增设方案，预计3个工作日内反馈', time: '2024-06-19 16:20:00' },
          ],
        },
        {
          id: 'appeal_3',
          title: '投诉施工噪音扰民',
          content: '市民投诉：附近工地夜间施工噪音严重扰民，影响居民正常休息。希望相关部门加强监管，规范施工时间。',
          category: '噪音扰民',
          status: 'transferred',
          urgency: 'critical',
          citizenName: '张大爷',
          citizenPhone: '13756781234',
          address: '解放南路789号',
          district: '泉山区',
          platform12345Id: 'XZ12345000001',
          transferTime: '2024-06-18 10:30:00',
          createTime: '2024-06-17 16:45:00',
          processingDurationHours: 65,
          handler: '王专员',
          logs: [
            { id: '1', action: '诉求提交', operator: '张大爷', remark: '市民通过平台提交诉求', time: '2024-06-17 16:45:00' },
            { id: '2', action: '平台受理', operator: '王受理员', remark: '诉求已受理', time: '2024-06-17 17:00:00' },
            { id: '3', action: '分类派单', operator: '王受理员', remark: '已分派至城管局', time: '2024-06-17 17:10:00' },
            { id: '4', action: '部门处理', operator: '城管局', remark: '已上门检查，施工单位确实存在超时施工', time: '2024-06-18 09:00:00' },
            { id: '5', action: '转办12345', operator: '平台管理员', remark: '已转办至12345政务服务便民热线，工单号：XZ12345000001', time: '2024-06-18 10:30:00' },
            { id: '6', action: '联合处置', operator: '12345热线办', remark: '已协调城管、环保、住建等部门联合执法', time: '2024-06-18 14:00:00' },
          ],
        },
        {
          id: 'appeal_4',
          title: '咨询社保缴费相关问题',
          content: '市民咨询社保缴费基数调整、缴费方式变更等相关问题，希望得到详细解答。',
          category: '教育医疗',
          status: 'resolved',
          urgency: 'normal',
          citizenName: '刘阿姨',
          citizenPhone: '13678901234',
          address: '复兴北路321号',
          district: '鼓楼区',
          platform12345Id: 'XZ12345000002',
          transferTime: '2024-06-15 11:00:00',
          resolveTime: '2024-06-16 15:00:00',
          satisfaction: 5,
          feedbackResult: '已电话回复市民详细解答社保缴费问题，市民表示理解和满意。',
          createTime: '2024-06-15 10:00:00',
          processingDurationHours: 29,
          handler: '李专员',
          logs: [
            { id: '1', action: '诉求提交', operator: '刘阿姨', remark: '市民通过平台提交诉求', time: '2024-06-15 10:00:00' },
            { id: '2', action: '平台受理', operator: '李受理员', remark: '诉求已受理', time: '2024-06-15 10:15:00' },
            { id: '3', action: '分类派单', operator: '李受理员', remark: '已分派至人社局', time: '2024-06-15 10:30:00' },
            { id: '4', action: '转办12345', operator: '平台管理员', remark: '已转办至12345政务服务便民热线', time: '2024-06-15 11:00:00' },
            { id: '5', action: '部门处理', operator: '人社局', remark: '已电话联系市民，解答相关问题', time: '2024-06-15 15:00:00' },
            { id: '6', action: '结果反馈', operator: '12345热线办', remark: '已反馈处理结果', time: '2024-06-16 10:00:00' },
            { id: '7', action: '市民评价', operator: '刘阿姨', remark: '市民评价：非常满意，服务态度好，解答详细', time: '2024-06-16 15:00:00' },
          ],
        },
        {
          id: 'appeal_5',
          title: '反映路灯损坏不亮',
          content: '市民反映XX路段多盏路灯损坏不亮，夜间出行不便，存在安全隐患，希望尽快维修。',
          category: '市政设施',
          status: 'processing',
          urgency: 'urgent',
          citizenName: '陈先生',
          citizenPhone: '13512348765',
          address: '和平大道654号',
          district: '云龙区',
          createTime: '2024-06-20 08:15:00',
          processingDurationHours: 6,
          handler: '赵受理员',
          logs: [
            { id: '1', action: '诉求提交', operator: '陈先生', remark: '市民通过平台提交诉求', time: '2024-06-20 08:15:00' },
            { id: '2', action: '平台受理', operator: '赵受理员', remark: '诉求已受理', time: '2024-06-20 08:30:00' },
            { id: '3', action: '分类派单', operator: '赵受理员', remark: '已分派至市政工程处', time: '2024-06-20 08:45:00' },
          ],
        },
        {
          id: 'appeal_6',
          title: '建议优化公交线路',
          content: '市民建议优化XX公交线路，增加班次，延长运营时间，方便市民上下班出行。',
          category: '交通出行',
          status: 'resolved',
          urgency: 'normal',
          citizenName: '赵女士',
          citizenPhone: '13445678901',
          address: '铜山路987号',
          district: '铜山区',
          resolveTime: '2024-06-14 17:00:00',
          satisfaction: 4,
          feedbackResult: '公交公司已研究调整方案，将于下月起增加早晚高峰班次，运营时间延长30分钟。',
          createTime: '2024-06-10 09:00:00',
          processingDurationHours: 104,
          handler: '孙受理员',
          logs: [
            { id: '1', action: '诉求提交', operator: '赵女士', remark: '市民通过平台提交诉求', time: '2024-06-10 09:00:00' },
            { id: '2', action: '平台受理', operator: '孙受理员', remark: '诉求已受理', time: '2024-06-10 09:15:00' },
            { id: '3', action: '分类派单', operator: '孙受理员', remark: '已分派至公交公司', time: '2024-06-10 09:30:00' },
            { id: '4', action: '部门处理', operator: '公交公司', remark: '已研究调整方案，将于下月实施', time: '2024-06-14 10:00:00' },
            { id: '5', action: '结果反馈', operator: '公交公司', remark: '已向市民反馈调整方案', time: '2024-06-14 15:00:00' },
            { id: '6', action: '市民评价', operator: '赵女士', remark: '市民评价：满意，希望尽快落实', time: '2024-06-14 17:00:00' },
          ],
        },
        {
          id: 'appeal_7',
          title: '反映小区物业乱收费问题',
          content: '市民反映小区物业公司存在乱收费现象，收费项目不透明，希望相关部门核查处理。',
          category: '物业管理',
          status: 'transferred',
          urgency: 'urgent',
          citizenName: '周女士',
          citizenPhone: '13345678901',
          address: '西安北路111号',
          district: '泉山区',
          platform12345Id: 'XZ12345000003',
          transferTime: '2024-06-17 09:20:00',
          createTime: '2024-06-16 15:40:00',
          processingDurationHours: 89,
          handler: '张专员',
          logs: [
            { id: '1', action: '诉求提交', operator: '周女士', remark: '市民通过平台提交诉求', time: '2024-06-16 15:40:00' },
            { id: '2', action: '平台受理', operator: '钱受理员', remark: '诉求已受理', time: '2024-06-16 16:00:00' },
            { id: '3', action: '分类派单', operator: '钱受理员', remark: '已分派至住建局物业科', time: '2024-06-16 16:20:00' },
            { id: '4', action: '转办12345', operator: '平台管理员', remark: '因涉及多部门，已转办12345协调处理', time: '2024-06-17 09:20:00' },
          ],
        },
        {
          id: 'appeal_8',
          title: '反映垃圾清运不及时问题',
          content: '市民反映所在街道垃圾清运不及时，垃圾堆放在路边影响环境，希望增加清运频次。',
          category: '环境卫生',
          status: 'resolved',
          urgency: 'normal',
          citizenName: '吴先生',
          citizenPhone: '13245678901',
          address: '民主路222号',
          district: '鼓楼区',
          platform12345Id: 'XZ12345000004',
          transferTime: '2024-06-14 14:50:00',
          resolveTime: '2024-06-15 16:00:00',
          satisfaction: 4,
          feedbackResult: '已协调环卫部门增加清运频次，由原来每日1次增加至每日2次。',
          createTime: '2024-06-14 10:20:00',
          processingDurationHours: 30,
          handler: '赵专员',
          logs: [
            { id: '1', action: '诉求提交', operator: '吴先生', remark: '市民通过平台提交诉求', time: '2024-06-14 10:20:00' },
            { id: '2', action: '平台受理', operator: '郑受理员', remark: '诉求已受理', time: '2024-06-14 10:35:00' },
            { id: '3', action: '分类派单', operator: '郑受理员', remark: '已分派至环卫处', time: '2024-06-14 11:00:00' },
            { id: '4', action: '转办12345', operator: '平台管理员', remark: '已转办12345协调处理', time: '2024-06-14 14:50:00' },
            { id: '5', action: '联合处置', operator: '12345热线办', remark: '已协调环卫部门调整清运方案', time: '2024-06-15 09:00:00' },
            { id: '6', action: '结果反馈', operator: '12345热线办', remark: '已反馈处理结果', time: '2024-06-15 14:00:00' },
            { id: '7', action: '市民评价', operator: '吴先生', remark: '市民评价：满意', time: '2024-06-15 16:00:00' },
          ],
        },
        {
          id: 'appeal_9',
          title: '投诉餐饮油烟污染问题',
          content: '市民投诉楼下餐饮店油烟直接排放，影响楼上居民正常生活，窗户都无法打开。',
          category: '环境卫生',
          status: 'transferred',
          urgency: 'critical',
          citizenName: '郑先生',
          citizenPhone: '13145678901',
          address: '建国东路333号',
          district: '云龙区',
          platform12345Id: 'XZ12345000005',
          transferTime: '2024-06-19 16:30:00',
          createTime: '2024-06-19 11:20:00',
          processingDurationHours: 33,
          handler: '孙专员',
          logs: [
            { id: '1', action: '诉求提交', operator: '郑先生', remark: '市民通过平台提交诉求', time: '2024-06-19 11:20:00' },
            { id: '2', action: '平台受理', operator: '冯受理员', remark: '诉求已受理', time: '2024-06-19 11:35:00' },
            { id: '3', action: '分类派单', operator: '冯受理员', remark: '已分派至环保局', time: '2024-06-19 12:00:00' },
            { id: '4', action: '部门处理', operator: '环保局', remark: '已上门检测，确认油烟排放超标', time: '2024-06-19 15:00:00' },
            { id: '5', action: '转办12345', operator: '平台管理员', remark: '需联合执法，已转办12345', time: '2024-06-19 16:30:00' },
          ],
        },
        {
          id: 'appeal_10',
          title: '反映供水水压不足问题',
          content: '市民反映高层住户供水水压不足，高峰期热水器无法正常使用，希望相关部门解决。',
          category: '供水供电',
          status: 'overdue',
          urgency: 'urgent',
          citizenName: '冯女士',
          citizenPhone: '13045678901',
          address: '矿山路444号',
          district: '泉山区',
          createTime: '2024-06-15 09:00:00',
          processingDurationHours: 132,
          handler: '陈受理员',
          logs: [
            { id: '1', action: '诉求提交', operator: '冯女士', remark: '市民通过平台提交诉求', time: '2024-06-15 09:00:00' },
            { id: '2', action: '平台受理', operator: '陈受理员', remark: '诉求已受理', time: '2024-06-15 09:20:00' },
            { id: '3', action: '分类派单', operator: '陈受理员', remark: '已分派至自来水公司', time: '2024-06-15 10:00:00' },
          ],
        },
        {
          id: 'appeal_11',
          title: '咨询子女入学问题',
          content: '市民咨询适龄儿童入学报名流程、学区划分等相关问题，希望得到详细解答。',
          category: '教育医疗',
          status: 'feedback',
          urgency: 'normal',
          citizenName: '褚先生',
          citizenPhone: '13856789012',
          address: '黄河路555号',
          district: '铜山区',
          resolveTime: '2024-06-20 11:00:00',
          feedbackResult: '已向市民发送学区划分文件和报名指南，教育局咨询电话也已告知。',
          createTime: '2024-06-19 16:00:00',
          processingDurationHours: 19,
          handler: '卫受理员',
          logs: [
            { id: '1', action: '诉求提交', operator: '褚先生', remark: '市民通过平台提交诉求', time: '2024-06-19 16:00:00' },
            { id: '2', action: '平台受理', operator: '卫受理员', remark: '诉求已受理', time: '2024-06-19 16:15:00' },
            { id: '3', action: '分类派单', operator: '卫受理员', remark: '已分派至教育局', time: '2024-06-19 16:30:00' },
            { id: '4', action: '部门处理', operator: '教育局', remark: '已整理相关政策文件和报名指南', time: '2024-06-20 09:00:00' },
            { id: '5', action: '结果反馈', operator: '教育局', remark: '已通过短信和电话向市民反馈', time: '2024-06-20 11:00:00' },
          ],
        },
        {
          id: 'appeal_12',
          title: '反映道路破损问题',
          content: '市民反映XX路路面严重破损，多处坑洼，影响车辆通行，存在安全隐患，希望尽快修复。',
          category: '市政设施',
          status: 'processing',
          urgency: 'urgent',
          citizenName: '蒋先生',
          citizenPhone: '13956789012',
          address: '迎宾路666号',
          district: '贾汪区',
          createTime: '2024-06-20 07:00:00',
          processingDurationHours: 7,
          handler: '沈受理员',
          logs: [
            { id: '1', action: '诉求提交', operator: '蒋先生', remark: '市民通过平台提交诉求', time: '2024-06-20 07:00:00' },
            { id: '2', action: '平台受理', operator: '沈受理员', remark: '诉求已受理', time: '2024-06-20 07:20:00' },
            { id: '3', action: '分类派单', operator: '沈受理员', remark: '已分派至市政工程处', time: '2024-06-20 07:45:00' },
          ],
        },
      ];
      setAppeals(mockData);
      if (!selectedAppeal) {
        setSelectedAppeal(mockData[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTransferTo12345 = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/appeals/transfer/${id}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        loadAppeals();
      }
    } catch (e) {
      const updated = appeals.map(a => {
        if (a.id === id) {
          return {
            ...a,
            status: 'transferred' as AppealStatus,
            platform12345Id: `XZ12345${Date.now()}`,
            transferTime: new Date().toISOString(),
            logs: [...a.logs, {
              id: String(Date.now()),
              action: '转办12345',
              operator: '平台管理员',
              remark: '已转办至12345政务服务便民热线',
              time: new Date().toLocaleString(),
            }],
          };
        }
        return a;
      });
      setAppeals(updated);
      const selected = updated.find(a => a.id === selectedAppeal?.id);
      if (selected) setSelectedAppeal(selected);
    }
  };

  const filteredAppeals = useMemo(() => {
    return appeals.filter(a => {
      if (keyword && !a.title.includes(keyword) && !a.content.includes(keyword)) return false;
      if (filterUrgency !== 'all' && a.urgency !== filterUrgency) return false;
      if (filterDuration !== 'all') {
        const hours = a.processingDurationHours || 0;
        if (filterDuration === 'under24' && hours > 24) return false;
        if (filterDuration === '24to72' && (hours <= 24 || hours > 72)) return false;
        if (filterDuration === 'over72' && hours <= 72) return false;
      }
      return true;
    });
  }, [appeals, keyword, filterUrgency, filterDuration]);

  const stats = useMemo(() => ([
    { label: '待受理', value: appeals.filter(a => a.status === 'pending').length, color: 'yellow' as const, icon: <Clock className="w-5 h-5" /> },
    { label: '处理中', value: appeals.filter(a => a.status === 'processing').length, color: 'blue' as const, icon: <RefreshCw className="w-5 h-5" /> },
    { label: '已转办12345', value: appeals.filter(a => a.status === 'transferred').length, color: 'purple' as const, icon: <ArrowRightLeft className="w-5 h-5" /> },
    { label: '待反馈', value: appeals.filter(a => a.status === 'feedback').length, color: 'cyan' as const, icon: <MessageSquare className="w-5 h-5" /> },
    { label: '已办结', value: appeals.filter(a => a.status === 'resolved' || a.status === 'closed').length, color: 'green' as const, icon: <CheckCircle className="w-5 h-5" /> },
    { label: '超时预警', value: appeals.filter(a => a.status === 'overdue').length, color: 'red' as const, icon: <AlertTriangle className="w-5 h-5" /> },
  ]), [appeals]);

  const satisfactionPieOption = useMemo(() => {
    const data = [
      { value: appeals.filter(a => a.satisfaction === 5).length, name: '非常满意' },
      { value: appeals.filter(a => a.satisfaction === 4).length, name: '满意' },
      { value: appeals.filter(a => a.satisfaction === 3).length, name: '一般' },
      { value: appeals.filter(a => a.satisfaction && a.satisfaction < 3).length, name: '不满意' },
    ].filter(d => d.value > 0);
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c}件 ({d}%)' },
      legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11, color: '#64748b' } },
      color: ['#22c55e', '#3b82f6', '#eab308', '#ef4444'],
      series: [{
        type: 'pie',
        radius: ['45%', '68%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
        data,
      }],
    };
  }, [appeals]);

  const categoryBarOption = useMemo(() => {
    const counts = appealCategories.map(cat => appeals.filter(a => a.category === cat).length);
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: appealCategories,
        axisLabel: { fontSize: 10, color: '#64748b', interval: 0, rotate: 20 },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 11, color: '#64748b' },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [{
        type: 'bar',
        data: counts,
        barWidth: '50%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#60a5fa' }, { offset: 1, color: '#3b82f6' }],
          },
          borderRadius: [4, 4, 0, 0],
        },
      }],
    };
  }, [appeals]);

  const durationTrendOption = useMemo(() => {
    const days = ['06-14', '06-15', '06-16', '06-17', '06-18', '06-19', '06-20'];
    const avgDurations = [28, 35, 42, 31, 38, 25, 22];
    const resolvedCounts = [3, 5, 4, 6, 7, 5, 4];
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['平均处理时长(小时)', '办结数量'], top: 0, right: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '18%', containLabel: true },
      xAxis: { type: 'category', data: days, axisLabel: { fontSize: 11, color: '#64748b' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: [
        { type: 'value', name: '小时', axisLabel: { fontSize: 11, color: '#64748b' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
        { type: 'value', name: '件', axisLabel: { fontSize: 11, color: '#64748b' }, splitLine: { show: false } },
      ],
      series: [
        {
          name: '平均处理时长(小时)',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: avgDurations,
          itemStyle: { color: '#3b82f6' },
          lineStyle: { width: 2.5 },
          areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59, 130, 246, 0.25)' }, { offset: 1, color: 'rgba(59, 130, 246, 0)' }] } },
        },
        {
          name: '办结数量',
          type: 'bar',
          yAxisIndex: 1,
          data: resolvedCounts,
          barWidth: '35%',
          itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, []);

  const getTimelineStatus = (nodeKey: string, appeal: Appeal) => {
    const nodeIndex = timelineNodes.findIndex(n => n.key === nodeKey);
    const actionSet = new Set(appeal.logs.map(l => {
      if (l.action.includes('提交')) return 'submit';
      if (l.action.includes('受理')) return 'accept';
      if (l.action.includes('派单')) return 'assign';
      if (l.action.includes('处理') && l.operator !== '12345热线办') return 'process';
      if (l.action.includes('转办')) return 'transfer';
      if (l.action.includes('联合')) return 'joint';
      if (l.action.includes('反馈')) return 'feedback';
      if (l.action.includes('评价')) return 'evaluate';
      return '';
    }));
    const completedIndices = timelineNodes
      .map((n, i) => actionSet.has(n.key) ? i : -1)
      .filter(i => i >= 0);
    const maxCompleted = completedIndices.length > 0 ? Math.max(...completedIndices) : -1;
    if (nodeIndex < maxCompleted) return 'done';
    if (nodeIndex === maxCompleted) return 'current';
    return 'pending';
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className={cn('w-4 h-4', s <= score ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200')} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="市民诉求中心"
        description="12345诉求处理与跟踪，一键转办至政务服务平台"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            title={stat.label}
            value={stat.value}
            color={stat.color}
            icon={stat.icon}
            compact
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-5 space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 max-w-xs">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜索诉求标题或内容..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                />
              </div>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AppealStatus | 'all')}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
            >
              <option value="all">全部状态</option>
              {Object.entries(appealStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
            >
              <option value="all">全部类型</option>
              {appealCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
            >
              <option value="all">全部区域</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600 font-medium">筛选条件：</span>
            </div>

            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">紧急程度</span>
              <select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value as EmergencyUrgency | 'all')}
                className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:border-primary-500 outline-none"
              >
                <option value="all">全部</option>
                {Object.entries(urgencyLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Clock3 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">处理时长</span>
              <select
                value={filterDuration}
                onChange={(e) => setFilterDuration(e.target.value)}
                className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:border-primary-500 outline-none"
              >
                <option value="all">全部</option>
                <option value="under24">24小时内</option>
                <option value="24to72">24-72小时</option>
                <option value="over72">72小时以上</option>
              </select>
            </div>

            <div className="ml-auto text-xs text-slate-400 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              共 {filteredAppeals.length} 条诉求
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
            {filteredAppeals.map((appeal) => {
              const StatusIcon = statusIcons[appeal.status];
              return (
                <div
                  key={appeal.id}
                  onClick={() => setSelectedAppeal(appeal)}
                  className={cn(
                    'p-4 rounded-xl border-2 cursor-pointer transition-all',
                    selectedAppeal?.id === appeal.id
                      ? 'border-primary-300 bg-primary-50/50'
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-medium text-slate-900 line-clamp-1">{appeal.title}</h4>
                        <span className={cn('px-1.5 py-0.5 text-[10px] font-medium rounded', urgencyColors[appeal.urgency])}>
                          {urgencyLabels[appeal.urgency]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{appeal.content}</p>
                    </div>
                    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border flex-shrink-0', statusColors[appeal.status])}>
                      {appealStatusLabels[appeal.status]}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {appeal.citizenName}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {appeal.district}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {appeal.createTime.slice(5, 16)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Gauge className="w-3 h-3" />
                      {appeal.processingDurationHours}h
                    </span>
                  </div>
                  {appeal.satisfaction && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                      <span className="text-xs text-slate-400">满意度：</span>
                      {renderStars(appeal.satisfaction)}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredAppeals.length === 0 && (
              <div className="col-span-2 py-12 text-center text-sm text-slate-400">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                暂无符合条件的诉求
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white rounded-xl shadow-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <PieChart className="w-4 h-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-slate-900">满意度统计</h3>
              </div>
              <ReactECharts option={satisfactionPieOption} style={{ height: 180 }} />
            </div>

            <div className="bg-white rounded-xl shadow-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-slate-900">诉求分类分布</h3>
              </div>
              <ReactECharts option={categoryBarOption} style={{ height: 200 }} />
            </div>

            <div className="bg-white rounded-xl shadow-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary-600" />
                <h3 className="text-sm font-semibold text-slate-900">处理时效趋势</h3>
              </div>
              <ReactECharts option={durationTrendOption} style={{ height: 200 }} />
            </div>
          </div>
        </div>
      </div>

      {selectedAppeal && (
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-5">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-semibold text-slate-900">{selectedAppeal.title}</h3>
                <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border', statusColors[selectedAppeal.status])}>
                  {appealStatusLabels[selectedAppeal.status]}
                </span>
                <span className={cn('px-2 py-0.5 text-xs font-medium rounded', urgencyColors[selectedAppeal.urgency])}>
                  {urgencyLabels[selectedAppeal.urgency]}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {selectedAppeal.category}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selectedAppeal.district}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Gauge className="w-3 h-3" />
                  已处理 {selectedAppeal.processingDurationHours} 小时
                </span>
                {selectedAppeal.handler && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    经办人：{selectedAppeal.handler}
                  </span>
                )}
              </div>
            </div>
            {selectedAppeal.status === 'pending' && (
              <button
                onClick={() => handleTransferTo12345(selectedAppeal.id)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
                转办12345
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 mb-5 border-b border-slate-100">
            <button
              onClick={() => setDetailTab('detail')}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                detailTab === 'detail'
                  ? 'text-primary-600 border-primary-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              )}
            >
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                诉求详情
              </span>
            </button>
            <button
              onClick={() => setDetailTab('transfer')}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                detailTab === 'transfer'
                  ? 'text-primary-600 border-primary-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              )}
            >
              <span className="flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4" />
                转办记录
                <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 rounded-full">
                  {mockTransferRecords.filter(r => r.appealId === selectedAppeal.id).length}
                </span>
              </span>
            </button>
          </div>

          {detailTab === 'detail' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3" /> 诉求人
                    </p>
                    <p className="text-sm font-semibold text-slate-700 mt-1">{selectedAppeal.citizenName}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> 联系电话
                    </p>
                    <p className="text-sm font-semibold text-slate-700 mt-1">{selectedAppeal.citizenPhone}</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> 事发地址
                  </p>
                  <p className="text-sm font-semibold text-slate-700 mt-1">{selectedAppeal.address}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-900 mb-2">诉求内容</h4>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {selectedAppeal.content}
                  </p>
                </div>

                {selectedAppeal.platform12345Id && (
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-purple-800">12345转办闭环</h4>
                        <p className="text-xs text-purple-500">已转办至政务服务便民热线</p>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-purple-500 flex items-center gap-1">
                          <CalendarRange className="w-3.5 h-3.5" /> 转办时间
                        </span>
                        <span className="font-semibold text-purple-800">{selectedAppeal.transferTime?.slice(0, 16)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-purple-500 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> 转办编号
                        </span>
                        <span className="font-semibold text-purple-800 font-mono">{selectedAppeal.platform12345Id}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-purple-500 flex items-center gap-1">
                          <RefreshCw className="w-3.5 h-3.5" /> 12345处理状态
                        </span>
                        <span className={cn(
                          'px-2 py-0.5 text-xs font-semibold rounded-full',
                          mockTransferRecords.find(r => r.appealId === selectedAppeal.id)?.status12345 === 'resolved'
                            ? 'bg-green-100 text-green-700'
                            : mockTransferRecords.find(r => r.appealId === selectedAppeal.id)?.status12345 === 'closed'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-blue-100 text-blue-700'
                        )}>
                          {mockTransferRecords.find(r => r.appealId === selectedAppeal.id)?.status12345 === 'resolved'
                            ? '已处理'
                            : mockTransferRecords.find(r => r.appealId === selectedAppeal.id)?.status12345 === 'closed'
                            ? '已结案'
                            : '处理中'}
                        </span>
                      </div>
                      {selectedAppeal.feedbackResult && (
                        <div className="pt-2 border-t border-purple-200/60">
                          <p className="text-xs text-purple-500 mb-1 flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" /> 反馈结果
                          </p>
                          <p className="text-sm text-purple-800 leading-relaxed">{selectedAppeal.feedbackResult}</p>
                        </div>
                      )}
                      {selectedAppeal.satisfaction && (
                        <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between">
                          <span className="text-xs text-purple-500 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5" /> 市民满意度
                          </span>
                          {renderStars(selectedAppeal.satisfaction)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-8">
                <div className="bg-slate-50 rounded-xl p-5 h-full">
                  <h4 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-primary-600" />
                    处理流程时间线
                  </h4>
                  <div className="relative">
                    <div className="grid grid-cols-8 gap-1 mb-6">
                      {timelineNodes.map((node, index) => {
                        const status = getTimelineStatus(node.key, selectedAppeal);
                        return (
                          <div key={node.key} className="flex flex-col items-center relative">
                            {index < timelineNodes.length - 1 && (
                              <div className={cn(
                                'absolute top-3 left-1/2 w-full h-0.5',
                                status === 'done' || getTimelineStatus(timelineNodes[index + 1].key, selectedAppeal) === 'done'
                                  ? 'bg-green-400'
                                  : 'bg-slate-200'
                              )}></div>
                            )}
                            <div className={cn(
                              'relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all',
                              status === 'done' ? 'bg-green-500 border-green-500 text-white' :
                              status === 'current' ? 'bg-primary-500 border-primary-500 text-white ring-4 ring-primary-100 animate-pulse' :
                              'bg-white border-slate-300 text-slate-400'
                            )}>
                              {status === 'done' ? (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                index + 1
                              )}
                            </div>
                            <span className={cn(
                              'mt-2 text-[11px] font-medium text-center leading-tight',
                              status === 'pending' ? 'text-slate-400' : 'text-slate-700'
                            )}>
                              {node.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <h5 className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">详细处理记录</h5>
                      <div className="relative">
                        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200"></div>
                        <div className="space-y-4">
                          {selectedAppeal.logs.map((log, index) => (
                            <div key={log.id} className="relative flex gap-3 pl-8">
                              <div className={cn(
                                'absolute left-0 top-1 w-4 h-4 rounded-full border-2',
                                index === selectedAppeal.logs.length - 1
                                  ? 'bg-primary-500 border-primary-500'
                                  : 'bg-white border-slate-300'
                              )}>
                                {index === selectedAppeal.logs.length - 1 && (
                                  <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-30"></div>
                                )}
                              </div>
                              <div className="flex-1 pb-4 bg-white rounded-lg p-3 border border-slate-100">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-800">{log.action}</span>
                                  <span className="text-xs text-slate-400">{log.time.slice(5, 16)}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  <span className="font-medium">{log.operator}</span> · {log.remark}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {mockTransferRecords.filter(r => r.appealId === selectedAppeal.id).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">转办时间</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">转办编号</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">处理状态</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">反馈结果</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">满意度</th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-600">经办人</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockTransferRecords.filter(r => r.appealId === selectedAppeal.id).map((record) => (
                        <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-slate-700">{record.transferTime.slice(0, 16)}</td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                              {record.platform12345Id}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={cn(
                              'px-2 py-0.5 text-xs font-medium rounded-full',
                              record.status12345 === 'resolved' ? 'bg-green-100 text-green-700' :
                              record.status12345 === 'closed' ? 'bg-slate-100 text-slate-700' :
                              'bg-blue-100 text-blue-700'
                            )}>
                              {record.status12345 === 'resolved' ? '已处理' :
                               record.status12345 === 'closed' ? '已结案' : '处理中'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                            {record.feedbackResult || '-'}
                          </td>
                          <td className="py-3 px-4">
                            {record.satisfaction ? renderStars(record.satisfaction) : '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-700">{record.handler}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-sm text-slate-400">
                  <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                  <p className="font-medium text-slate-500">暂无转办记录</p>
                  <p className="mt-1 text-xs">该诉求尚未转办至12345平台</p>
                </div>
              )}

              {mockTransferRecords.filter(r => r.appealId !== selectedAppeal.id).length > 0 && (
                <div className="mt-8">
                  <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-600" />
                    其他历史转办记录
                    <span className="text-xs font-normal text-slate-400">（共 {mockTransferRecords.filter(r => r.appealId !== selectedAppeal.id).length} 条）</span>
                  </h4>
                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">关联诉求</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">转办时间</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">转办编号</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">处理状态</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">满意度</th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-600">经办人</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockTransferRecords.filter(r => r.appealId !== selectedAppeal.id).map((record) => {
                          const appeal = appeals.find(a => a.id === record.appealId);
                          return (
                            <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => {
                              if (appeal) setSelectedAppeal(appeal);
                            }}>
                              <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                                {appeal?.title || '-'}
                              </td>
                              <td className="py-3 px-4 text-slate-600">{record.transferTime.slice(0, 16)}</td>
                              <td className="py-3 px-4">
                                <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                                  {record.platform12345Id}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={cn(
                                  'px-2 py-0.5 text-xs font-medium rounded-full',
                                  record.status12345 === 'resolved' ? 'bg-green-100 text-green-700' :
                                  record.status12345 === 'closed' ? 'bg-slate-100 text-slate-700' :
                                  'bg-blue-100 text-blue-700'
                                )}>
                                  {record.status12345 === 'resolved' ? '已处理' :
                                   record.status12345 === 'closed' ? '已结案' : '处理中'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {record.satisfaction ? renderStars(record.satisfaction) : '-'}
                              </td>
                              <td className="py-3 px-4 text-slate-600">{record.handler}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
