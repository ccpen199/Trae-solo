<template>
  <div>
    <el-card>
      <template #header>
        <span>异常单列表</span>
      </template>
      <el-table :data="exceptions" border size="small">
        <el-table-column prop="exception_no" label="异常单号" width="150" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.type === 'damage' ? 'danger' : 'warning'">
              {{ { damage: '破损异常', shortage: '库存短缺', other: '其他' }[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="related_type" label="关联类型" width="100">
          <template #default="{ row }">
            {{ { inbound: '入库', outbound: '出库' }[row.related_type] }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'handled' ? 'success' : 'warning'">
              {{ row.status === 'pending' ? '待处理' : '已处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" size="small" type="primary" @click="showHandleDialog(row)">处理</el-button>
            <el-button v-if="row.handling_result" size="small" @click="viewResult(row)">查看结果</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="handleDialogVisible" title="处理异常" width="500px">
      <el-form label-width="100px">
        <el-form-item label="处理结果">
          <el-input v-model="handlingResult" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resultDialogVisible" title="处理结果" width="500px">
      <p>{{ currentResult }}</p>
      <template #footer>
        <el-button @click="resultDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { exceptions } from '../api'
import { ElMessage } from 'element-plus'

export default {
  name: 'Exceptions',
  data() {
    return {
      exceptions: [],
      handleDialogVisible: false,
      resultDialogVisible: false,
      handlingId: null,
      handlingResult: '',
      currentResult: ''
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      const res = await exceptions.list()
      this.exceptions = res.data
    },
    showHandleDialog(row) {
      this.handlingId = row.id
      this.handlingResult = ''
      this.handleDialogVisible = true
    },
    async submitHandle() {
      await exceptions.handle(this.handlingId, { handling_result: this.handlingResult })
      this.handleDialogVisible = false
      this.load()
      ElMessage.success('处理完成')
    },
    viewResult(row) {
      this.currentResult = row.handling_result
      this.resultDialogVisible = true
    }
  }
}
</script>
