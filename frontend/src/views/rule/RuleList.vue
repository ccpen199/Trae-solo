<template>
  <div class="rule-list-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>告警规则</span>
          <el-button type="primary" @click="handleCreate">新增规则</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.rule_type" placeholder="全部类型" clearable>
            <el-option label="指标规则" value="metric" />
            <el-option label="日志规则" value="log" />
            <el-option label="复合规则" value="composite" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input v-model="searchForm.search" placeholder="规则名称/描述" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchRules">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="rules" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="规则名称" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="rule-name">
              <span>{{ row.name }}</span>
              <el-tag v-if="row.code" size="small" type="info">{{ row.code }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="rule_type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getRuleType(row.rule_type)" size="small">
              {{ getRuleTypeLabel(row.rule_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="condition" label="条件" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <code class="condition-code">
              {{ formatCondition(row) }}
            </code>
          </template>
        </el-table-column>
        <el-table-column prop="severity" label="级别" width="80">
          <template #default="{ row }">
            <el-tag :type="getSeverityType(row.severity)" effect="dark" size="small">
              {{ getSeverityLabel(row.severity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_dedup" label="去重" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.is_dedup" type="success" size="small">开启</el-tag>
            <span v-else class="text-muted">关闭</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="toggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="warning" link @click="handleTest(row)">测试</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchRules"
        @current-change="fetchRules"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>

    <el-dialog v-model="testDialogVisible" title="测试规则" width="600px">
      <el-form :model="testForm" label-width="120px">
        <el-form-item label="测试指标值">
          <el-input
            v-model="testForm.metricValue"
            type="number"
            placeholder="请输入指标值进行测试"
          />
          <div class="form-tip">输入指标值，测试规则是否会触发告警</div>
        </el-form-item>
      </el-form>
      <div v-if="testResult" class="test-result">
        <el-alert
          :title="testResult.triggered ? '规则触发成功' : '规则未触发'"
          :type="testResult.triggered ? 'success' : 'info'"
          :closable="false"
        />
        <div class="result-details" v-if="testResult.details">
          <pre>{{ JSON.stringify(testResult.details, null, 2) }}</pre>
        </div>
      </div>
      <template #footer>
        <el-button @click="testDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="testLoading" @click="submitTest">执行测试</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ruleApi } from '@/api';
import dayjs from 'dayjs';

const router = useRouter();

const loading = ref(false);
const rules = ref([]);
const testDialogVisible = ref(false);
const testLoading = ref(false);
const testResult = ref(null);
const currentRule = ref(null);

const searchForm = reactive({
  status: '',
  rule_type: '',
  search: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

const testForm = reactive({
  metricValue: ''
});

const fetchRules = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    };
    if (params.status === '') delete params.status;
    if (!params.rule_type) delete params.rule_type;
    if (!params.search) delete params.search;
    
    const result = await ruleApi.getList(params);
    rules.value = result.data.rules;
    pagination.total = result.data.pagination.total;
  } catch (error) {
    console.error('获取规则列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  searchForm.status = '';
  searchForm.rule_type = '';
  searchForm.search = '';
  pagination.page = 1;
  fetchRules();
};

const handleCreate = () => {
  router.push('/rules/create');
};

const handleEdit = (row) => {
  router.push(`/rules/create?id=${row.id}`);
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该规则吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await ruleApi.delete(row.id);
    ElMessage.success('删除成功');
    fetchRules();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除规则失败:', error);
    }
  }
};

const toggleStatus = async (row) => {
  try {
    await ruleApi.update(row.id, { status: row.status });
    ElMessage.success(row.status === 1 ? '已启用' : '已禁用');
  } catch (error) {
    row.status = row.status === 1 ? 0 : 1;
    console.error('更新规则状态失败:', error);
  }
};

const handleTest = (row) => {
  currentRule.value = row;
  testForm.metricValue = '';
  testResult.value = null;
  testDialogVisible.value = true;
};

const submitTest = async () => {
  if (!testForm.metricValue && testForm.metricValue !== 0) {
    ElMessage.warning('请输入测试指标值');
    return;
  }

  testLoading.value = true;
  try {
    const metrics = [{
      name: currentRule.value.metric_name || 'test_metric',
      value: parseFloat(testForm.metricValue)
    }];
    
    const result = await ruleApi.test(currentRule.value.id, { metrics });
    testResult.value = result.data;
  } catch (error) {
    console.error('测试规则失败:', error);
  } finally {
    testLoading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

const formatCondition = (row) => {
  const conditionMap = {
    '>': '>',
    '>=': '≥',
    '<': '<',
    '<=': '≤',
    '==': '=',
    '!=': '≠',
    'contains': '包含',
    'matches': '匹配'
  };
  const op = conditionMap[row.condition] || row.condition;
  if (row.metric_name && row.threshold) {
    return `${row.metric_name} ${op} ${row.threshold}`;
  }
  return `${row.condition}`;
};

const getRuleType = (type) => {
  const typeMap = {
    metric: 'primary',
    log: 'success',
    composite: 'warning'
  };
  return typeMap[type] || 'info';
};

const getRuleTypeLabel = (type) => {
  const labelMap = {
    metric: '指标',
    log: '日志',
    composite: '复合'
  };
  return labelMap[type] || type;
};

const getSeverityType = (severity) => {
  const typeMap = {
    critical: 'danger',
    warning: 'warning',
    info: 'info'
  };
  return typeMap[severity] || 'info';
};

const getSeverityLabel = (severity) => {
  const labelMap = {
    critical: '严重',
    warning: '警告',
    info: '信息'
  };
  return labelMap[severity] || severity;
};

onMounted(() => {
  fetchRules();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.rule-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.condition-code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
}

.text-muted {
  color: #909399;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.test-result {
  margin-top: 16px;
}

.result-details {
  margin-top: 12px;
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  max-height: 300px;
  overflow: auto;
}

.result-details pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
}
</style>
