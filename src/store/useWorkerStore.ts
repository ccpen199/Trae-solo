import { create } from 'zustand';
import type { Worker, WorkerCert, WorkerScore } from '@/types';

interface WorkerState {
  worker: Worker | null;
  cert: WorkerCert | null;
  score: WorkerScore | null;
  workerList: Worker[];
  setWorker: (worker: Worker | null) => void;
  setCert: (cert: WorkerCert | null) => void;
  setScore: (score: WorkerScore | null) => void;
  setWorkerList: (workers: Worker[]) => void;
  updateWorkerStatus: (status: Worker['status']) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  updateCertStatus: (verifyStatus: WorkerCert['verify_status']) => void;
  getWorkerById: (id: number) => Worker | undefined;
}

export const useWorkerStore = create<WorkerState>((set, get) => ({
  worker: {
    id: 101,
    phone: '13700137001',
    real_name: '王秀兰',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Auntie1',
    status: 'verified',
    verified_at: '2024-01-20T10:00:00Z',
    skills: ['日常保洁', '深度保洁', '擦玻璃', '厨卫清洁'],
    age: 45,
    experience_years: 6,
  },
  cert: {
    id: 1,
    worker_id: 101,
    id_card_url: 'https://example.com/certs/id-101.jpg',
    health_cert_url: 'https://example.com/certs/health-101.jpg',
    crime_record_url: 'https://example.com/certs/crime-101.jpg',
    ocr_result: '姓名：王秀兰，身份证：110105197901011234，有效期内',
    verify_status: 'approved',
    submitted_at: '2024-01-15T09:00:00Z',
    ocr_completed_at: '2024-01-15T09:05:00Z',
    review_completed_at: '2024-01-20T14:30:00Z',
    ocr_detail: {
      id_card: {
        ocr_time: '2024-01-15T09:03:00Z',
        confidence: 99.2,
        fields: [
          { label: '姓名', value: '王秀兰', confidence: 99.8 },
          { label: '身份证号', value: '110105197901011234', confidence: 98.7 },
          { label: '性别', value: '女', confidence: 99.5 },
          { label: '民族', value: '汉', confidence: 99.0 },
          { label: '出生日期', value: '1979-01-01', confidence: 98.5 },
          { label: '住址', value: '北京市朝阳区建国路88号', confidence: 97.2 },
          { label: '有效期', value: '2020-05-10 至 长期', confidence: 99.1 },
          { label: '签发机关', value: '北京市公安局朝阳分局', confidence: 98.0 },
        ],
      },
      health_cert: {
        ocr_time: '2024-01-15T09:04:00Z',
        confidence: 96.8,
        fields: [
          { label: '证件名称', value: '北京市从业人员健康证', confidence: 99.0 },
          { label: '持证人', value: '王秀兰', confidence: 98.5 },
          { label: '身份证号', value: '110105197901011234', confidence: 97.8 },
          { label: '从业类型', value: '家政服务', confidence: 96.0 },
          { label: '发证机构', value: '北京市朝阳区疾病预防控制中心', confidence: 95.5 },
          { label: '发证日期', value: '2025-11-20', confidence: 97.0 },
          { label: '有效期至', value: '2026-11-19', confidence: 98.2 },
          { label: '健康状况', value: '合格（无传染性疾病）', confidence: 99.5 },
        ],
      },
      crime_record: {
        ocr_time: '2024-01-15T09:05:00Z',
        confidence: 98.5,
        fields: [
          { label: '证明名称', value: '无违法犯罪记录证明', confidence: 99.0 },
          { label: '被证明人', value: '王秀兰', confidence: 98.8 },
          { label: '身份证号', value: '110105197901011234', confidence: 98.2 },
          { label: '开具单位', value: '北京市公安局朝阳分局', confidence: 97.5 },
          { label: '开具日期', value: '2025-12-01', confidence: 98.0 },
          { label: '有效期至', value: '2026-05-31', confidence: 99.1 },
          { label: '核查结果', value: '未发现违法犯罪记录', confidence: 99.8 },
        ],
      },
    },
    review_history: [
      {
        id: 1,
        reviewer: 'OCR自动识别系统',
        review_time: '2024-01-15T09:05:00Z',
        result: 'pass',
        remark: '三证OCR识别完成，置信度98.5%，字段完整度100%',
        type: 'ocr',
      },
      {
        id: 2,
        reviewer: '初审专员-刘芳',
        review_time: '2024-01-16T10:20:00Z',
        result: 'pass',
        remark: '身份证信息核对一致，健康证在有效期内，无犯罪记录证明真实有效。证件照片清晰，与本人照片匹配度高。',
        type: 'manual',
      },
      {
        id: 3,
        reviewer: '复核专员-赵明',
        review_time: '2024-01-18T16:45:00Z',
        result: 'pass',
        remark: '三证信息交叉验证通过，资料齐全，符合入驻标准。',
        type: 'recheck',
      },
      {
        id: 4,
        reviewer: '质检专员-王晓梅',
        review_time: '2026-03-10T11:00:00Z',
        result: 'pass',
        remark: '季度资质复查：健康证仍在有效期，无新增犯罪记录，资质保持有效。',
        type: 'recheck',
      },
    ],
  },
  score: {
    id: 1,
    worker_id: 101,
    overall_score: 4.8,
    punctuality_rate: 98.5,
    satisfaction_rate: 96.2,
    complaint_rate: 0.8,
    total_orders: 326,
    trend: [4.6, 4.7, 4.75, 4.8, 4.82, 4.78, 4.85],
  },
  workerList: [
    {
      id: 101,
      phone: '13700137001',
      real_name: '王秀兰',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Auntie1',
      status: 'verified',
      verified_at: '2024-01-20T10:00:00Z',
      skills: ['日常保洁', '深度保洁', '擦玻璃', '厨卫清洁'],
      age: 45,
      experience_years: 6,
    },
    {
      id: 102,
      phone: '13700137002',
      real_name: '李桂芳',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Auntie2',
      status: 'verified',
      verified_at: '2024-02-10T14:30:00Z',
      skills: ['育儿陪护', '婴幼儿护理', '辅食制作', '早教启蒙'],
      age: 42,
      experience_years: 5,
    },
    {
      id: 103,
      phone: '13700137003',
      real_name: '张淑珍',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Auntie3',
      status: 'verified',
      verified_at: '2024-01-05T11:00:00Z',
      skills: ['深度保洁', '开荒保洁', '家电清洗', '除螨'],
      age: 48,
      experience_years: 8,
    },
    {
      id: 104,
      phone: '13700137004',
      real_name: '赵美华',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Auntie4',
      status: 'pending',
      skills: ['日常保洁', '衣物整理'],
      age: 38,
      experience_years: 2,
    },
    {
      id: 105,
      phone: '13700137005',
      real_name: '刘春梅',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Auntie5',
      status: 'verified',
      verified_at: '2024-03-01T16:20:00Z',
      skills: ['上门烹饪', '营养配餐', '月子餐', '家常菜'],
      age: 50,
      experience_years: 10,
    },
    {
      id: 106,
      phone: '13700137006',
      real_name: '孙丽娟',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Auntie6',
      status: 'rejected',
      skills: ['日常保洁'],
      age: 35,
      experience_years: 1,
    },
  ],
  setWorker: (worker) => set({ worker }),
  setCert: (cert) => set({ cert }),
  setScore: (score) => set({ score }),
  setWorkerList: (workerList) => set({ workerList }),
  updateWorkerStatus: (status) =>
    set((state) => ({
      worker: state.worker ? { ...state.worker, status } : null,
      workerList: state.workerList.map((w) =>
        w.id === state.worker?.id ? { ...w, status } : w
      ),
    })),
  addSkill: (skill) =>
    set((state) => ({
      worker: state.worker
        ? { ...state.worker, skills: [...state.worker.skills, skill] }
        : null,
    })),
  removeSkill: (skill) =>
    set((state) => ({
      worker: state.worker
        ? { ...state.worker, skills: state.worker.skills.filter((s) => s !== skill) }
        : null,
    })),
  updateCertStatus: (verify_status) =>
    set((state) => ({
      cert: state.cert ? { ...state.cert, verify_status } : null,
    })),
  getWorkerById: (id) => get().workerList.find((w) => w.id === id),
}));
