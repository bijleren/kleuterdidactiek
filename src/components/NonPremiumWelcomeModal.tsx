import { X, MessageSquare, Rocket } from 'lucide-react';

interface NonPremiumWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback: () => void;
}

export default function NonPremiumWelcomeModal({ isOpen, onClose, onOpenFeedback }: NonPremiumWelcomeModalProps) {
  if (!isOpen) return null;

  const handleFeedback = () => {
    onClose();
    onOpenFeedback();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-deep-purple to-[#9B9EFF] px-6 py-5 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-baloo text-white">Welkom bij KleuterWijs!</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Video */}
          <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-video w-full">
            <iframe
              className="w-full h-full"
              src="https://player.vimeo.com/video/1202752400?h=8d6bf8c7fe&badge=0&autopause=0&player_id=0&app_id=58479"
              title="KleuterWijs introductievideo"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Welcome message */}
          <p className="text-gray-800 text-base leading-relaxed">
            Fijn dat je er bent! Je bent van harte welkom om rond te kijken en alles uit te proberen.
          </p>

          {/* Feedback nudge */}
          <p className="text-gray-700 text-base leading-relaxed">
            Heb je vragen, ideeën of feedback? Klik op de{' '}
            <strong className="text-deep-purple">feedbackknop</strong> en we nemen zo snel mogelijk contact
            met je op.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={handleFeedback}
              className="flex items-center justify-center gap-2 flex-1 border-2 border-deep-purple text-deep-purple px-5 py-3 rounded-xl font-semibold text-sm hover:bg-deep-purple/5 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Feedback geven
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-deep-purple text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-md hover:scale-105 transition-transform"
            >
              Aan de slag!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
