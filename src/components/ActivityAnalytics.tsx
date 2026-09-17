import { useEffect, useState } from 'react';
import { BarChart3, Download, Users, Clock, TrendingUp, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toLocalDateString } from '../utils/dateUtils';

interface ActivityAnalyticsProps {
  schoolId: string;
  initialBoardId?: string;
}

interface ActivitySession {
  id: string;
  board_id: string;
  activity_option_id: string;
  student_id: string;
  start_time: string;
  end_time: string | null;
  feedback_rating: number | null;
  teacher_notes: string | null;
  students: {
    id: string;
    first_name: string;
    last_name: string;
    profile_picture_url: string | null;
    color: string | null;
    symbol_url: string | null;
  };
  activity_options: {
    name: string;
    color: string;
  };
  activity_boards: {
    name: string;
  };
}

interface ActivityStat {
  activity_name: string;
  total_sessions: number;
  total_minutes: number;
  avg_minutes: number;
  unique_students: number;
  color: string;
}

interface StudentStat {
  student_id: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  color: string | null;
  symbol_url: string | null;
  total_sessions: number;
  total_minutes: number;
  activities: {
    name: string;
    count: number;
    minutes: number;
    color: string;
  }[];
}

interface CollaborationStat {
  student_id: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  sessions_together: number;
  total_minutes: number;
}

interface Board {
  id: string;
  name: string;
}

export default function ActivityAnalytics({ schoolId, initialBoardId }: ActivityAnalyticsProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>(initialBoardId ?? 'all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [sessions, setSessions] = useState<ActivitySession[]>([]);
  const [loading, setLoading] = useState(true);

  const [activityStats, setActivityStats] = useState<ActivityStat[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStat[]>([]);
  const [collaborationStats, setCollaborationStats] = useState<CollaborationStat[]>([]);

  useEffect(() => {
    loadBoards();
  }, [schoolId]);

  useEffect(() => {
    loadSessions();
  }, [schoolId, selectedBoardId, selectedStudentId, dateRange]);

  useEffect(() => {
    calculateStatistics();
  }, [sessions, selectedStudentId]);

  const loadBoards = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_boards')
        .select('id, name')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      setBoards(data || []);
    } catch (error) {
      console.error('Error loading boards:', error);
    }
  };

  const loadSessions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('activity_sessions')
        .select(`
          *,
          students!inner (
            id,
            first_name,
            last_name,
            profile_picture_url,
            color,
            symbol_url
          ),
          activity_options!inner (
            name,
            color
          ),
          activity_boards!inner (
            name,
            school_id
          )
        `)
        .not('end_time', 'is', null)
        .eq('activity_boards.school_id', schoolId);

      if (selectedBoardId !== 'all') {
        query = query.eq('board_id', selectedBoardId);
      }

      if (selectedStudentId !== 'all') {
        query = query.eq('student_id', selectedStudentId);
      }

      const dateFilter = getDateFilter();
      if (dateFilter) {
        query = query.gte('start_time', dateFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case 'all':
        return null;
      default:
        return null;
    }
  };

  const calculateStatistics = async () => {
    const activityMap = new Map<string, ActivityStat>();
    const studentMap = new Map<string, StudentStat>();

    sessions.forEach((session) => {
      if (!session.end_time) return;

      const duration = (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000;

      const activityKey = session.activity_option_id;
      if (!activityMap.has(activityKey)) {
        activityMap.set(activityKey, {
          activity_name: session.activity_options.name,
          total_sessions: 0,
          total_minutes: 0,
          avg_minutes: 0,
          unique_students: 0,
          color: session.activity_options.color,
        });
      }
      const activityStat = activityMap.get(activityKey)!;
      activityStat.total_sessions++;
      activityStat.total_minutes += duration;

      const studentKey = session.student_id;
      if (!studentMap.has(studentKey)) {
        studentMap.set(studentKey, {
          student_id: session.students.id,
          first_name: session.students.first_name,
          last_name: session.students.last_name,
          profile_picture_url: session.students.profile_picture_url,
          color: session.students.color,
          symbol_url: session.students.symbol_url,
          total_sessions: 0,
          total_minutes: 0,
          activities: [],
        });
      }
      const studentStat = studentMap.get(studentKey)!;
      studentStat.total_sessions++;
      studentStat.total_minutes += duration;
    });

    activityMap.forEach((stat) => {
      const uniqueStudents = new Set(
        sessions
          .filter((s) => s.activity_option_id === sessions.find((ses) => ses.activity_options.name === stat.activity_name)?.activity_option_id)
          .map((s) => s.student_id)
      );
      stat.unique_students = uniqueStudents.size;
      stat.avg_minutes = stat.total_sessions > 0 ? stat.total_minutes / stat.total_sessions : 0;
    });

    studentMap.forEach((studentStat) => {
      const activityBreakdown = new Map<string, { name: string; count: number; minutes: number; color: string }>();

      sessions
        .filter((s) => s.student_id === studentStat.student_id && s.end_time)
        .forEach((session) => {
          const activityName = session.activity_options.name;
          const duration = (new Date(session.end_time!).getTime() - new Date(session.start_time).getTime()) / 60000;

          if (!activityBreakdown.has(activityName)) {
            activityBreakdown.set(activityName, { name: activityName, count: 0, minutes: 0, color: session.activity_options.color });
          }
          const activity = activityBreakdown.get(activityName)!;
          activity.count++;
          activity.minutes += duration;
        });

      studentStat.activities = Array.from(activityBreakdown.values())
        .sort((a, b) => b.count - a.count);
    });

    setActivityStats(Array.from(activityMap.values()).sort((a, b) => b.total_minutes - a.total_minutes));
    setStudentStats(Array.from(studentMap.values()).sort((a, b) => b.total_minutes - a.total_minutes));

    if (selectedStudentId !== 'all') {
      await loadCollaborationStats();
    } else {
      setCollaborationStats([]);
    }
  };

  const loadCollaborationStats = async () => {
    if (selectedStudentId === 'all') return;

    try {
      const { data, error } = await supabase
        .from('activity_collaboration_logs')
        .select(`
          *,
          session_1:activity_sessions!session_id_1(student_id),
          session_2:activity_sessions!session_id_2(student_id)
        `)
        .or(`session_id_1.in.(${sessions.map(s => s.id).join(',')}),session_id_2.in.(${sessions.map(s => s.id).join(',')})`)
        .gte('start_time', getDateFilter() || '1970-01-01');

      if (error) throw error;

      const collaborationMap = new Map<string, CollaborationStat>();

      data?.forEach((log: any) => {
        const partnerId = log.session_1?.student_id === selectedStudentId ? log.session_2?.student_id : log.session_1?.student_id;
        if (!partnerId) return;

        const partnerSession = sessions.find(s => s.student_id === partnerId);
        if (!partnerSession) return;

        if (!collaborationMap.has(partnerId)) {
          collaborationMap.set(partnerId, {
            student_id: partnerId,
            first_name: partnerSession.students.first_name,
            last_name: partnerSession.students.last_name,
            profile_picture_url: partnerSession.students.profile_picture_url,
            sessions_together: 0,
            total_minutes: 0,
          });
        }

        const stat = collaborationMap.get(partnerId)!;
        stat.sessions_together++;
        stat.total_minutes += log.duration_minutes;
      });

      setCollaborationStats(Array.from(collaborationMap.values()).sort((a, b) => b.total_minutes - a.total_minutes));
    } catch (error) {
      console.error('Error loading collaboration stats:', error);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}u ${mins}m`;
  };

  const exportToExcel = async () => {
    // xlsx is ~284 kB: pas laden wanneer iemand echt exporteert,
    // niet bij het opstarten van de app.
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    const activityData = activityStats.map((stat) => ({
      Activiteit: stat.activity_name,
      Sessies: stat.total_sessions,
      'Totale tijd': formatDuration(stat.total_minutes),
      'Gem. tijd': formatDuration(stat.avg_minutes),
      'Unieke leerlingen': stat.unique_students,
    }));
    const ws1 = XLSX.utils.json_to_sheet(activityData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Activiteitstijd');

    if (selectedStudentId !== 'all' && collaborationStats.length > 0) {
      const collaborationData = collaborationStats.map((stat) => ({
        Leerling: `${stat.first_name} ${stat.last_name}`,
        'Aantal keer samengewerkt': `${stat.sessions_together}x`,
        'Totale tijd samengewerkt': formatDuration(stat.total_minutes),
      }));
      const ws2 = XLSX.utils.json_to_sheet(collaborationData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Samenwerking');
    }

    const detailedData = sessions
      .filter((s) => s.end_time)
      .map((session) => {
        const duration = (new Date(session.end_time!).getTime() - new Date(session.start_time).getTime()) / 60000;
        return {
          Activiteit: session.activity_options.name,
          Leerling: `${session.students.first_name} ${session.students.last_name}`,
          Datum: new Date(session.start_time).toLocaleString('nl-NL'),
          Duur: formatDuration(duration),
          Beoordeling: session.feedback_rating ? '⭐'.repeat(session.feedback_rating) : '-',
          Notities: session.teacher_notes || '-',
        };
      });
    const ws3 = XLSX.utils.json_to_sheet(detailedData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Gedetailleerd logboek');

    const boardName = selectedBoardId === 'all' ? 'Alle borden' : boards.find((b) => b.id === selectedBoardId)?.name || 'board';
    const studentName = selectedStudentId === 'all' ? 'alle_leerlingen' : studentStats.find((s) => s.student_id === selectedStudentId)?.first_name || 'student';
    const dateRangeText = { today: 'vandaag', week: 'afgelopen_week', month: 'afgelopen_maand', all: 'alle_tijd' }[dateRange];
    const filename = `activitijd_analyses_${boardName}_${studentName}_${dateRangeText}_${toLocalDateString(new Date())}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  const getDateRangeText = () => {
    switch (dateRange) {
      case 'today':
        return 'Vandaag';
      case 'week':
        return 'Afgelopen week';
      case 'month':
        return 'Afgelopen maand';
      case 'all':
        return 'Alle tijd';
    }
  };

  const renderStudentAvatar = (student: { profile_picture_url: string | null; color: string | null; first_name: string; last_name: string }) => {
    if (student.profile_picture_url) {
      return (
        <img
          src={student.profile_picture_url}
          alt={`${student.first_name} ${student.last_name}`}
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    }

    const initials = `${student.first_name[0]}${student.last_name[0]}`.toUpperCase();
    const bgColor = student.color || '#6B7280';

    return (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
        style={{ backgroundColor: bgColor }}
      >
        {initials}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-2xl font-baloo text-deep-purple">Laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-sky-blue to-[#7EDCD5] p-3 rounded-xl">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-baloo text-deep-purple">Activi-Tijd Analytics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bord</label>
            <select
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-blue"
            >
              <option value="all">Alle borden</option>
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Leerling</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-blue"
            >
              <option value="all">Alle leerlingen</option>
              {studentStats.map((student) => (
                <option key={student.student_id} value={student.student_id}>
                  {student.first_name} {student.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Periode</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-blue"
            >
              <option value="today">Vandaag</option>
              <option value="week">Afgelopen week</option>
              <option value="month">Afgelopen maand</option>
              <option value="all">Alle tijd</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={exportToExcel}
              className="w-full bg-grass-green text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Exporteer Excel
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-sky-blue/10 to-lavender/10 rounded-xl p-4 border-2 border-sky-blue/30">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Weergave:</span> {getDateRangeText()} •{' '}
            {selectedBoardId === 'all' ? 'Alle borden' : boards.find((b) => b.id === selectedBoardId)?.name} •{' '}
            {selectedStudentId === 'all' ? 'Alle leerlingen' : `${studentStats.find((s) => s.student_id === selectedStudentId)?.first_name}`} •{' '}
            {sessions.length} sessies
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-sky-blue" />
          <h3 className="text-xl font-baloo text-deep-purple">Activiteitsstatistieken</h3>
        </div>

        {activityStats.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Geen data beschikbaar voor de geselecteerde filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Activiteit</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Sessies</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Totale tijd</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Gem. tijd</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Leerlingen</th>
                </tr>
              </thead>
              <tbody>
                {activityStats.map((stat, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: stat.color }}></div>
                        <span className="font-medium">{stat.activity_name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">{stat.total_sessions}</td>
                    <td className="text-right py-3 px-4 font-medium text-sky-blue">{formatDuration(stat.total_minutes)}</td>
                    <td className="text-right py-3 px-4">{formatDuration(stat.avg_minutes)}</td>
                    <td className="text-right py-3 px-4">{stat.unique_students}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedStudentId === 'all' && studentStats.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-grass-green" />
            <h3 className="text-xl font-baloo text-deep-purple">Leerlingoverzicht</h3>
          </div>

          <div className="space-y-3">
            {studentStats.map((student, index) => (
              <div key={student.student_id} className="bg-gradient-to-r from-cream to-white rounded-xl p-4 border-2 border-gray-200 hover:shadow-lg transition-all">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl font-baloo text-deep-purple w-8 flex-shrink-0">{index + 1}</span>
                    {renderStudentAvatar(student)}
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-800 truncate">
                        {student.first_name} {student.last_name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {student.total_sessions} sessies • {formatDuration(student.total_minutes)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedStudentId(student.student_id)}
                    className="flex-shrink-0 bg-sky-blue text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 transition-transform text-sm"
                  >
                    Bekijk details
                  </button>
                </div>

                {student.activities.length > 0 && (() => {
                  const totalCount = student.activities.reduce((sum, a) => sum + a.count, 0);
                  return (
                    <div>
                      {/* Proportional color bar */}
                      <div className="flex h-4 rounded-full overflow-hidden gap-px">
                        {student.activities.map((activity, i) => (
                          <div
                            key={i}
                            className="transition-all"
                            style={{
                              width: `${(activity.count / totalCount) * 100}%`,
                              backgroundColor: activity.color || '#6B7280',
                              minWidth: 4,
                            }}
                            title={`${activity.name}: ${activity.count}x`}
                          />
                        ))}
                      </div>
                      {/* Legend */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                        {student.activities.map((activity, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: activity.color || '#6B7280' }} />
                            <span className="font-medium text-gray-700">{activity.name}</span>
                            <span>{activity.count}x</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedStudentId !== 'all' && collaborationStats.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-coral-pink" />
            <h3 className="text-xl font-baloo text-deep-purple">Samenwerking</h3>
          </div>

          <div className="space-y-3">
            {collaborationStats.map((collab) => (
              <div key={collab.student_id} className="bg-gradient-to-r from-coral-pink/10 to-white rounded-xl p-4 border-2 border-coral-pink/30">
                <div className="flex items-center gap-4">
                  {renderStudentAvatar(collab)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">
                      {collab.first_name} {collab.last_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {collab.sessions_together}x samengewerkt • {formatDuration(collab.total_minutes)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedStudentId !== 'all' && (
        <div className="bg-white rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-6 h-6 text-deep-purple" />
            <h3 className="text-xl font-baloo text-deep-purple">Gedetailleerd logboek</h3>
          </div>

          <div className="space-y-2">
            {sessions
              .filter((s) => s.end_time)
              .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
              .map((session) => {
                const duration = (new Date(session.end_time!).getTime() - new Date(session.start_time).getTime()) / 60000;
                return (
                  <div key={session.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: session.activity_options.color }}></div>
                        <span className="font-semibold text-gray-800">{session.activity_options.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{new Date(session.start_time).toLocaleString('nl-NL')}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-gray-600">Duur: {formatDuration(duration)}</span>
                      {session.feedback_rating && (
                        <span className="text-gray-600">Beoordeling: {'⭐'.repeat(session.feedback_rating)}</span>
                      )}
                    </div>
                    {session.teacher_notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">{session.teacher_notes}</p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
