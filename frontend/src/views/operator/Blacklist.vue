<template>
  <div class="blacklist-page">
    <h2 class="page-title">敏感词管理</h2>
    
    <el-card>
      <div class="add-form">
        <el-input
          v-model="newWord"
          placeholder="输入敏感词"
          style="width: 200px; margin-right: 12px;"
          maxlength="50"
          @keyup.enter="addWord"
        />
        <el-select v-model="newCategory" style="width: 150px; margin-right: 12px;">
          <el-option label="广告" value="ad" />
          <el-option label="色情" value="porn" />
          <el-option label="政治" value="political" />
          <el-option label="暴力" value="violence" />
          <el-option label="敏感" value="sensitive" />
        </el-select>
        <el-button type="primary" @click="addWord" :loading="adding">添加</el-button>
      </div>
    </el-card>
    
    <div v-if="loading" class="page-loading" style="margin-top: 20px;">
      <el-skeleton :rows="4" animated />
    </div>
    
    <el-table
      v-else
      :data="words"
      style="width: 100%; margin-top: 20px;"
      stripe
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="word" label="敏感词" />
      <el-table-column label="分类" width="150">
        <template #default="{ row }">
          <el-tag :type="categoryTagType(row.category)">
            {{ categoryText(row.category) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="200">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button
            type="danger"
            link
            @click="removeWord(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div v-if="words.length === 0 && !loading" class="page-empty">
      <el-empty description="暂无敏感词" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import api from '@/utils/api'

const loading = ref(false)
const adding = ref(false)
const words = ref([])
const newWord = ref('')
const newCategory = ref('ad')

function categoryText(category) {
  const map = {
    ad: '广告',
    porn: '色情',
    political: '政治',
    violence: '暴力',
    sensitive: '敏感'
  }
  return map[category] || category
}

function categoryTagType(category) {
  const map = {
    ad: 'warning',
    porn: 'danger',
    political: 'danger',
    violence: 'danger',
    sensitive: 'info'
  }
  return map[category] || ''
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

async function loadWords() {
  loading.value = true
  try {
    const res = await api.get('/operator/blacklist')
    if (res.success) {
      words.value = res.data || []
    }
  } catch (e) {
    console.error('加载敏感词失败:', e)
  } finally {
    loading.value = false
  }
}

async function addWord() {
  if (!newWord.value.trim()) {
    ElMessage.warning('请输入敏感词')
    return
  }
  
  adding.value = true
  try {
    const res = await api.post('/operator/blacklist', {
      word: newWord.value.trim(),
      category: newCategory.value
    })
    if (res.success) {
      ElMessage.success('添加成功')
      newWord.value = ''
      loadWords()
    }
  } catch (e) {
    console.error('添加失败:', e)
  } finally {
    adding.value = false
  }
}

async function removeWord(row) {
  try {
    await ElMessageBox.confirm(`确定删除敏感词"${row.word}"？`, '提示', {
      type: 'warning'
    })
    
    const res = await api.delete(`/operator/blacklist/${row.id}`)
    if (res.success) {
      ElMessage.success('删除成功')
      loadWords()
    }
  } catch (e) {
    console.error('删除失败:', e)
  }
}

onMounted(() => {
  loadWords()
})
</script>

<style scoped>
.blacklist-page {
  min-height: 100%;
}

.page-title {
  font-size: 22px;
  color: #303133;
  margin-bottom: 24px;
}

.add-form {
  display: flex;
  align-items: center;
}
</style>
