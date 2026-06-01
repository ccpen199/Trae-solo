<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import { storeToRefs } from 'pinia'
import Header from '../components/Header.vue'

const appStore = useAppStore()
const { currentCity, cities } = storeToRefs(appStore)

const showCitySelector = ref(false)

function selectCity(city) {
  appStore.setCity(city)
  showCitySelector.value = false
}

function submitFeedback() {
  alert('反馈已提交，感谢您的建议！')
}
</script>

<template>
  <div class="settings-page">
    <Header />
    
    <main class="main-content">
      <div class="settings-card">
        <h1 class="settings-title">设置</h1>
        
        <div class="settings-group">
          <h2 class="group-title">基本设置</h2>
          
          <div class="setting-item" @click="showCitySelector = true">
            <div class="setting-info">
              <span class="setting-label">当前城市</span>
              <span class="setting-value">{{ currentCity?.name || '未选择' }}</span>
            </div>
            <span class="setting-arrow">→</span>
          </div>
          
          <div v-if="showCitySelector" class="city-selector-popup">
            <div class="city-grid">
              <button 
                v-for="city in cities" 
                :key="city.id"
                class="city-option"
                :class="{ active: currentCity?.id === city.id }"
                @click="selectCity(city)"
              >
                {{ city.name }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="settings-group">
          <h2 class="group-title">意见反馈</h2>
          
          <div class="feedback-form">
            <div class="form-group">
              <label class="form-label">反馈类型</label>
              <select class="form-select">
                <option>功能建议</option>
                <option>Bug反馈</option>
                <option>内容问题</option>
                <option>其他</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">反馈内容</label>
              <textarea class="form-textarea" placeholder="请详细描述您的问题或建议..."></textarea>
            </div>
            
            <div class="form-group">
              <label class="form-label">联系方式（可选）</label>
              <input type="text" class="form-input" placeholder="方便我们联系您" />
            </div>
            
            <button class="btn btn-primary submit-btn" @click="submitFeedback">提交反馈</button>
          </div>
        </div>
        
        <div class="settings-group">
          <h2 class="group-title">关于</h2>
          
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">版本号</span>
              <span class="setting-value">1.0.0</span>
            </div>
          </div>
          
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">帮助中心</span>
            </div>
            <span class="setting-arrow">→</span>
          </div>
          
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">用户协议</span>
            </div>
            <span class="setting-arrow">→</span>
          </div>
          
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">隐私政策</span>
            </div>
            <span class="setting-arrow">→</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.settings-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 16px;
}

.settings-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.settings-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 32px;
}

.settings-group {
  margin-bottom: 32px;
}

.settings-group:last-child {
  margin-bottom: 0;
}

.group-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--primary-color);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.3s;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:hover {
  background: var(--bg-color);
  margin: 0 -24px;
  padding: 16px 24px;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-size: 15px;
  font-weight: 500;
}

.setting-value {
  font-size: 13px;
  color: var(--text-light);
}

.setting-arrow {
  color: var(--text-light);
  font-size: 16px;
}

.city-selector-popup {
  padding: 16px 0;
  background: var(--bg-color);
  margin: 0 -24px;
  padding: 20px 24px;
}

.city-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.city-option {
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.city-option:hover {
  border-color: var(--primary-color);
}

.city-option.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.feedback-form {
  padding: 8px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
}

.form-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  min-height: 120px;
  resize: vertical;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  font-size: 15px;
}
</style>
