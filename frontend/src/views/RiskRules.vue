<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2>⚙️ 风控规则配置</h2>
        <p style="color: #909399;">施工企业自定义风控规则，如'近半年诉讼超3起自动降级'</p>
      </div>
      <el-button type="primary" @click="dialogVisible = true">
        <el-icon><Plus /></el-icon>
        新增规则
      </el-button>
    </div>

    <el-card class="card-shadow">
      <template #header>
        <span style="font-weight: bold;">规则列表</span>
      </template>
      <el-table :data="rules" v-loading="loading" stripe>
        <el-table-column prop="rule_name" label="规则名称" min-width="180" />
        <el-table-column prop="enterprise_name" label="所属施工企业" min-width="180">
          <template #default="scope">
            <span v-if="scope.row.enterprise_name" style="color: #409eff;">{{ scope.row.enterprise_name }}</span>
            <span v-else style="color: #c0c4cc;">全企业通用</span>
          </template>
        </el-table-column>
        <el-table-column label="触发条件" min-width="220">
          <template #default="scope">
            <el-tag size="small" v-if="scope.row.rule_condition.type === 'judicial'">
              近{{ scope.row.rule_condition.period }}天诉讼 ≥ {{ scope.row.rule_condition.count }} 起
            </el-tag>
            <el-tag size="small" v-else-if="scope.row.rule_condition.type === 'credit'">
              信用类型为 {{ scope.row.rule_condition.typeValue }}
            </el-tag>
            <el-tag size="small" v-else-if="scope.row.rule_condition.type === 'bidRigging'">
              围标风险等级 ≥ {{ scope.row.rule_condition.riskLevel }}
            </el-tag>
            <el-tag size="small" v-else-if="scope.row.rule_condition.type === 'qualification'">
              资质过期前 {{ scope.row.rule_condition.expiryDays }} 天提醒
            </el-tag>
            <el-tag size="small" v-else-if="scope.row.rule_condition.type === 'abnormal'">
              经营异常状态：{{ scope.row.rule_condition.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="执行动作" width="140">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.rule_action.action === 'downgrade' ? 'danger' : scope.row.rule_action.action === 'blacklist' ? 'info' : 'warning'">
              {{ scope.row.rule_action.action === 'downgrade' ? '自动降级' : 
                 scope.row.rule_action.action === 'blacklist' ? '加入黑名单' :
                 scope.row.rule_action.action === 'warn' ? '风险预警' :
                 scope.row.rule_action.action === 'remind' ? '自动提醒' : '标记风险' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rule_level" label="级别" width="80">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.rule_level === 'high' ? 'danger' : scope.row.rule_level === 'medium' ? 'warning' : 'info'">
              {{ scope.row.rule_level === 'high' ? '高' : scope.row.rule_level === 'medium' ? '中' : '低' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="启停状态" width="100" align="center">
          <template #default="scope">
            <el-switch
              v-model="scope.row.is_enabled"
              :active-text="scope.row.is_enabled ? '运行中' : '已停用'"
              @change="toggleRule(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="hit_count" label="命中次数" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.hit_count > 0 ? 'danger' : 'info'" size="small">
              {{ scope.row.hit_count || 0 }} 次
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_hit_at" label="最后命中时间" width="170">
          <template #default="scope">
            <span v-if="scope.row.last_hit_at" style="color: #e6a23c;">{{ scope.row.last_hit_at }}</span>
            <span v-else style="color: #c0c4cc;">未命中过</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="testRule(scope.row)">测试</el-button>
            <el-button size="small" type="primary" @click="editRule(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteRule(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingRule ? '编辑规则' : '新增规则'" width="600px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="规则名称" required>
          <el-input v-model="form.ruleName" placeholder="如：近半年诉讼超3起自动降级" />
        </el-form-item>
        <el-form-item label="所属施工企业">
          <el-select v-model="form.enterpriseId" placeholder="选择企业（不选则为全企业通用）" clearable style="width: 100%;">
            <el-option 
              v-for="ent in enterpriseList" 
              :key="ent.id" 
              :label="ent.name" 
              :value="ent.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="条件类型" required>
          <el-select v-model="form.conditionType" style="width: 100%;">
            <el-option label="司法诉讼数量" value="judicial" />
            <el-option label="信用类型" value="credit" />
            <el-option label="围标串标风险" value="bidRigging" />
            <el-option label="经营异常状态" value="abnormal" />
            <el-option label="资质过期提醒" value="qualification" />
          </el-select>
        </el-form-item>
        
        <el-form-item v-if="form.conditionType === 'judicial'" label="诉讼数量阈值">
          <el-input-number v-model="form.judicialCount" :min="1" :max="100" />
          <span style="margin-left: 8px;">起</span>
        </el-form-item>
        <el-form-item v-if="form.conditionType === 'judicial'" label="时间范围">
          <el-input-number v-model="form.judicialPeriod" :min="30" :max="365" :step="30" />
          <span style="margin-left: 8px;">天</span>
        </el-form-item>
        
        <el-form-item v-if="form.conditionType === 'credit'" label="信用类型">
          <el-select v-model="form.creditType" style="width: 100%;">
            <el-option label="失信被执行人" value="失信被执行人" />
            <el-option label="行政处罚" value="行政处罚" />
            <el-option label="严重失信" value="严重失信" />
          </el-select>
        </el-form-item>
        
        <el-form-item v-if="form.conditionType === 'bidRigging'" label="风险等级">
          <el-select v-model="form.riggingLevel" style="width: 100%;">
            <el-option label="高风险" value="高风险" />
            <el-option label="中风险" value="中风险" />
            <el-option label="低风险" value="低风险" />
          </el-select>
        </el-form-item>
        
        <el-form-item v-if="form.conditionType === 'qualification'" label="提前提醒天数">
          <el-input-number v-model="form.expiryDays" :min="7" :max="365" />
          <span style="margin-left: 8px;">天</span>
        </el-form-item>
        
        <el-form-item v-if="form.conditionType === 'abnormal'" label="异常状态">
          <el-select v-model="form.abnormalStatus" style="width: 100%;">
            <el-option label="未移除" value="未移除" />
            <el-option label="已移除" value="已移除" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="执行动作" required>
          <el-select v-model="form.action" style="width: 100%;">
            <el-option label="自动降级" value="downgrade" />
            <el-option label="加入黑名单" value="blacklist" />
            <el-option label="风险预警" value="warn" />
            <el-option label="自动提醒" value="remind" />
            <el-option label="标记风险" value="mark" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="风险级别" required>
          <el-select v-model="form.level" style="width: 100%;">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { riskRulesApi, enterpriseApi } from '@/utils/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

const loading = ref(false);
const rules = ref([]);
const enterpriseList = ref([]);
const dialogVisible = ref(false);
const editingRule = ref(null);

const form = reactive({
  ruleName: '',
  enterpriseId: null,
  conditionType: 'judicial',
  judicialCount: 3,
  judicialPeriod: 180,
  creditType: '失信被执行人',
  riggingLevel: '高风险',
  expiryDays: 30,
  abnormalStatus: '未移除',
  action: 'downgrade',
  level: 'high'
});

const loadRules = async () => {
  loading.value = true;
  try {
    const [rulesData, entData] = await Promise.all([
      riskRulesApi.list(),
      enterpriseApi.list({ pageSize: 100 })
    ]);
    rules.value = rulesData;
    enterpriseList.value = entData.list || entData;
  } catch (err) {
    console.error('Load rules failed:', err);
  } finally {
    loading.value = false;
  }
};

const toggleRule = async (rule) => {
  try {
    await riskRulesApi.update(rule.id, { isEnabled: rule.is_enabled });
    ElMessage.success(`规则已${rule.is_enabled ? '启用' : '禁用'}`);
  } catch (err) {
    console.error('Toggle rule failed:', err);
  }
};

const editRule = (rule) => {
  editingRule.value = rule;
  form.ruleName = rule.rule_name;
  form.enterpriseId = rule.enterprise_id || null;
  form.conditionType = rule.rule_condition.type;
  form.action = rule.rule_action.action;
  form.level = rule.rule_level;
  
  if (rule.rule_condition.type === 'judicial') {
    form.judicialCount = rule.rule_condition.count;
    form.judicialPeriod = rule.rule_condition.period;
  } else if (rule.rule_condition.type === 'credit') {
    form.creditType = rule.rule_condition.typeValue;
  } else if (rule.rule_condition.type === 'bidRigging') {
    form.riggingLevel = rule.rule_condition.riskLevel;
  } else if (rule.rule_condition.type === 'qualification') {
    form.expiryDays = rule.rule_condition.expiryDays;
  } else if (rule.rule_condition.type === 'abnormal') {
    form.abnormalStatus = rule.rule_condition.status;
  }
  
  dialogVisible.value = true;
};

const saveRule = async () => {
  let ruleCondition = {};
  let ruleAction = { action: form.action, level: form.level === 'high' ? 'red' : form.level === 'medium' ? 'orange' : 'yellow' };
  
  switch (form.conditionType) {
    case 'judicial':
      ruleCondition = { type: 'judicial', count: form.judicialCount, period: form.judicialPeriod };
      break;
    case 'credit':
      ruleCondition = { type: 'credit', typeValue: form.creditType };
      break;
    case 'bidRigging':
      ruleCondition = { type: 'bidRigging', riskLevel: form.riggingLevel };
      break;
    case 'qualification':
      ruleCondition = { type: 'qualification', expiryDays: form.expiryDays };
      break;
    case 'abnormal':
      ruleCondition = { type: 'abnormal', status: form.abnormalStatus };
      break;
  }
  
  try {
    if (editingRule.value) {
      await riskRulesApi.update(editingRule.value.id, {
        ruleName: form.ruleName,
        enterpriseId: form.enterpriseId,
        ruleCondition,
        ruleAction,
        ruleLevel: form.level
      });
      ElMessage.success('规则更新成功');
    } else {
      await riskRulesApi.create({
        ruleName: form.ruleName,
        enterpriseId: form.enterpriseId,
        ruleCondition,
        ruleAction,
        ruleLevel: form.level
      });
      ElMessage.success('规则创建成功');
    }
    dialogVisible.value = false;
    resetForm();
    loadRules();
  } catch (err) {
    console.error('Save rule failed:', err);
  }
};

const deleteRule = async (rule) => {
  try {
    await ElMessageBox.confirm('确定要删除这条规则吗？', '确认删除', {
      type: 'warning'
    });
    await riskRulesApi.delete(rule.id);
    ElMessage.success('规则删除成功');
    loadRules();
  } catch (err) {
    if (err !== 'cancel') {
      console.error('Delete rule failed:', err);
    }
  }
};

const testRule = async (rule) => {
  try {
    const result = await riskRulesApi.evaluate(1, [rule.id]);
    const triggeredRule = result.results.find(r => r.ruleId === rule.id);
    const statusText = triggeredRule?.triggered 
      ? `✅ 已触发 - ${triggeredRule.reason}` 
      : '❌ 未触发';
    ElMessage.info(`规则「${rule.rule_name}」测试完成：${statusText}`);
    loadRules();
  } catch (err) {
    console.error('Test rule failed:', err);
  }
};

const resetForm = () => {
  editingRule.value = null;
  form.ruleName = '';
  form.enterpriseId = null;
  form.conditionType = 'judicial';
  form.judicialCount = 3;
  form.judicialPeriod = 180;
  form.creditType = '失信被执行人';
  form.riggingLevel = '高风险';
  form.expiryDays = 30;
  form.abnormalStatus = '未移除';
  form.action = 'downgrade';
  form.level = 'high';
};

onMounted(loadRules);
</script>
