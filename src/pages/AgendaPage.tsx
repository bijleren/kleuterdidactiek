import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/AppLayout';
import { trackFeatureUsage } from '../utils/onboardingTracker';
import { Calendar, Plus, CreditCard as Edit, Copy, Trash2, Clock, ChevronLeft, ChevronRight, BookOpen, Gamepad2, PenTool, Activity, Video, FileText, Target, Search, X, ExternalLink, ChevronDown, ChevronUp, Check, Grid2x2 as Grid, Clipboard, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import WeekCalendarView from '../components/WeekCalendarView';
import { extractGoalCodesFromLessonItems } from '../utils/lessonGoalExtractor';

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
  items?: LessonItem[];
}

interface LessonItem {
  id: string;
  lesson_id: string;
  item_type: 'vocabulary' | 'vocabulary_word' | 'quiz' | 'writing' | 'physical_task' | 'video' | 'material' | 'activity_preset' | 'goal';
  item_id: string;
  item_name: string;
  sort_order: number;
  notes: string | null;
  duration_minutes: number | null;
  created_at: string;
}

interface LessonFormData {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  items: Omit<LessonItem, 'id' | 'lesson_id' | 'created_at'>[];
}

interface AvailableItem {
  id: string;
  name: string;
  type: string;
}

interface GoalInfo {
  code: string;
  description: string;
}

interface GoalWithStatus extends GoalInfo {
  isFromActivity: boolean;
  isManuallyAdded: boolean;
}

interface DayTemplateBlock {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  block_type: string;
  title: string;
  subject_id: string | null;
  subject?: {
    title: string;
    icon: string;
    color: string;
  };
}

const itemTypeIcons = {
  vocabulary: BookOpen,
  vocabulary_word: BookOpen,
  quiz: Gamepad2,
  writing: PenTool,
  physical_task: Activity,
  video: Video,
  material: FileText,
  activity_preset: Grid,
  goal: Target,
};

const itemTypeColors = {
  vocabulary: 'bg-coral-pink',
  vocabulary_word: 'bg-pink-400',
  quiz: 'bg-sky-blue',
  writing: 'bg-lavender',
  physical_task: 'bg-grass-green',
  video: 'bg-purple-500',
  material: 'bg-yellow-500',
  activity_preset: 'bg-lavender',
  goal: 'bg-blue-600',
};

const itemTypeLabels = {
  vocabulary: 'Woordenschat',
  vocabulary_word: 'Woordenschat Woord',
  quiz: 'Quiz',
  writing: 'Schrijven',
  physical_task: 'Doe-opdracht',
  video: 'Video',
  material: 'Materiaal',
  activity_preset: 'Activiteiten',
  goal: 'Doel',
};

export default function AgendaPage() {
  const { selectedGroupId, selectedSchool } = useSchool();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [selectedItemType, setSelectedItemType] = useState<LessonItem['item_type'] | null>(null);
  const [templateBlocks, setTemplateBlocks] = useState<DayTemplateBlock[]>([]);
  const [lessonGoals, setLessonGoals] = useState<GoalInfo[]>([]);
  const [selectedLessonGoals, setSelectedLessonGoals] = useState<GoalInfo[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [loadingSelectedLessonGoals, setLoadingSelectedLessonGoals] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [allGoals, setAllGoals] = useState<GoalInfo[]>([]);
  const [goalSearchQuery, setGoalSearchQuery] = useState('');
  const [showVocabPicker, setShowVocabPicker] = useState(false);
  const [vocabCategories, setVocabCategories] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ hour: number; lessons: Lesson[] } | null>(null);
  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    items: [],
  });
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState(() => {
    const s = getStartOfWeek(new Date());
    return s.toISOString().split('T')[0];
  });
  const [exportDateTo, setExportDateTo] = useState(() => {
    const s = getStartOfWeek(new Date());
    const e = new Date(s);
    e.setDate(e.getDate() + 6);
    return e.toISOString().split('T')[0];
  });
  const [exporting, setExporting] = useState(false);

  const selectedSchoolId = selectedSchool?.id || null;

  const getItemNavigationPath = (item: LessonItem) => {
    switch (item.item_type) {
      case 'vocabulary':
      case 'vocabulary_word':
        return '/kleuterdoelen';
      case 'quiz':
        return '/kleuterdoelen';
      case 'writing':
        return '/kleuterdoelen';
      case 'physical_task':
        return '/kleuterdoelen';
      case 'video':
        return '/videos';
      case 'material':
        return '/materials';
      case 'activity_preset':
        return '/kleuterdoelen';
      case 'goal':
        return '/kleuterdoelen';
      default:
        return '/';
    }
  };

  const navigateToItem = (item: LessonItem) => {
    const path = getItemNavigationPath(item);
    navigate(path);
  };

  function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getEndOfWeek(startDate: Date): Date {
    const end = new Date(startDate);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  useEffect(() => {
    if (selectedGroupId && selectedSchoolId) {
      loadTemplateBlocks();
    }
  }, [selectedGroupId, selectedSchoolId]);

  useEffect(() => {
    if (selectedGroupId && selectedSchoolId) {
      loadLessons();
      if (user) {
        trackFeatureUsage(selectedGroupId, user.id, 'agenda_viewed');
      }
    }
  }, [selectedGroupId, selectedSchoolId, currentWeekStart, user]);

  useEffect(() => {
    loadAllGoals();
    loadVocabularyCategories();
  }, []);

  useEffect(() => {
    loadLessonGoals(formData.items);
  }, [formData.items]);

  const loadTemplateBlocks = async () => {
    if (!selectedGroupId || !selectedSchoolId) return;

    try {
      const dateStr = new Date().toISOString().split('T')[0];

      const { data: groupTemplate } = await supabase
        .from('group_day_templates')
        .select('template_id')
        .eq('group_id', selectedGroupId)
        .eq('is_default', true)
        .lte('effective_from', dateStr)
        .or(`effective_until.is.null,effective_until.gte.${dateStr}`)
        .maybeSingle();

      let templateId = groupTemplate?.template_id;

      if (!templateId) {
        const { data: schoolTemplate } = await supabase
          .from('school_day_templates')
          .select('template_id')
          .eq('school_id', selectedSchoolId)
          .eq('is_default', true)
          .lte('effective_from', dateStr)
          .or(`effective_until.is.null,effective_until.gte.${dateStr}`)
          .maybeSingle();

        templateId = schoolTemplate?.template_id;
      }

      if (templateId) {
        const { data: blocks } = await supabase
          .from('day_template_blocks')
          .select(`
            *,
            subject:school_subjects(title, icon, color)
          `)
          .eq('template_id', templateId)
          .eq('is_active', true)
          .order('day_of_week')
          .order('sort_order');

        setTemplateBlocks(blocks || []);
      } else {
        setTemplateBlocks([]);
      }
    } catch (error) {
      console.error('Error loading template blocks:', error);
      setTemplateBlocks([]);
    }
  };

  const loadLessons = async () => {
    if (!selectedGroupId || !selectedSchoolId) return;

    setLoading(true);
    try {
      const weekEnd = getEndOfWeek(currentWeekStart);
      const startTime = currentWeekStart.toISOString();
      const endTime = weekEnd.toISOString();

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('group_id', selectedGroupId)
        .gte('start_time', startTime)
        .lte('start_time', endTime)
        .order('start_time');

      if (lessonsError) throw lessonsError;

      const lessonIds = lessonsData?.map(l => l.id) || [];

      if (lessonIds.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('lesson_items')
          .select('*')
          .in('lesson_id', lessonIds)
          .order('sort_order');

        if (itemsError) throw itemsError;

        const itemsMap = new Map<string, LessonItem[]>();
        itemsData?.forEach((item) => {
          if (!itemsMap.has(item.lesson_id)) {
            itemsMap.set(item.lesson_id, []);
          }
          itemsMap.get(item.lesson_id)!.push(item);
        });

        const enrichedLessons = lessonsData?.map(lesson => ({
          ...lesson,
          items: itemsMap.get(lesson.id) || [],
        })) || [];

        setLessons(enrichedLessons);
      } else {
        setLessons([]);
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGoalsForItems = async (items: LessonItem[]) => {
    const goalCodesSet = new Set<string>();

    for (const item of items) {
      switch (item.item_type) {
        case 'vocabulary': {
          const { data } = await supabase
            .from('vocabulary_categories')
            .select('goal_codes')
            .eq('id', item.item_id)
            .single();

          if (data?.goal_codes) {
            (data.goal_codes as string[]).forEach(code => goalCodesSet.add(code));
          }
          break;
        }

        case 'vocabulary_word': {
          // Try UUID lookup first; fall back to word-text match for legacy items
          let categoryId: string | null = null;

          const { data: wordByUuid } = await supabase
            .from('vocabulary_words')
            .select('category_id')
            .eq('id', item.item_id)
            .maybeSingle();

          if (wordByUuid?.category_id) {
            categoryId = wordByUuid.category_id;
          } else {
            const wordText = item.item_name.replace(/^Woordenschat:\s*/i, '').trim();
            const { data: wordByText } = await supabase
              .from('vocabulary_words')
              .select('category_id')
              .eq('word', wordText)
              .maybeSingle();
            if (wordByText?.category_id) categoryId = wordByText.category_id;
          }

          if (categoryId) {
            const { data: catData } = await supabase
              .from('vocabulary_categories')
              .select('goal_codes')
              .eq('id', categoryId)
              .single();

            if (catData?.goal_codes) {
              (catData.goal_codes as string[]).forEach(code => goalCodesSet.add(code));
            }
          }
          break;
        }

        case 'video': {
          const { data } = await supabase
            .from('educational_video_goals')
            .select('goal_code')
            .eq('video_id', item.item_id);

          data?.forEach(g => goalCodesSet.add(g.goal_code));
          break;
        }

        case 'material': {
          const { data } = await supabase
            .from('educational_material_goals')
            .select('goal_code')
            .eq('material_id', item.item_id);

          data?.forEach(g => goalCodesSet.add(g.goal_code));
          break;
        }

        case 'quiz': {
          const { data: gameData } = await supabase
            .from('learning_games')
            .select('goal_codes')
            .eq('id', item.item_id)
            .maybeSingle();

          if (gameData?.goal_codes) {
            (gameData.goal_codes as string[]).forEach(code => goalCodesSet.add(code));
          }
          break;
        }

        case 'activity_preset': {
          const { data: presetData } = await supabase
            .from('activity_presets')
            .select('goal_codes')
            .eq('id', item.item_id)
            .maybeSingle();

          if (presetData?.goal_codes) {
            (presetData.goal_codes as string[]).forEach(code => goalCodesSet.add(code));
          }
          break;
        }

        case 'goal': {
          goalCodesSet.add(item.item_id);
          break;
        }
      }
    }

    if (goalCodesSet.size > 0) {
      const { data: goalsData } = await supabase
        .from('educational_goals')
        .select('code, description')
        .in('code', Array.from(goalCodesSet))
        .order('code');

      return goalsData || [];
    }

    return [];
  };

  const loadLessonGoals = async (items: typeof formData.items) => {
    if (items.length === 0) {
      setLessonGoals([]);
      return;
    }

    setLoadingGoals(true);
    try {
      const goals = await loadGoalsForItems(items);
      setLessonGoals(goals);
    } catch (error) {
      console.error('Error loading lesson goals:', error);
      setLessonGoals([]);
    } finally {
      setLoadingGoals(false);
    }
  };

  const loadSelectedLessonGoals = async (lesson: Lesson) => {
    if (!lesson.items || lesson.items.length === 0) {
      setSelectedLessonGoals([]);
      return;
    }

    setLoadingSelectedLessonGoals(true);
    try {
      const goals = await loadGoalsForItems(lesson.items);
      setSelectedLessonGoals(goals);
    } catch (error) {
      console.error('Error loading selected lesson goals:', error);
      setSelectedLessonGoals([]);
    } finally {
      setLoadingSelectedLessonGoals(false);
    }
  };

  const loadAllGoals = async () => {
    try {
      const { data: goalsData } = await supabase
        .from('educational_goals')
        .select('code, description')
        .order('code');

      setAllGoals(goalsData || []);
    } catch (error) {
      console.error('Error loading all goals:', error);
    }
  };

  const getGoalsWithStatus = (): GoalWithStatus[] => {
    const manualGoalCodes = new Set(
      formData.items
        .filter(item => item.item_type === 'goal')
        .map(item => item.item_id)
    );

    const activityGoalCodes = new Set(
      lessonGoals.map(g => g.code)
    );

    return allGoals.map(goal => ({
      ...goal,
      isFromActivity: activityGoalCodes.has(goal.code) && !manualGoalCodes.has(goal.code),
      isManuallyAdded: manualGoalCodes.has(goal.code),
    }));
  };

  const addGoalToLesson = (goal: GoalInfo) => {
    const alreadyAdded = formData.items.some(
      item => item.item_type === 'goal' && item.item_id === goal.code
    );

    if (!alreadyAdded) {
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            item_type: 'goal',
            item_id: goal.code,
            item_name: `${goal.code} - ${goal.description}`,
            sort_order: formData.items.length,
            notes: null,
            duration_minutes: null,
          },
        ],
      });
    }
  };

  const removeGoalFromLesson = (goalCode: string) => {
    setFormData({
      ...formData,
      items: formData.items
        .filter(item => !(item.item_type === 'goal' && item.item_id === goalCode))
        .map((item, index) => ({ ...item, sort_order: index })),
    });
  };

  const loadVocabularyCategories = async () => {
    try {
      const { data: categories } = await supabase
        .from('vocabulary_categories')
        .select('id, name')
        .order('name');

      if (!categories) return;

      const categoriesWithWords = await Promise.all(
        categories.map(async (category) => {
          const { data: words } = await supabase
            .from('vocabulary_words')
            .select('id, word')
            .eq('category_id', category.id)
            .order('word');

          return {
            ...category,
            words: words || [],
          };
        })
      );

      setVocabCategories(categoriesWithWords);
    } catch (error) {
      console.error('Error loading vocabulary:', error);
    }
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const addVocabularyCategory = (category: any) => {
    const categoryItem = {
      item_type: 'vocabulary' as const,
      item_id: category.id,
      item_name: category.name,
      sort_order: formData.items.length,
      notes: null,
      duration_minutes: null,
    };

    setFormData({
      ...formData,
      items: [...formData.items, categoryItem],
    });
  };

  const addVocabularyWord = (word: any, categoryName: string) => {
    const alreadyAdded = formData.items.some(
      item => item.item_type === 'vocabulary_word' && item.item_id === word.id
    );

    if (!alreadyAdded) {
      const wordItem = {
        item_type: 'vocabulary_word' as const,
        item_id: word.id,
        item_name: `${word.word} (${categoryName})`,
        sort_order: formData.items.length,
        notes: null,
        duration_minutes: null,
      };

      setFormData({
        ...formData,
        items: [...formData.items, wordItem],
      });
    }
  };

  const addAllWordsFromCategory = (category: any) => {
    const newWords = category.words
      .filter((word: any) =>
        !formData.items.some(
          item => item.item_type === 'vocabulary_word' && item.item_id === word.id
        )
      )
      .map((word: any, index: number) => ({
        item_type: 'vocabulary_word' as const,
        item_id: word.id,
        item_name: `${word.word} (${category.name})`,
        sort_order: formData.items.length + index,
        notes: null,
        duration_minutes: null,
      }));

    if (newWords.length > 0) {
      setFormData({
        ...formData,
        items: [...formData.items, ...newWords],
      });
    }
  };

  const isWordSelected = (wordId: string) => {
    return formData.items.some(
      item => item.item_type === 'vocabulary_word' && item.item_id === wordId
    );
  };

  const isCategorySelected = (categoryId: string) => {
    return formData.items.some(
      item => item.item_type === 'vocabulary' && item.item_id === categoryId
    );
  };

  const loadAvailableItems = async (type: LessonItem['item_type']) => {
    if (!selectedSchoolId) return;

    try {
      let items: AvailableItem[] = [];

      switch (type) {
        case 'vocabulary':
          const { data: vocabData } = await supabase
            .from('vocabulary_categories')
            .select('id, name')
            .order('name');
          items = vocabData?.map(c => ({ id: c.id, name: c.name, type: 'vocabulary' })) || [];
          break;

        case 'vocabulary_word':
          const { data: wordsData } = await supabase
            .from('vocabulary_words')
            .select('id, word, vocabulary_categories(name)')
            .order('word');
          items = wordsData?.map(w => ({
            id: w.id,
            name: `${w.word} (${(w.vocabulary_categories as any)?.name || 'Onbekend'})`,
            type: 'vocabulary_word'
          })) || [];
          break;

        case 'quiz':
          const { data: quizData } = await supabase
            .from('learning_games')
            .select('id, name')
            .order('name');
          items = quizData?.map(q => ({ id: q.id, name: q.name, type: 'quiz' })) || [];
          break;

        case 'video':
          const { data: videoData } = await supabase
            .from('educational_videos')
            .select('id, title')
            .or(`is_global.eq.true,school_id.eq.${selectedSchoolId}`)
            .order('title');
          items = videoData?.map(v => ({ id: v.id, name: v.title, type: 'video' })) || [];
          break;

        case 'material':
          const { data: materialData } = await supabase
            .from('educational_materials')
            .select('id, title')
            .or(`is_global.eq.true,school_id.eq.${selectedSchoolId}`)
            .order('title');
          items = materialData?.map(m => ({ id: m.id, name: m.title, type: 'material' })) || [];
          break;

        case 'goal':
          const { data: goalData } = await supabase
            .from('educational_goals')
            .select('code, description')
            .order('code');
          items = goalData?.map(g => ({ id: g.code, name: `${g.code} - ${g.description}`, type: 'goal' })) || [];
          break;

        case 'writing':
          const { data: writingData } = await supabase
            .from('writing_exercises')
            .select('id, title')
            .order('title');
          items = writingData?.map(w => ({ id: w.id, name: w.title, type: 'writing' })) || [];
          break;

        case 'physical_task':
          const { data: physicalData } = await supabase
            .from('physical_tasks')
            .select('id, title, description')
            .order('title');
          items = physicalData?.map(p => ({
            id: p.id,
            name: p.description ? `${p.title} - ${p.description.substring(0, 50)}...` : p.title,
            type: 'physical_task'
          })) || [];
          break;

        case 'activity_preset':
          const { data: presetData } = await supabase
            .from('activity_presets')
            .select('id, name, description')
            .or(`school_id.is.null,school_id.eq.${selectedSchoolId}`)
            .order('name');
          items = presetData?.map(p => ({
            id: p.id,
            name: p.description ? `${p.name} - ${p.description.substring(0, 50)}...` : p.name,
            type: 'activity_preset'
          })) || [];
          break;
      }

      setAvailableItems(items);
    } catch (error) {
      console.error('Error loading available items:', error);
    }
  };

  const openCreateModal = (date?: Date, hour?: number, templateBlock?: DayTemplateBlock) => {
    setEditingLesson(null);
    const startTime = date ? new Date(date) : new Date();

    if (templateBlock) {
      const [startHour, startMin] = templateBlock.start_time.split(':').map(Number);
      const [endHour, endMin] = templateBlock.end_time.split(':').map(Number);

      startTime.setHours(startHour, startMin, 0, 0);
      const endTime = new Date(startTime);
      endTime.setHours(endHour, endMin, 0, 0);

      setFormData({
        title: templateBlock.subject?.title || templateBlock.title,
        description: '',
        start_time: startTime.toISOString().slice(0, 16),
        end_time: endTime.toISOString().slice(0, 16),
        items: [],
      });
    } else if (hour !== undefined) {
      startTime.setHours(hour, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1, 0, 0, 0);

      setFormData({
        title: '',
        description: '',
        start_time: startTime.toISOString().slice(0, 16),
        end_time: endTime.toISOString().slice(0, 16),
        items: [],
      });
    } else {
      startTime.setHours(9, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1, 0, 0, 0);

      setFormData({
        title: '',
        description: '',
        start_time: startTime.toISOString().slice(0, 16),
        end_time: endTime.toISOString().slice(0, 16),
        items: [],
      });
    }

    setShowModal(true);
  };

  const openEditModal = (lesson: Lesson) => {
    setEditingLesson(lesson);
    const items = lesson.items?.map((item, index) => ({
      item_type: item.item_type,
      item_id: item.item_id,
      item_name: item.item_name,
      sort_order: index,
      notes: item.notes,
      duration_minutes: item.duration_minutes,
    })) || [];

    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      start_time: new Date(lesson.start_time).toISOString().slice(0, 16),
      end_time: new Date(lesson.end_time).toISOString().slice(0, 16),
      items,
    });

    loadLessonGoals(items);
    setShowModal(true);
  };

  const openItemPicker = (type: LessonItem['item_type']) => {
    setSelectedItemType(type);
    setItemSearchQuery('');
    loadAvailableItems(type);
    setShowItemPicker(true);
  };

  const selectItem = (item: AvailableItem) => {
    if (!selectedItemType) return;

    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          item_type: selectedItemType,
          item_id: item.id,
          item_name: item.name,
          sort_order: formData.items.length,
          notes: null,
          duration_minutes: null,
        },
      ],
    });

    setShowItemPicker(false);
    setSelectedItemType(null);
  };

  const handleCopyLesson = async (lesson: Lesson) => {
    if (!selectedGroupId || !selectedSchoolId) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const startTime = new Date(lesson.start_time);
      startTime.setDate(startTime.getDate() + 7);
      const endTime = new Date(lesson.end_time);
      endTime.setDate(endTime.getDate() + 7);

      const { data: newLesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          group_id: selectedGroupId,
          school_id: selectedSchoolId,
          title: `${lesson.title} (kopie)`,
          description: lesson.description,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (lessonError) throw lessonError;

      if (lesson.items && lesson.items.length > 0) {
        const itemsToInsert = lesson.items.map((item, index) => ({
          lesson_id: newLesson.id,
          item_type: item.item_type,
          item_id: item.item_id,
          item_name: item.item_name,
          sort_order: index,
          notes: item.notes,
          duration_minutes: item.duration_minutes,
        }));

        const { error: itemsError } = await supabase
          .from('lesson_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        const goalCodes = await extractGoalCodesFromLessonItems(lesson.items);

        if (goalCodes.length > 0) {
          const lessonGoalsToInsert = goalCodes.map(goalCode => ({
            lesson_id: newLesson.id,
            goal_code: goalCode,
            lesson_start_time: startTime.toISOString(),
            group_id: selectedGroupId,
          }));

          const { error: insertGoalsError } = await supabase
            .from('lesson_goals')
            .insert(lessonGoalsToInsert);

          if (insertGoalsError) throw insertGoalsError;
        }
      }

      await loadLessons();
    } catch (error) {
      console.error('Error copying lesson:', error);
      alert('Er is een fout opgetreden bij het kopiëren van de les');
    }
  };

  const handleDeleteLesson = (lessonId: string) => {
    setLessonToDelete(lessonId);
    setShowDeleteModal(true);
  };

  const confirmDeleteLesson = async () => {
    if (!lessonToDelete) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonToDelete);

      if (error) throw error;
      await loadLessons();
      setShowDeleteModal(false);
      setLessonToDelete(null);
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Er is een fout opgetreden bij het verwijderen van de les');
    }
  };

  const handleExportLesson = async (lesson: Lesson) => {
    if (!lesson.items || lesson.items.length === 0) {
      alert('Deze les heeft geen items om te exporteren');
      return;
    }

    const itemsByCategory: Record<string, LessonItem[]> = {};
    lesson.items.forEach(item => {
      const categoryLabel = itemTypeLabels[item.item_type];
      if (!itemsByCategory[categoryLabel]) {
        itemsByCategory[categoryLabel] = [];
      }
      itemsByCategory[categoryLabel].push(item);
    });

    let exportText = `${lesson.title}\n`;
    exportText += `${new Date(lesson.start_time).toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}\n`;
    exportText += `${new Date(lesson.start_time).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    })} - ${new Date(lesson.end_time).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    })}\n`;

    if (lesson.description) {
      exportText += `\n${lesson.description}\n`;
    }

    exportText += '\n';

    Object.entries(itemsByCategory).forEach(([category, items]) => {
      exportText += `\n${category.toUpperCase()}\n`;
      exportText += '='.repeat(category.length) + '\n\n';

      items.forEach((item, index) => {
        exportText += `${index + 1}. ${item.item_name}\n`;
        if (item.duration_minutes) {
          exportText += `   Duur: ${item.duration_minutes} minuten\n`;
        }
        if (item.notes) {
          exportText += `   Notities: ${item.notes}\n`;
        }
        exportText += '\n';
      });
    });

    if (selectedLessonGoals.length > 0) {
      exportText += '\nDOELEN\n';
      exportText += '======\n\n';
      selectedLessonGoals.forEach((goal, index) => {
        exportText += `${index + 1}. ${goal.code}\n`;
        exportText += `   ${goal.description}\n\n`;
      });
    }

    try {
      await navigator.clipboard.writeText(exportText);
      setShowCopiedNotification(true);
      setTimeout(() => setShowCopiedNotification(false), 3000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Er is een fout opgetreden bij het kopiëren naar klembord');
    }
  };

  const handleExportRange = async () => {
    // xlsx is ~284 kB: pas laden wanneer iemand echt exporteert,
    // niet bij het opstarten van de app.
    const XLSX = await import('xlsx');
    if (!selectedGroupId || !selectedSchoolId) return;

    setExporting(true);
    try {
      const from = new Date(exportDateFrom + 'T00:00:00');
      const to = new Date(exportDateTo + 'T23:59:59');

      const { data: lessonsData, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('group_id', selectedGroupId)
        .gte('start_time', from.toISOString())
        .lte('start_time', to.toISOString())
        .order('start_time');

      if (error) throw error;

      const lessonIds = lessonsData?.map(l => l.id) || [];
      let itemsMap = new Map<string, LessonItem[]>();
      let goalsMap = new Map<string, string[]>();

      if (lessonIds.length > 0) {
        const { data: itemsData } = await supabase
          .from('lesson_items')
          .select('*')
          .in('lesson_id', lessonIds)
          .order('sort_order');

        itemsData?.forEach(item => {
          if (!itemsMap.has(item.lesson_id)) itemsMap.set(item.lesson_id, []);
          itemsMap.get(item.lesson_id)!.push(item);
        });

        const { data: lessonGoalsData } = await supabase
          .from('lesson_goals')
          .select('lesson_id, goal_code, educational_goals(code, description)')
          .in('lesson_id', lessonIds);

        lessonGoalsData?.forEach((lg: any) => {
          if (!goalsMap.has(lg.lesson_id)) goalsMap.set(lg.lesson_id, []);
          const label = lg.educational_goals
            ? `${lg.educational_goals.code} - ${lg.educational_goals.description}`
            : lg.goal_code;
          goalsMap.get(lg.lesson_id)!.push(label);
        });
      }

      const rows: Record<string, string>[] = [];

      for (const lesson of lessonsData || []) {
        const items = itemsMap.get(lesson.id) || [];
        const goals = goalsMap.get(lesson.id) || [];
        const startDt = new Date(lesson.start_time);
        const endDt = new Date(lesson.end_time);

        // Build content cell grouped by type — same logic as the copy function
        const itemsByCategory: Record<string, LessonItem[]> = {};
        items.forEach(item => {
          const label = itemTypeLabels[item.item_type] || item.item_type;
          if (!itemsByCategory[label]) itemsByCategory[label] = [];
          itemsByCategory[label].push(item);
        });

        const contentLines: string[] = [];
        if (lesson.description) contentLines.push(lesson.description, '');
        Object.entries(itemsByCategory).forEach(([category, catItems]) => {
          contentLines.push(category.toUpperCase());
          catItems.forEach((item, idx) => {
            let line = `${idx + 1}. ${item.item_name}`;
            if (item.duration_minutes) line += ` (${item.duration_minutes} min)`;
            contentLines.push(line);
            if (item.notes) contentLines.push(`   ${item.notes}`);
          });
          contentLines.push('');
        });

        rows.push({
          Datum: startDt.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          Starttijd: startDt.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
          Eindtijd: endDt.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
          Titel: lesson.title,
          Inhoud: contentLines.join('\n').trim(),
          Doelen: goals.join('\n'),
        });
      }

      if (rows.length === 0) {
        alert('Geen lessen gevonden in de geselecteerde periode');
        return;
      }

      const ws = XLSX.utils.json_to_sheet(rows);
      // Enable text wrapping for Inhoud (col E) and Doelen (col F)
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let r = 1; r <= range.e.r; r++) {
        ['E', 'F'].forEach(col => {
          const cell = ws[`${col}${r + 1}`];
          if (cell) cell.s = { alignment: { wrapText: true, vertical: 'top' } };
        });
      }
      ws['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 10 }, { wch: 30 }, { wch: 50 }, { wch: 40 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Lessen');

      const fileName = `agenda_${exportDateFrom}_${exportDateTo}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setShowExportModal(false);
    } catch (err) {
      console.error('Export error:', err);
      alert('Er is een fout opgetreden bij het exporteren');
    } finally {
      setExporting(false);
    }
  };

  const handleSaveLesson = async () => {
    if (!formData.title.trim() || !selectedGroupId || !selectedSchoolId) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      let lessonId: string;
      let lessonStartTime: string;

      if (editingLesson) {
        const { error: updateError } = await supabase
          .from('lessons')
          .update({
            title: formData.title,
            description: formData.description || null,
            start_time: formData.start_time,
            end_time: formData.end_time,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingLesson.id);

        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .from('lesson_items')
          .delete()
          .eq('lesson_id', editingLesson.id);

        if (deleteError) throw deleteError;

        if (formData.items.length > 0) {
          const itemsToInsert = formData.items.map((item) => ({
            lesson_id: editingLesson.id,
            ...item,
          }));

          const { error: itemsError } = await supabase
            .from('lesson_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }

        lessonId = editingLesson.id;
        lessonStartTime = formData.start_time;
      } else {
        const { data: newLesson, error: lessonError } = await supabase
          .from('lessons')
          .insert({
            group_id: selectedGroupId,
            school_id: selectedSchoolId,
            title: formData.title,
            description: formData.description || null,
            start_time: formData.start_time,
            end_time: formData.end_time,
            created_by: userData.user.id,
          })
          .select()
          .single();

        if (lessonError) throw lessonError;

        if (formData.items.length > 0) {
          const itemsToInsert = formData.items.map((item) => ({
            lesson_id: newLesson.id,
            ...item,
          }));

          const { error: itemsError } = await supabase
            .from('lesson_items')
            .insert(itemsToInsert);

          if (itemsError) throw itemsError;
        }

        lessonId = newLesson.id;
        lessonStartTime = formData.start_time;
      }

      const goalCodes = await extractGoalCodesFromLessonItems(formData.items);

      const { error: deleteGoalsError } = await supabase
        .from('lesson_goals')
        .delete()
        .eq('lesson_id', lessonId);

      if (deleteGoalsError) throw deleteGoalsError;

      if (goalCodes.length > 0) {
        const lessonGoalsToInsert = goalCodes.map(goalCode => ({
          lesson_id: lessonId,
          goal_code: goalCode,
          lesson_start_time: lessonStartTime,
          group_id: selectedGroupId,
        }));

        const { error: insertGoalsError } = await supabase
          .from('lesson_goals')
          .insert(lessonGoalsToInsert);

        if (insertGoalsError) throw insertGoalsError;
      }

      await loadLessons();
      setShowModal(false);
      setEditingLesson(null);
    } catch (error: any) {
      console.error('Error saving lesson:', error);
      console.error('Error details:', error?.message, error?.details, error?.hint);
      alert(`Er is een fout opgetreden bij het opslaan van de les: ${error?.message || 'Onbekende fout'}`);
    }
  };

  const removeItemFromLesson = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index).map((item, i) => ({
        ...item,
        sort_order: i,
      })),
    });
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...formData.items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newItems.length) return;

    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];

    setFormData({
      ...formData,
      items: newItems.map((item, i) => ({ ...item, sort_order: i })),
    });
  };

  const suggestTimeSlot = (dayOfWeek: number, startTime?: string) => {
    const blocks = templateBlocks.filter(b => b.day_of_week === dayOfWeek && b.block_type === 'lesson');

    if (blocks.length > 0) {
      let block = blocks[0];

      if (startTime) {
        const matchingBlock = blocks.find(b => b.start_time === startTime);
        if (matchingBlock) {
          block = matchingBlock;
        }
      }

      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + dayOfWeek - 1);

      const [startHour, startMin] = block.start_time.split(':').map(Number);
      const [endHour, endMin] = block.end_time.split(':').map(Number);

      date.setHours(startHour, startMin, 0, 0);
      const startTimeStr = date.toISOString().slice(0, 16);

      date.setHours(endHour, endMin, 0, 0);
      const endTimeStr = date.toISOString().slice(0, 16);

      setFormData({
        ...formData,
        start_time: startTimeStr,
        end_time: endTimeStr,
      });
    }
  };

  const previousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const nextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToToday = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  };

  const getLessonsForDay = (dayOffset: number) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    return lessons.filter(lesson => {
      const lessonDate = new Date(lesson.start_time).toISOString().split('T')[0];
      return lessonDate === dateStr;
    }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  };


  const filteredAvailableItems = availableItems.filter(item =>
    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  if (!selectedGroupId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-white rounded-3xl p-8 shadow-xl text-center max-w-md">
            <Calendar className="w-16 h-16 text-deep-purple mx-auto mb-4" />
            <h2 className="text-2xl font-baloo text-deep-purple mb-2">
              Geen groep geselecteerd
            </h2>
            <p className="text-gray-600">
              Selecteer eerst een groep om de agenda te bekijken.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-baloo text-deep-purple flex items-center gap-3">
                <Calendar className="w-8 h-8" />
                Agenda
              </h1>
              <p className="text-gray-600 mt-1">Plan en organiseer je lessen</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowExportModal(true)}
                type="button"
                className="px-5 py-3 bg-white border-2 border-deep-purple text-deep-purple rounded-full font-baloo hover:bg-deep-purple hover:text-white transition-colors flex items-center gap-2 shadow-sm"
              >
                <Download className="w-5 h-5" />
                Exporteren
              </button>
              <button
                onClick={() => openCreateModal()}
                type="button"
                className="px-6 py-3 bg-gradient-to-r from-deep-purple to-lavender text-white rounded-full font-baloo hover:scale-105 transition-transform flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Nieuwe Les
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={previousWeek}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-deep-purple" />
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-sky-blue text-white rounded-full font-semibold hover:scale-105 transition-transform"
              >
                Vandaag
              </button>
              <div className="text-xl font-baloo text-deep-purple">
                {currentWeekStart.toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                })}
                {' - '}
                {getEndOfWeek(currentWeekStart).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
            <button
              onClick={nextWeek}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-deep-purple" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-deep-purple"></div>
            </div>
          ) : (
            <WeekCalendarView
              currentWeekStart={currentWeekStart}
              lessons={lessons}
              templateBlocks={templateBlocks}
              onLessonClick={(lesson) => {
                setSelectedLesson(lesson);
                loadSelectedLessonGoals(lesson);
                setShowDetailModal(true);
              }}
              onSlotClick={(date, time, templateBlock) => {
                const [hours, minutes] = time.split(':');
                openCreateModal(date, parseInt(hours), templateBlock);
              }}
              itemTypeIcons={itemTypeIcons}
              itemTypeColors={itemTypeColors}
            />
          )}
        </div>
      </div>

      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedLesson(null);
          setSelectedLessonGoals([]);
        }}
        title={selectedLesson?.title || ''}
      >
        {selectedLesson && (
          <div className="space-y-6">
            <div className="flex items-start justify-between pb-4 border-b">
              <div className="flex-1">
                {selectedLesson.description && (
                  <p className="text-gray-600 mb-3">{selectedLesson.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(selectedLesson.start_time).toLocaleDateString('nl-NL', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(selectedLesson.start_time).toLocaleTimeString('nl-NL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' - '}
                    {new Date(selectedLesson.end_time).toLocaleTimeString('nl-NL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportLesson(selectedLesson);
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="Exporteren"
                >
                  <Clipboard className="w-5 h-5 text-green-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(selectedLesson);
                    setShowDetailModal(false);
                    setSelectedLessonGoals([]);
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="Bewerken"
                >
                  <Edit className="w-5 h-5 text-deep-purple" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyLesson(selectedLesson);
                    setShowDetailModal(false);
                    setSelectedLessonGoals([]);
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="Kopiëren"
                >
                  <Copy className="w-5 h-5 text-sky-blue" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLesson(selectedLesson.id);
                    setShowDetailModal(false);
                    setSelectedLessonGoals([]);
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="Verwijderen"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </button>
              </div>
            </div>

            {selectedLesson.items && selectedLesson.items.length > 0 ? (
              <>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Lesonderdelen</h4>
                  <div className="space-y-2">
                    {selectedLesson.items.map((item, index) => {
                      const Icon = itemTypeIcons[item.item_type];
                      return (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-3 bg-cream rounded-xl"
                        >
                          <div className={`w-10 h-10 rounded-full ${itemTypeColors[item.item_type]} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900">{item.item_name}</div>
                            <div className="text-sm text-gray-600">{itemTypeLabels[item.item_type]}</div>
                            {item.duration_minutes && (
                              <div className="text-xs text-gray-500 mt-1">
                                {item.duration_minutes} minuten
                              </div>
                            )}
                            {item.notes && (
                              <div className="text-sm text-gray-600 mt-1 italic">{item.notes}</div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <button
                              onClick={() => navigateToItem(item)}
                              className="p-1 rounded-full hover:bg-blue-100 transition-colors text-blue-600"
                              title="Ga naar item"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <div className="text-xs font-semibold text-gray-400">
                              #{index + 1}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">Doelen</h4>
                    <div className="text-sm text-gray-600">
                      {selectedLessonGoals.length} {selectedLessonGoals.length === 1 ? 'doel' : 'doelen'}
                    </div>
                  </div>

                  {loadingSelectedLessonGoals ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-deep-purple"></div>
                    </div>
                  ) : selectedLessonGoals.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto space-y-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-3">
                      {selectedLessonGoals.map((goal, index) => (
                        <div
                          key={goal.code}
                          className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <Target className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-blue-900">{goal.code}</div>
                            <div className="text-xs text-gray-600">{goal.description}</div>
                          </div>
                          <div className="text-xs font-semibold text-gray-400">
                            #{index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-gray-500 bg-gray-50 rounded-lg">
                      Geen doelen gekoppeld aan de geselecteerde items
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Geen lesonderdelen toegevoegd
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingLesson(null);
        }}
        title={editingLesson ? 'Les bewerken' : 'Nieuwe les'}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titel *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent"
                placeholder="Titel van de les"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschrijving
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent resize-none"
                placeholder="Beschrijving van de les"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start tijd *
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eind tijd *
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Lesonderdelen</h4>
              <div className="text-sm text-gray-600">
                {formData.items.length} {formData.items.length === 1 ? 'item' : 'items'}
              </div>
            </div>

            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {formData.items.map((item, index) => {
                const Icon = itemTypeIcons[item.item_type];
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-cream rounded-xl"
                  >
                    <div className={`w-8 h-8 rounded-full ${itemTypeColors[item.item_type]} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.item_name}</div>
                      <div className="text-xs text-gray-500">{itemTypeLabels[item.item_type]}</div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigateToItem(item)}
                        className="p-1 rounded hover:bg-blue-100 transition-colors text-blue-600"
                        title="Ga naar item"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-white transition-colors disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === formData.items.length - 1}
                        className="p-1 rounded hover:bg-white transition-colors disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeItemFromLesson(index)}
                        className="p-1 rounded hover:bg-red-100 transition-colors text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowVocabPicker(true)}
                className="px-3 py-2 bg-coral-pink text-white rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Woordenschat
              </button>
              <button
                onClick={() => openItemPicker('quiz')}
                className="px-3 py-2 bg-sky-blue text-white rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2"
              >
                <Gamepad2 className="w-4 h-4" />
                Quiz
              </button>
              <button
                onClick={() => openItemPicker('writing')}
                className="px-3 py-2 bg-lavender text-white rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2"
              >
                <PenTool className="w-4 h-4" />
                Schrijven
              </button>
              <button
                onClick={() => openItemPicker('physical_task')}
                className="px-3 py-2 bg-grass-green text-white rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2"
              >
                <Activity className="w-4 h-4" />
                Doe-opdracht
              </button>
              <button
                onClick={() => openItemPicker('video')}
                className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                Video
              </button>
              <button
                onClick={() => openItemPicker('material')}
                className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Materiaal
              </button>
              <button
                onClick={() => openItemPicker('activity_preset')}
                className="px-3 py-2 bg-gradient-to-r from-coral-pink to-sky-blue text-white rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center justify-center gap-2"
              >
                <Grid className="w-4 h-4" />
                Activiteiten
              </button>
            </div>
          </div>

          {formData.items.length > 0 && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Doelen</h4>
                <div className="text-sm text-gray-600">
                  {lessonGoals.length} {lessonGoals.length === 1 ? 'doel' : 'doelen'}
                </div>
              </div>

              {loadingGoals ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-deep-purple"></div>
                </div>
              ) : lessonGoals.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-3">
                  {lessonGoals.map((goal, index) => (
                    <div
                      key={goal.code}
                      className="flex items-start gap-3 p-2 bg-white rounded-lg shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-blue-900">{goal.code}</div>
                        <div className="text-xs text-gray-600">{goal.description}</div>
                      </div>
                      <div className="text-xs font-semibold text-gray-400">
                        #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-gray-500 bg-gray-50 rounded-lg">
                  Geen doelen gekoppeld aan de geselecteerde items
                </div>
              )}

              <button
                onClick={() => setShowGoalPicker(true)}
                className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Extra doel toevoegen
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => {
                setShowModal(false);
                setEditingLesson(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={handleSaveLesson}
              disabled={!formData.title.trim() || !formData.start_time || !formData.end_time}
              className="flex-1 px-4 py-2 bg-deep-purple text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingLesson ? 'Bijwerken' : 'Aanmaken'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showItemPicker}
        onClose={() => {
          setShowItemPicker(false);
          setSelectedItemType(null);
        }}
        title={`Kies ${selectedItemType ? itemTypeLabels[selectedItemType] : 'item'}`}
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Zoeken..."
              value={itemSearchQuery}
              onChange={(e) => setItemSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredAvailableItems.map((item) => (
              <button
                key={item.id}
                onClick={() => selectItem(item)}
                className="w-full text-left p-3 bg-cream rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">{item.name}</div>
              </button>
            ))}
          </div>

          {filteredAvailableItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Geen items gevonden
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showGoalPicker}
        onClose={() => {
          setShowGoalPicker(false);
          setGoalSearchQuery('');
        }}
        title="Extra doel toevoegen"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Zoek doel..."
              value={goalSearchQuery}
              onChange={(e) => setGoalSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {getGoalsWithStatus()
              .filter(goal =>
                goalSearchQuery === '' ||
                goal.code.toLowerCase().includes(goalSearchQuery.toLowerCase()) ||
                goal.description.toLowerCase().includes(goalSearchQuery.toLowerCase())
              )
              .map((goal) => (
                <div
                  key={goal.code}
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                    goal.isManuallyAdded
                      ? 'bg-green-100 border-2 border-green-500'
                      : goal.isFromActivity
                      ? 'bg-blue-50 border-2 border-blue-300'
                      : 'bg-cream hover:bg-gray-100 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!goal.isManuallyAdded && !goal.isFromActivity) {
                      addGoalToLesson(goal);
                    }
                  }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    goal.isManuallyAdded
                      ? 'bg-green-600'
                      : goal.isFromActivity
                      ? 'bg-blue-400'
                      : 'bg-blue-600'
                  }`}>
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm ${
                      goal.isManuallyAdded || goal.isFromActivity ? 'text-gray-900' : 'text-blue-900'
                    }`}>
                      {goal.code}
                    </div>
                    <div className="text-xs text-gray-600">{goal.description}</div>
                    {goal.isFromActivity && (
                      <div className="text-xs text-blue-600 mt-1">Gekoppeld aan activiteit</div>
                    )}
                    {goal.isManuallyAdded && (
                      <div className="text-xs text-green-600 mt-1">Handmatig toegevoegd</div>
                    )}
                  </div>
                  {goal.isManuallyAdded && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeGoalFromLesson(goal.code);
                      }}
                      className="p-1 rounded hover:bg-red-100 transition-colors text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => {
                setShowGoalPicker(false);
                setGoalSearchQuery('');
              }}
              className="flex-1 px-4 py-2 bg-deep-purple text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Sluiten
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showVocabPicker}
        onClose={() => {
          setShowVocabPicker(false);
          setExpandedCategories(new Set());
        }}
        title="Woordenschat toevoegen"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Klik op een categorie om alle woorden toe te voegen, of klik op individuele woorden
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {vocabCategories.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const isCatSelected = isCategorySelected(category.id);

              return (
                <div key={category.id} className="border rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 bg-cream p-3">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="p-1 hover:bg-white rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex-1 font-semibold text-gray-900">
                      {category.name}
                      <span className="ml-2 text-xs text-gray-500">
                        ({category.words.length} {category.words.length === 1 ? 'woord' : 'woorden'})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addAllWordsFromCategory(category)}
                        className="px-3 py-1 bg-coral-pink text-white rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Alle woorden
                      </button>
                      <button
                        onClick={() => addVocabularyCategory(category)}
                        className={`px-3 py-1 rounded-lg transition-opacity text-sm flex items-center gap-1 ${
                          isCatSelected
                            ? 'bg-green-600 text-white'
                            : 'bg-pink-400 text-white hover:opacity-90'
                        }`}
                        disabled={isCatSelected}
                      >
                        {isCatSelected ? (
                          <>
                            <Check className="w-3 h-3" />
                            Toegevoegd
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            Categorie
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-white p-2 space-y-1">
                      {category.words.map((word: any) => {
                        const isSelected = isWordSelected(word.id);

                        return (
                          <button
                            key={word.id}
                            onClick={() => addVocabularyWord(word, category.name)}
                            disabled={isSelected}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                              isSelected
                                ? 'bg-green-50 border border-green-500 cursor-not-allowed'
                                : 'hover:bg-gray-50 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex-1 text-sm text-gray-900">{word.word}</div>
                              {isSelected && (
                                <div className="flex items-center gap-1 text-xs text-green-600">
                                  <Check className="w-3 h-3" />
                                  Geselecteerd
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => {
                setShowVocabPicker(false);
                setExpandedCategories(new Set());
              }}
              className="flex-1 px-4 py-2 bg-deep-purple text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Sluiten
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showTimeSlotModal}
        onClose={() => {
          setShowTimeSlotModal(false);
          setSelectedTimeSlot(null);
        }}
        title={selectedTimeSlot ? `${selectedTimeSlot.hour.toString().padStart(2, '0')}:00 - Alle lessen` : 'Lessen'}
      >
        {selectedTimeSlot && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {selectedTimeSlot.lessons.length} {selectedTimeSlot.lessons.length === 1 ? 'les' : 'lessen'} om {selectedTimeSlot.hour.toString().padStart(2, '0')}:00
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {selectedTimeSlot.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-cream rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-baloo text-lg text-deep-purple">{lesson.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(lesson.start_time).toLocaleTimeString('nl-NL', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' - '}
                          {new Date(lesson.end_time).toLocaleTimeString('nl-NL', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowTimeSlotModal(false);
                          viewLessonDetails(lesson);
                        }}
                        className="p-2 text-deep-purple hover:bg-white rounded-lg transition-colors"
                        title="Bekijk details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setShowTimeSlotModal(false);
                          openEditModal(lesson);
                        }}
                        className="p-2 text-sky-blue hover:bg-white rounded-lg transition-colors"
                        title="Bewerk les"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {lesson.description && (
                    <p className="text-sm text-gray-600 mb-3">{lesson.description}</p>
                  )}

                  {lesson.items && lesson.items.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">Lesonderdelen</h4>
                      <div className="flex flex-wrap gap-2">
                        {lesson.items.map((item, idx) => {
                          const Icon = itemTypeIcons[item.item_type];
                          return (
                            <div
                              key={idx}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg ${itemTypeColors[item.item_type]} text-white text-xs`}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{item.item_name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setShowTimeSlotModal(false);
                  setSelectedTimeSlot(null);
                }}
                className="flex-1 px-4 py-2 bg-deep-purple text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Sluiten
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setLessonToDelete(null);
        }}
        title="Les verwijderen"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Weet je zeker dat je deze les wilt verwijderen? Deze actie kan niet ongedaan gemaakt worden.
          </p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setLessonToDelete(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={confirmDeleteLesson}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Verwijderen
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Exporteren naar Excel"
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Kies een datumbereik. Elke les wordt één rij in het Excel-bestand, met de inhoud van de lesblokken in aparte kolommen.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Van</label>
              <input
                type="date"
                value={exportDateFrom}
                onChange={(e) => setExportDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tot en met</label>
              <input
                type="date"
                value={exportDateTo}
                min={exportDateFrom}
                onChange={(e) => setExportDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-cream rounded-xl p-4 text-sm text-gray-700 space-y-1">
            <p className="font-semibold text-gray-800 mb-2">Kolommen in het exportbestand:</p>
            <p>Datum &bull; Starttijd &bull; Eindtijd &bull; Titel &bull; Inhoud &bull; Doelen</p>
            <p className="text-xs text-gray-500 mt-1">Eén rij per les. Inhoud bevat alle lesonderdelen gegroepeerd per type. Doelen staan elk op een aparte regel.</p>
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <button
              onClick={() => setShowExportModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={handleExportRange}
              disabled={exporting || !exportDateFrom || !exportDateTo}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-deep-purple to-lavender text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {exporting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exporting ? 'Exporteren...' : 'Download Excel'}
            </button>
          </div>
        </div>
      </Modal>

      {showCopiedNotification && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in z-50">
          <Check className="w-5 h-5" />
          <span className="font-semibold">Gekopieerd naar klembord!</span>
        </div>
      )}
    </AppLayout>
  );
}
