const net = require('net');
const { logger } = require('./logger');

function portCheck(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn(`端口 ${port} 已被占用`);
        resolve(false);
      } else {
        logger.error(`检查端口 ${port} 时出错:`, err);
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

async function findAvailablePort(startPort, count = 5) {
  const availablePorts = [];
  let currentPort = startPort;
  
  while (availablePorts.length < count) {
    const isAvailable = await portCheck(currentPort);
    if (isAvailable) {
      availablePorts.push(currentPort);
    }
    currentPort++;
  }
  
  return availablePorts;
}

module.exports = { portCheck, findAvailablePort };
