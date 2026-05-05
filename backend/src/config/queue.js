const Queue = require('bull');
const { redisConfig } = require('./redis');
require('dotenv').config();

const createQueue = (name) => {
  return new Queue(name, {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  });
};

const notificationQueue = createQueue('notifications');
const documentQueue = createQueue('documents');

notificationQueue.process('sendNotification', async (job) => {
  const { userId, documentId, message } = job.data;
  console.log(`发送通知给用户 ${userId}: 公文 ${documentId} - ${message}`);
  return { success: true };
});

documentQueue.process('updateStatus', async (job) => {
  const { documentId, status } = job.data;
  console.log(`更新公文 ${documentId} 状态为 ${status}`);
  return { success: true };
});

module.exports = {
  createQueue,
  notificationQueue,
  documentQueue,
};
