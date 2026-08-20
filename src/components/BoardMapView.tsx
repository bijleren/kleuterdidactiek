import { useState, useEffect, useRef, ReactNode } from 'react';
import { MapPin, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getActivityIcon } from '../lib/activityIcons';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  color: string | null;
  profile_picture_url: string | null;
  symbol_url: string | null;
}

interface ActivityOption {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  max_students: number | null;
  custom_icon_url?: string | null;
}

interface ActivitySession {
  id: string;
  activity_option_id: string;
  student_id: string;
}

interface Hotspot {
  id: string;
  map_id: string;
  activity_option_id: string | null;
  label: string;
  x_percent: number;
  y_percent: number;
  color: string;
  max_students: number;
}

interface ClassroomMap {
  id: string;
  name: string;
  image_url: string;
}

interface BoardMapViewProps {
  schoolId: string;
  groupId: string | null;
  boardId: string;
  activities: ActivityOption[];
  students: Student[];
  sessions: ActivitySession[];
  selectedStudent: Student | null;
  isExpired: boolean;
  onStudentTap: (student: Student) => void;
  onSlotTap: (activityId: string) => void;
  onAssignedStudentTap: (student: Student, sessionId: string) => void;
}

function renderIcon(icon: string | null, className = 'w-5 h-5 text-white'): ReactNode {
  if (!icon) return <MapPin className={className} />;
  const Icon = getActivityIcon(icon);
  if (!Icon) return <MapPin className={className} />;
  return <Icon className={className} />;
}

function StudentAvatar({ student, isSelected, dim, onClick }: {
  student: Student;
  isSelected: boolean;
  dim: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2 transition-all shadow-md
        ${isSelected ? 'border-sky-blue scale-110 ring-2 ring-sky-blue/40' : dim ? 'border-white opacity-40' : 'border-white hover:scale-105'}`}
      style={{ backgroundColor: student.color || '#6B7280' }}
      title={`${student.first_name} ${student.last_name}`}
    >
      {student.profile_picture_url ? (
        <img src={student.profile_picture_url} className="w-full h-full object-cover" alt="" />
      ) : student.symbol_url ? (
        <img src={student.symbol_url} className="w-full h-full object-contain p-1" alt="" />
      ) : (
        <span className="text-white text-xs font-bold leading-none flex items-center justify-center h-full">
          {student.first_name[0]}{student.last_name[0]}
        </span>
      )}
    </button>
  );
}

export default function BoardMapView({
  schoolId,
  groupId,
  boardId,
  activities,
  students,
  sessions,
  selectedStudent,
  isExpired,
  onStudentTap,
  onSlotTap,
  onAssignedStudentTap,
}: BoardMapViewProps) {
  const [maps, setMaps] = useState<ClassroomMap[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const imageRef = useRef<HTMLDivElement>(null);

  const selectedMap = maps.find(m => m.id === selectedMapId) ?? null;

  useEffect(() => {
    loadMaps();
  }, [schoolId, groupId]);

  useEffect(() => {
    if (selectedMapId) loadHotspots(selectedMapId);
    else setHotspots([]);
  }, [selectedMapId]);

  const loadMaps = async () => {
    setLoading(true);
    const query = supabase
      .from('classroom_maps')
      .select('id, name, image_url')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });
    if (groupId) query.eq('group_id', groupId);
    const { data } = await query;
    const result = data || [];
    setMaps(result);
    if (result.length > 0) setSelectedMapId(result[0].id);
    setLoading(false);
  };

  const loadHotspots = async (mapId: string) => {
    const { data } = await supabase
      .from('classroom_hotspots')
      .select('*')
      .eq('map_id', mapId)
      .order('sort_order');
    setHotspots(data || []);
  };

  const getSessionsForActivity = (activityId: string) =>
    sessions.filter(s => s.activity_option_id === activityId);

  const getStudentById = (id: string) => students.find(s => s.id === id);

  const getUnassignedStudents = () => {
    const assignedIds = new Set(sessions.map(s => s.student_id));
    return students.filter(s => !assignedIds.has(s.id));
  };

  const handleHotspotTap = (hs: Hotspot) => {
    if (isExpired || !hs.activity_option_id) return;
    if (selectedStudent) {
      onSlotTap(hs.activity_option_id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">Klaskaart laden...</div>
    );
  }

  if (maps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <MapPin className="w-12 h-12 text-gray-300" />
        <p className="text-gray-500 font-semibold">Nog geen klaskaart</p>
        <p className="text-sm text-gray-400">Ga naar Hoekenwerk &gt; Klaslokaal om een kaart te maken</p>
      </div>
    );
  }

  const unassigned = getUnassignedStudents();

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Map selector if multiple */}
      {maps.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {maps.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMapId(m.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${selectedMapId === m.id ? 'bg-deep-purple text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      {/* Unassigned students strip */}
      <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-gray-500 flex items-center gap-1.5 flex-shrink-0">
            <Users className="w-4 h-4" />
            Niet ingedeeld
            <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full font-bold">
              {unassigned.length}
            </span>
          </span>
          <div className="flex flex-wrap gap-2">
            {unassigned.length === 0 ? (
              <span className="text-sm text-emerald-600 font-medium">Alle leerlingen ingedeeld!</span>
            ) : (
              unassigned.map(student => (
                <StudentAvatar
                  key={student.id}
                  student={student}
                  isSelected={selectedStudent?.id === student.id}
                  dim={selectedStudent != null && selectedStudent.id !== student.id}
                  onClick={() => onStudentTap(student)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      {selectedMap && (
        <div className="flex-1 bg-white rounded-3xl shadow-xl overflow-hidden min-h-0">
          <div ref={imageRef} className="relative select-none overflow-hidden">
            <img
              src={selectedMap.image_url}
              alt={selectedMap.name}
              className="w-full h-auto block max-h-[60vh] object-contain bg-gray-50"
              draggable={false}
            />

            {/* Hotspots with student clusters */}
            {hotspots.map(hs => {
              const activity = hs.activity_option_id
                ? activities.find(a => a.id === hs.activity_option_id) ?? null
                : null;
              const activeSessions = hs.activity_option_id
                ? getSessionsForActivity(hs.activity_option_id)
                : [];
              const maxSlots = activity?.max_students ?? hs.max_students ?? 4;
              const emptySlots = Math.max(0, maxSlots - activeSessions.length);
              const isTargetable = !!hs.activity_option_id && !!selectedStudent && !isExpired;

              return (
                <div
                  key={hs.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{ left: `${hs.x_percent}%`, top: `${hs.y_percent}%` }}
                >
                  <div className="flex flex-col items-center gap-1">
                    {/* Students + empty slots arranged around pin */}
                    {(activeSessions.length > 0 || emptySlots > 0) && (
                      <div className="flex flex-wrap justify-center gap-1 max-w-32 mb-1">
                        {activeSessions.map(session => {
                          const student = getStudentById(session.student_id);
                          if (!student) return null;
                          return (
                            <StudentAvatar
                              key={session.id}
                              student={student}
                              isSelected={selectedStudent?.id === student.id}
                              dim={selectedStudent != null && selectedStudent.id !== student.id}
                              onClick={() => onAssignedStudentTap(student, session.id)}
                            />
                          );
                        })}
                        {Array.from({ length: emptySlots }).map((_, i) => (
                          <button
                            key={`empty-${i}`}
                            onClick={(e) => { e.stopPropagation(); if (hs.activity_option_id) onSlotTap(hs.activity_option_id); }}
                            className={`w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center transition-all flex-shrink-0
                              ${isTargetable ? 'border-sky-blue bg-sky-blue/10 scale-105 animate-pulse' : 'border-gray-300 bg-gray-50 opacity-60'}`}
                            disabled={!isTargetable}
                          >
                            {isTargetable && <span className="text-sky-blue text-lg font-bold">+</span>}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Pin */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleHotspotTap(hs); }}
                      className={`flex flex-col items-center gap-0.5 transition-transform ${isTargetable ? 'hover:scale-110' : ''}`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white transition-all
                          ${isTargetable ? 'ring-sky-blue/50 scale-105' : ''}`}
                        style={{ backgroundColor: activity?.color ?? hs.color }}
                      >
                        {activity ? (
                          activity.custom_icon_url ? (
                            <img src={activity.custom_icon_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            renderIcon(activity.icon)
                          )
                        ) : (
                          <MapPin className="w-6 h-6 text-white" />
                        )}
                      </div>

                      <div className="bg-white/95 backdrop-blur-sm rounded-lg px-2 py-0.5 shadow-md border border-gray-100">
                        <div className="text-xs font-bold text-gray-800 whitespace-nowrap max-w-24 truncate text-center">
                          {activity?.name ?? hs.label}
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          {activeSessions.length}/{maxSlots}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
