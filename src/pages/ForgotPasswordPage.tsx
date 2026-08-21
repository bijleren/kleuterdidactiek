import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resetPasswordForEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPasswordForEmail(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het verzenden van de reset-email');
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
              <Mail className="w-10 h-10 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-baloo text-center text-deep-purple mb-2">
            Wachtwoord vergeten?
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Geen zorgen! Voer je e-mailadres in en we sturen je een link om je wachtwoord te resetten.
          </p>

          {success ? (
            <div className="space-y-6">
              <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-4 rounded-2xl">
                <p className="font-semibold mb-1">Email verzonden!</p>
                <p className="text-sm">
                  We hebben een wachtwoord reset link naar <strong>{email}</strong> gestuurd.
                  Controleer je inbox en klik op de link om je wachtwoord te resetten.
                </p>
              </div>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 w-full bg-sky-blue text-white py-4 rounded-xl font-baloo text-xl shadow-lg hover:scale-105 transition-transform duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
                Terug naar inloggen
              </Link>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-blue text-white py-4 rounded-xl font-baloo text-xl shadow-lg hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verzenden...' : 'Verstuur reset link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-deep-purple font-semibold hover:underline inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
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
