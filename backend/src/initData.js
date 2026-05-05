const { User, Board, sequelize } = require('./models');

const initData = async () => {
  try {
    const existingAdmin = await User.findOne({
      where: { username: 'admin' }
    });

    if (!existingAdmin) {
      console.log('创建管理员账号...');
      await User.create({
        username: 'admin',
        password: 'admin123',
        email: 'admin@bbs.com',
        role: 'admin',
        status: 1
      });
      console.log('管理员账号已创建: admin / admin123');
    } else {
      console.log('管理员账号已存在');
    }

    const boardCount = await Board.count();
    if (boardCount === 0) {
      console.log('创建示例版块...');
      
      const techBoard = await Board.create({
        name: '技术交流',
        description: '技术问题讨论、技术分享、技术选型等',
        parentId: null,
        sort: 1
      });

      await Board.create({
        name: '前端开发',
        description: 'Vue、React、Angular等前端技术讨论',
        parentId: techBoard.id,
        sort: 1
      });

      await Board.create({
        name: '后端开发',
        description: 'Java、Node.js、Python等后端技术讨论',
        parentId: techBoard.id,
        sort: 2
      });

      await Board.create({
        name: '运维部署',
        description: '服务器运维、Docker、K8s等部署相关',
        parentId: techBoard.id,
        sort: 3
      });

      const workBoard = await Board.create({
        name: '工作交流',
        description: '工作心得分享、问题讨论',
        parentId: null,
        sort: 2
      });

      await Board.create({
        name: '职场话题',
        description: '职场经验、职业规划讨论',
        parentId: workBoard.id,
        sort: 1
      });

      await Board.create({
        name: '项目管理',
        description: '项目管理方法、工具、经验分享',
        parentId: workBoard.id,
        sort: 2
      });

      const lifeBoard = await Board.create({
        name: '生活娱乐',
        description: '生活分享、娱乐话题',
        parentId: null,
        sort: 3
      });

      await Board.create({
        name: '兴趣爱好',
        description: '分享兴趣爱好，找到志同道合的朋友',
        parentId: lifeBoard.id,
        sort: 1
      });

      await Board.create({
        name: '灌水专区',
        description: '闲聊、八卦、水帖专区',
        parentId: lifeBoard.id,
        sort: 2
      });

      console.log('示例版块创建完成');
    } else {
      console.log('版块数据已存在');
    }

    console.log('========================================');
    console.log('  初始化完成！');
    console.log('  管理员账号: admin / admin123');
    console.log('========================================');

  } catch (error) {
    console.error('初始化数据失败:', error);
    throw error;
  }
};

module.exports = initData;
