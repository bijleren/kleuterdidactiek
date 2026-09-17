import { useState, useEffect, useRef } from 'react';
import { X, Check, HelpCircle, Save, Download, ExternalLink, Users, Camera, Image, Loader2, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toLocalDateString } from '../utils/dateUtils';

interface Goal {
  code: string;
  title: string;
  subject: string;
  domain: string;
  description: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
}

interface Evaluation {
  student_id: string;
  result: 'no' | 'almost' | 'yes' | null;
  comment: string;
  image_url?: string;
  uploadingImage?: boolean;
}

interface ObserveStudentsProps {
  groupId: string;
}

const OBSERVATION_METHODS = [
  'Kringgesprek',
  'Vrij spel',
  'Begeleide activiteit',
  'Individuele beoordeling',
  'Groepsactiviteit',
  'Observatie tijdens routine',
  'Anders',
];

export default function ObserveStudents({ groupId }: ObserveStudentsProps) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [observationMethod, setObservationMethod] = useState<string>('');
  const [observationContext, setObservationContext] = useState<string>('');
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGoalSuggestions, setShowGoalSuggestions] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [groupId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [goalsResult, studentsResult] = await Promise.all([
        supabase
          .from('educational_goals')
          .select('*')
          .order('code'),
        supabase
          .from('students')
          .select('id, first_name, last_name')
          .eq('school_id', (await supabase.from('groups').select('school_id').eq('id', groupId).single()).data?.school_id)
          .eq('is_active', true)
          .in('id', (await supabase.from('student_groups').select('student_id').eq('group_id', groupId)).data?.map(sg => sg.student_id) || [])
          .order('last_name'),
      ]);

      if (goalsResult.data) setGoals(goalsResult.data);
      if (studentsResult.data) {
        setStudents(studentsResult.data);
        const initialEvaluations: Record<string, Evaluation> = {};
        studentsResult.data.forEach(student => {
          initialEvaluations[student.id] = {
            student_id: student.id,
            result: null,
            comment: '',
            image_url: undefined,
          };
        });
        setEvaluations(initialEvaluations);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluationChange = (studentId: string, result: 'no' | 'almost' | 'yes') => {
    setEvaluations(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        result: prev[studentId]?.result === result ? null : result,
      },
    }));
  };

  const handleSetAll = (result: 'no' | 'almost' | 'yes') => {
    setEvaluations(prev => {
      const next = { ...prev };
      students.forEach(student => {
        next[student.id] = {
          ...prev[student.id],
          student_id: student.id,
          result,
        };
      });
      return next;
    });
  };

  const handleCommentChange = (studentId: string, comment: string) => {
    setEvaluations(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        comment,
      },
    }));
  };

  const handleImageUpload = async (studentId: string, file: File) => {
    if (!file) return;
    setEvaluations(prev => ({ ...prev, [studentId]: { ...prev[studentId], uploadingImage: true } }));
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user!.id}/${Date.now()}_${studentId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('observation-images')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('observation-images').getPublicUrl(path);
      setEvaluations(prev => ({
        ...prev,
        [studentId]: { ...prev[studentId], image_url: data.publicUrl, uploadingImage: false },
      }));
    } catch (err) {
      console.error('Image upload error:', err);
      alert('Fout bij uploaden van afbeelding');
      setEvaluations(prev => ({ ...prev, [studentId]: { ...prev[studentId], uploadingImage: false } }));
    }
  };

  const handleRemoveImage = (studentId: string) => {
    setEvaluations(prev => ({ ...prev, [studentId]: { ...prev[studentId], image_url: undefined } }));
  };

  const handleSaveSession = async () => {
    if (!selectedGoal || !observationMethod || !user) {
      alert('Selecteer een doel en een observatiemethode');
      return;
    }

    const evaluatedStudents = Object.values(evaluations).filter(e => e.result !== null);
    if (evaluatedStudents.length === 0) {
      alert('Evalueer minimaal één leerling');
      return;
    }

    setSaving(true);
    try {
      const { data: session, error: sessionError } = await supabase
        .from('student_evaluation_sessions')
        .insert({
          group_id: groupId,
          goal_code: selectedGoal,
          observation_method: observationMethod,
          observation_context: observationContext || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const evaluationRecords = evaluatedStudents.map(e => ({
        session_id: session.id,
        student_id: e.student_id,
        goal_code: selectedGoal,
        result: e.result!,
        comment: e.comment || null,
        image_url: e.image_url || null,
        created_by: user.id,
      }));

      const { error: evalError } = await supabase
        .from('student_goal_evaluations')
        .insert(evaluationRecords);

      if (evalError) throw evalError;

      alert('Evaluatiesessie succesvol opgeslagen!');

      setSelectedGoal('');
      setObservationMethod('');
      setObservationContext('');
      const resetEvaluations: Record<string, Evaluation> = {};
      students.forEach(student => {
        resetEvaluations[student.id] = {
          student_id: student.id,
          result: null,
          comment: '',
          image_url: undefined,
        };
      });
      setEvaluations(resetEvaluations);
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Fout bij opslaan van evaluatiesessie');
    } finally {
      setSaving(false);
    }
  };

  const filteredGoals = goals.filter(goal =>
    searchTerm === '' ||
    goal.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedGoalData = goals.find(g => g.code === selectedGoal);

  const exportCurrentSession = async () => {
    // xlsx is ~284 kB: pas laden wanneer iemand echt exporteert,
    // niet bij het opstarten van de app.
    const XLSX = await import('xlsx');
    if (!selectedGoal || !observationMethod) {
      alert('Selecteer eerst een doel en observatiemethode');
      return;
    }

    const evaluatedStudents = students
      .filter(s => evaluations[s.id]?.result !== null)
      .map(s => ({
        'Voornaam': s.first_name,
        'Achternaam': s.last_name,
        'Resultaat': evaluations[s.id]?.result === 'yes' ? 'Ja' :
                     evaluations[s.id]?.result === 'almost' ? 'Bijna' : 'Nee',
        'Opmerking': evaluations[s.id]?.comment || '',
        'Foto': evaluations[s.id]?.image_url || '',
      }));

    if (evaluatedStudents.length === 0) {
      alert('Geen evaluaties om te exporteren');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(evaluatedStudents);
    const workbook = XLSX.utils.book_new();

    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 40 },
      { wch: 60 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Evaluaties');

    const metaData = [
      ['Doel Code', selectedGoal],
      ['Doel Titel', selectedGoalData?.title || ''],
      ['Observatiemethode', observationMethod],
      ['Context', observationContext || ''],
      ['Datum', new Date().toLocaleDateString('nl-NL')],
    ];
    const metaSheet = XLSX.utils.aoa_to_sheet(metaData);
    XLSX.utils.book_append_sheet(workbook, metaSheet, 'Info');

    const fileName = `evaluatie_${selectedGoal}_${toLocalDateString(new Date())}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!newFirstName.trim()) return;
    setAddingStudent(true);
    setAddStudentError(null);
    const { data, error } = await supabase
      .from('students')
      .insert({ first_name: newFirstName.trim(), last_name: newLastName.trim(), group_id: groupId })
      .select()
      .single();
    if (error) {
      setAddStudentError('Opslaan mislukt. Probeer opnieuw.');
    } else if (data) {
      setStudents(prev => [...prev, data]);
      setNewFirstName('');
      setNewLastName('');
    }
    setAddingStudent(false);
  }

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
            Om leerlingen te kunnen evalueren, moet je eerst studenten toevoegen aan deze groep.
          </p>

          <div className="bg-gradient-to-br from-lavender/10 to-sky-blue/10 rounded-2xl p-6 max-w-xl mx-auto space-y-5">
            {/* Quick-add student */}
            <div>
              <h4 className="text-lg font-baloo text-deep-purple mb-1 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Snel een leerling toevoegen
              </h4>
              <p className="text-gray-600 text-sm mb-3">
                Voeg direct een leerling toe aan deze groep.
              </p>
              <form onSubmit={handleAddStudent} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Voornaam *"
                  value={newFirstName}
                  onChange={e => setNewFirstName(e.target.value)}
                  required
                  className="flex-1 border-2 border-lavender/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-blue"
                />
                <input
                  type="text"
                  placeholder="Achternaam"
                  value={newLastName}
                  onChange={e => setNewLastName(e.target.value)}
                  className="flex-1 border-2 border-lavender/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-blue"
                />
                <button
                  type="submit"
                  disabled={addingStudent || !newFirstName.trim()}
                  className="inline-flex items-center gap-2 bg-sky-blue text-white px-4 py-2 rounded-xl font-baloo text-sm shadow hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingStudent ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Toevoegen
                </button>
              </form>
              {addStudentError && <p className="text-red-500 text-xs mt-1">{addStudentError}</p>}
            </div>

            <div className="border-t border-lavender/20 pt-4">
              <h4 className="text-lg font-baloo text-deep-purple mb-2">
                Studenten beheren
              </h4>
              <p className="text-gray-600 mb-4 text-sm">
                Voor volledig groepsbeheer en het importeren van leerlijsten, ga naar het beheerportaal.
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-sky-blue/10 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Selecteer doel
          </label>
          <div className="relative">
            <div className="border-2 border-gray-300 rounded-xl p-3 focus-within:border-deep-purple transition-colors bg-white">
              {selectedGoal ? (
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 font-medium">
                    {goals.find(g => g.code === selectedGoal)?.code} - {goals.find(g => g.code === selectedGoal)?.title}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedGoal('');
                      setSearchTerm('');
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    type="button"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowGoalSuggestions(true);
                  }}
                  onFocus={() => setShowGoalSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowGoalSuggestions(false), 200);
                  }}
                  placeholder="Zoek op code, titel of vak..."
                  className="w-full outline-none"
                />
              )}
            </div>
            {showGoalSuggestions && !selectedGoal && (
              <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredGoals.length > 0 ? (
                  filteredGoals.map((goal) => (
                    <button
                      key={goal.code}
                      type="button"
                      onClick={() => {
                        setSelectedGoal(goal.code);
                        setSearchTerm('');
                        setShowGoalSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-semibold text-deep-purple">
                        {goal.code} - {goal.title}
                      </div>
                      <div className="text-xs text-gray-600">
                        {goal.subject} | {goal.description}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Geen doelen gevonden
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {selectedGoalData && (
          <div className="bg-white/60 rounded-lg p-4">
            <p className="text-sm text-gray-600">{selectedGoalData.description}</p>
          </div>
        )}

        {selectedGoal && (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Observatiemethode
              </label>
              <select
                value={observationMethod}
                onChange={(e) => setObservationMethod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent"
              >
                <option value="">Selecteer methode...</option>
                {OBSERVATION_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Extra context (optioneel)
              </label>
              <textarea
                value={observationContext}
                onChange={(e) => setObservationContext(e.target.value)}
                placeholder="Voeg extra context toe over hoe de observatie is uitgevoerd..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          </>
        )}
      </div>

      {selectedGoal && observationMethod && (
        <>
          <div className="space-y-4">
            <h3 className="text-xl font-baloo text-deep-purple">Evalueer leerlingen</h3>

            {students.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 bg-white rounded-xl shadow-md p-3">
                <span className="text-sm font-semibold text-gray-700 mr-1">Zet iedereen op:</span>
                <button
                  type="button"
                  onClick={() => handleSetAll('no')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-all"
                >
                  <X className="w-4 h-4" />
                  Niet behaald
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAll('almost')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-all"
                >
                  <HelpCircle className="w-4 h-4" />
                  Bijna behaald
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAll('yes')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-all"
                >
                  <Check className="w-4 h-4" />
                  Behaald
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="bg-white rounded-xl shadow-md p-4 space-y-3 border-2 border-transparent hover:border-deep-purple/20 transition-all"
                >
                  <div className="font-semibold text-gray-800">
                    {student.first_name} {student.last_name}
                  </div>

                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleEvaluationChange(student.id, 'no')}
                      className={`flex-1 p-3 rounded-lg transition-all ${
                        evaluations[student.id]?.result === 'no'
                          ? 'bg-red-500 text-white scale-105 shadow-lg'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                      title="Niet behaald"
                    >
                      <X className="w-6 h-6 mx-auto" />
                    </button>
                    <button
                      onClick={() => handleEvaluationChange(student.id, 'almost')}
                      className={`flex-1 p-3 rounded-lg transition-all ${
                        evaluations[student.id]?.result === 'almost'
                          ? 'bg-yellow-500 text-white scale-105 shadow-lg'
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      }`}
                      title="Bijna behaald"
                    >
                      <HelpCircle className="w-6 h-6 mx-auto" />
                    </button>
                    <button
                      onClick={() => handleEvaluationChange(student.id, 'yes')}
                      className={`flex-1 p-3 rounded-lg transition-all ${
                        evaluations[student.id]?.result === 'yes'
                          ? 'bg-green-500 text-white scale-105 shadow-lg'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      title="Behaald"
                    >
                      <Check className="w-6 h-6 mx-auto" />
                    </button>
                  </div>

                  {evaluations[student.id]?.result && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <textarea
                          value={evaluations[student.id]?.comment || ''}
                          onChange={(e) => handleCommentChange(student.id, e.target.value)}
                          placeholder="Opmerking (optioneel)..."
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-purple focus:border-transparent resize-none"
                          rows={2}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[student.id]?.click()}
                          disabled={evaluations[student.id]?.uploadingImage}
                          title="Foto toevoegen"
                          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg border-2 border-gray-300 hover:border-deep-purple hover:bg-lavender/10 transition-all disabled:opacity-50"
                        >
                          {evaluations[student.id]?.uploadingImage
                            ? <Loader2 className="w-5 h-5 text-deep-purple animate-spin" />
                            : evaluations[student.id]?.image_url
                            ? <Image className="w-5 h-5 text-grass-green" />
                            : <Camera className="w-5 h-5 text-gray-400" />
                          }
                        </button>
                        <input
                          ref={el => { fileInputRefs.current[student.id] = el; }}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(student.id, file);
                            e.target.value = '';
                          }}
                        />
                      </div>
                      {evaluations[student.id]?.image_url && (
                        <div className="relative inline-block">
                          <img
                            src={evaluations[student.id]!.image_url}
                            alt="Observatiefoto"
                            className="w-full max-h-32 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(student.id)}
                            className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-md hover:bg-red-50 transition-colors"
                            title="Verwijder foto"
                          >
                            <X className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={exportCurrentSession}
              className="flex items-center gap-2 bg-grass-green text-white px-6 py-3 rounded-full font-semibold hover:bg-grass-green/90 transition-colors shadow-lg"
            >
              <Download className="w-5 h-5" />
              Exporteer naar Excel
            </button>
            <button
              onClick={handleSaveSession}
              disabled={saving}
              className="flex items-center gap-2 bg-deep-purple text-white px-6 py-3 rounded-full font-semibold hover:bg-deep-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Opslaan...' : 'Sessie Opslaan'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
