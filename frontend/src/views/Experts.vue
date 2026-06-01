<template>
  <div>
    <el-card shadow="hover">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-weight: bold">专家列表</span>
          <el-button type="primary" @click="openExpertDialog">新增专家</el-button>
        </div>
      </template>

      <el-form :inline="true" style="margin-bottom: 20px; flex-wrap: wrap; display: flex">
        <el-form-item label="专业领域">
          <el-input v-model="filters.field" placeholder="请输入" clearable @input="loadExperts" />
        </el-form-item>
        <el-form-item label="地区">
          <el-input v-model="filters.region" placeholder="请输入" clearable @input="loadExperts" />
        </el-form-item>
        <el-form-item label="只显示有效">
          <el-switch v-model="filters.valid_only" @change="loadExperts" />
        </el-form-item>
      </el-form>

      <el-table :data="experts" border>
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="professional_field" label="专业领域" />
        <el-table-column prop="title" label="职称" />
        <el-table-column prop="company" label="单位" />
        <el-table-column prop="region" label="地区" />
        <el-table-column prop="qualification_valid_until" label="资质有效期" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag v-if="row.is_blacklisted" type="danger">黑名单</el-tag>
            <el-tag v-else-if="row.is_valid" type="success">有效</el-tag>
            <el-tag v-else type="warning">已过期</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewExpertDetail(row)">查看</el-button>
            <el-button size="small" type="primary" @click="openExpertDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteExpert(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="expertDialogVisible" :title="currentExpert.id ? '编辑专家' : '新增专家'" width="600px">
      <el-form :model="expertForm" label-width="100px">
        <el-form-item label="姓名" required>
          <el-input v-model="expertForm.name" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="expertForm.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="expertForm.email" />
        </el-form-item>
        <el-form-item label="专业领域" required>
          <el-input v-model="expertForm.professional_field" />
        </el-form-item>
        <el-form-item label="职称">
          <el-input v-model="expertForm.title" />
        </el-form-item>
        <el-form-item label="单位" required>
          <el-input v-model="expertForm.company" />
        </el-form-item>
        <el-form-item label="地区" required>
          <el-input v-model="expertForm.region" />
        </el-form-item>
        <el-form-item label="资质有效期">
          <el-date-picker v-model="expertForm.qualification_valid_until" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="加入黑名单">
          <el-switch v-model="expertForm.is_blacklisted" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="expertDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveExpert">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="专家详情" width="700px">
      <el-descriptions :column="2" border v-if="viewExpert">
        <el-descriptions-item label="姓名">{{ viewExpert.name }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ viewExpert.phone }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ viewExpert.email }}</el-descriptions-item>
        <el-descriptions-item label="专业领域">{{ viewExpert.professional_field }}</el-descriptions-item>
        <el-descriptions-item label="职称">{{ viewExpert.title }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ viewExpert.company }}</el-descriptions-item>
        <el-descriptions-item label="地区">{{ viewExpert.region }}</el-descriptions-item>
        <el-descriptions-item label="资质有效期">{{ viewExpert.qualification_valid_until }}</el-descriptions-item>
        <el-descriptions-item label="状态" :span="2">
          <el-tag v-if="viewExpert.is_blacklisted" type="danger">黑名单</el-tag>
          <el-tag v-else-if="viewExpert.is_valid" type="success">有效</el-tag>
          <el-tag v-else type="warning">已过期</el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <div style="margin-top: 20px">
        <h4 style="margin-bottom: 10px">评审历史</h4>
        <el-table :data="viewExpert.review_history || []" border size="small">
          <el-table-column prop="project_name" label="项目名称" />
          <el-table-column prop="review_date" label="评审日期" />
          <el-table-column prop="role" label="角色" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const experts = ref([])
const expertDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const currentExpert = ref({})
const viewExpert = ref(null)

const filters = reactive({
  field: '',
  region: '',
  valid_only: false
})

const expertForm = reactive({
  name: '',
  phone: '',
  email: '',
  professional_field: '',
  title: '',
  company: '',
  region: '',
  qualification_valid_until: '',
  is_blacklisted: 0
})

const loadExperts = async () => {
  try {
    const res = await axios.get('/api/experts', { params: filters })
    experts.value = res.data
  } catch (err) {
    ElMessage.error('加载专家列表失败')
  }
}

const openExpertDialog = (expert = null) => {
  if (expert) {
    currentExpert.value = { ...expert }
    Object.assign(expertForm, expert)
  } else {
    currentExpert.value = {}
    Object.assign(expertForm, {
      name: '',
      phone: '',
      email: '',
      professional_field: '',
      title: '',
      company: '',
      region: '',
      qualification_valid_until: '',
      is_blacklisted: 0
    })
  }
  expertDialogVisible.value = true
}

const saveExpert = async () => {
  try {
    if (currentExpert.value.id) {
      await axios.put(`/api/experts/${currentExpert.value.id}`, expertForm)
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/experts', expertForm)
      ElMessage.success('创建成功')
    }
    expertDialogVisible.value = false
    loadExperts()
  } catch (err) {
    ElMessage.error('保存失败')
  }
}

const deleteExpert = async (expert) => {
  try {
    await ElMessageBox.confirm('确定要删除该专家吗？', '提示')
    await axios.delete(`/api/experts/${expert.id}`)
    ElMessage.success('删除成功')
    loadExperts()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const viewExpertDetail = async (expert) => {
  try {
    const res = await axios.get(`/api/experts/${expert.id}`)
    viewExpert.value = res.data
    viewDialogVisible.value = true
  } catch (err) {
    ElMessage.error('加载专家详情失败')
  }
}

onMounted(() => {
  loadExperts()
})
</script>
