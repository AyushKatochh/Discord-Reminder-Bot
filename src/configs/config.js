const TIME_CONFIG = {
  DAY_REGEX: /^(sun|mon|t(ues|hurs)|((T|t)(ues|hurs))|fri|sat|wed(\.|nesday)|Wed(\.|nesday)|Sat(\.|urday)|sat(\.|urday)|t((ue?)|(hu?r?))\.?|T((ue?)|(hu?r?))\.?)$|^next\s*week/i,
  TIME_REGEX: /(\d{1,2}):(\d{2})\s?(am|pm)/i,
  TWENTY_MINUTES: 20 * 60 * 1000,
  ONE_HOUR: 1 * 60 * 1000,
  NEXT_WEEK_REGEX: /^next\s*week/i,
  TOMORROW_REGEX: /^tomorrow/i,
};

export {
  TIME_CONFIG
};
