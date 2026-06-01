<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { $message } from '../utils/request'

const router = useRouter()

const inputQRId = ref('')
const loading = ref(false)
const qrCodes = ref([
  { id: '', label: '张三的收款码 (示例)', amount: null },
  { id: '', label: '李四的收款码 (示例)', amount: 99.00 },
])

async function simulateScan(qrId) {
  if (!qrId) {
    $message.show('请先生成收款码获取二维码ID')
    return
  }
  
  loading.value = true
  try {
    await api.getQRCode(qrId)
    router.push(`/pay/${qrId}`)
  } catch (e) {
    $message.show('二维码无效或已过期')
  } finally {
    loading.value = false
  }
}

function manualScan() {
  if (!inputQRId.value.trim()) {
    $message.show('请输入二维码ID')
    return
  }
  simulateScan(inputQRId.value.trim())
}

onMounted(async () => {
  try {
    const list = []
    for (const userId of ['user_001', 'user_002']) {
      const latest = await api.getLatestQRCode(userId)
      if (latest) {
        list.push({
          id: latest.id,
          label: `${userId === 'user_001' ? '张三' : '李四'}的收款码`,
          amount: latest.amount
        })
      } else {
        const newQR = await api.generateQRCode({ userId })
        list.push({
          id: newQR.id,
          label: `${userId === 'user_001' ? '张三' : '李四'}的收款码`,
          amount: newQR.amount
        })
      }
    }
    qrCodes.value = list
  } catch (e) {}
})
</script>

<template>
  <div class="scan h-full flex flex-col">
    <div class="navbar flex items-center p-16 bg-white">
      <button class="text-18" @click="router.back()">←</button>
      <span class="text-18 font-medium ml-12">扫一扫</span>
    </div>
    
    <div class="content flex-1 p-16">
      <div class="camera-placeholder card mb-24">
        <div class="flex flex-col items-center justify-center h-250">
          <div class="text-48 mb-16">📷</div>
          <div class="text-14 text-secondary">模拟扫码 - 选择下方收款码</div>
        </div>
      </div>
      
      <div class="card mb-24">
        <h4 class="text-14 font-medium mb-12">选择收款码</h4>
        <div class="space-y-12">
          <button 
            v-for="(qr, index) in qrCodes"
            :key="index"
            class="w-full flex items-center justify-between p-12 border rounded-lg text-left"
            :disabled="loading"
            :class="{ 'opacity-50': loading }"
            @click="simulateScan(qr.id)"
          >
            <div class="flex-1">
              <div class="text-16 font-medium">👤 {{ qr.label }}</div>
              <div v-if="qr.amount" class="text-14 text-primary mt-4">
                固定金额 ¥{{ qr.amount.toFixed(2) }}
              </div>
              <div v-else class="text-14 text-secondary mt-4">
                自定义金额
              </div>
            </div>
            <span class="text-20">→</span>
          </button>
        </div>
      </div>
      
      <div class="card">
        <h4 class="text-14 font-medium mb-12">手动输入二维码ID</h4>
        <div class="flex gap-12">
          <input 
            v-model="inputQRId"
            type="text"
            placeholder="输入二维码ID"
            class="input flex-1"
          />
          <button 
            class="btn btn-primary"
            :disabled="loading || !inputQRId.trim()"
            @click="manualScan"
          >
            <span v-if="loading" class="loading"></span>
            <span v-else>确认</span>
          </button>
        </div>
      </div>
      
      <div class="mt-24 text-center text-14 text-secondary">
        <p>提示: 先在收钱页面生成收款码，再到这里扫码付款</p>
        <p class="mt-8">可以用两个浏览器标签模拟不同用户</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.p-16 {
  padding: 16px;
}

.p-12 {
  padding: 12px;
}

.mb-24 {
  margin-bottom: 24px;
}

.mb-12 {
  margin-bottom: 12px;
}

.mt-4 {
  margin-top: 4px;
}

.mt-8 {
  margin-top: 8px;
}

.mt-24 {
  margin-top: 24px;
}

.ml-12 {
  margin-left: 12px;
}

.navbar {
  border-bottom: 1px solid var(--border);
}

.h-250 {
  height: 250px;
}

.text-48 {
  font-size: 48px;
}

.text-20 {
  font-size: 20px;
}

.space-y-12 > * + * {
  margin-top: 12px;
}

.border {
  border: 1px solid var(--border);
}

.rounded-lg {
  border-radius: 8px;
}
</style>
