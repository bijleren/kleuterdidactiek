import { useState, useEffect } from 'react';
import DoelenKnop from './DoelenKnop';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Play, Trophy, Search } from 'lucide-react';
import GamePlayer from './GamePlayer';
import { AlertModal } from './Modal';
import { logActivityToCalendar } from '../utils/calendarLogger';

interface GamesGridProps {
  groupId: string;
  schoolId: string;
  goalFilter?: string;
}

interface Game {
  id: string;
  name: string;
  emoji: string;
  description: string;
  question_count: number;
  goal_codes: string[];
  game_type: string;
}

interface GameSession {
  game_id: string;
  count: number;
}

const gameTypeColors: Record<string, string> = {
  colors: 'from-pink-100 to-pink-200 border-pink-400',
  counting: 'from-blue-100 to-blue-200 border-blue-400',
  shapes: 'from-green-100 to-green-200 border-green-400',
  animals: 'from-yellow-100 to-yellow-200 border-yellow-400',
  body: 'from-purple-100 to-purple-200 border-purple-400',
  weather: 'from-cyan-100 to-cyan-200 border-cyan-400',
  position: 'from-orange-100 to-orange-200 border-orange-400',
  rhyme: 'from-pink-100 to-pink-200 border-pink-400',
  emotions: 'from-rose-100 to-rose-200 border-rose-400',
  sorting: 'from-gray-100 to-gray-200 border-gray-400',
  days: 'from-indigo-100 to-indigo-200 border-indigo-400',
  letters: 'from-green-100 to-green-200 border-green-400',
  senses: 'from-purple-100 to-purple-200 border-purple-400',
  lifecycle: 'from-teal-100 to-teal-200 border-teal-400',
  patterns: 'from-orange-100 to-orange-200 border-orange-400',
  seasons: 'from-amber-100 to-amber-200 border-amber-400',
  geography: 'from-cyan-100 to-cyan-200 border-cyan-400',
  ranking: 'from-yellow-100 to-yellow-200 border-yellow-400',
  subitize: 'from-blue-100 to-blue-200 border-blue-400',
  money: 'from-green-100 to-green-200 border-green-400',
};

export default function GamesGrid({ groupId, schoolId, goalFilter }: GamesGridProps) {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showGamePlayer, setShowGamePlayer] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    loadGames();
    loadSessions();
  }, [groupId]);

  const loadGames = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_games')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setGames(data || []);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('game_id')
        .eq('group_id', groupId);

      if (error) throw error;

      const sessionCounts: Record<string, number> = {};
      data?.forEach((session) => {
        sessionCounts[session.game_id] = (sessionCounts[session.game_id] || 0) + 1;
      });

      setSessions(
        Object.entries(sessionCounts).map(([game_id, count]) => ({
          game_id,
          count,
        }))
      );
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const handleGameClick = async (game: Game) => {
    if (user) {
      await logActivityToCalendar({
        itemType: 'quiz',
        itemId: game.id,
        itemName: game.name,
        groupId,
        schoolId,
        userId: user.id,
        durationMinutes: 15,
      });
    }
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
      loadSessions();
    } catch (error) {
      console.error('Error logging game session:', error);
      setAlertMessage('Er ging iets mis bij het registreren van de spelsessie.');
      setShowAlert(true);
    }
  };

  const getSessionCount = (gameId: string) => {
    return sessions.find((s) => s.game_id === gameId)?.count || 0;
  };

  const filteredGames = games.filter((game) => {
    if (goalFilter && !game.goal_codes.includes(goalFilter)) {
      return false;
    }

    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      game.name.toLowerCase().includes(searchLower) ||
      game.description.toLowerCase().includes(searchLower) ||
      game.goal_codes.some((code) => code.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-2xl font-baloo text-deep-purple">Spelletjes laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-xl">
        <h3 className="text-2xl font-baloo text-deep-purple mb-4 flex items-center gap-2">
          <Play className="w-6 h-6" />
          Kies een leerspelletje
        </h3>
        <p className="text-gray-600 mb-4">
          Interactieve spelletjes gekoppeld aan specifieke onderwijsdoelen. Klik op een spel om te
          beginnen spelen!
        </p>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek spelletjes op naam, beschrijving of doelcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-200 focus:border-deep-purple focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredGames.map((game) => {
          const sessionCount = getSessionCount(game.id);
          const colorClass = gameTypeColors[game.game_type] || 'from-gray-100 to-gray-200';

          return (
            <div key={game.id} className="flex flex-col gap-2">
            <button
              onClick={() => handleGameClick(game)}
              className={`bg-gradient-to-br ${colorClass} rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 border-2 text-left relative group`}
            >
              {sessionCount > 0 && (
                <div className="absolute top-4 right-4 bg-grass-green text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
                  {sessionCount}
                </div>
              )}

              <div className="text-5xl mb-3 text-center">{game.emoji}</div>

              <h3 className="text-xl font-baloo text-deep-purple mb-2">{game.name}</h3>

              <p className="text-sm text-gray-700 mb-3">{game.description}</p>

              <div className="flex items-center justify-center text-xs text-gray-600 mb-2">
                <span className="flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  {game.question_count} vragen
                </span>
              </div>

              <div className="text-xs bg-white/70 px-3 py-2 rounded-full text-center font-semibold text-deep-purple">
                📚 {game.goal_codes.join(', ')}
              </div>

              <div className="mt-3 text-center">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-grass-green group-hover:translate-x-1 transition-transform">
                  <Play className="w-4 h-4" />
                  Spelen
                </span>
              </div>
            </button>
            <div className="flex justify-center">
              <DoelenKnop codes={game.goal_codes} naam={game.name} />
            </div>
            </div>
          );
        })}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-gray-500">Geen spelletjes gevonden voor "{searchTerm}"</p>
        </div>
      )}

      {selectedGame && (
        <GamePlayer
          isOpen={showGamePlayer}
          onClose={() => setShowGamePlayer(false)}
          gameId={selectedGame.id}
          gameName={selectedGame.name}
          onComplete={handleGameComplete}
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
