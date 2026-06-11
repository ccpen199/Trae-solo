import { create } from 'zustand'

type Step = 'home' | 'verify' | 'result'
type Status = 'idle' | 'verifying' | 'success' | 'failed'
type ComparisonStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'retrying'
type ServiceCallStatus = 'idle' | 'dialing' | 'connected' | 'transferring' | 'completed' | 'failed' | 'no_answer' | 'busy'

interface CertData {
  certNo: string
  certTime: string
  deviceFingerprint: string
  validUntil: string
  name: string
  idCard: string
}

interface UserInfo {
  name: string
  idCard: string
  socialSecurityNo: string
  bankName: string
  bankAccount: string
  pensionType: string
  region: string
}

interface CacheEntry {
  id: string
  type: string
  timestamp: string
  status: string
  size: string
}

interface RetryLog {
  id: string
  attempt: number
  maxAttempts: number
  triggerTime: string
  reason: string
  result: string
  duration: string
}

interface SubmitReceipt {
  submitId: string
  submitTime: string
  status: string
  serverAck: string
  certificationId: string
}

interface ProvinceSyncReceipt {
  syncId: string
  syncTime: string
  status: string
  coreSystemRef: string
  dataHash: string
  confirmCode: string
}

interface ComparisonQueueItem {
  id: string
  source: string
  submitTime: string
  status: ComparisonStatus
  matchResult: string
  refCode: string
  completedTime: string
  retryCount: number
  maxRetries: number
  lastError: string
  manualReviewId: string
  manualReviewResult: string
  manualReviewTime: string
  manualReviewer: string
}

interface ServiceRecord {
  id: string
  callTime: string
  hotline: string
  status: ServiceCallStatus
  agent: string
  workOrderId: string
  result: string
  callbackPhone: string
  callbackTime: string
  failureReason: string
  callDuration: string
  callAttempts: ServiceCallAttempt[]
}

interface ServiceCallAttempt {
  attempt: number
  time: string
  result: 'success' | 'no_answer' | 'busy' | 'failed'
  duration: string
}

interface OfflineResumeRecord {
  id: string
  timestamp: string
  cachedFrames: number
  networkStatus: string
  resumeStatus: string
  resumeTime: string
  result: string
}

interface CredentialReviewRecord {
  id: string
  certNo: string
  reviewTime: string
  reviewer: string
  result: string
  notes: string
  deviceFingerprint: string
  ip: string
}

interface VoiceGuideLog {
  id: string
  step: string
  text: string
  timestamp: string
  played: boolean
}

interface CertStore {
  step: Step
  status: Status
  certData: CertData | null
  error: string | null
  idCard: string
  name: string
  userInfo: UserInfo
  voiceEnabled: boolean
  cacheEntries: CacheEntry[]
  retryLogs: RetryLog[]
  submitReceipt: SubmitReceipt | null
  provinceSyncReceipt: ProvinceSyncReceipt | null
  comparisonQueue: ComparisonQueueItem[]
  serviceRecord: ServiceRecord | null
  lastCertPipeline: { step: string; status: string; detail: string; time: string }[]
  offlineResumeRecords: OfflineResumeRecord[]
  credentialReviews: CredentialReviewRecord[]
  voiceGuideLogs: VoiceGuideLog[]
  reset: () => void
  setStep: (step: Step) => void
  setStatus: (status: Status) => void
  setCertData: (data: CertData | null) => void
  setError: (error: string | null) => void
  setIdCard: (id: string) => void
  setName: (name: string) => void
  setUserInfo: (info: Partial<UserInfo>) => void
  toggleVoice: () => void
  setCacheEntries: (entries: CacheEntry[]) => void
  setRetryLogs: (logs: RetryLog[]) => void
  setSubmitReceipt: (receipt: SubmitReceipt | null) => void
  setProvinceSyncReceipt: (receipt: ProvinceSyncReceipt | null) => void
  setComparisonQueue: (queue: ComparisonQueueItem[]) => void
  setServiceRecord: (record: ServiceRecord | null) => void
  setLastCertPipeline: (pipeline: { step: string; status: string; detail: string; time: string }[]) => void
  setOfflineResumeRecords: (records: OfflineResumeRecord[]) => void
  setCredentialReviews: (reviews: CredentialReviewRecord[]) => void
  setVoiceGuideLogs: (logs: VoiceGuideLog[]) => void
}

const defaultUserInfo: UserInfo = {
  name: '张建国',
  idCard: '370102195508123215',
  socialSecurityNo: 'SD370102195508',
  bankName: '中国工商银行',
  bankAccount: '**** **** **** 6218',
  pensionType: '企业退休人员基本养老金',
  region: '济南市',
}

const defaultCacheEntries: CacheEntry[] = [
  { id: 'CE001', type: '人脸检测帧', timestamp: '2026-06-09 09:15:23', status: '已缓存', size: '128KB' },
  { id: 'CE002', type: '活体检测-眨眼帧', timestamp: '2026-06-09 09:15:25', status: '已缓存', size: '132KB' },
  { id: 'CE003', type: '活体检测-转头帧', timestamp: '2026-06-09 09:15:27', status: '已缓存', size: '126KB' },
  { id: 'CE004', type: '认证提交数据包', timestamp: '2026-06-09 09:15:28', status: '已提交', size: '386KB' },
]

const defaultRetryLogs: RetryLog[] = [
  { id: 'RL001', attempt: 1, maxAttempts: 3, triggerTime: '2026-06-09 09:15:28', reason: '网络超时(3000ms)', result: '失败', duration: '3.2s' },
  { id: 'RL002', attempt: 2, maxAttempts: 3, triggerTime: '2026-06-09 09:15:32', reason: '连接重置', result: '失败', duration: '2.8s' },
  { id: 'RL003', attempt: 3, maxAttempts: 3, triggerTime: '2026-06-09 09:15:35', reason: '自动重试', result: '成功', duration: '1.5s' },
]

const defaultSubmitReceipt: SubmitReceipt = {
  submitId: 'SUB-20260609-091536',
  submitTime: '2026-06-09 09:15:36',
  status: '已确认接收',
  serverAck: 'ACK-7A3F8B2E',
  certificationId: 'CERT-20260609-370102',
}

const defaultProvinceSyncReceipt: ProvinceSyncReceipt = {
  syncId: 'SYNC-SD-20260609-091537',
  syncTime: '2026-06-09 09:15:37',
  status: '同步成功',
  coreSystemRef: 'CORE-REF-37010220260609',
  dataHash: 'SHA256:4F8A2C...E91B',
  confirmCode: 'CONF-202606090915',
}

const defaultComparisonQueue: ComparisonQueueItem[] = [
  {
    id: 'CQ001', source: '公安人口库', submitTime: '2026-06-09 09:15:38',
    status: 'completed', matchResult: '身份信息一致', refCode: 'GA-REF-20260609-003721',
    completedTime: '2026-06-09 09:18:42', retryCount: 0, maxRetries: 3,
    lastError: '', manualReviewId: '', manualReviewResult: '', manualReviewTime: '', manualReviewer: '',
  },
  {
    id: 'CQ002', source: '卫健委死亡信息库', submitTime: '2026-06-09 09:15:38',
    status: 'completed', matchResult: '未发现死亡记录', refCode: 'WJW-REF-20260609-005183',
    completedTime: '2026-06-09 09:20:15', retryCount: 1, maxRetries: 3,
    lastError: '首次查询超时，已自动重试', manualReviewId: '', manualReviewResult: '', manualReviewTime: '', manualReviewer: '',
  },
  {
    id: 'CQ003', source: '公安人口库(历史比对)', submitTime: '2026-06-08 14:30:00',
    status: 'failed', matchResult: '比对失败', refCode: 'GA-REF-20260608-002156',
    completedTime: '', retryCount: 3, maxRetries: 3,
    lastError: '接口返回数据格式异常', manualReviewId: 'MR-20260608-001',
    manualReviewResult: '人工确认身份有效', manualReviewTime: '2026-06-08 15:10:00', manualReviewer: '审核员 王丽华',
  },
  {
    id: 'CQ004', source: '卫健委死亡信息库(增量)', submitTime: '2026-06-09 09:21:00',
    status: 'processing', matchResult: '比对中', refCode: 'WJW-REF-20260609-006789',
    completedTime: '', retryCount: 0, maxRetries: 3,
    lastError: '', manualReviewId: '', manualReviewResult: '', manualReviewTime: '', manualReviewer: '',
  },
]

const defaultOfflineResumeRecords: OfflineResumeRecord[] = [
  { id: 'OR001', timestamp: '2026-06-09 09:15:28', cachedFrames: 3, networkStatus: '断网', resumeStatus: '已续传', resumeTime: '2026-06-09 09:15:35', result: '续传成功，数据已完整提交' },
  { id: 'OR002', timestamp: '2026-06-09 09:15:40', cachedFrames: 1, networkStatus: '弱网', resumeStatus: '已续传', resumeTime: '2026-06-09 09:15:42', result: '增量数据已补充提交' },
]

const defaultCredentialReviews: CredentialReviewRecord[] = [
  { id: 'CR001', certNo: 'CERT-20260609-370102', reviewTime: '2026-06-09 09:20:00', reviewer: '系统自动', result: '凭证有效', notes: '时间戳、设备指纹、认证编号校验通过', deviceFingerprint: 'DF-A7F3B2C9E1', ip: '119.188.72.xxx' },
]

const defaultVoiceGuideLogs: VoiceGuideLog[] = [
  { id: 'VG001', step: '首页', text: '欢迎进入养老待遇资格认证系统，请核对您的身份信息后点击开始认证', timestamp: '2026-06-09 09:15:00', played: true },
  { id: 'VG002', step: '人脸检测', text: '请将面部对准屏幕中央的框内，保持正面朝向', timestamp: '2026-06-09 09:15:20', played: true },
  { id: 'VG003', step: '活体检测', text: '请缓慢眨眼两次', timestamp: '2026-06-09 09:15:24', played: true },
  { id: 'VG004', step: '活体检测', text: '请缓慢向左转头，再向右转头', timestamp: '2026-06-09 09:15:26', played: true },
  { id: 'VG005', step: '身份比对', text: '正在比对您的身份信息，请稍候', timestamp: '2026-06-09 09:15:30', played: true },
  { id: 'VG006', step: '凭证生成', text: '认证通过，正在生成电子凭证', timestamp: '2026-06-09 09:15:35', played: true },
  { id: 'VG007', step: '认证结果', text: '恭喜您，认证成功！电子凭证已生成，认证结果已同步至省级核心业务系统', timestamp: '2026-06-09 09:15:37', played: true },
]

const defaultLastCertPipeline = [
  { step: '人脸识别', status: '已完成', detail: '检测到1张人脸，置信度98.7%', time: '09:15:23' },
  { step: '活体检测', status: '已完成', detail: '眨眼检测通过，转头检测通过', time: '09:15:27' },
  { step: '身份比对', status: '已完成', detail: '社保库匹配通过，姓名+证件号一致', time: '09:15:34' },
  { step: '凭证生成', status: '已签发', detail: '电子凭证已生成，含时间戳与设备指纹', time: '09:15:36' },
]

export const useCertStore = create<CertStore>((set) => ({
  step: 'home',
  status: 'success',
  certData: {
    certNo: 'CERT-20260609-370102',
    certTime: '2026-06-09 09:15:36',
    deviceFingerprint: 'DF-A7F3B2C9E1',
    validUntil: '2027-06-09',
    name: '张建国',
    idCard: '370***********3215',
  },
  error: null,
  idCard: '370102195508123215',
  name: '张建国',
  userInfo: defaultUserInfo,
  voiceEnabled: true,
  cacheEntries: defaultCacheEntries,
  retryLogs: defaultRetryLogs,
  submitReceipt: defaultSubmitReceipt,
  provinceSyncReceipt: defaultProvinceSyncReceipt,
  comparisonQueue: defaultComparisonQueue,
  serviceRecord: null,
  lastCertPipeline: defaultLastCertPipeline,
  offlineResumeRecords: defaultOfflineResumeRecords,
  credentialReviews: defaultCredentialReviews,
  voiceGuideLogs: defaultVoiceGuideLogs,
  reset: () => set({ step: 'home', status: 'idle', certData: null, error: null, idCard: '', name: '' }),
  setStep: (step) => set({ step }),
  setStatus: (status) => set({ status }),
  setCertData: (certData) => set({ certData }),
  setError: (error) => set({ error }),
  setIdCard: (idCard) => set({ idCard }),
  setName: (name) => set({ name }),
  setUserInfo: (info) => set((s) => ({ userInfo: { ...s.userInfo, ...info } })),
  toggleVoice: () => set((s) => ({ voiceEnabled: !s.voiceEnabled })),
  setCacheEntries: (cacheEntries) => set({ cacheEntries }),
  setRetryLogs: (retryLogs) => set({ retryLogs }),
  setSubmitReceipt: (submitReceipt) => set({ submitReceipt }),
  setProvinceSyncReceipt: (provinceSyncReceipt) => set({ provinceSyncReceipt }),
  setComparisonQueue: (comparisonQueue) => set({ comparisonQueue }),
  setServiceRecord: (serviceRecord) => set({ serviceRecord }),
  setLastCertPipeline: (lastCertPipeline) => set({ lastCertPipeline }),
  setOfflineResumeRecords: (offlineResumeRecords) => set({ offlineResumeRecords }),
  setCredentialReviews: (credentialReviews) => set({ credentialReviews }),
  setVoiceGuideLogs: (voiceGuideLogs) => set({ voiceGuideLogs }),
}))
