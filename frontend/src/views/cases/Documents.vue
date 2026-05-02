<template>
  <div class="documents-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <div>
            <el-button type="info" size="small" @click="router.back()" style="margin-right: 12px;">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <span class="page-title">文书管理</span>
          </div>
          <el-button 
            v-if="userStore.isLawyer" 
            type="primary" 
            @click="showCreate = true"
          >
            <el-icon><Plus /></el-icon>
            新建文书
          </el-button>
        </div>
      </template>
      
      <el-table :data="documents" v-loading="loading" style="width: 100%">
        <el-table-column prop="title" label="文书标题" min-width="200">
          <template #default="{ row }">
            <span class="doc-title" @click="openDocument(row)">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type || '其他' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="current_version" label="当前版本" width="100">
          <template #default="{ row }">
            <span>V{{ row.current_version }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="creator_name" label="创建人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.updated_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="openDocument(row)">
              编辑
            </el-button>
            <el-button size="small" type="info" text @click="viewVersions(row)">
              版本
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="!loading && documents.length === 0" description="暂无文书">
        <template #description>
          <p>还没有创建任何文书</p>
          <p v-if="userStore.isLawyer">点击上方"新建文书"开始创建</p>
        </template>
      </el-empty>
    </el-card>
    
    <el-dialog v-model="showCreate" title="新建文书" width="700px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="文书模板">
          <el-select v-model="createForm.templateId" placeholder="选择模板（可选）" style="width: 100%" clearable @change="onTemplateChange">
            <el-option v-for="tpl in templates" :key="tpl.id" :label="tpl.name" :value="tpl.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="文书标题">
          <el-input v-model="createForm.title" placeholder="请输入文书标题" />
        </el-form-item>
        <el-form-item label="文书类型">
          <el-select v-model="createForm.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="起诉状" value="complaint" />
            <el-option label="答辩状" value="defense" />
            <el-option label="证据清单" value="evidence_list" />
            <el-option label="授权委托书" value="power_of_attorney" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="文书内容">
          <el-input
            v-model="createForm.content"
            type="textarea"
            :rows="12"
            placeholder="请输入文书内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createDocument">创建</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showEdit" title="编辑文书" width="800px" :close-on-click-modal="false">
      <div class="edit-header" v-if="currentDoc">
        <div class="doc-info">
          <span class="doc-title">{{ currentDoc.title }}</span>
          <el-tag size="small">V{{ currentDoc.current_version }}</el-tag>
        </div>
      </div>
      
      <div class="edit-content">
        <el-input
          v-model="editContent"
          type="textarea"
          :rows="18"
          placeholder="编辑文书内容..."
        />
      </div>
      
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveDocument">保存新版本</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showVersions" title="版本历史" width="600px">
      <el-table :data="versions" v-loading="loadingVersions">
        <el-table-column prop="version" label="版本" width="80">
          <template #default="{ row }">
            <el-tag type="primary" size="small">V{{ row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="editor_name" label="编辑人" width="100" />
        <el-table-column prop="created_at" label="编辑时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="viewDiff(row)">对比</el-button>
            <el-button size="small" type="info" text @click="viewVersionContent(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
    
    <el-dialog v-model="showDiff" title="版本对比" width="90%">
      <div class="diff-view" v-if="diffData">
        <div v-for="(part, index) in diffData.diff" :key="index" class="diff-part">
          <span v-if="part.added" class="diff-added">+ {{ part.value }}</span>
          <span v-else-if="part.removed" class="diff-removed">- {{ part.value }}</span>
          <span v-else class="diff-normal">{{ part.value }}</span>
        </div>
      </div>
    </el-dialog>
    
    <el-dialog v-model="showContent" title="查看版本内容" width="80%">
      <div class="version-content">
        <pre>{{ viewContent }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'
import { documentApi } from '../../api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const caseId = computed(() => route.params.id)
const loading = ref(false)
const creating = ref(false)
const saving = ref(false)
const loadingVersions = ref(false)
const showCreate = ref(false)
const showEdit = ref(false)
const showVersions = ref(false)
const showDiff = ref(false)
const showContent = ref(false)
const documents = ref([])
const templates = ref([])
const currentDoc = ref(null)
const editContent = ref('')
const versions = ref([])
const diffData = ref(null)
const viewContent = ref('')

const createForm = ref({
  title: '',
  type: 'other',
  templateId: '',
  content: ''
})

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const loadTemplates = async () => {
  try {
    templates.value = await documentApi.getTemplates()
  } catch (e) {
    console.error(e)
  }
}

const loadDocuments = async () => {
  loading.value = true
  try {
    documents.value = await documentApi.getList(caseId.value)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const onTemplateChange = async (templateId) => {
  if (!templateId) {
    createForm.value.content = ''
    return
  }
  
  try {
    const result = await documentApi.fillTemplate(templateId, {
      client_name: '客户姓名',
      defendant_name: '被告姓名',
      case_value: '0',
      description: '案件描述',
      court: '受理法院',
      date: new Date().toLocaleDateString('zh-CN'),
      lawyer_name: userStore.userInfo?.name || '律师姓名',
      case_title: createForm.value.title || '案件标题'
    })
    createForm.value.content = result.content
  } catch (e) {
    console.error(e)
  }
}

const createDocument = async () => {
  if (!createForm.value.title) {
    ElMessage.warning('请输入文书标题')
    return
  }

  creating.value = true
  try {
    await documentApi.create(caseId.value, {
      title: createForm.value.title,
      type: createForm.value.type,
      templateId: createForm.value.templateId,
      content: createForm.value.content
    })
    ElMessage.success('文书创建成功')
    showCreate.value = false
    resetCreateForm()
    loadDocuments()
  } catch (e) {
    console.error(e)
  } finally {
    creating.value = false
  }
}

const resetCreateForm = () => {
  createForm.value = {
    title: '',
    type: 'other',
    templateId: '',
    content: ''
  }
}

const openDocument = async (row) => {
  try {
    const doc = await documentApi.getDetail(caseId.value, row.id)
    currentDoc.value = doc
    editContent.value = doc.content || ''
    showEdit.value = true
  } catch (e) {
    console.error(e)
  }
}

const saveDocument = async () => {
  if (!currentDoc.value) return

  saving.value = true
  try {
    await documentApi.update(caseId.value, currentDoc.value.id, editContent.value)
    ElMessage.success('文书已保存，新版本已创建')
    showEdit.value = false
    loadDocuments()
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

const viewVersions = async (row) => {
  loadingVersions.value = true
  try {
    versions.value = await documentApi.getVersions(caseId.value, row.id)
    showVersions.value = true
  } catch (e) {
    console.error(e)
  } finally {
    loadingVersions.value = false
  }
}

const viewDiff = async (row) => {
  if (row.version <= 1) {
    ElMessage.info('这是第一个版本，没有对比对象')
    return
  }
  
  try {
    diffData.value = await documentApi.getDiff(caseId.value, currentDoc.value?.id || versions.value[0]?.document_id, row.version - 1, row.version)
    showDiff.value = true
  } catch (e) {
    console.error(e)
  }
}

const viewVersionContent = (row) => {
  viewContent.value = row.content || '(空内容)'
  showContent.value = true
}

onMounted(() => {
  loadTemplates()
  loadDocuments()
})
</script>

<style scoped>
.documents-page {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.doc-title {
  color: #409eff;
  cursor: pointer;
}

.doc-title:hover {
  text-decoration: underline;
}

.edit-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.doc-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.doc-info .doc-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.diff-part {
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.6;
}

.diff-added {
  background-color: #f0f9eb;
  color: #67c23a;
  display: block;
}

.diff-removed {
  background-color: #fef0f0;
  color: #f56c6c;
  display: block;
  text-decoration: line-through;
}

.diff-normal {
  color: #606266;
  display: block;
}

.version-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  line-height: 1.8;
  color: #303133;
}
</style>
