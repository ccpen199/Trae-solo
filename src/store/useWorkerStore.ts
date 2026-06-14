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
