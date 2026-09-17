import { supabase } from '../lib/supabase';
import { toLocalDateString } from './dateUtils';

interface TemplateBlock {
  id: string;
  template_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  block_type: 'lesson' | 'break' | 'lunch' | 'other';
  title: string;
  subject_id: string | null;
  description: string | null;
  sort_order: number;
  subject?: {
    title: string;
    icon: string;
    color: string;
  };
}

interface Template {
  id: string;
  name: string;
  description: string | null;
}

export async function findApplicableTemplate(
  groupId: string,
  schoolId: string,
  timestamp: Date
): Promise<string | null> {
  const dateStr = toLocalDateString(timestamp);

  const { data: groupTemplate } = await supabase
    .from('group_day_templates')
    .select('template_id')
    .eq('group_id', groupId)
    .eq('is_default', true)
    .lte('effective_from', dateStr)
    .or(`effective_until.is.null,effective_until.gte.${dateStr}`)
    .maybeSingle();

  if (groupTemplate) {
    return groupTemplate.template_id;
  }

  const { data: schoolTemplate } = await supabase
    .from('school_day_templates')
    .select('template_id')
    .eq('school_id', schoolId)
    .eq('is_default', true)
    .lte('effective_from', dateStr)
    .or(`effective_until.is.null,effective_until.gte.${dateStr}`)
    .maybeSingle();

  if (schoolTemplate) {
    return schoolTemplate.template_id;
  }

  return null;
}

export async function findMatchingTemplateBlock(
  templateId: string,
  dayOfWeek: number,
  time: Date
): Promise<TemplateBlock | null> {
  const timeStr = time.toTimeString().split(' ')[0];

  const { data: blocks } = await supabase
    .from('day_template_blocks')
    .select(`
      *,
      subject:school_subjects(title, icon, color)
    `)
    .eq('template_id', templateId)
    .eq('day_of_week', dayOfWeek)
    .eq('block_type', 'lesson')
    .eq('is_active', true)
    .lte('start_time', timeStr)
    .gte('end_time', timeStr);

  if (!blocks || blocks.length === 0) {
    return null;
  }

  return blocks[0] as TemplateBlock;
}

export async function getDefaultLessonDuration(schoolId: string): Promise<number> {
  const { data: settings } = await supabase
    .from('school_lesson_settings')
    .select('main_block_duration')
    .eq('school_id', schoolId)
    .maybeSingle();

  return settings?.main_block_duration || 30;
}
