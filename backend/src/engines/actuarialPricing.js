const dayjs = require('dayjs');

class ActuarialPricingEngine {
  constructor() {
    this.riskFactorWeights = {
      age: 0.25,
      health: 0.35,
      occupation: 0.20,
      lifestyle: 0.15,
      region: 0.05
    };
    
    this.baseRates = {
      life: {
        basePremium: 1000,
        sumAssuredMultiplier: 0.001
      },
      health: {
        basePremium: 500,
        sumAssuredMultiplier: 0.002
      },
      accident: {
        basePremium: 200,
        sumAssuredMultiplier: 0.0005
      },
      property: {
        basePremium: 800,
        sumAssuredMultiplier: 0.0015
      }
    };
    
    this.ageFactors = this.generateAgeFactors();
    this.healthFactors = this.generateHealthFactors();
    this.occupationFactors = this.generateOccupationFactors();
    this.lifestyleFactors = this.generateLifestyleFactors();
  }

  generateAgeFactors() {
    const factors = {};
    for (let age = 0; age <= 100; age++) {
      if (age < 18) factors[age] = 0.8;
      else if (age <= 30) factors[age] = 1.0;
      else if (age <= 40) factors[age] = 1.1;
      else if (age <= 50) factors[age] = 1.3;
      else if (age <= 60) factors[age] = 1.6;
      else if (age <= 70) factors[age] = 2.0;
      else factors[age] = 2.5;
    }
    return factors;
  }

  generateHealthFactors() {
    return {
      excellent: 0.9,
      good: 1.0,
      fair: 1.2,
      poor: 1.5,
      critical: 2.0
    };
  }

  generateOccupationFactors() {
    return {
      office: 1.0,
      professional: 1.0,
      service: 1.1,
      manual: 1.3,
      high_risk: 1.8,
      hazardous: 2.5
    };
  }

  generateLifestyleFactors() {
    return {
      non_smoker_non_drinker: 0.9,
      non_smoker_occasional_drinker: 1.0,
      smoker_non_drinker: 1.2,
      smoker_drinker: 1.4,
      high_risk_hobbies: 1.3
    };
  }

  calculateRiskScore(riskFactors) {
    const { age, health, occupation, lifestyle, region } = riskFactors;
    
    const ageFactor = this.ageFactors[age] || 1.0;
    const healthFactor = this.healthFactors[health] || 1.0;
    const occupationFactor = this.occupationFactors[occupation] || 1.0;
    const lifestyleFactor = this.lifestyleFactors[lifestyle] || 1.0;
    const regionFactor = 1.0;
    
    const weightedScore = 
      ageFactor * this.riskFactorWeights.age +
      healthFactor * this.riskFactorWeights.health +
      occupationFactor * this.riskFactorWeights.occupation +
      lifestyleFactor * this.riskFactorWeights.lifestyle +
      regionFactor * this.riskFactorWeights.region;
    
    const normalizedScore = Math.min(100, Math.max(0, weightedScore * 50));
    
    return {
      score: normalizedScore,
      level: normalizedScore <= 30 ? 'low' : normalizedScore <= 60 ? 'medium' : 'high',
      factors: {
        age: ageFactor,
        health: healthFactor,
        occupation: occupationFactor,
        lifestyle: lifestyleFactor,
        region: regionFactor
      }
    };
  }

  calculatePremium(productCategory, sumAssured, riskFactors, policyTermMonths) {
    const rateConfig = this.baseRates[productCategory] || this.baseRates.life;
    const riskScore = this.calculateRiskScore(riskFactors);
    
    const basePremium = rateConfig.basePremium;
    const sumAssuredPremium = sumAssured * rateConfig.sumAssuredMultiplier;
    const termMultiplier = policyTermMonths / 12;
    
    let annualPremium = (basePremium + sumAssuredPremium) * riskScore.score / 50;
    annualPremium = annualPremium * termMultiplier;
    annualPremium = Math.round(annualPremium * 100) / 100;
    
    const monthlyPremium = Math.round((annualPremium / policyTermMonths) * 100) / 100;
    
    return {
      annualPremium,
      monthlyPremium,
      totalPremium: annualPremium,
      riskScore: riskScore.score,
      riskLevel: riskScore.level,
      breakdown: {
        base: basePremium,
        sumAssured: sumAssuredPremium,
        term: termMultiplier,
        riskAdjustment: riskScore.score / 50
      },
      factors: riskScore.factors
    };
  }

  validateProductConfig(product) {
    const errors = [];
    
    if (!product.name) errors.push('产品名称不能为空');
    if (!product.code) errors.push('产品代码不能为空');
    if (!product.category) errors.push('产品分类不能为空');
    if (!product.base_premium && product.base_premium !== 0) {
      errors.push('基础保费不能为空');
    }
    
    if (!this.baseRates[product.category]) {
      errors.push(`不支持的产品分类: ${product.category}`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  prepareProductForSale(product, riskFactorsConfig) {
    const validation = this.validateProductConfig(product);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors
      };
    }
    
    const sampleRiskFactors = {
      age: 30,
      health: 'good',
      occupation: 'office',
      lifestyle: 'non_smoker_non_drinker',
      region: 'default'
    };
    
    const samplePremium = this.calculatePremium(
      product.category,
      100000,
      sampleRiskFactors,
      12
    );
    
    return {
      success: true,
      product: {
        ...product,
        risk_factors: JSON.stringify({
          ...riskFactorsConfig,
          baseFactors: this.riskFactorWeights
        }),
        samplePremium: samplePremium.annualPremium
      },
      pricingSummary: {
        samplePremium30yearOldGoodHealth: samplePremium,
        riskModelVersion: '1.0.0',
        effectiveDate: dayjs().format('YYYY-MM-DD')
      }
    };
  }
}

module.exports = new ActuarialPricingEngine();
