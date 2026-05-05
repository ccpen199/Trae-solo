<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">渠道管理</span>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新增渠道
      </el-button>
    </div>

    <el-card>
      <el-table :data="channels" stripe style="width: 100%">
        <el-table-column prop="channelCode" label="渠道号" width="150" />
        <el-table-column prop="channelName" label="渠道名称" width="200" />
        <el-table-column prop="productId" label="产品ID" width="150" />
        <el-table-column prop="isActive" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.isActive ? 'success' : 'danger'">
              {{ scope.row.isActive ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="scope">
            {{ new Date(scope.row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="editChannel(scope.row)">编辑</el-button>
            <el-button type="danger" link @click="deleteChannel(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="showCreateDialog"
      :title="isEdit ? '编辑渠道' : '新增渠道'"
      width="500px"
    >
      <el-form :model="channelForm" label-width="80px">
        <el-form-item label="渠道号">
          <el-input v-model="channelForm.channelCode" placeholder="请输入渠道号" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="渠道名称">
          <el-input v-model="channelForm.channelName" placeholder="请输入渠道名称" />
        </el-form-item>
        <el-form-item label="产品ID">
          <el-input v-model="channelForm.productId" placeholder="请输入产品ID" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="channelForm.isActive"
            active-text="启用"
            inactive-text="停用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitChannel">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/utils/api'

const channels = ref([])
const showCreateDialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const channelForm = reactive({
  channelCode: '',
  channelName: '',
  productId: '',
  isActive: true
})

const loadChannels = async () => {
  try {
    const res = await adminApi.getChannels()
    channels.value = res.data || []
  } catch (error) {
    console.error('Load channels failed:', error)
  }
}

const editChannel = (row) => {
  isEdit.value = true
  editId.value = row.id
  Object.assign(channelForm, row)
  showCreateDialog.value = true
}

const deleteChannel = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该渠道吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await adminApi.deleteChannel(row.id)
    ElMessage.success('删除成功')
    loadChannels()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const submitChannel = async () => {
  if (!channelForm.channelCode || !channelForm.channelName || !channelForm.productId) {
    ElMessage.warning('请填写完整信息')
    return
  }

  try {
    if (isEdit.value) {
      await adminApi.updateChannel(editId.value, channelForm)
      ElMessage.success('更新成功')
    } else {
      await adminApi.createChannel(channelForm)
      ElMessage.success('创建成功')
    }
    showCreateDialog.value = false
    resetForm()
    loadChannels()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  }
}

const resetForm = () => {
  channelForm.channelCode = ''
  channelForm.channelName = ''
  channelForm.productId = ''
  channelForm.isActive = true
  isEdit.value = false
  editId.value = null
}

onMounted(() => {
  loadChannels()
})
</script>
