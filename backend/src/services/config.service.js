import prisma from '../prisma/client.js';
import logger from '../utils/logger.js';

class ConfigService {
  async getAccessConfig() {
    let config = await prisma.accessConfig.findFirst();
    if (!config) {
      config = await prisma.accessConfig.create({
        data: {
          configName: 'default_access_config',
          unUsedUserPass: true,
          riskLevelAPass: true,
          riskLevelBPass: true,
          riskLevelCPass: true,
          riskLevelDPass: true,
          riskLevelEPass: true,
          riskLevelZPass: true,
          emptyLevelPass: true,
          failedLevelPass: true
        }
      });
      logger.info('Created default access config');
    }
    return config;
  }

  async updateAccessConfig(updates) {
    const config = await prisma.accessConfig.findFirst();
    if (config) {
      return await prisma.accessConfig.update({
        where: { id: config.id },
        data: updates
      });
    }
    return null;
  }

  async getCollisionConfig() {
    let config = await prisma.collisionConfig.findFirst();
    if (!config) {
      config = await prisma.collisionConfig.create({
        data: {
          configName: 'default_collision_config',
          blacklistDays: 90,
          minClearDays: 30
        }
      });
      logger.info('Created default collision config');
    }
    return config;
  }

  async updateCollisionConfig(updates) {
    const config = await prisma.collisionConfig.findFirst();
    if (config) {
      return await prisma.collisionConfig.update({
        where: { id: config.id },
        data: updates
      });
    }
    return null;
  }

  async getSystemConfig(key) {
    return await prisma.systemConfig.findUnique({
      where: { configKey: key }
    });
  }

  async setSystemConfig(key, value, description) {
    return await prisma.systemConfig.upsert({
      where: { configKey: key },
      update: { configValue: value, description },
      create: { configKey: key, configValue: value, description }
    });
  }

  async getAllChannels() {
    return await prisma.channel.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async createChannel(channelData) {
    return await prisma.channel.create({
      data: channelData
    });
  }

  async updateChannel(id, updates) {
    return await prisma.channel.update({
      where: { id },
      data: updates
    });
  }

  async deleteChannel(id) {
    return await prisma.channel.delete({
      where: { id }
    });
  }

  async getChannelByCode(channelCode) {
    return await prisma.channel.findUnique({
      where: { channelCode }
    });
  }

  async getAllProducts() {
    return await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async createProduct(productData) {
    return await prisma.product.create({
      data: productData
    });
  }
}

export default new ConfigService();
