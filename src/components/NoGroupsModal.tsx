import { useState } from 'react';
import { Users, X, ExternalLink, Plus, Copy, Check } from 'lucide-react';
import Modal from './Modal';
import CreateGroupModal from './CreateGroupModal';

interface NoGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  schoolName: string;
  schoolCode?: string;
  onGroupCreated: () => void;
}

export default function NoGroupsModal({
  isOpen,
  onClose,
  schoolId,
  schoolName,
  schoolCode,
  onGroupCreated,
}: NoGroupsModalProps) {
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!schoolCode) return;
    navigator.clipboard.writeText(schoolCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateGroup = () => {
    setShowCreateGroupModal(true);
  };

  const handleGroupCreated = () => {
    setShowCreateGroupModal(false);
    onGroupCreated();
    onClose();
  };

  if (showCreateGroupModal) {
    return (
      <CreateGroupModal
        schoolId={schoolId}
        onClose={() => setShowCreateGroupModal(false)}
        onSuccess={handleGroupCreated}
      />
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="bg-gradient-to-br from-grass-green/20 to-sky-blue/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12 text-grass-green" />
          </div>
          <h2 className="text-3xl font-baloo text-deep-purple mb-3">
            Welkom bij {schoolName}!
          </h2>
          <p className="text-lg text-gray-600">
            Je bent verbonden met de school, maar er zijn nog geen klassen aangemaakt.
          </p>
        </div>

        {schoolCode && (
          <div className="bg-gradient-to-br from-sunny-yellow/20 to-coral-pink/10 rounded-2xl p-5 border-2 border-sunny-yellow/40 mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-2 text-center">
              Jouw schoolcode — deel dit met collega's om hen toe te voegen
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-baloo tracking-widest text-deep-purple bg-white px-6 py-2 rounded-xl shadow-sm border border-gray-100">
                {schoolCode}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border-2 border-gray-200 hover:border-grass-green rounded-xl text-sm font-semibold text-gray-600 hover:text-grass-green transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-grass-green" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Gekopieerd!' : 'Kopieer'}
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-3">
              Collega's voeren deze code in bij het aanmaken van hun account.
            </p>
          </div>
        )}

        <div className="space-y-6 mb-8">
          <div className="bg-gradient-to-br from-lavender/10 to-sky-blue/10 rounded-2xl p-6">
            <h3 className="text-xl font-baloo text-deep-purple mb-3">
              Optie 1: Maak snel een klas aan
            </h3>
            <p className="text-gray-600 mb-4">
              Begin direct met het aanmaken van je eerste kleuterklas hier in de app.
            </p>
            <button
              onClick={handleCreateGroup}
              className="w-full bg-gradient-to-r from-grass-green to-[#B5F0BE] text-white px-6 py-4 rounded-2xl font-baloo text-lg shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Maak Eerste Klas Aan
            </button>
          </div>

          <div className="bg-gradient-to-br from-cream to-white rounded-2xl p-6 border-2 border-gray-200">
            <h3 className="text-xl font-baloo text-deep-purple mb-3">
              Optie 2: Beheer je school volledig
            </h3>
            <p className="text-gray-600 mb-4">
              Voor uitgebreid schoolbeheer, meerdere klassen, collega's toevoegen en meer, ga naar het volledige beheerportaal.
            </p>
            <a
              href="https://bijleer.school"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gradient-to-r from-deep-purple to-[#9B9EFF] text-white px-6 py-4 rounded-2xl font-baloo text-lg shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Ga naar bijleer.school
            </a>
            <p className="text-sm text-gray-500 mt-3 text-center">
              Log in met dezelfde inloggegevens die je hier gebruikt
            </p>
          </div>
        </div>

        <div className="bg-sky-blue/10 rounded-2xl p-4 border border-sky-blue/30">
          <p className="text-sm text-gray-600 text-center">
            <strong className="text-deep-purple">Tip:</strong> Als je collega's al klassen hebben aangemaakt, neem dan contact met hen op om toegang te krijgen.
          </p>
        </div>
      </div>
    </Modal>
  );
}
