<template>
  <div class="sites">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>站点管理</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon>
            新建站点
          </el-button>
        </div>
      </template>

      <el-table :data="siteList" v-loading="loading" row-key="id" border style="width: 100%">
        <el-table-column prop="name" label="站点名称" min-width="180">
          <template #default="{ row }">
            <div class="site-name">
              <el-icon v-if="row.siteType === 'main'" color="#409EFF"><Star /></el-icon>
              <el-icon v-else><OfficeBuilding /></el-icon>
              <span>{{ row.name }}</span>
              <el-tag v-if="row.siteType === 'main'" type="primary" size="small" style="margin-left: 8px">主站</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="站点代码" width="120" />
        <el-table-column prop="domain" label="域名/目录" min-width="180">
          <template #default="{ row }">
            <span v-if="row.domain">{{ row.domain }}</span>
            <span v-else-if="row.directory">/{{ row.directory }}</span>
            <el-tag v-else size="small">未配置</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="domainType" label="域名类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.domainType === 'independent' ? 'success' : row.domainType === 'subdomain' ? 'primary' : 'info'" size="small">
              {{ { subdomain: '二级域名', independent: '独立域名', directory: '目录' }[row.domainType] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link size="small" @click="handleViewCategories(row)">栏目</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑站点' : '新建站点'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="站点名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入站点名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="站点代码" prop="code">
              <el-input v-model="form.code" placeholder="请输入站点代码(英文)" :disabled="isEdit" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="站点类型" prop="siteType">
              <el-select v-model="form.siteType" placeholder="请选择站点类型" style="width: 100%">
                <el-option label="主站" value="main" />
                <el-option label="子站" value="sub" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="父站点" prop="parentId">
              <el-select v-model="form.parentId" placeholder="请选择父站点" clearable style="width: 100%">
                <el-option
                  v-for="site in parentSites"
                  :key="site.id"
                  :label="site.name"
                  :value="site.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="域名类型" prop="domainType">
              <el-select v-model="form.domainType" placeholder="请选择域名类型" style="width: 100%">
                <el-option label="独立域名" value="independent" />
                <el-option label="二级域名" value="subdomain" />
                <el-option label="目录" value="directory" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="form.domainType !== 'directory'" label="域名" prop="domain">
              <el-input v-model="form.domain" placeholder="如: example.com" />
            </el-form-item>
            <el-form-item v-else label="目录" prop="directory">
              <el-input v-model="form.directory" placeholder="如: news" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="站点状态">
          <el-radio-group v-model="form.isActive">
            <el-radio :value="true">启用</el-radio>
            <el-radio :value="false">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="站点描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入站点描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { request } from '@/utils/request'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

const router = useRouter()

const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const siteList = ref<any[]>([])
const formRef = ref<FormInstance>()

const form = reactive({
  id: '',
  name: '',
  code: '',
  siteType: 'sub' as 'main' | 'sub',
  parentId: '',
  domainType: 'subdomain' as 'independent' | 'subdomain' | 'directory',
  domain: '',
  directory: '',
  isActive: true,
  description: ''
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入站点名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入站点代码', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_-]*$/, message: '站点代码必须以字母开头，且只能包含字母、数字、下划线和中划线', trigger: 'blur' }
  ]
}

const parentSites = computed(() => {
  const currentId = form.id
  return siteList.value.filter(s => s.id !== currentId)
})

function formatDate(date: string | Date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString()
}

async function loadSites() {
  loading.value = true
  try {
    siteList.value = await request.get('/sites?includeInactive=true')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.id = ''
  form.name = ''
  form.code = ''
  form.siteType = 'sub'
  form.parentId = ''
  form.domainType = 'subdomain'
  form.domain = ''
  form.directory = ''
  form.isActive = true
  form.description = ''
}

function handleCreate() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEdit.value = true
  form.id = row.id
  form.name = row.name
  form.code = row.code
  form.siteType = row.siteType
  form.parentId = row.parent?.id || row.parentId || ''
  form.domainType = row.domainType
  form.domain = row.domain || ''
  form.directory = row.directory || ''
  form.isActive = row.isActive
  form.description = row.description || ''
  dialogVisible.value = true
}

function handleViewCategories(row: any) {
  router.push(`/categories?siteId=${row.id}`)
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定要删除站点"${row.name}"吗？`, '提示', {
    type: 'warning'
  })
  
  await request.delete(`/sites/${row.id}`)
  ElMessage.success('删除成功')
  loadSites()
}

async function handleSubmit() {
  if (!formRef.value) return
  
  await formRef.value.validate()
  
  submitting.value = true
  try {
    const data: any = { ...form }
    if (!data.parentId) delete data.parentId
    if (!data.domain) delete data.domain
    if (!data.directory) delete data.directory
    
    if (isEdit.value) {
      await request.put(`/sites/${form.id}`, data)
      ElMessage.success('更新成功')
    } else {
      await request.post('/sites', data)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadSites()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadSites()
})
</script>

<style lang="scss" scoped>
.sites {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .site-name {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}
</style>
