function parseIntent(content) {
  const lowerContent = content.toLowerCase();
  
  const interviewPatterns = [
    /面试/, /面一下/, /聊聊/, /谈一下/, /下周.*面/, /这周.*面/,
    /什么时候.*面/, /方便.*面/, /安排.*面/, /interview/
  ];
  
  for (const pattern of interviewPatterns) {
    if (pattern.test(lowerContent)) {
      return {
        type: 'interview_request',
        confidence: 0.8,
        data: extractScheduleInfo(content)
      };
    }
  }

  const salaryPatterns = [/薪资/, /工资/, /待遇/, /薪水/, /salary/, /pay/];
  for (const pattern of salaryPatterns) {
    if (pattern.test(lowerContent)) {
      return { type: 'salary_inquiry', confidence: 0.7 };
    }
  }

  const timePatterns = [/到岗/, /入职/, /上班/, /start/, /join/];
  for (const pattern of timePatterns) {
    if (pattern.test(lowerContent)) {
      return { type: 'availability_inquiry', confidence: 0.7 };
    }
  }

  const rejectPatterns = [/不考虑/, /不合适/, /抱歉/, /再想想/, /考虑一下/];
  for (const pattern of rejectPatterns) {
    if (pattern.test(lowerContent)) {
      return { type: 'rejection', confidence: 0.6 };
    }
  }

  const acceptPatterns = [/可以/, /没问题/, /好的/, /同意/, /接受/, /ok/, /yes/];
  for (const pattern of acceptPatterns) {
    if (pattern.test(lowerContent) && lowerContent.length < 10) {
      return { type: 'acceptance', confidence: 0.6 };
    }
  }

  return null;
}

function extractScheduleInfo(content) {
  const result = {};
  
  const dayMatches = content.match(/(下周|这周|下周一|下周二|下周三|下周四|下周五|周一|周二|周三|周四|周五|周六|周日)/);
  if (dayMatches) {
    result.suggested_day = dayMatches[0];
  }

  const timeMatches = content.match(/(\d{1,2})[:点](\d{2})?/);
  if (timeMatches) {
    result.suggested_time = timeMatches[0];
  }

  const dateMatches = content.match(/(\d{1,2})月(\d{1,2})[日号]/);
  if (dateMatches) {
    const now = new Date();
    result.suggested_date = `${now.getFullYear()}-${dateMatches[1].padStart(2, '0')}-${dateMatches[2].padStart(2, '0')}`;
  }

  return result;
}

module.exports = { parseIntent, extractScheduleInfo };
