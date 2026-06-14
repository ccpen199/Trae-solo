import type {
  CargoOrder,
  VehicleSensorData,
  FulfillmentResult,
  CheckResult,
  Violation,
  TempControl,
} from '@/types';

const tempRanges: Record<TempControl, [number, number]> = {
  NORMAL: [-Infinity, Infinity],
  FRESH: [2, 8],
  REFRIGERATED: [-22, -14],
  DEEP_FREEZE: [-35, -25],
};

export function checkLoad(order: CargoOrder, history: VehicleSensorData[]): CheckResult {
  if (history.length === 0) return { pass: false, score: 0, detail: '无传感器数据' };
  const sorted = [...history].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const finalLoad = sorted[sorted.length - 1].loadWeight;
  const initialLoad = sorted[0].loadWeight;
  const loaded = Math.max(0, finalLoad - initialLoad);
  const expected = order.weight;
  const diffRatio = Math.abs(loaded - expected) / Math.max(expected, 1);
  const pass = diffRatio < 0.1;
  const score = Math.max(0, 100 - diffRatio * 300);
  return {
    pass,
    score: +score.toFixed(1),
    detail: `实际装载 ${loaded.toFixed(0)}kg，预期 ${expected}kg，偏差 ${(diffRatio * 100).toFixed(1)}%`,
  };
}

export function checkTemp(order: CargoOrder, history: VehicleSensorData[]): { result: CheckResult; violations: Violation[] } {
  const violations: Violation[] = [];
  if (order.tempControl === 'NORMAL') {
    return {
      result: { pass: true, score: 100, detail: '常温运输，无需温控校验' },
      violations,
    };
  }
  const range = tempRanges[order.tempControl];
  let outCount = 0;
  const total = history.length;
  history.forEach((d) => {
    if (d.temperature < range[0] || d.temperature > range[1]) {
      outCount++;
      if (Math.random() < 0.2) {
        violations.push({
          type: 'TEMP',
          timestamp: d.timestamp,
          severity: Math.abs(d.temperature) > Math.abs(range[1]) + 5 ? 'SERIOUS' : 'WARNING',
          description: `温度异常：${d.temperature.toFixed(1)}℃（允许 ${range[0]}~${range[1]}℃）`,
        });
      }
    }
  });
  const outRate = total === 0 ? 0 : outCount / total;
  const pass = outRate < 0.1;
  const score = Math.max(0, 100 - outRate * 400);
  return {
    result: {
      pass,
      score: +score.toFixed(1),
      detail: `共 ${total} 次采样，超温 ${outCount} 次，超温率 ${(outRate * 100).toFixed(1)}%`,
    },
    violations,
  };
}

export function checkDoors(order: CargoOrder, history: VehicleSensorData[]): { result: CheckResult; violations: Violation[] } {
  const violations: Violation[] = [];
  const expected = order.stops.length * 2;
  const actual = history.length > 0 ? history[history.length - 1].doorOpenCount : 0;
  const pass = Math.abs(actual - expected) <= 2;
  const diff = Math.abs(actual - expected);
  const score = Math.max(0, 100 - diff * 15);

  if (diff > 2) {
    violations.push({
      type: 'DOOR',
      timestamp: new Date().toISOString(),
      severity: diff > 4 ? 'SERIOUS' : 'WARNING',
      description: `开门次数不符：实际 ${actual} 次，预期 ${expected} 次`,
    });
  }
  return {
    result: {
      pass,
      score: +score.toFixed(1),
      detail: `实际开门 ${actual} 次，预期 ${expected} 次（每站点取/送各一次）`,
    },
    violations,
  };
}

export function checkStopSeq(order: CargoOrder): CheckResult {
  const arrived = order.stops.filter((s) => s.arrivedAt);
  const expectedSeq = order.stops.map((_, i) => i);
  const actualSeq = arrived
    .sort((a, b) => (a.arrivedAt ?? '').localeCompare(b.arrivedAt ?? ''))
    .map((s) => s.seq - 1);

  let outOfOrder = 0;
  for (let i = 0; i < actualSeq.length; i++) {
    if (actualSeq[i] !== expectedSeq[i]) outOfOrder++;
  }
  const pass = outOfOrder === 0;
  const score = Math.max(0, 100 - outOfOrder * 30);
  return {
    pass,
    score: +score.toFixed(1),
    detail: pass
      ? `按顺序完成全部 ${arrived.length} 个站点`
      : `${outOfOrder} 个站点顺序异常`,
  };
}

export function runFulfillmentCheck(order: CargoOrder, sensorHistory: VehicleSensorData[]): FulfillmentResult {
  const loadCheck = checkLoad(order, sensorHistory);
  const { result: tempCheck, violations: tempV } = checkTemp(order, sensorHistory);
  const { result: doorCheck, violations: doorV } = checkDoors(order, sensorHistory);
  const stopSeqCheck = checkStopSeq(order);

  const violations: Violation[] = [...tempV, ...doorV];
  const overallPass =
    loadCheck.pass && tempCheck.pass && doorCheck.pass && stopSeqCheck.pass;

  return {
    orderId: order.id,
    loadCheck,
    tempCheck,
    doorCheck,
    stopSeqCheck,
    overallPass,
    violations,
  };
}
