<template>
  <div class="pet-detail-page">
    <van-nav-bar title="宠物档案" left-arrow @click-left="goBack" fixed />

    <van-loading v-if="loading" class="loading" />
    <div v-else-if="pet" class="content">
      <div class="pet-header">
        <van-image :src="pet.avatar || 'https://picsum.photos/150/150'" round class="pet-avatar" />
        <h2 class="pet-name">{{ pet.name }}</h2>
      </div>

      <van-cell-group inset>
        <van-cell title="性别" :value="pet.gender || '未设置'" />
        <van-cell title="年龄" :value="pet.age ? pet.age + '岁' : '未设置'" />
        <van-cell title="品种" :value="pet.breed || '未设置'" />
        <van-cell title="健康状况" :value="pet.healthStatus || '健康'" />
        <van-cell title="犬证编号" :value="pet.licenseNumber || '未设置'" />
      </van-cell-group>

      <van-tabs v-model:active="activeTab" sticky style="margin-top: 10px">
        <van-tab title="健康管理">
          <div class="tab-content">
            <div class="section-header">
              <h3>健康记录</h3>
              <van-button type="primary" size="small" @click="showHealthForm = true">添加</van-button>
            </div>
            <div v-if="healthRecords.length === 0" class="empty-list">
              <van-empty description="暂无记录" image="search" />
            </div>
            <div v-else class="record-list">
              <div v-for="record in healthRecords" :key="record.id" class="record-item">
                <van-tag type="primary" size="small">{{ record.type }}</van-tag>
                <span class="record-date">{{ formatDate(record.date) }}</span>
                <p v-if="record.notes" class="record-notes">{{ record.notes }}</p>
              </div>
            </div>
          </div>
        </van-tab>

        <van-tab title="日常事项">
          <div class="tab-content">
            <div class="section-header">
              <h3>今日任务</h3>
              <van-button type="primary" size="small" @click="showTaskForm = true">添加</van-button>
            </div>
            <div v-if="dailyTasks.length === 0" class="empty-list">
              <van-empty description="暂无任务" image="search" />
            </div>
            <div v-else class="task-list">
              <div v-for="task in dailyTasks" :key="task.id" class="task-item">
                <van-checkbox v-model="task.completed" @change="toggleTask(task)" />
                <span class="task-type">{{ task.type }}</span>
                <span v-if="task.time" class="task-time">{{ task.time }}</span>
              </div>
            </div>
          </div>
        </van-tab>

        <van-tab title="成长日记">
          <div class="tab-content">
            <div class="section-header">
              <h3>日记列表</h3>
              <van-button type="primary" size="small" @click="showDiaryForm = true">添加</van-button>
            </div>
            <div v-if="diaries.length === 0" class="empty-list">
              <van-empty description="暂无日记" image="search" />
            </div>
            <div v-else class="diary-list">
              <div v-for="diary in diaries" :key="diary.id" class="diary-item">
                <h4 class="diary-title">{{ diary.title }}</h4>
                <p class="diary-content">{{ diary.content }}</p>
                <span class="diary-date">{{ formatDate(diary.date) }}</span>
              </div>
            </div>
          </div>
        </van-tab>
      </van-tabs>
    </div>

    <van-popup v-model:show="showHealthForm" position="bottom" round>
      <div class="form-popup">
        <h3>添加健康记录</h3>
        <van-field v-model="healthForm.type" label="类型" placeholder="如：疫苗、驱虫、体检" />
        <van-field v-model="healthForm.date" type="date" label="日期" />
        <van-field v-model="healthForm.notes" type="textarea" label="备注" placeholder="添加备注信息" />
        <div class="form-actions">
          <van-button type="default" @click="showHealthForm = false">取消</van-button>
          <van-button type="primary" @click="addHealthRecord">确定</van-button>
        </div>
      </div>
    </van-popup>

    <van-popup v-model:show="showTaskForm" position="bottom" round>
      <div class="form-popup">
        <h3>添加日常任务</h3>
        <van-field v-model="taskForm.type" label="任务类型" placeholder="如：喂食、遛弯、洗澡" />
        <van-field v-model="taskForm.time" label="时间" placeholder="如：09:00" />
        <div class="form-actions">
          <van-button type="default" @click="showTaskForm = false">取消</van-button>
          <van-button type="primary" @click="addDailyTask">确定</van-button>
        </div>
      </div>
    </van-popup>

    <van-popup v-model:show="showDiaryForm" position="bottom" round>
      <div class="form-popup">
        <h3>添加成长日记</h3>
        <van-field v-model="diaryForm.title" label="标题" placeholder="日记标题" />
        <van-field v-model="diaryForm.content" type="textarea" label="内容" placeholder="记录成长瞬间" />
        <van-field v-model="diaryForm.date" type="date" label="日期" />
        <div class="form-actions">
          <van-button type="default" @click="showDiaryForm = false">取消</van-button>
          <van-button type="primary" @click="addDiary">确定</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import dayjs from 'dayjs'
import request from '@/utils/request'
import type { Pet, HealthRecord, DailyTask, GrowthDiary } from '@/types'

const router = useRouter()
const route = useRoute()

const pet = ref<Pet | null>(null)
const healthRecords = ref<HealthRecord[]>([])
const dailyTasks = ref<DailyTask[]>([])
const diaries = ref<GrowthDiary[]>([])
const loading = ref(true)
const activeTab = ref(0)
const showHealthForm = ref(false)
const showTaskForm = ref(false)
const showDiaryForm = ref(false)

const healthForm = ref({ type: '', date: '', notes: '' })
const taskForm = ref({ type: '', time: '' })
const diaryForm = ref({ title: '', content: '', date: '' })

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD')
}

const fetchPetDetail = async () => {
  try {
    const petId = route.params.id as string
    const petRes = await request.get(`/pets/${petId}`)
    pet.value = petRes.data

    const [healthRes, tasksRes, diariesRes] = await Promise.all([
      request.get(`/pets/${petId}/health-records`),
      request.get(`/pets/${petId}/daily-tasks`),
      request.get(`/pets/${petId}/growth-diaries`)
    ])
    healthRecords.value = healthRes.data
    dailyTasks.value = tasksRes.data
    diaries.value = diariesRes.data
  } catch {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const addHealthRecord = async () => {
  if (!healthForm.value.type || !healthForm.value.date) {
    showToast('请填写完整信息')
    return
  }
  try {
    await request.post(`/pets/${route.params.id}/health-records`, healthForm.value)
    showHealthForm.value = false
    healthForm.value = { type: '', date: '', notes: '' }
    showToast('添加成功')
    fetchPetDetail()
  } catch {}
}

const addDailyTask = async () => {
  if (!taskForm.value.type) {
    showToast('请填写任务类型')
    return
  }
  try {
    await request.post(`/pets/${route.params.id}/daily-tasks`, {
      ...taskForm.value,
      date: dayjs().format('YYYY-MM-DD')
    })
    showTaskForm.value = false
    taskForm.value = { type: '', time: '' }
    showToast('添加成功')
    fetchPetDetail()
  } catch {}
}

const toggleTask = async (task: DailyTask) => {
  try {
    await request.put(`/pets/daily-tasks/${task.id}/toggle`, { completed: task.completed })
  } catch {}
}

const addDiary = async () => {
  if (!diaryForm.value.title || !diaryForm.value.content || !diaryForm.value.date) {
    showToast('请填写完整信息')
    return
  }
  try {
    await request.post(`/pets/${route.params.id}/growth-diaries`, diaryForm.value)
    showDiaryForm.value = false
    diaryForm.value = { title: '', content: '', date: '' }
    showToast('添加成功')
    fetchPetDetail()
  } catch {}
}

onMounted(() => {
  fetchPetDetail()
})
</script>

<style scoped>
.pet-detail-page {
  padding-top: 46px;
  padding-bottom: 30px;
  min-height: 100vh;
  background: #f5f5f5;
}

.loading {
  padding: 50px 0;
  text-align: center;
}

.pet-header {
  text-align: center;
  padding: 30px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.pet-avatar {
  width: 100px;
  height: 100px;
  margin: 0 auto 15px;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.pet-name {
  font-size: 24px;
  font-weight: 600;
}

.tab-content {
  padding: 15px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
}

.empty-list {
  padding: 30px 0;
}

.record-list, .task-list, .diary-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.record-item {
  background: #fff;
  padding: 15px;
  border-radius: 8px;
}

.record-date {
  font-size: 12px;
  color: #999;
  margin-left: 10px;
}

.record-notes {
  font-size: 13px;
  color: #666;
  margin-top: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 15px;
  border-radius: 8px;
}

.task-type {
  flex: 1;
  font-size: 14px;
  margin-left: 10px;
}

.task-time {
  font-size: 12px;
  color: #999;
}

.diary-item {
  background: #fff;
  padding: 15px;
  border-radius: 8px;
}

.diary-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
}

.diary-content {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.5;
}

.diary-date {
  font-size: 12px;
  color: #999;
}

.form-popup {
  padding: 20px;
}

.form-popup h3 {
  font-size: 18px;
  margin-bottom: 15px;
  text-align: center;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.form-actions .van-button {
  flex: 1;
}
</style>
