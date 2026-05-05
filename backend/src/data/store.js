const bcrypt = require('bcryptjs');

const USER_ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin'
};

const TOPIC_STATUSES = {
  NORMAL: 0,
  PINNED: 1,
  DRAFT: 2,
  DELETED: 3
};

let data = {
  users: [],
  boards: [],
  topics: [],
  replies: [],
  boardModerators: [],
  operationLogs: [],
  nextIds: {
    users: 1,
    boards: 1,
    topics: 1,
    replies: 1,
    boardModerators: 1,
    operationLogs: 1
  }
};

const initStore = async () => {
  console.log('初始化内存数据存储...');
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  data.users.push({
    id: data.nextIds.users++,
    username: 'admin',
    password: adminPassword,
    email: 'admin@bbs.com',
    role: USER_ROLES.ADMIN,
    avatar: null,
    status: 1,
    lastLoginAt: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null
  });
  
  const techBoard = {
    id: data.nextIds.boards++,
    name: '技术交流',
    description: '技术问题讨论、技术分享、技术选型等',
    parentId: null,
    sort: 1,
    status: 1,
    topicCount: 0,
    created_at: new Date(),
    updated_at: new Date()
  };
  data.boards.push(techBoard);
  
  data.boards.push({
    id: data.nextIds.boards++,
    name: '前端开发',
    description: 'Vue、React、Angular等前端技术讨论',
    parentId: techBoard.id,
    sort: 1,
    status: 1,
    topicCount: 0,
    created_at: new Date(),
    updated_at: new Date()
  });
  
  data.boards.push({
    id: data.nextIds.boards++,
    name: '后端开发',
    description: 'Java、Node.js、Python等后端技术讨论',
    parentId: techBoard.id,
    sort: 2,
    status: 1,
    topicCount: 0,
    created_at: new Date(),
    updated_at: new Date()
  });
  
  const workBoard = {
    id: data.nextIds.boards++,
    name: '工作交流',
    description: '工作心得分享、问题讨论',
    parentId: null,
    sort: 2,
    status: 1,
    topicCount: 0,
    created_at: new Date(),
    updated_at: new Date()
  };
  data.boards.push(workBoard);
  
  data.boards.push({
    id: data.nextIds.boards++,
    name: '职场话题',
    description: '职场经验、职业规划讨论',
    parentId: workBoard.id,
    sort: 1,
    status: 1,
    topicCount: 0,
    created_at: new Date(),
    updated_at: new Date()
  });
  
  const lifeBoard = {
    id: data.nextIds.boards++,
    name: '生活娱乐',
    description: '生活分享、娱乐话题',
    parentId: null,
    sort: 3,
    status: 1,
    topicCount: 0,
    created_at: new Date(),
    updated_at: new Date()
  };
  data.boards.push(lifeBoard);
  
  data.boards.push({
    id: data.nextIds.boards++,
    name: '灌水专区',
    description: '闲聊、八卦、水帖专区',
    parentId: lifeBoard.id,
    sort: 1,
    status: 1,
    topicCount: 0,
    created_at: new Date(),
    updated_at: new Date()
  });
  
  console.log('✓ 内存数据存储初始化完成');
  console.log('  管理员账号: admin / admin123');
  console.log('  注意：内存数据在服务重启后会丢失');
};

const clone = (obj) => JSON.parse(JSON.stringify(obj));

const store = {
  USER_ROLES,
  TOPIC_STATUSES,
  
  initStore,
  
  users: {
    findAll: async (options = {}) => {
      let result = [...data.users].filter(u => !u.deleted_at);
      
      if (options.where) {
        for (const [key, value] of Object.entries(options.where)) {
          result = result.filter(u => u[key] === value);
        }
      }
      
      if (options.order) {
        for (const [field, order] of options.order) {
          result.sort((a, b) => {
            if (order === 'ASC') return a[field] > b[field] ? 1 : -1;
            return a[field] < b[field] ? 1 : -1;
          });
        }
      }
      
      return result.map(u => clone(u));
    },
    
    findOne: async (options = {}) => {
      let result = [...data.users].filter(u => !u.deleted_at);
      
      if (options.where) {
        for (const [key, value] of Object.entries(options.where)) {
          if (key === 'username') {
            result = result.filter(u => u[key] === value);
          } else {
            result = result.filter(u => u[key] === value);
          }
        }
      }
      
      return result.length > 0 ? clone(result[0]) : null;
    },
    
    findByPk: async (id) => {
      const user = data.users.find(u => u.id === id && !u.deleted_at);
      return user ? clone(user) : null;
    },
    
    create: async (userData) => {
      const newUser = {
        id: data.nextIds.users++,
        ...userData,
        status: userData.status ?? 1,
        lastLoginAt: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      };
      data.users.push(newUser);
      return clone(newUser);
    },
    
    count: async (options = {}) => {
      let result = [...data.users].filter(u => !u.deleted_at);
      if (options.where) {
        for (const [key, value] of Object.entries(options.where)) {
          result = result.filter(u => u[key] === value);
        }
      }
      return result.length;
    }
  },
  
  boards: {
    findAll: async (options = {}) => {
      let result = [...data.boards];
      
      if (options.where) {
        for (const [key, value] of Object.entries(options.where)) {
          if (value === null) {
            result = result.filter(b => b[key] === null);
          } else {
            result = result.filter(b => b[key] === value);
          }
        }
      }
      
      if (options.order) {
        for (const [field, order] of options.order) {
          result.sort((a, b) => {
            if (order === 'ASC') return a[field] > b[field] ? 1 : -1;
            return a[field] < b[field] ? 1 : -1;
          });
        }
      }
      
      const boards = result.map(b => {
        const board = clone(b);
        if (options.include) {
          for (const inc of options.include) {
            if (inc.as === 'children') {
              board.children = data.boards
                .filter(child => child.parentId === board.id && child.status === 1)
                .map(c => clone(c));
            }
            if (inc.as === 'parent') {
              const parent = data.boards.find(p => p.id === board.parentId);
              board.parent = parent ? clone(parent) : null;
            }
          }
        }
        return board;
      });
      
      return boards;
    },
    
    findByPk: async (id, options = {}) => {
      const board = data.boards.find(b => b.id === parseInt(id));
      if (!board) return null;
      
      const result = clone(board);
      
      if (options.include) {
        for (const inc of options.include) {
          if (inc.as === 'children') {
            result.children = data.boards
              .filter(child => child.parentId === result.id && child.status === 1)
              .map(c => clone(c));
          }
          if (inc.as === 'parent') {
            const parent = data.boards.find(p => p.id === result.parentId);
            result.parent = parent ? clone(parent) : null;
          }
        }
      }
      
      return result;
    },
    
    create: async (boardData) => {
      const newBoard = {
        id: data.nextIds.boards++,
        ...boardData,
        parentId: boardData.parentId || null,
        sort: boardData.sort || 0,
        status: boardData.status ?? 1,
        topicCount: 0,
        created_at: new Date(),
        updated_at: new Date()
      };
      data.boards.push(newBoard);
      return clone(newBoard);
    },
    
    count: async (options = {}) => {
      let result = [...data.boards];
      if (options.where) {
        for (const [key, value] of Object.entries(options.where)) {
          result = result.filter(b => b[key] === value);
        }
      }
      return result.length;
    },
    
    increment: async (field, options) => {
      if (options.where && options.where.id) {
        const board = data.boards.find(b => b.id === options.where.id);
        if (board) {
          board[field] = (board[field] || 0) + 1;
          board.updated_at = new Date();
        }
      }
    },
    
    decrement: async (field, options) => {
      if (options.where && options.where.id) {
        const board = data.boards.find(b => b.id === options.where.id);
        if (board) {
          board[field] = Math.max(0, (board[field] || 0) - 1);
          board.updated_at = new Date();
        }
      }
    }
  },
  
  topics: {
    findAndCountAll: async (options = {}) => {
      let result = [...data.topics];
      
      if (options.where) {
        for (const [key, value] of Object.entries(options.where)) {
          if (key === 'status' && value && value['Op.ne'] !== undefined) {
            result = result.filter(t => t.status !== value['Op.ne']);
          } else {
            result = result.filter(t => t[key] === value);
          }
        }
      }
      
      if (options.order) {
        for (const [field, order] of options.order) {
          result.sort((a, b) => {
            if (order === 'DESC') return a[field] < b[field] ? 1 : -1;
            return a[field] > b[field] ? 1 : -1;
          });
        }
      }
      
      const total = result.length;
      
      let rows = result;
      if (options.offset !== undefined && options.limit !== undefined) {
        rows = result.slice(options.offset, options.offset + options.limit);
      }
      
      const topics = rows.map(t => {
        const topic = clone(t);
        if (options.include) {
          for (const inc of options.include) {
            if (inc.as === 'author') {
              const user = data.users.find(u => u.id === topic.userId);
              topic.author = user ? {
                id: user.id,
                username: user.username,
                avatar: user.avatar
              } : null;
            }
            if (inc.model && inc.model.name === 'Board') {
              const board = data.boards.find(b => b.id === topic.boardId);
              topic.Board = board ? { id: board.id, name: board.name } : null;
            }
          }
        }
        return topic;
      });
      
      return { count: total, rows: topics };
    },
    
    findByPk: async (id, options = {}) => {
      const topic = data.topics.find(t => t.id === parseInt(id));
      if (!topic) return null;
      
      const result = clone(topic);
      
      if (options.include) {
        for (const inc of options.include) {
          if (inc.as === 'author') {
            const user = data.users.find(u => u.id === result.userId);
            result.author = user ? {
              id: user.id,
              username: user.username,
              avatar: user.avatar,
              created_at: user.created_at
            } : null;
          }
          if (inc.model && inc.model.name === 'Board') {
            const board = data.boards.find(b => b.id === result.boardId);
            result.Board = board ? { id: board.id, name: board.name } : null;
          }
        }
      }
      
      return result;
    },
    
    create: async (topicData) => {
      const now = new Date();
      const newTopic = {
        id: data.nextIds.topics++,
        ...topicData,
        status: topicData.status ?? TOPIC_STATUSES.NORMAL,
        viewCount: 0,
        replyCount: 0,
        lastReplyAt: null,
        lastReplyUserId: null,
        created_at: now,
        updated_at: now,
        deleted_at: null
      };
      data.topics.push(newTopic);
      
      const board = data.boards.find(b => b.id === newTopic.boardId);
      if (board) {
        board.topicCount++;
        board.updated_at = now;
      }
      
      return clone(newTopic);
    },
    
    increment: async (field, options) => {
      if (options.where && options.where.id) {
        const topic = data.topics.find(t => t.id === options.where.id);
        if (topic) {
          topic[field] = (topic[field] || 0) + 1;
          topic.updated_at = new Date();
        }
      }
    }
  },
  
  replies: {
    findAndCountAll: async (options = {}) => {
      let result = [...data.replies];
      
      if (options.where) {
        for (const [key, value] of Object.entries(options.where)) {
          result = result.filter(r => r[key] === value);
        }
      }
      
      if (options.order) {
        for (const [field, order] of options.order) {
          result.sort((a, b) => {
            if (order === 'ASC') return a[field] > b[field] ? 1 : -1;
            return a[field] < b[field] ? 1 : -1;
          });
        }
      }
      
      const total = result.length;
      
      let rows = result;
      if (options.offset !== undefined && options.limit !== undefined) {
        rows = result.slice(options.offset, options.offset + options.limit);
      }
      
      const replies = rows.map(r => {
        const reply = clone(r);
        if (options.include) {
          for (const inc of options.include) {
            if (inc.as === 'author') {
              const user = data.users.find(u => u.id === reply.userId);
              reply.author = user ? {
                id: user.id,
                username: user.username,
                avatar: user.avatar
              } : null;
            }
            if (inc.as === 'parentReply') {
              const parent = data.replies.find(p => p.id === reply.parentId);
              if (parent) {
                const parentUser = data.users.find(u => u.id === parent.userId);
                reply.parentReply = {
                  id: parent.id,
                  author: parentUser ? { id: parentUser.id, username: parentUser.username } : null
                };
              }
            }
          }
        }
        return reply;
      });
      
      return { count: total, rows: replies };
    },
    
    create: async (replyData) => {
      const now = new Date();
      const newReply = {
        id: data.nextIds.replies++,
        ...replyData,
        parentId: replyData.parentId || null,
        status: 1,
        created_at: now,
        updated_at: now,
        deleted_at: null
      };
      data.replies.push(newReply);
      
      const topic = data.topics.find(t => t.id === newReply.topicId);
      if (topic) {
        topic.replyCount++;
        topic.lastReplyAt = now;
        topic.lastReplyUserId = newReply.userId;
        topic.updated_at = now;
      }
      
      return clone(newReply);
    }
  },
  
  boardModerators: {
    findOne: async (options = {}) => {
      let result = [...data.boardModerators];
      if (options.where) {
        for (const [key, value] of Object.entries(options.where)) {
          result = result.filter(m => m[key] === value);
        }
      }
      return result.length > 0 ? clone(result[0]) : null;
    },
    
    create: async (data) => {
      const newModerator = {
        id: data.nextIds.boardModerators++,
        ...data,
        created_at: new Date(),
        updated_at: new Date()
      };
      data.boardModerators.push(newModerator);
      return clone(newModerator);
    },
    
    count: async (options = {}) => {
      let result = [...data.boardModerators];
      if (options.where) {
        for (const [key, value] of Object.entries(options.where)) {
          result = result.filter(m => m[key] === value);
        }
      }
      return result.length;
    },
    
    destroy: async (options = {}) => {
      if (options.where) {
        const index = data.boardModerators.findIndex(m => {
          for (const [key, value] of Object.entries(options.where)) {
            if (m[key] !== value) return false;
          }
          return true;
        });
        if (index !== -1) {
          data.boardModerators.splice(index, 1);
          return 1;
        }
      }
      return 0;
    }
  }
};

module.exports = store;
