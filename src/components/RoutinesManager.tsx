import { useState, useEffect } from 'react';
import DoelChips from './DoelChips';
import { supabase } from '../lib/supabase';
import DoelSelector from './DoelSelector';
import { RefreshCw, Plus, Pencil, Trash2, Search, Clock, Settings } from 'lucide-react';
import { Circle } from 'lucide-react';
import { getActivityIcon } from '../lib/activityIcons';
import Modal from './Modal';

type RoutineCategory = 'start_week' | 'start_day' | 'start_lesson' | 'lesson' | 'end_lesson' | 'end_day' | 'end_week';
type RoutineFrequency = 'weekly' | 'bi_weekly';

interface Routine {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  images: string[];
  video_url: string | null;
  category: RoutineCategory;
  goal_codes: string[];
  is_default: boolean;
  school_id: string | null;
  created_at: string;
  usage_count?: number;
}

interface GroupRoutine {
  id: string;
  routine_id: string;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  frequency: RoutineFrequency;
  week_alternation: number;
  day_of_week: number[];
  template_block_ids: string[];
  start_time: string | null;
  end_time: string | null;
}

interface DayTemplateBlock {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  block_type: string;
  title: string;
}

interface RoutinesManagerProps {
  schoolId: string;
  groupId?: string;
  goalFilter?: string;
}

interface StudentGroup {
  id: string;
  name: string;
}

const CATEGORY_LABELS: Record<RoutineCategory, string> = {
  start_week: 'Start van de week',
  start_day: 'Start van de dag',
  start_lesson: 'Start van les',
  lesson: 'Tijdens les',
  end_lesson: 'Einde van les',
  end_day: 'Einde van de dag',
  end_week: 'Einde van de week',
};

const COMMON_ICONS = [
  'circle', 'calendar', 'cloud-rain', 'book-open', 'hash', 'music', 'activity',
  'heart', 'leaf', 'message-circle', 'dices', 'palette', 'message-square',
  'shield', 'sunset', 'book', 'sun', 'star', 'clock', 'users'
];

export default function RoutinesManager({ schoolId, groupId, goalFilter }: RoutinesManagerProps) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<RoutineCategory | 'all'>('all');
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [activeRoutines, setActiveRoutines] = useState<Set<string>>(new Set());
  const [groupRoutinesMap, setGroupRoutinesMap] = useState<Map<string, GroupRoutine>>(new Map());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingRoutine, setSchedulingRoutine] = useState<Routine | null>(null);
  const [templateBlocks, setTemplateBlocks] = useState<DayTemplateBlock[]>([]);
  const [scheduleForm, setScheduleForm] = useState({
    frequency: 'weekly' as RoutineFrequency,
    week_alternation: 0,
    day_of_week: [1, 2, 3, 4, 5],
    template_block_ids: [] as string[],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    start_time: '',
    end_time: '',
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'circle',
    color: '#3b82f6',
    video_url: '',
    category: 'lesson' as RoutineCategory,
    goal_codes: [] as string[],
  });

  useEffect(() => {
    loadRoutines();
    checkAdminStatus();
    loadGroups();
  }, [schoolId, goalFilter]);

  useEffect(() => {
    if (groupId) {
      setSelectedGroupId(groupId);
    }
  }, [groupId]);

  useEffect(() => {
    if (showFormModal) {
    }
  }, [showFormModal]);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupRoutines();
      loadTemplateBlocks();
    } else {
      setActiveRoutines(new Set());
      setGroupRoutinesMap(new Map());
    }
  }, [selectedGroupId]);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

  const loadRoutines = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('routines')
        .select('*')
        .or(`is_default.eq.true,school_id.eq.${schoolId}`)
        .order('created_at', { ascending: false });

      const { data: routinesData, error } = await query;
      if (error) throw error;

      const routineIds = routinesData?.map(r => r.id) || [];

      const { data: usageData } = await supabase
        .from('group_routines')
        .select('routine_id')
        .in('routine_id', routineIds)
        .eq('is_active', true);

      const usageCounts = (usageData || []).reduce((acc, item) => {
        acc[item.routine_id] = (acc[item.routine_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const routinesWithUsage = (routinesData || []).map(routine => ({
        ...routine,
        usage_count: usageCounts[routine.id] || 0,
      }));

      setRoutines(routinesWithUsage);
    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      setLoading(false);
    }
  };


  const loadGroups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('groups')
        .select('id, name')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('name');

      if (data) {
        setGroups(data);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const loadGroupRoutines = async () => {
    if (!selectedGroupId) return;

    try {
      const { data } = await supabase
        .from('group_routines')
        .select('*')
        .eq('group_id', selectedGroupId)
        .eq('is_active', true);

      if (data) {
        setActiveRoutines(new Set(data.map(gr => gr.routine_id)));
        const routineMap = new Map(data.map(gr => [gr.routine_id, gr as GroupRoutine]));
        setGroupRoutinesMap(routineMap);
      }
    } catch (error) {
      console.error('Error loading group routines:', error);
    }
  };

  const loadTemplateBlocks = async () => {
    if (!selectedGroupId) return;

    try {
      const { data: group } = await supabase
        .from('groups')
        .select('schedule_template_id')
        .eq('id', selectedGroupId)
        .maybeSingle();

      if (group?.schedule_template_id) {
        const { data } = await supabase
          .from('day_template_blocks')
          .select('*')
          .eq('template_id', group.schedule_template_id)
          .order('day_of_week')
          .order('start_time');

        if (data) {
          setTemplateBlocks(data);
        }
      }
    } catch (error) {
      console.error('Error loading template blocks:', error);
    }
  };

  const openScheduleModal = (routine: Routine) => {
    if (!selectedGroupId) {
      alert('Selecteer eerst een groep om routines te activeren.');
      return;
    }

    const existingSchedule = groupRoutinesMap.get(routine.id);

    if (existingSchedule) {
      setScheduleForm({
        frequency: existingSchedule.frequency,
        week_alternation: existingSchedule.week_alternation,
        day_of_week: existingSchedule.day_of_week,
        template_block_ids: existingSchedule.template_block_ids,
        start_date: existingSchedule.start_date,
        end_date: existingSchedule.end_date || '',
        start_time: existingSchedule.start_time || '',
        end_time: existingSchedule.end_time || '',
      });
    } else {
      setScheduleForm({
        frequency: 'weekly',
        week_alternation: 0,
        day_of_week: [1, 2, 3, 4, 5],
        template_block_ids: [],
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        start_time: '',
        end_time: '',
      });
    }

    setSchedulingRoutine(routine);
    setShowScheduleModal(true);
  };

  const closeScheduleModal = () => {
    setShowScheduleModal(false);
    setSchedulingRoutine(null);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingRoutine || !selectedGroupId) return;

    try {
      const existingSchedule = groupRoutinesMap.get(schedulingRoutine.id);

      const scheduleData = {
        group_id: selectedGroupId,
        routine_id: schedulingRoutine.id,
        is_active: true,
        start_date: scheduleForm.start_date,
        end_date: scheduleForm.end_date || null,
        frequency: scheduleForm.frequency,
        week_alternation: scheduleForm.week_alternation,
        day_of_week: scheduleForm.day_of_week,
        template_block_ids: scheduleForm.template_block_ids,
        start_time: scheduleForm.start_time || null,
        end_time: scheduleForm.end_time || null,
      };

      if (existingSchedule) {
        await supabase
          .from('group_routines')
          .update(scheduleData)
          .eq('id', existingSchedule.id);
      } else {
        await supabase
          .from('group_routines')
          .insert(scheduleData);
      }

      closeScheduleModal();
      loadGroupRoutines();
      loadRoutines();
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Er is een fout opgetreden bij het opslaan van het rooster.');
    }
  };

  const deactivateRoutine = async (routineId: string) => {
    if (!selectedGroupId) return;

    try {
      const existingSchedule = groupRoutinesMap.get(routineId);
      if (existingSchedule) {
        await supabase
          .from('group_routines')
          .update({ is_active: false })
          .eq('id', existingSchedule.id);

        setActiveRoutines(prev => {
          const next = new Set(prev);
          next.delete(routineId);
          return next;
        });
        setGroupRoutinesMap(prev => {
          const next = new Map(prev);
          next.delete(routineId);
          return next;
        });

        loadRoutines();
      }
    } catch (error) {
      console.error('Error deactivating routine:', error);
      alert('Er is een fout opgetreden bij het uitschakelen van de routine.');
    }
  };

  const openCreateForm = () => {
    setEditingRoutine(null);
    setFormData({
      title: '',
      description: '',
      icon: 'circle',
      color: '#3b82f6',
      video_url: '',
      category: 'lesson',
      goal_codes: [],
    });
    setShowFormModal(true);
  };

  const openEditForm = (routine: Routine) => {
    if (routine.is_default && !isAdmin) {
      alert('Alleen admins kunnen standaard routines bewerken.');
      return;
    }

    setEditingRoutine(routine);
    setFormData({
      title: routine.title,
      description: routine.description,
      icon: routine.icon,
      color: routine.color,
      video_url: routine.video_url || '',
      category: routine.category,
      goal_codes: routine.goal_codes,
    });
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingRoutine(null);
    setFormData({
      title: '',
      description: '',
      icon: 'circle',
      color: '#3b82f6',
      video_url: '',
      category: 'lesson',
      goal_codes: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Je moet ingelogd zijn om routines te beheren.');
        return;
      }

      const routineData = {
        title: formData.title,
        description: formData.description,
        icon: formData.icon,
        color: formData.color,
        video_url: formData.video_url || null,
        category: formData.category,
        goal_codes: formData.goal_codes,
        school_id: schoolId,
        created_by: user.id,
      };

      if (editingRoutine) {
        const { error } = await supabase
          .from('routines')
          .update(routineData)
          .eq('id', editingRoutine.id);

        if (error) throw error;

        await supabase
          .from('routine_goals')
          .delete()
          .eq('routine_id', editingRoutine.id);

        if (formData.goal_codes.length > 0) {
          const goalInserts = formData.goal_codes.map(code => ({
            routine_id: editingRoutine.id,
            goal_code: code,
          }));

          await supabase.from('routine_goals').insert(goalInserts);
        }
      } else {
        const { data, error } = await supabase
          .from('routines')
          .insert([routineData])
          .select()
          .single();

        if (error) throw error;

        if (data && formData.goal_codes.length > 0) {
          const goalInserts = formData.goal_codes.map(code => ({
            routine_id: data.id,
            goal_code: code,
          }));

          await supabase.from('routine_goals').insert(goalInserts);
        }
      }

      closeFormModal();
      loadRoutines();
    } catch (error) {
      console.error('Error saving routine:', error);
      alert('Er is een fout opgetreden bij het opslaan van de routine.');
    }
  };

  const openDeleteConfirm = (routine: Routine) => {
    if (routine.is_default && !isAdmin) {
      alert('Alleen admins kunnen standaard routines verwijderen.');
      return;
    }

    setRoutineToDelete(routine);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setRoutineToDelete(null);
  };

  const confirmDelete = async () => {
    if (!routineToDelete) return;

    try {
      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', routineToDelete.id);

      if (error) throw error;

      closeDeleteModal();
      loadRoutines();
    } catch (error) {
      console.error('Error deleting routine:', error);
      alert('Er is een fout opgetreden bij het verwijderen van de routine.');
    }
  };



  const renderIcon = (iconName: string, className: string = '') => {
    const IconComponent = getActivityIcon(iconName);
    return IconComponent ? <IconComponent className={className} /> : <Circle className={className} />;
  };

  const filteredRoutines = routines.filter(routine => {
    const matchesSearch = routine.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         routine.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || routine.category === categoryFilter;
    const matchesGoal = !goalFilter || routine.goal_codes.includes(goalFilter);

    return matchesSearch && matchesCategory && matchesGoal;
  });

  const canEditRoutine = (routine: Routine) => {
    return !routine.is_default || isAdmin;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-baloo text-deep-purple flex items-center gap-2">
              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
              Routines
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Beheer terugkerende klasactiviteiten
            </p>
          </div>
          <button
            onClick={openCreateForm}
            className="px-4 py-2 bg-deep-purple text-white rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nieuwe Routine
          </button>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Zoek routines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-deep-purple focus:border-transparent"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as RoutineCategory | 'all')}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-deep-purple focus:border-transparent text-sm"
          >
            <option value="all">Alle categorieën</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {groupId && selectedGroupId && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
            <p className="text-sm text-blue-800">
              Gebruik de schakelaars bij elke routine om deze voor deze groep in/uit te schakelen.
            </p>
          </div>
        )}

        {!groupId && groups.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecteer een groep om routines te activeren
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-deep-purple focus:border-transparent"
            >
              <option value="">-- Geen groep geselecteerd --</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-deep-purple animate-spin" />
          </div>
        ) : filteredRoutines.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Geen routines gevonden</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoutines.map((routine) => (
              <div
                key={routine.id}
                className="bg-gray-50 rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: routine.color + '25' }}
                    >
                      {renderIcon(routine.icon, `w-5 h-5`)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{routine.title}</h3>
                      <span className="text-xs text-gray-500">{CATEGORY_LABELS[routine.category]}</span>
                    </div>
                  </div>
                  {canEditRoutine(routine) && (
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      <button
                        onClick={() => openEditForm(routine)}
                        className="text-grass-green hover:bg-grass-green/10 rounded-lg p-1 transition-colors"
                        title="Bewerken"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(routine)}
                        className="text-red-500 hover:bg-red-50 rounded-lg p-1 transition-colors"
                        title="Verwijderen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {routine.description}
                </p>

                {routine.goal_codes.length > 0 && (
                  <div className="mb-3">
                    <DoelChips codes={routine.goal_codes} max={4} klein />
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{routine.usage_count || 0} groep(en)</span>
                    {routine.is_default && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        Standaard
                      </span>
                    )}
                  </div>

                  {selectedGroupId && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Actief voor deze groep</span>
                        <button
                          onClick={() => activeRoutines.has(routine.id) ? deactivateRoutine(routine.id) : openScheduleModal(routine)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            activeRoutines.has(routine.id) ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            activeRoutines.has(routine.id) ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                      {activeRoutines.has(routine.id) && (
                        <button
                          onClick={() => openScheduleModal(routine)}
                          className="flex items-center gap-1 text-xs text-deep-purple hover:underline"
                        >
                          <Settings className="w-3 h-3" />
                          Wijzig rooster
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={closeFormModal}
        title={editingRoutine ? 'Routine Bewerken' : 'Nieuwe Routine'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschrijving *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icoon</label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none text-sm"
              >
                {COMMON_ICONS.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kleur</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 border-2 border-gray-200 rounded-xl cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categorie *</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as RoutineCategory })}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none text-sm"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vimeo Video URL (optioneel)</label>
            <input
              type="url"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder="https://vimeo.com/..."
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none text-sm"
            />
          </div>

          <DoelSelector
            waarde={formData.goal_codes}
            onChange={(codes) => setFormData({ ...formData, goal_codes: codes })}
            label="Gekoppelde doelen"
          />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeFormModal}
              className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-baloo hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="flex-1 bg-deep-purple text-white px-6 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform"
            >
              {editingRoutine ? 'Opslaan' : 'Aanmaken'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        title="Routine Verwijderen"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Weet je zeker dat je "<strong>{routineToDelete?.title}</strong>" wilt verwijderen?
          </p>
          <p className="text-sm text-gray-500">Deze actie kan niet ongedaan worden gemaakt.</p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={closeDeleteModal}
              className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-baloo hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 bg-coral-pink text-white px-6 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform"
            >
              Verwijderen
            </button>
          </div>
        </div>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={closeScheduleModal}
        title={`Rooster instellen: ${schedulingRoutine?.title ?? ''}`}
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Frequentie *</label>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              {(['weekly', 'bi_weekly'] as RoutineFrequency[]).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setScheduleForm({ ...scheduleForm, frequency: freq })}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    scheduleForm.frequency === freq ? 'bg-white shadow-md text-deep-purple' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {freq === 'weekly' ? 'Wekelijks' : 'Tweewekelijks'}
                </button>
              ))}
            </div>
          </div>

          {scheduleForm.frequency === 'bi_weekly' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Welke weken?</label>
              <select
                value={scheduleForm.week_alternation}
                onChange={(e) => setScheduleForm({ ...scheduleForm, week_alternation: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none text-sm"
              >
                <option value={0}>Even weken (2, 4, 6, ...)</option>
                <option value={1}>Oneven weken (1, 3, 5, ...)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Welke dagen? *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[{ value: 1, label: 'Maandag' }, { value: 2, label: 'Dinsdag' }, { value: 3, label: 'Woensdag' }, { value: 4, label: 'Donderdag' }, { value: 5, label: 'Vrijdag' }, { value: 6, label: 'Zaterdag' }, { value: 0, label: 'Zondag' }].map(day => (
                <label key={day.value} className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 text-sm">
                  <input
                    type="checkbox"
                    checked={scheduleForm.day_of_week.includes(day.value)}
                    onChange={(e) => {
                      setScheduleForm({
                        ...scheduleForm,
                        day_of_week: e.target.checked
                          ? [...scheduleForm.day_of_week, day.value].sort()
                          : scheduleForm.day_of_week.filter(d => d !== day.value),
                      });
                    }}
                  />
                  {day.label}
                </label>
              ))}
            </div>
            {scheduleForm.day_of_week.length === 0 && (
              <p className="text-sm text-red-500 mt-1">Selecteer minimaal één dag</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tijdstip (optioneel)</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Van</label>
                <input
                  type="time"
                  value={scheduleForm.start_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tot</label>
                <input
                  type="time"
                  value={scheduleForm.end_time}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                  min={scheduleForm.start_time}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {templateBlocks.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tijdsblokken (optioneel)</label>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-xl p-3">
                {templateBlocks.map(block => (
                  <label key={block.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleForm.template_block_ids.includes(block.id)}
                      onChange={(e) => {
                        setScheduleForm({
                          ...scheduleForm,
                          template_block_ids: e.target.checked
                            ? [...scheduleForm.template_block_ids, block.id]
                            : scheduleForm.template_block_ids.filter(id => id !== block.id),
                        });
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{block.title}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'][block.day_of_week]} — {block.start_time} tot {block.end_time}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Startdatum *</label>
              <input
                type="date"
                required
                value={scheduleForm.start_date}
                onChange={(e) => setScheduleForm({ ...scheduleForm, start_date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Einddatum (optioneel)</label>
              <input
                type="date"
                value={scheduleForm.end_date}
                onChange={(e) => setScheduleForm({ ...scheduleForm, end_date: e.target.value })}
                min={scheduleForm.start_date}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeScheduleModal}
              className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-baloo hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={scheduleForm.day_of_week.length === 0}
              className="flex-1 bg-deep-purple text-white px-6 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
            >
              Opslaan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
