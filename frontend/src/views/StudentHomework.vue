<template>
  <div class="page-container">
    <div style="display: flex; align-items: center; margin-bottom: 20px">
      <el-button @click="$router.back()">返回</el-button>
      <h2 style="margin-left: 20px; margin-bottom: 0">学生作业详情</h2>
    </div>

    <div v-if="loading" style="text-align: center; padding: 40px">
      <el-skeleton :rows="5" animated />
    </div>
    <div v-else-if="submission">
      <el-card style="margin-bottom: 20px">
        <el-row :gutter="20">
          <el-col :span="6">
            <div style="text-align: center">
              <el-avatar :size="60" style="background-color: #409eff">
                {{ submission.student_name?.charAt(0) || '学' }}
              </el-avatar>
              <div style="margin-top: 10px; font-weight: bold; font-size: 18px">{{ submission.student_name }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div style="text-align: center">
              <div style="font-size: 36px; color: #67c23a; font-weight: bold">{{ ((submission.accuracy || 0) * 100).toFixed(1) }}%</div>
              <div style="color: #666; margin-top: 5px">正确率</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div style="text-align: center">
              <div style="font-size: 36px; color: #409eff; font-weight: bold">{{ submission.duration || 0 }}s</div>
              <div style="color: #666; margin-top: 5px">用时</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div style="text-align: center">
              <div style="font-size: 36px; color: #e6a23c; font-weight: bold">{{ submission.correct_count || 0 }}/{{ submission.total_count || 0 }}</div>
              <div style="color: #666; margin-top: 5px">正确/总题</div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <el-card style="margin-bottom: 20px">
        <template #header>
          <span>答题情况</span>
        </template>
        <div v-for="(item, index) in submission.answers" :key="item.id" style="padding: 15px 0; border-bottom: 1px solid #eee">
          <div style="display: flex; align-items: center">
            <el-tag :type="item.is_correct ? 'success' : 'danger'" style="margin-right: 10px">
              {{ item.is_correct ? '正确' : '错误' }}
            </el-tag>
            <span style="font-weight: bold">第{{ index + 1 }}题</span>
          </div>
          <div style="margin-top: 10px">{{ item.content }}</div>
          <div style="margin-top: 10px; color: #67c23a">正确答案：{{ item.answer }}</div>
        </div>
      </el-card>

      <el-card>
        <template #header>
          <span>语音评语</span>
        </template>
        <div v-if="submission.voice_comment" style="padding: 10px; background-color: #f5f7fa; border-radius: 4px">
          {{ submission.voice_comment }}
        </div>
        <div v-else>
          <el-form label-width="80px">
            <el-form-item label="评语">
              <el-input v-model="voiceComment" type="textarea" :rows="3" placeholder="请输入语音评语" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitComment" :disabled="!voiceComment">发布评语</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../utils/request'

const route = useRoute()
const loading = ref(false)
const submission = ref(null)
const voiceComment = ref('')

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await api.get(`/homework/${route.params.id}/student/${route.params.studentId}`)
    submission.value = res.data
    voiceComment.value = ''
  } finally {
    loading.value = false
  }
}

const submitComment = async () => {
  try {
    await api.post(`/homework/${route.params.id}/student/${route.params.studentId}/comment`, {
      voiceComment: voiceComment.value
    })
    ElMessage.success('评语发布成功')
    fetchDetail()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchDetail()
})
</script>