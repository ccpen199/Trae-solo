const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'data.json');

let users = [];
let nextId = 1;

const loadData = () => {
  if (fs.existsSync(dbPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      users = data.users || [];
      nextId = data.nextId || 1;
      console.log('数据已从文件加载');
    } catch (err) {
      console.error('加载数据文件失败:', err);
      initializeDefaultData();
    }
  } else {
    initializeDefaultData();
  }
};

const saveData = () => {
  try {
    const data = {
      users,
      nextId
    };
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('保存数据文件失败:', err);
  }
};

const initializeDefaultData = () => {
  const hashedAdminPassword = bcrypt.hashSync('admin123', 10);
  const hashedUserPassword = bcrypt.hashSync('user123', 10);
  
  const now = new Date().toISOString();
  
  users = [
    {
      id: 1,
      username: 'admin',
      password: hashedAdminPassword,
      role: 'admin',
      age: 30,
      gender: 'male',
      created_at: now,
      updated_at: now
    },
    {
      id: 2,
      username: 'user',
      password: hashedUserPassword,
      role: 'user',
      age: 25,
      gender: 'female',
      created_at: now,
      updated_at: now
    }
  ];
  
  nextId = 3;
  
  saveData();
  
  console.log('默认数据已初始化');
  console.log('默认管理员账号: admin / admin123');
  console.log('默认普通用户: user / user123');
};

loadData();

const db = {
  findByUsername: (username) => {
    return users.find(u => u.username === username) || null;
  },
  
  findById: (id) => {
    return users.find(u => u.id === parseInt(id)) || null;
  },
  
  createUser: (userData) => {
    const now = new Date().toISOString();
    const hashedPassword = bcrypt.hashSync(userData.password, 10);
    
    const newUser = {
      id: nextId++,
      username: userData.username,
      password: hashedPassword,
      role: userData.role || 'user',
      age: userData.age || null,
      gender: userData.gender || null,
      created_at: now,
      updated_at: now
    };
    
    users.push(newUser);
    saveData();
    
    return { ...newUser };
  },
  
  updateUser: (id, userData) => {
    const index = users.findIndex(u => u.id === parseInt(id));
    if (index === -1) return null;
    
    const now = new Date().toISOString();
    
    if (userData.password) {
      users[index].password = bcrypt.hashSync(userData.password, 10);
    }
    
    if (userData.age !== undefined && userData.age !== null) {
      users[index].age = parseInt(userData.age) || null;
    }
    
    if (userData.gender !== undefined && userData.gender !== null) {
      users[index].gender = userData.gender || null;
    }
    
    users[index].updated_at = now;
    
    saveData();
    
    return { ...users[index] };
  },
  
  deleteUser: (id) => {
    const index = users.findIndex(u => u.id === parseInt(id));
    if (index === -1) return false;
    
    users.splice(index, 1);
    saveData();
    
    return true;
  },
  
  getAllUsers: (filters = {}) => {
    let result = [...users];
    
    if (filters.username && filters.username.trim() !== '') {
      const searchTerm = filters.username.trim().toLowerCase();
      result = result.filter(u => 
        u.username.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters.role && filters.role.trim() !== '') {
      result = result.filter(u => u.role === filters.role.trim());
    }
    
    result.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    
    return result;
  }
};

module.exports = db;
