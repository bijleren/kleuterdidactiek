import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Plus, CreditCard as Edit, Trash2, X, Clock, Calendar, Check, Copy, Palette, BookOpen, Blocks, Hammer, Scissors, Home, Wrench, Building2, Puzzle, Drama, Rainbow, Music, Paintbrush, LayoutGrid as Layout, Users, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSchool } from '../contexts/SchoolContext';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import * as LucideIcons from 'lucide-react';
import { logActivityToCalendar } from '../utils/calendarLogger';
import { uploadHoekenIcon } from '../utils/iconUpload';

interface ActivityPresetsManagerProps {
  groupId: string;
  schoolId: string;
  goalFilter?: string;
}

interface ActivityPreset {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  max_students: number | null;
  is_default: boolean;
  school_id: string | null;
  goal_codes: string[];
  custom_icon_id: string | null;
  custom_icon_url?: string | null;
}

interface Goal {
  code: string;
  description: string;
  domain: number;
}

export default function ActivityPresetsManager({ groupId, schoolId, goalFilter }: ActivityPresetsManagerProps) {
  const { user } = useAuth();
  const { selectedSchool } = useSchool();
  const navigate = useNavigate();
  const [presets, setPresets] = useState<ActivityPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showMarkDoneModal, setShowMarkDoneModal] = useState<ActivityPreset | null>(null);
  const [showAddToAgendaModal, setShowAddToAgendaModal] = useState<ActivityPreset | null>(null);
  const [showCreateLessonModal, setShowCreateLessonModal] = useState<ActivityPreset | null>(null);
  const [editingPreset, setEditingPreset] = useState<ActivityPreset | null>(null);
  const [allGoals, setAllGoals] = useState<Goal[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activePresetIds, setActivePresetIds] = useState<Set<string>>(new Set());
  const [activeLessonBoard, setActiveLessonBoard] = useState<{ id: string; name: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [studentCounts, setStudentCounts] = useState<Map<string, number>>(new Map());

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Palette',
    color: '#FF8E8E',
    max_students: null as number | null,
    goal_codes: [] as string[],
    custom_icon_id: null as string | null,
    custom_icon_url: null as string | null,
  });

  const [iconUploading, setIconUploading] = useState(false);
  const iconFileInputRef = useRef<HTMLInputElement>(null);

  const [markDoneData, setMarkDoneData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
  });

  const [agendaData, setAgendaData] = useState({
    date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '10:00',
    title: '',
  });

  useEffect(() => {
    loadPresets();
    loadGoals();
    loadActivePresets();
    loadActiveLessonBoard();
    checkAdminStatus();

    const interval = setInterval(() => {
      loadActivePresets();
      loadActiveLessonBoard();
    }, 60000);
    return () => clearInterval(interval);
  }, [groupId, selectedSchool]);

  useEffect(() => {
    if (activeLessonBoard && presets.length > 0) {
      loadStudentCounts();
    }
  }, [activeLessonBoard, presets]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('school_teammembers')
        .select('role')
        .eq('user_id', user.id)
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .maybeSingle();

      setIsAdmin(data?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadPresets = async () => {
    try {
      let query = supabase
        .from('activity_presets')
        .select('*, school_hoekenwerk_icons(public_url)')
        .order('name');

      if (selectedSchool?.id) {
        query = query.or(`school_id.is.null,school_id.eq.${selectedSchool.id}`);
      } else {
        query = query.is('school_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped = (data || []).map((p: any) => ({
        ...p,
        custom_icon_url: p.school_hoekenwerk_icons?.public_url ?? null,
      }));
      setPresets(mapped);
    } catch (error) {
      console.error('Error loading presets:', error);
      setNotification({ message: 'Fout bij laden van hoekenwerk', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('educational_goals')
        .select('code, description, domain')
        .order('code');

      if (error) throw error;
      setAllGoals(data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const loadActivePresets = async () => {
    try {
      const now = new Date().toISOString();

      const { data: currentLessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id')
        .eq('group_id', groupId)
        .lte('start_time', now)
        .gte('end_time', now);

      if (lessonsError) throw lessonsError;

      if (!currentLessons || currentLessons.length === 0) {
        setActivePresetIds(new Set());
        return;
      }

      const lessonIds = currentLessons.map(lesson => lesson.id);

      const { data: lessonItems, error: itemsError } = await supabase
        .from('lesson_items')
        .select('item_id, item_type')
        .in('lesson_id', lessonIds)
        .eq('item_type', 'activity_preset');

      if (itemsError) throw itemsError;

      const activeIds = new Set(lessonItems?.map(item => item.item_id) || []);
      setActivePresetIds(activeIds);
    } catch (error) {
      console.error('Error loading active presets:', error);
    }
  };

  const loadActiveLessonBoard = async () => {
    if (!selectedSchool) return;

    try {
      const now = new Date().toISOString();

      const { data: currentLesson, error: lessonError } = await supabase
        .from('lessons')
        .select('id, title')
        .eq('group_id', groupId)
        .lte('start_time', now)
        .gte('end_time', now)
        .maybeSingle();

      if (lessonError) throw lessonError;

      if (!currentLesson) {
        setActiveLessonBoard(null);
        return;
      }

      const boardName = 'Activiteitenbord huidige les';

      const { data: board, error: boardError } = await supabase
        .from('activity_boards')
        .select('id, name')
        .eq('school_id', selectedSchool.id)
        .eq('name', boardName)
        .eq('is_active', true)
        .maybeSingle();

      if (boardError) throw boardError;

      setActiveLessonBoard(board);
    } catch (error) {
      console.error('Error loading active lesson board:', error);
    }
  };

  const loadStudentCounts = async () => {
    if (!selectedSchool || !activeLessonBoard) return;

    try {
      const { data: activityOptions, error: optionsError } = await supabase
        .from('activity_options')
        .select('id, name')
        .eq('board_id', activeLessonBoard.id)
        .eq('is_active', true);

      if (optionsError) throw optionsError;

      const counts = new Map<string, number>();

      for (const option of activityOptions || []) {
        const { data: sessions, error: sessionsError } = await supabase
          .from('activity_sessions')
          .select('id', { count: 'exact' })
          .eq('activity_option_id', option.id)
          .is('end_time', null);

        if (sessionsError) throw sessionsError;

        const matchingPreset = presets.find(p => p.name === option.name);
        if (matchingPreset) {
          counts.set(matchingPreset.id, sessions?.length || 0);
        }
      }

      setStudentCounts(counts);
    } catch (error) {
      console.error('Error loading student counts:', error);
    }
  };

  const handleCreatePreset = async () => {
    if (!formData.name.trim() || !selectedSchool?.id) return;

    try {
      const { error } = await supabase
        .from('activity_presets')
        .insert({
          name: formData.name,
          description: formData.description || null,
          icon: formData.icon,
          color: formData.color,
          max_students: formData.max_students,
          is_default: false,
          school_id: selectedSchool.id,
          goal_codes: formData.goal_codes,
          custom_icon_id: formData.custom_icon_id || null,
        });

      if (error) throw error;

      setNotification({ message: 'Hoekenwerk toegevoegd!', type: 'success' });
      setShowCreateModal(false);
      resetForm();
      loadPresets();
    } catch (error) {
      console.error('Error creating preset:', error);
      setNotification({ message: 'Fout bij toevoegen hoekenwerk', type: 'error' });
    }
  };

  const handleUpdatePreset = async () => {
    if (!editingPreset || !formData.name.trim()) return;

    try {
      const { error } = await supabase
        .from('activity_presets')
        .update({
          name: formData.name,
          description: formData.description || null,
          icon: formData.icon,
          color: formData.color,
          max_students: formData.max_students,
          goal_codes: formData.goal_codes,
          custom_icon_id: formData.custom_icon_id || null,
        })
        .eq('id', editingPreset.id);

      if (error) throw error;

      setNotification({ message: 'Hoekenwerk bijgewerkt!', type: 'success' });
      setShowEditModal(false);
      setEditingPreset(null);
      resetForm();
      loadPresets();
    } catch (error) {
      console.error('Error updating preset:', error);
      setNotification({ message: 'Fout bij bijwerken hoekenwerk', type: 'error' });
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    try {
      const { error } = await supabase
        .from('activity_presets')
        .delete()
        .eq('id', presetId);

      if (error) throw error;

      setNotification({ message: 'Hoekenwerk verwijderd', type: 'success' });
      setShowDeleteConfirm(null);
      loadPresets();
    } catch (error) {
      console.error('Error deleting preset:', error);
      setNotification({ message: 'Fout bij verwijderen hoekenwerk', type: 'error' });
    }
  };

  const handleDuplicatePreset = (preset: ActivityPreset) => {
    setFormData({
      name: `${preset.name} (kopie)`,
      description: preset.description || '',
      icon: preset.icon,
      color: preset.color,
      max_students: preset.max_students,
      goal_codes: preset.goal_codes || [],
      custom_icon_id: preset.custom_icon_id,
      custom_icon_url: preset.custom_icon_url ?? null,
    });
    setShowCreateModal(true);
  };

  const handleAddToLessonBoard = async (preset: ActivityPreset) => {
    if (!user || !selectedSchool) return;

    try {
      const now = new Date().toISOString();

      const { data: currentLesson, error: lessonError } = await supabase
        .from('lessons')
        .select('id, title')
        .eq('group_id', groupId)
        .lte('start_time', now)
        .gte('end_time', now)
        .maybeSingle();

      if (lessonError) throw lessonError;

      if (!currentLesson) {
        setShowCreateLessonModal(preset);
        return;
      }

      const boardName = 'Activiteitenbord huidige les';

      let boardId: string;
      const { data: existingBoard, error: boardCheckError } = await supabase
        .from('activity_boards')
        .select('id')
        .eq('school_id', selectedSchool.id)
        .eq('name', boardName)
        .eq('is_active', true)
        .maybeSingle();

      if (boardCheckError) throw boardCheckError;

      if (existingBoard) {
        boardId = existingBoard.id;
      } else {
        const { data: newBoard, error: boardCreateError } = await supabase
          .from('activity_boards')
          .insert({
            school_id: selectedSchool.id,
            name: boardName,
            description: 'Activiteitenbord voor de huidige les',
            is_active: true,
            created_by: user.id,
          })
          .select('id')
          .single();

        if (boardCreateError) throw boardCreateError;
        boardId = newBoard.id;
      }

      const { data: existingActivity, error: activityCheckError } = await supabase
        .from('activity_options')
        .select('id')
        .eq('board_id', boardId)
        .eq('name', preset.name)
        .eq('is_active', true)
        .maybeSingle();

      if (activityCheckError) throw activityCheckError;

      if (existingActivity) {
        setNotification({ message: `${preset.name} staat al op het activiteitenbord!`, type: 'error' });
        return;
      }

      const { data: maxOrderResult } = await supabase
        .from('activity_options')
        .select('sort_order')
        .eq('board_id', boardId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = (maxOrderResult?.sort_order ?? -1) + 1;

      const { error: activityError } = await supabase
        .from('activity_options')
        .insert({
          board_id: boardId,
          name: preset.name,
          description: preset.description,
          max_students: preset.max_students,
          color: preset.color,
          icon: preset.icon,
          sort_order: nextOrder,
          is_active: true,
        });

      if (activityError) throw activityError;

      await logActivityToCalendar({
        itemType: 'activity_preset',
        itemId: preset.id,
        itemName: preset.name,
        groupId,
        schoolId,
        userId: user.id,
        durationMinutes: 30,
      });

      if (preset.goal_codes && preset.goal_codes.length > 0) {
        await supabase
          .from('goal_tracking_sessions')
          .insert({
            group_id: groupId,
            goal_codes: preset.goal_codes,
            activity_type: 'activity_preset',
            activity_name: preset.name,
            repetitions: 1,
            created_by: user.id,
            practiced_at: now,
          });
      }

      setNotification({ message: `${preset.name} toegevoegd aan activiteitenbord!`, type: 'success' });
      loadActivePresets();
      loadActiveLessonBoard();
      setTimeout(() => loadStudentCounts(), 500);
    } catch (error) {
      console.error('Error adding to lesson board:', error);
      setNotification({ message: 'Fout bij toevoegen aan activiteitenbord', type: 'error' });
    }
  };

  const handleCreateLessonAndAddPreset = async () => {
    if (!showCreateLessonModal || !user || !selectedSchool) return;

    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + 30 * 60000);

      const { data: newLesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          group_id: groupId,
          school_id: schoolId,
          title: 'Hoekenwerk',
          description: 'Automatisch aangemaakte les voor hoekenwerk',
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          created_by: user.id,
        })
        .select('id, title')
        .single();

      if (lessonError) throw lessonError;

      const { error: itemError } = await supabase
        .from('lesson_items')
        .insert({
          lesson_id: newLesson.id,
          item_type: 'activity_preset',
          item_id: showCreateLessonModal.id,
          item_name: showCreateLessonModal.name,
          sort_order: 0,
        });

      if (itemError) throw itemError;

      setNotification({ message: 'Les van 30 minuten aangemaakt en hoekenwerk toegevoegd!', type: 'success' });
      setShowCreateLessonModal(null);

      loadActivePresets();
      loadActiveLessonBoard();

      setTimeout(() => {
        handleAddToLessonBoard(showCreateLessonModal);
      }, 500);
    } catch (error) {
      console.error('Error creating lesson and adding preset:', error);
      setNotification({ message: 'Fout bij aanmaken les', type: 'error' });
    }
  };

  const handleMarkAsDone = async () => {
    if (!showMarkDoneModal || !user) return;

    try {
      const practiceDateTime = new Date(`${markDoneData.date}T${markDoneData.time}`);

      await logActivityToCalendar({
        itemType: 'activity_preset',
        itemId: showMarkDoneModal.id,
        itemName: showMarkDoneModal.name,
        groupId,
        schoolId,
        userId: user.id,
        durationMinutes: 30,
      });

      if (showMarkDoneModal.goal_codes && showMarkDoneModal.goal_codes.length > 0) {
        const { error } = await supabase
          .from('goal_tracking_sessions')
          .insert({
            group_id: groupId,
            goal_codes: showMarkDoneModal.goal_codes,
            activity_type: 'activity_preset',
            activity_name: showMarkDoneModal.name,
            repetitions: 1,
            created_by: user.id,
            practiced_at: practiceDateTime.toISOString(),
          });

        if (error) {
          console.error('Supabase request failed', error);
          throw error;
        }
      }

      setNotification({ message: 'Hoekenwerk geregistreerd als gedaan!', type: 'success' });
      setShowMarkDoneModal(null);
      setMarkDoneData({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
      });
      loadActivePresets();
    } catch (error) {
      console.error('Error marking as done:', error);
      setNotification({ message: 'Fout bij registreren hoekenwerk', type: 'error' });
    }
  };

  const handleAddToAgenda = async () => {
    if (!showAddToAgendaModal || !user || !selectedSchool) return;

    try {
      const startDateTime = new Date(`${agendaData.date}T${agendaData.start_time}`);
      const endDateTime = new Date(`${agendaData.date}T${agendaData.end_time}`);

      const { data: existingLesson, error: lessonCheckError } = await supabase
        .from('lessons')
        .select('*')
        .eq('group_id', groupId)
        .eq('start_time', startDateTime.toISOString())
        .maybeSingle();

      if (lessonCheckError) throw lessonCheckError;

      let lessonId: string;

      if (existingLesson) {
        lessonId = existingLesson.id;
      } else {
        const { data: newLesson, error: createError } = await supabase
          .from('lessons')
          .insert({
            group_id: groupId,
            school_id: selectedSchool.id,
            title: agendaData.title || showAddToAgendaModal.name,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            created_by: user.id,
          })
          .select()
          .single();

        if (createError) throw createError;
        lessonId = newLesson.id;
      }

      const { error: itemError } = await supabase
        .from('lesson_items')
        .insert({
          lesson_id: lessonId,
          item_type: 'activity_preset',
          item_id: showAddToAgendaModal.id,
          item_name: showAddToAgendaModal.name,
          sort_order: 0,
        });

      if (itemError) throw itemError;

      for (const goalCode of showAddToAgendaModal.goal_codes || []) {
        const { error: goalError } = await supabase
          .from('lesson_goals')
          .insert({
            lesson_id: lessonId,
            goal_code: goalCode,
            lesson_start_time: startDateTime.toISOString(),
            group_id: groupId,
          });

        if (goalError) console.error('Error adding goal to lesson:', goalError);
      }

      setNotification({ message: 'Hoekenwerk toegevoegd aan agenda!', type: 'success' });
      setShowAddToAgendaModal(null);
      setAgendaData({
        date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '10:00',
        title: '',
      });
      loadActivePresets();
    } catch (error) {
      console.error('Error adding to agenda:', error);
      setNotification({ message: 'Fout bij toevoegen aan agenda', type: 'error' });
    }
  };

  const openEditModal = (preset: ActivityPreset) => {
    setEditingPreset(preset);
    setFormData({
      name: preset.name,
      description: preset.description || '',
      icon: preset.icon,
      color: preset.color,
      max_students: preset.max_students,
      goal_codes: preset.goal_codes || [],
      custom_icon_id: preset.custom_icon_id,
      custom_icon_url: preset.custom_icon_url ?? null,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'Palette',
      color: '#FF8E8E',
      max_students: null,
      goal_codes: [],
      custom_icon_id: null,
      custom_icon_url: null,
    });
    setGoalSearch('');
  };

  const filteredPresets = presets.filter(preset => {
    if (goalFilter && !preset.goal_codes.includes(goalFilter)) {
      return false;
    }
    return preset.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const [goalSearch, setGoalSearch] = useState('');

  const groupedGoals = allGoals
    .filter((g) => {
      if (!goalSearch.trim()) return true;
      const q = goalSearch.toLowerCase();
      return g.code.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
    })
    .reduce((acc, goal) => {
    if (!acc[goal.domain]) acc[goal.domain] = [];
    acc[goal.domain].push(goal);
    return acc;
  }, {} as Record<number, Goal[]>);

  const toggleGoal = (goalCode: string) => {
    setFormData(prev => ({
      ...prev,
      goal_codes: prev.goal_codes.includes(goalCode)
        ? prev.goal_codes.filter(code => code !== goalCode)
        : [...prev.goal_codes, goalCode],
    }));
  };

  const commonIcons = [
    '🎨', '📚', '🎮', '✏️', '🏗️', '🎭', '🧩', '🏠', '🔨', '✂️', '🎪', '🌈',
    'Palette', 'BookOpen', 'Blocks', 'Hammer', 'Scissors', 'Home', 'Wrench', 'Building2', 'Puzzle', 'Drama', 'Rainbow', 'Music', 'Paintbrush'
  ];
  const commonColors = ['#FF8E8E', '#B5F0BE', '#7EDCD5', '#FFCC80', '#FFD966', '#D9C8FF', '#FFB3B3', '#9B9EFF'];

  const renderIcon = (iconName: string, className: string = '', customIconUrl?: string | null) => {
    if (customIconUrl) {
      return <img src={customIconUrl} alt="" className={`object-cover rounded ${className || 'w-6 h-6'}`} />;
    }
    // Check if it's a Lucide icon name (starts with uppercase letter)
    if (iconName && /^[A-Z]/.test(iconName)) {
      const IconComponent = (LucideIcons as any)[iconName];
      if (IconComponent) {
        return <IconComponent className={className || "w-6 h-6"} />;
      }
    }
    // Otherwise render as emoji/text
    return <span className={className}>{iconName}</span>;
  };

  const handleIconFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSchool?.id || !user) return;
    e.target.value = '';
    setIconUploading(true);
    try {
      const uploaded = await uploadHoekenIcon(file, selectedSchool.id, user.id);
      setFormData(prev => ({ ...prev, custom_icon_id: uploaded.id, custom_icon_url: uploaded.public_url }));
    } catch (err) {
      console.error('Icon upload failed:', err);
      setNotification({ message: 'Fout bij uploaden icoon', type: 'error' });
    } finally {
      setIconUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-2xl font-baloo text-deep-purple">Laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeLessonBoard && (
        <div className="bg-gradient-to-r from-sky-blue to-[#7EDCD5] rounded-3xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6" />
              <div>
                <h4 className="font-baloo text-lg">Activiteitenbord Actief</h4>
                <p className="text-sm opacity-90">{activeLessonBoard.name}</p>
              </div>
            </div>
            <a
              href="/activi-tijd"
              className="px-4 py-2 bg-white text-sky-blue rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Open Bord
            </a>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-baloo text-deep-purple flex items-center gap-2">
              <Palette className="w-5 h-5 sm:w-6 sm:h-6" />
              Hoekenwerk Presets
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Beheer je hoekenwerkactiviteiten
              {activePresetIds.size > 0 && (
                <span className="ml-2 text-grass-green font-semibold">
                  • {activePresetIds.size} actief in huidige les
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/activi-tijd')}
              className="px-4 py-2 bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg text-sm"
            >
              <Layout className="w-4 h-4" />
              <span>Activiteitenborden</span>
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-lavender to-[#E8B4FF] text-white rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nieuwe Hoek</span>
            </button>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek hoekenwerk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-sky-blue text-sm sm:text-base"
          />
        </div>

        <div className="bg-gradient-to-r from-lavender/10 to-sky-blue/10 border border-lavender/30 rounded-2xl px-4 py-3 mb-4 flex gap-3 items-start">
          <div className="text-2xl flex-shrink-0">🏫</div>
          <div>
            <p className="text-sm font-semibold text-deep-purple">Maak hier al je hoeken aan</p>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
              Sla elke hoek in je klaslokaal op als preset — zoals de leeshoek, bouwhoek of tekenhoek. Je kunt ze daarna eenvoudig hergebruiken in je activiteitenborden zonder ze telkens opnieuw in te stellen.
            </p>
          </div>
        </div>

        {filteredPresets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-2xl font-baloo text-deep-purple mb-2">Geen hoekenwerk gevonden</h3>
            <p className="text-gray-600">Begin met het toevoegen van hoekenwerk</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPresets.map((preset) => (
              <div
                key={preset.id}
                className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div
                  className="relative h-24 flex items-center justify-center"
                  style={{ backgroundColor: preset.color }}
                >
                  <div className="text-white text-4xl">
                    {renderIcon(preset.icon, 'w-12 h-12 text-white', preset.custom_icon_url)}
                  </div>
                  <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                    {activePresetIds.has(preset.id) && (
                      <div className="bg-grass-green text-white px-2 py-1 rounded-full text-xs font-semibold animate-pulse shadow-lg">
                        ACTIEF NU
                      </div>
                    )}
                    {preset.is_default && (
                      <div className="bg-white/90 text-deep-purple px-2 py-1 rounded-full text-xs font-semibold">
                        Standaard
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <button
                      onClick={() => preset.is_default ? handleDuplicatePreset(preset) : openEditModal(preset)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 hover:bg-white rounded-lg transition-colors text-xs font-semibold"
                      title={preset.is_default ? "Dupliceer en bewerk" : "Bewerk"}
                    >
                      {preset.is_default ? <Copy className="w-3.5 h-3.5 text-deep-purple" /> : <Edit className="w-3.5 h-3.5 text-sky-blue" />}
                      <span className={preset.is_default ? 'text-deep-purple' : 'text-sky-blue'}>Bewerken</span>
                    </button>
                    {!preset.is_default && (
                      <button
                        onClick={() => setShowDeleteConfirm(preset.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 hover:bg-white rounded-lg transition-colors text-xs font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-coral-pink" />
                        <span className="text-coral-pink">Verwijder</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-baloo text-lg text-deep-purple">{preset.name}</h4>
                    {studentCounts.has(preset.id) && studentCounts.get(preset.id)! > 0 && (
                      <div className="flex items-center gap-1 bg-sky-blue/10 px-2 py-1 rounded-full">
                        <Users className="w-3 h-3 text-sky-blue" />
                        <span className="text-xs font-semibold text-sky-blue">
                          {studentCounts.get(preset.id)}
                        </span>
                      </div>
                    )}
                  </div>

                  {preset.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{preset.description}</p>
                  )}

                  {preset.goal_codes && preset.goal_codes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {preset.goal_codes.slice(0, 3).map((code) => (
                        <span
                          key={code}
                          className="text-xs px-2 py-1 bg-sky-blue/10 text-sky-blue rounded-full"
                        >
                          {code}
                        </span>
                      ))}
                      {preset.goal_codes.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          +{preset.goal_codes.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleAddToLessonBoard(preset)}
                      className="flex-1 bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white px-3 py-2 rounded-xl text-xs font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-1.5"
                      title="Voeg toe aan activiteitenbord van huidige les"
                    >
                      <Check className="w-3.5 h-3.5" />
                      In Les
                    </button>
                    <button
                      onClick={() => {
                        setShowAddToAgendaModal(preset);
                        setAgendaData(prev => ({ ...prev, title: preset.name }));
                      }}
                      className="flex-1 bg-gradient-to-r from-grass-green to-[#B5F0BE] text-white px-3 py-2 rounded-xl text-xs font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Agenda
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(showCreateModal || showEditModal) && (
        <Modal
          isOpen={showCreateModal || showEditModal}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setEditingPreset(null);
            resetForm();
          }}
          title={showEditModal ? 'Bewerk Hoekenwerk' : 'Nieuw Hoekenwerk'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Naam *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-sky-blue focus:outline-none"
                placeholder="Bijv. Bouwhoek"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Beschrijving</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-sky-blue focus:outline-none"
                rows={3}
                placeholder="Optionele beschrijving..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Icoon</label>
              <div className="flex flex-wrap gap-2">
                {commonIcons.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon, custom_icon_id: null, custom_icon_url: null })}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                      formData.icon === icon && !formData.custom_icon_url
                        ? 'bg-sky-blue text-white scale-110'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {/^[A-Z]/.test(icon) ? renderIcon(icon, 'w-6 h-6') : <span className="text-2xl">{icon}</span>}
                  </button>
                ))}
              </div>

              {/* Custom icon upload */}
              <div className="mt-3 flex items-center gap-3">
                {formData.custom_icon_url ? (
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-lg overflow-hidden ring-4 ring-sky-blue ring-offset-2 flex-shrink-0">
                      <img src={formData.custom_icon_url} alt="Eigen icoon" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm text-sky-blue font-semibold">Eigen icoon</span>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, custom_icon_id: null, custom_icon_url: null }))}
                      className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-coral-pink transition-colors"
                      title="Verwijder eigen icoon"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => iconFileInputRef.current?.click()}
                  disabled={iconUploading}
                  className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-sky-blue hover:text-sky-blue transition-colors disabled:opacity-50"
                >
                  {iconUploading ? (
                    <div className="w-4 h-4 border-2 border-sky-blue border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {iconUploading ? 'Uploaden...' : 'Upload eigen foto'}
                </button>
                <input
                  ref={iconFileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleIconFileChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Kleur</label>
              <div className="flex flex-wrap gap-2 items-center">
                {commonColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      formData.color === color ? 'ring-4 ring-offset-2 ring-sky-blue scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <label
                  className={`w-10 h-10 rounded-lg cursor-pointer flex items-center justify-center border-2 border-dashed transition-all hover:scale-110 ${
                    !commonColors.includes(formData.color) ? 'ring-4 ring-offset-2 ring-sky-blue scale-110' : 'border-gray-300'
                  }`}
                  style={!commonColors.includes(formData.color) ? { backgroundColor: formData.color, borderColor: formData.color } : {}}
                  title="Kies eigen kleur"
                >
                  <input
                    type="color"
                    className="sr-only"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                  {commonColors.includes(formData.color) && (
                    <span className="text-gray-400 text-lg leading-none">+</span>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Max Studenten</label>
              <input
                type="number"
                value={formData.max_students || ''}
                onChange={(e) => setFormData({ ...formData, max_students: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-sky-blue focus:outline-none"
                placeholder="Optioneel"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gekoppelde Doelen ({formData.goal_codes.length})
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={goalSearch}
                  onChange={(e) => setGoalSearch(e.target.value)}
                  placeholder="Zoek doelen..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg border-2 border-gray-200 focus:border-sky-blue focus:outline-none text-sm"
                />
              </div>
              <div className="max-h-64 overflow-y-auto border-2 border-gray-200 rounded-lg p-4">
                {Object.entries(groupedGoals).map(([domain, goals]) => (
                  <div key={domain} className="mb-4">
                    <h4 className="font-semibold text-deep-purple mb-2">Domein {domain}</h4>
                    <div className="space-y-1">
                      {goals.map((goal) => (
                        <label
                          key={goal.code}
                          className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.goal_codes.includes(goal.code)}
                            onChange={() => toggleGoal(goal.code)}
                            className="mt-1 w-4 h-4 text-sky-blue rounded focus:ring-sky-blue"
                          />
                          <span className="text-sm">
                            <span className="font-semibold text-deep-purple">{goal.code}</span>
                            <span className="text-gray-600"> - {goal.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setEditingPreset(null);
                  resetForm();
                }}
                className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-baloo hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={showEditModal ? handleUpdatePreset : handleCreatePreset}
                disabled={!formData.name.trim()}
                className="flex-1 bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white px-6 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showEditModal ? 'Bijwerken' : 'Toevoegen'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showMarkDoneModal && (
        <Modal
          isOpen={!!showMarkDoneModal}
          onClose={() => setShowMarkDoneModal(null)}
          title="Markeer als In Les Gedaan"
        >
          <div className="space-y-4">
            <div className="bg-lavender/10 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${showMarkDoneModal.color}20` }}
                >
                  {renderIcon(showMarkDoneModal.icon, 'w-5 h-5', showMarkDoneModal.custom_icon_url)}
                </div>
                <h3 className="font-baloo text-lg text-deep-purple">{showMarkDoneModal.name}</h3>
              </div>
              {showMarkDoneModal.goal_codes && showMarkDoneModal.goal_codes.length > 0 && (
                <p className="text-sm text-gray-600">
                  Dit registreert voortgang voor {showMarkDoneModal.goal_codes.length} doel(en)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Datum</label>
              <input
                type="date"
                value={markDoneData.date}
                onChange={(e) => setMarkDoneData({ ...markDoneData, date: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-sky-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tijd</label>
              <input
                type="time"
                value={markDoneData.time}
                onChange={(e) => setMarkDoneData({ ...markDoneData, time: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-sky-blue focus:outline-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowMarkDoneModal(null)}
                className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-baloo hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleMarkAsDone}
                className="flex-1 bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white px-6 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Registreer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showAddToAgendaModal && (
        <Modal
          isOpen={!!showAddToAgendaModal}
          onClose={() => setShowAddToAgendaModal(null)}
          title="Toevoegen aan Agenda"
        >
          <div className="space-y-4">
            <div className="bg-lavender/10 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${showAddToAgendaModal.color}20` }}
                >
                  {renderIcon(showAddToAgendaModal.icon, 'w-5 h-5', showAddToAgendaModal.custom_icon_url)}
                </div>
                <h3 className="font-baloo text-lg text-deep-purple">{showAddToAgendaModal.name}</h3>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Les Titel</label>
              <input
                type="text"
                value={agendaData.title}
                onChange={(e) => setAgendaData({ ...agendaData, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-sky-blue focus:outline-none"
                placeholder="Optioneel - gebruikt voor nieuwe les"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Datum</label>
              <input
                type="date"
                value={agendaData.date}
                onChange={(e) => setAgendaData({ ...agendaData, date: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-sky-blue focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Tijd</label>
                <input
                  type="time"
                  value={agendaData.start_time}
                  onChange={(e) => setAgendaData({ ...agendaData, start_time: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-sky-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Eind Tijd</label>
                <input
                  type="time"
                  value={agendaData.end_time}
                  onChange={(e) => setAgendaData({ ...agendaData, end_time: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-sky-blue focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowAddToAgendaModal(null)}
                className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-baloo hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleAddToAgenda}
                className="flex-1 bg-gradient-to-r from-grass-green to-[#B5F0BE] text-white px-6 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Toevoegen
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showCreateLessonModal && (
        <Modal
          isOpen={!!showCreateLessonModal}
          onClose={() => setShowCreateLessonModal(null)}
          title="Les van 30 minuten aanmaken"
        >
          <div className="space-y-4">
            <div className="bg-sky-blue/10 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${showCreateLessonModal.color}20` }}
                >
                  {renderIcon(showCreateLessonModal.icon, 'w-5 h-5', showCreateLessonModal.custom_icon_url)}
                </div>
                <h3 className="font-baloo text-lg text-deep-purple">{showCreateLessonModal.name}</h3>
              </div>
              <p className="text-sm text-gray-700">
                Er is momenteel geen actieve les. Wil je een les van 30 minuten aanmaken om dit hoekenwerk toe te voegen?
              </p>
            </div>

            <div className="bg-grass-green/10 p-4 rounded-lg">
              <h4 className="font-semibold text-deep-purple mb-2">Dit zal gebeuren:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-grass-green mt-0.5 flex-shrink-0" />
                  <span>Een nieuwe les van 30 minuten wordt aangemaakt vanaf nu</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-grass-green mt-0.5 flex-shrink-0" />
                  <span>Het hoekenwerk wordt toegevoegd aan de les</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-grass-green mt-0.5 flex-shrink-0" />
                  <span>Een activiteitenbord wordt automatisch aangemaakt</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowCreateLessonModal(null)}
                className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-baloo hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleCreateLessonAndAddPreset}
                className="flex-1 bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white px-6 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <Clock className="w-5 h-5" />
                Les Aanmaken
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteConfirm && (
        <Modal
          isOpen={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          title="Verwijder Hoekenwerk"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Weet je zeker dat je dit hoekenwerk wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-baloo hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleDeletePreset(showDeleteConfirm)}
                className="flex-1 bg-gradient-to-r from-coral-pink to-[#FF8E8E] text-white px-6 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform"
              >
                Verwijder
              </button>
            </div>
          </div>
        </Modal>
      )}

      {notification && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
          <div
            className={`px-6 py-4 rounded-full shadow-xl font-baloo text-white ${
              notification.type === 'success'
                ? 'bg-gradient-to-r from-grass-green to-[#B5F0BE]'
                : 'bg-gradient-to-r from-coral-pink to-[#FF8E8E]'
            }`}
          >
            {notification.message}
          </div>
        </div>
      )}
    </div>
  );
}
