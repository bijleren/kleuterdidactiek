import { useState } from 'react';
import { useSchool } from '../contexts/SchoolContext';
import AppLayout from '../components/AppLayout';
import ActivityBoardsList from '../components/ActivityBoardsList';
import ActivityBoardView from '../components/ActivityBoardView';
import ActivityAnalytics from '../components/ActivityAnalytics';

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

export default function ActiviTijdPage() {
  const { selectedSchool, selectedGroup } = useSchool();
  const isNonPremium = (selectedSchool?.premium_school ?? 1) === 0;
  const [selectedBoard, setSelectedBoard] = useState<ActivityBoard | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsBoardId, setAnalyticsBoardId] = useState<string | undefined>(undefined);

  const handleBoardSelect = (board: ActivityBoard) => {
    setSelectedBoard(board);
    setShowAnalytics(false);
  };

  const handleBackToList = () => {
    setSelectedBoard(null);
    setShowAnalytics(false);
    setAnalyticsBoardId(undefined);
  };

  const handleShowAnalytics = (boardId?: string) => {
    setAnalyticsBoardId(boardId);
    setShowAnalytics(true);
    setSelectedBoard(null);
  };

  if (!selectedSchool?.id) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-baloo text-deep-purple mb-4">Geen school geselecteerd</h2>
            <p className="text-gray-600">Selecteer een school om activiteitenborden te bekijken</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-[60vh]">
        {isNonPremium && !showAnalytics && !selectedBoard && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 bg-amber-50 border-2 border-amber-200 rounded-2xl px-5 py-4 flex gap-3 items-start">
            <span className="text-xl mt-0.5 flex-shrink-0">💡</span>
            <p className="text-sm text-amber-900 leading-relaxed">
              Bepaal de verschillende activiteiten die er in jullie klassen kunnen zijn, maak de activiteiten aan en voeg ze samen tot een hoekenwerk. Hier kunnen leerlingen aanduiden welke activiteit ze willen doen. Ze kunnen hier ook hun webwijzer voor gebruiken.
            </p>
          </div>
        )}
        {showAnalytics ? (
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToList}
                className="bg-white p-3 rounded-full shadow-lg hover:scale-105 transition-transform"
              >
                &#8592; Terug
              </button>
            </div>
            <ActivityAnalytics schoolId={selectedSchool.id} initialBoardId={analyticsBoardId} />
          </div>
        ) : selectedBoard ? (
          <ActivityBoardView
            board={selectedBoard}
            onBack={handleBackToList}
            schoolId={selectedSchool.id}
          />
        ) : (
          <ActivityBoardsList
            onSelectBoard={handleBoardSelect}
            onBoardsChange={() => {}}
            schoolId={selectedSchool.id}
            groupId={selectedGroup?.id || null}
            groupName={selectedGroup?.name || null}
            onShowAnalytics={handleShowAnalytics}
          />
        )}
      </div>
    </AppLayout>
  );
}
