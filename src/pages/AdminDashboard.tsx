import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Users, Building2, Store, Stethoscope, TrendingUp,
  Clock, Eye, CheckCircle2, XCircle, Search, BarChart3, Activity,
  AlertTriangle, ClipboardList, FileText, Lock, PenTool, UserCheck,
  RotateCcw, Pill, ShoppingCart, MapPin, Calendar, Syringe, Bug, Heart,
  ChevronRight, ArrowRight, BadgeCheck, ChevronsDown, ChevronsDownUp,
  PawPrint, FileSpreadsheet, MessageCircle, HeartHandshake, Bell,
  MapPinned, Star, AlertCircle, ThumbsUp, Share2, Home, BookOpen,
  Scissors, Thermometer, Layers, Target, Shield, Check, X, Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

type TabId = 'owner' | 'doctor' | 'hospital' | 'merchant' | 'review' | 'prescription' | 'consultation' | 'community' | 'calendar' | 'audit';

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

const ownerLedger = [
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

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('owner');
  const [expandedAudit, setExpandedAudit] = useState<number | string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedDoctorAction, setSelectedDoctorAction] = useState<{id: string, action: string} | null>(null);
  const [selectedHospitalAction, setSelectedHospitalAction] = useState<{id: string, action: string} | null>(null);
  const [selectedMerchantAction, setSelectedMerchantAction] = useState<{id: string, action: string} | null>(null);
  const [actionProcessing, setActionProcessing] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [localAuditLogs, setLocalAuditLogs] = useState(auditLogs);

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

  const handleAction = (entityType: '医生' | '医院' | '商家', id: string, actionName: string, result: string, detail: string) => {
    setActionProcessing(true);
    setTimeout(() => {
      setActionProcessing(false);
      addAuditLog(`${entityType}监管-${actionName}`, `${entityType}-${id}`, result, detail);
      showToast(`${actionName}操作完成：${result}`, result === '通过' ? 'success' : 'error');
    }, 700);
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜索编号/姓名/证号..." className="pl-9 pr-4 py-2 rounded-xl bg-white border border-gray-200 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-purple-200" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '注册宠主', value: '28,465', subValue: '绑定宠物 42,356 只', Icon: Users, color: 'from-forest-400 to-emerald-600' },
          { label: '认证医生', value: '386', subValue: '处方量 12,486 张', Icon: Stethoscope, color: 'from-blue-400 to-sky-600' },
          { label: '入驻医院', value: '128', subValue: '服务项 1,856 个', Icon: Building2, color: 'from-orange-400 to-amber-600' },
          { label: '合规商家', value: '96', subValue: '在架 SKU 4,256', Icon: Store, color: 'from-rose-400 to-pink-600' },
          { label: '多宠绑定', value: '12,895', subValue: '授权账号 8,234 个', Icon: PawPrint, color: 'from-purple-400 to-indigo-600' },
          { label: '健康模板', value: '38,672', subValue: '覆盖率 91.3%', Icon: FileSpreadsheet, color: 'from-teal-400 to-cyan-600' },
          { label: '病中跟踪', value: '1,286', subValue: '复诊预约 892 次', Icon: Activity, color: 'from-red-400 to-rose-600' },
          { label: '预约服务', value: '24,568', subValue: '月完成率 94.6%', Icon: Calendar, color: 'from-warm-400 to-orange-600' },
        ].map(({ label, value, subValue, Icon, color }) => (
          <div key={label} className="card !p-4 flex items-start gap-3 relative overflow-hidden group hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold text-gray-900">{value}</div>
              <div className="text-[10px] text-gray-500 font-medium">{label}</div>
              <div className="text-[9px] text-gray-400 mt-0.5">{subValue}</div>
            </div>
            <TrendingUp className="w-3 h-3 text-forest-500 absolute top-2 right-2" />
          </div>
        ))}
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
                          <button onClick={() => navigate('/pets')} className="p-1.5 rounded-lg hover:bg-forest-50 text-forest-600 transition-colors" title="多宠档案">
                            <PawPrint className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => navigate('/pets')} className="p-1.5 rounded-lg hover:bg-teal-50 text-teal-600 transition-colors" title="健康模板">
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => navigate('/calendar')} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="预约记录">
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => navigate(`/admin/audit/user/${u.id}`)} className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors" title="操作审计">
                            <ClipboardList className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => navigate(`/admin/owner/${u.id}`)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors" title="完整详情">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-forest-50 to-emerald-50 border border-forest-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PawPrint className="w-4 h-4 text-forest-600" />
                  <span className="text-xs font-semibold text-forest-800">多宠绑定审计</span>
                </div>
                <button onClick={() => navigate('/admin/owner/bindings')} className="text-[11px] font-bold text-forest-700 hover:text-forest-800 hover:underline inline-flex items-center gap-0.5">
                  绑定明细 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-semibold text-teal-800">健康模板覆盖</span>
                </div>
                <button onClick={() => navigate('/admin/health/templates')} className="text-[11px] font-bold text-teal-700 hover:text-teal-800 hover:underline inline-flex items-center gap-0.5">
                  模板分析 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-semibold text-red-800">病中病程跟踪</span>
                </div>
                <button onClick={() => navigate('/admin/health/sick-tracking')} className="text-[11px] font-bold text-red-700 hover:text-red-800 hover:underline inline-flex items-center gap-0.5">
                  跟踪列表 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-800">风控异常监测</span>
                </div>
                <button onClick={() => navigate('/admin/risk/owners')} className="text-[11px] font-bold text-purple-700 hover:text-purple-800 hover:underline inline-flex items-center gap-0.5">
                  风险名单 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
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
                <span className="text-xs text-gray-500">共 {doctorLedger.length} 条</span>
              </div>
            </div>
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
                  {doctorLedger.map((d) => (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-gray-900">{d.name}</div>
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
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[d.scheduleStatus]?.color)}>
                          {statusMap[d.scheduleStatus]?.label}
                        </span>
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
                  ))}
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
                  {selectedDoctorAction.action === 'schedule' && (
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-white/80 border border-blue-100">
                          <p className="text-[10px] text-gray-500">当前状态</p>
                          <span className={cn('text-sm font-semibold px-2 py-0.5 rounded-full', statusMap[d.scheduleStatus]?.color)}>{statusMap[d.scheduleStatus]?.label}</span>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-blue-100">
                          <p className="text-[10px] text-gray-500">今日问诊</p>
                          <p className="text-lg font-bold text-gray-900">{d.todayConsult} <span className="text-[10px] text-gray-400 font-normal">次</span></p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-blue-100">
                          <p className="text-[10px] text-gray-500">累计问诊</p>
                          <p className="text-lg font-bold text-gray-900">{d.consults} <span className="text-[10px] text-gray-400 font-normal">次</span></p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-blue-100">
                          <p className="text-[10px] text-gray-500">平均时长</p>
                          <p className="text-lg font-bold text-gray-900">{d.avgConsultTime} <span className="text-[10px] text-gray-400 font-normal">分/次</span></p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/80 border border-blue-100">
                        <p className="text-[10px] text-gray-500 mb-2">本周排班概况</p>
                        <div className="grid grid-cols-7 gap-1.5">
                          {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, i) => {
                            const isToday = i === 2;
                            const status = d.scheduleStatus === 'on_duty' ? (i < 5 ? 'on_duty' : 'off_duty') : d.scheduleStatus === 'in_surgery' ? (i === 2 ? 'in_surgery' : i < 5 ? 'on_duty' : 'off_duty') : 'off_duty';
                            return (
                              <div key={day} className={cn('text-center p-1.5 rounded-lg text-[10px] font-semibold', isToday ? 'ring-2 ring-blue-300' : '', status === 'on_duty' ? 'bg-forest-50 text-forest-700' : status === 'in_surgery' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-400')}>
                                <div>{day}</div>
                                <div className="mt-0.5">{status === 'on_duty' ? '当班' : status === 'in_surgery' ? '手术' : '休息'}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAction('医生', d.id, '排班管理', '通过', `${d.name}排班已确认`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-sky-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:shadow-md transition-all">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          确认排班
                        </button>
                        <button onClick={() => handleAction('医生', d.id, '排班管理', '调整', `要求调整${d.name}排班`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-warm-50 text-warm-700 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-warm-100 transition-colors border border-warm-200">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                          调整排班
                        </button>
                      </div>
                    </div>
                  )}
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
                <button onClick={() => navigate('/admin/doctor/schedules')} className="text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5">
                  排班表 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-forest-50 to-emerald-50 border border-forest-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-forest-600" />
                  <span className="text-xs font-semibold text-forest-800">电子签名审计</span>
                </div>
                <button onClick={() => navigate('/admin/audit/signatures')} className="text-[11px] font-bold text-forest-700 hover:text-forest-800 hover:underline inline-flex items-center gap-0.5">
                  签名记录 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-warm-50 to-orange-50 border border-warm-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-warm-600" />
                  <span className="text-xs font-semibold text-warm-800">评价风控监测</span>
                </div>
                <button onClick={() => navigate('/admin/risk/reviews')} className="text-[11px] font-bold text-warm-700 hover:text-warm-800 hover:underline inline-flex items-center gap-0.5">
                  差评处理 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-semibold text-purple-800">处方异常监测</span>
                </div>
                <button onClick={() => navigate('/admin/risk/prescriptions')} className="text-[11px] font-bold text-purple-700 hover:text-purple-800 hover:underline inline-flex items-center gap-0.5">
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
                <span className="text-xs text-gray-500">共 {hospitalLedger.length} 条</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">医院/地址</th>
                    <th className="text-left py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">证号/POI</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">资质状态</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">医生/当班</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">服务定价</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">今日预约</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">评分/差评</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">合规分</th>
                    <th className="text-center py-2.5 px-3 text-[10px] font-bold text-gray-400 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitalLedger.map((h) => (
                    <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
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
                            onClick={() => setSelectedHospitalAction(selectedHospitalAction?.id === h.id && selectedHospitalAction?.action === 'pricing' ? null : {id: h.id, action: 'pricing'})}
                            className={cn('p-1.5 rounded-lg transition-colors', selectedHospitalAction?.id === h.id && selectedHospitalAction?.action === 'pricing' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-blue-600')}
                            title="服务定价审核"
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
                  ))}
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
                <button onClick={() => navigate('/admin/hospital/services')} className="text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5">
                  定价明细 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPinned className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-semibold text-teal-800">POI 地理围栏</span>
                </div>
                <button onClick={() => navigate('/admin/hospital/poi')} className="text-[11px] font-bold text-teal-700 hover:text-teal-800 hover:underline inline-flex items-center gap-0.5">
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
                <button onClick={() => navigate('/admin/risk/hospitals')} className="text-[11px] font-bold text-purple-700 hover:text-purple-800 hover:underline inline-flex items-center gap-0.5">
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
                <span className="text-xs text-gray-500">共 {merchantLedger.length} 条</span>
              </div>
            </div>
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
                  {merchantLedger.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-gray-900">{m.name}</div>
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
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[m.licenseStatus]?.color)}>
                          {statusMap[m.licenseStatus]?.label}
                        </span>
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
                  ))}
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
                  {selectedMerchantAction.action === 'compliance' && (
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-white/80 border border-forest-100">
                          <p className="text-[10px] text-gray-500">资质状态</p>
                          <span className={cn('text-sm font-semibold px-2 py-0.5 rounded-full', statusMap[m.licenseStatus]?.color)}>{statusMap[m.licenseStatus]?.label}</span>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-forest-100">
                          <p className="text-[10px] text-gray-500">GSP 认证</p>
                          <span className={cn('text-sm font-semibold px-2 py-0.5 rounded-full', m.gspCertified ? 'bg-forest-100 text-forest-700' : 'bg-red-100 text-red-700')}>{m.gspCertified ? '✓ 已获 GSP 认证' : '✗ 未获 GSP 认证'}</span>
                        </div>
                        <div className="p-3 rounded-lg bg-white/80 border border-forest-100">
                          <p className="text-[10px] text-gray-500">合规评分</p>
                          <span className={cn('text-lg font-bold', m.complianceScore >= 90 ? 'text-forest-600' : m.complianceScore >= 60 ? 'text-warm-600' : 'text-red-600')}>{m.complianceScore > 0 ? m.complianceScore : '-'}</span>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-white/80 border border-forest-100">
                        <p className="text-[10px] text-forest-600 font-semibold mb-2">SKU 合规审核</p>
                        <div className="grid grid-cols-3 gap-3 text-[11px]">
                          <div className="text-center">
                            <p className="font-bold text-gray-900">{m.skuCount}</p>
                            <p className="text-gray-500">总 SKU</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-forest-600">{m.skuOnShelf}</p>
                            <p className="text-gray-500">在架</p>
                          </div>
                          <div className="text-center">
                            <p className={cn('font-bold', m.skuOutOfStock > 0 ? 'text-warm-600' : 'text-gray-400')}>{m.skuOutOfStock}</p>
                            <p className="text-gray-500">缺货</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAction('商家', m.id, '合规备案', '通过', `${m.name}合规备案审核通过`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-gradient-to-r from-forest-500 to-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:shadow-md transition-all">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          备案通过
                        </button>
                        <button onClick={() => handleAction('商家', m.id, '合规备案', '驳回', `${m.name}合规备案驳回`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-gray-200 transition-colors">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                          驳回
                        </button>
                        <button onClick={() => handleAction('商家', m.id, '合规备案', '补充材料', `要求${m.name}补充GSP认证材料`)} disabled={actionProcessing} className="px-4 py-2 rounded-lg bg-warm-50 text-warm-700 text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-warm-100 transition-colors border border-warm-200">
                          {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                          要求补充材料
                        </button>
                      </div>
                    </div>
                  )}
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
                <button onClick={() => navigate('/admin/merchant/compliance')} className="text-[11px] font-bold text-rose-700 hover:text-rose-800 hover:underline inline-flex items-center gap-0.5">
                  备案明细 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-warm-50 to-orange-50 border border-warm-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-warm-600" />
                  <span className="text-xs font-semibold text-warm-800">处方复核监管</span>
                </div>
                <button onClick={() => navigate('/admin/merchant/prescriptions')} className="text-[11px] font-bold text-warm-700 hover:text-warm-800 hover:underline inline-flex items-center gap-0.5">
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
                <button onClick={() => navigate('/admin/risk/merchants')} className="text-[11px] font-bold text-red-700 hover:text-red-800 hover:underline inline-flex items-center gap-0.5">
                  风险名单 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'review' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              {(['pending', 'approved', 'rejected', 're_review'] as const).map((s) => {
                const count = reviewItems.filter(r => r.status === s).length;
                return (
                  <span key={s} className={cn('text-[10px] font-semibold px-2.5 py-1 rounded-full', statusMap[s]?.color)}>
                    {statusMap[s]?.label} {count}
                  </span>
                );
              })}
            </div>
            <div className="space-y-3">
              {reviewItems.map((item) => {
                const cfg = reviewTypeConfig[item.type];
                return (
                  <div key={item.id} onClick={() => navigate(`/admin/review/${item.id}`)} className="card cursor-pointer hover:border-purple-200 hover:shadow-sm transition-all">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center shrink-0`}>
                        <cfg.Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-gray-900">{item.name}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-br ${cfg.color}`}>{cfg.label}</span>
                          <span className="text-[10px] font-mono text-gray-400">{item.id}</span>
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[item.status]?.color)}>
                            {statusMap[item.status]?.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-gray-400">
                          <span>🕒 提交于 {item.submitted}</span>
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> 材料 {item.materials} 份</span>
                          <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3" /> 审计记录 {item.auditTrail} 条</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => navigate(`/admin/review/${item.id}`)} className="p-2 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="查看详情">
                          <Eye className="w-4 h-4" />
                        </button>
                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleReject(item.id)}
                              disabled={!!processing}
                              className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-xs font-medium inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              {processing === `reject-${item.id}` ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                              驳回
                            </button>
                            <button
                              onClick={() => handleApprove(item.id)}
                              disabled={!!processing}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-forest-500 to-emerald-500 text-white hover:shadow-md transition-all text-xs font-medium inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              {processing === `approve-${item.id}` ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                              通过
                            </button>
                          </>
                        )}
                        {item.status === 'rejected' && (
                          <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1"><XCircle className="w-3 h-3" />已驳回 · 可查看驳回原因</span>
                        )}
                        {item.status === 're_review' && (
                          <span className="text-[10px] text-purple-500 font-semibold flex items-center gap-1"><RotateCcw className="w-3 h-3" />复审中 · 已补充材料</span>
                        )}
                        {item.status === 'approved' && (
                          <span className="text-[10px] text-forest-500 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />已通过</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-2">
                {(['completed', 'scheduled', 'missed'] as const).map((s) => (
                  <span key={s} className={cn('text-[10px] font-semibold px-2.5 py-1 rounded-full', statusMap[s]?.color)}>
                    {statusMap[s]?.label} {s === 'scheduled' ? consultationAudit.filter(c => c.followUpNeeded).length : s === 'completed' ? 2 : 0}
                  </span>
                ))}
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">待确认 {consultationAudit.filter(c => !c.ownerAcknowledged).length}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {consultationAudit.map((c) => (
                <div key={c.id} className="card space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-sky-200 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-gray-900">{c.diagnosis}</span>
                        <span className="text-[10px] font-mono text-gray-400">{c.id}</span>
                        {c.aesEncrypted && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">🔒 AES-256 加密</span>}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        宠物：{c.petName} ({c.owner}) · 医生：{c.doctor}({c.dept}) · {c.createdAt} · 时长 {c.duration}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => navigate(`/admin/consultation/${c.id}`)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="问诊详情">
                        <Eye className="w-4 h-4" />
                      </button>
                      {c.prescriptionIssued && (
                        <button onClick={() => { setActiveTab('prescription'); }} className="p-1.5 rounded-lg hover:bg-warm-50 text-warm-600 transition-colors" title="关联处方">
                          <Pill className="w-4 h-4" />
                        </button>
                      )}
                      {c.followUpNeeded && (
                        <button onClick={() => navigate('/calendar')} className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors" title="复诊预约">
                          <Calendar className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-cream-50 border border-gray-100">
                    <p className="text-[11px] text-gray-700 leading-relaxed">
                      <span className="font-semibold text-gray-800">主诉症状：</span>{c.symptoms}
                    </p>
                    <p className="text-[11px] text-gray-600 leading-relaxed mt-1">
                      <span className="font-semibold text-gray-800">诊断结论：</span>{c.diagnosis}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className={cn(
                      'p-3 rounded-xl border flex items-center gap-2',
                      c.doctorSigned ? 'bg-forest-50 border-forest-200' : 'bg-gray-50 border-gray-200'
                    )}>
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', c.doctorSigned ? 'bg-forest-100' : 'bg-gray-100')}>
                        <PenTool className={cn('w-4 h-4', c.doctorSigned ? 'text-forest-600' : 'text-gray-400')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-gray-800">医生签名</p>
                        <p className={cn('text-[10px]', c.doctorSigned ? 'text-forest-600' : 'text-gray-400')}>
                          {c.doctorSigned ? `✓ ${c.doctor}` : '未签名'}
                        </p>
                      </div>
                      {c.doctorSigned && (
                        <button onClick={() => navigate(`/admin/consultation/${c.id}`)} className="text-[9px] font-bold text-forest-600 hover:underline">签名明细</button>
                      )}
                    </div>
                    <div className={cn(
                      'p-3 rounded-xl border flex items-center gap-2',
                      c.ownerAcknowledged ? 'bg-forest-50 border-forest-200' : 'bg-warm-50 border-warm-200'
                    )}>
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', c.ownerAcknowledged ? 'bg-forest-100' : 'bg-warm-100')}>
                        <UserCheck className={cn('w-4 h-4', c.ownerAcknowledged ? 'text-forest-600' : 'text-warm-600')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-gray-800">宠主知情</p>
                        <p className={cn('text-[10px]', c.ownerAcknowledged ? 'text-forest-600' : 'text-warm-600')}>
                          {c.ownerAcknowledged ? '✓ 已确认' : '待确认'}
                        </p>
                      </div>
                      {!c.ownerAcknowledged && (
                        <button onClick={() => navigate('/products')} className="text-[9px] font-bold text-warm-600 hover:underline">催确认</button>
                      )}
                    </div>
                    <div className={cn(
                      'p-3 rounded-xl border flex items-center gap-2',
                      c.prescriptionIssued ? 'bg-warm-50 border-warm-200' : 'bg-gray-50 border-gray-200'
                    )}>
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', c.prescriptionIssued ? 'bg-warm-100' : 'bg-gray-100')}>
                        <Pill className={cn('w-4 h-4', c.prescriptionIssued ? 'text-warm-600' : 'text-gray-400')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-gray-800">处方开具</p>
                        <p className={cn('text-[10px]', c.prescriptionIssued ? 'text-warm-600' : 'text-gray-400')}>
                          {c.prescriptionIssued ? '✓ 已开具' : '未开具'}
                        </p>
                      </div>
                      {c.prescriptionIssued && (
                        <button onClick={() => { setActiveTab('prescription'); }} className="text-[9px] font-bold text-warm-600 hover:underline">查看处方</button>
                      )}
                    </div>
                    <div className={cn(
                      'p-3 rounded-xl border flex items-center gap-2',
                      c.followUpNeeded ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'
                    )}>
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', c.followUpNeeded ? 'bg-purple-100' : 'bg-gray-100')}>
                        <Calendar className={cn('w-4 h-4', c.followUpNeeded ? 'text-purple-600' : 'text-gray-400')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-gray-800">复诊提醒</p>
                        <p className={cn('text-[10px]', c.followUpNeeded ? 'text-purple-600' : 'text-gray-400')}>
                          {c.followUpNeeded ? c.followUpDate : '无需复诊'}
                        </p>
                      </div>
                      {c.followUpNeeded && (
                        <button onClick={() => navigate('/calendar')} className="text-[9px] font-bold text-purple-600 hover:underline">预约</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card bg-gradient-to-br from-blue-50 to-sky-50 space-y-3 border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-900 text-sm">问诊审计闭环说明</span>
                </div>
                <button onClick={() => navigate('/admin/consultation/audit')} className="text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5">
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
            <div className="flex items-center gap-3 flex-wrap">
              {(['pending_doctor', 'pending_owner', 'approved', 'merchant_review'] as const).map((s) => {
                const count = prescriptionMonitor.filter(p => p.status === s).length;
                return (
                  <span key={s} className={cn('text-[10px] font-semibold px-2.5 py-1 rounded-full', statusMap[s]?.color)}>
                    {statusMap[s]?.label} {count}
                  </span>
                );
              })}
            </div>
            <div className="space-y-3">
              {prescriptionMonitor.map((rx) => (
                <div key={rx.id} className="card space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-warm-100 to-orange-200 flex items-center justify-center shrink-0">
                      <Pill className="w-5 h-5 text-warm-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-gray-900">{rx.drug}</span>
                        <span className="text-[10px] font-mono text-gray-400">{rx.id}</span>
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[rx.status]?.color)}>
                          {statusMap[rx.status]?.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500">开具医生：{rx.doctor} · 创建时间：{rx.createdAt}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => navigate(`/admin/prescription/${rx.id}`)}
                        className="p-1.5 rounded-lg hover:bg-sky-50 text-sky-600 transition-colors"
                        title="处方详情/流转链路"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {rx.status === 'merchant_review' && (
                        <button
                          onClick={() => navigate('/shop')}
                          className="p-1.5 rounded-lg hover:bg-warm-50 text-warm-600 transition-colors"
                          title="前往商城复核"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      )}
                      {rx.status === 'pending_owner' && (
                        <button
                          onClick={() => navigate('/products')}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="宠主知情确认入口"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className={cn(
                      'p-3 rounded-xl border flex items-center gap-2',
                      rx.doctorSigned ? 'bg-forest-50 border-forest-200' : 'bg-gray-50 border-gray-200'
                    )}>
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', rx.doctorSigned ? 'bg-forest-100' : 'bg-gray-100')}>
                        <PenTool className={cn('w-4 h-4', rx.doctorSigned ? 'text-forest-600' : 'text-gray-400')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-gray-800">① 医生签名</p>
                        <p className={cn('text-[10px]', rx.doctorSigned ? 'text-forest-600' : 'text-gray-400')}>
                          {rx.doctorSigned ? `✓ ${rx.doctor} 已签名` : '等待签名'}
                        </p>
                      </div>
                      {rx.doctorSigned && (
                        <button onClick={() => navigate(`/admin/prescription/${rx.id}`)} className="text-[9px] font-bold text-forest-600 hover:underline">签名明细</button>
                      )}
                    </div>
                    <div className={cn(
                      'p-3 rounded-xl border flex items-center gap-2',
                      rx.ownerAcknowledged ? 'bg-forest-50 border-forest-200' : 'bg-gray-50 border-gray-200'
                    )}>
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', rx.ownerAcknowledged ? 'bg-forest-100' : 'bg-gray-100')}>
                        <UserCheck className={cn('w-4 h-4', rx.ownerAcknowledged ? 'text-forest-600' : 'text-gray-400')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-gray-800">② 宠主确认</p>
                        <p className={cn('text-[10px]', rx.ownerAcknowledged ? 'text-forest-600' : 'text-gray-400')}>
                          {rx.ownerAcknowledged ? '✓ 已知情确认' : '等待确认'}
                        </p>
                      </div>
                      {rx.ownerAcknowledged && (
                        <button onClick={() => navigate(`/admin/prescription/${rx.id}`)} className="text-[9px] font-bold text-forest-600 hover:underline">确认留痕</button>
                      )}
                    </div>
                    <div className={cn(
                      'p-3 rounded-xl border flex items-center gap-2',
                      rx.status === 'approved' ? 'bg-forest-50 border-forest-200' :
                      rx.status === 'merchant_review' ? 'bg-sky-50 border-sky-200' : 'bg-gray-50 border-gray-200'
                    )}>
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        rx.status === 'approved' ? 'bg-forest-100' :
                        rx.status === 'merchant_review' ? 'bg-sky-100' : 'bg-gray-100'
                      )}>
                        {rx.status === 'approved' ? <CheckCircle2 className="w-4 h-4 text-forest-600" /> :
                         rx.status === 'merchant_review' ? <ShoppingCart className="w-4 h-4 text-sky-600" /> :
                         <Clock className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-gray-800">③ 复核/发货</p>
                        <p className={cn(
                          'text-[10px]',
                          rx.status === 'approved' ? 'text-forest-600' :
                          rx.status === 'merchant_review' ? 'text-sky-600' : 'text-gray-400'
                        )}>
                          {rx.status === 'approved' ? '✓ 双签通过' :
                           rx.status === 'merchant_review' ? '商家复核中' : '待前序步骤'}
                        </p>
                      </div>
                      {(rx.status === 'approved' || rx.status === 'merchant_review') && (
                        <button onClick={() => navigate('/shop')} className="text-[9px] font-bold text-sky-600 hover:underline">流转链路</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card bg-gradient-to-br from-warm-50 to-orange-50 space-y-3 border-warm-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-warm-600" />
                  <span className="font-semibold text-warm-800 text-sm">处方流转监管说明</span>
                </div>
                <button onClick={() => navigate('/admin/prescription/flow')} className="text-[11px] font-bold text-warm-700 hover:text-warm-800 hover:underline inline-flex items-center gap-0.5">
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
            <div className="flex items-center gap-3 flex-wrap">
              {(['community', 'lost', 'adopt'] as const).map((t) => (
                <span key={t} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                  {t === 'community' ? '社区帖子' : t === 'lost' ? '寻宠启事' : '领养意向'} {communityPosts.filter(p => p.type === t).length}
                </span>
              ))}
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                待审核 {communityPosts.filter(p => p.status === 'pending_review').length}
              </span>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-warm-100 text-warm-700">
                高风险 {communityPosts.filter(p => p.riskScore >= 50).length}
              </span>
            </div>

            <div className="grid sm:grid-cols-4 gap-3">
              <div className="card bg-gradient-to-br from-cream-50 to-warm-50 p-4 space-y-2 border-warm-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-forest-100 to-emerald-200 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-forest-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">社区发布</p>
                    <p className="text-lg font-bold text-gray-900">12,856</p>
                  </div>
                </div>
                <p className="text-[10px] text-forest-600 font-semibold">日均发布 86 篇 · 审核通过率 92.3%</p>
              </div>
              <div className="card bg-gradient-to-br from-orange-50 to-warm-50 p-4 space-y-2 border-orange-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">寻宠启事</p>
                    <p className="text-lg font-bold text-gray-900">368</p>
                  </div>
                </div>
                <p className="text-[10px] text-orange-600 font-semibold">本月找回 42 只 · 找回率 68.5%</p>
              </div>
              <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 p-4 space-y-2 border-purple-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-200 flex items-center justify-center">
                    <HeartHandshake className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">领养意向</p>
                    <p className="text-lg font-bold text-gray-900">1,256</p>
                  </div>
                </div>
                <p className="text-[10px] text-purple-600 font-semibold">本月成功领养 86 只 · 匹配率 71.2%</p>
              </div>
              <div className="card bg-gradient-to-br from-red-50 to-rose-50 p-4 space-y-2 border-red-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-100 to-rose-200 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">高风险内容</p>
                    <p className="text-lg font-bold text-gray-900">28</p>
                  </div>
                </div>
                <p className="text-[10px] text-red-600 font-semibold">需人工复核 · 涉及投诉/医疗纠纷</p>
              </div>
            </div>

            <div className="space-y-3">
              {communityPosts.map((p) => (
                <div key={p.id} className="card space-y-3">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                      p.type === 'community' ? 'bg-gradient-to-br from-cream-100 to-warm-200' :
                      p.type === 'lost' ? 'bg-gradient-to-br from-orange-100 to-amber-200' :
                      'bg-gradient-to-br from-purple-100 to-indigo-200'
                    )}>
                      {p.type === 'community' && <MessageCircle className={cn('w-5 h-5', p.status === 'published' ? 'text-forest-600' : 'text-gray-600')} />}
                      {p.type === 'lost' && <MapPin className={cn('w-5 h-5', p.found ? 'text-forest-600' : 'text-orange-600')} />}
                      {p.type === 'adopt' && <HeartHandshake className={cn('w-5 h-5', p.status === 'published' ? 'text-purple-600' : 'text-gray-600')} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full',
                          p.type === 'community' ? 'bg-forest-100 text-forest-700' :
                          p.type === 'lost' ? 'bg-orange-100 text-orange-700' :
                          'bg-purple-100 text-purple-700'
                        )}>
                          {p.type === 'community' ? '社区' : p.type === 'lost' ? '寻宠' : '领养'}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {p.type === 'community' ? p.title :
                           p.type === 'lost' ? `寻${p.breed} · ${p.color}` :
                           `${p.petName} · ${p.breed}`}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">{p.id}</span>
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusMap[p.status]?.color)}>
                          {statusMap[p.status]?.label}
                        </span>
                        {p.riskScore >= 50 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            风险 {p.riskScore}分
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {p.type === 'community' && (
                          <>作者：{p.author} · {p.likes}赞 {p.comments}评 {p.shares}分享 · {p.views}阅读 · {p.createdAt}</>
                        )}
                        {p.type === 'lost' && (
                          <>宠主：{p.author} · 最后出现：{p.lastSeen} · 走失：{p.lostTime} · 悬赏：{p.reward}</>
                        )}
                        {p.type === 'adopt' && (
                          <>发布人：{p.author} · {p.age} · {p.gender} · {p.vaccinated ? '已免疫' : '未免疫'} · {p.neutered ? '已绝育' : '未绝育'} · 意向申请人 {p.applicantCount}位</>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => navigate(`/admin/community/${p.id}`)} className="p-1.5 rounded-lg hover:bg-forest-50 text-forest-600 transition-colors" title="内容详情">
                        <Eye className="w-4 h-4" />
                      </button>
                      {p.status === 'pending_review' && (
                        <>
                          <button onClick={() => handleApprove(p.id)} className={cn('p-1.5 rounded-lg text-forest-600 transition-colors', processing === `approve-${p.id}` ? 'bg-forest-100 opacity-50' : 'hover:bg-forest-50')} title="审核通过" disabled={processing === `approve-${p.id}`}>
                            {processing === `approve-${p.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleReject(p.id)} className={cn('p-1.5 rounded-lg text-red-600 transition-colors', processing === `reject-${p.id}` ? 'bg-red-100 opacity-50' : 'hover:bg-red-50')} title="审核驳回" disabled={processing === `reject-${p.id}`}>
                            {processing === `reject-${p.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                          </button>
                        </>
                      )}
                      {p.auditTrail > 0 && (
                        <button onClick={() => setExpandedAudit(expandedAudit === p.id ? null : p.id)} className="text-[10px] font-bold text-purple-600 hover:underline px-2">
                          审计链路 {p.auditTrail}
                        </button>
                      )}
                    </div>
                  </div>
                  {p.type === 'community' && (
                    <div className="p-3 rounded-xl bg-gradient-to-br from-cream-50 to-gray-50 border border-cream-100">
                      <p className="text-[11px] text-gray-700 line-clamp-2">{p.content}</p>
                    </div>
                  )}
                  {p.type === 'adopt' && (
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-50 to-gray-50 border border-purple-100">
                      <p className="text-[11px] text-gray-700">{p.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="card bg-gradient-to-br from-forest-50 to-emerald-50 space-y-3 border-forest-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-forest-600" />
                  <span className="font-semibold text-forest-900 text-sm">社区内容监管说明</span>
                </div>
                <button onClick={() => navigate('/admin/community/rules')} className="text-[11px] font-bold text-forest-700 hover:text-forest-800 hover:underline inline-flex items-center gap-0.5">
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
                  <p className="text-red-600 font-bold mb-1">风控评级</p>
                  <p className="text-gray-600">内容风险 · 投诉率 · 账号信用分</p>
                </div>
              </div>
            </div>
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
                          <button onClick={() => navigate(`/calendar?event=${e.id}`)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="日历详情">
                            <Eye className="w-4 h-4" />
                          </button>
                          {e.status === 'missed' && (
                            <button onClick={() => navigate(`/calendar?event=${e.id}&action=reschedule`)} className="p-1.5 rounded-lg hover:bg-warm-50 text-warm-600 transition-colors" title="重新预约">
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => navigate(`/admin/calendar/reminder/${e.id}`)} className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors" title="提醒明细">
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
                <button onClick={() => navigate('/admin/calendar/engine')} className="text-[11px] font-bold text-purple-700 hover:text-purple-800 hover:underline inline-flex items-center gap-0.5">
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
                <button onClick={() => navigate('/admin/audit/export')} className="btn-secondary !py-1.5 !px-3 text-xs gap-1 inline-flex items-center">
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
                          onClick={() => navigate(`/admin/audit/${i + 1}`)}
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
                <button onClick={() => navigate('/admin/audit/export')} className="text-[11px] font-bold text-purple-700 hover:text-purple-800 hover:underline inline-flex items-center gap-0.5">
                  导出CSV <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-800">访问安全审计</span>
                </div>
                <button onClick={() => navigate('/admin/audit/security')} className="text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5">
                  登录记录 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-semibold text-rose-800">角色变更审计</span>
                </div>
                <button onClick={() => navigate('/admin/audit/role-changes')} className="text-[11px] font-bold text-rose-700 hover:text-rose-800 hover:underline inline-flex items-center gap-0.5">
                  变更明细 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
