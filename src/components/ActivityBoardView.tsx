import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Users, Clock, Pause, X, Plus, CreditCard as Edit, Trash2, Save, Maximize, AlertCircle, Timer, Square, Hand, Upload, Shield, MapPin, List } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';
import BoardCountdownTimer from './BoardCountdownTimer';
import GroupBoardRulesModal from './GroupBoardRulesModal';
import ClassroomMapView from './ClassroomMapView';
import BoardMapView from './BoardMapView';
import { getActivityIcon } from '../lib/activityIcons';
import { uploadHoekenIcon } from '../utils/iconUpload';

interface ActivityBoard {
  id: string;
  name: string;
  description: string | null;
  group_id?: string | null;
  active_until?: string | null;
  activated_at?: string | null;
  archived_at?: string | null;
}

interface ActivityOption {
  id: string;
  name: string;
  description: string | null;
  max_students: number | null;
  color: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  custom_icon_id: string | null;
  custom_icon_url?: string | null;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  color: string | null;
  profile_picture_url: string | null;
  symbol_url: string | null;
}

interface ActivitySession {
  id: string;
  activity_option_id: string;
  student_id: string;
  start_time: string;
  student?: Student;
}

interface ActivityPreset {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  max_students: number | null;
  custom_icon_id: string | null;
  custom_icon_url?: string | null;
}

interface ActivityBoardViewProps {
  board: ActivityBoard;
  onBack: () => void;
  schoolId: string;
}

interface PairRestriction {
  id: string;
  student_id_a: string;
  student_id_b: string;
}

interface ActivityBlock {
  id: string;
  activity_option_id: string;
  student_id: string;
}

export default function ActivityBoardView({ board, onBack, schoolId }: ActivityBoardViewProps) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityOption[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<ActivitySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presets, setPresets] = useState<ActivityPreset[]>([]);
  const [editingActivity, setEditingActivity] = useState<ActivityOption | null>(null);
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number; student: Student } | null>(null);
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  // Tracks whether a mouse drag just finished so the subsequent click event is ignored
  const dragJustEndedRef = useRef(false);
  const [editingMaxStudents, setEditingMaxStudents] = useState<{ activityId: string; value: number } | null>(null);
  const [showExpiredOverlay, setShowExpiredOverlay] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [boardState, setBoardState] = useState({
    active_until: board.active_until,
    archived_at: board.archived_at,
  });

  const [activityFormData, setActivityFormData] = useState({
    name: '',
    description: '',
    max_students: null as number | null,
    color: '#3B82F6',
    icon: 'Palette',
    custom_icon_id: null as string | null,
    custom_icon_url: null as string | null,
  });

  const [iconUploading, setIconUploading] = useState(false);
  const iconFileInputRef = useRef<HTMLInputElement>(null);

  const [pairRestrictions, setPairRestrictions] = useState<PairRestriction[]>([]);
  const [activityBlocks, setActivityBlocks] = useState<ActivityBlock[]>([]);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showClassroomMap, setShowClassroomMap] = useState(false);

  const isExpired = boardState.archived_at != null ||
    (boardState.active_until != null && new Date(boardState.active_until) < new Date());

  useEffect(() => {
    loadData();
    loadPresets();
  }, [board.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`board-${board.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_sessions', filter: `board_id=eq.${board.id}` }, () => {
        loadSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [board.id]);

  const loadData = async () => {
    await Promise.all([loadActivities(), loadStudents(), loadSessions(), loadRules()]);
    setLoading(false);
  };

  const loadRules = async () => {
    if (!board.group_id) return;
    const [pairRes, blockRes] = await Promise.all([
      supabase
        .from('group_student_pair_restrictions')
        .select('id, student_id_a, student_id_b')
        .eq('group_id', board.group_id),
      supabase
        .from('group_activity_student_blocks')
        .select('id, activity_option_id, student_id')
        .eq('group_id', board.group_id),
    ]);
    setPairRestrictions(pairRes.data || []);
    setActivityBlocks(blockRes.data || []);
  };

  const loadActivities = async () => {
    const { data } = await supabase
      .from('activity_options')
      .select('*, school_hoekenwerk_icons(public_url)')
      .eq('board_id', board.id)
      .eq('is_active', true)
      .order('sort_order');
    const mapped = (data || []).map((a: any) => ({
      ...a,
      custom_icon_url: a.school_hoekenwerk_icons?.public_url ?? null,
    }));
    setActivities(mapped);
  };

  const loadStudents = async () => {
    if (board.group_id) {
      const { data } = await supabase
        .from('student_groups')
        .select('student:students(*)')
        .eq('group_id', board.group_id)
        .eq('students.is_active', true);

      const studentList = (data || [])
        .map((row: any) => row.student)
        .filter(Boolean)
        .sort((a: Student, b: Student) => a.first_name.localeCompare(b.first_name));
      setStudents(studentList);
    } else {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('first_name');
      setStudents(data || []);
    }
  };

  const loadSessions = async () => {
    const { data } = await supabase
      .from('activity_sessions')
      .select(`
        *,
        student:students(
          id, first_name, last_name, color, profile_picture_url, symbol_url
        )
      `)
      .eq('board_id', board.id)
      .is('end_time', null);
    setSessions(data || []);
  };

  const loadPresets = async () => {
    const { data } = await supabase
      .from('activity_presets')
      .select('*, school_hoekenwerk_icons(public_url)')
      .or(`school_id.is.null,school_id.eq.${schoolId}`)
      .order('name');
    const mapped = (data || []).map((p: any) => ({
      ...p,
      custom_icon_url: p.school_hoekenwerk_icons?.public_url ?? null,
    }));
    setPresets(mapped);
  };

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddPresetToBoard = async (preset: ActivityPreset) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from('activity_options')
      .select('id')
      .eq('board_id', board.id)
      .eq('name', preset.name)
      .eq('is_active', true)
      .maybeSingle();

    if (existing) {
      notify(`${preset.name} staat al op het bord!`, 'error');
      return;
    }

    const maxOrder = Math.max(...activities.map(a => a.sort_order), -1);
    await supabase.from('activity_options').insert({
      board_id: board.id,
      preset_id: preset.id,
      name: preset.name,
      description: preset.description,
      max_students: preset.max_students,
      color: preset.color,
      icon: preset.icon,
      custom_icon_id: preset.custom_icon_id || null,
      sort_order: maxOrder + 1,
      is_active: true,
    });

    notify(`${preset.name} toegevoegd!`);
    setShowPresetModal(false);
    loadActivities();
  };

  const handleCreateActivity = async () => {
    if (!activityFormData.name.trim() || !user) return;
    const maxOrder = Math.max(...activities.map(a => a.sort_order), -1);
    await supabase.from('activity_options').insert({
      board_id: board.id,
      name: activityFormData.name,
      description: activityFormData.description || null,
      max_students: activityFormData.max_students,
      color: activityFormData.color,
      icon: activityFormData.icon,
      custom_icon_id: activityFormData.custom_icon_id || null,
      sort_order: maxOrder + 1,
      is_active: true,
    });
    notify('Activiteit toegevoegd!');
    setShowActivityModal(false);
    resetActivityForm();
    loadActivities();
  };

  const handleUpdateActivity = async () => {
    if (!editingActivity || !activityFormData.name.trim()) return;
    await supabase
      .from('activity_options')
      .update({
        name: activityFormData.name,
        description: activityFormData.description || null,
        max_students: activityFormData.max_students,
        color: activityFormData.color,
        icon: activityFormData.icon,
        custom_icon_id: activityFormData.custom_icon_id || null,
      })
      .eq('id', editingActivity.id);
    notify('Activiteit bijgewerkt!');
    setShowActivityModal(false);
    setEditingActivity(null);
    resetActivityForm();
    loadActivities();
  };

  const handleDeleteActivity = async (activityId: string) => {
    await supabase.from('activity_options').update({ is_active: false }).eq('id', activityId);
    notify('Activiteit verwijderd');
    loadActivities();
  };

  const handleAssignStudent = async (studentId: string, activityId: string) => {
    if (!user || isExpired) return;

    // Activity block check
    const isBlocked = activityBlocks.some(
      b => b.activity_option_id === activityId && b.student_id === studentId
    );
    if (isBlocked) {
      notify('Deze leerling mag niet naar deze activiteit', 'error');
      return;
    }

    // Pair restriction check: who is currently in the target activity?
    const coStudents = sessions
      .filter(s => s.activity_option_id === activityId && s.student_id !== studentId)
      .map(s => s.student_id);
    const hasPairConflict = coStudents.some(coId => {
      const [a, b] = studentId < coId ? [studentId, coId] : [coId, studentId];
      return pairRestrictions.some(r => r.student_id_a === a && r.student_id_b === b);
    });
    if (hasPairConflict) {
      notify('Deze leerlingen mogen niet samen in dezelfde hoek', 'error');
      return;
    }

    const existingSession = sessions.find(s => s.student_id === studentId);
    if (existingSession) {
      await supabase.from('activity_sessions').update({ end_time: new Date().toISOString() }).eq('id', existingSession.id);
    }
    await supabase.from('activity_sessions').insert({
      board_id: board.id,
      activity_option_id: activityId,
      student_id: studentId,
      start_time: new Date().toISOString(),
      added_by: user.id,
    });
    loadSessions();
  };

  const handleRemoveStudent = async (sessionId: string) => {
    await supabase.from('activity_sessions').update({ end_time: new Date().toISOString() }).eq('id', sessionId);
    loadSessions();
  };

  const handleClearBoard = async () => {
    if (!confirm('Weet je zeker dat je alle studenten wilt verwijderen van het bord?')) return;
    await supabase
      .from('activity_sessions')
      .update({ end_time: new Date().toISOString() })
      .eq('board_id', board.id)
      .is('end_time', null);
    notify('Bord gewist!');
    loadSessions();
  };

  const handleStopBoard = async () => {
    await supabase
      .from('activity_sessions')
      .update({ end_time: new Date().toISOString() })
      .eq('board_id', board.id)
      .is('end_time', null);
    await supabase
      .from('activity_boards')
      .update({ archived_at: new Date().toISOString(), active_until: new Date().toISOString() })
      .eq('id', board.id);
    setBoardState({ archived_at: new Date().toISOString(), active_until: new Date().toISOString() });
    notify('Bord gestopt');
  };

  const handleExtendTime = async (minutes: number) => {
    const currentEnd = boardState.active_until ? new Date(boardState.active_until) : new Date();
    const base = currentEnd < new Date() ? new Date() : currentEnd;
    const newEnd = new Date(base.getTime() + minutes * 60 * 1000).toISOString();

    await supabase
      .from('activity_boards')
      .update({ active_until: newEnd, archived_at: null })
      .eq('id', board.id);

    setBoardState({ active_until: newEnd, archived_at: null });
    setShowExtendModal(false);
    setShowExpiredOverlay(false);
    notify(`Tijd verlengd met ${minutes} minuten`);
  };

  const handleUpdateMaxStudents = async (activityId: string, newMax: number) => {
    if (newMax < 1 || newMax > 20) return;
    await supabase.from('activity_options').update({ max_students: newMax }).eq('id', activityId);
    setEditingMaxStudents(null);
    loadActivities();
  };

  const openEditActivity = (activity: ActivityOption) => {
    setEditingActivity(activity);
    setActivityFormData({
      name: activity.name,
      description: activity.description || '',
      max_students: activity.max_students,
      color: activity.color ?? '#3B82F6',
      icon: activity.icon ?? 'Palette',
      custom_icon_id: activity.custom_icon_id,
      custom_icon_url: activity.custom_icon_url ?? null,
    });
    setShowActivityModal(true);
  };

  const resetActivityForm = () => {
    setActivityFormData({ name: '', description: '', max_students: null, color: '#3B82F6', icon: 'Palette', custom_icon_id: null, custom_icon_url: null });
  };

  // ── Tap-to-select interaction ──────────────────────────────────────────────
  const handleStudentTap = (student: Student) => {
    if (isExpired) return;
    if (dragJustEndedRef.current) { dragJustEndedRef.current = false; return; }
    if (selectedStudent?.id === student.id) {
      setSelectedStudent(null);
    } else {
      setSelectedStudent(student);
      if ('vibrate' in navigator) navigator.vibrate(30);
    }
  };

  const handleSlotTap = (activityId: string) => {
    if (!selectedStudent || isExpired) return;
    const activity = activities.find(a => a.id === activityId);
    const activitySessions = getActivitySessions(activityId);
    const isFull = activity?.max_students ? activitySessions.length >= activity.max_students : false;
    if (isFull) {
      notify('Deze activiteit is vol!', 'error');
      return;
    }
    handleAssignStudent(selectedStudent.id, activityId);
    if ('vibrate' in navigator) navigator.vibrate(60);
    setSelectedStudent(null);
  };

  const handleAssignedStudentTap = (student: Student, sessionId: string) => {
    if (isExpired) return;
    if (selectedStudent && selectedStudent.id !== student.id) {
      // Place selected student into the activity this student occupies
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        handleAssignStudent(selectedStudent.id, session.activity_option_id);
        setSelectedStudent(null);
        if ('vibrate' in navigator) navigator.vibrate(60);
      }
    } else {
      // Select this student for re-placement
      handleStudentTap(student);
    }
  };

  // ── Touch drag ────────────────────────────────────────────────────────────
  const handleTouchStart = (student: Student, e: React.TouchEvent) => {
    if (isExpired) return;
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setDraggedStudent(student);
    setIsDragging(false);
    if ('vibrate' in navigator) navigator.vibrate(50);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedStudent || !touchStartPos) return;
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);
    if (deltaX > 10 || deltaY > 10) {
      setIsDragging(true);
      setDragPreview({ x: touch.clientX, y: touch.clientY, student: draggedStudent });
      e.preventDefault();
      const scrollThreshold = 100;
      const scrollSpeed = 10;
      if (touch.clientY < scrollThreshold) window.scrollBy(0, -scrollSpeed);
      else if (touch.clientY > window.innerHeight - scrollThreshold) window.scrollBy(0, scrollSpeed);
      if (touch.clientX < scrollThreshold) window.scrollBy(-scrollSpeed, 0);
      else if (touch.clientX > window.innerWidth - scrollThreshold) window.scrollBy(scrollSpeed, 0);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!draggedStudent) return;

    if (!isDragging) {
      // It was a tap, not a drag → use tap-to-select flow
      handleStudentTap(draggedStudent);
      setDraggedStudent(null);
      setTouchStartPos(null);
      setDragPreview(null);
      return;
    }

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    let actionPerformed = false;
    if (element) {
      const activityCard = element.closest('[data-activity-id]');
      const unassignedArea = element.closest('[data-unassigned-area]');
      if (activityCard) {
        const activityId = activityCard.getAttribute('data-activity-id');
        if (activityId) {
          const activity = activities.find(a => a.id === activityId);
          const activitySessions = sessions.filter(s => s.activity_option_id === activityId);
          const isFull = activity?.max_students ? activitySessions.length >= activity.max_students : false;
          const isRestricted = draggedStudent ? restrictedActivityIds.has(activityId) : false;
          if (!isFull && !isRestricted) {
            handleAssignStudent(draggedStudent.id, activityId);
            actionPerformed = true;
          }
        }
      } else if (unassignedArea) {
        const existingSession = sessions.find(s => s.student_id === draggedStudent.id);
        if (existingSession) {
          handleRemoveStudent(existingSession.id);
          actionPerformed = true;
        }
      }
    }
    if (actionPerformed && 'vibrate' in navigator) navigator.vibrate(100);
    setDraggedStudent(null);
    setTouchStartPos(null);
    setIsDragging(false);
    setDragPreview(null);
  };

  const renderIcon = (iconName: string | null, className: string = '', customIconUrl?: string | null) => {
    if (customIconUrl) {
      return <img src={customIconUrl} alt="" className={`object-cover rounded ${className || 'w-6 h-6'}`} />;
    }
    if (iconName && /^[A-Z]/.test(iconName)) {
      const IconComponent = getActivityIcon(iconName);
      if (IconComponent) return <IconComponent className={className || "w-6 h-6"} />;
    }
    return <span className={className}>{iconName}</span>;
  };

  const handleIconFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = '';
    setIconUploading(true);
    try {
      const uploaded = await uploadHoekenIcon(file, schoolId, user.id);
      setActivityFormData(prev => ({ ...prev, custom_icon_id: uploaded.id, custom_icon_url: uploaded.public_url }));
    } catch (err) {
      console.error('Icon upload failed:', err);
    } finally {
      setIconUploading(false);
    }
  };

  const getUnassignedStudents = () => {
    const assignedIds = new Set(sessions.map(s => s.student_id));
    return students.filter(s => !assignedIds.has(s.id));
  };

  const getActivitySessions = (activityId: string) => sessions.filter(s => s.activity_option_id === activityId);
  const isActivityFull = (activity: ActivityOption) => {
    if (!activity.max_students) return false;
    return getActivitySessions(activity.id).length >= activity.max_students;
  };

  const commonIcons = ['Palette', 'BookOpen', 'Calculator', 'Building', 'Gamepad2', 'Music', 'Paintbrush', 'Scissors', 'Hammer', 'Users'];
  const commonColors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#EF4444'];

  const getRestrictedActivityIds = (studentId: string): Set<string> => {
    const restricted = new Set<string>();
    // Activities where this student is directly blocked
    activityBlocks.forEach(b => {
      if (b.student_id === studentId) restricted.add(b.activity_option_id);
    });
    // Activities where a pair-banned co-student is already sitting
    sessions.forEach(session => {
      if (session.student_id === studentId) return;
      const coId = session.student_id;
      const [a, b] = studentId < coId ? [studentId, coId] : [coId, studentId];
      if (pairRestrictions.some(r => r.student_id_a === a && r.student_id_b === b)) {
        restricted.add(session.activity_option_id);
      }
    });
    return restricted;
  };

  const activeStudent = draggedStudent || selectedStudent;
  const restrictedActivityIds = activeStudent ? getRestrictedActivityIds(activeStudent.id) : new Set<string>();

  const StudentAvatar = ({ student, size = 'md', isSelected = false }: { student: Student; size?: 'sm' | 'md' | 'lg'; isSelected?: boolean }) => {
    const bgColor = student.color || '#6B7280';
    const sizeClasses = { sm: 'w-14 h-14 text-xs', md: 'w-16 h-16 text-sm', lg: 'w-20 h-20 text-base' };
    const ringClass = isSelected ? 'ring-4 ring-sky-blue ring-offset-2 shadow-lg shadow-sky-blue/40' : '';

    if (student.profile_picture_url) {
      return (
        <div className={`${sizeClasses[size]} rounded-xl overflow-hidden flex-shrink-0 transition-all ${ringClass}`} style={{ backgroundColor: bgColor }}>
          <img src={student.profile_picture_url} alt={`${student.first_name}`} className="w-full h-full object-cover" />
        </div>
      );
    }
    if (student.symbol_url) {
      return (
        <div className={`${sizeClasses[size]} rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${ringClass}`} style={{ backgroundColor: bgColor }}>
          <img src={student.symbol_url} alt={`${student.first_name}`} className="w-2/3 h-2/3 object-contain" />
        </div>
      );
    }
    const initials = `${student.first_name[0]}${student.last_name[0]}`.toUpperCase();
    return (
      <div className={`${sizeClasses[size]} rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 transition-all ${ringClass}`} style={{ backgroundColor: bgColor }}>
        {initials}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-2xl font-baloo text-deep-purple">Laden...</div>
      </div>
    );
  }

  return (
    <div
      className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'p-4 sm:p-6 lg:p-8'}`}
      onClick={(e) => {
        // Deselect student if clicking on the board backdrop (not a student or slot)
        const target = e.target as HTMLElement;
        if (selectedStudent && !target.closest('[data-student-avatar]') && !target.closest('[data-slot]') && !target.closest('[data-activity-id]')) {
          setSelectedStudent(null);
        }
      }}
    >
      <div className="max-w-[1920px] mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl mb-4 flex-shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-6 h-6 text-deep-purple" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-baloo text-deep-purple">{board.name}</h1>
                <p className="text-sm text-gray-600">
                  {sessions.length} leerlingen actief / {activities.length} activiteiten
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {boardState.active_until && !isExpired && (
                <BoardCountdownTimer
                  activeUntil={boardState.active_until}
                  onExpired={() => setShowExpiredOverlay(true)}
                />
              )}
              {!isExpired && (
                <button
                  onClick={() => setShowExtendModal(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Tijd verlengen"
                >
                  <Timer className="w-5 h-5 text-deep-purple" />
                </button>
              )}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Volledig scherm"
              >
                <Maximize className="w-5 h-5 text-deep-purple" />
              </button>
              {board.group_id && (
                <button
                  onClick={() => setShowRulesModal(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Groepsregels"
                >
                  <Shield className="w-5 h-5 text-deep-purple" />
                </button>
              )}
              <button
                onClick={() => setShowClassroomMap(v => !v)}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-semibold ${showClassroomMap ? 'bg-sky-blue/20 text-sky-blue' : 'hover:bg-gray-100 text-gray-600'}`}
                title={showClassroomMap ? 'Schakel naar lijst' : 'Schakel naar klasbeeld'}
              >
                {showClassroomMap ? <List className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                <span className="hidden sm:inline">{showClassroomMap ? 'Lijst' : 'Klasbeeld'}</span>
              </button>
              {!isExpired && (
                <>
                  <button
                    onClick={() => setShowPresetModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Activiteit</span>
                  </button>
                  <button
                    onClick={handleStopBoard}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Square className="w-4 h-4" />
                    <span className="hidden sm:inline">Stop</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Selection hint banner */}
        {selectedStudent && !isExpired && (
          <div className="flex-shrink-0 mb-4 animate-fade-in">
            <div className="bg-sky-blue/10 border-2 border-sky-blue rounded-2xl px-5 py-3 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ backgroundColor: selectedStudent.color || '#6B7280' }}>
                  {selectedStudent.profile_picture_url
                    ? <img src={selectedStudent.profile_picture_url} className="w-full h-full object-cover" alt="" />
                    : selectedStudent.symbol_url
                    ? <img src={selectedStudent.symbol_url} className="w-full h-full object-contain p-1" alt="" />
                    : <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">{selectedStudent.first_name[0]}{selectedStudent.last_name[0]}</div>
                  }
                </div>
                <p className="font-baloo text-sky-blue text-lg">
                  <span className="font-bold">{selectedStudent.first_name}</span> geselecteerd — tik op een activiteit om in te delen!
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-xl hover:bg-sky-blue/20 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-sky-blue" />
              </button>
            </div>
          </div>
        )}

        {/* Main content — list or classroom map view */}
        {showClassroomMap ? (
          <div className="flex-1 overflow-y-auto">
            <BoardMapView
              schoolId={schoolId}
              groupId={board.group_id ?? null}
              boardId={board.id}
              activities={activities}
              students={students}
              sessions={sessions}
              selectedStudent={selectedStudent}
              isExpired={isExpired}
              onStudentTap={handleStudentTap}
              onSlotTap={handleSlotTap}
              onAssignedStudentTap={handleAssignedStudentTap}
            />
          </div>
        ) : (
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Unassigned sidebar */}
          <div
            className={`w-48 md:w-64 bg-white rounded-3xl p-4 shadow-xl overflow-y-auto flex-shrink-0 transition-all ${
              draggedStudent && sessions.find(s => s.student_id === draggedStudent.id) ? 'ring-4 ring-coral-pink/50' : ''
            }`}
            data-unassigned-area="true"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedStudent) {
                const existingSession = sessions.find(s => s.student_id === draggedStudent.id);
                if (existingSession) handleRemoveStudent(existingSession.id);
              }
            }}
          >
            <h3 className="text-base font-baloo text-deep-purple mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Niet ingedeeld
              </span>
              <span className="text-sm bg-deep-purple/10 px-2 py-1 rounded-full">
                {getUnassignedStudents().length}
              </span>
            </h3>
            <div className="flex flex-col gap-2">
              {getUnassignedStudents().length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">Alle leerlingen ingedeeld</p>
              ) : (
                getUnassignedStudents().map((student) => {
                  const isSelected = selectedStudent?.id === student.id;
                  return (
                    <button
                      key={student.id}
                      data-student-avatar="true"
                      onClick={() => handleStudentTap(student)}
                      draggable={!isExpired}
                      onDragStart={() => { if (!isExpired) { dragJustEndedRef.current = false; setDraggedStudent(student); } }}
                      onDragEnd={() => { dragJustEndedRef.current = true; setDraggedStudent(null); setTimeout(() => { dragJustEndedRef.current = false; }, 300); }}
                      onTouchStart={(e) => handleTouchStart(student, e)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all touch-none text-left
                        ${isSelected
                          ? 'bg-sky-blue/10 scale-[1.03] shadow-md'
                          : 'hover:bg-gray-50 active:scale-[0.97]'
                        }
                        ${draggedStudent?.id === student.id && isDragging ? 'opacity-30' : ''}
                        ${isExpired ? 'opacity-50 cursor-default' : 'cursor-pointer'}
                      `}
                    >
                      <div className="relative flex-shrink-0">
                        <StudentAvatar student={student} size="md" isSelected={isSelected} />
                        {isSelected && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-sky-blue rounded-full flex items-center justify-center shadow">
                            <Hand className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-baloo text-sm truncate leading-tight ${isSelected ? 'text-sky-blue font-bold' : 'text-deep-purple'}`}>
                          {student.first_name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{student.last_name}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Activity grid */}
          <div className="flex-1 bg-white rounded-3xl p-6 shadow-xl overflow-y-auto">
            {activities.length === 0 ? (
              <div className="text-center py-16">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-baloo text-deep-purple mb-2">Geen activiteiten</h3>
                <p className="text-gray-600 mb-4">Voeg activiteiten toe om te beginnen</p>
                <button
                  onClick={() => setShowPresetModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white rounded-xl font-semibold hover:scale-105 transition-transform inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Eerste Activiteit
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {activities.map((activity) => {
                  const activitySessions = getActivitySessions(activity.id);
                  const isFull = isActivityFull(activity);
                  const maxStudents = activity.max_students || 4;
                  const isRestricted = restrictedActivityIds.has(activity.id);
                  const isTargetable = selectedStudent && !isFull && !isExpired && !isRestricted;

                  return (
                    <div
                      key={activity.id}
                      data-activity-id={activity.id}
                      onClick={() => {
                        if (dragJustEndedRef.current) { dragJustEndedRef.current = false; return; }
                        if (selectedStudent && !isFull && !isExpired && !isRestricted) handleSlotTap(activity.id);
                      }}
                      className={`rounded-2xl overflow-hidden shadow-lg transition-all relative
                        ${isExpired ? 'opacity-60' :
                          isRestricted && activeStudent
                            ? 'opacity-40 cursor-not-allowed'
                            : isTargetable
                            ? 'ring-4 ring-sky-blue shadow-2xl scale-[1.02] cursor-pointer'
                            : draggedStudent && !isFull && !isRestricted
                            ? 'ring-4 ring-sky-blue/50 shadow-2xl scale-[1.02]'
                            : draggedStudent && (isFull || isRestricted)
                            ? 'opacity-40'
                            : 'hover:shadow-xl'
                        }
                      `}
                      onDragOver={(e) => { if (!isFull && !isExpired && !isRestricted) e.preventDefault(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedStudent && !isFull && !isExpired && !isRestricted) handleAssignStudent(draggedStudent.id, activity.id);
                      }}
                    >
                      <div className="p-3 text-white relative" style={{ backgroundColor: activity.color ?? '#3B82F6' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="bg-white/20 p-1.5 rounded">
                            {renderIcon(activity.icon ?? 'Palette', 'w-5 h-5 text-white', activity.custom_icon_url)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-baloo text-base truncate">{activity.name}</h4>
                            {editingMaxStudents?.activityId === activity.id ? (
                              <div className="flex items-center gap-1 mt-1">
                                <input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={editingMaxStudents.value}
                                  onChange={(e) => setEditingMaxStudents({ activityId: activity.id, value: parseInt(e.target.value) || 1 })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateMaxStudents(activity.id, editingMaxStudents.value);
                                    else if (e.key === 'Escape') setEditingMaxStudents(null);
                                  }}
                                  className="w-14 px-2 py-0.5 text-sm text-deep-purple rounded border-2 border-white focus:outline-none"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <button onClick={(e) => { e.stopPropagation(); handleUpdateMaxStudents(activity.id, editingMaxStudents.value); }} className="p-0.5 bg-white/20 hover:bg-white/30 rounded">
                                  <Save className="w-3 h-3" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setEditingMaxStudents(null); }} className="p-0.5 bg-white/20 hover:bg-white/30 rounded">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-xs opacity-90">
                                <span>{activitySessions.length}/{maxStudents}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingMaxStudents({ activityId: activity.id, value: maxStudents }); }}
                                  className="p-0.5 hover:bg-white/20 rounded transition-colors"
                                  title="Aantal plaatsen wijzigen"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-white">
                        <div className="grid grid-cols-3 gap-2 justify-items-start">
                          {Array.from({ length: maxStudents }).map((_, index) => {
                            const session = activitySessions[index];
                            if (session?.student) {
                              const isSessionStudentSelected = selectedStudent?.id === session.student.id;
                              return (
                                <div
                                  key={session.id}
                                  data-student-avatar="true"
                                  className={`relative group touch-none transition-all
                                    ${draggedStudent?.id === session.student.id && isDragging ? 'opacity-30' : ''}
                                    ${!isExpired ? 'cursor-pointer' : ''}
                                  `}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAssignedStudentTap(session.student!, session.id);
                                  }}
                                >
                                  <div
                                    draggable={!isExpired}
                                    onDragStart={() => { if (!isExpired) { dragJustEndedRef.current = false; setDraggedStudent(session.student!); } }}
                                    onDragEnd={() => { dragJustEndedRef.current = true; setDraggedStudent(null); setTimeout(() => { dragJustEndedRef.current = false; }, 300); }}
                                    onTouchStart={(e) => handleTouchStart(session.student!, e)}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                  >
                                    <StudentAvatar student={session.student} size="sm" isSelected={isSessionStudentSelected} />
                                  </div>
                                  <p className="text-center text-[10px] text-gray-500 mt-1 truncate w-14 leading-tight">
                                    {session.student.first_name}
                                  </p>
                                  {!isExpired && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleRemoveStudent(session.id); }}
                                      className="absolute -top-1 -right-1 p-0.5 bg-coral-pink text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              );
                            }
                            return (
                              <button
                                key={`empty-${index}`}
                                data-slot={activity.id}
                                onClick={(e) => { e.stopPropagation(); if (!isRestricted) handleSlotTap(activity.id); }}
                                className={`w-14 h-14 border-2 rounded-xl flex flex-col items-center justify-center transition-all
                                  ${isTargetable
                                    ? 'border-sky-blue bg-sky-blue/10 text-sky-blue animate-pulse cursor-pointer hover:bg-sky-blue/20 hover:scale-110'
                                    : 'border-dashed border-gray-300 text-gray-400 cursor-default'
                                  }
                                `}
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Expired Overlay */}
      {showExpiredOverlay && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-baloo text-deep-purple mb-2">Tijd is om!</h2>
            <p className="text-gray-600 mb-6">Het activiteitenbord is verlopen. Wil je de tijd verlengen?</p>
            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-baloo hover:bg-gray-50 transition-colors"
              >
                Terug
              </button>
              <button
                onClick={() => handleExtendTime(15)}
                className="flex-1 bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white px-6 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform"
              >
                Verleng 15 min
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Time Modal */}
      {showExtendModal && (
        <Modal isOpen={showExtendModal} onClose={() => setShowExtendModal(false)} title="Tijd Verlengen" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Hoeveel tijd wil je toevoegen?</p>
            <div className="grid grid-cols-2 gap-3">
              {[10, 15, 30, 45].map((m) => (
                <button
                  key={m}
                  onClick={() => handleExtendTime(m)}
                  className="py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-sky-blue hover:text-white transition-colors"
                >
                  +{m} min
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Add Activity Modal */}
      {showActivityModal && (
        <Modal
          isOpen={showActivityModal}
          onClose={() => { setShowActivityModal(false); setEditingActivity(null); resetActivityForm(); }}
          title={editingActivity ? 'Bewerk Activiteit' : 'Nieuwe Activiteit'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Naam *</label>
              <input
                type="text"
                value={activityFormData.name}
                onChange={(e) => setActivityFormData({ ...activityFormData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-sky-blue focus:outline-none"
                placeholder="Bijv. Rekenhoek"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Max Leerlingen</label>
              <input
                type="number"
                value={activityFormData.max_students || ''}
                onChange={(e) => setActivityFormData({ ...activityFormData, max_students: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-sky-blue focus:outline-none"
                placeholder="Onbeperkt"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Icoon</label>
              <div className="flex flex-wrap gap-2">
                {commonIcons.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setActivityFormData({ ...activityFormData, icon, custom_icon_id: null, custom_icon_url: null })}
                    className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                      activityFormData.icon === icon && !activityFormData.custom_icon_url ? 'bg-sky-blue text-white scale-110' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {renderIcon(icon, 'w-6 h-6')}
                  </button>
                ))}
              </div>

              {/* Custom icon upload */}
              <div className="mt-3 flex items-center gap-3">
                {activityFormData.custom_icon_url ? (
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-lg overflow-hidden ring-4 ring-sky-blue ring-offset-2 flex-shrink-0">
                      <img src={activityFormData.custom_icon_url} alt="Eigen icoon" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm text-sky-blue font-semibold">Eigen icoon</span>
                    <button
                      onClick={() => setActivityFormData(prev => ({ ...prev, custom_icon_id: null, custom_icon_url: null }))}
                      className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 transition-colors"
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
                    onClick={() => setActivityFormData({ ...activityFormData, color })}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      activityFormData.color === color ? 'ring-4 ring-offset-2 ring-sky-blue scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <label
                  className={`w-10 h-10 rounded-lg cursor-pointer flex items-center justify-center border-2 border-dashed transition-all hover:scale-110 ${
                    !commonColors.includes(activityFormData.color) ? 'ring-4 ring-offset-2 ring-sky-blue scale-110' : 'border-gray-300'
                  }`}
                  style={!commonColors.includes(activityFormData.color) ? { backgroundColor: activityFormData.color, borderColor: activityFormData.color } : {}}
                  title="Kies eigen kleur"
                >
                  <input
                    type="color"
                    className="sr-only"
                    value={activityFormData.color}
                    onChange={(e) => setActivityFormData({ ...activityFormData, color: e.target.value })}
                  />
                  {commonColors.includes(activityFormData.color) && (
                    <span className="text-gray-400 text-lg leading-none">+</span>
                  )}
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => { setShowActivityModal(false); setEditingActivity(null); resetActivityForm(); }}
                className="flex-1 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-baloo hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={editingActivity ? handleUpdateActivity : handleCreateActivity}
                disabled={!activityFormData.name.trim()}
                className="flex-1 bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white px-6 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform disabled:opacity-50"
              >
                {editingActivity ? 'Bijwerken' : 'Toevoegen'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Preset Picker Modal */}
      {showPresetModal && (
        <Modal isOpen={showPresetModal} onClose={() => setShowPresetModal(false)} title="Kies een Activiteit">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {presets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Geen presets gevonden</p>
              </div>
            ) : (
              presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleAddPresetToBoard(preset)}
                  className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-sky-blue hover:shadow-md transition-all flex items-center gap-4 text-left"
                >
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: preset.color ?? '#3B82F6' }}>
                    {renderIcon(preset.icon, 'w-6 h-6 text-white', preset.custom_icon_url)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-baloo text-lg text-deep-purple">{preset.name}</h3>
                    {preset.description && <p className="text-sm text-gray-600">{preset.description}</p>}
                    {preset.max_students && <p className="text-xs text-gray-500 mt-1">Max {preset.max_students} leerlingen</p>}
                  </div>
                </button>
              ))
            )}
            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={() => { setShowPresetModal(false); resetActivityForm(); setShowActivityModal(true); }}
                className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-sky-blue hover:bg-sky-blue/5 transition-all flex items-center gap-4 text-left text-gray-600 hover:text-sky-blue"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-baloo text-lg">Eigen activiteit aanmaken</p>
                  <p className="text-sm opacity-70">Zelf naam, kleur en icoon kiezen</p>
                </div>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Group rules modal */}
      {showRulesModal && board.group_id && (
        <GroupBoardRulesModal
          groupId={board.group_id}
          students={students}
          activities={activities}
          presets={presets.map(p => ({ id: p.id, name: p.name, color: p.color, icon: p.icon }))}
          onClose={() => setShowRulesModal(false)}
          onRulesChanged={loadRules}
        />
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
          <div className={`px-6 py-4 rounded-full shadow-xl font-baloo text-white ${
            notification.type === 'success'
              ? 'bg-gradient-to-r from-grass-green to-[#B5F0BE]'
              : 'bg-gradient-to-r from-coral-pink to-[#FF8E8E]'
          }`}>
            {notification.message}
          </div>
        </div>
      )}

      {/* Drag preview */}
      {dragPreview && (
        <div
          ref={dragPreviewRef}
          className="fixed pointer-events-none z-[100] scale-110 drop-shadow-2xl"
          style={{ left: dragPreview.x - 32, top: dragPreview.y - 32, transition: 'none' }}
        >
          <div className="relative">
            <StudentAvatar student={dragPreview.student} size="md" />
            <div className="absolute inset-0 rounded-xl ring-4 ring-sky-blue/50" />
          </div>
        </div>
      )}
    </div>
  );
}
