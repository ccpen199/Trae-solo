<template>
  <div class="table-select">
    <div class="header">
      <button class="back-btn" @click="$router.back()">←</button>
      <h2>选择桌号</h2>
    </div>
    
    <div class="content">
      <div class="tables-grid">
        <div 
          v-for="table in tables" 
          :key="table.id"
          class="table-item"
          :class="{ selected: selectedTable?.id === table.id, occupied: table.status === 'occupied' }"
          @click="selectTable(table)"
        >
          <div class="table-icon">🪑</div>
          <div class="table-number">{{ table.table_number }}</div>
          <div class="table-capacity">{{ table.capacity }}人</div>
        </div>
      </div>
      
      <div v-if="selectedTable" class="selected-info card">
        <h3>已选择: {{ selectedTable.table_number }}</h3>
        <button class="btn btn-primary btn-block" @click="confirmTable">确认并开始点餐</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'TableSelect',
  data() {
    return {
      tables: [],
      selectedTable: null
    }
  },
  mounted() {
    this.loadTables()
  },
  methods: {
    async loadTables() {
      try {
        const restaurantId = localStorage.getItem('restaurantId') || 1
        const res = await axios.get(`http://localhost:19881/api/restaurants/${restaurantId}/tables`)
        this.tables = res.data
      } catch (e) {
        console.error(e)
      }
    },
    selectTable(table) {
      if (table.status === 'occupied') return
      this.selectedTable = table
    },
    async confirmTable() {
      localStorage.setItem('tableId', this.selectedTable.id)
      localStorage.setItem('tableNumber', this.selectedTable.table_number)
      
      const queueId = localStorage.getItem('queueId')
      if (queueId) {
        try {
          await axios.put(`http://localhost:19881/api/queues/${queueId}/confirm`, {
            table_id: this.selectedTable.id
          })
        } catch (e) {
          console.error('确认排队失败', e)
        }
      }
      
      this.$router.push('/menu')
    }
  }
}
</script>

<style scoped>
.table-select {
  min-height: 100vh;
  background: #f5f5f5;
}
.header {
  background: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.back-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
}
.header h2 {
  font-size: 18px;
  color: #333;
}
.content {
  padding: 20px;
}
.tables-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.table-item {
  background: white;
  border-radius: 12px;
  padding: 16px 8px;
  text-align: center;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.3s;
}
.table-item:hover:not(.occupied) {
  border-color: #ff6b6b;
}
.table-item.selected {
  border-color: #ff6b6b;
  background: #fff5f5;
}
.table-item.occupied {
  opacity: 0.5;
  cursor: not-allowed;
  background: #eee;
}
.table-icon {
  font-size: 32px;
  margin-bottom: 8px;
}
.table-number {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}
.table-capacity {
  font-size: 12px;
  color: #666;
}
.selected-info h3 {
  margin-bottom: 12px;
  color: #333;
}
</style>
