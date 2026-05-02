<template>
  <div>
    <div class="page-title">
      <el-button type="primary" link @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <span style="margin-left: 8px">单据详情 - {{ order.order_no }}</span>
    </div>
    
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card style="margin-bottom: 20px">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
              <el-tag :type="getStatusType(order.status)" size="large">
                {{ order.status_display }}
              </el-tag>
            </div>
          </template>
          
          <el-descriptions :column="3" border>
            <el-descriptions-item label="单据编号">{{ order.order_no }}</el-descriptions-item>
            <el-descriptions-item label="税种">{{ order.tax_name }}</el-descriptions-item>
            <el-descriptions-item label="税率">{{ order.tax_rate ? (order.tax_rate * 100).toFixed(2) + '%' : '-' }}</el-descriptions-item>
            <el-descriptions-item label="所属期类型">
              {{ order.period_type === 'monthly' ? '月度' : order.period_type === 'quarterly' ? '季度' : order.period_type || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="所属期开始">{{ order.period_start || '-' }}</el-descriptions-item>
            <el-descriptions-item label="所属期结束">{{ order.period_end || '-' }}</el-descriptions-item>
            <el-descriptions-item label="责任人">{{ order.responsible_person_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="期望完成时间">{{ order.expected_complete_time || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ order.created_by_name }}</el-descriptions-item>
            <el-descriptions-item label="总金额" :span="2">
              <span style="font-size: 18px; font-weight: bold; color: #409eff">
                ¥{{ order.total_amount?.toFixed(2) || '0.00' }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="总税额">
              <span style="font-size: 18px; font-weight: bold; color: #f56c6c">
                ¥{{ order.total_tax_amount?.toFixed(2) || '0.00' }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="风险等级">
              <el-tag 
                :type="order.risk_level === 'high' ? 'danger' : order.risk_level === 'medium' ? 'warning' : 'info'"
                effect="plain"
              >
                {{ order.risk_level === 'high' ? '高' : order.risk_level === 'medium' ? '中' : order.risk_level === 'low' ? '低' : '无' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(order.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="实际完成时间">{{ order.actual_complete_time ? formatDate(order.actual_complete_time) : '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
        
        <el-card style="margin-bottom: 20px">
          <template #header>
            <span>凭证明细</span>
          </template>
          
          <el-table :data="order.details || []" border style="width: 100%">
            <el-table-column label="序号" type="index" width="60" />
            <el-table-column prop="voucher_no" label="凭证号" width="120" />
            <el-table-column prop="voucher_date" label="凭证日期" width="110" />
            <el-table-column prop="item_name" label="项目名称" min-width="150" />
            <el-table-column prop="amount" label="金额" width="120">
              <template #default="scope">
                ¥{{ scope.row.amount?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="tax_rate" label="税率" width="80">
              <template #default="scope">
                {{ (scope.row.tax_rate * 100).toFixed(2) }}%
              </template>
            </el-table-column>
            <el-table-column prop="tax_amount" label="税额" width="120">
              <template #default="scope">
                ¥{{ scope.row.tax_amount?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="remarks" label="备注" min-width="120" />
          </el-table>
          
          <el-empty v-if="!order.details || order.details.length === 0" description="暂无明细" />
        </el-card>
        
        <el-card style="margin-bottom: 20px" v-if="order.statusFlows && order.statusFlows.length > 0">
          <template #header>
            <span>操作流程</span>
          </template>
          
          <div class="timeline-box">
            <el-timeline>
              <el-timeline-item
                v-for="flow in order.statusFlows"
                :key="flow.id"
                :timestamp="formatDate(flow.created_at)"
                placement="top"
                :type="flow.operation_type === 'approve' ? 'success' : flow.operation_type === 'reject' ? 'danger' : 'primary'"
              >
                <h4 style="margin: 0; font-size: 14px">{{ flow.to_status_display }}</h4>
                <p style="margin: 4px 0 0; font-size: 12px; color: #909399">
                  操作人: {{ flow.operator_name }}
                </p>
                <p v-if="flow.operation_remark" style="margin: 4px 0 0; font-size: 12px">
                  备注: {{ flow.operation_remark }}
                </p>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card style="margin-bottom: 20px">
          <template #header>
            <span>可用操作</span>
          </template>
          
          <div style="display: flex; flex-direction: column; gap: 12px">
            <el-button 
              v-if="availableActions.includes('submit')"
              type="primary" 
              :loading="actionLoading"
              @click="handleAction('submit')"
            >
              <el-icon><Upload /></el-icon>
              提交单据
            </el-button>
            
            <el-button 
              v-if="availableActions.includes('calculate')"
              type="primary" 
              :loading="actionLoading"
              @click="handleAction('calculate')"
            >
              <el-icon><Calculator /></el-icon>
              计算税额
            </el-button>
            
            <el-button 
              v-if="availableActions.includes('submit_declaration')"
              type="success" 
              :loading="actionLoading"
              @click="handleAction('submit_declaration')"
            >
              <el-icon><Document /></el-icon>
              申报提交
            </el-button>
            
            <el-button 
              v-if="availableActions.includes('get_receipt')"
              type="success" 
              :loading="actionLoading"
              @click="handleAction('get_receipt')"
            >
              <el-icon><Finished /></el-icon>
              获取回执
            </el-button>
            
            <el-button 
              v-if="availableActions.includes('approve')"
              type="success" 
              :loading="actionLoading"
              @click="handleRiskAction('approve')"
            >
              <el-icon><Check /></el-icon>
              通过
            </el-button>
            
            <el-button 
              v-if="availableActions.includes('reject')"
              type="danger" 
              :loading="actionLoading"
              @click="handleRiskAction('reject')"
            >
              <el-icon><Close /></el-icon>
              驳回
            </el-button>
            
            <el-button 
              v-if="availableActions.includes('request_supplement')"
              type="warning" 
              :loading="actionLoading"
              @click="handleRiskAction('request_supplement')"
            >
              <el-icon><Edit /></el-icon>
              要求补充资料
            </el-button>
            
            <el-button 
              v-if="availableActions.includes('supplement_submit')"
              type="primary" 
              :loading="actionLoading"
              @click="handleAction('supplement_submit')"
            >
              <el-icon><Upload /></el-icon>
              提交补充资料
            </el-button>
            
            <el-divider v-if="availableActions.length > 0" />
            
            <el-button 
              type="warning"
              :loading="actionLoading"
              @click="handleAction('risk_check')"
            >
              <el-icon><Warning /></el-icon>
              执行风险检查
            </el-button>
            
            <el-button 
              type="danger"
              :disabled="order.status === 'completed' || order.status === 'cancelled'"
              :loading="actionLoading"
              @click="handleCancel"
            >
              <el-icon><Delete /></el-icon>
              撤销单据
            </el-button>
          </div>
        </el-card>
        
        <el-card v-if="order.riskChecks && order.riskChecks.details && order.riskChecks.details.length > 0">
          <template #header>
            <span>风险检查结果</span>
          </template>
          
          <div style="display: flex; flex-direction: column; gap: 12px">
            <div style="display: flex; justify-content: space-between">
              <span>通过: {{ order.riskChecks.passed }}</span>
              <span>失败: {{ order.riskChecks.failed }}</span>
            </div>
            
            <el-divider style="margin: 8px 0" />
            
            <div 
              v-for="(item, index) in order.riskChecks.details" 
              :key="index"
              :style="{
                padding: '12px',
                background: item.check_result === 'pass' ? '#f0f9eb' : '#fef0f0',
                borderRadius: '4px',
                marginBottom: '8px'
              }"
            >
              <div style="display: flex; justify-content: space-between; align-items: center">
                <span style="font-weight: 500">{{ item.check_name }}</span>
                <el-tag :type="item.check_result === 'pass' ? 'success' : 'danger'" size="small">
                  {{ item.check_result === 'pass' ? '通过' : '失败' }}
                </el-tag>
              </div>
              <p v-if="item.risk_message" style="margin: 8px 0 0; font-size: 12px; color: #606266">
                {{ item.risk_message }}
              </p>
              <p v-if="item.suggestion" style="margin: 4px 0 0; font-size: 12px; color: #909399">
                建议: {{ item.suggestion }}
              </p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-dialog v-model="actionDialogVisible" :title="actionDialogTitle" width="500px">
      <el-form :model="actionForm" label-width="100px">
        <el-form-item label="审批意见">
          <el-input 
            v-model="actionForm.comment" 
            type="textarea" 
            :rows="4"
            placeholder="请输入意见"
          />
        </el-form-item>
        <el-form-item v-if="currentAction === 'request_supplement'" label="补充事项">
          <el-input 
            v-model="actionForm.supplementItems" 
            type="textarea" 
            :rows="3"
            placeholder="请描述需要补充的内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="actionDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="confirmRiskAction">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { 
  getOrderDetail, 
  submitOrder, 
  calculateTax, 
  submitDeclaration, 
  getReceipt, 
  performRiskCheck, 
  riskAction,
  supplementSubmit,
  cancelOrder
} from '@/api/order'

const route = useRoute()
const router = useRouter()

const order = ref({})
const availableActions = ref([])
const actionLoading = ref(false)
const actionDialogVisible = ref(false)
const actionDialogTitle = ref('')
const currentAction = ref('')

const actionForm = reactive({
  comment: '',
  supplementItems: '',
  rejectReason: ''
})

const fetchOrder = async () => {
  actionLoading.value = true
  try {
    const res = await getOrderDetail(route.params.id)
    order.value = res.data
    availableActions.value = res.data.availableActions || []
  } catch (e) {
    console.error('Fetch order error:', e)
  } finally {
    actionLoading.value = false
  }
}

const getStatusType = (status) => {
  const map = {
    draft: 'info',
    pending_tax_calculation: 'warning',
    pending_declaration: 'warning',
    pending_receipt: 'warning',
    pending_risk_check: 'warning',
    supplement: 'danger',
    completed: 'success',
    rejected: 'danger',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const handleAction = async (action) => {
  actionLoading.value = true
  try {
    let res
    
    switch (action) {
      case 'submit':
        res = await submitOrder(order.value.id)
        ElMessage.success('提交成功')
        break
      
      case 'calculate':
        res = await calculateTax(order.value.id, {})
        ElMessage.success('税额计算完成')
        break
      
      case 'submit_declaration':
        res = await submitDeclaration(order.value.id, {})
        ElMessage.success('申报提交成功')
        break
      
      case 'get_receipt':
        res = await getReceipt(order.value.id, {
          receiptNo: `RCPT-${Date.now()}`
        })
        ElMessage.success('回执获取成功')
        break
      
      case 'supplement_submit':
        res = await supplementSubmit(order.value.id, {
          comment: '补充资料已提交'
        })
        ElMessage.success('补充资料提交成功')
        break
      
      case 'risk_check':
        res = await performRiskCheck(order.value.id)
        ElMessage.success('风险检查完成')
        break
    }
    
    fetchOrder()
  } catch (e) {
    console.error('Action error:', e)
  } finally {
    actionLoading.value = false
  }
}

const handleRiskAction = (action) => {
  currentAction.value = action
  actionForm.comment = ''
  actionForm.supplementItems = ''
  actionForm.rejectReason = ''
  
  const titles = {
    approve: '审批通过',
    reject: '审批驳回',
    request_supplement: '要求补充资料'
  }
  
  actionDialogTitle.value = titles[action] || '操作'
  actionDialogVisible.value = true
}

const confirmRiskAction = async () => {
  actionLoading.value = true
  try {
    const data = {
      action: currentAction.value,
      comment: actionForm.comment
    }
    
    if (currentAction.value === 'reject') {
      data.rejectReason = actionForm.comment
    }
    if (currentAction.value === 'request_supplement') {
      data.supplementItems = actionForm.supplementItems
    }
    
    await riskAction(order.value.id, data)
    
    ElMessage.success('操作成功')
    actionDialogVisible.value = false
    fetchOrder()
  } catch (e) {
    console.error('Risk action error:', e)
  } finally {
    actionLoading.value = false
  }
}

const handleCancel = async () => {
  try {
    await ElMessageBox.confirm('确定要撤销此单据吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await cancelOrder(order.value.id, '用户撤销')
    ElMessage.success('撤销成功')
    fetchOrder()
  } catch {
    // 取消
  }
}

onMounted(() => {
  fetchOrder()
})
</script>
