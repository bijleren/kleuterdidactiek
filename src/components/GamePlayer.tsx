import { useState, useEffect } from 'react';
import { X, Trophy, Star, ThumbsUp, Zap } from 'lucide-react';
import Modal from './Modal';
import { supabase } from '../lib/supabase';

interface GamePlayerProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameName: string;
  onComplete: (score: number, total: number) => void;
}

interface Question {
  id: string;
  question: string;
  visual: string;
  answer: string;
  options: string[];
}

export default function GamePlayer({
  isOpen,
  onClose,
  gameId,
  gameName,
  onComplete,
}: GamePlayerProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && gameId) {
      loadQuestions();
    }
  }, [isOpen, gameId]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('game_questions')
        .select('*')
        .eq('game_id', gameId)
        .order('sort_order');

      if (error) throw error;

      const shuffled = [...(data || [])].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      setCurrentIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setGameComplete(false);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerClick = (answer: string) => {
    if (selectedAnswer) return;

    setSelectedAnswer(answer);
    setShowResult(true);

    if (answer === currentQuestion?.answer) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setGameComplete(true);
        const finalScore = answer === currentQuestion?.answer ? score + 1 : score;
        onComplete(finalScore, questions.length);
      }
    }, 1200);
  };

  const handleRestart = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameComplete(false);
  };

  const handleClose = () => {
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameComplete(false);
    onClose();
  };

  if (!isOpen) return null;

  const currentQuestion = questions[currentIndex];
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  let resultEmoji, resultMessage;
  if (percentage >= 90) {
    resultEmoji = <Trophy className="w-16 h-16 text-sunny-yellow" />;
    resultMessage = 'Fantastisch!';
  } else if (percentage >= 70) {
    resultEmoji = <Star className="w-16 h-16 text-coral-pink" />;
    resultMessage = 'Heel goed!';
  } else if (percentage >= 50) {
    resultEmoji = <ThumbsUp className="w-16 h-16 text-sky-blue" />;
    resultMessage = 'Goed gedaan!';
  } else {
    resultEmoji = <Zap className="w-16 h-16 text-lavender" />;
    resultMessage = 'Blijf oefenen!';
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" closeOnBackdrop={false}>
      <div className="min-h-[400px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-baloo text-deep-purple">{gameName}</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl font-baloo text-deep-purple">Spelletje laden...</p>
          </div>
        ) : gameComplete ? (
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">{resultEmoji}</div>
            <h3 className="text-3xl font-baloo text-deep-purple mb-4">{resultMessage}</h3>
            <div className="text-6xl font-baloo text-grass-green mb-6">
              {score}/{questions.length}
            </div>
            <p className="text-xl text-gray-600 mb-8">{percentage}% correct!</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRestart}
                className="px-8 py-4 rounded-full font-baloo text-white bg-sky-blue hover:scale-105 transition-transform shadow-lg text-lg"
              >
                🔄 Opnieuw Spelen
              </button>
              <button
                onClick={handleClose}
                className="px-8 py-4 rounded-full font-baloo text-white bg-coral-pink hover:scale-105 transition-transform shadow-lg text-lg"
              >
                ✓ Sluiten
              </button>
            </div>
          </div>
        ) : currentQuestion ? (
          <div>
            <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-lavender/30 to-sky-blue/30 p-4 rounded-2xl">
              <span className="font-baloo text-lg text-deep-purple">
                Vraag {currentIndex + 1} van {questions.length}
              </span>
              <span className="font-baloo text-lg text-grass-green">Score: {score}</span>
            </div>

            {currentQuestion.visual && (
              <div
                className="text-center mb-6 text-8xl"
                dangerouslySetInnerHTML={{ __html: currentQuestion.visual }}
              />
            )}

            <h3 className="text-2xl font-baloo text-deep-purple text-center mb-8">
              {currentQuestion.question}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => {
                let buttonClass =
                  'p-6 rounded-3xl font-baloo text-xl border-4 transition-all transform';

                if (selectedAnswer) {
                  if (option === currentQuestion.answer) {
                    buttonClass +=
                      ' bg-grass-green text-white border-grass-green scale-105 shadow-2xl';
                  } else if (option === selectedAnswer) {
                    buttonClass += ' bg-coral-pink text-white border-coral-pink shake';
                  } else {
                    buttonClass += ' bg-gray-200 text-gray-500 border-gray-300 opacity-50';
                  }
                } else {
                  buttonClass +=
                    ' bg-white border-lavender hover:bg-lavender/20 hover:scale-105 hover:shadow-xl cursor-pointer';
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerClick(option)}
                    disabled={!!selectedAnswer}
                    className={buttonClass}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">Geen vragen beschikbaar voor dit spel.</p>
            <button
              onClick={handleClose}
              className="mt-6 px-6 py-3 rounded-full font-baloo bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Sluiten
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
