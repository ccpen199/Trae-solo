<template>
  <div class="card-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>名片详情</span>
          <div>
            <el-button @click="goBack">返回列表</el-button>
            <el-button type="primary" @click="handleEdit">编辑</el-button>
          </div>
        </div>
      </template>
      
      <el-descriptions :column="2" border v-if="card">
        <el-descriptions-item label="姓名" :span="2">
          <span class="name-text">{{ card.name }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="公司">{{ card.companyName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ card.departmentName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="职位">{{ card.positionName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="公开">{{ card.isPublic ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="手机">{{ card.mobile || '-' }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ card.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ card.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="微信">{{ card.wechat || '-' }}</el-descriptions-item>
        <el-descriptions-item label="QQ">{{ card.qq || '-' }}</el-descriptions-item>
        <el-descriptions-item label="传真">{{ card.fax || '-' }}</el-descriptions-item>
        <el-descriptions-item label="网址">{{ card.website || '-' }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ card.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ card.notes || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(card.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDate(card.updatedAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
    
    <el-card style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>添加到分组</span>
        </div>
      </template>
      <el-select
        v-model="selectedGroup"
        placeholder="选择要添加的分组"
        style="width: 300px; margin-right: 10px;"
      >
        <el-option
          v-for="group in groups"
          :key="group.id"
          :label="group.name"
          :value="group.id"
        />
      </el-select>
      <el-button type="primary" @click="addToGroup">添加</el-button>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { cardApi, groupApi } from '@/api'

const route = useRoute()
const router = useRouter()

const card = ref(null)
const groups = ref([])
const selectedGroup = ref(null)

const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

const loadCard = async () => {
  const id = route.params.id
  try {
    const result = await cardApi.get(id)
    card.value = result.data
  } catch (error) {
    console.error('加载名片详情失败:', error)
  }
}

const loadGroups = async () => {
  try {
    const result = await groupApi.list()
    groups.value = result.data || []
  } catch (error) {
    console.error('加载分组失败:', error)
  }
}

const addToGroup = async () => {
  if (!selectedGroup.value) {
    ElMessage.warning('请选择分组')
    return
  }
  try {
    await groupApi.addCard(selectedGroup.value, route.params.id)
    ElMessage.success('已添加到分组')
    selectedGroup.value = null
  } catch (error) {
    console.error('添加到分组失败:', error)
  }
}

const handleEdit = () => {
  router.push('/cards')
}

const goBack = () => {
  router.push('/cards')
}

onMounted(() => {
  loadCard()
  loadGroups()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name-text {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
}
</style>
