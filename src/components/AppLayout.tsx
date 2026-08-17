import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, ChevronDown, BarChart3, Target, Calendar, UserCheck, Rocket, HelpCircle, School, MessageSquarePlus, X, Copy, Check, Plus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../lib/supabase';
import FeedbackModal from './FeedbackModal';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const { schools, selectedSchool, setSelectedSchool, groups, selectedGroup, setSelectedGroup, feedbackOpen, openFeedback, closeFeedback } = useSchool();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSchoolCode, setShowSchoolCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [schoolModalView, setSchoolModalView] = useState<'info' | 'create'>('info');
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolAddress, setNewSchoolAddress] = useState('');
  const [newSchoolCity, setNewSchoolCity] = useState('');
  const [newSchoolPostal, setNewSchoolPostal] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdCode, setCreatedCode] = useState('');

  const resetCreateForm = () => {
    setNewSchoolName('');
    setNewSchoolAddress('');
    setNewSchoolCity('');
    setNewSchoolPostal('');
    setCreateError('');
    setCreatedCode('');
  };

  const handleOpenSchoolModal = () => {
    setSchoolModalView('info');
    resetCreateForm();
    setShowSchoolCode(true);
  };

  const handleCloseSchoolModal = () => {
    setShowSchoolCode(false);
    resetCreateForm();
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreateError('');
    setCreateLoading(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .insert({
          name: newSchoolName,
          school_code: code,
          address: newSchoolAddress || null,
          city: newSchoolCity || null,
          postal_code: newSchoolPostal || null,
          created_by: user.id,
        })
        .select()
        .single();
      if (schoolError) throw schoolError;
      await supabase.from('user_schools').insert({
        user_id: user.id,
        school_id: school.id,
        role: 'admin',
        status: 'approved',
      });
      setCreatedCode(code);
    } catch (err: any) {
      setCreateError(err.message || 'Er is een fout opgetreden');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!selectedSchool?.school_code) return;
    navigator.clipboard.writeText(selectedSchool.school_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

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
      <header className="relative z-10 bg-gradient-to-r from-deep-purple to-[#7B7FFF] rounded-[40px] shadow-2xl px-4 sm:px-6 py-4 sm:py-5 mt-6 mx-4 sm:mx-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Top row: Title and controls */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-baloo text-white whitespace-nowrap">
                🌈 Kleuterdidactiek
              </h1>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
              {/* Group selector */}
              {groups.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      value={selectedGroup?.id || ''}
                      onChange={(e) => {
                        const group = groups.find((g) => g.id === e.target.value);
                        if (group) setSelectedGroup(group);
                      }}
                      className="appearance-none bg-white/20 text-white px-3 sm:px-4 py-1.5 sm:py-2 pr-8 sm:pr-10 rounded-full font-semibold border-2 border-white/30 hover:bg-white/30 transition-colors cursor-pointer text-xs sm:text-sm"
                    >
                      <option value="" className="text-gray-800">Selecteer groep...</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id} className="text-gray-800">
                          {group.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-white pointer-events-none" />
                  </div>
                  <Link
                    to="/groups"
                    className="bg-white/20 hover:bg-white/30 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs font-semibold border-2 border-white/30 transition-colors whitespace-nowrap"
                  >
                    Alle klassen
                  </Link>
                </div>
              )}

              {/* School selector */}
              {schools.length > 1 && (
                <div className="relative">
                  <select
                    value={selectedSchool?.id || ''}
                    onChange={(e) => {
                      const school = schools.find((s) => s.id === e.target.value);
                      if (school) setSelectedSchool(school);
                    }}
                    className="appearance-none bg-white/20 text-white px-3 sm:px-4 py-1.5 sm:py-2 pr-8 sm:pr-10 rounded-full font-semibold border-2 border-white/30 hover:bg-white/30 transition-colors cursor-pointer text-xs sm:text-sm"
                  >
                    {schools.map((school) => (
                      <option key={school.id} value={school.id} className="text-gray-800">
                        {school.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-white pointer-events-none" />
                </div>
              )}

              {schools.length === 1 && selectedSchool && (
                <button
                  onClick={handleOpenSchoolModal}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-semibold border-2 border-white/30 text-xs sm:text-sm hidden sm:block transition-colors"
                >
                  {selectedSchool.name}
                </button>
              )}

              {selectedGroup && (
                <Link
                  to={`/onboarding/${selectedGroup.id}`}
                  className="bg-sunny-yellow/90 hover:bg-sunny-yellow text-deep-purple px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs font-semibold border-2 border-sunny-yellow transition-all hover:scale-105 whitespace-nowrap flex items-center gap-1"
                  title="Hoe werkt het?"
                >
                  <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Hoe werkt het?</span>
                </Link>
              )}

              <button
                onClick={() => openFeedback()}
                className="bg-white/20 hover:bg-white/30 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs font-semibold border-2 border-white/30 transition-all hover:scale-105 whitespace-nowrap flex items-center gap-1"
                title="Feedback geven"
              >
                <MessageSquarePlus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Feedback</span>
              </button>

              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white p-1.5 sm:p-2 rounded-full transition-colors flex-shrink-0"
                title="Uitloggen"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Bottom row: Navigation */}
          <nav className="flex justify-center gap-2 flex-wrap pb-1">
            <Link
              to="/aan-de-slag"
              className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full font-medium text-sm sm:text-base shadow-lg transition-all duration-200 ${
                isActive('/aan-de-slag') || isActive('/activi-tijd')
                  ? 'bg-white text-deep-purple scale-105'
                  : 'bg-white/90 text-gray-700 hover:bg-white hover:scale-105'
              }`}
            >
              <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Aan de slag</span>
            </Link>

            <Link
              to="/doelen"
              className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full font-medium text-sm sm:text-base shadow-lg transition-all duration-200 ${
                isActive('/doelen')
                  ? 'bg-white text-deep-purple scale-105'
                  : 'bg-white/90 text-gray-700 hover:bg-white hover:scale-105'
              }`}
            >
              <Target className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Doelen</span>
            </Link>

            <Link
              to="/evalueren"
              className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full font-medium text-sm sm:text-base shadow-lg transition-all duration-200 ${
                isActive('/evalueren')
                  ? 'bg-white text-deep-purple scale-105'
                  : 'bg-white/90 text-gray-700 hover:bg-white hover:scale-105'
              }`}
            >
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Evalueren</span>
            </Link>

            <Link
              to="/planner"
              className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full font-medium text-sm sm:text-base shadow-lg transition-all duration-200 ${
                isActive('/planner')
                  ? 'bg-white text-deep-purple scale-105'
                  : 'bg-white/90 text-gray-700 hover:bg-white hover:scale-105'
              }`}
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Planner</span>
            </Link>

            <Link
              to="/analyse"
              className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full font-medium text-sm sm:text-base shadow-lg transition-all duration-200 ${
                isActive('/analyse')
                  ? 'bg-white text-deep-purple scale-105'
                  : 'bg-white/90 text-gray-700 hover:bg-white hover:scale-105'
              }`}
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Analyse</span>
            </Link>

            <Link
              to="/school-analyse"
              className={`flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-full font-medium text-sm sm:text-base shadow-lg transition-all duration-200 ${
                isActive('/school-analyse')
                  ? 'bg-white text-deep-purple scale-105'
                  : 'bg-white/90 text-gray-700 hover:bg-white hover:scale-105'
              }`}
            >
              <School className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>School</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-5 max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {children}
      </main>

      <FeedbackModal isOpen={feedbackOpen} onClose={closeFeedback} />

      {/* School modal */}
      {showSchoolCode && selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full relative">
            <button
              onClick={handleCloseSchoolModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {schoolModalView === 'info' ? (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-deep-purple to-[#9B9EFF] p-3 rounded-2xl">
                    <School className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-baloo text-deep-purple">{selectedSchool.name}</h2>
                    <p className="text-xs text-gray-500">Schoolinformatie</p>
                  </div>
                </div>

                {selectedSchool.school_code ? (
                  <div className="bg-gradient-to-br from-sunny-yellow/20 to-coral-pink/10 rounded-2xl p-5 border-2 border-sunny-yellow/40 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3 text-center">
                      Schoolcode — deel met collega's
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-3xl font-baloo tracking-widest text-deep-purple bg-white px-6 py-2 rounded-xl shadow-sm border border-gray-100">
                        {selectedSchool.school_code}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-gray-200 hover:border-grass-green rounded-xl text-sm font-semibold text-gray-600 hover:text-grass-green transition-all"
                      >
                        {codeCopied ? <Check className="w-4 h-4 text-grass-green" /> : <Copy className="w-4 h-4" />}
                        {codeCopied ? 'Gekopieerd!' : 'Kopieer'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-3">
                      Collega's voeren deze code in bij hun registratie.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center mb-4">Geen schoolcode beschikbaar.</p>
                )}

                <button
                  onClick={() => { setSchoolModalView('create'); resetCreateForm(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-grass-green to-[#B5F0BE] text-white rounded-2xl font-baloo text-base shadow hover:scale-105 transition-transform"
                >
                  <Plus className="w-4 h-4" />
                  Nieuwe school aanmaken
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-gradient-to-br from-grass-green to-[#B5F0BE] p-3 rounded-2xl">
                    <School className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-baloo text-deep-purple">Nieuwe school</h2>
                    <p className="text-xs text-gray-500">Schoolprofiel aanmaken</p>
                  </div>
                </div>

                {createdCode ? (
                  <div className="text-center space-y-4">
                    <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm font-semibold">
                      School succesvol aangemaakt!
                    </div>
                    <div className="bg-gradient-to-br from-sunny-yellow/20 to-coral-pink/10 rounded-2xl p-5 border-2 border-sunny-yellow/40">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Schoolcode:</p>
                      <span className="text-3xl font-baloo tracking-widest text-deep-purple">{createdCode}</span>
                      <p className="text-xs text-gray-500 mt-2">Deel dit met je collega's.</p>
                    </div>
                    <button
                      onClick={handleCloseSchoolModal}
                      className="w-full px-4 py-3 bg-deep-purple text-white rounded-2xl font-baloo text-base hover:bg-opacity-90 transition-colors"
                    >
                      Sluiten
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateSchool} className="space-y-4">
                    {createError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
                        {createError}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Schoolnaam <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newSchoolName}
                        onChange={(e) => setNewSchoolName(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-grass-green focus:outline-none transition-colors text-sm"
                        placeholder="Basisschool De Regenboog"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Adres (optioneel)
                      </label>
                      <input
                        type="text"
                        value={newSchoolAddress}
                        onChange={(e) => setNewSchoolAddress(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-grass-green focus:outline-none transition-colors text-sm"
                        placeholder="Schoolstraat 123"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Postcode</label>
                        <input
                          type="text"
                          value={newSchoolPostal}
                          onChange={(e) => setNewSchoolPostal(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-grass-green focus:outline-none transition-colors text-sm"
                          placeholder="1000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Stad</label>
                        <input
                          type="text"
                          value={newSchoolCity}
                          onChange={(e) => setNewSchoolCity(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-grass-green focus:outline-none transition-colors text-sm"
                          placeholder="Brussel"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={createLoading || !newSchoolName}
                      className="w-full bg-gradient-to-r from-grass-green to-[#B5F0BE] text-white py-3 rounded-2xl font-baloo text-base shadow hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {createLoading ? 'Aanmaken...' : 'School aanmaken'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSchoolModalView('info')}
                      className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-deep-purple transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Terug
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}

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
