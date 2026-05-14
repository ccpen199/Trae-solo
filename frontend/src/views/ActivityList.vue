<template>
  <div class="activity-list-page">
    <div class="filter-section">
      <div class="container">
        <div class="search-bar">
          <input 
            v-model="keyword" 
            type="text" 
            placeholder="搜索活动名称、类型或关键词"
            class="search-input"
          />
          <button @click="search" class="search-btn">搜索</button>
        </div>

        <div class="filter-row">
          <div class="filter-item">
            <label>城市</label>
            <select v-model="filters.city" @change="loadActivities">
              <option value="">全部城市</option>
              <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
            </select>
          </div>

          <div class="filter-item">
            <label>类型</label>
            <select v-model="filters.type" @change="handleTypeChange">
              <option value="">全部类型</option>
              <option v-for="type in activityTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
            </select>
          </div>

          <div class="filter-item" v-if="showSubType">
            <label>细分类型</label>
            <select v-model="filters.sub_type" @change="loadActivities">
              <option value="">全部细分</option>
              <option v-for="sub in currentSubTypes" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
            </select>
          </div>

          <div class="filter-item">
            <label>排序</label>
            <select v-model="filters.sort_by" @change="loadActivities">
              <option value="popular">最受欢迎</option>
              <option value="rating">好评优先</option>
              <option value="price_low">低价优先</option>
              <option value="price_high">高价优先</option>
            </select>
          </div>
        </div>

        <div class="date-filter">
          <label>时间范围（近6个月）</label>
          <div class="date-inputs">
            <el-date-picker
              v-model="filters.start_date"
              type="date"
              :picker-options="startDatePickerOptions"
              placeholder="开始日期"
              :default-value="new Date()"
              class="date-picker"
            />
            <span>至</span>
            <el-date-picker
              v-model="filters.end_date"
              type="date"
              :picker-options="endDatePickerOptions"
              placeholder="结束日期"
              class="date-picker"
            />
          </div>
          <button @click="loadActivities" class="apply-btn">应用筛选</button>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="section-header">
        <h2>活动列表</h2>
        <span class="count">共 {{ total }} 个活动</span>
      </div>

      <div v-if="loading" class="loading">加载中...</div>

      <div v-else-if="activities.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>暂无满足条件的活动</p>
      </div>

      <div v-else class="activity-grid">
        <div 
          v-for="activity in activities" 
          :key="activity.id" 
          class="activity-card"
          @click="goToDetail(activity.id)"
        >
          <div class="activity-image">
            <img :src="activity.images[0] || 'https://via.placeholder.com/300x200'" :alt="activity.name" />
            <span v-if="activity.is_free" class="free-badge">免费</span>
          </div>
          <div class="activity-info">
            <h3>{{ activity.name }}</h3>
            <div class="tags">
              <span v-for="tag in activity.tags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</span>
            </div>
            <div class="meta">
              <span class="location">{{ activity.city }} · {{ activity.location }}</span>
            </div>
            <div class="stats">
              <span class="duration">{{ activity.duration }}</span>
              <span class="participants">{{ activity.current_participants }}/{{ activity.max_participants }}人</span>
            </div>
            <div class="bottom">
              <span class="price">{{ activity.is_free ? '免费' : `¥${activity.price}` }}</span>
              <span class="rating">⭐ {{ activity.rating }} ({{ activity.review_count }})</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!loading && activities.length > 0" class="pagination">
        <button 
          @click="prevPage" 
          :disabled="currentPage === 1" 
          class="page-btn"
        >上一页</button>
        <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
        <button 
          @click="nextPage" 
          :disabled="currentPage >= totalPages" 
          class="page-btn"
        >下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { activityAPI } from '../api'

const router = useRouter()
const keyword = ref('')
const activities = ref([])
const loading = ref(false)
const currentPage = ref(1)
const total = ref(0)
const totalPages = ref(0)
const cities = ref([])
const activityTypes = ref([])
const subTypes = ref({})

const filters = ref({
  city: '',
  type: '',
  sub_type: '',
  sort_by: 'popular',
  start_date: '',
  end_date: ''
})

const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const maxDate = computed(() => {
  const date = new Date()
  date.setMonth(date.getMonth() + 6)
  return date.toISOString().split('T')[0]
})

const showSubType = computed(() => filters.value.type === 'local')

const currentSubTypes = computed(() => subTypes.value[filters.value.type] || [])

const startDatePickerOptions = computed(() => ({
  disabledDate: (time) => {
    const max = new Date(maxDate.value)
    return time.getTime() > max.getTime()
  }
}))

const endDatePickerOptions = computed(() => ({
  disabledDate: (time) => {
    const min = filters.value.start_date ? new Date(filters.value.start_date) : new Date(minDate.value)
    const max = new Date(maxDate.value)
    return time.getTime() < min.getTime() || time.getTime() > max.getTime()
  }
}))

const loadActivities = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      per_page: 12,
      keyword: keyword.value,
      ...filters.value
    }
    const res = await activityAPI.getActivities(params)
    activities.value = res.data.activities
    total.value = res.data.total
    totalPages.value = res.data.pages
  } catch (error) {
    console.error('获取活动失败:', error)
    alert('网络不佳，请稍后重试')
  } finally {
    loading.value = false
  }
}

const search = () => {
  currentPage.value = 1
  loadActivities()
}

const handleTypeChange = () => {
  filters.value.sub_type = ''
  currentPage.value = 1
  loadActivities()
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadActivities()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadActivities()
  }
}

const goToDetail = (id) => {
  router.push(`/activities/${id}`)
}

onMounted(async () => {
  try {
    const [typesRes, citiesRes] = await Promise.all([
      activityAPI.getActivityTypes(),
      activityAPI.getCities()
    ])
    activityTypes.value = typesRes.data.types
    subTypes.value = typesRes.data.sub_types
    cities.value = citiesRes.data
  } catch (error) {
    console.error('初始化数据失败:', error)
  }
  loadActivities()
})

watch(keyword, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.activity-list-page {
  padding-bottom: 100px;
}

.filter-section {
  background: #f8f9fa;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.search-btn {
  background: #FF6B6B;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
}

.filter-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-item label {
  font-size: 12px;
  color: #666;
}

.filter-item select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-width: 120px;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.date-filter label {
  font-size: 12px;
  color: #666;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-picker {
  width: 150px;
}

.apply-btn {
  background: #FF8E53;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 24px;
  color: #333;
}

.count {
  color: #999;
  font-size: 14px;
}

.loading {
  text-align: center;
  padding: 50px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.empty-state p {
  color: #999;
  font-size: 16px;
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.activity-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s;
}

.activity-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.activity-image {
  position: relative;
  height: 180px;
}

.activity-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.free-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #FF6B6B;
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.activity-info {
  padding: 15px;
}

.activity-info h3 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tags {
  display: flex;
  gap: 5px;
  margin-bottom: 10px;
}

.tag {
  background: #ffe4e1;
  color: #FF6B6B;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.meta {
  margin-bottom: 10px;
}

.location {
  font-size: 13px;
  color: #666;
}

.stats {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
}

.duration, .participants {
  font-size: 12px;
  color: #999;
}

.bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-size: 18px;
  font-weight: bold;
  color: #FF6B6B;
}

.rating {
  font-size: 13px;
  color: #f39c12;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
}

@media (max-width: 768px) {
  .activity-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .filter-row {
    flex-direction: column;
  }
}
</style>