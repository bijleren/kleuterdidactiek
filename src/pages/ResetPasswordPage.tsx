import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const { updatePassword, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!session && !authLoading) {
        setError('Ongeldige of verlopen reset link. Vraag een nieuwe aan.');
      }
      setCheckingSession(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [session, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 karakters bevatten');
      return;
    }

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen');
      return;
    }

    setLoading(true);

    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het resetten van je wachtwoord');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-[#FFF5E6] to-[#E8F6F3] font-quicksand overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute w-24 h-24 bg-coral-pink rounded-full opacity-30 top-[10%] left-[5%] animate-float"></div>
        <div className="absolute w-16 h-16 bg-sky-blue rounded-full opacity-30 top-[20%] right-[10%] animate-float-delayed"></div>
        <div className="absolute w-20 h-20 bg-sunny-yellow rounded-full opacity-30 bottom-[15%] left-[15%] animate-float-delayed-2"></div>
        <div className="absolute w-14 h-14 bg-grass-green rounded-full opacity-30 bottom-[30%] right-[20%] animate-float-delayed-3"></div>
      </div>

      <header className="relative z-10 px-6 py-6">
        <Link to="/" className="inline-block">
          <h1 className="text-3xl font-baloo text-deep-purple whitespace-nowrap">
            🌈 Kleuterdidactiek
          </h1>
        </Link>
      </header>

      <main className="relative z-5 max-w-md mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-sky-blue to-[#7EDCD5] p-4 rounded-2xl">
              {success ? (
                <CheckCircle className="w-10 h-10 text-white" />
              ) : (
                <Lock className="w-10 h-10 text-white" />
              )}
            </div>
          </div>

          <h2 className="text-3xl font-baloo text-center text-deep-purple mb-2">
            {success ? 'Wachtwoord gereset!' : 'Nieuw wachtwoord instellen'}
          </h2>
          <p className="text-center text-gray-600 mb-6">
            {success
              ? 'Je wordt doorgestuurd naar het dashboard...'
              : 'Kies een nieuw wachtwoord voor je account'}
          </p>

          {success ? (
            <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-4 rounded-2xl text-center">
              <p className="font-semibold mb-1">Gelukt!</p>
              <p className="text-sm">
                Je wachtwoord is succesvol gereset. Je wordt automatisch doorgestuurd naar het dashboard.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Nieuw wachtwoord
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none transition-colors"
                    placeholder="Minimaal 6 karakters"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Bevestig wachtwoord
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none transition-colors"
                    placeholder="Herhaal je wachtwoord"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !session || checkingSession}
                  className="w-full bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white py-4 rounded-xl font-baloo text-xl shadow-lg hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingSession ? 'Link controleren...' : loading ? 'Resetten...' : 'Wachtwoord resetten'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-deep-purple font-semibold hover:underline">
                  Terug naar inloggen
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        .animate-float {
          animation: float 20s infinite ease-in-out;
        }

        .animate-float-delayed {
          animation: float 20s infinite ease-in-out;
          animation-delay: 3s;
        }

        .animate-float-delayed-2 {
          animation: float 20s infinite ease-in-out;
          animation-delay: 6s;
        }

        .animate-float-delayed-3 {
          animation: float 20s infinite ease-in-out;
          animation-delay: 9s;
        }
      `}</style>
    </div>
  );
}
