export const MAX_CONTACTS = parseInt(process.env.MAX_CONTACTS) || 500;
export const MAX_CALL_RECORDS = parseInt(process.env.MAX_CALL_RECORDS) || 1000;
export const MAX_MESSAGE_RECORDS = parseInt(process.env.MAX_MESSAGE_RECORDS) || 1000;
export const MAX_MESSAGE_CENTER = parseInt(process.env.MAX_MESSAGE_CENTER) || 2000;
export const MAX_GROUP_MESSAGE_USERS = parseInt(process.env.MAX_GROUP_MESSAGE_USERS) || 10;
export const INVITE_SMS_LIMIT_PER_DAY = parseInt(process.env.INVITE_SMS_LIMIT_PER_DAY) || 50;

export const CALL_STATUS = {
  DIALING: 'dialing',
  RINGING: 'ringing',
  CONNECTED: 'connected',
  ANSWERED: 'answered',
  REJECTED: 'rejected',
  MISSED: 'missed',
  ENDED: 'ended',
  CANCELLED: 'cancelled'
};

export const MESSAGE_TYPES = {
  CALL_RECORD: 'call_record',
  VIDEO_MESSAGE: 'video_message',
  CONTACT_CHANGE: 'contact_change',
  CAPACITY_ALERT: 'capacity_alert',
  SYSTEM_NOTICE: 'system_notice'
};

export const RELATION_SOURCES = {
  MANUAL: 'manual',
  VIDEO_CALL: 'video_call',
  VIDEO_INVITE: 'video_invite',
  VIDEO_MESSAGE: 'video_message'
};
