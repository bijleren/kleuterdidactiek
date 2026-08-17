import { useState, useEffect } from 'react';
import { Plus, Clock, Users, LayoutGrid as Layout, Trash2, BarChart3, Play, Calendar, Eye, EyeOff, Square, Settings, ChevronRight, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import HoekenScheduleManager from './HoekenScheduleManager';
import HoekenTemplateBuilder from './HoekenTemplateBuilder';
import BoardCountdownTimer from './BoardCountdownTimer';
import GroupBoardRulesModal from './GroupBoardRulesModal';
import ActivityPresetsManager from './ActivityPresetsManager';
import * as LucideIcons from 'lucide-react';

interface ActivityBoard {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  group_id?: string | null;
  active_until?: string | null;
  activated_at?: string | null;
  archived_at?: string | null;
  template_id?: string | null;
}

interface HoekenTemplate {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  custom_icon_id?: string | null;
  custom_icon_url?: string | null;
  created_at: string;
  items: {
    id: string;
    activity_preset_id: string;
    sort_order: number;
    max_students_override: number | null;
    activity_presets: {
      id: string;
      name: string;
      icon: string | null;
      color: string | null;
      max_students: number | null;
      custom_icon_id: string | null;
      custom_icon_url?: string | null;
    } | null;
  }[];
}

interface ActivityBoardsListProps {
  onSelectBoard: (board: ActivityBoard) => void;
  onBoardsChange: () => void;
  schoolId: string;
  groupId: string | null;
  groupName: string | null;
  onShowAnalytics: (boardId?: string) => void;
}

const DURATION_OPTIONS = [
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 uur' },
  { value: 90, label: '1,5 uur' },
  { value: 120, label: '2 uur' },
];

export default function ActivityBoardsList({
  onSelectBoard,
  onBoardsChange,
  schoolId,
  groupId,
  groupName,
  onShowAnalytics,
}: ActivityBoardsListProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState<ActivityBoard[]>([]);
  const [templates, setTemplates] = useState<HoekenTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOtherGroups, setShowOtherGroups] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Template management
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<HoekenTemplate | null>(null);
  const [showDeleteTemplate, setShowDeleteTemplate] = useState<string | null>(null);

  // Activity preset create trigger
  const [showPresetsPage, setShowPresetsPage] = useState(false);

  // Schedule management
  const [showScheduleManager, setShowScheduleManager] = useState(false);

  // Group rules
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [groupStudents, setGroupStudents] = useState<{ id: string; first_name: string; last_name: string; color: string | null; profile_picture_url: string | null; symbol_url: string | null }[]>([]);
  const [groupPresets, setGroupPresets] = useState<{ id: string; name: string; color: string; icon: string }[]>([]);

  // Activate from template
  const [activateTemplate, setActivateTemplate] = useState<HoekenTemplate | null>(null);
  const [activateMode, setActivateMode] = useState<'now' | 'schedule'>('now');
  const [activateDuration, setActivateDuration] = useState(45);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Ad-hoc board
  const [showAdHocModal, setShowAdHocModal] = useState(false);
  const [adHocName, setAdHocName] = useState('');
  const [adHocDuration, setAdHocDuration] = useState(45);

  // Classroom map view
  useEffect(() => {
    loadData();
  }, [schoolId, groupId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadBoards(), loadTemplates()]);
    setLoading(false);
  };

  const loadBoards = async () => {
    const { data } = await supabase
      .from('activity_boards')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    setBoards(data || []);
  };

  const loadTemplates = async () => {
    const { data } = await supabase
      .from('hoekenwerk_templates')
      .select('*, school_hoekenwerk_icons(public_url), items:hoekenwerk_template_items(*, activity_presets(id, name, icon, color, max_students, goal_codes, custom_icon_id, school_hoekenwerk_icons(public_url)))')
      .eq('school_id', schoolId)
      .order('name');
    const mapped = (data || []).map((t: any) => ({
      ...t,
      custom_icon_url: t.school_hoekenwerk_icons?.public_url ?? null,
      items: (t.items || []).map((item: any) => ({
        ...item,
        activity_presets: item.activity_presets ? {
          ...item.activity_presets,
          custom_icon_url: item.activity_presets.school_hoekenwerk_icons?.public_url ?? null,
        } : null,
      })),
    }));
    setTemplates(mapped);
  };

  const loadRulesData = async () => {
    if (!groupId) return;
    const [studentsRes, presetsRes] = await Promise.all([
      supabase
        .from('student_groups')
        .select('students(id, first_name, last_name, color, profile_picture_url, symbol_url)')
        .eq('group_id', groupId),
      supabase.from('activity_presets').select('id, name, color, icon').eq('school_id', schoolId).order('name'),
    ]);
    const students = (studentsRes.data || [])
      .map((r: any) => r.students)
      .filter(Boolean)
      .sort((a: any, b: any) => a.first_name.localeCompare(b.first_name));
    setGroupStudents(students);
    setGroupPresets(presetsRes.data || []);
  };

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const activeBoards = boards.filter((b) => {
    if (b.archived_at) return false;
    if (b.active_until && new Date(b.active_until) < new Date()) return false;
    if (!b.activated_at && b.active_until && new Date(b.active_until) > new Date()) return false;
    return !!b.activated_at;
  });

  const scheduledBoards = boards.filter((b) => {
    if (b.archived_at) return false;
    if (!b.active_until) return false;
    if (!b.activated_at && new Date(b.active_until) > new Date()) return true;
    return false;
  });

  const archivedBoards = boards.filter((b) => {
    return !!b.archived_at || (b.active_until && new Date(b.active_until) < new Date());
  }).slice(0, 10);

  const ownGroupBoards = (list: ActivityBoard[]) =>
    groupId ? list.filter((b) => b.group_id === groupId) : list;
  const otherGroupBoards = (list: ActivityBoard[]) =>
    groupId ? list.filter((b) => b.group_id !== groupId) : [];

  const handleActivateTemplate = async () => {
    if (!activateTemplate || !user) return;

    try {
      const now = new Date();
      let activatedAt: string | null = null;
      let activeUntil: string;

      if (activateMode === 'now') {
        activatedAt = now.toISOString();
        activeUntil = new Date(now.getTime() + activateDuration * 60 * 1000).toISOString();
      } else {
        if (!scheduleDate || !scheduleTime) return;
        const scheduled = new Date(`${scheduleDate}T${scheduleTime}`);
        activeUntil = new Date(scheduled.getTime() + activateDuration * 60 * 1000).toISOString();
        activatedAt = null;
      }

      const { data: newBoard, error: boardError } = await supabase
        .from('activity_boards')
        .insert({
          school_id: schoolId,
          name: activateTemplate.name,
          description: activateTemplate.description,
          is_active: true,
          created_by: user.id,
          group_id: groupId,
          template_id: activateTemplate.id,
          activated_at: activatedAt,
          activated_by: user.id,
          active_until: activeUntil,
        })
        .select('id')
        .single();

      if (boardError) throw boardError;

      const activityInserts = activateTemplate.items
        .filter((item) => item.activity_presets != null)
        .map((item) => ({
        board_id: newBoard.id,
        name: item.activity_presets!.name,
        icon: item.activity_presets!.icon ?? 'Palette',
        color: item.activity_presets!.color ?? '#3B82F6',
        max_students: item.max_students_override ?? item.activity_presets!.max_students,
        custom_icon_id: item.activity_presets!.custom_icon_id || null,
        sort_order: item.sort_order,
        is_active: true,
      }));

      await supabase.from('activity_options').insert(activityInserts);

      if (activateMode === 'now' && groupId) {
        const goalTrackingInserts = activateTemplate.items
          .filter((item) => item.activity_presets?.goal_codes?.length)
          .map((item) => ({
            group_id: groupId,
            goal_codes: item.activity_presets!.goal_codes,
            activity_type: 'activity_preset',
            activity_name: item.activity_presets!.name,
            duration_minutes: activateDuration,
            repetitions: 1,
            practiced_at: activatedAt,
            created_by: user.id,
          }));
        if (goalTrackingInserts.length > 0) {
          await supabase.from('goal_tracking_sessions').insert(goalTrackingInserts);
        }
      }

      setActivateTemplate(null);
      notify(activateMode === 'now' ? 'Hoekenwerk gestart!' : 'Hoekenwerk ingepland!');
      loadBoards();
      onBoardsChange();
    } catch (error) {
      console.error('Error activating template:', error);
      notify('Fout bij activeren', 'error');
    }
  };

  const handleCreateAdHoc = async () => {
    if (!adHocName.trim() || !user) return;

    try {
      const now = new Date();
      const { error } = await supabase
        .from('activity_boards')
        .insert({
          school_id: schoolId,
          name: adHocName,
          is_active: true,
          created_by: user.id,
          group_id: groupId,
          activated_at: now.toISOString(),
          activated_by: user.id,
          active_until: new Date(now.getTime() + adHocDuration * 60 * 1000).toISOString(),
        });

      if (error) throw error;

      setShowAdHocModal(false);
      setAdHocName('');
      setAdHocDuration(45);
      notify('Leeg bord gestart!');
      loadBoards();
      onBoardsChange();
    } catch (error) {
      console.error('Error creating ad-hoc board:', error);
      notify('Fout bij aanmaken bord', 'error');
    }
  };

  const handleStopBoard = async (boardId: string) => {
    try {
      await supabase
        .from('activity_sessions')
        .update({ end_time: new Date().toISOString() })
        .eq('board_id', boardId)
        .is('end_time', null);

      await supabase
        .from('activity_boards')
        .update({ archived_at: new Date().toISOString(), active_until: new Date().toISOString() })
        .eq('id', boardId);

      notify('Bord gestopt');
      loadBoards();
    } catch (error) {
      console.error('Error stopping board:', error);
      notify('Fout bij stoppen', 'error');
    }
  };

  const handleCancelScheduled = async (boardId: string) => {
    try {
      await supabase
        .from('activity_boards')
        .update({ archived_at: new Date().toISOString(), is_active: false })
        .eq('id', boardId);

      notify('Gepland bord geannuleerd');
      loadBoards();
    } catch (error) {
      notify('Fout bij annuleren', 'error');
    }
  };

  const handleStartScheduledNow = async (board: ActivityBoard) => {
    if (!user) return;
    try {
      const now = new Date();
      const remainingMs = board.active_until
        ? new Date(board.active_until).getTime() - (board.activated_at ? new Date(board.activated_at).getTime() : now.getTime())
        : 45 * 60 * 1000;
      const newEnd = new Date(now.getTime() + Math.max(remainingMs, 15 * 60 * 1000));

      await supabase
        .from('activity_boards')
        .update({ activated_at: now.toISOString(), activated_by: user.id, active_until: newEnd.toISOString() })
        .eq('id', board.id);

      notify('Bord nu gestart!');
      loadBoards();
    } catch (error) {
      notify('Fout bij starten', 'error');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await supabase.from('hoekenwerk_template_items').delete().eq('template_id', templateId);
      await supabase.from('hoekenwerk_templates').delete().eq('id', templateId);
      setShowDeleteTemplate(null);
      notify('Template verwijderd');
      loadTemplates();
    } catch (error) {
      notify('Fout bij verwijderen', 'error');
    }
  };

  const renderIcon = (iconName: string, className: string = 'w-5 h-5', customIconUrl?: string | null) => {
    if (customIconUrl) {
      return <img src={customIconUrl} alt="" className={`object-cover rounded ${className}`} />;
    }
    if (iconName && /^[A-Z]/.test(iconName)) {
      const IconComponent = (LucideIcons as any)[iconName];
      if (IconComponent) return <IconComponent className={className} />;
    }
    return <span className={className}>{iconName}</span>;
  };

  const formatDateTime = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-2xl font-baloo text-deep-purple">Laden...</div>
      </div>
    );
  }

  const ownActive = ownGroupBoards(activeBoards);
  const otherActive = otherGroupBoards(activeBoards);
  const ownScheduled = ownGroupBoards(scheduledBoards);

  return (
    <div className="space-y-6">
      {/* Presets page view */}
      {showPresetsPage && groupId && (
        <div className="space-y-4">
          <button
            onClick={() => setShowPresetsPage(false)}
            className="bg-white p-3 rounded-full shadow-lg hover:scale-105 transition-transform text-deep-purple font-semibold flex items-center gap-2 text-sm px-5"
          >
            &#8592; Terug naar hoekenwerk
          </button>
          <ActivityPresetsManager groupId={groupId} schoolId={schoolId} />
        </div>
      )}

      {!showPresetsPage && (
      <>
      {/* Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-baloo text-deep-purple flex items-center gap-2">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              Hoekenwerk
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {groupName ? `Hoekenwerk voor ${groupName}` : 'Beheer je activiteitenborden'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {groupId && (
              <button
                onClick={() => setShowPresetsPage(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-lavender to-[#E8B4FF] text-white rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg text-sm"
              >
                <Plus className="w-4 h-4" />
                Hoeken
              </button>
            )}
            <button
              onClick={() => {
                setShowAdHocModal(true);
                setAdHocName('');
                setAdHocDuration(45);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              Leeg Bord
            </button>
            {groupId && (
              <button
                onClick={() => setShowScheduleManager(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg text-sm"
              >
                <Calendar className="w-4 h-4" />
                Roosters
              </button>
            )}
            {groupId && (
              <button
                onClick={async () => { await loadRulesData(); setShowRulesModal(true); }}
                className="px-4 py-2.5 bg-gradient-to-r from-deep-purple to-[#8B6CE0] text-white rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg text-sm"
              >
                <Shield className="w-4 h-4" />
                Regels
              </button>
            )}
            <button
              onClick={onShowAnalytics}
              className="px-4 py-2.5 bg-gradient-to-r from-grass-green to-[#B5F0BE] text-white rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Active Boards */}
      {(ownActive.length > 0 || otherActive.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-xl font-baloo text-deep-purple flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            Nu actief
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ownActive.map((board) => (
              <ActiveBoardCard
                key={board.id}
                board={board}
                onOpen={() => onSelectBoard(board)}
                onStop={() => handleStopBoard(board.id)}
              />
            ))}
          </div>

          {otherActive.length > 0 && (
            <div>
              <button
                onClick={() => setShowOtherGroups(!showOtherGroups)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-3"
              >
                {showOtherGroups ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showOtherGroups ? 'Andere groepen verbergen' : `${otherActive.length} bord(en) van andere groepen`}
              </button>
              {showOtherGroups && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {otherActive.map((board) => (
                    <ActiveBoardCard
                      key={board.id}
                      board={board}
                      onOpen={() => onSelectBoard(board)}
                      onStop={() => handleStopBoard(board.id)}
                      isOtherGroup
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scheduled Boards */}
      {ownScheduled.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-baloo text-deep-purple flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Gepland
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ownScheduled.map((board) => (
              <div key={board.id} className="bg-white border-2 border-amber-200 rounded-2xl p-5 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-baloo text-lg text-deep-purple">{board.name}</h3>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">Gepland</span>
                </div>
                {board.active_until && (
                  <p className="text-sm text-gray-600 mb-3">
                    Start: {formatDateTime(board.active_until)}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStartScheduledNow(board)}
                    className="flex-1 px-3 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Start nu
                  </button>
                  <button
                    onClick={() => handleCancelScheduled(board.id)}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Annuleer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Start Templates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-baloo text-deep-purple flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Snel activeren
          </h2>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setShowTemplateBuilder(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-deep-purple bg-deep-purple/10 rounded-xl hover:bg-deep-purple/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nieuw template
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center">
            <Layout className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-baloo text-lg text-deep-purple mb-1">Geen templates</h3>
            <p className="text-sm text-gray-500 mb-4">Maak een template aan met je favoriete hoeken-combinatie</p>
            <button
              onClick={() => {
                setEditingTemplate(null);
                setShowTemplateBuilder(true);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white rounded-xl font-semibold text-sm hover:scale-105 transition-transform shadow-md inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Eerste template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-sky-blue/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-deep-purple/10 flex items-center justify-center">
                      {renderIcon(template.icon, 'w-5 h-5 text-deep-purple', template.custom_icon_url)}
                    </div>
                    <div>
                      <h3 className="font-baloo text-lg text-deep-purple leading-tight">{template.name}</h3>
                      <p className="text-xs text-gray-500">{template.items.length} hoeken</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingTemplate(template);
                        setShowTemplateBuilder(true);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Bewerken"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => setShowDeleteTemplate(template.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      title="Verwijderen"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {template.items.filter(item => item.activity_presets != null).slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-white text-xs font-medium"
                      style={{ backgroundColor: item.activity_presets!.color ?? '#3B82F6' }}
                    >
                      {renderIcon(item.activity_presets!.icon ?? 'Palette', 'w-3 h-3 text-white', item.activity_presets!.custom_icon_url)}
                      <span className="truncate max-w-[80px]">{item.activity_presets!.name}</span>
                    </div>
                  ))}
                  {template.items.length > 6 && (
                    <span className="text-xs text-gray-500 px-2 py-1">+{template.items.length - 6}</span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setActivateTemplate(template);
                    setActivateMode('now');
                    setActivateDuration(45);
                    setScheduleDate('');
                    setScheduleTime('');
                  }}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white rounded-xl font-semibold text-sm hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-md"
                >
                  <Play className="w-4 h-4" />
                  Activeren
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {archivedBoards.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-baloo text-deep-purple flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Geschiedenis
          </h2>
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
            {archivedBoards.map((board) => (
              <div key={board.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Layout className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">{board.name}</h4>
                    <p className="text-xs text-gray-500">
                      {board.activated_at ? formatDateTime(board.activated_at) : formatDateTime(board.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onShowAnalytics(board.id)}
                    className="text-sm text-grass-green hover:text-deep-purple font-semibold flex items-center gap-1 transition-colors"
                    title="Bekijk analyse voor dit bord"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Analyse
                  </button>
                  <button
                    onClick={() => onSelectBoard(board)}
                    className="text-sm text-sky-blue hover:text-deep-purple font-semibold flex items-center gap-1 transition-colors"
                  >
                    Bekijk <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activate Template Modal */}
      {activateTemplate && (
        <Modal
          isOpen={!!activateTemplate}
          onClose={() => setActivateTemplate(null)}
          title={`${activateTemplate.name} activeren`}
        >
          <div className="space-y-5">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setActivateMode('now')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activateMode === 'now' ? 'bg-white shadow-md text-deep-purple' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Start nu
              </button>
              <button
                onClick={() => setActivateMode('schedule')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  activateMode === 'schedule' ? 'bg-white shadow-md text-deep-purple' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Plan in
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Duur</label>
              <div className="grid grid-cols-3 gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setActivateDuration(opt.value)}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      activateDuration === opt.value
                        ? 'bg-deep-purple text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {activateMode === 'schedule' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Datum</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tijd</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 p-3 bg-gray-50 rounded-xl">
              {activateTemplate.items.filter(item => item.activity_presets != null).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-white text-xs font-medium"
                  style={{ backgroundColor: item.activity_presets!.color ?? '#3B82F6' }}
                >
                  {renderIcon(item.activity_presets!.icon ?? 'Palette', 'w-3 h-3 text-white', item.activity_presets!.custom_icon_url)}
                  {item.activity_presets!.name}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActivateTemplate(null)}
                className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-baloo hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleActivateTemplate}
                disabled={activateMode === 'schedule' && (!scheduleDate || !scheduleTime)}
                className="flex-1 bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white px-6 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
              >
                {activateMode === 'now' ? 'Start' : 'Inplannen'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Ad-hoc Board Modal */}
      {showAdHocModal && (
        <Modal
          isOpen={showAdHocModal}
          onClose={() => setShowAdHocModal(false)}
          title="Nieuw Leeg Bord"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Naam *</label>
              <input
                type="text"
                value={adHocName}
                onChange={(e) => setAdHocName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none text-sm"
                placeholder="Bijv. Vrij spel"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Duur</label>
              <div className="grid grid-cols-3 gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAdHocDuration(opt.value)}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      adHocDuration === opt.value
                        ? 'bg-deep-purple text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAdHocModal(false)}
                className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-baloo hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleCreateAdHoc}
                disabled={!adHocName.trim()}
                className="flex-1 bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white px-6 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
              >
                Start
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Template Confirm */}
      {showDeleteTemplate && (
        <Modal
          isOpen={!!showDeleteTemplate}
          onClose={() => setShowDeleteTemplate(null)}
          title="Template Verwijderen"
          size="sm"
        >
          <div className="text-center space-y-4">
            <p className="text-gray-700">Weet je zeker dat je dit template wilt verwijderen?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteTemplate(null)}
                className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-baloo hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleDeleteTemplate(showDeleteTemplate)}
                className="flex-1 bg-gradient-to-r from-coral-pink to-[#FF8E8E] text-white px-6 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform"
              >
                Verwijder
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Template Builder */}
      <HoekenTemplateBuilder
        isOpen={showTemplateBuilder}
        onClose={() => {
          setShowTemplateBuilder(false);
          setEditingTemplate(null);
        }}
        onSaved={() => {
          loadTemplates();
          setShowTemplateBuilder(false);
          setEditingTemplate(null);
        }}
        schoolId={schoolId}
        editingTemplate={editingTemplate}
      />

      {/* Schedule Manager */}
      {groupId && groupName && (
        <HoekenScheduleManager
          isOpen={showScheduleManager}
          onClose={() => setShowScheduleManager(false)}
          schoolId={schoolId}
          groupId={groupId}
          groupName={groupName}
          templates={templates.map((t) => ({ id: t.id, name: t.name, icon: t.icon }))}
          onScheduleChanged={loadData}
        />
      )}

      {/* Group rules modal */}
      {showRulesModal && groupId && (
        <GroupBoardRulesModal
          groupId={groupId}
          students={groupStudents}
          activities={[]}
          presets={groupPresets}
          onClose={() => setShowRulesModal(false)}
          onRulesChanged={() => {}}
        />
      )}

      {/* Notification */}
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
      </>
      )}
    </div>
  );
}

function ActiveBoardCard({
  board,
  onOpen,
  onStop,
  isOtherGroup,
}: {
  board: ActivityBoard;
  onOpen: () => void;
  onStop: () => void;
  isOtherGroup?: boolean;
}) {
  return (
    <div className={`bg-white border-2 rounded-2xl p-5 shadow-md transition-all hover:shadow-lg ${
      isOtherGroup ? 'border-gray-200 opacity-80' : 'border-emerald-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-baloo text-lg text-deep-purple truncate">{board.name}</h3>
        {board.active_until && (
          <BoardCountdownTimer activeUntil={board.active_until} compact />
        )}
      </div>
      {board.activated_at && (
        <p className="text-xs text-gray-500 mb-3">
          Gestart om {new Date(board.activated_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={onOpen}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white rounded-xl font-semibold text-sm hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5"
        >
          <Users className="w-4 h-4" />
          Open
        </button>
        <button
          onClick={onStop}
          className="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-1.5"
        >
          <Square className="w-3.5 h-3.5" />
          Stop
        </button>
      </div>
    </div>
  );
}
