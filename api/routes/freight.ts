import { Router } from 'express';

const router = Router();

const cityDistances: Record<string, Record<string, number>> = {
  '北京': { '上海': 1200, '广州': 2100, '深圳': 2200, '杭州': 1300, '成都': 1800, '武汉': 1100, '南京': 1000, '重庆': 1700, '长沙': 1400, '天津': 120 },
  '上海': { '北京': 1200, '广州': 1500, '深圳': 1600, '杭州': 180, '成都': 2000, '武汉': 850, '南京': 300, '重庆': 1900, '长沙': 1100, '天津': 1100 },
  '杭州': { '北京': 1300, '上海': 180, '广州': 1350, '深圳': 1450, '成都': 1900, '武汉': 800, '南京': 280, '重庆': 1800, '长沙': 1000, '天津': 1200 },
  '广州': { '北京': 2100, '上海': 1500, '深圳': 140, '杭州': 1350, '成都': 1700, '武汉': 1000, '南京': 1300, '重庆': 1600, '长沙': 700, '天津': 2000 },
  '深圳': { '北京': 2200, '上海': 1600, '广州': 140, '杭州': 1450, '成都': 1800, '武汉': 1100, '南京': 1400, '重庆': 1700, '长沙': 800, '天津': 2100 },
};

function extractCity(address: string): string {
  const match = address.match(/(北京|上海|广州|深圳|杭州|成都|武汉|南京|重庆|长沙|天津)/);
  return match ? match[1] : '';
}

function getDistance(senderAddr: string, receiverAddr: string): number {
  const from = extractCity(senderAddr);
  const to = extractCity(receiverAddr);
  if (!from || !to) return 500;
  if (from === to) return 15;
  if (cityDistances[from]?.[to]) return cityDistances[from][to];
  if (cityDistances[to]?.[from]) return cityDistances[to][from];
  return 800;
}

router.post('/calculate', (req, res) => {
  try {
    const { senderAddress, receiverAddress, weight, serviceLevel = 'standard' } = req.body;
    if (!senderAddress || !receiverAddress || weight == null) {
      res.status(400).json({ error: 'senderAddress, receiverAddress, and weight are required' });
      return;
    }

    const distance = getDistance(senderAddress, receiverAddress);
    const baseFee = 12;
    const distanceFee = +(distance * 0.8).toFixed(2);
    const weightFee = weight > 1 ? +((weight - 1) * 5).toFixed(2) : 0;

    const serviceMultipliers: Record<string, number> = { standard: 1.0, express: 1.5, same_day: 2.5 };
    const multiplier = serviceMultipliers[serviceLevel] || 1.0;
    const serviceFee = +((baseFee + distanceFee + weightFee) * (multiplier - 1)).toFixed(2);

    const discount = 0;
    const totalFee = +(baseFee + distanceFee + weightFee + serviceFee - discount).toFixed(2);

    const estimatedDaysMap: Record<string, [number, number]> = { standard: [3, 5], express: [1, 2], same_day: [0, 1] };
    const [minDays, maxDays] = estimatedDaysMap[serviceLevel] || [3, 5];

    res.json({
      baseFee,
      distanceFee,
      weightFee,
      serviceFee,
      discount,
      totalFee,
      estimatedDays: maxDays,
      distance,
      estimatedDaysRange: `${minDays}-${maxDays}`,
    });
  } catch (error) {
    console.error('Freight calculation failed:', error);
    res.status(500).json({ error: 'Freight calculation failed' });
  }
});

export default router;
