<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">黑名单管理</span>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加黑名单
      </el-button>
    </div>

    <el-card>
      <el-table :data="blacklist" stripe v-loading="loading">
        <el-table-column prop="phoneMd5" label="手机号MD5" min-width="250" show-overflow-tooltip />
        <el-table-column prop="phonePlain" label="明文手机号" width="150">
          <template #default="scope">
            {{ scope.row.phonePlain || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" min-width="200" show-overflow-tooltip />
        <el-table-column prop="expireAt" label="过期时间" width="180">
          <template #default="scope">
            {{ scope.row.expireAt ? new Date(scope.row.expireAt).toLocaleString() : '永久有效' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="scope">
            {{ new Date(scope.row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button type="danger" link @click="removeBlacklist(scope.row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadBlacklist"
        @current-change="loadBlacklist"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>

    <el-dialog v-model="showAddDialog" title="添加黑名单" width="500px">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="手机号MD5" required>
          <el-input v-model="addForm.phoneMd5" placeholder="请输入手机号MD5" />
        </el-form-item>
        <el-form-item label="明文手机号">
          <el-input v-model="addForm.phonePlain" placeholder="请输入明文手机号(可选)" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input
            v-model="addForm.reason"
            type="textarea"
            :rows="2"
            placeholder="请输入原因"
          />
        </el-form-item>
        <el-form-item label="有效期(天)">
          <el-input-number
            v-model="addForm.expireDays"
            :min="0"
            :max="3650"
            placeholder="0表示永久有效"
          />
          <span style="margin-left: 10px; color: #909399; font-size: 12px;">
            0表示永久有效
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/utils/api'

const loading = ref(false)
const blacklist = ref([])
const showAddDialog = ref(false)

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const addForm = reactive({
  phoneMd5: '',
  phonePlain: '',
  reason: '',
  expireDays: 0
})

const loadBlacklist = async () => {
  loading.value = true
  try {
    const res = await adminApi.getBlacklist({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    blacklist.value = res.data.blacklist || []
    pagination.total = res.data.total || 0
  } catch (error) {
    console.error('Load blacklist failed:', error)
  } finally {
    loading.value = false
  }
}

const submitAdd = async () => {
  if (!addForm.phoneMd5) {
    ElMessage.warning('请输入手机号MD5')
    return
  }

  try {
    await adminApi.addToBlacklist({
      phoneMd5: addForm.phoneMd5,
      phonePlain: addForm.phonePlain || undefined,
      reason: addForm.reason || undefined,
      expireDays: addForm.expireDays > 0 ? addForm.expireDays : undefined
    })
    ElMessage.success('添加成功')
    showAddDialog.value = false
    resetAddForm()
    loadBlacklist()
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

const removeBlacklist = async (row) => {
  try {
    await ElMessageBox.confirm('确定要从黑名单中移除吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await adminApi.removeFromBlacklist(row.id)
    ElMessage.success('移除成功')
    loadBlacklist()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('移除失败')
    }
  }
}

const resetAddForm = () => {
  addForm.phoneMd5 = ''
  addForm.phonePlain = ''
  addForm.reason = ''
  addForm.expireDays = 0
}

onMounted(() => {
  loadBlacklist()
})
</script>
