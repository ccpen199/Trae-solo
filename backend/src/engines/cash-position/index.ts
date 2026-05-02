import prisma from '../../utils/prisma';
import { v4 as uuidv4 } from 'uuid';

export interface ForecastConfig {
  periodType: string;
  periodCount: number;
  includePastDays: number;
  confidenceThreshold: number;
  interestRate: number;
  feeRate: number;
}

export interface ForecastResult {
  forecastId: string;
  forecastDate: Date;
  periodType: string;
  periodCount: number;
  generatedAt: Date;
  source: string;
  status: string;
  items: any[];
  summary: {
    avgClosingBalance: number;
    maxClosingBalance: number;
    minClosingBalance: number;
    totalInflow: number;
    totalOutflow: number;
    avgConfidenceLevel: number;
  };
}

const DEFAULT_CONFIG: ForecastConfig = {
  periodType: 'DAILY',
  periodCount: 30,
  includePastDays: 90,
  confidenceThreshold: 0.7,
  interestRate: 0.035,
  feeRate: 0.001,
};

class CashPosition {
  private config: ForecastConfig;

  constructor(config: Partial<ForecastConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async generateForecast(
    accountId: string,
    configOverride?: Partial<ForecastConfig>
  ): Promise<ForecastResult> {
    const config = { ...this.config, ...configOverride };

    const historicalData = await this.getHistoricalData(accountId, config.includePastDays);
    
    const patterns = this.analyzePatterns(historicalData);
    
    const forecastItems = this.predictFutureBalances(
      patterns,
      historicalData,
      config.periodType,
      config.periodCount
    );

    const allocationItems = this.allocateCostsByDepartment(
      forecastItems,
      config.interestRate,
      config.feeRate
    );

    const forecast = await prisma.cashForecast.create({
      data: {
        bankAccountId: accountId,
        forecastDate: new Date(),
        periodType: config.periodType,
        periodCount: config.periodCount,
        source: 'SYSTEM',
        status: 'COMPLETED',
        notes: '自动生成的资金预测',
      },
    });

    for (const item of forecastItems) {
      await prisma.cashForecastItem.create({
        data: {
          forecastId: forecast.id,
          forecastDate: item.forecastDate,
          openingBalance: item.openingBalance,
          projectedInflow: item.projectedInflow,
          projectedOutflow: item.projectedOutflow,
          netAmount: item.netAmount,
          closingBalance: item.closingBalance,
          confidenceLevel: item.confidenceLevel,
          dataPoints: item.dataPoints,
          patternIds: item.patternIds,
        },
      });
    }

    const summary = this.calculateSummary(forecastItems);

    return {
      forecastId: forecast.id,
      forecastDate: forecast.forecastDate,
      periodType: forecast.periodType,
      periodCount: forecast.periodCount,
      generatedAt: new Date(),
      source: forecast.source,
      status: forecast.status,
      items: forecastItems,
      summary,
    };
  }

  private async getHistoricalData(accountId: string, days: number): Promise<any[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [transactions, balanceHistory] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          bankAccountId: accountId,
          transactionDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { transactionDate: 'asc' },
      }),
      prisma.balanceHistory.findMany({
        where: {
          bankAccountId: accountId,
          recordTime: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { recordTime: 'asc' },
      }),
    ]);

    const dailyData = new Map<string, {
      date: Date;
      inflow: number;
      outflow: number;
      closingBalance: number;
    }>();

    for (const tx of transactions) {
      const dateKey = (tx.transactionDate as Date).toISOString().split('T')[0];
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, {
          date: tx.transactionDate as Date,
          inflow: 0,
          outflow: 0,
          closingBalance: 0,
        });
      }
      const data = dailyData.get(dateKey)!;
      const amount = Number(tx.amount);
      if (amount > 0) {
        data.inflow += amount;
      } else {
        data.outflow += Math.abs(amount);
      }
    }

    for (const balance of balanceHistory) {
      const dateKey = (balance.recordTime as Date).toISOString().split('T')[0];
      if (dailyData.has(dateKey)) {
        dailyData.get(dateKey)!.closingBalance = Number(balance.balance);
      }
    }

    return Array.from(dailyData.values());
  }

  private analyzePatterns(historicalData: any[]): any {
    if (historicalData.length === 0) {
      return {
        dailyAverage: { inflow: 0, outflow: 0 },
        weeklyPatterns: [],
        monthlyPatterns: [],
        trendDirection: 'STABLE',
        volatility: 0,
      };
    }

    let totalInflow = 0;
    let totalOutflow = 0;

    for (const data of historicalData) {
      totalInflow += data.inflow;
      totalOutflow += data.outflow;
    }

    const dailyAverage = {
      inflow: totalInflow / historicalData.length,
      outflow: totalOutflow / historicalData.length,
    };

    const weeklyPatterns = this.extractWeeklyPatterns(historicalData);
    const monthlyPatterns = this.extractMonthlyPatterns(historicalData);

    return {
      dailyAverage,
      weeklyPatterns,
      monthlyPatterns,
      trendDirection: 'STABLE',
      volatility: 0.1,
    };
  }

  private extractWeeklyPatterns(historicalData: any[]): any[] {
    const dayOfWeekData = new Map<number, { inflow: number; outflow: number; count: number }>();

    for (const data of historicalData) {
      const dayOfWeek = (data.date as Date).getDay();
      if (!dayOfWeekData.has(dayOfWeek)) {
        dayOfWeekData.set(dayOfWeek, { inflow: 0, outflow: 0, count: 0 });
      }
      const dayData = dayOfWeekData.get(dayOfWeek)!;
      dayData.inflow += data.inflow;
      dayData.outflow += data.outflow;
      dayData.count++;
    }

    const patterns: any[] = [];
    for (const [dayOfWeek, data] of dayOfWeekData) {
      patterns.push({
        dayOfWeek,
        avgInflow: data.inflow / data.count,
        avgOutflow: data.outflow / data.count,
        confidence: 0.7,
      });
    }

    return patterns;
  }

  private extractMonthlyPatterns(historicalData: any[]): any[] {
    const dayOfMonthData = new Map<number, { inflow: number; outflow: number; count: number }>();

    for (const data of historicalData) {
      const dayOfMonth = (data.date as Date).getDate();
      if (!dayOfMonthData.has(dayOfMonth)) {
        dayOfMonthData.set(dayOfMonth, { inflow: 0, outflow: 0, count: 0 });
      }
      const dayData = dayOfMonthData.get(dayOfMonth)!;
      dayData.inflow += data.inflow;
      dayData.outflow += data.outflow;
      dayData.count++;
    }

    const patterns: any[] = [];
    for (const [dayOfMonth, data] of dayOfMonthData) {
      patterns.push({
        dayOfMonth,
        avgInflow: data.inflow / data.count,
        avgOutflow: data.outflow / data.count,
        confidence: 0.6,
      });
    }

    return patterns;
  }

  private predictFutureBalances(
    patterns: any,
    historicalData: any[],
    periodType: string,
    periodCount: number
  ): any[] {
    const items: any[] = [];
    const today = new Date();

    let latestBalance = 1000000;
    if (historicalData.length > 0) {
      latestBalance = historicalData[historicalData.length - 1].closingBalance;
    }

    for (let i = 1; i <= periodCount; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + i);

      const dayOfWeek = forecastDate.getDay();
      const dayOfMonth = forecastDate.getDate();

      const weeklyPattern = patterns.weeklyPatterns.find((p: any) => p.dayOfWeek === dayOfWeek);
      const monthlyPattern = patterns.monthlyPatterns.find((p: any) => p.dayOfMonth === dayOfMonth);

      let projectedInflow = patterns.dailyAverage.inflow;
      let projectedOutflow = patterns.dailyAverage.outflow;

      if (weeklyPattern) {
        projectedInflow = weeklyPattern.avgInflow;
        projectedOutflow = weeklyPattern.avgOutflow;
      }

      if (monthlyPattern) {
        projectedInflow = (projectedInflow + monthlyPattern.avgInflow) / 2;
        projectedOutflow = (projectedOutflow + monthlyPattern.avgOutflow) / 2;
      }

      const randomFactor = 0.9 + Math.random() * 0.2;
      projectedInflow *= randomFactor;
      projectedOutflow *= randomFactor;

      const openingBalance = latestBalance;
      const netAmount = projectedInflow - projectedOutflow;
      const closingBalance = openingBalance + netAmount;

      const confidenceLevel = 0.7 + Math.random() * 0.25;

      items.push({
        forecastDate,
        openingBalance,
        projectedInflow,
        projectedOutflow,
        netAmount,
        closingBalance,
        confidenceLevel,
        dataPoints: 10,
        patternIds: weeklyPattern ? ['weekly'] : [],
      });

      latestBalance = closingBalance;
    }

    return items;
  }

  private allocateCostsByDepartment(
    forecastItems: any[],
    interestRate: number,
    feeRate: number
  ): any[] {
    const allocationItems: any[] = [];
    const departments = ['销售部', '财务部', '运营部', '技术部'];
    const allocationRatios = [0.4, 0.2, 0.25, 0.15];

    for (const item of forecastItems) {
      const averageBalance = (item.openingBalance + item.closingBalance) / 2;
      
      const dailyInterest = averageBalance * (interestRate / 365);
      const dailyFee = Math.abs(item.netAmount) * feeRate;

      for (let i = 0; i < departments.length; i++) {
        allocationItems.push({
          forecastDate: item.forecastDate,
          department: departments[i],
          allocatedInterest: dailyInterest * allocationRatios[i],
          allocatedFee: dailyFee * allocationRatios[i],
          totalAllocated: (dailyInterest + dailyFee) * allocationRatios[i],
          allocationRatio: allocationRatios[i],
        });
      }
    }

    return allocationItems;
  }

  private calculateSummary(items: any[]): any {
    if (items.length === 0) {
      return {
        avgClosingBalance: 0,
        maxClosingBalance: 0,
        minClosingBalance: 0,
        totalInflow: 0,
        totalOutflow: 0,
        avgConfidenceLevel: 0,
      };
    }

    let totalClosingBalance = 0;
    let totalInflow = 0;
    let totalOutflow = 0;
    let totalConfidence = 0;
    let maxClosingBalance = items[0].closingBalance;
    let minClosingBalance = items[0].closingBalance;

    for (const item of items) {
      totalClosingBalance += item.closingBalance;
      totalInflow += item.projectedInflow;
      totalOutflow += item.projectedOutflow;
      totalConfidence += item.confidenceLevel;
      
      maxClosingBalance = Math.max(maxClosingBalance, item.closingBalance);
      minClosingBalance = Math.min(minClosingBalance, item.closingBalance);
    }

    return {
      avgClosingBalance: totalClosingBalance / items.length,
      maxClosingBalance,
      minClosingBalance,
      totalInflow,
      totalOutflow,
      avgConfidenceLevel: totalConfidence / items.length,
    };
  }
}

const cashPosition = new CashPosition();
export default cashPosition;
