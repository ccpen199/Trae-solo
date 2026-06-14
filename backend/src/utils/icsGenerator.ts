import { InterviewSchedule } from '../entities/InterviewSchedule';

interface ICSInterviewData {
  id: number;
  jobTitle: string;
  companyName: string;
  interviewTime: Date;
  location?: string;
  interviewer?: string;
  jobseekerName?: string;
}

const formatDateICS = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
};

const escapeICS = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

export const generateICS = (interviewData: ICSInterviewData): string => {
  const { id, jobTitle, companyName, interviewTime, location, interviewer, jobseekerName } = interviewData;

  const startTime = new Date(interviewTime);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

  const dtStart = formatDateICS(startTime);
  const dtEnd = formatDateICS(endTime);
  const dtStamp = formatDateICS(new Date());
  const uid = `interview-${id}-${dtStamp}@printing-job-platform`;

  const summary = `面试：${jobTitle} - ${companyName}`;
  const descriptionParts: string[] = [
    jobseekerName ? `求职者：${jobseekerName}` : '',
    interviewer ? `面试官：${interviewer}` : '',
    `岗位：${jobTitle}`,
    `公司：${companyName}`
  ].filter(Boolean);
  const description = escapeICS(descriptionParts.join('\\n'));

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Printing Job Platform//Interview Calendar//ZH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeICS(summary)}`,
    `DESCRIPTION:${description}`,
    location ? `LOCATION:${escapeICS(location)}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:面试提醒：30分钟后开始',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');

  return icsContent;
};

export const generateICSFromInterview = (
  interview: InterviewSchedule,
  jobTitle: string,
  companyName: string,
  jobseekerName?: string
): string => {
  return generateICS({
    id: interview.id,
    jobTitle,
    companyName,
    interviewTime: interview.interviewTime,
    location: interview.location,
    interviewer: interview.interviewer,
    jobseekerName
  });
};
