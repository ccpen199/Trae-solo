import type { Cargo, DriverProfile, MatchedDriver } from "../../../shared/types";

export function calculateMatchScore(
  cargo: Cargo,
  driver: DriverProfile
): number {
  let score = 0;

  if (driver.performanceScore >= 95) {
    score += 30;
  } else if (driver.performanceScore >= 90) {
    score += 20;
  } else {
    score += 0;
  }

  const hasRequiredType = cargo.requiredVehicleTypes.some(
    (type) => driver.vehicleType === type
  );
  if (hasRequiredType) score += 25;

  const hasAllQualifications = cargo.requiredQualifications.every((qual) =>
    driver.qualifications.includes(qual)
  );
  if (hasAllQualifications) {
    score += 20;
  } else if (cargo.requiredQualifications.length === 0) {
    score += 20;
  } else {
    const hasSomeQualifications = cargo.requiredQualifications.some((qual) =>
      driver.qualifications.includes(qual)
    );
    if (hasSomeQualifications) score += 10;
  }

  const volumeRatio = Math.min(driver.vehicleVolume / cargo.volume, 1);
  const weightRatio = Math.min(driver.vehicleCapacity / cargo.weight, 1);
  score += (volumeRatio + weightRatio) * 12.5;

  const frequentMatch = driver.frequentRoutes.some(
    (r) =>
      cargo.origin.includes(r.origin.substring(0, 2)) &&
      cargo.destination.includes(r.destination.substring(0, 2))
  );
  if (frequentMatch) score += 5;

  return Math.round(Math.min(score, 100));
}

export function matchDrivers(
  cargo: Cargo,
  drivers: DriverProfile[]
): MatchedDriver[] {
  return drivers
    .filter((d) => d.isEmpty && d.performanceScore >= 90)
    .map((driver) => {
      const matchScore = calculateMatchScore(cargo, driver);
      const distanceToCargo = Math.round(Math.random() * 30 + 2);
      const etaMinutes = Math.round(distanceToCargo * 1.5 + 10);
      const eta = new Date(Date.now() + etaMinutes * 60000).toISOString();

      return {
        ...driver,
        matchScore,
        distanceToCargo,
        estimatedArrivalTime: eta,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function recommendCargosForDriver(
  driver: DriverProfile,
  cargos: Cargo[]
): { cargo: Cargo; isFrequentRoute: boolean; score: number }[] {
  return cargos
    .filter((c) => c.status === "published")
    .map((cargo) => {
      const isFrequentRoute = driver.frequentRoutes.some(
        (r) =>
          cargo.origin.includes(r.origin.substring(0, 2)) &&
          cargo.destination.includes(r.destination.substring(0, 2))
      );
      const typeMatch = cargo.requiredVehicleTypes.some(
        (t) => t === driver.vehicleType
      );
      let score = 0;
      if (isFrequentRoute) score += 50;
      if (typeMatch) score += 30;
      if (driver.performanceScore > 95) score += 20;

      return { cargo, isFrequentRoute, score };
    })
    .sort((a, b) => b.score - a.score);
}
