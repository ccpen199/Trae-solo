<template>
  <div class="signature-page">
    <h1 class="page-title">电子签收</h1>
    
    <div class="signature-container">
      <div class="order-info" v-if="order">
        <h3>订单信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">订单号</span>
            <span class="value">{{ order.order_no }}</span>
          </div>
          <div class="info-item">
            <span class="label">品类</span>
            <span class="value">{{ getCategoryName(order.category) }}</span>
          </div>
          <div class="info-item">
            <span class="label">送达地址</span>
            <span class="value">{{ order.delivery_address }}</span>
          </div>
          <div class="info-item">
            <span class="label">收件人</span>
            <span class="value">{{ order.delivery_name }}</span>
          </div>
        </div>
      </div>

      <div class="signature-section">
        <h3>电子签名</h3>
        <p class="hint">请在下方区域手写签名</p>
        
        <div class="canvas-wrapper">
          <canvas 
            ref="canvasRef" 
            @mousedown="startDrawing"
            @mousemove="draw"
            @mouseup="stopDrawing"
            @mouseleave="stopDrawing"
            @touchstart="startDrawing"
            @touchmove="draw"
            @touchend="stopDrawing"
          ></canvas>
          <div class="watermark">{{ watermarkText }}</div>
        </div>

        <div class="canvas-actions">
          <button class="btn-secondary" @click="clearCanvas">清除签名</button>
        </div>
      </div>

      <div class="form-section">
        <div class="form-group">
          <label>签收人姓名</label>
          <input type="text" v-model="signerName" class="input" placeholder="请输入签收人姓名">
        </div>
        
        <div class="form-group">
          <label>现场照片（可选）</label>
          <div class="photo-upload">
            <div v-if="photoData" class="photo-preview">
              <img :src="photoData" alt="签收照片">
              <button class="photo-remove" @click="removePhoto">×</button>
            </div>
            <label v-else class="photo-upload-btn">
              <span>📷 拍照/上传</span>
              <input type="file" accept="image/*" @change="handlePhoto" capture="environment" hidden>
            </label>
          </div>
        </div>

        <div class="compliance-notice">
          <p>📋 根据《电子签名法》，本电子签名与手写签名具有同等法律效力。</p>
          <p class="timestamp">签名时间: {{ currentTime }}</p>
        </div>
      </div>

      <div class="submit-section">
        <button class="btn-primary" @click="submitSignature" :disabled="!canSubmit">确认签收</button>
      </div>

      <div v-if="signatureResult" class="result-card">
        <div class="result-icon">✓</div>
        <h3>签收成功</h3>
        <p>签名已保存，具有司法效力</p>
        <div class="result-details">
          <div><span>签收人:</span> {{ signatureResult.signer_name }}</div>
          <div><span>签收时间:</span> {{ signatureResult.timestamp }}</div>
          <div><span>IP地址:</span> {{ signatureResult.ip_address || '本地' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { orderApi } from '@/api'

const route = useRoute()
const canvasRef = ref(null)
const order = ref(null)
const signerName = ref('')
const photoData = ref('')
const signatureResult = ref(null)
const currentTime = ref(new Date().toLocaleString('zh-CN'))

let isDrawing = false
let ctx = null
let lastX = 0
let lastY = 0

const watermarkText = computed(() => {
  return `签收时间: ${new Date().toLocaleString('zh-CN')} | 订单: ${order.value?.order_no || ''}`
})

const canSubmit = computed(() => {
  return signerName.value && hasSignature
})

let hasSignature = false

function getCategoryName(cat) {
  const map = { document: '文件', fresh: '生鲜', pet: '宠物', pharmacy: '药品' }
  return map[cat] || cat
}

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  
  canvas.width = 600
  canvas.height = 300
  ctx = canvas.getContext('2d')
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

function getPos(e) {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

function startDrawing(e) {
  e.preventDefault()
  isDrawing = true
  const pos = getPos(e)
  lastX = pos.x
  lastY = pos.y
}

function draw(e) {
  if (!isDrawing || !ctx) return
  e.preventDefault()
  
  const pos = getPos(e)
  ctx.beginPath()
  ctx.moveTo(lastX, lastY)
  ctx.lineTo(pos.x, pos.y)
  ctx.stroke()
  lastX = pos.x
  lastY = pos.y
  hasSignature = true
}

function stopDrawing() {
  isDrawing = false
}

function clearCanvas() {
  const canvas = canvasRef.value
  if (!ctx || !canvas) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  hasSignature = false
}

function handlePhoto(e) {
  const file = e.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (ev) => {
    photoData.value = ev.target.result
  }
  reader.readAsDataURL(file)
}

function removePhoto() {
  photoData.value = ''
}

async function submitSignature() {
  const canvas = canvasRef.value
  const signatureData = canvas.toDataURL('image/png')
  
  try {
    const res = await orderApi.sign(route.params.orderId, {
      signer_name: signerName.value,
      signature_data: signatureData,
      photo_path: photoData.value || null
    })
    signatureResult.value = res
  } catch (e) {
    alert('签收失败，请重试')
  }
}

let timeInterval
onMounted(async () => {
  const res = await orderApi.get(route.params.orderId)
  order.value = res.data
  
  setTimeout(initCanvas, 100)
  
  timeInterval = setInterval(() => {
    currentTime.value = new Date().toLocaleString('zh-CN')
  }, 1000)
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
})
</script>

<style scoped>
.signature-page { max-width: 800px; margin: 0 auto; }
.page-title { font-size: 28px; margin-bottom: 24px; color: #333; }

.signature-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.order-info {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.order-info h3 { margin-bottom: 16px; font-size: 16px; color: #333; }

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.info-item .label { font-size: 12px; color: #888; }
.info-item .value { font-weight: 600; color: #333; }

.signature-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.signature-section h3 { margin-bottom: 8px; font-size: 16px; color: #333; }
.hint { color: #888; font-size: 13px; margin-bottom: 16px; }

.canvas-wrapper {
  position: relative;
  border: 2px dashed #ccc;
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
}
canvas {
  display: block;
  width: 100%;
  height: 300px;
  cursor: crosshair;
  touch-action: none;
}
.watermark {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 11px;
  color: rgba(0,0,0,0.2);
  pointer-events: none;
}

.canvas-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.form-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.form-group { margin-bottom: 16px; }
.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
}
.input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  width: 100%;
}

.photo-upload {
  display: flex;
  align-items: center;
}
.photo-preview {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
}
.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.photo-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
}
.photo-upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  cursor: pointer;
  color: #888;
  background: #fafafa;
}
.photo-upload-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.compliance-notice {
  margin-top: 20px;
  padding: 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border-left: 4px solid #0ea5e9;
}
.compliance-notice p {
  margin: 0 0 8px 0;
  color: #0c4a6e;
  font-size: 13px;
}
.timestamp {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.submit-section {
  text-align: center;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px 48px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e9ecef;
  color: #333;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.result-card {
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  text-align: center;
}
.result-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #d4edda;
  color: #155724;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
.result-card h3 {
  color: #333;
  margin-bottom: 8px;
}
.result-card p {
  color: #666;
  margin-bottom: 16px;
}
.result-details {
  text-align: left;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}
.result-details div {
  padding: 4px 0;
  font-size: 13px;
}
.result-details span {
  color: #888;
  margin-right: 8px;
}
</style>
