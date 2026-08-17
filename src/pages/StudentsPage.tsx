import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSchool } from '../contexts/SchoolContext';
import { trackFeatureUsage } from '../utils/onboardingTracker';
import ObserveStudents from '../components/ObserveStudents';
import ClassLevelOverview from '../components/ClassLevelOverview';
import IndividualReport from '../components/IndividualReport';

interface Group {
  id: string;
  name: string;
  school_id: string;
}

export default function StudentsPage() {
  const { groupId: urlGroupId } = useParams<{ groupId: string }>();
  const { selectedGroup } = useSchool();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  const groupId = urlGroupId || selectedGroup?.id;
  const activeTab = searchParams.get('tab') || 'observe';

  useEffect(() => {
    if (groupId) {
      loadGroup();
      if (user) {
        trackFeatureUsage(groupId, user.id, 'students_added');
      }
    }
  }, [groupId, user]);

  const loadGroup = async () => {
    if (!groupId) return;

    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) throw error;
      setGroup(data);
    } catch (error) {
      console.error('Error loading group:', error);
    } finally {
      setLoading(false);
    }
  };

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
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

  if (!group) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-xl font-baloo text-gray-600">Groep niet gevonden</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-baloo text-deep-purple">
              Leerlingen: {group.name}
            </h1>
          </div>

          <div className="flex gap-2 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('observe')}
              className={`px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 ${
                activeTab === 'observe'
                  ? 'text-deep-purple border-deep-purple'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Observeren & Evalueren
            </button>
            <button
              onClick={() => setActiveTab('class')}
              className={`px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 ${
                activeTab === 'class'
                  ? 'text-deep-purple border-deep-purple'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Klasoverzicht
            </button>
            <button
              onClick={() => setActiveTab('individual')}
              className={`px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 ${
                activeTab === 'individual'
                  ? 'text-deep-purple border-deep-purple'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Individueel Rapport
            </button>
          </div>

          <div>
            {activeTab === 'observe' && <ObserveStudents groupId={groupId!} />}
            {activeTab === 'class' && <ClassLevelOverview groupId={groupId!} />}
            {activeTab === 'individual' && <IndividualReport groupId={groupId!} />}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
