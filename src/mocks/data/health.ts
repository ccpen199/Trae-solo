import type { HealthRecord, HealthIndicator } from '@/types/entity';

const now = new Date();

export const mockHealthRecords: HealthRecord[] = [];

for (let i = 0; i < 20; i++) {
  const recordDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
  const systolic = 110 + Math.floor(Math.random() * 30);
  const diastolic = 70 + Math.floor(Math.random() * 20);
  const heartRate = 65 + Math.floor(Math.random() * 20);
  const bloodSugar = 4.5 + Math.random() * 3;
  const weight = 60 + Math.random() * 20;
  const height = 165 + Math.floor(Math.random() * 15);
  const bmi = Math.round((weight / ((height / 100) ** 2)) * 10) / 10;

  mockHealthRecords.push({
    id: `health_${(i + 1).toString().padStart(3, '0')}`,
    userId: 'user_res_001',
    userName: '张三',
    recordDate: recordDate.toISOString().split('T')[0],
    bloodPressure: `${systolic}/${diastolic}`,
    heartRate,
    bloodSugar: Math.round(bloodSugar * 10) / 10,
    temperature: 36.3 + Math.random() * 0.8,
    weight: Math.round(weight * 10) / 10,
    height,
    bmi,
    remark: i % 5 === 0 ? '今日感觉良好' : undefined,
    createdAt: recordDate.toISOString(),
  });
}

export const mockHealthTrend = (days: number): HealthIndicator[] => {
  const trend: HealthIndicator[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const systolic = 115 + Math.floor(Math.random() * 25);
    const diastolic = 75 + Math.floor(Math.random() * 15);

    trend.push(
      {
        userId: 'user_res_001',
        indicatorType: 'systolic',
        value: systolic,
        unit: 'mmHg',
        normalRange: '90-140',
        status: systolic > 140 ? 'ABNORMAL' : systolic > 130 ? 'WARNING' : 'NORMAL',
        recordedAt: date.toISOString(),
      },
      {
        userId: 'user_res_001',
        indicatorType: 'diastolic',
        value: diastolic,
        unit: 'mmHg',
        normalRange: '60-90',
        status: diastolic > 90 ? 'ABNORMAL' : diastolic > 85 ? 'WARNING' : 'NORMAL',
        recordedAt: date.toISOString(),
      }
    );
  }
  return trend;
};

export const mockBloodSugarTrend = (days: number): HealthIndicator[] => {
  const trend: HealthIndicator[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const fasting = 4.8 + Math.random() * 1.5;
    const postprandial = 6.5 + Math.random() * 3;

    trend.push(
      {
        userId: 'user_res_001',
        indicatorType: 'fasting_blood_sugar',
        value: Math.round(fasting * 10) / 10,
        unit: 'mmol/L',
        normalRange: '3.9-6.1',
        status: fasting > 7 ? 'ABNORMAL' : fasting > 6.1 ? 'WARNING' : 'NORMAL',
        recordedAt: date.toISOString(),
      },
      {
        userId: 'user_res_001',
        indicatorType: 'postprandial_blood_sugar',
        value: Math.round(postprandial * 10) / 10,
        unit: 'mmol/L',
        normalRange: '<7.8',
        status: postprandial > 11.1 ? 'ABNORMAL' : postprandial > 7.8 ? 'WARNING' : 'NORMAL',
        recordedAt: date.toISOString(),
      }
    );
  }
  return trend;
};
