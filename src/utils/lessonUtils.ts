import { supabase } from '../lib/supabase';
import {
  findApplicableTemplate,
  findMatchingTemplateBlock,
  getDefaultLessonDuration,
} from './templateUtils';

interface Lesson {
  id: string;
  group_id: string;
  school_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function roundDownToHour(date: Date): Date {
  const rounded = new Date(date);
  rounded.setMinutes(0);
  rounded.setSeconds(0);
  rounded.setMilliseconds(0);
  return rounded;
}

function getDayOfWeek(date: Date): number {
  return date.getDay();
}

function combineDateAndTime(date: Date, timeStr: string): Date {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  const combined = new Date(date);
  combined.setHours(hours, minutes || 0, seconds || 0, 0);
  return combined;
}

export async function findExistingLesson(
  groupId: string,
  timestamp: Date
): Promise<Lesson | null> {
  const startOfDay = new Date(timestamp);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(timestamp);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const startOfDayStr = startOfDay.toISOString();
  const endOfDayStr = endOfDay.toISOString();

  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('group_id', groupId)
    .gte('start_time', startOfDayStr)
    .lte('start_time', endOfDayStr)
    .order('start_time', { ascending: false })
    .limit(1);

  if (lessons && lessons.length > 0) {
    return lessons[0] as Lesson;
  }

  return null;
}

export async function findOrCreateLesson(
  timestamp: Date,
  groupId: string,
  schoolId: string,
  userId: string,
  activityName?: string
): Promise<Lesson> {
  const existingLesson = await findExistingLesson(groupId, timestamp);
  if (existingLesson) {
    return existingLesson;
  }

  const templateId = await findApplicableTemplate(groupId, schoolId, timestamp);

  let startTime: Date;
  let endTime: Date;
  let title: string;
  let description: string;

  if (templateId) {
    const dayOfWeek = getDayOfWeek(timestamp);
    const templateBlock = await findMatchingTemplateBlock(templateId, dayOfWeek, timestamp);

    if (templateBlock) {
      startTime = combineDateAndTime(timestamp, templateBlock.start_time);
      endTime = combineDateAndTime(timestamp, templateBlock.end_time);

      if (templateBlock.subject && templateBlock.subject.title) {
        title = templateBlock.subject.title;
      } else if (templateBlock.title) {
        title = templateBlock.title;
      } else {
        title = activityName || 'Les';
      }

      description = `Les volgens rooster${templateBlock.description ? ': ' + templateBlock.description : ''}`;
    } else {
      const defaultDuration = await getDefaultLessonDuration(schoolId);
      startTime = roundDownToHour(timestamp);
      endTime = new Date(startTime.getTime() + defaultDuration * 60000);
      title = activityName || 'Les';
      description = 'Les aangemaakt (geen rooster beschikbaar)';
    }
  } else {
    const defaultDuration = await getDefaultLessonDuration(schoolId);
    startTime = roundDownToHour(timestamp);
    endTime = new Date(startTime.getTime() + defaultDuration * 60000);
    title = activityName || 'Les';
    description = 'Les aangemaakt (geen rooster gevonden)';
  }

  const { data: newLesson, error } = await supabase
    .from('lessons')
    .insert({
      group_id: groupId,
      school_id: schoolId,
      title,
      description,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ [LessonUtils] Error creating lesson:', error);
    throw error;
  }

  return newLesson as Lesson;
}
