import type {
  ArtistProfile,
  CastingRequirement,
  SearchCriteria,
  Schedule,
  MatchResult,
  ScheduleConflict,
} from '@shared/types';

const EARTH_RADIUS_KM = 6371;

export function matchField(
  artistValue: any,
  operator: CastingRequirement['operator'],
  requirementValue: any
): boolean {
  switch (operator) {
    case 'eq':
      return artistValue === requirementValue;
    case 'gte':
      return artistValue >= requirementValue;
    case 'lte':
      return artistValue <= requirementValue;
    case 'in':
      if (Array.isArray(requirementValue)) {
        if (Array.isArray(artistValue)) {
          return artistValue.some((v) => requirementValue.includes(v));
        }
        return requirementValue.includes(artistValue);
      }
      return false;
    case 'between':
      if (Array.isArray(requirementValue) && requirementValue.length === 2) {
        return artistValue >= requirementValue[0] && artistValue <= requirementValue[1];
      }
      return false;
    default:
      return false;
  }
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function checkScheduleConflicts(
  artistSchedules: Schedule[],
  startDate: Date,
  endDate: Date
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  for (const schedule of artistSchedules) {
    const scheduleDate = new Date(schedule.date).getTime();
    if (scheduleDate >= start && scheduleDate <= end) {
      if (schedule.status === 'booked' || schedule.status === 'unavailable') {
        conflicts.push({
          date: new Date(schedule.date),
          type: 'schedule_booked',
          description: `艺术家在 ${schedule.date.toDateString()} 已有安排: ${schedule.description || '已预约'}`,
        });
      }
    }
  }

  return conflicts;
}

export function calculateMatchScore(
  artist: ArtistProfile,
  requirements: CastingRequirement[],
  filters: SearchCriteria,
  schedules: Schedule[] = []
): MatchResult {
  let score = 0;
  const matchReasons: string[] = [];
  const totalFields = requirements.length;
  let matchedFields = 0;

  for (const req of requirements) {
    const artistValue = (artist as any)[req.field];
    if (artistValue === undefined || artistValue === null) continue;

    const isMatch = matchField(artistValue, req.operator, req.value);
    if (isMatch) {
      matchedFields++;
      score += 100 / totalFields;
      matchReasons.push(`${req.field} 匹配要求`);
    }
  }

  if (filters.location && filters.radius && artist.latitude && artist.longitude) {
    const [targetLat, targetLng] = filters.location.split(',').map(Number);
    if (!isNaN(targetLat) && !isNaN(targetLng)) {
      const distance = calculateDistance(
        artist.latitude,
        artist.longitude,
        targetLat,
        targetLng
      );
      if (distance <= filters.radius) {
        const locationBonus = Math.max(0, 20 * (1 - distance / filters.radius));
        score += locationBonus;
        matchReasons.push(`距离 ${distance.toFixed(1)}km，在 ${filters.radius}km 范围内`);
      }
    }
  }

  if (filters.skills && filters.skills.length > 0 && artist.skills) {
    const matchedSkills = artist.skills.filter((s) => filters.skills!.includes(s));
    if (matchedSkills.length > 0) {
      score += matchedSkills.length * 5;
      matchReasons.push(`技能匹配: ${matchedSkills.join(', ')}`);
    }
  }

  if (filters.languages && filters.languages.length > 0 && artist.languages) {
    const matchedLangs = artist.languages.filter((l) => filters.languages!.includes(l));
    if (matchedLangs.length > 0) {
      score += matchedLangs.length * 3;
      matchReasons.push(`语言匹配: ${matchedLangs.join(', ')}`);
    }
  }

  if (artist.tags && artist.tags.length > 0) {
    const tagScore = artist.tags.reduce((sum, tag) => sum + tag.weight, 0);
    score += tagScore;
    if (tagScore > 0) {
      matchReasons.push(`标签权重加分: ${tagScore}`);
    }
  }

  const conflicts: ScheduleConflict[] = [];
  if (filters.availableFrom && filters.availableTo && schedules.length > 0) {
    const scheduleConflicts = checkScheduleConflicts(
      schedules,
      filters.availableFrom,
      filters.availableTo
    );
    conflicts.push(...scheduleConflicts);
    if (scheduleConflicts.length > 0) {
      score -= scheduleConflicts.length * 10;
    }
  }

  if (filters.contractStatus && artist.contractStatus !== filters.contractStatus) {
    score -= 30;
    matchReasons.push(`合同状态不匹配: 需要 ${filters.contractStatus}，实际 ${artist.contractStatus}`);
  }

  return {
    artist,
    score: Math.max(0, Math.min(100, score)),
    matchReasons,
    conflicts,
  };
}
