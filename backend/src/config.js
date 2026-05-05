require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT) || 12216,
  indexStoragePath: process.env.INDEX_STORAGE_PATH || './data/index.json',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
  allowedExtensions: (process.env.ALLOWED_EXTENSIONS || '.txt,.md,.json,.html,.css,.js,.ts,.tsx,.jsx,.py,.java,.go,.rs,.c,.cpp,.h,.xml,.yaml,.yml,.toml,.ini,.conf,.log,.csv').split(','),
  excludeDirs: (process.env.EXCLUDE_DIRS || 'node_modules,.git,.env,dist,build,target,vendor').split(','),
};

module.exports = config;
