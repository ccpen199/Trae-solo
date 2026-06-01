<template>
  <div class="add-device">
    <div class="container">
      <div class="page-header">
        <button class="btn btn-secondary back-btn" @click="$router.back()">← 返回</button>
        <h2>添加设备</h2>
      </div>

      <div class="section">
        <div class="section-header">
          <h3 class="section-title">
            <span class="virtual-icon">✨</span>
            虚拟设备
            <span class="badge-new">新</span>
          </h3>
        </div>
        <p class="section-desc">无需实物，立即体验智能家居的强大功能</p>
        
        <div class="device-templates">
          <div
            v-for="template in templates"
            :key="template.template_id"
            class="template-card card virtual-device"
            @click="addDevice(template.template_id)"
          >
            <div class="template-icon">{{ template.icon }}</div>
            <div class="template-name">{{ template.name }}</div>
            <div class="template-action">点击添加</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h3 class="section-title">真实设备</h3>
        </div>
        <p class="section-desc">连接您家中的真实智能设备</p>
        
        <div class="device-templates">
          <div class="template-card card disabled">
            <div class="template-icon">🔌</div>
            <div class="template-name">更多设备</div>
            <div class="template-action">敬请期待</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const templates = ref([])

const fetchTemplates = async () => {
  try {
    const res = await fetch('/api/devices/templates')
    const data = await res.json()
    if (data.success) {
      templates.value = data.data
    }
  } catch (e) {
    console.error('Failed to fetch templates:', e)
  }
}

const addDevice = async (templateId) => {
  try {
    const res = await fetch(`/api/devices/virtual/${templateId}`, { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      alert('设备添加成功！')
      router.push('/')
    } else {
      alert('添加失败：' + (data.error || '未知错误'))
    }
  } catch (e) {
    console.error('Failed to add device:', e)
    alert('添加失败，请重试')
  }
}

onMounted(() => {
  fetchTemplates()
})
</script>

<style scoped>
.add-device {
  min-height: 100vh;
  background: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.back-btn {
  display: flex;
  align-items: center;
  padding: 8px 16px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.section {
  margin-bottom: 40px;
}

.section-header {
  margin-bottom: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.virtual-icon {
  font-size: 20px;
}

.badge-new {
  background: #ff6700;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: normal;
}

.section-desc {
  color: #666;
  font-size: 14px;
  margin: 0 0 20px 0;
}

.device-templates {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.template-card {
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  padding: 24px 16px;
}

.template-card:hover:not(.disabled) {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.template-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.template-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.template-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.template-action {
  font-size: 13px;
  color: #ff6700;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.btn {
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background: #d0d0d0;
}
</style>
