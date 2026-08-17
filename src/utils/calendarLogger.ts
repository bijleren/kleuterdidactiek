import { supabase } from '../lib/supabase';
import { findOrCreateLesson } from './lessonUtils';

interface LogActivityParams {
  itemType: 'vocabulary' | 'vocabulary_word' | 'quiz' | 'writing' | 'physical_task' | 'video' | 'material' | 'activity_preset';
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

    return { success: true };
  } catch (error) {
    console.error('Error logging activity to calendar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
