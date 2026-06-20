import type { Activity, ActivityParticipant, ActivityStatus, ActivityCategory } from '@/types/entity';

const now = new Date().toISOString();
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

const activityData: Array<{
  title: string;
  category: ActivityCategory;
  status: ActivityStatus;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  needReview?: boolean;
  fee?: number;
}> = [
  { title: '社区春节联欢晚会', category: 'CULTURE', status: 'ENDED', location: '社区活动中心', maxParticipants: 200, currentParticipants: 156, needReview: false, fee: 0 },
  { title: '亲子运动会', category: 'SPORTS', status: 'ENDED', location: '小区广场', maxParticipants: 100, currentParticipants: 78, needReview: false, fee: 0 },
  { title: '老年人健康讲座', category: 'EDUCATION', status: 'ENDED', location: '社区会议室', maxParticipants: 50, currentParticipants: 42, needReview: true, fee: 0 },
  { title: '爱心捐赠活动', category: 'CHARITY', status: 'ONGOING', location: '物业服务中心', maxParticipants: 999, currentParticipants: 128, needReview: false, fee: 0 },
  { title: '夏季游泳培训班', category: 'SPORTS', status: 'ONGOING', location: '小区游泳馆', maxParticipants: 30, currentParticipants: 28, needReview: true, fee: 200 },
  { title: '书法兴趣班', category: 'CULTURE', status: 'ONGOING', location: '社区文化室', maxParticipants: 20, currentParticipants: 18, needReview: true, fee: 50 },
  { title: '消防安全知识培训', category: 'EDUCATION', status: 'PUBLISHED', location: '小区广场', maxParticipants: 100, currentParticipants: 45, needReview: false, fee: 0 },
  { title: '中秋赏月晚会', category: 'CULTURE', status: 'PUBLISHED', location: '小区花园', maxParticipants: 300, currentParticipants: 156, needReview: false, fee: 0 },
  { title: '青少年编程体验课', category: 'EDUCATION', status: 'PUBLISHED', location: '社区活动中心', maxParticipants: 25, currentParticipants: 20, needReview: true, fee: 0 },
  { title: '周末瑜伽课程', category: 'SPORTS', status: 'DRAFT', location: '小区健身房', maxParticipants: 15, currentParticipants: 0, needReview: false, fee: 30 },
];

export const mockActivities: Activity[] = activityData.map((a, idx) => {
  const startTime = new Date(Date.now() + (idx - 5) * 7 * 24 * 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);
  const registrationDeadline = new Date(startTime.getTime() - 2 * 24 * 60 * 60 * 1000);

  return {
    id: `act_${(idx + 1).toString().padStart(3, '0')}`,
    title: a.title,
    description: `${a.title}活动详情：欢迎广大业主积极参与！活动内容丰富，奖品多多。请提前报名，名额有限先到先得。`,
    category: a.category,
    status: a.status,
    coverImage: `https://api.dicebear.com/7.x/shapes/svg?seed=activity${idx + 1}`,
    location: a.location,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    maxParticipants: a.maxParticipants,
    currentParticipants: a.currentParticipants,
    fee: a.fee,
    needReview: a.needReview,
    registrationDeadline: registrationDeadline.toISOString(),
    communityId: 'comm_yangguang',
    createdAt: thirtyDaysAgo,
    updatedAt: now,
  };
});

const residentNames = [
  '张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十',
  '冯十一', '陈十二', '褚十三', '卫十四', '蒋十五', '沈十六',
  '韩十七', '杨十八', '朱十九', '秦二十', '尤廿一', '许廿二',
];

export const mockActivityParticipants: ActivityParticipant[] = [];

mockActivities.forEach((activity, actIdx) => {
  if (activity.currentParticipants > 0) {
    const participantCount = Math.min(activity.currentParticipants, 20);
    for (let i = 0; i < participantCount; i++) {
      const signedUpAt = new Date(new Date(activity.startTime).getTime() - (10 - i) * 24 * 60 * 60 * 1000);
      let status: ActivityParticipant['status'];
      
      if (activity.status === 'ENDED') {
        status = i % 5 === 0 ? 'CANCELLED' : 'ATTENDED';
      } else if (activity.needReview) {
        if (i % 5 === 0) {
          status = 'PENDING_REVIEW';
        } else if (i % 5 === 1) {
          status = 'REJECTED';
        } else if (i % 5 === 2 && activity.status === 'ONGOING') {
          status = 'ATTENDED';
        } else {
          status = 'REGISTERED';
        }
      } else {
        status = activity.status === 'ONGOING' && i % 3 === 0 ? 'ATTENDED' : 'REGISTERED';
      }

      const participant: ActivityParticipant = {
        id: `part_${actIdx}_${i}`,
        activityId: activity.id,
        userId: `user_res_${(i + 10).toString().padStart(3, '0')}`,
        userName: residentNames[i % residentNames.length],
        phone: `13300${(100 + i).toString().padStart(6, '0')}`,
        signedUpAt: signedUpAt.toISOString(),
        status,
      };

      if (status === 'REGISTERED' || status === 'REJECTED') {
        participant.reviewedAt = new Date(signedUpAt.getTime() + 2 * 60 * 60 * 1000).toISOString();
        participant.reviewerName = '社区管理员';
      }

      if (status === 'ATTENDED') {
        participant.attendedAt = new Date(activity.startTime).toISOString();
      }

      mockActivityParticipants.push(participant);
    }
  }
});
