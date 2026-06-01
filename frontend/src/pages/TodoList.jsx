import { Link } from 'react-router-dom'
import { common } from '../api'

export default function TodoList({ currentUser, onUpdate, todos }) {

  async function markDone(todoId) {
    await common.updateTodo(todoId, 'completed')
    onUpdate?.()
  }

  const typeConfig = {
    document: { icon: '📄', label: '资料收集' },
    correction: { icon: '✏️', label: '补件' },
    approval: { icon: '✅', label: '待审批' }
  }

  return (
    <div className="todo-list">
      <div className="page-header">
        <h2>📋 待办事项</h2>
      </div>

      {todos?.length > 0 ? (
        <div className="todo-items">
          {todos.map(todo => (
          <div key={todo.id} className="todo-card">
            <div className="todo-left">
              <span className="todo-icon">{typeConfig[todo.type]?.icon || '📌'}</span>
              <div className="todo-content">
                <h4>{todo.title}</h4>
                {todo.description && <p className="todo-desc">{todo.description}</p>}
                <div className="todo-meta">
                  <span className="todo-type">{typeConfig[todo.type]?.label}</span>
                  <span className="todo-customer">客户：{todo.customer_name}</span>
                  <span className="todo-time">{new Date(todo.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="todo-actions">
              {todo.customer_id && (
                <Link to={`/customers/${todo.customer_id}`} className="btn btn-small">
                  前往处理
                </Link>
              )}
              <button className="btn btn-small btn-success" onClick={() => markDone(todo.id)}>
                标记完成
              </button>
            </div>
          </div>
        ))}
        </div>
      ) : (
        <div className="empty-state">🎉 太棒了，暂无待办事项</div>
      )}
    </div>
  )
}
