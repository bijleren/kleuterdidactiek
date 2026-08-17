import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import WelcomeModal from '../components/WelcomeModal';
import NoGroupsModal from '../components/NoGroupsModal';
import NonPremiumWelcomeModal from '../components/NonPremiumWelcomeModal';

interface School {
  id: string;
  name: string;
  school_code?: string;
  premium_school?: number;
}

interface Group {
  id: string;
  name: string;
  grade_level?: string | null;
  school_id: string;
}

interface SchoolContextType {
  schools: School[];
  selectedSchool: School | null;
  setSelectedSchool: (school: School) => void;
  groups: Group[];
  selectedGroup: Group | null;
  selectedGroupId: string | null;
  setSelectedGroup: (group: Group | null) => void;
  loading: boolean;
  feedbackOpen: boolean;
  openFeedback: () => void;
  closeFeedback: () => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchoolState] = useState<School | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroupState] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showNoGroupsModal, setShowNoGroupsModal] = useState(false);
  const [showNonPremiumModal, setShowNonPremiumModal] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadSchools();
    } else {
      setSchools([]);
      setSelectedSchoolState(null);
      setGroups([]);
      setSelectedGroupState(null);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (selectedSchool) {
      loadGroups();
    } else {
      setGroups([]);
      setSelectedGroupState(null);
    }
  }, [selectedSchool]);

  const loadSchools = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: userSchoolsData, error: userSchoolsError } = await supabase
        .from('user_schools')
        .select('school_id')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .eq('is_active', true);

      if (userSchoolsError) {
        console.error('Error loading user_schools:', userSchoolsError);
        throw userSchoolsError;
      }

      if (!userSchoolsData || userSchoolsData.length === 0) {
        setSchools([]);
        setLoading(false);
        return;
      }

      const schoolIds = userSchoolsData.map(us => us.school_id);
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('id, name, school_code, premium_school')
        .in('id', schoolIds);

      if (schoolsError) {
        console.error('Error loading schools:', schoolsError);
        throw schoolsError;
      }

      const userSchools = (schoolsData || []) as School[];
      setSchools(userSchools);

      if (userSchools.length > 0) {
        const savedSchoolId = localStorage.getItem('selectedSchoolId');
        const schoolToSelect =
          userSchools.find((s) => s.id === savedSchoolId) || userSchools[0];

        if (schoolToSelect) {
          setSelectedSchoolState(schoolToSelect);
          localStorage.setItem('selectedSchoolId', schoolToSelect.id);

          // Show non-premium modal once per session for non-premium schools
          if ((schoolToSelect.premium_school ?? 0) === 0) {
            const hasShownNonPremium = sessionStorage.getItem('hasShownNonPremiumModal');
            if (!hasShownNonPremium) {
              setShowNonPremiumModal(true);
              sessionStorage.setItem('hasShownNonPremiumModal', 'true');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    if (!selectedSchool) return;

    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('school_id', selectedSchool.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setGroups(data || []);

      if (user && (!data || data.length === 0)) {
        const hasShownNoGroups = sessionStorage.getItem('hasShownNoGroups');
        if (!hasShownNoGroups) {
          setShowNoGroupsModal(true);
          sessionStorage.setItem('hasShownNoGroups', 'true');
        }
        return;
      }

      const savedGroupId = localStorage.getItem('selectedGroupId');
      const groupToSelect =
        (data || []).find((g) => g.id === savedGroupId) || (data && data[0]);

      if (groupToSelect) {
        setSelectedGroupState(groupToSelect);

        // Only show the standard welcome modal for premium schools
        if (user && (selectedSchool.premium_school ?? 0) !== 0) {
          const hasShownWelcome = sessionStorage.getItem('hasShownWelcome');
          if (!hasShownWelcome) {
            setShowWelcomeModal(true);
            sessionStorage.setItem('hasShownWelcome', 'true');
          }
        }
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const setSelectedSchool = (school: School) => {
    setSelectedSchoolState(school);
    localStorage.setItem('selectedSchoolId', school.id);
  };

  const setSelectedGroup = (group: Group | null) => {
    setSelectedGroupState(group);
    if (group) {
      localStorage.setItem('selectedGroupId', group.id);
    } else {
      localStorage.removeItem('selectedGroupId');
    }
  };

  const handleGroupCreated = () => {
    setShowNoGroupsModal(false);
    sessionStorage.removeItem('hasShownNoGroups');
    loadGroups();
  };

  const handleNonPremiumClose = () => {
    setShowNonPremiumModal(false);
  };

  const handleNonPremiumFeedback = () => {
    setShowNonPremiumModal(false);
    setFeedbackOpen(true);
  };

  return (
    <SchoolContext.Provider
      value={{
        schools,
        selectedSchool,
        setSelectedSchool,
        groups,
        selectedGroup,
        selectedGroupId: selectedGroup?.id || null,
        setSelectedGroup,
        loading,
        feedbackOpen,
        openFeedback: () => setFeedbackOpen(true),
        closeFeedback: () => setFeedbackOpen(false),
      }}
    >
      {children}
      {user && (
        <>
          <NonPremiumWelcomeModal
            isOpen={showNonPremiumModal}
            onClose={handleNonPremiumClose}
            onOpenFeedback={handleNonPremiumFeedback}
          />
          <WelcomeModal
            isOpen={showWelcomeModal}
            onClose={() => setShowWelcomeModal(false)}
          />
          {selectedSchool && (
            <NoGroupsModal
              isOpen={showNoGroupsModal}
              onClose={() => setShowNoGroupsModal(false)}
              schoolId={selectedSchool.id}
              schoolName={selectedSchool.name}
              schoolCode={selectedSchool.school_code}
              onGroupCreated={handleGroupCreated}
            />
          )}
        </>
      )}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
}
