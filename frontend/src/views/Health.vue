<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../store/user'
import request from '../utils/request'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const userStore = useUserStore()

const loading = ref(true)
const error = ref('')
const pets = ref([])
const records = ref([])
const selectedPetId = ref(null)
const showAddModal = ref(false)
const submitting = ref(false)

const newRecord = ref({
  pet_id: null,
  title: '',
  content: '',
  tags: '',
  record_date: dayjs().format('YYYY-MM-DD'),
  type: 'normal'
})

const typeOptions = [
  { value: 'normal', label: '日常记录' },
  { value: 'vaccine', label: '疫苗接种' },
  { value: 'deworming', label: '驱虫记录' },
  { value: 'illness', label: '生病就医' },
  { value: 'surgery', label: '手术记录' },
  { value: 'checkup', label: '体检记录' }
]

const fetchPets = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await request.get('/pets')
    pets.value = res.data || []
    if (pets.value.length > 0) {
      selectedPetId.value = route.query.petId ? parseInt(route.query.petId) : pets.value[0].id
      newRecord.value.pet_id = selectedPetId.value
      fetchRecords()
    } else {
      loading.value = false
    }
  } catch (err) {
    console.error('Fetch pets error:', err)
    loading.value = false
  }
}

const fetchRecords = async () => {
  if (!selectedPetId.value) return
  try {
    loading.value = true
    error.value = ''
    const res = await request.get(`/health?pet_id=${selectedPetId.value}`)
    records.value = res.data || []
  } catch (err) {
    console.error('Fetch records error:', err)
    error.value = '加载失败，请点击重试'
  } finally {
    loading.value = false
  }
}

const handlePetChange = (petId) => {
  selectedPetId.value = petId
  newRecord.value.pet_id = petId
  fetchRecords()
}

const handleAddRecord = async () => {
  if (!newRecord.value.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  try {
    submitting.value = true
    await request.post('/health', newRecord.value)
    ElMessage.success('添加成功')
    showAddModal.value = false
    resetNewRecord()
    fetchRecords()
  } catch (err) {
    console.error('Add record error:', err)
    ElMessage.error('添加失败')
  } finally {
    submitting.value = false
  }
}

const resetNewRecord = () => {
  newRecord.value = {
    pet_id: selectedPetId.value,
    title: '',
    content: '',
    tags: '',
    record_date: dayjs().format('YYYY-MM-DD'),
    type: 'normal'
  }
}

const handleDeleteRecord = async (recordId) => {
  try {
    await request.delete(`/health/${recordId}`)
    ElMessage.success('删除成功')
    fetchRecords()
  } catch (err) {
    console.error('Delete record error:', err)
    ElMessage.error('删除失败')
  }
}

const getTypeLabel = (type) => {
  const item = typeOptions.find(t => t.value === type)
  return item ? item.label : '日常记录'
}

const getTypeColor = (type) => {
  const colors = {
    normal: '',
    vaccine: 'success',
    deworming: 'info',
    illness: 'warning',
    surgery: 'danger',
    checkup: 'primary'
  }
  return colors[type] || ''
}

const selectedPet = computed(() => {
  return pets.value.find(p => p.id === selectedPetId.value)
})

onMounted(() => {
  if (userStore.isLoggedIn) {
    fetchPets()
  }
})
</script>

<template>
  <Layout>
    <div class="health-page">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">健康管理</h1>
          <el-button type="primary" @click="showAddModal = true" :disabled="!selectedPetId">
            <el-icon><Plus /></el-icon>
            添加记录
          </el-button>
        </div>

        <div v-if="!userStore.isLoggedIn" class="empty-state">
          <el-empty description="请先登录查看健康记录">
            <el-button type="primary" @click="$router.push('/login')">去登录</el-button>
          </el-empty>
        </div>

        <div v-else-if="pets.length === 0 && !loading" class="empty-state">
          <el-empty description="请先添加宠物档案">
            <el-button type="primary" @click="$router.push('/pets')">添加宠物</el-button>
          </el-empty>
        </div>

        <template v-else-if="selectedPetId">
          <div class="pet-selector">
            <span>选择宠物：</span>
            <el-radio-group v-model="selectedPetId" @change="handlePetChange">
              <el-radio-button v-for="pet in pets" :key="pet.id" :label="pet.id">
                {{ pet.name }}
              </el-radio-button>
            </el-radio-group>
          </div>

          <el-skeleton v-if="loading" :rows="6" animated />
          
          <div v-else-if="error" class="error-state">
            <el-empty description="加载失败">
              <el-button type="primary" @click="fetchRecords">点击重试</el-button>
            </el-empty>
          </div>

          <div v-else-if="records.length === 0" class="empty-state">
            <el-empty description="暂无健康记录，快来添加第一条吧" />
          </div>

          <template v-else>
            <div class="timeline">
              <div v-for="(group, date) in Object.fromEntries(
                Object.entries(
                  records.reduce((acc, record) => {
                    const date = dayjs(record.record_date).format('YYYY年MM月')
                    if (!acc[date]) acc[date] = []
                    acc[date].push(record)
                    return acc
                  }, {})
                ).sort((a, b) => dayjs(b[0], 'YYYY年MM月').valueOf() - dayjs(a[0], 'YYYY年MM月').valueOf())
              )" :key="date" class="timeline-month">
                <h3 class="month-title">{{ date }}</h3>
                <div class="timeline-items">
                  <div v-for="record in group" :key="record.id" class="timeline-item">
                    <div class="timeline-dot" :class="getTypeColor(record.type)"></div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <el-tag :type="getTypeColor(record.type)" size="small">
                          {{ getTypeLabel(record.type) }}
                        </el-tag>
                        <span class="timeline-date">
                          {{ dayjs(record.record_date).format('MM月DD日') }}
                        </span>
                      </div>
                      <h4 class="timeline-title">{{ record.title }}</h4>
                      <p v-if="record.content" class="timeline-desc">{{ record.content }}</p>
                      <div v-if="record.tags" class="timeline-tags">
                        <el-tag v-for="tag in record.tags.split(/[,，]/).filter(t => t.trim())" :key="tag" size="small">
                          {{ tag.trim() }}
                        </el-tag>
                      </div>
                      <el-button 
                        type="danger" 
                        size="small" 
                        link 
                        @click="handleDeleteRecord(record.id)"
                        class="delete-btn"
                      >
                        删除
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>

    <el-dialog v-model="showAddModal" title="添加健康记录" width="500px">
      <el-form :model="newRecord" label-width="100px">
        <el-form-item label="标题" required>
          <el-input v-model="newRecord.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="记录类型">
          <el-select v-model="newRecord.type" style="width: 100%">
            <el-option v-for="t in typeOptions" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="newRecord.record_date" type="date" style="width: 100%" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="newRecord.content" type="textarea" :rows="4" placeholder="请输入详细内容" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="newRecord.tags" placeholder="多个标签用逗号分隔" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddModal = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleAddRecord">确认添加</el-button>
      </template>
    </el-dialog>
  </Layout>
</template>

<style scoped>
.health-page {
  min-height: 80vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.pet-selector {
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.timeline {
  max-width: 800px;
}

.timeline-month {
  margin-bottom: 40px;
}

.month-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 20px;
  padding-left: 10px;
  border-left: 4px solid #409eff;
}

.timeline-items {
  padding-left: 20px;
  border-left: 2px solid #e4e7ed;
  margin-left: 10px;
}

.timeline-item {
  position: relative;
  margin-bottom: 24px;
  padding-left: 24px;
}

.timeline-dot {
  position: absolute;
  left: -31px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #409eff;
  border: 3px solid white;
  box-shadow: 0 0 0 2px #409eff;
}

.timeline-dot.success {
  background: #67c23a;
  box-shadow: 0 0 0 2px #67c23a;
}

.timeline-dot.info {
  background: #909399;
  box-shadow: 0 0 0 2px #909399;
}

.timeline-dot.warning {
  background: #e6a23c;
  box-shadow: 0 0 0 2px #e6a23c;
}

.timeline-dot.danger {
  background: #f56c6c;
  box-shadow: 0 0 0 2px #f56c6c;
}

.timeline-content {
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.timeline-date {
  color: #909399;
  font-size: 13px;
}

.timeline-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 8px;
}

.timeline-desc {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 12px;
}

.timeline-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.delete-btn {
  margin-top: 12px;
}

.error-state,
.empty-state {
  padding: 60px 0;
  text-align: center;
}
</style>
