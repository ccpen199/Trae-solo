export const APP_NAME = '高校社会实践协同管理平台';
export const APP_VERSION = '1.0.0';
export const DEFAULT_AVATAR = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=default%20avatar%20placeholder%20simple%20user%20icon&image_size=square';

export const SUBJECT_TAGS = [
  '农林',
  '医学',
  '教育',
  '工科',
  '文科',
  '理科',
  '艺术',
  '法学',
  '经济',
  '管理',
] as const;

export const CREDIT_STANDARDS = {
  sanxiaxiang: 4,
  activity: 1,
  volunteer: 2,
  other: 1,
} as const;

export const TEAM_THEMES = [
  '科技助农',
  '医疗健康',
  '文化传承',
  '生态环保',
  '教育帮扶',
  '政策宣讲',
  '产业调研',
  '社区服务',
] as const;
