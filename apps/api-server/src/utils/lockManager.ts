const MAX_FAIL_COUNT = 3;
const LOCK_DURATION = 24 * 60 * 60 * 1000;

interface LockRecord {
  failCount: number;
  lockedUntil: number | null;
}

const lockStore = new Map<string, LockRecord>();

export function checkLocked(userId: string): { locked: boolean; lockedUntil: number | null; remainingMs: number } {
  const record = lockStore.get(userId);
  if (!record || !record.lockedUntil) {
    return { locked: false, lockedUntil: null, remainingMs: 0 };
  }

  if (Date.now() < record.lockedUntil) {
    return {
      locked: true,
      lockedUntil: record.lockedUntil,
      remainingMs: record.lockedUntil - Date.now(),
    };
  }

  record.lockedUntil = null;
  record.failCount = 0;
  return { locked: false, lockedUntil: null, remainingMs: 0 };
}

export function incrementFail(userId: string): { failCount: number; locked: boolean } {
  let record = lockStore.get(userId);
  if (!record) {
    record = { failCount: 0, lockedUntil: null };
    lockStore.set(userId, record);
  }

  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    return { failCount: record.failCount, locked: true };
  }

  record.failCount += 1;

  if (record.failCount >= MAX_FAIL_COUNT) {
    record.lockedUntil = Date.now() + LOCK_DURATION;
    return { failCount: record.failCount, locked: true };
  }

  return { failCount: record.failCount, locked: false };
}

export function resetLock(userId: string): void {
  lockStore.delete(userId);
}

export function getFailCount(userId: string): number {
  const record = lockStore.get(userId);
  return record?.failCount ?? 0;
}
