import { supabase } from '../lib/supabase';

interface LessonItem {
  item_type: 'vocabulary' | 'vocabulary_word' | 'quiz' | 'writing' | 'physical_task' | 'video' | 'material' | 'activity_preset' | 'goal';
  item_id: string;
}

export async function extractGoalCodesFromLessonItems(lessonItems: LessonItem[]): Promise<string[]> {
  const goalCodes = new Set<string>();

  for (const item of lessonItems) {
    if (item.item_type === 'goal') {
      goalCodes.add(item.item_id);
      continue;
    }

    if (item.item_type === 'vocabulary') {
      const { data } = await supabase
        .from('vocabulary_categories')
        .select('goal_codes')
        .eq('id', item.item_id)
        .maybeSingle();

      if (data?.goal_codes) {
        const codes = Array.isArray(data.goal_codes) ? data.goal_codes : [data.goal_codes];
        codes.forEach(code => goalCodes.add(code));
      }
      continue;
    }

    if (item.item_type === 'vocabulary_word') {
      const { data: wordData } = await supabase
        .from('vocabulary_words')
        .select('category_id')
        .eq('id', item.item_id)
        .maybeSingle();

      if (wordData?.category_id) {
        const { data: catData } = await supabase
          .from('vocabulary_categories')
          .select('goal_codes')
          .eq('id', wordData.category_id)
          .maybeSingle();

        if (catData?.goal_codes) {
          const codes = Array.isArray(catData.goal_codes) ? catData.goal_codes : [catData.goal_codes];
          codes.forEach(code => goalCodes.add(code));
        }
      }
      continue;
    }

    if (item.item_type === 'quiz') {
      const { data } = await supabase
        .from('learning_games')
        .select('goal_codes')
        .eq('id', item.item_id)
        .maybeSingle();

      if (data?.goal_codes) {
        const codes = Array.isArray(data.goal_codes) ? data.goal_codes : [];
        codes.forEach(code => goalCodes.add(code));
      }
      continue;
    }

    if (item.item_type === 'writing') {
      const { data } = await supabase
        .from('writing_exercises')
        .select('goal_codes')
        .eq('id', item.item_id)
        .maybeSingle();

      if (data?.goal_codes) {
        const codes = Array.isArray(data.goal_codes) ? data.goal_codes : [];
        codes.forEach(code => goalCodes.add(code));
      }
      continue;
    }

    if (item.item_type === 'physical_task') {
      const { data } = await supabase
        .from('physical_tasks')
        .select('goal_codes')
        .eq('id', item.item_id)
        .maybeSingle();

      if (data?.goal_codes) {
        const codes = Array.isArray(data.goal_codes) ? data.goal_codes : [];
        codes.forEach(code => goalCodes.add(code));
      }
      continue;
    }

    if (item.item_type === 'video') {
      const { data } = await supabase
        .from('educational_video_goals')
        .select('goal_code')
        .eq('video_id', item.item_id);

      if (data) {
        data.forEach(row => goalCodes.add(row.goal_code));
      }
      continue;
    }

    if (item.item_type === 'material') {
      const { data } = await supabase
        .from('educational_material_goals')
        .select('goal_code')
        .eq('material_id', item.item_id);

      if (data) {
        data.forEach(row => goalCodes.add(row.goal_code));
      }
      continue;
    }

    if (item.item_type === 'activity_preset') {
      const { data } = await supabase
        .from('activity_presets')
        .select('goal_codes')
        .eq('id', item.item_id)
        .maybeSingle();

      if (data?.goal_codes) {
        const codes = Array.isArray(data.goal_codes) ? data.goal_codes : [];
        codes.forEach(code => goalCodes.add(code));
      }
      continue;
    }
  }

  return Array.from(goalCodes).filter(code => code && code.trim() !== '');
}
