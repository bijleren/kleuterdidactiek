import { useState } from 'react';
import { School, Key, Building2, LogOut, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SchoolOnboardingProps {
  onComplete: () => void;
}

type Step = 'choose' | 'join' | 'create';

export default function SchoolOnboarding({ onComplete }: SchoolOnboardingProps) {
  const { user, signOut } = useAuth();
  const [step, setStep] = useState<Step>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [schoolCode, setSchoolCode] = useState('');

  const [schoolName, setSchoolName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const generateSchoolCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleJoinSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id, name')
        .eq('school_code', schoolCode.toUpperCase())
        .maybeSingle();
      if (schoolError) throw schoolError;
      if (!school) {
        setError('School niet gevonden. Controleer de schoolcode en probeer opnieuw.');
        setLoading(false);
        return;
      }
      const { data: existing } = await supabase
        .from('user_schools')
        .select('id')
        .eq('user_id', user.id)
        .eq('school_id', school.id)
        .maybeSingle();
      if (existing) {
        setError('Je bent al verbonden met deze school.');
        setLoading(false);
        return;
      }
      const { error: insertError } = await supabase
        .from('user_schools')
        .insert({ user_id: user.id, school_id: school.id, role: 'teacher', status: 'approved' });
      if (insertError) throw insertError;
      setSuccess(`Je bent succesvol toegevoegd aan ${school.name}!`);
      setTimeout(() => onComplete(), 1500);
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het verbinden met de school');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const code = generateSchoolCode();
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .insert({
          name: schoolName,
          school_code: code,
          address: address || null,
          city: city || null,
          postal_code: postalCode || null,
          created_by: user.id,
        })
        .select()
        .single();
      if (schoolError) throw schoolError;
      const { error: userSchoolError } = await supabase
        .from('user_schools')
        .insert({ user_id: user.id, school_id: school.id, role: 'admin', status: 'approved' });
      if (userSchoolError) throw userSchoolError;
      setGeneratedCode(code);
      setSuccess(`School succesvol aangemaakt! Je schoolcode is: ${code}`);
      setTimeout(() => onComplete(), 3000);
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het aanmaken van de school');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep('choose');
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-[#FFF5E6] to-[#E8F6F3] font-quicksand py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-deep-purple hover:bg-white/50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-semibold">Uitloggen</span>
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-grass-green to-[#B5F0BE] p-4 rounded-2xl">
              <School className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-baloo text-deep-purple mb-2">
            Welkom bij Kleuterdidactiek!
          </h1>
          <p className="text-lg text-gray-600">
            {step === 'choose'
              ? 'Hoe wil je starten?'
              : step === 'join'
              ? 'Voer je schoolcode in'
              : 'Maak een nieuwe school aan'}
          </p>
        </div>

        {/* ── STEP 1: choose ── */}
        {step === 'choose' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <button
              onClick={() => setStep('join')}
              className="group bg-white rounded-3xl shadow-xl p-8 text-left hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 border-2 border-transparent hover:border-sky-blue"
            >
              <div className="bg-gradient-to-br from-sky-blue to-[#7EDCD5] w-14 h-14 rounded-2xl flex items-center justify-center mb-5">
                <Key className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-baloo text-deep-purple mb-2">
                Verbinden met school
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">
                Jouw school is al aangemaakt. Voeg jezelf toe met de 6-karakters schoolcode van je beheerder.
              </p>
              <span className="inline-flex items-center gap-1 text-sky-blue font-semibold text-sm group-hover:gap-2 transition-all">
                Schoolcode invoeren <ArrowRight className="w-4 h-4" />
              </span>
            </button>

            <button
              onClick={() => setStep('create')}
              className="group bg-white rounded-3xl shadow-xl p-8 text-left hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 border-2 border-transparent hover:border-grass-green"
            >
              <div className="bg-gradient-to-br from-grass-green to-[#B5F0BE] w-14 h-14 rounded-2xl flex items-center justify-center mb-5">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-baloo text-deep-purple mb-2">
                Nieuwe school aanmaken
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">
                Jouw school staat er nog niet in. Maak een schoolprofiel aan en deel daarna de code met je collega's.
              </p>
              <span className="inline-flex items-center gap-1 text-grass-green font-semibold text-sm group-hover:gap-2 transition-all">
                School aanmaken <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        )}

        {/* ── STEP 2a: join ── */}
        {step === 'join' && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-sky-blue to-[#7EDCD5] px-8 py-5 flex items-center gap-3">
              <Key className="w-6 h-6 text-white" />
              <span className="font-baloo text-xl text-white">Verbinden met school</span>
            </div>
            <div className="p-8">
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-2xl mb-6">
                  {success}
                </div>
              )}
              <form onSubmit={handleJoinSchool} className="space-y-6">
                <div>
                  <label htmlFor="schoolCode" className="block text-sm font-semibold text-gray-700 mb-2">
                    Schoolcode (6 karakters)
                  </label>
                  <input
                    id="schoolCode"
                    type="text"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-sky-blue focus:outline-none transition-colors uppercase text-center text-2xl font-baloo tracking-widest"
                    placeholder="ABC123"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Vraag je schoolbeheerder om de 6-karakters schoolcode.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || schoolCode.length !== 6}
                  className="w-full bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white py-4 rounded-xl font-baloo text-xl shadow-lg hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? 'Verbinden...' : 'Verbinden met school'}
                </button>

                <button
                  type="button"
                  onClick={goBack}
                  className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-deep-purple text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Terug naar keuze
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── STEP 2b: create ── */}
        {step === 'create' && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-grass-green to-[#B5F0BE] px-8 py-5 flex items-center gap-3">
              <Building2 className="w-6 h-6 text-white" />
              <span className="font-baloo text-xl text-white">Nieuwe school aanmaken</span>
            </div>
            <div className="p-8">
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-2xl mb-6">
                  {success}
                  {generatedCode && (
                    <div className="mt-3 pt-3 border-t border-green-300">
                      <p className="font-semibold">Deel deze code met je collega's:</p>
                      <div className="bg-white px-4 py-2 rounded-lg mt-2 text-2xl font-baloo text-center text-deep-purple">
                        {generatedCode}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <form onSubmit={handleCreateSchool} className="space-y-6">
                <div>
                  <label htmlFor="schoolName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Schoolnaam <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="schoolName"
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-grass-green focus:outline-none transition-colors"
                    placeholder="Basisschool De Regenboog"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                    Adres (optioneel)
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-grass-green focus:outline-none transition-colors"
                    placeholder="Schoolstraat 123"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-semibold text-gray-700 mb-2">
                      Postcode (optioneel)
                    </label>
                    <input
                      id="postalCode"
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-grass-green focus:outline-none transition-colors"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                      Stad (optioneel)
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-grass-green focus:outline-none transition-colors"
                      placeholder="Brussel"
                    />
                  </div>
                </div>

                <div className="bg-grass-green/10 border border-grass-green/30 rounded-xl px-4 py-3">
                  <p className="text-sm text-gray-700">
                    Na het aanmaken krijg je een unieke 6-karakters code die je kunt delen met collega's.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !schoolName}
                  className="w-full bg-gradient-to-r from-grass-green to-[#B5F0BE] text-white py-4 rounded-xl font-baloo text-xl shadow-lg hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? 'School aanmaken...' : 'School aanmaken'}
                </button>

                <button
                  type="button"
                  onClick={goBack}
                  className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-deep-purple text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Terug naar keuze
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
