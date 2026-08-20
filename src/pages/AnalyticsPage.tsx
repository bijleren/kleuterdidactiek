import { useState, useEffect } from 'react';
import DoelChips from '../components/DoelChips';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { compareGoalCodes } from '../utils/goalSort';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/AppLayout';
import { trackFeatureUsage } from '../utils/onboardingTracker';
import { BarChart3, Calendar, TrendingUp, Filter, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface GoalSession {
  id: string;
  goal_codes: string[];
  activity_type: string;
  activity_name: string;
  duration_minutes?: number;
  repetitions?: number;
  created_at: string;
  created_by: string;
}

interface GoalSummary {
  goal_code: string;
  total_sessions: number;
  total_repetitions: number;
  last_practiced: string;
}

interface DayActivity {
  date: string;
  hour: number;
  goal_codes: string[];
  activity_name: string;
  activity_type: string;
}

interface GroupedActivity {
  type: string;
  category: string;
  count: number;
  goal_codes: string[];
  activities: DayActivity[];
  expanded: boolean;
}

export default function AnalyticsPage() {
  const { selectedGroupId, selectedGroup } = useSchool();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [sessions, setSessions] = useState<GoalSession[]>([]);
  const [goalSummaries, setGoalSummaries] = useState<GoalSummary[]>([]);
  const [dayActivities, setDayActivities] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'overview' | 'goals' | 'calendar'>('overview');
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all' | 'custom'>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [selectedCellActivities, setSelectedCellActivities] = useState<DayActivity[] | null>(null);
  const [groupedActivities, setGroupedActivities] = useState<GroupedActivity[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  function getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  function getEndOfWeek(startDate: Date): Date {
    const end = new Date(startDate);
    end.setDate(end.getDate() + 6);
    return end;
  }

  useEffect(() => {
    const goalParam = searchParams.get('goal');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (goalParam) {
      setSelectedGoal(goalParam);
      setView('goals');
    }

    if (startDateParam && endDateParam) {
      setDateRange('custom');
      setCustomStartDate(startDateParam);
      setCustomEndDate(endDateParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedGroupId) {
      loadAnalytics();
      if (user) {
        trackFeatureUsage(selectedGroupId, user.id, 'analytics_viewed');
      }
    }
  }, [selectedGroupId, dateRange, currentWeekStart, customStartDate, customEndDate, user]);

  const loadAnalytics = async () => {
    if (!selectedGroupId) return;

    setLoading(true);
    try {
      let query = supabase
        .from('goal_tracking_sessions')
        .select('*')
        .eq('group_id', selectedGroupId)
        .order('created_at', { ascending: false });

      if (dateRange === 'week') {
        const weekEnd = getEndOfWeek(currentWeekStart);
        query = query
          .gte('created_at', currentWeekStart.toISOString())
          .lte('created_at', weekEnd.toISOString());
      } else if (dateRange === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('created_at', monthAgo.toISOString());
      } else if (dateRange === 'custom' && customStartDate && customEndDate) {
        const startDateTime = new Date(customStartDate);
        startDateTime.setHours(0, 0, 0, 0);
        const endDateTime = new Date(customEndDate);
        endDateTime.setHours(23, 59, 59, 999);
        query = query
          .gte('created_at', startDateTime.toISOString())
          .lte('created_at', endDateTime.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      setSessions(data || []);
      calculateSummaries(data || []);
      calculateDayActivities(data || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummaries = (data: GoalSession[]) => {
    const summaryMap: Record<string, GoalSummary> = {};
    const daysMap: Record<string, Set<string>> = {};

    data.forEach((session) => {
      const day = session.created_at.slice(0, 10);
      session.goal_codes.forEach((code) => {
        if (!summaryMap[code]) {
          summaryMap[code] = {
            goal_code: code,
            total_sessions: 0,
            total_repetitions: 0,
            last_practiced: session.created_at,
          };
          daysMap[code] = new Set();
        }

        daysMap[code].add(day);
        summaryMap[code].total_repetitions += session.repetitions || 0;

        if (new Date(session.created_at) > new Date(summaryMap[code].last_practiced)) {
          summaryMap[code].last_practiced = session.created_at;
        }
      });
    });

    Object.keys(summaryMap).forEach((code) => {
      summaryMap[code].total_sessions = daysMap[code].size;
    });

    const summaries = Object.values(summaryMap).sort(
      (a, b) => b.total_sessions - a.total_sessions
    );
    setGoalSummaries(summaries);
  };

  const calculateDayActivities = (data: GoalSession[]) => {
    const activities: DayActivity[] = data.map((session) => {
      const date = new Date(session.created_at);
      return {
        date: date.toISOString().split('T')[0],
        hour: date.getHours(),
        goal_codes: session.goal_codes,
        activity_name: session.activity_name,
        activity_type: session.activity_type,
      };
    });

    setDayActivities(activities);
  };

  const getFilteredSessions = () => {
    if (!selectedGoal) return sessions;
    return sessions.filter((s) => s.goal_codes.includes(selectedGoal));
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

  const getActivityColorByType = (type: string) => {
    const colors: Record<string, string> = {
      vocabulary: 'bg-coral-pink',
      game: 'bg-sky-blue',
      writing: 'bg-lavender',
      physical_task: 'bg-grass-green',
    };
    return colors[type] || 'bg-gray-400';
  };

  const groupActivitiesByCategory = (activities: DayActivity[]): GroupedActivity[] => {
    const groups: Record<string, GroupedActivity> = {};

    activities.forEach(activity => {
      const key = `${activity.activity_type}-${activity.activity_name}`;

      if (!groups[key]) {
        groups[key] = {
          type: activity.activity_type,
          category: activity.activity_name,
          count: 0,
          goal_codes: [],
          activities: [],
          expanded: false,
        };
      }

      groups[key].count += 1;
      groups[key].activities.push(activity);
      activity.goal_codes.forEach(code => {
        if (!groups[key].goal_codes.includes(code)) {
          groups[key].goal_codes.push(code);
        }
      });
    });

    return Object.values(groups).sort((a, b) => b.count - a.count);
  };

  const openCellModal = (activities: DayActivity[]) => {
    setSelectedCellActivities(activities);
    const grouped = groupActivitiesByCategory(activities);
    setGroupedActivities(grouped);
    setShowModal(true);
  };

  const toggleGroupExpanded = (index: number) => {
    setGroupedActivities(prev =>
      prev.map((group, i) =>
        i === index ? { ...group, expanded: !group.expanded } : group
      )
    );
  };

  const closeCellModal = () => {
    setShowModal(false);
    setSelectedCellActivities(null);
  };

  const showNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const getGoalDomain = (goalCode: string): string => {
    const firstDigit = goalCode.split('.')[0];
    const domains: Record<string, string> = {
      '1': 'Nederlands',
      '2': 'Wiskunde',
      '3': 'Wetenschap & Techniek',
      '4': 'Aardrijkskunde',
      '5': 'Geschiedenis',
      '6': 'Muzische vorming',
      '7': 'Lichamelijke opvoeding',
      '8': 'Attitudes',
    };
    return domains[firstDigit] || 'Onbekend';
  };

  const generateReport = (): string => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('nl-NL');

    let startDate = new Date();
    let endDate = new Date();

    if (dateRange === 'week') {
      startDate = currentWeekStart;
      endDate = getEndOfWeek(currentWeekStart);
    } else if (dateRange === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate = new Date(Math.min(...sessions.map(s => new Date(s.created_at).getTime())));
    }

    const periodStr = `van ${startDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })} tot ${endDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;

    let report = `Kleuterdidactiek - VOORTGANGSRAPPORT\n`;
    report += `Datum: ${dateStr}\n`;
    report += `${'='.repeat(50)}\n\n`;
    report += `Periode: ${periodStr}\n\n`;

    report += `SAMENVATTING\n`;
    report += `${'-'.repeat(30)}\n`;

    const vocabularySessions = sessions.filter(s => s.activity_type === 'vocabulary');
    const totalRepetitions = vocabularySessions.reduce((sum, s) => sum + (s.repetitions || 0), 0);

    report += `Totaal activiteiten: ${sessions.length}\n`;
    report += `Doelen geoefend: ${goalSummaries.length}\n`;
    report += `Woordenschat oefeningen: ${totalRepetitions}\n\n`;

    const domainStats: Record<string, { practiced: number; total: number }> = {
      'Nederlands': { practiced: 0, total: 22 },
      'Wiskunde': { practiced: 0, total: 26 },
      'Wetenschap & Techniek': { practiced: 0, total: 16 },
      'Aardrijkskunde': { practiced: 0, total: 12 },
      'Geschiedenis': { practiced: 0, total: 6 },
      'Muzische vorming': { practiced: 0, total: 14 },
      'Lichamelijke opvoeding': { practiced: 0, total: 6 },
      'Attitudes': { practiced: 0, total: 12 },
    };

    goalSummaries.forEach(summary => {
      const domain = getGoalDomain(summary.goal_code);
      if (domainStats[domain]) {
        domainStats[domain].practiced += 1;
      }
    });

    report += `VOORTGANG PER DOMEIN\n`;
    report += `${'-'.repeat(30)}\n`;
    Object.entries(domainStats).forEach(([domain, stats]) => {
      report += `${domain}: ${stats.practiced}/${stats.total} doelen\n`;
    });
    report += `\n`;

    report += `DETAIL PER DOEL (geoefend)\n`;
    report += `${'-'.repeat(30)}\n`;
    goalSummaries
      .sort((a, b) => compareGoalCodes(a.goal_code, b.goal_code))
      .forEach(summary => {
        report += `${summary.goal_code}: ${summary.total_sessions}x\n`;
      });
    report += `\n`;

    const gameSessions = sessions.filter(s => s.activity_type === 'game');
    if (gameSessions.length > 0) {
      report += `SPELLETJES\n`;
      report += `${'-'.repeat(30)}\n`;
      const gameNames = new Map<string, number>();
      gameSessions.forEach(s => {
        gameNames.set(s.activity_name, (gameNames.get(s.activity_name) || 0) + 1);
      });
      gameNames.forEach((count, name) => {
        report += `${name}: ${count}x\n`;
      });
      report += `\n`;
    }

    const writingSessions = sessions.filter(s => s.activity_type === 'writing');
    const physicalSessions = sessions.filter(s => s.activity_type === 'physical_task');

    if (writingSessions.length > 0 || physicalSessions.length > 0) {
      report += `SCHRIJVEN & DOE-OPDRACHTEN\n`;
      report += `${'-'.repeat(30)}\n`;

      if (writingSessions.length > 0) {
        report += `Schrijfoefeningen:\n`;
        const writingNames = new Map<string, number>();
        writingSessions.forEach(s => {
          writingNames.set(s.activity_name, (writingNames.get(s.activity_name) || 0) + 1);
        });
        writingNames.forEach((count, name) => {
          report += `  ${name}: ${count}x\n`;
        });
      }

      if (physicalSessions.length > 0) {
        report += `Doe-opdrachten:\n`;
        const physicalNames = new Map<string, number>();
        physicalSessions.forEach(s => {
          physicalNames.set(s.activity_name, (physicalNames.get(s.activity_name) || 0) + 1);
        });
        physicalNames.forEach((count, name) => {
          report += `  ${name}: ${count}x\n`;
        });
      }
      report += `\n`;
    }

    report += `Groep: ${selectedGroup?.name || 'Onbekend'}\n`;
    report += `Totaal sessies: ${sessions.length}\n`;
    report += `Totaal minuten: ${sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)}\n`;

    return report;
  };

  const copyGoalsToClipboard = () => {
    const report = generateReport();
    navigator.clipboard.writeText(report).then(() => {
      showNotification('Rapport gekopieerd naar klembord!');
    });
  };

  const exportToExcel = (filename: string, data: string) => {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`${filename} gedownload!`);
  };

  const escapeCSV = (value: string | number | undefined | null): string => {
    if (value === undefined || value === null || value === '') return '';
    const strValue = String(value);
    if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
      return `"${strValue.replace(/"/g, '""')}"`;
    }
    return strValue;
  };

  const exportOverview = () => {
    let csv = 'Kleuterdidactiek,-,Overzichtsrapport\n\n';
    csv += `Periode,${escapeCSV(dateRange === 'week' ? 'Deze week' : dateRange === 'month' ? 'Deze maand' : dateRange === 'custom' ? `${customStartDate} tot ${customEndDate}` : 'Alles')}\n`;
    csv += `Groep,${escapeCSV(selectedGroup?.name || 'Onbekend')}\n\n`;

    csv += 'SAMENVATTING\n';
    csv += `Totaal Sessies,${sessions.length}\n`;
    csv += `Doelen Geoefend,${goalSummaries.length}\n`;
    csv += `Totaal Minuten,${sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)}\n\n`;

    csv += 'TOP 10 DOELEN\n';
    csv += 'Doelcode,Aantal Sessies,Laatst Geoefend\n';
    goalSummaries.slice(0, 10).forEach((summary) => {
      csv += `${escapeCSV(summary.goal_code)},${summary.total_sessions},${escapeCSV(new Date(summary.last_practiced).toLocaleDateString('nl-NL'))}\n`;
    });

    const filename = `analytics-overzicht-${selectedGroup?.name || 'groep'}-${new Date().toISOString().split('T')[0]}.csv`;
    exportToExcel(filename, csv);
  };

  const exportGoals = () => {
    let csv = 'Kleuterdidactiek,-,Doelen,Rapport\n\n';
    csv += `Periode,${escapeCSV(dateRange === 'week' ? 'Alles' : dateRange === 'month' ? 'Deze maand' : dateRange === 'custom' ? `${customStartDate} tot ${customEndDate}` : 'Alles')}\n`;
    csv += `Groep,${escapeCSV(selectedGroup?.name || 'Onbekend')}\n`;
    csv += `Filter,${escapeCSV(selectedGoal || 'Alle Doelen')}\n\n`;

    csv += 'SESSIES\n';
    csv += 'Datum,Tijd,Activiteit,Type,Doelen,Duur (min),Herhalingen\n';

    const filteredSessions = getFilteredSessions();
    filteredSessions.forEach((session) => {
      const date = new Date(session.created_at);
      const datumStr = date.toLocaleDateString('nl-NL');
      const tijdStr = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
      const activiteitStr = escapeCSV(session.activity_name);
      const typeStr = escapeCSV(session.activity_type);
      const doelenStr = escapeCSV(session.goal_codes.join(', '));
      const duurStr = escapeCSV(session.duration_minutes);
      const herhalingenStr = escapeCSV(session.repetitions);

      csv += `${datumStr},${tijdStr},${activiteitStr},${typeStr},${doelenStr},${duurStr},${herhalingenStr}\n`;
    });

    const filename = `analytics-doelen-${selectedGroup?.name || 'groep'}-${new Date().toISOString().split('T')[0]}.csv`;
    exportToExcel(filename, csv);
  };

  const exportCalendar = () => {
    let csv = 'Kleuterdidactiek,-,Kalender,Rapport\n\n';
    csv += `Periode,${escapeCSV(currentWeekStart.toLocaleDateString('nl-NL') + ' - ' + getEndOfWeek(currentWeekStart).toLocaleDateString('nl-NL'))}\n`;
    csv += `Groep,${escapeCSV(selectedGroup?.name || 'Onbekend')}\n\n`;

    csv += 'ACTIVITEITEN\n';
    csv += 'Datum,Tijd,Activiteit,Type,Doelen\n';

    dayActivities.forEach((activity) => {
      const datumStr = new Date(activity.date).toLocaleDateString('nl-NL');
      const tijdStr = `${activity.hour}:00`;
      const activiteitStr = escapeCSV(activity.activity_name);
      const typeStr = escapeCSV(activity.activity_type);
      const doelenStr = escapeCSV(activity.goal_codes.join(', '));

      csv += `${datumStr},${tijdStr},${activiteitStr},${typeStr},${doelenStr}\n`;
    });

    const filename = `analytics-kalender-${selectedGroup?.name || 'groep'}-${new Date().toISOString().split('T')[0]}.csv`;
    exportToExcel(filename, csv);
  };

  if (!selectedGroupId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-white rounded-3xl p-8 shadow-xl text-center max-w-md">
            <BarChart3 className="w-16 h-16 text-deep-purple mx-auto mb-4" />
            <h2 className="text-2xl font-baloo text-deep-purple mb-2">
              Geen groep geselecteerd
            </h2>
            <p className="text-gray-600 mb-4">
              Selecteer eerst een groep om analytics te bekijken.
            </p>
            <a
              href="/dashboard"
              className="inline-block bg-gradient-to-r from-deep-purple to-lavender text-white px-6 py-3 rounded-full font-baloo hover:scale-105 transition-transform"
            >
              Ga naar Dashboard
            </a>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-2xl font-baloo text-deep-purple">Analytics laden...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-xl">
          <h1 className="text-3xl font-baloo text-deep-purple mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8" />
            Analytics - {selectedGroup?.name}
          </h1>
          <p className="text-gray-600">
            Gedetailleerde analyse van oefeningen en vorderingen
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setView('overview')}
            className={`px-6 py-3 rounded-full font-baloo transition-all ${
              view === 'overview'
                ? 'bg-gradient-to-r from-deep-purple to-lavender text-white'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-deep-purple'
            }`}
          >
            Overzicht
          </button>
          <button
            onClick={() => setView('goals')}
            className={`px-6 py-3 rounded-full font-baloo transition-all ${
              view === 'goals'
                ? 'bg-gradient-to-r from-deep-purple to-lavender text-white'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-deep-purple'
            }`}
          >
            Per Doel
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-6 py-3 rounded-full font-baloo transition-all ${
              view === 'calendar'
                ? 'bg-gradient-to-r from-deep-purple to-lavender text-white'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-deep-purple'
            }`}
          >
            Kalender
          </button>

          <div className="ml-auto flex gap-2 flex-wrap items-center">
            <button
              onClick={() => setDateRange('week')}
              className={`px-4 py-3 rounded-full text-sm font-semibold transition-all ${
                dateRange === 'week'
                  ? 'bg-sky-blue text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-700'
              }`}
            >
              Deze week
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-4 py-3 rounded-full text-sm font-semibold transition-all ${
                dateRange === 'month'
                  ? 'bg-sky-blue text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-700'
              }`}
            >
              Deze maand
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-4 py-3 rounded-full text-sm font-semibold transition-all ${
                dateRange === 'all'
                  ? 'bg-sky-blue text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-700'
              }`}
            >
              Alles
            </button>
            <button
              onClick={() => setDateRange('custom')}
              className={`px-4 py-3 rounded-full text-sm font-semibold transition-all ${
                dateRange === 'custom'
                  ? 'bg-sky-blue text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-700'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {dateRange === 'custom' && (
          <div className="bg-white rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-baloo text-deep-purple mb-4">Selecteer Periode</h3>
            <div className="flex gap-4 flex-wrap items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 font-semibold">Van:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-4 py-2 rounded-full border-2 border-gray-200 text-gray-700 focus:border-sky-blue focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 font-semibold">Tot:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-4 py-2 rounded-full border-2 border-gray-200 text-gray-700 focus:border-sky-blue focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {view === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-coral-pink to-[#FFB6C1] rounded-3xl p-6 shadow-xl text-white">
                <div className="text-5xl font-bold mb-2">{sessions.length}</div>
                <div className="text-lg font-baloo">Totaal Sessies</div>
              </div>
              <div className="bg-gradient-to-br from-sky-blue to-[#7EDCD5] rounded-3xl p-6 shadow-xl text-white">
                <div className="text-5xl font-bold mb-2">{goalSummaries.length}</div>
                <div className="text-lg font-baloo">Doelen Geoefend</div>
              </div>
              <div className="bg-gradient-to-br from-grass-green to-[#B5F0BE] rounded-3xl p-6 shadow-xl text-white">
                <div className="text-5xl font-bold mb-2">
                  {sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)}
                </div>
                <div className="text-lg font-baloo">Totaal Minuten</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-baloo text-deep-purple flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  Top 10 Doelen
                </h3>
                <button
                  onClick={exportOverview}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-grass-green to-[#7DD87D] text-white font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Export naar Excel
                </button>
              </div>
              <div className="space-y-3">
                {goalSummaries.slice(0, 10).map((summary) => (
                  <div
                    key={summary.goal_code}
                    className="flex items-center gap-4 p-4 bg-cream rounded-2xl hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedGoal(summary.goal_code);
                      setView('goals');
                    }}
                  >
                    <div className="flex-1">
                      <div className="font-baloo text-lg text-deep-purple">
                        {summary.goal_code}
                      </div>
                      <div className="text-sm text-gray-600">
                        Laatst geoefend:{' '}
                        {new Date(summary.last_practiced).toLocaleDateString('nl-NL')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-deep-purple">
                        {summary.total_sessions}
                      </div>
                      <div className="text-xs text-gray-600">sessies</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'goals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <Filter className="w-6 h-6 text-deep-purple" />
                <h3 className="text-2xl font-baloo text-deep-purple">Filter op Doel</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedGoal(null)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    selectedGoal === null
                      ? 'bg-deep-purple text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Alle Doelen
                </button>
                {goalSummaries.map((summary) => (
                  <button
                    key={summary.goal_code}
                    onClick={() => setSelectedGoal(summary.goal_code)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      selectedGoal === summary.goal_code
                        ? 'bg-deep-purple text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {summary.goal_code} ({summary.total_sessions})
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-baloo text-deep-purple">
                  {selectedGoal ? `Sessies voor doel ${selectedGoal}` : 'Alle Sessies'}
                </h3>
                <button
                  onClick={exportGoals}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-grass-green to-[#7DD87D] text-white font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Export naar Excel
                </button>
              </div>
              <div className="space-y-3">
                {getFilteredSessions().map((session) => (
                  <div
                    key={session.id}
                    className="p-4 bg-cream rounded-2xl hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-baloo text-lg text-deep-purple">
                          {session.activity_name}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">
                          {session.activity_type}
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${getActivityColorByType(
                          session.activity_type
                        )}`}
                      >
                        {session.activity_type}
                      </div>
                    </div>
                    <div className="mb-2">
                      <DoelChips codes={session.goal_codes} klein />
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(session.created_at).toLocaleString('nl-NL', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                      {session.duration_minutes && ` • ${session.duration_minutes} min`}
                      {session.repetitions && ` • ${session.repetitions}x`}
                    </div>
                  </div>
                ))}
                {getFilteredSessions().length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    Geen sessies gevonden
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'calendar' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-baloo text-deep-purple flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  Weekoverzicht
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={exportCalendar}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-grass-green to-[#7DD87D] text-white font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button
                    onClick={previousWeek}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6 text-deep-purple" />
                  </button>
                  <div className="text-lg font-baloo text-deep-purple">
                    {currentWeekStart.toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    -{' '}
                    {getEndOfWeek(currentWeekStart).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  <button
                    onClick={nextWeek}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6 text-deep-purple" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-8 gap-2">
                <div className="font-semibold text-sm text-gray-600 p-2">Tijd</div>
                {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day) => (
                  <div key={day} className="font-semibold text-sm text-center text-gray-600 p-2">
                    {day}
                  </div>
                ))}

                {Array.from({ length: 14 }, (_, i) => i + 8).map((hour) => (
                  <>
                    <div key={`hour-${hour}`} className="text-xs text-gray-500 p-2">
                      {hour}:00
                    </div>
                    {Array.from({ length: 7 }, (_, dayOffset) => {
                      const date = new Date(currentWeekStart);
                      date.setDate(date.getDate() + dayOffset);
                      const dateStr = date.toISOString().split('T')[0];

                      const activitiesAtHour = dayActivities.filter(
                        (a) => a.date === dateStr && a.hour === hour
                      );

                      const allGoalsInCell = new Set<string>();
                      activitiesAtHour.forEach(activity => {
                        activity.goal_codes.forEach(code => allGoalsInCell.add(code));
                      });
                      const uniqueGoals = Array.from(allGoalsInCell);
                      const displayGoals = uniqueGoals.slice(0, 5);
                      const remainingCount = uniqueGoals.length - 5;

                      return (
                        <div
                          key={`${hour}-${dayOffset}`}
                          className={`min-h-[60px] p-1 rounded-lg border cursor-pointer transition-all ${
                            activitiesAtHour.length > 0
                              ? 'bg-lavender/20 border-lavender hover:bg-lavender/30'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                          onClick={() => activitiesAtHour.length > 0 && openCellModal(activitiesAtHour)}
                        >
                          <div className="flex flex-wrap gap-0.5">
                            {displayGoals.map((goalCode, idx) => (
                              <div
                                key={idx}
                                className="text-[10px] px-1 py-0.5 rounded bg-lavender/50 text-deep-purple font-semibold"
                              >
                                {goalCode}
                              </div>
                            ))}
                            {remainingCount > 0 && (
                              <div className="text-[10px] px-1 py-0.5 rounded bg-deep-purple text-white font-bold">
                                +{remainingCount}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>

              <div className="mt-6 flex gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-coral-pink"></div>
                  <span className="text-sm text-gray-600">Vocabulaire</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-sky-blue"></div>
                  <span className="text-sm text-gray-600">Spel</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-lavender"></div>
                  <span className="text-sm text-gray-600">Schrijven</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-grass-green"></div>
                  <span className="text-sm text-gray-600">Doe-opdracht</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {showModal && selectedCellActivities && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closeCellModal()}
          >
            <div className="bg-white rounded-3xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-3xl font-baloo text-deep-purple">Activiteiten</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedCellActivities.length} {selectedCellActivities.length === 1 ? 'activiteit' : 'activiteiten'}
                  </p>
                </div>
                <button
                  onClick={closeCellModal}
                  className="w-12 h-12 rounded-full bg-coral-pink text-white flex items-center justify-center hover:scale-110 transition-transform text-3xl font-bold shadow-lg"
                >
                  ×
                </button>
              </div>

              <div className="mb-6 bg-gradient-to-br from-lavender/20 to-sky-blue/20 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-800 text-lg">📚 Alle Doelen</h4>
                  <span className="text-2xl font-baloo text-deep-purple">
                    {Array.from(new Set(selectedCellActivities.flatMap((activity) => activity.goal_codes))).length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {Array.from(
                    new Set(
                      selectedCellActivities.flatMap((activity) => activity.goal_codes)
                    )
                  )
                    .sort()
                    .map((goalCode) => (
                      <span
                        key={goalCode}
                        className="px-4 py-2 bg-white text-deep-purple text-sm rounded-full font-bold shadow-sm border-2 border-lavender/30"
                      >
                        {goalCode}
                      </span>
                    ))}
                </div>
                <button
                  onClick={copyGoalsToClipboard}
                  className="w-full px-6 py-3 bg-gradient-to-r from-deep-purple to-lavender text-white rounded-xl font-baloo hover:scale-[1.02] transition-transform shadow-lg text-lg"
                >
                  📋 Kopiëren naar Klembord
                </button>
              </div>

              <div className="border-t-2 border-gray-200 pt-6">
                <h4 className="font-bold text-gray-800 mb-4 text-lg">🎯 Activiteiten per Categorie</h4>
                <div className="space-y-3">
                  {groupedActivities.map((group, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-br from-cream to-white rounded-2xl shadow-md hover:shadow-lg transition-all border-l-4 border-coral-pink overflow-hidden"
                    >
                      <div
                        className="p-5 cursor-pointer"
                        onClick={() => toggleGroupExpanded(idx)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className={`px-3 py-1 rounded-full text-white text-xs font-bold ${getActivityColorByType(
                                  group.type
                                )}`}
                              >
                                {group.type}
                              </div>
                              <span className="text-2xl font-baloo text-deep-purple">
                                {group.count}x
                              </span>
                            </div>
                            <h5 className="text-xl font-baloo text-deep-purple">
                              {group.category}
                            </h5>
                          </div>
                          <button className="ml-4 w-10 h-10 rounded-full bg-lavender/20 text-deep-purple flex items-center justify-center hover:bg-lavender/40 transition-colors font-bold text-xl">
                            {group.expanded ? '−' : '+'}
                          </button>
                        </div>

                        {group.expanded && (
                          <div className="mt-4 pt-4 border-t-2 border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-sm font-bold text-gray-700">Geoefende doelen:</span>
                              <span className="text-lg font-baloo text-deep-purple">
                                {group.goal_codes.length}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {group.goal_codes.sort(compareGoalCodes).map((code) => (
                                <span
                                  key={code}
                                  className="px-3 py-1.5 bg-gradient-to-r from-lavender/40 to-sky-blue/40 text-deep-purple text-sm rounded-lg font-bold border border-lavender/50"
                                >
                                  {code}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeCellModal}
                  className="px-8 py-3 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        )}

        {showToast && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[60] animate-slide-up">
            <div className="bg-gradient-to-r from-grass-green to-[#7DD87D] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white/30 flex items-center justify-center text-xl">
                ✓
              </div>
              <span className="font-semibold">{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
