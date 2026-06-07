<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">风格偏好</h2>
      <p class="page-subtitle">选择您喜欢的婚礼风格</p>
    </div>

    <el-card class="card-shadow">
      <div class="style-grid">
        <div
          v-for="style in styles"
          :key="style.name"
          class="style-item"
          :class="{ active: selectedStyles.includes(style.name) }"
          @click="toggleStyle(style.name)"
        >
          <div class="style-icon">{{ style.icon }}</div>
          <div class="style-name">{{ style.name }}</div>
          <el-icon v-if="selectedStyles.includes(style.name)" class="check-icon"><CircleCheck /></el-icon>
        </div>
      </div>
      <div style="margin-top: 20px; text-align: center;">
        <el-button type="primary" @click="savePreferences">保存偏好</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'
import { ElMessage } from 'element-plus'

const styles = [
  { name: 'ins风', icon: '📷' },
  { name: '中式传统', icon: '🏮' },
  { name: '森系', icon: '🌲' },
  { name: '极简', icon: '⚪' },
  { name: '欧式', icon: '🏰' },
  { name: '韩式', icon: '💐' },
  { name: '复古', icon: '📼' },
  { name: '海洋', icon: '🌊' },
  { name: '星空', icon: '✨' },
  { name: '花园', icon: '🌸' },
  { name: '工业风', icon: '🏭' },
  { name: '波西米亚', icon: '🎨' }
]

const selectedStyles = ref([])

async function loadPreferences() {
  try {
    const res = await api.get('/couple/profile')
    if (res.data?.style_tags) {
      selectedStyles.value = res.data.style_tags
    }
  } catch (e) {
    console.error(e)
  }
}

function toggleStyle(name) {
  const index = selectedStyles.value.indexOf(name)
  if (index > -1) {
    selectedStyles.value.splice(index, 1)
  } else {
    selectedStyles.value.push(name)
  }
}

async function savePreferences() {
  try {
    await api.put('/couple/profile', { style_tags: selectedStyles.value })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  loadPreferences()
})
</script>

<style scoped lang="scss">
.style-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.style-item {
  position: relative;
  padding: 30px 20px;
  background: #f5f7fa;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  &.active {
    border-color: #ff6b9d;
    background: #fff0f5;
  }
  
  .style-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }
  
  .style-name {
    font-size: 16px;
    color: #303133;
    font-weight: 500;
  }
  
  .check-icon {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 24px;
    color: #ff6b9d;
  }
}
</style>
