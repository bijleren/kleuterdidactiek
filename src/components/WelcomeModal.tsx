import { useNavigate } from 'react-router-dom';
import { useSchool } from '../contexts/SchoolContext';
import Modal from './Modal';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const { selectedGroup } = useSchool();
  const navigate = useNavigate();

  const handleContinue = () => {
    onClose();
  };

  const handleChangeClass = () => {
    onClose();
    navigate('/groups');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleContinue}>
      <div className="text-center space-y-6">
        <h2 className="text-3xl font-baloo text-deep-purple">Welkom!</h2>

        {selectedGroup && (
          <p className="text-lg text-gray-700">
            Je gaat nu verder werken met <strong className="text-deep-purple">{selectedGroup.name}</strong>.
          </p>
        )}

        <div className="flex gap-3 justify-center pt-4">
          <button
            onClick={handleContinue}
            className="px-8 py-3 bg-deep-purple text-white rounded-full font-semibold hover:bg-opacity-90 transition-all shadow-lg"
          >
            OK
          </button>
          <button
            onClick={handleChangeClass}
            className="px-8 py-3 bg-white text-deep-purple border-2 border-deep-purple rounded-full font-semibold hover:bg-gray-50 transition-all shadow-lg"
          >
            Andere klas
          </button>
        </div>
      </div>
    </Modal>
  );
}
