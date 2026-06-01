<template>
  <div class="page-container">
    <div class="flex-between mb-20">
      <h2>纳新活动</h2>
      <el-button type="primary" @click="showCreate = true" v-if="canCreate">发起纳新</el-button>
    </div>

    <div class="card">
      <el-table :data="campaigns" style="width: 100%">
        <el-table-column prop="title" label="活动标题" />
        <el-table-column prop="club_name" label="所属社团" />
        <el-table-column prop="requirements" label="报名条件" show-overflow-tooltip />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '进行中' : row.status === 'draft' ? '草稿' : '已结束' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push(`/recruitment/${row.id}`)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showCreate" title="发起纳新">
      <el-form :model="form" label-width="100px">
        <el-form-item label="所属社团" v-if="myClubs.length > 1">
          <el-select v-model="form.club_id" placeholder="请选择社团">
            <el-option v-for="club in myClubs" :key="club.id" :label="club.name" :value="club.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="纳新标题">
          <el-input v-model="form.title" placeholder="例如：2024年秋季纳新" />
        </el-form-item>
        <el-form-item label="纳新描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入纳新活动描述" />
        </el-form-item>
        <el-form-item label="报名条件">
          <el-input v-model="form.requirements" type="textarea" :rows="3" placeholder="请输入报名条件要求" />
        </el-form-item>
        <el-form-item label="面试安排">
          <el-input v-model="form.interview_info" type="textarea" :rows="2" placeholder="请输入面试时间、地点等信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { recruitment, clubs } from '@/api'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const campaigns = ref([])
const myClubs = ref([])
const showCreate = ref(false)
const form = ref({
  club_id: null,
  title: '',
  description: '',
  requirements: '',
  interview_info: ''
})

const canCreate = computed(() => {
  return userStore.isAdmin || myClubs.value.some(c => c.member_role === 'leader')
})

const loadData = async () => {
  const res = await recruitment.campaigns({ status: 'active' })
  campaigns.value = res.data
}

const loadMyClubs = async () => {
  try {
    const res = await clubs.my()
    myClubs.value = res.data
    if (res.data.length === 1) {
      form.value.club_id = res.data[0].id
    }
  } catch (e) {}
}

const handleCreate = async () => {
  if (!form.value.club_id && myClubs.value.length === 1) {
    form.value.club_id = myClubs.value[0].id
  }
  if (!form.value.club_id) {
    ElMessage.warning('请选择所属社团')
    return
  }
  if (!form.value.title) {
    ElMessage.warning('请填写纳新标题')
    return
  }
  try {
    await recruitment.createCampaign(form.value)
    ElMessage.success('纳新活动创建成功')
    showCreate.value = false
    form.value = { club_id: null, title: '', description: '', requirements: '', interview_info: '' }
    loadData()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '创建失败')
  }
}

onMounted(() => {
  loadData()
  loadMyClubs()
})
</script>
