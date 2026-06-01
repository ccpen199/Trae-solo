<template>
  <div class="citizen-authorizations">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>授权管理</h2>
          <el-button type="primary" @click="showAuthDialog = true">
            <el-icon><Plus /></el-icon>
            新增授权
          </el-button>
        </div>
      </template>

      <el-table :data="authorizations" v-loading="loading">
        <el-table-column prop="material_name" label="材料名称" />
        <el-table-column prop="department" label="使用部门" />
        <el-table-column prop="purpose" label="使用用途" />
        <el-table-column prop="start_date" label="授权开始" width="120" />
        <el-table-column prop="end_date" label="授权结束" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '有效' : '已撤回' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
          <el-button
            v-if="row.status === 'active'"
            size="small"
            type="danger"
            @click="withdrawAuth(row)"
          >
            撤回
          </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAuthDialog" title="新增授权" width="500px">
      <el-form :model="authForm" label-width="100px">
        <el-form-item label="选择材料" required>
          <el-select v-model="authForm.material_id" placeholder="请选择材料" style="width: 100%">
            <el-option
              v-for="mat in materials"
              :key="mat.id"
              :label="mat.type_name"
              :value="mat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="使用部门" required>
          <el-input v-model="authForm.department" placeholder="请输入使用部门" />
        </el-form-item>
        <el-form-item label="使用用途">
          <el-input v-model="authForm.purpose" placeholder="请输入使用用途" />
        </el-form-item>
        <el-form-item label="授权期限" required>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAuthDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAuth">确认授权</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import api from '@/api'

const loading = ref(false)
const authorizations = ref([])
const materials = ref([])
const showAuthDialog = ref(false)
const authForm = ref({
  material_id: '',
  department: '',
  purpose: ''
})
const dateRange = ref([])

const getCurrentApplicant = () => {
  const saved = localStorage.getItem('currentApplicant')
  return saved ? JSON.parse(saved) : null
}

const loadAuthorizations = async () => {
  const applicant = getCurrentApplicant()
  if (!applicant) return

  loading.value = true
  try {
    const res = await api.getAuthorizations({ applicant_id: applicant.id })
    authorizations.value = res.data
  } catch (err) {
    ElMessage.error('加载失败：' + err.message)
  } finally {
    loading.value = false
  }
}

const loadMaterials = async () => {
  const applicant = getCurrentApplicant()
  if (!applicant) return

  try {
    const res = await api.getApplicantMaterials(applicant.id)
    materials.value = res.data
  } catch (err) {
    ElMessage.error('加载材料失败')
  }
}

const submitAuth = async () => {
  const applicant = getCurrentApplicant()
  if (!applicant) return

  if (!authForm.value.material_id || !authForm.value.department || dateRange.value.length < 2) {
    ElMessage.warning('请填写完整信息')
    return
  }

  try {
    await api.createAuthorization({
      material_id: authForm.value.material_id,
      applicant_id: applicant.id,
      department: authForm.value.department,
      purpose: authForm.value.purpose,
      start_date: dateRange.value[0],
      end_date: dateRange.value[1]
    })
    ElMessage.success('授权成功')
    showAuthDialog.value = false
    loadAuthorizations()
  } catch (err) {
    ElMessage.error('授权失败：' + err.message)
  }
}

const withdrawAuth = async (row) => {
  try {
    await ElMessageBox.confirm('确定要撤回该授权吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await api.withdrawAuthorization(row.id, '用户主动撤回')
    ElMessage.success('撤回成功')
    loadAuthorizations()
  } catch {
  }
}

onMounted(() => {
  loadAuthorizations()
  loadMaterials()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
}
</style>
