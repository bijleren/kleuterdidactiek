import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, UserCog } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { trackFeatureUsage } from '../utils/onboardingTracker';
import CreateGroupModal from '../components/CreateGroupModal';
import StudentManagement from '../components/StudentManagement';

interface Group {
  id: string;
  name: string;
  grade_level: string | null;
  created_at: string;
  student_count?: number;
}

export default function GroupsPage() {
  const { selectedSchool, setSelectedGroup } = useSchool();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStudentManagement, setShowStudentManagement] = useState(false);

  useEffect(() => {
    if (selectedSchool) {
      loadGroups();
    }
  }, [selectedSchool]);

  useEffect(() => {
    if (selectedSchool && user && groups.length > 0) {
      groups.forEach(group => {
        trackFeatureUsage(group.id, user.id, 'groups_created');
      });
    }
  }, [groups, selectedSchool, user]);

  const loadGroups = async () => {
    if (!selectedSchool) return;

    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          student_groups(count)
        `)
        .eq('school_id', selectedSchool.id)
        .order('name');

      if (error) throw error;

      const groupsWithCount = data?.map((group: any) => ({
        ...group,
        student_count: group.student_groups?.[0]?.count || 0,
      }));

      setGroups(groupsWithCount || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedSchool) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-baloo text-deep-purple mb-4">
            Geen school geselecteerd
          </h2>
          <p className="text-gray-600">
            Selecteer een school om groepen/klassen te bekijken
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-baloo text-deep-purple mb-2">
              Groepen/Klassen - {selectedSchool.name}
            </h2>
            <p className="text-gray-600">
              Beheer je kleuterklassen en bekijk hun voortgang
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowStudentManagement(true)}
              className="bg-gradient-to-r from-sky-blue to-[#B5E9F7] text-white px-6 py-3 rounded-full font-baloo flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
            >
              <UserCog className="w-5 h-5" />
              Studenten Beheer
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-grass-green to-[#B5F0BE] text-white px-6 py-3 rounded-full font-baloo flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
            >
              <Plus className="w-5 h-5" />
              Nieuwe Groep
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-2xl font-baloo text-deep-purple">Laden...</div>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
            <div className="bg-gradient-to-br from-grass-green/20 to-sky-blue/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-grass-green" />
            </div>
            <h3 className="text-2xl font-baloo text-deep-purple mb-4">
              Nog geen groepen/klassen
            </h3>
            <p className="text-gray-600 mb-6">
              Maak je eerste kleuterklas aan om te beginnen met doeltracking
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-grass-green to-[#B5F0BE] text-white px-8 py-4 rounded-full font-baloo text-xl shadow-lg hover:scale-105 transition-transform"
            >
              <Plus className="w-6 h-6 inline mr-2" />
              Maak Eerste Groep
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  setSelectedGroup(group);
                  navigate('/aan-de-slag', { state: { fromAuth: true } });
                }}
                className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 border-2 border-transparent hover:border-sky-blue group text-left w-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-baloo text-deep-purple mb-2 group-hover:text-sky-blue transition-colors">
                      {group.name}
                    </h3>
                    {group.grade_level && (
                      <span className="inline-block text-sm bg-lavender/30 text-deep-purple px-3 py-1 rounded-full font-semibold">
                        {group.grade_level}
                      </span>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-grass-green to-[#B5F0BE] p-3 rounded-2xl">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Studenten</span>
                    <span className="font-semibold text-deep-purple">
                      {group.student_count || 0}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Kleuterdoelen</span>
                      <span className="font-semibold text-sky-blue group-hover:translate-x-1 transition-transform">
                        Bekijk →
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateGroupModal
          schoolId={selectedSchool.id}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadGroups();
          }}
        />
      )}

      {showStudentManagement && (
        <StudentManagement
          schoolId={selectedSchool.id}
          onClose={() => setShowStudentManagement(false)}
        />
      )}
    </AppLayout>
  );
}
