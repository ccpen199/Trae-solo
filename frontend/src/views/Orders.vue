<template>
  <div class="container">
    <div class="page-header">
      <h1 class="page-title">订单管理</h1>
      <el-button type="primary" @click="openDialog" v-if="currentRole !== 'customer'">新增订单</el-button>
    </div>
    
    <el-card>
      <el-form :inline="true" style="margin-bottom: 20px">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="待确认" value="pending" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="已退款" value="refunded" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadOrders">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="orders" border stripe>
        <el-table-column prop="order_no" label="订单号" width="160" />
        <el-table-column prop="activity_title" label="活动" />
        <el-table-column prop="leader_name" label="团长" width="100" />
        <el-table-column prop="customer_name" label="客户" width="100" />
        <el-table-column prop="customer_phone" label="电话" width="120" />
        <el-table-column prop="total_amount" label="金额" width="100">
          <template #default="{ row }">¥{{ row.total_amount }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pickup_status" label="提货" width="100">
          <template #default="{ row }">
            <el-tag :type="row.pickup_status === 'picked' ? 'success' : 'warning'">
              {{ row.pickup_status === 'picked' ? '已提' : '待提' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" :width="currentRole === 'customer' ? 100 : 200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button size="small" @click="confirmPickup(row)" v-if="currentRole !== 'customer' && row.pickup_status !== 'picked' && row.status !== 'refunded'">提货</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-dialog v-model="dialogVisible" title="新增订单" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="活动" required>
          <el-select v-model="form.activity_id" placeholder="请选择活动" style="width: 100%" @change="onActivityChange">
            <el-option v-for="act in activityList" :key="act.id" :label="act.title" :value="act.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="团长" required>
          <el-select v-model="form.leader_id" placeholder="请选择团长" style="width: 100%">
            <el-option v-for="leader in leaderList" :key="leader.id" :label="leader.name" :value="leader.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户姓名" required>
          <el-input v-model="form.customer_name" placeholder="请输入客户姓名" />
        </el-form-item>
        <el-form-item label="客户电话" required>
          <el-input v-model="form.customer_phone" placeholder="请输入客户电话" />
        </el-form-item>
        <el-form-item label="商品">
          <el-button size="small" @click="addItem">添加商品</el-button>
          <div v-for="(item, index) in form.items" :key="index" style="display: flex; gap: 10px; margin-bottom: 10px">
            <el-select v-model="item.product_id" placeholder="选择商品" style="flex: 2">
              <el-option v-for="p in currentProducts" :key="p.id" :label="p.name + '(库存:' + (p.stock - p.sold) + ')'" :value="p.id" />
            </el-select>
            <el-input-number v-model="item.quantity" :min="1" placeholder="数量" style="width: 100px" />
            <el-button size="small" type="danger" @click="removeItem(index)">删除</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveOrder">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="订单详情" width="600px">
      <div v-if="currentOrder">
        <p><strong>订单号：</strong>{{ currentOrder.order_no }}</p>
        <p><strong>活动：</strong>{{ currentOrder.activity_title }}</p>
        <p><strong>客户：</strong>{{ currentOrder.customer_name }} ({{ currentOrder.customer_phone }})</p>
        <p><strong>金额：</strong>¥{{ currentOrder.total_amount }}</p>
        <p><strong>状态：</strong>{{ getStatusText(currentOrder.status) }}</p>
        <h4 style="margin: 20px 0 10px">商品明细</h4>
        <el-table :data="currentOrder.items || []" size="small">
          <el-table-column prop="product_name" label="商品" />
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column prop="price" label="单价" width="100">
            <template #default="{ row }">¥{{ row.price }}</template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计" width="100">
            <template #default="{ row }">¥{{ row.subtotal }}</template>
          </el-table-column>
        </el-table>
        <div style="margin-top: 20px; text-align: right" v-if="currentOrder.status !== 'refunded'">
          <el-button type="warning" @click="openAfterSalesDialog">申请售后</el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="afterSalesDialogVisible" title="申请售后" width="500px">
      <el-form :model="afterSalesForm" label-width="100px">
        <el-form-item label="类型" required>
          <el-select v-model="afterSalesForm.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="退款" value="refund" />
            <el-option label="换货" value="exchange" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="原因" required>
          <el-input v-model="afterSalesForm.reason" type="textarea" :rows="3" placeholder="请输入售后原因" />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="afterSalesForm.amount" :min="0" :max="currentOrder?.total_amount || 0" :precision="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="afterSalesDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAfterSales">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ordersAPI, activitiesAPI, leadersAPI, afterSalesAPI } from '../api';

const props = defineProps({
  currentRole: {
    type: String,
    default: 'admin'
  }
});

const orders = ref([]);
const activityList = ref([]);
const leaderList = ref([]);
const currentProducts = ref([]);
const filters = reactive({ status: '' });

const dialogVisible = ref(false);
const detailVisible = ref(false);
const afterSalesDialogVisible = ref(false);
const currentOrder = ref(null);
const form = reactive({
  activity_id: null,
  leader_id: null,
  customer_name: '',
  customer_phone: '',
  items: []
});
const afterSalesForm = reactive({
  type: 'refund',
  reason: '',
  amount: 0
});

const getStatusType = (status) => {
  const types = { pending: 'warning', confirmed: 'success', refunded: 'danger' };
  return types[status] || 'info';
};

const getStatusText = (status) => {
  const texts = { pending: '待确认', confirmed: '已确认', refunded: '已退款' };
  return texts[status] || status;
};

const loadOrders = async () => {
  try {
    const params = {};
    if (filters.status) params.status = filters.status;
    const res = await ordersAPI.list(params);
    orders.value = res.data || [];
  } catch (error) {
    ElMessage.error('加载订单列表失败');
  }
};

const loadActivities = async () => {
  try {
    const res = await activitiesAPI.list();
    activityList.value = res.data || [];
  } catch (error) {
    ElMessage.error('加载活动列表失败');
  }
};

const loadLeaders = async () => {
  try {
    const res = await leadersAPI.list({ status: 'active' });
    leaderList.value = res.data || [];
  } catch (error) {
    ElMessage.error('加载团长列表失败');
  }
};

const onActivityChange = async (activityId) => {
  try {
    const res = await activitiesAPI.get(activityId);
    currentProducts.value = res.data?.products || [];
  } catch (error) {
    currentProducts.value = [];
  }
};

const resetFilters = () => {
  filters.status = '';
  loadOrders();
};

const addItem = () => {
  form.items.push({ product_id: null, quantity: 1 });
};

const removeItem = (index) => {
  form.items.splice(index, 1);
};

const openDialog = () => {
  Object.assign(form, {
    activity_id: null,
    leader_id: null,
    customer_name: '',
    customer_phone: '',
    items: []
  });
  currentProducts.value = [];
  dialogVisible.value = true;
};

const viewDetail = async (row) => {
  try {
    const res = await ordersAPI.get(row.id);
    currentOrder.value = res.data;
    detailVisible.value = true;
  } catch (error) {
    ElMessage.error('加载详情失败');
  }
};

const openAfterSalesDialog = () => {
  afterSalesForm.type = 'refund';
  afterSalesForm.reason = '';
  afterSalesForm.amount = currentOrder.value?.total_amount || 0;
  afterSalesDialogVisible.value = true;
};

const submitAfterSales = async () => {
  if (!afterSalesForm.reason) {
    ElMessage.warning('请填写售后原因');
    return;
  }
  
  try {
    await afterSalesAPI.create({
      order_id: currentOrder.value.id,
      leader_id: currentOrder.value.leader_id,
      type: afterSalesForm.type,
      reason: afterSalesForm.reason,
      amount: afterSalesForm.amount
    });
    ElMessage.success('售后申请已提交，等待审核');
    afterSalesDialogVisible.value = false;
    detailVisible.value = false;
    loadOrders();
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '提交失败');
  }
};

const confirmPickup = async (row) => {
  try {
    await ElMessageBox.confirm('确认提货完成？', '提示', { type: 'warning' });
    await ordersAPI.confirmPickup(row.id, {});
    ElMessage.success('提货确认成功');
    loadOrders();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('操作失败');
  }
};

const saveOrder = async () => {
  if (!form.activity_id || !form.leader_id || !form.customer_name || !form.customer_phone || form.items.length === 0) {
    ElMessage.warning('请填写完整信息');
    return;
  }
  
  try {
    await ordersAPI.create(form);
    ElMessage.success('创建成功');
    dialogVisible.value = false;
    loadOrders();
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '保存失败');
  }
};

onMounted(() => {
  loadOrders();
  loadActivities();
  loadLeaders();
});
</script>
