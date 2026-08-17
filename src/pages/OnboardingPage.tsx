import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, Circle, Calendar, Target, UserCheck, BarChart3, Video, BookOpen, Users, Rocket } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingFeature {
  id: string;
  title: string;
  description: string;
  icon: typeof Calendar;
  link: string;
  completed: boolean;
}

export default function OnboardingPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const [features, setFeatures] = useState<OnboardingFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (groupId && user) {
      loadOnboardingProgress();
    }
  }, [groupId, user]);

  const loadOnboardingProgress = async () => {
    if (!groupId || !user) return;

    try {
      const { data: group } = await supabase
        .from('groups')
        .select('name')
        .eq('id', groupId)
        .single();

      if (group) {
        setGroupName(group.name);
      }

      const { data: progressData, error } = await supabase
        .from('group_onboarding_progress')
        .select('feature')
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      const completedFeatures = new Set(progressData?.map(p => p.feature) || []);

      const allFeatures: OnboardingFeature[] = [
        {
          id: 'groups_created',
          title: 'Leerlingen en klas maken',
          description: 'Maak je eerste klas aan en voeg leerlingen toe.',
          icon: Users,
          link: '/groups',
          completed: completedFeatures.has('groups_created'),
        },
        {
          id: 'activiteit_viewed',
          title: 'Aan de slag met activiteiten',
          description: 'Ontdek hoe je activiteiten kunt plannen en uitvoeren met je klas.',
          icon: Rocket,
          link: '/aan-de-slag',
          completed: completedFeatures.has('activiteit_viewed'),
        },
        {
          id: 'agenda_viewed',
          title: 'Impact planner voor voorbereiding of naslagwerk',
          description: 'Verken de weekplanner om je lessen te organiseren en terug te kijken op wat je hebt gedaan.',
          icon: Calendar,
          link: '/planner',
          completed: completedFeatures.has('agenda_viewed'),
        },
        {
          id: 'kleuterdoelen_viewed',
          title: 'Doelen verkennen',
          description: 'Bekijk de kleuterdoelen en leer hoe je deze kunt volgen.',
          icon: Target,
          link: '/doelen',
          completed: completedFeatures.has('kleuterdoelen_viewed'),
        },
        {
          id: 'students_added',
          title: 'Leerlingen evalueren',
          description: 'Evalueer de voortgang van je leerlingen.',
          icon: UserCheck,
          link: '/evalueren',
          completed: completedFeatures.has('students_added'),
        },
        {
          id: 'analytics_viewed',
          title: 'Analyse bekijken',
          description: 'Bekijk de voortgang en analyse van je klas.',
          icon: BarChart3,
          link: '/analyse',
          completed: completedFeatures.has('analytics_viewed'),
        },
        {
          id: 'materials_added',
          title: 'Eigen materialen toevoegen',
          description: 'Voeg je eigen educatief materiaal toe aan je bibliotheek.',
          icon: BookOpen,
          link: '/aan-de-slag?tab=materials',
          completed: completedFeatures.has('materials_added'),
        },
        {
          id: 'videos_added',
          title: "Eigen video's toevoegen",
          description: "Voeg je eigen educatieve video's toe om in je lessen te gebruiken.",
          icon: Video,
          link: '/aan-de-slag?tab=videos',
          completed: completedFeatures.has('videos_added'),
        },
      ];

      setFeatures(allFeatures);
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = features.filter(f => f.completed).length;
  const totalCount = features.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-baloo text-deep-purple mb-2">
              Hoe werkt het?
            </h1>
            {groupName && (
              <p className="text-lg text-gray-600">
                Welkom bij {groupName}! Ontdek alle functies van het platform.
              </p>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-purple mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Voortgang
                  </span>
                  <span className="text-sm font-semibold text-deep-purple">
                    {completedCount} / {totalCount}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-grass-green to-sky-blue h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-4">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Link
                      key={feature.id}
                      to={feature.link}
                      className={`block p-6 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.02] ${
                        feature.completed
                          ? 'bg-grass-green/10 border-grass-green'
                          : 'bg-white border-gray-200 hover:border-deep-purple'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                            feature.completed
                              ? 'bg-grass-green text-white'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {feature.completed ? (
                            <Check className="w-6 h-6" />
                          ) : (
                            <Circle className="w-6 h-6" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <Icon
                              className={`w-5 h-5 flex-shrink-0 ${
                                feature.completed ? 'text-grass-green' : 'text-gray-400'
                              }`}
                            />
                            <h3
                              className={`text-lg font-semibold ${
                                feature.completed ? 'text-grass-green' : 'text-gray-900'
                              }`}
                            >
                              {feature.title}
                            </h3>
                          </div>
                          <p className="text-gray-600 text-sm">{feature.description}</p>
                        </div>

                        <div className="flex-shrink-0">
                          <span
                            className={`text-sm font-semibold px-4 py-2 rounded-full ${
                              feature.completed
                                ? 'bg-grass-green text-white'
                                : 'bg-deep-purple text-white'
                            }`}
                          >
                            {feature.completed ? 'Voltooid' : 'Start'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {completedCount === totalCount && (
                <div className="mt-8 p-6 bg-gradient-to-r from-grass-green to-sky-blue rounded-2xl text-center">
                  <h2 className="text-2xl font-baloo text-white mb-2">
                    Gefeliciteerd! 🎉
                  </h2>
                  <p className="text-white">
                    Je hebt alle functies van het platform verkend. Je bent helemaal klaar om te starten!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
