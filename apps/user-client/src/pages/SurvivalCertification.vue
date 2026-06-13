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

let lockTimer: ReturnType<typeof setInterval> | null = null;

const steps = [
  { key: 'prepare' as const, label: '准备工作', icon: Camera },
  { key: 'liveness' as const, label: '活体检测', icon: Eye },
  { key: 'capture' as const, label: '人脸采集', icon: Camera },
  { key: 'result' as const, label: '结果反馈', icon: CheckCircle2 },
];

const currentStepIndex = computed(() => steps.findIndex((s) => s.key === currentStep.value));

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

async function startCertification() {
  processing.value = true;
  try {
    const res = await certificationApi.startCertification();
    sessionId.value = res.sessionId;
    actionSequence.value = res.actionSequence;
    currentActionIndex.value = 0;
    currentStep.value = 'liveness';
  } catch {
    failReason.value = '启动认证失败，请重试';
  } finally {
    processing.value = false;
  }
}

function simulateLivenessAction() {
  if (!currentAction.value) return;
  currentActionIndex.value++;
  if (currentActionIndex.value >= actionSequence.value.length) {
    currentStep.value = 'capture';
  }
}

async function simulateFaceMatch() {
  processing.value = true;
  try {
    const featureData = `simulated-feature-${Date.now()}`;
    const encryptedHash = encryptFeature(featureData);
    const featureHash = hashFeature(featureData);
    const deviceFingerprint = generateDeviceFingerprint();

    for (let i = 0; i < actionSequence.value.length; i++) {
      await certificationApi.submitLiveness({
        sessionId: sessionId.value,
        actionIndex: i,
        actionResult: true,
        encryptedFeatureHash: encryptedHash,
        deviceFingerprint,
      });
    }

    await certificationApi.faceMatch({
      sessionId: sessionId.value,
      encryptedFeatureHash: encryptedHash,
    });

    const result = await certificationApi.getResult(sessionId.value);
    certStatus.value = result.status;
    matchScore.value = result.matchScore;
    failReason.value = result.failReason || '';
    failCount.value = result.failCount || 0;
    lockExpiresAt.value = result.lockExpiresAt;

    if (result.status === 'LOCKED' && result.lockExpiresAt) {
      startLockCountdown(result.lockExpiresAt);
    }

    currentStep.value = 'result';
  } catch {
    certStatus.value = 'FAILED';
    failReason.value = '网络异常，请重试';
    currentStep.value = 'result';
  } finally {
    processing.value = false;
  }
}

async function simulateFullCertification() {
  processing.value = true;
  try {
    const res = await certificationApi.startCertification();
    sessionId.value = res.sessionId;
    actionSequence.value = res.actionSequence;

    const featureData = `simulated-feature-${Date.now()}`;
    const encryptedHash = encryptFeature(featureData);
    const deviceFingerprint = generateDeviceFingerprint();

    for (let i = 0; i < res.actionSequence.length; i++) {
      await certificationApi.submitLiveness({
        sessionId: res.sessionId,
        actionIndex: i,
        actionResult: true,
        encryptedFeatureHash: encryptedHash,
        deviceFingerprint,
      });
    }

    await certificationApi.faceMatch({
      sessionId: res.sessionId,
      encryptedFeatureHash: encryptedHash,
    });

    const result = await certificationApi.getResult(res.sessionId);
    certStatus.value = result.status;
    matchScore.value = result.matchScore;
    failReason.value = result.failReason || '';
    failCount.value = result.failCount || 0;
    lockExpiresAt.value = result.lockExpiresAt;

    if (result.status === 'LOCKED' && result.lockExpiresAt) {
      startLockCountdown(result.lockExpiresAt);
    }

    currentStep.value = 'result';
  } catch {
    certStatus.value = 'FAILED';
    failReason.value = '认证过程异常';
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

    <div v-if="failCount > 0 && certStatus !== 'LOCKED'" class="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-btn flex items-center gap-2">
      <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0" />
      <span class="text-sm text-amber-700">您已失败 {{ failCount }} 次，连续失败3次将锁定认证30分钟</span>
    </div>

    <div v-if="currentStep === 'prepare'" class="card-base p-8 text-center">
      <div class="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-6">
        <Camera class="w-10 h-10 text-primary" />
      </div>
      <h2 class="text-xl font-semibold text-gray-800 mb-3">准备工作</h2>
      <div class="text-sm text-gray-500 space-y-2 mb-8 max-w-sm mx-auto text-left">
        <p>1. 请确保环境光线充足、均匀</p>
        <p>2. 请正对摄像头，保持面部完整可见</p>
        <p>3. 请勿佩戴帽子、墨镜等遮挡物</p>
        <p>4. 认证过程中请按提示完成指定动作</p>
      </div>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button class="btn-primary" :disabled="processing" @click="startCertification">
          <span class="flex items-center gap-2">
            <PlayCircle class="w-5 h-5" />
            开始认证
          </span>
        </button>
        <button
          class="btn-outline text-sm"
          :disabled="processing"
          @click="simulateFullCertification"
        >
          模拟认证（演示）
        </button>
      </div>
    </div>

    <div v-if="currentStep === 'liveness'" class="card-base p-8">
      <h2 class="text-xl font-semibold text-gray-800 mb-6 text-center">活体检测</h2>

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

      <div class="flex items-center justify-center gap-2 mb-4">
        <span
          v-for="(_, idx) in actionSequence"
          :key="idx"
          :class="[
            'w-2.5 h-2.5 rounded-full transition-all',
            idx < currentActionIndex ? 'bg-success' :
            idx === currentActionIndex ? 'bg-accent pulse-ring' : 'bg-gray-200',
          ]"
        />
      </div>

      <p class="text-center text-sm text-gray-500 mb-4">
        请完成 {{ currentActionIndex + 1 }}/{{ actionSequence.length }} 个动作
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

    <div v-if="currentStep === 'capture'" class="card-base p-8 text-center">
      <div class="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
        <Camera class="w-10 h-10 text-accent" />
      </div>
      <h2 class="text-xl font-semibold text-gray-800 mb-3">人脸采集</h2>
      <p class="text-sm text-gray-500 mb-6">活体检测已通过，正在进行人脸特征采集与比对</p>
      <button
        class="btn-primary"
        :disabled="processing"
        @click="simulateFaceMatch"
      >
        {{ processing ? '采集中...' : '确认采集（模拟）' }}
      </button>
    </div>

    <div v-if="currentStep === 'result'" class="card-base p-8 text-center">
      <div v-if="certStatus === 'SUCCESS'" class="space-y-4">
        <div class="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto">
          <CheckCircle2 class="w-10 h-10 text-success" />
        </div>
        <h2 class="text-xl font-semibold text-success">认证通过</h2>
        <p class="text-sm text-gray-500">您的生存认证已通过审核</p>
        <p v-if="matchScore" class="text-xs text-gray-400">
          人脸匹配度：{{ (matchScore * 100).toFixed(1) }}%
        </p>
      </div>

      <div v-else-if="certStatus === 'FAILED'" class="space-y-4">
        <div class="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <XCircle class="w-10 h-10 text-danger" />
        </div>
        <h2 class="text-xl font-semibold text-danger">认证未通过</h2>
        <p class="text-sm text-gray-500">{{ failReason || '人脸比对未通过' }}</p>
        <p class="text-xs text-amber-500">已失败 {{ failCount }} 次</p>
        <button class="btn-primary mt-2" @click="resetCertification">
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
        <p class="text-lg font-bold text-danger tabular-nums">
          {{ formatCountdown(lockCountdown) }}
        </p>
        <p class="text-xs text-gray-400">锁定解除后可重新认证</p>
      </div>
    </div>
  </div>
</template>
