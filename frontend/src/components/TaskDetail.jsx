import { useState } from 'react';
import { tasksAPI } from '../api';

export default function TaskDetail({ task, lists, onClose, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    list_id: task.list_id,
    due_date: task.due_date || '',
    tags: task.tags || []
  });
  const [newTag, setNewTag] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  const saveChanges = async () => {
    try {
      const res = await tasksAPI.update(task.id, formData);
      onUpdate(res.data);
      setEditing(false);
    } catch (err) {
      alert('保存失败');
    }
  };

  const addTag = () => {
    const tagName = newTag.trim();
    if (tagName && !formData.tags.find(t => t.toLowerCase() === tagName.toLowerCase())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagName]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tagToRemove)
    });
  };

  const addSubtask = async () => {
    if (newSubtask.trim()) {
      try {
        const res = await tasksAPI.create({
          title: newSubtask.trim(),
          list_id: task.list_id,
          parent_id: task.id
        });
        const updatedTask = await tasksAPI.get(task.id);
        onUpdate(updatedTask.data);
        setNewSubtask('');
      } catch (err) {
        alert('添加子任务失败');
      }
    }
  };

  const toggleSubtask = async (subtask) => {
    try {
      await tasksAPI.update(subtask.id, {
        is_completed: subtask.is_completed ? 0 : 1
      });
      const updatedTask = await tasksAPI.get(task.id);
      onUpdate(updatedTask.data);
    } catch (err) {
      console.error('Failed to toggle subtask:', err);
    }
  };

  const deleteSubtask = async (subtaskId) => {
    if (!confirm('确定删除此子任务？')) return;
    try {
      await tasksAPI.delete(subtaskId);
      const updatedTask = await tasksAPI.get(task.id);
      onUpdate(updatedTask.data);
    } catch (err) {
      console.error('Failed to delete subtask:', err);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      <div style={styles.content}>
        {editing ? (
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            style={styles.titleInput}
            autoFocus
          />
        ) : (
          <h3 style={styles.title} onClick={() => setEditing(true)}>{task.title}</h3>
        )}

        <div style={styles.section}>
          <div style={styles.sectionLabel}>所属清单</div>
          <select
            value={formData.list_id}
            onChange={(e) => setFormData({ ...formData, list_id: parseInt(e.target.value) })}
            style={styles.select}
          >
            {lists.map(list => (
              <option key={list.id} value={list.id}>{list.name}</option>
            ))}
          </select>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionLabel}>优先级</div>
          <div style={styles.priorityOptions}>
            {[0, 1, 2, 3].map(p => (
              <button
                key={p}
                onClick={() => setFormData({ ...formData, priority: p })}
                style={{
                  ...styles.priorityBtn,
                  background: formData.priority === p ? 
                    (p === 0 ? '#f5f5f5' : p === 1 ? '#2196f3' : p === 2 ? '#ff9800' : '#f44336') : 
                    '#f5f5f5',
                  color: formData.priority === p && p > 0 ? 'white' : '#666'
                }}
              >
                {p === 0 ? '无' : p === 1 ? '低' : p === 2 ? '中' : '高'}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionLabel}>截止日期</div>
          <input
            type="date"
            value={formData.due_date ? formData.due_date.split('T')[0] : ''}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            style={styles.input}
          />
        </div>

        <div style={styles.section}>
          <div style={styles.sectionLabel}>标签</div>
          <div style={styles.tagsContainer}>
            {formData.tags.map((tag, idx) => (
              <span key={idx} style={styles.tag}>
                {tag}
                <button onClick={() => removeTag(tag)} style={styles.removeTagBtn}>×</button>
              </span>
            ))}
          </div>
          <div style={styles.tagInputContainer}>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              placeholder="添加标签"
              style={styles.tagInput}
            />
            <button onClick={addTag} style={styles.addBtn}>添加</button>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionLabel}>子任务</div>
          {task.subtasks && task.subtasks.length > 0 ? (
            task.subtasks.map(subtask => (
              <div key={subtask.id} style={styles.subtaskItem}>
                <button
                  onClick={() => toggleSubtask(subtask)}
                  style={{
                    ...styles.subtaskCheckbox,
                    background: subtask.is_completed ? '#4caf50' : 'transparent'
                  }}
                >
                  {subtask.is_completed ? '✓' : ''}
                </button>
                <span style={{
                  ...styles.subtaskTitle,
                  textDecoration: subtask.is_completed ? 'line-through' : 'none',
                  color: subtask.is_completed ? '#999' : '#333'
                }}>
                  {subtask.title}
                </span>
                <button
                  onClick={() => deleteSubtask(subtask.id)}
                  style={styles.deleteSubtaskBtn}
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <div style={styles.emptySubtasks}>暂无子任务</div>
          )}
          <div style={styles.subtaskInputContainer}>
            <input
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
              placeholder="输入子任务名称..."
              style={styles.subtaskInput}
            />
            <button onClick={addSubtask} style={styles.addBtn}>添加</button>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionLabel}>描述</div>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="添加任务描述..."
            style={styles.textarea}
          />
        </div>

        <div style={styles.meta}>
          <div>创建时间: {new Date(task.created_at).toLocaleString('zh-CN')}</div>
          {task.completed_at && (
            <div>完成时间: {new Date(task.completed_at).toLocaleString('zh-CN')}</div>
          )}
        </div>

        <button onClick={saveChanges} style={styles.saveBtn}>保存更改</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999',
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%'
  },
  content: {
    padding: '20px',
    flex: 1,
    overflowY: 'auto'
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '24px',
    cursor: 'pointer'
  },
  titleInput: {
    fontSize: '20px',
    fontWeight: 600,
    padding: '8px 0',
    border: 'none',
    borderBottom: '2px solid #dd4b39',
    outline: 'none',
    width: '100%',
    marginBottom: '24px'
  },
  section: {
    marginBottom: '20px'
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: '8px'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  },
  priorityOptions: {
    display: 'flex',
    gap: '8px'
  },
  priorityBtn: {
    flex: 1,
    padding: '8px 12px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer'
  },
  tagsContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '12px'
  },
  tag: {
    background: '#e8e8e8',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  removeTagBtn: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#666',
    padding: 0,
    lineHeight: 1
  },
  tagInputContainer: {
    display: 'flex',
    gap: '8px'
  },
  tagInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none'
  },
  addBtn: {
    padding: '8px 16px',
    background: '#dd4b39',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer'
  },
  subtaskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0'
  },
  deleteSubtaskBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    color: '#999',
    cursor: 'pointer',
    padding: '0 4px',
    marginLeft: 'auto',
    opacity: 0.6,
    transition: 'opacity 0.2s',
    ':hover': {
      color: '#f44336',
      opacity: 1
    }
  },
  emptySubtasks: {
    fontSize: '13px',
    color: '#999',
    textAlign: 'center',
    padding: '12px 0',
    fontStyle: 'italic'
  },
  subtaskCheckbox: {
    width: '18px',
    height: '18px',
    borderRadius: '3px',
    border: '2px solid #ddd',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: 'white',
    cursor: 'pointer',
    padding: 0
  },
  subtaskTitle: {
    fontSize: '14px'
  },
  subtaskInputContainer: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px'
  },
  subtaskInput: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '13px',
    outline: 'none'
  },
  textarea: {
    width: '100%',
    minHeight: '100px',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  meta: {
    fontSize: '12px',
    color: '#999',
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
    lineHeight: 1.8
  },
  saveBtn: {
    width: '100%',
    padding: '12px',
    background: '#dd4b39',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '20px'
  }
};
