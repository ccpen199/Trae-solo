import prisma from '../config/database.js'

export const taxRuleEngine = {
  async calculateTaxes(declarationId) {
    const declaration = await prisma.declaration.findUnique({
      where: { id: declarationId },
      include: { items: true },
    })

    if (!declaration) {
      throw new Error('Declaration not found')
    }

    const exchangeRate = await this.getExchangeRate(declaration.currency || 'USD', 'CNY')

    const taxRecords = []
    let totalTax = 0

    for (const item of declaration.items) {
      const itemTaxes = await this.calculateItemTax(item, exchangeRate)
      taxRecords.push(...itemTaxes)
      totalTax += itemTaxes.reduce((sum, t) => sum + t.taxAmount, 0)
    }

    return {
      taxRecords,
      totalTax,
      exchangeRate,
    }
  },

  async calculateItemTax(item, exchangeRate) {
    const taxes = []
    const hsCode = item.hsCode || '0000000000'

    const tariffRate = this.getTariffRate(hsCode)
    const vatRate = this.getVatRate(hsCode)
    const consumptionTaxRate = this.getConsumptionTaxRate(hsCode)

    const dutiableValue = (item.totalAmount || 0) * exchangeRate

    if (tariffRate > 0) {
      const tariffAmount = dutiableValue * tariffRate
      taxes.push({
        itemId: item.id,
        taxType: 'TARIFF',
        taxBase: dutiableValue,
        taxRate: tariffRate,
        taxAmount: tariffAmount,
        currency: 'CNY',
        exchangeRate,
      })
    }

    const vatBase = dutiableValue + (tariffRate > 0 ? dutiableValue * tariffRate : 0)
    if (vatRate > 0) {
      const vatAmount = vatBase * vatRate
      taxes.push({
        itemId: item.id,
        taxType: 'VAT',
        taxBase: vatBase,
        taxRate: vatRate,
        taxAmount: vatAmount,
        currency: 'CNY',
        exchangeRate,
      })
    }

    if (consumptionTaxRate > 0) {
      const consumptionBase = vatBase / (1 - consumptionTaxRate)
      const consumptionAmount = consumptionBase * consumptionTaxRate
      taxes.push({
        itemId: item.id,
        taxType: 'CONSUMPTION',
        taxBase: consumptionBase,
        taxRate: consumptionTaxRate,
        taxAmount: consumptionAmount,
        currency: 'CNY',
        exchangeRate,
      })
    }

    return taxes
  },

  getTariffRate(hsCode) {
    const rules = {
      '84': 0.08,
      '85': 0.10,
      '61': 0.12,
      '62': 0.12,
      '90': 0.05,
    }
    const prefix = hsCode.substring(0, 2)
    return rules[prefix] || 0.10
  },

  getVatRate(hsCode) {
    const rules = {
      '84': 0.13,
      '85': 0.13,
      '90': 0.13,
    }
    const prefix = hsCode.substring(0, 2)
    return rules[prefix] || 0.13
  },

  getConsumptionTaxRate(hsCode) {
    const luxuryPrefixes = ['22', '24', '33', '44']
    const prefix = hsCode.substring(0, 2)
    if (luxuryPrefixes.includes(prefix)) {
      return 0.20
    }
    return 0
  },

  async getExchangeRate(fromCurrency, toCurrency) {
    const pair = `${fromCurrency}_${toCurrency}`
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let rate = await prisma.exchangeRate.findFirst({
      where: {
        currencyPair: pair,
        rateDate: { gte: today },
      },
      orderBy: { rateDate: 'desc' },
    })

    if (!rate) {
      rate = await prisma.exchangeRate.findFirst({
        where: { currencyPair: pair },
        orderBy: { rateDate: 'desc' },
      })
    }

    return rate ? Number(rate.rate) : 7.25
  },

  async saveTaxRecords(declarationId, taxRecords) {
    await prisma.taxRecord.deleteMany({
      where: { declarationId },
    })

    for (const record of taxRecords) {
      await prisma.taxRecord.create({
        data: {
          declarationId,
          itemId: record.itemId,
          taxType: record.taxType,
          taxBase: record.taxBase,
          taxRate: record.taxRate,
          taxAmount: record.taxAmount,
          currency: record.currency,
          exchangeRate: record.exchangeRate,
          paidStatus: 'UNPAID',
        },
      })
    }

    const totalTax = taxRecords.reduce((sum, r) => sum + r.taxAmount, 0)
    await prisma.declaration.update({
      where: { id: declarationId },
      data: { totalTax },
    })

    return totalTax
  },
}

export default taxRuleEngine
