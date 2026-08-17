import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSchool } from '../contexts/SchoolContext';
import AppLayout from '../components/AppLayout';
import { BarChart3, TrendingUp, Filter, Download, School, Calendar, Copy, Check } from 'lucide-react';
import { compareGoalCodes } from '../utils/goalSort';
import * as XLSX from 'xlsx';

interface GroupGoalStat {
  group_id: string;
  group_name: string;
  goal_code: string;
  total_sessions: number;
  weeks_practiced: number[];
}

interface GoalOverview {
  goal_code: string;
  total_sessions: number;
  groups_practicing: number;
  groups: {
    id: string;
    name: string;
    sessions: number;
  }[];
}

interface WeekData {
  week_number: number;
  start_date: string;
  end_date: string;
  groups: {
    group_id: string;
    group_name: string;
    sessions: number;
  }[];
}

export default function SchoolAnalyticsPage() {
  const { selectedSchool, groups } = useSchool();
  const [loading, setLoading] = useState(true);
  const [goalOverviews, setGoalOverviews] = useState<GoalOverview[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeekData[]>([]);
  const [view, setView] = useState<'overview' | 'goal-detail' | 'yearly-grid'>('overview');
  const [sortBy, setSortBy] = useState<'sessions' | 'groups'>('sessions');
  const [yearlyGridData, setYearlyGridData] = useState<Map<string, Set<number>>>(new Map());
  const [codeCopied, setCodeCopied] = useState(false);

  const handleCopyCode = () => {
    if (!selectedSchool?.school_code) return;
    navigator.clipboard.writeText(selectedSchool.school_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  useEffect(() => {
    if (selectedSchool) {
      loadSchoolAnalytics();
    }
  }, [selectedSchool]);

  useEffect(() => {
    if (selectedGoal && selectedSchool) {
      loadGoalWeeklyData();
      if (view === 'yearly-grid') {
        loadYearlyGridData();
      }
    }
  }, [selectedGoal, selectedSchool]);

  useEffect(() => {
    if (view === 'yearly-grid' && selectedGoal && selectedSchool) {
      loadYearlyGridData();
    }
  }, [view, selectedGoal, selectedSchool]);

  const loadSchoolAnalytics = async () => {
    if (!selectedSchool) return;

    setLoading(true);
    try {
      const activeGroups = groups.filter(g => !g.deleted_at);
      const groupIds = activeGroups.map(g => g.id);

      if (groupIds.length === 0) {
        setGoalOverviews([]);
        setLoading(false);
        return;
      }

      const { data: sessions, error } = await supabase
        .from('goal_tracking_sessions')
        .select('group_id, goal_codes')
        .in('group_id', groupIds);

      if (error) throw error;

      const goalMap = new Map<string, GoalOverview>();

      sessions?.forEach(session => {
        const group = activeGroups.find(g => g.id === session.group_id);
        if (!group) return;

        session.goal_codes.forEach((goalCode: string) => {
          if (!goalMap.has(goalCode)) {
            goalMap.set(goalCode, {
              goal_code: goalCode,
              total_sessions: 0,
              groups_practicing: 0,
              groups: [],
            });
          }

          const goalStat = goalMap.get(goalCode)!;
          goalStat.total_sessions++;

          let groupStat = goalStat.groups.find(g => g.id === session.group_id);
          if (!groupStat) {
            groupStat = {
              id: session.group_id,
              name: group.name,
              sessions: 0,
            };
            goalStat.groups.push(groupStat);
            goalStat.groups_practicing = goalStat.groups.length;
          }
          groupStat.sessions++;
        });
      });

      const overviews = Array.from(goalMap.values());
      setGoalOverviews(overviews);
    } catch (error) {
      console.error('Error loading school analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGoalWeeklyData = async () => {
    if (!selectedGoal || !selectedSchool) return;

    try {
      const activeGroups = groups.filter(g => !g.deleted_at);
      const groupIds = activeGroups.map(g => g.id);

      const { data: sessions, error } = await supabase
        .from('goal_tracking_sessions')
        .select('group_id, goal_codes, created_at')
        .in('group_id', groupIds)
        .contains('goal_codes', [selectedGoal])
        .order('created_at', { ascending: true });

      if (error) throw error;

      const weekMap = new Map<number, WeekData>();

      sessions?.forEach(session => {
        const group = activeGroups.find(g => g.id === session.group_id);
        if (!group) return;

        const date = new Date(session.created_at);
        const weekNumber = getDidacticWeek(date);

        if (!weekMap.has(weekNumber)) {
          const { start, end } = getWeekBounds(weekNumber);
          weekMap.set(weekNumber, {
            week_number: weekNumber,
            start_date: start.toLocaleDateString('nl-NL'),
            end_date: end.toLocaleDateString('nl-NL'),
            groups: [],
          });
        }

        const weekData = weekMap.get(weekNumber)!;
        let groupData = weekData.groups.find(g => g.group_id === session.group_id);
        if (!groupData) {
          groupData = {
            group_id: session.group_id,
            group_name: group.name,
            sessions: 0,
          };
          weekData.groups.push(groupData);
        }
        groupData.sessions++;
      });

      const weeks = Array.from(weekMap.values()).sort((a, b) => a.week_number - b.week_number);
      setWeeklyData(weeks);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    }
  };

  const loadYearlyGridData = async () => {
    if (!selectedGoal || !selectedSchool) return;

    try {
      const activeGroups = groups.filter(g => !g.deleted_at);
      const groupIds = activeGroups.map(g => g.id);

      const { data: sessions, error } = await supabase
        .from('goal_tracking_sessions')
        .select('group_id, goal_codes, created_at')
        .in('group_id', groupIds)
        .contains('goal_codes', [selectedGoal]);

      if (error) throw error;

      const gridData = new Map<string, Set<number>>();

      activeGroups.forEach(group => {
        gridData.set(group.id, new Set<number>());
      });

      sessions?.forEach(session => {
        const date = new Date(session.created_at);
        const weekNumber = getDidacticWeek(date);

        if (!gridData.has(session.group_id)) {
          gridData.set(session.group_id, new Set<number>());
        }
        gridData.get(session.group_id)!.add(weekNumber);
      });

      setYearlyGridData(gridData);
    } catch (error) {
      console.error('Error loading yearly grid data:', error);
    }
  };

  const getDidacticWeek = (date: Date): number => {
    const schoolYearStart = new Date(date.getFullYear(), 8, 1);
    if (date < schoolYearStart) {
      schoolYearStart.setFullYear(date.getFullYear() - 1);
    }

    const dayOfWeek = schoolYearStart.getDay();
    const daysToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    schoolYearStart.setDate(schoolYearStart.getDate() + daysToMonday);

    const diffTime = date.getTime() - schoolYearStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7) + 1;

    return Math.max(1, Math.min(weekNumber, 40));
  };

  const getWeekBounds = (weekNumber: number): { start: Date; end: Date } => {
    const today = new Date();
    const schoolYearStart = new Date(today.getFullYear(), 8, 1);
    if (today < schoolYearStart) {
      schoolYearStart.setFullYear(today.getFullYear() - 1);
    }

    const dayOfWeek = schoolYearStart.getDay();
    const daysToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    schoolYearStart.setDate(schoolYearStart.getDate() + daysToMonday);

    const start = new Date(schoolYearStart);
    start.setDate(start.getDate() + (weekNumber - 1) * 7);

    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return { start, end };
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

  const getGoalColor = (goalCode: string): string => {
    const firstDigit = goalCode.split('.')[0];
    const colors: Record<string, string> = {
      '1': 'bg-coral-pink',
      '2': 'bg-sky-blue',
      '3': 'bg-grass-green',
      '4': 'bg-sunny-yellow',
      '5': 'bg-lavender',
      '6': 'bg-deep-purple',
      '7': 'bg-coral-pink',
      '8': 'bg-sky-blue',
    };
    return colors[firstDigit] || 'bg-gray-400';
  };

  const exportToExcel = () => {
    if (view === 'yearly-grid' && selectedGoal) {
      const activeGroups = groups.filter(g => !g.deleted_at && yearlyGridData.has(g.id));

      const data: any[][] = [];

      data.push([`Kleuterdidactiek - Jaaroverzicht ${selectedGoal}`]);
      data.push([`School: ${selectedSchool?.name || 'Onbekend'}`]);
      data.push([`Doel: ${selectedGoal}`]);
      data.push([`Domein: ${getGoalDomain(selectedGoal)}`]);
      data.push([`Datum: ${new Date().toLocaleDateString('nl-NL')}`]);
      data.push([]);

      const headerRow = ['Klas'];
      for (let week = 1; week <= 40; week++) {
        headerRow.push(`Week ${week}`);
      }
      data.push(headerRow);

      activeGroups.forEach(group => {
        const weeksPracticed = yearlyGridData.get(group.id) || new Set();
        const row = [group.name];
        for (let week = 1; week <= 40; week++) {
          row.push(weeksPracticed.has(week) ? 'X' : '');
        }
        data.push(row);
      });

      const ws = XLSX.utils.aoa_to_sheet(data);

      const colWidths = [{ wch: 20 }];
      for (let i = 0; i < 40; i++) {
        colWidths.push({ wch: 8 });
      }
      ws['!cols'] = colWidths;

      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;

          if (R === 6) {
            ws[cellAddress].s = {
              font: { bold: true },
              fill: { fgColor: { rgb: "E5E7EB" } },
              alignment: { horizontal: "center", vertical: "center" }
            };
          } else if (R > 6 && C > 0) {
            const group = activeGroups[R - 7];
            const week = C;
            const weeksPracticed = yearlyGridData.get(group?.id) || new Set();

            if (weeksPracticed.has(week)) {
              ws[cellAddress].s = {
                fill: { fgColor: { rgb: "4ADE80" } },
                alignment: { horizontal: "center", vertical: "center" }
              };
            } else {
              ws[cellAddress].s = {
                fill: { fgColor: { rgb: "F9FAFB" } },
                alignment: { horizontal: "center", vertical: "center" }
              };
            }
          }
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Jaaroverzicht');

      XLSX.writeFile(wb, `jaaroverzicht_${selectedGoal}_${selectedSchool?.name || 'school'}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }
  };

  const exportToCSV = () => {
    if (view === 'overview') {
      let csv = 'Kleuterdidactiek,School Analytics,Overzicht\n\n';
      csv += `School,${selectedSchool?.name || 'Onbekend'}\n`;
      csv += `Datum,${new Date().toLocaleDateString('nl-NL')}\n\n`;
      csv += 'Doelcode,Domein,Totaal Sessies,Aantal Klassen\n';

      getSortedGoals().forEach(goal => {
        csv += `${goal.goal_code},${getGoalDomain(goal.goal_code)},${goal.total_sessions},${goal.groups_practicing}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `school_analytics_${selectedSchool?.name || 'school'}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (view === 'goal-detail' && selectedGoal) {
      let csv = `Kleuterdidactiek,School Analytics,${selectedGoal}\n\n`;
      csv += `School,${selectedSchool?.name || 'Onbekend'}\n`;
      csv += `Doel,${selectedGoal}\n`;
      csv += `Domein,${getGoalDomain(selectedGoal)}\n\n`;
      csv += 'Week,Periode,';

      const allGroups = Array.from(new Set(weeklyData.flatMap(w => w.groups.map(g => g.group_name))));
      csv += allGroups.join(',') + '\n';

      weeklyData.forEach(week => {
        csv += `${week.week_number},${week.start_date} - ${week.end_date},`;
        const groupSessions = allGroups.map(groupName => {
          const groupData = week.groups.find(g => g.group_name === groupName);
          return groupData ? groupData.sessions : 0;
        });
        csv += groupSessions.join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `goal_${selectedGoal}_weekly_${selectedSchool?.name || 'school'}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const naturalSort = compareGoalCodes;

  const getSortedGoals = () => {
    return [...goalOverviews].sort((a, b) => {
      if (sortBy === 'sessions') {
        const sessionDiff = b.total_sessions - a.total_sessions;
        if (sessionDiff !== 0) return sessionDiff;
        return naturalSort(a.goal_code, b.goal_code);
      } else {
        const groupDiff = b.groups_practicing - a.groups_practicing;
        if (groupDiff !== 0) return groupDiff;
        return naturalSort(a.goal_code, b.goal_code);
      }
    });
  };

  if (!selectedSchool) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-white rounded-3xl p-8 shadow-xl text-center max-w-md">
            <School className="w-16 h-16 text-deep-purple mx-auto mb-4" />
            <h2 className="text-2xl font-baloo text-deep-purple mb-2">
              Geen school geselecteerd
            </h2>
            <p className="text-gray-600">
              Selecteer een school om school-brede analytics te bekijken.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-2xl font-baloo text-deep-purple">School analytics laden...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-xl">
          <h1 className="text-3xl font-baloo text-deep-purple mb-2 flex items-center gap-3">
            <School className="w-8 h-8" />
            School Analytics - {selectedSchool?.name}
          </h1>
          <p className="text-gray-600 mb-4">
            Overzicht van doelen geoefend door alle klassen met activiteiten
          </p>
          {selectedSchool?.school_code && (
            <div className="flex items-center gap-3 bg-gradient-to-r from-sunny-yellow/20 to-coral-pink/10 rounded-2xl px-4 py-3 border border-sunny-yellow/40 w-fit">
              <span className="text-sm font-semibold text-gray-700">Schoolcode:</span>
              <span className="text-xl font-baloo tracking-widest text-deep-purple">{selectedSchool.school_code}</span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 hover:border-grass-green rounded-lg text-xs font-semibold text-gray-600 hover:text-grass-green transition-all"
              >
                {codeCopied ? <Check className="w-3 h-3 text-grass-green" /> : <Copy className="w-3 h-3" />}
                {codeCopied ? 'Gekopieerd!' : 'Kopieer'}
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 flex-wrap justify-between items-center">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => {
                setView('overview');
                setSelectedGoal(null);
              }}
              className={`px-6 py-3 rounded-full font-baloo transition-all ${
                view === 'overview'
                  ? 'bg-gradient-to-r from-deep-purple to-lavender text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-deep-purple'
              }`}
            >
              Alle Doelen
            </button>
            <button
              onClick={() => setView('yearly-grid')}
              className={`px-6 py-3 rounded-full font-baloo transition-all flex items-center gap-2 ${
                view === 'yearly-grid'
                  ? 'bg-gradient-to-r from-deep-purple to-lavender text-white'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-deep-purple'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Jaaroverzicht
            </button>
            {selectedGoal && (
              <button
                onClick={() => setView('goal-detail')}
                className={`px-6 py-3 rounded-full font-baloo transition-all ${
                  view === 'goal-detail'
                    ? 'bg-gradient-to-r from-deep-purple to-lavender text-white'
                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-deep-purple'
                }`}
              >
                {selectedGoal} - Per Week
              </button>
            )}
          </div>

          {view === 'yearly-grid' && selectedGoal ? (
            <button
              onClick={exportToExcel}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-grass-green to-[#B5F0BE] text-white font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg"
            >
              <Download className="w-5 h-5" />
              Export naar Excel
            </button>
          ) : view !== 'yearly-grid' && (
            <button
              onClick={exportToCSV}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-grass-green to-[#B5F0BE] text-white font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg"
            >
              <Download className="w-5 h-5" />
              Export naar CSV
            </button>
          )}
        </div>

        {view === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-baloo text-deep-purple flex items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  Alle Doelen ({goalOverviews.length})
                </h2>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'sessions' | 'groups')}
                    className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-sky-blue"
                  >
                    <option value="sessions">Sorteer op Sessies</option>
                    <option value="groups">Sorteer op Aantal Klassen</option>
                  </select>
                </div>
              </div>

              {goalOverviews.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-2">Nog geen activiteiten geregistreerd.</p>
                  <p className="text-sm">
                    Start met het volgen van doelen in je klassen om hier een overzicht te zien.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getSortedGoals().map((goal) => (
                    <div
                      key={goal.goal_code}
                      className="bg-gradient-to-r from-cream to-white p-5 rounded-2xl hover:shadow-lg transition-all cursor-pointer border-2 border-gray-100"
                      onClick={() => {
                        setSelectedGoal(goal.goal_code);
                        setView('goal-detail');
                      }}
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div className={`${getGoalColor(goal.goal_code)} w-3 h-12 rounded-full`}></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl font-baloo text-deep-purple">{goal.goal_code}</span>
                            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                              {getGoalDomain(goal.goal_code)}
                            </span>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-sky-blue" />
                              {goal.total_sessions} sessies
                            </span>
                            <span className="flex items-center gap-1">
                              <School className="w-4 h-4 text-grass-green" />
                              {goal.groups_practicing} {goal.groups_practicing === 1 ? 'klas' : 'klassen'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {goal.groups.map(group => (
                          <div
                            key={group.id}
                            className="bg-lavender/20 px-3 py-1.5 rounded-lg text-sm"
                          >
                            <span className="font-semibold text-deep-purple">{group.name}</span>
                            <span className="text-gray-600 ml-2">({group.sessions}x)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'goal-detail' && selectedGoal && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-baloo text-deep-purple mb-2">
                    {selectedGoal}
                  </h2>
                  <p className="text-gray-600">
                    {getGoalDomain(selectedGoal)} • Per didactische week per klas
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedGoal(null);
                    setView('overview');
                  }}
                  className="px-6 py-3 rounded-full bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
                >
                  Terug naar overzicht
                </button>
              </div>

              {weeklyData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Geen data beschikbaar voor dit doel.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Week</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Periode</th>
                        {Array.from(new Set(weeklyData.flatMap(w => w.groups.map(g => g.group_name)))).map(groupName => (
                          <th key={groupName} className="text-center py-3 px-4 font-semibold text-gray-700">
                            {groupName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {weeklyData.map((week) => {
                        const allGroupNames = Array.from(new Set(weeklyData.flatMap(w => w.groups.map(g => g.group_name))));
                        return (
                          <tr key={week.week_number} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-semibold text-deep-purple">Week {week.week_number}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{week.start_date} - {week.end_date}</td>
                            {allGroupNames.map(groupName => {
                              const groupData = week.groups.find(g => g.group_name === groupName);
                              const sessions = groupData?.sessions || 0;
                              return (
                                <td key={groupName} className="text-center py-3 px-4">
                                  {sessions > 0 ? (
                                    <span className="inline-block bg-gradient-to-r from-sky-blue to-lavender text-white px-3 py-1 rounded-full font-semibold">
                                      {sessions}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'yearly-grid' && (
          <div className="space-y-6">
            {!selectedGoal ? (
              <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
                <Calendar className="w-16 h-16 text-deep-purple mx-auto mb-4" />
                <h2 className="text-2xl font-baloo text-deep-purple mb-4">
                  Selecteer een doel voor het jaaroverzicht
                </h2>
                <p className="text-gray-600 mb-6">
                  Kies een doel om te zien in welke weken elke klas hieraan heeft gewerkt.
                </p>

                {goalOverviews.length === 0 ? (
                  <p className="text-gray-500">Nog geen doelen beschikbaar.</p>
                ) : (
                  <div className="max-w-2xl mx-auto space-y-2">
                    {[...goalOverviews].sort((a, b) => naturalSort(a.goal_code, b.goal_code)).map((goal) => (
                      <button
                        key={goal.goal_code}
                        onClick={() => {
                          setSelectedGoal(goal.goal_code);
                          loadYearlyGridData();
                        }}
                        className="w-full bg-gradient-to-r from-cream to-white p-4 rounded-2xl hover:shadow-lg transition-all border-2 border-gray-100 hover:border-deep-purple text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`${getGoalColor(goal.goal_code)} w-3 h-12 rounded-full`}></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-xl font-baloo text-deep-purple">{goal.goal_code}</span>
                              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                {getGoalDomain(goal.goal_code)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{goal.total_sessions} sessies</span>
                              <span>{goal.groups_practicing} {goal.groups_practicing === 1 ? 'klas' : 'klassen'}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-baloo text-deep-purple mb-2 flex items-center gap-3">
                      <Calendar className="w-8 h-8" />
                      {selectedGoal} - Jaaroverzicht
                    </h2>
                    <p className="text-gray-600">
                      {getGoalDomain(selectedGoal)} • Groen = Geoefend in deze week
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedGoal(null);
                    }}
                    className="px-6 py-3 rounded-full bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Ander doel kiezen
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full">
                    <div className="flex">
                      <div className="sticky left-0 bg-white z-10 border-r-2 border-gray-200">
                        <div className="h-12 flex items-center px-4 border-b-2 border-gray-200 font-semibold text-gray-700">
                          Klas
                        </div>
                        {groups.filter(g => !g.deleted_at && yearlyGridData.has(g.id)).map((group) => (
                          <div key={group.id} className="h-10 flex items-center px-4 border-b border-gray-100 font-medium text-deep-purple">
                            {group.name}
                          </div>
                        ))}
                      </div>

                      <div className="flex-1 overflow-x-auto">
                        <div className="flex border-b-2 border-gray-200">
                          {Array.from({ length: 40 }, (_, i) => i + 1).map((week) => (
                            <div
                              key={week}
                              className="h-12 flex items-center justify-center font-semibold text-gray-700 border-r border-gray-100"
                              style={{ minWidth: '40px', width: '40px' }}
                            >
                              <span className="text-xs">{week}</span>
                            </div>
                          ))}
                        </div>

                        {groups.filter(g => !g.deleted_at && yearlyGridData.has(g.id)).map((group) => {
                          const weeksPracticed = yearlyGridData.get(group.id) || new Set();
                          return (
                            <div key={group.id} className="flex border-b border-gray-100">
                              {Array.from({ length: 40 }, (_, i) => i + 1).map((week) => {
                                const isPracticed = weeksPracticed.has(week);
                                return (
                                  <div
                                    key={week}
                                    className={`h-10 border-r border-gray-100 transition-colors ${
                                      isPracticed
                                        ? 'bg-grass-green hover:bg-grass-green/80'
                                        : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                                    style={{ minWidth: '40px', width: '40px' }}
                                    title={isPracticed ? `Week ${week}: Geoefend` : `Week ${week}: Niet geoefend`}
                                  />
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-6 justify-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-grass-green rounded"></div>
                    <span className="text-gray-600">Geoefend</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-50 border border-gray-200 rounded"></div>
                    <span className="text-gray-600">Niet geoefend</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
