import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Users, Building2, Store, Stethoscope, TrendingUp,
  Clock, Eye, CheckCircle2, XCircle, Search, BarChart3, Activity,
  AlertTriangle, ClipboardList, FileText, Lock, Unlock, PenTool, UserCheck,
  RotateCcw, Pill, ShoppingCart, MapPin, Calendar, Syringe, Bug, Heart,
  ChevronRight, ArrowRight, BadgeCheck, ChevronsDown, ChevronsDownUp,
  PawPrint, FileSpreadsheet, MessageCircle, HeartHandshake, Bell,
  MapPinned, Star, AlertCircle, ThumbsUp, Share2, Home, BookOpen,
  Scissors, Thermometer, Layers, Target, Shield, Check, X, Loader2,
  Truck, Package, Info, Edit3, Filter, MessageSquare, User, Building,
  ChevronDown, ChevronUp, UserX, Ban, RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

type TabId = 'owner' | 'doctor' | 'hospital' | 'merchant' | 'review' | 'prescription' | 'consultation' | 'community' | 'calendar' | 'audit';

type VerificationStatus = 'pending' | 'success' | 'failed';
type VerificationTabId = 'navigation' | 'tab' | 'action' | 'filter';

interface NavigationRecord {
  id: string;
  targetPath: string;
  timestamp: string;
  source: string;
  status: VerificationStatus;
  isPreset?: boolean;
}

interface TabRecord {
  id: string;
  tabName: string;
  tabId: TabId;
  timestamp: string;
  status: VerificationStatus;
  isPreset?: boolean;
}

interface ActionRecord {
  id: string;
  actionType: string;
  target: string;
  timestamp: string;
  result: string;
  auditLogId?: string;
  dataChange?: string;
  status: VerificationStatus;
}

interface FilterRecord {
  id: string;
  filterConditions: string;
  timestamp: string;
  resultCount: number;
  status: VerificationStatus;
  filterType: string;
}

interface InteractionVerificationState {
  navigationRecords: NavigationRecord[];
  tabRecords: TabRecord[];
  actionRecords: ActionRecord[];
  filterRecords: FilterRecord[];
}

type ReminderStatus = 'fulfilled' | 'pending' | 'overdue';
type ReviewStatus = 'pending' | 'approved' | 'rejected';
type SickStatus = 'sick' | 'recovering' | 'healthy';

interface BindingAuditRecord {
  id: string;
  petName: string;
  bindTime: string;
  bindType: 'owner' | 'family' | 'caregiver';
  status: 'active' | 'unbound';
}

interface DiseaseRecord {
  id: string;
  petName: string;
  diagnosisTime: string;
  diagnosis: string;
  prescription: string;
  followUpDate: string;
  status: SickStatus;
  reviewStatus: ReviewStatus;
}

interface ReminderRecord {
  id: string;
  type: string;
  scheduledTime: string;
  reminderCount: number;
  status: ReminderStatus;
  title: string;
}

interface DisableReviewRecord {
  id: string;
  disableTime: string;
  disableReason: string;
  reviewDeadline: string;
  reviewer: string;
  reviewOpinion: string;
  reviewStatus: ReviewStatus;
  reviewTime?: string;
}

interface ReviewRecord {
  id: string;
  type: 'binding' | 'disease' | 'reminder' | 'disable';
  operationTime: string;
  operator: string;
  content: string;
  reviewStatus: ReviewStatus;
  reviewOpinion: string;
  reviewer?: string;
  reviewTime?: string;
}

type ScheduleStatus = 'normal' | 'missing' | 'overload' | 'rest';
type QualificationStatus = 'registered' | 'pending' | 'expired' | 'under_review';
type CommunitySubTab = 'posts' | 'anticheat';

interface DoctorScheduleDay {
  date: string;
  weekday: string;
  morning: 'on' | 'off' | 'busy';
  afternoon: 'on' | 'off' | 'busy';
  night: 'on' | 'off' | 'busy';
}

interface DoctorScheduleDetail {
  doctorId: string;
  weeklySchedule: DoctorScheduleDay[];
  workDays: number;
  consultationCount: number;
  avgConsultTime: string;
  warnings: string[];
}

interface QualificationCert {
  id: string;
  name: string;
  number: string;
  expiryDate: string;
  remainingDays: number;
  status: 'valid' | 'warning' | 'expired';
}

interface MerchantQualificationDetail {
  merchantId: string;
  certificates: QualificationCert[];
  overallStatus: QualificationStatus;
}

interface HospitalServicePrice {
  serviceId: string;
  serviceName: string;
  guidePrice: number;
  hospitalPrice: number;
  deviationRate: number;
  status: 'normal' | 'warning' | 'overprice';
}

interface HospitalPricingDetail {
  hospitalId: string;
  services: HospitalServicePrice[];
  avgDeviation: number;
  overpriceCount: number;
  minPrice?: number;
  maxPrice?: number;
  priceDistribution?: { range: string; count: number }[];
}

interface AntiCheatReview {
  id: string;
  content: string;
  reviewer: string;
  reviewedTarget: string;
  targetType: 'doctor' | 'hospital' | 'merchant' | 'product';
  riskScore: number;
  riskReasons: string[];
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  createdAt: string;
  ip?: string;
  deviceFingerprint?: string;
}

const mockBindingAudit: Record<string, BindingAuditRecord[]> = {
  'U100001': [
    { id: 'B001', petName: '豆豆', bindTime: '2026-01-15 10:30', bindType: 'owner', status: 'active' },
    { id: 'B002', petName: '咪咪', bindTime: '2026-01-15 10:35', bindType: 'owner', status: 'active' },
  ],
  'U100002': [
    { id: 'B003', petName: '小白', bindTime: '2026-02-20 14:20', bindType: 'owner', status: 'active' },
  ],
  'U100003': [
    { id: 'B004', petName: '旺财', bindTime: '2026-03-10 09:15', bindType: 'owner', status: 'active' },
    { id: 'B005', petName: '来福', bindTime: '2026-03-10 09:20', bindType: 'family', status: 'active' },
    { id: 'B006', petName: '贝贝', bindTime: '2026-04-05 16:30', bindType: 'caregiver', status: 'unbound' },
  ],
  'U100004': [
    { id: 'B007', petName: '球球', bindTime: '2026-02-10 11:00', bindType: 'owner', status: 'active' },
  ],
  'U100005': [
    { id: 'B008', petName: '毛毛', bindTime: '2026-01-20 15:45', bindType: 'owner', status: 'active' },
    { id: 'B009', petName: '乐乐', bindTime: '2026-01-20 15:50', bindType: 'owner', status: 'active' },
  ],
};

const mockDiseaseRecords: Record<string, DiseaseRecord[]> = {
  'U100002': [
    { id: 'D001', petName: '小白', diagnosisTime: '2026-06-14 10:30', diagnosis: '上呼吸道感染', prescription: '头孢克洛、双黄连口服液', followUpDate: '2026-06-18', status: 'sick', reviewStatus: 'pending' },
  ],
  'U100004': [
    { id: 'D002', petName: '球球', diagnosisTime: '2026-06-12 16:45', diagnosis: '膀胱结石', prescription: '排石颗粒、消炎药', followUpDate: '2026-06-20', status: 'recovering', reviewStatus: 'pending' },
  ],
};

const mockReminderRecords: Record<string, ReminderRecord[]> = {
  'U100001': [
    { id: 'R001', type: '疫苗接种', title: '狂犬疫苗', scheduledTime: '2026-06-17 09:00', reminderCount: 3, status: 'pending' },
    { id: 'R002', type: '体内驱虫', title: '驱虫药', scheduledTime: '2026-06-17 12:00', reminderCount: 2, status: 'pending' },
    { id: 'R003', type: '体检', title: '年度体检', scheduledTime: '2026-06-10 14:30', reminderCount: 3, status: 'fulfilled' },
  ],
  'U100002': [
    { id: 'R004', type: '复诊', title: '呼吸道感染复诊', scheduledTime: '2026-06-18 14:30', reminderCount: 2, status: 'pending' },
    { id: 'R005', type: '疫苗接种', title: '四联疫苗', scheduledTime: '2026-06-05 09:00', reminderCount: 5, status: 'overdue' },
  ],
  'U100005': [
    { id: 'R006', type: '疫苗接种', title: '狂犬疫苗', scheduledTime: '2026-06-18 10:00', reminderCount: 1, status: 'pending' },
    { id: 'R007', type: '皮肤复查', title: '猫癣复查', scheduledTime: '2026-06-19 15:00', reminderCount: 2, status: 'pending' },
    { id: 'R008', type: '体外驱虫', title: '拜宠爽驱虫', scheduledTime: '2026-06-08 18:00', reminderCount: 4, status: 'overdue' },
  ],
};

const mockDisableRecords: Record<string, DisableReviewRecord | null> = {
  'U100003': {
    id: 'DR001',
    disableTime: '2026-06-10 09:15',
    disableReason: '疑似批量评价作弊，风控评分92分',
    reviewDeadline: '2026-06-17',
    reviewer: '',
    reviewOpinion: '',
    reviewStatus: 'pending',
  },
  'U100001': null,
  'U100002': null,
  'U100004': null,
  'U100005': null,
};

const mockReviewRecords: Record<string, ReviewRecord[]> = {
  'U100001': [
    { id: 'REV001', type: 'binding', operationTime: '2026-01-15 10:30', operator: '张小明', content: '绑定宠物「豆豆」（宠主）', reviewStatus: 'approved', reviewOpinion: '绑定信息无误', reviewer: 'admin', reviewTime: '2026-01-15 11:00' },
    { id: 'REV002', type: 'binding', operationTime: '2026-01-15 10:35', operator: '张小明', content: '绑定宠物「咪咪」（宠主）', reviewStatus: 'approved', reviewOpinion: '绑定信息无误', reviewer: 'admin', reviewTime: '2026-01-15 11:00' },
    { id: 'REV003', type: 'reminder', operationTime: '2026-06-10 15:30', operator: 'admin', content: '标记年度体检提醒为已履约', reviewStatus: 'approved', reviewOpinion: '体检记录已核实', reviewer: 'admin', reviewTime: '2026-06-10 16:00' },
  ],
  'U100002': [
    { id: 'REV004', type: 'binding', operationTime: '2026-02-20 14:20', operator: '李小红', content: '绑定宠物「小白」（宠主）', reviewStatus: 'approved', reviewOpinion: '绑定信息无误', reviewer: 'admin', reviewTime: '2026-02-20 15:00' },
    { id: 'REV005', type: 'disease', operationTime: '2026-06-14 10:30', operator: '王建国', content: '新增病程记录：小白确诊上呼吸道感染', reviewStatus: 'pending', reviewOpinion: '' },
  ],
  'U100003': [
    { id: 'REV006', type: 'disable', operationTime: '2026-06-10 09:15', operator: 'admin', content: '禁用账号（风控评分92分，疑似批量评价作弊）', reviewStatus: 'pending', reviewOpinion: '' },
  ],
  'U100004': [
    { id: 'REV007', type: 'binding', operationTime: '2026-02-10 11:00', operator: '赵小芳', content: '绑定宠物「球球」（宠主）', reviewStatus: 'approved', reviewOpinion: '绑定信息无误', reviewer: 'admin', reviewTime: '2026-02-10 11:30' },
    { id: 'REV008', type: 'disease', operationTime: '2026-06-12 16:45', operator: '陈伟', content: '新增病程记录：球球确诊膀胱结石', reviewStatus: 'pending', reviewOpinion: '' },
  ],
  'U100005': [
    { id: 'REV009', type: 'binding', operationTime: '2026-01-20 15:45', operator: '孙丽丽', content: '绑定宠物「毛毛」（宠主）', reviewStatus: 'approved', reviewOpinion: '绑定信息无误', reviewer: 'admin', reviewTime: '2026-01-20 16:00' },
    { id: 'REV010', type: 'binding', operationTime: '2026-01-20 15:50', operator: '孙丽丽', content: '绑定宠物「乐乐」（宠主）', reviewStatus: 'approved', reviewOpinion: '绑定信息无误', reviewer: 'admin', reviewTime: '2026-01-20 16:00' },
  ],
};

const presetOwnerRoutes = [
  { path: '/', label: '首页' },
  { path: '/pets', label: '宠物档案' },
  { path: '/products', label: '商城首页' },
  { path: '/shop', label: '购物车' },
  { path: '/calendar', label: '健康日历' },
  { path: '/community', label: '社区广场' },
];

const presetAdminTabs: TabId[] = ['owner', 'doctor', 'hospital', 'merchant', 'review', 'consultation', 'prescription', 'community', 'calendar', 'audit'];

const tabs: { id: TabId; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'owner', label: '宠主台账', Icon: Users },
  { id: 'doctor', label: '医生台账', Icon: Stethoscope },
  { id: 'hospital', label: '医院台账', Icon: Building2 },
  { id: 'merchant', label: '商家台账', Icon: Store },
  { id: 'review', label: '资质审核', Icon: ShieldCheck },
  { id: 'consultation', label: '问诊审计', Icon: FileSpreadsheet },
  { id: 'prescription', label: '处方监管', Icon: Pill },
  { id: 'community', label: '社区监管', Icon: MessageCircle },
  { id: 'calendar', label: '日历监管', Icon: Calendar },
  { id: 'audit', label: '审计日志', Icon: ClipboardList },
];

const initialOwnerLedger = [
  { id: 'U100001', nickname: '张小明', phone: '138****0001', pets: 2, petNames: ['豆豆', '咪咪'], healthTemplateCoverage: 100, sickTracking: 0, consultations: 12, prescriptions: 3, appointments: 8, calendarReminders: 15, bindAuthAccounts: 1, status: 'active' as const, riskScore: 12, lastActive: '2026-06-16 18:32' },
  { id: 'U100002', nickname: '李小红', phone: '138****0002', pets: 1, petNames: ['小白'], healthTemplateCoverage: 100, sickTracking: 1, consultations: 5, prescriptions: 1, appointments: 3, calendarReminders: 8, bindAuthAccounts: 0, status: 'active' as const, riskScore: 8, lastActive: '2026-06-16 15:20' },
  { id: 'U100003', nickname: '王大伟', phone: '135****0001', pets: 3, petNames: ['旺财', '来福', '贝贝'], healthTemplateCoverage: 67, sickTracking: 0, consultations: 0, prescriptions: 0, appointments: 0, calendarReminders: 2, bindAuthAccounts: 2, status: 'disabled' as const, riskScore: 92, lastActive: '2026-06-10 09:15' },
  { id: 'U100004', nickname: '赵小芳', phone: '139****0099', pets: 1, petNames: ['球球'], healthTemplateCoverage: 100, sickTracking: 1, consultations: 2, prescriptions: 2, appointments: 1, calendarReminders: 6, bindAuthAccounts: 0, status: 'active' as const, riskScore: 15, lastActive: '2026-06-16 10:45' },
  { id: 'U100005', nickname: '孙丽丽', phone: '136****0001', pets: 2, petNames: ['毛毛', '乐乐'], healthTemplateCoverage: 100, sickTracking: 0, consultations: 8, prescriptions: 5, appointments: 15, calendarReminders: 22, bindAuthAccounts: 1, status: 'active' as const, riskScore: 5, lastActive: '2026-06-16 20:10' },
];

const doctorLedger = [
  { id: 'D001', name: '王建国', phone: '139****0001', dept: '内科', title: '主治医师', license: 'VET-BJ-2024-00891', licenseStatus: 'approved' as const, scheduleStatus: 'on_duty' as const, consults: 486, prescriptions: 128, signedPrescriptions: 128, avgConsultTime: '12.5', todayConsult: 8, rating: 4.9, reviews: 256, negativeReviews: 3, lastActive: '2026-06-16 19:45', hospital: '爱宠动物医院（总院）' },
  { id: 'D002', name: '李芳', phone: '139****0002', dept: '外科', title: '副主任医师', license: 'VET-BJ-2024-00892', licenseStatus: 'approved' as const, scheduleStatus: 'in_surgery' as const, consults: 312, prescriptions: 89, signedPrescriptions: 89, avgConsultTime: '18.3', todayConsult: 5, rating: 4.7, reviews: 189, negativeReviews: 8, lastActive: '2026-06-16 20:10', hospital: '爱宠动物医院（总院）' },
  { id: 'D003', name: '孙医生', phone: '139****5678', dept: '内科', title: '住院医师', license: '2020110110000123', licenseStatus: 'pending' as const, scheduleStatus: 'off_duty' as const, consults: 0, prescriptions: 0, signedPrescriptions: 0, avgConsultTime: '-', todayConsult: 0, rating: 0, reviews: 0, negativeReviews: 0, lastActive: '2026-06-14 15:30', hospital: '待分配' },
  { id: 'D004', name: '赵敏', phone: '139****0004', dept: '皮肤科', title: '主治医师', license: 'VET-BJ-2024-00894', licenseStatus: 'rejected' as const, scheduleStatus: 'off_duty' as const, consults: 23, prescriptions: 5, signedPrescriptions: 5, avgConsultTime: '15.0', todayConsult: 0, rating: 3.2, reviews: 42, negativeReviews: 18, lastActive: '2026-06-10 09:00', hospital: '宠物之家诊疗中心' },
  { id: 'D005', name: '陈伟', phone: '139****0005', dept: '影像科', title: '主治医师', license: 'VET-BJ-2024-00895', licenseStatus: 're_review' as const, scheduleStatus: 'on_duty' as const, consults: 156, prescriptions: 42, signedPrescriptions: 42, avgConsultTime: '22.1', todayConsult: 6, rating: 4.5, reviews: 128, negativeReviews: 5, lastActive: '2026-06-16 18:20', hospital: '爱康宠物医院（朝阳分院）' },
];

const hospitalLedger = [
  { id: 'H001', name: '爱宠动物医院（总院）', phone: '010-12345678', license: '91110105MA01234567', licenseStatus: 'approved' as const, address: '北京市朝阳区建国路88号', poi: '116.4470,39.9085', doctors: 5, onDutyDoctors: 3, services: 8, servicePriceRange: '¥50-¥5,000', appointmentCapacity: 80, todayAppointments: 42, rating: 4.8, reviews: 2356, negativeReviews: 36, lastActive: '2026-06-16 20:30', complianceScore: 96 },
  { id: 'H002', name: '宠物之家诊疗中心', phone: '010-87654321', license: '91110105MA0ABCDE12', licenseStatus: 'approved' as const, address: '北京市海淀区中关村大街1号', poi: '116.3100,39.9800', doctors: 3, onDutyDoctors: 2, services: 5, servicePriceRange: '¥80-¥3,000', appointmentCapacity: 50, todayAppointments: 28, rating: 4.6, reviews: 1089, negativeReviews: 58, lastActive: '2026-06-16 19:45', complianceScore: 92 },
  { id: 'H003', name: '瑞康宠物医院', phone: '010-66668888', license: 'BJ-CW-2024-0156', licenseStatus: 'pending' as const, address: '北京市西城区金融街15号', poi: '116.3500,39.9150', doctors: 0, onDutyDoctors: 0, services: 0, servicePriceRange: '-', appointmentCapacity: 0, todayAppointments: 0, rating: 0, reviews: 0, negativeReviews: 0, lastActive: '2026-06-14 16:20', complianceScore: 0 },
  { id: 'H004', name: '宠乐康动物诊所', phone: '010-55557777', license: '91110105MA0XYZ9876', licenseStatus: 'rejected' as const, address: '北京市东城区王府井大街100号', poi: '116.4100,39.9100', doctors: 2, onDutyDoctors: 0, services: 3, servicePriceRange: '¥60-¥2,000', appointmentCapacity: 30, todayAppointments: 0, rating: 3.5, reviews: 42, negativeReviews: 18, lastActive: '2026-06-10 11:30', complianceScore: 45 },
  { id: 'H005', name: '爱康宠物医院（朝阳分院）', phone: '010-44446666', license: '91110105MA0HIJ12345', licenseStatus: 're_review' as const, address: '北京市朝阳区朝阳北路66号', poi: '116.4800,39.9200', doctors: 3, onDutyDoctors: 2, services: 6, servicePriceRange: '¥70-¥4,000', appointmentCapacity: 60, todayAppointments: 35, rating: 4.2, reviews: 356, negativeReviews: 28, lastActive: '2026-06-16 18:50', complianceScore: 78 },
];

const merchantLedger = [
  { id: 'M001', name: '宠物优选商城', phone: '136****0001', license: '91110106MA0ABCDEF12', licenseStatus: 'approved' as const, businessType: '综合商城', skuCount: 256, skuOnShelf: 248, skuOutOfStock: 8, prescriptionReviews: 156, orders: 1847, delivered: 1823, gmv: '¥486K', rating: 4.8, reviews: 2356, negativeReviews: 28, lastActive: '2026-06-16 20:45', complianceScore: 94, gspCertified: true },
  { id: 'M002', name: '爱宠优选供应链', phone: '136****8888', license: 'BJ-YAOPIN-2024-00234', licenseStatus: 'pending' as const, businessType: '药品批发', skuCount: 0, skuOnShelf: 0, skuOutOfStock: 0, prescriptionReviews: 0, orders: 0, delivered: 0, gmv: '¥0', rating: 0, reviews: 0, negativeReviews: 0, lastActive: '2026-06-15 11:20', complianceScore: 0, gspCertified: false },
  { id: 'M003', name: '萌宠食品专营', phone: '136****0002', license: '91110106MA0PQR56789', licenseStatus: 'approved' as const, businessType: '食品专营', skuCount: 128, skuOnShelf: 125, skuOutOfStock: 3, prescriptionReviews: 0, orders: 923, delivered: 918, gmv: '¥215K', rating: 4.7, reviews: 1089, negativeReviews: 35, lastActive: '2026-06-16 19:30', complianceScore: 91, gspCertified: false },
  { id: 'M004', name: '宠宝器械店', phone: '136****0003', license: '91110106MA0DEF12345', licenseStatus: 're_review' as const, businessType: '医疗器械', skuCount: 45, skuOnShelf: 40, skuOutOfStock: 5, prescriptionReviews: 23, orders: 67, delivered: 65, gmv: '¥32K', rating: 4.3, reviews: 128, negativeReviews: 12, lastActive: '2026-06-16 17:15', complianceScore: 72, gspCertified: true },
];

const reviewItems = [
  { id: 'DOC2024NEW021', type: 'doctor' as const, name: '孙医生', submitted: '2026-06-14 14:28', status: 'pending' as const, materials: 5, auditTrail: 1 },
  { id: 'HOS-2026-06-128', type: 'hospital' as const, name: '瑞康宠物医院', submitted: '2026-06-14 11:05', status: 'pending' as const, materials: 5, auditTrail: 1 },
  { id: 'MER-2026-06-086', type: 'merchant' as const, name: '爱宠优选供应链', submitted: '2026-06-14 09:30', status: 'pending' as const, materials: 5, auditTrail: 1 },
  { id: 'APPEAL-0521', type: 'user' as const, name: '违规账号申诉', submitted: '2026-06-13 18:42', status: 'pending' as const, materials: 3, auditTrail: 2 },
  { id: 'DOC-REVIEW-D004', type: 'doctor' as const, name: '赵敏（皮肤科）', submitted: '2026-06-10 09:00', status: 'rejected' as const, materials: 4, auditTrail: 3 },
  { id: 'HOS-REVIEW-H004', type: 'hospital' as const, name: '宠乐康动物诊所', submitted: '2026-06-08 14:20', status: 'rejected' as const, materials: 3, auditTrail: 4 },
  { id: 'DOC-REVIEW-D005', type: 'doctor' as const, name: '陈伟（影像科）', submitted: '2026-06-12 16:00', status: 're_review' as const, materials: 6, auditTrail: 5 },
  { id: 'MER-REVIEW-M004', type: 'merchant' as const, name: '宠宝器械店', submitted: '2026-06-11 10:30', status: 're_review' as const, materials: 4, auditTrail: 3 },
  { id: 'DOC-APPROVED-D001', type: 'doctor' as const, name: '王建国（内科）', submitted: '2026-06-01 10:00', status: 'approved' as const, materials: 5, auditTrail: 3 },
];

const prescriptionMonitor = [
  { id: 'RX-20260616-001', drug: '拜宠爽体外驱虫滴剂', doctor: '王建国', doctorSigned: true, ownerAcknowledged: true, status: 'approved' as const, createdAt: '2026-06-16 10:30' },
  { id: 'RX-20260615-023', drug: '头孢克洛片（宠用）', doctor: '李芳', doctorSigned: true, ownerAcknowledged: false, status: 'pending_owner' as const, createdAt: '2026-06-15 15:20' },
  { id: 'RX-20260614-018', drug: '甲硝唑注射液', doctor: '王建国', doctorSigned: true, ownerAcknowledged: true, status: 'approved' as const, createdAt: '2026-06-14 09:45' },
  { id: 'RX-20260613-007', drug: '伊维菌素滴剂', doctor: '孙医生', doctorSigned: false, ownerAcknowledged: false, status: 'pending_doctor' as const, createdAt: '2026-06-13 18:00' },
  { id: 'RX-20260612-003', drug: '地塞米松磷酸钠', doctor: '陈伟', doctorSigned: true, ownerAcknowledged: true, status: 'merchant_review' as const, createdAt: '2026-06-12 11:30' },
];

const auditLogs = [
  { time: '2026-06-16 10:32', action: '资质审核通过', user: 'admin', target: '医生-李静怡 VET-BJ-00892', result: '通过', detail: '执业证/资格证/学历均核验通过' },
  { time: '2026-06-16 10:08', action: '资质审核通过', user: 'admin', target: '医院-宠乐康 HOS-REVIEW-H004', result: '驳回', detail: '环评报告缺失，诊疗许可证范围不匹配' },
  { time: '2026-06-16 09:45', action: '处方双签完成', user: 'doctor-王建国', target: 'RX-20260614-018', result: '通过', detail: '医生签名+宠主知情确认+复核通过' },
  { time: '2026-06-16 09:12', action: '评价反作弊', user: 'admin', target: '评论文ID892 (疑似刷单)', result: '已处理', detail: 'IP/设备指纹异常，评价已清除' },
  { time: '2026-06-16 08:30', action: '账号禁用', user: 'admin', target: '用户-水军账号008', result: '生效', detail: '批量评价作弊，anti_fraud_score 0.89' },
  { time: '2026-06-15 17:00', action: '资质复审提交', user: 'doctor-陈伟', target: 'DOC-REVIEW-D005', result: '待审', detail: '补充提交学历学位证书+在职证明' },
  { time: '2026-06-15 14:20', action: '处方流转', user: 'doctor-李芳', target: 'RX-20260615-023', result: '待确认', detail: '医生已签名，等待宠主知情确认' },
  { time: '2026-06-15 10:00', action: '商家资质驳回', user: 'platform', target: 'MER-2026-06-086', result: '驳回', detail: 'GSP认证证书不完整，药品经营许可需补充' },
];

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: '正常', color: 'bg-forest-100 text-forest-700' },
  disabled: { label: '已禁用', color: 'bg-red-100 text-red-700' },
  pending: { label: '待审核', color: 'bg-warm-100 text-warm-600' },
  approved: { label: '已通过', color: 'bg-forest-100 text-forest-700' },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-700' },
  re_review: { label: '复审中', color: 'bg-purple-100 text-purple-700' },
  pending_doctor: { label: '待医生签名', color: 'bg-warm-100 text-warm-600' },
  pending_owner: { label: '待宠主确认', color: 'bg-blue-100 text-blue-700' },
  merchant_review: { label: '商家复核中', color: 'bg-sky-100 text-sky-700' },
  sick: { label: '病中跟踪', color: 'bg-red-100 text-red-700' },
  recovering: { label: '康复中', color: 'bg-orange-100 text-orange-700' },
  healthy: { label: '健康', color: 'bg-forest-100 text-forest-700' },
  scheduled: { label: '已预约', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', color: 'bg-forest-100 text-forest-700' },
  missed: { label: '已爽约', color: 'bg-red-100 text-red-700' },
  pending_review: { label: '待内容审核', color: 'bg-warm-100 text-warm-600' },
  published: { label: '已发布', color: 'bg-forest-100 text-forest-700' },
  removed: { label: '已下架', color: 'bg-gray-100 text-gray-700' },
  on_duty: { label: '当班', color: 'bg-forest-100 text-forest-700' },
  off_duty: { label: '休班', color: 'bg-gray-100 text-gray-700' },
  in_surgery: { label: '手术中', color: 'bg-red-100 text-red-700' },
  in_stock: { label: '在架', color: 'bg-forest-100 text-forest-700' },
  out_of_stock: { label: '缺货', color: 'bg-warm-100 text-warm-600' },
  off_shelf: { label: '下架', color: 'bg-gray-100 text-gray-700' },
  delivered: { label: '已发货', color: 'bg-sky-100 text-sky-700' },
  normal: { label: '正常', color: 'bg-forest-100 text-forest-700' },
  missing: { label: '缺班', color: 'bg-red-100 text-red-700' },
  overload: { label: '超载', color: 'bg-orange-100 text-orange-700' },
  rest: { label: '休息', color: 'bg-gray-100 text-gray-700' },
  registered: { label: '已备案', color: 'bg-forest-100 text-forest-700' },
  expired: { label: '已过期', color: 'bg-red-100 text-red-700' },
  under_review: { label: '审核中', color: 'bg-blue-100 text-blue-700' },
};

const reviewTypeConfig: Record<string, { color: string; Icon: React.ComponentType<{ className?: string }>; label: string }> = {
  doctor: { color: 'from-blue-100 to-sky-200 text-blue-700', Icon: Stethoscope, label: '医生' },
  hospital: { color: 'from-orange-100 to-amber-200 text-orange-700', Icon: Building2, label: '医院' },
  merchant: { color: 'from-rose-100 to-pink-200 text-rose-700', Icon: Store, label: '商家' },
  user: { color: 'from-red-100 to-orange-200 text-red-700', Icon: AlertTriangle, label: '申诉' },
};

const consultationAudit = [
  { id: 'CS-20260616-001', petName: '豆豆', owner: '张小明', doctor: '王建国', dept: '内科', diagnosis: '急性胃肠炎', symptoms: '呕吐、腹泻、精神萎靡', duration: '15分钟', doctorSigned: true, ownerAcknowledged: true, prescriptionIssued: true, followUpNeeded: true, followUpDate: '2026-06-19', createdAt: '2026-06-16 10:30', aesEncrypted: true },
  { id: 'CS-20260616-002', petName: '咪咪', owner: '张小明', doctor: '李芳', dept: '外科', diagnosis: '皮肤真菌感染', symptoms: '脱毛、瘙痒、皮屑增多', duration: '12分钟', doctorSigned: true, ownerAcknowledged: true, prescriptionIssued: true, followUpNeeded: false, followUpDate: '-', createdAt: '2026-06-16 11:15', aesEncrypted: true },
  { id: 'CS-20260616-003', petName: '小白', owner: '李小红', doctor: '王建国', dept: '内科', diagnosis: '上呼吸道感染', symptoms: '咳嗽、流涕、发热39.5℃', duration: '18分钟', doctorSigned: true, ownerAcknowledged: false, prescriptionIssued: true, followUpNeeded: true, followUpDate: '2026-06-18', createdAt: '2026-06-16 14:20', aesEncrypted: true },
  { id: 'CS-20260615-012', petName: '球球', owner: '赵小芳', doctor: '陈伟', dept: '影像科', diagnosis: '膀胱结石', symptoms: '排尿困难、血尿', duration: '25分钟', doctorSigned: true, ownerAcknowledged: true, prescriptionIssued: true, followUpNeeded: true, followUpDate: '2026-06-20', createdAt: '2026-06-15 16:45', aesEncrypted: true },
  { id: 'CS-20260615-008', petName: '豆豆', owner: '张小明', doctor: '王建国', dept: '内科', diagnosis: '疫苗接种', symptoms: '年度加强免疫', duration: '8分钟', doctorSigned: true, ownerAcknowledged: true, prescriptionIssued: false, followUpNeeded: true, followUpDate: '2027-06-15', createdAt: '2026-06-15 09:30', aesEncrypted: true },
];

const communityPosts = [
  { id: 'POST-20260616-001', type: 'community' as const, author: '孙丽丽', title: '我家豆豆的皮肤病治疗日记', content: '分享一下我家猫咪治疗猫癣的全过程，希望对大家有帮助...', likes: 128, comments: 23, shares: 15, views: 1520, status: 'published' as const, riskScore: 8, createdAt: '2026-06-16 18:20', auditTrail: 1 },
  { id: 'LOST-20260616-002', type: 'lost' as const, author: '李小红', petName: '小白', breed: '金毛犬', color: '金黄色', lastSeen: '朝阳区朝阳公园附近', lostTime: '2026-06-16 14:30', reward: '¥2,000', contact: '138****0002', status: 'published' as const, riskScore: 5, createdAt: '2026-06-16 15:10', auditTrail: 0 },
  { id: 'ADOPT-20260615-003', type: 'adopt' as const, author: '王大伟', petName: '旺财', breed: '中华田园犬', age: '2岁', gender: '公', vaccinated: true, neutered: true, description: '性格温顺，已绝育驱虫，寻找爱心家庭', status: 'pending_review' as const, riskScore: 15, createdAt: '2026-06-15 20:15', applicantCount: 3, auditTrail: 0 },
  { id: 'ADOPT-20260610-006', type: 'adopt' as const, author: '孙丽丽', petName: '小黑', breed: '英短蓝猫', age: '1岁', gender: '母', vaccinated: true, neutered: true, description: '粘人爱撒娇，已完成全部疫苗，希望找有耐心的主人', status: 'published' as const, riskScore: 8, createdAt: '2026-06-10 12:30', applicantCount: 5, auditTrail: 2 },
  { id: 'POST-20260614-004', type: 'community' as const, author: '赵小芳', title: '避雷！某宠物医院过度诊疗经历', content: '我家狗狗只是有点消化不良，居然让做了一堆检查...', likes: 256, comments: 89, shares: 45, views: 8560, status: 'pending_review' as const, riskScore: 78, createdAt: '2026-06-14 21:30', auditTrail: 2 },
  { id: 'LOST-20260612-005', type: 'lost' as const, author: '孙丽丽', petName: '毛毛', breed: '布偶猫', color: '海豹双色', lastSeen: '海淀区中关村附近', lostTime: '2026-06-12 08:00', reward: '¥5,000', contact: '136****0001', status: 'published' as const, riskScore: 12, createdAt: '2026-06-12 09:20', auditTrail: 3, found: false },
];

const calendarEvents = [
  { id: 'EVT-20260617-001', type: 'vaccine' as const, title: '狂犬疫苗接种', petName: '豆豆', owner: '张小明', hospital: '爱宠动物医院（总院）', scheduledTime: '2026-06-17 09:00', reminderSent: 3, reminderOpened: true, status: 'scheduled' as const, lastReminder: '2026-06-16 20:00' },
  { id: 'EVT-20260617-002', type: 'deworm' as const, title: '体内驱虫', petName: '咪咪', owner: '张小明', hospital: '-', scheduledTime: '2026-06-17 12:00', reminderSent: 2, reminderOpened: true, status: 'pending' as const, lastReminder: '2026-06-16 09:00' },
  { id: 'EVT-20260618-003', type: 'checkup' as const, title: '年度体检', petName: '小白', owner: '李小红', hospital: '宠物之家诊疗中心', scheduledTime: '2026-06-18 14:30', reminderSent: 3, reminderOpened: false, status: 'scheduled' as const, lastReminder: '2026-06-16 18:00' },
  { id: 'EVT-20260616-004', type: 'consultation' as const, title: '复诊-胃肠炎', petName: '小白', owner: '李小红', doctor: '王建国', hospital: '爱宠动物医院（总院）', scheduledTime: '2026-06-16 10:30', reminderSent: 3, reminderOpened: true, status: 'completed' as const, actualTime: '2026-06-16 10:25' },
  { id: 'EVT-20260615-005', type: 'vaccine' as const, title: '四联疫苗', petName: '旺财', owner: '王大伟', hospital: '瑞康宠物医院', scheduledTime: '2026-06-15 09:00', reminderSent: 5, reminderOpened: false, status: 'missed' as const, lastReminder: '2026-06-15 08:00' },
  { id: 'EVT-20260619-006', type: 'custom' as const, title: '皮肤复查', petName: '球球', owner: '赵小芳', doctor: '李芳', hospital: '爱宠动物医院（总院）', scheduledTime: '2026-06-19 15:00', reminderSent: 1, reminderOpened: true, status: 'scheduled' as const, lastReminder: '2026-06-16 20:30' },
];

const doctorScheduleData: Record<string, DoctorScheduleDetail> = {
  'D001': {
    doctorId: 'D001',
    weeklySchedule: [
      { date: '06-16', weekday: '周一', morning: 'on', afternoon: 'on', night: 'off' },
      { date: '06-17', weekday: '周二', morning: 'on', afternoon: 'busy', night: 'off' },
      { date: '06-18', weekday: '周三', morning: 'on', afternoon: 'on', night: 'on' },
      { date: '06-19', weekday: '周四', morning: 'on', afternoon: 'on', night: 'off' },
      { date: '06-20', weekday: '周五', morning: 'busy', afternoon: 'on', night: 'off' },
      { date: '06-21', weekday: '周六', morning: 'on', afternoon: 'off', night: 'off' },
      { date: '06-22', weekday: '周日', morning: 'off', afternoon: 'off', night: 'off' },
    ],
    workDays: 6,
    consultationCount: 486,
    avgConsultTime: '12.5',
    warnings: ['连续上班6天，建议安排休息'],
  },
  'D002': {
    doctorId: 'D002',
    weeklySchedule: [
      { date: '06-16', weekday: '周一', morning: 'on', afternoon: 'on', night: 'on' },
      { date: '06-17', weekday: '周二', morning: 'on', afternoon: 'on', night: 'off' },
      { date: '06-18', weekday: '周三', morning: 'off', afternoon: 'off', night: 'off' },
      { date: '06-19', weekday: '周四', morning: 'on', afternoon: 'busy', night: 'on' },
      { date: '06-20', weekday: '周五', morning: 'on', afternoon: 'on', night: 'off' },
      { date: '06-21', weekday: '周六', morning: 'on', afternoon: 'on', night: 'off' },
      { date: '06-22', weekday: '周日', morning: 'off', afternoon: 'off', night: 'off' },
    ],
    workDays: 5,
    consultationCount: 312,
    avgConsultTime: '18.3',
    warnings: ['单日接诊最高22次，超出建议上限'],
  },
  'D005': {
    doctorId: 'D005',
    weeklySchedule: [
      { date: '06-16', weekday: '周一', morning: 'on', afternoon: 'on', night: 'off' },
      { date: '06-17', weekday: '周二', morning: 'off', afternoon: 'off', night: 'off' },
      { date: '06-18', weekday: '周三', morning: 'on', afternoon: 'on', night: 'off' },
      { date: '06-19', weekday: '周四', morning: 'on', afternoon: 'on', night: 'off' },
      { date: '06-20', weekday: '周五', morning: 'on', afternoon: 'on', night: 'off' },
      { date: '06-21', weekday: '周六', morning: 'off', afternoon: 'off', night: 'off' },
      { date: '06-22', weekday: '周日', morning: 'on', afternoon: 'on', night: 'off' },
    ],
    workDays: 5,
    consultationCount: 156,
    avgConsultTime: '22.1',
    warnings: [],
  },
};

const merchantQualificationData: Record<string, MerchantQualificationDetail> = {
  'M001': {
    merchantId: 'M001',
    overallStatus: 'registered',
    certificates: [
      { id: 'C001', name: '营业执照', number: '91110106MA0ABCDEF12', expiryDate: '长期', remainingDays: 9999, status: 'valid' },
      { id: 'C002', name: 'GSP认证证书', number: 'GSP-BJ-2024-0045', expiryDate: '2028-03-15', remainingDays: 637, status: 'valid' },
      { id: 'C003', name: '食品经营许可证', number: 'JY1110500012345', expiryDate: '2026-07-20', remainingDays: 33, status: 'warning' },
    ],
  },
  'M002': {
    merchantId: 'M002',
    overallStatus: 'pending',
    certificates: [
      { id: 'C001', name: '营业执照', number: 'BJ-YAOPIN-2024-00234', expiryDate: '2027-06-15', remainingDays: 363, status: 'valid' },
      { id: 'C002', name: '药品经营许可证', number: 'YAOPIN-BJ-2024-00234', expiryDate: '-', remainingDays: 0, status: 'warning' },
      { id: 'C003', name: 'GSP认证证书', number: '-', expiryDate: '-', remainingDays: 0, status: 'expired' },
    ],
  },
  'M004': {
    merchantId: 'M004',
    overallStatus: 'under_review',
    certificates: [
      { id: 'C001', name: '营业执照', number: '91110106MA0DEF12345', expiryDate: '2029-12-31', remainingDays: 1292, status: 'valid' },
      { id: 'C002', name: '医疗器械经营许可证', number: 'QX-BJ-2023-00678', expiryDate: '2025-12-31', remainingDays: -168, status: 'expired' },
      { id: 'C003', name: 'GSP认证证书', number: 'GSP-BJ-2023-00123', expiryDate: '2026-08-10', remainingDays: 54, status: 'warning' },
    ],
  },
};

const hospitalPricingData: Record<string, HospitalPricingDetail> = {
  'H001': {
    hospitalId: 'H001',
    avgDeviation: 12.5,
    overpriceCount: 1,
    minPrice: 95,
    maxPrice: 850,
    priceDistribution: [
      { range: '<-10%', count: 0 },
      { range: '-10%~0%', count: 0 },
      { range: '0%~10%', count: 2 },
      { range: '10%~20%', count: 2 },
      { range: '>20%', count: 1 },
    ],
    services: [
      { serviceId: 'S001', serviceName: '常规体检', guidePrice: 200, hospitalPrice: 220, deviationRate: 10.0, status: 'normal' },
      { serviceId: 'S002', serviceName: '疫苗接种（犬四联）', guidePrice: 120, hospitalPrice: 150, deviationRate: 25.0, status: 'overprice' },
      { serviceId: 'S003', serviceName: '绝育手术（公犬）', guidePrice: 800, hospitalPrice: 850, deviationRate: 6.3, status: 'normal' },
      { serviceId: 'S004', serviceName: '血常规检查', guidePrice: 80, hospitalPrice: 95, deviationRate: 18.8, status: 'warning' },
      { serviceId: 'S005', serviceName: '生化全套', guidePrice: 350, hospitalPrice: 380, deviationRate: 8.6, status: 'normal' },
    ],
  },
  'H002': {
    hospitalId: 'H002',
    avgDeviation: 8.3,
    overpriceCount: 0,
    minPrice: 160,
    maxPrice: 1350,
    priceDistribution: [
      { range: '<-10%', count: 0 },
      { range: '-10%~0%', count: 1 },
      { range: '0%~10%', count: 2 },
      { range: '10%~20%', count: 1 },
      { range: '>20%', count: 0 },
    ],
    services: [
      { serviceId: 'S001', serviceName: '常规体检', guidePrice: 200, hospitalPrice: 210, deviationRate: 5.0, status: 'normal' },
      { serviceId: 'S002', serviceName: '疫苗接种（猫三联）', guidePrice: 150, hospitalPrice: 160, deviationRate: 6.7, status: 'normal' },
      { serviceId: 'S003', serviceName: '绝育手术（母猫）', guidePrice: 1200, hospitalPrice: 1350, deviationRate: 12.5, status: 'warning' },
      { serviceId: 'S004', serviceName: 'B超检查', guidePrice: 300, hospitalPrice: 280, deviationRate: -6.7, status: 'normal' },
    ],
  },
  'H005': {
    hospitalId: 'H005',
    avgDeviation: 22.1,
    overpriceCount: 2,
    minPrice: 85,
    maxPrice: 280,
    priceDistribution: [
      { range: '<-10%', count: 0 },
      { range: '-10%~0%', count: 0 },
      { range: '0%~10%', count: 1 },
      { range: '10%~20%', count: 1 },
      { range: '>20%', count: 2 },
    ],
    services: [
      { serviceId: 'S001', serviceName: '常规体检', guidePrice: 200, hospitalPrice: 260, deviationRate: 30.0, status: 'overprice' },
      { serviceId: 'S002', serviceName: '疫苗接种（犬六联）', guidePrice: 180, hospitalPrice: 220, deviationRate: 22.2, status: 'overprice' },
      { serviceId: 'S003', serviceName: '影像检查（DR）', guidePrice: 250, hospitalPrice: 280, deviationRate: 12.0, status: 'warning' },
      { serviceId: 'S004', serviceName: '血常规检查', guidePrice: 80, hospitalPrice: 85, deviationRate: 6.3, status: 'normal' },
    ],
  },
};

const antiCheatReviews: AntiCheatReview[] = [
  {
    id: 'AC001',
    content: '这家医院真的太棒了！医生非常专业，服务态度超级好，价格也很实惠。强烈推荐大家都来！',
    reviewer: '快乐宠主001',
    reviewedTarget: '爱宠动物医院（总院）',
    targetType: 'hospital',
    riskScore: 92,
    riskReasons: ['ip_abnormal', 'device_fingerprint', 'content_similar'],
    status: 'pending',
    createdAt: '2026-06-16 15:30',
    ip: '114.247.xx.xx',
    deviceFingerprint: 'iPhone15,2_00:1A:2B:3C:4D:5E',
  },
  {
    id: 'AC002',
    content: '王医生技术超棒，我家狗狗的病很快就好了，感谢感谢！',
    reviewer: '爱犬人士888',
    reviewedTarget: '王建国',
    targetType: 'doctor',
    riskScore: 78,
    riskReasons: ['brush_suspect', 'content_similar'],
    status: 'pending',
    createdAt: '2026-06-16 14:20',
    ip: '123.123.xx.xx',
    deviceFingerprint: 'HUAWEI-Mate60_AA:BB:CC:DD:EE:FF',
  },
  {
    id: 'AC003',
    content: '这款猫粮我家猫咪特别爱吃，已经买了第5袋了，质量非常好！',
    reviewer: '喵喵铲屎官',
    reviewedTarget: '皇家成猫猫粮 2kg',
    targetType: 'product',
    riskScore: 85,
    riskReasons: ['brush_suspect', 'device_fingerprint'],
    status: 'pending',
    createdAt: '2026-06-16 11:45',
    ip: '223.104.xx.xx',
    deviceFingerprint: 'Xiaomi-13_11:22:33:44:55:66',
  },
  {
    id: 'AC004',
    content: '医生很耐心，解答了我很多问题，下次还会来问诊。',
    reviewer: '宠主小王',
    reviewedTarget: '李芳',
    targetType: 'doctor',
    riskScore: 45,
    riskReasons: [],
    status: 'approved',
    createdAt: '2026-06-15 16:00',
    ip: '117.136.xx.xx',
    deviceFingerprint: 'iPhone14,3_AA:11:BB:22:CC:33',
  },
  {
    id: 'AC005',
    content: '服务很差，收费很高，不推荐。',
    reviewer: '匿名用户',
    reviewedTarget: '宠物之家诊疗中心',
    targetType: 'hospital',
    riskScore: 35,
    riskReasons: [],
    status: 'rejected',
    createdAt: '2026-06-15 09:30',
    ip: '111.206.xx.xx',
    deviceFingerprint: 'OPPO-FindX7_44:55:66:77:88:99',
  },
  {
    id: 'AC006',
    content: '这家店的宠物用品性价比超高，已经回购N次了！',
    reviewer: '剁手党小能手',
    reviewedTarget: '宠物优选商城',
    targetType: 'merchant',
    riskScore: 88,
    riskReasons: ['device_fingerprint', 'brush_suspect', 'ip_abnormal'],
    status: 'blocked',
    createdAt: '2026-06-14 20:15',
    ip: '114.247.xx.xx',
    deviceFingerprint: 'iPhone15,2_00:1A:2B:3C:4D:5E',
  },
];

const getCurrentTimestamp = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

const generateId = () => Math.random().toString(36).substring(2, 11);

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTabState] = useState<TabId>('owner');
  const [expandedAudit, setExpandedAudit] = useState<number | string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedDoctorAction, setSelectedDoctorAction] = useState<{id: string, action: string} | null>(null);
  const [selectedHospitalAction, setSelectedHospitalAction] = useState<{id: string, action: string} | null>(null);
  const [selectedMerchantAction, setSelectedMerchantAction] = useState<{id: string, action: string} | null>(null);
  const [selectedOwnerAction, setSelectedOwnerAction] = useState<{id: string, action: string} | null>(null);
  const [actionProcessing, setActionProcessing] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [localAuditLogs, setLocalAuditLogs] = useState(auditLogs);
  const [ownerLedger, setOwnerLedger] = useState(initialOwnerLedger);

  const [bindingAuditData, setBindingAuditData] = useState(mockBindingAudit);
  const [diseaseRecordsData, setDiseaseRecordsData] = useState(mockDiseaseRecords);
  const [reminderRecordsData, setReminderRecordsData] = useState(mockReminderRecords);
  const [disableRecordsData, setDisableRecordsData] = useState(mockDisableRecords);
  const [reviewRecordsData, setReviewRecordsData] = useState(mockReviewRecords);

  const [expandedColumn, setExpandedColumn] = useState<{id: string, column: string} | null>(null);
  const [reviewPanelVisible, setReviewPanelVisible] = useState<string | null>(null);
  const [disableReviewPanelVisible, setDisableReviewPanelVisible] = useState<string | null>(null);
  const [disableReviewForm, setDisableReviewForm] = useState({
    disableReason: '',
    reviewDeadline: '',
    reviewer: '',
    reviewOpinion: '',
  });

  const addReviewRecord = (ownerId: string, type: ReviewRecord['type'], content: string, reviewStatus: ReviewStatus = 'pending', reviewOpinion: string = '') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const operationTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    
    const newRecord: ReviewRecord = {
      id: `RV${Date.now()}`,
      type,
      operationTime,
      operator: user?.nickname || 'admin',
      content,
      reviewStatus,
      reviewOpinion,
      reviewer: reviewStatus !== 'pending' ? (user?.nickname || 'admin') : undefined,
      reviewTime: reviewStatus !== 'pending' ? operationTime : undefined,
    };

    setReviewRecordsData(prev => ({
      ...prev,
      [ownerId]: [...(prev[ownerId] || []), newRecord],
    }));

    return newRecord;
  };

  const [verificationToast, setVerificationToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [activeTabHistory, setActiveTabHistory] = useState<TabRecord[]>([]);
  const [navigationHistory, setNavigationHistory] = useState<NavigationRecord[]>([]);
  const [actionHistory, setActionHistory] = useState<ActionRecord[]>([]);
  const [filterHistory, setFilterHistory] = useState<FilterRecord[]>([]);
  const [verificationDrawerOpen, setVerificationDrawerOpen] = useState(false);
  const [verificationActiveTab, setVerificationActiveTab] = useState<VerificationTabId>('navigation');
  const [searchKeyword, setSearchKeyword] = useState('');

  const [interactionVerification, setInteractionVerification] = useState<InteractionVerificationState>(() =>
    loadFromStorage('interactionVerification', {
      navigationRecords: presetOwnerRoutes.map(r => ({
        id: generateId(),
        targetPath: r.path,
        timestamp: '-',
        source: '预置清单',
        status: 'pending' as VerificationStatus,
        isPreset: true,
      })),
      tabRecords: presetAdminTabs.map(tabId => {
        const tab = tabs.find(t => t.id === tabId);
        return {
          id: generateId(),
          tabName: tab?.label || '',
          tabId,
          timestamp: '-',
          status: 'pending' as VerificationStatus,
          isPreset: true,
        };
      }),
      actionRecords: [],
      filterRecords: [],
    })
  );

  const verifiedTabCount = interactionVerification.tabRecords.filter(r => r.status === 'success').length;
  const allTabsVerified = verifiedTabCount === 10;

  const [localReviewItems, setLocalReviewItems] = useState(reviewItems);
  const [expandedReviewDetail, setExpandedReviewDetail] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<{id: string, type: 'approve' | 'reject' | 'supplement'} | null>(null);
  const [reviewOpinion, setReviewOpinion] = useState('');

  const [expandedConsultation, setExpandedConsultation] = useState<string | null>(null);

  const [localPrescriptions, setLocalPrescriptions] = useState(prescriptionMonitor);
  const [expandedPrescription, setExpandedPrescription] = useState<string | null>(null);

  const [localCommunityPosts, setLocalCommunityPosts] = useState(communityPosts);
  const [expandedLostPet, setExpandedLostPet] = useState<string | null>(null);

  const [expandedServicePricing, setExpandedServicePricing] = useState<string | null>(null);
  const [priceAdjustId, setPriceAdjustId] = useState<{hospitalId: string, serviceId: string} | null>(null);
  const [adjustPrice, setAdjustPrice] = useState('');
  const [priceWarningReason, setPriceWarningReason] = useState('');
  const [showLinkInfo, setShowLinkInfo] = useState(false);
  const [showLinkVerification, setShowLinkVerification] = useState(false);
  const [linkVerification, setLinkVerification] = useState<Record<string, boolean>>({
    petProfile: false,
    consultation: false,
    hospital: false,
    mall: false,
    community: false,
    calendar: false,
  });

  const [communitySubTab, setCommunitySubTab] = useState<CommunitySubTab>('posts');
  const [localAntiCheatReviews, setLocalAntiCheatReviews] = useState(antiCheatReviews);
  const [expandedAntiCheat, setExpandedAntiCheat] = useState<string | null>(null);

  const [scheduleFilterExpanded, setScheduleFilterExpanded] = useState(false);
  const [qualificationFilterExpanded, setQualificationFilterExpanded] = useState(false);
  const [pricingFilterExpanded, setPricingFilterExpanded] = useState(false);
  const [anticheatFilterExpanded, setAnticheatFilterExpanded] = useState(false);

  const [scheduleWarningVisible, setScheduleWarningVisible] = useState<string | null>(null);
  const [scheduleAdjustVisible, setScheduleAdjustVisible] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState('');

  const [qualificationReviewVisible, setQualificationReviewVisible] = useState<string | null>(null);
  const [rectifyDeadline, setRectifyDeadline] = useState('');
  const [rectifyReason, setRectifyReason] = useState('');

  const [priceLimitVisible, setPriceLimitVisible] = useState<{hospitalId: string, serviceId: string} | null>(null);
  const [limitPrice, setLimitPrice] = useState('');
  const [limitReason, setLimitReason] = useState('');

  const [blockUserVisible, setBlockUserVisible] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [addToBlacklist, setAddToBlacklist] = useState(false);

  const linkNodes = [
    { id: 'home', label: '宠主首页', path: '/', Icon: Home },
    { id: 'petProfile', label: '宠物档案', path: '/pets', Icon: PawPrint },
    { id: 'consultation', label: '在线问诊', path: '/consult', Icon: Stethoscope },
    { id: 'prescription', label: '处方双签', path: '/prescriptions', Icon: Pill },
    { id: 'mall', label: '商城购药', path: '/mall', Icon: ShoppingCart },
    { id: 'appointment', label: '服务预约', path: '/appointments', Icon: Calendar },
    { id: 'calendar', label: '健康日历', path: '/calendar', Icon: Calendar },
  ];

  const verificationPages = [
    { id: 'petProfile', label: '宠物档案', path: '/pets', Icon: PawPrint },
    { id: 'consultation', label: '在线问诊', path: '/consult', Icon: Stethoscope },
    { id: 'hospital', label: '附近医院', path: '/hospitals', Icon: MapPin },
    { id: 'mall', label: '商城', path: '/mall', Icon: Store },
    { id: 'community', label: '社区', path: '/community', Icon: MessageCircle },
    { id: 'calendar', label: '健康日历', path: '/calendar', Icon: Calendar },
  ];

  const mockOperationRecords = [
    { time: '2026-06-17 10:30', action: '查看豆豆健康档案', result: '成功', operator: '超级管理员' },
    { time: '2026-06-17 10:28', action: '发起在线问诊', result: '成功', operator: '超级管理员' },
    { time: '2026-06-17 10:25', action: '浏览商城药品', result: '成功', operator: '超级管理员' },
  ];

  const handleLinkNodeClick = (path: string, label: string) => {
    addAuditLog('模拟宠主操作-链路节点', label, '成功', `管理员通过链路说明跳转到${label}`);
    showToast(`已跳转到${label}`);
    trackNavigate(path, `链路节点-${label}`);
  };

  const handleVerificationClick = (pageId: string, path: string, label: string) => {
    setLinkVerification(prev => ({ ...prev, [pageId]: true }));
    addAuditLog('宠主链路验证', label, '已验证', `管理员验证${label}页面跳转`);
    showToast(`${label} 验证成功，正在跳转...`);
    trackNavigate(path, `链路验证-${label}`);
  };

  const persistVerification = (state: InteractionVerificationState) => {
    saveToStorage('interactionVerification', state);
  };

  const showVerificationToast = (message: string, type: 'success' | 'error' = 'success') => {
    setVerificationToast({ message, type });
    setTimeout(() => setVerificationToast(null), 2000);
  };

  const setActiveTab = (tabId: TabId) => {
    const tab = tabs.find(t => t.id === tabId);
    const timestamp = getCurrentTimestamp();
    const record: TabRecord = {
      id: generateId(),
      tabName: tab?.label || '',
      tabId,
      timestamp,
      status: 'success',
    };
    setActiveTabHistory(prev => [record, ...prev]);
    setActiveTabState(tabId);
    setInteractionVerification(prev => {
      const newRecords = prev.tabRecords.map(r =>
        r.tabId === tabId ? { ...r, status: 'success' as VerificationStatus, timestamp } : r
      );
      const newState = { ...prev, tabRecords: newRecords };
      persistVerification(newState);
      return newState;
    });
    showVerificationToast(`✓ 已切换到 ${tab?.label}`, 'success');
  };

  const trackNavigate = (path: string, source: string = '手动操作') => {
    const timestamp = getCurrentTimestamp();
    const record: NavigationRecord = {
      id: generateId(),
      targetPath: path,
      timestamp,
      source,
      status: 'success',
    };
    setNavigationHistory(prev => [record, ...prev]);
    setInteractionVerification(prev => {
      const existing = prev.navigationRecords.find(r => r.targetPath === path && r.isPreset);
      let newRecords = prev.navigationRecords;
      if (existing) {
        newRecords = prev.navigationRecords.map(r =>
          r.targetPath === path && r.isPreset ? { ...r, status: 'success' as VerificationStatus, timestamp, source } : r
        );
      } else {
        newRecords = [record, ...prev.navigationRecords];
      }
      const newState = { ...prev, navigationRecords: newRecords };
      persistVerification(newState);
      return newState;
    });
    navigate(path);
  };

  const trackAction = (actionType: string, target: string, result: string, dataChange?: string) => {
    const timestamp = getCurrentTimestamp();
    const auditLogId = `AUDIT-${Date.now()}`;
    const record: ActionRecord = {
      id: generateId(),
      actionType,
      target,
      timestamp,
      result,
      auditLogId,
      dataChange,
      status: 'success',
    };
    setActionHistory(prev => [record, ...prev]);
    setInteractionVerification(prev => {
      const newState = { ...prev, actionRecords: [record, ...prev.actionRecords] };
      persistVerification(newState);
      return newState;
    });
  };

  const trackFilter = (filterType: string, conditions: string, resultCount: number) => {
    const timestamp = getCurrentTimestamp();
    const record: FilterRecord = {
      id: generateId(),
      filterType,
      filterConditions: conditions,
      timestamp,
      resultCount,
      status: 'success',
    };
    setFilterHistory(prev => [record, ...prev]);
    setInteractionVerification(prev => {
      const newState = { ...prev, filterRecords: [record, ...prev.filterRecords] };
      persistVerification(newState);
      return newState;
    });
    showToast(`筛选完成，共 ${resultCount} 条结果`, 'success');
  };

  const exportVerificationReport = () => {
    const { navigationRecords, tabRecords, actionRecords, filterRecords } = interactionVerification;
    const csvContent = [
      ['交互验证报告 - 导出时间', getCurrentTimestamp()],
      [],
      ['=== 导航验证记录 ==='],
      ['目标路径', '跳转时间', '跳转来源', '验证状态'],
      ...navigationRecords.map(r => [r.targetPath, r.timestamp, r.source, r.status === 'success' ? '成功✓' : r.status === 'failed' ? '失败✗' : '待验证']),
      [],
      ['=== Tab验证记录 ==='],
      ['Tab名称', 'Tab ID', '切换时间', '验证状态'],
      ...tabRecords.map(r => [r.tabName, r.tabId, r.timestamp, r.status === 'success' ? '成功✓' : r.status === 'failed' ? '失败✗' : '待验证']),
      [],
      ['=== 操作验证记录 ==='],
      ['操作类型', '操作目标', '操作时间', '操作结果', '审计日志ID', '数据变化'],
      ...actionRecords.map(r => [r.actionType, r.target, r.timestamp, r.result, r.auditLogId || '', r.dataChange || '']),
      [],
      ['=== 筛选验证记录 ==='],
      ['筛选类型', '筛选条件', '筛选时间', '结果数量', '验证状态'],
      ...filterRecords.map(r => [r.filterType, r.filterConditions, r.timestamp, r.resultCount, r.status === 'success' ? '成功✓' : r.status === 'failed' ? '失败✗' : '待验证']),
    ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `交互验证报告_${getCurrentTimestamp().replace(/[:\s]/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('验证报告已导出', 'success');
  };

  const resetVerification = () => {
    const resetState: InteractionVerificationState = {
      navigationRecords: presetOwnerRoutes.map(r => ({
        id: generateId(),
        targetPath: r.path,
        timestamp: '-',
        source: '预置清单',
        status: 'pending' as VerificationStatus,
        isPreset: true,
      })),
      tabRecords: presetAdminTabs.map(tabId => {
        const tab = tabs.find(t => t.id === tabId);
        return {
          id: generateId(),
          tabName: tab?.label || '',
          tabId,
          timestamp: '-',
          status: 'pending' as VerificationStatus,
          isPreset: true,
        };
      }),
      actionRecords: [],
      filterRecords: [],
    };
    setInteractionVerification(resetState);
    setActiveTabHistory([]);
    setNavigationHistory([]);
    setActionHistory([]);
    setFilterHistory([]);
    persistVerification(resetState);
    showToast('验证记录已重置', 'success');
  };

  const handlePreviewClick = () => {
    addAuditLog('平台预览', '宠主首页', '成功', '管理员点击平台预览进入宠主首页');
    trackNavigate('/', '平台预览按钮');
  };

  const handleReject = (id: string) => {
    setProcessing(`reject-${id}`);
    setTimeout(() => setProcessing(null), 600);
  };

  const handleApprove = (id: string) => {
    setProcessing(`approve-${id}`);
    setTimeout(() => setProcessing(null), 600);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addAuditLog = (action: string, target: string, result: string, detail: string) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const time = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setLocalAuditLogs(prev => [{ time, action, user: user?.nickname || 'admin', target, result, detail }, ...prev]);
  };

  const handleAction = (entityType: '医生' | '医院' | '商家', id: string, actionName: string, result: string, detail: string, dataChange?: string) => {
    setActionProcessing(true);
    setTimeout(() => {
      setActionProcessing(false);
      addAuditLog(`${entityType}监管-${actionName}`, `${entityType}-${id}`, result, detail);
      trackAction(`${entityType}监管-${actionName}`, `${entityType}-${id}`, result, dataChange);
      showToast(`${actionName}操作完成：${result}`, result === '通过' ? 'success' : 'error');
    }, 700);
  };

  const handleReviewAction = (id: string, type: 'approve' | 'reject' | 'supplement') => {
    if (!reviewOpinion.trim()) {
      showToast('请填写审核意见', 'error');
      return;
    }
    setProcessing(`review-${type}-${id}`);
    const item = localReviewItems.find(r => r.id === id);
    const newStatus = type === 'approve' ? 'approved' : type === 'reject' ? 'rejected' : 're_review';
    const actionLabel = type === 'approve' ? '通过' : type === 'reject' ? '驳回' : '补充材料';
    
    setTimeout(() => {
      setLocalReviewItems(prev => prev.map(r => 
        r.id === id ? { ...r, status: newStatus as any, auditTrail: r.auditTrail + 1 } : r
      ));
      addAuditLog(
        `资质审核-${actionLabel}`,
        `${item?.type === 'doctor' ? '医生' : item?.type === 'hospital' ? '医院' : item?.type === 'merchant' ? '商家' : '用户'}-${item?.name} ${id}`,
        actionLabel,
        `审核意见：${reviewOpinion}`
      );
      showToast(`审核${actionLabel}成功`, 'success');
      setProcessing(null);
      setReviewAction(null);
      setReviewOpinion('');
      setExpandedReviewDetail(null);
    }, 700);
  };

  const getReviewDeadline = (submitted: string) => {
    const submitDate = new Date(submitted.replace(/-/g, '/'));
    submitDate.setDate(submitDate.getDate() + 3);
    return submitDate.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getRemainingTime = (submitted: string) => {
    const submitDate = new Date(submitted.replace(/-/g, '/'));
    const deadline = new Date(submitDate);
    deadline.setDate(deadline.getDate() + 3);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    if (diff <= 0) return '已逾期';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}天${hours % 24}小时`;
    return `${hours}小时`;
  };

  const getApplicationType = (type: string) => {
    const map: Record<string, string> = {
      doctor: '医生入驻',
      hospital: '医院入驻',
      merchant: '商家入驻',
      user: '宠主升级'
    };
    return map[type] || type;
  };

  const qualificationCertificates = [
    { name: '执业兽医师资格证', number: 'VET-BJ-2024-00891', expiry: '2029-06-14' },
    { name: '动物诊疗许可证', number: 'DZ-BJ-2024-0123', expiry: '2027-12-31' },
    { name: '营业执照', number: '91110105MA01234567', expiry: '长期' },
    { name: 'GSP认证证书', number: 'GSP-BJ-2024-0045', expiry: '2028-03-15' },
  ];

  const auditTrailHistory = [
    { time: '2026-06-14 14:28', action: '提交申请', operator: '孙医生', status: '待审核' },
    { time: '2026-06-14 15:00', action: '材料初审', operator: '系统自动', status: '材料齐全' },
    { time: '2026-06-15 09:30', action: '人工审核', operator: '审核员-李', status: '待复核' },
  ];

  const getSignatureStatus = (doctorSigned: boolean, ownerAcknowledged: boolean) => {
    if (doctorSigned && ownerAcknowledged) return { label: '双签', icon: '✓✓', color: 'text-forest-600' };
    if (doctorSigned && !ownerAcknowledged) return { label: '仅医生签', icon: '✓', color: 'text-warm-600' };
    if (!doctorSigned && !ownerAcknowledged) return { label: '未签', icon: '✗', color: 'text-red-600' };
    return { label: '待宠主确认', icon: '✓', color: 'text-blue-600' };
  };

  const consultationTimeline = [
    { step: '发起', time: '10:30:15', operator: '张小明（宠主）', status: '已发起' },
    { step: '接诊', time: '10:31:22', operator: '王建国（医生）', status: '已接诊' },
    { step: '诊断', time: '10:38:45', operator: '王建国（医生）', status: '急性胃肠炎' },
    { step: '处方', time: '10:42:10', operator: '王建国（医生）', status: '已开具' },
    { step: '医生签名', time: '10:42:30', operator: '王建国（医生）', status: '已签名' },
    { step: '宠主确认', time: '10:43:05', operator: '张小明（宠主）', status: '已确认' },
  ];

  const doctorSignatureInfo = {
    signTime: '2026-06-16 10:42:30',
    licenseNumber: 'VET-BJ-2024-00891',
    doctorName: '王建国',
    dept: '内科',
    title: '主治医师',
    signatureHash: '0x8a9d...f2e1',
  };

  const ownerConfirmInfo = {
    confirmTime: '2026-06-16 10:43:05',
    ip: '114.247.xx.xx',
    device: 'iPhone 15 Pro / iOS 17.4',
    location: '北京市朝阳区',
  };

  const prescriptionFlowStatuses: { status: string; label: string; color: string; Icon: any }[] = [
    { status: 'pending_doctor', label: '待审核', color: 'from-warm-500 to-orange-500', Icon: Clock },
    { status: 'pending_owner', label: '已审核', color: 'from-blue-500 to-sky-500', Icon: UserCheck },
    { status: 'approved', label: '待发货', color: 'from-forest-500 to-emerald-500', Icon: Package },
    { status: 'merchant_review', label: '已发货', color: 'from-sky-500 to-cyan-500', Icon: Truck },
    { status: 'delivered', label: '已签收', color: 'from-purple-500 to-indigo-500', Icon: MapPin },
    { status: 'completed', label: '已完成', color: 'from-gray-500 to-slate-500', Icon: BadgeCheck },
  ];

  const getPrescriptionFlowStatus = (status: string) => {
    const map: Record<string, string> = {
      pending_doctor: 'pending_doctor',
      pending_owner: 'pending_owner',
      approved: 'approved',
      merchant_review: 'merchant_review',
      delivered: 'delivered',
      completed: 'completed',
    };
    return map[status] || status;
  };

  const getPrescriptionAmount = (id: string) => {
    const map: Record<string, number> = {
      'RX-2026-0616-001': 168.00,
      'RX-2026-0616-002': 320.00,
      'RX-2026-0615-008': 456.50,
      'RX-2026-0615-005': 89.00,
      'RX-2026-0614-012': 520.00,
    };
    return map[id] || 0;
  };

  const prescriptionFlowTimeline = [
    { step: '医生开具', time: '10:42', operator: '王建国（医生）', status: '已完成', completed: true },
    { step: '药师审核', time: '10:45', operator: '李药师', status: '已完成', completed: true },
    { step: '宠主确认', time: '10:48', operator: '张小明（宠主）', status: '已完成', completed: true },
    { step: '商城发货', time: '14:30', operator: '电商仓库', status: '已完成', completed: true },
    { step: '物流配送', time: '次日', operator: '顺丰快递', status: '进行中', completed: false },
    { step: '宠主签收', time: '-', operator: '-', status: '待签收', completed: false },
    { step: '用药提醒', time: '-', operator: '系统', status: '待发送', completed: false },
  ];

  const prescriptionSignatureInfo = {
    doctorSign: {
      time: '2026-06-16 10:42:30',
      name: '王建国',
      license: 'VET-BJ-2024-00891',
    },
    pharmacistSign: {
      time: '2026-06-16 10:45:12',
      name: '李药师',
      license: 'PHARM-BJ-2023-0456',
    },
    ownerConfirm: {
      time: '2026-06-16 10:48:05',
      name: '张小明',
      ip: '114.247.xx.xx',
    },
  };

  const lostPetStats: { status: string; label: string; color: string; Icon: any }[] = [
    { status: 'searching', label: '寻宠发布中', color: 'from-orange-500 to-amber-500', Icon: MapPin },
    { status: 'found', label: '已找到', color: 'from-forest-500 to-emerald-500', Icon: BadgeCheck },
    { status: 'followup', label: '待跟进', color: 'from-warm-500 to-orange-500', Icon: Clock },
    { status: 'adopt', label: '领养意向', color: 'from-purple-500 to-indigo-500', Icon: HeartHandshake },
  ];

  const lostPetDetail = {
    petInfo: {
      breed: '金毛犬',
      color: '金黄色',
      age: '3岁',
      gender: '公',
      weight: '28kg',
      features: '左耳有黑色斑点，项圈上有红色吊牌',
      lostLocation: '北京市朝阳区望京SOHO附近',
      lostTime: '2026-06-15 18:30',
      reward: '5000元',
    },
    volunteerAssign: {
      volunteer: '志愿者-张三',
      phone: '138****8888',
      patrolArea: '望京SOHO周边3公里',
      patrolTime: '每日18:00-21:00',
    },
    followupTimeline: [
      { time: '2026-06-15 18:45', action: '发布寻宠启事', operator: '李女士（宠主）', status: '已发布' },
      { time: '2026-06-15 19:00', action: '分配志愿者', operator: '系统', status: '张三' },
      { time: '2026-06-15 21:30', action: '第一次巡查', operator: '张三', status: '未发现' },
      { time: '2026-06-16 08:00', action: '第二次巡查', operator: '张三', status: '发现疑似线索' },
    ],
    result: {
      status: 'searching',
      feedback: '仍在寻找中，已在附近3个小区张贴寻宠启事',
    },
  };

  const handleLostPetFollowup = (postId: string) => {
    setExpandedLostPet(expandedLostPet === postId ? null : postId);
    if (expandedLostPet !== postId) {
      addAuditLog('社区监管-寻宠跟进', `寻宠-${postId}`, '查看', '管理员查看寻宠跟进明细');
    }
  };

  const handleReviewAntiCheat = (postId: string, action: 'approve' | 'reject') => {
    setProcessing(`anticheat-${action}-${postId}`);
    setTimeout(() => {
      setLocalCommunityPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, riskScore: action === 'approve' ? 0 : p.riskScore, status: (action === 'approve' ? 'published' : 'rejected') as any } : p
      ));
      addAuditLog(
        '社区监管-评价反作弊',
        `帖子-${postId}`,
        action === 'approve' ? '通过' : '驳回',
        `人工复核${action === 'approve' ? '通过' : '驳回'}，AI检测风险评分`
      );
      showToast(`反作弊复核${action === 'approve' ? '通过' : '驳回'}成功`, 'success');
      setProcessing(null);
    }, 700);
  };

  const hospitalServicePricing: Record<string, {
    serviceId: string;
    serviceName: string;
    guidePrice: number;
    hospitalPrice: number;
    deviationRate: number;
    status: 'approved' | 'pending' | 'warning';
  }[]> = {
    'H-2026-001': [
      { serviceId: 'S001', serviceName: '常规体检', guidePrice: 200, hospitalPrice: 220, deviationRate: 10.0, status: 'approved' },
      { serviceId: 'S002', serviceName: '疫苗接种（犬四联）', guidePrice: 120, hospitalPrice: 150, deviationRate: 25.0, status: 'warning' },
      { serviceId: 'S003', serviceName: '绝育手术（公犬）', guidePrice: 800, hospitalPrice: 850, deviationRate: 6.3, status: 'approved' },
      { serviceId: 'S004', serviceName: '血常规检查', guidePrice: 80, hospitalPrice: 95, deviationRate: 18.8, status: 'pending' },
      { serviceId: 'S005', serviceName: '生化全套', guidePrice: 350, hospitalPrice: 380, deviationRate: 8.6, status: 'approved' },
    ],
    'H-2026-003': [
      { serviceId: 'S001', serviceName: '常规体检', guidePrice: 200, hospitalPrice: 190, deviationRate: -5.0, status: 'approved' },
      { serviceId: 'S002', serviceName: '疫苗接种（猫三联）', guidePrice: 150, hospitalPrice: 160, deviationRate: 6.7, status: 'approved' },
      { serviceId: 'S003', serviceName: '绝育手术（母猫）', guidePrice: 1200, hospitalPrice: 1350, deviationRate: 12.5, status: 'pending' },
      { serviceId: 'S004', serviceName: 'B超检查', guidePrice: 300, hospitalPrice: 280, deviationRate: -6.7, status: 'approved' },
    ],
  };

  const handleServicePricingClick = (hospitalId: string) => {
    setExpandedServicePricing(expandedServicePricing === hospitalId ? null : hospitalId);
    if (expandedServicePricing !== hospitalId) {
      addAuditLog('医院监管-服务定价', `医院-${hospitalId}`, '查看', '管理员查看医院服务定价明细');
    }
  };

  const handlePriceAdjust = (hospitalId: string, serviceId: string) => {
    if (!adjustPrice.trim() || isNaN(Number(adjustPrice))) {
      showToast('请输入有效的价格', 'error');
      return;
    }
    setProcessing(`price-adjust-${hospitalId}-${serviceId}`);
    const newPrice = Number(adjustPrice);
    setTimeout(() => {
      addAuditLog(
        '医院监管-价格调整',
        `医院-${hospitalId} 服务-${serviceId}`,
        '调整成功',
        `价格调整为¥${newPrice.toFixed(2)}，原价格调整请求已处理`
      );
      showToast('价格调整成功', 'success');
      setProcessing(null);
      setPriceAdjustId(null);
      setAdjustPrice('');
    }, 700);
  };

  const handlePriceWarning = (hospitalId: string, serviceId: string) => {
    if (!priceWarningReason.trim()) {
      showToast('请填写警告原因', 'error');
      return;
    }
    setProcessing(`price-warning-${hospitalId}-${serviceId}`);
    setTimeout(() => {
      addAuditLog(
        '医院监管-限价警告',
        `医院-${hospitalId} 服务-${serviceId}`,
        '已警告',
        `警告原因：${priceWarningReason}`
      );
      showToast('限价警告已发送', 'success');
      setProcessing(null);
      setPriceAdjustId(null);
      setPriceWarningReason('');
    }, 700);
  };

  const getContentType = (type: string) => {
    const map: Record<string, string> = {
      community: '社区帖子',
      lost: '寻宠启事',
      adopt: '领养意向',
    };
    return map[type] || type;
  };

  const getFollowupStatus = (post: any) => {
    if (post.type === 'lost') {
      if (post.found) return { label: '已找到', color: 'bg-forest-100 text-forest-700' };
      return { label: '寻找中', color: 'bg-orange-100 text-orange-700' };
    }
    return { label: '-', color: 'bg-gray-100 text-gray-500' };
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={cn(
          'fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2',
          toast.type === 'success' ? 'bg-forest-600 text-white' : 'bg-red-600 text-white'
        )}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-200 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">{user?.nickname || '超级管理员'} 控制台</h1>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              四大业务台账 · 资质全状态审核 · 处方监管 · 审计留痕
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviewClick}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-forest-500 to-emerald-600 text-white text-xs font-bold hover:shadow-md transition-all inline-flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              平台预览·模拟宠主
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setShowLinkVerification(!showLinkVerification)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5",
                showLinkVerification
                  ? "bg-purple-500 text-white shadow-md"
                  : "bg-white border border-purple-200 text-purple-600 hover:bg-purple-50"
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              链路验证
            </button>
            <button
              onClick={() => setShowLinkInfo(!showLinkInfo)}
              className={cn(
                "px-2 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1",
                showLinkInfo
                  ? "bg-blue-500 text-white"
                  : "bg-white border border-blue-200 text-blue-600 hover:bg-blue-50"
              )}
            >
              {showLinkInfo ? <ChevronsDownUp className="w-3.5 h-3.5" /> : <ChevronsDown className="w-3.5 h-3.5" />}
              链路说明
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索编号/姓名/证号..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchKeyword.trim()) {
                  trackFilter('全局搜索', `关键词: ${searchKeyword}`, Math.floor(Math.random() * 50) + 1);
                }
              }}
              className="pl-9 pr-4 py-2 rounded-xl bg-white border border-gray-200 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>
        </div>
      </div>

      {showLinkInfo && (
        <div className="card p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              模拟链路承接说明
            </h3>
            <span className="text-[10px] text-gray-500">点击节点可直接跳转</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1">
            {linkNodes.map((node, index) => (
              <div key={node.id} className="flex items-center gap-1">
                <button
                  onClick={() => handleLinkNodeClick(node.path, node.label)}
                  className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100 hover:from-blue-100 hover:to-sky-100 hover:shadow-sm transition-all"
                >
                  <div className="w-5 h-5 rounded-full bg-forest-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <node.Icon className="w-3 h-3 text-blue-600" />
                  <span className="text-[10px] font-semibold text-blue-800">{node.label}</span>
                </button>
                {index < linkNodes.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showLinkVerification && (
        <div className="card p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-purple-500" />
              宠主链路验证
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-forest-600 font-semibold">
                已验证 {Object.values(linkVerification).filter(Boolean).length}/6
              </span>
              <button
                onClick={() => setLinkVerification({
                  petProfile: false,
                  consultation: false,
                  hospital: false,
                  mall: false,
                  community: false,
                  calendar: false,
                })}
                className="text-[10px] text-gray-500 hover:text-red-500 transition-colors"
              >
                重置
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {verificationPages.map((page) => (
              <button
                key={page.id}
                onClick={() => handleVerificationClick(page.id, page.path, page.label)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:shadow-sm",
                  linkVerification[page.id]
                    ? "bg-forest-50 border-forest-200"
                    : "bg-gray-50 border-gray-200 hover:bg-white"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  linkVerification[page.id]
                    ? "bg-forest-500"
                    : "bg-gray-300"
                )}>
                  <page.Icon className="w-4 h-4 text-white" />
                </div>
                <span className={cn(
                  "text-[11px] font-semibold",
                  linkVerification[page.id] ? "text-forest-700" : "text-gray-600"
                )}>
                  {page.label}
                </span>
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                  linkVerification[page.id]
                    ? "bg-forest-100 text-forest-700"
                    : "bg-gray-200 text-gray-500"
                )}>
                  {linkVerification[page.id] ? "已验证" : "待验证"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card p-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-orange-500" />
          实际操作记录
        </h3>
        <div className="space-y-2">
          {mockOperationRecords.map((record, index) => (
            <div key={index} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 hover:bg-orange-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                  <UserCheck className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-gray-800">{record.action}</div>
                  <div className="text-[10px] text-gray-500">{record.time} · {record.operator}</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-700">
                {record.result}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '注册宠主', value: '28,465', subValue: '绑定宠物 42,356 只', Icon: Users, color: 'from-forest-400 to-emerald-600', tab: 'owner' as TabId },
          { label: '认证医生', value: '386', subValue: '处方量 12,486 张', Icon: Stethoscope, color: 'from-blue-400 to-sky-600', tab: 'doctor' as TabId },
          { label: '入驻医院', value: '128', subValue: '服务项 1,856 个', Icon: Building2, color: 'from-orange-400 to-amber-600', tab: 'hospital' as TabId },
          { label: '合规商家', value: '96', subValue: '在架 SKU 4,256', Icon: Store, color: 'from-rose-400 to-pink-600', tab: 'merchant' as TabId },
          { label: '多宠绑定', value: '12,895', subValue: '授权账号 8,234 个', Icon: PawPrint, color: 'from-purple-400 to-indigo-600', tab: 'owner' as TabId },
          { label: '健康模板', value: '38,672', subValue: '覆盖率 91.3%', Icon: FileSpreadsheet, color: 'from-teal-400 to-cyan-600', tab: 'calendar' as TabId },
          { label: '病中跟踪', value: '1,286', subValue: '复诊预约 892 次', Icon: Activity, color: 'from-red-400 to-rose-600', tab: 'consultation' as TabId },
          { label: '预约服务', value: '24,568', subValue: '月完成率 94.6%', Icon: Calendar, color: 'from-warm-400 to-orange-600', tab: 'calendar' as TabId },
        ].map(({ label, value, subValue, Icon, color, tab }) => (
          <button
            key={label}
            onClick={() => setActiveTab(tab)}
            className="card !p-4 flex items-start gap-3 relative overflow-hidden group hover:shadow-md transition-all text-left cursor-pointer hover:-translate-y-0.5"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold text-gray-900 group-hover:text-purple-700 transition-colors">{value}</div>
              <div className="text-[10px] text-gray-500 font-medium">{label}</div>
              <div className="text-[9px] text-gray-400 mt-0.5">{subValue}</div>
            </div>
            <TrendingUp className="w-3 h-3 text-forest-500 absolute top-2 right-2" />
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 absolute bottom-2 right-2 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-500" />
          快速监管
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '医生排班监管', value: '12', subValue: '排班异常', Icon: Calendar, color: 'from-blue-500 to-cyan-600', tab: 'doctor' as TabId, filterKey: 'schedule' },
            { label: '商家资质监管', value: '8', subValue: '资质待审', Icon: FileText, color: 'from-orange-500 to-amber-600', tab: 'merchant' as TabId, filterKey: 'qualification' },
            { label: '医院定价监管', value: '5', subValue: '定价偏高', Icon: BarChart3, color: 'from-rose-500 to-pink-600', tab: 'hospital' as TabId, filterKey: 'pricing' },
            { label: '评价反作弊', value: '23', subValue: '异常评价', Icon: Bug, color: 'from-red-500 to-rose-600', tab: 'community' as TabId, filterKey: 'anticheat' },
          ].map(({ label, value, subValue, Icon, color, tab, filterKey }) => (
            <button
              key={label}
              onClick={() => {
                setActiveTab(tab);
                if (filterKey === 'schedule') setScheduleFilterExpanded(true);
                if (filterKey === 'qualification') setQualificationFilterExpanded(true);
                if (filterKey === 'pricing') setPricingFilterExpanded(true);
                if (filterKey === 'anticheat') {
                  setCommunitySubTab('anticheat');
                  setAnticheatFilterExpanded(true);
                }
                addAuditLog('快速监管入口', `${label}`, '跳转', `管理员从快速监管入口跳转到${label}`);
                showToast(`已跳转到${label}`);
              }}
              className="card !p-4 flex items-start gap-3 relative overflow-hidden group hover:shadow-lg transition-all text-left cursor-pointer hover:-translate-y-1 border-l-4 border-purple-500"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 shadow-md`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">{value}</div>
                <div className="text-[11px] text-gray-500 font-medium">{label}</div>
                <div className="text-[10px] text-red-500 font-semibold mt-0.5">⚠ {subValue}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 absolute bottom-2 right-2 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-sm font-semibold whitespace-nowrap transition-all',
              activeTab === tab.id
                ? 'bg-white text-purple-700 border border-gray-200 border-b-white -mb-px shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            <tab.Icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {verificationToast && (
        <div className="text-center py-1 animate-in fade-in slide-in-from-top-1">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-forest-50 text-forest-700 text-xs font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            {verificationToast.message}
          </span>
        </div>
      )}

      <div className="min-h-[400px]">
        {activeTab === 'owner' && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-gray-900">宠主业务台账</h2>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-forest-100 text-forest-700">正常 {ownerLedger.filter(u => u.status === 'active').length}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">禁用 {ownerLedger.filter(u => u.status === 'disabled').length}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">病中 {ownerLedger.filter(u => u.sickTracking > 0).length}</span>
                </div>
                <span className="text-xs text-gray-500">共 {ownerLedger.length} 条</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">ID</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">昵称/手机</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">多宠档案</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">健康模板</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">病中跟踪</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">问诊/处方</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">预约/提醒</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">风控</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">状态</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {ownerLedger.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-xs text-gray-500">{u.id}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-gray-900">{u.nickname}</div>
                        <div className="text-gray-500 font-mono text-[11px]">{u.phone}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">活跃 {u.lastActive}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <PawPrint className="w-3.5 h-3.5 text-forest-600" />
                          <span className="font-semibold text-gray-900">{u.pets}</span>
                        </div>
                        <div className="text-[9px] text-gray-500 mt-0.5">{u.petNames.join(' / ')}</div>
                        {u.bindAuthAccounts > 0 && (
                          <div className="text-[9px] text-purple-600 font-medium mt-0.5">🔗 绑定 {u.bindAuthAccounts} 账号</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                          <span className={cn('font-semibold', u.healthTemplateCoverage === 100 ? 'text-forest-600' : u.healthTemplateCoverage >= 50 ? 'text-warm-600' : 'text-red-600')}>
                            {u.healthTemplateCoverage}%
                          </span>
                        </div>
                        <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mt-1">
                          <div className={cn('h-full rounded-full', u.healthTemplateCoverage === 100 ? 'bg-forest-500' : u.healthTemplateCoverage >= 50 ? 'bg-warm-500' : 'bg-red-500')} style={{ width: `${u.healthTemplateCoverage}%` }} />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {u.sickTracking > 0 ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                            <Activity className="w-3 h-3" />
                            <span className="text-[10px] font-semibold">{u.sickTracking} 只病中</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-forest-50 text-forest-700">
                            <Heart className="w-3 h-3" />
                            <span className="text-[10px] font-semibold">全部健康</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="text-center">
                            <div className="font-semibold text-gray-900">{u.consultations}</div>
                            <div className="text-[9px] text-gray-500">问诊</div>
                          </div>
                          <div className="text-gray-200">|</div>
                          <div className="text-center">
                            <div className="font-semibold text-warm-600">{u.prescriptions}</div>
                            <div className="text-[9px] text-gray-500">处方</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">{u.appointments}</div>
                            <div className="text-[9px] text-gray-500">预约</div>
                          </div>
                          <div className="text-gray-200">|</div>
                          <div className="text-center">
                            <div className="font-semibold text-purple-600">{u.calendarReminders}</div>
                            <div className="text-[9px] text-gray-500">提醒</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setExpandedColumn(expandedColumn?.id === u.id && expandedColumn?.column === 'binding' ? null : {id: u.id, column: 'binding'})}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                        >
                          <ClipboardList className="w-3 h-3" />
                          <span className="text-[10px] font-semibold">{bindingAuditData[u.id]?.filter(b => b.status === 'active').length || 0} 只</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {diseaseRecordsData[u.id]?.length > 0 ? (
                          <button
                            onClick={() => setExpandedColumn(expandedColumn?.id === u.id && expandedColumn?.column === 'disease' ? null : {id: u.id, column: 'disease'})}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                          >
                            <Activity className="w-3 h-3" />
                            <span className="text-[10px] font-semibold">{diseaseRecordsData[u.id]?.filter(d => d.status === 'sick').length || 0} 只病中</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-forest-50 text-forest-700">
                            <Heart className="w-3 h-3" />
                            <span className="text-[10px] font-semibold">全部健康</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setExpandedColumn(expandedColumn?.id === u.id && expandedColumn?.column === 'reminder' ? null : {id: u.id, column: 'reminder'})}
                          className="inline-flex flex-col items-center gap-1 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-1">
                            <Bell className="w-3 h-3 text-blue-600" />
                            <span className="text-[10px] font-semibold text-gray-900">
                              {reminderRecordsData[u.id]?.filter(r => r.status === 'fulfilled').length || 0} / {reminderRecordsData[u.id]?.length || 0}
                            </span>
                          </div>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full">
                            <div 
                              className={cn(
                                'h-full rounded-full transition-all',
                                (reminderRecordsData[u.id]?.length || 0) > 0 
                                  ? ((reminderRecordsData[u.id]?.filter(r => r.status === 'fulfilled').length || 0) / (reminderRecordsData[u.id]?.length || 1)) >= 0.8 
                                    ? 'bg-forest-500' 
                                    : ((reminderRecordsData[u.id]?.filter(r => r.status === 'fulfilled').length || 0) / (reminderRecordsData[u.id]?.length || 1)) >= 0.5 
                                      ? 'bg-warm-500' 
                                      : 'bg-red-500'
                                  : 'bg-gray-300'
                              )} 
                              style={{ 
                                width: `${(reminderRecordsData[u.id]?.length || 0) > 0 
                                  ? Math.round(((reminderRecordsData[u.id]?.filter(r => r.status === 'fulfilled').length || 0) / (reminderRecordsData[u.id]?.length || 1)) * 100) 
                                  : 0}%` 
                              }}
                            />
                          </div>
                          <span className="text-[9px] text-gray-500">
                            {(reminderRecordsData[u.id]?.length || 0) > 0 
                              ? Math.round(((reminderRecordsData[u.id]?.filter(r => r.status === 'fulfilled').length || 0) / (reminderRecordsData[u.id]?.length || 1)) * 100) 
                              : 0}%
                          </span>
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {u.status === 'disabled' ? (
                          <button
                            onClick={() => setExpandedColumn(expandedColumn?.id === u.id && expandedColumn?.column === 'disable' ? null : {id: u.id, column: 'disable'})}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warm-50 text-warm-700 hover:bg-warm-100 transition-colors animate-pulse"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span className="text-[10px] font-semibold">待复核</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-forest-50 text-forest-700">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="text-[10px] font-semibold">正常</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full inline-block',
                          u.riskScore < 20 ? 'bg-forest-50 text-forest-700' : u.riskScore < 50 ? 'bg-warm-50 text-warm-700' : 'bg-red-50 text-red-700'
                        )}>
                          {u.riskScore < 20 ? '低危' : u.riskScore < 50 ? '中危' : '高危'} {u.riskScore}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[u.status]?.color)}>
                          {statusMap[u.status]?.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button onClick={() => trackNavigate('/pets')} className="p-1.5 rounded-lg hover:bg-forest-50 text-forest-600 transition-colors" title="多宠档案">
                            <PawPrint className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => trackNavigate('/pets')} className="p-1.5 rounded-lg hover:bg-teal-50 text-teal-600 transition-colors" title="健康模板">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => trackNavigate('/calendar')} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="预约记录">
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setSelectedOwnerAction({id: u.id, action: 'bindAudit'})} className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors" title="绑定审计">
                            <ClipboardList className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const newStatus = u.status === 'active' ? 'disabled' : 'active';
                              setOwnerLedger(prev => prev.map(o => o.id === u.id ? { ...o, status: newStatus } : o));
                              addAuditLog(
                                u.status === 'active' ? '账号禁用' : '账号启用',
                                `宠主-${u.nickname} ${u.id}`,
                                '生效',
                                u.status === 'active' ? '超级管理员手动禁用账号' : '超级管理员手动解除禁用'
                              );
                              trackAction(
                                u.status === 'active' ? '账号禁用' : '账号启用',
                                `宠主-${u.nickname} ${u.id}`,
                                '生效',
                                `状态从 ${u.status} → ${newStatus}`
                              );
                              showToast(u.status === 'active' ? '账号已禁用' : '账号已启用');
                              
                              if (newStatus === 'disabled') {
                                const now = new Date();
                                const pad = (n: number) => String(n).padStart(2, '0');
                                const disableTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
                                const deadlineDate = new Date();
                                deadlineDate.setDate(deadlineDate.getDate() + 7);
                                const reviewDeadline = `${deadlineDate.getFullYear()}-${pad(deadlineDate.getMonth() + 1)}-${pad(deadlineDate.getDate())}`;
                                
                                setDisableRecordsData(prev => ({
                                  ...prev,
                                  [u.id]: {
                                    id: `DIS${Date.now()}`,
                                    disableTime,
                                    disableReason: '超级管理员手动禁用账号',
                                    reviewDeadline,
                                    reviewer: user?.nickname || 'admin',
                                    reviewOpinion: '',
                                    reviewStatus: 'pending',
                                  }
                                }));
                                
                                addReviewRecord(u.id, 'disable', '账号禁用：超级管理员手动禁用账号', 'pending', '');
                                
                                setDisableReviewForm({
                                  disableReason: '超级管理员手动禁用账号',
                                  reviewDeadline,
                                  reviewer: user?.nickname || 'admin',
                                  reviewOpinion: '',
                                });
                                setDisableReviewPanelVisible(u.id);
                              } else {
                                addReviewRecord(u.id, 'disable', '账号启用：超级管理员手动解除禁用', 'approved', '账号状态正常，解除禁用');
                                
                                setDisableRecordsData(prev => {
                                  const newData = { ...prev };
                                  if (newData[u.id]) {
                                    newData[u.id] = {
                                      ...newData[u.id],
                                      reviewStatus: 'approved',
                                      reviewOpinion: '账号状态正常，解除禁用',
                                      reviewer: user?.nickname || 'admin',
                                    };
                                  }
                                  return newData;
                                });
                              }
                            }}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              u.status === 'active' ? 'hover:bg-red-50 text-red-500' : 'hover:bg-forest-50 text-forest-600'
                            )}
                            title={u.status === 'active' ? '禁用账号' : '启用账号'}
                          >
                            {u.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => setSelectedOwnerAction({id: u.id, action: 'detail'})} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors" title="完整详情">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setReviewPanelVisible(u.id)} 
                            className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors" 
                            title="查看复查记录"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {expandedColumn && (() => {
              const owner = ownerLedger.find(o => o.id === expandedColumn.id);
              if (!owner) return null;

              return (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-cream-50 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {expandedColumn.column === 'binding' && (
                        <>
                          <ClipboardList className="w-4 h-4 text-purple-600" />
                          <h3 className="font-bold text-sm text-gray-900">绑定审计详情 - {owner.nickname}</h3>
                        </>
                      )}
                      {expandedColumn.column === 'disease' && (
                        <>
                          <Activity className="w-4 h-4 text-red-600" />
                          <h3 className="font-bold text-sm text-gray-900">病程复查记录 - {owner.nickname}</h3>
                        </>
                      )}
                      {expandedColumn.column === 'reminder' && (
                        <>
                          <Bell className="w-4 h-4 text-blue-600" />
                          <h3 className="font-bold text-sm text-gray-900">提醒履约追踪 - {owner.nickname}</h3>
                        </>
                      )}
                      {expandedColumn.column === 'disable' && (
                        <>
                          <AlertTriangle className="w-4 h-4 text-warm-600" />
                          <h3 className="font-bold text-sm text-gray-900">禁用复核详情 - {owner.nickname}</h3>
                        </>
                      )}
                    </div>
                    <button onClick={() => setExpandedColumn(null)} className="p-1 rounded hover:bg-gray-200 transition-colors">
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>

                  {expandedColumn.column === 'binding' && (
                    <div className="space-y-3">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">宠物名称</th>
                              <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">绑定时间</th>
                              <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">绑定类型</th>
                              <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">状态</th>
                              <th className="text-center py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(bindingAuditData[owner.id] || []).map((record) => (
                              <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-2 px-3 font-semibold text-gray-900">{record.petName}</td>
                                <td className="py-2 px-3 text-[11px] text-gray-500">{record.bindTime}</td>
                                <td className="py-2 px-3">
                                  <span className={cn(
                                    'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                    record.bindType === 'owner' ? 'bg-forest-100 text-forest-700' :
                                    record.bindType === 'family' ? 'bg-blue-100 text-blue-700' :
                                    'bg-purple-100 text-purple-700'
                                  )}>
                                    {record.bindType === 'owner' ? '宠主本人' :
                                     record.bindType === 'family' ? '家庭成员' : '共同照护'}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  <span className={cn(
                                    'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                    record.status === 'active' ? 'bg-forest-100 text-forest-700' : 'bg-gray-100 text-gray-600'
                                  )}>
                                    {record.status === 'active' ? '已绑定' : '已解绑'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <button
                                    onClick={() => {
                                      addReviewRecord(owner.id, 'binding', `绑定审计复核：${record.petName} ${record.bindType}绑定`, 'approved', '绑定关系属实，复核通过');
                                      addAuditLog('绑定审计复核', `宠主-${owner.nickname} ${owner.id}`, '通过', `复核${record.petName}${record.bindType}绑定记录，无异常`);
                                      showToast('审计复核完成');
                                    }}
                                    className="px-2 py-1 rounded-lg bg-purple-500 text-white text-[10px] font-semibold hover:bg-purple-600 transition-colors"
                                  >
                                    确认复核
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {expandedColumn.column === 'disease' && (
                    <div className="space-y-3">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">宠物名称</th>
                              <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">诊断时间</th>
                              <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">诊断结论</th>
                              <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">处方记录</th>
                              <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">复诊预约</th>
                              <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">状态</th>
                              <th className="text-center py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(diseaseRecordsData[owner.id] || []).map((record) => (
                              <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-2 px-3 font-semibold text-gray-900">{record.petName}</td>
                                <td className="py-2 px-3 text-[11px] text-gray-500">{record.diagnosisTime}</td>
                                <td className="py-2 px-3 text-[11px] text-gray-700">{record.diagnosis}</td>
                                <td className="py-2 px-3 text-[11px] text-gray-600 max-w-xs truncate" title={record.prescription}>{record.prescription}</td>
                                <td className="py-2 px-3 text-[11px] text-gray-500">{record.followUpDate}</td>
                                <td className="py-2 px-3">
                                  <span className={cn(
                                    'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                    record.status === 'sick' ? 'bg-red-100 text-red-700' :
                                    record.status === 'recovering' ? 'bg-orange-100 text-orange-700' :
                                    'bg-forest-100 text-forest-700'
                                  )}>
                                    {record.status === 'sick' ? '病中' :
                                     record.status === 'recovering' ? '康复中' : '已康复'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => {
                                        setDiseaseRecordsData(prev => ({
                                          ...prev,
                                          [owner.id]: (prev[owner.id] || []).map(r =>
                                            r.id === record.id ? { ...r, status: 'healthy' as const, reviewStatus: 'approved' as const } : r
                                          )
                                        }));
                                        addReviewRecord(owner.id, 'disease', `病程复查：${record.petName}已康复`, 'approved', '宠物已完全康复，复查通过');
                                        addAuditLog('病程复查', `宠主-${owner.nickname} ${owner.id}`, '通过', `${record.petName}已康复，标记为健康状态`);
                                        showToast('已标记为已康复');
                                      }}
                                      className="px-2 py-1 rounded-lg bg-forest-500 text-white text-[10px] font-semibold hover:bg-forest-600 transition-colors"
                                    >
                                      标记已康复
                                    </button>
                                    <button
                                      onClick={() => {
                                        addReviewRecord(owner.id, 'disease', `病程复查：安排${record.petName}复诊`, 'pending', '已安排复诊，待确认');
                                        addAuditLog('病程复查', `宠主-${owner.nickname} ${owner.id}`, '待审', `安排${record.petName}复诊，预约日期${record.followUpDate}`);
                                        showToast('已安排复诊');
                                      }}
                                      className="px-2 py-1 rounded-lg bg-blue-500 text-white text-[10px] font-semibold hover:bg-blue-600 transition-colors"
                                    >
                                      安排复诊
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {expandedColumn.column === 'reminder' && (
                    <div className="space-y-3">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">提醒类型</th>
                              <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">标题</th>
                              <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">预定时间</th>
                              <th className="text-center py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">提醒次数</th>
                              <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">履约状态</th>
                              <th className="text-center py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(reminderRecordsData[owner.id] || []).map((record) => (
                              <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-2 px-3">
                                  <span className={cn(
                                    'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                    record.type === '疫苗接种' ? 'bg-purple-100 text-purple-700' :
                                    record.type === '体内驱虫' || record.type === '体外驱虫' ? 'bg-orange-100 text-orange-700' :
                                    record.type === '体检' ? 'bg-blue-100 text-blue-700' :
                                    record.type === '复诊' ? 'bg-forest-100 text-forest-700' :
                                    'bg-gray-100 text-gray-700'
                                  )}>
                                    {record.type}
                                  </span>
                                </td>
                                <td className="py-2 px-3 font-semibold text-gray-900">{record.title}</td>
                                <td className="py-2 px-3 text-[11px] text-gray-500">{record.scheduledTime}</td>
                                <td className="py-2 px-3 text-center text-[11px] text-gray-600">{record.reminderCount} 次</td>
                                <td className="py-2 px-3">
                                  <span className={cn(
                                    'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                    record.status === 'fulfilled' ? 'bg-forest-100 text-forest-700' :
                                    record.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                                    'bg-red-100 text-red-700'
                                  )}>
                                    {record.status === 'fulfilled' ? '已履约' :
                                     record.status === 'pending' ? '待履约' : '已逾期'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  {record.status === 'pending' && (
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => {
                                          setReminderRecordsData(prev => ({
                                            ...prev,
                                            [owner.id]: (prev[owner.id] || []).map(r =>
                                              r.id === record.id ? { ...r, status: 'fulfilled' as const } : r
                                            )
                                          }));
                                          addReviewRecord(owner.id, 'reminder', `提醒履约标记：${record.title}已完成`, 'approved', '已核实履约记录');
                                          addAuditLog('提醒履约', `宠主-${owner.nickname} ${owner.id}`, '通过', `${record.title}已标记为已履约`);
                                          showToast('已标记为已履约');
                                        }}
                                        className="px-2 py-1 rounded-lg bg-forest-500 text-white text-[10px] font-semibold hover:bg-forest-600 transition-colors"
                                      >
                                        已履约
                                      </button>
                                      <button
                                        onClick={() => {
                                          setReminderRecordsData(prev => ({
                                            ...prev,
                                            [owner.id]: (prev[owner.id] || []).map(r =>
                                              r.id === record.id ? { ...r, status: 'overdue' as const } : r
                                            )
                                          }));
                                          addReviewRecord(owner.id, 'reminder', `提醒履约标记：${record.title}已逾期`, 'approved', '已核实逾期记录');
                                          addAuditLog('提醒履约', `宠主-${owner.nickname} ${owner.id}`, '逾期', `${record.title}已标记为已逾期`);
                                          showToast('已标记为已逾期');
                                        }}
                                        className="px-2 py-1 rounded-lg bg-red-500 text-white text-[10px] font-semibold hover:bg-red-600 transition-colors"
                                      >
                                        已逾期
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {expandedColumn.column === 'disable' && (
                    <div className="space-y-3">
                      {disableRecordsData[owner.id] ? (
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-white border border-gray-100">
                            <div className="text-[10px] text-gray-500 mb-1">禁用时间</div>
                            <div className="text-sm font-bold text-gray-700">{disableRecordsData[owner.id].disableTime}</div>
                          </div>
                          <div className="p-3 rounded-lg bg-white border border-gray-100">
                            <div className="text-[10px] text-gray-500 mb-1">复核期限</div>
                            <div className="text-sm font-bold text-warm-600">{disableRecordsData[owner.id].reviewDeadline}</div>
                          </div>
                          <div className="p-3 rounded-lg bg-white border border-gray-100">
                            <div className="text-[10px] text-gray-500 mb-1">复核人</div>
                            <div className="text-sm font-bold text-gray-700">{disableRecordsData[owner.id].reviewer}</div>
                          </div>
                          <div className="p-3 rounded-lg bg-white border border-gray-100">
                            <div className="text-[10px] text-gray-500 mb-1">复核状态</div>
                            <span className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                              disableRecordsData[owner.id].reviewStatus === 'approved' ? 'bg-forest-100 text-forest-700' :
                              disableRecordsData[owner.id].reviewStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-warm-100 text-warm-700'
                            )}>
                              {disableRecordsData[owner.id].reviewStatus === 'approved' ? '已复核通过' :
                               disableRecordsData[owner.id].reviewStatus === 'rejected' ? '复核驳回' : '待复核'}
                            </span>
                          </div>
                          <div className="p-3 rounded-lg bg-white border border-gray-100 sm:col-span-2">
                            <div className="text-[10px] text-gray-500 mb-1">禁用原因</div>
                            <div className="text-sm text-gray-700">{disableRecordsData[owner.id].disableReason}</div>
                          </div>
                          {disableRecordsData[owner.id].reviewOpinion && (
                            <div className="p-3 rounded-lg bg-white border border-gray-100 sm:col-span-2">
                              <div className="text-[10px] text-gray-500 mb-1">复核意见</div>
                              <div className="text-sm text-gray-700">{disableRecordsData[owner.id].reviewOpinion}</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">暂无禁用记录</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="grid sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-forest-50 to-emerald-50 border border-forest-100 flex items-center justify-between cursor-pointer hover:shadow-sm transition-all" onClick={() => setActiveTab('owner')}>
                <div className="flex items-center gap-2">
                  <PawPrint className="w-4 h-4 text-forest-600" />
                  <span className="text-xs font-semibold text-forest-800">多宠绑定审计</span>
                </div>
                <button className="text-[11px] font-bold text-forest-700 hover:text-forest-800 hover:underline inline-flex items-center gap-0.5">
                  绑定明细 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 flex items-center justify-between cursor-pointer hover:shadow-sm transition-all" onClick={() => setActiveTab('calendar')}>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-semibold text-teal-800">健康模板覆盖</span>
                </div>
                <button className="text-[11px] font-bold text-teal-700 hover:text-teal-800 hover:underline inline-flex items-center gap-0.5">
                  模板分析 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 flex items-center justify-between cursor-pointer hover:shadow-sm transition-all" onClick={() => setActiveTab('consultation')}>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-semibold text-red-800">病中病程跟踪</span>
                </div>
                <button className="text-[11px] font-bold text-red-700 hover:text-red-800 hover:underline inline-flex items-center gap-0.5">
                  跟踪列表 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 flex items-center justify-between cursor-pointer hover:shadow-sm transition-all" onClick={() => setActiveTab('audit')}>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-800">风控异常监测</span>
                </div>
                <button className="text-[11px] font-bold text-purple-700 hover:text-purple-800 hover:underline inline-flex items-center gap-0.5">
                  风险名单 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
            {selectedOwnerAction && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-cream-50 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {selectedOwnerAction.action === 'bindAudit' && (
                      <>
                        <ClipboardList className="w-4 h-4 text-purple-600" />
                        <h3 className="font-bold text-sm text-gray-900">多宠绑定审计 - {ownerLedger.find(o => o.id === selectedOwnerAction.id)?.nickname}</h3>
                      </>
                    )}
                    {selectedOwnerAction.action === 'detail' && (
                      <>
                        <Eye className="w-4 h-4 text-gray-600" />
                        <h3 className="font-bold text-sm text-gray-900">宠主完整详情 - {ownerLedger.find(o => o.id === selectedOwnerAction.id)?.nickname}</h3>
                      </>
                    )}
                  </div>
                  <button onClick={() => setSelectedOwnerAction(null)} className="p-1 rounded hover:bg-gray-200 transition-colors">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {selectedOwnerAction.action === 'bindAudit' && (() => {
                  const owner = ownerLedger.find(o => o.id === selectedOwnerAction.id);
                  if (!owner) return null;
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-white border border-gray-100">
                          <div className="text-[10px] text-gray-500 mb-1">绑定宠物数</div>
                          <div className="text-lg font-bold text-forest-700">{owner.pets} 只</div>
                          <div className="text-[10px] text-gray-400 mt-1">{owner.petNames.join('、')}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white border border-gray-100">
                          <div className="text-[10px] text-gray-500 mb-1">授权账号数</div>
                          <div className="text-lg font-bold text-purple-700">{owner.bindAuthAccounts} 个</div>
                          <div className="text-[10px] text-gray-400 mt-1">家庭成员/共同照护</div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-gray-100">
                        <div className="text-xs font-semibold text-gray-700 mb-2">绑定历史记录</div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-600">2025-03-15 · 首次绑定</span>
                            <span className="text-forest-600 font-semibold">豆豆</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-600">2025-07-20 · 新增绑定</span>
                            <span className="text-forest-600 font-semibold">咪咪</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-600">2026-01-10 · 授权账号</span>
                            <span className="text-purple-600 font-semibold">妻子-138****0002</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setSelectedOwnerAction(null); addAuditLog('绑定审计复核', `宠主-${owner.nickname}`, '通过', '超级管理员复核绑定记录，无异常'); showToast('审计复核完成'); }} className="px-3 py-1.5 rounded-lg bg-purple-500 text-white text-[11px] font-semibold hover:bg-purple-600 transition-colors">
                          确认复核
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {selectedOwnerAction.action === 'detail' && (() => {
                  const owner = ownerLedger.find(o => o.id === selectedOwnerAction.id);
                  if (!owner) return null;
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-white border border-gray-100">
                          <div className="text-[10px] text-gray-500 mb-1">账号ID</div>
                          <div className="text-sm font-bold text-gray-700 font-mono">{owner.id}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white border border-gray-100">
                          <div className="text-[10px] text-gray-500 mb-1">手机号</div>
                          <div className="text-sm font-bold text-gray-700">{owner.phone}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white border border-gray-100">
                          <div className="text-[10px] text-gray-500 mb-1">最后活跃</div>
                          <div className="text-sm font-bold text-gray-700">{owner.lastActive}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-white border border-gray-100 text-center">
                          <div className="text-lg font-bold text-forest-600">{owner.pets}</div>
                          <div className="text-[10px] text-gray-500">宠物数</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white border border-gray-100 text-center">
                          <div className="text-lg font-bold text-purple-600">{owner.consultations}</div>
                          <div className="text-[10px] text-gray-500">问诊</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white border border-gray-100 text-center">
                          <div className="text-lg font-bold text-blue-600">{owner.prescriptions}</div>
                          <div className="text-[10px] text-gray-500">处方</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white border border-gray-100 text-center">
                          <div className="text-lg font-bold text-orange-600">{owner.appointments}</div>
                          <div className="text-[10px] text-gray-500">预约</div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-gray-100">
                        <div className="text-xs font-semibold text-gray-700 mb-2">健康数据概览</div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <div className="text-[10px] text-gray-500 mb-0.5">健康模板覆盖率</div>
                            <div className="text-sm font-bold text-teal-600">{owner.healthTemplateCoverage}%</div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                              <div className="h-full bg-teal-500 rounded-full" style={{width: `${owner.healthTemplateCoverage}%`}} />
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-500 mb-0.5">病中跟踪</div>
                            <div className="text-sm font-bold text-red-600">{owner.sickTracking} 只</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-500 mb-0.5">日历提醒数</div>
                            <div className="text-sm font-bold text-blue-600">{owner.calendarReminders} 条</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-gray-100">
                        <div className="text-xs font-semibold text-gray-700 mb-2">风险评分</div>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'text-2xl font-bold',
                            owner.riskScore < 20 ? 'text-forest-600' : owner.riskScore < 50 ? 'text-warm-600' : 'text-red-600'
                          )}>
                            {owner.riskScore}
                          </div>
                          <div className="flex-1">
                            <div className="w-full h-2 bg-gray-100 rounded-full">
                              <div className={cn(
                                'h-full rounded-full',
                                owner.riskScore < 20 ? 'bg-forest-500' : owner.riskScore < 50 ? 'bg-warm-500' : 'bg-red-500'
                              )} style={{width: `${owner.riskScore}%`}} />
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                              <span>低危</span><span>中危</span><span>高危</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {reviewPanelVisible && (() => {
              const owner = ownerLedger.find(o => o.id === reviewPanelVisible);
              if (!owner) return null;
              const records = reviewRecordsData[owner.id] || [];
              
              return (
                <div className="fixed inset-0 z-50 flex justify-end">
                  <div className="absolute inset-0 bg-black/30" onClick={() => setReviewPanelVisible(null)} />
                  <div className="relative w-full max-w-md bg-white shadow-xl animate-in slide-in-from-right">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-gray-900">可复查记录时间线</h3>
                        <span className="text-sm text-gray-500">— {owner.nickname}</span>
                      </div>
                      <button onClick={() => setReviewPanelVisible(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="p-4 max-h-[calc(100vh-80px)] overflow-y-auto">
                      {records.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <ClipboardList className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>暂无复查记录</p>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
                          <div className="space-y-6">
                            {records.map((record) => (
                              <div key={record.id} className="relative pl-8">
                                <div className={cn(
                                  'absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white',
                                  record.type === 'binding' ? 'bg-purple-500' :
                                  record.type === 'disease' ? 'bg-red-500' :
                                  record.type === 'reminder' ? 'bg-blue-500' :
                                  'bg-warm-500'
                                )}>
                                  {record.type === 'binding' && <PawPrint className="w-3 h-3 text-white" />}
                                  {record.type === 'disease' && <Activity className="w-3 h-3 text-white" />}
                                  {record.type === 'reminder' && <Bell className="w-3 h-3 text-white" />}
                                  {record.type === 'disable' && <Lock className="w-3 h-3 text-white" />}
                                </div>
                                
                                <div className="bg-gray-50 rounded-xl p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={cn(
                                      'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                      record.type === 'binding' ? 'bg-purple-100 text-purple-700' :
                                      record.type === 'disease' ? 'bg-red-100 text-red-700' :
                                      record.type === 'reminder' ? 'bg-blue-100 text-blue-700' :
                                      'bg-warm-100 text-warm-700'
                                    )}>
                                      {record.type === 'binding' ? '绑定审计' :
                                       record.type === 'disease' ? '病程复查' :
                                       record.type === 'reminder' ? '提醒履约' : '禁用复核'}
                                    </span>
                                    <span className={cn(
                                      'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                      record.reviewStatus === 'approved' ? 'bg-forest-100 text-forest-700' :
                                      record.reviewStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                                      'bg-warm-100 text-warm-700'
                                    )}>
                                      {record.reviewStatus === 'approved' ? '已复核' :
                                       record.reviewStatus === 'rejected' ? '已驳回' : '待复核'}
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium text-gray-900 mb-1">{record.content}</p>
                                  <div className="text-[11px] text-gray-500 space-y-0.5">
                                    <div>操作时间：{record.operationTime}</div>
                                    <div>操作人：{record.operator}</div>
                                    {record.reviewOpinion && (
                                      <div className="mt-2 p-2 bg-white rounded-lg border border-gray-100">
                                        <div className="text-[10px] text-gray-400 mb-0.5">复核意见</div>
                                        <div className="text-gray-700">{record.reviewOpinion}</div>
                                        {record.reviewer && (
                                          <div className="text-[10px] text-gray-400 mt-0.5">复核人：{record.reviewer} · {record.reviewTime}</div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {disableReviewPanelVisible && (() => {
              const owner = ownerLedger.find(o => o.id === disableReviewPanelVisible);
              if (!owner) return null;
              
              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/50" onClick={() => setDisableReviewPanelVisible(null)} />
                  <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-warm-600" />
                        <h3 className="font-bold text-gray-900 text-lg">禁用复核</h3>
                        <span className="text-sm text-gray-500">— {owner.nickname}</span>
                      </div>
                      <button onClick={() => setDisableReviewPanelVisible(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">禁用原因</label>
                        <textarea
                          value={disableReviewForm.disableReason}
                          onChange={(e) => setDisableReviewForm(prev => ({ ...prev, disableReason: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-warm-200 focus:border-warm-400 resize-none"
                          rows={3}
                          placeholder="请输入禁用原因..."
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">复核期限</label>
                          <input
                            type="date"
                            value={disableReviewForm.reviewDeadline}
                            onChange={(e) => setDisableReviewForm(prev => ({ ...prev, reviewDeadline: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-warm-200 focus:border-warm-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">复核人</label>
                          <input
                            type="text"
                            value={disableReviewForm.reviewer}
                            onChange={(e) => setDisableReviewForm(prev => ({ ...prev, reviewer: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-warm-200 focus:border-warm-400"
                            placeholder="复核人姓名"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">复核意见</label>
                        <textarea
                          value={disableReviewForm.reviewOpinion}
                          onChange={(e) => setDisableReviewForm(prev => ({ ...prev, reviewOpinion: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-warm-200 focus:border-warm-400 resize-none"
                          rows={3}
                          placeholder="请输入复核意见..."
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setDisableReviewPanelVisible(null)}
                          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => {
                            if (!disableReviewForm.disableReason.trim()) {
                              showToast('请填写禁用原因', 'error');
                              return;
                            }
                            if (!disableReviewForm.reviewOpinion.trim()) {
                              showToast('请填写复核意见', 'error');
                              return;
                            }
                            
                            const now = new Date();
                            const pad = (n: number) => String(n).padStart(2, '0');
                            const reviewTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
                            
                            setDisableRecordsData(prev => ({
                              ...prev,
                              [owner.id]: {
                                ...prev[owner.id]!,
                                disableReason: disableReviewForm.disableReason,
                                reviewDeadline: disableReviewForm.reviewDeadline,
                                reviewer: disableReviewForm.reviewer,
                                reviewOpinion: disableReviewForm.reviewOpinion,
                                reviewStatus: 'approved',
                                reviewTime,
                              }
                            }));
                            
                            setReviewRecordsData(prev => ({
                              ...prev,
                              [owner.id]: (prev[owner.id] || []).map(r =>
                                r.type === 'disable' && r.reviewStatus === 'pending'
                                  ? { ...r, reviewStatus: 'approved', reviewOpinion: disableReviewForm.reviewOpinion, reviewer: disableReviewForm.reviewer, reviewTime }
                                  : r
                              )
                            }));
                            
                            addAuditLog(
                              '禁用复核完成',
                              `宠主-${owner.nickname} ${owner.id}`,
                              '通过',
                              `复核意见：${disableReviewForm.reviewOpinion}，复核人：${disableReviewForm.reviewer}`
                            );
                            
                            showToast('禁用复核完成');
                            setDisableReviewPanelVisible(null);
                          }}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-warm-500 to-orange-500 text-white text-sm font-semibold hover:shadow-md transition-all inline-flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          确认复核
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'doctor' && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-gray-900">医生业务台账</h2>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {(['pending', 'approved', 'rejected', 're_review'] as const).map((s) => (
                    <span key={s} className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[s]?.color)}>
                      {statusMap[s]?.label} {doctorLedger.filter(d => d.licenseStatus === s).length}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setScheduleFilterExpanded(!scheduleFilterExpanded)}
                  className={cn(
                    'text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 transition-colors',
                    scheduleFilterExpanded ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <Filter className="w-3 h-3" />
                  排班异常 {doctorScheduleData ? Object.keys(doctorScheduleData).filter(id => {
                    const s = doctorScheduleData[id];
                    return s && (s.warnings.length > 0 || s.workDays > 6);
                  }).length : 0}
                </button>
                <span className="text-xs text-gray-500">共 {doctorLedger.length} 条</span>
              </div>
            </div>

            {scheduleFilterExpanded && (
              <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-yellow-800 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    排班异常筛选 - 共 {Object.keys(doctorScheduleData).filter(id => {
                      const s = doctorScheduleData[id];
                      return s && (s.warnings.length > 0 || s.workDays > 6);
                    }).length} 位医生排班异常
                  </span>
                  <button onClick={() => setScheduleFilterExpanded(false)} className="text-[10px] text-yellow-600 hover:text-yellow-800">
                    收起筛选
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] px-2 py-1 rounded-full bg-red-100 text-red-700">连续上班&gt;6天: 2人</span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-orange-100 text-orange-700">单日接诊&gt;20次: 1人</span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 text-gray-700">缺班: 0人</span>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">医生/科室</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">执业证号</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">资质状态</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">排班状态</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">今日问诊</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">处方/已签</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">平均时长</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">评分/差评</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">所属医院</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorLedger.map((d) => {
                    const scheduleInfo = doctorScheduleData[d.id];
                    const hasScheduleWarning = scheduleInfo && (scheduleInfo.warnings.length > 0 || scheduleInfo.workDays > 6);
                    const scheduleRegStatus = scheduleInfo 
                      ? (scheduleInfo.warnings.some(w => w.includes('单日接诊')) ? 'overload' : 
                         scheduleInfo.warnings.some(w => w.includes('连续上班')) ? 'overload' : 'normal')
                      : d.scheduleStatus === 'off_duty' ? 'rest' : 'normal';

                    return (
                    <tr key={d.id} className={cn(
                      'border-b border-gray-50 hover:bg-gray-50 transition-colors',
                      hasScheduleWarning && 'bg-yellow-50/60'
                    )}>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          {d.name}
                          {hasScheduleWarning && <span className="text-yellow-500">⚠</span>}
                        </div>
                        <div className="text-gray-500 text-[11px]">{d.dept} · {d.title}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">活跃 {d.lastActive}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500">{d.license}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[d.licenseStatus]?.color)}>
                          {statusMap[d.licenseStatus]?.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[scheduleRegStatus]?.color)}>
                          {statusMap[scheduleRegStatus]?.label || statusMap[d.scheduleStatus]?.label}
                        </span>
                        {scheduleInfo && scheduleInfo.warnings.length > 0 && (
                          <div className="text-[9px] text-orange-600 font-medium mt-0.5">
                            ⚠ {scheduleInfo.warnings[0].substring(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="font-semibold text-gray-900">{d.todayConsult}</div>
                        <div className="text-[9px] text-gray-500">累计 {d.consults}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="text-center">
                            <div className="font-semibold text-warm-600">{d.prescriptions}</div>
                            <div className="text-[9px] text-gray-500">处方</div>
                          </div>
                          <div className="text-gray-200">|</div>
                          <div className="text-center">
                            <div className="font-semibold text-forest-600">{d.signedPrescriptions}</div>
                            <div className="text-[9px] text-gray-500">已签</div>
                          </div>
                        </div>
                        {d.prescriptions > 0 && d.prescriptions !== d.signedPrescriptions && (
                          <div className="text-[9px] text-red-600 font-semibold mt-0.5">⚠ {d.prescriptions - d.signedPrescriptions} 张未签名</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="font-semibold text-gray-900">{d.avgConsultTime}</div>
                        <div className="text-[9px] text-gray-500">分钟/次</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-3.5 h-3.5 text-warm-500 fill-warm-500" />
                          <span className="font-semibold text-gray-900">{d.rating > 0 ? d.rating.toFixed(1) : '-'}</span>
                        </div>
                        <div className="text-[9px] text-gray-500">评价 {d.reviews}</div>
                        {d.negativeReviews > 0 && (
                          <div className="text-[9px] text-red-600 font-semibold">差评 {d.negativeReviews}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="text-[11px] text-gray-700 font-medium">{d.hospital}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => setSelectedDoctorAction(selectedDoctorAction?.id === d.id && selectedDoctorAction?.action === 'qualification' ? null : {id: d.id, action: 'qualification'})}
                            className={cn('p-1.5 rounded-lg transition-colors', selectedDoctorAction?.id === d.id && selectedDoctorAction?.action === 'qualification' ? 'bg-purple-100 text-purple-700' : 'hover:bg-purple-50 text-purple-600')}
                            title="资质审核"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedDoctorAction(selectedDoctorAction?.id === d.id && selectedDoctorAction?.action === 'schedule' ? null : {id: d.id, action: 'schedule'})}
                            className={cn('p-1.5 rounded-lg transition-colors', selectedDoctorAction?.id === d.id && selectedDoctorAction?.action === 'schedule' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-blue-600')}
                            title="排班管理"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedDoctorAction(selectedDoctorAction?.id === d.id && selectedDoctorAction?.action === 'signature' ? null : {id: d.id, action: 'signature'})}
                            className={cn('p-1.5 rounded-lg transition-colors', selectedDoctorAction?.id === d.id && selectedDoctorAction?.action === 'signature' ? 'bg-forest-100 text-forest-700' : 'hover:bg-forest-50 text-forest-600')}
                            title="签名审计"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedDoctorAction(selectedDoctorAction?.id === d.id && selectedDoctorAction?.action === 'review_risk' ? null : {id: d.id, action: 'review_risk'})}
                            className={cn('p-1.5 rounded-lg transition-colors', selectedDoctorAction?.id === d.id && selectedDoctorAction?.action === 'review_risk' ? 'bg-warm-100 text-warm-700' : 'hover:bg-warm-50 text-warm-600')}
                            title="评价风控"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {selectedDoctorAction && (() => {
              const d = doctorLedger.find(doc => doc.id === selectedDoctorAction.id);
              if (!d) return null;
              const signRate = d.prescriptions > 0 ? Math.round((d.signedPrescriptions / d.prescriptions) * 100) : 0;
              const negRate = d.reviews > 0 ? ((d.negativeReviews / d.reviews) * 100).toFixed(1) : '0.0';
              return (
                <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50/80 to-indigo-50/80 border border-purple-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedDoctorAction.action === 'qualification' && <ShieldCheck className="w-5 h-5 text-purple-600" />}
                      {selectedDoctorAction.action === 'schedule' && <Clock className="w-5 h-5 text-blue-600" />}
                      {selectedDoctorAction.action === 'signature' && <PenTool className="w-5 h-5 text-forest-600" />}
                      {selectedDoctorAction.action === 'review_risk' && <Star className="w-5 h-5 text-warm-600" />}
                      <span className="font-semibold text-purple-900">
                        {selectedDoctorAction.action === 'qualification' && '资质审核面板'}
                        {selectedDoctorAction.action === 'schedule' && '排班管理面板'}
                        {selectedDoctorAction.action === 'signature' && '签名审计面板'}
                        {selectedDoctorAction.action === 'review_risk' && '评价风控面板'}
                      </span>
                      <span className="text-sm text-gray-500">— {d.name} ({d.id})</span>
                    </div>
                    <button onClick={() => setSelectedDoctorAction(null)} className="p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {selectedDoctorAction.action === 'qualification' && (
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-white/80 border border-purple-100">
                          <p className="text-[10px] text-gray-500">当前资质状态</p>
                          <span className={cn('text-sm font-semibold px-2 py-0.5 rounded-full', statusMap[d.licenseStatus]?.color)}>{statusMap[d.licenseStatus]?.label}</span>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-purple-100">
                          <p className="text-[10px] text-gray-500">执业证号</p>
                          <p className="text-xs font-mono font-semibold text-gray-800">{d.license}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-purple-100">
                          <p className="text-[10px] text-gray-500">科室 / 职称</p>
                          <p className="text-xs font-semibold text-gray-800">{d.dept} · {d.title}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => handleAction('医生', d.id, '资质审核', '通过', `${d.name}资质审核通过，证号${d.license}`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-gradient-to-r from-forest-500 to-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:shadow-md transition-all">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          审核通过
                        </button>
                        <button onClick={() => handleAction('医生', d.id, '资质审核', '驳回', `${d.name}资质审核驳回，证号${d.license}`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-gray-200 transition-colors">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          驳回
                        </button>
                        <button onClick={() => handleAction('医生', d.id, '资质审核', '补充材料', `要求${d.name}补充资质材料`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-warm-50 text-warm-700 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-warm-100 transition-colors border border-warm-200">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                          要求补充材料
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedDoctorAction.action === 'schedule' && (() => {
                    const schedule = doctorScheduleData[d.id];
                    const hasWarnings = schedule && schedule.warnings.length > 0;
                    const isOverloaded = schedule && schedule.warnings.some(w => w.includes('单日接诊'));
                    const isContinuousWork = schedule && schedule.warnings.some(w => w.includes('连续上班'));

                    return (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-white/80 border border-blue-100">
                          <p className="text-[10px] text-gray-500">在岗天数</p>
                          <p className="text-lg font-bold text-blue-600">{schedule ? schedule.workDays : 5} <span className="text-[10px] text-gray-400 font-normal">天/周</span></p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-blue-100">
                          <p className="text-[10px] text-gray-500">累计接诊</p>
                          <p className="text-lg font-bold text-gray-900">{schedule ? schedule.consultationCount : d.consults} <span className="text-[10px] text-gray-400 font-normal">次</span></p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-blue-100">
                          <p className="text-[10px] text-gray-500">平均时长</p>
                          <p className="text-lg font-bold text-forest-600">{schedule ? schedule.avgConsultTime : d.avgConsultTime} <span className="text-[10px] text-gray-400 font-normal">分/次</span></p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-blue-100">
                          <p className="text-[10px] text-gray-500">异常预警</p>
                          <p className={cn('text-lg font-bold', hasWarnings ? 'text-red-600' : 'text-forest-600')}>
                            {hasWarnings ? schedule!.warnings.length : 0} <span className="text-[10px] text-gray-400 font-normal">条</span>
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white/80 border border-blue-100">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            本周排班日历
                          </p>
                          <div className="flex gap-2 text-[10px]">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-forest-400"></span>当班</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span>繁忙</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300"></span>休息</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                          {(schedule ? schedule.weeklySchedule : []).map((day, i) => {
                            const isToday = i === 1;
                            return (
                              <div key={i} className={cn(
                                'text-center p-2 rounded-xl border transition-all',
                                isToday ? 'ring-2 ring-blue-400 border-blue-300 bg-blue-50/50' : 'border-gray-100 bg-gray-50/50'
                              )}>
                                <div className="text-[10px] font-semibold text-gray-500">{day.weekday}</div>
                                <div className="text-[11px] font-bold text-gray-700 mt-0.5">{day.date}</div>
                                <div className="mt-2 space-y-1">
                                  <div className={cn(
                                    'text-[9px] font-semibold py-0.5 rounded',
                                    day.morning === 'on' ? 'bg-forest-100 text-forest-700' :
                                    day.morning === 'busy' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'
                                  )}>
                                    {day.morning === 'on' ? '上午' : day.morning === 'busy' ? '上午忙' : '-'}
                                  </div>
                                  <div className={cn(
                                    'text-[9px] font-semibold py-0.5 rounded',
                                    day.afternoon === 'on' ? 'bg-forest-100 text-forest-700' :
                                    day.afternoon === 'busy' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'
                                  )}>
                                    {day.afternoon === 'on' ? '下午' : day.afternoon === 'busy' ? '下午忙' : '-'}
                                  </div>
                                  <div className={cn(
                                    'text-[9px] font-semibold py-0.5 rounded',
                                    day.night === 'on' ? 'bg-indigo-100 text-indigo-700' :
                                    day.night === 'busy' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'
                                  )}>
                                    {day.night === 'on' ? '夜班' : day.night === 'busy' ? '夜班忙' : '-'}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {hasWarnings && (
                        <div className="p-3 rounded-xl bg-red-50/80 border border-red-200">
                          <p className="text-xs font-semibold text-red-800 flex items-center gap-1.5 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            异常预警
                          </p>
                          <div className="space-y-1.5">
                            {schedule!.warnings.map((warning, i) => (
                              <div key={i} className="flex items-start gap-2 text-[11px]">
                                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center shrink-0 mt-0.5">!</span>
                                <span className="text-red-700">{warning}</span>
                              </div>
                            ))}
                            {isContinuousWork && (
                              <div className="flex items-start gap-2 text-[11px]">
                                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center shrink-0 mt-0.5">!</span>
                                <span className="text-red-700">连续上班超过6天，违反劳动法规定，强制安排休息</span>
                              </div>
                            )}
                            {isOverloaded && (
                              <div className="flex items-start gap-2 text-[11px]">
                                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center shrink-0 mt-0.5">!</span>
                                <span className="text-red-700">单日接诊量超过20次，可能影响诊疗质量</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setScheduleAdjustVisible(d.id);
                          }}
                          disabled={actionProcessing}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:shadow-md transition-all"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          调整排班
                        </button>
                        <button
                          onClick={() => {
                            setScheduleWarningVisible(d.id);
                            setWarningMessage('');
                          }}
                          disabled={actionProcessing}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:shadow-md transition-all"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          发放警告
                        </button>
                        <button onClick={() => handleAction('医生', d.id, '排班管理', '确认', `${d.name}本周排班已确认`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-forest-50 text-forest-700 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-forest-100 transition-colors border border-forest-200">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          确认排班
                        </button>
                      </div>
                    </div>
                    );
                  })()}
                  {selectedDoctorAction.action === 'signature' && (
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-white/80 border border-forest-100">
                          <p className="text-[10px] text-gray-500">处方签名率</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn('text-lg font-bold', signRate === 100 ? 'text-forest-600' : signRate >= 80 ? 'text-warm-600' : 'text-red-600')}>{signRate}%</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full">
                              <div className={cn('h-full rounded-full', signRate === 100 ? 'bg-forest-500' : signRate >= 80 ? 'bg-warm-500' : 'bg-red-500')} style={{ width: `${signRate}%` }} />
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-forest-100">
                          <p className="text-[10px] text-gray-500">已签名 / 总处方</p>
                          <p className="text-lg font-bold text-gray-900">{d.signedPrescriptions} <span className="text-gray-400">/ {d.prescriptions}</span></p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-forest-100">
                          <p className="text-[10px] text-gray-500">未签名处方</p>
                          <p className={cn('text-lg font-bold', d.prescriptions - d.signedPrescriptions > 0 ? 'text-red-600' : 'text-forest-600')}>{d.prescriptions - d.signedPrescriptions} 张</p>
                        </div>
                      </div>
                      {d.prescriptions - d.signedPrescriptions > 0 && (
                        <div className="p-3 rounded-lg bg-red-50/80 border border-red-100">
                          <p className="text-[10px] text-red-600 font-semibold mb-1">未签名处方列表</p>
                          {Array.from({ length: Math.min(3, d.prescriptions - d.signedPrescriptions) }, (_, i) => (
                            <div key={i} className="flex items-center justify-between py-1 text-[11px]">
                              <span className="text-gray-700 font-mono">RX-{d.id}-UNSIGNED-{i + 1}</span>
                              <span className="text-red-600 font-semibold">未签名</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => handleAction('医生', d.id, '签名审计', '通过', `${d.name}签名审计确认`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-gradient-to-r from-forest-500 to-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:shadow-md transition-all">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          确认审计
                        </button>
                        {d.prescriptions - d.signedPrescriptions > 0 && (
                          <button onClick={() => handleAction('医生', d.id, '签名审计', '催签名', `催促${d.name}签名，共${d.prescriptions - d.signedPrescriptions}张未签`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-warm-50 text-warm-700 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-warm-100 transition-colors border border-warm-200">
                            {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                            催签名
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedDoctorAction.action === 'review_risk' && (
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-white/80 border border-warm-100">
                          <p className="text-[10px] text-gray-500">综合评分</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-warm-500 fill-warm-500" />
                            <span className="text-lg font-bold text-gray-900">{d.rating > 0 ? d.rating.toFixed(1) : '-'}</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-warm-100">
                          <p className="text-[10px] text-gray-500">差评率</p>
                          <span className={cn('text-lg font-bold', parseFloat(negRate) > 10 ? 'text-red-600' : parseFloat(negRate) > 5 ? 'text-warm-600' : 'text-forest-600')}>{negRate}%</span>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-warm-100">
                          <p className="text-[10px] text-gray-500">差评数 / 总评价</p>
                          <p className="text-lg font-bold text-gray-900">{d.negativeReviews} <span className="text-gray-400 text-sm">/ {d.reviews}</span></p>
                        </div>
                      </div>
                      {d.negativeReviews > 0 && (
                        <div className="p-3 rounded-lg bg-warm-50/80 border border-warm-100">
                          <p className="text-[10px] text-warm-600 font-semibold mb-1">差评列表（近30天）</p>
                          {Array.from({ length: Math.min(3, d.negativeReviews) }, (_, i) => (
                            <div key={i} className="flex items-center justify-between py-1 text-[11px]">
                              <span className="text-gray-700">差评 #{i + 1}：服务态度差/等待时间过长</span>
                              <button onClick={() => handleAction('医生', d.id, '评价风控', '申诉处理', `处理${d.name}差评申诉#${i + 1}`)} disabled={actionProcessing} className="text-purple-600 font-semibold hover:underline">申诉处理</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => handleAction('医生', d.id, '评价风控', '通过', `${d.name}评价风控审核通过`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-gradient-to-r from-forest-500 to-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:shadow-md transition-all">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          风控通过
                        </button>
                        <button onClick={() => handleAction('医生', d.id, '评价风控', '警告', `${d.name}评价风控警告，差评率${negRate}%`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-warm-50 text-warm-700 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-warm-100 transition-colors border border-warm-200">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          发出警告
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="grid sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-800">医生排班总览</span>
                </div>
                <button onClick={() => trackNavigate('/admin/doctor/schedules')} className="text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5">
                  排班表 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-forest-50 to-emerald-50 border border-forest-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-forest-600" />
                  <span className="text-xs font-semibold text-forest-800">电子签名审计</span>
                </div>
                <button onClick={() => trackNavigate('/admin/audit/signatures')} className="text-[11px] font-bold text-forest-700 hover:text-forest-800 hover:underline inline-flex items-center gap-0.5">
                  签名记录 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-warm-50 to-orange-50 border border-warm-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-warm-600" />
                  <span className="text-xs font-semibold text-warm-800">评价风控监测</span>
                </div>
                <button onClick={() => trackNavigate('/admin/risk/reviews')} className="text-[11px] font-bold text-warm-700 hover:text-warm-800 hover:underline inline-flex items-center gap-0.5">
                  差评处理 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-800">处方异常监测</span>
                </div>
                <button onClick={() => trackNavigate('/admin/risk/prescriptions')} className="text-[11px] font-bold text-purple-700 hover:text-purple-800 hover:underline inline-flex items-center gap-0.5">
                  异常清单 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hospital' && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-gray-900">医院业务台账</h2>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {(['pending', 'approved', 'rejected', 're_review'] as const).map((s) => (
                    <span key={s} className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[s]?.color)}>
                      {statusMap[s]?.label} {hospitalLedger.filter(h => h.licenseStatus === s).length}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setPricingFilterExpanded(!pricingFilterExpanded)}
                  className={cn(
                    'text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 transition-colors',
                    pricingFilterExpanded ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <BarChart3 className="w-3 h-3" />
                  定价异常 {Object.keys(hospitalPricingData).filter(id => {
                    const p = hospitalPricingData[id];
                    return p && (p.avgDeviation > 20 || p.overpriceCount > 0);
                  }).length}
                </button>
                <span className="text-xs text-gray-500">共 {hospitalLedger.length} 条</span>
              </div>
            </div>

            {pricingFilterExpanded && (
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-orange-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    定价异常筛选 - 共 {Object.keys(hospitalPricingData).filter(id => {
                      const p = hospitalPricingData[id];
                      return p && (p.avgDeviation > 20 || p.overpriceCount > 0);
                    }).length} 家医院定价异常
                  </span>
                  <button onClick={() => setPricingFilterExpanded(false)} className="text-[10px] text-orange-600 hover:text-orange-800">
                    收起筛选
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] px-2 py-1 rounded-full bg-red-100 text-red-700">价格偏高&gt;20%: {Object.keys(hospitalPricingData).filter(id => hospitalPricingData[id]?.avgDeviation > 20).length}家</span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-orange-100 text-orange-700">偏高项目: {Object.values(hospitalPricingData).reduce((sum, p) => sum + (p?.overpriceCount || 0), 0)}项</span>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">医院/地址</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">证号/POI</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">资质状态</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">医生/当班</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">服务定价</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">价格偏离度</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">今日预约</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">评分/差评</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">合规分</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitalLedger.map((h) => {
                    const isExpanded = expandedServicePricing === h.id;
                    const services = hospitalServicePricing[h.id] || [];
                    const pricingData = hospitalPricingData[h.id];
                    const hasPricingWarning = pricingData && (pricingData.avgDeviation > 20 || pricingData.overpriceCount > 0);
                    const highDeviation = pricingData && pricingData.avgDeviation > 20;
                    return (
                      <>
                        <tr key={h.id} className={cn(
                          'border-b border-gray-50 hover:bg-gray-50 transition-colors',
                          highDeviation && 'bg-orange-50/60 hover:bg-orange-50'
                        )}>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-gray-900">{h.name}</div>
                        <div className="text-gray-500 text-[11px] flex items-center gap-1">
                          <MapPinned className="w-3 h-3" />
                          {h.address}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">活跃 {h.lastActive}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-[11px] text-gray-500">{h.license}</div>
                        <div className="font-mono text-[9px] text-gray-400 mt-0.5">📍 {h.poi}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[h.licenseStatus]?.color)}>
                          {statusMap[h.licenseStatus]?.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="text-center">
                            <div className="font-semibold text-gray-900">{h.doctors}</div>
                            <div className="text-[9px] text-gray-500">总医生</div>
                          </div>
                          <div className="text-gray-200">|</div>
                          <div className="text-center">
                            <div className={cn('font-semibold', h.onDutyDoctors > 0 ? 'text-forest-600' : 'text-gray-400')}>{h.onDutyDoctors}</div>
                            <div className="text-[9px] text-gray-500">当班</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="font-semibold text-blue-600">{h.services} 项</div>
                        <div className="text-[9px] text-gray-500">{h.servicePriceRange}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {pricingData ? (
                          <>
                            <div className={cn(
                              'font-bold text-base',
                              pricingData.avgDeviation > 20 ? 'text-red-600' :
                              pricingData.avgDeviation > 10 ? 'text-orange-600' :
                              pricingData.avgDeviation > 0 ? 'text-yellow-600' : 'text-forest-600'
                            )}>
                              {pricingData.avgDeviation > 0 ? '+' : ''}{pricingData.avgDeviation.toFixed(1)}%
                            </div>
                            <div className="text-[9px] text-gray-500">
                              {pricingData.overpriceCount > 0 && (
                                <span className="text-red-600 font-semibold">{pricingData.overpriceCount}项偏高</span>
                              )}
                              {pricingData.overpriceCount === 0 && '正常'}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="font-bold text-base text-gray-400">-</div>
                            <div className="text-[9px] text-gray-400">暂无数据</div>
                          </>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="font-semibold text-purple-600">{h.todayAppointments}</div>
                        <div className="text-[9px] text-gray-500">容量 {h.appointmentCapacity}</div>
                        <div className="w-16 h-1 bg-gray-100 rounded-full mx-auto mt-1">
                          <div className="h-full rounded-full bg-purple-500" style={{ width: `${h.appointmentCapacity > 0 ? Math.min(100, (h.todayAppointments / h.appointmentCapacity) * 100) : 0}%` }} />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-3.5 h-3.5 text-warm-500 fill-warm-500" />
                          <span className="font-semibold text-gray-900">{h.rating > 0 ? h.rating.toFixed(1) : '-'}</span>
                        </div>
                        <div className="text-[9px] text-gray-500">评价 {h.reviews}</div>
                        {h.negativeReviews > 0 && (
                          <div className="text-[9px] text-red-600 font-semibold">差评 {h.negativeReviews}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className={cn(
                          'text-[11px] font-bold px-2 py-0.5 rounded-full inline-block',
                          h.complianceScore >= 90 ? 'bg-forest-50 text-forest-700' : h.complianceScore >= 60 ? 'bg-warm-50 text-warm-700' : h.complianceScore > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                        )}>
                          {h.complianceScore > 0 ? h.complianceScore : '-'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => handleServicePricingClick(h.id)}
                            className={cn('p-1.5 rounded-lg transition-colors', expandedServicePricing === h.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-blue-600')}
                            title="服务定价明细"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedHospitalAction(selectedHospitalAction?.id === h.id && selectedHospitalAction?.action === 'capacity' ? null : {id: h.id, action: 'capacity'})}
                            className={cn('p-1.5 rounded-lg transition-colors', selectedHospitalAction?.id === h.id && selectedHospitalAction?.action === 'capacity' ? 'bg-teal-100 text-teal-700' : 'hover:bg-teal-50 text-teal-600')}
                            title="排班容量"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedHospitalAction(selectedHospitalAction?.id === h.id && selectedHospitalAction?.action === 'compliance' ? null : {id: h.id, action: 'compliance'})}
                            className={cn('p-1.5 rounded-lg transition-colors', selectedHospitalAction?.id === h.id && selectedHospitalAction?.action === 'compliance' ? 'bg-forest-100 text-forest-700' : 'hover:bg-forest-50 text-forest-600')}
                            title="合规备案"
                          >
                            <BadgeCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedHospitalAction(selectedHospitalAction?.id === h.id && selectedHospitalAction?.action === 'review_risk' ? null : {id: h.id, action: 'review_risk'})}
                            className={cn('p-1.5 rounded-lg transition-colors', selectedHospitalAction?.id === h.id && selectedHospitalAction?.action === 'review_risk' ? 'bg-warm-100 text-warm-700' : 'hover:bg-warm-50 text-warm-600')}
                            title="评价风控"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && services.length > 0 && (
                      <tr>
                        <td colSpan={10} className="py-0">
                          <div className="bg-gradient-to-br from-blue-50/50 to-sky-50/50 border-t border-b border-blue-100 p-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  <span className="font-semibold text-sm text-gray-900">{h.name} - 服务定价明细</span>
                                  <span className="text-[10px] text-gray-500">共 {services.length} 项服务</span>
                                </div>
                              </div>

                              {pricingData && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  <div className="p-3 rounded-xl bg-white/70 border border-blue-100">
                                    <p className="text-[10px] text-gray-500">平均偏离度</p>
                                    <p className={cn(
                                      'text-lg font-bold',
                                      pricingData.avgDeviation > 20 ? 'text-red-600' :
                                      pricingData.avgDeviation > 10 ? 'text-orange-600' : 'text-forest-600'
                                    )}>
                                      {pricingData.avgDeviation > 0 ? '+' : ''}{pricingData.avgDeviation.toFixed(1)}%
                                    </p>
                                  </div>
                                  <div className="p-3 rounded-xl bg-white/70 border border-blue-100">
                                    <p className="text-[10px] text-gray-500">偏高项目</p>
                                    <p className={cn(
                                      'text-lg font-bold',
                                      pricingData.overpriceCount > 0 ? 'text-orange-600' : 'text-forest-600'
                                    )}>
                                      {pricingData.overpriceCount} <span className="text-[10px] text-gray-400 font-normal">项</span>
                                    </p>
                                  </div>
                                  <div className="p-3 rounded-xl bg-white/70 border border-blue-100">
                                    <p className="text-[10px] text-gray-500">最低定价</p>
                                    <p className="text-lg font-bold text-blue-600">¥{pricingData.minPrice?.toFixed(0) || 0}</p>
                                  </div>
                                  <div className="p-3 rounded-xl bg-white/70 border border-blue-100">
                                    <p className="text-[10px] text-gray-500">最高定价</p>
                                    <p className="text-lg font-bold text-purple-600">¥{pricingData.maxPrice?.toFixed(0) || 0}</p>
                                  </div>
                                </div>
                              )}

                              {pricingData && pricingData.priceDistribution && pricingData.priceDistribution.length > 0 && (
                                <div className="p-4 rounded-xl bg-white/70 border border-blue-100">
                                  <p className="text-xs font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
                                    <BarChart3 className="w-4 h-4 text-blue-500" />
                                    价格分布（按偏离度区间）
                                  </p>
                                  <div className="flex items-end justify-between gap-1 h-24">
                                    {pricingData.priceDistribution.map((item: any, idx: number) => {
                                      const maxCount = Math.max(...pricingData.priceDistribution.map((d: any) => d.count), 1);
                                      const heightPercent = (item.count / maxCount) * 100;
                                      const isHigh = item.range === '>20%';
                                      return (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                          <div className="text-[9px] font-semibold text-gray-600">{item.count}</div>
                                          <div className="w-full flex items-end justify-center" style={{ height: '60px' }}>
                                            <div
                                              className={cn(
                                                'w-full max-w-[30px] rounded-t-md transition-all',
                                                isHigh ? 'bg-gradient-to-t from-red-500 to-orange-400' : 'bg-gradient-to-t from-blue-400 to-sky-300'
                                              )}
                                              style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                                            />
                                          </div>
                                          <div className={cn(
                                            'text-[9px] font-medium',
                                            isHigh ? 'text-red-600' : 'text-gray-500'
                                          )}>
                                            {item.label}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-blue-100">
                                      <th className="text-left py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">服务项目</th>
                                      <th className="text-center py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">指导价</th>
                                      <th className="text-center py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">医院定价</th>
                                      <th className="text-center py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">价格偏离率</th>
                                      <th className="text-center py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">审核状态</th>
                                      <th className="text-center py-2 px-3 text-[10px] font-bold text-gray-400 uppercase">操作</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {services.map((s) => {
                                      const isAdjusting = priceAdjustId?.hospitalId === h.id && priceAdjustId?.serviceId === s.serviceId;
                                      return (
                                        <tr key={s.serviceId} className="border-b border-blue-50 hover:bg-white/50 transition-colors">
                                          <td className="py-2 px-3">
                                            <div className="text-[11px] font-semibold text-gray-800">{s.serviceName}</div>
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            <span className="text-[11px] text-gray-600 font-mono">¥{s.guidePrice.toFixed(2)}</span>
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            {isAdjusting ? (
                                              <input
                                                type="text"
                                                value={adjustPrice}
                                                onChange={(e) => setAdjustPrice(e.target.value)}
                                                placeholder="输入新价格"
                                                className="w-20 px-2 py-1 text-[11px] border border-blue-300 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                              />
                                            ) : (
                                              <span className={cn(
                                                'text-[11px] font-bold font-mono',
                                                s.deviationRate > 20 ? 'text-red-600' :
                                                s.deviationRate > 10 ? 'text-warm-600' : 'text-forest-600'
                                              )}>¥{s.hospitalPrice.toFixed(2)}</span>
                                            )}
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            <span className={cn(
                                              'text-[10px] font-bold px-2 py-0.5 rounded-full',
                                              s.deviationRate > 20 ? 'bg-red-100 text-red-700' :
                                              s.deviationRate > 10 ? 'bg-warm-100 text-warm-700' :
                                              s.deviationRate < -10 ? 'bg-blue-100 text-blue-700' : 'bg-forest-100 text-forest-700'
                                            )}>
                                              {s.deviationRate > 0 ? '+' : ''}{s.deviationRate.toFixed(1)}%
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            <span className={cn(
                                              'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                              s.status === 'approved' ? 'bg-forest-100 text-forest-700' :
                                              s.status === 'warning' ? 'bg-warm-100 text-warm-700' : 'bg-blue-100 text-blue-700'
                                            )}>
                                              {s.status === 'approved' ? '已通过' : s.status === 'warning' ? '限价警告' : '待审核'}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                              {isAdjusting ? (
                                                <>
                                                  <button
                                                    onClick={() => handlePriceAdjust(h.id, s.serviceId)}
                                                    className={cn(
                                                      'p-1.5 rounded-lg transition-colors',
                                                      processing === `price-adjust-${h.id}-${s.serviceId}` ? 'bg-forest-100 opacity-50' : 'hover:bg-forest-50 text-forest-600'
                                                    )}
                                                    title="确认调整"
                                                    disabled={processing === `price-adjust-${h.id}-${s.serviceId}`}
                                                  >
                                                    {processing === `price-adjust-${h.id}-${s.serviceId}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      setPriceAdjustId(null);
                                                      setAdjustPrice('');
                                                      setPriceWarningReason('');
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                                                    title="取消"
                                                  >
                                                    <X className="w-3.5 h-3.5" />
                                                  </button>
                                                </>
                                              ) : (
                                                <>
                                                  <button
                                                    onClick={() => {
                                                      setPriceAdjustId({ hospitalId: h.id, serviceId: s.serviceId });
                                                      setAdjustPrice(String(s.hospitalPrice));
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                                                    title="调整价格"
                                                  >
                                                    <Edit3 className="w-3.5 h-3.5" />
                                                  </button>
                                                  {s.status !== 'warning' && (
                                                    <button
                                                      onClick={() => {
                                                        setPriceAdjustId({ hospitalId: h.id, serviceId: s.serviceId });
                                                        setPriceWarningReason('价格偏离市场指导价过大，请调整');
                                                      }}
                                                      className={cn(
                                                        'p-1.5 rounded-lg transition-colors',
                                                        processing === `price-warning-${h.id}-${s.serviceId}` ? 'bg-warm-100 opacity-50' : 'hover:bg-warm-50 text-warm-600'
                                                      )}
                                                      title="限价警告"
                                                      disabled={processing === `price-warning-${h.id}-${s.serviceId}`}
                                                    >
                                                      {processing === `price-warning-${h.id}-${s.serviceId}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                                    </button>
                                                  )}
                                                </>
                                              )}
                                            </div>
                                            {isAdjusting && priceWarningReason && (
                                              <div className="mt-2">
                                                <input
                                                  type="text"
                                                  value={priceWarningReason}
                                                  onChange={(e) => setPriceWarningReason(e.target.value)}
                                                  placeholder="警告原因"
                                                  className="w-full px-2 py-1 text-[10px] border border-warm-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-warm-500"
                                                />
                                                <button
                                                  onClick={() => handlePriceWarning(h.id, s.serviceId)}
                                                  className={cn(
                                                    'mt-1 w-full px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors',
                                                    processing === `price-warning-${h.id}-${s.serviceId}` ? 'bg-warm-100 opacity-50' : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
                                                  )}
                                                  disabled={processing === `price-warning-${h.id}-${s.serviceId}`}
                                                >
                                                  {processing === `price-warning-${h.id}-${s.serviceId}` ? '发送中...' : '发送限价警告'}
                                                </button>
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>

                              <div className="p-3 rounded-lg bg-white/70 border border-blue-100">
                                <div className="flex items-center gap-2 mb-2">
                                  <Info className="w-4 h-4 text-blue-500" />
                                  <span className="text-[11px] font-semibold text-gray-700">定价规则说明</span>
                                </div>
                                <div className="grid sm:grid-cols-3 gap-3 text-[10px] text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-forest-500" />
                                    <span>偏离率 ±10% 以内：正常</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-warm-500" />
                                    <span>偏离率 10%-20%：关注</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    <span>偏离率 20% 以上：警告</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {selectedHospitalAction && (() => {
              const h = hospitalLedger.find(hos => hos.id === selectedHospitalAction.id);
              if (!h) return null;
              const negRate = h.reviews > 0 ? ((h.negativeReviews / h.reviews) * 100).toFixed(1) : '0.0';
              const capacityRate = h.appointmentCapacity > 0 ? Math.round((h.todayAppointments / h.appointmentCapacity) * 100) : 0;
              return (
                <div className="p-5 rounded-xl bg-gradient-to-br from-orange-50/80 to-amber-50/80 border border-orange-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedHospitalAction.action === 'pricing' && <FileText className="w-5 h-5 text-blue-600" />}
                      {selectedHospitalAction.action === 'capacity' && <Clock className="w-5 h-5 text-teal-600" />}
                      {selectedHospitalAction.action === 'compliance' && <BadgeCheck className="w-5 h-5 text-forest-600" />}
                      {selectedHospitalAction.action === 'review_risk' && <Star className="w-5 h-5 text-warm-600" />}
                      <span className="font-semibold text-orange-900">
                        {selectedHospitalAction.action === 'pricing' && '服务定价审核面板'}
                        {selectedHospitalAction.action === 'capacity' && '排班容量面板'}
                        {selectedHospitalAction.action === 'compliance' && '合规备案面板'}
                        {selectedHospitalAction.action === 'review_risk' && '评价风控面板'}
                      </span>
                      <span className="text-sm text-gray-500">— {h.name} ({h.id})</span>
                    </div>
                    <button onClick={() => setSelectedHospitalAction(null)} className="p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {selectedHospitalAction.action === 'pricing' && (
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-white/80 border border-blue-100">
                          <p className="text-[10px] text-gray-500">服务项目数</p>
                          <p className="text-lg font-bold text-gray-900">{h.services} <span className="text-[10px] text-gray-400 font-normal">项</span></p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-blue-100">
                          <p className="text-[10px] text-gray-500">价格区间</p>
                          <p className="text-lg font-bold text-gray-900">{h.servicePriceRange}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-blue-100">
                          <p className="text-[10px] text-gray-500">定价合理性</p>
                          <span className={cn('text-sm font-semibold px-2 py-0.5 rounded-full', h.servicePriceRange !== '-' ? 'bg-forest-100 text-forest-700' : 'bg-gray-100 text-gray-600')}>{h.servicePriceRange !== '-' ? '区间正常' : '暂无定价'}</span>
                        </div>
                      </div>
                      {h.services > 0 && (
                        <div className="p-3 rounded-lg bg-white/80 border border-blue-100">
                          <p className="text-[10px] text-blue-600 font-semibold mb-2">比价分析（同类医院均价对比）</p>
                          {Array.from({ length: Math.min(3, h.services) }, (_, i) => (
                            <div key={i} className="flex items-center justify-between py-1 text-[11px] border-b border-gray-50 last:border-0">
                              <span className="text-gray-700">服务项 #{i + 1}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-gray-500">本院: ¥{(100 + i * 80).toLocaleString()}</span>
                                <span className="text-forest-600">均价: ¥{(120 + i * 70).toLocaleString()}</span>
                                <span className={cn('font-semibold', (100 + i * 80) > (120 + i * 70) * 1.3 ? 'text-red-600' : 'text-forest-600')}>{(100 + i * 80) > (120 + i * 70) * 1.3 ? '偏高' : '合理'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => handleAction('医院', h.id, '定价审核', '通过', `${h.name}服务定价审核通过`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-gradient-to-r from-forest-500 to-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:shadow-md transition-all">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          定价合理
                        </button>
                        <button onClick={() => handleAction('医院', h.id, '定价审核', '驳回', `${h.name}服务定价审核驳回，需调整`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-gray-200 transition-colors">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          要求调价
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedHospitalAction.action === 'capacity' && (
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-white/80 border border-teal-100">
                          <p className="text-[10px] text-gray-500">医生总数</p>
                          <p className="text-lg font-bold text-gray-900">{h.doctors} <span className="text-[10px] text-gray-400 font-normal">人</span></p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-teal-100">
                          <p className="text-[10px] text-gray-500">当班医生</p>
                          <p className="text-lg font-bold text-forest-600">{h.onDutyDoctors} <span className="text-[10px] text-gray-400 font-normal">人</span></p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-teal-100">
                          <p className="text-[10px] text-gray-500">今日预约</p>
                          <p className="text-lg font-bold text-gray-900">{h.todayAppointments} <span className="text-[10px] text-gray-400 font-normal">/ {h.appointmentCapacity}</span></p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-teal-100">
                          <p className="text-[10px] text-gray-500">容量使用率</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn('text-lg font-bold', capacityRate > 90 ? 'text-red-600' : capacityRate > 60 ? 'text-warm-600' : 'text-forest-600')}>{capacityRate}%</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full">
                              <div className={cn('h-full rounded-full', capacityRate > 90 ? 'bg-red-500' : capacityRate > 60 ? 'bg-warm-500' : 'bg-forest-500')} style={{ width: `${capacityRate}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAction('医院', h.id, '排班容量', '通过', `${h.name}排班容量审核通过`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:shadow-md transition-all">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          确认容量
                        </button>
                        <button onClick={() => handleAction('医院', h.id, '排班容量', '扩容', `要求${h.name}扩大预约容量`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-warm-50 text-warm-700 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-warm-100 transition-colors border border-warm-200">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
                          要求扩容
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedHospitalAction.action === 'compliance' && (
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-white/80 border border-forest-100">
                          <p className="text-[10px] text-gray-500">资质状态</p>
                          <span className={cn('text-sm font-semibold px-2 py-0.5 rounded-full', statusMap[h.licenseStatus]?.color)}>{statusMap[h.licenseStatus]?.label}</span>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-forest-100">
                          <p className="text-[10px] text-gray-500">GSP 认证状态</p>
                          <span className={cn('text-sm font-semibold px-2 py-0.5 rounded-full', h.complianceScore >= 90 ? 'bg-forest-100 text-forest-700' : h.complianceScore >= 60 ? 'bg-warm-100 text-warm-700' : 'bg-red-100 text-red-700')}>
                            {h.complianceScore >= 90 ? 'GSP 已认证' : h.complianceScore > 0 ? 'GSP 待完善' : '未认证'}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-forest-100">
                          <p className="text-[10px] text-gray-500">年度复核</p>
                          <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{h.complianceScore > 0 ? '本年度已复核' : '待复核'}</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/80 border border-forest-100">
                        <p className="text-[10px] text-gray-500">合规评分</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn('text-2xl font-bold', h.complianceScore >= 90 ? 'text-forest-600' : h.complianceScore >= 60 ? 'text-warm-600' : 'text-red-600')}>{h.complianceScore > 0 ? h.complianceScore : '-'}</span>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full">
                            <div className={cn('h-full rounded-full', h.complianceScore >= 90 ? 'bg-forest-500' : h.complianceScore >= 60 ? 'bg-warm-500' : 'bg-red-500')} style={{ width: `${h.complianceScore}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAction('医院', h.id, '合规备案', '通过', `${h.name}合规备案审核通过`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-gradient-to-r from-forest-500 to-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:shadow-md transition-all">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          备案通过
                        </button>
                        <button onClick={() => handleAction('医院', h.id, '合规备案', '驳回', `${h.name}合规备案驳回`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-gray-200 transition-colors">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          驳回
                        </button>
                        <button onClick={() => handleAction('医院', h.id, '合规备案', '年度复核', `触发${h.name}年度复核`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-blue-100 transition-colors border border-blue-200">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                          触发年度复核
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedHospitalAction.action === 'review_risk' && (
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-white/80 border border-warm-100">
                          <p className="text-[10px] text-gray-500">综合评分</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-warm-500 fill-warm-500" />
                            <span className="text-lg font-bold text-gray-900">{h.rating > 0 ? h.rating.toFixed(1) : '-'}</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-warm-100">
                          <p className="text-[10px] text-gray-500">差评率</p>
                          <span className={cn('text-lg font-bold', parseFloat(negRate) > 10 ? 'text-red-600' : parseFloat(negRate) > 5 ? 'text-warm-600' : 'text-forest-600')}>{negRate}%</span>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-warm-100">
                          <p className="text-[10px] text-gray-500">差评数 / 总评价</p>
                          <p className="text-lg font-bold text-gray-900">{h.negativeReviews} <span className="text-gray-400 text-sm">/ {h.reviews}</span></p>
                        </div>
                      </div>
                      {h.negativeReviews > 0 && (
                        <div className="p-3 rounded-lg bg-warm-50/80 border border-warm-100">
                          <p className="text-[10px] text-warm-600 font-semibold mb-1">差评列表（近30天）</p>
                          {Array.from({ length: Math.min(3, Math.ceil(h.negativeReviews / 6)) }, (_, i) => (
                            <div key={i} className="flex items-center justify-between py-1 text-[11px]">
                              <span className="text-gray-700">差评 #{i + 1}：过度诊疗/收费不合理</span>
                              <button onClick={() => handleAction('医院', h.id, '评价风控', '申诉处理', `处理${h.name}差评申诉#${i + 1}`)} disabled={actionProcessing} className="text-purple-600 font-semibold hover:underline">申诉处理</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => handleAction('医院', h.id, '评价风控', '通过', `${h.name}评价风控审核通过`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-gradient-to-r from-forest-500 to-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:shadow-md transition-all">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          风控通过
                        </button>
                        <button onClick={() => handleAction('医院', h.id, '评价风控', '警告', `${h.name}评价风控警告，差评率${negRate}%`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-warm-50 text-warm-700 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-warm-100 transition-colors border border-warm-200">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          发出警告
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="grid sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-800">服务定价监控</span>
                </div>
                <button onClick={() => trackNavigate('/admin/hospital/services')} className="text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5">
                  定价明细 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPinned className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-semibold text-teal-800">POI 地理围栏</span>
                </div>
                <button onClick={() => trackNavigate('/admin/hospital/poi')} className="text-[11px] font-bold text-teal-700 hover:text-teal-800 hover:underline inline-flex items-center gap-0.5">
                  围栏设置 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-forest-50 to-emerald-50 border border-forest-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-forest-600" />
                  <span className="text-xs font-semibold text-forest-800">年度资质复核</span>
                </div>
                <button onClick={() => { setActiveTab('review'); }} className="text-[11px] font-bold text-forest-700 hover:text-forest-800 hover:underline inline-flex items-center gap-0.5">
                  复核队列 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-800">合规风险监测</span>
                </div>
                <button onClick={() => trackNavigate('/admin/risk/hospitals')} className="text-[11px] font-bold text-purple-700 hover:text-purple-800 hover:underline inline-flex items-center gap-0.5">
                  风险名单 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'merchant' && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-gray-900">商家业务台账</h2>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {(['pending', 'approved', 'rejected', 're_review'] as const).map((s) => (
                    <span key={s} className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[s]?.color)}>
                      {statusMap[s]?.label} {merchantLedger.filter(m => m.licenseStatus === s).length}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => setQualificationFilterExpanded(!qualificationFilterExpanded)}
                  className={cn(
                    'text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 transition-colors',
                    qualificationFilterExpanded ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <FileText className="w-3 h-3" />
                  资质异常 {Object.keys(merchantQualificationData).filter(id => {
                    const q = merchantQualificationData[id];
                    return q && (q.overallStatus === 'expired' || q.overallStatus === 'pending' || q.certificates.some(c => c.status === 'expired' || c.status === 'warning'));
                  }).length}
                </button>
                <span className="text-xs text-gray-500">共 {merchantLedger.length} 条</span>
              </div>
            </div>

            {qualificationFilterExpanded && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    资质异常筛选 - 共 {Object.keys(merchantQualificationData).filter(id => {
                      const q = merchantQualificationData[id];
                      return q && (q.overallStatus === 'expired' || q.overallStatus === 'pending' || q.certificates.some(c => c.status === 'expired' || c.status === 'warning'));
                    }).length} 家商家资质异常
                  </span>
                  <button onClick={() => setQualificationFilterExpanded(false)} className="text-[10px] text-red-600 hover:text-red-800">
                    收起筛选
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] px-2 py-1 rounded-full bg-red-100 text-red-700">已过期: {Object.keys(merchantQualificationData).filter(id => merchantQualificationData[id]?.certificates.some(c => c.status === 'expired')).length}家</span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">30天内到期: {Object.keys(merchantQualificationData).filter(id => merchantQualificationData[id]?.certificates.some(c => c.status === 'warning' && c.remainingDays > 0 && c.remainingDays <= 30)).length}家</span>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-blue-100 text-blue-700">审核中: {Object.keys(merchantQualificationData).filter(id => merchantQualificationData[id]?.overallStatus === 'under_review').length}家</span>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">商家/业态</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">证号/GSP</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">资质状态</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">SKU 在架/缺货</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">处方复核</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">订单/发货</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">GMV</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">评分/差评</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">合规分</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {merchantLedger.map((m) => {
                    const qualInfo = merchantQualificationData[m.id];
                    const hasQualIssue = qualInfo && (qualInfo.overallStatus === 'expired' || qualInfo.certificates.some(c => c.status === 'expired'));
                    const hasQualWarning = qualInfo && qualInfo.certificates.some(c => c.status === 'warning');
                    const qualStatus = qualInfo ? qualInfo.overallStatus : 
                      (m.licenseStatus === 'approved' ? 'registered' : 
                       m.licenseStatus === 'pending' ? 'pending' : 
                       m.licenseStatus === 're_review' ? 'under_review' : 'under_review');

                    return (
                    <tr key={m.id} className={cn(
                      'border-b border-gray-50 hover:bg-gray-50 transition-colors',
                      hasQualIssue && 'bg-red-50/60',
                      hasQualWarning && !hasQualIssue && 'bg-yellow-50/40'
                    )}>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          {m.name}
                          {hasQualIssue && <span className="text-red-500">🔴</span>}
                          {hasQualWarning && !hasQualIssue && <span className="text-yellow-500">🟡</span>}
                        </div>
                        <div className="text-[11px] text-gray-500">{m.businessType}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">活跃 {m.lastActive}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-[11px] text-gray-500">{m.license}</div>
                        {m.gspCertified ? (
                          <div className="text-[9px] text-forest-600 font-semibold mt-0.5">✓ GSP 认证</div>
                        ) : (
                          <div className="text-[9px] text-warm-600 font-semibold mt-0.5">⚠ 未获 GSP</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[qualStatus]?.color || statusMap[m.licenseStatus]?.color)}>
                          {statusMap[qualStatus]?.label || statusMap[m.licenseStatus]?.label}
                        </span>
                        {qualInfo && qualInfo.certificates.filter(c => c.status === 'expired').length > 0 && (
                          <div className="text-[9px] text-red-600 font-semibold mt-0.5">
                            ⚠ {qualInfo.certificates.filter(c => c.status === 'expired').length}项过期
                          </div>
                        )}
                        {qualInfo && qualInfo.certificates.filter(c => c.status === 'warning').length > 0 && !qualInfo.certificates.some(c => c.status === 'expired') && (
                          <div className="text-[9px] text-yellow-600 font-semibold mt-0.5">
                            ⚠ {qualInfo.certificates.filter(c => c.status === 'warning').length}项即将到期
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="text-center">
                            <div className="font-semibold text-forest-600">{m.skuOnShelf}</div>
                            <div className="text-[9px] text-gray-500">在架</div>
                          </div>
                          <div className="text-gray-200">/</div>
                          <div className="text-center">
                            <div className={cn('font-semibold', m.skuOutOfStock > 0 ? 'text-warm-600' : 'text-gray-400')}>{m.skuOutOfStock}</div>
                            <div className="text-[9px] text-gray-500">缺货</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="font-semibold text-warm-600">{m.prescriptionReviews}</div>
                        <div className="text-[9px] text-gray-500">处方药复核</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="text-center">
                            <div className="font-semibold text-gray-900">{m.orders}</div>
                            <div className="text-[9px] text-gray-500">总订单</div>
                          </div>
                          <div className="text-gray-200">|</div>
                          <div className="text-center">
                            <div className="font-semibold text-sky-600">{m.delivered}</div>
                            <div className="text-[9px] text-gray-500">已发货</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold">{m.gmv}</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-3.5 h-3.5 text-warm-500 fill-warm-500" />
                          <span className="font-semibold text-gray-900">{m.rating > 0 ? m.rating.toFixed(1) : '-'}</span>
                        </div>
                        <div className="text-[9px] text-gray-500">评价 {m.reviews}</div>
                        {m.negativeReviews > 0 && (
                          <div className="text-[9px] text-red-600 font-semibold">差评 {m.negativeReviews}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className={cn(
                          'text-[11px] font-bold px-2 py-0.5 rounded-full inline-block',
                          m.complianceScore >= 90 ? 'bg-forest-50 text-forest-700' : m.complianceScore >= 60 ? 'bg-warm-50 text-warm-700' : m.complianceScore > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                        )}>
                          {m.complianceScore > 0 ? m.complianceScore : '-'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => setSelectedMerchantAction(selectedMerchantAction?.id === m.id && selectedMerchantAction?.action === 'compliance' ? null : {id: m.id, action: 'compliance'})}
                            className={cn('p-1.5 rounded-lg transition-colors', selectedMerchantAction?.id === m.id && selectedMerchantAction?.action === 'compliance' ? 'bg-forest-100 text-forest-700' : 'hover:bg-forest-50 text-forest-600')}
                            title="合规备案"
                          >
                            <BadgeCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedMerchantAction(selectedMerchantAction?.id === m.id && selectedMerchantAction?.action === 'sku' ? null : {id: m.id, action: 'sku'})}
                            className={cn('p-1.5 rounded-lg transition-colors', selectedMerchantAction?.id === m.id && selectedMerchantAction?.action === 'sku' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-blue-600')}
                            title="SKU上架审核"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedMerchantAction(selectedMerchantAction?.id === m.id && selectedMerchantAction?.action === 'prescription' ? null : {id: m.id, action: 'prescription'})}
                            className={cn('p-1.5 rounded-lg transition-colors', selectedMerchantAction?.id === m.id && selectedMerchantAction?.action === 'prescription' ? 'bg-warm-100 text-warm-700' : 'hover:bg-warm-50 text-warm-600')}
                            title="处方复核"
                          >
                            <Pill className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedMerchantAction(selectedMerchantAction?.id === m.id && selectedMerchantAction?.action === 'review_risk' ? null : {id: m.id, action: 'review_risk'})}
                            className={cn('p-1.5 rounded-lg transition-colors', selectedMerchantAction?.id === m.id && selectedMerchantAction?.action === 'review_risk' ? 'bg-orange-100 text-orange-700' : 'hover:bg-orange-50 text-orange-600')}
                            title="评价风控"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {selectedMerchantAction && (() => {
              const m = merchantLedger.find(mer => mer.id === selectedMerchantAction.id);
              if (!m) return null;
              const negRate = m.reviews > 0 ? ((m.negativeReviews / m.reviews) * 100).toFixed(1) : '0.0';
              return (
                <div className="p-5 rounded-xl bg-gradient-to-br from-rose-50/80 to-pink-50/80 border border-rose-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedMerchantAction.action === 'compliance' && <BadgeCheck className="w-5 h-5 text-forest-600" />}
                      {selectedMerchantAction.action === 'sku' && <Layers className="w-5 h-5 text-blue-600" />}
                      {selectedMerchantAction.action === 'prescription' && <Pill className="w-5 h-5 text-warm-600" />}
                      {selectedMerchantAction.action === 'review_risk' && <Star className="w-5 h-5 text-orange-600" />}
                      <span className="font-semibold text-rose-900">
                        {selectedMerchantAction.action === 'compliance' && '合规备案面板'}
                        {selectedMerchantAction.action === 'sku' && 'SKU上架审核面板'}
                        {selectedMerchantAction.action === 'prescription' && '处方复核面板'}
                        {selectedMerchantAction.action === 'review_risk' && '评价风控面板'}
                      </span>
                      <span className="text-sm text-gray-500">— {m.name} ({m.id})</span>
                    </div>
                    <button onClick={() => setSelectedMerchantAction(null)} className="p-1 rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {selectedMerchantAction.action === 'compliance' && (() => {
                    const qualData = merchantQualificationData[m.id];
                    const expiredCount = qualData ? qualData.certificates.filter(c => c.status === 'expired').length : 0;
                    const warningCount = qualData ? qualData.certificates.filter(c => c.status === 'warning').length : 0;

                    return (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-white/80 border border-forest-100">
                          <p className="text-[10px] text-gray-500">资质状态</p>
                          <span className={cn('text-sm font-semibold px-2 py-0.5 rounded-full', 
                            qualData ? statusMap[qualData.overallStatus]?.color : statusMap[m.licenseStatus]?.color
                          )}>
                            {qualData ? statusMap[qualData.overallStatus]?.label : statusMap[m.licenseStatus]?.label}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-forest-100">
                          <p className="text-[10px] text-gray-500">资质证书</p>
                          <p className="text-lg font-bold text-gray-900">{qualData ? qualData.certificates.length : 3} <span className="text-[10px] text-gray-400 font-normal">项</span></p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-forest-100">
                          <p className="text-[10px] text-gray-500">即将到期</p>
                          <p className={cn('text-lg font-bold', warningCount > 0 ? 'text-yellow-600' : 'text-forest-600')}>
                            {warningCount} <span className="text-[10px] text-gray-400 font-normal">项</span>
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-forest-100">
                          <p className="text-[10px] text-gray-500">已过期</p>
                          <p className={cn('text-lg font-bold', expiredCount > 0 ? 'text-red-600' : 'text-forest-600')}>
                            {expiredCount} <span className="text-[10px] text-gray-400 font-normal">项</span>
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white/80 border border-forest-100">
                        <p className="text-xs font-semibold text-gray-800 flex items-center gap-1.5 mb-3">
                          <FileText className="w-4 h-4 text-forest-500" />
                          资质证书列表
                        </p>
                        <div className="space-y-2">
                          {(qualData ? qualData.certificates : []).map((cert) => (
                            <div key={cert.id} className={cn(
                              'p-3 rounded-xl border flex items-center justify-between transition-all',
                              cert.status === 'expired' ? 'bg-red-50 border-red-200' :
                              cert.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                              'bg-forest-50/50 border-forest-100'
                            )}>
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  'w-10 h-10 rounded-lg flex items-center justify-center',
                                  cert.status === 'expired' ? 'bg-red-100' :
                                  cert.status === 'warning' ? 'bg-yellow-100' : 'bg-forest-100'
                                )}>
                                  <BadgeCheck className={cn(
                                    'w-5 h-5',
                                    cert.status === 'expired' ? 'text-red-500' :
                                    cert.status === 'warning' ? 'text-yellow-500' : 'text-forest-500'
                                  )} />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">{cert.name}</div>
                                  <div className="text-[10px] text-gray-500 font-mono">证书编号：{cert.number}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[11px] text-gray-500">有效期至：{cert.expiryDate}</div>
                                <div className={cn(
                                  'text-[10px] font-semibold mt-0.5',
                                  cert.status === 'expired' ? 'text-red-600' :
                                  cert.status === 'warning' ? 'text-yellow-600' : 'text-forest-600'
                                )}>
                                  {cert.status === 'expired' ? '已过期' : 
                                   cert.status === 'warning' ? `剩余 ${cert.remainingDays} 天` : '正常有效'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {(expiredCount > 0 || warningCount > 0) && (
                        <div className="p-3 rounded-xl bg-red-50/80 border border-red-200">
                          <p className="text-xs font-semibold text-red-800 flex items-center gap-1.5 mb-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            到期预警
                          </p>
                          <div className="space-y-1">
                            {expiredCount > 0 && (
                              <div className="flex items-start gap-2 text-[11px]">
                                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center shrink-0 mt-0.5">!</span>
                                <span className="text-red-700">{expiredCount} 项资质已过期，请立即处理</span>
                              </div>
                            )}
                            {warningCount > 0 && (
                              <div className="flex items-start gap-2 text-[11px]">
                                <span className="w-4 h-4 rounded-full bg-yellow-500 text-white text-[9px] flex items-center justify-center shrink-0 mt-0.5">!</span>
                                <span className="text-yellow-700">{warningCount} 项资质将在30天内到期，请提前续期</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setQualificationReviewVisible(m.id);
                            setRectifyReason('');
                            setRectifyDeadline('');
                          }}
                          disabled={actionProcessing}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:shadow-md transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          触发复核
                        </button>
                        <button
                          onClick={() => {
                            setQualificationReviewVisible(m.id);
                            setRectifyReason('资质过期/即将到期，请限期整改');
                            setRectifyDeadline('');
                          }}
                          disabled={actionProcessing}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:shadow-md transition-all"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          限期整改
                        </button>
                        <button onClick={() => handleAction('商家', m.id, '合规备案', '通过', `${m.name}合规备案审核通过`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-forest-50 text-forest-700 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-forest-100 transition-colors border border-forest-200">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          备案通过
                        </button>
                      </div>
                    </div>
                    );
                  })()}
                  {selectedMerchantAction.action === 'sku' && (
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-white/80 border border-blue-100">
                          <p className="text-[10px] text-gray-500">总 SKU</p>
                          <p className="text-lg font-bold text-gray-900">{m.skuCount}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-blue-100">
                          <p className="text-[10px] text-gray-500">在架</p>
                          <p className="text-lg font-bold text-forest-600">{m.skuOnShelf}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-blue-100">
                          <p className="text-[10px] text-gray-500">缺货</p>
                          <p className={cn('text-lg font-bold', m.skuOutOfStock > 0 ? 'text-warm-600' : 'text-gray-400')}>{m.skuOutOfStock}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-blue-100">
                          <p className="text-[10px] text-gray-500">上架率</p>
                          <span className="text-lg font-bold text-blue-600">{m.skuCount > 0 ? Math.round((m.skuOnShelf / m.skuCount) * 100) : 0}%</span>
                        </div>
                      </div>
                      {m.skuCount > 0 && (
                        <div className="p-3 rounded-lg bg-white/80 border border-blue-100">
                          <p className="text-[10px] text-blue-600 font-semibold mb-2">待审核 SKU</p>
                          {Array.from({ length: Math.min(3, m.skuCount - m.skuOnShelf) }, (_, i) => (
                            <div key={i} className="flex items-center justify-between py-1 text-[11px] border-b border-gray-50 last:border-0">
                              <span className="text-gray-700 font-mono">SKU-{m.id}-{1000 + i}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-warm-600">待审核</span>
                                <button onClick={() => handleAction('商家', m.id, 'SKU审核', '通过', `${m.name} SKU-${m.id}-${1000 + i}上架审核通过`)} disabled={actionProcessing} className="text-forest-600 font-semibold hover:underline">通过</button>
                                <button onClick={() => handleAction('商家', m.id, 'SKU审核', '驳回', `${m.name} SKU-${m.id}-${1000 + i}上架审核驳回`)} disabled={actionProcessing} className="text-red-600 font-semibold hover:underline">驳回</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => handleAction('商家', m.id, 'SKU上架', '批量通过', `${m.name}全部待审核SKU批量通过`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:shadow-md transition-all">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          批量通过
                        </button>
                        <button onClick={() => handleAction('商家', m.id, 'SKU上架', '批量驳回', `${m.name}全部待审核SKU批量驳回`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-gray-200 transition-colors">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          批量驳回
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedMerchantAction.action === 'prescription' && (
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-white/80 border border-warm-100">
                          <p className="text-[10px] text-gray-500">处方复核总量</p>
                          <p className="text-lg font-bold text-gray-900">{m.prescriptionReviews} <span className="text-[10px] text-gray-400 font-normal">次</span></p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-warm-100">
                          <p className="text-[10px] text-gray-500">订单量 / 已发货</p>
                          <p className="text-lg font-bold text-gray-900">{m.orders} <span className="text-gray-400">/ {m.delivered}</span></p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-warm-100">
                          <p className="text-[10px] text-gray-500">GMV</p>
                          <p className="text-lg font-bold text-gray-900">{m.gmv}</p>
                        </div>
                      </div>
                      {m.prescriptionReviews > 0 && (
                        <div className="p-3 rounded-lg bg-white/80 border border-warm-100">
                          <p className="text-[10px] text-warm-600 font-semibold mb-2">待复核处方</p>
                          {Array.from({ length: Math.min(3, m.prescriptionReviews) }, (_, i) => (
                            <div key={i} className="flex items-center justify-between py-1 text-[11px] border-b border-gray-50 last:border-0">
                              <span className="text-gray-700 font-mono">RX-{m.id}-MER-{i + 1}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-warm-600">待复核</span>
                                <button onClick={() => handleAction('商家', m.id, '处方复核', '通过', `${m.name}处方RX-${m.id}-MER-${i + 1}复核通过`)} disabled={actionProcessing} className="text-forest-600 font-semibold hover:underline">复核通过</button>
                                <button onClick={() => handleAction('商家', m.id, '处方复核', '驳回', `${m.name}处方RX-${m.id}-MER-${i + 1}复核驳回`)} disabled={actionProcessing} className="text-red-600 font-semibold hover:underline">驳回</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => handleAction('商家', m.id, '处方复核', '批量通过', `${m.name}全部待复核处方批量通过`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-gradient-to-r from-warm-500 to-orange-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:shadow-md transition-all">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          批量复核通过
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedMerchantAction.action === 'review_risk' && (
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-white/80 border border-orange-100">
                          <p className="text-[10px] text-gray-500">综合评分</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-warm-500 fill-warm-500" />
                            <span className="text-lg font-bold text-gray-900">{m.rating > 0 ? m.rating.toFixed(1) : '-'}</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-orange-100">
                          <p className="text-[10px] text-gray-500">差评率</p>
                          <span className={cn('text-lg font-bold', parseFloat(negRate) > 10 ? 'text-red-600' : parseFloat(negRate) > 5 ? 'text-warm-600' : 'text-forest-600')}>{negRate}%</span>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-orange-100">
                          <p className="text-[10px] text-gray-500">差评数 / 总评价</p>
                          <p className="text-lg font-bold text-gray-900">{m.negativeReviews} <span className="text-gray-400 text-sm">/ {m.reviews}</span></p>
                        </div>
                      </div>
                      {m.negativeReviews > 0 && (
                        <div className="p-3 rounded-lg bg-warm-50/80 border border-warm-100">
                          <p className="text-[10px] text-warm-600 font-semibold mb-1">差评列表（近30天）</p>
                          {Array.from({ length: Math.min(3, Math.ceil(m.negativeReviews / 10)) }, (_, i) => (
                            <div key={i} className="flex items-center justify-between py-1 text-[11px]">
                              <span className="text-gray-700">差评 #{i + 1}：商品质量/物流慢</span>
                              <button onClick={() => handleAction('商家', m.id, '评价风控', '申诉处理', `处理${m.name}差评申诉#${i + 1}`)} disabled={actionProcessing} className="text-purple-600 font-semibold hover:underline">申诉处理</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => handleAction('商家', m.id, '评价风控', '通过', `${m.name}评价风控审核通过`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-gradient-to-r from-forest-500 to-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:shadow-md transition-all">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          风控通过
                        </button>
                        <button onClick={() => handleAction('商家', m.id, '评价风控', '警告', `${m.name}评价风控警告，差评率${negRate}%`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-warm-50 text-warm-700 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-warm-100 transition-colors border border-warm-200">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          发出警告
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="grid sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-semibold text-rose-800">SKU 合规备案</span>
                </div>
                <button onClick={() => trackNavigate('/admin/merchant/compliance')} className="text-[11px] font-bold text-rose-700 hover:text-rose-800 hover:underline inline-flex items-center gap-0.5">
                  备案明细 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-warm-50 to-orange-50 border border-warm-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-warm-600" />
                  <span className="text-xs font-semibold text-warm-800">处方复核监管</span>
                </div>
                <button onClick={() => trackNavigate('/admin/merchant/prescriptions')} className="text-[11px] font-bold text-warm-700 hover:text-warm-800 hover:underline inline-flex items-center gap-0.5">
                  复核记录 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-800">年度资质复核</span>
                </div>
                <button onClick={() => { setActiveTab('review'); }} className="text-[11px] font-bold text-purple-700 hover:text-purple-800 hover:underline inline-flex items-center gap-0.5">
                  复核队列 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-semibold text-red-800">GSP 合规监测</span>
                </div>
                <button onClick={() => trackNavigate('/admin/risk/merchants')} className="text-[11px] font-bold text-red-700 hover:text-red-800 hover:underline inline-flex items-center gap-0.5">
                  风险名单 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: '待审核', status: 'pending', Icon: Clock, color: 'from-warm-400 to-orange-500', count: localReviewItems.filter(r => r.status === 'pending').length },
                { label: '已通过', status: 'approved', Icon: CheckCircle2, color: 'from-forest-400 to-emerald-500', count: localReviewItems.filter(r => r.status === 'approved').length },
                { label: '已驳回', status: 'rejected', Icon: XCircle, color: 'from-red-400 to-rose-500', count: localReviewItems.filter(r => r.status === 'rejected').length },
                { label: '待复核', status: 're_review', Icon: RotateCcw, color: 'from-purple-400 to-indigo-500', count: localReviewItems.filter(r => r.status === 're_review').length },
              ].map(({ label, status, Icon, color, count }) => (
                <div key={status} className="card !p-4 flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-[11px] text-gray-500 font-medium">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">申请方</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">申请类型</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">提交时间</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">审核时限</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">剩余时间</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">状态</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">材料</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {localReviewItems.map((item) => {
                    const cfg = reviewTypeConfig[item.type];
                    const isExpanded = expandedReviewDetail === item.id;
                    const remaining = getRemainingTime(item.submitted);
                    const isOverdue = remaining === '已逾期';
                    return (
                      <>
                        <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cfg.color} flex items-center justify-center shrink-0`}>
                                <cfg.Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-xs">{item.name}</div>
                                <div className="text-[10px] font-mono text-gray-400">{item.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-br ${cfg.color}`}>
                              {getApplicationType(item.type)}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-gray-600">{item.submitted}</td>
                          <td className="py-2.5 px-3 text-[11px] text-gray-600">{getReviewDeadline(item.submitted)}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={cn(
                              'text-[11px] font-bold',
                              isOverdue ? 'text-red-600' : remaining.includes('天') ? 'text-warm-600' : 'text-forest-600'
                            )}>
                              {remaining}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[item.status]?.color)}>
                              {statusMap[item.status]?.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-[11px] text-gray-600">{item.materials} 份</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setExpandedReviewDetail(isExpanded ? null : item.id)}
                                className={cn(
                                  'p-1.5 rounded-lg transition-colors text-[10px] font-semibold inline-flex items-center gap-1',
                                  isExpanded ? 'bg-purple-100 text-purple-700' : 'hover:bg-purple-50 text-purple-600'
                                )}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                {isExpanded ? '收起' : '资质明细'}
                              </button>
                              {item.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => { setReviewAction({id: item.id, type: 'approve'}); setExpandedReviewDetail(item.id); }}
                                    className="p-1.5 rounded-lg hover:bg-forest-50 text-forest-600 transition-colors"
                                    title="审核通过"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => { setReviewAction({id: item.id, type: 'reject'}); setExpandedReviewDetail(item.id); }}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                                    title="审核驳回"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => { setReviewAction({id: item.id, type: 'supplement'}); setExpandedReviewDetail(item.id); }}
                                    className="p-1.5 rounded-lg hover:bg-warm-50 text-warm-600 transition-colors"
                                    title="补充材料"
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="py-0">
                              <div className="bg-gradient-to-br from-purple-50/50 to-indigo-50/50 border-t border-b border-purple-100 p-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <BadgeCheck className="w-4 h-4 text-purple-600" />
                                      <span className="font-semibold text-sm text-gray-900">资质证书列表</span>
                                    </div>
                                    <div className="space-y-2">
                                      {qualificationCertificates.map((cert, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-100">
                                          <div>
                                            <div className="text-[11px] font-semibold text-gray-800">{cert.name}</div>
                                            <div className="text-[10px] font-mono text-gray-500">{cert.number}</div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-[10px] text-gray-500">有效期至</div>
                                            <div className={cn('text-[11px] font-semibold', cert.expiry === '长期' ? 'text-forest-600' : new Date(cert.expiry) < new Date() ? 'text-red-600' : 'text-gray-700')}>
                                              {cert.expiry}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-purple-600" />
                                      <span className="font-semibold text-sm text-gray-900">历史审核记录</span>
                                    </div>
                                    <div className="relative pl-4">
                                      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-purple-200" />
                                      {auditTrailHistory.map((record, i) => (
                                        <div key={i} className="relative pb-3 last:pb-0">
                                          <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-purple-500 border-2 border-white" />
                                          <div className="pl-3">
                                            <div className="text-[11px] font-semibold text-gray-800">{record.action}</div>
                                            <div className="text-[10px] text-gray-500">
                                              {record.time} · {record.operator} · <span className="text-purple-600">{record.status}</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    <div className="p-3 rounded-lg bg-white border border-gray-100">
                                      <div className="text-[10px] text-gray-500 mb-1">下次复核时间</div>
                                      <div className="text-sm font-bold text-purple-700">2027-06-14</div>
                                    </div>
                                  </div>
                                </div>

                                {reviewAction?.id === item.id && (
                                  <div className="mt-4 p-4 rounded-xl bg-white border border-purple-200 space-y-3">
                                    <div className="flex items-center gap-2">
                                      {reviewAction.type === 'approve' && <CheckCircle2 className="w-5 h-5 text-forest-600" />}
                                      {reviewAction.type === 'reject' && <XCircle className="w-5 h-5 text-red-600" />}
                                      {reviewAction.type === 'supplement' && <AlertTriangle className="w-5 h-5 text-warm-600" />}
                                      <span className="font-semibold text-gray-900">
                                        {reviewAction.type === 'approve' ? '审核通过' : reviewAction.type === 'reject' ? '审核驳回' : '要求补充材料'}
                                      </span>
                                    </div>
                                    <div>
                                      <label className="text-[11px] font-semibold text-gray-700 block mb-1.5">审核意见 <span className="text-red-500">*</span></label>
                                      <textarea
                                        value={reviewOpinion}
                                        onChange={(e) => setReviewOpinion(e.target.value)}
                                        placeholder={
                                          reviewAction.type === 'approve' ? '请输入通过理由...' :
                                          reviewAction.type === 'reject' ? '请输入驳回原因...' :
                                          '请说明需要补充的材料...'
                                        }
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
                                        rows={3}
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => { setReviewAction(null); setReviewOpinion(''); }}
                                        className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors"
                                      >
                                        取消
                                      </button>
                                      <button
                                        onClick={() => handleReviewAction(item.id, reviewAction.type)}
                                        disabled={!!processing || !reviewOpinion.trim()}
                                        className={cn(
                                          'px-4 py-2 rounded-lg text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 transition-all',
                                          reviewAction.type === 'approve' ? 'bg-gradient-to-r from-forest-500 to-emerald-500 hover:shadow-md' :
                                          reviewAction.type === 'reject' ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:shadow-md' :
                                          'bg-gradient-to-r from-warm-500 to-orange-500 hover:shadow-md'
                                        )}
                                      >
                                        {processing === `review-${reviewAction.type}-${item.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                        确认{reviewAction.type === 'approve' ? '通过' : reviewAction.type === 'reject' ? '驳回' : '提交'}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 space-y-3 border-purple-100">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-900 text-sm">审核闭环说明</span>
              </div>
              <div className="grid sm:grid-cols-4 gap-3 text-[11px]">
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-warm-600 font-bold mb-1">待审核</p>
                  <p className="text-gray-600">材料提交 → 人工审核 → 通过/驳回</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-red-600 font-bold mb-1">已驳回</p>
                  <p className="text-gray-600">可补充材料 → 重新提交 → 进入复审</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-purple-600 font-bold mb-1">复审中</p>
                  <p className="text-gray-600">补充材料审核 → 二次判定 → 闭环</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-forest-600 font-bold mb-1">已通过</p>
                  <p className="text-gray-600">资质激活 → 全程审计留痕 → 可追溯</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'consultation' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: '已双签', Icon: CheckCircle2, color: 'from-forest-400 to-emerald-500', count: consultationAudit.filter(c => c.doctorSigned && c.ownerAcknowledged).length },
                { label: '仅医生签', Icon: PenTool, color: 'from-warm-400 to-orange-500', count: consultationAudit.filter(c => c.doctorSigned && !c.ownerAcknowledged).length },
                { label: '待宠主确认', Icon: UserCheck, color: 'from-blue-400 to-sky-500', count: consultationAudit.filter(c => c.doctorSigned && !c.ownerAcknowledged).length },
                { label: '未签', Icon: XCircle, color: 'from-red-400 to-rose-500', count: consultationAudit.filter(c => !c.doctorSigned && !c.ownerAcknowledged).length },
              ].map(({ label, Icon, color, count }) => (
                <div key={label} className="card !p-4 flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-[11px] text-gray-500 font-medium">{label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">问诊信息</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">诊断摘要</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">问诊时长</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">处方数量</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">签名状态</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">复诊</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {consultationAudit.map((c) => {
                    const sigStatus = getSignatureStatus(c.doctorSigned, c.ownerAcknowledged);
                    const isExpanded = expandedConsultation === c.id;
                    return (
                      <>
                        <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-sky-200 flex items-center justify-center shrink-0">
                                <Stethoscope className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-xs">{c.petName} · {c.owner}</div>
                                <div className="text-[10px] text-gray-500">{c.doctor}({c.dept}) · {c.createdAt}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-[11px] text-gray-700 max-w-[200px] truncate" title={c.diagnosis}>
                              {c.diagnosis}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5" title={c.symptoms}>
                              {c.symptoms.slice(0, 20)}...
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-[11px] font-semibold text-gray-700">{c.duration}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={cn(
                              'text-[11px] font-semibold',
                              c.prescriptionIssued ? 'text-warm-600' : 'text-gray-400'
                            )}>
                              {c.prescriptionIssued ? '1 张' : '无'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className={cn('text-lg font-bold', sigStatus.color)}>{sigStatus.icon}</span>
                              <span className={cn('text-[10px] font-semibold', sigStatus.color)}>{sigStatus.label}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {c.followUpNeeded ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                {c.followUpDate}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400">无需</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setExpandedConsultation(isExpanded ? null : c.id)}
                                className={cn(
                                  'p-1.5 rounded-lg transition-colors text-[10px] font-semibold inline-flex items-center gap-1',
                                  isExpanded ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-blue-600'
                                )}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                {isExpanded ? '收起' : '完整链路'}
                              </button>
                              {c.prescriptionIssued && (
                                <button onClick={() => { setActiveTab('prescription'); }} className="p-1.5 rounded-lg hover:bg-warm-50 text-warm-600 transition-colors" title="关联处方">
                                  <Pill className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="py-0">
                              <div className="bg-gradient-to-br from-blue-50/50 to-sky-50/50 border-t border-b border-blue-100 p-4">
                                <div className="grid sm:grid-cols-3 gap-4">
                                  <div className="space-y-3 sm:col-span-2">
                                    <div className="flex items-center gap-2">
                                      <Activity className="w-4 h-4 text-blue-600" />
                                      <span className="font-semibold text-sm text-gray-900">问诊时间线</span>
                                    </div>
                                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                      {consultationTimeline.map((step, i) => (
                                        <div key={i} className="flex items-center shrink-0">
                                          <div className="text-center">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-sky-500 flex items-center justify-center text-white text-xs font-bold mx-auto">
                                              {i + 1}
                                            </div>
                                            <div className="mt-1 text-[10px] font-semibold text-gray-800">{step.step}</div>
                                            <div className="text-[9px] text-gray-500">{step.time}</div>
                                            <div className="text-[9px] text-blue-600">{step.status}</div>
                                            <div className="text-[9px] text-gray-400">{step.operator}</div>
                                          </div>
                                          {i < consultationTimeline.length - 1 && (
                                            <div className="w-8 h-0.5 bg-blue-200 mx-1" />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <PenTool className="w-4 h-4 text-forest-600" />
                                      <span className="font-semibold text-sm text-gray-900">医生签名信息</span>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white border border-gray-100 space-y-1.5">
                                      <div className="flex justify-between text-[11px]">
                                        <span className="text-gray-500">签名时间</span>
                                        <span className="font-semibold text-gray-800">{doctorSignatureInfo.signTime}</span>
                                      </div>
                                      <div className="flex justify-between text-[11px]">
                                        <span className="text-gray-500">医师证号</span>
                                        <span className="font-mono font-semibold text-gray-800">{doctorSignatureInfo.licenseNumber}</span>
                                      </div>
                                      <div className="flex justify-between text-[11px]">
                                        <span className="text-gray-500">签名哈希</span>
                                        <span className="font-mono text-forest-600">{doctorSignatureInfo.signatureHash}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <UserCheck className="w-4 h-4 text-blue-600" />
                                      <span className="font-semibold text-sm text-gray-900">宠主确认信息</span>
                                    </div>
                                    <div className="p-3 rounded-lg bg-white border border-gray-100 space-y-1.5">
                                      <div className="flex justify-between text-[11px]">
                                        <span className="text-gray-500">确认时间</span>
                                        <span className="font-semibold text-gray-800">{ownerConfirmInfo.confirmTime}</span>
                                      </div>
                                      <div className="flex justify-between text-[11px]">
                                        <span className="text-gray-500">IP地址</span>
                                        <span className="font-mono font-semibold text-gray-800">{ownerConfirmInfo.ip}</span>
                                      </div>
                                      <div className="flex justify-between text-[11px]">
                                        <span className="text-gray-500">设备信息</span>
                                        <span className="font-semibold text-gray-800">{ownerConfirmInfo.device}</span>
                                      </div>
                                      <div className="flex justify-between text-[11px]">
                                        <span className="text-gray-500">地理位置</span>
                                        <span className="font-semibold text-gray-800">{ownerConfirmInfo.location}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-purple-600" />
                                      <span className="font-semibold text-sm text-gray-900">复诊提醒关联</span>
                                    </div>
                                    {c.followUpNeeded ? (
                                      <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 space-y-1.5">
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">复诊日期</span>
                                          <span className="font-semibold text-purple-700">{c.followUpDate}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">复诊科室</span>
                                          <span className="font-semibold text-gray-800">{c.dept}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">主治医生</span>
                                          <span className="font-semibold text-gray-800">{c.doctor}</span>
                                        </div>
                                        <button
                                          onClick={() => {
                                            trackNavigate('/calendar');
                                            addAuditLog('问诊审计-复诊关联', `问诊-${c.id}`, '查看', `管理员查看${c.petName}复诊提醒详情`);
                                          }}
                                          className="w-full mt-1 px-3 py-1.5 rounded-lg bg-purple-500 text-white text-[11px] font-semibold hover:bg-purple-600 transition-colors"
                                        >
                                          前往日历预约
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-center">
                                        <span className="text-[11px] text-gray-400">无需复诊</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="card bg-gradient-to-br from-blue-50 to-sky-50 space-y-3 border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900 text-sm">问诊审计闭环说明</span>
                </div>
                <button onClick={() => {
                  trackNavigate('/admin/consultation/audit');
                  addAuditLog('问诊审计-全链路', '', '查看', '管理员查看全链路问诊审计');
                }} className="text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5">
                  全链路审计 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid sm:grid-cols-4 gap-3 text-[11px]">
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-blue-600 font-bold mb-1">电子病历</p>
                  <p className="text-gray-600">AES-256 加密存储 · 仅授权可见</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-forest-600 font-bold mb-1">医生签名</p>
                  <p className="text-gray-600">执业兽医师电子签名 · 留痕</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-warm-600 font-bold mb-1">宠主确认</p>
                  <p className="text-gray-600">知情确认 · 全程留痕</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-purple-600 font-bold mb-1">复诊提醒</p>
                  <p className="text-gray-600">日历联动 · 逾期追踪</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prescription' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {prescriptionFlowStatuses.map(({ status, label, color, Icon }) => {
                const count = localPrescriptions.filter(p => getPrescriptionFlowStatus(p.status) === status).length;
                return (
                  <div key={status} className="card !p-3 flex items-start gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-bold text-gray-900">{count}</div>
                      <div className="text-[10px] text-gray-500 font-medium">{label}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">处方编号</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">处方药品</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">开具医生</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">金额</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">流转状态</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">双签状态</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {localPrescriptions.map((rx) => {
                    const sigStatus = getSignatureStatus(rx.doctorSigned, rx.ownerAcknowledged);
                    const flowStatus = getPrescriptionFlowStatus(rx.status);
                    const amount = getPrescriptionAmount(rx.id);
                    const isExpanded = expandedPrescription === rx.id;
                    return (
                      <>
                        <tr key={rx.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-warm-100 to-orange-200 flex items-center justify-center shrink-0">
                                <Pill className="w-4 h-4 text-warm-600" />
                              </div>
                              <div>
                                <div className="font-mono font-semibold text-gray-900 text-[11px]">{rx.id}</div>
                                <div className="text-[10px] text-gray-500">{rx.createdAt}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-[11px] font-semibold text-gray-800">{rx.drug}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-[11px] text-gray-700">{rx.doctor}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-[11px] font-bold text-warm-600">¥{amount.toFixed(2)}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[rx.status]?.color)}>
                              {statusMap[rx.status]?.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
                              rx.doctorSigned && rx.ownerAcknowledged ? 'bg-forest-50 border border-forest-200' :
                              rx.doctorSigned ? 'bg-warm-50 border border-warm-200' : 'bg-red-50 border border-red-200'
                            )}>
                              <span className={cn('text-sm font-bold', sigStatus.color)}>{sigStatus.icon}</span>
                              <span className={cn('text-[10px] font-semibold', sigStatus.color)}>{sigStatus.label}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setExpandedPrescription(isExpanded ? null : rx.id);
                                  if (!isExpanded) {
                                    addAuditLog('处方监管-流转追踪', `处方-${rx.id}`, '查看', `管理员查看${rx.drug}处方流转链路`);
                                  }
                                }}
                                className={cn(
                                  'p-1.5 rounded-lg transition-colors text-[10px] font-semibold inline-flex items-center gap-1',
                                  isExpanded ? 'bg-warm-100 text-warm-700' : 'hover:bg-warm-50 text-warm-600'
                                )}
                              >
                                <Package className="w-3.5 h-3.5" />
                                {isExpanded ? '收起' : '流转追踪'}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="py-0">
                              <div className="bg-gradient-to-br from-warm-50/50 to-orange-50/50 border-t border-b border-warm-100 p-4">
                                <div className="space-y-4">
                                  <div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <Activity className="w-4 h-4 text-warm-600" />
                                      <span className="font-semibold text-sm text-gray-900">处方流转全链路</span>
                                    </div>
                                    <div className="flex items-start gap-2 overflow-x-auto pb-2">
                                      {prescriptionFlowTimeline.map((step, i) => (
                                        <div key={i} className="flex items-start shrink-0">
                                          <div className="text-center min-w-[90px]">
                                            <div className={cn(
                                              'w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto',
                                              step.completed ? 'bg-gradient-to-br from-warm-500 to-orange-500' : 'bg-gray-300'
                                            )}>
                                              {i + 1}
                                            </div>
                                            <div className="mt-1 text-[10px] font-semibold text-gray-800">{step.step}</div>
                                            <div className="text-[9px] text-gray-500">{step.time}</div>
                                            <div className={cn('text-[9px] font-semibold', step.completed ? 'text-warm-600' : 'text-gray-400')}>{step.status}</div>
                                            <div className="text-[9px] text-gray-400">{step.operator}</div>
                                          </div>
                                          {i < prescriptionFlowTimeline.length - 1 && (
                                            <div className={cn('w-8 h-0.5 mt-5 mx-1', step.completed ? 'bg-warm-300' : 'bg-gray-200')} />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="grid sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <PenTool className="w-4 h-4 text-forest-600" />
                                        <span className="font-semibold text-xs text-gray-900">医生签名</span>
                                      </div>
                                      <div className={cn(
                                        'p-3 rounded-lg border space-y-1.5',
                                        rx.doctorSigned ? 'bg-forest-50 border-forest-200' : 'bg-gray-50 border-gray-200'
                                      )}>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">签名时间</span>
                                          <span className="font-semibold text-gray-800">{prescriptionSignatureInfo.doctorSign.time}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">医师</span>
                                          <span className="font-semibold text-gray-800">{prescriptionSignatureInfo.doctorSign.name}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">执业证号</span>
                                          <span className="font-mono text-[10px] text-forest-600">{prescriptionSignatureInfo.doctorSign.license}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <PenTool className="w-4 h-4 text-blue-600" />
                                        <span className="font-semibold text-xs text-gray-900">药师审核</span>
                                      </div>
                                      <div className={cn(
                                        'p-3 rounded-lg border space-y-1.5',
                                        rx.status !== 'pending_doctor' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                                      )}>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">审核时间</span>
                                          <span className="font-semibold text-gray-800">{prescriptionSignatureInfo.pharmacistSign.time}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">药师</span>
                                          <span className="font-semibold text-gray-800">{prescriptionSignatureInfo.pharmacistSign.name}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">药师证号</span>
                                          <span className="font-mono text-[10px] text-blue-600">{prescriptionSignatureInfo.pharmacistSign.license}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <UserCheck className="w-4 h-4 text-purple-600" />
                                        <span className="font-semibold text-xs text-gray-900">宠主确认</span>
                                      </div>
                                      <div className={cn(
                                        'p-3 rounded-lg border space-y-1.5',
                                        rx.ownerAcknowledged ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'
                                      )}>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">确认时间</span>
                                          <span className="font-semibold text-gray-800">{prescriptionSignatureInfo.ownerConfirm.time}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">宠主</span>
                                          <span className="font-semibold text-gray-800">{prescriptionSignatureInfo.ownerConfirm.name}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">IP地址</span>
                                          <span className="font-mono text-[10px] text-purple-600">{prescriptionSignatureInfo.ownerConfirm.ip}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {(rx.doctorSigned && rx.ownerAcknowledged) && (
                                    <div className="p-3 rounded-xl bg-gradient-to-r from-forest-50 to-emerald-50 border border-forest-200">
                                      <div className="flex items-center justify-center gap-2">
                                        <BadgeCheck className="w-5 h-5 text-forest-600" />
                                        <span className="font-semibold text-forest-700 text-sm">✓✓ 双签已完成 · 处方有效</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="card bg-gradient-to-br from-warm-50 to-orange-50 space-y-3 border-warm-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-warm-600" />
                  <span className="font-semibold text-warm-800 text-sm">处方流转监管说明</span>
                </div>
                <button onClick={() => {
                  trackNavigate('/admin/prescription/flow');
                  addAuditLog('处方监管-全链路', '', '查看', '管理员查看全链路处方监管');
                }} className="text-[11px] font-bold text-warm-700 hover:text-warm-800 hover:underline inline-flex items-center gap-0.5">
                  全链路监管 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid sm:grid-cols-4 gap-3 text-[11px]">
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-warm-600 font-bold mb-1">医生签名</p>
                  <p className="text-gray-600">执业兽医师电子签名 + 执业证号留痕</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-blue-600 font-bold mb-1">宠主确认</p>
                  <p className="text-gray-600">用药风险知情确认 + 确认记录留痕</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-forest-600 font-bold mb-1">复核通过</p>
                  <p className="text-gray-600">双签验证 + 处方解锁购买</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-sky-600 font-bold mb-1">商家发货</p>
                  <p className="text-gray-600">合规发货 + 处方药全程追溯</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {lostPetStats.map(({ status, label, color, Icon }) => {
                const count = status === 'searching' ? localCommunityPosts.filter(p => p.type === 'lost' && !p.found).length :
                             status === 'found' ? localCommunityPosts.filter(p => p.type === 'lost' && p.found).length :
                             status === 'followup' ? localCommunityPosts.filter(p => p.type === 'lost' && !p.found).length :
                             localCommunityPosts.filter(p => p.type === 'adopt').length;
                return (
                  <div key={status} className="card !p-3 flex items-start gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-bold text-gray-900">{count}</div>
                      <div className="text-[10px] text-gray-500 font-medium">{label}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setCommunitySubTab('posts')}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all',
                  communitySubTab === 'posts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                社区帖子
              </button>
              <button
                onClick={() => setCommunitySubTab('anticheat')}
                className={cn(
                  'flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
                  communitySubTab === 'anticheat' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Shield className="w-3.5 h-3.5" />
                评价反作弊
                <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {localAntiCheatReviews.filter(r => r.status === 'pending').length}
                </span>
              </button>
            </div>

            {communitySubTab === 'anticheat' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="card !p-3 flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-sky-500 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-bold text-gray-900">{localAntiCheatReviews.length}</div>
                      <div className="text-[10px] text-gray-500 font-medium">总评价数</div>
                    </div>
                  </div>
                  <div className="card !p-3 flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-bold text-red-600">{localAntiCheatReviews.filter(r => r.status !== 'approved').length}</div>
                      <div className="text-[10px] text-gray-500 font-medium">异常评价</div>
                    </div>
                  </div>
                  <div className="card !p-3 flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-bold text-yellow-600">{localAntiCheatReviews.filter(r => r.status === 'pending').length}</div>
                      <div className="text-[10px] text-gray-500 font-medium">待处理</div>
                    </div>
                  </div>
                  <div className="card !p-3 flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forest-400 to-emerald-500 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg font-bold text-forest-600">{localAntiCheatReviews.filter(r => r.status === 'approved' || r.status === 'rejected').length}</div>
                      <div className="text-[10px] text-gray-500 font-medium">已处理</div>
                    </div>
                  </div>
                </div>

                <div className="card space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      异常评价列表
                    </h3>
                    <span className="text-[10px] text-gray-500">共 {localAntiCheatReviews.length} 条</span>
                  </div>
                  <div className="space-y-2">
                    {localAntiCheatReviews.map((review) => {
                      const isExpanded = expandedAntiCheat === review.id;
                      return (
                        <div key={review.id} className={cn(
                          'p-3 rounded-xl border transition-all',
                          review.status === 'pending' ? 'bg-red-50/50 border-red-200' :
                          review.status === 'rejected' ? 'bg-gray-50 border-gray-200' :
                          'bg-forest-50/50 border-forest-200'
                        )}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn(
                                  'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                                  review.riskScore >= 80 ? 'bg-red-100 text-red-700' :
                                  review.riskScore >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                                )}>
                                  风险 {review.riskScore}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  {review.riskReasons.map((r, i) => (
                                    <span key={i}>
                                      {i > 0 && ' · '}
                                      {r === 'ip_abnormal' && 'IP异常'}
                                      {r === 'device_fingerprint' && '设备指纹'}
                                      {r === 'brush_suspect' && '刷单嫌疑'}
                                      {r === 'content_similar' && '内容相似'}
                                    </span>
                                  ))}
                                </span>
                              </div>
                              <p className="text-xs text-gray-800 line-clamp-2">{review.content}</p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {review.reviewer}
                                </span>
                                <span>→</span>
                                <span className="flex items-center gap-1">
                                  <Building className="w-3 h-3" />
                                  {review.reviewedTarget}
                                </span>
                                <span className="text-gray-400">{review.createdAt}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => setExpandedAntiCheat(isExpanded ? null : review.id)}
                              className="p-1.5 rounded-lg hover:bg-white/50 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-gray-200/60 space-y-3">
                              <div className="grid grid-cols-2 gap-3 text-[10px]">
                                <div>
                                  <span className="text-gray-500">IP 地址：</span>
                                  <span className="font-mono text-gray-700">{review.ip}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">设备 ID：</span>
                                  <span className="font-mono text-gray-700">{review.deviceFingerprint}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">评价类型：</span>
                                  <span className="text-gray-700">{review.targetType === 'hospital' ? '医院评价' : review.targetType === 'doctor' ? '医生评价' : review.targetType === 'product' ? '商品评价' : '商家评价'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">当前状态：</span>
                                  <span className={cn(
                                    'font-semibold',
                                    review.status === 'pending' ? 'text-yellow-600' :
                                    review.status === 'approved' ? 'text-forest-600' : 'text-gray-600'
                                  )}>
                                    {review.status === 'pending' ? '待处理' : review.status === 'approved' ? '已通过' : '已驳回'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {review.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setLocalAntiCheatReviews(prev => prev.map(r => r.id === review.id ? { ...r, status: 'approved' as const } : r));
                                        addAuditLog('社区监管-评价反作弊', `评价-${review.id}`, '通过', `通过${review.reviewer}的评价`);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-forest-500 text-white text-[10px] font-semibold hover:bg-forest-600 transition-colors inline-flex items-center gap-1"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      通过
                                    </button>
                                    <button
                                      onClick={() => {
                                        setLocalAntiCheatReviews(prev => prev.map(r => r.id === review.id ? { ...r, status: 'rejected' as const } : r));
                                        addAuditLog('社区监管-评价反作弊', `评价-${review.id}`, '驳回', `驳回${review.reviewer}的评价`);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-semibold hover:bg-red-600 transition-colors inline-flex items-center gap-1"
                                    >
                                      <XCircle className="w-3 h-3" />
                                      驳回
                                    </button>
                                    <button
                                      onClick={() => {
                                        setBlockUserVisible(review.id);
                                        setBlockReason('');
                                        setAddToBlacklist(false);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-[10px] font-semibold hover:bg-orange-600 transition-colors inline-flex items-center gap-1"
                                    >
                                      <UserX className="w-3 h-3" />
                                      屏蔽用户
                                    </button>
                                    <button
                                      onClick={() => {
                                        setBlockUserVisible(review.id);
                                        setBlockReason('刷单/异常评价行为');
                                        setAddToBlacklist(true);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-gray-800 text-white text-[10px] font-semibold hover:bg-gray-900 transition-colors inline-flex items-center gap-1"
                                    >
                                      <Ban className="w-3 h-3" />
                                      加入黑名单
                                    </button>
                                  </>
                                )}
                                {review.status !== 'pending' && (
                                  <span className="text-[10px] text-gray-400">该评价已处理</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {communitySubTab === 'posts' && (
              <>
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">内容类型</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">标题</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">发布人</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">发布时间</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">风险评分</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">跟进状态</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {localCommunityPosts.map((p) => {
                    const contentType = getContentType(p.type);
                    const followupStatus = getFollowupStatus(p);
                    const isAntiCheat = p.riskScore >= 50;
                    const isExpandedLost = expandedLostPet === p.id;
                    return (
                      <>
                        <tr key={p.id} className={cn(
                          'border-b border-gray-50 hover:bg-gray-50 transition-colors',
                          isAntiCheat && 'bg-red-50/50'
                        )}>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                                p.type === 'community' ? 'bg-gradient-to-br from-cream-100 to-warm-200' :
                                p.type === 'lost' ? 'bg-gradient-to-br from-orange-100 to-amber-200' :
                                'bg-gradient-to-br from-purple-100 to-indigo-200'
                              )}>
                                {p.type === 'community' && <MessageCircle className={cn('w-4 h-4', p.status === 'published' ? 'text-forest-600' : 'text-gray-600')} />}
                                {p.type === 'lost' && <MapPin className={cn('w-4 h-4', p.found ? 'text-forest-600' : 'text-orange-600')} />}
                                {p.type === 'adopt' && <HeartHandshake className={cn('w-4 h-4', p.status === 'published' ? 'text-purple-600' : 'text-gray-600')} />}
                              </div>
                              <span className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                                p.type === 'community' ? 'bg-forest-100 text-forest-700' :
                                p.type === 'lost' ? 'bg-orange-100 text-orange-700' :
                                'bg-purple-100 text-purple-700'
                              )}>
                                {contentType}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div>
                              <div className={cn(
                                'text-[11px] font-semibold',
                                isAntiCheat ? 'text-red-700' : 'text-gray-800'
                              )}>
                                {p.type === 'community' ? p.title :
                                 p.type === 'lost' ? `寻${p.breed} · ${p.color}` :
                                 `${p.petName} · ${p.breed}`}
                              </div>
                              {isAntiCheat && (
                                <div className="text-[9px] text-red-600 font-semibold mt-0.5">
                                  ⚠ AI检测：疑似刷单/恶意评价
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-[11px] text-gray-700">{p.author}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="text-[11px] text-gray-600">{p.createdAt}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full',
                              p.riskScore >= 50 ? 'bg-red-100 text-red-700' :
                              p.riskScore >= 30 ? 'bg-warm-100 text-warm-700' :
                              'bg-forest-100 text-forest-700'
                            )}>
                              {p.riskScore}分
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', followupStatus.color)}>
                              {followupStatus.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {p.type === 'lost' && (
                                <button
                                  onClick={() => handleLostPetFollowup(p.id)}
                                  className={cn(
                                    'p-1.5 rounded-lg transition-colors text-[10px] font-semibold inline-flex items-center gap-1',
                                    isExpandedLost ? 'bg-orange-100 text-orange-700' : 'hover:bg-orange-50 text-orange-600'
                                  )}
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                  {isExpandedLost ? '收起' : '寻宠跟进'}
                                </button>
                              )}
                              {isAntiCheat && (
                                <div className="flex items-center gap-0.5">
                                  <button
                                    onClick={() => handleReviewAntiCheat(p.id, 'approve')}
                                    className={cn(
                                      'p-1.5 rounded-lg transition-colors',
                                      processing === `anticheat-approve-${p.id}` ? 'bg-forest-100 opacity-50' : 'hover:bg-forest-50 text-forest-600'
                                    )}
                                    title="正常，通过"
                                    disabled={processing === `anticheat-approve-${p.id}`}
                                  >
                                    {processing === `anticheat-approve-${p.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleReviewAntiCheat(p.id, 'reject')}
                                    className={cn(
                                      'p-1.5 rounded-lg transition-colors',
                                      processing === `anticheat-reject-${p.id}` ? 'bg-red-100 opacity-50' : 'hover:bg-red-50 text-red-600'
                                    )}
                                    title="违规，驳回"
                                    disabled={processing === `anticheat-reject-${p.id}`}
                                  >
                                    {processing === `anticheat-reject-${p.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              )}
                              <button
                                onClick={() => trackNavigate(`/admin/community/${p.id}`)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                                title="查看详情"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpandedLost && (
                          <tr>
                            <td colSpan={7} className="py-0">
                              <div className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 border-t border-b border-orange-100 p-4">
                                <div className="space-y-4">
                                  <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-orange-600" />
                                        <span className="font-semibold text-xs text-gray-900">寻宠信息</span>
                                      </div>
                                      <div className="p-3 rounded-lg bg-white border border-orange-100 space-y-1.5">
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">宠物品种</span>
                                          <span className="font-semibold text-gray-800">{lostPetDetail.petInfo.breed}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">颜色/特征</span>
                                          <span className="font-semibold text-gray-800">{lostPetDetail.petInfo.color} · {lostPetDetail.petInfo.features}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">丢失地点</span>
                                          <span className="font-semibold text-gray-800">{lostPetDetail.petInfo.lostLocation}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">丢失时间</span>
                                          <span className="font-semibold text-gray-800">{lostPetDetail.petInfo.lostTime}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">悬赏金额</span>
                                          <span className="font-bold text-orange-600">{lostPetDetail.petInfo.reward}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-600" />
                                        <span className="font-semibold text-xs text-gray-900">公益任务分配</span>
                                      </div>
                                      <div className="p-3 rounded-lg bg-white border border-blue-100 space-y-1.5">
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">负责志愿者</span>
                                          <span className="font-semibold text-gray-800">{lostPetDetail.volunteerAssign.volunteer}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">联系电话</span>
                                          <span className="font-mono text-gray-800">{lostPetDetail.volunteerAssign.phone}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">巡查范围</span>
                                          <span className="font-semibold text-gray-800">{lostPetDetail.volunteerAssign.patrolArea}</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-gray-500">巡查时间</span>
                                          <span className="font-semibold text-gray-800">{lostPetDetail.volunteerAssign.patrolTime}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <Clock className="w-4 h-4 text-warm-600" />
                                      <span className="font-semibold text-sm text-gray-900">跟进记录时间线</span>
                                    </div>
                                    <div className="relative pl-6 space-y-3">
                                      {lostPetDetail.followupTimeline.map((record, i) => (
                                        <div key={i} className="relative">
                                          <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-warm-500 border-2 border-white" />
                                          {i < lostPetDetail.followupTimeline.length - 1 && (
                                            <div className="absolute -left-[14px] top-4 w-0.5 h-full bg-warm-200" />
                                          )}
                                          <div className="flex items-center gap-2 text-[11px]">
                                            <span className="text-gray-500 font-mono">{record.time}</span>
                                            <span className="font-semibold text-gray-800">{record.action}</span>
                                            <span className="text-gray-500">by</span>
                                            <span className="text-gray-700">{record.operator}</span>
                                            <span className="text-warm-600 font-medium">{record.status}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="p-3 rounded-lg bg-gradient-to-r from-warm-50 to-orange-50 border border-warm-200">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <BadgeCheck className="w-4 h-4 text-warm-600" />
                                        <span className="font-semibold text-[11px] text-gray-800">结果反馈</span>
                                      </div>
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                                        {lostPetDetail.result.status === 'searching' ? '寻找中' : '已找到'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-gray-600 mt-2">{lostPetDetail.result.feedback}</p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="card bg-gradient-to-br from-forest-50 to-emerald-50 space-y-3 border-forest-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-forest-600" />
                  <span className="font-semibold text-forest-900 text-sm">社区内容监管说明</span>
                </div>
                <button onClick={() => {
                  trackNavigate('/admin/community/rules');
                  addAuditLog('社区监管-规则', '', '查看', '管理员查看社区监管规则');
                }} className="text-[11px] font-bold text-forest-700 hover:text-forest-800 hover:underline inline-flex items-center gap-0.5">
                  监管规则 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid sm:grid-cols-4 gap-3 text-[11px]">
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-forest-600 font-bold mb-1">发布审核</p>
                  <p className="text-gray-600">AI风控初筛 + 高风险人工复核</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-orange-600 font-bold mb-1">寻宠公益</p>
                  <p className="text-gray-600">POI地理围栏 · 志愿者联动 · 全程追踪</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-purple-600 font-bold mb-1">领养跟进</p>
                  <p className="text-gray-600">资质核验 · 家访跟踪 · 领养后回访</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-red-600 font-bold mb-1">评价反作弊</p>
                  <p className="text-gray-600">AI异常检测 · 人工复核 · 信用联动</p>
                </div>
              </div>
            </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              {(['vaccine', 'deworm', 'checkup', 'consultation', 'custom'] as const).map((t) => (
                <span key={t} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                  {t === 'vaccine' ? '疫苗' : t === 'deworm' ? '驱虫' : t === 'checkup' ? '体检' : t === 'consultation' ? '问诊' : '自定义'} {calendarEvents.filter(e => e.type === t).length}
                </span>
              ))}
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                已完成 {calendarEvents.filter(e => e.status === 'completed').length}
              </span>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                待预约 {calendarEvents.filter(e => e.status === 'scheduled').length}
              </span>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                已逾期 {calendarEvents.filter(e => e.status === 'missed').length}
              </span>
            </div>

            <div className="grid sm:grid-cols-4 gap-3">
              <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 p-4 space-y-2 border-purple-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-200 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">提醒触达</p>
                    <p className="text-lg font-bold text-gray-900">38,672</p>
                  </div>
                </div>
                <p className="text-[10px] text-purple-600 font-semibold">月均触达率 96.8% · 打开率 62.3%</p>
              </div>
              <div className="card bg-gradient-to-br from-blue-50 to-sky-50 p-4 space-y-2 border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-100 to-sky-200 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">服务预约</p>
                    <p className="text-lg font-bold text-gray-900">24,568</p>
                  </div>
                </div>
                <p className="text-[10px] text-blue-600 font-semibold">月完成率 94.6% · 月逾期率 2.1%</p>
              </div>
              <div className="card bg-gradient-to-br from-forest-50 to-emerald-50 p-4 space-y-2 border-forest-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-forest-100 to-emerald-200 flex items-center justify-center">
                    <Target className="w-4 h-4 text-forest-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">疫苗接种率</p>
                    <p className="text-lg font-bold text-gray-900">89.6%</p>
                  </div>
                </div>
                <p className="text-[10px] text-forest-600 font-semibold">较上月 +2.3% · 核心犬苗覆盖率 94.2%</p>
              </div>
              <div className="card bg-gradient-to-br from-red-50 to-rose-50 p-4 space-y-2 border-red-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-100 to-rose-200 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">逾期未处理</p>
                    <p className="text-lg font-bold text-gray-900">386</p>
                  </div>
                </div>
                <p className="text-[10px] text-red-600 font-semibold">逾期&gt;7天需重点跟进 · 涉及宠主 256人</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] text-gray-500 border-b border-gray-100">
                    <th className="pb-3 pr-4 font-medium">事件类型</th>
                    <th className="pb-3 pr-4 font-medium">宠物/宠主</th>
                    <th className="pb-3 pr-4 font-medium">预约内容</th>
                    <th className="pb-3 pr-4 font-medium">服务机构</th>
                    <th className="pb-3 pr-4 font-medium">预定时间</th>
                    <th className="pb-3 pr-4 font-medium">提醒次数/打开</th>
                    <th className="pb-3 pr-4 font-medium">最近提醒</th>
                    <th className="pb-3 pr-4 font-medium">状态</th>
                    <th className="pb-3 pr-4 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="text-[11px]">
                  {calendarEvents.map((e) => (
                    <tr key={e.id} className="border-b border-gray-50 hover:bg-cream-50/50">
                      <td className="py-3 pr-4">
                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full',
                          e.type === 'vaccine' ? 'bg-purple-100 text-purple-700' :
                          e.type === 'deworm' ? 'bg-orange-100 text-orange-700' :
                          e.type === 'checkup' ? 'bg-blue-100 text-blue-700' :
                          e.type === 'consultation' ? 'bg-forest-100 text-forest-700' :
                          'bg-gray-100 text-gray-700'
                        )}>
                          {e.type === 'vaccine' ? '疫苗' : e.type === 'deworm' ? '驱虫' : e.type === 'checkup' ? '体检' : e.type === 'consultation' ? '问诊' : '自定义'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-gray-800">{e.petName}</p>
                        <p className="text-gray-500">{e.owner}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-800">{e.title}</p>
                        {e.doctor && <p className="text-gray-500">主治医师：{e.doctor}</p>}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{e.hospital}</td>
                      <td className="py-3 pr-4 text-gray-700">{e.scheduledTime}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-700">{e.reminderSent} 次</span>
                          {e.reminderOpened ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-forest-500" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">{e.lastReminder}</td>
                      <td className="py-3 pr-4">
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[e.status]?.color)}>
                          {statusMap[e.status]?.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => trackNavigate(`/calendar?event=${e.id}`)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="日历详情">
                            <Eye className="w-4 h-4" />
                          </button>
                          {e.status === 'missed' && (
                            <button onClick={() => trackNavigate(`/calendar?event=${e.id}&action=reschedule`)} className="p-1.5 rounded-lg hover:bg-warm-50 text-warm-600 transition-colors" title="重新预约">
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => trackNavigate(`/admin/calendar/reminder/${e.id}`)} className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors" title="提醒明细">
                            <Bell className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 space-y-3 border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-purple-900 text-sm">健康日历监管说明</span>
                </div>
                <button onClick={() => trackNavigate('/admin/calendar/engine')} className="text-[11px] font-bold text-purple-700 hover:text-purple-800 hover:underline inline-flex items-center gap-0.5">
                  日历引擎配置 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid sm:grid-cols-4 gap-3 text-[11px]">
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-purple-600 font-bold mb-1">多渠道触达</p>
                  <p className="text-gray-600">App推送 + 短信 + 微信三通道触达</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-blue-600 font-bold mb-1">预约联动</p>
                  <p className="text-gray-600">一键跳转医院POI · 导航 · 挂号</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-forest-600 font-bold mb-1">逾期追踪</p>
                  <p className="text-gray-600">逾期&gt;3天人工介入 · &gt;7天黑名单预警</p>
                </div>
                <div className="p-3 rounded-xl bg-white/70 text-center">
                  <p className="text-warm-600 font-bold mb-1">健康画像</p>
                  <p className="text-gray-600">预约履约率 · 健康事件完整度画像</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg text-gray-900">操作审计日志</h2>
              <div className="flex gap-2">
                <button onClick={() => trackNavigate('/admin/audit/export')} className="btn-secondary !py-1.5 !px-3 text-xs gap-1 inline-flex items-center">
                  <FileText className="w-3.5 h-3.5" /> 导出审计
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {localAuditLogs.map((log, i) => (
                <div key={i} className="rounded-xl hover:bg-gray-50 transition-colors border border-gray-50 overflow-hidden">
                  <div className="flex items-start gap-3 p-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-semibold text-gray-800 text-xs">{log.action}</span>
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full',
                          log.result === '通过' ? 'bg-forest-100 text-forest-700' :
                          log.result === '驳回' ? 'bg-red-100 text-red-700' :
                          log.result === '待审' ? 'bg-warm-100 text-warm-600' :
                          log.result === '待确认' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        )}>
                          {log.result}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500">
                        <span className="text-purple-600 font-semibold">{log.user}</span> → {log.target}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{log.detail}</div>
                      {expandedAudit === i && (
                        <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
                          <div className="grid sm:grid-cols-2 gap-3 text-[10px]">
                            <div>
                              <p className="font-semibold text-gray-400 mb-0.5">变更前</p>
                              <p className="font-mono bg-white px-2 py-1.5 rounded border border-gray-100 text-gray-600">
                                {log.action.includes('资质') ? 'licenseStatus: pending_review' :
                                 log.action.includes('角色') ? 'role: owner' :
                                 log.action.includes('处方') ? 'status: pending_doctor' :
                                 log.action.includes('登录') ? 'lastLogin: -' :
                                 'status: pending'}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-forest-600 mb-0.5">变更后</p>
                              <p className="font-mono bg-forest-50 px-2 py-1.5 rounded border border-forest-100 text-forest-700">
                                {log.action.includes('资质') ? 'licenseStatus: approved (管理员复核通过)' :
                                 log.action.includes('角色') ? 'role: doctor (申请角色变更)' :
                                 log.action.includes('处方') ? 'status: merchant_review (双签通过)' :
                                 log.action.includes('登录') ? `lastLogin: ${log.time} (IP: 127.0.0.1)` :
                                 'status: approved'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 pt-1 text-[10px] text-gray-400 border-t border-gray-100">
                            <span>操作者IP: 127.0.0.1</span>
                            <span>设备UA: Mozilla/5.0 Mac</span>
                            <span>会话ID: sess_xxx{i + 100}xxx</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="text-[10px] text-gray-400 font-mono">{log.time}</div>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => trackNavigate(`/admin/audit/${i + 1}`)}
                          className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                          title="查看完整审计"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setExpandedAudit(expandedAudit === i ? null : i)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                          title={expandedAudit === i ? '收起变更详情' : '展开变更diff'}
                        >
                          {expandedAudit === i ? <ChevronsDownUp className="w-3.5 h-3.5" /> : <ChevronsDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-800">审计明细导出</span>
                </div>
                <button onClick={() => trackNavigate('/admin/audit/export')} className="text-[11px] font-bold text-purple-700 hover:text-purple-800 hover:underline inline-flex items-center gap-0.5">
                  导出CSV <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-800">访问安全审计</span>
                </div>
                <button onClick={() => trackNavigate('/admin/audit/security')} className="text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5">
                  登录记录 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-semibold text-rose-800">角色变更审计</span>
                </div>
                <button onClick={() => trackNavigate('/admin/audit/role-changes')} className="text-[11px] font-bold text-rose-700 hover:text-rose-800 hover:underline inline-flex items-center gap-0.5">
                  变更明细 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setVerificationDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2"
      >
        <Search className="w-4 h-4" />
        🔍 交互验证
      </button>

      {verificationDrawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setVerificationDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-200 flex items-center justify-center">
                  <Search className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-900">交互验证控制台</h2>
                  <p className="text-xs text-gray-500">导航 · Tab · 操作 · 筛选 全链路验证</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportVerificationReport}
                  className="px-3 py-1.5 rounded-lg bg-forest-50 text-forest-700 text-xs font-semibold hover:bg-forest-100 transition-colors flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  导出报告
                </button>
                <button
                  onClick={resetVerification}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  重置
                </button>
                <button
                  onClick={() => setVerificationDrawerOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="flex gap-1 px-6 py-2 border-b border-gray-100 bg-gray-50">
              {(['navigation', 'tab', 'action', 'filter'] as VerificationTabId[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setVerificationActiveTab(tab)}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all',
                    verificationActiveTab === tab
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                  )}
                >
                  {tab === 'navigation' && '导航验证'}
                  {tab === 'tab' && `Tab验证 ${verifiedTabCount}/10`}
                  {tab === 'action' && '操作验证'}
                  {tab === 'filter' && '筛选验证'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {verificationActiveTab === 'navigation' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">导航验证记录</h3>
                    <span className="text-xs text-gray-500">共 {interactionVerification.navigationRecords.length} 条</span>
                  </div>
                  <div className="space-y-2">
                    {interactionVerification.navigationRecords.map((record) => {
                      const presetInfo = presetOwnerRoutes.find(r => r.path === record.targetPath);
                      return (
                        <div
                          key={record.id}
                          className={cn(
                            'p-4 rounded-xl border transition-all',
                            record.isPreset ? 'bg-gradient-to-r from-purple-50/50 to-indigo-50/50 border-purple-100' : 'bg-white border-gray-100 hover:border-gray-200'
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {record.status === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-forest-500" />
                              ) : record.status === 'failed' ? (
                                <XCircle className="w-4 h-4 text-red-500" />
                              ) : (
                                <Clock className="w-4 h-4 text-gray-400" />
                              )}
                              <span className="font-semibold text-sm text-gray-900">
                                {presetInfo?.label || record.targetPath}
                              </span>
                              {record.isPreset && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">预置</span>
                              )}
                            </div>
                            <button
                              onClick={() => trackNavigate(record.targetPath, '手动验证')}
                              className="px-3 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors"
                            >
                              手动验证
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-xs">
                            <div>
                              <p className="text-gray-400 mb-0.5">目标路径</p>
                              <p className="font-mono text-gray-700">{record.targetPath}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 mb-0.5">跳转时间</p>
                              <p className="text-gray-700">{record.timestamp}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 mb-0.5">跳转来源</p>
                              <p className="text-gray-700">{record.source}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {verificationActiveTab === 'tab' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Tab验证记录</h3>
                    <div className="flex items-center gap-2">
                      {allTabsVerified && (
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-forest-100 text-forest-700">
                          ✓ Tab验证完成 {verifiedTabCount}/10
                        </span>
                      )}
                      <span className="text-xs text-gray-500">共 {interactionVerification.tabRecords.length} 条</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {interactionVerification.tabRecords.map((record) => {
                      const tab = tabs.find(t => t.id === record.tabId);
                      const TabIcon = tab?.Icon;
                      return (
                        <div
                          key={record.id}
                          className={cn(
                            'p-4 rounded-xl border transition-all',
                            record.isPreset ? 'bg-gradient-to-r from-blue-50/50 to-sky-50/50 border-blue-100' : 'bg-white border-gray-100 hover:border-gray-200'
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {record.status === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-forest-500" />
                              ) : record.status === 'failed' ? (
                                <XCircle className="w-4 h-4 text-red-500" />
                              ) : (
                                <Clock className="w-4 h-4 text-gray-400" />
                              )}
                              {TabIcon && <TabIcon className="w-4 h-4 text-purple-600" />}
                              <span className="font-semibold text-sm text-gray-900">{record.tabName}</span>
                              {record.isPreset && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">预置</span>
                              )}
                            </div>
                            <button
                              onClick={() => setActiveTab(record.tabId)}
                              className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
                            >
                              手动切换验证
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-xs">
                            <div>
                              <p className="text-gray-400 mb-0.5">Tab ID</p>
                              <p className="font-mono text-gray-700">{record.tabId}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 mb-0.5">切换时间</p>
                              <p className="text-gray-700">{record.timestamp}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 mb-0.5">验证状态</p>
                              <p className={cn(
                                'font-semibold',
                                record.status === 'success' ? 'text-forest-600' :
                                record.status === 'failed' ? 'text-red-600' : 'text-gray-500'
                              )}>
                                {record.status === 'success' ? '成功✓' : record.status === 'failed' ? '失败✗' : '待验证'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {verificationActiveTab === 'action' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">操作验证记录</h3>
                    <span className="text-xs text-gray-500">共 {interactionVerification.actionRecords.length} 条</span>
                  </div>
                  {interactionVerification.actionRecords.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <ClipboardList className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">暂无操作记录</p>
                      <p className="text-xs text-gray-400 mt-1">执行审核、禁用/启用等操作后会显示在这里</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {interactionVerification.actionRecords.map((record) => (
                        <div
                          key={record.id}
                          className="p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {record.status === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-forest-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="font-semibold text-sm text-gray-900">{record.actionType}</span>
                            </div>
                            <button
                              onClick={() => {
                                setActiveTab('audit');
                                showToast('已跳转到审计日志', 'success');
                              }}
                              className="px-3 py-1 rounded-lg bg-warm-50 text-warm-700 text-xs font-semibold hover:bg-warm-100 transition-colors flex items-center gap-1"
                            >
                              <ClipboardList className="w-3 h-3" />
                              查看审计日志
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-xs mb-2">
                            <div>
                              <p className="text-gray-400 mb-0.5">操作目标</p>
                              <p className="text-gray-700">{record.target}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 mb-0.5">操作时间</p>
                              <p className="text-gray-700">{record.timestamp}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="text-gray-400 mb-0.5">操作结果</p>
                              <p className={cn(
                                'font-semibold',
                                record.result === '通过' ? 'text-forest-600' :
                                record.result === '驳回' ? 'text-red-600' : 'text-warm-600'
                              )}>
                                {record.result}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 mb-0.5">审计日志ID</p>
                              <p className="font-mono text-gray-700">{record.auditLogId || '-'}</p>
                            </div>
                          </div>
                          {record.dataChange && (
                            <div className="mt-3 p-2 rounded-lg bg-gradient-to-r from-gray-50 to-cream-50 border border-gray-100">
                              <p className="text-[10px] text-gray-500 mb-1">数据变化</p>
                              <p className="text-xs font-mono text-gray-700">{record.dataChange}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {verificationActiveTab === 'filter' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">筛选验证记录</h3>
                    <span className="text-xs text-gray-500">共 {interactionVerification.filterRecords.length} 条</span>
                  </div>
                  {interactionVerification.filterRecords.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">暂无筛选记录</p>
                      <p className="text-xs text-gray-400 mt-1">在搜索框按回车执行搜索后会显示在这里</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {interactionVerification.filterRecords.map((record) => (
                        <div
                          key={record.id}
                          className="p-4 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {record.status === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-forest-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="font-semibold text-sm text-gray-900">{record.filterType}</span>
                            </div>
                            <button
                              onClick={() => {
                                trackFilter(record.filterType, record.filterConditions, Math.floor(Math.random() * 50) + 1);
                              }}
                              className="px-3 py-1 rounded-lg bg-teal-50 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-colors"
                            >
                              手动验证
                            </button>
                          </div>
                          <div className="mb-2">
                            <p className="text-[10px] text-gray-400 mb-1">筛选条件</p>
                            <p className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded font-mono">{record.filterConditions}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-xs">
                            <div>
                              <p className="text-gray-400 mb-0.5">筛选时间</p>
                              <p className="text-gray-700">{record.timestamp}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 mb-0.5">结果数量</p>
                              <p className="font-bold text-purple-600">{record.resultCount} 条</p>
                            </div>
                            <div>
                              <p className="text-gray-400 mb-0.5">验证状态</p>
                              <p className={cn(
                                'font-semibold',
                                record.status === 'success' ? 'text-forest-600' : 'text-red-600'
                              )}>
                                {record.status === 'success' ? '成功✓' : '失败✗'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {scheduleWarningVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setScheduleWarningVisible(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                发放排班警告
              </h3>
              <button onClick={() => setScheduleWarningVisible(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">警告内容</label>
                <textarea
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  placeholder="请输入警告内容..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    addAuditLog('医生监管-排班警告', `医生-${scheduleWarningVisible}`, '警告', `发放排班警告：${warningMessage}`);
                    showToast('警告已发放', 'success');
                    setScheduleWarningVisible(null);
                    setWarningMessage('');
                  }}
                  disabled={!warningMessage.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold disabled:opacity-50 hover:shadow-lg transition-all"
                >
                  确认发放
                </button>
                <button
                  onClick={() => setScheduleWarningVisible(null)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {scheduleAdjustVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setScheduleAdjustVisible(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                调整排班
              </h3>
              <button onClick={() => setScheduleAdjustVisible(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">请选择需要调整的排班日期和时段：</p>
              <div className="grid grid-cols-7 gap-1">
                {['一', '二', '三', '四', '五', '六', '日'].map((day, i) => (
                  <div key={i} className="text-center">
                    <p className="text-[10px] text-gray-400 mb-1">周{day}</p>
                    <div className="space-y-0.5">
                      <div className="h-4 rounded bg-forest-100 text-[8px] text-forest-700 flex items-center justify-center cursor-pointer hover:bg-forest-200">上</div>
                      <div className="h-4 rounded bg-forest-100 text-[8px] text-forest-700 flex items-center justify-center cursor-pointer hover:bg-forest-200">下</div>
                      <div className="h-4 rounded bg-gray-100 text-[8px] text-gray-500 flex items-center justify-center cursor-pointer hover:bg-gray-200">夜</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    addAuditLog('医生监管-排班调整', `医生-${scheduleAdjustVisible}`, '调整', '调整医生排班');
                    showToast('排班已调整', 'success');
                    setScheduleAdjustVisible(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 text-white text-sm font-semibold hover:shadow-lg transition-all"
                >
                  确认调整
                </button>
                <button
                  onClick={() => setScheduleAdjustVisible(null)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {qualificationReviewVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setQualificationReviewVisible(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-500" />
                {rectifyReason ? '限期整改通知' : '资质复核'}
              </h3>
              <button onClick={() => setQualificationReviewVisible(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {rectifyReason && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">整改期限（天）</label>
                  <input
                    type="number"
                    value={rectifyDeadline}
                    onChange={(e) => setRectifyDeadline(e.target.value)}
                    placeholder="例如：7"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">{rectifyReason ? '整改原因' : '复核原因'}</label>
                <textarea
                  value={rectifyReason}
                  onChange={(e) => setRectifyReason(e.target.value)}
                  placeholder={rectifyReason ? '请输入整改原因和要求...' : '请输入复核原因...'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    addAuditLog(
                      '商家监管-资质监管',
                      `商家-${qualificationReviewVisible}`,
                      rectifyReason ? '限期整改' : '触发复核',
                      rectifyReason ? `限期整改：${rectifyReason}` : '资质复核'
                    );
                    showToast(rectifyReason ? '整改通知已发送' : '复核已触发', 'success');
                    setQualificationReviewVisible(null);
                    setRectifyReason('');
                    setRectifyDeadline('');
                  }}
                  disabled={!rectifyReason.trim()}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 hover:shadow-lg transition-all',
                    rectifyReason ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-sky-500'
                  )}
                >
                  确认{rectifyReason ? '发送' : '触发'}
                </button>
                <button
                  onClick={() => {
                    setQualificationReviewVisible(null);
                    setRectifyReason('');
                    setRectifyDeadline('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {priceLimitVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPriceLimitVisible(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                限价通知
              </h3>
              <button onClick={() => setPriceLimitVisible(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">建议限价（元）</label>
                <input
                  type="text"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder="请输入建议价格"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">限价原因</label>
                <textarea
                  value={limitReason}
                  onChange={(e) => setLimitReason(e.target.value)}
                  placeholder="请输入限价原因..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    addAuditLog(
                      '医院监管-定价监管',
                      `医院-${priceLimitVisible.hospitalId}`,
                      '限价通知',
                      `限价通知：${limitReason || '价格偏离过大'}`
                    );
                    showToast('限价通知已发送', 'success');
                    setPriceLimitVisible(null);
                    setLimitPrice('');
                    setLimitReason('');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold hover:shadow-lg transition-all"
                >
                  发送通知
                </button>
                <button
                  onClick={() => {
                    setPriceLimitVisible(null);
                    setLimitPrice('');
                    setLimitReason('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {blockUserVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setBlockUserVisible(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                {addToBlacklist ? <Ban className="w-5 h-5 text-gray-700" /> : <UserX className="w-5 h-5 text-orange-500" />}
                {addToBlacklist ? '加入黑名单' : '屏蔽用户'}
              </h3>
              <button onClick={() => setBlockUserVisible(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
                <p className="text-xs text-orange-800">
                  {addToBlacklist
                    ? '该用户将被加入黑名单，无法发布评价、帖子等内容。'
                    : '该用户将被屏蔽，其评价将不再显示。'}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">原因说明</label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="请输入原因说明..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    addAuditLog(
                      '社区监管-评价反作弊',
                      `评价-${blockUserVisible}`,
                      addToBlacklist ? '加入黑名单' : '屏蔽用户',
                      `原因：${blockReason || '异常评价行为'}`
                    );
                    showToast(addToBlacklist ? '已加入黑名单' : '已屏蔽用户', 'success');
                    setBlockUserVisible(null);
                    setBlockReason('');
                    setAddToBlacklist(false);
                  }}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:shadow-lg transition-all',
                    addToBlacklist ? 'bg-gradient-to-r from-gray-700 to-gray-900' : 'bg-gradient-to-r from-orange-500 to-amber-500'
                  )}
                >
                  确认{addToBlacklist ? '加入黑名单' : '屏蔽'}
                </button>
                <button
                  onClick={() => {
                    setBlockUserVisible(null);
                    setBlockReason('');
                    setAddToBlacklist(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
