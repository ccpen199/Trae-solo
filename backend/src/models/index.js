const { initUser, getUser, USER_ROLES } = require('./User');
const { initBoard, getBoard } = require('./Board');

let initialized = false;
let sequelizeInstance = null;

const initModels = async (sequelize) => {
  if (initialized) return;
  
  sequelizeInstance = sequelize;
  
  const User = initUser(sequelize);
  const Board = initBoard(sequelize);
  
  Board.belongsTo(Board, {
    as: 'parent',
    foreignKey: 'parentId'
  });

  Board.hasMany(Board, {
    as: 'children',
    foreignKey: 'parentId'
  });
  
  initialized = true;
  
  return {
    sequelize,
    User,
    Board
  };
};

const getModels = () => {
  if (!initialized) {
    throw new Error('Models not initialized. Call initModels() first.');
  }
  
  return {
    sequelize: sequelizeInstance,
    User: getUser(),
    Board: getBoard()
  };
};

module.exports = {
  initModels,
  getModels,
  USER_ROLES
};
