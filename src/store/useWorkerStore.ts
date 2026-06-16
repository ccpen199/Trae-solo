import { create } from 'zustand';
import type { Worker, WorkerCert, WorkerScore, ReviewRecord, OCRField } from '@/types';

const buildIDCardFields = (name: string, idNum: string, addr: string, expiry: string): OCRField[] => [
  { label: '姓名', value: name, confidence: 99.8 },
  { label: '身份证号', value: idNum, confidence: 98.7 },
  { label: '性别', value: '女', confidence: 99.5 },
  { label: '民族', value: '汉', confidence: 99.0 },
  { label: '出生日期', value: '1979-01-01', confidence: 98.5 },
  { label: '住址', value: addr, confidence: 97.2 },
  { label: '有效期', value: expiry, confidence: 99.1 },
  { label: '签发机关', value: '北京市公安局朝阳分局', confidence: 98.0 },
];

const buildHealthFields = (name: string, issueDate: string, expiry: string): OCRField[] => [
  { label: '证件名称', value: '北京市从业人员健康证', confidence: 99.0 },
  { label: '持证人', value: name, confidence: 98.5 },
  { label: '从业类型', value: '家政服务', confidence: 96.0 },
  { label: '发证机构', value: '北京市朝阳区疾病预防控制中心', confidence: 95.5 },
  { label: '发证日期', value: issueDate, confidence: 97.0 },
  { label: '有效期至', value: expiry, confidence: 98.2 },
  { label: '健康状况', value: '合格（无传染性疾病）', confidence: 99.5 },
];

const buildCrimeFields = (name: string, issueDate: string, expiry: string): OCRField[] => [
  { label: '证明名称', value: '无违法犯罪记录证明', confidence: 99.0 },
  { label: '被证明人', value: name, confidence: 98.8 },
  { label: '开具单位', value: '北京市公安局朝阳分局', confidence: 97.5 },
  { label: '开具日期', value: issueDate, confidence: 98.0 },
  { label: '有效期至', value: expiry, confidence: 99.1 },
  { label: '核查结果', value: '未发现违法犯罪记录', confidence: 99.8 },
];

const buildReviewHistory = (includeReject: boolean): ReviewRecord[] => {
  const base: ReviewRecord[] = [
    {
      id: 1,
      reviewer: 'OCR自动识别系统',
      review_time: '2025-11-10T09:05:00Z',
      result: 'pass',
      remark: '三证OCR识别完成，置信度98.5%，字段完整度100%',
      type: 'ocr',
    },
    {
      id: 2,
      reviewer: '初审专员-刘芳',
      review_time: '2025-11-11T10:20:00Z',
      result: 'pass',
      remark: '身份证信息核对一致，健康证在有效期内，无犯罪记录证明真实有效。证件照片清晰，与本人照片匹配度高。',
      type: 'manual',
    },
  ];
  if (includeReject) {
    base.push({
      id: 3,
      reviewer: '复核专员-赵明',
      review_time: '2025-11-12T14:30:00Z',
      result: 'reject',
      remark: '健康证照片模糊，有效期字段无法辨认；无犯罪记录证明即将过期，请重新上传。',
      type: 'manual',
    });
    base.push({
      id: 4,
      reviewer: '初审专员-刘芳（复审）',
      review_time: '2025-11-15T11:00:00Z',
      result: 'pass',
      remark: '已重新提交清晰证件，所有字段可辨认，无犯罪记录已更新至最新。',
      type: 'recheck',
    });
  } else {
    base.push({
      id: 3,
      reviewer: '复核专员-赵明',
      review_time: '2025-11-13T16:45:00Z',
      result: 'pass',
      remark: '三证信息交叉验证通过，资料齐全，符合入驻标准。',
      type: 'recheck',
    });
  }
  base.push({
    id: includeReject ? 5 : 4,
    reviewer: '质检专员-王晓梅',
    review_time: '2026-03-10T11:00:00Z',
    result: 'pass',
    remark: '季度资质复查：健康证仍在有效期，无新增犯罪记录，资质保持有效。',
    type: 'recheck',
  });
  return base;
};

const buildCert = (
  id: number,
  workerId: number,
  name: string,
  idNum: string,
  addr: string,
  idExpiry: string,
  healthIssue: string,
  healthExpiry: string,
  crimeIssue: string,
  crimeExpiry: string,
  includeReject: boolean,
  healthConfidenceLow: boolean
): WorkerCert => {
  const healthFields = buildHealthFields(name, healthIssue, healthExpiry);
  if (healthConfidenceLow) {
    const expiryField = healthFields.find((f) => f.label === '有效期至');
    if (expiryField) expiryField.confidence = 42.3;
    const issueField = healthFields.find((f) => f.label === '发证日期');
    if (issueField) issueField.confidence = 55.7;
  }
  return {
    id,
    worker_id: workerId,
    id_card_url: `https://example.com/certs/id-${workerId}.jpg`,
    health_cert_url: `https://example.com/certs/health-${workerId}.jpg`,
    crime_record_url: `https://example.com/certs/crime-${workerId}.jpg`,
    ocr_result: `姓名：${name}，身份证：${idNum}，有效期内`,
    verify_status: includeReject ? 'pending' : 'approved',
    submitted_at: '2025-11-10T08:30:00Z',
    ocr_completed_at: '2025-11-10T09:05:00Z',
    review_completed_at: includeReject ? undefined : '2025-11-13T16:45:00Z',
    ocr_detail: {
      id_card: {
        ocr_time: '2025-11-10T09:01:00Z',
        confidence: 99.2,
        fields: buildIDCardFields(name, idNum, addr, idExpiry),
      },
      health_cert: {
        ocr_time: '2025-11-10T09:03:00Z',
        confidence: healthConfidenceLow ? 72.3 : 96.8,
        fields: healthFields,
      },
      crime_record: {
        ocr_time: '2025-11-10T09:05:00Z',
        confidence: 98.5,
        fields: buildCrimeFields(name, crimeIssue, crimeExpiry),
      },
    },
    review_history: buildReviewHistory(includeReject),
  };
};

const buildScore = (
  id: number,
  workerId: number,
  overall: number,
  punctual: number,
  satisfy: number,
  complaint: number,
  total: number
): WorkerScore => ({
  id,
  worker_id: workerId,
  overall_score: overall,
  punctuality_rate: punctual,
  satisfaction_rate: satisfy,
  complaint_rate: complaint,
  total_orders: total,
  trend: [
    overall - 0.2,
    overall - 0.15,
    overall - 0.1,
    overall - 0.05,
    overall,
    overall + 0.02,
    overall,
  ],
});

interface WorkerState {
  worker: Worker | null;
  cert: WorkerCert | null;
  score: WorkerScore | null;
  workerList: Worker[];
  certMap: Record<number, WorkerCert>;
  scoreMap: Record<number, WorkerScore>;
  setWorker: (worker: Worker | null) => void;
  setCert: (cert: WorkerCert | null) => void;
  setScore: (score: WorkerScore | null) => void;
  setWorkerList: (workers: Worker[]) => void;
  updateWorkerStatus: (status: Worker['status']) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  updateCertStatus: (verifyStatus: WorkerCert['verify_status']) => void;
  getWorkerById: (id: number) => Worker | undefined;
  getCertByWorkerId: (id: number) => WorkerCert | undefined;
  getScoreByWorkerId: (id: number) => WorkerScore | undefined;
}

export const useWorkerStore = create<WorkerState>((set, get) => {
  const baseWorkerList: Worker[] = [
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
    {
      id: 107,
      phone: '13700137007',
      real_name: '陈金英',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Auntie7',
      status: 'verified',
      verified_at: '2024-04-12T09:10:00Z',
      skills: ['育婴师', '婴儿抚触', '早教启蒙', '辅食制作'],
      age: 46,
      experience_years: 7,
    },
  ];

  const certMap: Record<number, WorkerCert> = {
    101: buildCert(
      1, 101, '王秀兰', '110105197901011234',
      '北京市朝阳区建国路88号',
      '2020-05-10 至 长期',
      '2025-11-20', '2026-11-19',
      '2025-12-01', '2026-05-31',
      false, false
    ),
    102: buildCert(
      2, 102, '李桂芳', '110105198206152234',
      '北京市海淀区中关村东路123号',
      '2021-03-15 至 长期',
      '2025-12-10', '2026-12-09',
      '2026-01-05', '2026-07-04',
      false, false
    ),
    103: buildCert(
      3, 103, '张淑珍', '110105197708083345',
      '北京市西城区阜成门内大街45号',
      '2019-08-08 至 长期',
      '2025-10-01', '2026-09-30',
      '2025-11-15', '2026-05-14',
      false, false
    ),
    104: buildCert(
      4, 104, '赵美华', '110105198709124456',
      '北京市丰台区马家堡西路22号',
      '2022-09-12 至 长期',
      '2026-02-18', '2027-02-17',
      '2026-02-20', '2026-08-19',
      true, false
    ),
    105: buildCert(
      5, 105, '刘春梅', '110105197501185567',
      '北京市东城区东直门内大街67号',
      '2018-01-18 至 长期',
      '2025-09-15', '2026-09-14',
      '2025-10-20', '2026-04-19',
      false, false
    ),
    106: buildCert(
      6, 106, '孙丽娟', '110105199002256678',
      '北京市通州区新华大街12号',
      '2023-02-25 至 2033-02-25',
      '2026-01-05', '2027-01-04',
      '2026-01-10', '2026-07-09',
      true, true
    ),
    107: buildCert(
      7, 107, '陈金英', '110105197812107789',
      '北京市石景山区古城大街88号',
      '2020-12-10 至 长期',
      '2025-11-05', '2026-11-04',
      '2025-12-15', '2026-06-14',
      false, false
    ),
  };

  const scoreMap: Record<number, WorkerScore> = {
    101: buildScore(1, 101, 4.8, 98.5, 96.2, 0.8, 326),
    102: buildScore(2, 102, 4.7, 97.0, 95.5, 1.0, 258),
    103: buildScore(3, 103, 4.85, 99.0, 97.8, 0.5, 412),
    104: buildScore(4, 104, 4.2, 92.0, 90.0, 2.5, 56),
    105: buildScore(5, 105, 4.95, 99.5, 99.0, 0.3, 189),
    106: buildScore(6, 106, 3.2, 88.0, 85.0, 5.5, 28),
    107: buildScore(7, 107, 4.9, 99.0, 98.5, 0.2, 301),
  };

  return {
    worker: baseWorkerList[0],
    cert: certMap[101],
    score: scoreMap[101],
    workerList: baseWorkerList,
    certMap,
    scoreMap,
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
    getCertByWorkerId: (id) => get().certMap[id],
    getScoreByWorkerId: (id) => get().scoreMap[id],
  };
});
