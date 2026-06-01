export default function TaskList({ tasks, completedTasks, showCompleted, onToggle, onSelect, onDelete }) {
  return (
    <div>
      {tasks.length === 0 && (
        <div style={styles.emptyTasks}>
          <div style={styles.emptyTasksIcon}>✓</div>
          <p>暂无待办任务</p>
        </div>
      )}

      {tasks.map(task => (
        <div 
          key={task.id} 
          style={{ ...styles.taskItem, ...styles[`priority-${task.priority}`] }}
          onClick={() => onSelect(task)}
        >
          <button
            style={styles.checkbox}
            onClick={(e) => { e.stopPropagation(); onToggle(task); }}
          >
            {task.is_completed ? '✓' : ''}
          </button>
          <div style={styles.taskContent}>
            <div style={styles.taskTitleRow}>
              <div style={styles.taskTitle}>{task.title}</div>
              {task.priority > 0 && (
                <span style={{
                  ...styles.priorityBadge,
                  ...styles[`priorityBadge-${task.priority}`]
                }}>
                  {task.priority === 1 ? '低' : task.priority === 2 ? '中' : '高'}
                </span>
              )}
            </div>
            {task.description && (
              <div style={styles.taskDesc}>{task.description.substring(0, 50)}...</div>
            )}
            {task.tags && task.tags.length > 0 && (
              <div style={styles.tagsContainer}>
                {task.tags.map((tag, idx) => (
                  <span key={idx} style={styles.tag}>{tag}</span>
                ))}
              </div>
            )}
            {task.subtasks && task.subtasks.length > 0 && (
              <div style={styles.subtaskInfo}>
                {task.subtasks.filter(st => st.is_completed).length}/{task.subtasks.length} 个子任务
              </div>
            )}
          </div>
          <button
            style={styles.deleteBtn}
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          >
            🗑️
          </button>
        </div>
      ))}

      {showCompleted && completedTasks.length > 0 && (
        <>
          <div style={styles.completedHeader}>已完成 ({completedTasks.length})</div>
          {completedTasks.map(task => (
            <div 
              key={task.id} 
              style={{ ...styles.taskItem, ...styles[`priority-${task.priority}`], ...styles.completedTask }}
              onClick={() => onSelect(task)}
            >
              <button
                style={styles.checkbox}
                onClick={(e) => { e.stopPropagation(); onToggle(task); }}
              >
                ✓
              </button>
              <div style={styles.taskContent}>
                <div style={styles.taskTitleRow}>
                  <div style={{ ...styles.taskTitle, textDecoration: 'line-through', color: '#999' }}>
                    {task.title}
                  </div>
                  {task.priority > 0 && (
                    <span style={{
                      ...styles.priorityBadge,
                      ...styles[`priorityBadge-${task.priority}`],
                      opacity: 0.6
                    }}>
                      {task.priority === 1 ? '低' : task.priority === 2 ? '中' : '高'}
                    </span>
                  )}
                </div>
              </div>
              <button
                style={styles.deleteBtn}
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              >
                🗑️
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

const styles = {
  emptyTasks: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999'
  },
  emptyTasksIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.3
  },
  taskItem: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '16px',
    background: 'white',
    borderRadius: '8px',
    marginBottom: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
    borderLeft: '3px solid transparent'
  },
  'priority-1': {
    borderLeft: '3px solid #2196f3'
  },
  'priority-2': {
    borderLeft: '3px solid #ff9800'
  },
  'priority-3': {
    borderLeft: '3px solid #f44336'
  },
  completedTask: {
    opacity: 0.7
  },
  checkbox: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid #ddd',
    background: 'none',
    marginRight: '12px',
    marginTop: '2px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: '#4caf50',
    flexShrink: 0
  },
  taskContent: {
    flex: 1,
    minWidth: 0
  },
  taskTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px'
  },
  taskTitle: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#333'
  },
  priorityBadge: {
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 600
  },
  'priorityBadge-1': {
    background: '#e3f2fd',
    color: '#2196f3'
  },
  'priorityBadge-2': {
    background: '#fff3e0',
    color: '#ff9800'
  },
  'priorityBadge-3': {
    background: '#ffebee',
    color: '#f44336'
  },
  taskDesc: {
    fontSize: '13px',
    color: '#999',
    marginBottom: '8px'
  },
  tagsContainer: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '6px'
  },
  tag: {
    background: '#f0f0f0',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    color: '#666'
  },
  subtaskInfo: {
    fontSize: '12px',
    color: '#999'
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    opacity: 0.5,
    padding: '4px',
    marginLeft: '8px'
  },
  completedHeader: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#999',
    margin: '24px 0 12px',
    paddingLeft: '8px'
  }
};
