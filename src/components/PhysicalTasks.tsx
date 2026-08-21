import { useState, useEffect } from 'react';
import DoelenKnop from './DoelenKnop';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Check, Clock, Search } from 'lucide-react';
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
}

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
  const [showPrompt, setShowPrompt] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    loadTasks();
    loadCompletionLogs();
  }, [groupId]);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('physical_tasks')
        .select('*')
        .eq('is_active', true)
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

  const getCompletionCount = (taskId: string) => {
    return completionLogs.find((log) => log.task_id === taskId)?.count || 0;
  };

  const filteredTasks = tasks.filter((task) => {
    if (goalFilter && !task.goal_codes.includes(goalFilter)) {
      return false;
    }

    const matchesCategory =
      selectedCategory === 'all' || task.task_category === selectedCategory;

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
            Geen opdrachten gevonden in deze categorie
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

      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        message={alertMessage}
      />
    </div>
  );
}
