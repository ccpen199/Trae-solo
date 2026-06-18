import { get } from '../api';
import type { DashboardOverview } from '../../../shared/types';

export async function getDashboardOverview() {
  return get<DashboardOverview>('/dashboard/overview');
}
