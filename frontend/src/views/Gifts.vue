<template>
  <div>
    <div class="page-header">
      <div class="page-title">礼物库管理</div>
      <el-button type="primary" @click="handleAdd" v-if="canEdit">新增礼物</el-button>
    </div>

    <div class="card-content">
      <div class="filter-bar">
        <el-input v-model="filters.keyword" placeholder="搜索礼物名称" clearable style="width: 200px;" @change="loadData" />
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px;" @change="loadData">
          <el-option label="上架" value="online" />
          <el-option label="下架" value="offline" />
        </el-select>
        <el-select v-model="filters.rarity" placeholder="稀有度" clearable style="width: 120px;" @change="loadData">
          <el-option label="普通" value="normal" />
          <el-option label="稀有" value="rare" />
          <el-option label="史诗" value="epic" />
          <el-option label="传说" value="legendary" />
        </el-select>
        <el-button type="primary" @click="loadData">查询</el-button>
      </div>

      <el-table :data="gifts" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="礼物" width="180">
          <template #default="{ row }">
            <span class="gift-icon">{{ row.icon }}</span>{{ row.name }}
          </template>
        </el-table-column>
        <el-table-column prop="animation" label="动效" width="100" />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">¥{{ row.price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="rarity" label="稀有度" width="100">
          <template #default="{ row }">
            <el-tag :class="'rarity-' + row.rarity">{{ rarityMap[row.rarity] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column prop="scene" label="适用场景" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'online' ? 'success' : 'info'">
              {{ row.status === 'online' ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="60" />
        <el-table-column prop="online_time" label="上架时间" width="160" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)" v-if="canEdit">编辑</el-button>
            <el-button size="small" :type="row.status === 'online' ? 'warning' : 'success'" @click="toggleStatus(row)" v-if="canEdit">
              {{ row.status === 'online' ? '下架' : '上架' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)" v-if="canEdit">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          @current-change="loadData"
          @size-change="loadData"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑礼物' : '新增礼物'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="礼物名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="emoji 或图标URL" />
        </el-form-item>
        <el-form-item label="动效" prop="animation">
          <el-input v-model="form.animation" />
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="稀有度" prop="rarity">
          <el-select v-model="form.rarity">
            <el-option label="普通" value="normal" />
            <el-option label="稀有" value="rare" />
            <el-option label="史诗" value="epic" />
            <el-option label="传说" value="legendary" />
          </el-select>
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" />
        </el-form-item>
        <el-form-item label="适用场景" prop="scene">
          <el-input v-model="form.scene" placeholder="直播,社区" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="form.sort_order" :min="0" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import { useUserStore } from '../store/user'

const userStore = useUserStore()
const canEdit = computed(() => ['admin', 'operator'].includes(userStore.user?.role))

const gifts = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const filters = reactive({ keyword: '', status: '', rarity: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const form = reactive({
  id: null, name: '', icon: '', animation: '', price: 0, rarity: 'normal',
  scene: '', stock: 99999, sort_order: 0, description: '', status: 'offline'
})

const rules = {
  name: [{ required: true, message: '请输入礼物名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  rarity: [{ required: true, message: '请选择稀有度', trigger: 'change' }]
}

const rarityMap = {
  normal: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说'
}

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/gifts', { params: { ...filters, ...pagination } })
    gifts.value = data.items
    pagination.total = data.total
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  isEdit.value = false
  Object.assign(form, { id: null, name: '', icon: '', animation: '', price: 0, rarity: 'normal', scene: '', stock: 99999, sort_order: 0, description: '', status: 'offline' })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

async function handleSave() {
  try {
    await formRef.value.validate()
    saving.value = true
    if (isEdit.value) {
      await request.put(`/gifts/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await request.post('/gifts', form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

async function toggleStatus(row) {
  const newStatus = row.status === 'online' ? 'offline' : 'online'
  await request.patch(`/gifts/${row.id}/status`, { status: newStatus })
  ElMessage.success(`已${newStatus === 'online' ? '上架' : '下架'}`)
  loadData()
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除礼物「${row.name}」吗？`, '提示', { type: 'warning' })
    await request.delete(`/gifts/${row.id}`)
    ElMessage.success('删除成功')
    loadData()
  } catch {}
}

onMounted(loadData)
</script>
