<template>
  <div class="page-container">
    <div style="display: flex; align-items: center; margin-bottom: 20px">
      <el-button @click="$router.back()">返回</el-button>
      <h2 style="margin-left: 20px; margin-bottom: 0">作业详情</h2>
    </div>

    <div v-if="loading" style="text-align: center; padding: 40px">
      <el-skeleton :rows="5" animated />
    </div>
    <div v-else-if="homework">
      <el-card style="margin-bottom: 20px">
        <h2>{{ homework.title }}</h2>
        <div style="margin-top: 15px; color: #666">
          <el-tag style="margin-right: 10px">{{ homework.subject }}</el-tag>
          <el-tag type="info" style="margin-right: 10px">{{ homework.class_name }}</el-tag>
          <span>提交人数：{{ homework.submitted_count || 0 }}/{{ homework.total_students || 0 }}</span>
        </div>
        <div style="margin-top: 10px; color: #999">
          <span v-if="homework.knowledge_points">知识点：{{ homework.knowledge_points }}</span>
        </div>
      </el-card>

      <el-card>
        <template #header>
          <span>题目列表</span>
        </template>
        <div v-if="homework.questions?.length === 0" style="text-align: center; padding: 40px; color: #999">
          暂无题目
        </div>
        <div v-else>
          <div v-for="(q, index) in homework.questions" :key="q.id" style="padding: 15px 0; border-bottom: 1px solid #eee">
            <div style="font-weight: bold">第{{ index + 1 }}题</div>
            <div style="margin-top: 10px">{{ q.content }}</div>
            <div v-if="q.answer" style="margin-top: 10px; color: #67c23a">答案：{{ q.answer }}</div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../utils/request'

const route = useRoute()
const loading = ref(false)
const homework = ref(null)

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await api.get(`/homework/${route.params.id}`)
    homework.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDetail()
})
</script>