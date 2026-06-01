<template>
  <div class="container">
    <div class="page-header">
      <h1 class="page-title">分佣结算</h1>
    </div>
    
    <el-card style="margin-bottom: 20px">
      <template #header>
        <span>汇总统计</span>
      </template>
      <el-table :data="summary" border stripe size="small">
        <el-table-column prop="period" label="月份" width="120" />
        <el-table-column prop="order_count" label="订单数" width="100" />
        <el-table-column prop="total_sales" label="销售额" width="120">
          <template #default="{ row }">¥{{ row.total_sales?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="total_refund" label="退款" width="100">
          <template #default="{ row }">¥{{ row.total_refund?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="total_penalty" label="扣罚" width="100">
          <template #default="{ row }">¥{{ row.total_penalty?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="total_commission" label="佣金" width="120">
          <template #default="{ row }">¥{{ row.total_commission?.toFixed(2) }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card>
      <el-table :data="commissions" border stripe>
        <el-table-column prop="period" label="月份" width="100" />
        <el-table-column prop="leader_name" label="团长" width="100" />
        <el-table-column prop="sales_amount" label="销售额" width="100">
          <template #default="{ row }">¥{{ row.sales_amount }}</template>
        </el-table-column>
        <el-table-column prop="refund_amount" label="退款" width="80">
          <template #default="{ row }">¥{{ row.refund_amount }}</template>
        </el-table-column>
        <el-table-column prop="penalty_amount" label="扣罚" width="80">
          <template #default="{ row }">¥{{ row.penalty_amount }}</template>
        </el-table-column>
        <el-table-column prop="commission_rate" label="比例" width="80">
          <template #default="{ row }">{{ (row.commission_rate * 100).toFixed(0) }}%</template>
        </el-table-column>
        <el-table-column prop="commission_amount" label="佣金" width="100">
          <template #default="{ row }">¥{{ row.commission_amount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="审批状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'approved' ? 'success' : row.status === 'pending' ? 'warning' : 'info'">
              {{ row.status === 'approved' ? '已通过' : row.status === 'pending' ? '待审批' : '已拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payment_status" label="打款状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.payment_status === 'paid' ? 'success' : 'warning'">
              {{ row.payment_status === 'paid' ? '已打款' : '待打款' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" :width="currentRole === 'leader' ? 80 : 250" fixed="right">
          <template #default="{ row }">
            <template v-if="currentRole === 'admin'">
              <el-button size="small" @click="openAdjustDialog(row)" v-if="row.status === 'pending'">调整</el-button>
              <el-button size="small" type="success" @click="approve(row)" v-if="row.status === 'pending'">审批</el-button>
              <el-button size="small" type="primary" @click="pay(row)" v-if="row.status === 'approved' && row.payment_status !== 'paid'">打款</el-button>
            </template>
            <template v-else>
              <span style="color: #909399; font-size: 12px">仅查看</span>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="adjustDialogVisible" title="调整佣金" width="500px">
      <el-form :model="adjustForm" label-width="100px">
        <el-form-item label="佣金比例">
          <el-input-number v-model="adjustForm.commission_rate" :min="0" :max="1" :step="0.05" :precision="2" />
        </el-form-item>
        <el-form-item label="扣罚金额">
          <el-input-number v-model="adjustForm.penalty_amount" :min="0" :precision="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdjust">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { commissionsAPI } from '../api';

const props = defineProps({
  currentRole: {
    type: String,
    default: 'admin'
  }
});

const commissions = ref([]);
const summary = ref([]);

const adjustDialogVisible = ref(false);
const currentCommissionId = ref(null);
const adjustForm = reactive({
  commission_rate: 0.1,
  penalty_amount: 0
});

const loadCommissions = async () => {
  try {
    const res = await commissionsAPI.list();
    commissions.value = res.data || [];
  } catch (error) {
    ElMessage.error('加载分佣列表失败');
  }
};

const loadSummary = async () => {
  try {
    const res = await commissionsAPI.summary();
    summary.value = res.data || [];
  } catch (error) {
    ElMessage.error('加载汇总失败');
  }
};

const openAdjustDialog = (row) => {
  currentCommissionId.value = row.id;
  adjustForm.commission_rate = row.commission_rate;
  adjustForm.penalty_amount = row.penalty_amount;
  adjustDialogVisible.value = true;
};

const submitAdjust = async () => {
  try {
    await commissionsAPI.adjust(currentCommissionId.value, adjustForm);
    ElMessage.success('调整成功');
    adjustDialogVisible.value = false;
    loadCommissions();
    loadSummary();
  } catch (error) {
    ElMessage.error('调整失败');
  }
};

const approve = async (row) => {
  try {
    await ElMessageBox.confirm('确认审批通过？', '提示', { type: 'warning' });
    await commissionsAPI.approve(row.id, { approved_by: 'admin' });
    ElMessage.success('审批成功');
    loadCommissions();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('审批失败');
  }
};

const pay = async (row) => {
  try {
    await ElMessageBox.confirm('确认已打款？', '提示', { type: 'warning' });
    await commissionsAPI.pay(row.id);
    ElMessage.success('打款成功');
    loadCommissions();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('操作失败');
  }
};

onMounted(() => {
  loadCommissions();
  loadSummary();
});
</script>
