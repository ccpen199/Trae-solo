const db = require('../database');
const { v4: uuidv4 } = require('uuid');

class CurrencyConvertEngine {
  constructor() {
    this.exchangeRates = {
      CNY: { name: '人民币', symbol: '¥', toCNY: 1 },
      USD: { name: '美元', symbol: '$', toCNY: 7.25 },
      EUR: { name: '欧元', symbol: '€', toCNY: 7.85 },
      GBP: { name: '英镑', symbol: '£', toCNY: 8.55 },
      JPY: { name: '日元', symbol: '¥', toCNY: 0.048 },
      HKD: { name: '港币', symbol: 'HK$', toCNY: 0.925 }
    };
  }

  convert(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return {
        amount,
        currency: toCurrency,
        exchangeRate: 1,
        fee: 0
      };
    }

    const fromRate = this.exchangeRates[fromCurrency]?.toCNY;
    const toRate = this.exchangeRates[toCurrency]?.toCNY;

    if (!fromRate || !toRate) {
      throw new Error(`不支持的货币类型: ${fromCurrency} -> ${toCurrency}`);
    }

    const amountInCNY = amount * fromRate;
    const convertedAmount = amountInCNY / toRate;
    const exchangeRate = fromRate / toRate;

    const fee = this.calculateConversionFee(amountInCNY);
    const netAmount = convertedAmount - (fee / toRate);

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: Math.round(netAmount * 100) / 100,
      convertedCurrency: toCurrency,
      exchangeRate: Math.round(exchangeRate * 10000) / 10000,
      fee,
      feeCurrency: 'CNY',
      timestamp: new Date().toISOString()
    };
  }

  calculateConversionFee(amountInCNY) {
    const feeRate = 0.005;
    const minFee = 2;
    const maxFee = 50;

    let fee = amountInCNY * feeRate;
    fee = Math.min(Math.max(fee, minFee), maxFee);

    return Math.round(fee * 100) / 100;
  }

  getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const fromRate = this.exchangeRates[fromCurrency]?.toCNY;
    const toRate = this.exchangeRates[toCurrency]?.toCNY;

    if (!fromRate || !toRate) {
      throw new Error(`不支持的货币类型: ${fromCurrency} -> ${toCurrency}`);
    }

    return fromRate / toRate;
  }

  getSupportedCurrencies() {
    return Object.keys(this.exchangeRates).map(code => ({
      code,
      name: this.exchangeRates[code].name,
      symbol: this.exchangeRates[code].symbol,
      toCNY: this.exchangeRates[code].toCNY
    }));
  }

  async updateExchangeRate(currencyCode, newToCNYRate) {
    if (!this.exchangeRates[currencyCode]) {
      throw new Error(`不支持的货币类型: ${currencyCode}`);
    }

    this.exchangeRates[currencyCode].toCNY = newToCNYRate;

    await db.run(
      `INSERT INTO operation_logs (
        id, operation_type, target_type, target_id, detail
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        'update_exchange_rate',
        'currency',
        currencyCode,
        `更新 ${currencyCode} 汇率为 ${newToCNYRate}`
      ]
    );

    return {
      success: true,
      currencyCode,
      newRate: newToCNYRate,
      updatedAt: new Date().toISOString()
    };
  }

  async executeCurrencyConversion(userId, amount, fromCurrency, toCurrency) {
    const conversion = this.convert(amount, fromCurrency, toCurrency);

    await db.run(
      `INSERT INTO operation_logs (
        id, user_id, operation_type, detail
      ) VALUES (?, ?, ?, ?)`,
      [
        uuidv4(),
        userId,
        'currency_conversion',
        `货币兑换: ${amount} ${fromCurrency} -> ${conversion.convertedAmount} ${toCurrency}, 手续费 ${conversion.fee}`
      ]
    );

    return conversion;
  }

  getCurrencyInfo(currencyCode) {
    const currency = this.exchangeRates[currencyCode];
    if (!currency) {
      throw new Error(`不支持的货币类型: ${currencyCode}`);
    }
    return {
      code: currencyCode,
      ...currency
    };
  }
}

module.exports = new CurrencyConvertEngine();
