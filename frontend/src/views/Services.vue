<template>
  <div class="mobile-container">
    <div class="header">
      <div class="flex-between">
        <h2 style="font-size: 18px;">服务大厅</h2>
      </div>
      <div class="search-bar" style="margin-top: 12px;">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索服务事项"
          prefix-icon="Search"
          size="large"
          @input="searchServices"
        />
      </div>
    </div>

    <div style="padding: 16px;">
      <div class="gov-card" style="padding: 16px; margin-bottom: 16px;">
        <h3 style="margin-bottom: 16px; color: #333;">服务分类</h3>
        <div class="category-tabs">
          <div 
            v-for="cat in categories" 
            :key="cat.value"
            class="category-item"
            :class="{ active: activeCategory === cat.value }"
            @click="selectCategory(cat.value)"
          >
            <el-icon :size="24">{{ cat.icon }}</el-icon>
            <span>{{ cat.label }}</span>
          </div>
        </div>
      </div>

      <div class="gov-card" style="padding: 16px;">
        <h3 style="margin-bottom: 16px; color: #333;">
          {{ activeCategory ? getCategoryLabel(activeCategory) + '服务' : '全部服务' }}
        </h3>
        <div class="service-list">
          <div 
            v-for="service in services" 
            :key="service.id"
            class="service-list-item"
            @click="goToDetail(service.id)"
          >
            <div class="service-list-icon" :style="{ background: getServiceColor(service.category) }">
              <el-icon :size="22"><Document /></el-icon>
            </div>
            <div class="service-list-info">
              <h4>{{ service.name }}</h4>
              <p>{{ service.department }}</p>
            </div>
            <el-icon color="#ccc"><ArrowRight /></el-icon>
          </div>
        </div>
        <div v-if="services.length === 0" class="empty-state">
          <el-empty description="暂无服务事项" />
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { serviceApi } from '@/api'
import BottomNav from '@/components/BottomNav.vue'
import { 
  Document, OfficeBuilding
} from '@element-plus/icons-vue'

const router = useRouter()
const searchKeyword = ref('')
const activeCategory = ref('')
const services = ref([])

const categories = [
  { label: '全部', value: '', icon: Document },
  { label: '社保', value: '社保', icon: Document },
  { label: '医保', value: '医保', icon: Document },
  { label: '户政', value: '户政', icon: Document },
  { label: '不动产', value: '不动产', icon: Document },
  { label: '公积金', value: '公积金', icon: Document },
  { label: '交通', value: '交通', icon: Document },
  { label: '企业服务', value: '企业', icon: OfficeBuilding }
]

onMounted(() => {
  loadServices()
})

const loadServices = async () => {
  try {
    const res = await serviceApi.getList({ category: activeCategory.value, keyword: searchKeyword.value })
    services.value = res
  } catch (e) {
    services.value = [
      { id: 1, name: '社保查询', category: '社保', department: '省人力资源社会保障厅' },
      { id: 2, name: '医保报销', category: '医保', department: '省医疗保障局' },
      { id: 3, name: '新生儿入户', category: '户政', department: '省公安厅' },
      { id: 4, name: '不动产登记', category: '不动产', department: '省自然资源厅' }
    ]
  }
}

const selectCategory = (cat) => {
  activeCategory.value = cat
  loadServices()
}

const searchServices = () => {
  loadServices()
}

const getCategoryLabel = (value) => {
  const cat = categories.find(c => c.value === value)
  return cat ? cat.label : ''
}

const getServiceColor = (category) => {
  const colors = {
    '社保': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '医保': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    '户政': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    '不动产': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  }
  return colors[category] || '#1e5cb8'
}

const goToDetail = (id) => {
  router.push(`/service/${id}`)
}
</script>

<style scoped>
.search-bar {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 24px;
}

.search-bar :deep(.el-input__wrapper) {
  background: transparent;
  box-shadow: none;
}

.search-bar :deep(.el-input__inner) {
  color: white;
}

.search-bar :deep(.el-input__inner)::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-bar :deep(.el-input__prefix) {
  color: rgba(255, 255, 255, 0.9);
}

.category-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: #f5f7fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 13px;
  color: #666;
}

.category-item:hover,
.category-item.active {
  background: #e6f0ff;
  color: #1e5cb8;
}

.category-item span {
  margin-top: 8px;
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-list-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.service-list-item:hover {
  background: #f0f7ff;
}

.service-list-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 12px;
}

.service-list-info {
  flex: 1;
}

.service-list-info h4 {
  font-size: 15px;
  color: #333;
  margin-bottom: 4px;
}

.service-list-info p {
  font-size: 12px;
  color: #999;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}
</style>
