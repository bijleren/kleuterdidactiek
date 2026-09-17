import { useState, useEffect } from 'react';
import DoelenKnop from './DoelenKnop';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Check, Clock, Search, Plus, Pencil, Trash2, X } from 'lucide-react';
import DoelSelector from './DoelSelector';
import { PromptModal, AlertModal } from './Modal';
import { logActivityToCalendar } from '../utils/calendarLogger';

interface PhysicalTasksProps {
  groupId: string;
  schoolId: string;
  goalFilter?: string;
}

interface Task {
  id: string;
  title: string;
  emoji: string;
  goal_codes: string[];
  description: string;
  instructions: string;
  duration_minutes: number | null;
  materials_needed: string[];
  task_category: string;
  /** Leeg bij een opdracht van het platform, gevuld bij een eigen opdracht van een school. */
  school_id?: string | null;
  /** Gevuld wanneer de opdracht alleen voor die klas bedoeld is. */
  group_id?: string | null;
}

const LEGE_VORM = {
  title: '',
  emoji: '🏃',
  task_category: 'motoriek',
  description: '',
  instructions: '',
  duration_minutes: '',
  materials_needed: '',
  goal_codes: [] as string[],
  alleenDezeKlas: false,
};

interface CompletionLog {
  task_id: string;
  count: number;
}

const categoryColors: Record<string, string> = {
  nederlands: 'border-t-coral-pink',
  wiskunde: 'border-t-sky-blue',
  wetenschap: 'border-t-grass-green',
  geschiedenis: 'border-t-sunny-yellow',
  muziek: 'border-t-lavender',
  drama: 'border-t-coral-pink',
  motoriek: 'border-t-sky-blue',
  sociaal: 'border-t-lavender',
};

export default function PhysicalTasks({ groupId, schoolId, goalFilter }: PhysicalTasksProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completionLogs, setCompletionLogs] = useState<CompletionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [toonVorm, setToonVorm] = useState(false);
  const [bewerkTaak, setBewerkTaak] = useState<Task | null>(null);
  const [vorm, setVorm] = useState(LEGE_VORM);
  const [bewaren, setBewaren] = useState(false);
  const [teVerwijderen, setTeVerwijderen] = useState<Task | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    loadTasks();
    loadCompletionLogs();
  }, [groupId]);

  const loadTasks = async () => {
    try {
      /*
        Platformopdrachten plus de eigen opdrachten van deze school. Een opdracht
        die aan één klas hangt, hoort alleen in die klas thuis.
      */
      const { data, error } = await supabase
        .from('physical_tasks')
        .select('*')
        .eq('is_active', true)
        .or(`school_id.is.null,school_id.eq.${schoolId}`)
        .or(`group_id.is.null,group_id.eq.${groupId}`)
        .order('sort_order');

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompletionLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('task_completion_log')
        .select('task_id')
        .eq('group_id', groupId);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((log) => {
        counts[log.task_id] = (counts[log.task_id] || 0) + 1;
      });

      setCompletionLogs(
        Object.entries(counts).map(([task_id, count]) => ({
          task_id,
          count,
        }))
      );
    } catch (error) {
      console.error('Error loading completion logs:', error);
    }
  };

  const handleTaskComplete = (task: Task) => {
    setSelectedTask(task);
    setShowPrompt(true);
  };

  const handlePromptSubmit = async (notes: string) => {
    if (!user || !selectedTask) return;

    try {
      const { error } = await supabase.from('task_completion_log').insert({
        group_id: groupId,
        task_id: selectedTask.id,
        notes: notes || null,
        created_by: user.id,
      });

      if (error) throw error;

      await logActivityToCalendar({
        itemType: 'physical_task',
        itemId: selectedTask.id,
        itemName: selectedTask.title,
        groupId,
        schoolId,
        userId: user.id,
        durationMinutes: selectedTask.duration_minutes || 15,
      });

      const { error: sessionError } = await supabase.from('goal_tracking_sessions').insert({
        group_id: groupId,
        goal_codes: selectedTask.goal_codes,
        activity_type: 'physical_task',
        activity_name: selectedTask.title,
        duration_minutes: selectedTask.duration_minutes || null,
        repetitions: 1,
        notes: notes || null,
        created_by: user.id,
      });

      if (sessionError) throw sessionError;

      setAlertMessage(`Doe-opdracht "${selectedTask.title}" geregistreerd! ✋`);
      setShowAlert(true);
      loadCompletionLogs();
    } catch (error) {
      console.error('Error logging task completion:', error);
      setAlertMessage('Er ging iets mis bij het registreren van de activiteit.');
      setShowAlert(true);
    }
  };

  /* Alleen opdrachten van de eigen school mag een leerkracht aanpassen. */
  const magBeheren = (task: Task) => !!task.school_id && task.school_id === schoolId;

  const openNieuweTaak = () => {
    setBewerkTaak(null);
    setVorm(LEGE_VORM);
    setToonVorm(true);
  };

  const openBewerkTaak = (task: Task) => {
    setBewerkTaak(task);
    setVorm({
      title: task.title,
      emoji: task.emoji,
      task_category: task.task_category,
      description: task.description || '',
      instructions: task.instructions || '',
      duration_minutes: task.duration_minutes ? String(task.duration_minutes) : '',
      materials_needed: (task.materials_needed || []).join('\n'),
      goal_codes: task.goal_codes || [],
      alleenDezeKlas: !!task.group_id,
    });
    setToonVorm(true);
  };

  const bewaarTaak = async () => {
    if (!user || !vorm.title.trim()) {
      setAlertMessage('Geef de opdracht een titel.');
      setShowAlert(true);
      return;
    }

    setBewaren(true);
    try {
      const rij = {
        title: vorm.title.trim(),
        emoji: vorm.emoji.trim() || '🏃',
        task_category: vorm.task_category,
        description: vorm.description.trim(),
        instructions: vorm.instructions.trim(),
        duration_minutes: vorm.duration_minutes ? Number(vorm.duration_minutes) : null,
        materials_needed: vorm.materials_needed
          .split('\n')
          .map((m) => m.trim())
          .filter(Boolean),
        goal_codes: vorm.goal_codes,
        school_id: schoolId,
        group_id: vorm.alleenDezeKlas ? groupId : null,
      };

      const { error } = bewerkTaak
        ? await supabase.from('physical_tasks').update(rij as never).eq('id', bewerkTaak.id)
        : await supabase
            .from('physical_tasks')
            .insert({ ...rij, created_by: user.id, sort_order: 1000, is_active: true } as never);

      if (error) throw error;

      setToonVorm(false);
      setBewerkTaak(null);
      setVorm(LEGE_VORM);
      loadTasks();
    } catch (error) {
      console.error('Doe-opdracht bewaren mislukt:', error);
      setAlertMessage('De doe-opdracht kon niet bewaard worden.');
      setShowAlert(true);
    } finally {
      setBewaren(false);
    }
  };

  const verwijderTaak = async () => {
    if (!teVerwijderen) return;
    try {
      const { error } = await supabase.from('physical_tasks').delete().eq('id', teVerwijderen.id);
      if (error) throw error;
      setTeVerwijderen(null);
      loadTasks();
    } catch (error) {
      console.error('Doe-opdracht verwijderen mislukt:', error);
      setAlertMessage('De doe-opdracht kon niet verwijderd worden.');
      setShowAlert(true);
    }
  };

  const getCompletionCount = (taskId: string) => {
    return completionLogs.find((log) => log.task_id === taskId)?.count || 0;
  };

  const heeftEigenOpdrachten = tasks.some((task) => task.school_id === schoolId);

  const filteredTasks = tasks.filter((task) => {
    if (goalFilter && !task.goal_codes.includes(goalFilter)) {
      return false;
    }

    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'eigen'
        ? task.school_id === schoolId
        : task.task_category === selectedCategory);

    const matchesSearch =
      searchTerm.trim() === '' ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.instructions.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.goal_codes.some((code) => code.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const categories = [
    { value: 'all', label: 'Alles' },
    // Pas zinvol zodra de school er zelf een heeft; anders levert het filter altijd niets op.
    ...(heeftEigenOpdrachten ? [{ value: 'eigen', label: '✨ Eigen doe-opdrachten' }] : []),
    { value: 'nederlands', label: '📖 Nederlands' },
    { value: 'wiskunde', label: '🔢 Wiskunde' },
    { value: 'wetenschap', label: '🔬 Wetenschap' },
    { value: 'geschiedenis', label: '📜 Geschiedenis' },
    { value: 'muziek', label: '🎵 Muziek' },
    { value: 'drama', label: '🎭 Drama' },
    { value: 'motoriek', label: '🏃 Motoriek' },
    { value: 'sociaal', label: '🤝 Sociaal' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-2xl font-baloo text-deep-purple">Doe-opdrachten laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-xl">
        <h3 className="text-2xl font-baloo text-deep-purple mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6" />
          Doe-opdrachten
        </h3>
        <p className="text-gray-600 mb-2">
          Fysieke oefeningen en activiteiten om verschillende vaardigheden te ontwikkelen.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Klik op een opdracht om te registreren dat de groep deze heeft voltooid.
        </p>

        <button
          onClick={openNieuweTaak}
          className="mb-4 px-4 py-2 rounded-full text-sm font-semibold bg-grass-green text-white hover:scale-105 transition-transform shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Eigen doe-opdracht
        </button>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek opdrachten op titel, beschrijving of doelcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-200 focus:border-deep-purple focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              selectedCategory === category.value
                ? 'bg-deep-purple text-white border-2 border-deep-purple'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-deep-purple'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => {
          const completionCount = getCompletionCount(task.id);
          const borderClass = categoryColors[task.task_category] || 'border-t-gray-300';

          return (
            <div
              key={task.id}
              className={`bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-200 border-t-4 ${borderClass} relative`}
            >
              {completionCount > 0 && (
                <div className="absolute top-4 right-4 bg-grass-green text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                  {completionCount}
                </div>
              )}

              {magBeheren(task) && (
                <div className="absolute top-3 left-3 flex items-center gap-1">
                  <span className="text-[10px] font-semibold text-deep-purple bg-lavender/40 px-2 py-0.5 rounded-full">
                    {task.group_id ? 'eigen · deze klas' : 'eigen · school'}
                  </span>
                  <button
                    onClick={() => openBewerkTaak(task)}
                    title="Bewerken"
                    className="p-1.5 rounded-full text-deep-purple hover:bg-lavender/30 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setTeVerwijderen(task)}
                    title="Verwijderen"
                    className="p-1.5 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="text-5xl mb-3 text-center">{task.emoji}</div>

              <h3 className="text-xl font-baloo text-deep-purple mb-2 text-center">
                {task.title}
              </h3>

              <div className="text-xs text-center bg-lavender/30 px-3 py-1 rounded-full mb-4 inline-block w-full">
                {task.goal_codes.join(', ')}
              </div>
              <div className="mt-2 flex justify-center">
                <DoelenKnop codes={task.goal_codes} naam={task.title} />
              </div>

              <p className="text-sm text-gray-700 mb-3 font-semibold">{task.description}</p>

              <p className="text-sm text-gray-600 mb-4">{task.instructions}</p>

              {task.duration_minutes && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Clock className="w-4 h-4 text-coral-pink" />
                  <span>{task.duration_minutes} minuten</span>
                </div>
              )}

              {task.materials_needed && task.materials_needed.length > 0 && (
                <div className="bg-cream rounded-2xl p-4 mb-4">
                  <p className="text-sm font-semibold text-deep-purple mb-2">
                    📦 Benodigd materiaal:
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {task.materials_needed.map((material, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-grass-green">•</span>
                        <span>{material}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => handleTaskComplete(task)}
                className="w-full bg-grass-green text-white px-4 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Voltooid
              </button>
            </div>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">
            {selectedCategory === 'eigen'
              ? 'Je school heeft nog geen eigen doe-opdrachten'
              : 'Geen opdrachten gevonden in deze categorie'}
          </p>
        </div>
      )}

      {selectedTask && (
        <PromptModal
          isOpen={showPrompt}
          onClose={() => setShowPrompt(false)}
          onSubmit={handlePromptSubmit}
          title={selectedTask.title}
          message={`${selectedTask.description}\n\nWil je notities toevoegen over deze activiteit? (optioneel)`}
          placeholder="Notities over de activiteit..."
          submitText="Registreren"
        />
      )}

      {toonVorm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h3 className="text-2xl font-baloo text-deep-purple">
                {bewerkTaak ? 'Doe-opdracht bewerken' : 'Eigen doe-opdracht'}
              </h3>
              <button onClick={() => setToonVorm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto min-h-0 flex-1 -mx-1 px-1">
              <div className="flex gap-3">
                <div className="w-20">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Icoon</label>
                  <input
                    type="text"
                    value={vorm.emoji}
                    maxLength={4}
                    onChange={(e) => setVorm({ ...vorm, emoji: e.target.value })}
                    className="w-full px-3 py-2 text-center text-xl rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Titel</label>
                  <input
                    type="text"
                    value={vorm.title}
                    onChange={(e) => setVorm({ ...vorm, title: e.target.value })}
                    placeholder="Bijvoorbeeld: Kringloop met pittenzakjes"
                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categorie</label>
                <select
                  value={vorm.task_category}
                  onChange={(e) => setVorm({ ...vorm, task_category: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none"
                >
                  {categories.filter((c) => c.value !== 'all' && c.value !== 'eigen').map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Korte beschrijving</label>
                <input
                  type="text"
                  value={vorm.description}
                  onChange={(e) => setVorm({ ...vorm, description: e.target.value })}
                  placeholder="Waar gaat de opdracht over?"
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Uitleg</label>
                <textarea
                  value={vorm.instructions}
                  onChange={(e) => setVorm({ ...vorm, instructions: e.target.value })}
                  rows={3}
                  placeholder="Hoe voer je de opdracht uit?"
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3">
                <div className="w-32">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Duur (min)</label>
                  <input
                    type="number"
                    min={1}
                    value={vorm.duration_minutes}
                    onChange={(e) => setVorm({ ...vorm, duration_minutes: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Materiaal <span className="font-normal text-gray-500">(één per regel)</span>
                  </label>
                  <textarea
                    value={vorm.materials_needed}
                    onChange={(e) => setVorm({ ...vorm, materials_needed: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-deep-purple focus:outline-none resize-none"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 p-3 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-deep-purple/40 transition-colors">
                <input
                  type="checkbox"
                  checked={vorm.alleenDezeKlas}
                  onChange={(e) => setVorm({ ...vorm, alleenDezeKlas: e.target.checked })}
                  className="mt-1 w-4 h-4 accent-deep-purple"
                />
                <span className="text-sm text-gray-700">
                  Alleen voor deze klas
                  <span className="block text-xs text-gray-500">
                    Laat dit uit als de hele school deze opdracht mag gebruiken.
                  </span>
                </span>
              </label>

              <DoelSelector
                waarde={vorm.goal_codes}
                onChange={(codes) => setVorm({ ...vorm, goal_codes: codes })}
                label="Doelen"
              />
            </div>

            <div className="flex gap-3 pt-4 flex-shrink-0">
              <button
                onClick={bewaarTaak}
                disabled={bewaren}
                className="flex-1 bg-grass-green text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50"
              >
                {bewaren ? 'Bewaren...' : bewerkTaak ? 'Opslaan' : 'Toevoegen'}
              </button>
              <button
                onClick={() => setToonVorm(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
              >
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {teVerwijderen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-xl font-baloo text-deep-purple">Doe-opdracht verwijderen</h3>
            <p className="text-gray-700">
              Weet je zeker dat je <strong>{teVerwijderen.title}</strong> wilt verwijderen?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setTeVerwijderen(null)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-semibold"
              >
                Annuleren
              </button>
              <button
                onClick={verwijderTaak}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-xl font-semibold"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        message={alertMessage}
      />
    </div>
  );
}
