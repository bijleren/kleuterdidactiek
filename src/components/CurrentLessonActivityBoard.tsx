import { useState, useEffect } from 'react';
import DoelChips from './DoelChips';
import { Clock, Calendar, Palette, BookOpen, Blocks, Hammer, Scissors, Home, Wrench, Building2, Puzzle, Drama, Rainbow, Music, Paintbrush } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getActivityIcon } from '../lib/activityIcons';

interface ActivityPreset {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  max_students: number | null;
  goal_codes: string[];
}

interface CurrentLesson {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
}

interface CurrentLessonActivityBoardProps {
  groupId: string;
  schoolId: string;
}

export default function CurrentLessonActivityBoard({ groupId, schoolId }: CurrentLessonActivityBoardProps) {
  const [currentLesson, setCurrentLesson] = useState<CurrentLesson | null>(null);
  const [activityPresets, setActivityPresets] = useState<ActivityPreset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentLesson();
    const interval = setInterval(loadCurrentLesson, 60000);
    return () => clearInterval(interval);
  }, [groupId]);

  const loadCurrentLesson = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();

      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('id, title, description, start_time, end_time')
        .eq('group_id', groupId)
        .lte('start_time', now)
        .gte('end_time', now)
        .maybeSingle();

      if (lessonError) throw lessonError;

      if (!lessonData) {
        setCurrentLesson(null);
        setActivityPresets([]);
        setLoading(false);
        return;
      }

      setCurrentLesson(lessonData);

      const { data: lessonItems, error: itemsError } = await supabase
        .from('lesson_items')
        .select('item_id')
        .eq('lesson_id', lessonData.id)
        .eq('item_type', 'activity_preset')
        .order('sort_order');

      if (itemsError) throw itemsError;

      if (!lessonItems || lessonItems.length === 0) {
        setActivityPresets([]);
        setLoading(false);
        return;
      }

      const presetIds = lessonItems.map(item => item.item_id);

      const { data: presetsData, error: presetsError } = await supabase
        .from('activity_presets')
        .select('*')
        .in('id', presetIds);

      if (presetsError) throw presetsError;

      setActivityPresets(presetsData || []);
    } catch (error) {
      console.error('Error loading current lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = (iconName: string, className: string = '') => {
    const iconMap: Record<string, any> = {
      Palette,
      BookOpen,
      Blocks,
      Hammer,
      Scissors,
      Home,
      Wrench,
      Building2,
      Puzzle,
      Drama,
      Rainbow,
      Music,
      Paintbrush,
    };

    const IconComponent = iconMap[iconName] || getActivityIcon(iconName) || Palette;
    return <IconComponent className={className} />;
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-xl">
        <div className="text-center py-8">
          <div className="text-lg font-baloo text-deep-purple">Laden...</div>
        </div>
      </div>
    );
  }

  if (!currentLesson) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-7 h-7 text-sky-blue" />
          <h2 className="text-2xl font-baloo text-deep-purple">Huidige Les</h2>
        </div>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">Geen actieve les op dit moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-7 h-7 text-sky-blue" />
          <div>
            <h2 className="text-2xl font-baloo text-deep-purple">{currentLesson.title}</h2>
            <p className="text-sm text-gray-600">
              {formatTime(currentLesson.start_time)} - {formatTime(currentLesson.end_time)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-grass-green/10 text-grass-green px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-grass-green rounded-full animate-pulse" />
          <span className="text-sm font-semibold">ACTIEF</span>
        </div>
      </div>

      {currentLesson.description && (
        <p className="text-gray-700 mb-6 pb-6 border-b border-gray-200">
          {currentLesson.description}
        </p>
      )}

      {activityPresets.length === 0 ? (
        <div className="text-center py-8">
          <Palette className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">Geen hoekenwerk in deze les</p>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-baloo text-deep-purple mb-4">
            Hoekenwerk ({activityPresets.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activityPresets.map((preset) => (
              <div
                key={preset.id}
                className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div
                  className="relative h-24 flex items-center justify-center"
                  style={{ backgroundColor: preset.color }}
                >
                  <div className="text-white text-4xl">
                    {renderIcon(preset.icon, 'w-12 h-12 text-white')}
                  </div>
                </div>

                <div className="p-4">
                  <h4 className="font-baloo text-lg text-deep-purple mb-2">{preset.name}</h4>

                  {preset.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{preset.description}</p>
                  )}

                  {preset.goal_codes && preset.goal_codes.length > 0 && (
                    <div className="mb-2">
                      <DoelChips codes={preset.goal_codes} max={3} klein />
                    </div>
                  )}

                  {preset.max_students && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <span>Max {preset.max_students} leerlingen</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
