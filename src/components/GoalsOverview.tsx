import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Target, BarChart2, Search, CheckCircle, ArrowRight, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { compareGoalCodes } from '../utils/goalSort';
import { SCHOOLJAAR_EIND, SCHOOLJAAR_START, getSchoolYearWeeks, getWeekNumber } from '../utils/schooljaar';
import NetLeeftijdFilter from './NetLeeftijdFilter';
import { DoelNetBadges } from './NetBadges';
import {
  NET_CODES,
  bewaarFilter,
  leesNetEnLeeftijd,
  loadDoelNetInfo,
  voldoetAanNetLeeftijd,
  type DoelNetInfo,
  type Leeftijd,
  type NetCode,
} from '../lib/leerplandoelen';

interface GoalsOverviewProps {
  groupId: string;
}

interface Goal {
  code: string;
  domain: string;
  subject: string;
  title: string;
  description: string;
  sort_order: number;
}

interface GoalWithProgress extends Goal {
  total_sessions: number;
  total_repetitions: number;
  last_practiced_at: string | null;
  first_practiced_at: string | null;
  progress_category: 'not_started' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  lessons?: LessonInfo[];
}

interface LessonInfo {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

interface ContentCounts {
  vocabulary: number;
  games: number;
  writing: number;
  tasks: number;
  videos: number;
  materials: number;
  activities: number;
  routines: number;
}

const categoryColors = {
  not_started: 'bg-gray-100 text-gray-600',
  beginner: 'bg-yellow-100 text-yellow-800',
  intermediate: 'bg-blue-100 text-blue-800',
  advanced: 'bg-sky-100 text-sky-800',
  expert: 'bg-grass-green text-white',
};

const categoryLabels = {
  not_started: 'Niet geoefend',
  beginner: '1-5x',
  intermediate: '5-20x',
  advanced: '20-50x',
  expert: '50+x',
};

const domainLabels: Record<string, string> = {
  '1': '📖 Nederlands',
  '2': '🔢 Wiskunde',
  '3': '🔬 Wetenschap',
  '4': '🌍 Aardrijkskunde',
  '5': '📜 Geschiedenis',
  '6': '🎨 Muzische vorming',
  '7': '🏃 Lichamelijke opvoeding',
  '8': '🤝 Sociale vaardigheden',
  '9': '💚 Attitudes',
};

const getProgressCategory = (sessions: number): 'not_started' | 'beginner' | 'intermediate' | 'advanced' | 'expert' => {
  if (sessions === 0) return 'not_started';
  if (sessions <= 5) return 'beginner';
  if (sessions <= 20) return 'intermediate';
  if (sessions <= 50) return 'advanced';
  return 'expert';
};

export default function GoalsOverview({ groupId }: GoalsOverviewProps) {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'code' | 'progress' | 'title'>('code');
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalWithProgress | null>(null);
  const [practiceNotes, setPracticeNotes] = useState('');
  const [weeklyData, setWeeklyData] = useState<Map<string, Set<number>>>(new Map());
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const timelineRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [contentCounts, setContentCounts] = useState<Map<string, ContentCounts>>(new Map());
  const [doelNetInfo, setDoelNetInfo] = useState<Map<string, DoelNetInfo>>(new Map());
  const [netFilter, setNetFilter] = useState<NetCode | 'all'>(() => leesNetEnLeeftijd().net);
  const [leeftijdFilter, setLeeftijdFilter] = useState<Leeftijd | 'all'>(
    () => leesNetEnLeeftijd().leeftijd
  );

  const kiesNet = (n: NetCode | 'all') => {
    setNetFilter(n);
    bewaarFilter('kd.netFilter', n);
  };
  const kiesLeeftijd = (l: Leeftijd | 'all') => {
    setLeeftijdFilter(l);
    bewaarFilter('kd.leeftijdFilter', l);
  };

  useEffect(() => {
    loadGoals();
  }, [groupId]);

  useEffect(() => {
    if (!loading && goals.length > 0) {
      loadLessonsData();
      loadContentCounts();
    }
  }, [loading, goals.length, groupId]);

  const loadGoals = async () => {
    try {
      // Apart van de Promise.all hieronder: een niet-Postgrest belofte in
      // dezelfde array maakt het elementtype een union en verstoort de
      // typeinferentie van de andere resultaten.
      loadDoelNetInfo().then(setDoelNetInfo);

      const [goalsResult, progressResult, sessionsResult] = await Promise.all([
        supabase.from('educational_goals').select('*').order('sort_order'),
        supabase.from('group_goal_progress').select('*').eq('group_id', groupId),
        // Weken server-side samengevat per code: het aantal sessies groeit
        // onbeperkt, het aantal codes niet.
        supabase.rpc('doel_weken', {
          p_group_id: groupId,
          p_van: SCHOOLJAAR_START,
          p_tot: SCHOOLJAAR_EIND,
        } as never),
      ]);

      if (goalsResult.error) throw goalsResult.error;
      if (progressResult.error) throw progressResult.error;
      if (sessionsResult.error) throw sessionsResult.error;

      const progressMap = new Map(
        progressResult.data?.map((p) => [
          p.goal_code,
          {
            total_sessions: p.total_sessions,
            total_repetitions: p.total_repetitions,
            last_practiced_at: p.last_practiced_at,
            first_practiced_at: p.first_practiced_at,
          },
        ]) || []
      );

      const weeklyMap = new Map<string, Set<number>>();
      for (const r of (sessionsResult.data ?? []) as unknown as {
        code: string;
        weken: number[];
      }[]) {
        weeklyMap.set(r.code, new Set(r.weken ?? []));
      }

      setWeeklyData(weeklyMap);

      const goalsWithProgress: GoalWithProgress[] = (goalsResult.data || []).map((goal) => {
        const progress = progressMap.get(goal.code);
        const sessions = progress?.total_sessions || 0;
        return {
          ...goal,
          total_sessions: sessions,
          total_repetitions: progress?.total_repetitions || 0,
          last_practiced_at: progress?.last_practiced_at || null,
          first_practiced_at: progress?.first_practiced_at || null,
          progress_category: getProgressCategory(sessions),
          lessons: [],
        };
      });

      setGoals(goalsWithProgress);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContentCounts = async () => {
    try {
      const [vocabularyResult, gamesResult, writingResult, tasksResult, videoGoalsResult, materialGoalsResult, activitiesResult, routineGoalsResult] = await Promise.all([
        supabase.from('vocabulary_words').select('word, goal_codes'),
        supabase.from('learning_games').select('name, goal_codes'),
        supabase.from('writing_exercises').select('title, goal_codes'),
        supabase.from('physical_tasks').select('title, goal_codes'),
        supabase.from('educational_video_goals').select('video_id, goal_code'),
        supabase.from('educational_material_goals').select('material_id, goal_code'),
        supabase.from('activity_presets').select('name, goal_codes'),
        supabase.from('routine_goals').select('routine_id, goal_code'),
      ]);

      const countsMap = new Map<string, ContentCounts>();

      goals.forEach(goal => {
        countsMap.set(goal.code, {
          vocabulary: 0,
          games: 0,
          writing: 0,
          tasks: 0,
          videos: 0,
          materials: 0,
          activities: 0,
          routines: 0,
        });
      });

      vocabularyResult.data?.forEach(item => {
        item.goal_codes?.forEach((code: string) => {
          const counts = countsMap.get(code);
          if (counts) counts.vocabulary++;
        });
      });

      gamesResult.data?.forEach(item => {
        item.goal_codes?.forEach((code: string) => {
          const counts = countsMap.get(code);
          if (counts) counts.games++;
        });
      });

      writingResult.data?.forEach(item => {
        item.goal_codes?.forEach((code: string) => {
          const counts = countsMap.get(code);
          if (counts) counts.writing++;
        });
      });

      tasksResult.data?.forEach(item => {
        item.goal_codes?.forEach((code: string) => {
          const counts = countsMap.get(code);
          if (counts) counts.tasks++;
        });
      });

      const videosByGoal = new Map<string, Set<string>>();
      videoGoalsResult.data?.forEach(item => {
        if (!videosByGoal.has(item.goal_code)) {
          videosByGoal.set(item.goal_code, new Set());
        }
        videosByGoal.get(item.goal_code)!.add(item.video_id);
      });
      videosByGoal.forEach((videos, goalCode) => {
        const counts = countsMap.get(goalCode);
        if (counts) counts.videos = videos.size;
      });

      const materialsByGoal = new Map<string, Set<string>>();
      materialGoalsResult.data?.forEach(item => {
        if (!materialsByGoal.has(item.goal_code)) {
          materialsByGoal.set(item.goal_code, new Set());
        }
        materialsByGoal.get(item.goal_code)!.add(item.material_id);
      });
      materialsByGoal.forEach((materials, goalCode) => {
        const counts = countsMap.get(goalCode);
        if (counts) counts.materials = materials.size;
      });

      activitiesResult.data?.forEach(item => {
        item.goal_codes?.forEach((code: string) => {
          const counts = countsMap.get(code);
          if (counts) counts.activities++;
        });
      });

      const routinesByGoal = new Map<string, Set<string>>();
      routineGoalsResult.data?.forEach(item => {
        if (!routinesByGoal.has(item.goal_code)) {
          routinesByGoal.set(item.goal_code, new Set());
        }
        routinesByGoal.get(item.goal_code)!.add(item.routine_id);
      });
      routinesByGoal.forEach((routines, goalCode) => {
        const counts = countsMap.get(goalCode);
        if (counts) counts.routines = routines.size;
      });

      setContentCounts(countsMap);
    } catch (error) {
      console.error('Error loading content counts:', error);
    }
  };

  const loadLessonsData = async () => {
    if (lessonsLoading) return;

    setLessonsLoading(true);
    try {
      const { data: lessonGoalsData, error: lessonGoalsError } = await supabase
        .from('lesson_goals')
        .select(`
          goal_code,
          lesson_id,
          lesson_start_time,
          lessons (
            id,
            title,
            start_time,
            end_time
          )
        `)
        .eq('group_id', groupId)
        .gte('lesson_start_time', '2025-09-01')
        .lte('lesson_start_time', '2026-06-30')
        .order('lesson_start_time', { ascending: false });

      if (lessonGoalsError) throw lessonGoalsError;

      const { start: schoolYearStart } = getSchoolYearWeeks();
      const weeklyMap = new Map(weeklyData);
      const goalLessonsMap = new Map<string, LessonInfo[]>();
      const futureLessonsCountMap = new Map<string, number>();

      for (const row of lessonGoalsData || []) {
        if (!row.lessons) continue;

        const lesson = row.lessons as any;
        const lessonInfo: LessonInfo = {
          id: lesson.id,
          title: lesson.title,
          start_time: lesson.start_time,
          end_time: lesson.end_time,
        };

        if (!goalLessonsMap.has(row.goal_code)) {
          goalLessonsMap.set(row.goal_code, []);
        }
        const existingLessons = goalLessonsMap.get(row.goal_code)!;
        if (!existingLessons.find(l => l.id === lessonInfo.id)) {
          existingLessons.push(lessonInfo);
        }

        const lessonDate = new Date(row.lesson_start_time);
        const weekNum = getWeekNumber(lessonDate, schoolYearStart);

        if (!weeklyMap.has(row.goal_code)) {
          weeklyMap.set(row.goal_code, new Set());
        }
        weeklyMap.get(row.goal_code)!.add(weekNum);

        if (lessonDate > new Date()) {
          futureLessonsCountMap.set(
            row.goal_code,
            (futureLessonsCountMap.get(row.goal_code) || 0) + 1
          );
        }
      }

      setWeeklyData(weeklyMap);

      const updatedGoals = goals.map((goal) => {
        const completedSessions = goal.total_sessions;
        const futureSessions = futureLessonsCountMap.get(goal.code) || 0;
        const totalSessions = completedSessions + futureSessions;

        return {
          ...goal,
          total_sessions: totalSessions,
          progress_category: getProgressCategory(totalSessions),
          lessons: goalLessonsMap.get(goal.code) || [],
        };
      });

      setGoals(updatedGoals);
    } catch (error) {
      console.error('Error loading lessons data:', error);
    } finally {
      setLessonsLoading(false);
    }
  };

  const toggleDomain = (domain: string) => {
    setDomainFilter((prev) => {
      if (prev.includes(domain)) {
        return prev.filter((d) => d !== domain);
      } else {
        return [...prev, domain];
      }
    });
  };

  const selectAllDomains = () => {
    setDomainFilter(Object.keys(domainLabels));
  };

  const hideAllDomains = () => {
    setDomainFilter([]);
  };

  const filteredGoals = goals
    .filter((g) => {
      if (filter !== 'all' && g.progress_category !== filter) return false;
      if (domainFilter.length > 0 && !domainFilter.includes(g.domain)) return false;
      if (!voldoetAanNetLeeftijd(doelNetInfo.get(g.code), netFilter, leeftijdFilter))
        return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          g.code.toLowerCase().includes(query) ||
          g.title.toLowerCase().includes(query) ||
          g.description.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'code') return a.sort_order - b.sort_order;
      if (sortBy === 'progress') return b.total_sessions - a.total_sessions;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  const stats = {
    total: goals.length,
    not_started: goals.filter((g) => g.progress_category === 'not_started').length,
    beginner: goals.filter((g) => g.progress_category === 'beginner').length,
    intermediate: goals.filter((g) => g.progress_category === 'intermediate').length,
    advanced: goals.filter((g) => g.progress_category === 'advanced').length,
    expert: goals.filter((g) => g.progress_category === 'expert').length,
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handlePracticeGoal = (goal: GoalWithProgress) => {
    setSelectedGoal(goal);
    setPracticeNotes('');
    setShowPracticeModal(true);
  };

  const submitPractice = async () => {
    if (!selectedGoal) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('goal_tracking_sessions').insert({
        group_id: groupId,
        goal_codes: [selectedGoal.code],
        activity_type: 'general',
        activity_name: 'Handmatig gelogd',
        repetitions: 1,
        notes: practiceNotes.trim() || null,
        created_by: user.id,
      });

      await loadGoals();
      await loadLessonsData();
      setShowPracticeModal(false);
      setSelectedGoal(null);
      setPracticeNotes('');
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  };

  const scrollToCurrentWeek = (goalCode: string) => {
    const timelineContainer = timelineRefs.current.get(goalCode);
    if (!timelineContainer) return;

    const { start: schoolYearStart } = getSchoolYearWeeks();
    const currentWeekNum = getWeekNumber(new Date(), schoolYearStart);

    const weekWidth = timelineContainer.scrollWidth / getSchoolYearWeeks().weeks.length;
    const scrollPosition = (currentWeekNum * weekWidth) - (timelineContainer.clientWidth / 2) + (weekWidth / 2);

    timelineContainer.scrollTo({
      left: Math.max(0, scrollPosition),
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    if (!loading && goals.length > 0) {
      setTimeout(() => {
        goals.forEach(goal => scrollToCurrentWeek(goal.code));
      }, 100);
    }
  }, [loading, goals]);

  const exportWeekMatrix = async () => {
    // xlsx is ~284 kB: pas laden wanneer iemand echt exporteert,
    // niet bij het opstarten van de app.
    const XLSX = await import('xlsx');
    const { weeks } = getSchoolYearWeeks();
    const sortedGoals = [...goals].sort((a, b) => a.sort_order - b.sort_order);

    const weekHeaders = weeks.map((w, i) => {
      const d = w.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' });
      return `W${i + 1} (${d})`;
    });

    const header = ['Doelcode', 'Domein', 'Titel', ...weekHeaders];
    const rows = sortedGoals.map((goal) => {
      const practicedWeeks = weeklyData.get(goal.code) || new Set<number>();
      const weekCols = weeks.map((_, i) => (practicedWeeks.has(i) ? 1 : 0));
      return [goal.code, goal.domain, goal.title, ...weekCols];
    });

    const wsData = [header, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Doelen per week');
    XLSX.writeFile(wb, `doelen-weekoverzicht-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-2xl font-baloo text-deep-purple">Doelen laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-baloo text-deep-purple mb-3 sm:mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 sm:w-6 sm:h-6" />
              Alle Onderwijsdoelen
              {lessonsLoading && (
                <span className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-normal animate-pulse">
                  Lessen laden...
                </span>
              )}
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              Volledig overzicht van {goals.length} kleuterdoelen met voortgangstracking per groep.
            </p>
          </div>
          <button
            onClick={exportWeekMatrix}
            className="flex-shrink-0 inline-flex items-center gap-2 bg-gradient-to-r from-deep-purple to-lavender text-white px-4 py-2 rounded-2xl font-baloo text-sm shadow-lg hover:scale-105 transition-transform"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporteer weekmatrix</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-lg text-center">
          <div className="text-2xl sm:text-3xl font-baloo text-deep-purple">{stats.total}</div>
          <div className="text-xs sm:text-sm text-gray-600">Totaal</div>
        </div>
        <div className="bg-gray-100 rounded-2xl p-3 sm:p-4 shadow-lg text-center">
          <div className="text-2xl sm:text-3xl font-baloo text-gray-600">{stats.not_started}</div>
          <div className="text-xs sm:text-sm text-gray-600">Niet geoefend</div>
        </div>
        <div className="bg-yellow-100 rounded-2xl p-3 sm:p-4 shadow-lg text-center">
          <div className="text-2xl sm:text-3xl font-baloo text-yellow-800">{stats.beginner}</div>
          <div className="text-xs sm:text-sm text-gray-600">1-5x</div>
        </div>
        <div className="bg-blue-100 rounded-2xl p-3 sm:p-4 shadow-lg text-center">
          <div className="text-2xl sm:text-3xl font-baloo text-blue-800">{stats.intermediate}</div>
          <div className="text-xs sm:text-sm text-gray-600">5-20x</div>
        </div>
        <div className="bg-sky-100 rounded-2xl p-3 sm:p-4 shadow-lg text-center">
          <div className="text-2xl sm:text-3xl font-baloo text-sky-800">{stats.advanced}</div>
          <div className="text-xs sm:text-sm text-gray-600">20-50x</div>
        </div>
        <div className="bg-grass-green rounded-2xl p-3 sm:p-4 shadow-lg text-center">
          <div className="text-2xl sm:text-3xl font-baloo text-white">{stats.expert}</div>
          <div className="text-xs sm:text-sm text-white">50+x</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Zoek doelen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-sky-blue text-sm sm:text-base"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-sky-blue bg-white text-sm sm:text-base"
          >
            <option value="code">Sorteer op doelnummer</option>
            <option value="progress">Sorteer op voortgang</option>
            <option value="title">Sorteer alfabetisch</option>
          </select>
        </div>

        <div className="mb-4 pb-4 border-b border-gray-100">
          <NetLeeftijdFilter
            net={netFilter}
            leeftijd={leeftijdFilter}
            onNetChange={kiesNet}
            onLeeftijdChange={kiesLeeftijd}
            aantal={filteredGoals.length}
          />
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex gap-2">
            <button
              onClick={selectAllDomains}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all bg-deep-purple text-white hover:scale-105 shadow-md"
            >
              Alles
            </button>
            {domainFilter.length > 0 && (
              <button
                onClick={hideAllDomains}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all bg-gray-600 text-white hover:scale-105 shadow-md"
              >
                Niet selecteren
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {Object.entries(domainLabels).map(([domain, label]) => {
              const isActive = domainFilter.includes(domain);
              return (
                <button
                  key={domain}
                  onClick={() => toggleDomain(domain)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-deep-purple text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isActive ? '✓ ' : ''}{label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-deep-purple text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setFilter('not_started')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filter === 'not_started'
                ? 'bg-gray-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Niet geoefend
          </button>
          <button
            onClick={() => setFilter('beginner')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filter === 'beginner'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            1-5x
          </button>
          <button
            onClick={() => setFilter('intermediate')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filter === 'intermediate'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            5-20x
          </button>
          <button
            onClick={() => setFilter('advanced')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filter === 'advanced'
                ? 'bg-sky-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            20-50x
          </button>
          <button
            onClick={() => setFilter('expert')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              filter === 'expert'
                ? 'bg-grass-green text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            50+x
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-600 px-4">
        {filteredGoals.length} van {goals.length} doelen weergegeven
      </div>

      <div className="space-y-3">
        {filteredGoals.map((goal) => {
          const lastPracticed = formatDate(goal.last_practiced_at);
          const { weeks } = getSchoolYearWeeks();
          const goalWeeks = weeklyData.get(goal.code) || new Set();

          return (
            <div
              key={goal.code}
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <h4 className="text-base sm:text-lg font-baloo">
                  <span className="text-sky-blue">{goal.code}</span>{' '}
                  <span className="text-deep-purple">{goal.title}</span>
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-semibold">
                    {domainLabels[goal.domain] || goal.subject}
                  </span>
                  <DoelNetBadges info={doelNetInfo.get(goal.code)} />
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      categoryColors[goal.progress_category]
                    }`}
                  >
                    {categoryLabels[goal.progress_category]}
                  </span>
                  {goal.progress_category !== 'not_started' && (
                    <>
                      <span className="text-xs px-2 py-1 bg-grass-green/10 text-grass-green rounded-full font-semibold">
                        {goal.total_sessions}x
                      </span>
                      {lastPracticed && (
                        <span className="text-xs text-gray-500 hidden sm:inline">{lastPracticed}</span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">{goal.description}</p>

              {(() => {
                const net = doelNetInfo.get(goal.code);
                if (!net) return null;
                return (
                  <details className="mb-3 group">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-deep-purple select-none">
                      Officieel minimumdoel {goal.code}
                      {net.onderwerp ? ` · ${net.vakdiscipline} › ${net.onderwerp}` : ` · ${net.vakdiscipline}`}
                    </summary>
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-line bg-gray-50 rounded-xl p-3">
                      {net.doelzin}
                    </p>
                    <div className="mt-2 space-y-1">
                      {NET_CODES.map((n) => {
                        const nrs = net.doelnummers[n];
                        const leeftijden = net.perNet[n];
                        if (!nrs?.length || !leeftijden?.length) return null;
                        return (
                          <p key={n} className="text-xs text-gray-500">
                            <span className="font-semibold">{n === 'GO' ? 'GO!' : 'Katholiek Onderwijs'}</span>
                            {' — '}
                            {leeftijden.join(', ')} · {nrs.length} leerplandoel
                            {nrs.length === 1 ? '' : 'en'}
                            {': '}
                            <span className="text-gray-400">{nrs.slice(0, 6).join(', ')}</span>
                            {nrs.length > 6 && <span className="text-gray-400"> …</span>}
                          </p>
                        );
                      })}
                    </div>
                  </details>
                );
              })()}

              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-600 font-semibold">Schooljaar 2025-2026</span>
                  <span className="text-xs text-gray-500">({weeks.length} weken)</span>
                </div>
                <div
                  ref={(el) => {
                    if (el) timelineRefs.current.set(goal.code, el);
                  }}
                  className="w-full"
                >
                  <div className="flex gap-0.5 h-6 bg-gray-100 rounded-lg w-full px-1">
                    {weeks.map((weekStart, weekIndex) => {
                      const hasPractice = goalWeeks.has(weekIndex);
                      const weekEnd = new Date(weekStart);
                      weekEnd.setDate(weekEnd.getDate() + 4);

                      const startFormatted = weekStart.toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short'
                      });
                      const endFormatted = weekEnd.toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short'
                      });

                      const { start: schoolYearStart } = getSchoolYearWeeks();
                      const currentWeekNum = getWeekNumber(new Date(), schoolYearStart);
                      const isCurrentWeek = weekIndex === currentWeekNum;

                      return (
                        <button
                          key={weekIndex}
                          onClick={() => {
                            const actualWeekEnd = new Date(weekStart);
                            actualWeekEnd.setDate(actualWeekEnd.getDate() + 6);
                            const startStr = weekStart.toISOString().split('T')[0];
                            const endStr = actualWeekEnd.toISOString().split('T')[0];
                            navigate(`/analytics?goal=${goal.code}&startDate=${startStr}&endDate=${endStr}`);
                          }}
                          className={`flex-1 h-full transition-all hover:opacity-80 cursor-pointer ${
                            hasPractice
                              ? 'bg-gradient-to-br from-grass-green to-green-400'
                              : 'bg-gray-200'
                          } ${
                            isCurrentWeek
                              ? 'ring-2 ring-deep-purple ring-inset'
                              : ''
                          }`}
                          title={`Week ${weekIndex + 1}: ${startFormatted} - ${endFormatted}${isCurrentWeek ? ' (Huidige week)' : ''}${hasPractice ? ' (Geoefend - klik voor details)' : ' (Niet geoefend)'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {(() => {
                const futureLessons = (goal.lessons || []).filter(
                  lesson => new Date(lesson.start_time) > new Date()
                );
                return futureLessons.length > 0 && (
                  <div className="mb-3 p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-700">
                        Lessen met dit doel ({futureLessons.length})
                      </span>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {futureLessons.map((lesson) => {
                        const lessonDate = new Date(lesson.start_time);
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => navigate('/agenda')}
                            className="w-full text-left p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-deep-purple truncate">
                                {lesson.title}
                              </div>
                              <div className="text-xs text-gray-600">
                                {lessonDate.toLocaleDateString('nl-NL', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}{' '}
                                {lessonDate.toLocaleTimeString('nl-NL', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                            <span className="text-xs px-2 py-1 bg-sky-blue/20 text-sky-blue rounded-full font-semibold whitespace-nowrap">
                              Gepland
                            </span>
                            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {contentCounts.get(goal.code) && (
                <div className="mb-3 p-3 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-700">
                      Beschikbare content
                    </span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {contentCounts.get(goal.code)!.vocabulary > 0 && (
                      <button
                        onClick={() => navigate(`/aan-de-slag?tab=vocabulary&goal=${goal.code}`)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-coral-pink/10 transition-colors"
                        title={`${contentCounts.get(goal.code)!.vocabulary} woordenschat items`}
                      >
                        <span className="text-lg">📚</span>
                        <span className="text-xs font-semibold text-gray-700">{contentCounts.get(goal.code)!.vocabulary}</span>
                      </button>
                    )}
                    {contentCounts.get(goal.code)!.games > 0 && (
                      <button
                        onClick={() => navigate(`/aan-de-slag?tab=games&goal=${goal.code}`)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-grass-green/10 transition-colors"
                        title={`${contentCounts.get(goal.code)!.games} spelletjes`}
                      >
                        <span className="text-lg">🎮</span>
                        <span className="text-xs font-semibold text-gray-700">{contentCounts.get(goal.code)!.games}</span>
                      </button>
                    )}
                    {contentCounts.get(goal.code)!.writing > 0 && (
                      <button
                        onClick={() => navigate(`/aan-de-slag?tab=writing&goal=${goal.code}`)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-sky-blue/10 transition-colors"
                        title={`${contentCounts.get(goal.code)!.writing} schrijfoefeningen`}
                      >
                        <span className="text-lg">✏️</span>
                        <span className="text-xs font-semibold text-gray-700">{contentCounts.get(goal.code)!.writing}</span>
                      </button>
                    )}
                    {contentCounts.get(goal.code)!.tasks > 0 && (
                      <button
                        onClick={() => navigate(`/aan-de-slag?tab=tasks&goal=${goal.code}`)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-soft-orange/10 transition-colors"
                        title={`${contentCounts.get(goal.code)!.tasks} fysieke opdrachten`}
                      >
                        <span className="text-lg">✋</span>
                        <span className="text-xs font-semibold text-gray-700">{contentCounts.get(goal.code)!.tasks}</span>
                      </button>
                    )}
                    {contentCounts.get(goal.code)!.videos > 0 && (
                      <button
                        onClick={() => navigate(`/aan-de-slag?tab=videos&goal=${goal.code}`)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-sunny-yellow/10 transition-colors"
                        title={`${contentCounts.get(goal.code)!.videos} video's`}
                      >
                        <span className="text-lg">🎬</span>
                        <span className="text-xs font-semibold text-gray-700">{contentCounts.get(goal.code)!.videos}</span>
                      </button>
                    )}
                    {contentCounts.get(goal.code)!.materials > 0 && (
                      <button
                        onClick={() => navigate(`/aan-de-slag?tab=materials&goal=${goal.code}`)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-deep-purple/10 transition-colors"
                        title={`${contentCounts.get(goal.code)!.materials} materialen`}
                      >
                        <span className="text-lg">📖</span>
                        <span className="text-xs font-semibold text-gray-700">{contentCounts.get(goal.code)!.materials}</span>
                      </button>
                    )}
                    {contentCounts.get(goal.code)!.activities > 0 && (
                      <button
                        onClick={() => navigate(`/aan-de-slag?tab=activities&goal=${goal.code}`)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-lavender/10 transition-colors"
                        title={`${contentCounts.get(goal.code)!.activities} hoekenwerk activiteiten`}
                      >
                        <span className="text-lg">🎨</span>
                        <span className="text-xs font-semibold text-gray-700">{contentCounts.get(goal.code)!.activities}</span>
                      </button>
                    )}
                    {contentCounts.get(goal.code)!.routines > 0 && (
                      <div
                        className="flex flex-col items-center gap-1 p-2 rounded-lg"
                        title={`${contentCounts.get(goal.code)!.routines} routines`}
                      >
                        <span className="text-lg">🔄</span>
                        <span className="text-xs font-semibold text-gray-700">{contentCounts.get(goal.code)!.routines}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <button
                  onClick={() => handlePracticeGoal(goal)}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-grass-green to-green-400 text-white rounded-xl font-semibold text-sm hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-md"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Geoefend</span>
                </button>
                <button
                  onClick={() => navigate(`/analytics?goal=${goal.code}`)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-sky-blue to-blue-400 text-white rounded-xl font-semibold text-sm hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-md"
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>Analytics</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showPracticeModal} onClose={() => setShowPracticeModal(false)}>
        <div className="p-6">
          <h3 className="text-2xl font-baloo text-deep-purple mb-4">Doel Geoefend</h3>
          {selectedGoal && (
            <>
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-lavender to-sky-blue rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-baloo text-white">{selectedGoal.code}</span>
                  </div>
                  <div>
                    <h4 className="font-baloo text-deep-purple">{selectedGoal.title}</h4>
                    <p className="text-sm text-gray-600">{selectedGoal.description}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notities (optioneel)
                </label>
                <textarea
                  value={practiceNotes}
                  onChange={(e) => setPracticeNotes(e.target.value)}
                  placeholder="Voeg hier je observaties of notities toe..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-sky-blue resize-none"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPracticeModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={submitPractice}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-grass-green to-green-400 text-white rounded-xl font-semibold hover:scale-105 transition-transform shadow-md"
                >
                  Bevestigen
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {filteredGoals.length === 0 && (
        <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-baloo text-deep-purple mb-4">Geen doelen gevonden</h3>
          <p className="text-gray-600">
            Probeer een andere zoekopdracht of filter om doelen te vinden.
          </p>
        </div>
      )}
    </div>
  );
}
