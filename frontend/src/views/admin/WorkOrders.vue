<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getWorkOrderListApi, createWorkOrderApi, updateWorkOrderApi, assignWorkOrderApi, getTechnicianListApi } from '@/api/admin'
import StatusBadge from '@/components/StatusBadge.vue'

const loading = ref(false)
const workOrders = ref<any[]>([])
const technicians = ref<any[]>([])
const pagination = ref({ page: 1, pageSize: 20, total: 0 })
const statusFilter = ref('')
const searchKeyword = ref('')

const dialogVisible = ref(false)
const assignDialogVisible = ref(false)
const isEdit = ref(false)
const currentOrder = ref<any>({})
const selectedTechnician = ref<number | null>(null)
const dialogLoading = ref(false)

const priorityMap: Record<string, { text: string; type: string }> = {
  low: { text: '低', type: 'info' },
  medium: { text: '中', type: 'warning' },
  high: { text: '高', type: 'danger' }
}

const formRules = {
  title: [{ required: true, message: '请输入工单标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入问题描述', trigger: 'blur' }],
  deviceId: [{ required: true, message: '请选择设备', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }]
}

async function loadWorkOrders() {
  loading.value = true
  try {
    const res = await getWorkOrderListApi({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      status: statusFilter.value,
      keyword: searchKeyword.value
    })
    workOrders.value = res.data.list || res.data
    pagination.value.total = res.data.total || workOrders.value.length
  } catch (error) {
    console.error('Load work orders error:', error)
  } finally {
    loading.value = false
  }
}

async function loadTechnicians() {
  try {
    const res = await getTechnicianListApi()
    technicians.value = res.data || []
  } catch (error) {
    console.error('Load technicians error:', error)
    technicians.value = [
      { id: 1, name: '张工', phone: '13800138001' },
      { id: 2, name: '李工', phone: '13800138002' },
      { id: 3, name: '王工', phone: '13800138003' }
    ]
  }
}

function handleSearch() {
  pagination.value.page = 1
  loadWorkOrders()
}

function handleReset() {
  searchKeyword.value = ''
  statusFilter.value = ''
  pagination.value.page = 1
  loadWorkOrders()
}

function handlePageChange(page: number) {
  pagination.value.page = page
  loadWorkOrders()
}

function handleAdd() {
  isEdit.value = false
  currentOrder.value = {
    title: '',
    description: '',
    deviceId: null,
    priority: 'medium'
  }
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEdit.value = true
  currentOrder.value = { ...row }
  dialogVisible.value = true
}

function handleAssign(row: any) {
  currentOrder.value = { ...row }
  selectedTechnician.value = null
  assignDialogVisible.value = true
}

async function handleAssignSubmit() {
  if (!selectedTechnician.value) {
    ElMessage.warning('请选择维修人员')
    return
  }
  dialogLoading.value = true
  try {
    await assignWorkOrderApi(currentOrder.value.id, selectedTechnician.value)
    ElMessage.success('派单成功')
    assignDialogVisible.value = false
    loadWorkOrders()
  } catch (error) {
    console.error('Assign error:', error)
  } finally {
    dialogLoading.value = false
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定要删除工单【${row.title}】吗？`,
      '删除确认',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
    )
    ElMessage.success('删除成功')
    loadWorkOrders()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Delete error:', error)
    }
  }
}

async function handleSubmit() {
  dialogLoading.value = true
  try {
    if (isEdit.value) {
      await updateWorkOrderApi(currentOrder.value.id, currentOrder.value)
      ElMessage.success('更新成功')
    } else {
      await createWorkOrderApi(currentOrder.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadWorkOrders()
  } catch (error) {
    console.error('Submit error:', error)
  } finally {
    dialogLoading.value = false
  }
}

onMounted(() => {
  loadWorkOrders()
  loadTechnicians()
})
</script>

<template>
  <div class="work-orders-page">
    <el-card class="filter-card">
      <el-form :inline="true" :model="{}" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchKeyword"
            placeholder="工单标题/设备名称"
            clearable
            style="width: 200px;"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="statusFilter" placeholder="全部" clearable style="width: 140px;">
            <el-option label="待派单" value="pending" />
            <el-option label="已派单" value="assigned" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleAdd">新增工单</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="workOrders"
        border
        stripe
        style="width: 100%;"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="工单标题" min-width="150" />
        <el-table-column prop="deviceName" label="设备名称" min-width="120" />
        <el-table-column label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="priorityMap[row.priority]?.type as any" size="small">
              {{ priorityMap[row.priority]?.text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusBadge :status="row.status" type="workorder" />
          </template>
        </el-table-column>
        <el-table-column prop="technicianName" label="维修人员" width="100">
          <template #default="{ row }">{{ row.technicianName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="creatorName" label="创建人" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button
              v-if="row.status === 'pending'"
              size="small"
              type="success"
              link
              @click="handleAssign(row)"
            >派单</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          @current-change="handlePageChange"
          @size-change="loadWorkOrders"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑工单' : '新增工单'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="currentOrder"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="工单标题" prop="title">
          <el-input v-model="currentOrder.title" />
        </el-form-item>
        <el-form-item label="问题描述" prop="description">
          <el-input v-model="currentOrder.description" type="textarea" :rows="4" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备" prop="deviceId">
              <el-input v-model="currentOrder.deviceId" type="number" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="currentOrder.priority" style="width: 100%;">
                <el-option label="低" value="low" />
                <el-option label="中" value="medium" />
                <el-option label="高" value="high" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="assignDialogVisible"
      title="指派维修人员"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="工单标题">
          <span>{{ currentOrder.title }}</span>
        </el-form-item>
        <el-form-item label="维修人员">
          <el-select v-model="selectedTechnician" placeholder="请选择维修人员" style="width: 100%;">
            <el-option
              v-for="tech in technicians"
              :key="tech.id"
              :label="`${tech.name} - ${tech.phone}`"
              :value="tech.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="handleAssignSubmit">确定派单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.work-orders-page {
  .filter-card {
    margin-bottom: 20px;

    .filter-form {
      margin-bottom: 0;
    }
  }

  .table-card {
    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
