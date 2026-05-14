<template>
  <div class="city-selector">
    <input 
      type="text" 
      :value="modelValue"
      @input="handleInput"
      @focus="showDropdown = true"
      @blur="handleBlur"
      placeholder="请输入城市"
      class="city-input"
    />
    <div v-if="showDropdown" class="city-dropdown">
      <div v-if="searchKeyword" class="dropdown-section">
        <div class="section-header">搜索结果</div>
        <div 
          v-for="city in searchResults" 
          :key="city.id" 
          class="dropdown-item"
          @click="selectCity(city)"
        >
          <span class="city-name">{{ city.name }}</span>
          <span class="city-pinyin">{{ city.pinyin }}</span>
          <span class="city-region">{{ city.region }}</span>
        </div>
        <div v-if="searchResults.length === 0" class="no-result">未找到匹配城市</div>
      </div>
      <div class="dropdown-section">
        <div class="section-header">热门城市</div>
        <div class="hot-cities">
          <div 
            v-for="city in hotCities" 
            :key="city.id" 
            class="hot-city-item"
            @click="selectCity(city)"
          >
            {{ city.name }}
          </div>
        </div>
      </div>
      <div v-if="type === 'international'" class="dropdown-section">
        <div class="section-header">热门目的地</div>
        <div class="hot-cities">
          <div 
            v-for="city in internationalCities" 
            :key="city.id" 
            class="hot-city-item"
            @click="selectCity(city)"
          >
            {{ city.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const props = defineProps({
  modelValue: String,
  type: {
    type: String,
    default: 'domestic'
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

const showDropdown = ref(false)
const searchKeyword = ref('')
const allCities = ref([])
const hotCities = ref([])

const searchResults = computed(() => {
  if (!searchKeyword.value) return []
  return allCities.value.filter(city => 
    city.name.includes(searchKeyword.value) ||
    city.pinyin.includes(searchKeyword.value.toLowerCase()) ||
    city.pinyin_first.includes(searchKeyword.value.toLowerCase())
  ).slice(0, 8)
})

const internationalCities = computed(() => {
  return allCities.value.filter(c => c.type === 'international').slice(0, 8)
})

const handleInput = (e) => {
  searchKeyword.value = e.target.value
}

const handleBlur = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

const selectCity = (city) => {
  emit('update:modelValue', city.name)
  emit('select', city)
  showDropdown.value = false
  searchKeyword.value = ''
}

onMounted(async () => {
  try {
    const [citiesRes, hotRes] = await Promise.all([
      axios.get('/api/cities', { params: { type: props.type } }),
      axios.get('/api/hot-cities', { params: { type: props.type } })
    ])
    allCities.value = citiesRes.data.data
    hotCities.value = hotRes.data.data
  } catch (error) {
    console.error('获取城市数据失败:', error)
  }
})
</script>

<style scoped>
.city-selector {
  position: relative;
}

.city-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s;
}

.city-input:focus {
  border-color: #ff6c00;
}

.city-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 5px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
}

.dropdown-section {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.dropdown-section:last-child {
  border-bottom: none;
}

.section-header {
  font-size: 12px;
  color: #999;
  margin-bottom: 10px;
  padding-left: 5px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 15px;
  cursor: pointer;
  transition: background 0.3s;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.city-name {
  font-weight: 500;
  color: #333;
}

.city-pinyin {
  color: #999;
  font-size: 12px;
}

.city-region {
  margin-left: auto;
  color: #999;
  font-size: 12px;
}

.no-result {
  padding: 20px;
  text-align: center;
  color: #999;
}

.hot-cities {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-city-item {
  padding: 8px 16px;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.hot-city-item:hover {
  background: #ff6c00;
  color: white;
}
</style>