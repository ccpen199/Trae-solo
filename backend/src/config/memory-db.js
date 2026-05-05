const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

let dbInitialized = false;

let users = [];
let documents = [];
let processNodes = [];
let approvalComments = [];
let todoTasks = [];
let documentPermissions = [];
let attachments = [];

let documentCounter = 0;
let userCounter = 0;

const initMemoryDB = async () => {
  if (dbInitialized) return;

  console.log('初始化内存数据库（降级模式）...');

  const defaultUsers = [
    { username: 'admin', password: 'admin123', name: '管理员', email: 'admin@company.com', department: '综合部', role: 'admin' },
    { username: 'user1', password: 'user123', name: '张三', email: 'user1@company.com', department: '技术部', role: 'user' },
    { username: 'user2', password: 'user123', name: '李四', email: 'user2@company.com', department: '财务部', role: 'user' },
    { username: 'approver', password: 'approver123', name: '王总', email: 'approver@company.com', department: '领导层', role: 'approver' },
  ];

  for (const user of defaultUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const userId = ++userCounter;
    users.push({
      id: userId,
      username: user.username,
      password: hashedPassword,
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  dbInitialized = true;
  console.log('内存数据库初始化完成（降级模式）');
  console.log('默认用户已创建：admin, user1, user2, approver');
};

const generateDocumentNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  documentCounter++;
  const serial = String(documentCounter).padStart(4, '0');
  return `FW-${year}${month}${serial}`;
};

const query = async (text, params) => {
  const lowerText = text.trim().toLowerCase();

  if (lowerText.startsWith('select')) {
    return handleSelect(text, params);
  } else if (lowerText.startsWith('insert')) {
    return handleInsert(text, params);
  } else if (lowerText.startsWith('update')) {
    return handleUpdate(text, params);
  } else if (lowerText.startsWith('create')) {
    return { rows: [] };
  } else if (lowerText.startsWith('create index')) {
    return { rows: [] };
  }

  console.warn('未处理的SQL:', text);
  return { rows: [] };
};

const handleSelect = (text, params) => {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('from users')) {
    if (lowerText.includes('where username =')) {
      const username = params[0];
      const user = users.find(u => u.username === username);
      return { rows: user ? [user] : [] };
    }
    if (lowerText.includes('where id =')) {
      const id = params[0];
      const user = users.find(u => u.id === id);
      return { rows: user ? [user] : [] };
    }
    return { rows: [...users] };
  }

  if (lowerText.includes('from documents')) {
    let results = [...documents];

    if (lowerText.includes('where')) {
      if (lowerText.includes('creator_id =')) {
        const creatorMatch = text.match(/creator_id\s*=\s*\$(\d+)/i);
        if (creatorMatch) {
          const paramIndex = parseInt(creatorMatch[1]) - 1;
          const creatorId = params[paramIndex];
          results = results.filter(d => d.creator_id === creatorId);
        }
      }
      if (lowerText.includes('id =')) {
        const idMatch = text.match(/id\s*=\s*\$(\d+)/i);
        if (idMatch) {
          const paramIndex = parseInt(idMatch[1]) - 1;
          const docId = params[paramIndex];
          results = results.filter(d => d.id === docId);
        }
      }
    }

    if (lowerText.includes('order by')) {
      const orderMatch = lowerText.match(/order by\s+(\w+)\s+(asc|desc)/i);
      if (orderMatch) {
        const orderField = orderMatch[1];
        const orderDir = orderMatch[2];
        results.sort((a, b) => {
          const aVal = a[orderField];
          const bVal = b[orderField];
          if (orderDir === 'desc') {
            return bVal > aVal ? 1 : -1;
          }
          return aVal > bVal ? 1 : -1;
        });
      }
    }

    results = results.map(d => ({
      ...d,
      creator_name: users.find(u => u.id === d.creator_id)?.name,
    }));

    let total = results.length;

    const limitMatch = lowerText.match(/limit\s+\$(\d+)/i);
    const offsetMatch = lowerText.match(/offset\s+\$(\d+)/i);

    if (limitMatch && offsetMatch) {
      const limitIndex = parseInt(limitMatch[1]) - 1;
      const offsetIndex = parseInt(offsetMatch[1]) - 1;
      const limit = params[limitIndex];
      const offset = params[offsetIndex];
      results = results.slice(offset, offset + limit);
    }

    if (lowerText.includes('count(*)')) {
      return { rows: [{ total: total.toString() }] };
    }

    return { rows: results };
  }

  if (lowerText.includes('from process_nodes')) {
    let results = [...processNodes];

    if (lowerText.includes('where')) {
      const docIdMatch = text.match(/document_id\s*=\s*\$(\d+)/i);
      if (docIdMatch) {
        const paramIndex = parseInt(docIdMatch[1]) - 1;
        const docId = params[paramIndex];
        results = results.filter(n => n.document_id === docId);
      }
    }

    results = results.sort((a, b) => a.node_order - b.node_order);

    results = results.map(n => ({
      ...n,
      handler_name: users.find(u => u.id === n.handler_id)?.name,
      handler_department: users.find(u => u.id === n.handler_id)?.department,
    }));

    return { rows: results };
  }

  if (lowerText.includes('from approval_comments')) {
    let results = [...approvalComments];

    if (lowerText.includes('where')) {
      const docIdMatch = text.match(/document_id\s*=\s*\$(\d+)/i);
      if (docIdMatch) {
        const paramIndex = parseInt(docIdMatch[1]) - 1;
        const docId = params[paramIndex];
        results = results.filter(c => c.document_id === docId);
      }
    }

    results = results.map(c => ({
      ...c,
      user_name: users.find(u => u.id === c.user_id)?.name,
    }));

    return { rows: results };
  }

  if (lowerText.includes('from todo_tasks')) {
    let results = [...todoTasks];

    if (lowerText.includes('where')) {
      const userIdMatch = text.match(/user_id\s*=\s*\$(\d+)/i);
      if (userIdMatch) {
        const paramIndex = parseInt(userIdMatch[1]) - 1;
        const userId = params[paramIndex];
        results = results.filter(t => t.user_id === userId);
      }

      const statusMatch = text.match(/status\s*=\s*\$(\d+)/i);
      if (statusMatch) {
        const paramIndex = parseInt(statusMatch[1]) - 1;
        const status = params[paramIndex];
        results = results.filter(t => t.status === status);
      }
    }

    results = results.map(t => {
      const doc = documents.find(d => d.id === t.document_id);
      return {
        ...t,
        document_title: doc?.title,
        document_number: doc?.document_number,
        document_status: doc?.status,
        category: doc?.category,
        creator_name: users.find(u => u.id === doc?.creator_id)?.name,
      };
    });

    let total = results.length;

    if (lowerText.includes('limit') && lowerText.includes('offset')) {
      const limitMatch = lowerText.match(/limit\s+\$(\d+)/i);
      const offsetMatch = lowerText.match(/offset\s+\$(\d+)/i);
      if (limitMatch && offsetMatch) {
        const limitIndex = parseInt(limitMatch[1]) - 1;
        const offsetIndex = parseInt(offsetMatch[1]) - 1;
        const limit = params[limitIndex];
        const offset = params[offsetIndex];
        results = results.slice(offset, offset + limit);
      }
    }

    if (lowerText.includes('count(*)')) {
      return { rows: [{ total: total.toString() }] };
    }

    return { rows: results };
  }

  if (lowerText.includes('from document_permissions')) {
    let results = [...documentPermissions];

    if (lowerText.includes('where')) {
      const docIdMatch = text.match(/document_id\s*=\s*\$(\d+)/i);
      const userIdMatch = text.match(/user_id\s*=\s*\$(\d+)/i);
      
      if (docIdMatch && userIdMatch) {
        const docIdx = parseInt(docIdMatch[1]) - 1;
        const userIdx = parseInt(userIdMatch[1]) - 1;
        results = results.filter(p => 
          p.document_id === params[docIdx] && p.user_id === params[userIdx]
        );
      }
    }

    return { rows: results };
  }

  if (lowerText.includes('from attachments')) {
    return { rows: [...attachments] };
  }

  console.log('查询SQL:', text, params);
  return { rows: [] };
};

const handleInsert = (text, params) => {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('into users')) {
    const user = {
      id: ++userCounter,
      username: params[0],
      password: params[1],
      name: params[2],
      email: params[3],
      department: params[4],
      role: params[5],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    users.push(user);
    return { rows: [user] };
  }

  if (lowerText.includes('into documents')) {
    const doc = {
      id: documents.length + 1,
      title: params[0],
      content: params[1],
      category: params[2],
      security_level: params[3],
      document_number: generateDocumentNumber(),
      document_type: params[4],
      status: params[5],
      current_node: null,
      creator_id: params[6],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_archived: false,
    };
    documents.push(doc);
    return { rows: [doc] };
  }

  if (lowerText.includes('into process_nodes')) {
    const node = {
      id: processNodes.length + 1,
      document_id: params[0],
      node_name: params[1],
      node_order: params[2],
      node_type: params[3],
      handler_id: params[4],
      status: params[5],
      started_at: params[3] === '当前' ? new Date().toISOString() : null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    processNodes.push(node);
    return { rows: [node] };
  }

  if (lowerText.includes('into approval_comments')) {
    const comment = {
      id: approvalComments.length + 1,
      document_id: params[0],
      node_id: params[1],
      user_id: params[2],
      comment: params[3],
      action: params[4],
      created_at: new Date().toISOString(),
    };
    approvalComments.push(comment);
    return { rows: [comment] };
  }

  if (lowerText.includes('into todo_tasks')) {
    const task = {
      id: todoTasks.length + 1,
      user_id: params[0],
      document_id: params[1],
      node_id: params[2],
      task_type: params[3],
      task_name: params[4],
      priority: params[5],
      status: '待处理',
      created_at: new Date().toISOString(),
      completed_at: null,
    };
    todoTasks.push(task);
    return { rows: [task] };
  }

  if (lowerText.includes('into document_permissions')) {
    const existing = documentPermissions.find(p => 
      p.document_id === params[0] && 
      p.user_id === params[1] && 
      p.permission_type === params[2]
    );
    
    if (!existing) {
      const permission = {
        id: documentPermissions.length + 1,
        document_id: params[0],
        user_id: params[1],
        permission_type: params[2],
        created_at: new Date().toISOString(),
      };
      documentPermissions.push(permission);
      return { rows: [permission] };
    }
    return { rows: [existing] };
  }

  console.log('插入SQL:', text, params);
  return { rows: [] };
};

const handleUpdate = (text, params) => {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('update documents')) {
    let docId = null;
    const idMatch = text.match(/where id\s*=\s*\$(\d+)/i);
    if (idMatch) {
      const paramIndex = parseInt(idMatch[1]) - 1;
      docId = params[paramIndex];
    }

    const docIndex = documents.findIndex(d => d.id === docId);
    if (docIndex >= 0) {
      const updates = {};

      if (lowerText.includes('status')) {
        const statusMatch = text.match(/status\s*=\s*\$(\d+)/i);
        if (statusMatch) {
          const idx = parseInt(statusMatch[1]) - 1;
          updates.status = params[idx];
        }
      }

      if (lowerText.includes('current_node')) {
        const nodeMatch = text.match(/current_node\s*=\s*\$(\d+)/i);
        if (nodeMatch) {
          const idx = parseInt(nodeMatch[1]) - 1;
          updates.current_node = params[idx];
        }
      }

      if (lowerText.includes('title')) {
        const titleMatch = text.match(/title\s*=\s*\$(\d+)/i);
        if (titleMatch) {
          const idx = parseInt(titleMatch[1]) - 1;
          updates.title = params[idx];
        }
      }

      if (lowerText.includes('content')) {
        const contentMatch = text.match(/content\s*=\s*\$(\d+)/i);
        if (contentMatch) {
          const idx = parseInt(contentMatch[1]) - 1;
          updates.content = params[idx];
        }
      }

      if (lowerText.includes('category')) {
        const catMatch = text.match(/category\s*=\s*\$(\d+)/i);
        if (catMatch) {
          const idx = parseInt(catMatch[1]) - 1;
          updates.category = params[idx];
        }
      }

      if (lowerText.includes('security_level')) {
        const secMatch = text.match(/security_level\s*=\s*\$(\d+)/i);
        if (secMatch) {
          const idx = parseInt(secMatch[1]) - 1;
          updates.security_level = params[idx];
        }
      }

      if (lowerText.includes('is_archived')) {
        const archMatch = text.match(/is_archived\s*=\s*\$(\d+)/i);
        if (archMatch) {
          const idx = parseInt(archMatch[1]) - 1;
          updates.is_archived = params[idx];
        }
      }

      if (lowerText.includes('archived_at')) {
        updates.archived_at = new Date().toISOString();
      }

      updates.updated_at = new Date().toISOString();

      documents[docIndex] = { ...documents[docIndex], ...updates };
      return { rows: [documents[docIndex]] };
    }
  }

  if (lowerText.includes('update process_nodes')) {
    const nodeIdMatch = text.match(/where id\s*=\s*\$(\d+)/i);
    const docIdMatch = text.match(/where document_id\s*=\s*\$(\d+)/i);
    const orderMatch = text.match(/node_order\s*=\s*\$(\d+)/i);

    if (nodeIdMatch) {
      const paramIndex = parseInt(nodeIdMatch[1]) - 1;
      const nodeId = params[paramIndex];
      const nodeIndex = processNodes.findIndex(n => n.id === nodeId);
      
      if (nodeIndex >= 0) {
        const updates = {};
        
        if (lowerText.includes('status')) {
          const statusMatch = text.match(/status\s*=\s*\$(\d+)/i);
          if (statusMatch) {
            const idx = parseInt(statusMatch[1]) - 1;
            updates.status = params[idx];
          }
        }
        
        if (lowerText.includes('started_at')) {
          updates.started_at = new Date().toISOString();
        }
        
        if (lowerText.includes('completed_at')) {
          updates.completed_at = new Date().toISOString();
        }
        
        updates.updated_at = new Date().toISOString();
        
        processNodes[nodeIndex] = { ...processNodes[nodeIndex], ...updates };
        return { rows: [processNodes[nodeIndex]] };
      }
    }

    if (docIdMatch && orderMatch) {
      const docIdx = parseInt(docIdMatch[1]) - 1;
      const ordIdx = parseInt(orderMatch[1]) - 1;
      const docId = params[docIdx];
      const nodeOrder = params[ordIdx];
      
      const nodeIndex = processNodes.findIndex(n => 
        n.document_id === docId && n.node_order === nodeOrder
      );
      
      if (nodeIndex >= 0) {
        const updates = {};
        
        if (lowerText.includes('status')) {
          const statusMatch = text.match(/status\s*=\s*\$(\d+)/i);
          if (statusMatch) {
            const idx = parseInt(statusMatch[1]) - 1;
            updates.status = params[idx];
          }
        }
        
        if (lowerText.includes('started_at')) {
          updates.started_at = new Date().toISOString();
        }
        
        processNodes[nodeIndex] = { ...processNodes[nodeIndex], ...updates };
        return { rows: [processNodes[nodeIndex]] };
      }
    }
  }

  if (lowerText.includes('update todo_tasks')) {
    const idMatch = text.match(/where id\s*=\s*\$(\d+)/i);
    if (idMatch) {
      const paramIndex = parseInt(idMatch[1]) - 1;
      const taskId = params[paramIndex];
      const taskIndex = todoTasks.findIndex(t => t.id === taskId);
      
      if (taskIndex >= 0) {
        const updates = {};
        
        if (lowerText.includes('status')) {
          const statusMatch = text.match(/status\s*=\s*\$(\d+)/i);
          if (statusMatch) {
            const idx = parseInt(statusMatch[1]) - 1;
            updates.status = params[idx];
          }
        }
        
        if (lowerText.includes('completed_at')) {
          updates.completed_at = new Date().toISOString();
        }
        
        todoTasks[taskIndex] = { ...todoTasks[taskIndex], ...updates };
        return { rows: [todoTasks[taskIndex]] };
      }
    }
  }

  console.log('更新SQL:', text, params);
  return { rows: [] };
};

const pool = {
  connect: () => Promise.reject(new Error('Memory mode - no real pool')),
};

module.exports = {
  pool,
  query,
  initMemoryDB,
};
