import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Target, Calendar, BarChart3, BookOpen, Video, Gamepad2, PenTool, Clock, Rocket } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import SchoolOnboarding from '../components/SchoolOnboarding';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { selectedSchool, loading: schoolLoading, schools, setSelectedSchool } = useSchool();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (selectedSchool) {
      setShowOnboarding(false);
      loadDashboardData();
    } else if (!schoolLoading) {
      if (schools.length === 0) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
      setLoading(false);
    }
  }, [selectedSchool, schoolLoading, schools]);

  const loadDashboardData = async () => {
    if (!selectedSchool) return;

    try {
      const { data: groupsResult } = await supabase
        .from('groups')
        .select('*, student_groups(count)')
        .eq('school_id', selectedSchool.id);

      if (groupsResult) {
        setGroups(groupsResult);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    window.location.reload();
  };

  if (loading || schoolLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-2xl font-baloo text-deep-purple">Laden...</div>
        </div>
      </AppLayout>
    );
  }

  if (showOnboarding || (!selectedSchool && schools.length === 0)) {
    return <SchoolOnboarding onComplete={handleOnboardingComplete} />;
  }

  if (!selectedSchool) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-baloo text-deep-purple mb-4">
            Geen school geselecteerd
          </h2>
          <p className="text-gray-600 mb-4">
            Selecteer een school om je dashboard te bekijken
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome message */}
        <div className="bg-white rounded-3xl p-6 shadow-xl">
          <h2 className="text-3xl font-baloo text-deep-purple mb-2">
            Welkom bij {selectedSchool.name}!
          </h2>
          <p className="text-gray-600 text-lg">
            Hier vind je een overzicht van je groepen/klassen en hun voortgang
          </p>
        </div>

        {/* Groups list */}
        <div className="bg-white rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-baloo text-deep-purple">Jouw Groepen/Klassen</h3>
            <Link
              to="/groups"
              className="bg-grass-green text-white px-6 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              Beheer Groepen/Klassen
            </Link>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">
                Er zijn nog geen groepen/klassen aangemaakt voor deze school.
              </p>
              <Link
                to="/groups"
                className="inline-block bg-grass-green text-white px-6 py-3 rounded-full font-baloo shadow-lg hover:scale-105 transition-transform"
              >
                Maak je eerste groep aan
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="bg-gradient-to-br from-cream to-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-200 border-2 border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-baloo text-deep-purple mb-1">
                        {group.name}
                      </h4>
                      {group.grade_level && (
                        <span className="text-sm text-gray-600 bg-lavender/30 px-3 py-1 rounded-full">
                          {group.grade_level}
                        </span>
                      )}
                    </div>
                    <div className="bg-gradient-to-br from-sky-blue to-[#7EDCD5] p-2 rounded-xl">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{(group.student_groups && group.student_groups[0]?.count) || 0} studenten</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-lavender to-lavender/70 p-3 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-baloo text-deep-purple">Plan je Planner</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Organiseer je lessen en activiteiten per groep. Plan vooruit en houd overzicht over komende lessen en materialen.
            </p>
            <Link
              to="/planner"
              className="inline-flex items-center gap-2 text-deep-purple font-semibold hover:underline"
            >
              Naar Planner →
            </Link>
          </div>

          {groups.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-deep-purple to-[#9B9EFF] p-3 rounded-xl">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-baloo text-deep-purple">Aan de slag</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Bekijk alle lesmateriaal en activiteiten in één overzicht. Ideaal voor het voorbereiden van je lessen.
              </p>
              <Link
                to="/aan-de-slag"
                className="inline-flex items-center gap-2 text-deep-purple font-semibold hover:underline"
              >
                Aan de slag →
              </Link>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-sky-blue to-[#7EDCD5] p-3 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-baloo text-deep-purple">Volg Leerlingen</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Bekijk individuele voortgang, evalueer doelen en registreer observaties per leerling in het Leerlingen tabblad.
            </p>
            <Link
              to="/evalueren"
              className="inline-flex items-center gap-2 text-deep-purple font-semibold hover:underline"
            >
              Naar Evalueren →
            </Link>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-grass-green to-[#B5F0BE] p-3 rounded-xl">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-baloo text-deep-purple">Analytics</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Krijg inzicht in groepsvoortgang, identificeer aandachtspunten en ontdek welke doelen extra aandacht nodig hebben.
            </p>
            <Link
              to="/analyse"
              className="inline-flex items-center gap-2 text-deep-purple font-semibold hover:underline"
            >
              Naar Analyse →
            </Link>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-sky-blue to-[#7EDCD5] p-3 rounded-xl">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-baloo text-deep-purple">Activi-Tijd</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Beheer activiteitenborden, volg studenten in realtime en organiseer hoekenwerk met drag-and-drop functionaliteit.
            </p>
            <Link
              to="/activi-tijd"
              className="inline-flex items-center gap-2 text-deep-purple font-semibold hover:underline"
            >
              Naar Activi-Tijd →
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
