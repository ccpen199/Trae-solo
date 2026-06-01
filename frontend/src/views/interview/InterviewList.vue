<template>
  <div class="interview-list">
    <el-row :gutter="20">
      <el-col :span="10">
        <el-card>
          <template #header>
            <h2>开始新面试</h2>
          </template>
          <el-form :model="form" label-width="100px">
            <el-form-item label="目标岗位">
              <el-input v-model="form.job_title" placeholder="如：高级Python工程师" />
            </el-form-item>
            <el-form-item label="岗位JD">
              <el-input
                v-model="form.jd_content"
                type="textarea"
                :rows="8"
                placeholder="请粘贴岗位JD，AI将基于此生成面试题..."
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleStartInterview" :loading="starting">
                <el-icon><VideoPlay /></el-icon>
                开始AI模拟面试
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="tips-card">
          <template #header>
            <span>面试小贴士</span>
          </template>
          <ul>
            <li>
              <el-icon color="#e6a23c"><InfoFilled /></el-icon>
              面试题涵盖技术、行为、场景等多个维度
            </li>
            <li>
              <el-icon color="#e6a23c"><InfoFilled /></el-icon>
              回答时建议使用STAR法则：情境-任务-行动-结果
            </li>
            <li>
              <el-icon color="#e6a23c"><InfoFilled /></el-icon>
              每个问题建议回答1-3分钟，包含具体案例和数据
            </li>
            <li>
              <el-icon color="#e6a23c"><InfoFilled /></el-icon>
              AI将评估回答的逻辑性、结构性和说服力
            </li>
          </ul>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card>
          <template #header>
            <h2>历史面试记录</h2>
          </template>
          <el-table :data="interviews" v-loading="loading" empty-text="暂无面试记录">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="job_title" label="目标岗位" />
            <el-table-column label="逻辑评分" width="120">
              <template #default="{ row }">
                <el-progress
                  v-if="row.logic_score"
                  :percentage="Math.round(row.logic_score)"
                  :color="getScoreColor(row.logic_score)"
                />
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="row.status === 'completed' ? 'success' : row.status === 'in_progress' ? 'warning' : 'info'"
                  size="small"
                >
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status !== 'completed'"
                  type="primary"
                  link
                  @click="$router.push(`/interview/${row.id}`)"
                >
                  继续
                </el-button>
                <el-button
                  v-else
                  type="success"
                  link
                  @click="$router.push(`/interview/${row.id}`)"
                >
                  查看报告
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { startInterview as apiStartInterview, listInterviews } from '../../api'

const router = useRouter()
const interviews = ref([])
const loading = ref(false)
const starting = ref(false)

const form = reactive({
  job_title: '高级大模型工程师',
  jd_content: '岗位职责：1. 负责大模型的微调和应用开发；2. 参与RAG系统设计与实现；3. 优化模型推理性能。任职要求：1. 3年以上Python开发经验；2. 熟悉PyTorch和Transformer；3. 有大模型微调经验优先；4. 具备良好的问题分析和解决能力。'
})

const getScoreColor = (score) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getStatusText = (status) => {
  const map = {
    'in_progress': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return map[status] || status
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const handleStartInterview = async () => {
  if (!form.job_title || !form.jd_content) {
    ElMessage.warning('请填写目标岗位和JD')
    return
  }
  starting.value = true
  try {
    const data = await apiStartInterview(form)
    ElMessage.success('面试已开始！')
    router.push(`/interview/${data.session_id}`)
  } catch (e) {
    ElMessage.error('启动失败，请重试')
    console.error(e)
  } finally {
    starting.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    interviews.value = await listInterviews(1)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.interview-list h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.tips-card {
  margin-top: 20px;
}

.tips-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-card li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
  color: #606266;
}

.tips-card li:last-child {
  border-bottom: none;
}
</style>
