<template>
  <div v-if="project">
    <el-card shadow="hover" style="margin-bottom: 20px">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-weight: bold">项目信息</span>
          <el-button type="primary" @click="handleExtract" :disabled="project.status === 'extracted'">
            {{ project.status === 'extracted' ? '已抽取' : '执行抽取' }}
          </el-button>
        </div>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="项目名称">{{ project.name }}</el-descriptions-item>
        <el-descriptions-item label="项目类型">{{ project.type }}</el-descriptions-item>
        <el-descriptions-item label="专业领域">{{ project.professional_field }}</el-descriptions-item>
        <el-descriptions-item label="专家人数">{{ project.expert_count }}</el-descriptions-item>
        <el-descriptions-item label="替补人数">{{ project.alternate_count }}</el-descriptions-item>
        <el-descriptions-item label="地区">{{ project.region || '不限' }}</el-descriptions-item>
        <el-descriptions-item label="回避单位">{{ project.回避_units || '无' }}</el-descriptions-item>
        <el-descriptions-item label="保密等级">{{ project.confidentiality_level }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(project.status)">{{ getStatusText(project.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="其他要求" :span="3">{{ project.requirements || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card shadow="hover" v-if="extractions.length > 0">
      <template #header>
        <span style="font-weight: bold">抽取记录</span>
      </template>
      <el-collapse>
        <el-collapse-item v-for="ext in extractions" :key="ext.id" :name="ext.id">
          <template #title>
            <span>抽取 #{{ ext.id }} - {{ ext.extracted_at }}</span>
            <el-tag style="margin-left: 10px">种子: {{ ext.random_seed.substring(0, 12) }}...</el-tag>
          </template>
          
          <div style="margin-bottom: 15px">
            <h4>候选池 ({{ ext.candidate_pool.length }}人)</h4>
            <el-table :data="ext.candidate_pool" border size="small">
              <el-table-column prop="name" label="姓名" />
              <el-table-column prop="company" label="单位" />
            </el-table>
          </div>

          <div style="margin-bottom: 15px">
            <h4>抽中专家</h4>
            <el-table :data="ext.selected_experts" border size="small">
              <el-table-column prop="name" label="姓名" />
              <el-table-column prop="company" label="单位" />
              <el-table-column prop="phone" label="电话" />
              <el-table-column prop="email" label="邮箱" />
              <el-table-column label="通知状态">
                <template #default="{ row }">
                  <el-tag :type="getNotifStatusType(getNotifStatus(ext.id, row.id))">
                    {{ getNotifStatusText(getNotifStatus(ext.id, row.id)) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="{ row }">
                  <el-button size="small" @click="handleAccept(ext.id, row.id)">接受</el-button>
                  <el-button size="small" type="danger" @click="handleReject(ext.id, row.id)">拒绝</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div>
            <h4>替补专家</h4>
            <el-table :data="ext.alternate_experts" border size="small">
              <el-table-column prop="name" label="姓名" />
              <el-table-column prop="company" label="单位" />
              <el-table-column prop="phone" label="电话" />
              <el-table-column prop="email" label="邮箱" />
              <el-table-column label="通知状态">
                <template #default="{ row }">
                  <el-tag :type="getNotifStatusType(getNotifStatus(ext.id, row.id))">
                    {{ getNotifStatusText(getNotifStatus(ext.id, row.id)) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-empty v-else description="暂无抽取记录，请点击执行抽取">
      <el-button type="primary" @click="handleExtract">执行抽取</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const route = useRoute()
const project = ref(null)
const extractions = ref([])
const notificationsMap = ref({})

const getStatusType = (status) => {
  const types = { pending: 'warning', extracted: 'success', completed: 'info' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { pending: '待抽取', extracted: '已抽取', completed: '已完成' }
  return texts[status] || status
}

const getNotifStatusType = (status) => {
  const types = { pending: 'warning', accepted: 'success', rejected: 'danger' }
  return types[status] || 'info'
}

const getNotifStatusText = (status) => {
  const texts = { pending: '待确认', accepted: '已接受', rejected: '已拒绝' }
  return texts[status] || status
}

const getNotifStatus = (extractionId, expertId) => {
  const key = `${extractionId}_${expertId}`
  return notificationsMap.value[key] || 'pending'
}

const loadProject = async () => {
  try {
    const res = await axios.get(`/api/projects/${route.params.id}`)
    project.value = res.data
    extractions.value = res.data.extractions || []
    
    for (const ext of extractions.value) {
      const notifRes = await axios.get(`/api/notifications/extraction/${ext.id}`)
      notifRes.data.forEach(n => {
        notificationsMap.value[`${ext.id}_${n.expert_id}`] = n.status
      })
    }
  } catch (err) {
    ElMessage.error('加载项目详情失败')
  }
}

const handleExtract = async () => {
  try {
    await ElMessageBox.confirm('确定要执行专家抽取吗？抽取结果将被记录且不可修改。', '确认抽取', { type: 'warning' })
    const res = await axios.post(`/api/projects/${route.params.id}/extract`, {
      supervisor: '系统管理员',
      extracted_by: 'admin'
    })
    ElMessage.success('抽取成功')
    loadProject()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err.response?.data?.error || '抽取失败')
    }
  }
}

const handleAccept = async (extractionId, expertId) => {
  try {
    const notifId = findNotificationId(extractionId, expertId)
    if (notifId) {
      await axios.put(`/api/notifications/${notifId}/status`, { status: 'accepted' })
      ElMessage.success('已标记为接受')
      loadProject()
    }
  } catch (err) {
    ElMessage.error('操作失败')
  }
}

const handleReject = async (extractionId, expertId) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝确认')
    const notifId = findNotificationId(extractionId, expertId)
    if (notifId) {
      await axios.put(`/api/notifications/${notifId}/status`, { status: 'rejected', reject_reason: reason })
      ElMessage.success('已标记为拒绝')
      loadProject()
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const findNotificationId = (extractionId, expertId) => {
  const extraction = extractions.value.find(e => e.id === extractionId)
  if (!extraction) return null
  return expertId
}

onMounted(() => {
  loadProject()
})
</script>
