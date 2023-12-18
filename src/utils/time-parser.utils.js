import * as chrono from 'chrono-node';
import { parse, addDays, startOfDay, startOfWeek, addWeeks } from 'date-fns';
import { ActionRowBuilder,StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';

import { TIME_CONFIG } from "../configs/config.js";
import cron from "node-cron";

export function parseClosingTimeInput(input) {
  if (!input) {
    return 0;
  }

  const currentTime = new Date();
  const istTimeZone = 'Asia/Kolkata'; // Indian Standard Time (IST) time zone

  const parsedTime = chrono.parseDate(input);

  if (parsedTime) {
    const timeDifferenceInSeconds = Math.max(0, parsedTime.getTime() - currentTime.getTime()) / 1000;
    return timeDifferenceInSeconds;
  }

  const timeMatch = input.match(TIME_CONFIG.TIME_REGEX);
  const dayMatch = input.match(TIME_CONFIG.DAY_REGEX);
  const nextWeekMatch = input.match(TIME_CONFIG.NEXT_WEEK_REGEX);
  const tomorrowMatch = input.match(TIME_CONFIG.TOMORROW_REGEX);

  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3]?.toLowerCase(); 

    if (period === 'pm' && hours !== 12) {
      // return nothing
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }

    const closingTime = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), hours, minutes, 0);
    
    // Use date-fns-tz to convert closingTime to IST
    const closingTimeIST = addDays(closingTime, 0, { timeZone: istTimeZone });

    const timeDifferenceInSeconds = Math.max(0, closingTimeIST - currentTime) / 1000;

    return timeDifferenceInSeconds;
  } else if (dayMatch) {
    const dayIndex = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(dayMatch[1]?.toLowerCase());
    const targetDay = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), dayIndex);
    const targetDayIST = addDays(targetDay, 0, { timeZone: istTimeZone });

    const timeDifferenceInSeconds = Math.max(0, targetDayIST - currentTime) / 1000;

    return timeDifferenceInSeconds;
  } else if (nextWeekMatch) {
    const nextWeekStart = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
    const nextWeekStartIST = addDays(nextWeekStart, 0, { timeZone: istTimeZone });

    const timeDifferenceInSeconds = Math.max(0, nextWeekStartIST - currentTime) / 1000;

    return timeDifferenceInSeconds;
  } else if (tomorrowMatch) {
    const tomorrowStart = startOfDay(addDays(new Date(), 1));
    const tomorrowStartIST = addDays(tomorrowStart, 0, { timeZone: istTimeZone });

    const timeDifferenceInSeconds = Math.max(0, tomorrowStartIST - currentTime) / 1000;

    return timeDifferenceInSeconds;
  }

  return 0;
}

