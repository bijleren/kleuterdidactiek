import { supabase } from '../lib/supabase';

export const trackFeatureUsage = async (
  groupId: string,
  userId: string,
  feature: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('group_onboarding_progress')
      .upsert(
        {
          group_id: groupId,
          user_id: userId,
          feature,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: 'group_id,user_id,feature',
          ignoreDuplicates: true,
        }
      );

    if (error && error.code !== '23505') {
      console.error('Error tracking feature usage:', error);
    }
  } catch (error) {
    console.error('Error tracking feature usage:', error);
  }
};
