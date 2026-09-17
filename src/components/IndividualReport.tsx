import { useState, useEffect } from 'react';
import { Download, ChevronDown, ChevronRight, ExternalLink, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { compareGoalCodes } from '../utils/goalSort';
import { toLocalDateString } from '../utils/dateUtils';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
}

interface Goal {
  code: string;
  title: string;
  subject: string;
  domain: string;
}

interface Evaluation {
  id: string;
  goal_code: string;
  result: string;
  comment: string | null;
  image_url: string | null;
  evaluated_at: string;
  observation_method: string;
  observation_context: string | null;
}

interface GoalSummary {
  goal_code: string;
  goal_title: string;
  goal_subject: string;
  goal_domain: string;
  times_observed: number;
  no_count: number;
  almost_count: number;
  yes_count: number;
  evaluations: Evaluation[];
}

interface IndividualReportProps {
  groupId: string;
}

export default function IndividualReport({ groupId }: IndividualReportProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [goalSummaries, setGoalSummaries] = useState<GoalSummary[]>([]);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    loadStudents();
  }, [groupId]);

  useEffect(() => {
    if (selectedStudentId) {
      loadStudentReport();
    } else {
      setGoalSummaries([]);
    }
  }, [selectedStudentId]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const { data: groupData } = await supabase
        .from('groups')
        .select('school_id')
        .eq('id', groupId)
        .single();

      if (!groupData) return;

      const { data: studentGroupsData } = await supabase
        .from('student_groups')
        .select('student_id')
        .eq('group_id', groupId);

      const studentIds = studentGroupsData?.map(sg => sg.student_id) || [];

      const { data: studentsData } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('school_id', groupData.school_id)
        .eq('is_active', true)
        .in('id', studentIds)
        .order('last_name');

      if (studentsData) {
        setStudents(studentsData);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentReport = async () => {
    setLoadingReport(true);
    try {
      const { data: evaluationsData } = await supabase
        .from('student_goal_evaluations')
        .select(`
          id,
          goal_code,
          result,
          comment,
          image_url,
          evaluated_at,
          session_id,
          student_evaluation_sessions (
            observation_method,
            observation_context
          )
        `)
        .eq('student_id', selectedStudentId)
        .order('evaluated_at', { ascending: false });

      const { data: goalsData } = await supabase
        .from('educational_goals')
        .select('code, title, subject, domain');

      if (!evaluationsData || !goalsData) return;

      const goalMap: Record<string, GoalSummary> = {};

      goalsData.forEach(goal => {
        goalMap[goal.code] = {
          goal_code: goal.code,
          goal_title: goal.title,
          goal_subject: goal.subject,
          goal_domain: goal.domain,
          times_observed: 0,
          no_count: 0,
          almost_count: 0,
          yes_count: 0,
          evaluations: [],
        };
      });

      evaluationsData.forEach((ev: any) => {
        const session = ev.student_evaluation_sessions;
        const evaluation: Evaluation = {
          id: ev.id,
          goal_code: ev.goal_code,
          result: ev.result,
          comment: ev.comment,
          image_url: ev.image_url || null,
          evaluated_at: ev.evaluated_at,
          observation_method: session?.observation_method || '',
          observation_context: session?.observation_context || null,
        };

        if (goalMap[ev.goal_code]) {
          goalMap[ev.goal_code].times_observed++;
          goalMap[ev.goal_code].evaluations.push(evaluation);

          if (ev.result === 'no') goalMap[ev.goal_code].no_count++;
          else if (ev.result === 'almost') goalMap[ev.goal_code].almost_count++;
          else if (ev.result === 'yes') goalMap[ev.goal_code].yes_count++;
        }
      });

      const summaries = Object.values(goalMap)
        .filter(g => g.times_observed > 0)
        .sort((a, b) => compareGoalCodes(a.goal_code, b.goal_code));

      setGoalSummaries(summaries);
    } catch (error) {
      console.error('Error loading student report:', error);
    } finally {
      setLoadingReport(false);
    }
  };

  const toggleGoalExpansion = (goalCode: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalCode)) {
      newExpanded.delete(goalCode);
    } else {
      newExpanded.add(goalCode);
    }
    setExpandedGoals(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getResultBadge = (result: string) => {
    if (result === 'yes') {
      return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">Ja</span>;
    } else if (result === 'almost') {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">Bijna</span>;
    } else {
      return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">Nee</span>;
    }
  };

  const exportToExcel = async () => {
    // xlsx is ~284 kB: pas laden wanneer iemand echt exporteert,
    // niet bij het opstarten van de app.
    const XLSX = await import('xlsx');
    if (!selectedStudent) return;

    const summaryData = goalSummaries.map(summary => ({
      'Doel Code': summary.goal_code,
      'Titel': summary.goal_title,
      'Vak': summary.goal_subject,
      'Domein': summary.goal_domain,
      'Keer Geobserveerd': summary.times_observed,
      'Niet': summary.no_count,
      'Bijna': summary.almost_count,
      'Ja': summary.yes_count,
    }));

    const detailData: any[] = [];
    goalSummaries.forEach(summary => {
      summary.evaluations.forEach(ev => {
        detailData.push({
          'Doel Code': summary.goal_code,
          'Titel': summary.goal_title,
          'Datum': formatDate(ev.evaluated_at),
          'Resultaat': ev.result === 'yes' ? 'Ja' : ev.result === 'almost' ? 'Bijna' : 'Nee',
          'Methode': ev.observation_method,
          'Context': ev.observation_context || '',
          'Opmerking': ev.comment || '',
          'Foto': ev.image_url || '',
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    const ws2 = XLSX.utils.json_to_sheet(detailData);

    XLSX.utils.book_append_sheet(wb, ws1, 'Overzicht');
    XLSX.utils.book_append_sheet(wb, ws2, 'Details');

    const fileName = `rapport_${selectedStudent.first_name}_${selectedStudent.last_name}_${toLocalDateString(new Date())}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  if (loading) {
    return <div className="text-center py-8">Laden...</div>;
  }

  if (students.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
          <div className="bg-gradient-to-br from-sky-blue/20 to-lavender/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12 text-sky-blue" />
          </div>
          <h3 className="text-2xl font-baloo text-deep-purple mb-4">
            Nog geen studenten in deze groep
          </h3>
          <p className="text-gray-600 mb-6 max-w-lg mx-auto">
            Om individuele rapporten te kunnen bekijken, moet je eerst studenten toevoegen aan deze groep.
          </p>

          <div className="bg-gradient-to-br from-lavender/10 to-sky-blue/10 rounded-2xl p-6 max-w-xl mx-auto">
            <h4 className="text-lg font-baloo text-deep-purple mb-3">
              Studenten beheren
            </h4>
            <p className="text-gray-600 mb-4 text-sm">
              Voor het toevoegen van studenten en volledig groepsbeheer, ga naar het beheerportaal.
            </p>
            <a
              href="https://bijleer.school"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-sky-blue text-white px-6 py-3 rounded-2xl font-baloo shadow-lg hover:scale-105 transition-transform"
            >
              <ExternalLink className="w-5 h-5" />
              Ga naar bijleer.school
            </a>
            <p className="text-sm text-gray-500 mt-3">
              Log in met dezelfde inloggegevens die je hier gebruikt
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[300px]">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Selecteer leerling
          </label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent"
          >
            <option value="">Selecteer een leerling...</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name}
              </option>
            ))}
          </select>
        </div>

        {selectedStudentId && (
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-grass-green text-white px-6 py-2 rounded-full font-semibold hover:bg-grass-green/90 transition-colors shadow-lg"
          >
            <Download className="w-5 h-5" />
            Exporteer naar Excel
          </button>
        )}
      </div>

      {loadingReport && (
        <div className="text-center py-8">Rapport laden...</div>
      )}

      {!loadingReport && selectedStudent && goalSummaries.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800">
            Geen evaluaties gevonden voor {selectedStudent.first_name} {selectedStudent.last_name}
          </p>
        </div>
      )}

      {!loadingReport && goalSummaries.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-deep-purple text-white px-6 py-4">
            <h3 className="text-xl font-baloo">
              Rapport voor {selectedStudent?.first_name} {selectedStudent?.last_name}
            </h3>
          </div>

          <div className="divide-y divide-gray-200">
            {goalSummaries.map((summary) => (
              <div key={summary.goal_code} className="p-6">
                <div
                  className="flex items-start justify-between cursor-pointer hover:bg-gray-50 -m-6 p-6 rounded-lg transition-colors"
                  onClick={() => toggleGoalExpansion(summary.goal_code)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {expandedGoals.has(summary.goal_code) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <h4 className="font-semibold text-gray-900">
                        {summary.goal_code} - {summary.goal_title}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 ml-8">
                      {summary.goal_subject} - Domein {summary.goal_domain}
                    </p>
                  </div>

                  <div className="flex gap-4 ml-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Observaties</div>
                      <div className="text-lg font-bold text-deep-purple">{summary.times_observed}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Nee</div>
                      <div className="text-lg font-bold text-red-600">{summary.no_count}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Bijna</div>
                      <div className="text-lg font-bold text-yellow-600">{summary.almost_count}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Ja</div>
                      <div className="text-lg font-bold text-green-600">{summary.yes_count}</div>
                    </div>
                  </div>
                </div>

                {expandedGoals.has(summary.goal_code) && (
                  <div className="mt-4 ml-8 space-y-3">
                    <h5 className="font-semibold text-gray-700 mb-3">Evaluatie geschiedenis</h5>
                    {summary.evaluations.map((evaluation) => (
                      <div
                        key={evaluation.id}
                        className="bg-gray-50 rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {formatDate(evaluation.evaluated_at)}
                          </span>
                          {getResultBadge(evaluation.result)}
                        </div>
                        <div className="text-sm text-gray-700">
                          <span className="font-semibold">Methode:</span> {evaluation.observation_method}
                        </div>
                        {evaluation.observation_context && (
                          <div className="text-sm text-gray-700">
                            <span className="font-semibold">Context:</span> {evaluation.observation_context}
                          </div>
                        )}
                        {evaluation.comment && (
                          <div className="text-sm text-gray-700">
                            <span className="font-semibold">Opmerking:</span> {evaluation.comment}
                          </div>
                        )}
                        {evaluation.image_url && (
                          <div className="mt-2">
                            <a href={evaluation.image_url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={evaluation.image_url}
                                alt="Observatiefoto"
                                className="max-h-40 rounded-lg border border-gray-200 object-cover hover:opacity-90 transition-opacity cursor-pointer"
                              />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
