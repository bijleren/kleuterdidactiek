import { useEffect } from 'react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../contexts/AuthContext';
import { trackFeatureUsage } from '../utils/onboardingTracker';
import MaterialsManager from '../components/MaterialsManager';
import { BookOpen } from 'lucide-react';

export default function MaterialsPage() {
  const { selectedSchool, selectedGroup } = useSchool();
  const { user } = useAuth();

  useEffect(() => {
    if (selectedGroup && user) {
      trackFeatureUsage(selectedGroup.id, user.id, 'materials_added');
    }
  }, [selectedGroup, user]);

  if (!selectedSchool) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-600">Selecteer eerst een school om materialen te bekijken</p>
      </div>
    );
  }

  if (!selectedGroup) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-600">Selecteer eerst een klas om materialen te bekijken</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Materialen</h1>
        <p className="text-gray-600">
          Beheer educatieve materialen, websites, boeken en documenten voor je klas
        </p>
      </div>

      <MaterialsManager groupId={selectedGroup.id} />
    </div>
  );
}
