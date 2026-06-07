<template>
  <div class="page-container">
    <div class="page-header flex-between">
      <div>
        <h2 class="page-title">案例管理</h2>
        <p class="page-subtitle">展示您的优秀作品</p>
      </div>
      <el-button type="primary" @click="showAdd = true">添加案例</el-button>
    </div>

    <el-card class="card-shadow">
      <el-row :gutter="20">
        <el-col :span="8" v-for="item in cases" :key="item.id">
          <el-card class="case-card">
            <img :src="item.cover_image || 'https://picsum.photos/400/250?random=' + item.id" class="case-cover" />
            <div class="case-info">
              <h3 class="case-title">{{ item.title }}</h3>
              <div class="case-tags">
                <el-tag size="small" v-for="tag in item.style_tags" :key="tag">{{ tag }}</el-tag>
              </div>
              <div class="case-footer flex-between">
                <span class="case-price">¥{{ item.price?.toLocaleString() }}</span>
                <el-button type="danger" size="small" link @click="deleteCase(item.id)">删除</el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-empty v-if="cases.length === 0" description="暂无案例" />
    </el-card>

    <el-dialog v-model="showAdd" title="添加案例" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="案例标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="form.price" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="风格标签">
          <el-select v-model="form.style_tags" multiple style="width: 100%;">
            <el-option label="ins风" value="ins风" />
            <el-option label="中式传统" value="中式传统" />
            <el-option label="森系" value="森系" />
            <el-option label="极简" value="极简" />
            <el-option label="欧式" value="欧式" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="addCase">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const cases = ref([])
const showAdd = ref(false)
const form = reactive({
  title: '',
  description: '',
  price: 0,
  style_tags: []
})

async function loadCases() {
  try {
    const res = await api.get('/merchant/cases')
    cases.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function addCase() {
  try {
    await api.post('/merchant/cases', form)
    ElMessage.success('添加成功')
    showAdd.value = false
    loadCases()
  } catch (e) {
    ElMessage.error('添加失败')
  }
}

async function deleteCase(id) {
  try {
    await ElMessageBox.confirm('确定删除此案例吗？', '提示', { type: 'warning' })
    await api.delete(`/merchant/cases/${id}`)
    ElMessage.success('删除成功')
    loadCases()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadCases()
})
</script>

<style scoped lang="scss">
.case-card {
  margin-bottom: 20px;
  
  .case-cover {
    width: calc(100% + 40px);
    height: 180px;
    object-fit: cover;
    margin: -20px -20px 16px -20px;
    border-radius: 8px 8px 0 0;
  }
  
  .case-info {
    .case-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 10px;
    }
    
    .case-tags {
      margin-bottom: 12px;
      
      .el-tag {
        margin-right: 6px;
        margin-bottom: 6px;
      }
    }
    
    .case-footer {
      padding-top: 12px;
      border-top: 1px solid #ebeef5;
      
      .case-price {
        font-size: 18px;
        font-weight: 600;
        color: #ff6b9d;
      }
    }
  }
}
</style>
