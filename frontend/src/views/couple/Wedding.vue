<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">婚礼倒计时</h2>
      <p class="page-subtitle">记录您的重要时刻</p>
    </div>

    <el-card class="card-shadow">
      <el-form :model="form" label-width="120px" style="max-width: 600px; margin: 0 auto;">
        <el-form-item label="新郎姓名">
          <el-input v-model="form.groom_name" placeholder="请输入新郎姓名" />
        </el-form-item>
        <el-form-item label="新娘姓名">
          <el-input v-model="form.partner_name" placeholder="请输入新娘姓名" />
        </el-form-item>
        <el-form-item label="婚礼日期">
          <el-date-picker v-model="form.wedding_date" type="date" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="婚礼地点">
          <el-input v-model="form.location" placeholder="请输入婚礼地点" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveProfile">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="form.wedding_date" class="card-shadow" style="margin-top: 20px;">
      <template #header>倒计时展示</template>
      <div class="countdown-display">
        <div class="countdown-item">
          <div class="countdown-value">{{ days }}</div>
          <div class="countdown-label">天</div>
        </div>
        <div class="countdown-item">
          <div class="countdown-value">{{ hours }}</div>
          <div class="countdown-label">时</div>
        </div>
        <div class="countdown-item">
          <div class="countdown-value">{{ minutes }}</div>
          <div class="countdown-label">分</div>
        </div>
        <div class="countdown-item">
          <div class="countdown-value">{{ seconds }}</div>
          <div class="countdown-label">秒</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const form = reactive({
  groom_name: '',
  partner_name: '',
  wedding_date: '',
  location: ''
})

const days = ref(0)
const hours = ref(0)
const minutes = ref(0)
const seconds = ref(0)
let timer = null

function updateCountdown() {
  if (!form.wedding_date) return
  const target = dayjs(form.wedding_date)
  const now = dayjs()
  const diff = target.diff(now)
  
  if (diff > 0) {
    days.value = Math.floor(diff / (1000 * 60 * 60 * 24))
    hours.value = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    minutes.value = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    seconds.value = Math.floor((diff % (1000 * 60)) / 1000)
  }
}

async function loadProfile() {
  try {
    const res = await api.get('/couple/profile')
    if (res.data) {
      form.partner_name = res.data.partner_name || ''
      form.wedding_date = res.data.wedding_date || ''
      form.location = res.data.location || ''
    }
  } catch (e) {
    console.error(e)
  }
}

async function saveProfile() {
  try {
    await api.put('/couple/profile', form)
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  loadProfile()
  timer = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped lang="scss">
.countdown-display {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 40px 0;
  
  .countdown-item {
    text-align: center;
    
    .countdown-value {
      font-size: 64px;
      font-weight: 700;
      color: #ff6b9d;
      line-height: 1;
    }
    
    .countdown-label {
      font-size: 16px;
      color: #606266;
      margin-top: 10px;
    }
  }
}
</style>
