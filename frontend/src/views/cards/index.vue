<template>
  <div class="cards-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>名片列表</span>
          <div class="header-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索姓名、公司、职位、电话"
              style="width: 300px; margin-right: 10px;"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            >
              <template #append>
                <el-button icon="Search" @click="handleSearch" />
              </template>
            </el-input>
            <el-button type="primary" @click="showAddDialog = true">
              <el-icon><Plus /></el-icon>
              新增名片
            </el-button>
            <el-button
              type="danger"
              :disabled="selectedCards.length === 0"
              @click="handleBatchDelete"
            >
              批量删除
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="cards"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="companyName" label="公司" min-width="180" />
        <el-table-column prop="departmentName" label="部门" width="120" />
        <el-table-column prop="positionName" label="职位" width="120" />
        <el-table-column prop="mobile" label="手机" width="130" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToDetail(row)">详情</el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadCards"
          @current-change="loadCards"
        />
      </div>
    </el-card>
    
    <el-dialog
      v-model="showAddDialog"
      :title="editingCard ? '编辑名片' : '新增名片'"
      width="700px"
      destroy-on-close
    >
      <el-form
        ref="cardFormRef"
        :model="cardForm"
        :rules="cardRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="cardForm.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职位" prop="positionName">
              <el-input v-model="cardForm.positionName" placeholder="请输入职位" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="公司" prop="companyName">
              <el-input v-model="cardForm.companyName" placeholder="请输入公司名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门" prop="departmentName">
              <el-input v-model="cardForm.departmentName" placeholder="请输入部门" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机" prop="mobile">
              <el-input v-model="cardForm.mobile" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电话" prop="phone">
              <el-input v-model="cardForm.phone" placeholder="请输入办公电话" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="cardForm.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="微信" prop="wechat">
              <el-input v-model="cardForm.wechat" placeholder="请输入微信号" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="传真" prop="fax">
              <el-input v-model="cardForm.fax" placeholder="请输入传真" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="QQ" prop="qq">
              <el-input v-model="cardForm.qq" placeholder="请输入QQ号" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="地址" prop="address">
          <el-input v-model="cardForm.address" type="textarea" :rows="2" placeholder="请输入地址" />
        </el-form-item>
        
        <el-form-item label="网址" prop="website">
          <el-input v-model="cardForm.website" placeholder="请输入公司网址" />
        </el-form-item>
        
        <el-form-item label="备注" prop="notes">
          <el-input v-model="cardForm.notes" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
        
        <el-form-item label="公开">
          <el-switch v-model="cardForm.isPublic" />
          <span style="margin-left: 10px; color: #909399; font-size: 12px;">
            开启后其他用户可查看此名片
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { cardApi } from '@/api'

const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const searchKeyword = ref('')
const cards = ref([])
const selectedCards = ref([])
const showAddDialog = ref(false)
const editingCard = ref(null)
const cardFormRef = ref(null)

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const cardForm = reactive({
  name: '',
  positionName: '',
  companyName: '',
  departmentName: '',
  mobile: '',
  phone: '',
  email: '',
  wechat: '',
  fax: '',
  qq: '',
  address: '',
  website: '',
  notes: '',
  isPublic: false
})

const cardRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }]
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

const loadCards = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page - 1,
      size: pagination.size
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    const result = await cardApi.list(params)
    cards.value = result.data?.content || []
    pagination.total = result.data?.totalElements || 0
  } catch (error) {
    console.error('加载名片列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadCards()
}

const handleSelectionChange = (selection) => {
  selectedCards.value = selection
}

const resetCardForm = () => {
  cardForm.name = ''
  cardForm.positionName = ''
  cardForm.companyName = ''
  cardForm.departmentName = ''
  cardForm.mobile = ''
  cardForm.phone = ''
  cardForm.email = ''
  cardForm.wechat = ''
  cardForm.fax = ''
  cardForm.qq = ''
  cardForm.address = ''
  cardForm.website = ''
  cardForm.notes = ''
  cardForm.isPublic = false
}

const handleEdit = (row) => {
  editingCard.value = row
  Object.assign(cardForm, {
    name: row.name || '',
    positionName: row.positionName || '',
    companyName: row.companyName || '',
    departmentName: row.departmentName || '',
    mobile: row.mobile || '',
    phone: row.phone || '',
    email: row.email || '',
    wechat: row.wechat || '',
    fax: row.fax || '',
    qq: row.qq || '',
    address: row.address || '',
    website: row.website || '',
    notes: row.notes || '',
    isPublic: row.isPublic || false
  })
  showAddDialog.value = true
}

const handleSave = async () => {
  const valid = await cardFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  saving.value = true
  try {
    if (editingCard.value) {
      await cardApi.update(editingCard.value.id, cardForm)
      ElMessage.success('更新成功')
    } else {
      await cardApi.create(cardForm)
      ElMessage.success('创建成功')
    }
    showAddDialog.value = false
    editingCard.value = null
    resetCardForm()
    loadCards()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该名片吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await cardApi.delete(row.id)
    ElMessage.success('删除成功')
    loadCards()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedCards.value.length} 张名片吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const ids = selectedCards.value.map(c => c.id)
    await cardApi.batchDelete(ids)
    ElMessage.success('批量删除成功')
    selectedCards.value = []
    loadCards()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
    }
  }
}

const goToDetail = (row) => {
  router.push(`/cards/${row.id}`)
}

onMounted(() => {
  loadCards()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
