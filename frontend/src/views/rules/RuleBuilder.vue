<template>
  <div>
    <el-card class="page-card">
      <template #header>
        <div class="card-header">
          <span class="page-title">{{ isEdit ? '编辑规则' : '新建规则' }}</span>
          <div>
            <el-button @click="saveRule" :loading="saving">
              <el-icon><Document /></el-icon>
              保存草稿
            </el-button>
            <el-button type="warning" @click="pushToTest" :loading="pushing">
              <el-icon><Upload /></el-icon>
              推送测试
            </el-button>
            <el-button v-if="ruleStatus === 'testing'" type="success" @click="activateRule" :loading="activating">
              <el-icon><Check /></el-icon>
              激活上线
            </el-button>
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form :model="ruleForm" label-width="120px" style="max-width: 800px;">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="规则名称" required>
                  <el-input v-model="ruleForm.name" placeholder="请输入规则名称" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="版本">
                  <el-input v-model="ruleForm.version" placeholder="1.0.0" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="当前状态">
                  <el-tag :type="getStatusTagType(ruleStatus)" effect="light">
                    {{ getStatusLabel(ruleStatus) }}
                  </el-tag>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="描述">
              <el-input v-model="ruleForm.description" type="textarea" :rows="2" placeholder="请输入规则描述" />
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="page-card">
      <template #header>
        <div class="card-header">
          <span>规则拓扑 (Rule-Tree)</span>
          <el-tag type="info">拖拽变量到画布添加条件</el-tag>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="5">
          <div class="variable-panel">
            <div class="panel-title">
              <el-icon><Coin /></el-icon>
              可用变量
            </div>
            <div class="variable-list">
              <div 
                v-for="variable in variables" 
                :key="variable.id"
                class="variable-item"
                draggable="true"
                @dragstart="onVariableDragStart($event, variable)"
              >
                <div class="var-name">{{ variable.name }}</div>
                <div class="var-code">{{ variable.code }}</div>
                <div class="var-meta">
                  <el-tag size="small" :type="getVariableTypeTag(variable.type)">
                    {{ variable.type }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-col>

        <el-col :span="14">
          <div 
            class="canvas-area"
            @dragover.prevent
            @drop="onCanvasDrop"
          >
            <div class="canvas-header">
              <span>条件配置</span>
              <el-select v-model="ruleForm.topology.logicMode" size="small" style="width: 150px;">
                <el-option label="满足任一条件" value="any" />
                <el-option label="满足全部条件" value="all" />
              </el-select>
              <el-select v-model="ruleForm.topology.action" size="small" style="width: 150px;">
                <el-option label="拒绝" value="reject" />
                <el-option label="人工审核" value="review" />
              </el-select>
            </div>
            
            <div 
              v-if="conditions.length === 0" 
              class="empty-hint"
              @dragover.prevent
              @drop="onCanvasDrop"
            >
              <el-icon :size="48" color="#c0c4cc"><Upload /></el-icon>
              <p>从左侧拖拽变量到此处添加条件</p>
            </div>

            <div v-else class="conditions-list">
              <div 
                v-for="(condition, index) in conditions" 
                :key="condition.id"
                class="condition-item"
              >
                <div class="condition-header">
                  <span class="condition-index">条件 {{ index + 1 }}</span>
                  <el-button type="danger" link size="small" @click="removeCondition(index)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
                <div class="condition-body">
                  <el-row :gutter="10">
                    <el-col :span="6">
                      <div class="field-label">变量</div>
                      <el-input :value="condition.variableName" disabled size="small" />
                    </el-col>
                    <el-col :span="4">
                      <div class="field-label">操作符</div>
                      <el-select v-model="condition.operator" size="small" style="width: 100%;">
                        <el-option label="等于" value="eq" />
                        <el-option label="不等于" value="ne" />
                        <el-option label="大于" value="gt" />
                        <el-option label="大于等于" value="gte" />
                        <el-option label="小于" value="lt" />
                        <el-option label="小于等于" value="lte" />
                        <el-option label="包含" value="contains" />
                        <el-option label="是真" value="is_true" />
                        <el-option label="是假" value="is_false" />
                      </el-select>
                    </el-col>
                    <el-col :span="4">
                      <div class="field-label">值</div>
                      <el-input v-model="condition.value" size="small" placeholder="比较值" />
                    </el-col>
                    <el-col :span="4">
                      <div class="field-label">风险分数</div>
                      <el-input-number v-model="condition.score" :min="0" :max="100" size="small" />
                    </el-col>
                    <el-col :span="4">
                      <div class="field-label">权重倍数</div>
                      <el-input-number v-model="condition.weightMultiplier" :min="0.1" :max="5" :step="0.1" size="small" />
                    </el-col>
                  </el-row>
                </div>
              </div>
            </div>
          </div>
        </el-col>

        <el-col :span="5">
          <div class="preview-panel">
            <div class="panel-title">
              <el-icon><View /></el-icon>
              规则预览
            </div>
            <div class="preview-content">
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="逻辑模式">
                  {{ ruleForm.topology.logicMode === 'any' ? '满足任一' : '满足全部' }}
                </el-descriptions-item>
                <el-descriptions-item label="触发动作">
                  <el-tag :type="ruleForm.topology.action === 'reject' ? 'danger' : 'warning'" effect="light">
                    {{ ruleForm.topology.action === 'reject' ? '拒绝' : '人工审核' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="条件数量">
                  {{ conditions.length }} 个
                </el-descriptions-item>
              </el-descriptions>

              <el-divider>条件摘要</el-divider>
              <div v-if="conditions.length === 0" class="preview-empty">
                暂无条件配置
              </div>
              <div v-else class="preview-conditions">
                <div v-for="(c, i) in conditions" :key="c.id" class="preview-condition">
                  <span class="preview-index">{{ i + 1 }}.</span>
                  <span>{{ c.variableName }}</span>
                  <span class="preview-op">{{ getOperatorLabel(c.operator) }}</span>
                  <span class="preview-val">{{ c.value }}</span>
                  <el-tag size="small" type="warning">+{{ c.score }}分</el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../utils/api'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.query.id)
const currentRuleId = ref(null)
const ruleStatus = ref('draft')
const variables = ref([])
const saving = ref(false)
const pushing = ref(false)
const activating = ref(false)

const ruleForm = reactive({
  name: '',
  description: '',
  version: '1.0.0',
  topology: {
    nodes: [
      { id: 'start', type: 'start', x: 50, y: 200 },
      { id: 'end', type: 'end', x: 600, y: 200 }
    ],
    connections: [],
    conditions: [],
    logicMode: 'any',
    action: 'reject'
  }
})

const conditions = computed(() => ruleForm.topology.conditions || [])

const getStatusTagType = (status) => {
  switch (status) {
    case 'draft': return 'info'
    case 'testing': return 'warning'
    case 'active': return 'success'
    default: return 'info'
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'draft': return '草稿'
    case 'testing': return '测试中'
    case 'active': return '已激活'
    default: return status
  }
}

const getVariableTypeTag = (type) => {
  switch (type) {
    case 'integer': return 'primary'
    case 'float': return 'success'
    case 'boolean': return 'warning'
    case 'string': return 'info'
    default: return 'info'
  }
}

const getOperatorLabel = (op) => {
  const map = {
    eq: '=',
    ne: '≠',
    gt: '>',
    gte: '≥',
    lt: '<',
    lte: '≤',
    contains: '包含',
    is_true: '是',
    is_false: '否'
  }
  return map[op] || op
}

const loadVariables = async () => {
  try {
    const res = await api.get('/variables')
    if (res.data.success) {
      variables.value = res.data.data
    }
  } catch (e) {
    console.error('加载变量失败', e)
  }
}

const loadRule = async (id) => {
  try {
    const res = await api.get(`/rules/${id}`)
    if (res.data.success) {
      const rule = res.data.data
      currentRuleId.value = rule.id
      ruleStatus.value = rule.status
      ruleForm.name = rule.name
      ruleForm.description = rule.description || ''
      ruleForm.version = rule.version
      if (rule.topology) {
        ruleForm.topology = rule.topology
      }
    }
  } catch (e) {
    console.error('加载规则失败', e)
    ElMessage.error('规则不存在')
    router.push('/rules/list')
  }
}

const onVariableDragStart = (event, variable) => {
  event.dataTransfer.setData('variable', JSON.stringify(variable))
}

const onCanvasDrop = (event) => {
  const data = event.dataTransfer.getData('variable')
  if (data) {
    const variable = JSON.parse(data)
    addCondition(variable)
  }
}

const addCondition = (variable) => {
  const condition = {
    id: `cond_${Date.now()}`,
    variableCode: variable.code,
    variableName: variable.name,
    variableType: variable.type,
    operator: variable.type === 'boolean' ? 'is_true' : 'gt',
    value: variable.type === 'boolean' ? '' : (variable.type === 'integer' ? '10' : '0'),
    score: 20,
    weightMultiplier: variable.weight || 1.0
  }
  
  if (!ruleForm.topology.conditions) {
    ruleForm.topology.conditions = []
  }
  ruleForm.topology.conditions.push(condition)
}

const removeCondition = (index) => {
  ruleForm.topology.conditions.splice(index, 1)
}

const saveRule = async () => {
  if (!ruleForm.name) {
    ElMessage.warning('请输入规则名称')
    return
  }

  saving.value = true
  try {
    let res
    if (isEdit.value && currentRuleId.value) {
      res = await api.put(`/rules/${currentRuleId.value}/topology`, {
        topology: ruleForm.topology
      })
      if (res.data.success) {
        ElMessage.success('规则已更新')
      }
    } else {
      res = await api.post('/rules', {
        name: ruleForm.name,
        description: ruleForm.description,
        version: ruleForm.version,
        topology: ruleForm.topology
      })
      if (res.data.success) {
        ElMessage.success('规则已创建')
        currentRuleId.value = res.data.data.id
        ruleStatus.value = 'draft'
      }
    }
  } catch (e) {
    console.error('保存失败', e)
  } finally {
    saving.value = false
  }
}

const pushToTest = async () => {
  if (!currentRuleId.value) {
    await saveRule()
    if (!currentRuleId.value) return
  }

  try {
    await ElMessageBox.confirm('确定推送此规则到测试环境吗？', '确认操作', { type: 'warning' })
    
    pushing.value = true
    const res = await api.post(`/rules/${currentRuleId.value}/push-to-test`)
    if (res.data.success) {
      ElMessage.success('已推送到测试环境')
      ruleStatus.value = 'testing'
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error('推送失败', e)
    }
  } finally {
    pushing.value = false
  }
}

const activateRule = async () => {
  if (!currentRuleId.value) return

  try {
    await ElMessageBox.confirm('确定激活此规则到生产环境吗？', '确认操作', { type: 'success' })
    
    activating.value = true
    const res = await api.post(`/rules/${currentRuleId.value}/activate`)
    if (res.data.success) {
      ElMessage.success('规则已激活上线')
      ruleStatus.value = 'active'
    }
  } catch (e) {
    if (e !== 'cancel') {
      console.error('激活失败', e)
    }
  } finally {
    activating.value = false
  }
}

onMounted(() => {
  loadVariables()
  if (route.query.id) {
    loadRule(route.query.id)
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.variable-panel, .preview-panel {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  min-height: 500px;
}

.panel-title {
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.variable-list {
  padding: 12px;
}

.variable-item {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 10px;
  cursor: grab;
  transition: all 0.3s;
}

.variable-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 12px 0 rgba(64, 158, 255, 0.2);
}

.variable-item:active {
  cursor: grabbing;
}

.var-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.var-code {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
  margin-bottom: 8px;
}

.canvas-area {
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  min-height: 500px;
  background: #fafafa;
}

.canvas-header {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  gap: 16px;
}

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #909399;
}

.empty-hint p {
  margin-top: 16px;
}

.conditions-list {
  padding: 16px;
}

.condition-item {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 16px;
  padding: 16px;
}

.condition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #dcdfe6;
}

.condition-index {
  font-weight: 600;
  color: #409EFF;
}

.field-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.preview-content {
  padding: 16px;
}

.preview-empty {
  text-align: center;
  color: #909399;
  padding: 20px;
}

.preview-conditions {
  max-height: 300px;
  overflow-y: auto;
}

.preview-condition {
  padding: 8px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 13px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.preview-index {
  color: #409EFF;
  font-weight: 600;
}

.preview-op {
  color: #909399;
}

.preview-val {
  color: #e6a23c;
  font-weight: 500;
}
</style>
