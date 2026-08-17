import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PenTool, Check, Gamepad2 } from 'lucide-react';
import { PromptModal, AlertModal } from './Modal';
import GamePlayer from './GamePlayer';
import { logActivityToCalendar } from '../utils/calendarLogger';

interface WritingExercisesProps {
  groupId: string;
  schoolId: string;
  goalFilter?: string;
}

interface Exercise {
  id: string;
  title: string;
  emoji: string;
  goal_codes: string[];
  description: string;
  instructions: string;
  tips: string[];
  exercise_type: string;
}

interface PracticeLog {
  exercise_id: string;
  count: number;
}

interface Game {
  id: string;
  name: string;
  emoji: string;
  description: string;
  goal_codes: string[];
}

export default function WritingExercises({ groupId, schoolId, goalFilter }: WritingExercisesProps) {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [practiceLogs, setPracticeLogs] = useState<PracticeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showGamePlayer, setShowGamePlayer] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    loadExercises();
    loadGames();
    loadPracticeLogs();
  }, [groupId]);

  const loadExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('writing_exercises')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGames = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_games')
        .select('*')
        .in('game_type', ['line_recognition', 'direction_quiz'])
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Error loading games:', error);
    }
  };

  const loadPracticeLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('writing_practice_log')
        .select('exercise_id')
        .eq('group_id', groupId);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((log) => {
        counts[log.exercise_id] = (counts[log.exercise_id] || 0) + 1;
      });

      setPracticeLogs(
        Object.entries(counts).map(([exercise_id, count]) => ({
          exercise_id,
          count,
        }))
      );
    } catch (error) {
      console.error('Error loading practice logs:', error);
    }
  };

  const handlePracticeClick = async (exercise: Exercise) => {
    if (user) {
      await logActivityToCalendar({
        itemType: 'writing',
        itemId: exercise.id,
        itemName: exercise.title,
        groupId,
        schoolId,
        userId: user.id,
        durationMinutes: 20,
      });
    }
    setSelectedExercise(exercise);
    setShowPrompt(true);
  };

  const handleGameClick = (game: Game) => {
    setSelectedGame(game);
    setShowGamePlayer(true);
  };

  const handleGameComplete = async (score: number, total: number) => {
    if (!user || !selectedGame) return;

    try {
      const { error } = await supabase.from('game_sessions').insert({
        group_id: groupId,
        game_id: selectedGame.id,
        score: score,
        total_questions: total,
        correct_answers: score,
        created_by: user.id,
      });

      if (error) throw error;

      const { error: sessionError } = await supabase.from('goal_tracking_sessions').insert({
        group_id: groupId,
        goal_codes: selectedGame.goal_codes,
        activity_type: 'game',
        activity_name: selectedGame.name,
        repetitions: score,
        created_by: user.id,
      });

      if (sessionError) throw sessionError;

      setAlertMessage(`Spelsessie "${selectedGame.name}" geregistreerd! 🎮\n\nScore: ${score}/${total}`);
      setShowAlert(true);
    } catch (error) {
      console.error('Error logging game session:', error);
      setAlertMessage('Er ging iets mis bij het registreren van de spelsessie.');
      setShowAlert(true);
    }
  };

  const handlePromptSubmit = async (notes: string) => {
    if (!user || !selectedExercise) return;

    try {
      const { error } = await supabase.from('writing_practice_log').insert({
        group_id: groupId,
        exercise_id: selectedExercise.id,
        notes: notes || null,
        created_by: user.id,
      });

      if (error) throw error;

      const { error: sessionError } = await supabase.from('goal_tracking_sessions').insert({
        group_id: groupId,
        goal_codes: selectedExercise.goal_codes,
        activity_type: 'writing',
        activity_name: selectedExercise.title,
        repetitions: 1,
        notes: notes || null,
        created_by: user.id,
      });

      if (sessionError) throw sessionError;

      setAlertMessage(`Schrijfoefening "${selectedExercise.title}" geregistreerd! ✏️`);
      setShowAlert(true);
      loadPracticeLogs();
    } catch (error) {
      console.error('Error logging practice:', error);
      setAlertMessage('Er ging iets mis bij het registreren van de oefening.');
      setShowAlert(true);
    }
  };

  const getPracticeCount = (exerciseId: string) => {
    return practiceLogs.find((log) => log.exercise_id === exerciseId)?.count || 0;
  };

  const filteredExercises = goalFilter
    ? exercises.filter(ex => ex.goal_codes.includes(goalFilter))
    : exercises;

  const filteredGames = goalFilter
    ? games.filter(g => g.goal_codes.includes(goalFilter))
    : games;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-2xl font-baloo text-deep-purple">Schrijfoefeningen laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-xl">
        <h3 className="text-2xl font-baloo text-deep-purple mb-4 flex items-center gap-2">
          <PenTool className="w-6 h-6" />
          Voorbereidende Schrijfvaardigheden
        </h3>
        <p className="text-gray-600 mb-2">
          Oefen voorbereidende schrijfvaardigheden voor kleuters (Doelen 1.2.1 - 1.2.7)
        </p>
        <p className="text-sm text-gray-500">
          Klik op een oefening om te registreren dat de groep deze heeft geoefend.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExercises.map((exercise) => {
          const practiceCount = getPracticeCount(exercise.id);

          return (
            <div
              key={exercise.id}
              className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-200 border-t-4 border-sky-blue relative"
            >
              {practiceCount > 0 && (
                <div className="absolute top-4 right-4 bg-grass-green text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                  {practiceCount}
                </div>
              )}

              <div className="text-5xl mb-3 text-center">{exercise.emoji}</div>

              <h3 className="text-xl font-baloo text-deep-purple mb-2 text-center">
                {exercise.title}
              </h3>

              <div className="text-xs text-center bg-lavender/30 px-3 py-1 rounded-full mb-4 inline-block w-full">
                {exercise.goal_codes.join(', ')}
              </div>

              <p className="text-sm text-gray-700 mb-3 font-semibold">{exercise.description}</p>

              <p className="text-sm text-gray-600 mb-3">{exercise.instructions}</p>

              {exercise.tips && exercise.tips.length > 0 && (
                <div className="bg-cream rounded-2xl p-4 mb-4">
                  <p className="text-sm font-semibold text-deep-purple mb-2">💡 Tips:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {exercise.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-grass-green">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => handlePracticeClick(exercise)}
                className="w-full bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white px-4 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Geoefend
              </button>
            </div>
          );
        })}
      </div>

      {selectedExercise && (
        <PromptModal
          isOpen={showPrompt}
          onClose={() => setShowPrompt(false)}
          onSubmit={handlePromptSubmit}
          title={selectedExercise.title}
          message={`${selectedExercise.description}\n\nWil je notities toevoegen over deze oefensessie? (optioneel)`}
          placeholder="Notities over de oefensessie..."
          submitText="Registreren"
        />
      )}

      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        message={alertMessage}
      />

      <div className="bg-white rounded-3xl p-6 shadow-xl">
        <h3 className="text-2xl font-baloo text-deep-purple mb-4 flex items-center gap-2">
          <Gamepad2 className="w-6 h-6" />
          Schrijfoefening Spelletjes
        </h3>
        <p className="text-gray-600 mb-6">
          Interactieve spelletjes om schrijfvaardigheden te oefenen
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGames.map((game) => (
            <button
              key={game.id}
              className="bg-gradient-to-br from-cream to-white rounded-3xl p-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-200 border-2 border-sky-blue cursor-pointer text-left"
              onClick={() => handleGameClick(game)}
            >
              <div className="text-6xl mb-4 text-center">{game.emoji}</div>
              <h4 className="text-xl font-baloo text-deep-purple mb-2 text-center">
                {game.name}
              </h4>
              <p className="text-sm text-gray-600 mb-3 text-center">{game.description}</p>
              <div className="text-xs text-center bg-sky-blue/20 px-3 py-2 rounded-full">
                {game.goal_codes.join(', ')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedGame && (
        <GamePlayer
          isOpen={showGamePlayer}
          onClose={() => {
            setShowGamePlayer(false);
            setSelectedGame(null);
          }}
          gameId={selectedGame.id}
          gameName={selectedGame.name}
          onComplete={handleGameComplete}
        />
      )}
    </div>
  );
}
