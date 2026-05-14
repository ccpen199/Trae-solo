const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/app.json');

let dbData = {
  users: [],
  topics: [],
  questions: [],
  articles: [],
  answers: [],
  comments: [],
  follows: [],
  question_follows: [],
  likes: [],
  favorites: [],
  notifications: [],
  draft_questions: []
};

let nextId = {
  users: 1,
  topics: 1,
  questions: 1,
  articles: 1,
  answers: 1,
  comments: 1,
  follows: 1,
  question_follows: 1,
  likes: 1,
  favorites: 1,
  notifications: 1,
  draft_questions: 1
};

function loadData() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      dbData = data.dbData || dbData;
      nextId = data.nextId || nextId;
    }
  } catch (err) {
    console.error('Error loading data:', err.message);
  }
}

function saveData() {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify({ dbData, nextId }, null, 2));
  } catch (err) {
    console.error('Error saving data:', err.message);
  }
}

function getTable(name) {
  return dbData[name] || [];
}

function insert(table, data) {
  const id = nextId[table]++;
  const record = { id, ...data, created_at: new Date().toISOString() };
  dbData[table].push(record);
  saveData();
  return record;
}

function findById(table, id) {
  return dbData[table].find(r => r.id === id);
}

function findOne(table, predicate) {
  return dbData[table].find(predicate);
}

function findMany(table, predicate) {
  if (typeof predicate === 'function') {
    return dbData[table].filter(predicate);
  }
  return dbData[table];
}

function update(table, id, data) {
  const index = dbData[table].findIndex(r => r.id === id);
  if (index !== -1) {
    dbData[table][index] = { ...dbData[table][index], ...data, updated_at: new Date().toISOString() };
    saveData();
    return dbData[table][index];
  }
  return null;
}

function remove(table, predicate) {
  const before = dbData[table].length;
  dbData[table] = dbData[table].filter(r => !predicate(r));
  if (dbData[table].length !== before) {
    saveData();
  }
}

function parseConditions(whereStr, params) {
  const conditions = [];
  
  const andParts = whereStr.split(/\s+AND\s+/i);
  let paramIndex = 0;
  
  for (const part of andParts) {
    const trimPart = part.trim();
    
    const eqMatch = trimPart.match(/^(\w+)\s*=\s*\?$/i);
    if (eqMatch) {
      conditions.push({ field: eqMatch[1], op: '=', value: params[paramIndex++] });
      continue;
    }
    
    const likeMatch = trimPart.match(/^(\w+)\s+LIKE\s*\?$/i);
    if (likeMatch) {
      conditions.push({ field: likeMatch[1], op: 'LIKE', value: params[paramIndex++] });
      continue;
    }
    
    const isMatch = trimPart.match(/^(\w+)\s+IS\s+NOT\s+NULL$/i);
    if (isMatch) {
      conditions.push({ field: isMatch[1], op: 'NOT_NULL' });
      continue;
    }
  }
  
  return conditions;
}

function applyConditions(results, conditions) {
  for (const cond of conditions) {
    if (cond.op === '=') {
      results = results.filter(r => String(r[cond.field]) === String(cond.value));
    } else if (cond.op === 'LIKE') {
      const search = cond.value.replace(/%/g, '');
      results = results.filter(r => String(r[cond.field] || '').includes(search));
    } else if (cond.op === 'NOT_NULL') {
      results = results.filter(r => r[cond.field] !== null && r[cond.field] !== undefined);
    }
  }
  return results;
}

function applySort(results, orderStr) {
  if (!orderStr) return results;
  
  const orderParts = orderStr.trim().split(' ');
  const orderField = orderParts[0];
  const orderDir = (orderParts[1] || 'asc').toLowerCase();
  
  results.sort((a, b) => {
    const aVal = a[orderField];
    const bVal = b[orderField];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return orderDir === 'desc' ? bVal - aVal : aVal - bVal;
    }
    return orderDir === 'desc' ? String(bVal).localeCompare(String(aVal)) : String(aVal).localeCompare(String(bVal));
  });
  
  return results;
}

function prepare(query) {
  return {
    get: function(...params) {
      const tables = Object.keys(dbData).join('|');
      const tableMatch = query.match(new RegExp(`FROM\\s+(${tables})`, 'i'));
      if (!tableMatch) return null;
      
      const table = tableMatch[1];
      let results = [...dbData[table]];
      
      const whereMatch = query.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|$)/i);
      if (whereMatch) {
        const conditions = parseConditions(whereMatch[1], params);
        results = applyConditions(results, conditions);
      }
      
      const orderMatch = query.match(/ORDER\s+BY\s+(.+?)(?:LIMIT|$)/i);
      if (orderMatch) {
        results = applySort(results, orderMatch[1]);
      }
      
      const limitMatch = query.match(/LIMIT\s+(\d+)/i);
      if (limitMatch) {
        results = results.slice(0, parseInt(limitMatch[1]));
      }
      
      return results[0] || null;
    },
    all: function(...params) {
      const tables = Object.keys(dbData).join('|');
      const tableMatch = query.match(new RegExp(`FROM\\s+(${tables})`, 'i'));
      if (!tableMatch) return [];
      
      const table = tableMatch[1];
      let results = [...dbData[table]];
      
      const whereMatch = query.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|$)/i);
      if (whereMatch) {
        const conditions = parseConditions(whereMatch[1], params);
        results = applyConditions(results, conditions);
      }
      
      const orderMatch = query.match(/ORDER\s+BY\s+(.+?)(?:LIMIT|OFFSET|$)/i);
      if (orderMatch) {
        results = applySort(results, orderMatch[1]);
      }
      
      const limitOffsetMatch = query.match(/LIMIT\s+(\d+)\s+OFFSET\s+(\d+)/i);
      if (limitOffsetMatch) {
        const limit = parseInt(limitOffsetMatch[1]);
        const offset = parseInt(limitOffsetMatch[2]);
        results = results.slice(offset, offset + limit);
      } else {
        const simpleLimitMatch = query.match(/LIMIT\s+(\d+)/i);
        if (simpleLimitMatch) {
          results = results.slice(0, parseInt(simpleLimitMatch[1]));
        }
      }
      
      return results;
    },
    run: function(...params) {
      const tables = Object.keys(dbData).join('|');
      
      const insertMatch = query.match(new RegExp(`INSERT\\s+INTO\\s+(${tables})\\s*\\(([^)]+)\\)\\s*VALUES\\s*\\(([^)]+)\\)`, 'i'));
      if (insertMatch) {
        const table = insertMatch[1];
        const fields = insertMatch[2].split(',').map(f => f.trim());
        const data = {};
        fields.forEach((field, i) => {
          if (params[i] !== undefined) {
            data[field] = params[i];
          }
        });
        const record = insert(table, data);
        return { lastInsertRowid: record.id, changes: 1 };
      }
      
      const updateMatch = query.match(new RegExp(`UPDATE\\s+(${tables})\\s+SET\\s+(.+?)\\s+WHERE\\s+(.+)`, 'i'));
      if (updateMatch) {
        const table = updateMatch[1];
        const setStr = updateMatch[2];
        const whereStr = updateMatch[3];
        
        const setPairs = setStr.split(',').map(s => s.trim());
        const data = {};
        let paramIndex = 0;
        setPairs.forEach(pair => {
          const eqIndex = pair.indexOf('=');
          if (eqIndex > -1) {
            const field = pair.substring(0, eqIndex).trim();
            const valuePart = pair.substring(eqIndex + 1).trim();
            if (valuePart === '?') {
              data[field] = params[paramIndex++];
            }
          }
        });
        
        const whereConditions = parseConditions(whereStr, params.slice(paramIndex));
        const records = applyConditions([...dbData[table]], whereConditions);
        
        if (records.length > 0) {
          records.forEach(record => {
            update(table, record.id, data);
          });
          return { changes: records.length };
        }
        return { changes: 0 };
      }
      
      const deleteMatch = query.match(new RegExp(`DELETE\\s+FROM\\s+(${tables})\\s+WHERE\\s+(.+)`, 'i'));
      if (deleteMatch) {
        const table = deleteMatch[1];
        const whereStr = deleteMatch[2];
        const whereConditions = parseConditions(whereStr, params);
        const beforeCount = dbData[table].length;
        const toDelete = applyConditions([...dbData[table]], whereConditions);
        const toDeleteIds = new Set(toDelete.map(r => r.id));
        dbData[table] = dbData[table].filter(r => !toDeleteIds.has(r.id));
        const changes = beforeCount - dbData[table].length;
        if (changes > 0) saveData();
        return { changes };
      }
      
      return { lastInsertRowid: 0, changes: 0 };
    }
  };
}

loadData();

module.exports = {
  prepare,
  getTable,
  insert,
  findById,
  findOne,
  findMany,
  update,
  remove,
  loadData,
  saveData
};
