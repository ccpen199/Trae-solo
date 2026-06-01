import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listsAPI, tasksAPI } from '../api';
import TaskList from '../components/TaskList';
import TaskDetail from '../components/TaskDetail';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState(0);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedList) {
      loadTasks(selectedList.id);
    }
  }, [selectedList, showCompleted]);

  const loadData = async () => {
    try {
      const [listsRes] = await Promise.all([
        listsAPI.getAll()
      ]);
      setLists(listsRes.data);
      if (listsRes.data.length > 0) {
        setSelectedList(listsRes.data[0]);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (listId) => {
    try {
      const res = await tasksAPI.getAll({ 
        list_id: listId, 
        completed: showCompleted 
      });
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  const createList = async () => {
    const name = newListName.trim();
    if (name) {
      try {
        const res = await listsAPI.create({ name });
        setLists([...lists, res.data]);
        setNewListName('');
        setShowNewList(false);
      } catch (err) {
        alert('创建清单失败');
      }
    }
  };

  const createTask = async () => {
    if (!selectedList) return;
    const title = newTaskTitle.trim();
    if (title) {
      try {
        const res = await tasksAPI.create({ 
          title, 
          list_id: selectedList.id,
          priority: newTaskPriority
        });
        setTasks([...tasks, res.data]);
        setNewTaskTitle('');
        setNewTaskPriority(0);
        setShowNewTask(false);
      } catch (err) {
        alert('创建任务失败');
      }
    }
  };

  const toggleTask = async (task) => {
    try {
      const res = await tasksAPI.update(task.id, {
        is_completed: task.is_completed ? 0 : 1
      });
      setTasks(tasks.map(t => t.id === task.id ? res.data : t));
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const deleteTask = async (taskId) => {
    if (!confirm('确定删除此任务？')) return;
    try {
      await tasksAPI.delete(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh' 
      }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.logoSmall}>✓</span>
          <span style={styles.appName}>滴答清单</span>
        </div>
        
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {user.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div style={styles.username}>{user.username}</div>
            <button style={styles.logoutBtn} onClick={logout}>退出</button>
          </div>
        </div>

        <div style={styles.sectionTitle}>我的清单</div>
        <div style={styles.listContainer}>
          {lists.map(list => (
            <div
              key={list.id}
              onClick={() => setSelectedList(list)}
              style={{
                ...styles.listItem,
                background: selectedList?.id === list.id ? '#fff3f0' : 'transparent',
                borderColor: selectedList?.id === list.id ? list.color : 'transparent'
              }}
            >
              <span style={{ color: list.color, marginRight: '8px' }}>{list.icon || '📋'}</span>
              <span style={{ flex: 1 }}>{list.name}</span>
              <span style={styles.taskCount}>{list.task_count || 0}</span>
            </div>
          ))}
          
          {showNewList && (
            <div style={styles.newListForm}>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createList()}
                placeholder="输入清单名称..."
                style={styles.newListInput}
                autoFocus
              />
              <div style={styles.newListActions}>
                <button onClick={createList} style={styles.newListSubmitBtn}>
                  创建
                </button>
                <button 
                  onClick={() => {
                    setShowNewList(false);
                    setNewListName('');
                  }} 
                  style={styles.newListCancelBtn}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>

        <button style={styles.addListBtn} onClick={() => setShowNewList(true)}>
          + 新建清单
        </button>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h2 style={styles.listTitle}>{selectedList?.name || '选择一个清单'}</h2>
          <div style={styles.headerActions}>
            <button 
              style={{
                ...styles.toggleBtn,
                background: showCompleted ? '#dd4b39' : '#f5f5f5',
                color: showCompleted ? 'white' : '#666'
              }}
              onClick={() => setShowCompleted(!showCompleted)}
            >
              显示已完成
            </button>
            <button style={styles.addTaskBtn} onClick={() => setShowNewTask(true)}>
              + 新建任务
            </button>
            <button 
              style={styles.searchBtn}
              onClick={() => navigate('/search')}
            >
              🔍 搜索
            </button>
          </div>
        </div>

        <div style={styles.taskListContainer}>
          {selectedList ? (
            <>
              {showNewTask && (
                <div style={styles.newTaskForm}>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createTask()}
                    placeholder="输入任务标题..."
                    style={styles.newTaskInput}
                    autoFocus
                  />
                  <div style={styles.prioritySelector}>
                    <span style={styles.priorityLabel}>优先级：</span>
                    {[0, 1, 2, 3].map(p => (
                      <button
                        key={p}
                        onClick={() => setNewTaskPriority(p)}
                        style={{
                          ...styles.priorityOption,
                          ...styles[`priorityOption-${p}`],
                          background: newTaskPriority === p ? 
                            (p === 0 ? '#f5f5f5' : p === 1 ? '#e3f2fd' : p === 2 ? '#fff3e0' : '#ffebee') : 
                            '#fafafa',
                          borderColor: newTaskPriority === p ? 
                            (p === 0 ? '#999' : p === 1 ? '#2196f3' : p === 2 ? '#ff9800' : '#f44336') : 
                            '#e0e0e0',
                          color: newTaskPriority === p ? 
                            (p === 0 ? '#666' : p === 1 ? '#2196f3' : p === 2 ? '#ff9800' : '#f44336') : 
                            '#999',
                          fontWeight: newTaskPriority === p ? 600 : 400
                        }}
                      >
                        {p === 0 ? '无' : p === 1 ? '低' : p === 2 ? '中' : '高'}
                      </button>
                    ))}
                  </div>
                  <div style={styles.newTaskActions}>
                    <button onClick={createTask} style={styles.newTaskSubmitBtn}>
                      添加
                    </button>
                    <button 
                      onClick={() => {
                        setShowNewTask(false);
                        setNewTaskTitle('');
                        setNewTaskPriority(0);
                      }} 
                      style={styles.newTaskCancelBtn}
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
              <TaskList
                tasks={tasks.filter(t => !t.is_completed)}
                completedTasks={tasks.filter(t => t.is_completed)}
                showCompleted={showCompleted}
                onToggle={toggleTask}
                onSelect={setSelectedTask}
                onDelete={deleteTask}
              />
            </>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📋</div>
              <p>选择一个清单查看任务</p>
            </div>
          )}
        </div>
      </div>

      {selectedTask && (
        <div style={styles.detailPanel}>
          <TaskDetail
            task={selectedTask}
            lists={lists}
            onClose={() => setSelectedTask(null)}
            onUpdate={(updated) => {
              setTasks(tasks.map(t => t.id === updated.id ? updated : t));
              setSelectedTask(updated);
            }}
          />
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    background: '#f8f9fa'
  },
  sidebar: {
    width: '280px',
    background: 'white',
    borderRight: '1px solid #e8e8e8',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px'
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0 20px',
    borderBottom: '1px solid #eee',
    marginBottom: '16px'
  },
  logoSmall: {
    fontSize: '24px',
    color: '#dd4b39'
  },
  appName: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #dd4b39 0%, #c53727 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '16px'
  },
  username: {
    fontWeight: 500,
    fontSize: '14px',
    color: '#333'
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: '#999',
    fontSize: '12px',
    cursor: 'pointer',
    padding: 0
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: '12px'
  },
  listContainer: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '16px'
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '4px',
    fontSize: '14px',
    borderLeft: '3px solid transparent'
  },
  taskCount: {
    background: '#e8e8e8',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    color: '#666'
  },
  addListBtn: {
    padding: '10px',
    background: '#f5f5f5',
    border: 'none',
    borderRadius: '6px',
    color: '#666',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background 0.2s'
  },
  newListForm: {
    background: '#fff3f0',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '8px',
    border: '2px solid #dd4b39'
  },
  newListInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    marginBottom: '10px'
  },
  newListActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end'
  },
  newListSubmitBtn: {
    padding: '6px 14px',
    background: '#dd4b39',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: 500
  },
  newListCancelBtn: {
    padding: '6px 14px',
    background: '#fff',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '13px',
    cursor: 'pointer'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    padding: '20px 24px',
    background: 'white',
    borderBottom: '1px solid #e8e8e8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  listTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#333'
  },
  headerActions: {
    display: 'flex',
    gap: '12px'
  },
  toggleBtn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer'
  },
  addTaskBtn: {
    padding: '8px 16px',
    background: '#dd4b39',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer'
  },
  searchBtn: {
    padding: '8px 16px',
    background: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer'
  },
  taskListContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px 24px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  detailPanel: {
    width: '400px',
    background: 'white',
    borderLeft: '1px solid #e8e8e8',
    overflowY: 'auto'
  },
  newTaskForm: {
    background: 'white',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '2px solid #dd4b39'
  },
  newTaskInput: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    marginBottom: '12px'
  },
  newTaskActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  },
  prioritySelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    flexWrap: 'wrap'
  },
  priorityLabel: {
    fontSize: '13px',
    color: '#666',
    fontWeight: 500
  },
  priorityOption: {
    padding: '4px 12px',
    border: '1px solid',
    borderRadius: '12px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  newTaskSubmitBtn: {
    padding: '8px 20px',
    background: '#dd4b39',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: 500
  },
  newTaskCancelBtn: {
    padding: '8px 20px',
    background: '#f5f5f5',
    color: '#666',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer'
  }
}
