import prisma from '../prisma/client.js';
import logger from '../utils/logger.js';

const ALERT_THRESHOLD = 3;

class AlertService {
  async recordApiFailure(apiName, phoneMd5, errorMessage) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const existingFailure = await prisma.apiFailure.findFirst({
      where: {
        apiName,
        phoneMd5: phoneMd5 || null,
        createdAt: {
          gte: fiveMinutesAgo
        }
      }
    });

    let failure;
    if (existingFailure) {
      failure = await prisma.apiFailure.update({
        where: { id: existingFailure.id },
        data: {
          errorCount: existingFailure.errorCount + 1,
          errorMessage,
          updatedAt: new Date()
        }
      });
    } else {
      failure = await prisma.apiFailure.create({
        data: {
          apiName,
          phoneMd5,
          errorMessage,
          errorCount: 1,
          isAlerted: false
        }
      });
    }

    if (failure.errorCount >= ALERT_THRESHOLD && !failure.isAlerted) {
      await this.triggerAlert(failure);
    }

    return failure;
  }

  async triggerAlert(failure) {
    logger.error(`========================================`);
    logger.error(`ALERT TRIGGERED! API failures threshold reached`);
    logger.error(`API Name: ${failure.apiName}`);
    logger.error(`Phone MD5: ${failure.phoneMd5 || 'N/A'}`);
    logger.error(`Failure Count: ${failure.errorCount}`);
    logger.error(`Last Error: ${failure.errorMessage}`);
    logger.error(`========================================`);

    await prisma.apiFailure.update({
      where: { id: failure.id },
      data: { isAlerted: true }
    });

    console.log(`\n[ALERT] 接口 ${failure.apiName} 连续失败 ${failure.errorCount} 次，请检查！\n`);
  }

  async getRecentFailures(limit = 50) {
    return await prisma.apiFailure.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  async clearAlerts() {
    return await prisma.apiFailure.updateMany({
      where: { isAlerted: true },
      data: { isAlerted: false }
    });
  }
}

export default new AlertService();
