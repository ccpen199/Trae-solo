<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  initialSeconds: number
  autoStart?: boolean
}>()

const emit = defineEmits<{
  (e: 'tick', remaining: number): void
  (e: 'finish'): void
}>()

const remainingSeconds = ref(props.initialSeconds)
const isRunning = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const formattedTime = computed(() => {
  const hours = Math.floor(remainingSeconds.value / 3600)
  const minutes = Math.floor((remainingSeconds.value % 3600) / 60)
  const seconds = remainingSeconds.value % 60
  return {
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
    total: remainingSeconds.value
  }
})

const progress = computed(() => {
  if (props.initialSeconds <= 0) return 0
  return (remainingSeconds.value / props.initialSeconds) * 100
})

function start() {
  if (isRunning.value || remainingSeconds.value <= 0) return
  isRunning.value = true
  timer = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--
      emit('tick', remainingSeconds.value)
    } else {
      stop()
      emit('finish')
    }
  }, 1000)
}

function stop() {
  isRunning.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function reset(newSeconds?: number) {
  stop()
  remainingSeconds.value = newSeconds ?? props.initialSeconds
}

watch(
  () => props.initialSeconds,
  (val) => {
    remainingSeconds.value = val
  }
)

onMounted(() => {
  if (props.autoStart) {
    start()
  }
})

onUnmounted(() => {
  stop()
})

defineExpose({
  start,
  stop,
  reset,
  remainingSeconds
})
</script>

<template>
  <div class="countdown-timer">
    <div class="progress-ring">
      <svg viewBox="0 0 100 100">
        <circle class="bg" cx="50" cy="50" r="45" />
        <circle
          class="progress"
          cx="50"
          cy="50"
          r="45"
          :stroke-dasharray="283"
          :stroke-dashoffset="283 * (1 - progress / 100)"
        />
      </svg>
      <div class="time-display">
        <div class="time-value">
          <span class="num">{{ formattedTime.hours }}</span>
          <span class="sep">:</span>
          <span class="num">{{ formattedTime.minutes }}</span>
          <span class="sep">:</span>
          <span class="num">{{ formattedTime.seconds }}</span>
        </div>
        <div class="time-label">剩余时间</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.countdown-timer {
  display: flex;
  justify-content: center;
  align-items: center;

  .progress-ring {
    position: relative;
    width: 200px;
    height: 200px;

    svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);

      .bg {
        fill: none;
        stroke: #ebeef5;
        stroke-width: 6;
      }

      .progress {
        fill: none;
        stroke: #409eff;
        stroke-width: 6;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.5s linear;
      }
    }

    .time-display {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;

      .time-value {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;

        .num {
          font-size: 28px;
          font-weight: 700;
          color: #303133;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .sep {
          font-size: 24px;
          font-weight: 700;
          color: #409eff;
          animation: blink 1s infinite;
        }
      }

      .time-label {
        font-size: 14px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
</style>
