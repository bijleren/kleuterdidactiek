import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams, useLocation } from 'react-router-dom';
import { Users, Plus } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import VocabularyTracker from '../components/VocabularyTracker';
import GamesGrid from '../components/GamesGrid';
import WritingExercises from '../components/WritingExercises';
import GoalsOverview from '../components/GoalsOverview';
import LeerplandoelenOverzicht from '../components/LeerplandoelenOverzicht';
import PhysicalTasks from '../components/PhysicalTasks';
import VideosManager from '../components/VideosManager';
import MaterialsManager from '../components/MaterialsManager';
import ActivityBoardsList from '../components/ActivityBoardsList';
import ActivityBoardView from '../components/ActivityBoardView';
import ActivityAnalytics from '../components/ActivityAnalytics';
import RoutinesManager from '../components/RoutinesManager';
import LeerdoelActiviteiten from '../components/LeerdoelActiviteiten';
import { supabase } from '../lib/supabase';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { trackFeatureUsage } from '../utils/onboardingTracker';

interface Group {
  id: string;
  name: string;
  grade_level: string | null;
  school_id: string;
}

interface ActivityBoard {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  group_id?: string | null;
  active_until?: string | null;
  activated_at?: string | null;
  archived_at?: string | null;
}

type TabType = 'vocabulary' | 'games' | 'writing' | 'videos' | 'materials' | 'tasks' | 'activities' | 'routines' | 'leerdoelactiviteit' | 'goals' | null;
/** Binnen het doelenscherm: de minimumdoelen van de app, of de leerplandoelen per net. */
type DoelenWeergave = 'minimum' | 'leerplan';

export default function KleuterdoelenPage() {
  const { groupId: urlGroupId } = useParams<{ groupId: string }>();
  const { selectedGroup, setSelectedGroup, selectedSchool } = useSchool();
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [doelenWeergave, setDoelenWeergave] = useState<DoelenWeergave>('minimum');
  const [selectedBoard, setSelectedBoard] = useState<ActivityBoard | null>(null);
  const [showBoardAnalytics, setShowBoardAnalytics] = useState(false);
  const [analyticsBoardId, setAnalyticsBoardId] = useState<string | undefined>(undefined);
  const goalFilter = searchParams.get('goal') || undefined;

  const groupId = urlGroupId || selectedGroup?.id;

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && ['vocabulary', 'games', 'writing', 'videos', 'materials', 'tasks', 'activities', 'routines', 'leerdoelactiviteit', 'goals'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (location.pathname === '/doelen') {
      setActiveTab('goals');
    } else if (location.pathname === '/aan-de-slag') {
      setActiveTab(null);
    }
  }, [searchParams, location.pathname]);

  useEffect(() => {
    if (groupId) {
      loadGroup();
      if (user) {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'goals') {
          trackFeatureUsage(groupId, user.id, 'kleuterdoelen_viewed');
        } else if (activeTab && activeTab !== 'goals') {
          trackFeatureUsage(groupId, user.id, 'activiteit_viewed');
        }
      }
    } else {
      setLoading(false);
    }
  }, [groupId, user, searchParams, activeTab]);

  const loadGroup = async () => {
    if (!groupId) return;

    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .maybeSingle();

      if (error) throw error;
      setGroup(data);

      if (data) {
        setSelectedGroup(data);
      }
    } catch (error) {
      console.error('Error loading group:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-2xl font-baloo text-deep-purple">Laden...</div>
        </div>
      </AppLayout>
    );
  }

  if (!group && !groupId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="bg-white rounded-3xl p-10 shadow-xl max-w-md w-full text-center space-y-6">
            <div className="bg-gradient-to-br from-grass-green/20 to-sky-blue/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-10 h-10 text-grass-green" />
            </div>
            <div>
              <h2 className="text-2xl font-baloo text-deep-purple mb-2">
                Nog geen klas aangemaakt
              </h2>
              <p className="text-gray-600">
                Maak eerst een klas aan om verder te gaan met lessen en activiteiten.
              </p>
            </div>
            <Link
              to="/groups"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-grass-green to-[#B5F0BE] text-white px-8 py-4 rounded-2xl font-baloo text-lg shadow-lg hover:scale-105 transition-transform"
            >
              <Plus className="w-5 h-5" />
              Maak eerste klas aan
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!group) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-baloo text-deep-purple mb-4">
            Groep niet gevonden
          </h2>
          <Link
            to="/groups"
            className="inline-block bg-gradient-to-r from-sky-blue to-[#7EDCD5] text-white px-6 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform"
          >
            Terug naar Groepen
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isNonPremium = (selectedSchool?.premium_school ?? 1) === 0;

  const tabInfoTexts: Partial<Record<NonNullable<TabType>, string>> = {
    games: 'Dit was een experiment om te kijken of we via korte spelletjes de doelen konden activeren. Onze scholen evalueren dit op dit moment en op basis van hun feedback werken we dit verder uit.',
    writing: 'Dit zijn alle doelen rond schrijfmotoriek.',
    tasks: 'We hebben op basis van de minimumdoelen een eerste versie gemaakt van doe-activiteiten die je met de kleuters kan uitvoeren. Hierop hebben we feedback gekregen en in de nieuwe versie komen nieuwe doe-opdrachten alsook de mogelijkheid om eigen doe-opdrachten aan te maken zodat deze gedeeld zijn met het team.',
    videos: 'Hier komen alle bijleervideo\'s op basis van de minimumdoelen, maar je kan ook samen met het team jullie favoriete video\'s verzamelen.',
    materials: 'Hier krijg je een overzicht van alle bijleermaterialen die er voorhanden zijn om aan de minimumdoelen te werken, maar ook jij kan samen met het team jullie materialen databank bij elkaar brengen.',
    activities: 'Bepaal de verschillende activiteiten die er in jullie klassen kunnen zijn, maak de activiteiten aan en voeg ze samen tot een hoekenwerk. Hier kunnen leerlingen aanduiden welke activiteit ze willen doen. Ze kunnen hier ook hun webwijzer voor gebruiken.',
    routines: 'Maak één keer tijd voor je routines goed in kaart te brengen en pluk de vruchten en kijk aan welke doelen er gewerkt is. Gebruik onze routines als inspiratie of maak er nieuwe aan. Ook dit was een eerste versie van onze routines, we verwerken de feedback en komen met een versie 2 in augustus.',
  };

  const isGoalsOnlyMode = activeTab === 'goals';

  const allTabs = [
    { id: 'vocabulary' as TabType, label: 'Woordenschat', icon: '📚', color: 'from-coral-pink to-[#FF8E8E]' },
    { id: 'games' as TabType, label: 'Speel', icon: '🎮', color: 'from-grass-green to-[#B5F0BE]' },
    { id: 'writing' as TabType, label: 'Schrijf', icon: '✏️', color: 'from-sky-blue to-[#7EDCD5]' },
    { id: 'tasks' as TabType, label: 'Doe', icon: '✋', color: 'from-soft-orange to-[#FFCC80]' },
    { id: 'videos' as TabType, label: 'Kijk', icon: '🎬', color: 'from-sunny-yellow to-[#FFD966]' },
    { id: 'materials' as TabType, label: 'Materiaal', icon: '📖', color: 'from-deep-purple to-[#9B9EFF]' },
    { id: 'activities' as TabType, label: 'Hoekenwerk', icon: '🎨', color: 'from-lavender to-[#E8B4FF]' },
    { id: 'routines' as TabType, label: 'Routines', icon: '🔄', color: 'from-blue-500 to-[#60A5FA]' },
    { id: 'leerdoelactiviteit' as TabType, label: 'Leerdoelactiviteit', icon: '💡', color: 'from-deep-purple to-[#7EDCD5]' },
  ];

  const tabs = allTabs;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Tab navigation */}
        {!isGoalsOnlyMode && (
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-3 min-w-max px-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedBoard(null);
                    setShowBoardAnalytics(false);
                  }}
                  className={`px-6 py-3 rounded-full font-baloo text-lg font-semibold shadow-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white scale-105`
                      : 'bg-white text-gray-700 hover:scale-105'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Non-premium tab info block */}
        {isNonPremium && activeTab && activeTab !== 'goals' && activeTab !== 'vocabulary' && tabInfoTexts[activeTab] && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl px-5 py-4 flex gap-3 items-start">
            <span className="text-xl mt-0.5 flex-shrink-0">💡</span>
            <p className="text-sm text-amber-900 leading-relaxed">{tabInfoTexts[activeTab]}</p>
          </div>
        )}

        {/* Tab content */}
        <div>
          {activeTab === 'vocabulary' && groupId && group && <VocabularyTracker groupId={groupId} schoolId={group.school_id} goalFilter={goalFilter} />}
          {activeTab === 'games' && groupId && group && <GamesGrid groupId={groupId} schoolId={group.school_id} goalFilter={goalFilter} />}
          {activeTab === 'writing' && groupId && group && <WritingExercises groupId={groupId} schoolId={group.school_id} goalFilter={goalFilter} />}
          {activeTab === 'videos' && groupId && group && <VideosManager groupId={groupId} schoolId={group.school_id} goalFilter={goalFilter} />}
          {activeTab === 'materials' && groupId && group && <MaterialsManager groupId={groupId} schoolId={group.school_id} goalFilter={goalFilter} />}
          {activeTab === 'tasks' && groupId && group && <PhysicalTasks groupId={groupId} schoolId={group.school_id} goalFilter={goalFilter} />}
          {activeTab === 'activities' && selectedSchool?.id && (
            showBoardAnalytics ? (
              <div className="space-y-6">
                <button
                  onClick={() => { setShowBoardAnalytics(false); setAnalyticsBoardId(undefined); }}
                  className="bg-white p-3 rounded-full shadow-lg hover:scale-105 transition-transform"
                >
                  &#8592; Terug
                </button>
                <ActivityAnalytics schoolId={selectedSchool.id} initialBoardId={analyticsBoardId} />
              </div>
            ) : selectedBoard ? (
              <ActivityBoardView
                board={selectedBoard}
                onBack={() => { setSelectedBoard(null); setShowBoardAnalytics(false); }}
                schoolId={selectedSchool.id}
              />
            ) : (
              <ActivityBoardsList
                onSelectBoard={(board) => { setSelectedBoard(board); setShowBoardAnalytics(false); }}
                onBoardsChange={() => {}}
                schoolId={selectedSchool.id}
                groupId={groupId || null}
                groupName={group?.name || null}
                onShowAnalytics={(boardId) => { setAnalyticsBoardId(boardId); setShowBoardAnalytics(true); setSelectedBoard(null); }}
              />
            )
          )}
          {activeTab === 'leerdoelactiviteit' && <LeerdoelActiviteiten />}
          {activeTab === 'routines' && groupId && group && <RoutinesManager schoolId={group.school_id} groupId={groupId} goalFilter={goalFilter} />}
          {activeTab === 'goals' && groupId && (
            <div className="space-y-6">
              {/* Twee lagen: de minimumdoelen van de app, en de leerplandoelen per net. */}
              <div className="flex flex-wrap gap-3">
                {(
                  [
                    ['minimum', 'Minimumdoelen', '🎯'],
                    ['leerplan', 'Leerplandoelen per net', '🧭'],
                  ] as [DoelenWeergave, string, string][]
                ).map(([id, label, icon]) => (
                  <button
                    key={id}
                    onClick={() => setDoelenWeergave(id)}
                    className={`px-6 py-3 rounded-full font-baloo text-lg font-semibold shadow-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                      doelenWeergave === id
                        ? 'bg-gradient-to-r from-deep-purple to-[#9B9EFF] text-white scale-105'
                        : 'bg-white text-gray-700 hover:scale-105'
                    }`}
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>

              {doelenWeergave === 'minimum' ? (
                <GoalsOverview groupId={groupId} />
              ) : (
                <LeerplandoelenOverzicht groupId={groupId} />
              )}
            </div>
          )}
        </div>

        {/* Introduction text - only shown when no tab is selected */}
        {!isGoalsOnlyMode && activeTab === null && (
          <div className="bg-gradient-to-r from-sky-blue/10 to-coral-pink/10 rounded-2xl p-8 shadow-lg border-2 border-sky-blue/20 space-y-6">
            <h2 className="text-2xl font-baloo text-deep-purple">Welkom bij Aan de Slag!</h2>

            {/* Non-premium: early-access block + video side by side */}
            {(selectedSchool?.premium_school ?? 1) === 0 && (
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: early-access info */}
                <div className="flex-1 space-y-4">
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 space-y-3">
                    <p className="text-base font-semibold text-amber-800">Je bent er vroeg bij!</p>
                    <p className="text-base text-amber-900 leading-relaxed">
                      We hebben dit schooljaar al met scholen samengewerkt om het platform te gebruiken en te testen.
                      Tijdens de zomervakantie verwerken we hun feedback en bouwen we verder — zodat alles klaarstaat
                      voor de officiële lancering in <strong>augustus</strong>. Je krijgt van ons een update zodra alles klaarstaat.
                    </p>
                    <p className="text-base text-amber-900 leading-relaxed">
                      <strong>Tip:</strong>{' '}
                      <a
                        href="https://blinkqr.app/qr/39AYRLBQ8A"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-amber-700 transition-colors"
                      >
                        Download hier de productcatalogus van Bijleren
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-700 mb-2">Wat staat er nog op de planning voor de zomervakantie:</p>
                    <ul className="space-y-1.5">
                      {[
                        'Duidelijke handleiding, help en ondersteuning',
                        "Videocatalogus met Bijleren-video's",
                        'Versie 2.0 van Doe-opdrachten',
                        'Versie 2.0 van Speel',
                        'Versie 2.0 van Woordenschat met alle afbeeldingen en audio, en aanpassingen per onderwijsnet (GO!, Katholiek, OVSG, ...)',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-base text-gray-700">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right: intro video */}
                <div className="lg:w-80 xl:w-96 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-200 aspect-video self-start">
                  <iframe
                    className="w-full h-full"
                    src="https://player.vimeo.com/video/1202752400?h=8d6bf8c7fe&badge=0&autopause=0&player_id=0&app_id=58479"
                    title="KleuterWijs introductievideo"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* How it works — always visible */}
            <div className="space-y-3 text-gray-700 text-base leading-relaxed">
              <p>
                Hier vind je alle materialen en activiteiten om mee aan de slag te gaan.
                Kies een categorie hierboven om te beginnen.
              </p>
              <p><strong>Hoe werkt het?</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Gebruik de materialen en activiteiten in je lessen</li>
                <li>Deze worden automatisch toegevoegd aan je planner</li>
                <li>We houden automatisch bij welke doelen je hebt gewerkt</li>
              </ul>
              <p className="pt-2"><strong>Verschillende manieren om te starten:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Start vanuit de <strong>Planner</strong> om een les te bouwen</li>
                <li>Bekijk achteraf welke doelen je hebt behaald tijdens je lessen</li>
                <li>Start vanuit <strong>Doelen</strong> om nieuwe materialen te vinden die passen bij een specifiek doel</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
