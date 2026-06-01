<template>
  <div class="advance-page">
    <van-nav-bar title="申请垫付" left-arrow @click-left="$router.back()" />

    <div class="batch-info">
      <div class="batch-title">{{ batchInfo.batchNo }}</div>
      <div class="batch-amount">可垫付金额：¥{{ batchInfo.availableAmount }}</div>
    </div>

    <van-form>
      <van-cell-group inset>
        <van-field
          v-model="form.amount"
          type="number"
          label="垫付金额"
          placeholder="请输入垫付金额"
          :rules="[{ required: true, message: '请输入垫付金额' }]"
        />
      </van-cell-group>
    </van-form>

    <div class="section-title">人脸识别验证</div>
    <div class="face-verify">
      <div v-if="!showCamera && !form.faceVerified" class="face-icon">
        👤
      </div>
      <div v-if="showCamera && !form.faceVerified" class="camera-container">
        <video ref="videoRef" autoplay playsinline class="camera-video"></video>
        <canvas ref="canvasRef" class="camera-canvas"></canvas>
      </div>
      <div v-if="form.faceVerified" class="face-icon verified">
        ✅
      </div>
      <div class="face-actions">
        <van-button
          v-if="!showCamera && !form.faceVerified"
          type="primary"
          size="small"
          @click="startCamera"
        >
          开始验证
        </van-button>
        <van-button
          v-if="showCamera && !form.faceVerified"
          type="primary"
          size="small"
          @click="captureFace"
        >
          拍照验证
        </van-button>
        <van-button
          v-if="showCamera && !form.faceVerified"
          size="small"
          @click="stopCamera"
        >
          取消
        </van-button>
        <van-button
          v-if="form.faceVerified"
          size="small"
          disabled
        >
          已验证
        </van-button>
      </div>
    </div>

    <div class="section-title">合同签署</div>
    <div class="contract-box">
      <h4>《佣金垫付借款合同》</h4>
      <div class="contract-content">
        <p>借款金额：¥{{ form.amount || 0 }}</p>
        <p>借款用途：佣金垫付</p>
        <p>还款方式：佣金到账后自动还款</p>
        <p>违约责任：如逾期还款，将按日收取罚息...</p>
      </div>
      <van-checkbox v-model="form.contractSigned" class="contract-check">
        我已阅读并同意以上合同条款
      </van-checkbox>
    </div>

    <div class="section-title">个人签字授权</div>
    <div class="signature-box" @click="openSignature">
      <div v-if="form.signature" class="signature-preview">✍️ 已签署</div>
      <div v-else class="signature-placeholder">点击此处进行签名</div>
    </div>

    <div class="button-wrap">
      <van-button
        type="primary"
        round
        block
        size="large"
        :disabled="!canSubmit"
        @click="submitApply"
      >
        确认提交申请
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { checkAdvance, submitAdvance } from '../api'
import { showToast, showDialog } from 'vant'

const props = defineProps({
  batchId: { type: String, default: '1' }
})

const router = useRouter()
const batchInfo = ref({ availableAmount: 0, batchNo: '' })
const form = ref({
  amount: '',
  faceVerified: false,
  contractSigned: false,
  signature: ''
})

const showCamera = ref(false)
const videoRef = ref(null)
const canvasRef = ref(null)
let mediaStream = null

const canSubmit = computed(() => {
  return form.value.amount &&
         form.value.faceVerified &&
         form.value.contractSigned &&
         form.value.signature
})

onMounted(async () => {
  try {
    const res = await checkAdvance({
      batchId: props.batchId,
      amount: 0
    })
    if (res.canApply) {
      batchInfo.value = res.batchInfo
    }
  } catch (e) {
    console.error(e)
  }
})

onUnmounted(() => {
  stopCamera()
})

const startCamera = async () => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('您的浏览器不支持摄像头功能')
      return
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    })

    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      showCamera.value = true
    }
  } catch (err) {
    console.error('摄像头调用失败:', err)
    if (err.name === 'NotAllowedError') {
      showToast('请允许摄像头权限')
    } else if (err.name === 'NotFoundError') {
      showToast('未检测到摄像头设备')
    } else {
      showToast('摄像头启动失败：' + err.message)
    }
  }
}

const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  showCamera.value = false
}

const captureFace = () => {
  if (!videoRef.value || !canvasRef.value) return

  const video = videoRef.value
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let brightness = 0
  for (let i = 0; i < imageData.data.length; i += 4) {
    brightness += (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3
  }
  brightness = brightness / (imageData.data.length / 4)

  if (brightness > 30) {
    showToast('人脸识别通过')
    form.value.faceVerified = true
    stopCamera()
  } else {
    showToast('未检测到人脸，请调整位置')
  }
}

const openSignature = () => {
  showDialog({
    title: '手写签名',
    message: '请在下方区域进行手写签名（模拟）',
    confirmButtonText: '模拟签署'
  }).then(() => {
    form.value.signature = 'signed_' + Date.now()
    showToast('签名成功')
  })
}

const submitApply = async () => {
  try {
    await submitAdvance({
      batchId: props.batchId,
      amount: parseFloat(form.value.amount),
      faceVerified: form.value.faceVerified,
      contractSigned: form.value.contractSigned,
      signature: form.value.signature
    })
    showToast('申请提交成功')
    setTimeout(() => {
      router.push('/home')
    }, 1000)
  } catch (e) {
    console.error(e)
  }
}
</script>

<style scoped>
.advance-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
}

.batch-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 16px;
  padding: 20px;
  border-radius: 12px;
  color: white;
}

.batch-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.batch-amount {
  font-size: 14px;
  opacity: 0.9;
}

.section-title {
  padding: 16px 16px 8px;
  font-size: 15px;
  font-weight: 500;
  color: #323233;
}

.face-verify {
  background: white;
  margin: 0 16px;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.camera-container {
  position: relative;
  width: 100%;
  max-width: 280px;
  border-radius: 8px;
  overflow: hidden;
  background: #000;
}

.camera-video {
  width: 100%;
  display: block;
}

.camera-canvas {
  display: none;
}

.face-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
}

.face-icon.verified {
  background: #e8f5e8;
}

.face-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.contract-box {
  background: white;
  margin: 0 16px;
  border-radius: 12px;
  padding: 20px;
}

.contract-box h4 {
  font-size: 15px;
  color: #323233;
  text-align: center;
  margin-bottom: 16px;
}

.contract-content {
  background: #f7f8fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.contract-content p {
  font-size: 14px;
  color: #646566;
  margin-bottom: 8px;
}

.contract-check {
  font-size: 14px;
}

.signature-box {
  background: white;
  margin: 0 16px;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  border: 2px dashed #ddd;
}

.signature-preview {
  font-size: 16px;
  color: #67c23a;
}

.signature-placeholder {
  font-size: 14px;
  color: #969799;
}

.button-wrap {
  position: fixed;
  bottom: 30px;
  left: 16px;
  right: 16px;
}
</style>
