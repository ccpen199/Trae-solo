<template>
  <div class="multi-flight">
    <div class="multi-header">
      <span>多程搜索</span>
      <span class="hint">最多添加6段航程</span>
    </div>
    <div class="segments">
      <div 
        v-for="(segment, index) in segments" 
        :key="index" 
        class="segment"
      >
        <div class="segment-header">
          <span>第 {{ index + 1 }} 程</span>
          <button 
            v-if="segments.length > 1" 
            @click="removeSegment(index)"
            class="remove-btn"
          >
            ×
          </button>
        </div>
        <div class="segment-content">
          <CitySelector 
            v-model="segment.from" 
            type="domestic"
          />
          <span class="arrow">→</span>
          <CitySelector 
            v-model="segment.to" 
            type="domestic"
          />
          <DatePicker v-model="segment.date" />
        </div>
      </div>
    </div>
    <div class="multi-footer">
      <button 
        v-if="segments.length < 6" 
        @click="addSegment"
        class="add-btn"
      >
        + 添加航程
      </button>
      <button v-if="segments.length >= 2" @click="search" class="search-btn">
        搜索多程机票
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CitySelector from './CitySelector.vue'
import DatePicker from './DatePicker.vue'

const emit = defineEmits(['search'])

const today = new Date()

const segments = ref([
  {
    from: '北京',
    to: '',
    date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },
  {
    from: '',
    to: '',
    date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }
])

const addSegment = () => {
  if (segments.value.length >= 6) return
  
  const lastSegment = segments.value[segments.value.length - 1]
  const nextDate = new Date(lastSegment.date)
  nextDate.setDate(nextDate.getDate() + 3)
  
  segments.value.push({
    from: lastSegment.to || '',
    to: '',
    date: nextDate.toISOString().split('T')[0]
  })
}

const removeSegment = (index) => {
  if (segments.value.length <= 1) return
  segments.value.splice(index, 1)
}

const search = () => {
  const validSegments = segments.value.filter(s => s.from && s.to && s.date)
  if (validSegments.length < 2) {
    alert('请至少填写2段完整航程')
    return
  }
  emit('search', validSegments)
}
</script>

<style scoped>
.multi-flight {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  padding: 20px;
  margin: 20px auto;
  max-width: 1200px;
}

.multi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.multi-header span:first-child {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.hint {
  font-size: 12px;
  color: #999;
}

.segments {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.segment {
  background: #fafafa;
  border-radius: 8px;
  padding: 15px;
}

.segment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.segment-header span:first-child {
  font-weight: bold;
  color: #ff6c00;
}

.remove-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: #ff4d4f;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.segment-content {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.segment-content > * {
  flex: 1;
  min-width: 120px;
}

.arrow {
  font-size: 24px;
  color: #ff6c00;
  font-weight: bold;
}

.multi-footer {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.add-btn {
  padding: 10px 20px;
  border: 1px dashed #ff6c00;
  background: white;
  color: #ff6c00;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.add-btn:hover {
  background: #fff7f0;
}

.search-btn {
  padding: 10px 30px;
  background: linear-gradient(135deg, #ff6c00 0%, #ff8c42 100%);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
}
</style>