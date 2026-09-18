import { supabase } from '../lib/supabase';
import { findOrCreateLesson } from './lessonUtils';
import { extractGoalCodesFromLessonItems } from './lessonGoalExtractor';

interface LogActivityParams {
  itemType: 'vocabulary' | 'vocabulary_word' | 'quiz' | 'writing' | 'physical_task' | 'video' | 'material' | 'activity_preset' | 'thema';
  itemId: string;
  itemName: string;
  groupId: string;
  schoolId: string;
  userId: string;
  durationMinutes?: number;
}

export async function logActivityToCalendar({
  itemType,
  itemId,
  itemName,
  groupId,
  schoolId,
  userId,
  durationMinutes = 30,
}: LogActivityParams): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date();

    const lesson = await findOrCreateLesson(now, groupId, schoolId, userId, itemName);

    const { data: existingItems } = await supabase
      .from('lesson_items')
      .select('item_id, sort_order')
      .eq('lesson_id', lesson.id);

    const isDuplicate = existingItems?.some(
      (item) => item.item_id === itemId
    );

    if (isDuplicate) {
      return { success: true };
    }

    const maxSortOrder = existingItems && existingItems.length > 0
      ? Math.max(...existingItems.map((item) => item.sort_order))
      : -1;

    const { error: itemError } = await supabase
      .from('lesson_items')
      .insert({
        lesson_id: lesson.id,
        item_type: itemType,
        item_id: itemId,
        item_name: itemName,
        sort_order: maxSortOrder + 1,
        duration_minutes: durationMinutes,
      });

    if (itemError) throw itemError;

    /*
      Ook de doelen van dit onderdeel bij de les bewaren. Zonder dit bleef
      lesson_goals leeg bij elke les die door een klik ontstaat, en ontbrak
      die les in de lessen per doel. Een fout hier mag het loggen niet
      tegenhouden: het onderdeel staat al in de planner.
    */
    try {
      const codes = await extractGoalCodesFromLessonItems([
        { item_type: itemType, item_id: itemId, item_name: itemName },
      ]);
      if (codes.length > 0) {
        const { data: bestaand } = await supabase
          .from('lesson_goals')
          .select('goal_code')
          .eq('lesson_id', lesson.id);
        const alBewaard = new Set(
          ((bestaand ?? []) as unknown as { goal_code: string }[]).map((g) => g.goal_code)
        );
        const nieuw = codes.filter((c) => !alBewaard.has(c));
        if (nieuw.length > 0) {
          await supabase.from('lesson_goals').insert(
            nieuw.map((goal_code) => ({
              lesson_id: lesson.id,
              goal_code,
              lesson_start_time: lesson.start_time,
              group_id: groupId,
            })) as never
          );
        }
      }
    } catch (doelFout) {
      console.error('Lesdoelen bewaren mislukt:', doelFout);
    }

    return { success: true };
  } catch (error) {
    console.error('Error logging activity to calendar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
