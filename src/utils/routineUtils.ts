import { supabase } from '../lib/supabase';

interface GroupRoutine {
  id: string;
  routine_id: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  frequency: 'weekly' | 'bi_weekly';
  week_alternation: number;
  day_of_week: number[];
  template_block_ids: string[];
  routine: {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    category: string;
    goal_codes: string[];
  };
}

interface RoutineInstance {
  routine_id: string;
  routine_title: string;
  routine_description: string;
  routine_icon: string;
  routine_color: string;
  routine_category: string;
  goal_codes: string[];
  date: string;
  day_of_week: number;
  template_block_ids: string[];
  group_routine_id: string;
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function shouldRoutineOccur(
  routine: GroupRoutine,
  date: Date
): boolean {
  const dateStr = date.toISOString().split('T')[0];

  if (dateStr < routine.start_date) {
    return false;
  }

  if (routine.end_date && dateStr > routine.end_date) {
    return false;
  }

  const dayOfWeek = date.getDay();
  if (!routine.day_of_week.includes(dayOfWeek)) {
    return false;
  }

  if (routine.frequency === 'bi_weekly') {
    const weekNum = getWeekNumber(date);
    const weekMod = weekNum % 2;
    if (weekMod !== routine.week_alternation) {
      return false;
    }
  }

  return true;
}

export function generateRoutineInstances(
  routines: GroupRoutine[],
  startDate: Date,
  endDate: Date
): RoutineInstance[] {
  const instances: RoutineInstance[] = [];

  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (currentDate <= end) {
    for (const routine of routines) {
      if (!routine.is_active) continue;

      if (shouldRoutineOccur(routine, currentDate)) {
        instances.push({
          routine_id: routine.routine_id,
          routine_title: routine.routine.title,
          routine_description: routine.routine.description,
          routine_icon: routine.routine.icon,
          routine_color: routine.routine.color,
          routine_category: routine.routine.category,
          goal_codes: routine.routine.goal_codes,
          date: currentDate.toISOString().split('T')[0],
          day_of_week: currentDate.getDay(),
          template_block_ids: routine.template_block_ids,
          group_routine_id: routine.id,
        });
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return instances;
}

export async function loadActiveGroupRoutines(
  groupId: string
): Promise<GroupRoutine[]> {
  try {
    const { data, error } = await supabase
      .from('group_routines')
      .select(`
        *,
        routine:routines (
          id,
          title,
          description,
          icon,
          color,
          category,
          goal_codes
        )
      `)
      .eq('group_id', groupId)
      .eq('is_active', true);

    if (error) throw error;

    return (data || []) as unknown as GroupRoutine[];
  } catch (error) {
    console.error('Error loading active group routines:', error);
    return [];
  }
}

export function getRoutineInstancesForDate(
  instances: RoutineInstance[],
  date: string
): RoutineInstance[] {
  return instances.filter(instance => instance.date === date);
}

export function getRoutineInstancesForBlock(
  instances: RoutineInstance[],
  date: string,
  blockId: string
): RoutineInstance[] {
  return instances.filter(
    instance =>
      instance.date === date &&
      (instance.template_block_ids.length === 0 || instance.template_block_ids.includes(blockId))
  );
}
