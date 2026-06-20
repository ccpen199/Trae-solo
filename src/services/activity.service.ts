import type { ApiResponse, PageResult, PageParams } from '@/types/api';
import type { Activity, ActivityParticipant } from '@/types/entity';
import { mockDelay, mockSuccess } from '@/mocks/utils';
import { mockActivities, mockActivityParticipants } from '@/mocks/data/activities';

export interface ActivityListParams extends PageParams {
  category?: string;
  status?: string;
  keyword?: string;
}

export const getActivityList = async (
  params?: ActivityListParams
): Promise<ApiResponse<PageResult<Activity>>> => {
  await mockDelay();

  let list = [...mockActivities];

  if (params?.category) {
    list = list.filter((a) => a.category === params.category);
  }
  if (params?.status) {
    list = list.filter((a) => a.status === params.status);
  }
  if (params?.keyword) {
    const kw = params.keyword.toLowerCase();
    list = list.filter((a) => a.title.toLowerCase().includes(kw));
  }

  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const total = list.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedList = list.slice(start, end);

  return mockSuccess({
    list: paginatedList,
    total,
    page,
    pageSize,
    totalPages,
  });
};

export interface ActivityDetail extends Activity {
  participants: ActivityParticipant[];
}

export const getActivityDetail = async (id: string): Promise<ApiResponse<ActivityDetail | null>> => {
  await mockDelay();

  const activity = mockActivities.find((a) => a.id === id);
  if (!activity) {
    return mockSuccess(null);
  }

  const participants = mockActivityParticipants.filter((p) => p.activityId === id);

  return mockSuccess({
    ...activity,
    participants,
  });
};

export const signUpActivity = async (id: string): Promise<ApiResponse<ActivityParticipant>> => {
  await mockDelay();

  const activity = mockActivities.find((a) => a.id === id);
  if (activity) {
    activity.currentParticipants += 1;
  }

  const participant: ActivityParticipant = {
    id: `part_${Date.now()}`,
    activityId: id,
    userId: 'user_res_001',
    userName: '张三',
    phone: '13300133001',
    signedUpAt: new Date().toISOString(),
    status: 'REGISTERED',
  };

  mockActivityParticipants.push(participant);

  return mockSuccess(participant);
};

export const signInActivity = async (id: string, code: string): Promise<ApiResponse<ActivityParticipant>> => {
  await mockDelay();

  const participant = mockActivityParticipants.find(
    (p) => p.activityId === id && p.userId === 'user_res_001'
  );

  if (participant) {
    participant.status = 'ATTENDED';
  }

  return mockSuccess(participant || ({} as ActivityParticipant));
};
