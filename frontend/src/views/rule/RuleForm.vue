<template>
  <div class="rule-form-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>{{ isEdit ? '编辑规则' : '新增规则' }}</span>
          <el-button @click="handleBack">返回列表</el-button>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="140px"
        style="max-width: 800px"
      >
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入规则名称" />
        </el-form-item>

        <el-form-item label="规则编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入规则编码（可选）" />
        </el-form-item>

        <el-form-item label="规则描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="请输入规则描述"
          />
        </el-form-item>

        <el-divider content-position="left">基本配置</el-divider>

        <el-form-item label="规则类型" prop="rule_type">
          <el-radio-group v-model="form.rule_type">
            <el-radio label="metric">指标规则</el-radio>
            <el-radio label="log">日志规则</el-radio>
            <el-radio label="composite">复合规则</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="form.rule_type === 'metric'" label="指标名称" prop="metric_name">
          <el-input v-model="form.metric_name" placeholder="例如：cpu_usage, memory_usage" />
          <div class="form-tip">监控指标的名称，用于匹配采集的数据</div>
        </el-form-item>

        <el-form-item label="条件操作符" prop="condition">
          <el-select v-model="form.condition" placeholder="请选择条件操作符" style="width: 200px">
            <el-option label="大于 (>)" value=">" />
            <el-option label="大于等于 (>=)" value=">=" />
            <el-option label="小于 (<)" value="<" />
            <el-option label="小于等于 (<=)" value="<=" />
            <el-option label="等于 (=)" value="==" />
            <el-option label="不等于 (!=)" value="!=" />
            <el-option label="包含 (contains)" value="contains" />
            <el-option label="匹配 (matches)" value="matches" />
          </el-select>
        </el-form-item>

        <el-form-item label="阈值" prop="threshold">
          <el-input v-model="form.threshold" placeholder="请输入阈值">
            <template #prepend>
              <span>{{ formatConditionPreview() }}</span>
            </template>
          </el-input>
          <div class="form-tip">阈值将与指标值进行比较，例如：90 表示 CPU 使用率超过 90% 时触发</div>
        </el-form-item>

        <el-form-item label="持续时间" prop="duration">
          <el-input-number v-model="form.duration" :min="0" :max="86400" :step="60" />
          <span class="unit">秒</span>
          <div class="form-tip">指标值超过阈值持续多久才触发告警，0 表示立即触发</div>
        </el-form-item>

        <el-form-item label="告警级别" prop="severity">
          <el-radio-group v-model="form.severity">
            <el-radio label="critical">
              <el-tag type="danger" effect="dark">严重</el-tag>
            </el-radio>
            <el-radio label="warning">
              <el-tag type="warning" effect="dark">警告</el-tag>
            </el-radio>
            <el-radio label="info">
              <el-tag type="info" effect="dark">信息</el-tag>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="规则状态">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
            :active-text="'启用'"
            :inactive-text="'禁用'"
          />
        </el-form-item>

        <el-divider content-position="left">告警去重配置</el-divider>

        <el-form-item label="开启去重">
          <el-switch v-model="form.is_dedup" :active-value="1" :inactive-value="0" />
          <div class="form-tip">开启后，相同条件的告警在窗口期内不会重复触发</div>
        </el-form-item>

        <el-form-item v-if="form.is_dedup" label="去重窗口" prop="dedup_window">
          <el-input-number v-model="form.dedup_window" :min="60" :max="86400" :step="60" />
          <span class="unit">秒</span>
          <div class="form-tip">在该时间窗口内，相同指标的告警不会重复触发</div>
        </el-form-item>

        <el-form-item v-if="form.is_dedup" label="去重键" prop="dedup_key">
          <el-input v-model="form.dedup_key" placeholder="例如：{{metric_name}}-{{instance}}" />
          <div class="form-tip">用于标识相同告警的键，支持变量替换，留空则使用默认策略</div>
        </el-form-item>

        <el-divider />

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ isEdit ? '保存修改' : '创建规则' }}
          </el-button>
          <el-button @click="handleBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ruleApi } from '@/api';

const router = useRouter();
const route = useRoute();

const formRef = ref(null);
const submitting = ref(false);

const isEdit = computed(() => !!route.query.id);

const form = reactive({
  name: '',
  code: '',
  description: '',
  rule_type: 'metric',
  metric_name: '',
  condition: '>',
  threshold: '',
  duration: 0,
  severity: 'warning',
  status: 1,
  is_dedup: 0,
  dedup_window: 300,
  dedup_key: ''
});

const rules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  condition: [{ required: true, message: '请选择条件操作符', trigger: 'change' }],
  threshold: [{ required: true, message: '请输入阈值', trigger: 'blur' }]
};

const formatConditionPreview = () => {
  const conditionMap = {
    '>': '指标值 >',
    '>=': '指标值 ≥',
    '<': '指标值 <',
    '<=': '指标值 ≤',
    '==': '指标值 =',
    '!=': '指标值 ≠',
    'contains': '包含',
    'matches': '匹配'
  };
  return conditionMap[form.condition] || form.condition;
};

const fetchRuleDetail = async (id) => {
  try {
    const result = await ruleApi.getDetail(id);
    const rule = result.data.rule;
    Object.assign(form, {
      name: rule.name || '',
      code: rule.code || '',
      description: rule.description || '',
      rule_type: rule.rule_type || 'metric',
      metric_name: rule.metric_name || '',
      condition: rule.condition || '>',
      threshold: rule.threshold || '',
      duration: rule.duration || 0,
      severity: rule.severity || 'warning',
      status: rule.status ?? 1,
      is_dedup: rule.is_dedup ?? 0,
      dedup_window: rule.dedup_window || 300,
      dedup_key: rule.dedup_key || ''
    });
  } catch (error) {
    console.error('获取规则详情失败:', error);
    ElMessage.error('获取规则详情失败');
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      const data = {
        name: form.name,
        code: form.code || undefined,
        description: form.description || undefined,
        rule_type: form.rule_type,
        metric_name: form.metric_name || undefined,
        condition: form.condition,
        threshold: form.threshold,
        duration: form.duration || undefined,
        severity: form.severity,
        status: form.status,
        is_dedup: form.is_dedup,
        dedup_window: form.dedup_window || undefined,
        dedup_key: form.dedup_key || undefined
      };

      if (isEdit.value) {
        await ruleApi.update(route.query.id, data);
        ElMessage.success('规则更新成功');
      } else {
        await ruleApi.create(data);
        ElMessage.success('规则创建成功');
      }
      
      router.push('/rules');
    } catch (error) {
      console.error('保存规则失败:', error);
    } finally {
      submitting.value = false;
    }
  });
};

const handleBack = () => {
  router.push('/rules');
};

onMounted(() => {
  if (route.query.id) {
    fetchRuleDetail(route.query.id);
  }
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.unit {
  margin-left: 8px;
  color: #606266;
}

:deep(.el-input-group__prepend) {
  background-color: #f5f7fa;
  color: #606266;
  font-family: 'Consolas', 'Monaco', monospace;
}
</style>
