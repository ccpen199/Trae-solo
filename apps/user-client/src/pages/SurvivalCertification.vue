<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { certificationApi } from '@/api/certification';
import { encryptFeature, hashFeature } from '@/utils/crypto';
import { generateDeviceFingerprint } from '@/utils/deviceFingerprint';
import type { CertificationStatus, LivenessAction } from '@shared/types/certification';
import { LivenessActionMap } from '@shared/types/certification';
import {
  CheckCircle2,
  XCircle,
  Lock,
  Eye,
  MoveDown,
  Mic,
  ArrowLeft,
  ArrowRight,
  Camera,
  PlayCircle,
  RotateCcw,
  AlertTriangle,
} from 'lucide-vue-next';

type Step = 'prepare' | 'liveness' | 'capture' | 'result';
type CaptureSubStage = 'collecting' | 'encrypting' | 'matching' | 'verifying' | 'syncing';

const currentStep = ref<Step>('prepare');
const sessionId = ref('');
const actionSequence = ref<LivenessAction[]>([]);
const currentActionIndex = ref(0);
const certStatus = ref<CertificationStatus | null>(null);
const failReason = ref('');
const matchScore = ref<number | undefined>();
const failCount = ref(0);
const lockExpiresAt = ref<number | undefined>();
const lockCountdown = ref(0);
const processing = ref(false);
const forceFailNext = ref(false);
const captureSubStage = ref<CaptureSubStage>('collecting');
const syncProgress = ref(0);
const auditTrail = ref<Array<{ time: string; stage: string; status: string; detail: string }>>([]);

let lockTimer: ReturnType<typeof setInterval> | null = null;
let syncTimer: ReturnType<typeof setInterval> | null = null;

const steps = [
  { key: 'prepare' as const, label: '准备工作', icon: Camera },
  { key: 'liveness' as const, label: '活体检测', icon: Eye },
  { key: 'capture' as const, label: '人脸比对', icon: Camera },
  { key: 'result' as const, label: '结果反馈', icon: CheckCircle2 },
];

const captureStages: { key: CaptureSubStage; label: string; desc: string }[] = [
  { key: 'collecting', label: '特征采集', desc: '正在采集人脸特征点...' },
  { key: 'encrypting', label: '本地加密', desc: '使用设备指纹密钥加密特征...' },
  { key: 'matching', label: '公安库比对', desc: '与公安身份库进行人脸比对...' },
  { key: 'verifying', label: '活体核验', desc: '综合判定活体与身份一致性...' },
  { key: 'syncing', label: '同步核心系统', desc: '认证结果同步至人社核心系统...' },
];

const currentStepIndex = computed(() => steps.findIndex((s) => s.key === currentStep.value));
const captureStageIndex = computed(() => captureStages.findIndex((s) => s.key === captureSubStage.value));

const currentAction = computed(() => {
  if (currentActionIndex.value < actionSequence.value.length) {
    return actionSequence.value[currentActionIndex.value];
  }
  return null;
});

const actionIconMap: Record<string, any> = {
  BLINK: Eye,
  NOD: MoveDown,
  OPEN_MOUTH: Mic,
  TURN_LEFT: ArrowLeft,
  TURN_RIGHT: ArrowRight,
};

function getStepClass(step: Step): string {
  const idx = steps.findIndex((s) => s.key === step);
  const currentIdx = currentStepIndex.value;
  if (idx < currentIdx) return 'bg-primary text-white';
  if (idx === currentIdx) return 'bg-gov-gradient text-white shadow-md';
  return 'bg-gray-100 text-gray-400';
}

function getStepLineClass(step: Step): string {
  const idx = steps.findIndex((s) => s.key === step);
  const currentIdx = currentStepIndex.value;
  if (idx < currentIdx) return 'bg-primary';
  return 'bg-gray-200';
}

function addAuditLog(stage: string, status: string, detail: string) {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
  auditTrail.value.push({ time, stage, status, detail });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function startCertification() {
  processing.value = true;
  auditTrail.value = [];
  forceFailNext.value = false;
  try {
    const res = await certificationApi.startCertification();
    sessionId.value = res.sessionId;
    actionSequence.value = res.actionSequence;
    currentActionIndex.value = 0;
    addAuditLog('会话创建', '成功', `会话ID: ${res.sessionId.slice(0, 16)}...，动作序列: ${res.actionSequence.length}个动作`);
    currentStep.value = 'liveness';
  } catch (e: any) {
    failReason.value = e?.response?.data?.message || '启动认证失败，请重试';
    addAuditLog('会话创建', '失败', failReason.value);
  } finally {
    processing.value = false;
  }
}

async function simulateLivenessAction() {
  if (!currentAction.value) return;
  const actionName = LivenessActionMap[currentAction.value!];
  addAuditLog('活体检测', '进行中', `正在执行: ${actionName}`);
  await sleep(400);
  addAuditLog('活体检测', '通过', `${actionName} 检测通过`);
  currentActionIndex.value++;
  if (currentActionIndex.value >= actionSequence.value.length) {
    addAuditLog('活体检测', '完成', `全部 ${actionSequence.value.length} 个动作通过`);
    currentStep.value = 'capture';
    startCaptureProcess();
  }
}

async function startCaptureProcess() {
  captureSubStage.value = 'collecting';
  syncProgress.value = 0;
  const featureData = `simulated-feature-${Date.now()}`;
  const encryptedHash = encryptFeature(featureData);
  const deviceFingerprint = generateDeviceFingerprint();
  addAuditLog('特征采集', '完成', `采集 ${actionSequence.value.length} 组特征点`);

  captureSubStage.value = 'encrypting';
  addAuditLog('本地加密', '完成', `AES-256加密完成，密钥指纹: ${deviceFingerprint.slice(0, 12)}...`);

  await sleep(500);
  captureSubStage.value = 'matching';
  addAuditLog('公安库比对', '进行中', `向公安身份库提交比对请求`);
  await sleep(800);
  try {
    for (let i = 0; i < actionSequence.value.length; i++) {
      await certificationApi.submitLiveness({
        sessionId: sessionId.value,
        actionIndex: i,
        actionResult: !forceFailNext.value || i < actionSequence.value.length - 1,
        encryptedFeatureHash: encryptedHash,
        deviceFingerprint,
      });
    }
    addAuditLog('公安库比对', forceFailNext.value ? '失败' : '成功', forceFailNext.value ? '人脸特征相似度低于阈值' : '相似度达标');

    captureSubStage.value = 'verifying';
    await certificationApi.faceMatch({
      sessionId: sessionId.value,
      encryptedFeatureHash: encryptedHash,
    });
    addAuditLog('综合核验', '通过', `活体检测+身份核验双因子通过`);

    captureSubStage.value = 'syncing';
    syncProgress.value = 0;
    syncTimer = setInterval(() => {
      syncProgress.value = Math.min(100, syncProgress.value + 20);
      if (syncProgress.value >= 100 && syncTimer) {
        clearInterval(syncTimer);
        syncTimer = null;
      }
    }, 200);
    addAuditLog('核心系统同步', '进行中', `推送认证结果至人社核心业务库`);

    const result = await certificationApi.getResult(sessionId.value);
    certStatus.value = result.status;
    matchScore.value = result.matchScore;
    failReason.value = result.failReason || '';
    failCount.value = result.failCount || 0;
    lockExpiresAt.value = result.lockExpiresAt;
    await sleep(800);
    addAuditLog('核心系统同步', '成功', `核心系统返回确认，认证记录入库`);

    if (result.status === 'LOCKED' && result.lockExpiresAt) {
      addAuditLog('账号锁定', '触发', `连续失败${result.failCount}次，锁定至${new Date(result.lockExpiresAt).toLocaleString()}`);
      startLockCountdown(result.lockExpiresAt);
    }

    currentStep.value = 'result';
  } catch (e: any) {
    const msg = e?.response?.data?.message || '比对失败';
    certStatus.value = forceFailNext.value ? 'FAILED' : 'FAILED';
    failReason.value = forceFailNext.value ? '人脸特征与公安库匹配度不足（模拟失败）' : msg;
    failCount.value = failCount.value + (forceFailNext.value ? 1 : 1);
    addAuditLog('认证失败', forceFailNext.value ? '模拟触发' : '异常', failReason.value);
    if (failCount.value >= 3) {
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      lockExpiresAt.value = expiresAt;
      certStatus.value = 'LOCKED';
      startLockCountdown(expiresAt);
      addAuditLog('锁定机制', '触发', `已失败${failCount.value}次，账号锁定24小时`);
    }
    currentStep.value = 'result';
  } finally {
    processing.value = false;
    forceFailNext.value = false;
    captureSubStage.value = 'collecting';
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
  }
}

async function simulateFaceMatch() {
  processing.value = true;
  await startCaptureProcess();
}

async function simulateFullCertification(fail = false) {
  processing.value = true;
  auditTrail.value = [];
  forceFailNext.value = fail;
  try {
    const res = await certificationApi.startCertification();
    sessionId.value = res.sessionId;
    actionSequence.value = res.actionSequence;
    addAuditLog('会话创建', '成功', `ID: ${res.sessionId.slice(0, 12)}...`);
    currentActionIndex.value = actionSequence.value.length;
    addAuditLog('活体检测', '完成', `${res.actionSequence.length}个动作通过（快速模式）`);
    currentStep.value = 'capture';
    await startCaptureProcess();
  } catch (e: any) {
    certStatus.value = 'FAILED';
    failReason.value = e?.message || '认证过程异常';
    currentStep.value = 'result';
  } finally {
    processing.value = false;
  }
}

function startLockCountdown(expiresAt: number) {
  lockCountdown.value = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
  lockTimer = setInterval(() => {
    lockCountdown.value--;
    if (lockCountdown.value <= 0) {
      if (lockTimer) clearInterval(lockTimer);
    }
  }, 1000);
}

function resetCertification() {
  currentStep.value = 'prepare';
  sessionId.value = '';
  actionSequence.value = [];
  currentActionIndex.value = 0;
  certStatus.value = null;
  failReason.value = '';
  matchScore.value = undefined;
  failCount.value = 0;
  lockExpiresAt.value = undefined;
  lockCountdown.value = 0;
  if (lockTimer) {
    clearInterval(lockTimer);
    lockTimer = null;
  }
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}分${s.toString().padStart(2, '0')}秒`;
}

onUnmounted(() => {
  if (lockTimer) clearInterval(lockTimer);
});
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">线上生存认证</h1>

    <div class="flex items-center justify-center mb-8">
      <div
        v-for="(step, idx) in steps"
        :key="step.key"
        class="flex items-center"
      >
        <div class="flex flex-col items-center">
          <div
            :class="['w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all', getStepClass(step.key)]"
          >
            {{ idx + 1 }}
          </div>
          <span class="text-xs mt-1.5 text-gray-500 whitespace-nowrap">{{ step.label }}</span>
        </div>
        <div
          v-if="idx < steps.length - 1"
          :class="['w-12 sm:w-20 h-0.5 mx-1', getStepLineClass(step.key)]"
        />
      </div>
    </div>

    <div class="mb-5">
      <div class="card-base p-4">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-semibold text-gray-700">安全状态</p>
          <span class="text-xs text-gray-400">连续失败3次将锁定24小时</span>
        </div>
        <div class="flex items-center gap-1 mb-2">
          <div v-for="i in 3" :key="i" class="flex-1 h-3 rounded-full overflow-hidden">
            <div
              class="h-full transition-all duration-500"
              :class="i <= failCount ? (failCount >= 3 ? 'bg-danger' : 'bg-amber-400') : 'bg-gray-100'"
            />
          </div>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-gray-500">已失败 <strong :class="failCount >= 3 ? 'text-danger' : 'text-amber-600'">{{ failCount }}</strong>/3 次</span>
          <span v-if="failCount > 0" class="text-amber-600">
            还可尝试 {{ 3 - failCount }} 次
          </span>
          <span v-else class="text-success">安全</span>
        </div>
      </div>
      <div v-if="certStatus === 'LOCKED'" class="mt-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
        <Lock class="w-5 h-5 text-danger mt-0.5 flex-shrink-0" />
        <div class="flex-1">
          <p class="font-semibold text-danger text-sm">认证已临时锁定</p>
          <p class="text-xs text-red-600 mt-1">连续失败已达上限，解锁倒计时：</p>
          <p class="text-xl font-bold text-danger tabular-nums mt-1">{{ formatCountdown(lockCountdown) }}</p>
        </div>
      </div>
    </div>

    <div v-if="currentStep === 'prepare'" class="card-base p-8">
      <div class="text-center mb-6">
        <div class="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
          <Camera class="w-10 h-10 text-primary" />
        </div>
        <h2 class="text-xl font-semibold text-gray-800 mb-2">准备工作</h2>
        <p class="text-sm text-gray-500">完成以下准备后即可开始认证</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-w-lg mx-auto">
        <div class="p-3 rounded-xl bg-blue-50 border border-blue-100">
          <p class="text-sm font-medium text-gray-700 mb-1">✅ 环境要求</p>
          <p class="text-xs text-gray-500">光线充足均匀，无强烈逆光</p>
        </div>
        <div class="p-3 rounded-xl bg-blue-50 border border-blue-100">
          <p class="text-sm font-medium text-gray-700 mb-1">✅ 姿态要求</p>
          <p class="text-xs text-gray-500">正对摄像头，面部完整可见</p>
        </div>
        <div class="p-3 rounded-xl bg-blue-50 border border-blue-100">
          <p class="text-sm font-medium text-gray-700 mb-1">❌ 请勿遮挡</p>
          <p class="text-xs text-gray-500">摘除帽子、墨镜、口罩等</p>
        </div>
        <div class="p-3 rounded-xl bg-blue-50 border border-blue-100">
          <p class="text-sm font-medium text-gray-700 mb-1">🔒 隐私安全</p>
          <p class="text-xs text-gray-500">生物特征本地加密，不上传服务器</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-3">
        <button class="btn-primary" :disabled="processing || certStatus === 'LOCKED'" @click="startCertification">
          <span class="flex items-center gap-2">
            <PlayCircle class="w-5 h-5" />
            开始认证
          </span>
        </button>
        <button
          class="btn-outline text-sm"
          :disabled="processing || certStatus === 'LOCKED'"
          @click="simulateFullCertification(false)"
        >
          一键通过（演示）
        </button>
        <button
          class="px-4 py-2.5 text-sm font-medium rounded-btn bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-40"
          :disabled="processing || certStatus === 'LOCKED'"
          @click="simulateFullCertification(true)"
        >
          模拟认证失败
        </button>
      </div>
      <p class="text-center text-xs text-gray-400 mt-5">点击「模拟认证失败」可体验失败锁定机制</p>
    </div>

    <div v-if="currentStep === 'liveness'" class="card-base p-6">
      <h2 class="text-xl font-semibold text-gray-800 mb-5 text-center">活体检测</h2>

      <div class="relative mx-auto w-64 h-80 bg-gray-900 rounded-2xl overflow-hidden mb-6">
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-48 h-64 border-2 border-accent/50 rounded-[50%] flex items-center justify-center">
            <div class="w-40 h-56 border border-accent/20 rounded-[50%]" />
          </div>
        </div>

        <div class="absolute top-0 left-0 right-0 h-1 bg-accent/30 scan-line" />

        <div class="absolute bottom-4 left-0 right-0 text-center">
          <div class="inline-flex items-center gap-2 bg-accent/20 text-white text-sm px-4 py-2 rounded-full pulse-ring">
            <component :is="actionIconMap[currentAction || 'BLINK']" class="w-4 h-4" />
            {{ currentAction ? LivenessActionMap[currentAction] : '检测中...' }}
          </div>
        </div>

        <div class="absolute top-4 right-4 flex gap-1">
          <span class="w-2 h-2 rounded-full bg-danger animate-pulse" />
          <span class="text-xs text-white/60">REC</span>
        </div>
      </div>

      <div class="flex items-center justify-center gap-2 mb-3">
        <span
          v-for="(act, idx) in actionSequence"
          :key="idx"
          :class="[
            'px-2 py-1 rounded-full text-xs transition-all',
            idx < currentActionIndex ? 'bg-green-100 text-green-700' :
            idx === currentActionIndex ? 'bg-primary text-white pulse-ring' : 'bg-gray-100 text-gray-400',
          ]"
        >
          {{ idx + 1 }}.{{ LivenessActionMap[act] }}
        </span>
      </div>

      <p class="text-center text-sm text-gray-500 mb-5">
        进度 {{ currentActionIndex }}/{{ actionSequence.length }} 个动作
      </p>

      <div class="flex justify-center gap-3">
        <button
          class="btn-primary text-sm"
          :disabled="processing || !currentAction"
          @click="simulateLivenessAction"
        >
          完成当前动作（模拟）
        </button>
      </div>
    </div>

    <div v-if="currentStep === 'capture'" class="card-base p-6">
      <div class="text-center mb-6">
        <div class="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4 relative">
          <Camera class="w-10 h-10 text-accent" />
          <span v-if="captureSubStage !== 'syncing'" class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-accent flex items-center justify-center">
            <span class="text-[10px] text-accent font-bold">{{ captureStageIndex + 1 }}/5</span>
          </span>
          <span v-else class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-accent flex items-center justify-center">
            <span class="text-[10px] text-accent font-bold">{{ syncProgress }}%</span>
          </span>
        </div>
        <h2 class="text-xl font-semibold text-gray-800 mb-2">人脸比对</h2>
        <p class="text-sm text-gray-500">{{ captureStages[captureStageIndex]?.desc }}</p>
      </div>

      <div class="space-y-2 max-w-md mx-auto mb-6">
        <div
          v-for="(stage, idx) in captureStages"
          :key="stage.key"
          class="flex items-center gap-3 p-3 rounded-xl border transition-all"
          :class="idx < captureStageIndex
            ? 'border-green-200 bg-green-50'
            : idx === captureStageIndex
              ? 'border-primary-200 bg-primary-50'
              : 'border-gray-100 bg-gray-50'"
        >
          <div
            :class="[
              'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
              idx < captureStageIndex ? 'bg-success text-white' :
              idx === captureStageIndex ? 'bg-primary text-white pulse-ring' : 'bg-gray-200 text-gray-400',
            ]"
          >
            <CheckCircle2 v-if="idx < captureStageIndex" class="w-4 h-4" />
            <span v-else class="text-xs font-medium">{{ idx + 1 }}</span>
          </div>
          <div class="flex-1">
            <p
              class="text-sm font-medium"
              :class="idx <= captureStageIndex ? 'text-gray-800' : 'text-gray-400'"
            >
              {{ stage.label }}
            </p>
            <p
              v-if="idx === captureStageIndex && stage.key === 'syncing'"
              class="mt-1 h-1.5 bg-primary-100 rounded-full overflow-hidden"
            >
              <span class="block h-full bg-primary rounded-full transition-all duration-200" :style="{ width: syncProgress + '%' }" />
            </p>
          </div>
        </div>
      </div>

      <div class="text-center">
        <button
          class="btn-primary text-sm"
          :disabled="processing"
          @click="simulateFaceMatch"
        >
          {{ processing ? '处理中...' : '确认采集（模拟）' }}
        </button>
      </div>
    </div>

    <div v-if="currentStep === 'result'" class="space-y-5">
      <div class="card-base p-6 text-center">
        <div v-if="certStatus === 'SUCCESS'" class="space-y-4">
          <div class="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto">
            <CheckCircle2 class="w-10 h-10 text-success" />
          </div>
          <h2 class="text-xl font-semibold text-success">认证通过</h2>
          <p class="text-sm text-gray-500">您的生存认证已通过审核</p>
          <div class="flex justify-center gap-8 pt-2">
            <div>
              <p class="text-xs text-gray-400">人脸匹配度</p>
              <p class="text-lg font-bold text-primary tabular-nums">{{ matchScore ? (matchScore * 100).toFixed(1) : '--' }}%</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">会话编号</p>
              <p class="text-xs font-mono text-gray-600">{{ sessionId.slice(0, 12) }}...</p>
            </div>
          </div>
          <div class="mt-4 p-3 rounded-xl bg-green-50 border border-green-100 max-w-md mx-auto">
            <p class="text-xs text-green-700">✅ 认证结果已实时同步至人社核心业务系统</p>
          </div>
        </div>

        <div v-else-if="certStatus === 'FAILED'" class="space-y-4">
          <div class="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <XCircle class="w-10 h-10 text-danger" />
          </div>
          <h2 class="text-xl font-semibold text-danger">认证未通过</h2>
          <p class="text-sm text-gray-500">{{ failReason || '人脸比对未通过' }}</p>
          <div class="mt-3 flex justify-center gap-8">
            <div>
              <p class="text-xs text-gray-400">失败次数</p>
              <p class="text-lg font-bold text-amber-600 tabular-nums">{{ failCount }}/3 次</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">剩余尝试</p>
              <p class="text-lg font-bold text-success tabular-nums">{{ Math.max(0, 3 - failCount) }} 次</p>
            </div>
          </div>
          <button class="btn-primary mt-3" @click="resetCertification">
            <span class="flex items-center gap-2">
              <RotateCcw class="w-4 h-4" />
              重新认证
            </span>
          </button>
        </div>

        <div v-else-if="certStatus === 'LOCKED'" class="space-y-4">
          <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <Lock class="w-10 h-10 text-gray-500" />
          </div>
          <h2 class="text-xl font-semibold text-gray-700">认证已锁定</h2>
          <p class="text-sm text-gray-500">连续认证失败次数过多，请稍后再试</p>
          <div class="inline-block p-5 rounded-2xl bg-red-50 border border-red-200">
            <p class="text-xs text-red-600 mb-1">解锁倒计时</p>
            <p class="text-2xl font-bold text-danger tabular-nums">{{ formatCountdown(lockCountdown) }}</p>
          </div>
          <p class="text-xs text-gray-400 pt-1">连续失败3次自动锁定24小时</p>
        </div>
      </div>

      <div v-if="auditTrail.length" class="card-base p-5">
        <h3 class="text-sm font-semibold text-gray-800 mb-3">📋 操作审计留痕</h3>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="(log, idx) in auditTrail"
            :key="idx"
            class="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50"
          >
            <span class="text-[10px] text-gray-400 font-mono flex-shrink-0 mt-0.5">{{ log.time }}</span>
            <span
              class="px-2 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
              :class="log.status.includes('成功') || log.status.includes('通过') || log.status.includes('完成')
                ? 'bg-green-100 text-green-700'
                : log.status.includes('失败') || log.status.includes('触发')
                  ? 'bg-red-100 text-red-700'
                  : log.status.includes('进行中')
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'"
            >
              {{ log.status }}
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-gray-700">{{ log.stage }}</p>
              <p class="text-[11px] text-gray-500 truncate">{{ log.detail }}</p>
            </div>
          </div>
        </div>
        <p class="text-[10px] text-gray-400 mt-3 pt-3 border-t border-gray-100 text-right">
          所有操作已同步至审计日志系统，可追溯、不可篡改
        </p>
      </div>

      <div v-if="certStatus === 'SUCCESS'" class="flex justify-center">
        <button class="btn-outline text-sm" @click="resetCertification">
          <span class="flex items-center gap-2">
            <RotateCcw class="w-4 h-4" />
            再次认证
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
