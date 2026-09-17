import { useState, useEffect } from 'react';
import { Download, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { compareGoalCodes } from '../utils/goalSort';
import CurrentLessonActivityBoard from './CurrentLessonActivityBoard';
import { toLocalDateString } from '../utils/dateUtils';

interface Goal {
  code: string;
  title: string;
  subject: string;
  domain: string;
}

interface DomainInfo {
  domain: string;
  subject: string;
}

interface GoalProgress {
  goal_code: string;
  goal_title: string;
  goal_subject: string;
  goal_domain: string;
  no_count: number;
  almost_count: number;
  yes_count: number;
  total_students: number;
}

interface ClassLevelOverviewProps {
  groupId: string;
}

type SortField = 'goal_code' | 'goal_title' | 'no_count' | 'almost_count' | 'yes_count';
type SortDirection = 'asc' | 'desc';

export default function ClassLevelOverview({ groupId }: ClassLevelOverviewProps) {
  const [progress, setProgress] = useState<GoalProgress[]>([]);
  const [filteredProgress, setFilteredProgress] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [domainFilter, setDomainFilter] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('goal_code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [domains, setDomains] = useState<DomainInfo[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [schoolId, setSchoolId] = useState<string>('');

  useEffect(() => {
    loadProgress();
  }, [groupId]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [progress, domainFilter, subjectFilter, sortField, sortDirection]);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const { data: groupData } = await supabase
        .from('groups')
        .select('school_id')
        .eq('id', groupId)
        .single();

      const groupSchoolId = groupData?.school_id || '';
      setSchoolId(groupSchoolId);

      const { data: studentsData } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', groupSchoolId)
        .eq('is_active', true)
        .in('id', (await supabase.from('student_groups').select('student_id').eq('group_id', groupId)).data?.map(sg => sg.student_id) || []);

      const studentIds = studentsData?.map(s => s.id) || [];

      const { data: evaluationsData } = await supabase
        .from('student_goal_evaluations')
        .select('student_id, goal_code, result')
        .in('student_id', studentIds);

      const { data: goalsData } = await supabase
        .from('educational_goals')
        .select('code, title, subject, domain');

      if (!evaluationsData || !goalsData) return;

      const domainMap = new Map<string, string>();
      goalsData.forEach(g => {
        if (!domainMap.has(g.domain)) {
          domainMap.set(g.domain, g.subject);
        }
      });

      const uniqueDomains = Array.from(domainMap.entries())
        .map(([domain, subject]) => ({ domain, subject }))
        .sort((a, b) => a.domain.localeCompare(b.domain));

      const uniqueSubjects = [...new Set(goalsData.map(g => g.subject))].sort();
      setDomains(uniqueDomains);
      setSubjects(uniqueSubjects);

      const studentGoalMap: Record<string, Record<string, string[]>> = {};
      evaluationsData.forEach(ev => {
        if (!studentGoalMap[ev.student_id]) {
          studentGoalMap[ev.student_id] = {};
        }
        if (!studentGoalMap[ev.student_id][ev.goal_code]) {
          studentGoalMap[ev.student_id][ev.goal_code] = [];
        }
        studentGoalMap[ev.student_id][ev.goal_code].push(ev.result);
      });

      const goalProgressMap: Record<string, GoalProgress> = {};

      goalsData.forEach(goal => {
        let noCount = 0;
        let almostCount = 0;
        let yesCount = 0;

        studentIds.forEach(studentId => {
          const results = studentGoalMap[studentId]?.[goal.code];
          if (results && results.length > 0) {
            const hasYes = results.includes('yes');
            const hasAlmost = results.includes('almost');
            const hasNo = results.includes('no');

            if (hasYes) {
              yesCount++;
            } else if (hasAlmost) {
              almostCount++;
            } else if (hasNo) {
              noCount++;
            }
          }
        });

        goalProgressMap[goal.code] = {
          goal_code: goal.code,
          goal_title: goal.title,
          goal_subject: goal.subject,
          goal_domain: goal.domain,
          no_count: noCount,
          almost_count: almostCount,
          yes_count: yesCount,
          total_students: studentIds.length,
        };
      });

      setProgress(Object.values(goalProgressMap));
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...progress];

    if (domainFilter) {
      filtered = filtered.filter(p => p.goal_domain === domainFilter);
    }

    if (subjectFilter) {
      filtered = filtered.filter(p => p.goal_subject === subjectFilter);
    }

    filtered.sort((a, b) => {
      if (sortField === 'goal_code') {
        const cmp = compareGoalCodes(a.goal_code, b.goal_code);
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProgress(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  const exportToExcel = async () => {
    // xlsx is ~284 kB: pas laden wanneer iemand echt exporteert,
    // niet bij het opstarten van de app.
    const XLSX = await import('xlsx');
    const exportData = filteredProgress.map(item => ({
      'Doel Code': item.goal_code,
      'Titel': item.goal_title,
      'Vak': item.goal_subject,
      'Domein': item.goal_domain,
      'Niet (%)': item.total_students > 0 ? Math.round((item.no_count / item.total_students) * 100) : 0,
      'Niet': item.no_count,
      'Bijna (%)': item.total_students > 0 ? Math.round((item.almost_count / item.total_students) * 100) : 0,
      'Bijna': item.almost_count,
      'Ja (%)': item.total_students > 0 ? Math.round((item.yes_count / item.total_students) * 100) : 0,
      'Ja': item.yes_count,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Klasoverzicht');

    const fileName = `klasoverzicht_${toLocalDateString(new Date())}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (loading) {
    return <div className="text-center py-8">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      {schoolId && <CurrentLessonActivityBoard groupId={groupId} schoolId={schoolId} />}

      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Filter op domein
          </label>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent"
          >
            <option value="">Alle domeinen</option>
            {domains.map(d => (
              <option key={d.domain} value={d.domain}>Domein {d.domain}: {d.subject}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Filter op vak
          </label>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent"
          >
            <option value="">Alle vakken</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>

        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-grass-green text-white px-6 py-2 rounded-full font-semibold hover:bg-grass-green/90 transition-colors shadow-lg"
        >
          <Download className="w-5 h-5" />
          Exporteer naar Excel
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-deep-purple text-white">
              <tr>
                <th
                  onClick={() => handleSort('goal_code')}
                  className="px-6 py-4 text-left font-semibold cursor-pointer hover:bg-deep-purple/90"
                >
                  Doel Code <SortIcon field="goal_code" />
                </th>
                <th
                  onClick={() => handleSort('goal_title')}
                  className="px-6 py-4 text-left font-semibold cursor-pointer hover:bg-deep-purple/90"
                >
                  Titel <SortIcon field="goal_title" />
                </th>
                <th
                  onClick={() => handleSort('no_count')}
                  className="px-6 py-4 text-center font-semibold cursor-pointer hover:bg-deep-purple/90"
                >
                  Niet <SortIcon field="no_count" />
                </th>
                <th
                  onClick={() => handleSort('almost_count')}
                  className="px-6 py-4 text-center font-semibold cursor-pointer hover:bg-deep-purple/90"
                >
                  Bijna <SortIcon field="almost_count" />
                </th>
                <th
                  onClick={() => handleSort('yes_count')}
                  className="px-6 py-4 text-center font-semibold cursor-pointer hover:bg-deep-purple/90"
                >
                  Ja <SortIcon field="yes_count" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProgress.map((item) => (
                <tr key={item.goal_code} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {item.goal_code}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {item.goal_title}
                    <div className="text-xs text-gray-500 mt-1">
                      {item.goal_subject} - Domein {item.goal_domain}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold text-red-700">
                        {item.total_students > 0 ? Math.round((item.no_count / item.total_students) * 100) : 0}%
                      </span>
                      <span className="text-sm text-gray-600">({item.no_count})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold text-yellow-700">
                        {item.total_students > 0 ? Math.round((item.almost_count / item.total_students) * 100) : 0}%
                      </span>
                      <span className="text-sm text-gray-600">({item.almost_count})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold text-green-700">
                        {item.total_students > 0 ? Math.round((item.yes_count / item.total_students) * 100) : 0}%
                      </span>
                      <span className="text-sm text-gray-600">({item.yes_count})</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProgress.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Geen data beschikbaar voor de geselecteerde filters
          </div>
        )}
      </div>
    </div>
  );
}
