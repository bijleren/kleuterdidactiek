import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data: authData } = await signIn(email, password);

      const { data: userSchools } = await supabase
        .from('user_schools')
        .select('school_id')
        .eq('user_id', authData.user.id)
        .eq('status', 'approved')
        .eq('is_active', true);

      if (!userSchools || userSchools.length === 0) {
        navigate('/onboarding');
      } else {
        navigate('/aan-de-slag', { state: { fromAuth: true } });
      }
    } catch (err: any) {
      if (err.message?.includes('email_not_confirmed') || err.message?.includes('Email not confirmed')) {
        setError('Je e-mailadres is nog niet bevestigd. Controleer je inbox en klik op de bevestigingslink.');
      } else {
        setError(err.message || 'Er is een fout opgetreden bij het inloggen');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-[#FFF5E6] to-[#E8F6F3] font-quicksand overflow-hidden relative">
      {/* Floating shapes background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute w-24 h-24 bg-coral-pink rounded-full opacity-30 top-[10%] left-[5%] animate-float"></div>
        <div className="absolute w-16 h-16 bg-sky-blue rounded-full opacity-30 top-[20%] right-[10%] animate-float-delayed"></div>
        <div className="absolute w-20 h-20 bg-sunny-yellow rounded-full opacity-30 bottom-[15%] left-[15%] animate-float-delayed-2"></div>
        <div className="absolute w-14 h-14 bg-grass-green rounded-full opacity-30 bottom-[30%] right-[20%] animate-float-delayed-3"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <Link to="/" className="inline-block">
          <h1 className="text-3xl font-baloo text-deep-purple whitespace-nowrap">
            🌈 Kleuterdidactiek
          </h1>
        </Link>
      </header>

      {/* Main content */}
      <main className="relative z-5 max-w-md mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-sky-blue to-[#7EDCD5] p-4 rounded-2xl">
              <LogIn className="w-10 h-10 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-baloo text-center text-deep-purple mb-2">
            Welkom terug!
          </h2>
          <p className="text-center text-gray-600 mb-4">
            Log in om door te gaan naar je dashboard
          </p>

          <div className="bg-sky-blue/10 border border-sky-blue/30 rounded-xl px-4 py-3 mb-6">
            <p className="text-sm text-center text-gray-700">
              Al geregistreerd op bijleer.school? Log hier in met dezelfde gegevens.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                E-mailadres
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none transition-colors"
                placeholder="jouw@email.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                  Wachtwoord
                </label>
                <Link to="/forgot-password" className="text-sm text-deep-purple hover:underline">
                  Wachtwoord vergeten?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-blue text-white py-4 rounded-xl font-baloo text-xl shadow-lg hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Inloggen...' : 'Inloggen'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Nog geen account?{' '}
              <Link to="/register" className="text-deep-purple font-semibold hover:underline">
                Registreer hier
              </Link>
            </p>
          </div>
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
